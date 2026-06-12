import { promotionAbsoluteUrl, type PromotionUrlFields } from './promotionPublicUrl';

const SITE_ORIGIN =
    (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined)?.trim() ||
    'https://www.damecodigo.com';

export interface PromotionSeoInput extends PromotionUrlFields {
    title?: string;
    description?: string;
    brand?: string;
    storeName?: string;
    discountPercentage?: number;
    currentPrice?: number;
    originalPrice?: number;
    currency?: string;
    validUntil?: string;
    image?: string;
    storeLocation?: {
        address?: string;
        city?: string;
        state?: string;
        country?: string;
        coordinates?: { latitude?: number; longitude?: number };
    };
    isExpired?: boolean;
}

function truncate(text: string, max: number): string {
    const t = text.trim();
    if (t.length <= max) return t;
    return `${t.slice(0, max - 1).trim()}…`;
}

export function buildPromotionPageTitle(p: PromotionSeoInput): string {
    const title = p.title || 'Promoción';
    const brand = p.brand || p.storeName;
    const city = p.storeLocation?.city;
    const discount =
        typeof p.discountPercentage === 'number' && p.discountPercentage > 0
            ? `${p.discountPercentage}% `
            : '';
    const parts = [`${discount}${title}`];
    if (brand) parts.push(brand);
    if (city) parts.push(city);
    return truncate(`${parts.join(' — ')} | DameCodigo`, 70);
}

export function buildPromotionMetaDescription(p: PromotionSeoInput): string {
    const brand = p.brand || p.storeName || 'comercio';
    const city = p.storeLocation?.city || 'México';
    const discount =
        typeof p.discountPercentage === 'number' && p.discountPercentage > 0
            ? `${p.discountPercentage}% de descuento`
            : 'oferta especial';
    const desc = p.description?.trim();
    if (desc) return truncate(`${desc} ${discount} en ${brand}, ${city}.`, 160);
    return truncate(
        `Aprovecha ${discount} en ${brand} (${city}). Cupón y detalles en DameCodigo.`,
        160
    );
}

export function buildPromotionOfferJsonLd(p: PromotionSeoInput): Record<string, unknown> {
    const url = promotionAbsoluteUrl(p);
    const businessName = p.storeName || p.brand || 'Comercio';
    const coords = p.storeLocation?.coordinates;

    const localBusiness: Record<string, unknown> = {
        '@type': 'LocalBusiness',
        name: businessName,
        address: {
            '@type': 'PostalAddress',
            streetAddress: p.storeLocation?.address || undefined,
            addressLocality: p.storeLocation?.city || undefined,
            addressRegion: p.storeLocation?.state || undefined,
            addressCountry: p.storeLocation?.country || 'MX',
        },
    };

    if (
        coords &&
        typeof coords.latitude === 'number' &&
        typeof coords.longitude === 'number'
    ) {
        localBusiness.geo = {
            '@type': 'GeoCoordinates',
            latitude: coords.latitude,
            longitude: coords.longitude,
        };
    }

    const offer: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'Offer',
        name: p.title || 'Promoción',
        description: p.description || buildPromotionMetaDescription(p),
        url,
        priceCurrency: p.currency || 'MXN',
        price: typeof p.currentPrice === 'number' ? p.currentPrice : undefined,
        validThrough: p.validUntil || undefined,
        offeredBy: localBusiness,
        availability: p.isExpired
            ? 'https://schema.org/Discontinued'
            : 'https://schema.org/InStock',
    };

    if (p.image) {
        offer.image = p.image.startsWith('http') ? p.image : `${SITE_ORIGIN.replace(/\/$/, '')}${p.image}`;
    }

    return offer;
}

export function marketplaceSeo() {
    return {
        title: 'Promociones y descuentos cerca de ti — DameCodigo',
        description:
            'Explora promociones activas de marcas y comercios. Aplica como influencer o obtén cupones con descuento según tu ubicación.',
        canonicalPath: '/marketplace',
        canonicalUrl: `${SITE_ORIGIN.replace(/\/$/, '')}/marketplace`,
        noindex: false,
    };
}
