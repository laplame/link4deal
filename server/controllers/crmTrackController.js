'use strict';

const Influencer = require('../models/Influencer');
const {
    normalizeAppKey,
    recordInfluencerCrmEvent,
    APP_KEYS,
} = require('../utils/influencerCrm');

class CrmTrackController {
    /**
     * POST /api/crm/track
     * Registra instalación, apertura o aceptación de términos (apps móviles / web).
     * Body: appKey, eventType, deviceId?, platform?, appVersion?, influencerId?, termsVersion?, termsSummary?
     * Auth opcional: si hay JWT, se vincula userId e influencer.
     */
    async track(req, res) {
        try {
            const body = req.body || {};
            const appKey = normalizeAppKey(body.appKey || body.app);
            if (!appKey) {
                return res.status(400).json({
                    success: false,
                    message: 'appKey requerido: damecodigo_influencer | bizneai_merchant',
                });
            }

            const eventType = String(body.eventType || 'open').toLowerCase();
            const allowed = ['install', 'open', 'terms_accepted', 'profile_submitted'];
            if (!allowed.includes(eventType)) {
                return res.status(400).json({
                    success: false,
                    message: `eventType inválido. Usa: ${allowed.join(', ')}`,
                });
            }

            let influencerId = body.influencerId ? String(body.influencerId).trim() : null;
            let userId = req.user?._id ? String(req.user._id) : null;

            if (!influencerId && userId) {
                const inf = await Influencer.findOne({ userId }).select('_id').lean();
                if (inf) influencerId = String(inf._id);
            }

            const result = await recordInfluencerCrmEvent({
                influencerId,
                userId,
                appKey,
                eventType,
                platform: body.platform || body.os,
                appVersion: body.appVersion || body.version,
                deviceId: body.deviceId,
                termsVersion: body.termsVersion,
                termsSummary: body.termsSummary || body.termsText,
                metadata: body.metadata,
                req,
            });

            const apps = result.influencer?.crm?.apps;
            const field =
                appKey === APP_KEYS.BIZNEAI_MERCHANT ? 'bizneaiMerchant' : 'damecodigoInfluencer';

            return res.json({
                success: true,
                recorded: true,
                eventId: result.event?._id ? String(result.event._id) : null,
                influencerId: result.influencer?._id ? String(result.influencer._id) : influencerId,
                appKey,
                eventType,
                installCount: apps?.[field]?.installCount ?? 0,
            });
        } catch (error) {
            console.error('❌ CRM track:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new CrmTrackController();
