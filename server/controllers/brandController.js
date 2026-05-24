const mongoose = require('mongoose');
const Brand = require('../models/Brand');
const database = require('../config/database');
const Promotion = require('../models/Promotion');
const { fetchBizneShopById, shopIdOf } = require('../utils/bizneShopClient');
const { isValidBizneShopObjectId, normalizeBizneShopId } = require('../utils/bizneShopId');
const { parseBizneShopUrl } = require('../utils/bizneShopUrl');

function resolveBizneShopIdFromBody(body) {
    const direct = String(body?.bizneShopId ?? body?.shopId ?? '').trim();
    if (direct) return direct;
    const url = String(body?.bizneShopUrl ?? body?.shopUrl ?? body?.url ?? '').trim();
    if (!url) return '';
    const parsed = parseBizneShopUrl(url);
    if (!parsed) {
        const err = new Error(
            'No se pudo extraer shopId de la URL. Pega la URL de tu negocio en bizneai.com o el enlace /shop/bizne/…',
        );
        err.status = 400;
        throw err;
    }
    return parsed.shopId;
}
const { buildPromotionShopIdQuery } = require('../utils/promotionShopFilter');
const { enrichPromotionClientFields } = require('../utils/promotionClientFields');

async function ensureUserBrandProfile(user) {
    if (!user) return;
    if (!Array.isArray(user.profileTypes)) user.profileTypes = [];
    if (!user.profileTypes.includes('brand')) {
        user.profileTypes.push('brand');
    }
    if (user.primaryRole === 'user') {
        user.primaryRole = 'brand';
    }
    user.updatedAt = new Date();
    await user.save();
}

async function applyBizneShopLink(brand, bizneShopId) {
    const id = String(bizneShopId || '').trim();
    if (!id) {
        brand.bizneShopId = '';
        brand.bizneShopName = '';
        brand.bizneLinkedAt = null;
        return { shop: null };
    }
    if (!isValidBizneShopObjectId(id)) {
        const err = new Error('shopId inválido: debe ser 24 caracteres hex (ObjectId BizneAI).');
        err.status = 400;
        throw err;
    }
    const shop = await fetchBizneShopById(id);
    if (!shop) {
        const err = new Error('No se encontró la tienda en BizneAI. Verifica el ID en la app.');
        err.status = 400;
        throw err;
    }
    brand.bizneShopId = shopIdOf(shop);
    brand.bizneShopName = String(shop.storeName || shop.name || '').trim();
    brand.bizneLinkedAt = new Date();
    return { shop };
}

class BrandController {
    async getById(req, res) {
        try {
            const { id } = req.params;
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de marca inválido',
                });
            }
            if (!database.isReady()) {
                return res.status(503).json({
                    success: false,
                    message: 'Base de datos no disponible',
                });
            }
            const brand = await Brand.findById(id).lean();
            if (!brand) {
                return res.status(404).json({
                    success: false,
                    message: 'Marca o negocio no encontrado',
                });
            }
            return res.json({
                success: true,
                data: brand,
            });
        } catch (err) {
            console.error('Error obteniendo marca:', err);
            res.status(500).json({
                success: false,
                message: err.message || 'Error al obtener la marca',
            });
        }
    }

    async list(req, res) {
        try {
            if (!database.isReady()) {
                return res.json({
                    success: true,
                    data: [],
                    message: 'Modo sin base de datos; lista vacía',
                });
            }
            const brands = await Brand.find({}).sort({ createdAt: -1 }).lean();
            return res.json({
                success: true,
                data: brands,
                total: brands.length,
            });
        } catch (err) {
            console.error('Error listando marcas/negocios:', err);
            res.status(500).json({
                success: false,
                message: err.message || 'Error al listar',
            });
        }
    }

    /** GET /api/brands/me — marca del usuario autenticado + snapshot BizneAI si hay vínculo. */
    async getMe(req, res) {
        try {
            if (!database.isReady()) {
                return res.status(503).json({ success: false, message: 'Base de datos no disponible' });
            }
            const brand = await Brand.findOne({ userId: req.user._id }).lean();
            if (!brand) {
                return res.status(404).json({
                    success: false,
                    message: 'Aún no tienes perfil de marca. Completa el registro en /brand-setup.',
                    code: 'BRAND_PROFILE_MISSING',
                });
            }
            let bizneShop = null;
            if (brand.bizneShopId) {
                try {
                    bizneShop = await fetchBizneShopById(brand.bizneShopId);
                } catch (e) {
                    console.warn('Bizne shop refresh:', e.message);
                }
            }
            return res.json({
                success: true,
                data: { brand, bizneShop },
            });
        } catch (err) {
            console.error('Error brands/me:', err);
            res.status(500).json({ success: false, message: err.message || 'Error al obtener tu marca' });
        }
    }

    /**
     * GET /api/brands/me/promotions?shopId=…&status=all&page=1&limit=20
     * Lista cupones DameCodigo cruzados con el shopId BizneAI (misma lógica que GET /api/promotions?shopId=).
     */
    async getMyPromotions(req, res) {
        try {
            if (!database.isReady()) {
                return res.status(503).json({ success: false, message: 'Base de datos no disponible' });
            }
            const brand = await Brand.findOne({ userId: req.user._id }).lean();
            if (!brand) {
                return res.status(404).json({
                    success: false,
                    code: 'BRAND_PROFILE_MISSING',
                    message: 'Registra tu marca primero',
                });
            }
            const shopId =
                normalizeBizneShopId(req.query.shopId) || normalizeBizneShopId(brand.bizneShopId);
            if (!shopId) {
                return res.json({
                    success: true,
                    data: {
                        docs: [],
                        shopId: null,
                        totalDocs: 0,
                        page: 1,
                        totalPages: 0,
                    },
                    message: 'Vincula tu shopId BizneAI (24 hex) para ver cupones',
                });
            }

            const page = Math.max(1, parseInt(req.query.page, 10) || 1);
            const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
            const status = req.query.status;
            const query = { ...buildPromotionShopIdQuery(shopId) };
            const wantAll = status === 'all';
            const wantOnlyActive = !wantAll && (status === undefined || status === 'active' || status === '');
            if (wantOnlyActive) {
                query.status = 'active';
                query.validUntil = { $gte: new Date() };
            } else if (status && status !== 'all') {
                query.status = status;
                if (status === 'active') {
                    query.validUntil = { $gte: new Date() };
                }
            }

            const result = await Promotion.paginate(query, {
                page,
                limit,
                sort: { createdAt: -1 },
                populate: 'seller',
            });

            return res.json({
                success: true,
                data: {
                    ...result,
                    shopId,
                    docs: (result.docs || []).map((doc) =>
                        enrichPromotionClientFields(doc.toObject ? doc.toObject() : doc),
                    ),
                },
                message: 'Promociones de tu tienda BizneAI',
            });
        } catch (err) {
            console.error('Error brands/me/promotions:', err);
            res.status(500).json({ success: false, message: err.message || 'Error al listar promociones' });
        }
    }

    /** PATCH /api/brands/me/bizne-shop — vincular tienda BizneAI por shopId. */
    async linkBizneShop(req, res) {
        try {
            if (!database.isReady()) {
                return res.status(503).json({ success: false, message: 'Base de datos no disponible' });
            }
            const brand = await Brand.findOne({ userId: req.user._id });
            if (!brand) {
                return res.status(404).json({
                    success: false,
                    message: 'Primero registra tu marca en /brand-setup',
                    code: 'BRAND_PROFILE_MISSING',
                });
            }
            let bizneShopId = '';
            try {
                bizneShopId = resolveBizneShopIdFromBody(req.body || {});
            } catch (parseErr) {
                return res.status(parseErr.status || 400).json({
                    success: false,
                    message: parseErr.message,
                });
            }
            const { shop } = await applyBizneShopLink(brand, bizneShopId);
            brand.updatedAt = new Date();
            await brand.save();
            return res.json({
                success: true,
                data: { brand: brand.toObject(), bizneShop: shop },
                message: shop
                    ? 'Tienda BizneAI vinculada correctamente'
                    : 'Vínculo con BizneAI eliminado',
            });
        } catch (err) {
            const status = err.status || 500;
            if (status >= 500) console.error('Error link bizne:', err);
            res.status(status).json({
                success: false,
                message: err.message || 'No se pudo vincular la tienda',
            });
        }
    }

    async create(req, res) {
        try {
            if (!database.isReady()) {
                return res.status(503).json({
                    success: false,
                    message: 'Base de datos no disponible',
                });
            }
            const body = req.body || {};
            const companyName = (body.companyName || body.name || '').trim();
            if (!companyName) {
                return res.status(400).json({
                    success: false,
                    message: 'companyName es requerido',
                });
            }

            const userId = req.user?._id || body.userId || null;
            if (userId) {
                const existing = await Brand.findOne({ userId }).lean();
                if (existing) {
                    return res.status(409).json({
                        success: false,
                        message: 'Ya tienes una marca registrada. Usa tu panel para vincular BizneAI.',
                        data: existing,
                        code: 'BRAND_ALREADY_EXISTS',
                    });
                }
            }

            const targetAudience = body.targetAudience
                ? {
                      ageRange: body.targetAudience.ageRange
                          ? {
                                min: Number(body.targetAudience.ageRange.min),
                                max: Number(body.targetAudience.ageRange.max),
                            }
                          : undefined,
                      gender: Array.isArray(body.targetAudience.gender) ? body.targetAudience.gender : [],
                      locations: Array.isArray(body.targetAudience.locations)
                          ? body.targetAudience.locations
                          : [],
                      interests: Array.isArray(body.targetAudience.interests)
                          ? body.targetAudience.interests
                          : [],
                      incomeLevel: body.targetAudience.incomeLevel || '',
                  }
                : undefined;

            const brand = new Brand({
                companyName,
                industry: body.industry || '',
                website: body.website || '',
                description: body.description || '',
                headquarters: body.headquarters || '',
                founded: body.founded ? parseInt(body.founded, 10) : undefined,
                employees: body.employees || '',
                categories: Array.isArray(body.categories) ? body.categories : [],
                targetAudience,
                marketingBudget: {
                    min: Number(body.marketingBudget?.min) ?? body.marketingBudgetMin ?? 0,
                    max: Number(body.marketingBudget?.max) ?? body.marketingBudgetMax ?? 0,
                    currency: body.marketingBudget?.currency || 'USD',
                },
                preferredChannels: Array.isArray(body.preferredChannels) ? body.preferredChannels : [],
                campaignTypes: Array.isArray(body.campaignTypes) ? body.campaignTypes : [],
                status: 'pending',
                userId,
            });

            let bizneShopId = '';
            try {
                bizneShopId = resolveBizneShopIdFromBody(body);
            } catch (parseErr) {
                return res.status(parseErr.status || 400).json({
                    success: false,
                    message: parseErr.message,
                });
            }
            if (bizneShopId) {
                await applyBizneShopLink(brand, bizneShopId);
            }

            await brand.save();

            if (req.user) {
                await ensureUserBrandProfile(req.user);
            }

            return res.status(201).json({
                success: true,
                data: brand,
                message: bizneShopId
                    ? 'Marca registrada y vinculada a BizneAI'
                    : 'Marca/negocio registrado. Vincula tu tienda BizneAI desde el panel.',
            });
        } catch (err) {
            const status = err.status || 500;
            if (status >= 500) console.error('Error creando marca/negocio:', err);
            res.status(status).json({
                success: false,
                message: err.message || 'Error al crear',
            });
        }
    }
}

module.exports = new BrandController();
