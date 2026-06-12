const mongoose = require('mongoose');

const influencerWaitlistEntrySchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            maxlength: 320,
            index: true,
        },
        name: { type: String, trim: true, default: '', maxlength: 120 },
        /** @deprecated usar primarySocialPlatform + primarySocialHandle; se mantiene si plataforma = instagram */
        instagramHandle: { type: String, trim: true, default: '', maxlength: 80 },
        /** Red principal: la de más seguidores o preferida */
        primarySocialPlatform: {
            type: String,
            enum: ['', 'instagram', 'tiktok', 'youtube', 'twitter', 'facebook', 'twitch', 'other'],
            default: '',
        },
        primarySocialHandle: { type: String, trim: true, default: '', maxlength: 80 },
        city: { type: String, trim: true, default: '', maxlength: 120 },
        niche: { type: String, trim: true, default: '', maxlength: 120 },
        status: {
            type: String,
            enum: ['pending', 'tester_invited', 'installed', 'dismissed'],
            default: 'pending',
            index: true,
        },
        /** Mismo correo debe usarse en la cuenta de Google Play para closed testing. */
        googleAccountEmailNote: { type: String, trim: true, default: '' },
        testerInvitedAt: { type: Date, default: null },
        source: { type: String, trim: true, default: 'influencer_waitlist_landing' },
        utmSource: { type: String, trim: true, default: '' },
        utmMedium: { type: String, trim: true, default: '' },
        utmCampaign: { type: String, trim: true, default: '' },
        referrer: { type: String, trim: true, default: '' },
        landingPath: { type: String, trim: true, default: '/influencer/waitlist' },
        ipHash: { type: String, trim: true, default: '' },
        userAgent: { type: String, trim: true, default: '', maxlength: 500 },
    },
    { timestamps: true, collection: 'influencer_waitlist' }
);

influencerWaitlistEntrySchema.index({ email: 1 }, { unique: true });
influencerWaitlistEntrySchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('InfluencerWaitlistEntry', influencerWaitlistEntrySchema);
