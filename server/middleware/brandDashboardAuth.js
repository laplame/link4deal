'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isPlatformSuperuserEmail } = require('../utils/platformSuperuser');
const { getAdminAccessPin } = require('../utils/adminAccessPin');

/**
 * Contraseña del panel marcas: BRAND_APPLICATIONS_MASTER_PASSWORD o el mismo PIN que super admin (ADMIN_ACCESS_PIN).
 */
function getExpectedBrandMasterPassword() {
    const v = process.env.BRAND_APPLICATIONS_MASTER_PASSWORD;
    if (typeof v === 'string' && v.trim().length > 0) {
        return v.trim();
    }
    return getAdminAccessPin();
}

function passwordMatches(provided) {
    if (!provided) return false;
    const expected = getExpectedBrandMasterPassword();
    return provided === expected;
}

async function trySuperAdminJwt(req) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) return false;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('email isSuperAdmin').lean();
        if (!user) return false;
        return user.isSuperAdmin === true || isPlatformSuperuserEmail(user.email);
    } catch {
        return false;
    }
}

async function verifyBrandDashboardPassword(req, res, next) {
    if (await trySuperAdminJwt(req)) {
        req.brandDashboardAuth = 'superadmin-jwt';
        return next();
    }

    const rawHeader = req.headers['x-brand-dashboard-password'];
    let provided = typeof rawHeader === 'string' ? rawHeader.trim() : '';
    if (!provided && req.headers.authorization) {
        const auth = String(req.headers.authorization);
        if (auth.startsWith('Bearer ')) {
            provided = auth.slice(7).trim();
        }
    }

    if (!passwordMatches(provided)) {
        return res.status(401).json({
            success: false,
            message:
                'Acceso denegado. Usa el mismo PIN/contraseña de super admin (ADMIN_ACCESS_PIN) o inicia sesión como super admin.',
        });
    }

    req.brandDashboardAuth = 'master-password';
    next();
}

module.exports = {
    verifyBrandDashboardPassword,
    getExpectedBrandMasterPassword,
    getAdminAccessPin,
};
