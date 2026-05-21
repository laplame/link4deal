'use strict';

/**
 * Métricas y tarjetas de “pujas” para el perfil público del influencer:
 * combina colección Bid, solicitudes aprobadas y actividad real de DiscountQrToken.
 */

const mongoose = require('mongoose');
const Bid = require('../models/Bid');
const DiscountQrToken = require('../models/DiscountQrToken');
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
 * Overrides para mergear en el JSON del influencer (perfil, listado marketplace).
 * @param {object[]} rows — filas tipo buildInfluencerQrPromotionSummary
 * @param {number} tokensOrphan — cupones sin promotionId
 * @param {object} existingFrontend — salida de toFrontendFormat
 * @param {object[]} [approvedApps] — PromotionApplication approved con promotion poblada
 */
function computePublicProfileFieldOverrides(rows, tokensOrphan, existingFrontend, approvedApps = []) {
    let totalTokensAll = safeNum(tokensOrphan);
    let sumOpen = 0;
    let sumRedeemed = 0;
    /** @type {Map<string, number>} */
    const promoIdToUsd = new Map();

    let activePromotionsCount = 0;
    let completedPromotionsCount = 0;
    let totalEarningsUsd = 0;

    const now = new Date();
    const apps = Array.isArray(approvedApps) ? approvedApps : [];
    /** @type {Map<string, object>} */
    const approvedByPromo = new Map(
        apps
            .filter((a) => a.promotion && a.promotion._id)
            .map((a) => [String(a.promotion._id), a]),
    );

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
        totalTokensAll > 0
            ? Math.round((sumRedeemed / totalTokensAll) * 1000) / 10
            : existingFrontend?.couponStats?.averageConversion ?? 0;

    const storedComplete = safeNum(existingFrontend?.completedPromotions);
    const storedActive = safeNum(existingFrontend?.activePromotions);
    const storedEarnings = safeNum(existingFrontend?.totalEarnings);
    const storedCouponStats = existingFrontend?.couponStats || {};

    completedPromotionsCount = Math.max(storedComplete, completedPromotionsCount);
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

    const fromQr = buildRecentPromotionsFromSummary(rows, promoIdToUsd);
    const storedRecent =
        Array.isArray(existingFrontend?.recentPromotions) && existingFrontend.recentPromotions.length > 0
            ? existingFrontend.recentPromotions
            : [];
    const recentPromotions = fromQr.length > 0 ? fromQr : storedRecent;

    return {
        completedPromotions: completedPromotionsCount,
        activePromotions: activePromotionsCount,
        totalEarnings: mergedEarnings,
        couponStats: mergedCouponStats,
        recentPromotions,
        /** Canjes QR reales (para badges en listado). */
        redeemedCoupons: sumRedeemed,
    };
}

/**
 * Overrides para mergear en el JSON del influencer (GET por id/slug/me).
 */
async function buildPublicProfileFieldOverrides(influencerId, existingFrontend) {
    const idStr = String(influencerId || '').trim();
    const summaryPack = await buildInfluencerQrPromotionSummary(idStr);
    const rows = summaryPack.rows || [];
    const tokensOrphan = safeNum(summaryPack.tokensWithoutPromotionId);

    const oid = mongoose.Types.ObjectId.isValid(idStr) ? new mongoose.Types.ObjectId(idStr) : null;
    const apps = oid
        ? await PromotionApplication.find({ influencerApplicant: oid, status: 'approved' }).populate('promotion').lean()
        : [];

    return computePublicProfileFieldOverrides(rows, tokensOrphan, existingFrontend, apps);
}

/**
 * Construye filas de resumen QR para un influencer a partir de grupos agregados + pujas.
 */
function buildSummaryRowsFromQrGroups(qrGroups, promoMap, bidDocs, now = new Date()) {
    const cleanGroups = qrGroups.filter((g) => g.promoKey !== '__none__');
    const noneRow = qrGroups.find((g) => g.promoKey === '__none__');
    const tokenPromoIds = new Set(cleanGroups.map((g) => g.promoKey));
    /** @type {object[]} */
    const rows = [];

    for (const g of cleanGroups) {
        const pid = g.promoKey;
        const pdoc = promoMap.get(pid);
        const bid = (bidDocs || []).find((b) => b.promotion && String(b.promotion._id) === pid);
        rows.push({
            promotionId: pid,
            title: pdoc?.title ?? null,
            brand: pdoc?.brand ?? null,
            validFrom: pdoc?.validFrom ? new Date(pdoc.validFrom).toISOString() : null,
            validUntil: pdoc?.validUntil ? new Date(pdoc.validUntil).toISOString() : null,
            catalogActiveWindow: promotionCatalogLive(pdoc, now),
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

    for (const b of bidDocs || []) {
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
            catalogActiveWindow: promotionCatalogLive(pr, now),
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

    return {
        rows,
        tokensWithoutPromotionId: noneRow ? noneRow.open + noneRow.redeemed + noneRow.expiredUnused : 0,
    };
}

function bidPromotionVisibleOnProfile(bidPromotion, now) {
    if (!bidPromotion || bidPromotion.validUntil == null) return false;
    if (new Date(bidPromotion.validUntil).getTime() < now.getTime()) return false;
    const vf = bidPromotion.validFrom ? new Date(bidPromotion.validFrom).getTime() : now.getTime();
    return vf <= now.getTime();
}

/**
 * Enriquecimiento en lote para GET /api/influencers (marketplace).
 * @param {string[]} influencerIds
 * @returns {Promise<Map<string, object>>}
 */
async function buildMarketplaceListEnrichmentMap(influencerIds) {
    const map = new Map();
    const ids = [...new Set((influencerIds || []).map((id) => String(id).trim()).filter((id) => mongoose.Types.ObjectId.isValid(id)))];
    if (!ids.length) return map;

    const now = new Date();
    const oids = ids.map((id) => new mongoose.Types.ObjectId(id));

    const agg = await DiscountQrToken.aggregate([
        {
            $match: {
                $or: [{ 'payload.influencerId': { $in: ids } }, { 'payload.influencerId': { $in: oids } }],
            },
        },
        {
            $addFields: {
                infKey: { $toString: '$payload.influencerId' },
                promoRaw: '$payload.promotionId',
                hasUsed: {
                    $and: [{ $ne: ['$usedAt', null] }, { $eq: [{ $type: '$usedAt' }, 'date'] }],
                },
            },
        },
        {
            $addFields: {
                promoKey: {
                    $cond: [
                        { $or: [{ $eq: ['$promoRaw', null] }, { $eq: ['$promoRaw', ''] }] },
                        '__none__',
                        { $toString: '$promoRaw' },
                    ],
                },
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
                _id: { influencerId: '$infKey', promoKey: '$promoKey' },
                redeemed: { $sum: { $cond: [{ $eq: ['$state', 'redeemed'] }, 1, 0] } },
                open: { $sum: { $cond: [{ $eq: ['$state', 'open'] }, 1, 0] } },
                expiredUnused: { $sum: { $cond: [{ $eq: ['$state', 'expired_unused'] }, 1, 0] } },
                lastRedeemedAt: { $max: '$usedAt' },
            },
        },
    ]);

    /** @type {Map<string, { promoKey: string, open: number, redeemed: number, expiredUnused: number, lastRedeemedAt?: Date }[]>} */
    const qrByInf = new Map();
    /** @type {Set<string>} */
    const promoIdSet = new Set();

    for (const g of agg) {
        const infId = g._id?.influencerId;
        const promoKey = g._id?.promoKey;
        if (!infId || !ids.includes(infId)) continue;
        if (!qrByInf.has(infId)) qrByInf.set(infId, []);
        const entry = {
            promoKey,
            open: safeNum(g.open),
            redeemed: safeNum(g.redeemed),
            expiredUnused: safeNum(g.expiredUnused),
            lastRedeemedAt: g.lastRedeemedAt,
        };
        qrByInf.get(infId).push(entry);
        if (promoKey && promoKey !== '__none__' && mongoose.Types.ObjectId.isValid(promoKey)) {
            promoIdSet.add(promoKey);
        }
    }

    const promoOids = [...promoIdSet].map((id) => new mongoose.Types.ObjectId(id));
    const promoDocs = promoOids.length
        ? await Promotion.find({ _id: { $in: promoOids } })
              .select('title brand validFrom validUntil status')
              .lean()
        : [];
    const promoMap = new Map(promoDocs.map((p) => [String(p._id), p]));

    const allBids = await Bid.find({ influencer: { $in: ids } })
        .populate('promotion', 'title brand validFrom validUntil status')
        .lean();
    /** @type {Map<string, object[]>} */
    const bidsByInf = new Map();
    for (const b of allBids) {
        const k = String(b.influencer || '');
        if (!k) continue;
        if (!bidsByInf.has(k)) bidsByInf.set(k, []);
        bidsByInf.get(k).push(b);
    }

    const allApps = await PromotionApplication.find({
        influencerApplicant: { $in: oids },
        status: 'approved',
    })
        .populate('promotion')
        .lean();
    /** @type {Map<string, object[]>} */
    const appsByInf = new Map();
    for (const a of allApps) {
        const k = String(a.influencerApplicant || '');
        if (!k) continue;
        if (!appsByInf.has(k)) appsByInf.set(k, []);
        appsByInf.get(k).push(a);
    }

    for (const id of ids) {
        const pack = buildSummaryRowsFromQrGroups(qrByInf.get(id) || [], promoMap, bidsByInf.get(id) || [], now);
        map.set(id, {
            rows: pack.rows,
            tokensWithoutPromotionId: pack.tokensWithoutPromotionId,
            apps: appsByInf.get(id) || [],
        });
    }

    return map;
}

module.exports = {
    buildPublicInfluencerBidCards,
    buildPublicProfileFieldOverrides,
    buildMarketplaceListEnrichmentMap,
    computePublicProfileFieldOverrides,
    pricingToUsdCommission,
};
