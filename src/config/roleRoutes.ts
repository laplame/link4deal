/**
 * Rutas de páginas por rol (SPA). Las APIs siguen en /api/... sin cambios.
 */

export const ROLE_ROUTES = {
    influencer: {
        hub: '/influencer',
        setup: '/influencer/setup',
        auth: '/influencer/auth',
        panel: '/influencer/panel',
        profile: (slug: string) => `/influencer/${encodeURIComponent(slug)}`,
        profileEdit: (slug: string) => `/influencer/${encodeURIComponent(slug)}/edit`,
        store: (slug: string) => `/influencer/${encodeURIComponent(slug)}/tienda`,
        faq: (slug: string) => `/influencer/${encodeURIComponent(slug)}/faq`,
        promo: (slug: string, promotionId: string) =>
            `/influencer/${encodeURIComponent(slug)}/promo/${promotionId}`,
    },
    brand: {
        hub: '/brands',
        setup: '/brands/setup',
        applications: '/brands/aplicaciones',
        panel: '/brands/panel',
        profile: (brandId: string) => `/brand/${brandId}`,
    },
    agency: {
        hub: '/agency',
        setup: '/agency/setup',
    },
    admin: {
        home: '/admin',
        dashboard: '/admin/dashboard',
        crm: '/admin/crm',
        influencers: '/admin/influencers',
        brands: '/admin/brands',
        agencies: '/admin/agencies',
    },
} as const;

/** Slugs reservados bajo /influencer/:slug (no son perfiles públicos). */
export const INFLUENCER_RESERVED_SLUGS = new Set(['setup', 'auth', 'panel', 'waitlist']);
