const express = require('express');
const path = require('path');
const fs = require('fs');
const AppDownloadStats = require('../models/AppDownloadStats');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const KEY = 'global';

/** Archivo en disco (public/assets → servido por Express en /public/...) */
const APK_BASENAME = 'build-1777749250753.apk';
const APK_DISK_PATH = path.join(__dirname, '../../public/assets', APK_BASENAME);
/** URL pública de respaldo si no hay archivo en disco (p. ej. CDN u otro host) */
const APK_PUBLIC_URL_PATH = `/public/assets/${APK_BASENAME}`;
const APK_DOWNLOAD_FILENAME = 'damecodigo-link4deal.apk';

function bumpDownloadCountFireAndForget() {
    AppDownloadStats.findOneAndUpdate(
        { key: KEY },
        { $inc: { count: 1 }, $set: { lastUpdated: new Date() } },
        { upsert: true }
    ).catch((err) => console.error('Error contador descarga APK (no bloquea):', err.message));
}

/**
 * GET /api/app-downloads/redirect — Descarga el APK (attachment) y cuenta el clic.
 * Antes redirigía a /assets/... pero los estáticos están montados en /public/..., causando 404.
 */
router.get('/redirect', (req, res) => {
    bumpDownloadCountFireAndForget();

    try {
        if (fs.existsSync(APK_DISK_PATH)) {
            return res.download(APK_DISK_PATH, APK_DOWNLOAD_FILENAME, (err) => {
                if (err) {
                    console.error('Error enviando APK:', err.message);
                    if (!res.headersSent) {
                        res.status(500).json({ success: false, message: 'No se pudo enviar el archivo APK' });
                    }
                }
            });
        }
    } catch (e) {
        console.error('APK read error:', e.message);
    }

    const base = `${req.protocol}://${req.get('host')}`;
    return res.redirect(302, `${base}${APK_PUBLIC_URL_PATH}`);
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
