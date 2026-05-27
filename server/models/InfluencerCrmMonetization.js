const mongoose = require('mongoose');

/**
 * Pipeline post-onboarding: monetización (campañas, canjes, abonos).
 * Un documento por influencer (paralelo a influencer_crm_outreach).
 */
const influencerCrmMonetizationSchema = new mongoose.Schema(
    {
        influencerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Influencer',
            required: true,
            unique: true,
            index: true,
        },
        monetizationStage: {
            type: String,
            enum: [
                'ready',
                'wallet_setup',
                'seeking_campaigns',
                'coupons_live',
                'first_redemption',
                'payout_pending',
                'payout_active',
                'scaling',
                'stalled',
                'inactive',
            ],
            default: 'ready',
        },
        nextAction: { type: String, trim: true, maxlength: 500, default: '' },
        notes: { type: String, trim: true, maxlength: 4000, default: '' },
        updatedByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    { timestamps: true, collection: 'influencer_crm_monetization' },
);

influencerCrmMonetizationSchema.index({ monetizationStage: 1 });

module.exports =
    mongoose.models.InfluencerCrmMonetization ||
    mongoose.model('InfluencerCrmMonetization', influencerCrmMonetizationSchema);
