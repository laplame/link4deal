/**
 * Detección de móvil y navegadores in-app (Instagram, TikTok, Facebook, etc.).
 * Útil para ajustar layout de webviews con viewport reducido y scroll raro.
 */

export type InAppBrowserId =
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'snapchat'
  | 'twitter'
  | 'linkedin'
  | 'line'
  | 'generic'
  | null;

export type MobileWebAppContext = {
  isMobile: boolean;
  isInAppBrowser: boolean;
  inAppId: InAppBrowserId;
  /** Móvil dentro de webview de red social u otra app */
  isMobileInApp: boolean;
};

function getUserAgent(): string {
  if (typeof navigator === 'undefined') return '';
  return navigator.userAgent || '';
}

export function detectInAppBrowser(ua = getUserAgent()): InAppBrowserId {
  const s = ua.toLowerCase();
  if (s.includes('instagram')) return 'instagram';
  if (s.includes('tiktok') || s.includes('musical_ly') || s.includes('bytedancewebview')) return 'tiktok';
  if (s.includes('fbav') || s.includes('fban') || s.includes('fbios') || s.includes('facebook')) return 'facebook';
  if (s.includes('snapchat')) return 'snapchat';
  if (s.includes('twitter') || s.includes('x.com') || (s.includes('twitter') && s.includes('iphone'))) return 'twitter';
  if (s.includes('linkedin')) return 'linkedin';
  if (s.includes(' line/') || s.includes('line/')) return 'line';
  // WebView genérico Android (sin Chrome completo en UA)
  if (/wv\)|; wv\)/i.test(ua) && !/chrome\/[\d.]+ mobile safari/i.test(ua)) return 'generic';
  return null;
}

export function isMobileUserAgent(ua = getUserAgent()): boolean {
  const s = ua.toLowerCase();
  if (/android|webos|iphone|ipod|blackberry|iemobile|opera mini|mobile/i.test(s)) return true;
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(max-width: 768px)').matches;
  }
  return false;
}

export function getMobileWebAppContext(ua = getUserAgent()): MobileWebAppContext {
  const isMobile = isMobileUserAgent(ua);
  const inAppId = detectInAppBrowser(ua);
  const isInAppBrowser = inAppId !== null;
  return {
    isMobile,
    isInAppBrowser,
    inAppId,
    isMobileInApp: isMobile && isInAppBrowser,
  };
}

/** Aplica data-* en <html> para estilos CSS (una vez por sesión de página). */
export function applyMobileWebAppHtmlFlags(ctx = getMobileWebAppContext()): void {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  el.dataset.mobile = ctx.isMobile ? 'true' : 'false';
  el.dataset.inAppBrowser = ctx.isInAppBrowser ? 'true' : 'false';
  if (ctx.inAppId) el.dataset.inAppId = ctx.inAppId;
  else delete el.dataset.inAppId;
}

export function isInfluencerStorePath(pathname: string): boolean {
  return /^\/influencer\/[^/]+\/tienda\/?$/.test(pathname);
}

/** Path interno de la página de una sola promoción de un influencer. */
export function buildInfluencerPromoPath(slug: string, promotionId: string): string {
  return `/influencer/${encodeURIComponent(slug)}/promo/${encodeURIComponent(promotionId)}`;
}

/** URL absoluta compartible (para pegar en bio de TikTok/Instagram). */
export function buildInfluencerPromoUrl(slug: string, promotionId: string): string {
  const origin =
    typeof window !== 'undefined' && window.location ? window.location.origin : '';
  return `${origin}${buildInfluencerPromoPath(slug, promotionId)}`;
}
