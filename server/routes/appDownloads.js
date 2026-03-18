const express = require('express');
const AppDownloadStats = require('../models/AppDownloadStats');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const KEY = 'global';
const APK_PATH = '/build-1772854318161.apk';

/** GET /api/app-downloads/redirect - Redirige al APK e incrementa el contador (para QR y enlaces directos) */
router.get('/redirect', async (req, res) => {
    try {
        await AppDownloadStats.findOneAndUpdate(
            { key: KEY },
            { $inc: { count: 1 }, $set: { lastUpdated: new Date() } },
            { upsert: true }
        );
        const base = `${req.protocol}://${req.get('host')}`;
        return res.redirect(302, `${base}${APK_PATH}`);
    } catch (err) {
        console.error('Error en redirect de descarga:', err);
        const base = `${req.protocol}://${req.get('host')}`;
        return res.redirect(302, `${base}${APK_PATH}`);
    }
});

/** POST /api/app-downloads - Incrementa el contador (público, al hacer clic en descargar) */
router.post('/', async (req, res) => {
    try {
        const result = await AppDownloadStats.findOneAndUpdate(
            { key: KEY },
            { $inc: { count: 1 }, $set: { lastUpdated: new Date() } },
            { upsert: true, new: true }
        );
        return res.json({
            success: true,
            count: result.count
        });
    } catch (err) {
        console.error('Error incrementando contador de descargas:', err);
        return res.status(500).json({
            success: false,
            message: 'Error al registrar la descarga'
        });
    }
});

/** Middleware: requiere super admin para GET */
const requireSuperAdmin = async (req, res, next) => {
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
        if (!user.isSuperAdmin) {
            return res.status(403).json({ message: 'Acceso denegado. Solo super admin.' });
        }
        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        return res.status(403).json({ message: 'Token inválido' });
    }
};

/** GET /api/app-downloads - Obtiene el contador (solo super admin) */
router.get('/', requireSuperAdmin, async (req, res) => {
    try {
        const doc = await AppDownloadStats.findOne({ key: KEY });
        const count = doc ? doc.count : 0;
        return res.json({
            success: true,
            count,
            lastUpdated: doc?.lastUpdated || null
        });
    } catch (err) {
        console.error('Error obteniendo contador de descargas:', err);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener el contador'
        });
    }
});

module.exports = router;
