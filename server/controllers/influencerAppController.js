'use strict';

const Influencer = require('../models/Influencer');
const InfluencerPromoShortCode = require('../models/InfluencerPromoShortCode');
const {
    buildInfluencerAppSession,
    normalizeWalletAddress,
    persistWalletForUser,
    listActiveCampaignsForInfluencer,
} = require('../utils/influencerAppSession');
const {
    generateStoryCardWithNanoBanana,
    STORY_WIDTH,
    STORY_HEIGHT,
    buildStoryCardPrompt,
} = require('../services/geminiStoryCardGenerator');
const { computeDiscountPctFromPromotion } = require('../utils/influencerPromoShortCodes');
const { resolveStoryCardContext } = require('../utils/resolveStoryCardContext');
const { recordInfluencerCrmEvent, APP_KEYS } = require('../utils/influencerCrm');

class InfluencerAppController {
    /**
     * POST /api/influencers/app/verify-session
     * Valida JWT + perfil influencer; opcionalmente sincroniza wallet de la app; devuelve campañas con código corto.
     */
    async verifySession(req, res) {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({ ok: false, message: 'Token de acceso requerido' });
            }

            const walletRaw = req.body?.walletAddress ?? req.body?.wallet;
            const preferredNetwork = req.body?.preferredNetwork || req.body?.blockchain || null;
            if (walletRaw != null && String(walletRaw).trim() !== '' && !normalizeWalletAddress(walletRaw)) {
                return res.status(400).json({
                    ok: false,
                    message: 'walletAddress inválida',
                    code: 'INVALID_WALLET',
                });
            }

            const session = await buildInfluencerAppSession(user, {
                walletAddress: walletRaw,
                preferredNetwork: preferredNetwork ? String(preferredNetwork).trim() : undefined,
                syncWalletFromApp: req.body?.syncWallet !== false,
            });

            const isInstall =
                req.body?.eventType === 'install' ||
                req.body?.isFirstLaunch === true ||
                req.body?.firstInstall === true;
            recordInfluencerCrmEvent({
                influencerId: session?.influencerId,
                userId: user._id,
                appKey: APP_KEYS.DAMECODIGO_INFLUENCER,
                eventType: isInstall ? 'install' : 'open',
                platform: req.body?.platform || req.body?.os,
                appVersion: req.body?.appVersion || req.body?.version,
                deviceId: req.body?.deviceId,
                termsVersion: req.body?.termsVersion,
                termsSummary: req.body?.termsSummary,
                req,
            }).catch((e) => console.warn('CRM track verify-session:', e.message));

            if (
                req.body?.termsAccepted === true ||
                req.body?.termsAccepted === 'true' ||
                req.body?.termsAccepted === 1
            ) {
                recordInfluencerCrmEvent({
                    influencerId: session?.influencerId,
                    userId: user._id,
                    appKey: APP_KEYS.DAMECODIGO_INFLUENCER,
                    eventType: 'terms_accepted',
                    termsVersion: req.body?.termsVersion,
                    termsSummary: req.body?.termsSummary || req.body?.termsText,
                    req,
                }).catch(() => {});
            }

            return res.status(200).json({
                success: true,
                ...session,
                deviceId: req.body?.deviceId ? String(req.body.deviceId).slice(0, 128) : undefined,
            });
        } catch (error) {
            const status = error.status || 500;
            if (status === 404 || status === 400 || status === 503) {
                return res.status(status).json({
                    ok: false,
                    success: false,
                    message: error.message,
                    code: error.code || undefined,
                });
            }
            console.error('❌ verify-session app influencer:', error);
            return res.status(500).json({
                ok: false,
                success: false,
                message: 'Error al validar sesión de influencer',
            });
        }
    }

    /**
     * PATCH /api/influencers/app/wallet
     * Actualiza solo la wallet vinculada al usuario influencer.
     */
    async linkWallet(req, res) {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({ ok: false, message: 'Token de acceso requerido' });
            }

            const walletAddress = normalizeWalletAddress(req.body?.walletAddress ?? req.body?.wallet);
            if (!walletAddress) {
                return res.status(400).json({
                    ok: false,
                    message: 'walletAddress requerida y válida',
                    code: 'INVALID_WALLET',
                });
            }

            const influencer = await Influencer.findOne({ userId: user._id }).select('_id').lean();
            if (!influencer) {
                return res.status(404).json({
                    ok: false,
                    message: 'No tienes perfil de influencer vinculado',
                    code: 'INFLUENCER_NOT_LINKED',
                });
            }

            const preferredNetwork = req.body?.preferredNetwork
                ? String(req.body.preferredNetwork).trim()
                : undefined;
            await persistWalletForUser(user, walletAddress, preferredNetwork);

            return res.status(200).json({
                ok: true,
                success: true,
                influencerId: String(influencer._id),
                wallet: {
                    address: walletAddress,
                    preferredNetwork: preferredNetwork || user.blockchain?.preferredNetwork || null,
                    source: 'app',
                },
                updatedAt: new Date().toISOString(),
            });
        } catch (error) {
            console.error('❌ link wallet app influencer:', error);
            return res.status(500).json({
                ok: false,
                success: false,
                message: 'Error al guardar wallet',
            });
        }
    }

    /**
     * POST /api/influencers/app/story-cards
     * Genera (o prepara) imagen vertical 9:16 con código corto y % — Nano Banana / Gemini Image.
     */
    async generateStoryCard(req, res) {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({ ok: false, message: 'Token de acceso requerido' });
            }

            const influencer = await Influencer.findOne({ userId: user._id })
                .select('name username')
                .lean();
            if (!influencer) {
                return res.status(404).json({
                    ok: false,
                    message: 'No tienes perfil de influencer vinculado',
                    code: 'INFLUENCER_NOT_LINKED',
                });
            }

            const promotionId = String(req.body?.promotionId || '').trim();
            const shortCodeRaw = String(req.body?.shortCode || req.body?.code || '').trim();

            const ctx = await resolveStoryCardContext(String(influencer._id), {
                shortCodeRaw,
                promotionId,
            });

            const discountPercentage = computeDiscountPctFromPromotion(ctx.promotion);
            const gen = await generateStoryCardWithNanoBanana({
                shortCode: ctx.code,
                discountPercentage,
                promotion: ctx.promotion,
                influencerName: influencer.name || influencer.username,
                brand: ctx.promotion.brand,
            });

            return res.status(200).json({
                success: true,
                ok: true,
                format: 'vertical_phone',
                aspectRatio: '9:16',
                width: STORY_WIDTH,
                height: STORY_HEIGHT,
                shortCode: ctx.code,
                referralCode: `${ctx.referralPrefix || 'L4D'}-${ctx.code}`,
                discountPercentage,
                syntheticCode: Boolean(ctx.synthetic),
                promotion: {
                    id: String(ctx.promotion._id),
                    title: ctx.promotion.title || null,
                    brand: ctx.promotion.brand || null,
                    image: ctx.promotion.image || null,
                },
                nanoBanana: {
                    model: gen.model,
                    generated: gen.generated,
                    prompt: gen.prompt,
                    message: gen.message || null,
                },
                image: gen.image || null,
                promptForClient: gen.generated ? null : buildStoryCardPrompt({
                    shortCode: ctx.code,
                    discountPercentage,
                    promotion: ctx.promotion,
                    influencerName: influencer.name,
                    brand: ctx.promotion.brand,
                }),
            });
        } catch (error) {
            const status = error.status || 500;
            if (status === 404 || status === 400) {
                return res.status(status).json({
                    ok: false,
                    success: false,
                    message: error.message,
                    code: error.code || undefined,
                });
            }
            console.error('❌ story-cards app influencer:', error);
            return res.status(500).json({
                ok: false,
                success: false,
                message: 'Error al generar story card',
            });
        }
    }

    /**
     * GET /api/influencers/app/campaigns
     * Lista campañas activas (atajo sin re-validar wallet).
     */
    async listCampaigns(req, res) {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({ ok: false, message: 'Token de acceso requerido' });
            }
            const influencer = await Influencer.findOne({ userId: user._id }).select('_id').lean();
            if (!influencer) {
                return res.status(404).json({
                    ok: false,
                    message: 'No tienes perfil de influencer vinculado',
                    code: 'INFLUENCER_NOT_LINKED',
                });
            }
            const catalog = await listActiveCampaignsForInfluencer(String(influencer._id));
            if (!catalog) {
                return res.status(404).json({ ok: false, message: 'Influencer no encontrado' });
            }
            return res.status(200).json({ success: true, ok: true, ...catalog });
        } catch (error) {
            console.error('❌ list campaigns app:', error);
            return res.status(500).json({ ok: false, message: 'Error al listar campañas' });
        }
    }
}

module.exports = new InfluencerAppController();
