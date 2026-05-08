'use strict';

const crypto = require('crypto');
const InfluencerPromoShortCode = require('../models/InfluencerPromoShortCode');
const Influencer = require('../models/Influencer');
const Promotion = require('../models/Promotion');

/** Alfabeto corto tipo Crockford (sin O/0/I/1 ambiguos con lenidad visual). */
const SHORT_CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/** Usuario sistema (no debe tener códigos de campaña públicos desde aquí). */
const INFLUENCER_GENERAL_USERNAME = 'influencer-general';

function normalizeIncomingCode(raw) {
    const s =
        raw != null
            ? String(raw)
                  .trim()
                  .toUpperCase()
                  .replace(/[\s_-]+/g, '')
            : '';
    /** Permite entrada alfanumérica legible */
    const cleaned = s.replace(/[^0-9A-Z]/g, '');
    return cleaned.length >= 6 && cleaned.length <= 16 ? cleaned : '';
}

function isValidAlphabetPiece(s, maxLen = 12) {
    if (!s || typeof s !== 'string') return false;
    const u = String(s).toUpperCase().trim();
    if (u.length < 6 || u.length > maxLen) return false;
    return [...u].every((c) => SHORT_CODE_CHARS.includes(c));
}

/**
 * Cupón rápido: genera código único aleatorio de `length` caracteres.
 */
function randomCode(length = 8) {
    let out = '';
    for (let i = 0; i < length; i++) {
        out += SHORT_CODE_CHARS[crypto.randomInt(0, SHORT_CODE_CHARS.length)];
    }
    return out;
}

/**
 * @returns {Promise<string>}
 */
async function generateUniqueRandomCode(length = 8, maxRetries = 12) {
    for (let r = 0; r < maxRetries; r++) {
        const c = randomCode(length);
        const clash = await InfluencerPromoShortCode.findOne({ code: c }).select('_id').lean();
        if (!clash) return c;
    }
    /** largo temporal si hay colisión alta */
    return generateUniqueRandomCode(length + 1, Math.max(1, maxRetries - 2));
}

function computeDiscountPctFromPromotion(promo) {
    if (!promo) return 0;
    const pct = promo.discountPercentage;
    if (pct != null && Number.isFinite(Number(pct)) && Number(pct) > 0) {
        return Math.min(100, Math.round(Number(pct)));
    }
    const orig = Number(promo.originalPrice) || 0;
    const cur = Number(promo.currentPrice) || 0;
    if (orig > 0 && cur >= 0 && cur <= orig) {
        return Math.min(100, Math.round(((orig - cur) / orig) * 100));
    }
    return 0;
}

async function mongoReady() {
    return require('mongoose').connection.readyState === 1;
}

/**
 * Lookup activo por código ya normalizado.
 * @returns {Promise<null | { doc: object, influencer: object, promotion: object }>}
 */
async function resolveActiveNormalizedCode(normalizedCode) {
    if (!normalizedCode || !(await mongoReady())) return null;
    const now = new Date();
    const doc = await InfluencerPromoShortCode.findOne({
        code: normalizedCode,
        active: true,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    })
        .lean()
        .exec();
    if (!doc) return null;

    const [inf, promo] = await Promise.all([
        Influencer.findById(doc.influencer).select('name username avatar categories status').lean(),
        Promotion.findById(doc.promotion)
            .select(
                'title brand description currentPrice originalPrice currency discountPercentage status validFrom validUntil image redirectInsteadOfQr'
            )
            .lean(),
    ]);
    return { doc, influencer: inf, promotion: promo };
}

function serializeResolvePayload(normCode, resolved) {
    const { doc, influencer, promotion } = resolved;
    const pid = promo ? String(promo._id) : String(doc.promotion);
    const infId = influencer && influencer._id ? String(influencer._id) : String(doc.influencer);

    const discountSuggested = computeDiscountPctFromPromotion(promotion);

    const redirectInsteadOfQr = Boolean(promotion?.redirectInsteadOfQr);
    const blocked = influencer && influencer.username === INFLUENCER_GENERAL_USERNAME;

    /** @type {'qr'|'redirect'|'blocked'} */
    let issueMode = 'qr';
    if (blocked) issueMode = 'blocked';
    else if (redirectInsteadOfQr) issueMode = 'redirect';

    return {
        ok: true,
        code: normCode,
        influencerId: infId,
        promotionId: pid,
        label: doc.label || null,
        referralPrefix: doc.referralPrefix || 'L4D',
        canIssueCoupon: issueMode !== 'blocked' && Boolean(promotion),
        issueMode,
        influencer: influencer
            ? {
                  id: String(influencer._id),
                  name: influencer.name || null,
                  username: influencer.username || null,
                  avatar: influencer.avatar || null,
              }
            : null,
        promotion: promotion
            ? {
                  id: pid,
                  title: promotion.title || null,
                  brand: promotion.brand || null,
                  description: promotion.description || null,
                  currentPrice: promotion.currentPrice,
                  originalPrice: promotion.originalPrice,
                  currency: promotion.currency || 'MXN',
                  discountPercentage: promotion.discountPercentage,
                  discountPercentageSuggested: discountSuggested,
                  status: promotion.status || null,
                  validFrom: promotion.validFrom ? new Date(promotion.validFrom).toISOString() : null,
                  validUntil: promotion.validUntil ? new Date(promotion.validUntil).toISOString() : null,
                  image: promotion.image || null,
                  redirectInsteadOfQr: Boolean(promotion.redirectInsteadOfQr),
              }
            : null,
        flags: {
            influencerMissingInDb: !influencer,
            promotionMissingInDb: !promotion,
            blockedSystemInfluencer: Boolean(blocked),
        },
    };
}

/**
 * @param {object} params
 * @param {string} params.influencerId
 * @param {string} params.promotionId
 * @param {string} [params.code] - opcional; si falta se genera
 * @param {string} [params.label]
 * @param {string} [params.referralPrefix]
 * @param {Date} [params.expiresAt]
 */
async function createRegistryEntry(params) {
    if (!(await mongoReady())) {
        const e = new Error('Base de datos no disponible');
        e.status = 503;
        throw e;
    }
    const influencerId = String(params.influencerId || '').trim();
    const promotionId = String(params.promotionId || '').trim();
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(influencerId) || !mongoose.Types.ObjectId.isValid(promotionId)) {
        const e = new Error('influencerId o promotionId no son ObjectId válidos');
        e.status = 400;
        throw e;
    }

    const [inf, promo] = await Promise.all([
        Influencer.findById(influencerId).select('username').lean(),
        Promotion.findById(promotionId).select('_id').lean(),
    ]);
    if (!inf) {
        const e = new Error('Influencer no encontrado');
        e.status = 404;
        throw e;
    }
    if (inf.username === INFLUENCER_GENERAL_USERNAME) {
        const e = new Error('No se permiten códigos rápidos para el influencer sistema');
        e.status = 400;
        throw e;
    }
    if (!promo) {
        const e = new Error('Promoción no encontrada');
        e.status = 404;
        throw e;
    }

    let code = normalizeIncomingCode(params.code);
    if (code && !isValidAlphabetPiece(code)) {
        const e = new Error(`Código custom inválido: usar solo caracteres permitidos (${SHORT_CODE_CHARS}) y longitud 6–12`);
        e.status = 400;
        throw e;
    }
    if (!code) code = await generateUniqueRandomCode(8);

    const clash = await InfluencerPromoShortCode.findOne({ code }).select('_id').lean();
    if (clash) {
        const e = new Error('Ese código ya está en uso');
        e.status = 409;
        throw e;
    }

    const refPrefix =
        params.referralPrefix != null && String(params.referralPrefix).trim() !== ''
            ? String(params.referralPrefix).trim().slice(0, 32)
            : 'L4D';

    const row = await InfluencerPromoShortCode.create({
        code,
        influencer: influencerId,
        promotion: promotionId,
        label: params.label ? String(params.label).trim().slice(0, 200) : '',
        referralPrefix: refPrefix,
        active: params.active !== false,
        expiresAt: params.expiresAt || null,
    });

    return row.toObject();
}

module.exports = {
    SHORT_CODE_CHARS,
    normalizeIncomingCode,
    randomCode,
    generateUniqueRandomCode,
    computeDiscountPctFromPromotion,
    resolveActiveNormalizedCode,
    serializeResolvePayload,
    createRegistryEntry,
    isValidAlphabetPiece,
};
