const express = require('express');
const path = require('path');
const fs = require('fs');
const AppDownloadStats = require('../models/AppDownloadStats');
const { optionalAuth } = require('../middleware/jwtAuth');
const { recordInfluencerCrmEvent, normalizeAppKey, APP_KEYS } = require('../utils/influencerCrm');

const router = express.Router();
const KEY = 'global';

/** Archivo en disco (public/assets → servido por Express en /public/...) */
const APK_BASENAME = 'build-1777745115129.apk';
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
router.post('/', optionalAuth, async (req, res) => {
    try {
        const result = await AppDownloadStats.findOneAndUpdate(
            { key: KEY },
            { $inc: { count: 1 }, $set: { lastUpdated: new Date() } },
            { upsert: true, new: true }
        );

        const appKey = normalizeAppKey(req.body?.appKey || req.body?.app) || APP_KEYS.BIZNEAI_MERCHANT;
        const isInstall = req.body?.eventType !== 'open';
        recordInfluencerCrmEvent({
            userId: req.user?._id,
            influencerId: req.body?.influencerId,
            appKey,
            eventType: isInstall ? 'install' : 'open',
            platform: req.body?.platform,
            appVersion: req.body?.appVersion,
            deviceId: req.body?.deviceId,
            req,
        }).catch((e) => console.warn('CRM track app-download:', e.message));

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

const { requireSuperAdmin } = require('../middleware/requireSuperAdmin');

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
