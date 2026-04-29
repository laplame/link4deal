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
        note: String,
        /** Usuario del punto de venta que procesó el canje (cajero / cuenta POS). */
        redeemedByUserId: String,
        redeemedByUserName: String,
        /** Usuario final titular del cupón, si la app lo conoce. */
        customerUserId: String,
        customerUserName: String,
        /** Dispositivo del cliente (app móvil) al momento del canje. */
        customerDeviceId: String,
        termsAccepted: { type: Boolean, default: false },
        termsAcceptedAt: Date,
        /** Texto o resumen de términos aceptados en el canje (auditoría). */
        termsSummary: String,
        metadata: mongoose.Schema.Types.Mixed
    }
});

// TTL automático: Mongo borra el documento cuando expiresAt ya pasó.
discountQrTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
discountQrTokenSchema.index({ 'payload.referralCode': 1 });

module.exports = mongoose.model('DiscountQrToken', discountQrTokenSchema);
