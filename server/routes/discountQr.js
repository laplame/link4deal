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

/** Códigos y mensajes de error para la app (unificados) */
const ERROR_CODES = {
    PROMO_NOT_FOR_SHOP: 'La promoción existe pero no está habilitada para esta tienda.',
    PROMO_NOT_FOR_PRODUCT: 'La promoción existe pero no aplica para este producto.',
    PROMO_NOT_UNDER_TERMS: 'La promoción existe pero no aplica bajo estos términos.',
    PROMO_ONE_PER_PERSON: 'La promoción solo permite un producto por persona.',
    PROMO_INACTIVE: 'La promoción no está activa.',
    PROMO_EXPIRED: 'La promoción ha expirado.',
    PROMO_NOT_FOUND: 'Promoción no encontrada.',
    QR_INVALID: 'Código QR inválido o expirado.',
    QR_ALREADY_REDEEMED: 'Este cupón ya fue redimido.'
};

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

/**
 * Valida reglas de negocio del cupón. Opcionalmente recibe shopId/productId para validar tienda/producto.
 * @param {object} payload - payload del token (promotionId, etc.)
 * @param {object} context - opcional: { shopId, productId } para validar si aplica a esa tienda/producto
 * @returns {Promise<Array<{code: string, message: string}>>}
 */
async function validateBusinessRules(payload, context = {}) {
    const errors = [];
    const { shopId: requestShopId, productId: requestProductId } = context;

    if (!isValidObjectId(payload.promotionId)) {
        errors.push({ code: 'QR_INVALID', message: ERROR_CODES.QR_INVALID });
        return errors;
    }

    const promotion = await Promotion.findById(payload.promotionId).lean();
    if (!promotion) {
        errors.push({ code: 'PROMO_NOT_FOUND', message: ERROR_CODES.PROMO_NOT_FOUND });
        return errors;
    }

    const now = new Date();

    if (promotion.status !== 'active') {
        errors.push({ code: 'PROMO_INACTIVE', message: ERROR_CODES.PROMO_INACTIVE });
    }
    if (promotion.validFrom && new Date(promotion.validFrom) > now) {
        errors.push({ code: 'PROMO_NOT_UNDER_TERMS', message: ERROR_CODES.PROMO_NOT_UNDER_TERMS });
    }
    if (promotion.validUntil && new Date(promotion.validUntil) < now) {
        errors.push({ code: 'PROMO_EXPIRED', message: ERROR_CODES.PROMO_EXPIRED });
    }

    if (requestShopId && promotion.allowedShopIds && promotion.allowedShopIds.length > 0) {
        const allowed = promotion.allowedShopIds.map(String);
        if (!allowed.includes(String(requestShopId))) {
            errors.push({ code: 'PROMO_NOT_FOR_SHOP', message: ERROR_CODES.PROMO_NOT_FOR_SHOP });
        }
    }
    if (requestProductId && promotion.allowedProductIds && promotion.allowedProductIds.length > 0) {
        const allowed = promotion.allowedProductIds.map(String);
        if (!allowed.includes(String(requestProductId))) {
            errors.push({ code: 'PROMO_NOT_FOR_PRODUCT', message: ERROR_CODES.PROMO_NOT_FOR_PRODUCT });
        }
    }

    if (payload.influencerId && isValidObjectId(payload.influencerId)) {
        const influencer = await Influencer.findById(payload.influencerId).lean();
        if (!influencer) {
            errors.push({ code: 'QR_INVALID', message: ERROR_CODES.QR_INVALID });
        }
    }

    if (Number(payload.discountPercentage) < 0 || Number(payload.discountPercentage) > 100) {
        errors.push({ code: 'PROMO_NOT_UNDER_TERMS', message: ERROR_CODES.PROMO_NOT_UNDER_TERMS });
    }

    return errors;
}

/**
 * Lógica compartida para crear un cupón QR. Usada por POST y GET /create.
 * @param {object} payloadInput - { deviceId, influencerId, promotionId, referralCode, discountPercentage, walletAddress }
 * @returns {Promise<{ qrValue, prefix, version, ttlSeconds, businessWarnings }>}
 */
async function createCouponToken(payloadInput) {
    const businessErrors = await validateBusinessRules(payloadInput);
    if (businessErrors.length > 0 && STRICT_CREATE_VALIDATION) {
        const first = businessErrors[0];
        const err = new Error(first.message);
        err.code = first.code;
        err.errors = businessErrors;
        throw err;
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

    const qrValue = createReferenceQrToken(tokenId, payloadInput.discountPercentage);
    return { qrValue, prefix, version, ttlSeconds, businessWarnings: businessErrors };
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

        const result = await createCouponToken(payloadInput);
        return res.json({
            ok: true,
            ...result
        });
    } catch (error) {
        if (error.code && error.errors) {
            return res.status(400).json({
                ok: false,
                errorCode: error.code,
                message: error.message,
                errors: error.errors
            });
        }
        return res.status(500).json({
            ok: false,
            message: error.message || 'Error creating discount QR'
        });
    }
});

// GET /api/discount-qr/create — Pedir cupón por query (p. ej. desde app o enlace)
// Parámetros: deviceId, influencerId, promotionId, referralCode, discountPercentage (opcional, default 0), walletAddress (opcional, default "not-provided")
router.get('/create', async (req, res) => {
    try {
        const {
            deviceId,
            influencerId,
            promotionId,
            referralCode,
            discountPercentage,
            walletAddress
        } = req.query || {};

        if (!deviceId || !influencerId || !promotionId || !referralCode) {
            return res.status(400).json({
                ok: false,
                message: 'Missing required query params: deviceId, influencerId, promotionId, referralCode'
            });
        }

        const payloadInput = {
            deviceId: String(deviceId),
            influencerId: String(influencerId),
            promotionId: String(promotionId),
            referralCode: String(referralCode),
            discountPercentage: Number(discountPercentage || 0),
            walletAddress: String(walletAddress || 'not-provided')
        };

        const result = await createCouponToken(payloadInput);
        return res.json({
            ok: true,
            ...result
        });
    } catch (error) {
        if (error.code && error.errors) {
            return res.status(400).json({
                ok: false,
                errorCode: error.code,
                message: error.message,
                errors: error.errors
            });
        }
        return res.status(500).json({
            ok: false,
            message: error.message || 'Error creating discount QR'
        });
    }
});

async function runVerify(token, context = {}) {
    const ref = verifyReferenceQrToken(String(token));
    const tokenDoc = await DiscountQrToken.findOne({ tokenId: ref.tokenId });
    if (!tokenDoc) {
        const err = new Error(ERROR_CODES.QR_INVALID);
        err.code = 'QR_INVALID';
        throw err;
    }
    if (tokenDoc.expiresAt && tokenDoc.expiresAt.getTime() < Date.now()) {
        const err = new Error(ERROR_CODES.PROMO_EXPIRED);
        err.code = 'PROMO_EXPIRED';
        throw err;
    }
    const payload = tokenDoc.payload;
    tokenDoc.lastVerifiedAt = new Date();
    await tokenDoc.save();

    const businessErrors = await validateBusinessRules(payload, context);
    if (businessErrors.length > 0) {
        const first = businessErrors[0];
        const err = new Error(first.message);
        err.status = 400;
        err.code = first.code;
        err.errors = businessErrors;
        err.payload = payload;
        throw err;
    }

    const tokenId = tokenDoc.tokenId;
    return {
        ok: true,
        message: 'QR válido',
        couponId: tokenId,
        payload,
        redemption: {
            redeemable: !tokenDoc.usedAt,
            usedAt: tokenDoc.usedAt || null
        }
    };
}

// GET /api/discount-qr/verify?qrValue=<token>&shopId=...&productId=... — ver el JSON del cupón
router.get('/verify', async (req, res) => {
    try {
        const token = req.query?.qrValue || req.query?.token;
        if (!token) {
            return res.status(400).json({
                ok: false,
                errorCode: 'QR_INVALID',
                message: ERROR_CODES.QR_INVALID
            });
        }
        const context = {
            shopId: req.query.shopId || null,
            productId: req.query.productId || null
        };
        const result = await runVerify(token, context);
        return res.json(result);
    } catch (error) {
        const code = error.code || 'QR_INVALID';
        if (error.status === 400 && error.errors) {
            return res.status(400).json({
                ok: false,
                errorCode: code,
                message: error.message,
                errors: error.errors,
                payload: error.payload
            });
        }
        return res.status(400).json({
            ok: false,
            errorCode: code,
            message: error.message || ERROR_CODES.QR_INVALID
        });
    }
});

// POST /api/discount-qr/verify (lector/scanner). Opcional: body.shopId, body.productId para validar tienda/producto.
router.post('/verify', async (req, res) => {
    try {
        const token = req.body?.qrValue || req.body?.token;
        if (!token) {
            return res.status(400).json({
                ok: false,
                errorCode: 'QR_INVALID',
                message: 'qrValue/token requerido'
            });
        }

        const context = {
            shopId: req.body.shopId || null,
            productId: req.body.productId || null
        };

        let payload = null;
        let tokenDoc = null;

        try {
            const ref = verifyReferenceQrToken(String(token));
            tokenDoc = await DiscountQrToken.findOne({ tokenId: ref.tokenId });
            if (!tokenDoc) {
                return res.status(400).json({
                    ok: false,
                    errorCode: 'QR_INVALID',
                    message: ERROR_CODES.QR_INVALID
                });
            }
            if (tokenDoc.expiresAt && tokenDoc.expiresAt.getTime() < Date.now()) {
                return res.status(400).json({
                    ok: false,
                    errorCode: 'PROMO_EXPIRED',
                    message: ERROR_CODES.PROMO_EXPIRED
                });
            }
            payload = tokenDoc.payload;
            tokenDoc.lastVerifiedAt = new Date();
            await tokenDoc.save();
        } catch (referenceError) {
            try {
                payload = verifyAndDecodeQrToken(String(token));
            } catch {
                return res.status(400).json({
                    ok: false,
                    errorCode: 'QR_INVALID',
                    message: ERROR_CODES.QR_INVALID
                });
            }
        }

        const businessErrors = await validateBusinessRules(payload, context);
        if (businessErrors.length > 0) {
            const first = businessErrors[0];
            return res.status(400).json({
                ok: false,
                errorCode: first.code,
                message: first.message,
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
            errorCode: error.code || 'QR_INVALID',
            message: error.message || ERROR_CODES.QR_INVALID
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
                    errorCode: 'QR_INVALID',
                    message: ERROR_CODES.QR_INVALID
                });
            }
            if (existing.expiresAt && new Date(existing.expiresAt).getTime() <= now.getTime()) {
                return res.status(400).json({
                    ok: false,
                    errorCode: 'PROMO_EXPIRED',
                    message: ERROR_CODES.PROMO_EXPIRED
                });
            }
            if (existing.usedAt) {
                return res.status(409).json({
                    ok: false,
                    errorCode: 'QR_ALREADY_REDEEMED',
                    message: ERROR_CODES.QR_ALREADY_REDEEMED,
                    usedAt: existing.usedAt
                });
            }
            return res.status(400).json({
                ok: false,
                errorCode: 'QR_INVALID',
                message: ERROR_CODES.QR_INVALID
            });
        }

        const context = {
            shopId: req.body.shopId || null,
            productId: req.body.productId || null
        };
        const businessErrors = await validateBusinessRules(redeemed.payload, context);
        if (businessErrors.length > 0) {
            const first = businessErrors[0];
            return res.status(400).json({
                ok: false,
                errorCode: first.code,
                message: first.message,
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
            errorCode: 'QR_INVALID',
            message: error.message || ERROR_CODES.QR_INVALID
        });
    }
});

module.exports = router;
