const mongoose = require('mongoose');

/**
 * Modelo de Influencer.
 * Colección: influencers. Campos alineados con InfluencerSetup y OCR.
 */
const influencerSchema = new mongoose.Schema({
    // Identificación (formulario: displayName -> name; OCR: username, handle)
    name: { type: String, trim: true },
    username: { type: String, trim: true },
    avatar: { type: String, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // Formulario: idiomas y años de experiencia
    languages: [{ type: String, trim: true }],
    experience: { type: Number, default: 0 },

    // Seguidores por red (form: socialMedia[].followers; OCR: extraer de perfil)
    followers: {
        instagram: { type: Number, default: 0 },
        tiktok: { type: Number, default: 0 },
        youtube: { type: Number, default: 0 },
        twitter: { type: Number, default: 0 }
    },
    totalFollowers: { type: Number, default: 0 },

    // Métricas (OCR o estimadas)
    engagement: { type: Number, default: 0 },
    categories: [{ type: String, trim: true }],
    status: {
        type: String,
        enum: ['active', 'pending', 'verified', 'suspended'],
        default: 'pending'
    },
    joinDate: { type: Date, default: Date.now },

    // Earnings (interno; OCR no suele tenerlo)
    totalEarnings: { type: Number, default: 0 },
    monthlyEarnings: { type: Number, default: 0 },
    completedPromotions: { type: Number, default: 0 },
    activePromotions: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },

    // Perfil (OCR: bio del perfil)
    location: { type: String, trim: true },
    bio: { type: String, trim: true },
    socialMedia: {
        instagram: String,
        tiktok: String,
        youtube: String,
        twitter: String
    },

    // Historiales (opcional; se pueden poblar desde el sistema)
    recentPromotions: [{
        id: String,
        brand: String,
        title: String,
        date: Date,
        status: String,
        earnings: Number,
        couponCode: String,
        couponUsage: Number,
        totalSales: Number
    }],
    recentPayments: [{
        id: String,
        date: Date,
        amount: Number,
        type: String,
        status: String,
        description: String
    }],
    couponStats: {
        totalCoupons: { type: Number, default: 0 },
        activeCoupons: { type: Number, default: 0 },
        totalSales: { type: Number, default: 0 },
        totalCommission: { type: Number, default: 0 },
        averageConversion: { type: Number, default: 0 }
    },

    // UI
    hot: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },

    // OCR metadata (cuando se rellene por OCR)
    ocrData: {
        extractedAt: Date,
        confidence: Number,
        source: String
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true, collection: 'influencers' });

influencerSchema.index({ username: 1 });
influencerSchema.index({ status: 1 });
influencerSchema.index({ totalFollowers: -1 });

module.exports = mongoose.model('Influencer', influencerSchema);
