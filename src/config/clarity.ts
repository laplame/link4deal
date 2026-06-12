/** Microsoft Clarity — project ID (override con VITE_CLARITY_ID en .env). */
export const CLARITY_PROJECT_ID =
    (import.meta.env.VITE_CLARITY_ID as string | undefined)?.trim() || 'ii79hzm8sb';

export const CLARITY_SCRIPT_SRC = `https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}`;
