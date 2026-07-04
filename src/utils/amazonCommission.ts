/**
 * Tabla de comisiones de Amazon por categoría (Fixed Commission Income Rates)
 * y cálculo de lo que le toca al influencer tras retener la comisión de la plataforma.
 *
 * Regla de negocio: la plataforma retiene PLATFORM_CUT_RATE (20%) de la comisión de
 * Amazon; el influencer recibe el resto. Ej: categoría al 10% → influencer 8%.
 *
 * Mantener sincronizado con server/utils/amazonCommission.js.
 */

/** Porcentaje de la comisión de Amazon que retiene la plataforma. */
export const PLATFORM_CUT_RATE = 0.2;

export interface AmazonCommissionCategory {
  /** Identificador estable usado en la BD (Promotion.amazonCommissionCategory). */
  id: string;
  /** Etiqueta legible con las categorías de Amazon que agrupa. */
  label: string;
  /** Tasa fija de comisión de Amazon en porcentaje (ej. 10 = 10.00%). */
  rate: number;
}

/** Lista oficial de categorías y tasas (Amazon Fixed Commission Income Rates). */
export const AMAZON_COMMISSION_CATEGORIES: AmazonCommissionCategory[] = [
  {
    id: 'luxury_beauty',
    label: 'Luxury Beauty, Luxury Stores Beauty, Amazon Explore',
    rate: 10,
  },
  {
    id: 'electronics',
    label: 'Electrónica',
    rate: 7,
  },
  {
    id: 'music_handmade_video',
    label: 'Digital Music, Physical Music, Handmade, Digital Videos',
    rate: 5,
  },
  {
    id: 'books_kitchen_automotive',
    label: 'Physical Books, Kitchen, Automotive',
    rate: 4.5,
  },
  {
    id: 'devices_fashion_apparel',
    label:
      'Amazon Devices (Fire, Kindle, Echo, Ring, Fire TV), Fashion & Apparel, Luxury Stores Fashion, Watches, Jewelry, Luggage, Shoes, Handbags & Accessories',
    rate: 4,
  },
  {
    id: 'home_toys_sports',
    label:
      'Toys, Furniture, Home, Home Improvement, Lawn & Garden, Pets Products, Headphones, Beauty, Musical Instruments, Business & Industrial Supplies, Outdoors, Tools, Sports, Baby Products, Amazon Coins',
    rate: 3,
  },
  {
    id: 'pc_dvd',
    label: 'PC, PC Components, DVD & Blu-Ray',
    rate: 2.5,
  },
  {
    id: 'tv_digital_games',
    label: 'Televisions, Digital Video Games',
    rate: 2,
  },
  {
    id: 'grocery_health_games',
    label:
      'Amazon Fresh, Physical Video Games & Video Game Consoles, Grocery, Health & Personal Care',
    rate: 1,
  },
  {
    id: 'excluded_zero',
    label:
      'Gift Cards, Wireless Service Plans, Alcoholic Beverages, Digital Kindle subscriptions, Vehicles (Leasing/Sales), Pet Prescription Medications, Restaurant delivery, Amazon Appstore/Prime Now/Pay Places',
    rate: 0,
  },
  {
    id: 'coach',
    label: 'Coach',
    rate: 0,
  },
  {
    id: 'all_other',
    label: 'All Other Categories',
    rate: 4,
  },
];

/** Categoría por defecto cuando no se indica una (4.00%). */
export const DEFAULT_AMAZON_COMMISSION_CATEGORY = 'all_other';

const CATEGORY_BY_ID = new Map(
  AMAZON_COMMISSION_CATEGORIES.map((c) => [c.id, c] as const),
);

/** Devuelve la categoría (o la categoría por defecto si el id es inválido). */
export function getAmazonCommissionCategory(
  id?: string | null,
): AmazonCommissionCategory {
  return (
    CATEGORY_BY_ID.get(String(id || '')) ||
    CATEGORY_BY_ID.get(DEFAULT_AMAZON_COMMISSION_CATEGORY)!
  );
}

/** Tasa de comisión de Amazon (%) para una categoría. */
export function amazonCommissionRate(id?: string | null): number {
  return getAmazonCommissionCategory(id).rate;
}

/** % neto que recibe el influencer tras retener PLATFORM_CUT_RATE (redondeado a 2 decimales). */
export function influencerNetCommissionRate(id?: string | null): number {
  const net = amazonCommissionRate(id) * (1 - PLATFORM_CUT_RATE);
  return Math.round(net * 100) / 100;
}

/** Formatea una tasa como porcentaje con 2 decimales (ej. 8 → "8.00%"). */
export function formatCommissionPct(rate: number): string {
  return `${rate.toFixed(2)}%`;
}

/**
 * Tipo de cambio aproximado para vista previa (1 MXN ≈ 0.058 USD).
 * Consistente con PREVIEW_FX_MXN_USD en QuickPromotionPage; el monto real puede variar.
 */
export const PREVIEW_FX_MXN_USD = 0.058;

export type Currency = 'USD' | 'MXN';

/** Convierte un monto entre USD y MXN usando el tipo de cambio de vista previa. */
export function convertAmount(
  amount: number,
  from: Currency,
  to: Currency,
): number {
  if (from === to) return amount;
  if (from === 'MXN' && to === 'USD') return amount * PREVIEW_FX_MXN_USD;
  if (from === 'USD' && to === 'MXN') return amount / PREVIEW_FX_MXN_USD;
  return amount;
}

/**
 * Comisión del influencer en dinero (sobre el precio dado, en la moneda del precio).
 * Ej: precio 100 USD, categoría 10% → influencer 8% → 8 USD.
 */
export function influencerCommissionAmount(
  categoryId: string | null | undefined,
  price: number,
): number {
  const p = Number(price) || 0;
  return (p * influencerNetCommissionRate(categoryId)) / 100;
}

/** Formatea un monto en dinero con símbolo y 2 decimales (ej. "$8.00 USD"). */
export function formatMoney(amount: number, currency: Currency): string {
  const n = amount.toLocaleString(currency === 'USD' ? 'en-US' : 'es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `$${n} ${currency}`;
}
