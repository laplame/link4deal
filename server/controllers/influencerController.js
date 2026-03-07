const Influencer = require('../models/Influencer');
const InfluencerMessage = require('../models/InfluencerMessage');
const Bid = require('../models/Bid');
const database = require('../config/database');
const mongoose = require('mongoose');

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
        return database.isConnected && mongoose.connection.readyState === 1;
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
                instagram: d.followers?.instagram ?? 0,
                tiktok: d.followers?.tiktok ?? 0,
                youtube: d.followers?.youtube ?? 0,
                twitter: d.followers?.twitter ?? 0
            },
            totalFollowers: d.totalFollowers ?? 0,
            engagement: d.engagement ?? 0,
            categories: Array.isArray(d.categories) ? d.categories : [],
            status: d.status || 'pending',
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
            featured: !!d.featured
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

            res.json({
                success: true,
                data: {
                    docs: docs.map(d => this.toFrontendFormat({ toObject: () => d })),
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
            const influencer = new Influencer({
                name,
                username: body.username ? String(body.username).trim() : '',
                avatar: body.avatar || '',
                languages: Array.isArray(body.languages) ? body.languages : [],
                experience: body.experience != null ? Number(body.experience) : 0,
                followers,
                totalFollowers,
                engagement: body.engagement != null ? Number(body.engagement) : 0,
                categories,
                status: 'pending',
                location: (body.location || '').trim(),
                bio: (body.bio || '').trim(),
                socialMedia,
                userId: userId || null
            });
            await influencer.save();
            const doc = influencer.toObject();
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

    /** Normaliza nombre a slug (mismo criterio que el front: lowercase, sin acentos, espacios -> guiones) */
    nameToSlug(name) {
        if (!name || typeof name !== 'string') return '';
        return name.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
    }

    async getInfluencerBySlug(req, res) {
        try {
            const slug = (req.params.slug || '').trim().toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9-]/g, '');
            if (!slug) {
                return res.status(400).json({ success: false, message: 'Slug requerido' });
            }
            if (!this.isMongoConnected()) {
                return res.status(404).json({
                    success: false,
                    message: 'Influencer no encontrado'
                });
            }
            const docs = await Influencer.find({ username: { $ne: INFLUENCER_GENERAL_USERNAME } }).populate('userId', 'firstName lastName email').lean();
            const doc = docs.find(d => this.nameToSlug(d.name) === slug);
            if (!doc) {
                return res.status(404).json({
                    success: false,
                    message: 'Influencer no encontrado'
                });
            }
            res.json({
                success: true,
                data: this.toFrontendFormat({ toObject: () => doc }),
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

            res.json({
                success: true,
                data: this.toFrontendFormat({ toObject: () => doc }),
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
            res.json({
                success: true,
                data: this.toFrontendFormat({ toObject: () => doc }),
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
            const now = new Date();
            const bidDocs = await Bid.find({ influencer: influencerId })
                .populate('promotion')
                .sort({ createdAt: -1 })
                .lean();
            const out = [];
            for (const b of bidDocs) {
                const promo = b.promotion;
                if (!promo || !promo.validUntil || new Date(promo.validUntil) < now) continue;
                const validFrom = promo.validFrom ? new Date(promo.validFrom) : now;
                const validUntil = promo.validUntil ? new Date(promo.validUntil) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                const tags = Array.isArray(promo.tags) ? promo.tags : [];
                out.push({
                    id: b._id.toString(),
                    promotionId: (promo._id || promo.id).toString(),
                    campaignTitle: promo.title || 'Sin título',
                    brandName: promo.brand || 'Sin marca',
                    status: b.status || 'active',
                    currentBid: Number(b.amountUsd) || 1,
                    requirements: tags.length ? tags.slice(0, 5) : ['General'],
                    targetMetrics: {
                        reach: (promo.views || 0) * 10 || 5000,
                        engagement: 4,
                        conversions: promo.conversions || 0
                    },
                    initialBid: Math.max(1, (Number(b.amountUsd) || 1) - 0.15),
                    bidIncrement: 0.05,
                    totalBids: (b.bidHistory && b.bidHistory.length) ? b.bidHistory.length : 1,
                    startDate: validFrom.toISOString(),
                    endDate: validUntil.toISOString(),
                    bidHistory: (b.bidHistory || []).map(h => ({ amount: h.amount || b.amountUsd, timestamp: (h.timestamp || b.createdAt).toISOString?.() || h.timestamp }))
                });
            }
            return res.status(200).json({
                success: true,
                data: out,
                message: 'Pujas del influencer (promociones vigentes)'
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
