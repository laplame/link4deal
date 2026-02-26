const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const Promotion = require('../models/Promotion');
const Influencer = require('../models/Influencer');
const DiscountQrToken = require('../models/DiscountQrToken');
const {
    createReferenceQrToken,
    verifyReferenceQrToken,
    verifyAndDecodeQrToken,
    getQrMetaConfig
} = require('../utils/qrCrypto');

const router = express.Router();
const STRICT_CREATE_VALIDATION = process.env.QR_STRICT_CREATE_VALIDATION === 'true';

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

async function validateBusinessRules(payload) {
    const errors = [];

    // Validar promoción activa y vigente
    if (!isValidObjectId(payload.promotionId)) {
        errors.push('promotionId inválido');
    } else {
        const promotion = await Promotion.findById(payload.promotionId).lean();
        if (!promotion) {
            errors.push('Promoción no encontrada');
        } else {
            const now = new Date();
            if (promotion.status !== 'active') {
                errors.push('Promoción no activa');
            }
            if (promotion.validFrom && new Date(promotion.validFrom) > now) {
                errors.push('Promoción aún no vigente');
            }
            if (promotion.validUntil && new Date(promotion.validUntil) < now) {
                errors.push('Promoción expirada');
            }
        }
    }

    // Validar influencer si se envía como ObjectId
    if (payload.influencerId && isValidObjectId(payload.influencerId)) {
        const influencer = await Influencer.findById(payload.influencerId).lean();
        if (!influencer) {
            errors.push('Influencer no encontrado');
        }
    }

    // Validar descuento básico
    if (Number(payload.discountPercentage) < 0 || Number(payload.discountPercentage) > 100) {
        errors.push('discountPercentage fuera de rango (0-100)');
    }

    return errors;
}

// POST /api/discount-qr/create
router.post('/create', async (req, res) => {
    try {
        const {
            deviceId,
            influencerId,
            promotionId,
            referralCode,
            discountPercentage,
            walletAddress
        } = req.body || {};

        if (!deviceId || !influencerId || !promotionId || !referralCode || !walletAddress) {
            return res.status(400).json({
                ok: false,
                message: 'Missing required fields'
            });
        }

        const payloadInput = {
            deviceId: String(deviceId),
            influencerId: String(influencerId),
            promotionId: String(promotionId),
            referralCode: String(referralCode),
            discountPercentage: Number(discountPercentage || 0),
            walletAddress: String(walletAddress)
        };

        const businessErrors = await validateBusinessRules(payloadInput);
        if (businessErrors.length > 0 && STRICT_CREATE_VALIDATION) {
            return res.status(400).json({
                ok: false,
                message: 'Validación de negocio fallida',
                errors: businessErrors
            });
        }

        const { prefix, version, ttlSeconds } = getQrMetaConfig();
        const tokenId = crypto.randomBytes(9).toString('base64url');
        const expiresAt = new Date(Date.now() + (ttlSeconds * 1000));

        await DiscountQrToken.create({
            tokenId,
            payload: payloadInput,
            expiresAt,
            usedAt: null
        });

        const qrValue = createReferenceQrToken(tokenId);

        return res.json({
            ok: true,
            qrValue,
            prefix,
            version,
            ttlSeconds,
            businessWarnings: businessErrors
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: error.message || 'Error creating discount QR'
        });
    }
});

// POST /api/discount-qr/verify (lector/scanner)
router.post('/verify', async (req, res) => {
    try {
        const token = req.body?.qrValue || req.body?.token;
        if (!token) {
            return res.status(400).json({
                ok: false,
                message: 'qrValue/token requerido'
            });
        }

        let payload = null;
        let tokenDoc = null;

        // Modo recomendado: token por referencia (4 partes)
        try {
            const ref = verifyReferenceQrToken(String(token));
            tokenDoc = await DiscountQrToken.findOne({ tokenId: ref.tokenId });
            if (!tokenDoc) {
                throw new Error('QR reference no encontrado');
            }
            if (tokenDoc.expiresAt && tokenDoc.expiresAt.getTime() < Date.now()) {
                throw new Error('QR expired');
            }
            payload = tokenDoc.payload;
            tokenDoc.lastVerifiedAt = new Date();
            await tokenDoc.save();
        } catch (referenceError) {
            // Compatibilidad con formato anterior cifrado (7 partes)
            payload = verifyAndDecodeQrToken(String(token));
        }

        const businessErrors = await validateBusinessRules(payload);

        if (businessErrors.length > 0) {
            return res.status(400).json({
                ok: false,
                message: 'QR válido criptográficamente, pero inválido por negocio',
                errors: businessErrors,
                payload
            });
        }

        const tokenId = tokenDoc ? tokenDoc.tokenId : (payload && payload.jti) || null;
        return res.json({
            ok: true,
            message: 'QR válido',
            couponId: tokenId,
            payload,
            redemption: tokenDoc
                ? {
                    redeemable: !tokenDoc.usedAt,
                    usedAt: tokenDoc.usedAt || null
                }
                : {
                    redeemable: false,
                    usedAt: null,
                    legacyToken: true
                }
        });
    } catch (error) {
        return res.status(400).json({
            ok: false,
            message: error.message || 'QR inválido'
        });
    }
});

// POST /api/discount-qr/redeem (one-time redemption)
router.post('/redeem', async (req, res) => {
    try {
        const token = req.body?.qrValue || req.body?.token;
        const readerId = req.body?.readerId ? String(req.body.readerId) : '';
        const readerDeviceId = req.body?.readerDeviceId ? String(req.body.readerDeviceId) : '';
        const note = req.body?.note ? String(req.body.note) : '';

        if (!token) {
            return res.status(400).json({
                ok: false,
                message: 'qrValue/token requerido'
            });
        }

        // Solo aplica one-time para formato referencia corto
        const ref = verifyReferenceQrToken(String(token));
        const now = new Date();

        // Redención atómica: solo si no se ha usado y no está expirado
        const redeemed = await DiscountQrToken.findOneAndUpdate(
            {
                tokenId: ref.tokenId,
                $or: [{ usedAt: null }, { usedAt: { $exists: false } }],
                expiresAt: { $gt: now }
            },
            {
                $set: {
                    usedAt: now,
                    lastVerifiedAt: now,
                    redeemedBy: {
                        readerId,
                        readerDeviceId,
                        note
                    }
                }
            },
            { new: true }
        );

        if (!redeemed) {
            const existing = await DiscountQrToken.findOne({ tokenId: ref.tokenId }).lean();
            if (!existing) {
                return res.status(404).json({
                    ok: false,
                    message: 'QR reference no encontrado'
                });
            }
            if (existing.expiresAt && new Date(existing.expiresAt).getTime() <= now.getTime()) {
                return res.status(400).json({
                    ok: false,
                    message: 'QR expired'
                });
            }
            if (existing.usedAt) {
                return res.status(409).json({
                    ok: false,
                    message: 'QR ya redimido',
                    usedAt: existing.usedAt
                });
            }
            return res.status(400).json({
                ok: false,
                message: 'No se pudo redimir el QR'
            });
        }

        const businessErrors = await validateBusinessRules(redeemed.payload);
        if (businessErrors.length > 0) {
            return res.status(400).json({
                ok: false,
                message: 'QR redimido, pero inválido por negocio',
                errors: businessErrors,
                payload: redeemed.payload
            });
        }

        return res.json({
            ok: true,
            message: 'QR redimido exitosamente',
            couponId: redeemed.tokenId,
            payload: redeemed.payload,
            usedAt: redeemed.usedAt
        });
    } catch (error) {
        return res.status(400).json({
            ok: false,
            message: error.message || 'QR inválido'
        });
    }
});

module.exports = router;
