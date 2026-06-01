'use strict';

const express = require('express');
const mongoose = require('mongoose');
const { requireSuperAdmin } = require('../middleware/requireSuperAdmin');
const InfluencerOutboundClick = require('../models/InfluencerOutboundClick');

const router = express.Router();
router.use(requireSuperAdmin);

function safeNum(n, fallback = 0) {
    const x = Number(n);
    return Number.isFinite(x) ? x : fallback;
}

// GET /api/admin/outbound/clicks?influencerId=&promotionId=&from=&to=&converted=
router.get('/clicks', async (req, res) => {
    try {
        const influencerId = String(req.query.influencerId || '').trim();
        const promotionId = String(req.query.promotionId || '').trim();
        const converted = req.query.converted != null ? String(req.query.converted).toLowerCase() : '';
        const from = req.query.from ? new Date(String(req.query.from)) : null;
        const to = req.query.to ? new Date(String(req.query.to)) : null;
        const limit = Math.min(500, Math.max(1, parseInt(String(req.query.limit || '200'), 10) || 200));

        /** @type {Record<string, any>} */
        const filter = {};
        if (mongoose.Types.ObjectId.isValid(influencerId)) filter.influencer = influencerId;
        if (mongoose.Types.ObjectId.isValid(promotionId)) filter.promotion = promotionId;
        if (from && !Number.isNaN(from.getTime())) filter.createdAt = { ...(filter.createdAt || {}), $gte: from };
        if (to && !Number.isNaN(to.getTime())) filter.createdAt = { ...(filter.createdAt || {}), $lte: to };
        if (converted === 'true') filter.convertedAt = { $ne: null };
        if (converted === 'false') filter.convertedAt = null;

        const docs = await InfluencerOutboundClick.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
        return res.json({
            success: true,
            data: docs.map((d) => ({
                clickId: d.clickId,
                influencerId: String(d.influencer),
                promotionId: String(d.promotion),
                catalogProductId: d.catalogProductId || null,
                targetUrl: d.targetUrl,
                page: d.page,
                createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : null,
                convertedAt: d.convertedAt ? new Date(d.convertedAt).toISOString() : null,
                conversionAmountUsd: d.conversionAmountUsd ?? null,
                settlementId: d.settlementId ?? null,
            })),
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error al listar clicks', error: error.message });
    }
});

// POST /api/admin/outbound/clicks/:clickId/convert  body: { amountUsd? }
// Nota: NO asigna tokens automáticamente. Solo marca conversión validada manualmente.
router.post('/clicks/:clickId/convert', async (req, res) => {
    try {
        const clickId = String(req.params.clickId || '').trim();
        if (!clickId) return res.status(400).json({ success: false, message: 'clickId requerido' });

        const click = await InfluencerOutboundClick.findOne({ clickId }).lean();
        if (!click) return res.status(404).json({ success: false, message: 'Click no encontrado' });

        const override =
            req.body && req.body.amountUsd != null ? Math.round(safeNum(req.body.amountUsd, 0) * 100) / 100 : null;

        await InfluencerOutboundClick.updateOne(
            { clickId },
            {
                $set: {
                    convertedAt: new Date(),
                    convertedBy: req.user?.email || req.user?.id || 'admin',
                    conversionAmountUsd: override != null && override > 0 ? override : null,
                },
            },
        );

        return res.json({
            success: true,
            converted: true,
            clickId,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error al convertir click', error: error.message });
    }
});

module.exports = router;

