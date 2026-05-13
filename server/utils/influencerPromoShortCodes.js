'use strict';

const crypto = require('crypto');
const mongoose = require('mongoose');
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
        const [clashPromo, clashProfile] = await Promise.all([
            InfluencerPromoShortCode.findOne({ code: c }).select('_id').lean(),
            Influencer.findOne({ profileShortCode: c }).select('_id').lean(),
        ]);
        if (!clashPromo && !clashProfile) return c;
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
 * Asigna profileShortCode si el influencer no lo tiene (alta o influencers antiguos).
 * @param {string} influencerIdStr
 * @returns {Promise<string|null>} código en mayúsculas o null
 */
async function ensureInfluencerHasProfileShortCode(influencerIdStr) {
    if (!(await mongoReady())) return null;
    const id = String(influencerIdStr || '').trim();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const inf = await Influencer.findById(id).select('username profileShortCode').lean();
    if (!inf || inf.username === INFLUENCER_GENERAL_USERNAME) return null;

    const existing = inf.profileShortCode && String(inf.profileShortCode).trim();
    if (existing) {
        return String(existing)
            .toUpperCase()
            .replace(/[^0-9A-Z]/g, '');
    }

    for (let attempt = 0; attempt < 20; attempt++) {
        const code = await generateUniqueRandomCode(8);
        const updated = await Influencer.findOneAndUpdate(
            {
                _id: id,
                $or: [{ profileShortCode: { $exists: false } }, { profileShortCode: null }, { profileShortCode: '' }],
            },
            { $set: { profileShortCode: code } },
            { new: true },
        )
            .select('profileShortCode')
            .lean();
        if (updated?.profileShortCode) {
            return String(updated.profileShortCode)
                .toUpperCase()
                .replace(/[^0-9A-Z]/g, '');
        }
        const again = await Influencer.findById(id).select('profileShortCode').lean();
        if (again?.profileShortCode) {
            return String(again.profileShortCode)
                .toUpperCase()
                .replace(/[^0-9A-Z]/g, '');
        }
    }
    return null;
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
    if (doc) {
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

    /** Código de perfil del influencer + promoción por defecto (mismo buscador app que códigos promo). */
    const defPid = String(process.env.INFLUENCER_PROFILE_SHORT_CODE_DEFAULT_PROMOTION_ID || '').trim();
    if (mongoose.Types.ObjectId.isValid(defPid)) {
        const infProfile = await Influencer.findOne({ profileShortCode: normalizedCode })
            .select('name username avatar categories status _id')
            .lean();
        if (infProfile && infProfile.username !== INFLUENCER_GENERAL_USERNAME) {
            const promo = await Promotion.findById(defPid)
                .select(
                    'title brand description currentPrice originalPrice currency discountPercentage status validFrom validUntil image redirectInsteadOfQr'
                )
                .lean();
            if (promo) {
                const syntheticDoc = {
                    code: normalizedCode,
                    influencer: infProfile._id,
                    promotion: promo._id,
                    label: 'Código de perfil',
                    referralPrefix: 'L4D',
                    active: true,
                    expiresAt: null,
                };
                return { doc: syntheticDoc, influencer: infProfile, promotion: promo };
            }
        }
    }

    return null;
}

function serializeResolvePayload(normCode, resolved) {
    const { doc, influencer, promotion } = resolved;
    const pid = promotion && promotion._id ? String(promotion._id) : String(doc.promotion);
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
            ? serializePromotionCatalogFields(promotion, discountSuggested)
            : null,
        flags: {
            influencerMissingInDb: !influencer,
            promotionMissingInDb: !promotion,
            blockedSystemInfluencer: Boolean(blocked),
        },
    };
}

const PROMOTION_CATALOG_SELECT =
    'title brand description currentPrice originalPrice currency discountPercentage status validFrom validUntil image redirectInsteadOfQr';

/**
 * Objeto `promotion` alineado con GET /codes/:code (lista / catálogo).
 * @param {object|null} promotion
 * @param {number|null} [discountSuggested] — si ya calculaste `computeDiscountPctFromPromotion`
 */
function serializePromotionCatalogFields(promotion, discountSuggested = null) {
    if (!promotion || !promotion._id) return null;
    const pid = String(promotion._id);
    const suggested =
        discountSuggested !== null && discountSuggested !== undefined
            ? discountSuggested
            : computeDiscountPctFromPromotion(promotion);
    return {
        id: pid,
        title: promotion.title || null,
        brand: promotion.brand || null,
        description: promotion.description || null,
        currentPrice: promotion.currentPrice,
        originalPrice: promotion.originalPrice,
        currency: promotion.currency || 'MXN',
        discountPercentage: promotion.discountPercentage,
        discountPercentageSuggested: suggested,
        status: promotion.status || null,
        validFrom: promotion.validFrom ? new Date(promotion.validFrom).toISOString() : null,
        validUntil: promotion.validUntil ? new Date(promotion.validUntil).toISOString() : null,
        image: promotion.image || null,
        redirectInsteadOfQr: Boolean(promotion.redirectInsteadOfQr),
    };
}

/**
 * Convierte una fila `InfluencerPromoShortCode` (o doc sintético con `code` + `promotion`) en entrada de catálogo.
 * @param {object} d — lean con `code`, `label`, `referralPrefix`, `expiresAt`, `promotion` poblado o embebido
 * @param {object} influencer — lean con `username`
 */
function mapRowToCatalogEntry(d, influencer) {
    const p = d.promotion;
    const discountSuggested = computeDiscountPctFromPromotion(p);
    const redirectInsteadOfQr = Boolean(p?.redirectInsteadOfQr);
    const blocked = influencer.username === INFLUENCER_GENERAL_USERNAME;
    /** @type {'qr'|'redirect'|'blocked'} */
    let issueMode = 'qr';
    if (blocked) issueMode = 'blocked';
    else if (redirectInsteadOfQr) issueMode = 'redirect';
    const pid = p && p._id ? String(p._id) : null;
    return {
        shortCode: d.code,
        label: (d.label && String(d.label).trim()) || null,
        referralPrefix: d.referralPrefix || 'L4D',
        expiresAt: d.expiresAt ? new Date(d.expiresAt).toISOString() : null,
        canIssueCoupon: issueMode !== 'blocked' && Boolean(pid),
        issueMode,
        promotion: serializePromotionCatalogFields(p, discountSuggested),
        flags: {
            promotionMissingInDb: !p || !p._id,
            blockedSystemInfluencer: Boolean(blocked),
        },
    };
}

/**
 * Añade fila sintética «código de perfil + promoción por defecto» si aplica env y no está ya cubierta.
 * @param {object} influencer — lean
 * @param {Array<object>} entries — mutado in-place (unshift)
 * @param {'promo_short_code'|'profile_short_code'} resolvedVia
 * @param {string} lookupCode — código normalizado que escribió el usuario
 */
async function maybePrependDefaultProfilePromotionEntry(influencer, entries, resolvedVia, lookupCode) {
    const defPid = String(process.env.INFLUENCER_PROFILE_SHORT_CODE_DEFAULT_PROMOTION_ID || '').trim();
    if (!mongoose.Types.ObjectId.isValid(defPid)) return;
    if (entries.some((e) => e.promotion && e.promotion.id === defPid)) return;

    const promo = await Promotion.findById(defPid).select(PROMOTION_CATALOG_SELECT).lean();
    if (!promo) return;

    let catalogCode = null;
    if (resolvedVia === 'profile_short_code') {
        catalogCode = lookupCode;
    } else {
        catalogCode = normalizeIncomingCode(influencer.profileShortCode);
    }
    if (!catalogCode) return;
    if (entries.some((e) => e.shortCode === catalogCode)) return;

    const syntheticDoc = {
        code: catalogCode,
        label: 'Código de perfil',
        referralPrefix: 'L4D',
        expiresAt: null,
        promotion: promo,
    };
    entries.unshift(mapRowToCatalogEntry(syntheticDoc, influencer));
}

/**
 * Catálogo de promociones con código corto por influencer: acepta un código de campaña activo
 * o el código corto de perfil (`profileShortCode`).
 *
 * @param {string} normalizedCode — resultado de `normalizeIncomingCode`
 * @returns {Promise<null | object>}
 */
async function getInfluencerPromotionsCatalogByShortCode(normalizedCode) {
    if (!normalizedCode || !(await mongoReady())) return null;

    const now = new Date();
    const promoRow = await InfluencerPromoShortCode.findOne({
        code: normalizedCode,
        active: true,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    }).lean();

    let influencer;
    /** @type {'promo_short_code'|'profile_short_code'} */
    let resolvedVia;

    if (promoRow) {
        influencer = await Influencer.findById(promoRow.influencer)
            .select('name username avatar categories status profileShortCode')
            .lean();
        if (!influencer || influencer.username === INFLUENCER_GENERAL_USERNAME) return null;
        resolvedVia = 'promo_short_code';
    } else {
        influencer = await Influencer.findOne({ profileShortCode: normalizedCode })
            .select('name username avatar categories status profileShortCode')
            .lean();
        if (!influencer || influencer.username === INFLUENCER_GENERAL_USERNAME) return null;
        resolvedVia = 'profile_short_code';
    }

    const infId = influencer._id;
    const rows = await InfluencerPromoShortCode.find({
        influencer: infId,
        active: true,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    })
        .populate('promotion', PROMOTION_CATALOG_SELECT)
        .sort({ code: 1 })
        .lean();

    const entries = rows.map((d) => mapRowToCatalogEntry(d, influencer));
    await maybePrependDefaultProfilePromotionEntry(influencer, entries, resolvedVia, normalizedCode);

    return {
        ok: true,
        lookupCode: normalizedCode,
        resolvedVia,
        influencer: {
            id: String(infId),
            name: influencer.name || null,
            username: influencer.username || null,
            avatar: influencer.avatar || null,
        },
        influencerProfileShortCode: influencer.profileShortCode
            ? String(influencer.profileShortCode).trim().toUpperCase() || null
            : null,
        entries,
        total: entries.length,
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

    const [clash, clashProfile] = await Promise.all([
        InfluencerPromoShortCode.findOne({ code }).select('_id').lean(),
        Influencer.findOne({ profileShortCode: code }).select('_id').lean(),
    ]);
    if (clash || clashProfile) {
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
    ensureInfluencerHasProfileShortCode,
    computeDiscountPctFromPromotion,
    resolveActiveNormalizedCode,
    serializeResolvePayload,
    createRegistryEntry,
    isValidAlphabetPiece,
    getInfluencerPromotionsCatalogByShortCode,
};
