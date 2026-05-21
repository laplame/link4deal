const mongoose = require('mongoose');

/**
 * Un documento por influencer: pipeline de activación y registro de envíos
 * (app, términos, enlace de perfil, episodio, etc.).
 */
const deliverySchema = new mongoose.Schema(
    {
        /** Clave estable (ej. spotify_episode_2026_05) para no duplicar. */
        deliveryKey: { type: String, trim: true, required: true },
        type: {
            type: String,
            enum: [
                'spotify_episode',
                'pitch_message',
                'profile_link',
                'profile_confirmation',
                'app_link',
                'terms_document',
                'terms_and_app_bundle',
                'bizneai_link',
                'other',
            ],
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'sent', 'delivered', 'opened', 'failed', 'cancelled'],
            default: 'pending',
        },
        channel: {
            type: String,
            enum: ['whatsapp', 'email', 'instagram', 'sms', 'phone', 'in_app', 'other'],
            default: 'whatsapp',
        },
        title: { type: String, trim: true, maxlength: 200, default: '' },
        url: { type: String, trim: true, maxlength: 2048, default: '' },
        sentAt: { type: Date, default: null },
        notes: { type: String, trim: true, maxlength: 2000, default: '' },
        metadata: { type: mongoose.Schema.Types.Mixed },
    },
    { _id: true },
);

const influencerCrmOutreachSchema = new mongoose.Schema(
    {
        influencerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Influencer',
            required: true,
            unique: true,
            index: true,
        },
        /** Slug público /influencer/:slug */
        publicSlug: { type: String, trim: true, default: '' },
        primaryChannel: {
            type: String,
            enum: ['whatsapp', 'email', 'instagram', 'sms', 'phone', 'other'],
            default: 'whatsapp',
        },
        pipelineStage: {
            type: String,
            enum: [
                'lead',
                'contacted',
                'profile_confirmed',
                'in_database',
                'profile_link_sent',
                'awaiting_contact_email',
                'app_link_sent',
                'terms_sent',
                'materials_complete',
                'onboarded',
                'stalled',
                'inactive',
            ],
            default: 'lead',
        },
        contactEmail: { type: String, trim: true, lowercase: true, default: '' },
        contactEmailStatus: {
            type: String,
            enum: ['not_requested', 'requested', 'received', 'verified'],
            default: 'not_requested',
        },
        contactEmailRequestedAt: { type: Date, default: null },
        contactEmailReceivedAt: { type: Date, default: null },
        profilePublicUrl: { type: String, trim: true, maxlength: 512, default: '' },
        profileConfirmedAt: { type: Date, default: null },
        profileInDbAt: { type: Date, default: null },
        nextAction: { type: String, trim: true, maxlength: 500, default: '' },
        nextActionDueAt: { type: Date, default: null },
        conversationSummary: { type: String, trim: true, maxlength: 4000, default: '' },
        deliveries: [deliverySchema],
        lastOutboundAt: { type: Date, default: null },
        lastInboundAt: { type: Date, default: null },
        updatedByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    { timestamps: true, collection: 'influencer_crm_outreach' },
);

influencerCrmOutreachSchema.index({ pipelineStage: 1 });
influencerCrmOutreachSchema.index({ 'deliveries.type': 1, 'deliveries.status': 1 });

module.exports =
    mongoose.models.InfluencerCrmOutreach ||
    mongoose.model('InfluencerCrmOutreach', influencerCrmOutreachSchema);
