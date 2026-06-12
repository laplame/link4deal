import { buildInfluencerPromoPath } from './mobileWebApp';

export type InfluencerTrafficChannel = 'profile' | 'store' | 'promo' | 'coupon' | 'faq' | 'other';

export interface InfluencerChannelLinkDef {
    channel: InfluencerTrafficChannel;
    label: string;
    description: string;
    path: string;
    pathPattern?: string;
}

/** Enlaces públicos del influencer para compartir y medir tráfico por canal. */
export function buildInfluencerChannelLinks(
    slug: string,
    influencerId?: string,
): InfluencerChannelLinkDef[] {
    const s = encodeURIComponent(slug);
    const refQ = influencerId ? `?ref=${encodeURIComponent(influencerId)}` : '';
    return [
        {
            channel: 'profile',
            label: 'Perfil',
            description: 'Página principal del influencer',
            path: `/influencer/${s}`,
        },
        {
            channel: 'store',
            label: 'Tienda',
            description: 'Catálogo y productos disponibles',
            path: `/influencer/${s}/tienda`,
        },
        {
            channel: 'promo',
            label: 'Promo / cupón (link único)',
            description: 'Una promoción concreta (sustituye el id de promoción)',
            path: buildInfluencerPromoPath(slug, '{promotionId}'),
            pathPattern: `/influencer/${s}/promo/`,
        },
        {
            channel: 'coupon',
            label: 'Cupón QR',
            description: 'Página de canje; añade ref para atribución',
            path: `/coupon/{couponId}${refQ}`,
            pathPattern: '/coupon/',
        },
        {
            channel: 'faq',
            label: 'FAQ',
            description: 'Preguntas frecuentes del perfil',
            path: `/influencer/${s}/faq`,
        },
    ];
}
