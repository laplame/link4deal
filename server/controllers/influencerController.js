const path = require('path');
const fs = require('fs').promises;
const Influencer = require('../models/Influencer');
const InfluencerMessage = require('../models/InfluencerMessage');
const InfluencerPromoShortCode = require('../models/InfluencerPromoShortCode');
const DiscountQrToken = require('../models/DiscountQrToken');
const database = require('../config/database');
const mongoose = require('mongoose');
const { getInfluencerUploadDir } = require('../middleware/upload');
const { persistInfluencerImage } = require('../utils/influencerImageStorage');
const cloudinaryConfig = require('../config/cloudinary');
const { partitionDiscountQrDocsToActivity } = require('../utils/couponActivityRow');
const { buildInfluencerQrPromotionSummary } = require('../utils/influencerQrPromotionSummary');
const { toFrontendUgc, normalizeUgcProfileInput } = require('../utils/ugcProfileValidate');
const {
    buildPublicInfluencerBidCards,
    buildPublicProfileFieldOverrides,
    buildMarketplaceListEnrichmentMap,
    computePublicProfileFieldOverrides,
} = require('../utils/influencerProfileEnrichment');
const { queueEnsurePromoShortCodesForInfluencer } = require('../utils/ensureInfluencerPromoShortCodes');
const { buildInfluencerAvailableProducts } = require('../utils/influencerAvailableProducts');
const { ensureInfluencerHasProfileShortCode } = require('../utils/influencerPromoShortCodes');
const InfluencerOutboundClick = require('../models/InfluencerOutboundClick');
const {
    nameToSlug,
    resolveCanonicalPublicSlug,
    docMatchesPublicSlug,
    normalizeSlugInput,
} = require('../utils/influencerSlug');
const { collectHandlesFromBody, findUnclaimedInfluencer, linkInfluencerToUser } = require('../utils/influencerUserLink');
const { isPlatformSuperuserEmail } = require('../utils/platformSuperuser');

/** Usuario de sistema: no se muestra en listados públicos. Ver docs/INFLUENCER_GENERAL.md */
const INFLUENCER_GENERAL_USERNAME = 'influencer-general';

function buildFollowersAndSocial(socialMediaArray) {
    const followers = { instagram: 0, tiktok: 0, youtube: 0, twitter: 0 };
    const socialMedia = { instagram: '', tiktok: '', youtube: '', twitter: '' };
    let totalFollowers = 0;
    if (!Array.isArray(socialMediaArray)) return { followers, socialMedia, totalFollowers };
    const platformKey = (p) => (p || '').toLowerCase().replace(/^@/, '');
    socialMediaArray.forEach(acc => {
        const platform = platformKey(acc.platform);
        const count = Number(acc.followers) || 0;
        const handle = (acc.username || '').trim() || '';
        if (platform === 'instagram') { followers.instagram = count; socialMedia.instagram = handle; totalFollowers += count; }
        else if (platform === 'tiktok') { followers.tiktok = count; socialMedia.tiktok = handle; totalFollowers += count; }
        else if (platform === 'youtube') { followers.youtube = count; socialMedia.youtube = handle; totalFollowers += count; }
        else if (platform === 'twitter' || platform === 'x') { followers.twitter = count; socialMedia.twitter = handle; totalFollowers += count; }
    });
    return { followers, socialMedia, totalFollowers };
}

class InfluencerController {
    isMongoConnected() {
        return database.isReady();
    }

    isValidObjectId(id) {
        return mongoose.Types.ObjectId.isValid(id);
    }

    /** Normaliza un documento de MongoDB al formato que espera el frontend (InfluencersMarketplace) */
    toFrontendFormat(doc) {
        if (!doc) return null;
        const d = doc.toObject ? doc.toObject() : doc;
        return {
            id: d._id?.toString() || d.id,
            name: d.name || '',
            username: d.username || '',
            avatar: d.avatar || '',
            followers: {
                instagram: Number(d.followers?.instagram) || 0,
                tiktok: Number(d.followers?.tiktok) || 0,
                youtube: Number(d.followers?.youtube) || 0,
                twitter: Number(d.followers?.twitter) || 0,
            },
            totalFollowers: (() => {
                const sum =
                    (Number(d.followers?.instagram) || 0) +
                    (Number(d.followers?.tiktok) || 0) +
                    (Number(d.followers?.youtube) || 0) +
                    (Number(d.followers?.twitter) || 0);
                return Number(d.totalFollowers) > 0 ? Number(d.totalFollowers) : sum;
            })(),
            engagement: d.engagement ?? 0,
            categories: Array.isArray(d.categories) ? d.categories : [],
            status: d.status || 'pending',
            identityVerificationStatus: d.identityVerificationStatus || 'pending',
            joinDate: d.joinDate ? new Date(d.joinDate).toISOString().split('T')[0] : '',
            totalEarnings: d.totalEarnings ?? 0,
            monthlyEarnings: d.monthlyEarnings ?? 0,
            completedPromotions: d.completedPromotions ?? 0,
            activePromotions: d.activePromotions ?? 0,
            rating: d.rating ?? 0,
            location: d.location || '',
            bio: d.bio || '',
            socialMedia: {
                instagram: d.socialMedia?.instagram,
                tiktok: d.socialMedia?.tiktok,
                youtube: d.socialMedia?.youtube,
                twitter: d.socialMedia?.twitter
            },
            recentPromotions: Array.isArray(d.recentPromotions) ? d.recentPromotions.map(p => ({
                id: p.id || p._id?.toString(),
                brand: p.brand,
                title: p.title,
                date: p.date ? new Date(p.date).toISOString().split('T')[0] : '',
                status: p.status,
                earnings: p.earnings ?? 0,
                couponCode: p.couponCode,
                couponUsage: p.couponUsage ?? 0,
                totalSales: p.totalSales ?? 0
            })) : [],
            recentPayments: Array.isArray(d.recentPayments) ? d.recentPayments.map(p => ({
                id: p.id || p._id?.toString(),
                date: p.date ? new Date(p.date).toISOString().split('T')[0] : '',
                amount: p.amount ?? 0,
                type: p.type,
                status: p.status,
                description: p.description || ''
            })) : [],
            couponStats: {
                totalCoupons: d.couponStats?.totalCoupons ?? 0,
                activeCoupons: d.couponStats?.activeCoupons ?? 0,
                totalSales: d.couponStats?.totalSales ?? 0,
                totalCommission: d.couponStats?.totalCommission ?? 0,
                averageConversion: d.couponStats?.averageConversion ?? 0
            },
            hot: !!d.hot,
            featured: !!d.featured,
            ugcProfile: toFrontendUgc(d.ugcProfile),
            /** Código corto propio del influencer (app / buscador si hay INFLUENCER_PROFILE_SHORT_CODE_DEFAULT_PROMOTION_ID). */
            profileShortCode: d.profileShortCode ? String(d.profileShortCode).trim() : '',
            /** Slug para /influencer/:slug (username, IG o nombre compacto). */
            publicSlug: resolveCanonicalPublicSlug(d),
        };
    }

    async getAllInfluencers(req, res) {
        try {
            if (!this.isMongoConnected()) {
                return res.status(200).json({
                    success: true,
                    data: { docs: [] },
                    message: 'MongoDB no conectado - lista de influencers vacía'
                });
            }

            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
            const status = req.query.status;
            const includeSystem = req.query.includeSystem === 'true';

            const query = {};
            if (status) query.status = status;
            if (!includeSystem) query.username = { $ne: INFLUENCER_GENERAL_USERNAME };

            const skip = (page - 1) * limit;
            const [docs, totalDocs] = await Promise.all([
                Influencer.find(query).sort({ totalFollowers: -1 }).populate('userId', 'firstName lastName email').skip(skip).limit(limit).lean(),
                Influencer.countDocuments(query)
            ]);

            const totalPages = Math.ceil(totalDocs / limit) || 1;

            const frontendDocs = docs.map((d) => this.toFrontendFormat({ toObject: () => d }));
            const enrichList = req.query.enrich !== 'false';
            if (enrichList && frontendDocs.length > 0) {
                try {
                    const enrichmentMap = await buildMarketplaceListEnrichmentMap(
                        frontendDocs.map((doc) => doc.id),
                    );
                    for (let i = 0; i < frontendDocs.length; i++) {
                        const base = frontendDocs[i];
                        const pack = enrichmentMap.get(base.id);
                        if (!pack) continue;
                        const enriched = computePublicProfileFieldOverrides(
                            pack.rows,
                            pack.tokensWithoutPromotionId,
                            base,
                            pack.apps,
                        );
                        frontendDocs[i] = { ...base, ...enriched };
                    }
                } catch (e) {
                    console.warn('⚠️ enrich listado influencers:', e.message);
                }
            }

            res.json({
                success: true,
                data: {
                    docs: frontendDocs,
                    totalDocs,
                    limit,
                    page,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                },
                message: 'Influencers obtenidos correctamente'
            });
        } catch (error) {
            console.error('❌ Error obteniendo influencers:', error);
            const isNetworkError = error.name === 'MongoNetworkError' || error.code === 'ENOTFOUND' || (error.cause && (error.cause.code === 'ENOTFOUND' || error.cause.code === 'ETIMEDOUT'));
            if (isNetworkError) {
                return res.status(200).json({
                    success: true,
                    data: { docs: [], totalDocs: 0, limit: parseInt(req.query.limit) || 50, page: 1, totalPages: 0, hasNextPage: false, hasPrevPage: false },
                    message: 'Error temporal de conexión con la base de datos. Reintenta en unos segundos.'
                });
            }
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    async create(req, res) {
        try {
            if (!this.isMongoConnected()) {
                return res.status(503).json({
                    success: false,
                    message: 'Base de datos no disponible'
                });
            }
            const body = req.body || {};
            const name = (body.name || body.displayName || '').trim();
            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'name o displayName es requerido'
                });
            }
            const userId = body.userId || (req.user && req.user._id ? req.user._id : null);
            const { followers, socialMedia, totalFollowers } = buildFollowersAndSocial(body.socialMedia);
            const categories = Array.isArray(body.categories) ? body.categories : (Array.isArray(body.collaborationPreferences) ? body.collaborationPreferences : []);
            let username = body.username ? String(body.username).trim().replace(/^@/, '') : '';
            if (!username && socialMedia?.instagram) {
                username = String(socialMedia.instagram).trim().replace(/^@/, '');
            } else if (!username && socialMedia?.tiktok) {
                username = String(socialMedia.tiktok).trim().replace(/^@/, '');
            }
            const bio = (body.bio || '').trim();

            if (userId) {
                const existingLinked = await Influencer.findOne({ userId });
                if (existingLinked) {
                    return res.status(409).json({
                        success: false,
                        message: 'Ya tienes un perfil de influencer vinculado a esta cuenta',
                        data: this.toFrontendFormat({ toObject: () => existingLinked.toObject() }),
                    });
                }
                const unclaimed = await findUnclaimedInfluencer({
                    handles: collectHandlesFromBody({ username, socialMedia }),
                    slug: username,
                });
                if (unclaimed) {
                    const linked = await linkInfluencerToUser(unclaimed, userId);
                    if (linked) {
                        if (name) linked.name = name;
                        if (bio) linked.bio = (body.bio || '').trim();
                        if (body.location) linked.location = String(body.location).trim();
                        if (categories.length) linked.categories = categories;
                        if (Array.isArray(body.languages)) linked.languages = body.languages;
                        linked.socialMedia = socialMedia;
                        linked.followers = followers;
                        linked.totalFollowers = totalFollowers;
                        if (body.avatar) linked.avatar = body.avatar;
                        await linked.save();
                        await ensureInfluencerHasProfileShortCode(String(linked._id));
                        const docFresh = await Influencer.findById(linked._id).lean();
                        return res.status(200).json({
                            success: true,
                            data: this.toFrontendFormat({ toObject: () => docFresh || linked.toObject() }),
                            message: 'Perfil vinculado a tu cuenta',
                        });
                    }
                }
            }

            const influencer = new Influencer({
                name,
                username,
                avatar: body.avatar || '',
                languages: Array.isArray(body.languages) ? body.languages : [],
                experience: body.experience != null ? Number(body.experience) : 0,
                followers,
                totalFollowers,
                engagement: body.engagement != null ? Number(body.engagement) : 0,
                categories,
                status: 'pending',
                identityVerificationStatus: 'pending',
                location: (body.location || '').trim(),
                bio: (body.bio || '').trim(),
                socialMedia,
                userId: userId || null
            });
            if (!influencer.crm) {
                influencer.crm = {
                    activationStatus: 'onboarding',
                    dataSubmissionStatus: 'incomplete',
                };
            }
            await influencer.save();
            await ensureInfluencerHasProfileShortCode(String(influencer._id));
            const docFresh = await Influencer.findById(influencer._id).lean();
            const doc = docFresh || influencer.toObject();
            queueEnsurePromoShortCodesForInfluencer(String(doc._id || influencer._id), {
                includeEnvDefaults: true,
            });
            return res.status(201).json({
                success: true,
                data: this.toFrontendFormat({ toObject: () => doc }),
                message: 'Influencer registrado'
            });
        } catch (err) {
            console.error('Error creando influencer:', err);
            res.status(500).json({
                success: false,
                message: err.message || 'Error al crear'
            });
        }
    }

    /**
     * POST /api/influencers/avatar — Subida de foto de perfil (Multer en memoria).
     * Si Cloudinary está configurado, sube ahí (carpeta link4deal/influencers); si no, guarda en server/uploads/influencers/.
     */
    async uploadAvatar(req, res) {
        try {
            if (!req.file || !req.file.buffer) {
                return res.status(400).json({
                    success: false,
                    message: 'Sube una imagen en el campo "avatar"'
                });
            }

            const stored = await persistInfluencerImage(req.file, {
                cloudinaryFolder: 'link4deal/influencers',
                filenamePrefix: 'influencer-avatar',
            });
            if (!stored.savedToCloudinary && cloudinaryConfig.isConfigured) {
                console.warn('⚠️ Avatar guardado solo en disco; configura Cloudinary para no perderlo con git pull');
            }

            return res.status(200).json({
                success: true,
                data: { avatarUrl: stored.url, cloudinaryUrl: stored.cloudinaryUrl },
                message: 'Avatar subido correctamente',
            });
        } catch (err) {
            console.error('Error subiendo avatar de influencer:', err);
            res.status(500).json({
                success: false,
                message: err.message || 'Error al subir la imagen'
            });
        }
    }

    /**
     * POST /api/influencers/app/verification-screenshot
     * Sube screenshot del perfil (evidencia) y lo guarda en Influencer.crm.verification.
     * Requiere JWT y que exista influencer vinculado (Influencer.userId).
     * Body: multipart/form-data con campo "image" + opcional "note".
     */
    async uploadVerificationScreenshot(req, res) {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({ ok: false, success: false, message: 'Token de acceso requerido' });
            }
            if (!req.file || !req.file.buffer) {
                return res.status(400).json({
                    ok: false,
                    success: false,
                    message: 'Sube una imagen en el campo "image"',
                });
            }
            if (!this.isMongoConnected()) {
                return res.status(503).json({ ok: false, success: false, message: 'Base de datos no disponible' });
            }

            const doc = await Influencer.findOne({ userId: user._id });
            if (!doc || doc.username === INFLUENCER_GENERAL_USERNAME) {
                return res.status(404).json({
                    ok: false,
                    success: false,
                    message: 'No tienes perfil de influencer vinculado',
                    code: 'INFLUENCER_NOT_LINKED',
                });
            }

            const stored = await persistInfluencerImage(req.file, {
                cloudinaryFolder: 'link4deal/influencers-verification',
                filenamePrefix: 'influencer-verification',
            });
            const screenshotUrl = stored.url;

            if (!doc.crm) doc.crm = {};
            doc.crm.verification = doc.crm.verification || {};
            doc.crm.verification.screenshotUrl = screenshotUrl;
            doc.crm.verification.screenshotUploadedAt = new Date();
            if (doc.identityVerificationStatus === 'rejected') {
                doc.identityVerificationStatus = 'pending';
            }
            if (!doc.crm.activationStatus || doc.crm.activationStatus === 'not_started') {
                doc.crm.activationStatus = 'pending_review';
            }
            if (req.body?.note != null) {
                doc.crm.verification.note = String(req.body.note).slice(0, 500);
            }
            doc.markModified('crm');
            await doc.save();

            return res.status(200).json({
                ok: true,
                success: true,
                data: {
                    influencerId: String(doc._id),
                    screenshotUrl,
                    uploadedAt: doc.crm.verification.screenshotUploadedAt.toISOString(),
                },
                message: 'Evidencia subida correctamente',
            });
        } catch (err) {
            console.error('Error subiendo screenshot verification influencer:', err);
            return res.status(500).json({
                ok: false,
                success: false,
                message: err.message || 'Error al subir la imagen',
            });
        }
    }

    async getInfluencerBySlug(req, res) {
        try {
            const slug = normalizeSlugInput(req.params.slug);
            if (!slug) {
                return res.status(400).json({ success: false, message: 'Slug requerido' });
            }
            if (!this.isMongoConnected()) {
                return res.status(404).json({
                    success: false,
                    message: 'Influencer no encontrado'
                });
            }

            const slugCompact = slug.replace(/-/g, '');
            let doc = await Influencer.findOne({
                username: { $ne: INFLUENCER_GENERAL_USERNAME },
                $or: [
                    { username: { $in: [slug, slugCompact, `@${slug}`] } },
                    { 'socialMedia.instagram': { $in: [slug, slugCompact, `@${slug}`] } },
                    { 'socialMedia.tiktok': { $in: [slug, slugCompact, `@${slug}`] } },
                ],
            })
                .populate('userId', 'firstName lastName email')
                .lean();

            if (!doc) {
                const docs = await Influencer.find({ username: { $ne: INFLUENCER_GENERAL_USERNAME } })
                    .populate('userId', 'firstName lastName email')
                    .lean();
                doc = docs.find((d) => docMatchesPublicSlug(d, slug));
            }

            if (!doc) {
                return res.status(404).json({
                    success: false,
                    message: 'Influencer no encontrado',
                    hint: 'Prueba con el enlace que incluye el ID de Mongo o verifica username/redes en el perfil.',
                });
            }

            await ensureInfluencerHasProfileShortCode(String(doc._id));
            const docWithCode =
                (await Influencer.findById(doc._id).populate('userId', 'firstName lastName email').lean()) || doc;

            let data = this.toFrontendFormat({ toObject: () => docWithCode });
            if (this.isMongoConnected()) {
                try {
                    const enriched = await buildPublicProfileFieldOverrides(String(doc._id), data);
                    data = { ...data, ...enriched };
                } catch (e) {
                    console.warn('⚠️ enrich perfil público influencer (slug):', e.message);
                }
            }

            res.json({
                success: true,
                data,
                message: 'Influencer obtenido correctamente'
            });
        } catch (error) {
            console.error('❌ Error obteniendo influencer por slug:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    async getInfluencerById(req, res) {
        try {
            const { id } = req.params;

            if (!this.isValidObjectId(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de influencer inválido'
                });
            }

            if (!this.isMongoConnected()) {
                return res.status(404).json({
                    success: false,
                    message: 'Influencer no encontrado'
                });
            }

            const doc = await Influencer.findById(id)
                .populate('userId', 'firstName lastName email')
                .lean();
            if (!doc || doc.username === INFLUENCER_GENERAL_USERNAME) {
                return res.status(404).json({
                    success: false,
                    message: 'Influencer no encontrado'
                });
            }

            await ensureInfluencerHasProfileShortCode(id);
            const docWithCode =
                (await Influencer.findById(id).populate('userId', 'firstName lastName email').lean()) || doc;

            let data = this.toFrontendFormat({ toObject: () => docWithCode });
            if (this.isMongoConnected()) {
                try {
                    const enriched = await buildPublicProfileFieldOverrides(id, data);
                    data = { ...data, ...enriched };
                } catch (e) {
                    console.warn('⚠️ enrich perfil público influencer:', e.message);
                }
            }

            res.json({
                success: true,
                data,
                message: 'Influencer obtenido correctamente'
            });
        } catch (error) {
            console.error('❌ Error obteniendo influencer:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /** POST /api/influencers/:influencerId/contact - Enviar mensaje al influencer (público o con sesión). */
    async contactInfluencer(req, res) {
        try {
            const { influencerId } = req.params;
            const { message: text, senderName, senderEmail } = req.body || {};
            const user = req.user || null;

            if (!this.isValidObjectId(influencerId)) {
                return res.status(400).json({ success: false, message: 'ID de influencer inválido' });
            }
            const trimmed = (text || '').trim();
            if (!trimmed) {
                return res.status(400).json({ success: false, message: 'El mensaje es obligatorio' });
            }
            if (!this.isMongoConnected()) {
                return res.status(503).json({ success: false, message: 'Servicio no disponible' });
            }
            const influencer = await Influencer.findById(influencerId).lean();
            if (!influencer) {
                return res.status(404).json({ success: false, message: 'Influencer no encontrado' });
            }

            const name = (user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : senderName) || 'Anónimo';
            const email = (user && user.email) ? user.email : (senderEmail || null);

            const msg = await InfluencerMessage.create({
                influencerId,
                senderUserId: user ? user._id : null,
                senderName: name,
                senderEmail: email || undefined,
                message: trimmed
            });

            return res.status(201).json({
                success: true,
                data: { id: msg._id.toString(), createdAt: msg.createdAt },
                message: 'Mensaje enviado. El influencer lo verá al iniciar sesión.'
            });
        } catch (error) {
            console.error('❌ Error enviando mensaje al influencer:', error);
            res.status(500).json({
                success: false,
                message: 'Error al enviar el mensaje',
                error: error.message
            });
        }
    }

    /** GET /api/influencers/me - Perfil del influencer asociado al usuario logueado (con populate de userId si existe). */
    async getMe(req, res) {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({ success: false, message: 'Debes iniciar sesión' });
            }
            if (!this.isMongoConnected()) {
                return res.status(503).json({ success: false, message: 'Servicio no disponible' });
            }
            const doc = await Influencer.findOne({ userId: user._id })
                .populate('userId', 'firstName lastName email')
                .lean();
            if (!doc) {
                return res.status(404).json({
                    success: false,
                    message: 'No tienes perfil de influencer vinculado'
                });
            }
            await ensureInfluencerHasProfileShortCode(doc._id.toString());
            const docWithCode =
                (await Influencer.findOne({ userId: user._id })
                    .populate('userId', 'firstName lastName email')
                    .lean()) || doc;

            let data = this.toFrontendFormat({ toObject: () => docWithCode });
            if (this.isMongoConnected()) {
                try {
                    const enriched = await buildPublicProfileFieldOverrides(doc._id.toString(), data);
                    data = { ...data, ...enriched };
                } catch (e) {
                    console.warn('⚠️ enrich perfil influencer /me:', e.message);
                }
            }

            res.json({
                success: true,
                data,
                message: 'Perfil obtenido'
            });
        } catch (error) {
            console.error('❌ Error obteniendo perfil me:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cargar el perfil',
                error: error.message
            });
        }
    }

    /** Resuelve documento influencer por slug público (uso interno). */
    async resolveInfluencerDocBySlug(slugInput) {
        const slug = normalizeSlugInput(slugInput);
        if (!slug || !this.isMongoConnected()) return null;
        const slugCompact = slug.replace(/-/g, '');
        let doc = await Influencer.findOne({
            username: { $ne: INFLUENCER_GENERAL_USERNAME },
            $or: [
                { username: { $in: [slug, slugCompact, `@${slug}`] } },
                { 'socialMedia.instagram': { $in: [slug, slugCompact, `@${slug}`] } },
                { 'socialMedia.tiktok': { $in: [slug, slugCompact, `@${slug}`] } },
            ],
        }).lean();
        if (!doc) {
            const docs = await Influencer.find({ username: { $ne: INFLUENCER_GENERAL_USERNAME } }).lean();
            doc = docs.find((d) => docMatchesPublicSlug(d, slug)) || null;
        }
        return doc;
    }

    /**
     * GET /api/influencers/me/edit-access?slug=...
     * Indica si el usuario puede editar el perfil, vincularlo o debe usar otra cuenta.
     */
    async getEditAccess(req, res) {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({ success: false, message: 'Debes iniciar sesión' });
            }
            const slug = normalizeSlugInput(req.query.slug || '');
            if (!slug) {
                return res.status(400).json({ success: false, message: 'Parámetro slug requerido' });
            }
            if (!this.isMongoConnected()) {
                return res.status(503).json({ success: false, message: 'Servicio no disponible' });
            }

            const doc = await this.resolveInfluencerDocBySlug(slug);
            if (!doc) {
                return res.status(404).json({ success: false, message: 'Influencer no encontrado' });
            }

            const targetId = String(doc._id);
            const isAdmin = user.isSuperAdmin === true || isPlatformSuperuserEmail(user.email);
            const mine = await Influencer.findOne({ userId: user._id }).lean();

            if (isAdmin) {
                return res.json({
                    success: true,
                    data: { allowed: true, mode: 'admin', targetId },
                });
            }

            if (mine && String(mine._id) === targetId) {
                return res.json({
                    success: true,
                    data: { allowed: true, mode: 'me', targetId },
                });
            }

            if (mine && String(mine._id) !== targetId) {
                return res.json({
                    success: true,
                    data: {
                        allowed: false,
                        mode: 'denied',
                        reason: 'linked_other_profile',
                        message:
                            'Tu cuenta ya está vinculada a otro perfil de influencer. Cierra sesión e inicia con la cuenta correcta.',
                        linkedProfileSlug: resolveCanonicalPublicSlug(mine) || String(mine._id),
                        targetId,
                    },
                });
            }

            if (!doc.userId) {
                return res.json({
                    success: true,
                    data: {
                        allowed: false,
                        mode: 'claim',
                        canClaim: true,
                        message:
                            'Este perfil aún no está vinculado a ninguna cuenta. Puedes vincularlo a la tuya para editarlo.',
                        targetId,
                    },
                });
            }

            return res.json({
                success: true,
                data: {
                    allowed: false,
                    mode: 'denied',
                    reason: 'not_owner',
                    message: 'Este perfil pertenece a otra cuenta. Inicia sesión con el email o teléfono del dueño.',
                    targetId,
                },
            });
        } catch (error) {
            console.error('❌ getEditAccess:', error);
            return res.status(500).json({
                success: false,
                message: 'No se pudo verificar el acceso',
                error: error.message,
            });
        }
    }

    /**
     * POST /api/influencers/me/claim — Vincula un perfil sin userId a la cuenta logueada.
     * Body: { slug: "valentinapazofficial" }
     */
    async claimMyProfile(req, res) {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({ success: false, message: 'Debes iniciar sesión' });
            }
            if (!this.isMongoConnected()) {
                return res.status(503).json({ success: false, message: 'Servicio no disponible' });
            }

            const slug = normalizeSlugInput(req.body?.slug || req.query?.slug || '');
            if (!slug) {
                return res.status(400).json({ success: false, message: 'Indica el slug del perfil' });
            }

            const existing = await Influencer.findOne({ userId: user._id });
            if (existing) {
                return res.status(409).json({
                    success: false,
                    message: 'Tu cuenta ya tiene un perfil de influencer vinculado',
                    data: { linkedProfileSlug: resolveCanonicalPublicSlug(existing.toObject()) || String(existing._id) },
                });
            }

            const doc = await this.resolveInfluencerDocBySlug(slug);
            if (!doc) {
                return res.status(404).json({ success: false, message: 'Influencer no encontrado' });
            }
            if (doc.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Este perfil ya está vinculado a otra cuenta',
                });
            }

            const linked = await linkInfluencerToUser(doc, user._id);
            if (!linked) {
                return res.status(500).json({ success: false, message: 'No se pudo vincular el perfil' });
            }

            await ensureInfluencerHasProfileShortCode(String(linked._id)).catch(() => {});

            if (!Array.isArray(user.profileTypes) || !user.profileTypes.includes('influencer')) {
                user.profileTypes = [...new Set([...(user.profileTypes || []), 'influencer'])];
                user.primaryRole = user.primaryRole || 'influencer';
                await user.save();
            }

            const fresh = await Influencer.findById(linked._id)
                .populate('userId', 'firstName lastName email')
                .lean();
            let data = this.toFrontendFormat({ toObject: () => fresh || linked.toObject() });

            return res.json({
                success: true,
                data,
                message: 'Perfil vinculado a tu cuenta. Ya puedes editarlo.',
            });
        } catch (error) {
            console.error('❌ claimMyProfile:', error);
            return res.status(500).json({
                success: false,
                message: 'No se pudo vincular el perfil',
                error: error.message,
            });
        }
    }

    /**
     * PATCH /api/influencers/me — Actualiza los datos del perfil del influencer del usuario logueado.
     * Campos: name, bio, location, avatar, categories, languages, experience, socialMedia, followers.
     */
    async updateMe(req, res) {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({ success: false, message: 'Debes iniciar sesión' });
            }
            if (!this.isMongoConnected()) {
                return res.status(503).json({ success: false, message: 'Servicio no disponible' });
            }
            const influencer = await Influencer.findOne({ userId: user._id });
            if (!influencer) {
                return res.status(404).json({
                    success: false,
                    message: 'No tienes perfil de influencer vinculado',
                });
            }

            const body = req.body || {};
            if (body.name != null) influencer.name = String(body.name).trim().slice(0, 200);
            if (body.bio != null) influencer.bio = String(body.bio).trim().slice(0, 8000);
            if (body.location != null) influencer.location = String(body.location).trim().slice(0, 300);
            if (body.avatar != null) influencer.avatar = String(body.avatar).trim().slice(0, 2048);
            if (Array.isArray(body.categories)) {
                influencer.categories = body.categories
                    .map((c) => String(c).trim())
                    .filter(Boolean)
                    .slice(0, 30);
            }
            if (Array.isArray(body.languages)) {
                influencer.languages = body.languages
                    .map((c) => String(c).trim())
                    .filter(Boolean)
                    .slice(0, 30);
            }
            if (body.experience != null && Number.isFinite(Number(body.experience))) {
                influencer.experience = Math.max(0, Number(body.experience));
            }
            if (body.socialMedia && typeof body.socialMedia === 'object') {
                influencer.socialMedia = influencer.socialMedia || {};
                for (const key of ['instagram', 'tiktok', 'youtube', 'twitter']) {
                    if (body.socialMedia[key] != null) {
                        influencer.socialMedia[key] = String(body.socialMedia[key]).trim().slice(0, 500);
                    }
                }
                influencer.markModified('socialMedia');
            }
            if (body.followers && typeof body.followers === 'object') {
                influencer.followers = influencer.followers || {};
                for (const key of ['instagram', 'tiktok', 'youtube', 'twitter']) {
                    const n = Number(body.followers[key]);
                    if (Number.isFinite(n) && n >= 0) influencer.followers[key] = Math.round(n);
                }
                influencer.markModified('followers');
                influencer.totalFollowers =
                    (Number(influencer.followers.instagram) || 0) +
                    (Number(influencer.followers.tiktok) || 0) +
                    (Number(influencer.followers.youtube) || 0) +
                    (Number(influencer.followers.twitter) || 0);
            }

            influencer.updatedAt = new Date();
            await influencer.save();

            const docFresh =
                (await Influencer.findById(influencer._id)
                    .populate('userId', 'firstName lastName email')
                    .lean()) || influencer.toObject();

            return res.json({
                success: true,
                data: this.toFrontendFormat({ toObject: () => docFresh }),
                message: 'Perfil actualizado',
            });
        } catch (error) {
            console.error('❌ Error actualizando perfil me:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar el perfil',
                error: error.message,
            });
        }
    }

    /** PATCH /api/influencers/me/ugc-profile — Guardar vitrina UGC (enlaces + frases). Solo influencer con userId vinculado. */
    async updateMeUgcProfile(req, res) {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({ success: false, message: 'Debes iniciar sesión' });
            }
            if (!this.isMongoConnected()) {
                return res.status(503).json({ success: false, message: 'Servicio no disponible' });
            }
            const influencer = await Influencer.findOne({ userId: user._id });
            if (!influencer) {
                return res.status(404).json({
                    success: false,
                    message: 'No tienes perfil de influencer vinculado',
                });
            }

            const normalized = normalizeUgcProfileInput(req.body);
            if (!normalized.ok) {
                return res.status(400).json({ success: false, message: normalized.message });
            }

            influencer.ugcProfile = normalized.ugcProfile;
            influencer.updatedAt = new Date();
            await influencer.save();

            const docObj = influencer.toObject();
            return res.json({
                success: true,
                data: toFrontendUgc(docObj.ugcProfile),
                message: 'Perfil UGC guardado',
            });
        } catch (error) {
            console.error('❌ Error guardando perfil UGC:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al guardar perfil UGC',
                error: error.message,
            });
        }
    }

    /** GET /api/influencers/:id/bids - Pujas del influencer con populate de promoción (solo promociones vigentes). */
    async getBids(req, res) {
        try {
            const { id: influencerId } = req.params;
            if (!this.isValidObjectId(influencerId)) {
                return res.status(400).json({ success: false, message: 'ID de influencer inválido' });
            }
            if (!this.isMongoConnected()) {
                return res.status(200).json({ success: true, data: [], message: 'Sin conexión a BD' });
            }
            const exists = await Influencer.findById(influencerId).select('_id').lean();
            if (!exists) {
                return res.status(404).json({ success: false, message: 'Influencer no encontrado' });
            }
            const out = await buildPublicInfluencerBidCards(influencerId);
            return res.status(200).json({
                success: true,
                data: out,
                message: 'Pujas y colaboraciones (BD: bids, solicitudes aprobadas, cupones QR)'
            });
        } catch (error) {
            console.error('❌ Error obteniendo pujas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cargar pujas',
                error: error.message
            });
        }
    }

    /**
     * Lista cupones del influencer: abiertos (vigentes sin canjear), redimidos y caducados sin uso.
     */
    async buildInfluencerCouponActivity(req) {
        const influencerId = String(req.params.id || '').trim();
        if (!this.isValidObjectId(influencerId)) {
            const e = new Error('ID de influencer inválido');
            e.status = 400;
            throw e;
        }
        if (!this.isMongoConnected()) {
            return { open: [], redeemed: [], expiredUnused: [] };
        }
        const exists = await Influencer.findById(influencerId).select('_id').lean();
        if (!exists) {
            const e = new Error('Influencer no encontrado');
            e.status = 404;
            throw e;
        }
        const limit = Math.min(500, Math.max(1, parseInt(String(req.query.limit || '60'), 10) || 60));
        const oid = new mongoose.Types.ObjectId(influencerId);
        const docs = await DiscountQrToken.find({
            $or: [{ 'payload.influencerId': influencerId }, { 'payload.influencerId': oid }],
        })
            .sort({ createdAt: -1 })
            .limit(limit)
            .select(
                'tokenId payload expiresAt createdAt lastVerifiedAt usedAt redeemedBy verifyShopId verifyLatitude verifyLongitude verifyLocationAccuracyM'
            )
            .lean();

        return partitionDiscountQrDocsToActivity(docs);
    }

    /** GET /api/influencers/:id/coupon-redemptions — solo redimidos (compatibilidad). */
    async getCouponRedemptions(req, res) {
        try {
            const pack = await this.buildInfluencerCouponActivity(req);
            return res.status(200).json({
                success: true,
                count: pack.redeemed.length,
                data: pack.redeemed,
            });
        } catch (error) {
            const st = error.status || 500;
            if (st === 400) {
                return res.status(400).json({ success: false, message: error.message });
            }
            if (st === 404) {
                return res.status(404).json({ success: false, message: error.message });
            }
            console.error('❌ Error listando cupones redimidos del influencer:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al cargar cupones redimidos',
                error: error.message,
            });
        }
    }

    /**
     * GET /api/influencers/:id/coupons-activity
     * Abiertos, redimidos y caducados; con fecha de última apertura en tienda y GPS si existen.
     */
    async getCouponsActivity(req, res) {
        try {
            const pack = await this.buildInfluencerCouponActivity(req);
            return res.status(200).json({
                success: true,
                counts: {
                    open: pack.open.length,
                    redeemed: pack.redeemed.length,
                    expiredUnused: pack.expiredUnused.length,
                },
                open: pack.open,
                redeemed: pack.redeemed,
                expiredUnused: pack.expiredUnused,
            });
        } catch (error) {
            const st = error.status || 500;
            if (st === 400) {
                return res.status(400).json({ success: false, message: error.message });
            }
            if (st === 404) {
                return res.status(404).json({ success: false, message: error.message });
            }
            console.error('❌ Error obteniendo actividad de cupones:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al cargar actividad de cupones',
                error: error.message,
            });
        }
    }

    /**
     * GET /api/influencers/:id/qr-promotions-summary
     * Por promoción: cupones abiertos / canjeados / caducados + si la campaña sigue vigente en catálogo; incluye pujas vigentes sin cupones emitidos.
     */
    async getQrPromotionsSummary(req, res) {
        try {
            const influencerId = String(req.params.id || '').trim();
            if (!this.isValidObjectId(influencerId)) {
                return res.status(400).json({ success: false, message: 'ID de influencer inválido' });
            }
            if (!this.isMongoConnected()) {
                return res.status(200).json({
                    success: true,
                    rows: [],
                    tokensWithoutPromotionId: 0,
                    generatedAt: new Date().toISOString(),
                    message: 'Sin conexión a BD',
                });
            }
            const exists = await Influencer.findById(influencerId).select('_id').lean();
            if (!exists) {
                return res.status(404).json({ success: false, message: 'Influencer no encontrado' });
            }
            const data = await buildInfluencerQrPromotionSummary(influencerId);
            return res.status(200).json({ success: true, ...data });
        } catch (error) {
            console.error('❌ Error resumen QR por promoción:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al cargar resumen de promociones QR',
                error: error.message,
            });
        }
    }

    /** GET /api/influencers/:id/available-products — promos/productos con solicitud aprobada por la marca. */
    async getAvailableProducts(req, res) {
        try {
            const { id: influencerId } = req.params;
            if (!this.isValidObjectId(influencerId)) {
                return res.status(400).json({ success: false, message: 'ID de influencer inválido' });
            }
            if (!this.isMongoConnected()) {
                return res.status(200).json({ success: true, data: [], message: 'Sin conexión a BD' });
            }
            const exists = await Influencer.findById(influencerId).select('_id username').lean();
            if (!exists || exists.username === INFLUENCER_GENERAL_USERNAME) {
                return res.status(404).json({ success: false, message: 'Influencer no encontrado' });
            }
            const data = await buildInfluencerAvailableProducts(influencerId);
            return res.status(200).json({
                success: true,
                data,
                message:
                    'Productos y campañas disponibles tras aprobación de la marca (PromotionApplication approved)',
            });
        } catch (error) {
            console.error('❌ Error productos disponibles influencer:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al cargar productos disponibles',
                error: error.message,
            });
        }
    }

    /** POST /api/influencers/:id/outbound-click — tracking de click para quick promotion (redirect). */
    async trackOutboundClick(req, res) {
        try {
            const influencerId = String(req.params.id || '').trim();
            if (!this.isValidObjectId(influencerId)) {
                return res.status(400).json({ success: false, message: 'ID de influencer inválido' });
            }
            if (!this.isMongoConnected()) {
                return res.status(200).json({ success: true, data: null, message: 'Sin conexión a BD' });
            }
            const exists = await Influencer.findById(influencerId).select('_id username').lean();
            if (!exists || exists.username === INFLUENCER_GENERAL_USERNAME) {
                return res.status(404).json({ success: false, message: 'Influencer no encontrado' });
            }

            const promotionId = req.body?.promotionId != null ? String(req.body.promotionId).trim() : '';
            if (!this.isValidObjectId(promotionId)) {
                return res.status(400).json({ success: false, message: 'promotionId inválido' });
            }
            const targetUrl = req.body?.targetUrl != null ? String(req.body.targetUrl).trim() : '';
            if (!targetUrl) {
                return res.status(400).json({ success: false, message: 'targetUrl requerido' });
            }

            const catalogProductId =
                req.body?.catalogProductId != null ? String(req.body.catalogProductId).trim() : null;
            const page = req.body?.page != null ? String(req.body.page).trim() : 'influencer_store';
            const referrer = req.body?.referrer != null ? String(req.body.referrer).trim() : null;

            const clickId = `clk_${new mongoose.Types.ObjectId().toString()}`;
            const ip =
                (req.headers['x-forwarded-for'] && String(req.headers['x-forwarded-for']).split(',')[0].trim()) ||
                req.socket?.remoteAddress ||
                null;
            const userAgent = req.get('user-agent') || null;

            await InfluencerOutboundClick.create({
                clickId,
                influencer: new mongoose.Types.ObjectId(influencerId),
                promotion: new mongoose.Types.ObjectId(promotionId),
                catalogProductId: catalogProductId || null,
                targetUrl,
                page: page || 'influencer_store',
                referrer,
                userAgent,
                ip,
            });

            return res.status(201).json({ success: true, data: { clickId } });
        } catch (error) {
            console.error('❌ Error tracking outbound click:', error);
            return res.status(500).json({ success: false, message: 'Error registrando click', error: error.message });
        }
    }

    /** GET /api/influencers/:id/promo-short-codes — códigos alfanuméricos cortos (app / rackeo promo) públicos si la campaña sigue activa. */
    async getPromoShortCodes(req, res) {
        try {
            const influencerId = String(req.params.id || '').trim();
            if (!this.isValidObjectId(influencerId)) {
                return res.status(400).json({ success: false, message: 'ID de influencer inválido' });
            }
            if (!this.isMongoConnected()) {
                return res.status(200).json({
                    success: true,
                    data: [],
                    message: 'Sin conexión a BD',
                });
            }
            const inf = await Influencer.findById(influencerId).select('username').lean();
            if (!inf || inf.username === INFLUENCER_GENERAL_USERNAME) {
                return res.status(404).json({
                    success: false,
                    message: 'Influencer no encontrado',
                });
            }
            const now = new Date();
            const docs = await InfluencerPromoShortCode.find({
                influencer: influencerId,
                active: true,
                $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
            })
                .populate('promotion', 'title brand status')
                .sort({ code: 1 })
                .lean();

            const data = docs.map((d) => {
                const p = d.promotion;
                return {
                    code: d.code,
                    label: (d.label && String(d.label).trim()) || '',
                    referralPrefix: d.referralPrefix || 'L4D',
                    expiresAt: d.expiresAt ? new Date(d.expiresAt).toISOString() : null,
                    promotion:
                        p && p._id
                            ? {
                                  id: String(p._id),
                                  title: p.title || '',
                                  brand: p.brand || '',
                                  status: p.status || null,
                              }
                            : null,
                };
            });

            const influencerProfileShortCode = await ensureInfluencerHasProfileShortCode(influencerId);

            return res.json({
                success: true,
                data,
                influencerProfileShortCode: influencerProfileShortCode || null,
                message: 'Códigos cortos de campaña',
            });
        } catch (error) {
            console.error('❌ Error listando códigos cortos influencer:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al cargar códigos de campaña',
                error: error.message,
            });
        }
    }

    /** GET /api/influencers/messages/inbox - Bandeja del influencer (requiere sesión y que el usuario sea influencer vinculado). */
    async getInbox(req, res) {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({ success: false, message: 'Debes iniciar sesión' });
            }
            if (!this.isMongoConnected()) {
                return res.status(200).json({ success: true, data: { messages: [] }, message: 'Sin conexión a BD' });
            }
            const influencer = await Influencer.findOne({ userId: user._id }).lean();
            if (!influencer) {
                return res.status(200).json({
                    success: true,
                    data: { messages: [], influencerId: null },
                    message: 'No tienes perfil de influencer vinculado'
                });
            }

            const messages = await InfluencerMessage.find({ influencerId: influencer._id })
                .sort({ createdAt: -1 })
                .limit(100)
                .lean();

            const list = messages.map((m) => ({
                id: m._id.toString(),
                senderName: m.senderName || 'Anónimo',
                senderEmail: m.senderEmail || null,
                message: m.message,
                read: m.read,
                createdAt: m.createdAt
            }));

            return res.json({
                success: true,
                data: { messages: list, influencerId: influencer._id.toString() },
                message: 'Bandeja de entrada'
            });
        } catch (error) {
            console.error('❌ Error obteniendo bandeja:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cargar los mensajes',
                error: error.message
            });
        }
    }

    /** PATCH /api/influencers/messages/:messageId/read - Marcar mensaje como leído. */
    async markMessageRead(req, res) {
        try {
            const user = req.user;
            const { messageId } = req.params;
            if (!user || !this.isValidObjectId(messageId)) {
                return res.status(400).json({ success: false, message: 'Solicitud inválida' });
            }
            if (!this.isMongoConnected()) {
                return res.status(503).json({ success: false, message: 'Servicio no disponible' });
            }
            const influencer = await Influencer.findOne({ userId: user._id });
            if (!influencer) {
                return res.status(403).json({ success: false, message: 'No tienes perfil de influencer' });
            }
            const msg = await InfluencerMessage.findOneAndUpdate(
                { _id: messageId, influencerId: influencer._id },
                { read: true },
                { new: true }
            );
            if (!msg) {
                return res.status(404).json({ success: false, message: 'Mensaje no encontrado' });
            }
            return res.json({ success: true, data: { read: true }, message: 'Mensaje marcado como leído' });
        } catch (error) {
            console.error('❌ Error marcando mensaje:', error);
            res.status(500).json({ success: false, message: 'Error al actualizar', error: error.message });
        }
    }
}

const controller = new InfluencerController();
module.exports = controller;
