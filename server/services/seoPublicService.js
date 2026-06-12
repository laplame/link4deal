const mongoose = require('mongoose');
const Promotion = require('../models/Promotion');
const database = require('../config/database');
const { enrichPromotionClientFields } = require('../utils/promotionClientFields');
const { buildPublicVisibilityClause, mergeMongoClauses } = require('../utils/promotionKind');
const {
    listAggregationPages,
    getAggregationPage,
    filterPromosForAggregation,
} = require('../utils/promotionAggregationCatalog');
const { buildPromotionPublicSlug } = require('../utils/promotionPublicSlug');
const {
    renderMarketplacePage,
    renderPromoDetailPage,
    renderAggregationPage,
    buildSitemapXml,
    buildRobotsTxt,
} = require('../utils/seoPrerenderHtml');

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

    return null;
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

module.exports = {
    fetchActivePromotions,
    findPromotionBySlugOrId,
    renderSitemapXml,
    renderRobotsTxt,
    renderMarketplaceHtml,
    renderPromoHtml,
    renderAggregationHtml,
    getAggregationApiPayload,
    listAggregationPages,
};
