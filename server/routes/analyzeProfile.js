const express = require('express');
const router = express.Router();
const { memoryUpload } = require('../middleware/upload');
const { analyzeProfileImage } = require('../services/geminiProfileAnalyzer');

/**
 * POST /api/analyze-profile-image
 * Body: multipart/form-data con campo "image" (archivo) y "type" (brand | influencer)
 * Devuelve datos extraídos por Gemini para pre-llenar formularios de alta.
 */
router.post('/',
    memoryUpload.single('image'),
    async (req, res) => {
        try {
            const type = (req.body?.type || req.query?.type || '').toLowerCase();
            if (type !== 'brand' && type !== 'influencer') {
                return res.status(400).json({
                    success: false,
                    message: 'Query o body "type" debe ser "brand" o "influencer"'
                });
            }
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere un archivo en el campo "image"'
                });
            }
            const result = await analyzeProfileImage(req.file, type);
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.message || 'Error al analizar'
                });
            }
            return res.json({
                success: true,
                data: result.data,
                message: 'Análisis completado'
            });
        } catch (err) {
            console.error('Error en analyze-profile-image:', err);
            res.status(500).json({
                success: false,
                message: err.message || 'Error al analizar la imagen'
            });
        }
    }
);

module.exports = router;
