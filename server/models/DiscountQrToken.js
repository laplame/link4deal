const mongoose = require('mongoose');

const discountQrTokenSchema = new mongoose.Schema({
    tokenId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    payload: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastVerifiedAt: {
        type: Date
    },
    usedAt: {
        type: Date,
        default: null
    },
    redeemedBy: {
        readerId: String,
        readerDeviceId: String,
        note: String
    }
});

// TTL automático: Mongo borra el documento cuando expiresAt ya pasó.
discountQrTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('DiscountQrToken', discountQrTokenSchema);
