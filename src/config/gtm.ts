/** Contenedor Google Tag Manager (override con VITE_GTM_ID en .env). */
export const GTM_ID = (import.meta.env.VITE_GTM_ID as string | undefined)?.trim() || 'GTM-52MGDMBK';

export const GTM_SCRIPT_SRC = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
export const GTM_NOSCRIPT_SRC = `https://www.googletagmanager.com/ns.html?id=${GTM_ID}`;
