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
        required: true
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
        /** Identificador BizneAI del usuario que confirma el canje (puede coincidir con redeemedByUserId). */
        userId: { type: String, trim: true },
        /** Epoch Unix (segundos) en el dispositivo al confirmar el canje. */
        redeemedAtUnix: { type: Number },
        /** true si redeemedAtUnix está fuera de la ventana tolerada respecto al servidor (se conserva el valor del cliente). */
        redeemedAtUnixClockSkew: { type: Boolean },
        /** Epoch Unix (segundos) del fix GPS según el proveedor. */
        redeemGpsFixUnix: { type: Number },
        /** WGS84 al canje (campos explícitos BizneAI). */
        redeemLatitude: { type: Number },
        redeemLongitude: { type: Number },
        redeemGpsAccuracyMeters: { type: Number },
        /** Punto GeoJSON para consultas 2dsphere: [lng, lat]. */
        redeemLocation: {
            type: {
                type: String,
                enum: ['Point']
            },
            coordinates: { type: [Number] }
        },
        /** Coordenadas al momento del canje (si el POS o la app las envían). También pueden ir dentro de `metadata`. */
        latitude: { type: Number, default: undefined },
        longitude: { type: Number, default: undefined },
        /** Precisión declarada en metros, opcional. */
        locationAccuracyM: { type: Number, default: undefined },
        termsAccepted: { type: Boolean, default: false },
        termsAcceptedAt: Date,
        /** Texto o resumen de términos aceptados en el canje (auditoría). */
        termsSummary: String,
        /** Clave idempotente por intento de canje (p. ej. UUID v4 desde BizneAI). */
        idempotencyKey: { type: String, trim: true },
        /** Huella almacenada con el canje para detectar mismatches en replay. */
        idempotencyShopId: { type: String },
        idempotencyProductId: { type: String },
        metadata: mongoose.Schema.Types.Mixed
    }
});

// TTL automático: Mongo borra el documento cuando expiresAt ya pasó.
discountQrTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
discountQrTokenSchema.index({ 'payload.referralCode': 1 });
discountQrTokenSchema.index(
    { usedAt: -1 },
    { partialFilterExpression: { usedAt: { $type: 'date' } } }
);
discountQrTokenSchema.index(
    { 'payload.shopId': 1, 'redeemedBy.redeemedAtUnix': -1 },
    { partialFilterExpression: { 'redeemedBy.redeemedAtUnix': { $exists: true } } }
);
discountQrTokenSchema.index(
    { 'redeemedBy.redeemLocation': '2dsphere' },
    { partialFilterExpression: { 'redeemedBy.redeemLocation': { $exists: true } } }
);
/** Dedupe lógico: un cupón (tokenId) con misma clave de idempotencia no debería duplicarse (un doc = un token). */
discountQrTokenSchema.index(
    { tokenId: 1, 'redeemedBy.idempotencyKey': 1 },
    {
        unique: true,
        partialFilterExpression: {
            usedAt: { $type: 'date' },
            'redeemedBy.idempotencyKey': { $type: 'string', $gt: '' }
        }
    }
);

module.exports = mongoose.model('DiscountQrToken', discountQrTokenSchema);
