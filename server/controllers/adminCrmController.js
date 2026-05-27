'use strict';

const mongoose = require('mongoose');
const Influencer = require('../models/Influencer');
const InfluencerCrmEvent = require('../models/InfluencerCrmEvent');
const {
    ACTIVATION_STATUSES,
    DATA_SUBMISSION_STATUSES,
    buildCrmInfluencerRow,
    aggregateInstallCountsByInfluencer,
    buildMarketplaceListEnrichmentMap,
    computeProfileCompleteness,
    deriveDataSubmissionStatus,
    defaultCrm,
} = require('../utils/influencerCrm');
const InfluencerCrmOutreach = require('../models/InfluencerCrmOutreach');
const {
    serializeOutreach,
    getOrCreateOutreach,
    PIPELINE_LABELS,
    PIPELINE_STAGE_ORDER,
    isValidPipelineStage,
} = require('../utils/influencerCrmOutreach');
const InfluencerCrmMonetization = require('../models/InfluencerCrmMonetization');
const {
    MONETIZATION_STAGE_ORDER,
    MONETIZATION_LABELS,
    OUTREACH_COMPLETE_STAGES,
    isValidMonetizationStage,
    getOrCreateMonetization,
    serializeMonetization,
} = require('../utils/influencerCrmMonetization');
const { aggregateSettlementSummariesForInfluencers } = require('../utils/influencerTokenSettlement');
const {
    buildLiveActivityBatch,
    buildLiveActivityForInfluencer,
    enrichLiveActivityWithCrmRow,
} = require('../utils/influencerCrmLiveActivity');
const {
    IDENTITY_VERIFICATION_STATUSES,
    IDENTITY_LABELS_ES,
    normalizeIdentityVerificationStatus,
} = require('../utils/influencerIdentity');

const INFLUENCER_GENERAL_USERNAME = 'influencer-general';

/** Filtros compartidos entre listado CRM y tablero de fichas. */
function buildCrmListMongoQuery(queryParams = {}) {
    const query = { username: { $ne: INFLUENCER_GENERAL_USERNAME } };

    if (queryParams.status) query.status = String(queryParams.status);
    if (queryParams.activationStatus) {
        query['crm.activationStatus'] = String(queryParams.activationStatus);
    }
    if (queryParams.dataSubmissionStatus) {
        query['crm.dataSubmissionStatus'] = String(queryParams.dataSubmissionStatus);
    }
    if (queryParams.identityVerificationStatus) {
        const iv = normalizeIdentityVerificationStatus(queryParams.identityVerificationStatus);
        if (IDENTITY_VERIFICATION_STATUSES.includes(iv)) {
            query.identityVerificationStatus = iv;
        }
    }
    if (queryParams.hasVerificationScreenshot === 'true') {
        query['crm.verification.screenshotUrl'] = { $exists: true, $ne: '' };
    }
    if (queryParams.termsAccepted === 'true') query['crm.terms.accepted'] = true;
    if (queryParams.termsAccepted === 'false') query['crm.terms.accepted'] = { $ne: true };

    if (queryParams.app === 'damecodigo') {
        query['crm.apps.damecodigoInfluencer.installCount'] = { $gt: 0 };
    }
    if (queryParams.app === 'bizneai') {
        query['crm.apps.bizneaiMerchant.installCount'] = { $gt: 0 };
    }
    if (queryParams.app === 'both') {
        query['crm.apps.damecodigoInfluencer.installCount'] = { $gt: 0 };
        query['crm.apps.bizneaiMerchant.installCount'] = { $gt: 0 };
    }
    if (queryParams.app === 'none') {
        query.$and = [
            {
                $or: [
                    { 'crm.apps.damecodigoInfluencer.installCount': { $exists: false } },
                    { 'crm.apps.damecodigoInfluencer.installCount': null },
                    { 'crm.apps.damecodigoInfluencer.installCount': 0 },
                ],
            },
            {
                $or: [
                    { 'crm.apps.bizneaiMerchant.installCount': { $exists: false } },
                    { 'crm.apps.bizneaiMerchant.installCount': null },
                    { 'crm.apps.bizneaiMerchant.installCount': 0 },
                ],
            },
        ];
    }

    const search = (queryParams.search || '').trim();
    if (search) {
        const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        query.$or = [{ name: re }, { username: re }, { profileShortCode: re }, { bio: re }];
    }

    return query;
}

function parseCrmPagination(queryParams, defaultLimit = 50) {
    const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit, 10) || defaultLimit));
    return { page, limit, skip: (page - 1) * limit };
}

function buildPaginationMeta(page, limit, totalDocs) {
    const totalPages = Math.ceil(totalDocs / limit) || 1;
    return {
        page,
        limit,
        totalDocs,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
    };
}

/** Conteos por columna de activación (todos los influencers del filtro). */
async function aggregateActivationStageCounts(influencerQuery) {
    const rows = await Influencer.aggregate([
        { $match: influencerQuery },
        {
            $lookup: {
                from: 'influencer_crm_outreach',
                localField: '_id',
                foreignField: 'influencerId',
                as: 'outreach',
            },
        },
        {
            $project: {
                stageRaw: { $ifNull: [{ $arrayElemAt: ['$outreach.pipelineStage', 0] }, 'lead'] },
            },
        },
        { $group: { _id: '$stageRaw', count: { $sum: 1 } } },
    ]);
    const counts = Object.fromEntries(PIPELINE_STAGE_ORDER.map((s) => [s, 0]));
    for (const r of rows) {
        const s = isValidPipelineStage(r._id) ? r._id : 'lead';
        counts[s] = (counts[s] || 0) + r.count;
    }
    return counts;
}

/** Página de IDs elegibles para monetización + conteos por etapa. */
async function paginateMonetizationEligible(influencerQuery, skip, limit) {
    const completeStages = [...OUTREACH_COMPLETE_STAGES];
    const [facetResult] = await Influencer.aggregate([
        { $match: influencerQuery },
        {
            $lookup: {
                from: 'influencer_crm_outreach',
                localField: '_id',
                foreignField: 'influencerId',
                as: 'outreach',
            },
        },
        {
            $lookup: {
                from: 'influencer_crm_monetization',
                localField: '_id',
                foreignField: 'influencerId',
                as: 'monetization',
            },
        },
        {
            $match: {
                $or: [
                    { 'outreach.pipelineStage': { $in: completeStages } },
                    { $expr: { $gt: [{ $size: '$monetization' }, 0] } },
                ],
            },
        },
        { $sort: { updatedAt: -1 } },
        {
            $facet: {
                meta: [{ $count: 'total' }],
                stageCounts: [
                    {
                        $project: {
                            stageRaw: {
                                $ifNull: [
                                    { $arrayElemAt: ['$monetization.monetizationStage', 0] },
                                    'ready',
                                ],
                            },
                        },
                    },
                    { $group: { _id: '$stageRaw', count: { $sum: 1 } } },
                ],
                page: [{ $skip: skip }, { $limit: limit }, { $project: { _id: 1 } }],
            },
        },
    ]);

    const facet = facetResult || { meta: [], stageCounts: [], page: [] };
    const totalDocs = facet.meta[0]?.total || 0;
    const stageCounts = Object.fromEntries(MONETIZATION_STAGE_ORDER.map((s) => [s, 0]));
    for (const r of facet.stageCounts || []) {
        const s = isValidMonetizationStage(r._id) ? r._id : 'ready';
        stageCounts[s] = (stageCounts[s] || 0) + r.count;
    }
    const ids = (facet.page || []).map((x) => x._id);
    return { totalDocs, ids, stageCounts };
}

class AdminCrmController {
    isValidObjectId(id) {
        return mongoose.Types.ObjectId.isValid(id);
    }

    /** GET /api/admin/crm/stats */
    async getStats(req, res) {
        try {
            const baseQuery = { username: { $ne: INFLUENCER_GENERAL_USERNAME } };
            const [total, byStatus, termsAccepted, withUser, pendingIdentityVerification] =
                await Promise.all([
                    Influencer.countDocuments(baseQuery),
                    Influencer.aggregate([
                        { $match: baseQuery },
                        { $group: { _id: '$status', count: { $sum: 1 } } },
                    ]),
                    Influencer.countDocuments({ ...baseQuery, 'crm.terms.accepted': true }),
                    Influencer.countDocuments({ ...baseQuery, userId: { $ne: null } }),
                    Influencer.countDocuments({
                        ...baseQuery,
                        identityVerificationStatus: 'pending',
                        'crm.verification.screenshotUrl': { $exists: true, $ne: '' },
                    }),
                ]);

            const installAgg = await InfluencerCrmEvent.aggregate([
                { $match: { eventType: 'install' } },
                { $group: { _id: '$appKey', count: { $sum: 1 } } },
            ]);

            const installsByApp = {};
            installAgg.forEach((r) => {
                installsByApp[r._id || 'unknown'] = r.count;
            });

            const withDamecodigo = await Influencer.countDocuments({
                ...baseQuery,
                'crm.apps.damecodigoInfluencer.installCount': { $gt: 0 },
            });
            const withBizneai = await Influencer.countDocuments({
                ...baseQuery,
                'crm.apps.bizneaiMerchant.installCount': { $gt: 0 },
            });
            const withBoth = await Influencer.countDocuments({
                ...baseQuery,
                'crm.apps.damecodigoInfluencer.installCount': { $gt: 0 },
                'crm.apps.bizneaiMerchant.installCount': { $gt: 0 },
            });

            return res.json({
                success: true,
                data: {
                    totalInfluencers: total,
                    linkedToUser: withUser,
                    termsAccepted,
                    byInfluencerStatus: byStatus.reduce((acc, r) => {
                        acc[r._id || 'unknown'] = r.count;
                        return acc;
                    }, {}),
                    installsByApp,
                    withDamecodigoApp: withDamecodigo,
                    withBizneaiApp: withBizneai,
                    withBothApps: withBoth,
                    pendingIdentityVerification,
                },
            });
        } catch (error) {
            console.error('❌ CRM stats:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /** GET /api/admin/crm/influencers */
    async listInfluencers(req, res) {
        try {
            const page = Math.max(1, parseInt(req.query.page, 10) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
            const skip = (page - 1) * limit;

            const query = buildCrmListMongoQuery(req.query);

            const [docs, totalDocs] = await Promise.all([
                Influencer.find(query)
                    .sort({ updatedAt: -1, joinDate: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate(
                        'userId',
                        'firstName lastName email phone isVerified isActive blockchain.walletAddress',
                    )
                    .lean(),
                Influencer.countDocuments(query),
            ]);

            const ids = docs.map((d) => String(d._id));
            const oids = ids.map((id) => new mongoose.Types.ObjectId(id));
            const [enrichmentMap, installAgg, outreachDocs] = await Promise.all([
                buildMarketplaceListEnrichmentMap(ids),
                aggregateInstallCountsByInfluencer(ids),
                InfluencerCrmOutreach.find({ influencerId: { $in: oids } }).lean(),
            ]);
            const outreachMap = new Map(
                outreachDocs.map((o) => [String(o.influencerId), serializeOutreach(o)]),
            );

            const rows = await Promise.all(
                docs.map((d) =>
                    buildCrmInfluencerRow(
                        d,
                        enrichmentMap.get(String(d._id)),
                        installAgg,
                        outreachMap.get(String(d._id)) || null,
                    ),
                ),
            );

            const totalPages = Math.ceil(totalDocs / limit) || 1;

            return res.json({
                success: true,
                data: {
                    docs: rows,
                    totalDocs,
                    page,
                    limit,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1,
                },
                filters: {
                    activationStatuses: ACTIVATION_STATUSES,
                    dataSubmissionStatuses: DATA_SUBMISSION_STATUSES,
                    identityVerificationStatuses: IDENTITY_VERIFICATION_STATUSES,
                    identityVerificationLabels: IDENTITY_LABELS_ES,
                },
            });
        } catch (error) {
            console.error('❌ CRM list influencers:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /** GET /api/admin/crm/influencers/:id */
    async getInfluencerDetail(req, res) {
        try {
            const id = String(req.params.id || '').trim();
            if (!this.isValidObjectId(id)) {
                return res.status(400).json({ success: false, message: 'ID inválido' });
            }

            const doc = await Influencer.findById(id)
                .populate(
                    'userId',
                    'firstName lastName email phone isVerified isActive blockchain.walletAddress primaryRole createdAt lastLogin',
                )
                .lean();

            if (!doc || doc.username === INFLUENCER_GENERAL_USERNAME) {
                return res.status(404).json({ success: false, message: 'Influencer no encontrado' });
            }

            const [enrichmentMap, installAgg, events] = await Promise.all([
                buildMarketplaceListEnrichmentMap([id]),
                aggregateInstallCountsByInfluencer([id]),
                InfluencerCrmEvent.find({ influencerId: id })
                    .sort({ createdAt: -1 })
                    .limit(80)
                    .lean(),
            ]);

            const row = await buildCrmInfluencerRow(doc, enrichmentMap.get(id), installAgg);
            const slug =
                (doc.socialMedia?.instagram || '').replace(/^@/, '') ||
                (doc.username || '').replace(/^@/, '') ||
                '';
            const outreachDoc = await getOrCreateOutreach(id, slug);
            const outreach = serializeOutreach(outreachDoc);

            return res.json({
                success: true,
                data: {
                    ...row,
                    outreach,
                    bio: doc.bio || '',
                    categories: doc.categories || [],
                    socialMedia: doc.socialMedia || {},
                    followers: doc.followers || {},
                    ugcEnabled: Boolean(doc.ugcProfile?.enabled),
                    identityVerificationStatus: normalizeIdentityVerificationStatus(
                        doc.identityVerificationStatus,
                    ),
                    verification: doc.crm?.verification || null,
                    recentPromotions: doc.recentPromotions || [],
                    events: events.map((e) => ({
                        id: String(e._id),
                        appKey: e.appKey,
                        eventType: e.eventType,
                        platform: e.platform,
                        appVersion: e.appVersion,
                        deviceId: e.deviceId,
                        termsVersion: e.termsVersion,
                        createdAt: e.createdAt ? new Date(e.createdAt).toISOString() : null,
                    })),
                },
            });
        } catch (error) {
            console.error('❌ CRM detail:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /** PATCH /api/admin/crm/influencers/:id */
    async patchInfluencerCrm(req, res) {
        try {
            const id = String(req.params.id || '').trim();
            if (!this.isValidObjectId(id)) {
                return res.status(400).json({ success: false, message: 'ID inválido' });
            }

            const doc = await Influencer.findById(id);
            if (!doc || doc.username === INFLUENCER_GENERAL_USERNAME) {
                return res.status(404).json({ success: false, message: 'Influencer no encontrado' });
            }

            const body = req.body || {};
            if (!doc.crm) doc.crm = defaultCrm();

            if (body.status && ['active', 'pending', 'verified', 'suspended'].includes(body.status)) {
                doc.status = body.status;
            }

            if (body.activationStatus && ACTIVATION_STATUSES.includes(body.activationStatus)) {
                doc.crm.activationStatus = body.activationStatus;
            }
            if (
                body.dataSubmissionStatus &&
                DATA_SUBMISSION_STATUSES.includes(body.dataSubmissionStatus)
            ) {
                doc.crm.dataSubmissionStatus = body.dataSubmissionStatus;
            }
            if (body.onboardingStep != null) {
                doc.crm.onboardingStep = String(body.onboardingStep).slice(0, 120);
            }
            if (body.adminNotes != null) {
                doc.crm.adminNotes = String(body.adminNotes).slice(0, 8000);
            }
            if (body.lastContactAt) {
                const d = new Date(body.lastContactAt);
                if (!Number.isNaN(d.getTime())) doc.crm.lastContactAt = d;
            }

            if (body.terms && typeof body.terms === 'object') {
                if (body.terms.accepted === true || body.terms.accepted === false) {
                    doc.crm.terms.accepted = body.terms.accepted;
                    if (body.terms.accepted) doc.crm.terms.acceptedAt = new Date();
                }
                if (body.terms.version != null) {
                    doc.crm.terms.version = String(body.terms.version).slice(0, 64);
                }
                if (body.terms.summary != null) {
                    doc.crm.terms.summary = String(body.terms.summary).slice(0, 2000);
                }
            }

            doc.crm.profileCompleteness = computeProfileCompleteness(doc);
            if (!body.dataSubmissionStatus) {
                doc.crm.dataSubmissionStatus = deriveDataSubmissionStatus(
                    doc,
                    doc.crm.profileCompleteness,
                );
            }

            doc.crm.updatedByAdminAt = new Date();
            doc.markModified('crm');
            await doc.save();

            await InfluencerCrmEvent.create({
                influencerId: doc._id,
                userId: doc.userId || undefined,
                appKey: 'web',
                eventType: 'admin_update',
                metadata: {
                    adminUserId: String(req.user._id),
                    patch: Object.keys(body),
                },
            });

            const fresh = await Influencer.findById(doc._id)
                .populate(
                    'userId',
                    'firstName lastName email phone isVerified isActive blockchain.walletAddress primaryRole',
                )
                .lean();
            const [enrichmentMap, installAgg] = await Promise.all([
                buildMarketplaceListEnrichmentMap([String(doc._id)]),
                aggregateInstallCountsByInfluencer([String(doc._id)]),
            ]);
            const outreachFresh = await getOrCreateOutreach(
                String(doc._id),
                (fresh.socialMedia?.instagram || fresh.username || '').replace(/^@/, ''),
            );
            const row = await buildCrmInfluencerRow(
                fresh,
                enrichmentMap.get(String(doc._id)),
                installAgg,
                serializeOutreach(outreachFresh),
            );

            return res.json({ success: true, data: row, message: 'CRM actualizado' });
        } catch (error) {
            console.error('❌ CRM patch:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * POST /api/admin/crm/influencers/:id/identity-verification
     * Confirma o rechaza que el User vinculado es el influencer del perfil (dashboard app).
     */
    async reviewIdentityVerification(req, res) {
        try {
            const id = String(req.params.id || '').trim();
            if (!this.isValidObjectId(id)) {
                return res.status(400).json({ success: false, message: 'ID inválido' });
            }

            const decision = String(req.body?.decision || '')
                .trim()
                .toLowerCase();
            if (!['approved', 'rejected'].includes(decision)) {
                return res.status(400).json({
                    success: false,
                    message: 'decision debe ser approved o rejected',
                });
            }

            const adminNote =
                req.body?.adminNote != null
                    ? String(req.body.adminNote).slice(0, 2000)
                    : '';

            const doc = await Influencer.findById(id);
            if (!doc || doc.username === INFLUENCER_GENERAL_USERNAME) {
                return res.status(404).json({ success: false, message: 'Influencer no encontrado' });
            }

            if (!doc.crm) doc.crm = defaultCrm();
            doc.crm.verification = doc.crm.verification || {};
            doc.crm.verification.reviewedAt = new Date();
            doc.crm.verification.reviewedByAdminId = req.user._id;
            doc.crm.verification.adminDecisionNote = adminNote;

            doc.identityVerificationStatus = decision;
            if (decision === 'approved') {
                doc.status = 'active';
                doc.crm.activationStatus = 'active';
            } else if (decision === 'rejected') {
                doc.crm.activationStatus = 'suspended';
            }

            doc.crm.updatedByAdminAt = new Date();
            doc.markModified('crm');
            await doc.save();

            await InfluencerCrmEvent.create({
                influencerId: doc._id,
                userId: doc.userId || undefined,
                appKey: 'web',
                eventType: 'admin_update',
                metadata: {
                    adminUserId: String(req.user._id),
                    identityVerificationDecision: decision,
                },
            });

            const fresh = await Influencer.findById(doc._id)
                .populate(
                    'userId',
                    'firstName lastName email phone isVerified isActive blockchain.walletAddress primaryRole',
                )
                .lean();
            const [enrichmentMap, installAgg] = await Promise.all([
                buildMarketplaceListEnrichmentMap([String(doc._id)]),
                aggregateInstallCountsByInfluencer([String(doc._id)]),
            ]);
            const outreachFresh = await getOrCreateOutreach(
                String(doc._id),
                (fresh.socialMedia?.instagram || fresh.username || '').replace(/^@/, ''),
            );
            const row = await buildCrmInfluencerRow(
                fresh,
                enrichmentMap.get(String(doc._id)),
                installAgg,
                serializeOutreach(outreachFresh),
            );

            const label =
                decision === 'approved'
                    ? 'Identidad confirmada — acceso al dashboard habilitado'
                    : 'Identidad rechazada';

            return res.json({
                success: true,
                data: {
                    ...row,
                    verification: fresh.crm?.verification || null,
                },
                message: label,
            });
        } catch (error) {
            console.error('❌ CRM identity verification:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /** GET /api/admin/crm/pipeline/board — tablero por columnas (pipelineStage) */
    async getPipelineBoard(req, res) {
        try {
            const query = buildCrmListMongoQuery(req.query);
            const { page, limit, skip } = parseCrmPagination(req.query, 50);

            const [totalDocs, stageCounts, influencers] = await Promise.all([
                Influencer.countDocuments(query),
                aggregateActivationStageCounts(query),
                Influencer.find(query)
                    .sort({ updatedAt: -1, joinDate: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate(
                        'userId',
                        'firstName lastName email phone isVerified isActive blockchain.walletAddress',
                    )
                    .lean(),
            ]);

            const ids = influencers.map((d) => String(d._id));
            const oids = ids.map((id) => new mongoose.Types.ObjectId(id));
            const [enrichmentMap, installAgg, outreachDocs] = await Promise.all([
                buildMarketplaceListEnrichmentMap(ids),
                aggregateInstallCountsByInfluencer(ids),
                InfluencerCrmOutreach.find({ influencerId: { $in: oids } }).lean(),
            ]);
            const outreachMap = new Map(
                outreachDocs.map((o) => [String(o.influencerId), serializeOutreach(o)]),
            );

            const columns = PIPELINE_STAGE_ORDER.map((stage) => ({
                stage,
                label: PIPELINE_LABELS[stage] || stage,
                cards: [],
                totalInStage: stageCounts[stage] || 0,
            }));
            const columnByStage = new Map(columns.map((c) => [c.stage, c]));

            for (const inf of influencers) {
                const infId = String(inf._id);
                const outreach = outreachMap.get(infId) || null;
                const row = await buildCrmInfluencerRow(
                    inf,
                    enrichmentMap.get(infId),
                    installAgg,
                    outreach,
                );
                const stage =
                    outreach?.pipelineStage && isValidPipelineStage(outreach.pipelineStage)
                        ? outreach.pipelineStage
                        : 'lead';
                const col = columnByStage.get(stage) || columnByStage.get('lead');
                const slug =
                    (inf.socialMedia?.instagram || '').replace(/^@/, '') ||
                    (inf.username || '').replace(/^@/, '') ||
                    '';

                col.cards.push({
                    influencerId: infId,
                    name: row.name,
                    username: row.username,
                    avatar: row.avatar,
                    profileShortCode: row.profileShortCode,
                    identityVerificationStatus: row.identityVerificationStatus,
                    activationStatus: row.activationStatus,
                    dataSubmissionStatus: row.dataSubmissionStatus,
                    profileCompleteness: row.profileCompleteness,
                    redeemedCoupons: row.redeemedCoupons ?? 0,
                    termsAccepted: row.terms?.accepted ?? false,
                    damecodigoInstalls: row.apps?.damecodigoInfluencer?.installCount ?? 0,
                    bizneaiInstalls: row.apps?.bizneaiMerchant?.installCount ?? 0,
                    pipelineStage: stage,
                    pipelineStageLabel: PIPELINE_LABELS[stage] || stage,
                    contactEmail: outreach?.contactEmail || row.user?.email || '',
                    contactPhone: row.user?.phone || '',
                    nextAction: outreach?.nextAction || '',
                    outreachPendingCount: row.outreachPendingCount ?? 0,
                    profilePublicUrl: outreach?.profilePublicUrl || '',
                    publicSlug: outreach?.publicSlug || slug,
                    updatedAt: inf.updatedAt ? new Date(inf.updatedAt).toISOString() : null,
                });
            }

            const totalCards = columns.reduce((n, c) => n + c.cards.length, 0);

            return res.json({
                success: true,
                data: {
                    columns,
                    stages: PIPELINE_STAGE_ORDER.map((id) => ({
                        id,
                        label: PIPELINE_LABELS[id] || id,
                    })),
                    totalCards,
                    pagination: buildPaginationMeta(page, limit, totalDocs),
                },
            });
        } catch (error) {
            console.error('❌ CRM pipeline board:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /** GET /api/admin/crm/influencers/:id/outreach */
    async getOutreach(req, res) {
        try {
            const id = String(req.params.id || '').trim();
            if (!this.isValidObjectId(id)) {
                return res.status(400).json({ success: false, message: 'ID inválido' });
            }
            const inf = await Influencer.findById(id).select('socialMedia username').lean();
            if (!inf) {
                return res.status(404).json({ success: false, message: 'Influencer no encontrado' });
            }
            const slug =
                (inf.socialMedia?.instagram || '').replace(/^@/, '') ||
                (inf.username || '').replace(/^@/, '') ||
                '';
            const doc = await getOrCreateOutreach(id, slug);
            return res.json({
                success: true,
                data: serializeOutreach(doc),
                pipelineLabels: PIPELINE_LABELS,
            });
        } catch (error) {
            console.error('❌ CRM get outreach:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /** PATCH /api/admin/crm/influencers/:id/outreach */
    async patchOutreach(req, res) {
        try {
            const id = String(req.params.id || '').trim();
            if (!this.isValidObjectId(id)) {
                return res.status(400).json({ success: false, message: 'ID inválido' });
            }
            const body = req.body || {};
            const inf = await Influencer.findById(id).select('socialMedia username').lean();
            if (!inf) {
                return res.status(404).json({ success: false, message: 'Influencer no encontrado' });
            }
            const slug =
                (inf.socialMedia?.instagram || '').replace(/^@/, '') ||
                (inf.username || '').replace(/^@/, '') ||
                '';
            const doc = await getOrCreateOutreach(id, slug);

            if (body.pipelineStage) {
                const stage = String(body.pipelineStage).trim();
                if (!isValidPipelineStage(stage)) {
                    return res.status(400).json({
                        success: false,
                        message: 'pipelineStage inválido',
                        validStages: PIPELINE_STAGE_ORDER,
                    });
                }
                doc.pipelineStage = stage;
            }
            if (body.primaryChannel) doc.primaryChannel = String(body.primaryChannel);
            if (body.contactEmail != null) doc.contactEmail = String(body.contactEmail).trim().toLowerCase();
            if (body.contactEmailStatus) doc.contactEmailStatus = String(body.contactEmailStatus);
            if (body.nextAction != null) doc.nextAction = String(body.nextAction).slice(0, 500);
            if (body.conversationSummary != null) {
                doc.conversationSummary = String(body.conversationSummary).slice(0, 4000);
            }
            if (body.profilePublicUrl != null) {
                doc.profilePublicUrl = String(body.profilePublicUrl).slice(0, 512);
            }
            if (body.contactEmailReceivedAt) {
                const d = new Date(body.contactEmailReceivedAt);
                if (!Number.isNaN(d.getTime())) {
                    doc.contactEmailReceivedAt = d;
                    doc.contactEmailStatus = 'received';
                }
            }

            if (body.markDeliverySent && typeof body.markDeliverySent === 'object') {
                const key = String(body.markDeliverySent.deliveryKey || '').trim();
                const item = doc.deliveries.find((x) => x.deliveryKey === key);
                if (item) {
                    item.status = body.markDeliverySent.status || 'sent';
                    item.sentAt = body.markDeliverySent.sentAt
                        ? new Date(body.markDeliverySent.sentAt)
                        : new Date();
                    doc.lastOutboundAt = item.sentAt;
                    doc.markModified('deliveries');
                }
            }

            if (Array.isArray(body.deliveries)) {
                doc.deliveries = body.deliveries.map((d) => ({
                    deliveryKey: String(d.deliveryKey || `d_${Date.now()}`),
                    type: d.type || 'other',
                    status: d.status || 'pending',
                    channel: d.channel || doc.primaryChannel,
                    title: String(d.title || '').slice(0, 200),
                    url: String(d.url || '').slice(0, 2048),
                    sentAt: d.sentAt ? new Date(d.sentAt) : null,
                    notes: String(d.notes || '').slice(0, 2000),
                }));
                doc.markModified('deliveries');
            }

            doc.updatedByAdminId = req.user._id;
            await doc.save();

            return res.json({
                success: true,
                data: serializeOutreach(doc),
                message: 'Outreach actualizado',
            });
        } catch (error) {
            console.error('❌ CRM patch outreach:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /** GET /api/admin/crm/monetization/board — tablero post-onboarding */
    async getMonetizationBoard(req, res) {
        try {
            const query = buildCrmListMongoQuery(req.query);
            const { page, limit, skip } = parseCrmPagination(req.query, 50);

            const { totalDocs, ids: pageIds, stageCounts } = await paginateMonetizationEligible(
                query,
                skip,
                limit,
            );

            if (!pageIds.length) {
                return res.json({
                    success: true,
                    data: {
                        columns: MONETIZATION_STAGE_ORDER.map((stage) => ({
                            stage,
                            label: MONETIZATION_LABELS[stage] || stage,
                            cards: [],
                            totalInStage: stageCounts[stage] || 0,
                        })),
                        stages: MONETIZATION_STAGE_ORDER.map((id) => ({
                            id,
                            label: MONETIZATION_LABELS[id] || id,
                        })),
                        totalCards: 0,
                        pagination: buildPaginationMeta(page, limit, totalDocs),
                        eligibilityNote:
                            'Solo influencers con activación completada (outreach onboarded o materials_complete) o con ficha monetización ya creada.',
                    },
                });
            }

            const influencers = await Influencer.find({ _id: { $in: pageIds } })
                .populate(
                    'userId',
                    'firstName lastName email phone isVerified isActive blockchain.walletAddress',
                )
                .lean();
            const orderMap = new Map(pageIds.map((id, index) => [String(id), index]));
            influencers.sort(
                (a, b) => (orderMap.get(String(a._id)) ?? 0) - (orderMap.get(String(b._id)) ?? 0),
            );

            const filteredIds = influencers.map((d) => String(d._id));
            const filteredOids = filteredIds.map((id) => new mongoose.Types.ObjectId(id));

            const [enrichmentMap, installAgg, outreachDocs, monetizationDocs, liveActivityMap] =
                await Promise.all([
                    buildMarketplaceListEnrichmentMap(filteredIds),
                    aggregateInstallCountsByInfluencer(filteredIds),
                    InfluencerCrmOutreach.find({ influencerId: { $in: filteredOids } }).lean(),
                    InfluencerCrmMonetization.find({ influencerId: { $in: filteredOids } }).lean(),
                    buildLiveActivityBatch(filteredIds, { recentPerInfluencer: 3 }),
                ]);

            const outreachMap = new Map(
                outreachDocs.map((o) => [String(o.influencerId), serializeOutreach(o)]),
            );
            const monetizationMap = new Map(
                monetizationDocs.map((m) => [String(m.influencerId), m]),
            );

            const columns = MONETIZATION_STAGE_ORDER.map((stage) => ({
                stage,
                label: MONETIZATION_LABELS[stage] || stage,
                cards: [],
                totalInStage: stageCounts[stage] || 0,
            }));
            const columnByStage = new Map(columns.map((c) => [c.stage, c]));

            for (const inf of influencers) {
                const infId = String(inf._id);
                const outreach = outreachMap.get(infId) || null;
                const monetizationDoc = monetizationMap.get(infId);

                const row = await buildCrmInfluencerRow(
                    inf,
                    enrichmentMap.get(infId),
                    installAgg,
                    outreach,
                );
                const stage =
                    monetizationDoc?.monetizationStage &&
                    isValidMonetizationStage(monetizationDoc.monetizationStage)
                        ? monetizationDoc.monetizationStage
                        : 'ready';
                const col = columnByStage.get(stage) || columnByStage.get('ready');
                const slug =
                    (inf.socialMedia?.instagram || '').replace(/^@/, '') ||
                    (inf.username || '').replace(/^@/, '') ||
                    '';

                const liveBase = liveActivityMap.get(infId) || {};
                const live = enrichLiveActivityWithCrmRow(liveBase, {
                    walletAddress: row.walletAddress,
                    activePromotions: row.activePromotions,
                    redeemedCoupons: row.redeemedCoupons,
                    totalEarnings: row.totalEarnings,
                    monetizationStage: stage,
                });

                col.cards.push({
                    influencerId: infId,
                    name: row.name,
                    username: row.username,
                    avatar: row.avatar,
                    profileShortCode: row.profileShortCode,
                    identityVerificationStatus: row.identityVerificationStatus,
                    activationStatus: row.activationStatus,
                    profileCompleteness: row.profileCompleteness,
                    totalEarnings: live.totalEarningsUsd ?? row.totalEarnings ?? 0,
                    redeemedCoupons: live.redeemedCount ?? row.redeemedCoupons ?? 0,
                    activePromotions: row.activePromotions ?? 0,
                    hasWallet: live.hasWallet ?? Boolean(row.walletAddress),
                    openCouponsCount: live.openCouponsCount ?? 0,
                    settlementPendingCount: live.settlementPendingCount ?? 0,
                    settlementPendingUsd: live.settlementPendingUsd ?? 0,
                    settlementPaidCount: live.settlementPaidCount ?? 0,
                    settlementPaidUsd: live.settlementPaidUsd ?? 0,
                    lastRedeemedAt: live.lastRedeemedAt ?? null,
                    hasRecentActivity: live.hasRecentActivity ?? false,
                    suggestedMonetizationStage: live.suggestedMonetizationStage,
                    suggestedMonetizationStageLabel: live.suggestedMonetizationStageLabel,
                    stageMismatch: live.stageMismatch ?? false,
                    liveFetchedAt: live.fetchedAt,
                    outreachStage: outreach?.pipelineStage || 'lead',
                    outreachStageLabel: outreach?.pipelineStageLabel || 'Lead',
                    monetizationStage: stage,
                    monetizationStageLabel: MONETIZATION_LABELS[stage] || stage,
                    nextAction: monetizationDoc?.nextAction || '',
                    publicSlug: outreach?.publicSlug || slug,
                    profilePublicUrl: outreach?.profilePublicUrl || '',
                    updatedAt: inf.updatedAt ? new Date(inf.updatedAt).toISOString() : null,
                });
            }

            const totalCards = columns.reduce((n, c) => n + c.cards.length, 0);

            return res.json({
                success: true,
                data: {
                    columns,
                    stages: MONETIZATION_STAGE_ORDER.map((id) => ({
                        id,
                        label: MONETIZATION_LABELS[id] || id,
                    })),
                    totalCards,
                    pagination: buildPaginationMeta(page, limit, totalDocs),
                    eligibilityNote:
                        'Solo influencers con activación completada (outreach onboarded o materials_complete) o con ficha monetización ya creada.',
                },
            });
        } catch (error) {
            console.error('❌ CRM monetization board:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /** GET /api/admin/crm/influencers/:id/live-activity — canjes / cupones en tiempo casi real */
    async getInfluencerLiveActivity(req, res) {
        try {
            const id = String(req.params.id || '').trim();
            if (!this.isValidObjectId(id)) {
                return res.status(400).json({ success: false, message: 'ID inválido' });
            }
            const inf = await Influencer.findById(id)
                .populate('userId', 'blockchain.walletAddress')
                .lean();
            if (!inf) {
                return res.status(404).json({ success: false, message: 'Influencer no encontrado' });
            }

            const liveBase = await buildLiveActivityForInfluencer(id, { recentPerInfluencer: 8 });
            const wallet =
                inf.userId?.blockchain?.walletAddress &&
                String(inf.userId.blockchain.walletAddress).trim()
                    ? String(inf.userId.blockchain.walletAddress).trim()
                    : null;

            const live = enrichLiveActivityWithCrmRow(liveBase, {
                walletAddress: wallet,
                activePromotions: inf.activePromotions,
                redeemedCoupons: inf.couponStats?.totalSales,
                totalEarnings: inf.totalEarnings,
            });

            return res.json({
                success: true,
                data: live,
            });
        } catch (error) {
            console.error('❌ CRM live activity:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /** GET /api/admin/crm/influencers/:id/monetization */
    async getMonetization(req, res) {
        try {
            const id = String(req.params.id || '').trim();
            if (!this.isValidObjectId(id)) {
                return res.status(400).json({ success: false, message: 'ID inválido' });
            }
            const doc = await getOrCreateMonetization(id);
            return res.json({
                success: true,
                data: serializeMonetization(doc),
                stageLabels: MONETIZATION_LABELS,
            });
        } catch (error) {
            console.error('❌ CRM get monetization:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /** PATCH /api/admin/crm/influencers/:id/monetization */
    async patchMonetization(req, res) {
        try {
            const id = String(req.params.id || '').trim();
            if (!this.isValidObjectId(id)) {
                return res.status(400).json({ success: false, message: 'ID inválido' });
            }
            const inf = await Influencer.findById(id).select('_id').lean();
            if (!inf) {
                return res.status(404).json({ success: false, message: 'Influencer no encontrado' });
            }

            const body = req.body || {};
            const doc = await getOrCreateMonetization(id);

            if (body.monetizationStage) {
                const stage = String(body.monetizationStage).trim();
                if (!isValidMonetizationStage(stage)) {
                    return res.status(400).json({
                        success: false,
                        message: 'monetizationStage inválido',
                        validStages: MONETIZATION_STAGE_ORDER,
                    });
                }
                doc.monetizationStage = stage;
            }
            if (body.nextAction != null) doc.nextAction = String(body.nextAction).slice(0, 500);
            if (body.notes != null) doc.notes = String(body.notes).slice(0, 4000);

            doc.updatedByAdminId = req.user._id;
            await doc.save();

            return res.json({
                success: true,
                data: serializeMonetization(doc),
                message: 'Monetización actualizada',
            });
        } catch (error) {
            console.error('❌ CRM patch monetization:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new AdminCrmController();
