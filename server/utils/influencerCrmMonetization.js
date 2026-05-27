'use strict';

const InfluencerCrmMonetization = require('../models/InfluencerCrmMonetization');
const InfluencerCrmOutreach = require('../models/InfluencerCrmOutreach');

/** Etapas del tablero de monetización (izquierda → derecha). */
const MONETIZATION_STAGE_ORDER = [
    'ready',
    'wallet_setup',
    'seeking_campaigns',
    'coupons_live',
    'first_redemption',
    'payout_pending',
    'payout_active',
    'scaling',
    'stalled',
    'inactive',
];

const MONETIZATION_LABELS = {
    ready: 'Listo para monetizar',
    wallet_setup: 'Wallet / cuenta',
    seeking_campaigns: 'Buscando campañas',
    coupons_live: 'Cupones activos',
    first_redemption: 'Primer canje',
    payout_pending: 'Abono pendiente',
    payout_active: 'Abonos realizados',
    scaling: 'Escalando ingresos',
    stalled: 'Estancado',
    inactive: 'Inactivo monetización',
};

/** Outreach completado → elegible para tablero monetización. */
const OUTREACH_COMPLETE_STAGES = new Set(['onboarded', 'materials_complete']);

function isValidMonetizationStage(stage) {
    return MONETIZATION_STAGE_ORDER.includes(String(stage || '').trim());
}

function defaultMonetizationPayload(influencerId) {
    return {
        influencerId,
        monetizationStage: 'ready',
        nextAction: '',
        notes: '',
    };
}

function serializeMonetization(doc) {
    if (!doc) return null;
    const d = doc.toObject ? doc.toObject() : doc;
    const stage = d.monetizationStage || 'ready';
    return {
        id: String(d._id),
        influencerId: String(d.influencerId),
        monetizationStage: stage,
        monetizationStageLabel: MONETIZATION_LABELS[stage] || stage,
        nextAction: d.nextAction || '',
        notes: d.notes || '',
        updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : null,
    };
}

async function getOrCreateMonetization(influencerId) {
    let doc = await InfluencerCrmMonetization.findOne({ influencerId }).exec();
    if (!doc) {
        doc = await InfluencerCrmMonetization.create(defaultMonetizationPayload(influencerId));
    }
    return doc;
}

/**
 * ¿Puede aparecer en el tablero de monetización?
 * — outreach en onboarded/materials_complete, o documento monetización ya creado.
 */
async function isEligibleForMonetizationBoard(influencerId, outreachStage = null) {
    if (outreachStage && OUTREACH_COMPLETE_STAGES.has(outreachStage)) return true;
    const existing = await InfluencerCrmMonetization.exists({ influencerId });
    return Boolean(existing);
}

async function filterEligibleInfluencerIds(influencerIds) {
    if (!influencerIds.length) return new Set();
    const oids = influencerIds;
    const [outreachRows, monetizationRows] = await Promise.all([
        InfluencerCrmOutreach.find({
            influencerId: { $in: oids },
            pipelineStage: { $in: [...OUTREACH_COMPLETE_STAGES] },
        })
            .select('influencerId')
            .lean(),
        InfluencerCrmMonetization.find({ influencerId: { $in: oids } })
            .select('influencerId')
            .lean(),
    ]);
    const eligible = new Set();
    for (const o of outreachRows) eligible.add(String(o.influencerId));
    for (const m of monetizationRows) eligible.add(String(m.influencerId));
    return eligible;
}

module.exports = {
    MONETIZATION_STAGE_ORDER,
    MONETIZATION_LABELS,
    OUTREACH_COMPLETE_STAGES,
    isValidMonetizationStage,
    getOrCreateMonetization,
    serializeMonetization,
    isEligibleForMonetizationBoard,
    filterEligibleInfluencerIds,
};
