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
const PromotionApplication = require('../models/PromotionApplication');
const Promotion = require('../models/Promotion');
const { persistInfluencerImage } = require('../utils/influencerImageStorage');
const { queueEnsurePromoShortCodesForInfluencer } = require('../utils/ensureInfluencerPromoShortCodes');
const { enrichPromotionClientFields } = require('../utils/promotionClientFields');
const { serializePromotionKindFields } = require('../utils/promotionKind');

function promotionRedirectLive(pr, now = new Date()) {
    if (!pr || pr.status !== 'active') return false;
    const vu = pr.validUntil != null ? new Date(pr.validUntil).getTime() : NaN;
    if (!Number.isFinite(vu) || vu < now.getTime()) return false;
    const vf = pr.validFrom != null ? new Date(pr.validFrom).getTime() : 0;
    return vf <= now.getTime();
}

function serializeRedirectPromotion(pr) {
    if (!pr) return null;
    return {
        id: String(pr._id),
        title: pr.title || '',
        brand: pr.brand || '',
        status: pr.status || '',
        validFrom: pr.validFrom ? new Date(pr.validFrom).toISOString() : null,
        validUntil: pr.validUntil ? new Date(pr.validUntil).toISOString() : null,
        redirectInsteadOfQr: !!pr.redirectInsteadOfQr,
        redirectToUrl: pr.redirectToUrl || '',
    };
}

function serializeRedirectApplication(a) {
    return {
        id: String(a._id),
        status: a.status,
        createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : null,
        updatedAt: a.updatedAt ? new Date(a.updatedAt).toISOString() : null,
        promotion: serializeRedirectPromotion(a.promotion),
    };
}
const {
    buildLiveActivityBatch,
    buildLiveActivityForInfluencer,
    enrichLiveActivityWithCrmRow,
} = require('../utils/influencerCrmLiveActivity');
const {
    buildPendingApplicationsMap,
    pendingFieldsForCard,
} = require('../utils/influencerCrmPendingApplications');
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

    /**
     * GET /api/admin/crm/influencers/:id/redirect-applications
     * pending, approved y promos redirect activas asignables (sin aplicación aprobada aún).
     */
    async getRedirectApplications(req, res) {
        try {
            const influencerId = String(req.params.id || '').trim();
            if (!mongoose.Types.ObjectId.isValid(influencerId)) {
                return res.status(400).json({ success: false, message: 'ID inválido' });
            }

            const exists = await Influencer.findById(influencerId).select('_id username').lean();
            if (!exists || exists.username === INFLUENCER_GENERAL_USERNAME) {
                return res.status(404).json({ success: false, message: 'Influencer no encontrado' });
            }

            const oid = new mongoose.Types.ObjectId(influencerId);
            const now = new Date();

            const [apps, activeRedirectPromos] = await Promise.all([
                PromotionApplication.find({ influencerApplicant: oid })
                    .populate('promotion', 'title brand status validFrom validUntil redirectInsteadOfQr redirectToUrl')
                    .sort({ updatedAt: -1 })
                    .limit(300)
                    .lean(),
                Promotion.find({
                    redirectInsteadOfQr: true,
                    status: 'active',
                    $or: [{ validUntil: { $gte: now } }, { validUntil: null }],
                })
                    .select('title brand status validFrom validUntil redirectInsteadOfQr redirectToUrl')
                    .sort({ validUntil: 1, createdAt: -1 })
                    .limit(200)
                    .lean(),
            ]);

            const withPromotion = apps.filter((a) => a.promotion);
            const redirectApps = withPromotion.filter((a) => a.promotion.redirectInsteadOfQr);
            const approvedPromotionIds = new Set(
                redirectApps.filter((a) => a.status === 'approved').map((a) => String(a.promotion._id)),
            );

            const pending = withPromotion
                .filter((a) => a.status === 'pending')
                .map(serializeRedirectApplication);
            const approved = withPromotion
                .filter((a) => a.status === 'approved')
                .map(serializeRedirectApplication);

            const assignable = activeRedirectPromos
                .filter((p) => promotionRedirectLive(p, now) && !approvedPromotionIds.has(String(p._id)))
                .map(serializeRedirectPromotion);

            const legacyData = pending;

            return res.json({
                success: true,
                data: legacyData,
                count: legacyData.length,
                pending,
                approved,
                assignable,
            });
        } catch (error) {
            console.error('❌ CRM redirect applications:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /** POST /api/admin/crm/influencers/:id/redirect-promotions/assign — asignación unilateral (aprobada) */
    async assignRedirectPromotion(req, res) {
        try {
            const influencerId = String(req.params.id || '').trim();
            const promotionId = String(req.body?.promotionId || '').trim();

            if (!mongoose.Types.ObjectId.isValid(influencerId) || !mongoose.Types.ObjectId.isValid(promotionId)) {
                return res.status(400).json({ success: false, message: 'influencerId o promotionId inválido' });
            }

            const inf = await Influencer.findById(influencerId).select('_id username').lean();
            if (!inf || inf.username === INFLUENCER_GENERAL_USERNAME) {
                return res.status(404).json({ success: false, message: 'Influencer no encontrado' });
            }

            const promo = await Promotion.findById(promotionId)
                .select('title redirectInsteadOfQr status validFrom validUntil')
                .lean();
            if (!promo) {
                return res.status(404).json({ success: false, message: 'Promoción no encontrada' });
            }
            if (!promo.redirectInsteadOfQr) {
                return res.status(400).json({
                    success: false,
                    message: 'La promoción no es de tipo redirección (URL).',
                });
            }

            let app = await PromotionApplication.findOne({
                promotion: promotionId,
                influencerApplicant: influencerId,
            });

            if (app) {
                if (app.status !== 'approved') {
                    app.status = 'approved';
                    app.additionalNotes = `${app.additionalNotes || ''}\n[CRM] Asignación unilateral redirect`.trim();
                    await app.save();
                }
            } else {
                app = await PromotionApplication.create({
                    promotion: promotionId,
                    influencerApplicant: influencerId,
                    status: 'approved',
                    contentProposal: 'Asignación unilateral CRM — promoción de redirección',
                    platforms: ['instagram'],
                    additionalNotes: '[CRM] Asignación unilateral redirect',
                });
            }

            queueEnsurePromoShortCodesForInfluencer(influencerId, {
                extraPromotionIds: [promotionId],
                includeEnvDefaults: false,
            });

            const populated = await PromotionApplication.findById(app._id)
                .populate('promotion', 'title brand status validFrom validUntil redirectInsteadOfQr redirectToUrl')
                .lean();

            return res.json({
                success: true,
                message: 'Promoción de redirección asignada y aprobada',
                data: serializeRedirectApplication(populated),
            });
        } catch (error) {
            console.error('❌ CRM assign redirect:', error);
            return res.status(500).json({ success: false, message: error.message || 'No se pudo asignar' });
        }
    }

    /** POST /api/admin/crm/influencers/:id/avatar — foto de perfil (super admin, Cloudinary + disco) */
    async uploadInfluencerAvatar(req, res) {
        try {
            const id = String(req.params.id || '').trim();
            if (!this.isValidObjectId(id)) {
                return res.status(400).json({ success: false, message: 'ID inválido' });
            }
            if (!req.file || !req.file.buffer) {
                return res.status(400).json({ success: false, message: 'Campo avatar (imagen) requerido' });
            }

            const doc = await Influencer.findById(id);
            if (!doc || doc.username === INFLUENCER_GENERAL_USERNAME) {
                return res.status(404).json({ success: false, message: 'Influencer no encontrado' });
            }

            const stored = await persistInfluencerImage(req.file, {
                cloudinaryFolder: 'link4deal/influencers',
                filenamePrefix: 'influencer-avatar',
            });

            doc.avatar = stored.url;
            if (!doc.crm) doc.crm = defaultCrm();
            doc.crm.profileCompleteness = computeProfileCompleteness(doc);
            doc.crm.dataSubmissionStatus = deriveDataSubmissionStatus(doc, doc.crm.profileCompleteness);
            doc.crm.updatedByAdminAt = new Date();
            doc.markModified('crm');
            await doc.save();

            try {
                await InfluencerCrmEvent.create({
                    influencerId: doc._id,
                    userId: doc.userId || undefined,
                    appKey: 'web',
                    eventType: 'admin_avatar_upload',
                    metadata: {
                        adminUserId: String(req.user._id),
                        cloudinary: Boolean(stored.savedToCloudinary),
                    },
                });
            } catch (eventErr) {
                console.warn('⚠️ CRM avatar audit event (no bloquea upload):', eventErr.message);
            }

            return res.json({
                success: true,
                data: {
                    avatarUrl: stored.url,
                    cloudinaryUrl: stored.cloudinaryUrl,
                    savedToCloudinary: stored.savedToCloudinary,
                },
                message: 'Avatar actualizado',
            });
        } catch (error) {
            console.error('❌ CRM upload avatar:', error);
            return res.status(500).json({ success: false, message: error.message || 'Error al subir avatar' });
        }
    }

    /** Serializa fila de PromotionApplication para panel admin / marcas. */
    serializePromotionApplicationRow(row) {
        const pr = row.promotion;
        const inf = row.influencerApplicant;
        return {
            id: String(row._id),
            status: row.status,
            createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
            updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
            influencerApplicant: inf
                ? {
                      id: String(inf._id),
                      name: inf.name,
                      username: inf.username,
                      avatar: inf.avatar,
                      totalFollowers: inf.totalFollowers,
                  }
                : null,
            platforms: row.platforms || [],
            estimatedReach: row.estimatedReach,
            portfolio: row.portfolio || [],
            pricing: row.pricing,
            timeline: row.timeline,
            additionalNotes: row.additionalNotes,
            contentProposal: row.contentProposal,
            promotion: pr
                ? {
                      id: String(pr._id),
                      title: pr.title,
                      brand: pr.brand,
                      category: pr.category,
                      currentPrice: pr.currentPrice,
                      currency: pr.currency,
                      discountPercentage: pr.discountPercentage,
                      redirectInsteadOfQr: !!pr.redirectInsteadOfQr,
                      redirectToUrl: pr.redirectToUrl || '',
                  }
                : null,
        };
    }

    /** GET /api/admin/crm/promotion-applications — todas las solicitudes (super admin, paginado + búsqueda) */
    async listPromotionApplications(req, res) {
        try {
            const statusFilter = String(req.query.status || 'pending').trim();
            const influencerId = String(req.query.influencerId || '').trim();
            const search = String(req.query.search || '').trim();
            const unlinkedOnly = ['1', 'true', 'yes'].includes(
                String(req.query.unlinkedOnly || '').toLowerCase(),
            );
            const page = Math.max(1, parseInt(req.query.page, 10) || 1);
            const limit = Math.min(100, Math.max(5, parseInt(req.query.limit, 10) || 25));

            const filter = {};
            if (statusFilter && statusFilter !== 'all') {
                if (['pending', 'approved', 'rejected', 'withdrawn'].includes(statusFilter)) {
                    filter.status = statusFilter;
                }
            }
            if (influencerId && mongoose.Types.ObjectId.isValid(influencerId)) {
                filter.influencerApplicant = new mongoose.Types.ObjectId(influencerId);
            }
            if (unlinkedOnly) {
                filter.influencerApplicant = null;
            }

            // Búsqueda avanzada: por título/marca de promoción o por nombre/usuario del influencer.
            if (search) {
                const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
                const [promoIds, infIds] = await Promise.all([
                    Promotion.find({ $or: [{ title: rx }, { brand: rx }] })
                        .select('_id')
                        .limit(500)
                        .lean(),
                    Influencer.find({ $or: [{ name: rx }, { username: rx }] })
                        .select('_id')
                        .limit(500)
                        .lean(),
                ]);
                filter.$or = [
                    { promotion: { $in: promoIds.map((p) => p._id) } },
                    { influencerApplicant: { $in: infIds.map((i) => i._id) } },
                ];
            }

            const totalDocs = await PromotionApplication.countDocuments(filter);
            const totalPages = Math.max(1, Math.ceil(totalDocs / limit));
            const safePage = Math.min(page, totalPages);

            const items = await PromotionApplication.find(filter)
                .populate(
                    'promotion',
                    'title brand category currentPrice currency discountPercentage redirectInsteadOfQr redirectToUrl status',
                )
                .populate('influencerApplicant', 'name username avatar totalFollowers')
                .sort({ createdAt: -1 })
                .skip((safePage - 1) * limit)
                .limit(limit)
                .lean();

            const data = items.map((row) => this.serializePromotionApplicationRow(row));
            const [pendingCount, unlinkedCount] = await Promise.all([
                PromotionApplication.countDocuments({ status: 'pending' }),
                PromotionApplication.countDocuments({ status: 'pending', influencerApplicant: null }),
            ]);

            return res.json({
                success: true,
                data,
                count: data.length,
                pendingCount,
                unlinkedCount,
                pagination: { page: safePage, limit, totalDocs, totalPages },
            });
        } catch (error) {
            console.error('❌ CRM list promotion applications:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * POST /api/admin/crm/promotion-applications/bulk-apply — atajo para aplicar una
     * promoción a muchos influencers de golpe (todos o filtrados por categoría).
     * Crea solicitudes ya aprobadas (o pendientes) sin duplicar las existentes.
     */
    async bulkApplyPromotion(req, res) {
        try {
            const body = req.body || {};
            const promotionId = String(body.promotionId || '').trim();
            const scope = String(body.scope || 'all').trim();
            const category = String(body.category || '').trim();
            const approve = body.approve !== false; // por defecto aprueba
            const limitInfluencers = Math.min(2000, Math.max(1, parseInt(body.limit, 10) || 1000));

            if (!mongoose.Types.ObjectId.isValid(promotionId)) {
                return res.status(400).json({ success: false, message: 'promotionId inválido.' });
            }
            const promotion = await Promotion.findById(promotionId).select('_id title').lean();
            if (!promotion) {
                return res.status(404).json({ success: false, message: 'Promoción no encontrada.' });
            }

            const infQuery = { username: { $ne: INFLUENCER_GENERAL_USERNAME } };
            if (scope === 'category') {
                if (!category) {
                    return res.status(400).json({ success: false, message: 'Falta la categoría.' });
                }
                infQuery.categories = category;
            }

            const influencers = await Influencer.find(infQuery)
                .select('_id')
                .limit(limitInfluencers)
                .lean();
            if (!influencers.length) {
                return res.json({
                    success: true,
                    data: { created: 0, skipped: 0, matched: 0 },
                    message: 'No hay influencers que coincidan con el filtro.',
                });
            }

            const infIds = influencers.map((i) => i._id);
            const existing = await PromotionApplication.find({
                promotion: promotion._id,
                influencerApplicant: { $in: infIds },
            })
                .select('influencerApplicant')
                .lean();
            const already = new Set(existing.map((e) => String(e.influencerApplicant)));

            const toCreate = infIds.filter((id) => !already.has(String(id)));
            const status = approve ? 'approved' : 'pending';
            if (toCreate.length) {
                await PromotionApplication.insertMany(
                    toCreate.map((id) => ({
                        promotion: promotion._id,
                        influencerApplicant: id,
                        status,
                        contentProposal: 'Asignación masiva desde CRM',
                        platforms: [],
                        estimatedReach: 0,
                        portfolio: [],
                    })),
                    { ordered: false },
                );
                if (approve) {
                    for (const id of toCreate) {
                        queueEnsurePromoShortCodesForInfluencer(String(id), {
                            extraPromotionIds: [String(promotion._id)],
                            includeEnvDefaults: false,
                        });
                    }
                }
            }

            return res.json({
                success: true,
                data: {
                    created: toCreate.length,
                    skipped: already.size,
                    matched: infIds.length,
                    status,
                },
                message: `Aplicada a ${toCreate.length} influencer(es) (${already.size} ya la tenían).`,
            });
        } catch (error) {
            console.error('❌ CRM bulk apply promotion:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /** GET /api/admin/crm/promotion-applications/categories — categorías de influencers disponibles */
    async listInfluencerCategories(req, res) {
        try {
            const cats = await Influencer.distinct('categories', {
                username: { $ne: INFLUENCER_GENERAL_USERNAME },
            });
            const cleaned = Array.from(
                new Set((cats || []).map((c) => String(c || '').trim()).filter(Boolean)),
            ).sort((a, b) => a.localeCompare(b, 'es'));
            return res.json({ success: true, data: cleaned });
        } catch (error) {
            console.error('❌ CRM list influencer categories:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /** POST /api/admin/crm/promotion-applications/:id/approve — aprueba solicitud (super admin) */
    async approvePromotionApplication(req, res) {
        try {
            const applicationId = String(req.params.id || '').trim();
            if (!mongoose.Types.ObjectId.isValid(applicationId)) {
                return res.status(400).json({ success: false, message: 'ID inválido' });
            }

            const updateFields = { status: 'approved' };
            const rawAssign =
                req.body && req.body.influencerProfileId != null
                    ? String(req.body.influencerProfileId).trim()
                    : '';
            if (rawAssign && mongoose.Types.ObjectId.isValid(rawAssign)) {
                const inf = await Influencer.findById(rawAssign).select('_id username').lean();
                if (inf && inf.username !== INFLUENCER_GENERAL_USERNAME) {
                    updateFields.influencerApplicant = inf._id;
                }
            }

            const updated = await PromotionApplication.findByIdAndUpdate(
                applicationId,
                { $set: updateFields },
                { new: true },
            )
                .select('_id status influencerApplicant promotion')
                .lean();

            if (!updated) {
                return res.status(404).json({ success: false, message: 'Aplicación no encontrada.' });
            }

            if (updated.influencerApplicant && updated.promotion) {
                queueEnsurePromoShortCodesForInfluencer(String(updated.influencerApplicant), {
                    extraPromotionIds: [String(updated.promotion)],
                    includeEnvDefaults: false,
                });
            }

            return res.json({ success: true, data: { id: String(updated._id), status: updated.status } });
        } catch (error) {
            console.error('❌ CRM approve application:', error);
            return res.status(500).json({ success: false, message: 'No se pudo aprobar la aplicación.' });
        }
    }

    /** POST /api/admin/crm/promotion-applications/:id/reject */
    async rejectPromotionApplication(req, res) {
        try {
            const applicationId = String(req.params.id || '').trim();
            if (!mongoose.Types.ObjectId.isValid(applicationId)) {
                return res.status(400).json({ success: false, message: 'ID inválido' });
            }

            const updated = await PromotionApplication.findByIdAndUpdate(
                applicationId,
                { $set: { status: 'rejected' } },
                { new: true },
            )
                .select('_id status')
                .lean();

            if (!updated) {
                return res.status(404).json({ success: false, message: 'Aplicación no encontrada.' });
            }

            return res.json({ success: true, data: { id: String(updated._id), status: updated.status } });
        } catch (error) {
            console.error('❌ CRM reject application:', error);
            return res.status(500).json({ success: false, message: 'No se pudo rechazar la aplicación.' });
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

            if (body.name != null) doc.name = String(body.name).trim().slice(0, 200);
            if (body.username != null) {
                const u = String(body.username).trim().replace(/^@/, '').slice(0, 80);
                if (u) doc.username = u;
            }
            if (body.bio != null) doc.bio = String(body.bio).trim().slice(0, 8000);
            if (body.avatar != null) doc.avatar = String(body.avatar).trim().slice(0, 2048);
            if (body.profileShortCode != null) {
                const code = String(body.profileShortCode).trim().toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 16);
                if (code) doc.profileShortCode = code;
            }
            if (body.location != null) doc.location = String(body.location).trim().slice(0, 300);
            if (body.socialMedia && typeof body.socialMedia === 'object') {
                doc.socialMedia = doc.socialMedia || {};
                for (const key of ['instagram', 'tiktok', 'youtube', 'twitter']) {
                    if (body.socialMedia[key] != null) {
                        doc.socialMedia[key] = String(body.socialMedia[key]).trim().slice(0, 500);
                    }
                }
                doc.markModified('socialMedia');
            }
            if (Array.isArray(body.categories)) {
                doc.categories = body.categories
                    .map((c) => String(c).trim())
                    .filter(Boolean)
                    .slice(0, 30);
            }
            if (Array.isArray(body.languages)) {
                doc.languages = body.languages
                    .map((c) => String(c).trim())
                    .filter(Boolean)
                    .slice(0, 30);
            }
            if (body.followers && typeof body.followers === 'object') {
                doc.followers = doc.followers || {};
                for (const key of ['instagram', 'tiktok', 'youtube', 'twitter']) {
                    const n = Number(body.followers[key]);
                    if (Number.isFinite(n) && n >= 0) doc.followers[key] = Math.round(n);
                }
                doc.markModified('followers');
                doc.totalFollowers =
                    (Number(doc.followers.instagram) || 0) +
                    (Number(doc.followers.tiktok) || 0) +
                    (Number(doc.followers.youtube) || 0) +
                    (Number(doc.followers.twitter) || 0);
            }

            if (body.status && ['active', 'pending', 'verified', 'suspended'].includes(body.status)) {
                doc.status = body.status;
            }
            if (
                body.identityVerificationStatus &&
                ['pending', 'approved', 'rejected'].includes(body.identityVerificationStatus)
            ) {
                doc.identityVerificationStatus = body.identityVerificationStatus;
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
            const [enrichmentMap, installAgg, outreachDocs, pendingAppsMap] = await Promise.all([
                buildMarketplaceListEnrichmentMap(ids),
                aggregateInstallCountsByInfluencer(ids),
                InfluencerCrmOutreach.find({ influencerId: { $in: oids } }).lean(),
                buildPendingApplicationsMap(ids),
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
                    ...pendingFieldsForCard(pendingAppsMap, infId),
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

            const [enrichmentMap, installAgg, outreachDocs, monetizationDocs, liveActivityMap, pendingAppsMap] =
                await Promise.all([
                    buildMarketplaceListEnrichmentMap(filteredIds),
                    aggregateInstallCountsByInfluencer(filteredIds),
                    InfluencerCrmOutreach.find({ influencerId: { $in: filteredOids } }).lean(),
                    InfluencerCrmMonetization.find({ influencerId: { $in: filteredOids } }).lean(),
                    buildLiveActivityBatch(filteredIds, { recentPerInfluencer: 3 }),
                    buildPendingApplicationsMap(filteredIds),
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
                    ...pendingFieldsForCard(pendingAppsMap, infId),
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

    /** GET /api/admin/crm/promotions/verification-queue — cola de promos sin deal pendientes */
    async listPromotionVerificationQueue(req, res) {
        try {
            const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 20));
            const statusFilter = String(req.query.verificationStatus || 'pending_review').trim();

            const query = { promotionKind: 'verification_only' };
            if (statusFilter && statusFilter !== 'all') {
                query.verificationStatus = statusFilter;
            }

            const result = await Promotion.paginate(query, {
                page,
                limit,
                sort: { createdAt: -1 },
            });

            return res.json({
                success: true,
                data: {
                    ...result,
                    docs: (result.docs || []).map((doc) =>
                        enrichPromotionClientFields(doc.toObject ? doc.toObject() : doc),
                    ),
                },
                message: 'Cola de verificación de promociones sin deal',
            });
        } catch (error) {
            console.error('❌ CRM verification queue:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /** PATCH /api/admin/crm/promotions/:id/verification — aprobar o rechazar verificación */
    async patchPromotionVerification(req, res) {
        try {
            const id = String(req.params.id || '').trim();
            if (!this.isValidObjectId(id)) {
                return res.status(400).json({ success: false, message: 'ID inválido' });
            }

            const action = String(req.body?.action || '').trim().toLowerCase();
            if (action !== 'approve' && action !== 'reject') {
                return res.status(400).json({
                    success: false,
                    message: 'action debe ser "approve" o "reject"',
                });
            }

            const promotion = await Promotion.findById(id);
            if (!promotion) {
                return res.status(404).json({ success: false, message: 'Promoción no encontrada' });
            }
            if (promotion.promotionKind !== 'verification_only') {
                return res.status(400).json({
                    success: false,
                    message: 'Solo aplica a promociones verification_only (sin deal)',
                });
            }

            const now = new Date();
            promotion.verification = promotion.verification || {};
            promotion.verification.reviewedAt = now;
            promotion.verification.reviewedByUserId = req.user?._id ? String(req.user._id) : undefined;

            if (action === 'approve') {
                promotion.verificationStatus = 'approved';
                if (req.body?.activateOnApprove === true || req.body?.activateOnApprove === 'true') {
                    promotion.status = 'active';
                }
            } else {
                promotion.verificationStatus = 'rejected';
                const reason = req.body?.rejectionReason;
                if (reason != null && String(reason).trim()) {
                    promotion.verification.rejectionReason = String(reason).trim().slice(0, 2000);
                }
                if (promotion.status === 'active') {
                    promotion.status = 'draft';
                }
            }

            await promotion.save();

            return res.json({
                success: true,
                data: {
                    id: promotion._id,
                    status: promotion.status,
                    ...serializePromotionKindFields(promotion.toObject ? promotion.toObject() : promotion),
                },
                message:
                    action === 'approve'
                        ? 'Promoción verificada y aprobada'
                        : 'Promoción rechazada en verificación',
            });
        } catch (error) {
            console.error('❌ CRM patch promotion verification:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * PATCH /api/admin/crm/promotions/:id/accessibility
     * Abre/cierra una promoción a todos los influencers o por temas (categorías del influencer).
     * Body: { openToAllInfluencers?: boolean, openToInfluencerCategories?: string[] }
     */
    async patchPromotionAccessibility(req, res) {
        try {
            const id = String(req.params.id || '').trim();
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ success: false, message: 'ID inválido' });
            }
            const body = req.body || {};
            const update = {};
            if (body.openToAllInfluencers !== undefined) {
                update.openToAllInfluencers =
                    body.openToAllInfluencers === true || body.openToAllInfluencers === 'true';
            }
            if (body.openToInfluencerCategories !== undefined) {
                const arr = Array.isArray(body.openToInfluencerCategories)
                    ? body.openToInfluencerCategories
                    : [];
                update.openToInfluencerCategories = [
                    ...new Set(arr.map((c) => String(c || '').trim()).filter(Boolean)),
                ];
            }
            if (!Object.keys(update).length) {
                return res.status(400).json({ success: false, message: 'Nada que actualizar.' });
            }

            const promo = await Promotion.findByIdAndUpdate(id, { $set: update }, { new: true })
                .select('_id title brand status openToAllInfluencers openToInfluencerCategories')
                .lean();
            if (!promo) {
                return res.status(404).json({ success: false, message: 'Promoción no encontrada.' });
            }

            return res.json({
                success: true,
                data: {
                    id: String(promo._id),
                    title: promo.title || null,
                    brand: promo.brand || null,
                    status: promo.status || null,
                    openToAllInfluencers: !!promo.openToAllInfluencers,
                    openToInfluencerCategories: Array.isArray(promo.openToInfluencerCategories)
                        ? promo.openToInfluencerCategories
                        : [],
                },
                message: 'Accesibilidad actualizada.',
            });
        } catch (error) {
            console.error('❌ CRM patch promotion accessibility:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new AdminCrmController();
