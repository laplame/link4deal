'use strict';

const mongoose = require('mongoose');
const DiscountQrToken = require('../models/DiscountQrToken');
const Promotion = require('../models/Promotion');
const { getValuePerCouponAndMaxEmissionAsync } = require('./promotionValueUsd');
const { matchPayloadInfluencerId } = require('./discountQrPayloadMatch');

function promotionKeyToString(pid) {
    if (pid === null || pid === undefined) return '';
    if (typeof pid === 'object' && pid && typeof pid.toHexString === 'function') {
        return pid.toHexString();
    }
    const s = String(pid).trim();
    return s;
}

/**
 * Suma económica LUXAE (unidad PSCS: 1 LUXAE ≈ 1 USD): por cada cupón QR canjeado,
 * cuenta redenciones por promoción y multiplica por valor USD por cupón (promotionalValueUsd o PSCS derivado async).
 */
/**
 * @param {{ influencerId?: string }} [opts]
 */
async function computeLuxaeUsdStatsFromRedemptions(opts = {}) {
    const influencerIdRaw = opts.influencerId != null ? String(opts.influencerId).trim() : '';
    let matchStage =
        /** @type {Record<string, unknown>} */ ({
            usedAt: { $exists: true, $ne: null, $type: 'date' },
        });
    const inf = matchPayloadInfluencerId(influencerIdRaw);
    if (inf) matchStage = { $and: [matchStage, inf] };

    const groups = await DiscountQrToken.aggregate([
        { $match: matchStage },
        { $group: { _id: '$payload.promotionId', redemptionCount: { $sum: 1 } } },
    ]);

    let missingPromotionFieldRedemptions = 0;
    let invalidPromotionIdRedemptions = 0;
    /** @type {{ idStr: string, redemptionCount: number }[]} */
    const buckets = [];

    for (const g of groups) {
        const idStr = promotionKeyToString(g._id);
        const c = Number(g.redemptionCount) || 0;
        if (!idStr) {
            missingPromotionFieldRedemptions += c;
            continue;
        }
        if (!mongoose.Types.ObjectId.isValid(idStr)) {
            invalidPromotionIdRedemptions += c;
            continue;
        }
        buckets.push({ idStr, redemptionCount: c });
    }

    const uniqueIds = [...new Set(buckets.map((b) => b.idStr))];
    const promotions = await Promotion.find({ _id: { $in: uniqueIds } })
        .select(
            'title brand promotionalValueUsd currency offerType originalPrice currentPrice discountPercentage cashbackValue totalQuantity',
        )
        .lean();

    const promoById = new Map(promotions.map((p) => [String(p._id), p]));

    /** @type {Record<string, any>[]} */
    const byPromotion = [];
    let totalUsdLuxae = 0;
    let totalRedemptionsAttributed = 0;
    let redemptionsPromotionNotFound = 0;
    let redemptionsValueUnknown = 0;

    for (const { idStr, redemptionCount } of buckets) {
        totalRedemptionsAttributed += redemptionCount;
        const promo = promoById.get(idStr);
        if (!promo) {
            redemptionsPromotionNotFound += redemptionCount;
            byPromotion.push({
                promotionId: idStr,
                title: null,
                brand: null,
                redemptionCount,
                luxaeUsd: 0,
                valuePerCouponUsd: null,
                promoMissing: true,
            });
            continue;
        }

        let perCouponUsd = null;
        if (promo.promotionalValueUsd != null && Number.isFinite(Number(promo.promotionalValueUsd))) {
            perCouponUsd = Number(promo.promotionalValueUsd);
        } else {
            const calc = await getValuePerCouponAndMaxEmissionAsync(promo);
            perCouponUsd = calc.valuePerCouponUsd;
        }

        if (perCouponUsd == null || !Number.isFinite(perCouponUsd) || perCouponUsd < 0) {
            redemptionsValueUnknown += redemptionCount;
            byPromotion.push({
                promotionId: idStr,
                title: promo.title ?? null,
                brand: promo.brand ?? null,
                redemptionCount,
                luxaeUsd: 0,
                valuePerCouponUsd: null,
                valueUnknown: true,
            });
            continue;
        }

        const luxaeUsd = Math.round(perCouponUsd * redemptionCount * 100) / 100;
        totalUsdLuxae += luxaeUsd;
        byPromotion.push({
            promotionId: idStr,
            title: promo.title ?? null,
            brand: promo.brand ?? null,
            redemptionCount,
            luxaeUsd,
            valuePerCouponUsd: Math.round(perCouponUsd * 100) / 100,
            derivedFromStoredField: promo.promotionalValueUsd != null,
        });
    }

    byPromotion.sort((a, b) => (Number(b.luxaeUsd) || 0) - (Number(a.luxaeUsd) || 0));

    const totalRedemptionsInDb = groups.reduce((s, g) => s + (Number(g.redemptionCount) || 0), 0);

    return {
        ok: true,
        /** USDLXE acumulado: sumatorio (redenciones × LUXAE/USD por cupón por promoción). */
        totalUsdLuxae: Math.round(totalUsdLuxae * 100) / 100,
        totalRedemptionsInDb,
        totalRedemptionsAttributed,
        currency: 'USD',
        byPromotion,
        exclusions: {
            missingPromotionFieldRedemptions,
            invalidPromotionIdRedemptions,
            redemptionsPromotionNotFound,
            redemptionsValueUnknown,
        },
        noteEs:
            'Solo cuenta cupones QR aún presentes en MongoDB. Si TTL borró registros antes de aplicar QR_REDEEM_RETENTION_DAYS, el total es menor que el histórico real.',
    };
}

module.exports = { computeLuxaeUsdStatsFromRedemptions };
