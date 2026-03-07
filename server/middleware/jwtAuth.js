const jwt = require('jsonwebtoken');
const User = require('../models/User');

/** Verifica JWT y asigna req.user. Usado por rutas que requieren sesión. */
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token de acceso requerido' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).populate('roles');
        if (!user) {
            return res.status(401).json({ message: 'Usuario no encontrado' });
        }
        if (user.isLocked && user.isLocked()) {
            return res.status(423).json({ message: 'Cuenta bloqueada temporalmente' });
        }
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        return res.status(403).json({ message: 'Token inválido' });
    }
};

/** Opcional: si hay token válido asigna req.user; si no, sigue sin asignar (no devuelve 401). */
const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return next();
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).populate('roles');
        if (user && !(user.isLocked && user.isLocked())) req.user = user;
    } catch (_) { /* ignore */ }
    next();
};

module.exports = { authenticateToken, optionalAuth };
