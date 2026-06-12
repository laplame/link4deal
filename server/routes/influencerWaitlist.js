const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const InfluencerWaitlistEntry = require('../models/InfluencerWaitlistEntry');
const database = require('../config/database');
const { requireSuperAdmin } = require('../middleware/requireSuperAdmin');
const { parsePrimarySocial } = require('../utils/waitlistSocialPlatforms');

const router = express.Router();

const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 8,
    message: {
        success: false,
        message: 'Demasiados intentos. Vuelve a intentar en una hora.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

function isMongoConnected() {
    return database.getConnectionStatus().isConnected;
}

function normalizeEmail(raw) {
    return String(raw || '')
        .trim()
        .toLowerCase();
}

function normalizeInstagram(raw) {
    return String(raw || '')
        .trim()
        .replace(/^@+/, '')
        .slice(0, 80);
}

function hashIp(ip) {
    if (!ip) return '';
    return crypto.createHash('sha256').update(String(ip)).digest('hex').slice(0, 24);
}

function memoryStore() {
    if (!global.influencerWaitlistMemory) {
        global.influencerWaitlistMemory = [];
    }
    return global.influencerWaitlistMemory;
}

async function countWaitlistPosition() {
    if (!isMongoConnected()) {
        return memoryStore().length;
    }
    return InfluencerWaitlistEntry.countDocuments({ status: { $ne: 'dismissed' } });
}

/**
 * POST /api/waitlist/influencer
 * Body: { email, name?, primarySocialPlatform?, primarySocialHandle?, city?, ... }
 */
router.post('/influencer', signupLimiter, async (req, res) => {
    try {
        const email = normalizeEmail(req.body?.email);
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Indica un correo válido (de preferencia el de tu cuenta de Google Play).',
            });
        }

        const social = parsePrimarySocial(req.body);

        const payload = {
            email,
            name: String(req.body?.name || '').trim().slice(0, 120),
            primarySocialPlatform: social.primarySocialPlatform,
            primarySocialHandle: social.primarySocialHandle,
            instagramHandle: social.instagramHandle,
            city: String(req.body?.city || '').trim().slice(0, 120),
            niche: String(req.body?.niche || '').trim().slice(0, 120),
            googleAccountEmailNote: email,
            source: 'influencer_waitlist_landing',
            utmSource: String(req.body?.utmSource || '').trim().slice(0, 120),
            utmMedium: String(req.body?.utmMedium || '').trim().slice(0, 120),
            utmCampaign: String(req.body?.utmCampaign || '').trim().slice(0, 120),
            referrer: String(req.body?.referrer || '').trim().slice(0, 500),
            landingPath: String(req.body?.landingPath || '/influencer/waitlist').trim().slice(0, 200),
            ipHash: hashIp(req.ip),
            userAgent: String(req.headers['user-agent'] || '').slice(0, 500),
        };

        if (!isMongoConnected()) {
            const mem = memoryStore();
            const existing = mem.find((e) => e.email === email);
            if (existing) {
                const position = mem.findIndex((e) => e.email === email) + 1;
                return res.json({
                    success: true,
                    alreadyRegistered: true,
                    message: 'Este correo ya está en la lista de espera.',
                    data: {
                        email: existing.email,
                        position,
                        status: existing.status || 'pending',
                    },
                });
            }
            mem.push({ ...payload, status: 'pending', createdAt: new Date() });
            return res.status(201).json({
                success: true,
                message: 'Te agregamos a la lista de espera (modo sin base de datos).',
                data: {
                    email,
                    position: mem.length,
                    status: 'pending',
                },
            });
        }

        let doc;
        try {
            doc = await InfluencerWaitlistEntry.create(payload);
        } catch (err) {
            if (err.code === 11000) {
                const existing = await InfluencerWaitlistEntry.findOne({ email });
                const position =
                    (await InfluencerWaitlistEntry.countDocuments({
                        status: { $ne: 'dismissed' },
                        createdAt: { $lte: existing?.createdAt || new Date() },
                    })) || 1;
                return res.json({
                    success: true,
                    alreadyRegistered: true,
                    message: 'Este correo ya está en la lista de espera.',
                    data: {
                        email,
                        position,
                        status: existing?.status || 'pending',
                    },
                });
            }
            throw err;
        }

        const position = await countWaitlistPosition();

        return res.status(201).json({
            success: true,
            message:
                '¡Listo! Te contactaremos para invitarte como tester en Google Play. Usa el mismo correo en tu cuenta de Google.',
            data: {
                id: doc._id,
                email: doc.email,
                position,
                status: doc.status,
            },
        });
    } catch (err) {
        console.error('waitlist/influencer POST:', err);
        return res.status(500).json({
            success: false,
            message: 'No se pudo registrar tu correo. Intenta de nuevo.',
        });
    }
});

/** GET /api/waitlist/influencer/stats — contador público (social proof ligero) */
router.get('/influencer/stats', async (req, res) => {
    try {
        if (!isMongoConnected()) {
            const n = memoryStore().filter((e) => e.status !== 'dismissed').length;
            return res.json({ success: true, data: { total: n } });
        }
        const total = await InfluencerWaitlistEntry.countDocuments({ status: { $ne: 'dismissed' } });
        return res.json({ success: true, data: { total } });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

const adminRouter = express.Router();
adminRouter.use(requireSuperAdmin);

/** GET /api/admin/waitlist/influencers — listado para invitar testers en Play Console */
adminRouter.get('/influencers', async (req, res) => {
    try {
        const status = req.query.status ? String(req.query.status).trim() : '';
        const q = status ? { status } : {};
        if (!isMongoConnected()) {
            return res.json({
                success: true,
                data: { docs: memoryStore(), total: memoryStore().length },
                mode: 'memory',
            });
        }
        const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit), 10) || 50));
        const docs = await InfluencerWaitlistEntry.find(q).sort({ createdAt: -1 }).limit(limit).lean();
        const total = await InfluencerWaitlistEntry.countDocuments(q);
        return res.json({ success: true, data: { docs, total } });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
module.exports.adminRouter = adminRouter;
