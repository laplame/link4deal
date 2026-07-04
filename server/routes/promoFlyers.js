'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { memoryUpload, handleUploadError } = require('../middleware/upload');
const { generatePromoFlyerWithNanoBanana } = require('../services/geminiPromoFlyerGenerator');

const flyerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { success: false, message: 'Demasiadas generaciones. Intenta en 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * POST /api/promo-flyers/generate
 * multipart/form-data:
 *  - image (opcional): foto del producto (se usa como héroe del flyer)
 *  - productName, originalPrice, finalPrice, currency, discountPercentage,
 *    cashbackText, platform, headline, extraNotes
 * Genera un flyer vertical 9:16 (fondo para video móvil) con IA.
 * Revisa ortografía y gramática (es-MX) antes de generar copy e imagen.
 */
router.post(
    '/generate',
    flyerLimiter,
    (req, res, next) => {
        memoryUpload.single('image')(req, res, (err) => {
            if (err) return handleUploadError(err, res);
            next();
        });
    },
    async (req, res) => {
        try {
            const b = req.body || {};
            const productName = String(b.productName || b.title || '').trim();
            if (!productName) {
                return res.status(400).json({
                    success: false,
                    message: 'Indica al menos el nombre del producto',
                });
            }

            const details = {
                productName,
                currency: b.currency,
                originalPrice: b.originalPrice,
                finalPrice: b.finalPrice ?? b.currentPrice,
                discountPercentage: b.discountPercentage ?? b.discountPercent,
                cashbackText: b.cashbackText ?? b.cashback,
                platform: b.platform,
                headline: b.headline,
                extraNotes: b.extraNotes ?? b.notes,
            };

            const productImage = req.file
                ? { buffer: req.file.buffer, mimetype: req.file.mimetype }
                : undefined;

            const result = await generatePromoFlyerWithNanoBanana({ details, productImage });

            return res.json({
                success: true,
                format: 'vertical_phone',
                aspectRatio: '9:16',
                ...result,
            });
        } catch (err) {
            console.error('Error en promo-flyers/generate:', err);
            return res.status(500).json({
                success: false,
                message: err.message || 'Error al generar el flyer',
            });
        }
    },
);

module.exports = router;
