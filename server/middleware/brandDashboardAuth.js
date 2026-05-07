/**
 * Acceso al panel de aplicaciones (marcas) mediante contraseña maestra.
 * Contraseña: variable BRAND_APPLICATIONS_MASTER_PASSWORD o valor por defecto acordado en desarrollo.
 */
function getExpectedBrandMasterPassword() {
    const v = process.env.BRAND_APPLICATIONS_MASTER_PASSWORD;
    if (typeof v === 'string' && v.trim().length > 0) {
        return v.trim();
    }
    return 'damecode@69';
}

function verifyBrandDashboardPassword(req, res, next) {
    const expected = getExpectedBrandMasterPassword();
    const rawHeader = req.headers['x-brand-dashboard-password'];
    let provided = typeof rawHeader === 'string' ? rawHeader : '';
    if (!provided && req.headers.authorization) {
        const auth = String(req.headers.authorization);
        if (auth.startsWith('Bearer ')) {
            provided = auth.slice(7).trim();
        }
    }
    if (!provided || provided !== expected) {
        return res.status(401).json({
            success: false,
            message: 'Acceso denegado. Contraseña incorrecta o no enviada (header X-Brand-Dashboard-Password).'
        });
    }
    next();
}

module.exports = {
    verifyBrandDashboardPassword,
    getExpectedBrandMasterPassword
};
