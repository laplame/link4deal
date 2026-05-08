'use strict';

const DiscountQrToken = require('../models/DiscountQrToken');

/**
 * KPIs POS (verify/scaneo) vs canje sobre DiscountQrToken, con mismo criterio de filtro que /coupons/dashboard.
 * "Visto" = existe lastVerifiedAt (fecha) tras POST/GET verify en tienda.
 *
 * @param {Record<string, unknown>} filter Mongo find filter para DiscountQrToken.find / aggregate match
 */
async function computeVerifyVsRedeemStats(filter = {}) {
    const anchorDate = new Date();
    /** @type {import('mongoose').PipelineStage[]} */
    const pipe = [
        { $match: filter },
        {
            $addFields: {
                _isRedeemed: {
                    $cond: [
                        {
                            $and: [
                                { $ne: ['$usedAt', null] },
                                { $eq: [{ $type: '$usedAt' }, 'date'] },
                            ],
                        },
                        true,
                        false,
                    ],
                },
                _hasVerify: {
                    $cond: [
                        {
                            $and: [
                                { $ne: ['$lastVerifiedAt', null] },
                                { $eq: [{ $type: '$lastVerifiedAt' }, 'date'] },
                            ],
                        },
                        true,
                        false,
                    ],
                },
            },
        },
        {
            $addFields: {
                _priorPosViewThenRedeem: {
                    $cond: [
                        {
                            $and: [
                                { $eq: ['$_isRedeemed', true] },
                                { $eq: ['$_hasVerify', true] },
                                { $lte: ['$lastVerifiedAt', '$usedAt'] },
                            ],
                        },
                        true,
                        false,
                    ],
                },
                _isExpiredUnused: {
                    $cond: [
                        {
                            $and: [
                                { $eq: ['$_isRedeemed', false] },
                                {
                                    $and: [{ $ne: ['$expiresAt', null] }, { $lte: ['$expiresAt', anchorDate] }],
                                },
                            ],
                        },
                        true,
                        false,
                    ],
                },
            },
        },
        {
            $addFields: {
                _isOpen: {
                    $cond: [{ $eq: ['$_isRedeemed', true] }, false, { $eq: ['$_isExpiredUnused', false] }],
                },
            },
        },
        {
            $addFields: {
                _openWithVerify: {
                    $cond: [{ $and: [{ $eq: ['$_isOpen', true] }, { $eq: ['$_hasVerify', true] }] }, true, false],
                },
                _openNoVerify: {
                    $cond: [{ $and: [{ $eq: ['$_isOpen', true] }, { $eq: ['$_hasVerify', false] }] }, true, false],
                },
                _expWithVerifyUnused: {
                    $cond: [
                        { $and: [{ $eq: ['$_isExpiredUnused', true] }, { $eq: ['$_hasVerify', true] }] },
                        true,
                        false,
                    ],
                },
                _expNoVerifyUnused: {
                    $cond: [
                        { $and: [{ $eq: ['$_isExpiredUnused', true] }, { $eq: ['$_hasVerify', false] }] },
                        true,
                        false,
                    ],
                },
                _redeemNoRecordedPriorView: {
                    $cond: [
                        {
                            $and: [
                                { $eq: ['$_isRedeemed', true] },
                                {
                                    $or: [
                                        { $eq: ['$_hasVerify', false] },
                                        { $gt: ['$lastVerifiedAt', '$usedAt'] },
                                    ],
                                },
                            ],
                        },
                        true,
                        false,
                    ],
                },
            },
        },
        {
            $group: {
                _id: null,
                matchingCoupons: { $sum: 1 },
                redeemedTotal: { $sum: { $cond: ['$_isRedeemed', 1, 0] } },
                openTotal: { $sum: { $cond: ['$_isOpen', 1, 0] } },
                expiredUnusedTotal: { $sum: { $cond: ['$_isExpiredUnused', 1, 0] } },
                everHadPosVerify: { $sum: { $cond: ['$_hasVerify', 1, 0] } },
                redeemedWithPriorPosView: { $sum: { $cond: ['$_priorPosViewThenRedeem', 1, 0] } },
                redeemedNoPriorPosRecorded: { $sum: { $cond: ['$_redeemNoRecordedPriorView', 1, 0] } },
                openWithVerifyNotRedeem: { $sum: { $cond: ['$_openWithVerify', 1, 0] } },
                openNeverShownPos: { $sum: { $cond: ['$_openNoVerify', 1, 0] } },
                expiredHadVerifyUnused: { $sum: { $cond: ['$_expWithVerifyUnused', 1, 0] } },
                expiredNeverHadVerifyUnused: { $sum: { $cond: ['$_expNoVerifyUnused', 1, 0] } },
            },
        },
    ];

    const rows = await DiscountQrToken.aggregate(pipe).allowDiskUse(true);
    const g = rows[0] || {
        matchingCoupons: 0,
        redeemedTotal: 0,
        openTotal: 0,
        expiredUnusedTotal: 0,
        everHadPosVerify: 0,
        redeemedWithPriorPosView: 0,
        redeemedNoPriorPosRecorded: 0,
        openWithVerifyNotRedeem: 0,
        openNeverShownPos: 0,
        expiredHadVerifyUnused: 0,
        expiredNeverHadVerifyUnused: 0,
    };

    const N = Number(g.matchingCoupons) || 0;
    const R = Number(g.redeemedTotal) || 0;
    const V = Number(g.everHadPosVerify) || 0;
    const Rpv = Number(g.redeemedWithPriorPosView) || 0;

    const pct = (num, den) => (den > 0 ? Math.round(((Number(num) || 0) / den) * 1000) / 10 : null);

    return {
        generatedAt: anchorDate.toISOString(),
        noteEs:
            '"Visto" cuenta cupones con fecha lastVerifiedAt (endpoint verify en POS). ' +
            'El canje puede ocurrir sin verify previo según integración Bizne/App. TTL en expiresAt puede borrar cupones antiguos.',
        totals: {
            matchingCoupons: N,
            redeemed: R,
            open: Number(g.openTotal) || 0,
            expiredUnused: Number(g.expiredUnusedTotal) || 0,
            everHadPosVerify: V,
        },
        breakdown: {
            redeemedWithPriorPosView: Rpv,
            redeemedNoPriorPosRecorded: Number(g.redeemedNoPriorPosRecorded) || 0,
            openWithVerifyNotRedeem: Number(g.openWithVerifyNotRedeem) || 0,
            openNeverShownPos: Number(g.openNeverShownPos) || 0,
            expiredHadVerifyUnused: Number(g.expiredHadVerifyUnused) || 0,
            expiredNeverHadVerifyUnused: Number(g.expiredNeverHadVerifyUnused) || 0,
        },
        rates: {
            /** De los canjeados: % que tenían verify <= canje */
            pctRedemptionsWithPriorPosView: pct(Rpv, R),
            /** Cupones tocados POS que terminaron canjeados con orden correcto (respecto todos con verify) — orientativo */
            pctOfVerifiedCouponsEndingRedeemedWithOrderedView: pct(Rpv, V),
            pctEverVerifiedAmongAllMatching: pct(V, N),
        },
    };
}

module.exports = { computeVerifyVsRedeemStats };
