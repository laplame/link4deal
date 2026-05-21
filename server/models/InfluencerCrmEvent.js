const mongoose = require('mongoose');

/** Eventos CRM: instalaciones, aperturas, términos, cambios admin. */
const influencerCrmEventSchema = new mongoose.Schema(
    {
        influencerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Influencer',
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },
        /** damecodigo_influencer | bizneai_merchant | web */
        appKey: {
            type: String,
            trim: true,
            index: true,
        },
        eventType: {
            type: String,
            enum: ['install', 'open', 'terms_accepted', 'profile_submitted', 'admin_update', 'data_export'],
            required: true,
            index: true,
        },
        platform: { type: String, trim: true, maxlength: 32 },
        appVersion: { type: String, trim: true, maxlength: 32 },
        deviceId: { type: String, trim: true, maxlength: 128 },
        termsVersion: { type: String, trim: true, maxlength: 64 },
        metadata: { type: mongoose.Schema.Types.Mixed },
        ip: { type: String, trim: true, maxlength: 64 },
        userAgent: { type: String, trim: true, maxlength: 512 },
    },
    { timestamps: true, collection: 'influencer_crmevents' },
);

influencerCrmEventSchema.index({ influencerId: 1, appKey: 1, eventType: 1, createdAt: -1 });
influencerCrmEventSchema.index({ createdAt: -1 });

module.exports =
    mongoose.models.InfluencerCrmEvent ||
    mongoose.model('InfluencerCrmEvent', influencerCrmEventSchema);
