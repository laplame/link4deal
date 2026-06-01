'use strict';

const InstagramConnection = require('../models/InstagramConnection');
const {
    webhookVerifyToken,
    exchangeCodeForToken,
    graphGet,
    integrationStatusPayload,
    isMetaConfigured,
} = require('../utils/instagramMeta');
const { ingestWebhookPayload } = require('../utils/instagramLeads');

class InstagramController {
    /** GET /api/instagram/status — estado de integración (sin secretos). */
    async status(req, res) {
        try {
            const conn = await InstagramConnection.findOne({ influencer: null })
                .select('status igUsername instagramBusinessAccountId lastSyncAt webhookSubscribed')
                .lean();
            return res.json({
                success: true,
                integration: integrationStatusPayload(),
                connection: conn
                    ? {
                          status: conn.status,
                          igUsername: conn.igUsername || '',
                          instagramBusinessAccountId: conn.instagramBusinessAccountId || null,
                          lastSyncAt: conn.lastSyncAt || null,
                          webhookSubscribed: Boolean(conn.webhookSubscribed),
                      }
                    : null,
            });
        } catch (error) {
            console.error('❌ Instagram status:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /** GET /api/instagram/webhook — verificación Meta (hub.challenge). */
    verifyWebhook(req, res) {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        if (mode === 'subscribe' && token === webhookVerifyToken()) {
            return res.status(200).send(challenge);
        }
        return res.status(403).send('Forbidden');
    }

    /** POST /api/instagram/webhook — eventos Instagram / Messenger. */
    async receiveWebhook(req, res) {
        try {
            const body = req.body || {};
            const results = await ingestWebhookPayload(body);
            return res.json({ success: true, processed: results.length, results });
        } catch (error) {
            console.error('❌ Instagram webhook:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/instagram/oauth/callback?code=&state=
     * Intercambia código y guarda conexión de plataforma.
     */
    async oauthCallback(req, res) {
        const frontend = String(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
        const redirectBase = `${frontend}/admin/crm/instagram-leads`;

        try {
            const code = String(req.query.code || '').trim();
            const err = req.query.error_description || req.query.error;
            if (err) {
                return res.redirect(`${redirectBase}?oauth=error&message=${encodeURIComponent(String(err))}`);
            }
            if (!code) {
                return res.redirect(`${redirectBase}?oauth=error&message=${encodeURIComponent('Sin código OAuth')}`);
            }

            const exchanged = await exchangeCodeForToken(code);
            if (!exchanged.ok) {
                const msg = exchanged.message || 'OAuth falló';
                return res.redirect(`${redirectBase}?oauth=error&message=${encodeURIComponent(msg)}`);
            }

            const expiresAt =
                exchanged.expiresIn != null
                    ? new Date(Date.now() + Number(exchanged.expiresIn) * 1000)
                    : null;

            let igUsername = '';
            let igBusinessId = null;
            let pageId = null;

            if (exchanged.accessToken) {
                const pages = await graphGet('/me/accounts', exchanged.accessToken, {
                    fields: 'id,name,instagram_business_account',
                });
                const pageList = pages.ok && Array.isArray(pages.data?.data) ? pages.data.data : [];
                const withIg = pageList.find((p) => p.instagram_business_account?.id);
                if (withIg) {
                    pageId = withIg.id;
                    igBusinessId = withIg.instagram_business_account.id;
                    const igProfile = await graphGet(`/${igBusinessId}`, exchanged.accessToken, {
                        fields: 'username,name',
                    });
                    if (igProfile.ok && igProfile.data) {
                        igUsername = igProfile.data.username || '';
                    }
                }
            }

            await InstagramConnection.findOneAndUpdate(
                { influencer: null },
                {
                    $set: {
                        status: exchanged.mode === 'stub' ? 'pending' : 'connected',
                        accessToken: exchanged.accessToken || null,
                        tokenExpiresAt: expiresAt,
                        facebookPageId: pageId,
                        instagramBusinessAccountId: igBusinessId,
                        igUsername,
                        lastError: exchanged.mode === 'stub' ? 'Credenciales Meta pendientes' : '',
                    },
                },
                { upsert: true, new: true },
            );

            return res.redirect(`${redirectBase}?oauth=success`);
        } catch (error) {
            console.error('❌ Instagram OAuth callback:', error);
            return res.redirect(
                `${redirectBase}?oauth=error&message=${encodeURIComponent(error.message || 'Error OAuth')}`,
            );
        }
    }
}

module.exports = new InstagramController();
