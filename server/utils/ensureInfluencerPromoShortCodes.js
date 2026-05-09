'use strict';

/**
 * Crear filas en `influencer_promo_short_codes` según datos ya existentes (pujas, aplicaciones aprobadas, etc.)
 * y/o promociones pasadas explícitamente o por variable de entorno.
 *
 * @see docs/APP_SHORT_PROMO_CODES.md — `AUTO_NEW_INFLUENCER_PROMO_SHORT_CODE_PROMOTION_IDS`
 */

const mongoose = require('mongoose');
const Bid = require('../models/Bid');
const PromotionApplication = require('../models/PromotionApplication');
const DiscountQrToken = require('../models/DiscountQrToken');
const Influencer = require('../models/Influencer');
const InfluencerPromoShortCode = require('../models/InfluencerPromoShortCode');
const Promotion = require('../models/Promotion');
const { createRegistryEntry } = require('./influencerPromoShortCodes');

const INFLUENCER_GENERAL_USERNAME = 'influencer-general';

/** Parsea lista de ObjectId desde CSV en env */
function parsePromotionIdsFromEnv(raw) {
    if (!raw || !String(raw).trim()) return [];
    return String(raw)
        .split(',')
        .map((s) => s.trim())
        .filter((s) => mongoose.Types.ObjectId.isValid(s));
}

/**
 * IDs de promoción relacionados con el influencer en la BD (histórico).
 * @param {string} influencerIdStr
 */
async function collectPromotionIdsForInfluencer(influencerIdStr) {
    const set = new Set();
    let oid = null;
    try {
        oid = new mongoose.Types.ObjectId(influencerIdStr);
    } catch {
        return [];
    }

    const bidRows = await Bid.find({ influencer: oid }).select('promotion').lean();
    for (const b of bidRows) {
        if (b.promotion) set.add(String(b.promotion));
    }

    const apps = await PromotionApplication.find({
        influencerApplicant: oid,
        status: 'approved',
    })
        .select('promotion')
        .lean();
    for (const a of apps) {
        if (a.promotion) set.add(String(a.promotion));
    }

    const inf = await Influencer.findById(oid).select('recentPromotions').lean();
    if (inf?.recentPromotions?.length) {
        for (const p of inf.recentPromotions) {
            const raw = p.id != null ? p.id : p._id;
            if (raw != null && mongoose.Types.ObjectId.isValid(String(raw))) {
                set.add(String(raw));
            }
        }
    }

    const tokenAgg = await DiscountQrToken.aggregate([
        {
            $match: {
                $or: [{ 'payload.influencerId': influencerIdStr }, { 'payload.influencerId': oid }],
                payload: { $exists: true },
                'payload.promotionId': { $exists: true, $nin: [null, ''] },
            },
        },
        { $group: { _id: '$payload.promotionId' } },
    ]);
    for (const row of tokenAgg) {
        const pid = row._id;
        if (pid != null && mongoose.Types.ObjectId.isValid(String(pid))) set.add(String(pid));
    }

    return [...set];
}

/** Promotions que ya tienen código corto para este influencer. */
async function existingPromotionIdsForInfluencer(influencerIdStr) {
    const rows = await InfluencerPromoShortCode.find({
        influencer: influencerIdStr,
    })
        .select('promotion')
        .lean();
    const s = new Set();
    for (const r of rows) {
        if (r.promotion) s.add(String(r.promotion));
    }
    return s;
}

async function buildAutoLabelForPromotion(promotionIdStr) {
    const p = await Promotion.findById(promotionIdStr).select('title brand').lean();
    if (!p) return '';
    const parts = [p.brand, p.title].filter(Boolean);
    return parts.length ? `[auto] ${parts.join(' — ')}`.slice(0, 200) : '';
}

/**
 * Inserta códigos faltantes (influencer + promoción) sin lanzar si falla un par.
 *
 * @param {string} influencerIdStr
 * @param {{
 *   extraPromotionIds?: string[],
 *   includeEnvDefaults?: boolean,
 * }} [options]
 * @returns {Promise<{ created: number, skippedExisting: number, errors: number }>}
 */
async function ensurePromoShortCodesForInfluencer(influencerIdStr, options = {}) {
    const extra = Array.isArray(options.extraPromotionIds) ? options.extraPromotionIds : [];
    const includeEnvDefaults = options.includeEnvDefaults === true;
    let created = 0;
    let skippedExisting = 0;
    let errors = 0;

    if (!mongoose.Types.ObjectId.isValid(influencerIdStr)) {
        return { created: 0, skippedExisting: 0, errors: 0 };
    }

    const inf = await Influencer.findById(influencerIdStr).select('username').lean();
    if (!inf || inf.username === INFLUENCER_GENERAL_USERNAME) {
        return { created: 0, skippedExisting: 0, errors: 0 };
    }

    const candidateSet = new Set(await collectPromotionIdsForInfluencer(influencerIdStr));

    for (const id of extra) {
        if (id != null && mongoose.Types.ObjectId.isValid(String(id).trim())) {
            candidateSet.add(String(id).trim());
        }
    }

    if (includeEnvDefaults) {
        const fromEnv = parsePromotionIdsFromEnv(process.env.AUTO_NEW_INFLUENCER_PROMO_SHORT_CODE_PROMOTION_IDS);
        for (const pid of fromEnv) {
            candidateSet.add(pid);
        }
    }

    const already = await existingPromotionIdsForInfluencer(influencerIdStr);

    for (const promoId of candidateSet) {
        if (already.has(promoId)) {
            skippedExisting++;
            continue;
        }
        try {
            const label = await buildAutoLabelForPromotion(promoId);
            await createRegistryEntry({
                influencerId: influencerIdStr,
                promotionId: promoId,
                label: label || undefined,
            });
            created++;
            already.add(promoId);
        } catch (e) {
            errors++;
            console.warn(`[ensurePromoShortCodes] influencer=${influencerIdStr} promotion=${promoId}: ${e.message}`);
        }
    }

    return { created, skippedExisting, errors };
}

/**
 * Ejecuta `ensurePromoShortCodesForInfluencer` en la siguiente iteración del event loop (no bloquea la respuesta HTTP).
 */
function queueEnsurePromoShortCodesForInfluencer(influencerIdStr, options = {}) {
    setImmediate(() => {
        ensurePromoShortCodesForInfluencer(influencerIdStr, options).catch((e) => {
            console.warn('[ensurePromoShortCodes] queue:', e.message);
        });
    });
}

module.exports = {
    parsePromotionIdsFromEnv,
    collectPromotionIdsForInfluencer,
    existingPromotionIdsForInfluencer,
    buildAutoLabelForPromotion,
    ensurePromoShortCodesForInfluencer,
    queueEnsurePromoShortCodesForInfluencer,
};
