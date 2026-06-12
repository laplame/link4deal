const mongoose = require('mongoose');

/**
 * Visita atribuida a un influencer (entrada por su URL + páginas vistas en la misma sesión).
 * Colección: influencer_traffic_visits
 */
const influencerTrafficVisitSchema = new mongoose.Schema(
    {
        visitId: { type: String, required: true, unique: true, trim: true, index: true },
        influencer: { type: mongoose.Schema.Types.ObjectId, ref: 'Influencer', required: true, index: true },
        influencerSlug: { type: String, trim: true, default: '', maxlength: 120, index: true },
        sessionId: { type: String, trim: true, required: true, maxlength: 64, index: true },
        visitorId: { type: String, trim: true, default: null, maxlength: 64, index: true },
        /** true = primera URL del influencer en esta sesión */
        isEntry: { type: Boolean, default: false, index: true },
        entryType: {
            type: String,
            enum: ['profile', 'store', 'promo', 'coupon', 'faq', 'edit', 'auth', 'other'],
            default: 'profile',
        },
        /** Canal de la visita (perfil, tienda, promo, cupón…) para reportes en el perfil */
        visitChannel: {
            type: String,
            enum: ['profile', 'store', 'promo', 'coupon', 'faq', 'edit', 'auth', 'other'],
            default: 'profile',
            index: true,
        },
        /** ID de promoción si la ruta es /promo/:id */
        promoId: { type: String, trim: true, default: null, maxlength: 24, index: true },
        /** Ruta del enlace del influencer por el que entraron (sesión) */
        entryPath: { type: String, trim: true, required: true, maxlength: 512 },
        /** Página vista en este evento */
        pagePath: { type: String, trim: true, required: true, maxlength: 512, index: true },
        pageTitle: { type: String, trim: true, default: '', maxlength: 256 },
        pageLocation: { type: String, trim: true, default: '', maxlength: 768 },
        referrer: { type: String, trim: true, default: null, maxlength: 512 },
        utmSource: { type: String, trim: true, default: '', maxlength: 120 },
        utmMedium: { type: String, trim: true, default: '', maxlength: 120 },
        utmCampaign: { type: String, trim: true, default: '', maxlength: 160 },
        utmTerm: { type: String, trim: true, default: '', maxlength: 120 },
        utmContent: { type: String, trim: true, default: '', maxlength: 120 },
        inAppBrowser: { type: String, trim: true, default: null, maxlength: 32 },
        userAgent: { type: String, trim: true, default: null, maxlength: 512 },
    },
    { timestamps: true, collection: 'influencer_traffic_visits' },
);

influencerTrafficVisitSchema.index({ influencer: 1, createdAt: -1 });
influencerTrafficVisitSchema.index({ influencer: 1, pagePath: 1, createdAt: -1 });
influencerTrafficVisitSchema.index({ influencer: 1, entryPath: 1, createdAt: -1 });
influencerTrafficVisitSchema.index({ sessionId: 1, createdAt: -1 });

module.exports = mongoose.model('InfluencerTrafficVisit', influencerTrafficVisitSchema);
