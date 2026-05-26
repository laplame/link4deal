'use strict';

const PHONE_SUFFIX_SEP = '#';

/**
 * Permite el mismo número en varias cuentas (solo testing / no producción).
 * - ALLOW_DUPLICATE_PHONES_FOR_TESTING=true  → forzar activo
 * - ALLOW_DUPLICATE_PHONES_FOR_TESTING=false → forzar desactivado
 * - Por defecto: activo si NODE_ENV !== 'production'
 */
function allowDuplicatePhonesForTesting() {
    if (process.env.ALLOW_DUPLICATE_PHONES_FOR_TESTING === 'false') return false;
    if (process.env.ALLOW_DUPLICATE_PHONES_FOR_TESTING === 'true') return true;
    return (process.env.NODE_ENV || 'development') !== 'production';
}

function normalizePhone(value) {
    if (typeof value !== 'string') return '';
    return value.replace(/\D/g, '').trim();
}

/** Número que ve el usuario / app (sin sufijo interno). */
function canonicalPhone(stored) {
    if (stored == null || stored === '') return '';
    const s = String(stored);
    const idx = s.indexOf(PHONE_SUFFIX_SEP);
    return idx === -1 ? s : s.slice(0, idx);
}

function publicPhone(stored) {
    const c = canonicalPhone(stored);
    return c || undefined;
}

function escapeRegex(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Filtro Mongo: mismo teléfono canónico (con o sin sufijo #testing). */
function phoneLookupFilter(canonical) {
    const c = normalizePhone(canonical);
    if (!c) return { phone: '__invalid_phone__' };
    return {
        $or: [{ phone: c }, { phone: { $regex: `^${escapeRegex(c)}\\${PHONE_SUFFIX_SEP}` } }],
    };
}

/**
 * Valor a guardar en User.phone (único en BD).
 * Si ya hay otra cuenta con ese número y el modo testing está activo, añade sufijo.
 */
async function resolveStoragePhone(canonical) {
    const c = normalizePhone(canonical);
    if (!c) return null;
    if (!allowDuplicatePhonesForTesting()) return c;

    const User = require('../models/User');
    const taken = await User.exists(phoneLookupFilter(c));
    if (!taken) return c;

    const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    return `${c}${PHONE_SUFFIX_SEP}${suffix}`;
}

module.exports = {
    PHONE_SUFFIX_SEP,
    allowDuplicatePhonesForTesting,
    normalizePhone,
    canonicalPhone,
    publicPhone,
    phoneLookupFilter,
    resolveStoragePhone,
};
