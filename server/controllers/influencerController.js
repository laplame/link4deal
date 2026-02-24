const Influencer = require('../models/Influencer');
const database = require('../config/database');
const mongoose = require('mongoose');

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

            const query = {};
            if (status) query.status = status;

            const skip = (page - 1) * limit;
            const [docs, totalDocs] = await Promise.all([
                Influencer.find(query).sort({ totalFollowers: -1 }).skip(skip).limit(limit).lean(),
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

            const doc = await Influencer.findById(id).lean();
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
            console.error('❌ Error obteniendo influencer:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
}

const controller = new InfluencerController();
module.exports = controller;
