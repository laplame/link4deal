/**
 * Convierte una promoción a valor en USD (unidad calculable del contrato).
 * Regla: X tokens = X USD. Permite que la promo sea un pasivo financiero medible.
 *
 * Tipos:
 * - percentage: Producto $20, 25% → $5 USD
 * - bogo (2x1): Precio unitario $30 → valor = mitad = $15 USD (una unidad gratis)
 * - cashback_fixed: Valor fijo en USD (ej. $10)
 * - cashback_percentage: Monto compra $50, 10% → $5 USD
 *
 * @param {Object} opts
 * @param {string} opts.offerType - 'percentage' | 'bogo' | 'cashback_fixed' | 'cashback_percentage'
 * @param {number} opts.originalPrice - Precio base/unidad en USD (o en otra moneda; se asume USD para el cálculo)
 * @param {number} [opts.currentPrice] - Precio con oferta (para percentage si no se usa discountPercentage)
 * @param {number} [opts.discountPercentage] - Porcentaje de descuento (0-100)
 * @param {number} [opts.cashbackValue] - Para cashback_fixed: monto en USD; para cashback_percentage: % (0-100)
 * @param {number} [opts.purchaseAmount] - Para cashback_percentage: monto de compra en USD (default originalPrice)
 * @returns {number|null} Valor promocional en USD, o null si no se puede calcular
 */
function getPromotionalValueUsd(opts) {
    const {
        offerType = 'percentage',
        originalPrice = 0,
        currentPrice,
        discountPercentage,
        cashbackValue,
        purchaseAmount
    } = opts;

    const price = Number(originalPrice) || 0;
    if (price < 0) return null;

    switch (offerType) {
        case 'percentage': {
            let pct = Number(discountPercentage);
            if (!Number.isFinite(pct) && Number(currentPrice) >= 0 && price > 0) {
                pct = Math.round(((price - currentPrice) / price) * 100);
            }
            if (!Number.isFinite(pct) || pct < 0 || pct > 100) return null;
            return Math.round((price * pct / 100) * 100) / 100;
        }
        case 'bogo': {
            // 2x1: una unidad gratis → valor = precio unitario / 2 (o precio de una unidad)
            if (price <= 0) return null;
            return Math.round((price / 2) * 100) / 100;
        }
        case 'cashback_fixed': {
            const fixed = Number(cashbackValue);
            return Number.isFinite(fixed) && fixed >= 0 ? Math.round(fixed * 100) / 100 : null;
        }
        case 'cashback_percentage': {
            const amount = Number(purchaseAmount ?? price) || 0;
            const pct = Number(cashbackValue) || 0;
            if (amount <= 0 || pct < 0 || pct > 100) return null;
            return Math.round((amount * pct / 100) * 100) / 100;
        }
        default:
            return null;
    }
}

module.exports = { getPromotionalValueUsd };
