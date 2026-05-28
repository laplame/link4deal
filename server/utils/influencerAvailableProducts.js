'use strict';

/**
 * Productos / promociones disponibles en el perfil público del influencer
 * tras aprobación de la marca (PromotionApplication.status === 'approved').
 */

const mongoose = require('mongoose');
const PromotionApplication = require('../models/PromotionApplication');
const Promotion = require('../models/Promotion');
const Product = require('../models/Product');

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

/**
 * @param {string} influencerId
 * @returns {Promise<object[]>}
 */
async function buildInfluencerAvailableProducts(influencerId) {
    const idStr = String(influencerId || '').trim();
    if (!mongoose.Types.ObjectId.isValid(idStr)) return [];

    const oid = new mongoose.Types.ObjectId(idStr);
    const apps = await PromotionApplication.find({
        influencerApplicant: oid,
        status: 'approved',
    })
        .populate('promotion')
        .sort({ updatedAt: -1 })
        .lean();

    if (!apps.length) return [];

    const promoIds = [];
    const productIdSet = new Set();

    for (const app of apps) {
        const promo = app.promotion;
        if (!promo || !promo._id) continue;
        if (!promotionCatalogLive(promo)) continue;
        promoIds.push(promo._id);
        const allowed = Array.isArray(promo.allowedProductIds) ? promo.allowedProductIds : [];
        for (const pid of allowed) {
            const s = String(pid || '').trim();
            if (s) productIdSet.add(s);
        }
    }

    if (!promoIds.length) return [];

    const linkedProducts = await Product.find({
        status: 'active',
        activePromotions: { $in: promoIds },
    })
        .select('name description shortDescription category tags price originalPrice currency stock images brand seller specifications metrics activePromotions status')
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
            .select('name description shortDescription category tags price originalPrice currency stock images brand seller specifications metrics activePromotions status')
            .lean();
    }

    const productById = new Map(explicitProducts.map((p) => [String(p._id), p]));

    /** @type {Map<string, object>} dedupe by cardKey */
    const seen = new Map();

    for (const app of apps) {
        const promo = app.promotion;
        if (!promo || !promo._id) continue;
        if (!promotionCatalogLive(promo)) continue;

        const promotionId = String(promo._id);
        const approvedAt = (app.updatedAt || app.createdAt || new Date()).toISOString();
        const applicationId = String(app._id);

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
};
