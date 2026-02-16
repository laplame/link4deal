/**
 * Obtiene la URL pública de la imagen principal de una promoción.
 * Prioridad: Cloudinary > url > /uploads/promotions/{filename} > placeholder.
 * No usa `path` porque es la ruta en disco del servidor, no accesible desde el navegador.
 * Normaliza URLs antiguas tipo /uploads/promotion-xxx a /uploads/promotions/promotion-xxx.
 */
const API_BASE = import.meta.env.VITE_API_URL || '';

/** Placeholder en data URL para no depender de servicios externos (via.placeholder.com puede fallar o bloquearse). */
const DEFAULT_PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Ctext fill="%239ca3af" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18"%3EOferta%3C/text%3E%3C/svg%3E';

function toPromotionsUrl(urlOrFilename: string): string {
  const s = urlOrFilename.replace(/^\/+/, '');
  if (s.startsWith('uploads/promotions/')) return `/${s}`;
  if (s.startsWith('uploads/')) return `/uploads/promotions/${s.replace(/^uploads\/?/, '').replace(/.*\//, '')}`;
  return `/uploads/promotions/${s}`;
}

export function getPromotionImageUrl(
  images: Array<{ cloudinaryUrl?: string; url?: string; filename?: string; path?: string }> | undefined | null,
  placeholder = DEFAULT_PLACEHOLDER
): string {
  if (!images || images.length === 0) return placeholder;
  const img = images[0];
  if (img.cloudinaryUrl) return img.cloudinaryUrl;
  const relativeUrl = img.url
    ? (img.url.startsWith('/uploads/') && !img.url.includes('/uploads/promotions/')
        ? toPromotionsUrl(img.url)
        : img.url)
    : img.filename
      ? `/uploads/promotions/${img.filename}`
      : null;
  if (relativeUrl) {
    const url = relativeUrl.startsWith('http') ? relativeUrl : `${API_BASE}${relativeUrl}`;
    return url;
  }
  return placeholder;
}
