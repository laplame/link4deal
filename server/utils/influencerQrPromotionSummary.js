'use strict';

const mongoose = require('mongoose');
const DiscountQrToken = require('../models/DiscountQrToken');
const Promotion = require('../models/Promotion');
const Bid = require('../models/Bid');

function catalogPromotionIsLive(pr, now) {
    if (!pr || pr.status !== 'active') return false;
    const vu = pr.validUntil != null ? new Date(pr.validUntil).getTime() : NaN;
    if (!Number.isFinite(vu) || vu < now.getTime()) return false;
    const vf = pr.validFrom != null ? new Date(pr.validFrom).getTime() : 0;
    return vf <= now.getTime();
}

function bidPromotionVisibleOnProfile(bidPromotion, now) {
    if (!bidPromotion || bidPromotion.validUntil == null) return false;
    if (new Date(bidPromotion.validUntil).getTime() < now.getTime()) return false;
    const vf = bidPromotion.validFrom ? new Date(bidPromotion.validFrom).getTime() : now.getTime();
    return vf <= now.getTime();
}

/**
 * Agrupa cupones QR del influencer por promoción y fusiona pujas vigentes sin cupones aún emitidos.
 * No valida existencia del influencer (hazlo en el controlador).
 * @param {string} influencerId - ObjectId hex
 */
async function buildInfluencerQrPromotionSummary(influencerId) {
    const idStr = String(influencerId || '').trim();
    const oid = new mongoose.Types.ObjectId(idStr);
    const now = new Date();

    const matchInf = {
        $or: [{ 'payload.influencerId': idStr }, { 'payload.influencerId': oid }],
    };

    const agg = await DiscountQrToken.aggregate([
        { $match: matchInf },
        {
            $addFields: {
                promoRaw: '$payload.promotionId',
                hasUsed: {
                    $and: [{ $ne: ['$usedAt', null] }, { $eq: [{ $type: '$usedAt' }, 'date'] }],
                },
            },
        },
        {
            $addFields: {
                promoKey: {
                    $cond: [{ $or: [{ $eq: ['$promoRaw', null] }, { $eq: ['$promoRaw', ''] }] }, '', { $toString: '$promoRaw' }],
                },
            },
        },
        {
            $addFields: {
                state: {
                    $cond: [
                        '$hasUsed',
                        'redeemed',
                        {
                            $cond: [
                                {
                                    $and: [{ $ne: ['$expiresAt', null] }, { $lte: ['$expiresAt', now] }],
                                },
                                'expired_unused',
                                'open',
                            ],
                        },
                    ],
                },
            },
        },
        {
            $group: {
                _id: { $cond: [{ $eq: ['$promoKey', ''] }, '__none__', '$promoKey'] },
                redeemed: { $sum: { $cond: [{ $eq: ['$state', 'redeemed'] }, 1, 0] } },
                open: { $sum: { $cond: [{ $eq: ['$state', 'open'] }, 1, 0] } },
                expiredUnused: { $sum: { $cond: [{ $eq: ['$state', 'expired_unused'] }, 1, 0] } },
                lastRedeemedAt: { $max: '$usedAt' },
            },
        },
        { $sort: { redeemed: -1, open: -1, _id: 1 } },
    ]);

    const noneRow = agg.find((g) => g._id === '__none__');
    const cleanGroups = agg.filter((g) => g._id !== '__none__');

    /** @type {mongoose.Types.ObjectId[]} */
    const promoOids = [];
    for (const g of cleanGroups) {
        if (mongoose.Types.ObjectId.isValid(String(g._id))) {
            promoOids.push(new mongoose.Types.ObjectId(String(g._id)));
        }
    }

    const promoDocs = promoOids.length
        ? await Promotion.find({ _id: { $in: promoOids } })
              .select('title brand validFrom validUntil status')
              .lean()
        : [];
    const promoMap = new Map(promoDocs.map((p) => [String(p._id), p]));

    const bidDocs = await Bid.find({ influencer: idStr }).populate('promotion', 'title brand validFrom validUntil status').lean();

    /** @type {Map<string, { status?: string, amountUsd?: number }>} */
    const bidByPromo = new Map();
    for (const b of bidDocs) {
        if (b.promotion && b.promotion._id) {
            bidByPromo.set(String(b.promotion._id), { status: b.status, amountUsd: b.amountUsd });
        }
    }

    /** @type {Array<object>} */
    const rows = [];

    for (const g of cleanGroups) {
        const pid = String(g._id);
        const pdoc = promoMap.get(pid);
        const bid = bidByPromo.get(pid);
        const catalogActiveWindow = catalogPromotionIsLive(pdoc, now);

        rows.push({
            promotionId: pid,
            title: pdoc?.title ?? null,
            brand: pdoc?.brand ?? null,
            validFrom: pdoc?.validFrom ? new Date(pdoc.validFrom).toISOString() : null,
            validUntil: pdoc?.validUntil ? new Date(pdoc.validUntil).toISOString() : null,
            catalogActiveWindow,
            promotionStatus: pdoc?.status ?? null,
            bidStatus: bid?.status ?? null,
            bidAmountUsd: bid?.amountUsd != null ? Number(bid.amountUsd) : null,
            open: g.open,
            redeemed: g.redeemed,
            expiredUnused: g.expiredUnused,
            totalTokens: g.open + g.redeemed + g.expiredUnused,
            lastRedeemedAt: g.lastRedeemedAt ? new Date(g.lastRedeemedAt).toISOString() : null,
        });
    }

    const tokenPromoIds = new Set(rows.map((r) => r.promotionId));

    for (const b of bidDocs) {
        const pr = b.promotion;
        if (!pr || !pr._id) continue;
        const promoIdStr = String(pr._id);
        if (tokenPromoIds.has(promoIdStr)) continue;
        if (!bidPromotionVisibleOnProfile(pr, now)) continue;

        rows.push({
            promotionId: promoIdStr,
            title: pr.title ?? null,
            brand: pr.brand ?? null,
            validFrom: pr.validFrom ? new Date(pr.validFrom).toISOString() : null,
            validUntil: pr.validUntil ? new Date(pr.validUntil).toISOString() : null,
            catalogActiveWindow: catalogPromotionIsLive(pr, now),
            promotionStatus: pr.status ?? null,
            bidStatus: b.status ?? null,
            bidAmountUsd: b.amountUsd != null ? Number(b.amountUsd) : null,
            open: 0,
            redeemed: 0,
            expiredUnused: 0,
            totalTokens: 0,
            lastRedeemedAt: null,
            noQrActivityYet: true,
        });
    }

    rows.sort((a, b) => {
        const score = (r) =>
            (r.catalogActiveWindow ? 8 : 0) +
            (r.open > 0 ? 4 : 0) +
            (r.redeemed > 0 ? 2 : 0) +
            (r.totalTokens > 0 ? 1 : 0);
        const d = score(b) - score(a);
        if (d !== 0) return d;
        if (b.redeemed !== a.redeemed) return b.redeemed - a.redeemed;
        return b.totalTokens - a.totalTokens;
    });

    return {
        rows,
        tokensWithoutPromotionId: noneRow ? noneRow.open + noneRow.redeemed + noneRow.expiredUnused : 0,
        generatedAt: now.toISOString(),
    };
}

module.exports = { buildInfluencerQrPromotionSummary };
