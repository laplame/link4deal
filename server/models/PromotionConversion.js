const mongoose = require('mongoose');

/**
 * Registro de conversión/éxito de una promoción con atribución a influencer.
 * Cuando ninguna influencer reclama la promoción, se atribuye a "Influencer General".
 */
const promotionConversionSchema = new mongoose.Schema({
    promotion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Promotion',
        required: true,
        index: true
    },
    /** Influencer al que se atribuye la conversión; null = Influencer General (no reclamada por nadie). */
    influencer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Influencer',
        default: null,
        index: true
    },
    quantity: {
        type: Number,
        default: 1,
        min: 0
    },
    amountUsd: {
        type: Number,
        default: null,
        min: 0
    },
    source: {
        type: String,
        enum: ['redemption', 'manual', 'general'],
        default: 'general'
    },
    note: { type: String, trim: true },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true, collection: 'promotion_conversions' });

promotionConversionSchema.index({ promotion: 1, createdAt: -1 });
promotionConversionSchema.index({ influencer: 1, createdAt: -1 });

module.exports = mongoose.model('PromotionConversion', promotionConversionSchema);
