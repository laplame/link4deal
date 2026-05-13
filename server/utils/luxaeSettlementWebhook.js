'use strict';

const DiscountQrToken = require('../models/DiscountQrToken');

const WEBHOOK_TIMEOUT_MS = Math.min(30000, Math.max(2000, parseInt(String(process.env.LUXAE_SETTLEMENT_WEBHOOK_TIMEOUT_MS || '8000'), 10) || 8000));

/**
 * POST asíncrono tras canje exitoso para notificar creación / asiento de tokens LUXAE (u otro ledger externo).
 * URL: LUXAE_SETTLEMENT_WEBHOOK_URL. Opcional: LUXAE_SETTLEMENT_WEBHOOK_SECRET → header Authorization: Bearer …
 *
 * Resultado persistido en `redeemedBy.metadata.luxaeSettlement` para el panel «redenciones en vivo».
 *
 * @param {object} redeemed - documento cupón tras canje (toObject o lean con tokenId, payload, usedAt, redeemedBy)
 */
async function runLuxaeSettlementForRedemption(redeemed) {
    const url = process.env.LUXAE_SETTLEMENT_WEBHOOK_URL;
    if (!url || !String(url).trim()) return;

    const tokenId = redeemed && redeemed.tokenId != null ? String(redeemed.tokenId) : '';
    if (!tokenId) return;

    const p = redeemed.payload && typeof redeemed.payload === 'object' ? redeemed.payload : {};
    const rb = redeemed.redeemedBy && typeof redeemed.redeemedBy === 'object' ? redeemed.redeemedBy : {};

    const body = {
        event: 'discount_qr_redeemed',
        tokenId,
        usedAt: redeemed.usedAt ? new Date(redeemed.usedAt).toISOString() : null,
        promotionId: p.promotionId != null ? String(p.promotionId) : null,
        influencerId: p.influencerId != null ? String(p.influencerId) : null,
        walletAddress: p.walletAddress != null ? String(p.walletAddress) : null,
        referralCode: p.referralCode != null ? String(p.referralCode) : null,
        discountPercentage: p.discountPercentage != null ? Number(p.discountPercentage) : null,
        idempotencyKey: rb.idempotencyKey != null ? String(rb.idempotencyKey) : null,
        idempotencyShopId: rb.idempotencyShopId != null ? String(rb.idempotencyShopId) : null,
        idempotencyProductId: rb.idempotencyProductId != null ? String(rb.idempotencyProductId) : null,
    };

    const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
    const secret = process.env.LUXAE_SETTLEMENT_WEBHOOK_SECRET;
    if (secret && String(secret).trim()) {
        headers.Authorization = `Bearer ${String(secret).trim()}`;
    }

    const attemptedAt = new Date().toISOString();
    /** @type {{ attemptedAt: string, ok: boolean, httpStatus: number | null, error: string }} */
    const record = { attemptedAt, ok: false, httpStatus: null, error: '' };

    try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), WEBHOOK_TIMEOUT_MS);
        const res = await fetch(String(url).trim(), {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: ctrl.signal,
        });
        clearTimeout(timer);
        record.httpStatus = res.status;
        record.ok = res.ok;
        if (!res.ok) {
            const t = await res.text().catch(() => '');
            record.error = (t && t.slice(0, 500)) || `HTTP ${res.status}`;
        }
    } catch (e) {
        record.error = e && e.name === 'AbortError' ? `timeout ${WEBHOOK_TIMEOUT_MS}ms` : String(e.message || e).slice(0, 500);
    }

    await DiscountQrToken.updateOne({ tokenId }, { $set: { 'redeemedBy.metadata.luxaeSettlement': record } }).catch(
        (err) => {
            console.warn('[luxaeSettlement] persist:', err.message);
        },
    );
}

/**
 * @returns {boolean}
 */
function isLuxaeSettlementWebhookConfigured() {
    return Boolean(String(process.env.LUXAE_SETTLEMENT_WEBHOOK_URL || '').trim());
}

module.exports = {
    runLuxaeSettlementForRedemption,
    isLuxaeSettlementWebhookConfigured,
};
