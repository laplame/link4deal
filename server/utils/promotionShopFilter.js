'use strict';

const { normalizeBizneShopId } = require('./bizneShopId');

/**
 * Filtro DameCodigo ↔ BizneAI: promociones de una tienda.
 * Cruza `shopId` (atribución al publicar desde app) y `allowedShopIds`.
 */
function buildPromotionShopIdQuery(rawShopId) {
    const id = normalizeBizneShopId(rawShopId);
    if (!id) return null;
    return {
        $or: [{ shopId: id }, { allowedShopIds: id }],
    };
}

module.exports = { buildPromotionShopIdQuery };
