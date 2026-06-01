const mongoose = require('mongoose');

/**
 * Lead / interacción capturada desde Instagram (webhook, sync Graph API o manual).
 * Colección: instagram_leads
 */
const instagramLeadSchema = new mongoose.Schema(
    {
        /** Idempotencia externa (comment id, message id, etc.) */
        externalId: { type: String, trim: true, default: null, index: true },
        source: {
            type: String,
            enum: ['webhook', 'manual', 'sync', 'import'],
            default: 'webhook',
            index: true,
        },
        eventType: {
            type: String,
            enum: [
                'comment',
                'dm',
                'story_reply',
                'mention',
                'lead_ad',
                'engagement',
                'profile_interaction',
                'other',
            ],
            default: 'other',
            index: true,
        },
        instagramUserId: { type: String, trim: true, default: null, index: true },
        instagramUsername: { type: String, trim: true, lowercase: true, default: '', index: true },
        displayName: { type: String, trim: true, default: '' },
        message: { type: String, trim: true, default: '', maxlength: 8000 },
        mediaId: { type: String, trim: true, default: null },
        mediaType: { type: String, trim: true, default: '' },
        permalink: { type: String, trim: true, default: '' },
        /** Influencer atribuido (match por @handle o asignación manual). */
        influencer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Influencer',
            default: null,
            index: true,
        },
        promotion: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Promotion',
            default: null,
            index: true,
        },
        pipelineStage: {
            type: String,
            enum: ['new', 'contacted', 'qualified', 'converted', 'dismissed'],
            default: 'new',
            index: true,
        },
        status: {
            type: String,
            enum: ['open', 'closed'],
            default: 'open',
            index: true,
        },
        adminNotes: { type: String, trim: true, default: '', maxlength: 4000 },
        assignedAdminId: { type: String, trim: true, default: null },
        receivedAt: { type: Date, default: Date.now, index: true },
        lastActivityAt: { type: Date, default: Date.now },
        rawPayload: { type: mongoose.Schema.Types.Mixed },
    },
    { timestamps: true, collection: 'instagram_leads' },
);

instagramLeadSchema.index({ instagramUsername: 1, receivedAt: -1 });
instagramLeadSchema.index({ pipelineStage: 1, status: 1, receivedAt: -1 });
instagramLeadSchema.index(
    { externalId: 1, eventType: 1 },
    { unique: true, partialFilterExpression: { externalId: { $type: 'string', $ne: '' } } },
);

module.exports = mongoose.model('InstagramLead', instagramLeadSchema);
