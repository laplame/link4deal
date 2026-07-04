'use strict';

/**
 * Productos / promociones disponibles en el perfil público del influencer.
 *
 * Una promoción aparece si:
 *   (a) existe una PromotionApplication aprobada para el influencer, O
 *   (b) la promoción está "abierta": openToAllInfluencers === true, o el influencer
 *       tiene alguna categoría que intersecta openToInfluencerCategories.
 * En ambos casos la promoción debe estar activa y vigente (promotionCatalogLive).
 */

const mongoose = require('mongoose');
const PromotionApplication = require('../models/PromotionApplication');
const Promotion = require('../models/Promotion');
const Product = require('../models/Product');
const Influencer = require('../models/Influencer');

const INFLUENCER_GENERAL_USERNAME = 'influencer-general';

const PRODUCT_SELECT =
    'name description shortDescription category tags price originalPrice currency stock images brand seller specifications metrics activePromotions status';

function promotionCatalogLive(pr, now = new Date()) {
    if (!pr || pr.status !== 'active') return false;
    const vu = pr.validUntil != null ? new Date(pr.validUntil).getTime() : NaN;
    if (!Number.isFinite(vu) || vu < now.getTime()) return false;
    const vf = pr.validFrom != null ? new Date(pr.validFrom).getTime() : 0;
    return vf <= now.getTime();
}

function productPrimaryImagePath(product) {
    if (!product) return '';
    const imgs = Array.isArray(product.images) ? product.images : [];
    const primary = imgs.find((i) => i && i.isPrimary) || imgs[0];
    if (!primary) return '';
    if (primary.path && String(primary.path).trim()) return String(primary.path).trim();
    if (primary.filename) {
        const fn = String(primary.filename).trim();
        if (fn.startsWith('http://') || fn.startsWith('https://')) return fn;
        if (fn.startsWith('/uploads/')) return fn;
        return `/uploads/${fn.replace(/^\/+/, '')}`;
    }
    return '';
}

/** Normaliza categorías del influencer a strings limpios. */
function normalizeInfluencerCategories(inf) {
    const cats = Array.isArray(inf?.categories) ? inf.categories : [];
    return cats.map((c) => String(c || '').trim()).filter(Boolean);
}

/**
 * Promociones abiertas (a todos o por temas) vigentes para un influencer.
 * @param {string[]} categories
 * @returns {Promise<object[]>}
 */
async function findOpenLivePromotionsForCategories(categories, now = new Date()) {
    const or = [{ openToAllInfluencers: true }];
    if (Array.isArray(categories) && categories.length) {
        or.push({ openToInfluencerCategories: { $in: categories } });
    }
    const openPromos = await Promotion.find({ status: 'active', $or: or }).lean();
    return openPromos.filter((p) => promotionCatalogLive(p, now));
}

/**
 * @param {string} influencerId
 * @returns {Promise<object[]>}
 */
async function buildInfluencerAvailableProducts(influencerId) {
    const idStr = String(influencerId || '').trim();
    if (!mongoose.Types.ObjectId.isValid(idStr)) return [];

    const oid = new mongoose.Types.ObjectId(idStr);
    const now = new Date();

    const inf = await Influencer.findById(oid).select('categories username').lean();
    const isSystem = inf?.username === INFLUENCER_GENERAL_USERNAME;
    const categories = normalizeInfluencerCategories(inf);

    const apps = await PromotionApplication.find({
        influencerApplicant: oid,
        status: 'approved',
    })
        .populate('promotion')
        .sort({ updatedAt: -1 })
        .lean();

    /**
     * Fuentes unificadas por promoción. Una promoción aprobada (con applicationId) tiene
     * prioridad sobre la misma promoción "abierta" (sin applicationId).
     * @type {Map<string, { promo: object, applicationId: string|null, approvedAt: Date, accessVia: 'application'|'open' }>}
     */
    const sources = new Map();

    for (const app of apps) {
        const promo = app.promotion;
        if (!promo || !promo._id) continue;
        if (!promotionCatalogLive(promo, now)) continue;
        const pid = String(promo._id);
        if (!sources.has(pid)) {
            sources.set(pid, {
                promo,
                applicationId: String(app._id),
                approvedAt: app.updatedAt || app.createdAt || now,
                accessVia: 'application',
            });
        }
    }

    // Promociones abiertas (no aplican al influencer sistema).
    if (!isSystem) {
        const openPromos = await findOpenLivePromotionsForCategories(categories, now);
        for (const promo of openPromos) {
            if (!promo || !promo._id) continue;
            const pid = String(promo._id);
            if (sources.has(pid)) continue;
            sources.set(pid, {
                promo,
                applicationId: null,
                approvedAt: promo.updatedAt || promo.createdAt || now,
                accessVia: 'open',
            });
        }
    }

    if (!sources.size) return [];

    const sourceList = [...sources.values()];
    const promoIds = sourceList.map((s) => s.promo._id);
    const productIdSet = new Set();

    for (const s of sourceList) {
        const allowed = Array.isArray(s.promo.allowedProductIds) ? s.promo.allowedProductIds : [];
        for (const pid of allowed) {
            const str = String(pid || '').trim();
            if (str) productIdSet.add(str);
        }
    }

    const linkedProducts = await Product.find({
        status: 'active',
        activePromotions: { $in: promoIds },
    })
        .select(PRODUCT_SELECT)
        .lean();

    /** @type {Map<string, object[]>} */
    const productsByPromo = new Map();
    for (const prod of linkedProducts) {
        const promosOnProduct = Array.isArray(prod.activePromotions) ? prod.activePromotions : [];
        for (const pr of promosOnProduct) {
            const key = String(pr);
            if (!productsByPromo.has(key)) productsByPromo.set(key, []);
            productsByPromo.get(key).push(prod);
        }
        productIdSet.add(String(prod._id));
    }

    let explicitProducts = [];
    const explicitIds = [...productIdSet].filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (explicitIds.length) {
        explicitProducts = await Product.find({
            _id: { $in: explicitIds },
            status: 'active',
        })
            .select(PRODUCT_SELECT)
            .lean();
    }

    const productById = new Map(explicitProducts.map((p) => [String(p._id), p]));

    /** @type {Map<string, object>} dedupe by cardKey */
    const seen = new Map();

    for (const source of sourceList) {
        const promo = source.promo;
        const promotionId = String(promo._id);
        const approvedAt = new Date(source.approvedAt).toISOString();
        const applicationId = source.applicationId;
        const accessVia = source.accessVia;

        /** @type {object[]} */
        let catalogProducts = [];

        const allowed = Array.isArray(promo.allowedProductIds) ? promo.allowedProductIds : [];
        if (allowed.length) {
            for (const pid of allowed) {
                const prod = productById.get(String(pid));
                if (prod) catalogProducts.push(prod);
            }
        }

        const linked = productsByPromo.get(promotionId) || [];
        for (const p of linked) {
            if (!catalogProducts.some((x) => String(x._id) === String(p._id))) {
                catalogProducts.push(p);
            }
        }

        if (!catalogProducts.length) {
            const cardKey = `promo:${promotionId}`;
            if (!seen.has(cardKey)) {
                seen.set(cardKey, {
                    cardKey,
                    kind: 'promotion',
                    promotionId,
                    catalogProductId: null,
                    promotion: promo,
                    catalogProduct: null,
                    brandApprovedAt: approvedAt,
                    applicationId,
                    accessVia,
                    primaryImage: null,
                });
            }
            continue;
        }

        for (const prod of catalogProducts) {
            const catalogProductId = String(prod._id);
            const cardKey = `prod:${catalogProductId}:promo:${promotionId}`;
            if (seen.has(cardKey)) continue;
            seen.set(cardKey, {
                cardKey,
                kind: 'catalog',
                promotionId,
                catalogProductId,
                promotion: promo,
                catalogProduct: {
                    id: catalogProductId,
                    name: prod.name,
                    description: prod.description || prod.shortDescription || '',
                    category: prod.category,
                    tags: prod.tags || [],
                    price: prod.price,
                    originalPrice: prod.originalPrice,
                    currency: prod.currency,
                    stock: prod.stock,
                    brand: prod.brand?.name || promo.brand || '',
                    image: productPrimaryImagePath(prod),
                    metrics: prod.metrics || {},
                },
                brandApprovedAt: approvedAt,
                applicationId,
                accessVia,
                primaryImage: productPrimaryImagePath(prod),
            });
        }
    }

    return [...seen.values()].sort((a, b) => {
        const ta = new Date(a.brandApprovedAt).getTime();
        const tb = new Date(b.brandApprovedAt).getTime();
        if (tb !== ta) return tb - ta;
        const na = (a.catalogProduct?.name || a.promotion?.title || '').toLowerCase();
        const nb = (b.catalogProduct?.name || b.promotion?.title || '').toLowerCase();
        return na.localeCompare(nb);
    });
}

module.exports = {
    buildInfluencerAvailableProducts,
    productPrimaryImagePath,
    findOpenLivePromotionsForCategories,
    normalizeInfluencerCategories,
};
