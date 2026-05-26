const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const influencerController = require('../controllers/influencerController');
const influencerAppController = require('../controllers/influencerAppController');
const influencerSettlementController = require('../controllers/influencerSettlementController');
const { authenticateToken, optionalAuth } = require('../middleware/jwtAuth');
const { memoryUpload, handleUploadError } = require('../middleware/upload');

const influencerAppLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    message: { ok: false, success: false, message: 'Demasiadas peticiones. Intenta en 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// GET /api/influencers - Listar influencers (paginado)
router.get('/', (req, res) => influencerController.getAllInfluencers(req, res));

// POST /api/influencers - Crear influencer (desde InfluencerSetup); si hay sesión se vincula userId
router.post('/', optionalAuth, (req, res) => influencerController.create(req, res));

// POST /api/influencers/avatar — Foto de perfil (Multer memoria → Cloudinary o disco). Debe ir antes de /:id
router.post(
    '/avatar',
    optionalAuth,
    (req, res, next) => {
        memoryUpload.single('avatar')(req, res, (err) => {
            if (err) return handleUploadError(err, res);
            next();
        });
    },
    (req, res) => influencerController.uploadAvatar(req, res)
);

// GET /api/influencers/by-slug/:slug - Obtener por slug (nombre normalizado, ej. damecodigo)
router.get('/by-slug/:slug', (req, res) => influencerController.getInfluencerBySlug(req, res));

// Bandeja de mensajes del influencer (debe ir antes de /:id)
router.get('/messages/inbox', authenticateToken, (req, res) => influencerController.getInbox(req, res));
router.patch('/messages/:messageId/read', authenticateToken, (req, res) => influencerController.markMessageRead(req, res));

// App móvil: identidad, wallet y campañas (antes de /:id)
router.post('/app/verify-session', influencerAppLimiter, authenticateToken, (req, res) =>
    influencerAppController.verifySession(req, res),
);
router.patch('/app/wallet', influencerAppLimiter, authenticateToken, (req, res) =>
    influencerAppController.linkWallet(req, res),
);
router.get('/app/campaigns', influencerAppLimiter, authenticateToken, (req, res) =>
    influencerAppController.listCampaigns(req, res),
);
router.post('/app/story-cards', influencerAppLimiter, authenticateToken, (req, res) =>
    influencerAppController.generateStoryCard(req, res),
);
router.get('/app/settlements/summary', influencerAppLimiter, authenticateToken, (req, res) =>
    influencerSettlementController.summary(req, res),
);
router.get('/app/settlements', influencerAppLimiter, authenticateToken, (req, res) =>
    influencerSettlementController.list(req, res),
);
router.post('/app/settlements/process-pending', influencerAppLimiter, authenticateToken, (req, res) =>
    influencerSettlementController.processPending(req, res),
);

// Evidencia para verificación (screenshot del perfil) — requiere sesión influencer
router.post(
    '/app/verification-screenshot',
    influencerAppLimiter,
    authenticateToken,
    (req, res, next) => {
        memoryUpload.single('image')(req, res, (err) => {
            if (err) return handleUploadError(err, res);
            next();
        });
    },
    (req, res) => influencerController.uploadVerificationScreenshot(req, res)
);

// Perfil del influencer logueado (debe ir antes de /:id)
router.get('/me', authenticateToken, (req, res) => influencerController.getMe(req, res));
router.patch('/me/ugc-profile', authenticateToken, (req, res) => influencerController.updateMeUgcProfile(req, res));

// POST /api/influencers/:influencerId/contact - Enviar mensaje (opcional: con sesión para nombre/email)
router.post('/:influencerId/contact', optionalAuth, (req, res) => influencerController.contactInfluencer(req, res));

// GET /api/influencers/:id/bids — Pujas reales + aplicaciones aprobadas vigentes + cupones QR (forma unificada para el perfil)
router.get('/:id/bids', (req, res) => influencerController.getBids(req, res));

// GET /api/influencers/:id/coupon-redemptions — solo redimidos (compatibilidad)
router.get('/:id/coupon-redemptions', (req, res) => influencerController.getCouponRedemptions(req, res));

// GET /api/influencers/:id/coupons-activity — abiertos, redimidos y caducados (perfil público)
router.get('/:id/coupons-activity', (req, res) => influencerController.getCouponsActivity(req, res));

// GET /api/influencers/:id/qr-promotions-summary — cupones agrupados por promoción + campañas con puja vigente sin cupones
router.get('/:id/qr-promotions-summary', (req, res) => influencerController.getQrPromotionsSummary(req, res));

// GET /api/influencers/:id/promo-short-codes — códigos alfanuméricos cortos (app) por influencer
router.get('/:id/promo-short-codes', (req, res) => influencerController.getPromoShortCodes(req, res));

// GET /api/influencers/:id - Obtener un influencer por ID
router.get('/:id', (req, res) => influencerController.getInfluencerById(req, res));

module.exports = router;
