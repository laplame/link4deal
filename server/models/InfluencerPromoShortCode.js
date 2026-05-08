/**
 * Cupón rápido: código corto (app / buscador) → influencer + promoción fijos.
 * Colección: influencer_promo_short_codes
 */
const mongoose = require('mongoose');

const influencerPromoShortCodeSchema = new mongoose.Schema(
    {
        /** Ej. ABC12XY9 — normalizadomayúsculas,sin caracteresraros */
        code: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            maxlength: 16,
            index: true,
        },
        influencer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Influencer',
            required: true,
            index: true,
        },
        promotion: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Promotion',
            required: true,
            index: true,
        },
        /** Nota interna (“Café día madres DameCodigo”) */
        label: { type: String, trim: true, maxlength: 200, default: '' },
        active: { type: Boolean, default: true },
        /** Si llega fecha y ya pasó, resolve/issue devuelven 410 */
        expiresAt: { type: Date, default: null },
        /**
         * Si la app no envía referralCode al emitir cupón, se usa:
         *   referralCodePrefix + code (slug) o sólo código.
         */
        referralPrefix: { type: String, trim: true, maxlength: 32, default: 'L4D' },
    },
    { timestamps: true, collection: 'influencer_promo_short_codes' }
);

influencerPromoShortCodeSchema.index({ influencer: 1, promotion: 1 });

influencerPromoShortCodeSchema.pre('save', function normalizeShortCode(next) {
    if (this.code) {
        this.code = String(this.code)
            .trim()
            .toUpperCase()
            .replace(/[^0-9A-Z]/g, '');
    }
    next();
});

module.exports = mongoose.model('InfluencerPromoShortCode', influencerPromoShortCodeSchema);
