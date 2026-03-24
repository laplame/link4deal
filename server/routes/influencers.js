const express = require('express');
const router = express.Router();
const influencerController = require('../controllers/influencerController');
const { authenticateToken, optionalAuth } = require('../middleware/jwtAuth');
const { memoryUpload, handleUploadError } = require('../middleware/upload');

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

// Perfil del influencer logueado (debe ir antes de /:id)
router.get('/me', authenticateToken, (req, res) => influencerController.getMe(req, res));

// POST /api/influencers/:influencerId/contact - Enviar mensaje (opcional: con sesión para nombre/email)
router.post('/:influencerId/contact', optionalAuth, (req, res) => influencerController.contactInfluencer(req, res));

// GET /api/influencers/:id/bids - Pujas del influencer (datos reales; por ahora [])
router.get('/:id/bids', (req, res) => influencerController.getBids(req, res));

// GET /api/influencers/:id - Obtener un influencer por ID
router.get('/:id', (req, res) => influencerController.getInfluencerById(req, res));

module.exports = router;
