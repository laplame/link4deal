/**
 * Origen del backend cuando la SPA no comparte el mismo host que Express.
 * Si configuras solo un host (ej. www) y sirves también el apex detrás del mismo nginx, las fetch
 * serían cross-origin y además pueden chocar CORS mal configurado — ver NGINX_DAMECODIGO_CONF.md.
 *
 * Si el hostname efectivo coincide (apex vs www se normalizan), devuelve '' para usar rutas
 * relativas `/api` en el mismo origen donde se cargó la página.
 */
export function getApiBase(): string {
  const trimmed = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
  if (!trimmed || typeof window === 'undefined' || !window.location) return trimmed;

  try {
    const pageHostNorm = window.location.hostname.replace(/^www\./i, '');
    const apiUrlStr =
      trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : `${window.location.protocol}//${trimmed}`;
    const apiHostNorm = new URL(apiUrlStr).hostname.replace(/^www\./i, '');
    if (apiHostNorm === pageHostNorm) return '';
  } catch {
    /* mantener trimmed */
  }
  return trimmed;
}

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  const base = getApiBase();
  if (!base) return p;
  if (base.startsWith('http://') || base.startsWith('https://')) {
    return `${base}${p}`;
  }
  const proto = typeof window !== 'undefined' ? window.location.protocol : 'https:';
  return `${proto}//${base}${p}`;
}

/** Rutas `/uploads/...` en el mismo API; URLs absolutas se dejan igual. */
export function mediaUrl(src?: string | null, fallbackName = 'Influencer'): string {
  const trimmed = (src ?? '').trim();
  if (!trimmed) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=7c3aed&color=fff&size=256`;
  }
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return apiUrl(trimmed.startsWith('/') ? trimmed : `/${trimmed}`);
}
