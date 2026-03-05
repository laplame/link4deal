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

function getQrMetaConfig() {
    const { prefix, version, ttlSeconds } = getQrConfig({ requireEncKey: false });
    return { prefix, version, ttlSeconds };
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
 * @param {number} [discountPercentage] - Porcentaje de descuento 0-100; si se pasa, el string tendrá 5 partes (id.pct.sig)
 * @returns {string} Ej: LINK4DEAL-DISCOUNT.v1.<id>.<sig> (4 partes) o LINK4DEAL-DISCOUNT.v1.<id>.<pct>.<sig> (5 partes)
 */
function createReferenceQrToken(tokenId, discountPercentage) {
    const { prefix, version, signKey } = getQrConfig({ requireEncKey: false });
    const pct = Number(discountPercentage);
    const includePct = Number.isFinite(pct) && pct >= 0 && pct <= 100;
    const body = includePct
        ? `${prefix}.${version}.${tokenId}.${Math.round(pct)}`
        : `${prefix}.${version}.${tokenId}`;
    const signature = crypto.createHmac('sha256', signKey).update(body).digest();
    return `${body}.${b64u(signature)}`;
}

/**
 * Verifica y decodifica token QR por referencia. Acepta formato de 4 partes (sin pct) o 5 partes (con pct).
 * @returns {{ tokenId: string, discountPercentage?: number, prefix: string, version: string }}
 */
function verifyReferenceQrToken(token) {
    const { prefix, version, signKey } = getQrConfig({ requireEncKey: false });
    const parts = String(token || '').split('.');
    if (parts.length !== 4 && parts.length !== 5) {
        throw new Error('QR reference format invalid');
    }

    const is5Part = parts.length === 5;
    const [incomingPrefix, incomingVersion, tokenId, pctOrSig, sigS] = parts;
    const sig = is5Part ? sigS : pctOrSig;

    if (incomingPrefix !== prefix || incomingVersion !== version) {
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
    createQrToken,
    verifyAndDecodeQrToken,
    createReferenceQrToken,
    verifyReferenceQrToken
};
