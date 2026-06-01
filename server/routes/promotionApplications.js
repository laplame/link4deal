const express = require('express');
const router = express.Router();
const controller = require('../controllers/promotionApplicationController');
const { verifyBrandDashboardPassword } = require('../middleware/brandDashboardAuth');
const { applicationPortfolioUpload, handleUploadError } = require('../middleware/upload');
const { optionalAuth } = require('../middleware/jwtAuth');

/**
 * POST /api/promotion-applications — Crear aplicación (público; multipart).
 * `optionalAuth`: si llega un JWT válido, vincula automáticamente el perfil
 * de influencer del usuario aunque no se haya pegado el ID manualmente.
 */
router.post('/', optionalAuth, (req, res) => {
    applicationPortfolioUpload(req, res, (err) => {
        if (err) {
            return handleUploadError(err, res);
        }
        return controller.create(req, res);
    });
});

/** GET /api/promotion-applications/brand — Listado para marcas (contraseña maestra) */
router.get(
    '/brand',
    verifyBrandDashboardPassword,
    (req, res) => controller.listForBrand(req, res)
);

/** PATCH /api/promotion-applications/:id/status — Aprobar / rechazar / etc. */
router.patch(
    '/:id/status',
    verifyBrandDashboardPassword,
    (req, res) => controller.updateStatus(req, res)
);

module.exports = router;
