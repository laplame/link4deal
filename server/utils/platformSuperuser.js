'use strict';

const { buildEmailCandidates } = require('./emailCandidates');

/**
 * Superusuario de plataforma: alterna paneles influencer, marca y agencia en el front.
 * También aplica si User.isSuperAdmin === true.
 */

const DEFAULT_PLATFORM_SUPERUSER_EMAILS = [
    'saul.laplame@gmail.com',
    'saullaplame@gmail.com',
];

const CREATOR_DASHBOARD_ACCESS = ['influencer', 'brand', 'agency'];

function parseEmailSetFromEnv(raw) {
    if (!raw || !String(raw).trim()) return null;
    const set = new Set(
        String(raw)
            .split(',')
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean),
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
    const allow = platformSuperuserEmailSet();
    for (const candidate of buildEmailCandidates(email)) {
        if (allow.has(candidate)) return true;
    }
    return false;
}

/**
 * Campos extra en JSON de usuario para el cliente (login / register / me).
 * @param {{ email?: string | null, isSuperAdmin?: boolean }} user
 */
function authUserDashboardFields(user) {
    const byEmail = isPlatformSuperuserEmail(user && user.email);
    const byFlag = Boolean(user && user.isSuperAdmin);
    if (!byEmail && !byFlag) {
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
