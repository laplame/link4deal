'use strict';

const { parseLatLngFromUnknown } = require('./geoParseCoupon');

function extractRedeemGpsForApi(redeemedBy) {
    if (!redeemedBy || typeof redeemedBy !== 'object') return null;
    if (
        typeof redeemedBy.redeemLatitude === 'number' &&
        typeof redeemedBy.redeemLongitude === 'number'
    ) {
        const o = { latitude: redeemedBy.redeemLatitude, longitude: redeemedBy.redeemLongitude };
        if (typeof redeemedBy.redeemGpsAccuracyMeters === 'number') {
            o.locationAccuracyM = redeemedBy.redeemGpsAccuracyMeters;
        }
        return o;
    }
    if (typeof redeemedBy.latitude === 'number' && typeof redeemedBy.longitude === 'number') {
        const o = { latitude: redeemedBy.latitude, longitude: redeemedBy.longitude };
        if (typeof redeemedBy.locationAccuracyM === 'number') {
            o.locationAccuracyM = redeemedBy.locationAccuracyM;
        }
        return o;
    }
    return parseLatLngFromUnknown(redeemedBy.metadata) || null;
}

/** Fila para dashboard de cupones (perfil influencer o vista global redenciones-en-vivo). */
function formatCouponActivityRow(doc) {
    const p = doc.payload && typeof doc.payload === 'object' ? doc.payload : {};
    const redeemGps = extractRedeemGpsForApi(doc.redeemedBy);
    let openLocation = null;
    if (
        doc.verifyLatitude != null &&
        doc.verifyLongitude != null &&
        Number.isFinite(Number(doc.verifyLatitude)) &&
        Number.isFinite(Number(doc.verifyLongitude))
    ) {
        openLocation = {
            lat: Number(doc.verifyLatitude),
            lng: Number(doc.verifyLongitude),
            accuracyM:
                doc.verifyLocationAccuracyM != null && Number.isFinite(Number(doc.verifyLocationAccuracyM))
                    ? Number(doc.verifyLocationAccuracyM)
                    : null,
        };
    }
    let redeemLocation = null;
    if (redeemGps) {
        redeemLocation = {
            lat: redeemGps.latitude,
            lng: redeemGps.longitude,
            accuracyM: redeemGps.locationAccuracyM != null ? redeemGps.locationAccuracyM : null,
        };
    }
    return {
        couponId: doc.tokenId,
        referralCode: p.referralCode != null ? String(p.referralCode) : null,
        promotionId: p.promotionId != null ? String(p.promotionId) : null,
        promoShopId: p.shopId != null ? String(p.shopId) : null,
        influencerId: p.influencerId != null ? String(p.influencerId).trim() : null,
        discountPercentage:
            p.discountPercentage != null && p.discountPercentage !== '' ? Number(p.discountPercentage) : null,
        createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
        expiresAt: doc.expiresAt ? new Date(doc.expiresAt).toISOString() : null,
        lastOpenedAt: doc.lastVerifiedAt ? new Date(doc.lastVerifiedAt).toISOString() : null,
        openedAtShopId:
            doc.verifyShopId != null && String(doc.verifyShopId).trim() !== ''
                ? String(doc.verifyShopId).trim()
                : null,
        openLocation,
        redeemedAt: doc.usedAt ? new Date(doc.usedAt).toISOString() : null,
        redeemLocation,
    };
}

/**
 * Clasifica documentos lean de DiscountQrToken en abiertos / redimidos / caducados sin uso.
 * @param {object[]} docs
 */
function partitionDiscountQrDocsToActivity(docs) {
    const nowMs = Date.now();
    const open = [];
    const redeemed = [];
    const expiredUnused = [];
    for (const doc of docs) {
        const row = formatCouponActivityRow(doc);
        if (doc.usedAt) {
            redeemed.push(row);
        } else if (doc.expiresAt && new Date(doc.expiresAt).getTime() <= nowMs) {
            expiredUnused.push(row);
        } else {
            open.push(row);
        }
    }
    redeemed.sort((a, b) => {
        const ta = a.redeemedAt ? new Date(a.redeemedAt).getTime() : 0;
        const tb = b.redeemedAt ? new Date(b.redeemedAt).getTime() : 0;
        return tb - ta;
    });
    open.sort((a, b) => {
        const ta = a.expiresAt ? new Date(a.expiresAt).getTime() : Number.MAX_SAFE_INTEGER;
        const tb = b.expiresAt ? new Date(b.expiresAt).getTime() : Number.MAX_SAFE_INTEGER;
        return ta - tb;
    });
    expiredUnused.sort((a, b) => {
        const ta = a.expiresAt ? new Date(a.expiresAt).getTime() : 0;
        const tb = b.expiresAt ? new Date(b.expiresAt).getTime() : 0;
        return tb - ta;
    });
    return { open, redeemed, expiredUnused };
}

module.exports = {
    formatCouponActivityRow,
    extractRedeemGpsForApi,
    partitionDiscountQrDocsToActivity,
};
