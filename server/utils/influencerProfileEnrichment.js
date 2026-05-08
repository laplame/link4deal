'use strict';

/**
 * Métricas y tarjetas de “pujas” para el perfil público del influencer:
 * combina colección Bid, solicitudes aprobadas y actividad real de DiscountQrToken.
 */

const mongoose = require('mongoose');
const Bid = require('../models/Bid');
const PromotionApplication = require('../models/PromotionApplication');
const Promotion = require('../models/Promotion');
const { buildInfluencerQrPromotionSummary } = require('./influencerQrPromotionSummary');
const { getDisplayContractAddress, getPolygonscanAddressUrl } = require('./polygonContract');

function promotionCatalogLive(pr, now = new Date()) {
    if (!pr || pr.status !== 'active') return false;
    const vu = pr.validUntil != null ? new Date(pr.validUntil).getTime() : NaN;
    if (!Number.isFinite(vu) || vu < now.getTime()) return false;
    const vf = pr.validFrom != null ? new Date(pr.validFrom).getTime() : 0;
    return vf <= now.getTime();
}

function safeNum(n, fallback = 0) {
    const x = Number(n);
    return Number.isFinite(x) ? x : fallback;
}

/** Comisión por venta en USD para mostrar cuando no hay fila Bid. */
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

function bidHistoryToFrontend(bidHistory, amountUsdFallback, createdAt) {
    const hist = Array.isArray(bidHistory) ? bidHistory : [];
    if (hist.length) {
        return hist.map((h) => ({
            amount: safeNum(h.amount, amountUsdFallback),
            timestamp: h.timestamp ? new Date(h.timestamp).toISOString() : new Date(createdAt || Date.now()).toISOString(),
        }));
    }
    return [{ amount: amountUsdFallback, timestamp: new Date(createdAt || Date.now()).toISOString() }];
}

/**
 * Formato de tarjeta de puja igual al esperado por InfluencerProfilePage.
 * @param {object} opts
 * @param {string} opts.id
 * @param {import('mongoose').Types.ObjectId | string} opts.promotionId
 * @param {object} opts.promo lean Promotion
 * @param {'active'|'won'|'lost'|'expired'} opts.status
 * @param {number} opts.amountUsd
 * @param {object[]} [opts.bidHistory]
 * @param {Date} [opts.createdAt]
 * @param {boolean} [opts.synthetic=false]
 */
function toBidCard(opts) {
    const now = new Date();
    const promo = opts.promo;
    const promoIdStr = String(opts.promotionId);
    const validFrom = promo.validFrom ? new Date(promo.validFrom) : now;
    const validUntil = promo.validUntil ? new Date(promo.validUntil) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const tags = Array.isArray(promo.tags) ? promo.tags : [];
    const amt = Math.max(1, safeNum(opts.amountUsd, 1));

    const smartContractAddress = getDisplayContractAddress(promoIdStr, promo.smartContract);
    const polygonscanUrl = getPolygonscanAddressUrl(smartContractAddress);

    const bidHistoryNorm = opts.bidHistory && opts.bidHistory.length
        ? opts.bidHistory
        : bidHistoryToFrontend([], amt, opts.createdAt || now);

    return {
        id: opts.id,
        promotionId: promoIdStr,
        smartContractAddress,
        polygonscanUrl,
        smartContractPagePath: `/promocion/${promoIdStr}/smart-contract`,
        campaignTitle: promo.title || 'Sin título',
        brandName: promo.brand || 'Sin marca',
        status: opts.status || 'active',
        currentBid: amt,
        requirements: tags.length ? tags.slice(0, 5) : ['General'],
        targetMetrics: {
            reach: (promo.views || 0) * 10 || 5000,
            engagement: 4,
            conversions: promo.conversions || 0,
        },
        initialBid: Math.max(1, amt - 0.15),
        bidIncrement: 0.05,
        totalBids: bidHistoryNorm.length || 1,
        startDate: validFrom.toISOString(),
        endDate: validUntil.toISOString(),
        bidHistory: bidHistoryNorm,
        syntheticFromApplication: !!opts.syntheticApplication,
        syntheticQrOnly: !!opts.syntheticQrOnly,
    };
}

/**
 * Cards para GET /api/influencers/:id/bids — incluye pujas reales + campañas con cupones o solicitudes aprobadas.
 * @param {string} influencerId
 */
async function buildPublicInfluencerBidCards(influencerId) {
    const idStr = String(influencerId || '').trim();
    const summaryPack = await buildInfluencerQrPromotionSummary(idStr);
    const summaryRows = summaryPack.rows || [];
    /** @type {Map<string, import('./influencerQrPromotionSummary').Row>} */
    const rowByPromo = new Map(summaryRows.map((r) => [r.promotionId, r]));

    const now = new Date();
    const bidDocs = await Bid.find({ influencer: idStr }).populate('promotion').sort({ createdAt: -1 }).lean();

    /** @type {Set<string>} */
    const covered = new Set();
    /** @type {ReturnType<typeof toBidCard>[]} */
    const out = [];

    for (const b of bidDocs) {
        const promo = b.promotion;
        if (!promo || !promo._id) continue;
        const pid = String(promo._id);
        const row = rowByPromo.get(pid);
        const promoEndsOk = promo.validUntil && new Date(promo.validUntil) >= now;
        const hasQrActivity =
            row && (safeNum(row.redeemed) > 0 || safeNum(row.open) > 0 || safeNum(row.totalTokens) > 0);
        if (!promoEndsOk && !hasQrActivity) continue;

        const amountUsd = Math.max(1, safeNum(b.amountUsd, 1));
        out.push(
            toBidCard({
                id: b._id.toString(),
                promotionId: promo._id,
                promo,
                status: b.status || 'active',
                amountUsd,
                bidHistory: (b.bidHistory || []).map((h) => ({
                    amount: safeNum(h.amount, amountUsd),
                    timestamp: h.timestamp ? new Date(h.timestamp).toISOString() : now.toISOString(),
                })),
                createdAt: b.createdAt,
            })
        );
        covered.add(pid);
    }

    const oid = mongoose.Types.ObjectId.isValid(idStr) ? new mongoose.Types.ObjectId(idStr) : null;
    const apps = oid
        ? await PromotionApplication.find({ influencerApplicant: oid, status: 'approved' }).populate('promotion').lean()
        : [];

    for (const app of apps) {
        const promo = app.promotion;
        if (!promo || !promo._id) continue;
        const pid = String(promo._id);
        if (covered.has(pid)) continue;

        const row = rowByPromo.get(pid);
        const promoEndsOk = promo.validUntil && new Date(promo.validUntil) >= now;
        const hasQrActivity =
            row && (safeNum(row.redeemed) > 0 || safeNum(row.open) > 0 || safeNum(row.totalTokens) > 0);
        if (!promoEndsOk && !hasQrActivity) continue;

        const usd = pricingToUsdCommission(app.pricing, row?.bidAmountUsd);
        const history = [{ amount: usd, timestamp: (app.updatedAt || app.createdAt || now).toISOString() }];
        out.push(
            toBidCard({
                id: `app-${String(app._id)}`,
                promotionId: promo._id,
                promo,
                status: promoEndsOk ? 'active' : 'expired',
                amountUsd: usd,
                bidHistory: history,
                createdAt: app.createdAt || app.updatedAt,
                syntheticApplication: true,
            })
        );
        covered.add(pid);
    }

    const needPromoIds = [];
    for (const row of summaryRows) {
        if (covered.has(row.promotionId) || safeNum(row.totalTokens) < 1) continue;
        if (mongoose.Types.ObjectId.isValid(row.promotionId)) needPromoIds.push(row.promotionId);
    }

    let extraPromos = [];
    if (needPromoIds.length > 0) {
        extraPromos = await Promotion.find({ _id: { $in: needPromoIds } }).lean();
    }
    const promoExtraMap = new Map(extraPromos.map((p) => [String(p._id), p]));

    for (const row of summaryRows) {
        const pid = row.promotionId;
        if (covered.has(pid) || safeNum(row.totalTokens) < 1) continue;
        const promo = promoExtraMap.get(pid);
        if (!promo || !promo._id) continue;

        const usd =
            safeNum(row.bidAmountUsd) >= 1
                ? safeNum(row.bidAmountUsd)
                : pricingToUsdCommission(null, 1);

        const promoEndsOk = promo.validUntil && new Date(promo.validUntil) >= now;
        out.push(
            toBidCard({
                id: `qr-${pid}`,
                promotionId: promo._id,
                promo,
                status: promoEndsOk ? 'active' : row.redeemed > 0 ? 'won' : 'expired',
                amountUsd: usd,
                bidHistory: [{ amount: usd, timestamp: (row.lastRedeemedAt && new Date(row.lastRedeemedAt)) || now }],
                createdAt: now,
                syntheticQrOnly: true,
            })
        );
        covered.add(pid);
    }

    out.sort((a, b) => {
        const ae = new Date(a.endDate).getTime();
        const be = new Date(b.endDate).getTime();
        if (ae !== be) return be - ae;
        return (b.currentBid || 0) - (a.currentBid || 0);
    });

    return out;
}

function buildRecentPromotionsFromSummary(summaryRows, promoIdToUsd) {
    const rows = [...summaryRows];
    rows.sort((a, b) => {
        const ta = (a.lastRedeemedAt && new Date(a.lastRedeemedAt).getTime()) || 0;
        const tb = (b.lastRedeemedAt && new Date(b.lastRedeemedAt).getTime()) || 0;
        if (tb !== ta) return tb - ta;
        return safeNum(b.redeemed) - safeNum(a.redeemed);
    });

    const top = rows.filter((r) => safeNum(r.redeemed) > 0 || safeNum(r.open) > 0).slice(0, 12);
    return top.map((r) => {
        const redeemed = safeNum(r.redeemed);
        const usdRate = promoIdToUsd.get(r.promotionId) ?? safeNum(r.bidAmountUsd) ?? 1;
        return {
            id: r.promotionId,
            brand: r.brand || '',
            title: r.title || 'Promoción',
            date: (r.lastRedeemedAt || r.validFrom || new Date().toISOString()).toString().split('T')[0],
            status: r.catalogActiveWindow ? 'active' : redeemed > 0 ? 'completed' : 'pending',
            earnings: Math.round(redeemed * usdRate * 100) / 100,
            couponCode: '',
            couponUsage: redeemed,
            totalSales: redeemed,
        };
    });
}

/**
 * Overrides para mergear en el JSON del influencer (GET por id/slug/me).
 */
async function buildPublicProfileFieldOverrides(influencerId, existingFrontend) {
    const idStr = String(influencerId || '').trim();
    const summaryPack = await buildInfluencerQrPromotionSummary(idStr);
    const rows = summaryPack.rows || [];
    const tokensOrphan = safeNum(summaryPack.tokensWithoutPromotionId);

    let totalTokensAll = tokensOrphan;
    let sumOpen = 0;
    let sumRedeemed = 0;
    /** @type {Map<string, number>} */
    const promoIdToUsd = new Map();

    let activePromotionsCount = 0;
    let completedPromotionsCount = 0;
    let totalEarningsUsd = 0;

    const now = new Date();
    const oid = mongoose.Types.ObjectId.isValid(idStr) ? new mongoose.Types.ObjectId(idStr) : null;

    const apps = oid
        ? await PromotionApplication.find({ influencerApplicant: oid, status: 'approved' }).populate('promotion').lean()
        : [];
    /** @type {Map<string, object>} */
    const approvedByPromo = new Map(
        apps
            .filter((a) => a.promotion && a.promotion._id)
            .map((a) => [String(a.promotion._id), a])
    );

    /** PromoIds ya contadas como “activa” desde filas QR */
    const countedActivePromoIds = new Set();

    for (const row of rows) {
        totalTokensAll += safeNum(row.totalTokens);
        sumOpen += safeNum(row.open);
        sumRedeemed += safeNum(row.redeemed);

        const redeemed = safeNum(row.redeemed);
        let usdCommission = safeNum(row.bidAmountUsd);
        if (usdCommission < 1) {
            const app = approvedByPromo.get(row.promotionId);
            usdCommission = pricingToUsdCommission(app?.pricing, row.bidAmountUsd);
        }
        promoIdToUsd.set(row.promotionId, usdCommission);

        if (redeemed > 0 && usdCommission >= 1) {
            totalEarningsUsd += redeemed * usdCommission;
        }

        const alive = !!row.catalogActiveWindow;
        const hasTokens = safeNum(row.open) + safeNum(row.redeemed) > 0;
        if (alive && hasTokens) {
            activePromotionsCount += 1;
            countedActivePromoIds.add(row.promotionId);
        }

        if (redeemed > 0 && !alive) {
            completedPromotionsCount += 1;
        }
    }

    for (const app of apps) {
        const pr = app.promotion;
        if (!pr || !pr._id) continue;
        const pid = String(pr._id);
        if (!countedActivePromoIds.has(pid) && promotionCatalogLive(pr, now)) {
            activePromotionsCount += 1;
            countedActivePromoIds.add(pid);
        }
    }

    const avgConversion =
        totalTokensAll > 0 ? Math.round((sumRedeemed / totalTokensAll) * 1000) / 10 : existingFrontend?.couponStats?.averageConversion ?? 0;

    const storedComplete = safeNum(existingFrontend?.completedPromotions);
    const storedActive = safeNum(existingFrontend?.activePromotions);
    const storedEarnings = safeNum(existingFrontend?.totalEarnings);
    const storedCouponStats = existingFrontend?.couponStats || {};

    /** Completadas: campañas con canjes pero ventana ya cerrada; siempre sumar campo manual guardado si es mayor */
    completedPromotionsCount = Math.max(storedComplete, completedPromotionsCount);

    /** Activas en catálogo con actividad o puja registrada — max con lo guardado en documento Influencer */
    activePromotionsCount = Math.max(storedActive, activePromotionsCount);

    totalEarningsUsd = Math.round(totalEarningsUsd * 100) / 100;
    const mergedEarnings = Math.max(storedEarnings, totalEarningsUsd);

    const mergedCouponStats = {
        totalCoupons: Math.max(safeNum(storedCouponStats.totalCoupons), totalTokensAll),
        activeCoupons: Math.max(safeNum(storedCouponStats.activeCoupons), sumOpen),
        totalSales: Math.max(safeNum(storedCouponStats.totalSales), sumRedeemed),
        totalCommission: Math.max(safeNum(storedCouponStats.totalCommission), totalEarningsUsd),
        averageConversion: avgConversion,
    };

    const storedRecent =
        Array.isArray(existingFrontend?.recentPromotions) && existingFrontend.recentPromotions.length > 0
            ? existingFrontend.recentPromotions
            : buildRecentPromotionsFromSummary(rows, promoIdToUsd);

    return {
        completedPromotions: completedPromotionsCount,
        activePromotions: activePromotionsCount,
        totalEarnings: mergedEarnings,
        couponStats: mergedCouponStats,
        recentPromotions: storedRecent,
    };
}

module.exports = {
    buildPublicInfluencerBidCards,
    buildPublicProfileFieldOverrides,
    pricingToUsdCommission,
};
