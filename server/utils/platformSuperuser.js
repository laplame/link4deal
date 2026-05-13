'use strict';

/**
 * Superusuario de plataforma: puede alternar en el front entre paneles de
 * influencer, marca y agencia (sin cambiar primaryRole en BD).
 *
 * Lista por defecto incluye el correo indicado por producto; en producción
 * puedes sobreescribir con PLATFORM_SUPERUSER_EMAILS (CSV, minúsculas tras trim).
 */

const DEFAULT_PLATFORM_SUPERUSER_EMAILS = ['saul.laplame@gmail.com'];

const CREATOR_DASHBOARD_ACCESS = ['influencer', 'brand', 'agency'];

function parseEmailSetFromEnv(raw) {
    if (!raw || !String(raw).trim()) return null;
    const set = new Set(
        String(raw)
            .split(',')
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean)
    );
    return set.size > 0 ? set : null;
}

function platformSuperuserEmailSet() {
    const fromEnv = parseEmailSetFromEnv(process.env.PLATFORM_SUPERUSER_EMAILS);
    if (fromEnv) return fromEnv;
    return new Set(DEFAULT_PLATFORM_SUPERUSER_EMAILS.map((e) => e.toLowerCase()));
}

function isPlatformSuperuserEmail(email) {
    if (!email || typeof email !== 'string') return false;
    return platformSuperuserEmailSet().has(String(email).trim().toLowerCase());
}

/**
 * Campos extra en JSON de usuario para el cliente (login / register / me).
 * @param {{ email?: string | null }} user
 */
function authUserDashboardFields(user) {
    const isPlatformSuperuser = isPlatformSuperuserEmail(user && user.email);
    if (!isPlatformSuperuser) {
        return { isPlatformSuperuser: false };
    }
    return {
        isPlatformSuperuser: true,
        dashboardAccess: [...CREATOR_DASHBOARD_ACCESS],
    };
}

module.exports = {
    isPlatformSuperuserEmail,
    authUserDashboardFields,
    CREATOR_DASHBOARD_ACCESS,
};
