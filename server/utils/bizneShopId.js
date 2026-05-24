'use strict';

/** ObjectId Mongo / BizneAI: 24 caracteres hex. */
function isValidBizneShopObjectId(id) {
    return /^[a-f0-9]{24}$/i.test(String(id || '').trim());
}

function normalizeBizneShopId(id) {
    const s = String(id || '').trim();
    return isValidBizneShopObjectId(s) ? s.toLowerCase() : '';
}

module.exports = { isValidBizneShopObjectId, normalizeBizneShopId };
