'use strict';

const {
    parseInfluencerPath,
    resolveInfluencerBySlug,
    resolveInfluencerById,
    recordTrafficVisit,
    userCanViewTrafficStats,
    getTrafficStats,
    getPublicDemandStats,
    isValidObjectId,
} = require('../utils/influencerTraffic');
const { isExcludedAnalyticsTraffic } = require('../utils/isExcludedAnalyticsHost');

class InfluencerTrafficController {
    /** POST /api/influencers/traffic/visit */
    async recordVisit(req, res) {
        try {
            const body = req.body || {};
            const requestHost = req.get('x-forwarded-host') || req.get('host') || '';
            if (
                isExcludedAnalyticsTraffic({
                    pageLocation: body.pageLocation,
                    referrer: body.referrer ?? req.get('referer'),
                    requestHost,
                })
            ) {
                return res.status(204).end();
            }
            let influencerId = body.influencerId != null ? String(body.influencerId).trim() : '';
            let influencerSlug = body.influencerSlug != null ? String(body.influencerSlug).trim() : '';
            let entryPath = body.entryPath != null ? String(body.entryPath).trim() : '';
            let entryType = body.entryType != null ? String(body.entryType).trim() : 'profile';

            const pagePath = body.pagePath != null ? String(body.pagePath).trim() : '/';
            const parsed = parseInfluencerPath(pagePath);
            if (parsed) {
                if (!influencerSlug) influencerSlug = parsed.slug;
                if (!entryPath) entryPath = parsed.entryPath;
                if (!body.entryType) entryType = parsed.entryType;
            }

            if (!influencerId && !influencerSlug && body.ref && isValidObjectId(body.ref)) {
                influencerId = String(body.ref).trim();
            }
            if (!influencerSlug && body.infl) {
                influencerSlug = String(body.infl).trim();
            }

            const result = await recordTrafficVisit({
                influencerId,
                influencerSlug,
                sessionId: body.sessionId,
                visitorId: body.visitorId,
                isEntry: Boolean(body.isEntry),
                entryType,
                entryPath: entryPath || pagePath,
                pagePath,
                pageTitle: body.pageTitle,
                pageLocation: body.pageLocation,
                referrer: body.referrer ?? req.get('referer'),
                utmSource: body.utmSource ?? body.utm_source,
                utmMedium: body.utmMedium ?? body.utm_medium,
                utmCampaign: body.utmCampaign ?? body.utm_campaign,
                utmTerm: body.utmTerm ?? body.utm_term,
                utmContent: body.utmContent ?? body.utm_content,
                inAppBrowser: body.inAppBrowser,
                userAgent: body.userAgent ?? req.get('user-agent'),
            });

            if (!result.ok) {
                return res.status(result.status || 400).json({ success: false, message: result.message });
            }
            if (result.skipped) {
                return res.status(204).end();
            }
            return res.status(201).json({ success: true, data: result.data });
        } catch (error) {
            console.error('❌ recordTrafficVisit:', error);
            return res.status(500).json({ success: false, message: 'Error registrando visita' });
        }
    }

    /** GET /api/influencers/:id/traffic-stats?days=30 */
    async getStats(req, res) {
        try {
            const influencerId = String(req.params.id || '').trim();
            if (!isValidObjectId(influencerId)) {
                return res.status(400).json({ success: false, message: 'ID inválido' });
            }

            const allowed = await userCanViewTrafficStats(req.user, influencerId);
            if (!allowed) {
                return res.status(403).json({
                    success: false,
                    message: 'Solo el influencer dueño del perfil o super admin pueden ver estas métricas',
                });
            }

            const inf = await resolveInfluencerById(influencerId);
            if (!inf) {
                return res.status(404).json({ success: false, message: 'Influencer no encontrado' });
            }

            const days = Number(req.query.days) || 30;
            const stats = await getTrafficStats(influencerId, { days });
            return res.json({
                success: true,
                data: {
                    ...stats,
                    influencerId: inf.id,
                    influencerSlug: inf.slug,
                    publicProfileUrl: `/influencer/${inf.slug}`,
                },
            });
        } catch (error) {
            console.error('❌ getTrafficStats:', error);
            return res.status(500).json({ success: false, message: 'Error obteniendo estadísticas' });
        }
    }

    /** GET /api/influencers/by-slug/:slug/demand-stats?days=30 — público, demanda agregada */
    async getPublicDemandBySlug(req, res) {
        try {
            const inf = await resolveInfluencerBySlug(req.params.slug);
            if (!inf) {
                return res.status(404).json({ success: false, message: 'Influencer no encontrado' });
            }
            const days = Number(req.query.days) || 30;
            const stats = await getPublicDemandStats(inf.id, { days });
            return res.json({
                success: true,
                data: {
                    ...stats,
                    influencerId: inf.id,
                    influencerSlug: inf.slug,
                    publicProfilePath: `/influencer/${inf.slug}`,
                },
            });
        } catch (error) {
            console.error('❌ getPublicDemandBySlug:', error);
            return res.status(500).json({ success: false, message: 'Error obteniendo demanda' });
        }
    }

    /** GET /api/influencers/traffic/resolve-slug/:slug — público, para validar enlace */
    async resolveSlug(req, res) {
        try {
            const inf = await resolveInfluencerBySlug(req.params.slug);
            if (!inf) {
                return res.status(404).json({ success: false, message: 'Slug no encontrado' });
            }
            return res.json({ success: true, data: inf });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new InfluencerTrafficController();
