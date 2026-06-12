/** Google Analytics 4 — measurement ID (override con VITE_GA4_ID en .env). */
export const GA4_MEASUREMENT_ID =
    (import.meta.env.VITE_GA4_ID as string | undefined)?.trim() || 'G-T07TDTRKQ3';

export const GA4_GTAG_SCRIPT_SRC = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
