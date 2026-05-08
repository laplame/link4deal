'use strict';

/** @typedef {{ kind: 'unset' }} RetentionUnset */
/** @typedef {{ kind: 'invalid', raw: string }} RetentionInvalid */
/** @typedef {{ kind: 'ok', days: number }} RetentionOk */
/** @typedef {RetentionUnset|RetentionInvalid|RetentionOk} RetentionParsed */

/** Lee QR_REDEEM_RETENTION_DAYS; vacío ⇒ unset; debe ser número finito > 0. */
function parseQrRedeemRetentionDays() {
    const raw = process.env.QR_REDEEM_RETENTION_DAYS;
    if (raw === undefined || raw === null || String(raw).trim() === '') {
        return /** @type {RetentionUnset} */ ({ kind: 'unset' });
    }
    const s = String(raw).trim();
    const n = Number(s);
    if (!Number.isFinite(n) || n <= 0) {
        return /** @type {RetentionInvalid} */ ({ kind: 'invalid', raw: s });
    }
    return /** @type {RetentionOk} */ ({ kind: 'ok', days: n });
}

/**
 * Aviso para clientes cuando no hay retención configurada o el valor es inválido (es-ES).
 * @returns {string|null}
 */
function qrRedemptionsRetentionHintEs() {
    const p = parseQrRedeemRetentionDays();
    if (p.kind === 'ok') return null;
    if (p.kind === 'invalid') {
        return (
            `QR_REDEEM_RETENTION_DAYS es inválido («${p.raw}»): usa un entero positivo de días ` +
            '(p. ej. 90). Tras cada canje, el servidor alarga expiresAt para que MongoDB no borre ' +
            'el documento antes de ese plazo.'
        );
    }
    return (
        'Configura QR_REDEEM_RETENTION_DAYS como entero positivo (p. ej. 90). Los cupón-QR llevan TTL ' +
        'por expiresAt: sin retención, tras un canje el registro suele borrarse cuando llega ese vencimiento; ' +
        'con la variable, expiresAt se recalcula desde la fecha del canje + N días y se conserva el historial.'
    );
}

module.exports = {
    parseQrRedeemRetentionDays,
    qrRedemptionsRetentionHintEs,
};
