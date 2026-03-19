/**
 * Proxy hacia la API pública de tiendas BizneAI.
 * Documentación / origen: https://bizneai.com/api/shop
 */
const express = require('express');

const router = express.Router();
const DEFAULT_BASE = process.env.BIZNEAI_SHOP_API_URL || 'https://bizneai.com/api/shop';

async function fetchJson(url) {
    const res = await fetch(url, {
        headers: {
            Accept: 'application/json',
            'User-Agent': 'Link4Deal/1.0 (brand directory proxy)'
        }
    });
    if (!res.ok) {
        const err = new Error(`BizneAI HTTP ${res.status}`);
        err.status = res.status;
        throw err;
    }
    return res.json();
}

/**
 * GET /api/bizne-shops
 * Query:
 *   - all=1 — acumula todas las páginas (hasta límite razonable)
 *   - page, limit — se reenvían a BizneAI si all no está activo
 *   - includeModelShops=1 — incluye tiendas con isModelShop: true (por defecto se filtran)
 */
router.get('/', async (req, res) => {
    try {
        const wantAll = req.query.all === '1' || req.query.all === 'true';
        const includeModels = req.query.includeModelShops === '1' || req.query.includeModelShops === 'true';
        const limit = Math.min(Number(req.query.limit) || 100, 100);

        let shops = [];
        let pagination = null;
        let filters = null;
        let stats = null;

        if (wantAll) {
            let page = 1;
            let pages = 1;
            const maxPages = 50;
            do {
                const url = new URL(DEFAULT_BASE);
                url.searchParams.set('page', String(page));
                url.searchParams.set('limit', String(limit));
                const json = await fetchJson(url.toString());
                const data = json?.data;
                if (!data?.shops || !Array.isArray(data.shops)) break;
                shops = shops.concat(data.shops);
                pagination = data.pagination || pagination;
                filters = data.filters || filters;
                stats = data.stats || stats;
                pages = data.pagination?.pages || 1;
                page++;
            } while (page <= pages && page <= maxPages);
        } else {
            const url = new URL(DEFAULT_BASE);
            if (req.query.page) url.searchParams.set('page', String(req.query.page));
            if (req.query.limit) url.searchParams.set('limit', String(Math.min(Number(req.query.limit), 100)));
            const json = await fetchJson(url.toString());
            const data = json?.data;
            shops = Array.isArray(data?.shops) ? data.shops : [];
            pagination = data?.pagination;
            filters = data?.filters;
            stats = data?.stats;
        }

        let filtered = shops.filter((s) => (s.status || 'active') === 'active');
        if (!includeModels) {
            filtered = filtered.filter((s) => !s.isModelShop);
        }

        return res.json({
            success: true,
            data: {
                shops: filtered,
                total: filtered.length,
                pagination,
                filters,
                stats
            }
        });
    } catch (err) {
        console.error('Error proxy BizneAI shops:', err.message);
        return res.status(502).json({
            success: false,
            message: 'No se pudo obtener el listado de tiendas BizneAI',
            data: { shops: [] }
        });
    }
});

/**
 * GET /api/bizne-shops/:id
 * Intenta obtener una tienda por id (si BizneAI expone GET /shop/:id).
 */
router.get('/:id', async (req, res) => {
    try {
        const base = DEFAULT_BASE.replace(/\/$/, '');
        const url = `${base}/${encodeURIComponent(req.params.id)}`;
        const json = await fetchJson(url);
        const shop = json?.data?.shop || json?.data || json?.shop || null;
        if (!shop || (typeof shop === 'object' && !shop._id && !shop.id)) {
            return res.status(404).json({
                success: false,
                message: 'Tienda no encontrada'
            });
        }
        return res.json({ success: true, data: shop });
    } catch (err) {
        if (err.status === 404) {
            return res.status(404).json({ success: false, message: 'Tienda no encontrada' });
        }
        console.error('Error proxy BizneAI shop by id:', err.message);
        return res.status(502).json({
            success: false,
            message: 'No se pudo obtener la tienda'
        });
    }
});

module.exports = router;
