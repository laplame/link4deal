'use strict';

const { normalizeBizneShopId, isValidBizneShopObjectId } = require('./bizneShopId');

const PATH_MARKERS = new Set(['shop', 'shops', 'store', 'stores', 'tienda', 'tiendas', 'bizne', 'negocio', 'business']);

/**
 * Extrae shopId (ObjectId 24 hex) de una URL bizneai.com, damecodigo /shop/bizne/:id, o id pegado.
 * @param {string} input
 * @returns {{ shopId: string, source: string } | null}
 */
function parseBizneShopUrl(input) {
    const raw = String(input || '').trim();
    if (!raw) return null;

    const direct = normalizeBizneShopId(raw);
    if (direct) return { shopId: direct, source: 'id' };

    let url;
    try {
        url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    } catch {
        return null;
    }

    const host = (url.hostname || '').toLowerCase();
    const isBizneHost = host.includes('bizneai.com') || host === 'damecodigo.com' || host === 'www.damecodigo.com';
    const isLocal = host === 'localhost' || host === '127.0.0.1';

    if (!isBizneHost && !isLocal) {
        const pathOnly = normalizeBizneShopId(raw.replace(/^\/+/, '').split('/').pop());
        if (pathOnly) return { shopId: pathOnly, source: 'path' };
        return null;
    }

    for (const key of ['shopId', 'shop_id', 'shop', 'id', '_id']) {
        const v = url.searchParams.get(key);
        const id = normalizeBizneShopId(v || '');
        if (id) return { shopId: id, source: `query:${key}` };
    }

    const parts = url.pathname.split('/').filter(Boolean);
    for (let i = 0; i < parts.length; i += 1) {
        const seg = parts[i].toLowerCase();
        if (seg === 'bizne' && parts[i + 1]) {
            const id = normalizeBizneShopId(parts[i + 1]);
            if (id) return { shopId: id, source: 'path:shop/bizne' };
        }
        if (PATH_MARKERS.has(seg) && parts[i + 1]) {
            const next = parts[i + 1].toLowerCase();
            if (next === 'bizne' && parts[i + 2]) {
                const id = normalizeBizneShopId(parts[i + 2]);
                if (id) return { shopId: id, source: 'path:shop/bizne' };
            }
            const id = normalizeBizneShopId(parts[i + 1]);
            if (id) return { shopId: id, source: `path:${seg}` };
        }
    }

    for (let j = parts.length - 1; j >= 0; j -= 1) {
        const id = normalizeBizneShopId(parts[j]);
        if (id) return { shopId: id, source: 'path:segment' };
    }

    return null;
}

module.exports = { parseBizneShopUrl, isValidBizneShopObjectId };
