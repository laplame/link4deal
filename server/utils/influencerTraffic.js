'use strict';

const crypto = require('crypto');
const mongoose = require('mongoose');
const Influencer = require('../models/Influencer');
const InfluencerTrafficVisit = require('../models/InfluencerTrafficVisit');
const Promotion = require('../models/Promotion');
const { normalizeSlugInput, docMatchesPublicSlug, resolveCanonicalPublicSlug } = require('./influencerSlug');
const { isPlatformSuperuserEmail } = require('./platformSuperuser');
const { isExcludedAnalyticsTraffic } = require('./isExcludedAnalyticsHost');

const INFLUENCER_GENERAL_USERNAME = 'influencer-general';

const ENTRY_TYPES = new Set(['profile', 'store', 'promo', 'coupon', 'faq', 'edit', 'auth', 'other']);

const CHANNEL_ORDER = ['profile', 'store', 'promo', 'coupon', 'faq', 'edit', 'auth', 'other'];

const CHANNEL_LABELS = {
    profile: 'Perfil',
    store: 'Tienda',
    promo: 'Promo / link único',
    coupon: 'Cupón QR',
    faq: 'FAQ',
    edit: 'Edición',
    auth: 'Auth',
    other: 'Otro',
};

function pathOnly(urlPath) {
    return String(urlPath || '').split('?')[0].split('#')[0];
}

function extractPromoIdFromPath(urlPath) {
    const p = pathOnly(urlPath);
    const m = p.match(/\/promo\/([a-f0-9]{24})/i);
    return m ? m[1] : null;
}

/** Clasifica la visita para el desglose en el perfil del influencer. */
function resolveVisitChannel(entryType, pagePath, entryPath) {
    const p = pathOnly(pagePath) || pathOnly(entryPath);
    if (/^\/coupon\//i.test(p)) return 'coupon';
    if (entryType === 'store' || /\/(?:deals|tienda)(?:\/|$)/i.test(p)) return 'store';
    if (entryType === 'promo' || /\/promo\//i.test(p)) return 'promo';
    if (entryType === 'coupon') return 'coupon';
    if (entryType === 'faq' || /\/faq(?:\/|$)/i.test(p)) return 'faq';
    if (entryType === 'profile' || /^\/influencer\/[^/]+\/?$/i.test(p)) return 'profile';
    if (ENTRY_TYPES.has(entryType)) return entryType;
    return 'other';
}

function buildChannelLinksForSlug(slug, influencerId) {
    const s = encodeURIComponent(slug || '');
    const refQ = influencerId ? `?ref=${encodeURIComponent(influencerId)}` : '';
    return [
        { channel: 'profile', label: CHANNEL_LABELS.profile, path: `/influencer/${s}` },
        { channel: 'store', label: CHANNEL_LABELS.store, path: `/influencer/${s}/deals` },
        { channel: 'promo', label: CHANNEL_LABELS.promo, path: `/influencer/${s}/promo/{promotionId}` },
        { channel: 'coupon', label: CHANNEL_LABELS.coupon, path: `/coupon/{couponId}${refQ}` },
        { channel: 'faq', label: CHANNEL_LABELS.faq, path: `/influencer/${s}/faq` },
    ];
}

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);
}

function parseInfluencerPath(pathname) {
    const path = String(pathname || '').split('?')[0];
    const m = path.match(/^\/influencer\/([^/]+)(?:\/(.*))?$/i);
    if (!m) return null;
    const slug = normalizeSlugInput(m[1]);
    if (!slug) return null;
    const rest = (m[2] || '').toLowerCase();
    let entryType = 'profile';
    if (rest.startsWith('deals') || rest.startsWith('tienda')) entryType = 'store';
    else if (rest.startsWith('promo/')) entryType = 'promo';
    else if (rest.startsWith('faq')) entryType = 'faq';
    else if (rest.startsWith('edit')) entryType = 'edit';
    else if (rest.startsWith('auth')) entryType = 'auth';
    else if (rest) entryType = 'other';
    return { slug, entryType, entryPath: path };
}

async function resolveInfluencerBySlug(slugParam) {
    const slug = normalizeSlugInput(slugParam);
    if (!slug) return null;
    const slugCompact = slug.replace(/-/g, '');
    let doc = await Influencer.findOne({
        username: { $ne: INFLUENCER_GENERAL_USERNAME },
        $or: [
            { username: { $in: [slug, slugCompact, `@${slug}`] } },
            { 'socialMedia.instagram': { $in: [slug, slugCompact, `@${slug}`] } },
            { 'socialMedia.tiktok': { $in: [slug, slugCompact, `@${slug}`] } },
        ],
    })
        .select('_id username name socialMedia')
        .lean();

    if (!doc) {
        const docs = await Influencer.find({ username: { $ne: INFLUENCER_GENERAL_USERNAME } })
            .select('_id username name socialMedia')
            .lean();
        doc = docs.find((d) => docMatchesPublicSlug(d, slug));
    }
    if (!doc) return null;
    return {
        id: String(doc._id),
        slug: resolveCanonicalPublicSlug(doc) || slug,
        username: doc.username,
    };
}

async function resolveInfluencerById(id) {
    if (!isValidObjectId(id)) return null;
    const doc = await Influencer.findById(id)
        .select('_id username name socialMedia')
        .lean();
    if (!doc || doc.username === INFLUENCER_GENERAL_USERNAME) return null;
    return {
        id: String(doc._id),
        slug: resolveCanonicalPublicSlug(doc) || normalizeSlugInput(doc.username),
        username: doc.username,
    };
}

/**
 * Registra una visita atribuida al influencer de entrada de la sesión.
 */
async function recordTrafficVisit(payload = {}) {
    if (
        isExcludedAnalyticsTraffic({
            pageLocation: payload.pageLocation,
            referrer: payload.referrer,
        })
    ) {
        return { ok: true, skipped: true, reason: 'local_dev_traffic' };
    }

    const influencerId = payload.influencerId ? String(payload.influencerId).trim() : '';
    const influencerSlug = normalizeSlugInput(payload.influencerSlug || '');

    let inf = null;
    if (influencerId) inf = await resolveInfluencerById(influencerId);
    if (!inf && influencerSlug) inf = await resolveInfluencerBySlug(influencerSlug);
    if (!inf) {
        return { ok: false, status: 404, message: 'Influencer no encontrado' };
    }

    const sessionId = String(payload.sessionId || '').trim().slice(0, 64);
    if (!sessionId) {
        return { ok: false, status: 400, message: 'sessionId requerido' };
    }

    const pagePath = String(payload.pagePath || '/').trim().slice(0, 512);
    const entryPath = String(payload.entryPath || pagePath).trim().slice(0, 512);
    let entryType = String(payload.entryType || 'profile').toLowerCase();
    if (!ENTRY_TYPES.has(entryType)) entryType = 'other';
    if (/^\/coupon\//i.test(pathOnly(pagePath))) entryType = 'coupon';

    const visitChannel = resolveVisitChannel(entryType, pagePath, entryPath);
    const promoId = extractPromoIdFromPath(pagePath) || extractPromoIdFromPath(entryPath);

    const visitId = `vt_${new mongoose.Types.ObjectId().toString()}`;
    const isEntry = Boolean(payload.isEntry);

    await InfluencerTrafficVisit.create({
        visitId,
        influencer: new mongoose.Types.ObjectId(inf.id),
        influencerSlug: inf.slug,
        sessionId,
        visitorId: payload.visitorId ? String(payload.visitorId).trim().slice(0, 64) : null,
        isEntry,
        entryType,
        visitChannel,
        promoId: promoId || null,
        entryPath,
        pagePath,
        pageTitle: String(payload.pageTitle || '').trim().slice(0, 256),
        pageLocation: String(payload.pageLocation || '').trim().slice(0, 768),
        referrer: payload.referrer ? String(payload.referrer).trim().slice(0, 512) : null,
        utmSource: String(payload.utmSource || '').trim().slice(0, 120),
        utmMedium: String(payload.utmMedium || '').trim().slice(0, 120),
        utmCampaign: String(payload.utmCampaign || '').trim().slice(0, 160),
        utmTerm: String(payload.utmTerm || '').trim().slice(0, 120),
        utmContent: String(payload.utmContent || '').trim().slice(0, 120),
        inAppBrowser: payload.inAppBrowser ? String(payload.inAppBrowser).trim().slice(0, 32) : null,
        userAgent: payload.userAgent ? String(payload.userAgent).trim().slice(0, 512) : null,
    });

    return { ok: true, data: { visitId, influencerId: inf.id, influencerSlug: inf.slug } };
}

async function userCanViewTrafficStats(user, influencerId) {
    if (!user) return false;
    if (user.isSuperAdmin === true || isPlatformSuperuserEmail(user.email)) return true;
    const mine = await Influencer.findOne({ userId: user._id }).select('_id').lean();
    return Boolean(mine && String(mine._id) === String(influencerId));
}

async function getTrafficStats(influencerId, opts = {}) {
    const days = Math.min(90, Math.max(1, Number(opts.days) || 30));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const oid = new mongoose.Types.ObjectId(influencerId);

    const channelMatchStage = {
        $match: { influencer: oid, createdAt: { $gte: since } },
    };

    const [totals, byPage, byEntry, byChannel, byPromo, recent] = await Promise.all([
        InfluencerTrafficVisit.aggregate([
            { $match: { influencer: oid, createdAt: { $gte: since } } },
            {
                $group: {
                    _id: null,
                    totalVisits: { $sum: 1 },
                    entryVisits: { $sum: { $cond: ['$isEntry', 1, 0] } },
                    uniqueSessions: { $addToSet: '$sessionId' },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalVisits: 1,
                    entryVisits: 1,
                    uniqueSessions: { $size: '$uniqueSessions' },
                },
            },
        ]),
        InfluencerTrafficVisit.aggregate([
            { $match: { influencer: oid, createdAt: { $gte: since } } },
            { $group: { _id: '$pagePath', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 25 },
            { $project: { _id: 0, pagePath: '$_id', count: 1 } },
        ]),
        InfluencerTrafficVisit.aggregate([
            { $match: { influencer: oid, isEntry: true, createdAt: { $gte: since } } },
            { $group: { _id: '$entryPath', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 15 },
            { $project: { _id: 0, entryPath: '$_id', count: 1 } },
        ]),
        InfluencerTrafficVisit.aggregate([
            channelMatchStage,
            {
                $group: {
                    _id: { $ifNull: ['$visitChannel', '$entryType'] },
                    views: { $sum: 1 },
                    entries: {
                        $sum: {
                            $cond: { if: '$isEntry', then: 1, else: 0 },
                        },
                    },
                    sessions: { $addToSet: '$sessionId' },
                },
            },
            {
                $project: {
                    _id: 0,
                    channel: '$_id',
                    views: 1,
                    entries: 1,
                    uniqueSessions: { $size: '$sessions' },
                },
            },
        ]),
        InfluencerTrafficVisit.aggregate([
            { $match: { influencer: oid, createdAt: { $gte: since }, promoId: { $ne: null } } },
            {
                $group: {
                    _id: '$promoId',
                    views: { $sum: 1 },
                    entries: { $sum: { $cond: ['$isEntry', 1, 0] } },
                    samplePath: { $first: '$pagePath' },
                },
            },
            { $sort: { views: -1 } },
            { $limit: 20 },
            { $project: { _id: 0, promotionId: '$_id', views: 1, entries: 1, samplePath: 1 } },
        ]),
        InfluencerTrafficVisit.find({ influencer: oid, createdAt: { $gte: since } })
            .sort({ createdAt: -1 })
            .limit(40)
            .select(
                'visitId isEntry entryType visitChannel entryPath pagePath pageTitle promoId utmSource utmMedium utmCampaign createdAt sessionId',
            )
            .lean(),
    ]);

    const summary = totals[0] || { totalVisits: 0, entryVisits: 0, uniqueSessions: 0 };

    const inf = await resolveInfluencerById(influencerId);
    const slug = inf?.slug || '';

    const channelMap = new Map(byChannel.map((r) => [r.channel, r]));
    const channelBreakdown = CHANNEL_ORDER.filter((ch) =>
        ['profile', 'store', 'promo', 'coupon', 'faq'].includes(ch),
    ).map((channel) => {
        const row = channelMap.get(channel) || { views: 0, entries: 0, uniqueSessions: 0 };
        const link = buildChannelLinksForSlug(slug, influencerId).find((l) => l.channel === channel);
        return {
            channel,
            label: CHANNEL_LABELS[channel] || channel,
            examplePath: link?.path || '',
            views: row.views || 0,
            entries: row.entries || 0,
            uniqueSessions: row.uniqueSessions || 0,
        };
    });

    const promoIds = byPromo.map((p) => p.promotionId).filter((id) => isValidObjectId(id));
    const promoDocs =
        promoIds.length > 0
            ? await Promotion.find({ _id: { $in: promoIds } })
                  .select('title brand')
                  .lean()
            : [];
    const promoTitleById = new Map(promoDocs.map((p) => [String(p._id), p]));

    const promoLinkBreakdown = byPromo.map((p) => {
        const doc = promoTitleById.get(String(p.promotionId));
        return {
            promotionId: p.promotionId,
            title: doc?.title || null,
            brand: doc?.brand || null,
            views: p.views,
            entries: p.entries,
            path:
                p.samplePath ||
                (slug ? `/influencer/${encodeURIComponent(slug)}/promo/${p.promotionId}` : ''),
        };
    });

    const utmRows = await InfluencerTrafficVisit.aggregate([
        { $match: { influencer: oid, createdAt: { $gte: since }, isEntry: true } },
        {
            $group: {
                _id: {
                    source: { $ifNull: ['$utmSource', ''] },
                    medium: { $ifNull: ['$utmMedium', ''] },
                    campaign: { $ifNull: ['$utmCampaign', ''] },
                },
                entries: { $sum: 1 },
            },
        },
        { $sort: { entries: -1 } },
        { $limit: 10 },
        {
            $project: {
                _id: 0,
                utmSource: '$_id.source',
                utmMedium: '$_id.medium',
                utmCampaign: '$_id.campaign',
                entries: 1,
            },
        },
    ]);

    return {
        periodDays: days,
        since: since.toISOString(),
        totalVisits: summary.totalVisits,
        entryVisits: summary.entryVisits,
        uniqueSessions: summary.uniqueSessions,
        pageBreakdown: byPage,
        entryLinkBreakdown: byEntry,
        channelBreakdown,
        promoLinkBreakdown,
        utmBreakdown: utmRows,
        channelLinks: buildChannelLinksForSlug(slug, influencerId),
        recentVisits: recent.map((r) => ({
            visitId: r.visitId,
            at: r.createdAt,
            isEntry: r.isEntry,
            entryType: r.entryType,
            visitChannel: r.visitChannel || r.entryType,
            entryPath: r.entryPath,
            pagePath: r.pagePath,
            pageTitle: r.pageTitle,
            promoId: r.promoId || null,
            utmSource: r.utmSource,
            utmMedium: r.utmMedium,
            utmCampaign: r.utmCampaign,
            sessionSuffix: r.sessionId ? r.sessionId.slice(-8) : '',
        })),
    };
}

/** Métricas agregadas para análisis público de demanda (sin visitas recientes ni IDs de sesión). */
async function getPublicDemandStats(influencerId, opts = {}) {
    const full = await getTrafficStats(influencerId, opts);
    const entriesPerSession =
        full.uniqueSessions > 0
            ? Math.round((full.entryVisits / full.uniqueSessions) * 100) / 100
            : 0;

    return {
        periodDays: full.periodDays,
        since: full.since,
        totalVisits: full.totalVisits,
        entryVisits: full.entryVisits,
        uniqueSessions: full.uniqueSessions,
        entriesPerSession,
        channelBreakdown: full.channelBreakdown.map((row) => ({
            channel: row.channel,
            label: row.label,
            views: row.views,
            entries: row.entries,
            uniqueSessions: row.uniqueSessions,
        })),
        promoDemand: full.promoLinkBreakdown.map((row) => ({
            promotionId: row.promotionId,
            title: row.title,
            brand: row.brand,
            views: row.views,
            entries: row.entries,
        })),
        topEntryPaths: full.entryLinkBreakdown.slice(0, 10).map((row) => ({
            path: row.entryPath,
            count: row.count,
        })),
        topPages: full.pageBreakdown.slice(0, 10).map((row) => ({
            path: row.pagePath,
            count: row.count,
        })),
        utmBreakdown: (full.utmBreakdown || [])
            .filter((u) => u.utmSource || u.utmMedium || u.utmCampaign)
            .map((u) => ({
                utmSource: u.utmSource || '(directo)',
                utmMedium: u.utmMedium || '—',
                utmCampaign: u.utmCampaign || '—',
                entries: u.entries,
            })),
    };
}

module.exports = {
    parseInfluencerPath,
    resolveInfluencerBySlug,
    resolveInfluencerById,
    recordTrafficVisit,
    userCanViewTrafficStats,
    getTrafficStats,
    getPublicDemandStats,
    isValidObjectId,
    resolveVisitChannel,
    buildChannelLinksForSlug,
    CHANNEL_LABELS,
};
