'use strict';

const mongoose = require('mongoose');
const Influencer = require('../models/Influencer');
const InfluencerCrmEvent = require('../models/InfluencerCrmEvent');
const { buildMarketplaceListEnrichmentMap, computePublicProfileFieldOverrides } = require('./influencerProfileEnrichment');
const InfluencerCrmOutreach = require('../models/InfluencerCrmOutreach');
const { serializeOutreach } = require('./influencerCrmOutreach');

const INFLUENCER_GENERAL_USERNAME = 'influencer-general';

const APP_KEYS = {
    DAMECODIGO_INFLUENCER: 'damecodigo_influencer',
    BIZNEAI_MERCHANT: 'bizneai_merchant',
    WEB: 'web',
};

const CRM_APP_FIELD = {
    [APP_KEYS.DAMECODIGO_INFLUENCER]: 'damecodigoInfluencer',
    [APP_KEYS.BIZNEAI_MERCHANT]: 'bizneaiMerchant',
};

const ACTIVATION_STATUSES = [
    'not_started',
    'onboarding',
    'pending_review',
    'active',
    'verified',
    'suspended',
    'inactive',
];

const DATA_SUBMISSION_STATUSES = ['not_started', 'incomplete', 'partial', 'complete'];

function safeNum(n, fallback = 0) {
    const x = Number(n);
    return Number.isFinite(x) ? x : fallback;
}

function defaultCrmApps() {
    return {
        damecodigoInfluencer: {
            installCount: 0,
            firstInstallAt: null,
            lastOpenAt: null,
            lastVersion: '',
            lastPlatform: '',
        },
        bizneaiMerchant: {
            installCount: 0,
            firstInstallAt: null,
            lastOpenAt: null,
            lastVersion: '',
            lastPlatform: '',
        },
    };
}

function defaultCrm() {
    return {
        activationStatus: 'not_started',
        dataSubmissionStatus: 'not_started',
        profileCompleteness: 0,
        terms: { accepted: false, acceptedAt: null, version: '', summary: '' },
        apps: defaultCrmApps(),
        onboardingStep: '',
        adminNotes: '',
        lastContactAt: null,
        updatedByAdminAt: null,
    };
}

/**
 * % de perfil listo (bio, avatar, redes, categorías, userId).
 * @param {object} inf lean influencer
 */
function computeProfileCompleteness(inf) {
    if (!inf) return 0;
    let score = 0;
    const checks = [
        Boolean((inf.name || '').trim()),
        Boolean((inf.username || '').trim()),
        Boolean((inf.avatar || '').trim()),
        Boolean((inf.bio || '').trim().length >= 20),
        Boolean((inf.location || '').trim()),
        Array.isArray(inf.categories) && inf.categories.length > 0,
        Boolean(inf.userId),
        safeNum(inf.totalFollowers) > 0 ||
            safeNum(inf.followers?.instagram) > 0 ||
            safeNum(inf.followers?.tiktok) > 0,
        Boolean(inf.socialMedia?.instagram || inf.socialMedia?.tiktok || inf.socialMedia?.youtube),
    ];
    checks.forEach((ok) => {
        if (ok) score += 1;
    });
    return Math.round((score / checks.length) * 100);
}

function deriveDataSubmissionStatus(inf, completeness) {
    if (!inf?.userId && completeness < 15) return 'not_started';
    if (completeness >= 85) return 'complete';
    if (completeness >= 45) return 'partial';
    return 'incomplete';
}

function mapInfluencerStatusToActivation(status, crmActivation) {
    if (crmActivation && crmActivation !== 'not_started') return crmActivation;
    if (status === 'verified') return 'verified';
    if (status === 'active') return 'active';
    if (status === 'suspended') return 'suspended';
    if (status === 'pending') return 'pending_review';
    return 'onboarding';
}

function normalizeAppKey(raw) {
    const k = String(raw || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_');
    if (k === 'damecodigo' || k === 'damecodigo_influencer' || k === 'influencer' || k === 'link4deal') {
        return APP_KEYS.DAMECODIGO_INFLUENCER;
    }
    if (k === 'bizneai' || k === 'bizneai_merchant' || k === 'bizne' || k === 'merchant' || k === 'shops') {
        return APP_KEYS.BIZNEAI_MERCHANT;
    }
    if (CRM_APP_FIELD[k]) return k;
    return null;
}

/**
 * Registra evento y actualiza contadores en Influencer.crm.apps.
 */
async function recordInfluencerCrmEvent(opts) {
    const {
        influencerId,
        userId,
        appKey: rawAppKey,
        eventType,
        platform,
        appVersion,
        deviceId,
        termsVersion,
        termsSummary,
        metadata,
        req,
    } = opts;

    const appKey = normalizeAppKey(rawAppKey) || APP_KEYS.WEB;
    const infId = influencerId && mongoose.Types.ObjectId.isValid(String(influencerId))
        ? new mongoose.Types.ObjectId(String(influencerId))
        : null;

    let uid = userId && mongoose.Types.ObjectId.isValid(String(userId))
        ? new mongoose.Types.ObjectId(String(userId))
        : null;

    if (!infId && uid) {
        const linked = await Influencer.findOne({ userId: uid }).select('_id').lean();
        if (linked) influencerId = linked._id;
    }

    const event = await InfluencerCrmEvent.create({
        influencerId: infId || (influencerId ? new mongoose.Types.ObjectId(String(influencerId)) : undefined),
        userId: uid || undefined,
        appKey,
        eventType,
        platform: platform ? String(platform).slice(0, 32) : undefined,
        appVersion: appVersion ? String(appVersion).slice(0, 32) : undefined,
        deviceId: deviceId ? String(deviceId).slice(0, 128) : undefined,
        termsVersion: termsVersion ? String(termsVersion).slice(0, 64) : undefined,
        metadata: metadata || undefined,
        ip: req?.ip || req?.headers?.['x-forwarded-for']?.toString()?.split(',')[0]?.trim(),
        userAgent: req?.headers?.['user-agent']?.slice(0, 512),
    });

    const field = CRM_APP_FIELD[appKey];
    const infOid =
        event.influencerId ||
        (influencerId && mongoose.Types.ObjectId.isValid(String(influencerId))
            ? new mongoose.Types.ObjectId(String(influencerId))
            : null);

    if (!infOid) {
        return { event, influencer: null };
    }

    const now = new Date();
    const inf = await Influencer.findById(infOid);
    if (!inf) return { event, influencer: null };

    if (!inf.crm || typeof inf.crm !== 'object') {
        inf.crm = defaultCrm();
    }
    if (!inf.crm.apps) inf.crm.apps = defaultCrmApps();

    const completeness = computeProfileCompleteness(inf);
    inf.crm.profileCompleteness = completeness;
    inf.crm.dataSubmissionStatus = deriveDataSubmissionStatus(inf, completeness);

    if (eventType === 'terms_accepted') {
        inf.crm.terms = inf.crm.terms || {};
        inf.crm.terms.accepted = true;
        inf.crm.terms.acceptedAt = now;
        if (termsVersion) inf.crm.terms.version = String(termsVersion).slice(0, 64);
        if (termsSummary) inf.crm.terms.summary = String(termsSummary).slice(0, 2000);
    }

    if (field && (eventType === 'install' || eventType === 'open')) {
        const slot = inf.crm.apps[field] || {};
        if (eventType === 'install') {
            slot.installCount = safeNum(slot.installCount) + 1;
            if (!slot.firstInstallAt) slot.firstInstallAt = now;
        }
        slot.lastOpenAt = now;
        if (appVersion) slot.lastVersion = String(appVersion).slice(0, 32);
        if (platform) slot.lastPlatform = String(platform).slice(0, 32);
        inf.crm.apps[field] = slot;
        inf.markModified('crm.apps');
    }

    if (inf.crm.activationStatus === 'not_started' && inf.status === 'pending') {
        inf.crm.activationStatus = 'onboarding';
    }

    await inf.save();
    return { event, influencer: inf };
}

/**
 * Fila CRM para listado admin.
 */
async function buildCrmInfluencerRow(doc, enrichmentPack, installAgg, outreachSerialized = null) {
    const d = doc;
    const id = String(d._id);
    const crmRaw = d.crm || {};
    const completeness = computeProfileCompleteness(d);
    const dataSubmissionStatus =
        crmRaw.dataSubmissionStatus || deriveDataSubmissionStatus(d, completeness);
    const activationStatus = mapInfluencerStatusToActivation(
        d.status,
        crmRaw.activationStatus,
    );

    const apps = { ...defaultCrmApps(), ...(crmRaw.apps || {}) };
    const agg = installAgg?.get(id);
    if (agg) {
        for (const [appKey, counts] of Object.entries(agg)) {
            const field = CRM_APP_FIELD[appKey];
            if (!field) continue;
            apps[field] = {
                ...apps[field],
                installCount: Math.max(safeNum(apps[field]?.installCount), safeNum(counts.install)),
                openCount: safeNum(counts.open),
            };
        }
    }

    const user = d.userId && typeof d.userId === 'object' ? d.userId : null;
    let wallet =
        user?.blockchain?.walletAddress && String(user.blockchain.walletAddress).trim()
            ? String(user.blockchain.walletAddress).trim()
            : null;

    const enriched = enrichmentPack
        ? computePublicProfileFieldOverrides(
              enrichmentPack.rows || [],
              enrichmentPack.tokensWithoutPromotionId || 0,
              {
                  couponStats: d.couponStats,
                  recentPromotions: d.recentPromotions,
                  totalEarnings: d.totalEarnings,
                  activePromotions: d.activePromotions,
                  completedPromotions: d.completedPromotions,
              },
              enrichmentPack.apps || [],
          )
        : null;

    const hasDamecodigo = safeNum(apps.damecodigoInfluencer?.installCount) > 0;
    const hasBizneai = safeNum(apps.bizneaiMerchant?.installCount) > 0;

    return {
        id,
        name: d.name || '',
        username: d.username || '',
        avatar: d.avatar || '',
        status: d.status || 'pending',
        joinDate: d.joinDate ? new Date(d.joinDate).toISOString() : null,
        profileShortCode: d.profileShortCode || '',
        location: d.location || '',
        totalFollowers: safeNum(d.totalFollowers),
        profileCompleteness: completeness,
        activationStatus,
        dataSubmissionStatus,
        terms: {
            accepted: Boolean(crmRaw.terms?.accepted),
            acceptedAt: crmRaw.terms?.acceptedAt
                ? new Date(crmRaw.terms.acceptedAt).toISOString()
                : null,
            version: crmRaw.terms?.version || '',
        },
        apps: {
            damecodigoInfluencer: {
                installCount: safeNum(apps.damecodigoInfluencer?.installCount),
                firstInstallAt: apps.damecodigoInfluencer?.firstInstallAt
                    ? new Date(apps.damecodigoInfluencer.firstInstallAt).toISOString()
                    : null,
                lastOpenAt: apps.damecodigoInfluencer?.lastOpenAt
                    ? new Date(apps.damecodigoInfluencer.lastOpenAt).toISOString()
                    : null,
                lastVersion: apps.damecodigoInfluencer?.lastVersion || '',
                lastPlatform: apps.damecodigoInfluencer?.lastPlatform || '',
            },
            bizneaiMerchant: {
                installCount: safeNum(apps.bizneaiMerchant?.installCount),
                firstInstallAt: apps.bizneaiMerchant?.firstInstallAt
                    ? new Date(apps.bizneaiMerchant.firstInstallAt).toISOString()
                    : null,
                lastOpenAt: apps.bizneaiMerchant?.lastOpenAt
                    ? new Date(apps.bizneaiMerchant.lastOpenAt).toISOString()
                    : null,
                lastVersion: apps.bizneaiMerchant?.lastVersion || '',
                lastPlatform: apps.bizneaiMerchant?.lastPlatform || '',
            },
        },
        appsInstalledSummary: {
            damecodigoInfluencer: hasDamecodigo,
            bizneaiMerchant: hasBizneai,
            both: hasDamecodigo && hasBizneai,
            none: !hasDamecodigo && !hasBizneai,
        },
        onboardingStep: crmRaw.onboardingStep || '',
        adminNotes: crmRaw.adminNotes || '',
        lastContactAt: crmRaw.lastContactAt
            ? new Date(crmRaw.lastContactAt).toISOString()
            : null,
        user: user
            ? {
                  id: String(user._id),
                  email: user.email || '',
                  firstName: user.firstName || '',
                  lastName: user.lastName || '',
                  phone: user.phone || '',
                  isVerified: Boolean(user.isVerified),
                  isActive: user.isActive !== false,
              }
            : null,
        walletAddress: wallet,
        couponStats: enriched?.couponStats || d.couponStats || {},
        activePromotions: enriched?.activePromotions ?? safeNum(d.activePromotions),
        completedPromotions: enriched?.completedPromotions ?? safeNum(d.completedPromotions),
        totalEarnings: enriched?.totalEarnings ?? safeNum(d.totalEarnings),
        redeemedCoupons: enriched?.couponStats?.totalSales ?? safeNum(d.couponStats?.totalSales),
        outreach: outreachSerialized,
        outreachPipeline: outreachSerialized?.pipelineStage || null,
        outreachPipelineLabel: outreachSerialized?.pipelineStageLabel || null,
        outreachPendingCount: outreachSerialized
            ? (outreachSerialized.deliveries || []).filter((x) => x.status === 'pending').length
            : 0,
    };
}

async function aggregateInstallCountsByInfluencer(ids) {
    const oids = ids.filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => new mongoose.Types.ObjectId(id));
    if (!oids.length) return new Map();

    const rows = await InfluencerCrmEvent.aggregate([
        { $match: { influencerId: { $in: oids }, eventType: { $in: ['install', 'open'] } } },
        {
            $group: {
                _id: { influencerId: '$influencerId', appKey: '$appKey', eventType: '$eventType' },
                n: { $sum: 1 },
            },
        },
    ]);

    /** @type {Map<string, Record<string, { install: number, open: number }>>} */
    const map = new Map();
    for (const r of rows) {
        const infId = String(r._id.influencerId);
        const appKey = r._id.appKey || APP_KEYS.WEB;
        if (!map.has(infId)) map.set(infId, {});
        const bucket = map.get(infId);
        if (!bucket[appKey]) bucket[appKey] = { install: 0, open: 0 };
        if (r._id.eventType === 'install') bucket[appKey].install += r.n;
        else bucket[appKey].open += r.n;
    }
    return map;
}

module.exports = {
    APP_KEYS,
    ACTIVATION_STATUSES,
    DATA_SUBMISSION_STATUSES,
    defaultCrm,
    computeProfileCompleteness,
    deriveDataSubmissionStatus,
    normalizeAppKey,
    recordInfluencerCrmEvent,
    buildCrmInfluencerRow,
    aggregateInstallCountsByInfluencer,
    buildMarketplaceListEnrichmentMap,
};
