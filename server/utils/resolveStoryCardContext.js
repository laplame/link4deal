'use strict';

const mongoose = require('mongoose');
const Influencer = require('../models/Influencer');
const InfluencerPromoShortCode = require('../models/InfluencerPromoShortCode');
const Promotion = require('../models/Promotion');
const { normalizeIncomingCode } = require('./influencerPromoShortCodes');

const PROMOTION_SELECT =
    'title brand discountPercentage originalPrice currentPrice currency status image';

/**
 * Resuelve promoción + código a pintar en la story (fila promo o perfil + promotionId).
 * @param {string} influencerId
 * @param {{ shortCodeRaw?: string, promotionId?: string }} input
 */
async function resolveStoryCardContext(influencerId, input = {}) {
    const inf = await Influencer.findById(influencerId)
        .select('name username profileShortCode')
        .lean();
    if (!inf) {
        const e = new Error('Influencer no encontrado');
        e.status = 404;
        throw e;
    }

    const promotionId = String(input.promotionId || '').trim();
    const normalizedShort =
        input.shortCodeRaw != null && String(input.shortCodeRaw).trim() !== ''
            ? normalizeIncomingCode(input.shortCodeRaw)
            : '';

    const profileCode =
        inf.profileShortCode && String(inf.profileShortCode).trim()
            ? normalizeIncomingCode(inf.profileShortCode)
            : '';

    let row = null;

    if (normalizedShort) {
        row = await InfluencerPromoShortCode.findOne({
            influencer: influencerId,
            code: normalizedShort,
            active: true,
        })
            .populate('promotion', PROMOTION_SELECT)
            .lean();
    }

    if (!row && promotionId && mongoose.Types.ObjectId.isValid(promotionId)) {
        row = await InfluencerPromoShortCode.findOne({
            influencer: influencerId,
            promotion: promotionId,
            active: true,
        })
            .populate('promotion', PROMOTION_SELECT)
            .lean();
    }

    if (row?.promotion?._id) {
        return {
            code: row.code,
            referralPrefix: row.referralPrefix || 'L4D',
            promotion: row.promotion,
            synthetic: false,
        };
    }

    let promo = null;
    if (promotionId && mongoose.Types.ObjectId.isValid(promotionId)) {
        promo = await Promotion.findById(promotionId).select(PROMOTION_SELECT).lean();
    }
    if (!promo) {
        const defPid = String(process.env.INFLUENCER_PROFILE_SHORT_CODE_DEFAULT_PROMOTION_ID || '').trim();
        if (mongoose.Types.ObjectId.isValid(defPid)) {
            promo = await Promotion.findById(defPid).select(PROMOTION_SELECT).lean();
        }
    }
    if (!promo) {
        const fallbackRows = await InfluencerPromoShortCode.find({
            influencer: influencerId,
            active: true,
        })
            .populate('promotion', PROMOTION_SELECT)
            .sort({ code: 1 })
            .limit(1)
            .lean();
        const fallbackRow = fallbackRows[0] || null;
        if (fallbackRow?.promotion?._id) {
            return {
                code: fallbackRow.code,
                referralPrefix: fallbackRow.referralPrefix || 'L4D',
                promotion: fallbackRow.promotion,
                synthetic: false,
            };
        }
    }

    if (promo && promo._id) {
        const codeForImage = normalizedShort || profileCode;
        if (!codeForImage) {
            const e = new Error(
                'No hay código corto para la imagen. Asigna profileShortCode o ejecuta backfill de códigos promo.',
            );
            e.status = 400;
            e.code = 'NO_SHORT_CODE';
            throw e;
        }
        return {
            code: codeForImage,
            referralPrefix: 'L4D',
            promotion: promo,
            synthetic: true,
        };
    }

    const e = new Error('Campaña o código corto no encontrado para tu perfil');
    e.status = 404;
    e.code = 'CAMPAIGN_NOT_FOUND';
    throw e;
}

module.exports = { resolveStoryCardContext };
