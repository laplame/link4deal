const SITE_ORIGIN =
    (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined)?.trim() ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://www.damecodigo.com');

export interface PromotionUrlFields {
    _id?: string;
    id?: string;
    publicSlug?: string;
}

export function promotionPublicId(p: PromotionUrlFields): string {
    return String(p._id || p.id || '');
}

/** Ruta interna preferida: slug legible si existe, si no ID Mongo. */
export function promotionDetailPath(p: PromotionUrlFields): string {
    const slug = p.publicSlug?.trim();
    if (slug) return `/promo/${encodeURIComponent(slug)}`;
    const id = promotionPublicId(p);
    return id ? `/promotion-details/${encodeURIComponent(id)}` : '/marketplace';
}

export function promotionAbsoluteUrl(p: PromotionUrlFields): string {
    const path = promotionDetailPath(p);
    const base = SITE_ORIGIN.replace(/\/$/, '');
    return `${base}${path}`;
}
