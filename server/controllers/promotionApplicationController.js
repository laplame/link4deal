const mongoose = require('mongoose');
const Promotion = require('../models/Promotion');
const PromotionApplication = require('../models/PromotionApplication');
const Influencer = require('../models/Influencer');

function parseApplicationPayload(req) {
    const raw = req.body && req.body.application;
    if (!raw || typeof raw !== 'string') {
        return null;
    }
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function portfolioFilesFromReq(req) {
    const files = req.files;
    if (!files || !Array.isArray(files) || files.length === 0) {
        return [];
    }
    return files.map((f) => ({
        originalName: f.originalname || '',
        storedName: f.filename || '',
        mimeType: f.mimetype || '',
        urlPath: `/uploads/application-portfolio/${f.filename}`
    }));
}

class PromotionApplicationController {
    async create(req, res) {
        try {
            const payload = parseApplicationPayload(req);
            if (!payload || !payload.promotionId) {
                return res.status(400).json({
                    success: false,
                    message: 'Campo "application" (JSON) con promotionId es requerido.'
                });
            }

            const promotionId = String(payload.promotionId).trim();
            if (!mongoose.Types.ObjectId.isValid(promotionId)) {
                return res.status(400).json({
                    success: false,
                    message: 'promotionId no es un identificador válido.'
                });
            }

            const promotion = await Promotion.findById(promotionId).select('_id title brand').lean();
            if (!promotion) {
                return res.status(404).json({
                    success: false,
                    message: 'Promoción no encontrada.'
                });
            }

            const portfolio = portfolioFilesFromReq(req);

            let influencerApplicant = null;
            const rawInfId = payload.influencerProfileId != null ? String(payload.influencerProfileId).trim() : '';
            if (rawInfId && mongoose.Types.ObjectId.isValid(rawInfId)) {
                const inf = await Influencer.findById(rawInfId).select('_id').lean();
                if (inf) influencerApplicant = rawInfId;
            }

            const doc = await PromotionApplication.create({
                promotion: promotionId,
                influencerApplicant,
                contentProposal: payload.contentProposal != null ? String(payload.contentProposal) : '',
                platforms: Array.isArray(payload.platforms) ? payload.platforms.map(String) : [],
                estimatedReach: Number(payload.estimatedReach) >= 0 ? Number(payload.estimatedReach) : 0,
                portfolio,
                pricing: {
                    type: ['fixed', 'commission', 'hybrid'].includes(payload.pricing?.type)
                        ? payload.pricing.type
                        : 'commission',
                    amount: payload.pricing?.amount != null ? Number(payload.pricing.amount) : 0,
                    currency: payload.pricing?.currency != null ? String(payload.pricing.currency) : 'MXN'
                },
                timeline: {
                    startDate: payload.timeline?.startDate != null ? String(payload.timeline.startDate) : '',
                    endDate: payload.timeline?.endDate != null ? String(payload.timeline.endDate) : '',
                    deliverables: Array.isArray(payload.timeline?.deliverables)
                        ? payload.timeline.deliverables.map(String)
                        : []
                },
                additionalNotes: payload.additionalNotes != null ? String(payload.additionalNotes) : '',
                status: 'pending'
            });

            return res.status(201).json({
                success: true,
                data: { id: String(doc._id), status: doc.status },
                message: 'Aplicación registrada.'
            });
        } catch (error) {
            console.error('create promotion application:', error);
            return res.status(500).json({
                success: false,
                message: 'No se pudo guardar la aplicación.',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    async listForBrand(req, res) {
        try {
            const statusFilter = req.query.status;
            const filter = {};
            if (statusFilter && typeof statusFilter === 'string' && statusFilter !== 'all') {
                if (['pending', 'approved', 'rejected', 'withdrawn'].includes(statusFilter)) {
                    filter.status = statusFilter;
                }
            }

            const items = await PromotionApplication.find(filter)
                .populate('promotion', 'title brand category currentPrice currency discountPercentage')
                .populate('influencerApplicant', 'name username avatar totalFollowers')
                .sort({ createdAt: -1 })
                .limit(500)
                .lean();

            const mapped = items.map((row) => ({
                id: String(row._id),
                status: row.status,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
                influencerApplicant: row.influencerApplicant
                    ? {
                        id: String(row.influencerApplicant._id),
                        name: row.influencerApplicant.name,
                        username: row.influencerApplicant.username,
                        avatar: row.influencerApplicant.avatar,
                        totalFollowers: row.influencerApplicant.totalFollowers
                    }
                    : null,
                platforms: row.platforms,
                estimatedReach: row.estimatedReach,
                portfolio: row.portfolio,
                pricing: row.pricing,
                timeline: row.timeline,
                additionalNotes: row.additionalNotes,
                contentProposal: row.contentProposal,
                promotion: row.promotion
                    ? {
                        id: String(row.promotion._id),
                        title: row.promotion.title,
                        brand: row.promotion.brand,
                        category: row.promotion.category,
                        currentPrice: row.promotion.currentPrice,
                        currency: row.promotion.currency,
                        discountPercentage: row.promotion.discountPercentage
                    }
                    : null
            }));

            return res.json({
                success: true,
                data: mapped,
                count: mapped.length
            });
        } catch (error) {
            console.error('listForBrand applications:', error);
            return res.status(500).json({
                success: false,
                message: 'No se pudieron cargar las aplicaciones.'
            });
        }
    }

    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ success: false, message: 'ID inválido.' });
            }

            const nextStatus = req.body && req.body.status;
            if (!['pending', 'approved', 'rejected', 'withdrawn'].includes(nextStatus)) {
                return res.status(400).json({
                    success: false,
                    message: 'status debe ser pending, approved, rejected o withdrawn.'
                });
            }

            const updated = await PromotionApplication.findByIdAndUpdate(
                id,
                { status: nextStatus },
                { new: true }
            ).select('_id status').lean();

            if (!updated) {
                return res.status(404).json({ success: false, message: 'Aplicación no encontrada.' });
            }

            return res.json({
                success: true,
                data: { id: String(updated._id), status: updated.status }
            });
        } catch (error) {
            console.error('updateStatus application:', error);
            return res.status(500).json({
                success: false,
                message: 'No se pudo actualizar el estado.'
            });
        }
    }
}

module.exports = new PromotionApplicationController();
