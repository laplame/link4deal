const crypto = require('crypto');

const DEFAULT_PREFIX = 'LINK4DEAL-DISCOUNT';
const DEFAULT_VERSION = 'v1';
const DEFAULT_TTL_SECONDS = 300;

function b64u(buffer) {
    return buffer.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
}

function fromB64u(input) {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '==='.slice((base64.length + 3) % 4);
    return Buffer.from(padded, 'base64');
}

function parseRequiredKey(value, keyName) {
    if (!value) {
        throw new Error(`${keyName} no configurado`);
    }
    const key = Buffer.from(value, 'base64');
    if (key.length !== 32) {
        throw new Error(`${keyName} inválido: debe ser base64 de 32 bytes`);
    }
    return key;
}

function getQrConfig(options = {}) {
    const requireEncKey = options.requireEncKey !== false;
    const prefix = process.env.QR_PREFIX || DEFAULT_PREFIX;
    const version = process.env.QR_VERSION || DEFAULT_VERSION;
    const ttlSeconds = Number(process.env.QR_TTL_SECONDS || DEFAULT_TTL_SECONDS);
    const signKey = parseRequiredKey(process.env.QR_SIGN_KEY, 'QR_SIGN_KEY');
    const encKey = requireEncKey
        ? parseRequiredKey(process.env.QR_ENC_KEY, 'QR_ENC_KEY')
        : (process.env.QR_ENC_KEY ? parseRequiredKey(process.env.QR_ENC_KEY, 'QR_ENC_KEY') : null);

    return { prefix, version, ttlSeconds, encKey, signKey };
}

/**
 * Prefijo efectivo: base (QR_PREFIX) o base-N con N = porcentaje de descuento (5, 10, 20, …).
 * Mismo valor que `discountPercentage` / `luxaesRedeemed` en la API del cupón.
 * @param {number} [discountPercent] - 0–100; si &gt; 0 se añade -N al prefijo (ej. link4deal-discount-20 → 20 %).
 * @returns {{ prefix: string, luxaesRedeemed: number }}
 */
function buildPrefixWithDiscountPercent(basePrefix, discountPercent) {
    const n = Number(discountPercent);
    if (!Number.isFinite(n) || n <= 0) {
        return { prefix: basePrefix, luxaesRedeemed: 0 };
    }
    const rounded = Math.min(100, Math.max(0, Math.round(n)));
    return { prefix: `${basePrefix}-${rounded}`, luxaesRedeemed: rounded };
}

function isQrPrefixAllowed(incomingPrefix, basePrefix) {
    if (incomingPrefix === basePrefix) return true;
    const escaped = basePrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`^${escaped}-\\d+$`).test(incomingPrefix);
}

/** @param {number} [discountPercent] - Porcentaje 0–100 (mismo número en prefijo `-N` y en luxaesRedeemed). */
function getQrMetaConfig(discountPercent) {
    const { prefix: basePrefix, version, ttlSeconds } = getQrConfig({ requireEncKey: false });
    const { prefix, luxaesRedeemed: lux } = buildPrefixWithDiscountPercent(basePrefix, discountPercent);
    return { prefix, basePrefix, version, ttlSeconds, luxaesRedeemed: lux };
}

function createQrToken(data) {
    const { prefix, version, ttlSeconds, encKey, signKey } = getQrConfig();

    const now = Math.floor(Date.now() / 1000);
    // Payload compacto para reducir tamaño del QR:
    // [deviceId, influencerId, promotionId, referralCode, discountPercentage, walletAddress, iat, exp, jti]
    const payloadCompact = [
        data.deviceId,
        data.influencerId,
        data.promotionId,
        data.referralCode,
        Number(data.discountPercentage || 0),
        data.walletAddress,
        now,
        now + ttlSeconds,
        b64u(crypto.randomBytes(8))
    ];
    const payload = {
        ...data,
        iat: now,
        exp: now + ttlSeconds,
        jti: payloadCompact[8]
    };

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', encKey, iv);
    const plaintext = Buffer.from(JSON.stringify(payloadCompact), 'utf8');
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();

    const ts = String(now);
    const body = `${prefix}.${version}.${ts}.${b64u(iv)}.${b64u(ciphertext)}.${b64u(tag)}`;
    const signature = crypto.createHmac('sha256', signKey).update(body).digest();

    return `${body}.${b64u(signature)}`;
}

function verifyAndDecodeQrToken(token) {
    const { prefix, version, signKey, encKey } = getQrConfig();

    if (!token || typeof token !== 'string') {
        throw new Error('QR token requerido');
    }

    const parts = token.split('.');
    if (parts.length !== 7) {
        throw new Error('QR format invalid');
    }

    const [incomingPrefix, incomingVersion, ts, ivS, ctS, tagS, sigS] = parts;
    if (incomingPrefix !== prefix || incomingVersion !== version) {
        throw new Error('QR prefix/version invalid');
    }

    const body = `${incomingPrefix}.${incomingVersion}.${ts}.${ivS}.${ctS}.${tagS}`;
    const expectedSig = crypto.createHmac('sha256', signKey).update(body).digest();
    const gotSig = fromB64u(sigS);

    if (gotSig.length !== expectedSig.length || !crypto.timingSafeEqual(gotSig, expectedSig)) {
        throw new Error('QR signature invalid');
    }

    const iv = fromB64u(ivS);
    const ct = fromB64u(ctS);
    const tag = fromB64u(tagS);

    const decipher = crypto.createDecipheriv('aes-256-gcm', encKey, iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ct), decipher.final()]);
    const decoded = JSON.parse(plaintext.toString('utf8'));
    let payload;
    if (Array.isArray(decoded)) {
        // Formato compacto actual
        payload = {
            deviceId: decoded[0],
            influencerId: decoded[1],
            promotionId: decoded[2],
            referralCode: decoded[3],
            discountPercentage: Number(decoded[4] || 0),
            walletAddress: decoded[5],
            iat: decoded[6],
            exp: decoded[7],
            jti: decoded[8]
        };
    } else {
        // Compatibilidad con formato previo (objeto)
        payload = decoded;
    }

    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) {
        throw new Error('QR expired');
    }

    return payload;
}

/**
 * Crea el string del token QR por referencia.
 * @param {string} tokenId - Id único del token en BD
 * @param {number} [discountPercentage] - Porcentaje 0–100; el mismo número va en el prefijo `PREFIX-N` (N = %) y en el segmento .&lt;pct&gt;.
 * @returns {string} PREFIX.v1.<id>.<pct>.<sig> (5 partes) o 4 partes si pct fuera inválido (compat.)
 */
function createReferenceQrToken(tokenId, discountPercentage) {
    const { prefix: basePrefix, version, signKey } = getQrConfig({ requireEncKey: false });
    const rounded = Math.min(100, Math.max(0, Math.round(Number(discountPercentage) || 0)));
    const { prefix } = buildPrefixWithDiscountPercent(basePrefix, rounded);
    const includePct = Number.isFinite(rounded) && rounded >= 0 && rounded <= 100;
    const body = includePct
        ? `${prefix}.${version}.${tokenId}.${rounded}`
        : `${prefix}.${version}.${tokenId}`;
    const signature = crypto.createHmac('sha256', signKey).update(body).digest();
    return `${body}.${b64u(signature)}`;
}

/**
 * Verifica y decodifica token QR por referencia. Acepta formato de 4 partes (sin pct) o 5 partes (con pct).
 * Prefijo: base (QR_PREFIX) o base-N (N = porcentaje de descuento, mismo que luxaesRedeemed).
 * @returns {{ tokenId: string, discountPercentage?: number, prefix: string, version: string, luxaesRedeemed?: number }}
 */
function verifyReferenceQrToken(token) {
    const { prefix: basePrefix, version, signKey } = getQrConfig({ requireEncKey: false });
    const parts = String(token || '').split('.');
    if (parts.length !== 4 && parts.length !== 5) {
        throw new Error('QR reference format invalid');
    }

    const is5Part = parts.length === 5;
    const [incomingPrefix, incomingVersion, tokenId, pctOrSig, sigS] = parts;
    const sig = is5Part ? sigS : pctOrSig;

    if (incomingVersion !== version || !isQrPrefixAllowed(incomingPrefix, basePrefix)) {
        throw new Error('QR prefix/version invalid');
    }

    const body = is5Part
        ? `${incomingPrefix}.${incomingVersion}.${tokenId}.${pctOrSig}`
        : `${incomingPrefix}.${incomingVersion}.${tokenId}`;
    const expectedSig = crypto.createHmac('sha256', signKey).update(body).digest();
    const gotSig = fromB64u(sig);
    if (gotSig.length !== expectedSig.length || !crypto.timingSafeEqual(gotSig, expectedSig)) {
        throw new Error('QR signature invalid');
    }

    const result = { tokenId, prefix: incomingPrefix, version: incomingVersion };
    const escapedBase = basePrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const luxMatch = incomingPrefix.match(new RegExp(`^${escapedBase}-(\\d+)$`));
    if (luxMatch) {
        result.luxaesRedeemed = Number(luxMatch[1]); // puntos porcentuales (ej. 20 = 20 %)
    }
    if (is5Part) {
        const pct = Number(pctOrSig);
        if (Number.isFinite(pct) && pct >= 0 && pct <= 100) {
            result.discountPercentage = pct;
        }
    }
    return result;
}

module.exports = {
    b64u,
    getQrConfig,
    getQrMetaConfig,
    buildPrefixWithDiscountPercent,
    isQrPrefixAllowed,
    createQrToken,
    verifyAndDecodeQrToken,
    createReferenceQrToken,
    verifyReferenceQrToken
};
