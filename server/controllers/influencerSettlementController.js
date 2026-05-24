'use strict';

const Influencer = require('../models/Influencer');
const {
    getSettlementSummaryForInfluencer,
    listSettlementsForInfluencer,
    processPendingSettlementsForInfluencer,
    isSettlementEnabled,
} = require('../utils/influencerTokenSettlement');

class InfluencerSettlementController {
    async requireInfluencer(user) {
        const influencer = await Influencer.findOne({ userId: user._id }).select('_id').lean();
        if (!influencer) {
            const e = new Error('No tienes perfil de influencer vinculado');
            e.status = 404;
            e.code = 'INFLUENCER_NOT_LINKED';
            throw e;
        }
        return influencer;
    }

    /**
     * GET /api/influencers/app/settlements/summary
     */
    async summary(req, res) {
        try {
            if (!isSettlementEnabled()) {
                return res.json({
                    ok: true,
                    success: true,
                    enabled: false,
                    data: null,
                    message: 'Settlement deshabilitado en servidor',
                });
            }
            const influencer = await this.requireInfluencer(req.user);
            const data = await getSettlementSummaryForInfluencer(influencer._id);
            return res.json({
                ok: true,
                success: true,
                enabled: true,
                data: {
                    ...data,
                    tokenSymbol: process.env.INFLUENCER_SETTLEMENT_TOKEN_SYMBOL || 'LUXAE',
                    transferMethod: 'mongo_ledger',
                },
                message: 'Resumen de abonos por campaña',
            });
        } catch (err) {
            const status = err.status || 500;
            return res.status(status).json({
                ok: false,
                success: false,
                message: err.message,
                code: err.code,
            });
        }
    }

    /**
     * GET /api/influencers/app/settlements
     * Query: page, limit, status, promotionId
     */
    async list(req, res) {
        try {
            if (!isSettlementEnabled()) {
                return res.json({ ok: true, success: true, enabled: false, data: { docs: [], total: 0 } });
            }
            const influencer = await this.requireInfluencer(req.user);
            const data = await listSettlementsForInfluencer(influencer._id, req.query);
            return res.json({
                ok: true,
                success: true,
                enabled: true,
                data,
                message: 'Listado de abonos',
            });
        } catch (err) {
            const status = err.status || 500;
            return res.status(status).json({
                ok: false,
                success: false,
                message: err.message,
                code: err.code,
            });
        }
    }

    /**
     * POST /api/influencers/app/settlements/process-pending
     * Marca como paid los pending del influencer (ledger Mongo) si hay wallet.
     */
    async processPending(req, res) {
        try {
            if (!isSettlementEnabled()) {
                return res.status(503).json({
                    ok: false,
                    success: false,
                    message: 'Settlement deshabilitado',
                });
            }
            const influencer = await this.requireInfluencer(req.user);
            const result = await processPendingSettlementsForInfluencer(influencer._id, {
                user: req.user,
                processedBy: `user:${req.user._id}`,
                limit: req.body?.limit,
            });
            const summary = await getSettlementSummaryForInfluencer(influencer._id);
            return res.json({
                ok: true,
                success: true,
                data: { ...result, summary },
                message:
                    result.processed > 0
                        ? `${result.processed} abono(s) registrados en ledger Mongo`
                        : 'No hay abonos pendientes con wallet configurada',
            });
        } catch (err) {
            const status = err.status || 500;
            return res.status(status).json({
                ok: false,
                success: false,
                message: err.message,
                code: err.code,
            });
        }
    }
}

module.exports = new InfluencerSettlementController();
