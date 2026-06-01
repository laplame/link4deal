const mongoose = require('mongoose');

/**
 * Conexión Instagram Business vía Meta (Graph API).
 * Colección: instagram_connections
 */
const instagramConnectionSchema = new mongoose.Schema(
    {
        /** Si null = cuenta de la plataforma (marca). Si set = vinculada a un influencer. */
        influencer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Influencer',
            default: null,
        },
        instagramBusinessAccountId: { type: String, trim: true, default: null, index: true },
        facebookPageId: { type: String, trim: true, default: null },
        igUsername: { type: String, trim: true, lowercase: true, default: '' },
        accessToken: { type: String, select: false, default: null },
        tokenExpiresAt: { type: Date, default: null },
        scopes: [{ type: String, trim: true }],
        status: {
            type: String,
            enum: ['disconnected', 'pending', 'connected', 'expired', 'error'],
            default: 'disconnected',
            index: true,
        },
        webhookSubscribed: { type: Boolean, default: false },
        lastSyncAt: { type: Date, default: null },
        lastError: { type: String, trim: true, default: '' },
        metadata: { type: mongoose.Schema.Types.Mixed },
    },
    { timestamps: true, collection: 'instagram_connections' },
);

instagramConnectionSchema.index({ influencer: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('InstagramConnection', instagramConnectionSchema);
