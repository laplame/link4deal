import { pushDataLayer } from '../../utils/googleTagManager';

export type LandingVariant = 'a' | 'b' | 'c';

/** Rutas de conversión y cross-sell entre landings sociales. */
export const LANDING_FLOWS = {
    home: '/',
    /** Creadores / influencers */
    a: {
        path: '/landing-a',
        primaryCta: '/influencer/setup',
    },
    /** Negocios locales — crear promoción rápida */
    b: {
        path: '/landing-b',
        primaryCta: '/quick-promotion',
    },
    /** Agencias */
    c: {
        path: '/landing-c',
        primaryCta: '/agency/setup',
    },
} as const;

export function trackLandingCta(
    variant: LandingVariant,
    source: string,
    destination: string,
) {
    pushDataLayer({
        event: `landing_${variant}_cta_click`,
        landing_path: LANDING_FLOWS[variant].path,
        cta_source: source,
        cta_destination: destination,
    });
}

export function landingCtaProps(variant: LandingVariant, source: string) {
    const destination = LANDING_FLOWS[variant].primaryCta;
    return {
        to: destination,
        onClick: () => trackLandingCta(variant, source, destination),
    };
}
