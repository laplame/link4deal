const mongoose = require('mongoose');

/**
 * Clicks outbound (Quick promotion redirect) desde la tienda/perfil del influencer.
 * Colección: influencer_outbound_clicks
 */
const influencerOutboundClickSchema = new mongoose.Schema(
    {
        clickId: { type: String, required: true, unique: true, trim: true, index: true },
        influencer: { type: mongoose.Schema.Types.ObjectId, ref: 'Influencer', required: true, index: true },
        promotion: { type: mongoose.Schema.Types.ObjectId, ref: 'Promotion', required: true, index: true },
        catalogProductId: { type: String, trim: true, default: null },
        targetUrl: { type: String, trim: true, required: true },
        page: { type: String, trim: true, default: 'influencer_store', maxlength: 64 },
        referrer: { type: String, trim: true, default: null, maxlength: 512 },
        userAgent: { type: String, trim: true, default: null, maxlength: 512 },
        ip: { type: String, trim: true, default: null, maxlength: 64 },
        createdAt: { type: Date, default: Date.now, index: true },

        // Conversión validada en dashboard (manual)
        convertedAt: { type: Date, default: null, index: true },
        convertedBy: { type: String, trim: true, default: null, maxlength: 128 },
        conversionAmountUsd: { type: Number, default: null, min: 0 },
        settlementId: { type: String, trim: true, default: null, maxlength: 64 },
    },
    { timestamps: true, collection: 'influencer_outbound_clicks' },
);

influencerOutboundClickSchema.index({ influencer: 1, createdAt: -1 });
influencerOutboundClickSchema.index({ promotion: 1, createdAt: -1 });
influencerOutboundClickSchema.index({ convertedAt: -1 });

module.exports = mongoose.model('InfluencerOutboundClick', influencerOutboundClickSchema);

