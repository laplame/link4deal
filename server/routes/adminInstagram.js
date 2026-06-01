'use strict';

const express = require('express');
const mongoose = require('mongoose');
const { requireSuperAdmin } = require('../middleware/requireSuperAdmin');
const InstagramLead = require('../models/InstagramLead');
const InstagramConnection = require('../models/InstagramConnection');
const {
    integrationStatusPayload,
    buildOAuthUrl,
    isMetaConfigured,
    graphGet,
} = require('../utils/instagramMeta');
const {
    listLeads,
    leadStats,
    upsertLead,
    serializeLead,
    resolveInfluencerByInstagramUsername,
} = require('../utils/instagramLeads');

const router = express.Router();
router.use(requireSuperAdmin);

// GET /api/admin/instagram/integration
router.get('/integration', async (req, res) => {
    try {
        const conn = await InstagramConnection.findOne({ influencer: null })
            .select('-accessToken')
            .lean();
        return res.json({
            success: true,
            integration: integrationStatusPayload(),
            connection: conn,
            oauthUrl: buildOAuthUrl('admin_crm'),
        });
    } catch (error) {
        console.error('❌ admin instagram integration:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/admin/instagram/leads/stats
router.get('/leads/stats', async (req, res) => {
    try {
        const stats = await leadStats();
        return res.json({ success: true, data: stats });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/admin/instagram/leads
router.get('/leads', async (req, res) => {
    try {
        const data = await listLeads(req.query);
        return res.json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/admin/instagram/leads — alta manual / prueba
router.post('/leads', async (req, res) => {
    try {
        const body = req.body || {};
        const username = String(body.instagramUsername || body.username || '').trim();
        if (!username && !body.message) {
            return res.status(400).json({ success: false, message: 'instagramUsername o message requerido' });
        }
        let influencerId = body.influencerId || null;
        if (!influencerId && username) {
            const inf = await resolveInfluencerByInstagramUsername(username);
            if (inf) influencerId = inf._id;
        }
        const result = await upsertLead({
            externalId: body.externalId || `manual_${Date.now()}`,
            source: 'manual',
            eventType: body.eventType || 'other',
            instagramUsername: username,
            instagramUserId: body.instagramUserId || null,
            displayName: body.displayName || '',
            message: body.message || '',
            influencerId,
            promotionId: body.promotionId || null,
            pipelineStage: body.pipelineStage || 'new',
            adminNotes: body.adminNotes || '',
        });
        return res.status(result.created ? 201 : 200).json({ success: true, data: result.lead, created: result.created });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// PATCH /api/admin/instagram/leads/:id
router.patch('/leads/:id', async (req, res) => {
    try {
        const id = String(req.params.id || '');
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }
        const body = req.body || {};
        const update = {};
        if (body.pipelineStage) update.pipelineStage = body.pipelineStage;
        if (body.status) update.status = body.status;
        if (body.adminNotes != null) update.adminNotes = String(body.adminNotes);
        if (body.message != null) update.message = String(body.message);
        if (body.influencerId !== undefined) {
            update.influencer =
                body.influencerId && mongoose.Types.ObjectId.isValid(String(body.influencerId))
                    ? body.influencerId
                    : null;
        }
        update.lastActivityAt = new Date();

        const doc = await InstagramLead.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
        if (!doc) return res.status(404).json({ success: false, message: 'Lead no encontrado' });
        return res.json({ success: true, data: serializeLead(doc) });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/admin/instagram/sync — pull comentarios recientes vía Graph API (o demo en stub)
router.post('/sync', async (req, res) => {
    try {
        const conn = await InstagramConnection.findOne({ influencer: null }).select('+accessToken').lean();
        const synced = [];

        if (conn?.accessToken && conn.instagramBusinessAccountId && isMetaConfigured()) {
            const igId = conn.instagramBusinessAccountId;
            const mediaRes = await graphGet(`/${igId}/media`, conn.accessToken, {
                fields: 'id,caption,media_type,permalink,timestamp',
                limit: '15',
            });
            const mediaList = mediaRes.ok && Array.isArray(mediaRes.data?.data) ? mediaRes.data.data : [];
            for (const media of mediaList) {
                const commentsRes = await graphGet(`/${media.id}/comments`, conn.accessToken, {
                    fields: 'id,text,username,timestamp,from',
                    limit: '25',
                });
                const comments =
                    commentsRes.ok && Array.isArray(commentsRes.data?.data) ? commentsRes.data.data : [];
                for (const c of comments) {
                    const from = c.from || {};
                    const r = await upsertLead({
                        externalId: c.id,
                        source: 'sync',
                        eventType: 'comment',
                        instagramUserId: from.id != null ? String(from.id) : null,
                        instagramUsername: c.username || from.username || '',
                        message: c.text || '',
                        mediaId: media.id,
                        mediaType: media.media_type || '',
                        permalink: media.permalink || '',
                        receivedAt: c.timestamp ? new Date(c.timestamp) : new Date(),
                        rawPayload: { media, comment: c },
                    });
                    synced.push(r.lead);
                }
            }
            await InstagramConnection.updateOne({ _id: conn._id }, { $set: { lastSyncAt: new Date(), lastError: '' } });
            return res.json({ success: true, mode: 'api', count: synced.length, data: synced });
        }

        if (process.env.NODE_ENV === 'production' && isMetaConfigured()) {
            return res.status(400).json({
                success: false,
                message: 'Sin conexión Instagram. Completa OAuth o configura META_APP_ID.',
            });
        }

        const demos = [
            {
                externalId: `demo_comment_${Date.now()}`,
                eventType: 'comment',
                instagramUsername: 'lead_demo_01',
                message: '¿Tienen cupón para esta promo?',
            },
            {
                externalId: `demo_dm_${Date.now() + 1}`,
                eventType: 'dm',
                instagramUsername: 'lead_demo_02',
                message: 'Hola, quiero el código de descuento',
            },
        ];
        for (const d of demos) {
            const r = await upsertLead({ ...d, source: 'sync' });
            synced.push(r.lead);
        }
        return res.json({
            success: true,
            mode: 'stub',
            message: 'Credenciales Meta no listas — leads de demostración creados',
            count: synced.length,
            data: synced,
        });
    } catch (error) {
        console.error('❌ Instagram sync:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
