/**
 * Páginas de agregación SEO (/promociones/:slug).
 * Alineado a docs/features/promociones_indexables.feature
 */

const AGGREGATION_PAGES = Object.freeze({
    'roma-norte': {
        slug: 'roma-norte',
        title: 'Promociones en Roma Norte — DameCodigo',
        heading: 'Promociones en Roma Norte',
        metaDescription:
            'Descuentos y ofertas activas en Roma Norte, CDMX. Cupones cerca de ti con DameCodigo.',
        keyword: 'promociones en Roma Norte',
        type: 'zone',
        matchPromo(promo) {
            const hay = [
                promo?.storeLocation?.city,
                promo?.storeLocation?.address,
                promo?.storeLocation?.state,
                promo?.chainBrandName,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return /roma\s*norte|roma-norte/.test(hay);
        },
    },
    'restaurantes-cdmx': {
        slug: 'restaurantes-cdmx',
        title: 'Descuentos restaurantes CDMX — DameCodigo',
        heading: 'Descuentos en restaurantes CDMX',
        metaDescription:
            'Promociones y cupones en restaurantes de Ciudad de México. Ofertas de comida cerca de ti.',
        keyword: 'descuentos restaurantes CDMX',
        type: 'category',
        matchPromo(promo) {
            const cat = String(promo?.category || '').toLowerCase();
            if (cat !== 'food') return false;
            const city = [
                promo?.storeLocation?.city,
                promo?.storeLocation?.state,
                promo?.storeLocation?.address,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return /cdmx|ciudad de m[eé]xico|m[eé]xico/.test(city);
        },
    },
    'belleza-cdmx': {
        slug: 'belleza-cdmx',
        title: 'Descuentos belleza CDMX — DameCodigo',
        heading: 'Descuentos belleza en CDMX',
        metaDescription:
            'Ofertas de belleza, spa y cuidado personal en Ciudad de México.',
        keyword: 'descuentos belleza CDMX',
        type: 'category',
        matchPromo(promo) {
            const cat = String(promo?.category || '').toLowerCase();
            if (cat !== 'beauty') return false;
            const city = [
                promo?.storeLocation?.city,
                promo?.storeLocation?.state,
                promo?.storeLocation?.address,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return /cdmx|ciudad de m[eé]xico|m[eé]xico|guadalajara|monterrey/.test(city);
        },
    },
});

function listAggregationPages() {
    return Object.values(AGGREGATION_PAGES);
}

function getAggregationPage(slug) {
    if (!slug) return null;
    const key = String(slug).trim().toLowerCase();
    return AGGREGATION_PAGES[key] || null;
}

function filterPromosForAggregation(page, promos) {
    if (!page || !Array.isArray(promos)) return [];
    return promos.filter((p) => page.matchPromo(p));
}

module.exports = {
    AGGREGATION_PAGES,
    listAggregationPages,
    getAggregationPage,
    filterPromosForAggregation,
};
