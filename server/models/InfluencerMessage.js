const mongoose = require('mongoose');

/**
 * Mensajes enviados a un influencer desde la página "Contactar influencer".
 * El influencer los ve al iniciar sesión en su cuenta (inbox).
 */
const influencerMessageSchema = new mongoose.Schema({
    influencerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Influencer',
        required: true,
        index: true
    },
    senderUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    senderName: { type: String, trim: true },
    senderEmail: { type: String, trim: true, lowercase: true },
    message: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true, collection: 'influencer_messages' });

influencerMessageSchema.index({ influencerId: 1, createdAt: -1 });

module.exports = mongoose.model('InfluencerMessage', influencerMessageSchema);
