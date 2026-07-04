'use strict';

/**
 * Tabla de comisiones de Amazon por categoría (Fixed Commission Income Rates)
 * y cálculo de lo que le toca al influencer tras retener la comisión de la plataforma.
 *
 * Regla de negocio: la plataforma retiene PLATFORM_CUT_RATE (20%) de la comisión de
 * Amazon; el influencer recibe el resto. Ej: categoría al 10% → influencer 8%.
 *
 * Mantener sincronizado con src/utils/amazonCommission.ts.
 */

/** Porcentaje de la comisión de Amazon que retiene la plataforma. */
const PLATFORM_CUT_RATE = 0.2;

/** Lista oficial de categorías y tasas (Amazon Fixed Commission Income Rates). */
const AMAZON_COMMISSION_CATEGORIES = [
    {
        id: 'luxury_beauty',
        label: 'Luxury Beauty, Luxury Stores Beauty, Amazon Explore',
        rate: 10,
    },
    {
        id: 'electronics',
        label: 'Electrónica',
        rate: 7,
    },
    {
        id: 'music_handmade_video',
        label: 'Digital Music, Physical Music, Handmade, Digital Videos',
        rate: 5,
    },
    {
        id: 'books_kitchen_automotive',
        label: 'Physical Books, Kitchen, Automotive',
        rate: 4.5,
    },
    {
        id: 'devices_fashion_apparel',
        label: 'Amazon Devices (Fire, Kindle, Echo, Ring, Fire TV), Fashion & Apparel, Luxury Stores Fashion, Watches, Jewelry, Luggage, Shoes, Handbags & Accessories',
        rate: 4,
    },
    {
        id: 'home_toys_sports',
        label: 'Toys, Furniture, Home, Home Improvement, Lawn & Garden, Pets Products, Headphones, Beauty, Musical Instruments, Business & Industrial Supplies, Outdoors, Tools, Sports, Baby Products, Amazon Coins',
        rate: 3,
    },
    {
        id: 'pc_dvd',
        label: 'PC, PC Components, DVD & Blu-Ray',
        rate: 2.5,
    },
    {
        id: 'tv_digital_games',
        label: 'Televisions, Digital Video Games',
        rate: 2,
    },
    {
        id: 'grocery_health_games',
        label: 'Amazon Fresh, Physical Video Games & Video Game Consoles, Grocery, Health & Personal Care',
        rate: 1,
    },
    {
        id: 'excluded_zero',
        label: 'Gift Cards, Wireless Service Plans, Alcoholic Beverages, Digital Kindle subscriptions, Vehicles (Leasing/Sales), Pet Prescription Medications, Restaurant delivery, Amazon Appstore/Prime Now/Pay Places',
        rate: 0,
    },
    {
        id: 'coach',
        label: 'Coach',
        rate: 0,
    },
    {
        id: 'all_other',
        label: 'All Other Categories',
        rate: 4,
    },
];

/** Categoría por defecto cuando no se indica una (4.00%). */
const DEFAULT_AMAZON_COMMISSION_CATEGORY = 'all_other';

const CATEGORY_BY_ID = new Map(AMAZON_COMMISSION_CATEGORIES.map((c) => [c.id, c]));

/** Ids válidos (para enum de Mongoose y validación en controladores). */
function amazonCommissionCategoryIds() {
    return AMAZON_COMMISSION_CATEGORIES.map((c) => c.id);
}

/** Devuelve la categoría (o la categoría por defecto si el id es inválido). */
function getAmazonCommissionCategory(id) {
    return (
        CATEGORY_BY_ID.get(String(id || '')) ||
        CATEGORY_BY_ID.get(DEFAULT_AMAZON_COMMISSION_CATEGORY)
    );
}

/** Tasa de comisión de Amazon (%) para una categoría. */
function amazonCommissionRate(id) {
    return getAmazonCommissionCategory(id).rate;
}

/** % neto que recibe el influencer tras retener PLATFORM_CUT_RATE (redondeado a 2 decimales). */
function influencerNetCommissionRate(id) {
    const net = amazonCommissionRate(id) * (1 - PLATFORM_CUT_RATE);
    return Math.round(net * 100) / 100;
}

/** Normaliza un id recibido por API a uno válido (o el por defecto). */
function normalizeAmazonCommissionCategory(id) {
    return CATEGORY_BY_ID.has(String(id || ''))
        ? String(id)
        : DEFAULT_AMAZON_COMMISSION_CATEGORY;
}

module.exports = {
    PLATFORM_CUT_RATE,
    AMAZON_COMMISSION_CATEGORIES,
    DEFAULT_AMAZON_COMMISSION_CATEGORY,
    amazonCommissionCategoryIds,
    getAmazonCommissionCategory,
    amazonCommissionRate,
    influencerNetCommissionRate,
    normalizeAmazonCommissionCategory,
};
