/**
 * Slug público indexable para promociones (/promo/:slug).
 * Ej.: "20-descuento-tacos-el-guero-roma-norte"
 */

function slugifyPart(input) {
    return String(input || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * @param {object} promo
 * @returns {string}
 */
function buildPromotionPublicSlug(promo) {
    if (!promo || typeof promo !== 'object') return '';

    const discount =
        typeof promo.discountPercentage === 'number' && promo.discountPercentage > 0
            ? `${Math.round(promo.discountPercentage)}-descuento`
            : '';

    const parts = [
        discount,
        promo.title || promo.productName,
        promo.brand || promo.storeName,
        promo.storeLocation?.city,
    ]
        .map(slugifyPart)
        .filter(Boolean);

    let slug = parts.join('-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
    if (slug.length > 140) {
        slug = slug.slice(0, 140).replace(/-+$/, '');
    }
    return slug;
}

/**
 * @param {import('mongoose').Model} Promotion
 * @param {string} baseSlug
 * @param {import('mongoose').Types.ObjectId | string | null} [excludeId]
 */
async function ensureUniquePublicSlug(Promotion, baseSlug, excludeId = null) {
    const root = (baseSlug || 'promo').replace(/-+$/, '') || 'promo';
    let slug = root;
    let n = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const query = { publicSlug: slug };
        if (excludeId) query._id = { $ne: excludeId };
        const exists = await Promotion.exists(query);
        if (!exists) return slug;
        n += 1;
        slug = `${root}-${n}`;
    }
}

function resolvePromotionPublicUrl(slug, id) {
    const base = (process.env.PUBLIC_SITE_URL || 'https://www.damecodigo.com').replace(/\/$/, '');
    if (slug) return `${base}/promo/${encodeURIComponent(slug)}`;
    if (id) return `${base}/promotion-details/${encodeURIComponent(String(id))}`;
    return base;
}

module.exports = {
    slugifyPart,
    buildPromotionPublicSlug,
    ensureUniquePublicSlug,
    resolvePromotionPublicUrl,
};
