'use strict';

const mongoose = require('mongoose');
const PromotionApplication = require('../models/PromotionApplication');

/**
 * Solicitudes pendientes por influencer (para tableros CRM).
 * @param {string[]} influencerIds
 * @param {{ maxPerInfluencer?: number }} [opts]
 * @returns {Promise<Map<string, Array<{ id: string, promotionTitle: string, redirectInsteadOfQr: boolean, createdAt: string|null }>>>}
 */
async function buildPendingApplicationsMap(influencerIds, opts = {}) {
    const maxPer = Math.min(20, Math.max(1, opts.maxPerInfluencer ?? 8));
    const oids = influencerIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
    const map = new Map();
    if (!oids.length) return map;

    const apps = await PromotionApplication.find({
        influencerApplicant: { $in: oids },
        status: 'pending',
    })
        .populate('promotion', 'title brand redirectInsteadOfQr')
        .sort({ createdAt: -1 })
        .limit(oids.length * maxPer)
        .lean();

    for (const a of apps) {
        const infId = String(a.influencerApplicant);
        if (!map.has(infId)) map.set(infId, []);
        const list = map.get(infId);
        if (list.length >= maxPer) continue;
        const pr = a.promotion;
        list.push({
            id: String(a._id),
            promotionTitle: (pr && (pr.title || pr.brand)) || 'Promoción',
            redirectInsteadOfQr: Boolean(pr && pr.redirectInsteadOfQr),
            createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : null,
        });
    }
    return map;
}

function pendingFieldsForCard(pendingMap, influencerId) {
    const pendingApplications = pendingMap.get(String(influencerId)) || [];
    return {
        pendingApplications,
        pendingApplicationCount: pendingApplications.length,
    };
}

module.exports = {
    buildPendingApplicationsMap,
    pendingFieldsForCard,
};
