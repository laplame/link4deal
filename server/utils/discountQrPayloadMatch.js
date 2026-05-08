'use strict';

const mongoose = require('mongoose');

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

/**
 * Coincide con payload.influencerId guardado como string u ObjectId.
 * @param {string|undefined|null} raw
 * @returns {{$or: object[]}|null}
 */
function matchPayloadInfluencerId(raw) {
    const id = raw != null ? String(raw).trim() : '';
    if (!id || !isValidObjectId(id)) return null;
    const oid = new mongoose.Types.ObjectId(id);
    return { $or: [{ 'payload.influencerId': id }, { 'payload.influencerId': oid }] };
}

/**
 * Filtro Find para listados de cupón con canje (usedAt).
 * @param {Record<string, unknown>} query - req.query
 */
function buildRedeemedTokenFilter(query) {
    const promotionId = query.promotionId != null ? String(query.promotionId).trim() : '';
    const shopId = query.shopId != null ? String(query.shopId).trim() : '';
    const influencerIdRaw = query.influencerId != null ? String(query.influencerId).trim() : '';

    const and = [{ usedAt: { $exists: true, $ne: null, $type: 'date' } }];
    if (promotionId && isValidObjectId(promotionId)) {
        const oid = new mongoose.Types.ObjectId(promotionId);
        and.push({
            $or: [{ 'payload.promotionId': promotionId }, { 'payload.promotionId': oid }],
        });
    }
    if (shopId) {
        and.push({ 'payload.shopId': shopId });
    }
    const inf = matchPayloadInfluencerId(influencerIdRaw);
    if (inf) and.push(inf);
    return and.length === 1 ? and[0] : { $and: and };
}

/**
 * Filtro para dashboard (sin exigir usedAt).
 * @param {Record<string, unknown>} query
 */
function buildDashboardTokenFilter(query) {
    const promotionId = query.promotionId != null ? String(query.promotionId).trim() : '';
    const shopId = query.shopId != null ? String(query.shopId).trim() : '';
    const influencerIdRaw = query.influencerId != null ? String(query.influencerId).trim() : '';

    /** @type {object[]} */
    const and = [];
    if (promotionId && isValidObjectId(promotionId)) {
        const oid = new mongoose.Types.ObjectId(promotionId);
        and.push({
            $or: [{ 'payload.promotionId': promotionId }, { 'payload.promotionId': oid }],
        });
    }
    if (shopId) {
        and.push({ 'payload.shopId': shopId });
    }
    const inf = matchPayloadInfluencerId(influencerIdRaw);
    if (inf) and.push(inf);
    if (and.length === 0) return {};
    return and.length === 1 ? and[0] : { $and: and };
}

module.exports = {
    isValidObjectId,
    matchPayloadInfluencerId,
    buildRedeemedTokenFilter,
    buildDashboardTokenFilter,
};
