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

/** Claves opcionales que se fusionan al payload del cupón si vienen informadas (sin validar contra BD). */
const OPTIONAL_COUPON_PAYLOAD_KEYS = [
    'brandId',
    'shopId',
    /** Id de producto en catálogo externo (opcional; distinto de promotionId). */
    'productId',
    /** Id de contenedor GTM (p. ej. GTM-XXXX) o etiqueta personalizada para analytics. */
    'gtmTag',
    'campaignId',
    'source',
    'medium'
];

function safeMetadataObject(obj) {
    try {
        const clone = JSON.parse(JSON.stringify(obj));
        if (clone === null || typeof clone !== 'object' || Array.isArray(clone)) return null;
        return clone;
    } catch {
        return null;
    }
}

/**
 * Interpreta lat/lng desde body o metadata (POS / app).
 * @param {object} source
 * @returns {{ latitude: number, longitude: number, locationAccuracyM?: number } | null}
 */
function parseLatLngFromUnknown(source) {
    if (!source || typeof source !== 'object' || Array.isArray(source)) return null;
    let lat = source.latitude ?? source.lat;
    let lng = source.longitude ?? source.lng ?? source.lon;
    let acc = source.accuracy ?? source.locationAccuracy ?? source.locationAccuracyM;
    if (lat == null || lng == null) {
        const loc = source.location;
        if (loc && typeof loc === 'object' && !Array.isArray(loc)) {
            lat = loc.latitude ?? loc.lat;
            lng = loc.longitude ?? loc.lng ?? loc.lon;
            if (acc == null) acc = loc.accuracy ?? loc.locationAccuracyM;
        }
    }
    if (lat == null || lng == null) {
        const gps = source.gps;
        if (gps && typeof gps === 'object' && !Array.isArray(gps)) {
            lat = gps.latitude ?? gps.lat;
            lng = gps.longitude ?? gps.lng ?? gps.lon;
            if (acc == null) acc = gps.accuracy ?? gps.locationAccuracyM;
        }
    }
    const la = Number(lat);
    const lo = Number(lng);
    if (!Number.isFinite(la) || !Number.isFinite(lo)) return null;
    if (la < -90 || la > 90 || lo < -180 || lo > 180) return null;
    const out = { latitude: la, longitude: lo };
    const acn = Number(acc);
    if (Number.isFinite(acn) && acn >= 0 && acn < 1e7) out.locationAccuracyM = acn;
    return out;
}

/**
 * Epoch Unix en segundos; rango razonable para timestamps actuales.
 * @param {unknown} value
 * @returns {number|null}
 */
function parseUnixSeconds(value) {
    if (value === undefined || value === null || value === '') return null;
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    const i = Math.trunc(n);
    if (i < 1_000_000_000 || i > 10_000_000_000) return null;
    return i;
}

/**
 * Valida ventana de reloj cliente vs servidor; no bloquea el canje, marca skew en documento.
 * @param {object} out - redeemedBy parcial
 * @param {object} body
 */
function attachRedeemUnixToOut(out, body) {
    const serverSec = Math.floor(Date.now() / 1000);
    const maxPast = Number(process.env.REDEEM_UNIX_MAX_DRIFT_PAST_SEC) || 300;
    const maxFuture = Number(process.env.REDEEM_UNIX_MAX_DRIFT_FUTURE_SEC) || 120;
    const pastOk = maxPast >= 0 ? maxPast : 300;
    const futOk = maxFuture >= 0 ? maxFuture : 120;

    const ru = parseUnixSeconds(body.redeemedAtUnix);
    if (ru != null) {
        out.redeemedAtUnix = ru;
        if (ru < serverSec - pastOk || ru > serverSec + futOk) {
            out.redeemedAtUnixClockSkew = true;
        }
    }

    const gf = parseUnixSeconds(body.redeemGpsFixUnix);
    if (gf != null) {
        out.redeemGpsFixUnix = gf;
    }
}

/**
 * @param {object} out
 * @returns {Date|null}
 */
function preferredUsedAtFromRedeemedBy(out) {
    if (out.redeemedAtUnix == null || out.redeemedAtUnixClockSkew) return null;
    const d = new Date(out.redeemedAtUnix * 1000);
    if (Number.isNaN(d.getTime())) return null;
    return d;
}

/**
 * @param {object} out
 * @param {number} la
 * @param {number} lo
 * @param {number} [accM]
 */
function applyRedeemGeo(out, la, lo, accM) {
    out.redeemLatitude = la;
    out.redeemLongitude = lo;
    out.redeemLocation = { type: 'Point', coordinates: [lo, la] };
    out.latitude = la;
    out.longitude = lo;
    if (accM != null && Number.isFinite(accM) && accM >= 0 && accM < 1e7) {
        out.redeemGpsAccuracyMeters = accM;
        out.locationAccuracyM = accM;
    }
}

/**
 * Rellena geo + redeemLocation desde body o metadata.
 * @param {object} out
 * @param {object} body
 */
function mergeGpsIntoRedeemedBy(out, body) {
    if (!body || typeof body !== 'object') body = {};
    const laRaw = body.redeemLatitude;
    const loRaw = body.redeemLongitude;
    if (laRaw != null && loRaw != null) {
        const la = Number(laRaw);
        const lo = Number(loRaw);
        if (Number.isFinite(la) && Number.isFinite(lo) && la >= -90 && la <= 90 && lo >= -180 && lo <= 180) {
            const accRaw = body.redeemGpsAccuracyMeters;
            const acc = accRaw != null && accRaw !== '' ? Number(accRaw) : null;
            const accOk =
                acc != null && Number.isFinite(acc) && acc >= 0 && acc < 1e7 ? acc : undefined;
            applyRedeemGeo(out, la, lo, accOk);
            return;
        }
    }
    const fromBody = parseLatLngFromUnknown(body);
    if (fromBody) {
        applyRedeemGeo(out, fromBody.latitude, fromBody.longitude, fromBody.locationAccuracyM);
        return;
    }
    if (out.metadata && typeof out.metadata === 'object') {
        const fromMeta = parseLatLngFromUnknown(out.metadata);
        if (fromMeta) {
            applyRedeemGeo(out, fromMeta.latitude, fromMeta.longitude, fromMeta.locationAccuracyM);
        }
    }
}

/**
 * Devuelve coordenadas para APIs de lectura (campos propios o solo en metadata).
 * @param {object|null} redeemedBy
 * @returns {{ latitude: number, longitude: number, locationAccuracyM?: number } | null}
 */
function extractGpsForApi(redeemedBy) {
    if (!redeemedBy || typeof redeemedBy !== 'object') return null;
    if (typeof redeemedBy.redeemLatitude === 'number' && typeof redeemedBy.redeemLongitude === 'number') {
        const o = { latitude: redeemedBy.redeemLatitude, longitude: redeemedBy.redeemLongitude };
        if (typeof redeemedBy.redeemGpsAccuracyMeters === 'number') o.locationAccuracyM = redeemedBy.redeemGpsAccuracyMeters;
        return o;
    }
    if (typeof redeemedBy.latitude === 'number' && typeof redeemedBy.longitude === 'number') {
        const o = { latitude: redeemedBy.latitude, longitude: redeemedBy.longitude };
        if (typeof redeemedBy.locationAccuracyM === 'number') o.locationAccuracyM = redeemedBy.locationAccuracyM;
        return o;
    }
    return parseLatLngFromUnknown(redeemedBy.metadata) || null;
}

/**
 * @param {object} doc - lean DiscountQrToken
 * @returns {object}
 */
function formatRedemptionRow(doc) {
    const p = doc.payload && typeof doc.payload === 'object' ? doc.payload : {};
    const r = doc.redeemedBy && typeof doc.redeemedBy === 'object' ? doc.redeemedBy : {};
    return {
        couponId: doc.tokenId,
        usedAt: doc.usedAt || null,
        promotionId: p.promotionId != null ? String(p.promotionId) : null,
        shopId: p.shopId != null ? String(p.shopId) : null,
        referralCode: p.referralCode != null ? String(p.referralCode) : null,
        discountPercentage: p.discountPercentage != null ? Number(p.discountPercentage) : null,
        payloadDeviceId: p.deviceId != null ? String(p.deviceId) : null,
        devices: {
            readerId: r.readerId || null,
            readerDeviceId: r.readerDeviceId || null,
            customerDeviceId: r.customerDeviceId || null
        },
        location: extractGpsForApi(r),
        redemptionMetadata: r.metadata && typeof r.metadata === 'object' ? r.metadata : null,
        cashier: {
            redeemedByUserId: r.redeemedByUserId || null,
            redeemedByUserName: r.redeemedByUserName || null,
            userId: r.userId || null
        },
        redeemedAtUnix: typeof r.redeemedAtUnix === 'number' ? r.redeemedAtUnix : null,
        redeemedAtUnixClockSkew: r.redeemedAtUnixClockSkew === true,
        redeemGpsFixUnix: typeof r.redeemGpsFixUnix === 'number' ? r.redeemGpsFixUnix : null,
        redeemGpsAccuracyMeters: typeof r.redeemGpsAccuracyMeters === 'number' ? r.redeemGpsAccuracyMeters : null,
        idempotencyKey: r.idempotencyKey != null && String(r.idempotencyKey).trim() !== '' ? String(r.idempotencyKey) : null,
        idempotencyShopId: r.idempotencyShopId != null ? String(r.idempotencyShopId) : null,
        idempotencyProductId: r.idempotencyProductId != null ? String(r.idempotencyProductId) : null
    };
}

/**
 * Añade campos opcionales al payload del cupón. No obliga nada; ignora vacíos y metadata inválida.
 * @param {object} basePayload - payload mínimo ya construido
 * @param {object} rawSource - req.body o objeto derivado de query
 * @returns {object}
 */
function mergeOptionalCouponFields(basePayload, rawSource) {
    const out = { ...basePayload };
    if (!rawSource || typeof rawSource !== 'object') return out;

    for (const key of OPTIONAL_COUPON_PAYLOAD_KEYS) {
        if (!Object.prototype.hasOwnProperty.call(rawSource, key)) continue;
        const v = rawSource[key];
        if (v === undefined || v === null) continue;
        const str = typeof v === 'string' ? v.trim() : String(v);
        if (str === '') continue;
        out[key] = str;
    }

    if (rawSource.metadata != null && typeof rawSource.metadata === 'object' && !Array.isArray(rawSource.metadata)) {
        const meta = safeMetadataObject(rawSource.metadata);
        if (meta && Object.keys(meta).length > 0) {
            out.metadata = meta;
        }
    }

    return out;
}

/**
 * Parsea `metadata` desde query (JSON string). Devuelve null si falla o no viene.
 * @param {string|undefined} metadataQuery
 * @returns {object|null}
 */
function parseMetadataFromQuery(metadataQuery) {
    if (metadataQuery === undefined || metadataQuery === null || metadataQuery === '') return null;
    try {
        const parsed = JSON.parse(String(metadataQuery));
        return safeMetadataObject(parsed);
    } catch {
        return null;
    }
}

/** URL por defecto para redirección a Amazon (afiliado) cuando la promoción usa redirectInsteadOfQr y no tiene redirectToUrl. */
const DEFAULT_AMAZON_AFFILIATE_URL = 'https://amzn.to/3NfsW8K';
/** Tag de afiliado Amazon para construir URLs de producto (ej. jalme-20). Se usa al combinar URL de afiliado + URL del producto. */
const AMAZON_AFFILIATE_TAG = process.env.AMAZON_AFFILIATE_TAG || 'jalme-20';

/**
 * Construye la URL de afiliado Amazon: si la URL es de Amazon, añade o reemplaza el parámetro tag con AMAZON_AFFILIATE_TAG.
 * Si redirectToUrl está vacía, devuelve la URL por defecto (amzn.to).
 * @param {string} redirectToUrl - URL del producto (ej. https://www.amazon.com.mx/dp/B0DMV3BMGP?th=1) o vacío
 * @returns {string}
 */
function buildAmazonAffiliateUrl(redirectToUrl) {
    const trimmed = (redirectToUrl && String(redirectToUrl).trim()) || '';
    if (!trimmed) return DEFAULT_AMAZON_AFFILIATE_URL;
    try {
        const u = new URL(trimmed);
        const host = (u.hostname || '').toLowerCase();
        if (host.includes('amazon') || host.includes('amzn.to')) {
            u.searchParams.set('tag', AMAZON_AFFILIATE_TAG);
            return u.toString();
        }
        return trimmed;
    } catch {
        return trimmed || DEFAULT_AMAZON_AFFILIATE_URL;
    }
}

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
    QR_ALREADY_REDEEMED: 'Este cupón ya fue redimido.',
    IDEMPOTENCY_KEY_MISMATCH: 'La misma idempotencyKey se reutiliza con shopId o productId distintos al canje original.'
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
 * Resuelve el cupón en BD por token corto firmado (qrValue) o por código alfanumérico en payload.referralCode (ej. L4D-...).
 * @param {string} raw
 * @returns {Promise<object|null>}
 */
async function findDiscountTokenDoc(raw) {
    const s = String(raw || '').trim();
    if (!s) return null;

    try {
        const ref = verifyReferenceQrToken(s);
        return await DiscountQrToken.findOne({ tokenId: ref.tokenId });
    } catch {
        // no es formato referencia corta
    }

    return DiscountQrToken.findOne({ 'payload.referralCode': s })
        .sort({ createdAt: -1 })
        .exec();
}

/**
 * Lee identificador de cupón desde body o query (móvil / POS).
 * @param {object} source
 * @returns {string}
 */
function getCouponLookupInput(source) {
    if (!source || typeof source !== 'object') return '';
    const v =
        source.qrValue ||
        source.token ||
        source.referralCode ||
        source.couponCode;
    return v != null && v !== '' ? String(v).trim() : '';
}

const IDEMPOTENCY_KEY_MAX_LEN = 256;

/**
 * Normaliza idempotencyKey del wire (UUID u otra cadena estable).
 * @param {unknown} raw
 * @returns {string|null}
 */
function normalizeIdempotencyKey(raw) {
    if (raw == null || raw === '') return null;
    const s = String(raw).trim();
    if (s.length === 0 || s.length > IDEMPOTENCY_KEY_MAX_LEN) return null;
    if (!/^[a-zA-Z0-9._\-]+$/.test(s)) return null;
    return s;
}

/**
 * @param {object} body
 * @returns {{ shopId: string, productId: string }}
 */
function buildIdempotencyFingerprint(body) {
    if (!body || typeof body !== 'object') return { shopId: '', productId: '' };
    return {
        shopId: body.shopId != null && body.shopId !== '' ? String(body.shopId).trim() : '',
        productId: body.productId != null && body.productId !== '' ? String(body.productId).trim() : ''
    };
}

/**
 * @param {object} storedRedeemedBy
 * @param {object} body
 * @returns {boolean}
 */
function idempotencyFingerprintMatches(storedRedeemedBy, body) {
    const fp = buildIdempotencyFingerprint(body);
    const sShop = storedRedeemedBy && storedRedeemedBy.idempotencyShopId != null
        ? String(storedRedeemedBy.idempotencyShopId).trim()
        : '';
    const sProd = storedRedeemedBy && storedRedeemedBy.idempotencyProductId != null
        ? String(storedRedeemedBy.idempotencyProductId).trim()
        : '';
    return sShop === fp.shopId && sProd === fp.productId;
}

/**
 * Persistencia: huella shop/product junto a la clave (replay seguro).
 * @param {object} out - redeemedBy
 * @param {object} body
 */
function attachIdempotencyFieldsToRedeemedBy(out, body) {
    const idKey = normalizeIdempotencyKey(body && body.idempotencyKey);
    if (!idKey) return;
    out.idempotencyKey = idKey;
    const fp = buildIdempotencyFingerprint(body);
    out.idempotencyShopId = fp.shopId;
    out.idempotencyProductId = fp.productId;
}

/**
 * @param {object} doc - lean o documento con tokenId, payload, usedAt, redeemedBy
 * @returns {object}
 */
function buildRedeemSuccessPayload(doc) {
    return {
        ok: true,
        message: 'QR redimido exitosamente',
        couponId: doc.tokenId,
        payload: doc.payload,
        usedAt: doc.usedAt,
        redeemedBy: doc.redeemedBy || null
    };
}

/**
 * El cupón ya está usado: replay idempotente HTTP 200 o 409.
 */
function sendRedeemResponseForUsedToken(res, existing, body, idemKeyNorm) {
    const rb = existing.redeemedBy && typeof existing.redeemedBy === 'object' ? existing.redeemedBy : {};
    if (idemKeyNorm && rb.idempotencyKey === idemKeyNorm) {
        if (idempotencyFingerprintMatches(rb, body)) {
            return res.json(buildRedeemSuccessPayload(existing));
        }
        return res.status(409).json({
            ok: false,
            errorCode: 'IDEMPOTENCY_KEY_MISMATCH',
            message: ERROR_CODES.IDEMPOTENCY_KEY_MISMATCH,
            usedAt: existing.usedAt
        });
    }
    return res.status(409).json({
        ok: false,
        errorCode: 'QR_ALREADY_REDEEMED',
        message: ERROR_CODES.QR_ALREADY_REDEEMED,
        usedAt: existing.usedAt
    });
}

/**
 * Construye objeto redeemedBy desde el body del canje (auditoría).
 * Incluye campos BizneAI: redeemedAtUnix, redeemGpsFixUnix, redeemLatitude/Longitude, userId.
 * @param {object} body
 * @returns {{ redeemedBy: object, preferredUsedAt: Date | null }}
 */
function buildRedeemedByFromBody(body) {
    if (!body || typeof body !== 'object') body = {};
    const userIdFromBody =
        body.userId != null && body.userId !== ''
            ? String(body.userId).trim().slice(0, 256)
            : '';
    const note = body.note ? String(body.note) : '';
    const readerId = body.readerId != null && body.readerId !== '' ? String(body.readerId) : '';
    const readerDeviceId = body.readerDeviceId != null && body.readerDeviceId !== ''
        ? String(body.readerDeviceId)
        : (body.posDeviceId != null && body.posDeviceId !== '' ? String(body.posDeviceId) : '');

    const redeemedByUserId =
        body.redeemedByUserId != null && body.redeemedByUserId !== ''
            ? String(body.redeemedByUserId).trim().slice(0, 256)
            : body.cashierUserId != null && body.cashierUserId !== ''
                ? String(body.cashierUserId).trim().slice(0, 256)
                : userIdFromBody;

    const redeemedByUserName =
        body.redeemedByUserName != null && body.redeemedByUserName !== ''
            ? String(body.redeemedByUserName)
            : body.cashierUserName != null && body.cashierUserName !== ''
                ? String(body.cashierUserName)
                : body.userName != null && body.userName !== ''
                    ? String(body.userName)
                    : '';

    const customerUserId = body.customerUserId != null && body.customerUserId !== '' ? String(body.customerUserId) : '';
    const customerUserName =
        body.customerUserName != null && body.customerUserName !== '' ? String(body.customerUserName) : '';
    const customerDeviceId =
        body.customerDeviceId != null && body.customerDeviceId !== ''
            ? String(body.customerDeviceId)
            : body.deviceId != null && body.deviceId !== ''
                ? String(body.deviceId)
                : '';

    let termsAccepted = false;
    if (body.termsAccepted === true || body.termsAccepted === 'true' || body.termsAccepted === 1 || body.termsAccepted === '1') {
        termsAccepted = true;
    }

    let termsAcceptedAt;
    if (body.termsAcceptedAt) {
        const d = new Date(body.termsAcceptedAt);
        if (!Number.isNaN(d.getTime())) termsAcceptedAt = d;
    } else if (termsAccepted) {
        termsAcceptedAt = new Date();
    }

    const termsSummary = body.termsSummary != null && String(body.termsSummary).trim()
        ? String(body.termsSummary).trim().slice(0, 8000)
        : (body.termsText != null && String(body.termsText).trim()
            ? String(body.termsText).trim().slice(0, 8000)
            : '');

    let metadata = null;
    if (body.redemptionMetadata != null && typeof body.redemptionMetadata === 'object' && !Array.isArray(body.redemptionMetadata)) {
        metadata = safeMetadataObject(body.redemptionMetadata);
    } else if (body.metadata != null && typeof body.metadata === 'object' && !Array.isArray(body.metadata)) {
        metadata = safeMetadataObject(body.metadata);
    }

    const out = {
        readerId,
        readerDeviceId,
        note: note.slice(0, 4000),
        redeemedByUserId: redeemedByUserId.slice(0, 256),
        redeemedByUserName: redeemedByUserName.slice(0, 256),
        customerUserId: customerUserId.slice(0, 256),
        customerUserName: customerUserName.slice(0, 256),
        customerDeviceId: customerDeviceId.slice(0, 256),
        termsAccepted,
        termsAcceptedAt: termsAcceptedAt || undefined,
        termsSummary
    };

    if (userIdFromBody) {
        out.userId = userIdFromBody;
    } else if (redeemedByUserId) {
        out.userId = redeemedByUserId.slice(0, 256);
    }

    if (metadata && Object.keys(metadata).length > 0) {
        out.metadata = metadata;
    }
    mergeGpsIntoRedeemedBy(out, body);
    attachRedeemUnixToOut(out, body);
    attachIdempotencyFieldsToRedeemedBy(out, body);
    return { redeemedBy: out, preferredUsedAt: preferredUsedAtFromRedeemedBy(out) };
}

/**
 * Si la promoción tiene redirectInsteadOfQr, devuelve { redirectToUrl, noQr: true }. Si no, null.
 * @param {string} promotionId
 * @returns {Promise<{ redirectToUrl: string, noQr: true } | null>}
 */
async function getRedirectInsteadOfQr(promotionId) {
    if (!isValidObjectId(promotionId)) return null;
    const promotion = await Promotion.findById(promotionId).select('redirectInsteadOfQr redirectToUrl').lean();
    if (!promotion || !promotion.redirectInsteadOfQr) return null;
    const url = buildAmazonAffiliateUrl(promotion.redirectToUrl);
    return { redirectToUrl: url, noQr: true };
}

/**
 * Lógica compartida para crear un cupón QR. Usada por POST y GET /create.
 * @param {object} payloadInput - Mínimo: deviceId, influencerId, promotionId, referralCode, discountPercentage, walletAddress.
 *   Opcional (se persisten si vienen): brandId, shopId, productId, gtmTag, campaignId, source, medium, metadata.
 *   `luxaesRedeemed` en payload = mismo entero que `discountPercentage` (%), y el prefijo del QR usa `-N` con ese N.
 * @returns {Promise<{ qrValue, prefix, basePrefix, version, ttlSeconds, luxaesRedeemed, businessWarnings }|{ redirectToUrl, noQr }>}
 */
async function createCouponToken(payloadInput) {
    const redirect = await getRedirectInsteadOfQr(payloadInput.promotionId);
    if (redirect) return redirect;

    const businessErrors = await validateBusinessRules(payloadInput);
    if (businessErrors.length > 0 && STRICT_CREATE_VALIDATION) {
        const first = businessErrors[0];
        const err = new Error(first.message);
        err.code = first.code;
        err.errors = businessErrors;
        throw err;
    }

    /** Mismo valor que el % de descuento del cupón (ej. 20 = 20 %); va en prefijo `-N` y en payload como luxaesRedeemed. */
    const discountPct = Math.min(100, Math.max(0, Math.round(Number(payloadInput.discountPercentage) || 0)));
    const enrichedPayload = { ...payloadInput, discountPercentage: discountPct, luxaesRedeemed: discountPct };

    const { prefix, basePrefix, version, ttlSeconds, luxaesRedeemed: luxOut } = getQrMetaConfig(discountPct);
    const tokenId = crypto.randomBytes(9).toString('base64url');
    const expiresAt = new Date(Date.now() + (ttlSeconds * 1000));

    await DiscountQrToken.create({
        tokenId,
        payload: enrichedPayload,
        expiresAt,
        usedAt: null
    });

    const qrValue = createReferenceQrToken(tokenId, discountPct);
    return {
        qrValue,
        prefix,
        basePrefix,
        version,
        ttlSeconds,
        luxaesRedeemed: luxOut,
        businessWarnings: businessErrors
    };
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

        const basePayload = {
            deviceId: String(deviceId),
            influencerId: String(influencerId),
            promotionId: String(promotionId),
            referralCode: String(referralCode),
            discountPercentage: Number(discountPercentage || 0),
            walletAddress: String(walletAddress)
        };
        const payloadInput = mergeOptionalCouponFields(basePayload, req.body || {});

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
        const q = req.query || {};
        const {
            deviceId,
            influencerId,
            promotionId,
            referralCode,
            discountPercentage,
            walletAddress,
            metadata: metadataQuery
        } = q;

        if (!deviceId || !influencerId || !promotionId || !referralCode) {
            return res.status(400).json({
                ok: false,
                message: 'Missing required query params: deviceId, influencerId, promotionId, referralCode'
            });
        }

        const metaFromQuery = parseMetadataFromQuery(metadataQuery);
        const queryExtras = { ...q };
        if (metaFromQuery && Object.keys(metaFromQuery).length > 0) {
            queryExtras.metadata = metaFromQuery;
        }

        const basePayload = {
            deviceId: String(deviceId),
            influencerId: String(influencerId),
            promotionId: String(promotionId),
            referralCode: String(referralCode),
            discountPercentage: Number(discountPercentage || 0),
            walletAddress: String(walletAddress || 'not-provided')
        };
        const payloadInput = mergeOptionalCouponFields(basePayload, queryExtras);

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

async function runVerify(tokenOrCode, context = {}) {
    const tokenDoc = await findDiscountTokenDoc(tokenOrCode);
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
// También: ?referralCode= o ?couponCode= (mismo valor que payload.referralCode, ej. L4D-...)
router.get('/verify', async (req, res) => {
    try {
        const token = getCouponLookupInput(req.query);
        if (!token) {
            return res.status(400).json({
                ok: false,
                errorCode: 'QR_INVALID',
                message: 'qrValue, token, referralCode o couponCode requerido'
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
// Body: qrValue | token | referralCode | couponCode (código alfanumérico del cupón).
router.post('/verify', async (req, res) => {
    try {
        const input = getCouponLookupInput(req.body);
        if (!input) {
            return res.status(400).json({
                ok: false,
                errorCode: 'QR_INVALID',
                message: 'qrValue, token, referralCode o couponCode requerido'
            });
        }

        const context = {
            shopId: req.body.shopId || null,
            productId: req.body.productId || null
        };

        let payload = null;
        let tokenDoc = null;

        tokenDoc = await findDiscountTokenDoc(input);
        if (tokenDoc) {
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
        } else {
            try {
                payload = verifyAndDecodeQrToken(String(input));
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
// Body: qrValue | token | referralCode | couponCode + opcional shopId, productId, datos de auditoría (redeemedBy*).
router.post('/redeem', async (req, res) => {
    try {
        const input = getCouponLookupInput(req.body);
        if (!input) {
            return res.status(400).json({
                ok: false,
                message: 'qrValue, token, referralCode o couponCode requerido'
            });
        }

        let tokenId;
        try {
            const ref = verifyReferenceQrToken(String(input));
            tokenId = ref.tokenId;
        } catch {
            const doc = await DiscountQrToken.findOne({ 'payload.referralCode': String(input).trim() })
                .sort({ createdAt: -1 });
            if (!doc) {
                return res.status(400).json({
                    ok: false,
                    errorCode: 'QR_INVALID',
                    message: ERROR_CODES.QR_INVALID
                });
            }
            tokenId = doc.tokenId;
        }

        const idemKeyNorm = normalizeIdempotencyKey(req.body && req.body.idempotencyKey);
        if (idemKeyNorm) {
            const preUsed = await DiscountQrToken.findOne({ tokenId }).lean();
            if (preUsed && preUsed.usedAt) {
                return sendRedeemResponseForUsedToken(res, preUsed, req.body || {}, idemKeyNorm);
            }
        }

        const serverNow = new Date();
        const { redeemedBy, preferredUsedAt } = buildRedeemedByFromBody(req.body);
        const redeemInstant =
            preferredUsedAt instanceof Date && !Number.isNaN(preferredUsedAt.getTime())
                ? preferredUsedAt
                : serverNow;

        // Redención atómica: solo si no se ha usado y no está expirado
        const redeemed = await DiscountQrToken.findOneAndUpdate(
            {
                tokenId,
                $or: [{ usedAt: null }, { usedAt: { $exists: false } }],
                expiresAt: { $gt: serverNow }
            },
            {
                $set: {
                    usedAt: redeemInstant,
                    lastVerifiedAt: serverNow,
                    redeemedBy
                }
            },
            { new: true }
        );

        if (!redeemed) {
            const existing = await DiscountQrToken.findOne({ tokenId }).lean();
            if (!existing) {
                return res.status(404).json({
                    ok: false,
                    errorCode: 'QR_INVALID',
                    message: ERROR_CODES.QR_INVALID
                });
            }
            if (existing.expiresAt && new Date(existing.expiresAt).getTime() <= serverNow.getTime()) {
                return res.status(400).json({
                    ok: false,
                    errorCode: 'PROMO_EXPIRED',
                    message: ERROR_CODES.PROMO_EXPIRED
                });
            }
            if (existing.usedAt) {
                return sendRedeemResponseForUsedToken(res, existing, req.body || {}, idemKeyNorm);
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

        const retentionDays = Number(process.env.QR_REDEEM_RETENTION_DAYS || '');
        if (Number.isFinite(retentionDays) && retentionDays > 0) {
            const anchor = redeemed.usedAt && !Number.isNaN(new Date(redeemed.usedAt).getTime())
                ? new Date(redeemed.usedAt)
                : serverNow;
            const newExp = new Date(anchor.getTime() + retentionDays * 86400000);
            await DiscountQrToken.updateOne({ tokenId: redeemed.tokenId }, { $set: { expiresAt: newExp } });
        }

        return res.json(buildRedeemSuccessPayload(redeemed));
    } catch (error) {
        return res.status(400).json({
            ok: false,
            errorCode: 'QR_INVALID',
            message: error.message || ERROR_CODES.QR_INVALID
        });
    }
});

// GET /api/discount-qr/redemptions/recent — cupones redimidos recientes (auditoría).
// Query: limit (default 50, max 200), promotionId, shopId.
// Si existe env REDEMPTIONS_LIST_API_KEY, header x-redemptions-api-key debe coincidir.
// Nota: solo existen filas mientras el documento siga en MongoDB (TTL por expiresAt).
//       Tras un canje exitoso, QR_REDEEM_RETENTION_DAYS alarga expiresAt para conservar historial.
router.get('/redemptions/recent', async (req, res) => {
    try {
        const secret = process.env.REDEMPTIONS_LIST_API_KEY;
        if (secret) {
            const sent = req.get('x-redemptions-api-key') || req.get('X-Redemptions-Api-Key') || '';
            if (sent !== secret) {
                return res.status(401).json({ ok: false, message: 'No autorizado' });
            }
        }

        const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit || '50'), 10) || 50));
        const promotionId = req.query.promotionId != null ? String(req.query.promotionId).trim() : '';
        const shopId = req.query.shopId != null ? String(req.query.shopId).trim() : '';

        const filter = {
            usedAt: { $exists: true, $ne: null, $type: 'date' }
        };
        if (promotionId && isValidObjectId(promotionId)) {
            filter['payload.promotionId'] = promotionId;
        }
        if (shopId) {
            filter['payload.shopId'] = shopId;
        }

        const docs = await DiscountQrToken.find(filter)
            .sort({ usedAt: -1 })
            .limit(limit)
            .select('tokenId usedAt expiresAt payload redeemedBy')
            .lean();

        const data = docs.map(formatRedemptionRow);
        return res.json({
            ok: true,
            count: data.length,
            data,
            hint: process.env.QR_REDEEM_RETENTION_DAYS
                ? null
                : 'Configura QR_REDEEM_RETENTION_DAYS (días) para no perder redenciones al expirar el TTL del cupón.'
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: error.message || 'Error al listar redenciones'
        });
    }
});

module.exports = router;
