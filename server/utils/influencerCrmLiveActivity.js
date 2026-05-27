'use strict';

const mongoose = require('mongoose');
const DiscountQrToken = require('../models/DiscountQrToken');
const { aggregateSettlementSummariesForInfluencers } = require('./influencerTokenSettlement');
const { isValidMonetizationStage, MONETIZATION_LABELS } = require('./influencerCrmMonetization');

function safeNum(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

/**
 * Sugiere etapa monetización según actividad real (canjes / cupones / abonos).
 * No persiste — solo guía visual en CRM.
 */
function suggestMonetizationStage(metrics) {
    const {
        hasWallet,
        redeemedCount,
        openCouponsCount,
        settlementPendingCount,
        settlementPaidCount,
        activePromotions,
    } = metrics;

    if (settlementPaidCount > 0 && redeemedCount >= 5) return 'scaling';
    if (settlementPaidCount > 0) return 'payout_active';
    if (settlementPendingCount > 0) return 'payout_pending';
    if (redeemedCount > 0) return 'first_redemption';
    if (openCouponsCount > 0 || activePromotions > 0) return 'coupons_live';
    if (!hasWallet && (openCouponsCount > 0 || activePromotions > 0 || redeemedCount > 0)) {
        return 'wallet_setup';
    }
    if (activePromotions > 0) return 'seeking_campaigns';
    return 'ready';
}

/**
 * Métricas en vivo desde discount_qr_tokens + settlements (batch).
 * @param {string[]} influencerIds
 * @param {{ recentPerInfluencer?: number }} opts
 * @returns {Promise<Map<string, object>>}
 */
async function buildLiveActivityBatch(influencerIds, opts = {}) {
    const recentLimit = Math.min(10, Math.max(1, opts.recentPerInfluencer || 5));
    const map = new Map();
    const ids = [...new Set(influencerIds.map((id) => String(id).trim()).filter(Boolean))];
    if (!ids.length) return map;

    const idMatch = {
        $or: [
            { 'payload.influencerId': { $in: ids } },
            {
                'payload.influencerId': {
                    $in: ids.filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => new mongoose.Types.ObjectId(id)),
                },
            },
        ],
    };

    const now = new Date();
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const [couponAgg, recentRedemptions, settlementMap] = await Promise.all([
        DiscountQrToken.aggregate([
            { $match: idMatch },
            {
                $addFields: {
                    infKey: { $toString: '$payload.influencerId' },
                    isRedeemed: {
                        $and: [{ $ne: ['$usedAt', null] }, { $eq: [{ $type: '$usedAt' }, 'date'] }],
                    },
                    isOpen: {
                        $and: [
                            {
                                $not: {
                                    $and: [
                                        { $ne: ['$usedAt', null] },
                                        { $eq: [{ $type: '$usedAt' }, 'date'] },
                                    ],
                                },
                            },
                            { $gt: ['$expiresAt', now] },
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: '$infKey',
                    redeemedCount: { $sum: { $cond: ['$isRedeemed', 1, 0] } },
                    openCouponsCount: { $sum: { $cond: ['$isOpen', 1, 0] } },
                    lastRedeemedAt: { $max: '$usedAt' },
                    recentRedemptionCount: {
                        $sum: {
                            $cond: [{ $and: ['$isRedeemed', { $gte: ['$usedAt', fiveMinAgo] }] }, 1, 0],
                        },
                    },
                },
            },
        ]),
        DiscountQrToken.find({
            ...idMatch,
            usedAt: { $exists: true, $ne: null, $type: 'date' },
        })
            .sort({ usedAt: -1 })
            .limit(ids.length * recentLimit)
            .select('tokenId payload usedAt redeemedBy')
            .lean(),
        aggregateSettlementSummariesForInfluencers(ids),
    ]);

    const aggByInf = new Map(couponAgg.map((r) => [String(r._id), r]));
    const recentByInf = new Map();
    for (const doc of recentRedemptions) {
        const infId = doc.payload?.influencerId != null ? String(doc.payload.influencerId) : '';
        if (!infId) continue;
        if (!recentByInf.has(infId)) recentByInf.set(infId, []);
        const list = recentByInf.get(infId);
        if (list.length < recentLimit) {
            list.push({
                couponId: doc.tokenId,
                promotionId: doc.payload?.promotionId != null ? String(doc.payload.promotionId) : null,
                shopId:
                    doc.redeemedBy?.idempotencyShopId != null
                        ? String(doc.redeemedBy.idempotencyShopId)
                        : doc.payload?.shopId != null
                          ? String(doc.payload.shopId)
                          : null,
                redeemedAt: doc.usedAt ? new Date(doc.usedAt).toISOString() : null,
                shortCode: doc.payload?.shortCode ? String(doc.payload.shortCode) : null,
            });
        }
    }

    for (const infId of ids) {
        const c = aggByInf.get(infId) || {};
        const settlement = settlementMap.get(infId) || {
            pendingCount: 0,
            pendingAmountUsd: 0,
            paidCount: 0,
            paidAmountUsd: 0,
        };
        const redeemedCount = safeNum(c.redeemedCount);
        const openCouponsCount = safeNum(c.openCouponsCount);
        const lastRedeemedAt = c.lastRedeemedAt ? new Date(c.lastRedeemedAt).toISOString() : null;
        const recentRedemptionCount = safeNum(c.recentRedemptionCount);
        const hasRecentActivity = recentRedemptionCount > 0;

        const metrics = {
            redeemedCount,
            openCouponsCount,
            settlementPendingCount: settlement.pendingCount,
            settlementPendingUsd: settlement.pendingAmountUsd,
            settlementPaidCount: settlement.paidCount,
            settlementPaidUsd: settlement.paidAmountUsd,
        };

        const suggestedStage = suggestMonetizationStage({
            ...metrics,
            hasWallet: false,
            activePromotions: 0,
        });

        map.set(infId, {
            ...metrics,
            lastRedeemedAt,
            hasRecentActivity,
            recentRedemptions: recentByInf.get(infId) || [],
            suggestedMonetizationStage: suggestedStage,
            suggestedMonetizationStageLabel:
                MONETIZATION_LABELS[suggestedStage] || suggestedStage,
            fetchedAt: now.toISOString(),
        });
    }

    return map;
}

/**
 * Actividad en vivo de un influencer (ficha CRM).
 */
async function buildLiveActivityForInfluencer(influencerId, opts = {}) {
    const id = String(influencerId || '').trim();
    const batch = await buildLiveActivityBatch([id], opts);
    return (
        batch.get(id) || {
            redeemedCount: 0,
            openCouponsCount: 0,
            settlementPendingCount: 0,
            settlementPendingUsd: 0,
            settlementPaidCount: 0,
            settlementPaidUsd: 0,
            lastRedeemedAt: null,
            hasRecentActivity: false,
            recentRedemptions: [],
            suggestedMonetizationStage: 'ready',
            suggestedMonetizationStageLabel: MONETIZATION_LABELS.ready,
            fetchedAt: new Date().toISOString(),
        }
    );
}

/**
 * Enriquece métricas de sugerencia con wallet y promos del row CRM.
 */
function enrichLiveActivityWithCrmRow(live, crmRow = {}) {
    const hasWallet = Boolean(crmRow.walletAddress);
    const activePromotions = safeNum(crmRow.activePromotions);
    const suggestedStage = suggestMonetizationStage({
        hasWallet,
        activePromotions,
        redeemedCount: live.redeemedCount ?? safeNum(crmRow.redeemedCoupons),
        openCouponsCount: live.openCouponsCount,
        settlementPendingCount: live.settlementPendingCount,
        settlementPaidCount: live.settlementPaidCount,
    });
    return {
        ...live,
        hasWallet,
        activePromotions,
        totalEarningsUsd: safeNum(crmRow.totalEarnings),
        redeemedCount: live.redeemedCount ?? safeNum(crmRow.redeemedCoupons),
        suggestedMonetizationStage: suggestedStage,
        suggestedMonetizationStageLabel: MONETIZATION_LABELS[suggestedStage] || suggestedStage,
        stageMismatch:
            crmRow.monetizationStage &&
            isValidMonetizationStage(crmRow.monetizationStage) &&
            crmRow.monetizationStage !== suggestedStage,
    };
}

module.exports = {
    suggestMonetizationStage,
    buildLiveActivityBatch,
    buildLiveActivityForInfluencer,
    enrichLiveActivityWithCrmRow,
};
