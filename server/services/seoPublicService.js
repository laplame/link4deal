const mongoose = require('mongoose');
const Promotion = require('../models/Promotion');
const Influencer = require('../models/Influencer');
const Brand = require('../models/Brand');
const database = require('../config/database');
const { enrichPromotionClientFields } = require('../utils/promotionClientFields');
const { buildPublicVisibilityClause, mergeMongoClauses } = require('../utils/promotionKind');
const {
    listAggregationPages,
    getAggregationPage,
    filterPromosForAggregation,
} = require('../utils/promotionAggregationCatalog');
const { buildPromotionPublicSlug } = require('../utils/promotionPublicSlug');
const { normalizeSlugInput, docMatchesPublicSlug } = require('../utils/influencerSlug');
const {
    renderMarketplacePage,
    renderInfluencerIndexPage,
    renderPromoDetailPage,
    renderAggregationPage,
    buildSitemapXml,
    buildRobotsTxt,
    renderSpaWithHead,
    buildPromoHead,
    buildInfluencerHead,
    buildBrandHead,
    buildCategoryHead,
} = require('../utils/seoPrerenderHtml');

const INFLUENCER_GENERAL_USERNAME = 'influencer-general';

function isMongoConnected() {
    return database.getConnectionStatus().isConnected;
}

async function fetchActivePromotions(limit = 500) {
    if (!isMongoConnected()) {
        if (global.simulatedPromotions) {
            return global.simulatedPromotions.filter((p) => p.status === 'active');
        }
        return [];
    }

    const now = new Date();
    const query = mergeMongoClauses(
        {
            status: 'active',
            validUntil: { $gte: now },
        },
        buildPublicVisibilityClause()
    );

    const docs = await Promotion.find(query)
        .sort({ updatedAt: -1 })
        .limit(Math.min(limit, 2000))
        .lean();

    return docs.map((d) => enrichPromotionClientFields(d));
}

async function findPromotionBySlugOrId(slugOrId) {
    const key = String(slugOrId || '').trim();
    if (!key) return null;

    if (!isMongoConnected()) {
        if (!global.simulatedPromotions) return null;
        return (
            global.simulatedPromotions.find(
                (p) =>
                    p._id === key ||
                    p.id === key ||
                    p.publicSlug === key ||
                    buildPromotionPublicSlug(p) === key
            ) || null
        );
    }

    if (mongoose.Types.ObjectId.isValid(key)) {
        const byId = await Promotion.findById(key).lean();
        if (byId) return enrichPromotionClientFields(byId);
    }

    const bySlug = await Promotion.findOne({ publicSlug: key.toLowerCase() }).lean();
    if (bySlug) return enrichPromotionClientFields(bySlug);

    // Fallback: el publicSlug suele calcularse al vuelo (no se persiste). Resolver
    // contra las promociones activas comparando el slug calculado.
    const keyNorm = key.toLowerCase();
    const active = await fetchActivePromotions(2000);
    const match = active.find(
        (p) => (p.publicSlug || buildPromotionPublicSlug(p)) === keyNorm
    );
    return match || null;
}

async function getSitemapData() {
    const promotions = await fetchActivePromotions(1000);
    const aggregations = listAggregationPages();
    return { promotions, aggregations };
}

async function renderSitemapXml() {
    const data = await getSitemapData();
    return buildSitemapXml(data);
}

function renderRobotsTxt() {
    return buildRobotsTxt();
}

async function renderMarketplaceHtml() {
    const promotions = await fetchActivePromotions(50);
    return renderMarketplacePage(promotions);
}

async function fetchPublicInfluencers(limit = 50) {
    if (!isMongoConnected()) return [];
    return Influencer.find({ username: { $ne: INFLUENCER_GENERAL_USERNAME } })
        .sort({ totalFollowers: -1 })
        .limit(Math.min(limit, 100))
        .select('_id name username avatar bio categories socialMedia totalFollowers location')
        .lean();
}

async function renderInfluencerIndexHtml() {
    const influencers = await fetchPublicInfluencers(50);
    return renderInfluencerIndexPage(influencers);
}

async function renderPromoHtml(slugOrId) {
    const promo = await findPromotionBySlugOrId(slugOrId);
    if (!promo) return null;
    return renderPromoDetailPage(promo);
}

async function renderAggregationHtml(slug) {
    const page = getAggregationPage(slug);
    if (!page) return null;
    const all = await fetchActivePromotions(500);
    const filtered = filterPromosForAggregation(page, all);
    return renderAggregationPage(page, filtered.slice(0, 50));
}

async function getAggregationApiPayload(slug) {
    const page = getAggregationPage(slug);
    if (!page) return null;
    const all = await fetchActivePromotions(500);
    const docs = filterPromosForAggregation(page, all);
    return {
        page: {
            slug: page.slug,
            title: page.title,
            heading: page.heading,
            metaDescription: page.metaDescription,
            keyword: page.keyword,
            type: page.type,
        },
        docs,
        totalDocs: docs.length,
    };
}

async function findInfluencerBySlug(slugParam) {
    const slug = normalizeSlugInput(slugParam);
    if (!slug || !isMongoConnected()) return null;

    const slugCompact = slug.replace(/-/g, '');
    let doc = await Influencer.findOne({
        username: { $ne: INFLUENCER_GENERAL_USERNAME },
        $or: [
            { username: { $in: [slug, slugCompact, `@${slug}`] } },
            { 'socialMedia.instagram': { $in: [slug, slugCompact, `@${slug}`] } },
            { 'socialMedia.tiktok': { $in: [slug, slugCompact, `@${slug}`] } },
        ],
    }).lean();

    if (!doc) {
        const docs = await Influencer.find({
            username: { $ne: INFLUENCER_GENERAL_USERNAME },
        })
            .select('_id name username avatar bio categories socialMedia')
            .lean();
        doc = docs.find((d) => docMatchesPublicSlug(d, slug)) || null;
    }
    return doc;
}

async function findBrandById(id) {
    const key = String(id || '').trim();
    if (!key || !isMongoConnected() || !mongoose.Types.ObjectId.isValid(key)) return null;
    return Brand.findById(key).lean();
}

/** /promotion-details/:id — head dinámico + shell SPA. */
async function renderPromoDetailsHeadHtml(slugOrId) {
    const promo = await findPromotionBySlugOrId(slugOrId);
    if (!promo) return renderSpaWithHead({});
    return renderSpaWithHead(buildPromoHead(promo));
}

/** /influencer/:slug — head dinámico + shell SPA. */
async function renderInfluencerHeadHtml(slug) {
    const doc = await findInfluencerBySlug(slug);
    if (!doc) return renderSpaWithHead({});
    return renderSpaWithHead(buildInfluencerHead(doc));
}

/** /brand/:brandId — head dinámico + shell SPA. */
async function renderBrandHeadHtml(brandId) {
    const doc = await findBrandById(brandId);
    if (!doc) return renderSpaWithHead({});
    return renderSpaWithHead(buildBrandHead(doc));
}

/** /category/:slug — head dinámico (catálogo estático) + shell SPA. */
function renderCategoryHeadHtml(slug) {
    const head = buildCategoryHead(slug);
    return renderSpaWithHead(head || {});
}

module.exports = {
    fetchActivePromotions,
    findPromotionBySlugOrId,
    findInfluencerBySlug,
    findBrandById,
    renderSitemapXml,
    renderRobotsTxt,
    renderMarketplaceHtml,
    renderInfluencerIndexHtml,
    renderPromoHtml,
    renderAggregationHtml,
    renderPromoDetailsHeadHtml,
    renderInfluencerHeadHtml,
    renderBrandHeadHtml,
    renderCategoryHeadHtml,
    getAggregationApiPayload,
    listAggregationPages,
};
