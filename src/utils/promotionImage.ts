/**
 * Obtiene la URL pública de la imagen principal de una promoción.
 * Prioridad: Cloudinary > url > /uploads/{filename} (compatibilidad con datos antiguos) > placeholder.
 * No usa `path` porque es la ruta en disco del servidor, no accesible desde el navegador.
 */
const API_BASE = import.meta.env.VITE_API_URL || '';

export function getPromotionImageUrl(
  images: Array<{ cloudinaryUrl?: string; url?: string; filename?: string; path?: string }> | undefined | null,
  placeholder = 'https://via.placeholder.com/400x300'
): string {
  if (!images || images.length === 0) return placeholder;
  const img = images[0];
  if (img.cloudinaryUrl) return img.cloudinaryUrl;
  const relativeUrl = img.url || (img.filename ? `/uploads/${img.filename}` : null);
  if (relativeUrl) {
    const url = relativeUrl.startsWith('http') ? relativeUrl : `${API_BASE}${relativeUrl}`;
    return url;
  }
  return placeholder;
}
