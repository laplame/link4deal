'use strict';

/**
 * PIN de super admin (CRM / landing). Misma fuente que VITE_ADMIN_ACCESS_PIN en el front.
 */
function getAdminAccessPin() {
    const v = process.env.ADMIN_ACCESS_PIN || process.env.VITE_ADMIN_ACCESS_PIN;
    if (typeof v === 'string' && v.trim().length > 0) {
        return v.trim();
    }
    return '6192';
}

module.exports = { getAdminAccessPin };
