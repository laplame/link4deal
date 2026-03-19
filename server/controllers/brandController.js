const mongoose = require('mongoose');
const Brand = require('../models/Brand');
const database = require('../config/database');

class BrandController {
    async getById(req, res) {
        try {
            const { id } = req.params;
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de marca inválido'
                });
            }
            if (!database.isConnected) {
                return res.status(503).json({
                    success: false,
                    message: 'Base de datos no disponible'
                });
            }
            const brand = await Brand.findById(id).lean();
            if (!brand) {
                return res.status(404).json({
                    success: false,
                    message: 'Marca o negocio no encontrado'
                });
            }
            return res.json({
                success: true,
                data: brand
            });
        } catch (err) {
            console.error('Error obteniendo marca:', err);
            res.status(500).json({
                success: false,
                message: err.message || 'Error al obtener la marca'
            });
        }
    }

    async list(req, res) {
        try {
            if (!database.isConnected) {
                return res.json({
                    success: true,
                    data: [],
                    message: 'Modo sin base de datos; lista vacía'
                });
            }
            const brands = await Brand.find({}).sort({ createdAt: -1 }).lean();
            return res.json({
                success: true,
                data: brands,
                total: brands.length
            });
        } catch (err) {
            console.error('Error listando marcas/negocios:', err);
            res.status(500).json({
                success: false,
                message: err.message || 'Error al listar'
            });
        }
    }

    async create(req, res) {
        try {
            if (!database.isConnected) {
                return res.status(503).json({
                    success: false,
                    message: 'Base de datos no disponible'
                });
            }
            const body = req.body || {};
            const companyName = (body.companyName || body.name || '').trim();
            if (!companyName) {
                return res.status(400).json({
                    success: false,
                    message: 'companyName es requerido'
                });
            }
            const targetAudience = body.targetAudience ? {
                ageRange: body.targetAudience.ageRange ? {
                    min: Number(body.targetAudience.ageRange.min),
                    max: Number(body.targetAudience.ageRange.max)
                } : undefined,
                gender: Array.isArray(body.targetAudience.gender) ? body.targetAudience.gender : [],
                locations: Array.isArray(body.targetAudience.locations) ? body.targetAudience.locations : [],
                interests: Array.isArray(body.targetAudience.interests) ? body.targetAudience.interests : [],
                incomeLevel: body.targetAudience.incomeLevel || ''
            } : undefined;

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
                    currency: body.marketingBudget?.currency || 'USD'
                },
                preferredChannels: Array.isArray(body.preferredChannels) ? body.preferredChannels : [],
                campaignTypes: Array.isArray(body.campaignTypes) ? body.campaignTypes : [],
                status: 'active',
                userId: body.userId || null
            });
            await brand.save();
            return res.status(201).json({
                success: true,
                data: brand,
                message: 'Marca/negocio registrado'
            });
        } catch (err) {
            console.error('Error creando marca/negocio:', err);
            res.status(500).json({
                success: false,
                message: err.message || 'Error al crear'
            });
        }
    }
}

module.exports = new BrandController();
