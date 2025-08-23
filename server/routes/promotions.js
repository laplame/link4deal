const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');
const { memoryUpload } = require('../middleware/upload');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting para creación de promociones
const createPromotionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // máximo 10 promociones por IP
    message: {
        success: false,
        message: 'Demasiadas promociones creadas. Intenta de nuevo en 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiting para búsquedas
const searchLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 30, // máximo 30 búsquedas por IP
    message: {
        success: false,
        message: 'Demasiadas búsquedas. Intenta de nuevo en 1 minuto.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// ===== RUTAS PÚBLICAS =====

// GET /api/promotions - Obtener todas las promociones (con paginación y filtros)
router.get('/', searchLimiter, promotionController.getAllPromotions);

// GET /api/promotions/hot - Obtener ofertas calientes
router.get('/hot', promotionController.getHotOffers);

// GET /api/promotions/category/:category - Obtener promociones por categoría
router.get('/category/:category', promotionController.getPromotionsByCategory);

// GET /api/promotions/search - Buscar promociones
router.get('/search', searchLimiter, promotionController.searchPromotions);

// GET /api/promotions/stats/overview - Obtener estadísticas generales
router.get('/stats/overview', promotionController.getPromotionStats);

// GET /api/promotions/status - Verificar salud del servicio
router.get('/status', async (req, res) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'promotions-api',
            version: '1.0.0',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            database: 'simulated', // Modo simulado por ahora
            cloudinary: 'configured', // Esto se puede verificar con la configuración real
            ocr: 'available' // Esto se puede verificar con el servicio OCR
        };

        res.json({
            success: true,
            data: health,
            message: 'Servicio de promociones funcionando correctamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error en el servicio de promociones',
            error: error.message
        });
    }
});

// GET /api/promotions/:id - Obtener promoción por ID (DEBE IR AL FINAL)
router.get('/:id', promotionController.getPromotionById);

// ===== RUTAS PROTEGIDAS =====

// POST /api/promotions - Crear nueva promoción
router.post('/', 
    createPromotionLimiter,
    memoryUpload.array('images', 5), // máximo 5 imágenes
    promotionController.createPromotion
);

// PUT /api/promotions/:id - Actualizar promoción
router.put('/:id', 
    memoryUpload.array('images', 5),
    promotionController.updatePromotion
);

// DELETE /api/promotions/:id - Eliminar promoción
router.delete('/:id', 
    promotionController.deletePromotion
);

// ===== RUTAS DE ADMINISTRACIÓN =====

// GET /api/promotions/admin/all - Obtener todas las promociones (admin)
router.get('/admin/all', 
    promotionController.getAllPromotions
);

// GET /api/promotions/admin/stats - Obtener estadísticas detalladas (admin)
router.get('/admin/stats', 
    promotionController.getPromotionStats
);

// ===== RUTAS DE WEBHOOKS =====

// POST /api/promotions/webhook/cloudinary - Webhook de Cloudinary
router.post('/webhook/cloudinary', (req, res) => {
    try {
        console.log('📡 Webhook recibido de Cloudinary:', req.body);
        
        // Aquí puedes procesar notificaciones de Cloudinary
        // como confirmaciones de upload, transformaciones, etc.
        
        res.status(200).json({ success: true, message: 'Webhook procesado' });
    } catch (error) {
        console.error('❌ Error procesando webhook:', error);
        res.status(500).json({ success: false, message: 'Error procesando webhook' });
    }
});

// ===== RUTAS DE SALUD =====
// La ruta de status ya está definida arriba para evitar conflictos con /:id

// ===== MANEJO DE ERRORES =====

// Middleware para manejar rutas no encontradas
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
        path: req.originalUrl,
        method: req.method
    });
});

// Middleware para manejar errores
router.use((error, req, res, next) => {
    console.error('❌ Error en ruta de promociones:', error);
    
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
});

module.exports = router;
