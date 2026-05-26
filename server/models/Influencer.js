const mongoose = require('mongoose');

/**
 * Modelo de Influencer.
 * Colección: influencers. Campos alineados con InfluencerSetup y OCR.
 */
const influencerSchema = new mongoose.Schema({
    // Identificación (formulario: displayName -> name; OCR: username, handle)
    name: { type: String, trim: true },
    username: { type: String, trim: true },
    /** Código alfanumérico corto único (misma familia que códigos promo); se asigna al alta y en lecturas de perfil si faltaba. */
    profileShortCode: { type: String, trim: true, uppercase: true, maxlength: 16, default: undefined },
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
    /**
     * Verificación manual por super admin: ¿la cuenta User que pidió acceso es el influencer del perfil?
     * El perfil público puede verse con `pending`; el dashboard de app exige `approved`.
     */
    identityVerificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        index: true,
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

    /**
     * Escaparate público UGC: enlaces a piezas en redes (sin embeds) + frases del creador.
     * Editable por el influencer vinculado vía PATCH /api/influencers/me/ugc-profile
     */
    ugcProfile: {
        enabled: { type: Boolean, default: false },
        headline: { type: String, trim: true, default: '', maxlength: 120 },
        intro: { type: String, trim: true, default: '', maxlength: 2000 },
        quotes: [
            {
                text: { type: String, trim: true, maxlength: 550 },
            },
        ],
        videos: [
            {
                url: { type: String, trim: true, maxlength: 2048 },
                platform: {
                    type: String,
                    enum: ['instagram', 'tiktok', 'youtube', 'facebook', 'twitter', 'linkedin', 'pinterest', 'other'],
                    default: 'other',
                },
                label: { type: String, trim: true, maxlength: 140 },
                sortOrder: { type: Number, default: 0 },
            },
        ],
    },

    /** CRM super_admin: activación, términos, apps instaladas, notas. */
    crm: {
        activationStatus: {
            type: String,
            enum: [
                'not_started',
                'onboarding',
                'pending_review',
                'active',
                'verified',
                'suspended',
                'inactive',
            ],
            default: 'not_started',
        },
        dataSubmissionStatus: {
            type: String,
            enum: ['not_started', 'incomplete', 'partial', 'complete'],
            default: 'not_started',
        },
        profileCompleteness: { type: Number, default: 0, min: 0, max: 100 },
        terms: {
            accepted: { type: Boolean, default: false },
            acceptedAt: { type: Date, default: null },
            version: { type: String, trim: true, default: '' },
            summary: { type: String, trim: true, maxlength: 2000, default: '' },
        },
        apps: {
            damecodigoInfluencer: {
                installCount: { type: Number, default: 0, min: 0 },
                firstInstallAt: { type: Date, default: null },
                lastOpenAt: { type: Date, default: null },
                lastVersion: { type: String, trim: true, default: '' },
                lastPlatform: { type: String, trim: true, default: '' },
            },
            bizneaiMerchant: {
                installCount: { type: Number, default: 0, min: 0 },
                firstInstallAt: { type: Date, default: null },
                lastOpenAt: { type: Date, default: null },
                lastVersion: { type: String, trim: true, default: '' },
                lastPlatform: { type: String, trim: true, default: '' },
            },
        },
        onboardingStep: { type: String, trim: true, default: '' },
        adminNotes: { type: String, trim: true, maxlength: 8000, default: '' },
        /**
         * Evidencia para verificación manual: screenshot del perfil social (lo sube el influencer desde la app).
         * El super admin lo revisa en /admin/crm.
         */
        verification: {
            screenshotUrl: { type: String, trim: true, default: '' },
            screenshotUploadedAt: { type: Date, default: null },
            /** Texto libre opcional: link al perfil o nota del influencer. */
            note: { type: String, trim: true, maxlength: 500, default: '' },
            reviewedAt: { type: Date, default: null },
            reviewedByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
            adminDecisionNote: { type: String, trim: true, maxlength: 2000, default: '' },
        },
        lastContactAt: { type: Date, default: null },
        updatedByAdminAt: { type: Date, default: null },
    },

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
influencerSchema.index({ profileShortCode: 1 }, { unique: true, sparse: true });
influencerSchema.index({ status: 1 });
influencerSchema.index({ totalFollowers: -1 });

influencerSchema.pre('save', function normalizeProfileShortCode(next) {
    if (this.profileShortCode) {
        this.profileShortCode = String(this.profileShortCode)
            .trim()
            .toUpperCase()
            .replace(/[^0-9A-Z]/g, '');
    }
    next();
});

module.exports = mongoose.model('Influencer', influencerSchema);
