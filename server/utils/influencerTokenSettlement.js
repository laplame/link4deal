'use strict';

const mongoose = require('mongoose');
const InfluencerTokenSettlement = require('../models/InfluencerTokenSettlement');
const Bid = require('../models/Bid');
const PromotionApplication = require('../models/PromotionApplication');
const { resolveWalletForUser, normalizeWalletAddress } = require('./influencerWallet');

function isSettlementEnabled() {
    return String(process.env.INFLUENCER_SETTLEMENT_ENABLED || 'true').toLowerCase() !== 'false';
}

function isAutoPayMongoEnabled() {
    return String(process.env.INFLUENCER_SETTLEMENT_AUTO_PAY_MONGO || 'false').toLowerCase() === 'true';
}

function safeNum(n, fallback = 0) {
    const x = Number(n);
    return Number.isFinite(x) ? x : fallback;
}

function pricingToUsdCommission(pricing, bidUsdFallback) {
    const fromBid = safeNum(bidUsdFallback);
    if (fromBid >= 1) return Math.round(fromBid * 100) / 100;
    if (!pricing) return 1;
    const amt = safeNum(pricing.amount);
    if (amt <= 0) return 1;
    const cur = String(pricing.currency || 'USD').toUpperCase();
    if (cur === 'USD') return Math.max(1, Math.round(amt * 100) / 100);
    if (cur === 'MXN') {
        const rate = safeNum(process.env.USD_MXN_RATE, 18) || 18;
        return Math.max(1, Math.round((amt / rate) * 100) / 100);
    }
    return Math.max(1, Math.round(amt * 100) / 100);
}

/**
 * Comisión USD por canje para influencer + promoción.
 */
async function resolveCommissionUsd(influencerId, promotionId) {
    const infOid = mongoose.Types.ObjectId.isValid(String(influencerId))
        ? new mongoose.Types.ObjectId(String(influencerId))
        : null;
    const promoOid = mongoose.Types.ObjectId.isValid(String(promotionId))
        ? new mongoose.Types.ObjectId(String(promotionId))
        : null;
    if (!infOid || !promoOid) return 1;

    const bid = await Bid.findOne({ influencer: infOid, promotion: promoOid }).select('amountUsd').lean();
    if (bid && safeNum(bid.amountUsd) >= 1) {
        return Math.round(safeNum(bid.amountUsd) * 100) / 100;
    }

    const app = await PromotionApplication.findOne({
        influencer: infOid,
        promotion: promoOid,
        status: 'approved',
    })
        .select('pricing')
        .lean();
    return pricingToUsdCommission(app?.pricing, 0);
}

function serializeSettlement(doc) {
    if (!doc) return null;
    const d = doc.toObject ? doc.toObject() : doc;
    return {
        id: String(d._id),
        settlementId: d.settlementId,
        influencerId: String(d.influencer),
        promotionId: String(d.promotion),
        couponTokenId: d.couponTokenId,
        shortCode: d.shortCode || null,
        referralCode: d.referralCode || null,
        shopId: d.shopId || null,
        amountTokens: d.amountTokens,
        amountUsd: d.amountUsd,
        commissionPerRedemptionUsd: d.commissionPerRedemptionUsd,
        currency: d.currency || 'USD',
        tokenSymbol: d.tokenSymbol || 'LUXAE',
        walletAddress: d.walletAddress || null,
        preferredNetwork: d.preferredNetwork || null,
        status: d.status,
        transfer: d.transfer
            ? {
                  method: d.transfer.method,
                  paidAt: d.transfer.paidAt ? new Date(d.transfer.paidAt).toISOString() : null,
                  txRef: d.transfer.txRef || null,
                  note: d.transfer.note || '',
                  error: d.transfer.error || '',
                  processedBy: d.transfer.processedBy || null,
              }
            : null,
        redeemedAt: d.redeemedAt ? new Date(d.redeemedAt).toISOString() : null,
        source: d.source || 'coupon_redeem',
        createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : null,
        updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : null,
    };
}

/**
 * Crea abono pendiente tras canje (idempotente por couponTokenId).
 * @param {object} redeemed — documento DiscountQrToken tras redeem
 */
async function createSettlementFromRedemption(redeemed) {
    if (!isSettlementEnabled()) return { created: false, reason: 'disabled' };

    const payload = redeemed?.payload;
    const tokenId = String(redeemed?.tokenId || '').trim();
    const influencerId = payload?.influencerId != null ? String(payload.influencerId).trim() : '';
    const promotionId = payload?.promotionId != null ? String(payload.promotionId).trim() : '';

    if (!tokenId || !influencerId || !promotionId) {
        return { created: false, reason: 'missing_ids' };
    }
    if (!mongoose.Types.ObjectId.isValid(influencerId) || !mongoose.Types.ObjectId.isValid(promotionId)) {
        return { created: false, reason: 'invalid_ids' };
    }

    const existing = await InfluencerTokenSettlement.findOne({ couponTokenId: tokenId }).lean();
    if (existing) {
        return { created: false, reason: 'duplicate', settlement: serializeSettlement(existing) };
    }

    const commissionUsd = await resolveCommissionUsd(influencerId, promotionId);
    const amountUsd = commissionUsd;
    const amountTokens = amountUsd;

    let walletAddress = normalizeWalletAddress(payload?.walletAddress);
    let preferredNetwork = null;
    if (!walletAddress || String(payload?.walletAddress) === 'not-provided') {
        const Influencer = require('../models/Influencer');
        const User = require('../models/User');
        const inf = await Influencer.findById(influencerId).select('userId').lean();
        if (inf?.userId) {
            const user = await User.findById(inf.userId);
            if (user) {
                const w = await resolveWalletForUser(user);
                walletAddress = w.address;
                preferredNetwork = w.preferredNetwork;
            }
        }
    }

    const settlementId = `setl_${new mongoose.Types.ObjectId().toString()}`;
    const doc = await InfluencerTokenSettlement.create({
        settlementId,
        influencer: new mongoose.Types.ObjectId(influencerId),
        promotion: new mongoose.Types.ObjectId(promotionId),
        couponTokenId: tokenId,
        shortCode: payload?.shortCode ? String(payload.shortCode).trim().toUpperCase() : undefined,
        referralCode: payload?.referralCode ? String(payload.referralCode).trim() : undefined,
        shopId: redeemed?.redeemedBy?.idempotencyShopId || payload?.shopId || undefined,
        amountTokens,
        amountUsd,
        commissionPerRedemptionUsd: commissionUsd,
        currency: 'USD',
        tokenSymbol: String(process.env.INFLUENCER_SETTLEMENT_TOKEN_SYMBOL || 'LUXAE').trim() || 'LUXAE',
        walletAddress: walletAddress || null,
        preferredNetwork,
        status: 'pending',
        transfer: { method: 'mongo_ledger' },
        redeemedAt: redeemed.usedAt ? new Date(redeemed.usedAt) : new Date(),
        source: 'coupon_redeem',
    });

    if (isAutoPayMongoEnabled() && walletAddress) {
        await markSettlementPaid(doc, { note: 'Auto mongo ledger' });
        const fresh = await InfluencerTokenSettlement.findById(doc._id).lean();
        return { created: true, autoPaid: true, settlement: serializeSettlement(fresh) };
    }

    return { created: true, autoPaid: false, settlement: serializeSettlement(doc) };
}

async function markSettlementPaid(docOrId, opts = {}) {
    const doc =
        typeof docOrId === 'object' && docOrId._id
            ? docOrId
            : await InfluencerTokenSettlement.findById(docOrId);
    if (!doc || doc.status === 'paid' || doc.status === 'cancelled') return doc;

    if (!doc.walletAddress) {
        doc.status = 'failed';
        doc.transfer = doc.transfer || {};
        doc.transfer.error = 'Sin walletAddress para abono';
        await doc.save();
        return doc;
    }

    const txRef = opts.txRef || `mongo-${String(doc._id)}`;
    doc.status = 'paid';
    doc.transfer = {
        method: opts.method || 'mongo_ledger',
        paidAt: new Date(),
        txRef,
        note: opts.note || 'Abono registrado en ledger Mongo (simulación)',
        error: '',
        processedBy: opts.processedBy || 'system',
    };
    await doc.save();
    return doc;
}

/**
 * Pasa pending → paid para un influencer (requiere wallet en cada fila o en User).
 */
async function processPendingSettlementsForInfluencer(influencerId, opts = {}) {
    const oid = mongoose.Types.ObjectId.isValid(String(influencerId))
        ? new mongoose.Types.ObjectId(String(influencerId))
        : null;
    if (!oid) return { processed: 0, failed: 0, results: [] };

    let walletFromUser = null;
    let preferredNetwork = null;
    if (opts.user) {
        const w = await resolveWalletForUser(opts.user);
        walletFromUser = w.address;
        preferredNetwork = w.preferredNetwork;
    }

    const pending = await InfluencerTokenSettlement.find({
        influencer: oid,
        status: 'pending',
    })
        .sort({ createdAt: 1 })
        .limit(Math.min(500, safeNum(opts.limit, 100)));

    let processed = 0;
    let failed = 0;
    const results = [];

    for (const row of pending) {
        if (!row.walletAddress && walletFromUser) {
            row.walletAddress = walletFromUser;
            row.preferredNetwork = preferredNetwork || row.preferredNetwork;
            await row.save();
        }
        if (!row.walletAddress) {
            failed += 1;
            results.push({ settlementId: row.settlementId, ok: false, error: 'NO_WALLET' });
            continue;
        }
        await markSettlementPaid(row, { processedBy: opts.processedBy || 'influencer_app' });
        processed += 1;
        results.push({ settlementId: row.settlementId, ok: true, txRef: row.transfer?.txRef });
    }

    return { processed, failed, results };
}

async function getSettlementSummaryForInfluencer(influencerId) {
    const oid = mongoose.Types.ObjectId.isValid(String(influencerId))
        ? new mongoose.Types.ObjectId(String(influencerId))
        : null;
    if (!oid) {
        return { pendingCount: 0, pendingAmountUsd: 0, paidCount: 0, paidAmountUsd: 0, byPromotion: [] };
    }

    const agg = await InfluencerTokenSettlement.aggregate([
        { $match: { influencer: oid } },
        {
            $group: {
                _id: { promotion: '$promotion', status: '$status' },
                count: { $sum: 1 },
                amountUsd: { $sum: '$amountUsd' },
            },
        },
    ]);

    let pendingCount = 0;
    let pendingAmountUsd = 0;
    let paidCount = 0;
    let paidAmountUsd = 0;
    /** @type {Map<string, object>} */
    const byPromo = new Map();

    for (const g of agg) {
        const promoId = String(g._id.promotion);
        const st = g._id.status;
        const cnt = safeNum(g.count);
        const usd = Math.round(safeNum(g.amountUsd) * 100) / 100;

        if (st === 'pending' || st === 'processing') {
            pendingCount += cnt;
            pendingAmountUsd += usd;
        } else if (st === 'paid') {
            paidCount += cnt;
            paidAmountUsd += usd;
        }

        if (!byPromo.has(promoId)) {
            byPromo.set(promoId, {
                promotionId: promoId,
                pendingCount: 0,
                pendingAmountUsd: 0,
                paidCount: 0,
                paidAmountUsd: 0,
            });
        }
        const row = byPromo.get(promoId);
        if (st === 'pending' || st === 'processing') {
            row.pendingCount += cnt;
            row.pendingAmountUsd = Math.round((row.pendingAmountUsd + usd) * 100) / 100;
        } else if (st === 'paid') {
            row.paidCount += cnt;
            row.paidAmountUsd = Math.round((row.paidAmountUsd + usd) * 100) / 100;
        }
    }

    return {
        pendingCount,
        pendingAmountUsd: Math.round(pendingAmountUsd * 100) / 100,
        paidCount,
        paidAmountUsd: Math.round(paidAmountUsd * 100) / 100,
        byPromotion: [...byPromo.values()],
    };
}

function settlementSummaryForPromotion(summary, promotionId) {
    const pid = String(promotionId);
    const row = (summary.byPromotion || []).find((p) => p.promotionId === pid);
    if (!row) {
        return {
            commissionPerRedemptionUsd: null,
            pendingCount: 0,
            pendingAmountUsd: 0,
            paidCount: 0,
            paidAmountUsd: 0,
        };
    }
    return {
        pendingCount: row.pendingCount,
        pendingAmountUsd: row.pendingAmountUsd,
        paidCount: row.paidCount,
        paidAmountUsd: row.paidAmountUsd,
    };
}

async function listSettlementsForInfluencer(influencerId, query = {}) {
    const oid = mongoose.Types.ObjectId.isValid(String(influencerId))
        ? new mongoose.Types.ObjectId(String(influencerId))
        : null;
    if (!oid) return { docs: [], total: 0, page: 1, limit: 20 };

    const page = Math.max(1, safeNum(query.page, 1));
    const limit = Math.min(100, Math.max(1, safeNum(query.limit, 20)));
    const filter = { influencer: oid };
    if (query.status) filter.status = String(query.status);
    if (query.promotionId && mongoose.Types.ObjectId.isValid(String(query.promotionId))) {
        filter.promotion = new mongoose.Types.ObjectId(String(query.promotionId));
    }

    const [total, docs] = await Promise.all([
        InfluencerTokenSettlement.countDocuments(filter),
        InfluencerTokenSettlement.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
    ]);

    return {
        docs: docs.map(serializeSettlement),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
    };
}

/**
 * Resúmenes de abonos por influencer (batch para tablero CRM monetización).
 * @returns {Map<string, { pendingCount, pendingAmountUsd, paidCount, paidAmountUsd }>}
 */
async function aggregateSettlementSummariesForInfluencers(influencerIds) {
    const oids = influencerIds
        .filter((id) => mongoose.Types.ObjectId.isValid(String(id)))
        .map((id) => new mongoose.Types.ObjectId(String(id)));
    const map = new Map();
    if (!oids.length) return map;

    const agg = await InfluencerTokenSettlement.aggregate([
        { $match: { influencer: { $in: oids } } },
        {
            $group: {
                _id: { influencer: '$influencer', status: '$status' },
                count: { $sum: 1 },
                amountUsd: { $sum: '$amountUsd' },
            },
        },
    ]);

    for (const g of agg) {
        const infId = String(g._id.influencer);
        if (!map.has(infId)) {
            map.set(infId, {
                pendingCount: 0,
                pendingAmountUsd: 0,
                paidCount: 0,
                paidAmountUsd: 0,
            });
        }
        const row = map.get(infId);
        const st = g._id.status;
        const cnt = safeNum(g.count);
        const usd = Math.round(safeNum(g.amountUsd) * 100) / 100;
        if (st === 'pending' || st === 'processing') {
            row.pendingCount += cnt;
            row.pendingAmountUsd = Math.round((row.pendingAmountUsd + usd) * 100) / 100;
        } else if (st === 'paid') {
            row.paidCount += cnt;
            row.paidAmountUsd = Math.round((row.paidAmountUsd + usd) * 100) / 100;
        }
    }
    return map;
}

module.exports = {
    isSettlementEnabled,
    isAutoPayMongoEnabled,
    resolveCommissionUsd,
    createSettlementFromRedemption,
    processPendingSettlementsForInfluencer,
    getSettlementSummaryForInfluencer,
    aggregateSettlementSummariesForInfluencers,
    settlementSummaryForPromotion,
    listSettlementsForInfluencer,
    serializeSettlement,
    markSettlementPaid,
};
