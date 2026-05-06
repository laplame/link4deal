/**
 * Obtiene la URL pública de la imagen principal de una promoción.
 * Prioridad: Cloudinary > url > /uploads/promotions/{filename} > placeholder.
 * No usa `path` porque es la ruta en disco del servidor, no accesible desde el navegador.
 * Normaliza URLs antiguas tipo /uploads/promotion-xxx a /uploads/promotions/promotion-xxx.
 *
 * En el navegador, rutas /uploads/ son relativas al origen (funciona en damecodigo.com y link4deal.com).
 * Si la API guardó una URL absoluta a otro dominio pero mismo path /uploads/, se convierte a ruta relativa.
 */
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/** Placeholder en data URL para no depender de servicios externos (via.placeholder.com puede fallar o bloquearse). */
const DEFAULT_PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Ctext fill="%239ca3af" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18"%3EOferta%3C/text%3E%3C/svg%3E';

function toPromotionsUrl(urlOrFilename: string): string {
  const s = urlOrFilename.replace(/^\/+/, '');
  if (s.startsWith('uploads/promotions/')) return `/${s}`;
  if (s.startsWith('uploads/')) return `/uploads/promotions/${s.replace(/^uploads\/?/, '').replace(/.*\//, '')}`;
  return `/uploads/promotions/${s}`;
}

/** Convierte https://cualquier-host/uploads/... en /uploads/... para servir desde el mismo dominio de la SPA. */
function uploadsPathOnlyIfAbsolute(urlOrPath: string): string {
  const s = urlOrPath.trim();
  if (!s.startsWith('http://') && !s.startsWith('https://')) return s;
  try {
    const u = new URL(s);
    if (u.pathname.startsWith('/uploads/')) return u.pathname + u.search;
  } catch {
    /* ignore */
  }
  return s;
}

/** Origen de la API si VITE_API_URL está definida (SPA en otro host → imágenes deben pedirse al backend). */
function apiOriginForUploads(): string | null {
  const base = API_BASE.trim();
  if (!base) return null;
  try {
    const url = base.includes('://') ? base : `${typeof window !== 'undefined' ? window.location.protocol : 'https:'}//${base}`;
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function absoluteUploadsUrlInBrowser(relativeUploadsPath: string): string {
  if (typeof window === 'undefined') return relativeUploadsPath;
  if (!relativeUploadsPath.startsWith('/uploads')) return relativeUploadsPath;
  const apiOrigin = apiOriginForUploads();
  if (apiOrigin && apiOrigin !== window.location.origin) {
    return `${apiOrigin}${relativeUploadsPath}`;
  }
  return relativeUploadsPath;
}

export function getPromotionImageUrl(
  images: Array<{ cloudinaryUrl?: string; url?: string; filename?: string; path?: string }> | undefined | null,
  placeholder = DEFAULT_PLACEHOLDER
): string {
  if (!images || images.length === 0) return placeholder;
  const img = images[0];
  if (img.cloudinaryUrl) return img.cloudinaryUrl;

  let relativeUrl: string | null = img.url
    ? uploadsPathOnlyIfAbsolute(
        img.url.startsWith('/uploads/') && !img.url.includes('/uploads/promotions/')
          ? toPromotionsUrl(img.url)
          : img.url
      )
    : img.filename
      ? `/uploads/promotions/${img.filename}`
      : null;

  if (relativeUrl) {
    relativeUrl = uploadsPathOnlyIfAbsolute(relativeUrl);
    if (relativeUrl.startsWith('http')) return relativeUrl;
    // Mismo host que Nginx (/api, /uploads): relativo. SPA en otro origen que VITE_API_URL: prefijo al API (como antes).
    if (typeof window !== 'undefined') return absoluteUploadsUrlInBrowser(relativeUrl);
    return API_BASE ? `${API_BASE}${relativeUrl}` : relativeUrl;
  }
  return placeholder;
}
