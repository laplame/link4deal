/**
 * Tipo de cambio MXN → USD obtenido de forma dinámica (API externa).
 * Se cachea varios minutos para no saturar la API. Fallback a .env o valor por defecto si falla.
 */

const https = require('https');

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos
const DEFAULT_FX_MXN_USD = 0.058;
const FX_API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

let cachedRate = null;
let cachedAt = 0;

const FALLBACK_RATE = () => {
    const env = typeof process !== 'undefined' && process.env && process.env.FX_MXN_USD;
    return env ? Number(env) : DEFAULT_FX_MXN_USD;
};

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`FX API ${res.statusCode}`));
                return;
            }
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
        req.setTimeout(5000, () => { req.destroy(); reject(new Error('timeout')); });
    });
}

/**
 * Obtiene 1 MXN en USD (ej. 0.058 = 1 peso = 0.058 dólares).
 * Fuente: API pública (exchangerate-api.com v4). Sin API key.
 * @returns {Promise<number>}
 */
async function getMxnToUsdRate() {
    if (cachedRate != null && (Date.now() - cachedAt) < CACHE_TTL_MS) {
        return cachedRate;
    }

    try {
        const data = await fetchJson(FX_API_URL);
        const mxnPerUsd = data.rates && data.rates.MXN;
        if (!mxnPerUsd || mxnPerUsd <= 0) throw new Error('MXN rate missing');
        const rate = 1 / mxnPerUsd;
        cachedRate = Math.round(rate * 10000) / 10000;
        cachedAt = Date.now();
        return cachedRate;
    } catch (err) {
        console.warn('FX MXN/USD: no se pudo obtener tipo de cambio dinámico:', err.message);
        const fallback = FALLBACK_RATE();
        cachedRate = fallback;
        cachedAt = Date.now();
        return fallback;
    }
}

/**
 * Devuelve el valor en caché (síncrono). Puede ser null si aún no se ha hecho ninguna petición.
 */
function getMxnToUsdRateCached() {
    return (cachedRate != null && (Date.now() - cachedAt) < CACHE_TTL_MS) ? cachedRate : null;
}

module.exports = {
    getMxnToUsdRate,
    getMxnToUsdRateCached,
    CACHE_TTL_MS,
    DEFAULT_FX_MXN_USD
};
