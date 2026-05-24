'use strict';

const axios = require('axios');

const DEFAULT_BASE = process.env.BIZNEAI_SHOP_API_URL || 'https://bizneai.com/api/shop';

const httpClient = axios.create({
    timeout: 45000,
    headers: {
        Accept: 'application/json',
        'User-Agent': 'Link4Deal/1.0 (bizne shop lookup)',
    },
    validateStatus: (status) => status >= 200 && status < 300,
});

function normalizeShopGps(shop) {
    if (!shop || typeof shop !== 'object') return shop;
    const normalized = { ...shop };
    const lat = Number(normalized.latitude);
    const lng = Number(normalized.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
        normalized.latitude = lat;
        normalized.longitude = lng;
        return normalized;
    }
    const coords = normalized.gpsLocation?.coordinates;
    if (Array.isArray(coords) && coords.length >= 2) {
        const gpsLng = Number(coords[0]);
        const gpsLat = Number(coords[1]);
        if (Number.isFinite(gpsLat) && Number.isFinite(gpsLng)) {
            normalized.latitude = gpsLat;
            normalized.longitude = gpsLng;
        }
    }
    return normalized;
}

function shopIdOf(shop) {
    if (!shop) return '';
    return String(shop._id || shop.id || '').trim();
}

/**
 * Obtiene una tienda BizneAI por id (GET /shop/:id o búsqueda en listado).
 * @param {string} shopId
 * @returns {Promise<object|null>}
 */
const { isValidBizneShopObjectId, normalizeBizneShopId } = require('./bizneShopId');

async function fetchBizneShopById(shopId) {
    const id = normalizeBizneShopId(shopId) || String(shopId || '').trim();
    if (!id) return null;
    if (!isValidBizneShopObjectId(id)) return null;

    const base = DEFAULT_BASE.replace(/\/$/, '');
    try {
        const url = `${base}/${encodeURIComponent(id)}`;
        const { data } = await httpClient.get(url);
        const shop = normalizeShopGps(data?.data?.shop || data?.data || data?.shop || null);
        if (shop && shopIdOf(shop)) return shop;
    } catch (err) {
        if (err.response?.status !== 404) {
            console.warn('BizneAI shop by id:', err.message);
        }
    }

    try {
        const url = new URL(DEFAULT_BASE);
        url.searchParams.set('page', '1');
        url.searchParams.set('limit', '100');
        let page = 1;
        const maxPages = 30;
        while (page <= maxPages) {
            url.searchParams.set('page', String(page));
            const { data } = await httpClient.get(url.toString());
            const shops = data?.data?.shops;
            if (!Array.isArray(shops)) break;
            const hit = shops.map(normalizeShopGps).find((s) => shopIdOf(s) === id);
            if (hit) return hit;
            const pages = data?.data?.pagination?.pages || 1;
            if (page >= pages) break;
            page += 1;
        }
    } catch (err) {
        console.warn('BizneAI shop list fallback:', err.message);
    }

    return null;
}

module.exports = {
    fetchBizneShopById,
    shopIdOf,
    normalizeShopGps,
    isValidBizneShopObjectId,
    normalizeBizneShopId,
};
