/**
 * PSCS-1: Convierte una promoción a valor en USD (unidad calculable del contrato).
 * Regla: 1 LUXAE = 1 USD. Valor por cupón en USD = tokens por cupón.
 *
 * Unidad de medida del stablecoin: todos los cálculos de tokens se hacen en dólares americanos (USD).
 * Cuando la promoción está en español / precios en pesos (MXN), se convierte a USD y se normaliza
 * en USD para hacer los cálculos de token; no se emiten tokens en MXN.
 *
 * Si la moneda es MXN, el tipo de cambio se obtiene de forma dinámica (API externa)
 * vía server/services/fxRate.js. Fallback a FX_MXN_USD en .env o valor por defecto si falla.
 *
 * Tipos: percentage | bogo | cashback_fixed | cashback_percentage
 */

/** Moneda en la que se expresa el stablecoin (LUXAE). Todas las promociones se normalizan a esta unidad. */
const TOKEN_UNIT_CURRENCY = 'USD';

const DEFAULT_FX_MXN_USD = 0.058;

function getFxRateToUsd(currency, envFxMxnUsd) {
    const c = (currency || 'USD').toUpperCase();
    if (c === 'USD') return 1;
    if (c === 'MXN') return Number(envFxMxnUsd) || DEFAULT_FX_MXN_USD;
    return null;
}

function normalizePriceToUsd(amount, currency, envFxMxnUsd) {
    const rate = getFxRateToUsd(currency, envFxMxnUsd);
    if (rate == null) return null;
    return (Number(amount) || 0) * rate;
}

/**
 * @param {Object} opts
 * @param {string} [opts.currency] - 'USD' | 'MXN' (precios en esa moneda)
 * @param {number} [opts.fxRateMxnToUsd] - opcional; si no se pasa y currency es MXN, se usa env o default
 * @param {string} opts.offerType
 * @param {number} opts.originalPrice - Precio base en currency (ej. MXN o USD)
 * @param {number} [opts.currentPrice]
 * @param {number} [opts.discountPercentage]
 * @param {number} [opts.cashbackValue]
 * @param {number} [opts.purchaseAmount]
 * @returns {number|null} Valor promocional por cupón en USD ( = tokens LUXAE por cupón)
 */
function getPromotionalValueUsd(opts) {
    const {
        currency = 'USD',
        fxRateMxnToUsd,
        offerType = 'percentage',
        originalPrice = 0,
        currentPrice,
        discountPercentage,
        cashbackValue,
        purchaseAmount
    } = opts;

    const envFx = typeof process !== 'undefined' && process.env && process.env.FX_MXN_USD ? Number(process.env.FX_MXN_USD) : undefined;
    const rate = getFxRateToUsd(currency, fxRateMxnToUsd ?? envFx);
    if (rate == null) return null;

    const priceUsd = normalizePriceToUsd(originalPrice, currency, fxRateMxnToUsd ?? envFx) ?? (Number(originalPrice) || 0) * rate;
    const currentUsd = currentPrice != null ? (normalizePriceToUsd(currentPrice, currency, fxRateMxnToUsd ?? envFx) ?? Number(currentPrice) * rate) : undefined;
    const purchaseUsd = purchaseAmount != null ? (normalizePriceToUsd(purchaseAmount, currency, fxRateMxnToUsd ?? envFx) ?? Number(purchaseAmount) * rate) : priceUsd;

    const price = priceUsd;
    if (price < 0) return null;

    switch (offerType) {
        case 'percentage': {
            let pct = Number(discountPercentage);
            if (!Number.isFinite(pct) && currentUsd != null && Number(currentUsd) >= 0 && price > 0) {
                pct = Math.round(((price - currentUsd) / price) * 100);
            }
            if (!Number.isFinite(pct) || pct < 0 || pct > 100) return null;
            return Math.round((price * pct / 100) * 100) / 100;
        }
        case 'bogo': {
            if (price <= 0) return null;
            return Math.round((price / 2) * 100) / 100;
        }
        case 'cashback_fixed': {
            const fixed = Number(cashbackValue);
            return Number.isFinite(fixed) && fixed >= 0 ? Math.round(fixed * 100) / 100 : null;
        }
        case 'cashback_percentage': {
            const amount = Number(purchaseUsd) || 0;
            const pct = Number(cashbackValue) || 0;
            if (amount <= 0 || pct < 0 || pct > 100) return null;
            return Math.round((amount * pct / 100) * 100) / 100;
        }
        default:
            return null;
    }
}

/**
 * Calcula valor por cupón en USD (tokens por cupón) y emisión máxima del contrato (PSCS-1).
 * @param {Object} promo - Documento o objeto promoción (originalPrice, currency, offerType, totalQuantity, etc.)
 * @param {number} [fxRateMxnToUsd] - Opcional; si no se pasa y currency es MXN, se usa env o default
 * @returns {{ valuePerCouponUsd: number|null, maxEmissionUsd: number|null, currency: string, fxRateUsed: number|null }}
 */
function getValuePerCouponAndMaxEmission(promo, fxRateMxnToUsd) {
    const currency = (promo.currency || 'USD').toUpperCase();
    const envFx = typeof process !== 'undefined' && process.env && process.env.FX_MXN_USD ? Number(process.env.FX_MXN_USD) : undefined;
    const fxRateUsed = getFxRateToUsd(currency, fxRateMxnToUsd ?? envFx);

    const valuePerCouponUsd = promo.promotionalValueUsd != null && Number(promo.promotionalValueUsd) >= 0
        ? Number(promo.promotionalValueUsd)
        : getPromotionalValueUsd({
            currency: promo.currency || 'USD',
            fxRateMxnToUsd: fxRateMxnToUsd ?? envFx,
            offerType: promo.offerType || 'percentage',
            originalPrice: promo.originalPrice,
            currentPrice: promo.currentPrice,
            discountPercentage: promo.discountPercentage,
            cashbackValue: promo.cashbackValue,
            purchaseAmount: promo.originalPrice
        });

    const totalCoupons = promo.totalQuantity != null ? Number(promo.totalQuantity) : null;
    const maxEmissionUsd = (valuePerCouponUsd != null && totalCoupons != null && totalCoupons > 0)
        ? Math.round(valuePerCouponUsd * totalCoupons * 100) / 100
        : null;

    return {
        valuePerCouponUsd: valuePerCouponUsd ?? null,
        maxEmissionUsd,
        currency,
        fxRateUsed: fxRateUsed ?? null,
        /** Siempre USD: unidad de medida del stablecoin; MXN se convierte a USD. */
        normalizedCurrency: TOKEN_UNIT_CURRENCY
    };
}

/**
 * Versión async: cuando la moneda es MXN, obtiene el tipo de cambio de forma dinámica (API).
 * Para USD usa la versión síncrona. Fallback a env/default si la API falla.
 * @param {Object} promo
 * @returns {Promise<{ valuePerCouponUsd: number|null, maxEmissionUsd: number|null, currency: string, fxRateUsed: number|null }>}
 */
async function getValuePerCouponAndMaxEmissionAsync(promo) {
    const currency = (promo.currency || 'USD').toUpperCase();
    let fxRateMxnToUsd = null;
    if (currency === 'MXN') {
        try {
            const fxService = require('../services/fxRate');
            fxRateMxnToUsd = await fxService.getMxnToUsdRate();
        } catch (e) {
            const envFx = typeof process !== 'undefined' && process.env && process.env.FX_MXN_USD ? Number(process.env.FX_MXN_USD) : undefined;
            fxRateMxnToUsd = envFx ?? DEFAULT_FX_MXN_USD;
        }
    }
    return getValuePerCouponAndMaxEmission(promo, fxRateMxnToUsd);
}

module.exports = {
    getPromotionalValueUsd,
    getValuePerCouponAndMaxEmission,
    getValuePerCouponAndMaxEmissionAsync,
    getFxRateToUsd,
    normalizePriceToUsd,
    DEFAULT_FX_MXN_USD,
    TOKEN_UNIT_CURRENCY
};
