/** Etiqueta de tienda para promociones que redirigen a Amazon México. */
export const AMAZON_MX_STORE_LABEL = 'Amazon Mx';

/** URL de afiliado por defecto (sincronizar con server/routes/discountQr.js). */
export const DEFAULT_AMAZON_AFFILIATE_URL = 'https://amzn.to/3NfsW8K';

/** Tag de afiliado por defecto (sincronizar con AMAZON_AFFILIATE_TAG en backend). */
export const DEFAULT_AMAZON_AFFILIATE_TAG = 'jalme-20';

/**
 * Promoción de Amazon si redirige a comprar y la URL es de Amazon
 * (o está vacía → link de afiliado Amazon por defecto).
 */
export function isAmazonPromotion(p: {
  redirectInsteadOfQr?: boolean;
  redirectToUrl?: string | null;
}): boolean {
  if (!p.redirectInsteadOfQr) return false;
  const url = (p.redirectToUrl || '').toLowerCase();
  if (!url) return true;
  return /amazon|amzn/.test(url);
}

/** Construye URL de afiliado Amazon (añade tag si la URL es de Amazon). */
export function buildAmazonRedirectUrl(redirectToUrl?: string | null): string {
  const trimmed = (redirectToUrl || '').trim();
  if (!trimmed) return DEFAULT_AMAZON_AFFILIATE_URL;
  try {
    const u = new URL(trimmed);
    const host = (u.hostname || '').toLowerCase();
    if (host.includes('amazon') || host.includes('amzn.to')) {
      u.searchParams.set('tag', DEFAULT_AMAZON_AFFILIATE_TAG);
      return u.toString();
    }
    return trimmed;
  } catch {
    return trimmed || DEFAULT_AMAZON_AFFILIATE_URL;
  }
}
