import { getApiBase } from './apiUrl';

/**
 * Obtiene la URL pública de la imagen principal de una promoción.
 * Prioridad: Cloudinary > url > /uploads/promotions/{filename} > placeholder.
 * No usa `path` porque es la ruta en disco del servidor, no accesible desde el navegador.
 * Normaliza URLs antiguas tipo /uploads/promotion-xxx a /uploads/promotions/promotion-xxx.
 *
 * En el navegador, rutas /uploads/ son relativas al origen (funciona en damecodigo.com y link4deal.com).
 * Si la API guardó una URL absoluta a otro dominio pero mismo path /uploads/, se convierte a ruta relativa.
 */

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
  const base = getApiBase().trim();
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

export type PromotionImageEntry = {
  cloudinaryUrl?: string;
  url?: string;
  filename?: string;
  path?: string;
  imageRole?: string;
  uploadedAt?: string | Date;
};

function uploadedAtMs(entry: PromotionImageEntry): number {
  const t = entry.uploadedAt;
  if (!t) return 0;
  const ms = new Date(t).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

/** Imagen de portada: promocional más reciente (no T&C), no la primera del array si quedó obsoleta. */
export function pickPromotionCoverImage(
  images: PromotionImageEntry[] | undefined | null,
): PromotionImageEntry | null {
  if (!images?.length) return null;
  const promotional = images.filter((img) => img.imageRole !== 'terms');
  const pool = promotional.length > 0 ? promotional : images;
  const sorted = [...pool].sort((a, b) => uploadedAtMs(b) - uploadedAtMs(a));
  const withCloudinary = sorted.find((img) => img.cloudinaryUrl);
  if (withCloudinary) return withCloudinary;
  return sorted[0] ?? null;
}

function resolveRelativeUrl(img: PromotionImageEntry): string | null {
  if (img.cloudinaryUrl) return img.cloudinaryUrl;
  if (img.url) {
    const normalized = img.url.startsWith('/uploads/') && !img.url.includes('/uploads/promotions/')
      ? toPromotionsUrl(img.url)
      : img.url;
    return uploadsPathOnlyIfAbsolute(normalized);
  }
  if (img.filename) return `/uploads/promotions/${img.filename}`;
  return null;
}

export function getPromotionImageUrl(
  images: PromotionImageEntry[] | undefined | null,
  placeholder = DEFAULT_PLACEHOLDER
): string {
  const img = pickPromotionCoverImage(images);
  if (!img) return placeholder;

  const relativeUrl = resolveRelativeUrl(img);
  if (!relativeUrl) return placeholder;

  if (relativeUrl.startsWith('http')) return relativeUrl;
  if (typeof window !== 'undefined') return absoluteUploadsUrlInBrowser(relativeUrl);
  const b = getApiBase().trim();
  return b ? `${b}${relativeUrl}` : relativeUrl;
}
