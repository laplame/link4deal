/**
 * Origen del backend cuando la SPA no comparte el mismo host que Express.
 * Ej.: VITE_API_URL=https://link4deal.com — ver también `promotionImage.ts` (API_BASE).
 */
export function getApiBase(): string {
  return (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
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
