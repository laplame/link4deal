'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isPlatformSuperuserEmail } = require('../utils/platformSuperuser');

/**
 * JWT + super admin (flag o email en PLATFORM_SUPERUSER_EMAILS).
 */
async function requireSuperAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'Token de acceso requerido' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).populate('roles');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
        }
        const allowed = user.isSuperAdmin === true || isPlatformSuperuserEmail(user.email);
        if (!allowed) {
            return res.status(403).json({ success: false, message: 'Acceso denegado. Solo super admin.' });
        }
        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expirado' });
        }
        return res.status(403).json({ success: false, message: 'Token inválido' });
    }
}

module.exports = { requireSuperAdmin };
