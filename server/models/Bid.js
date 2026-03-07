const mongoose = require('mongoose');

/**
 * Puja del influencer sobre una promoción: comisión por venta (USD).
 * Se usa para listar "pujas" en el perfil del influencer y en estadísticas.
 */
const bidSchema = new mongoose.Schema({
    influencer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Influencer',
        required: true,
        index: true
    },
    promotion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Promotion',
        required: true,
        index: true
    },
    /** Comisión por venta en USD (ej. 1.2, 1.35). */
    amountUsd: {
        type: Number,
        required: true,
        min: [1, 'Mínimo $1 USD por venta']
    },
    status: {
        type: String,
        enum: ['active', 'won', 'lost', 'expired'],
        default: 'active',
        index: true
    },
    /** Historial opcional para gráficas: [{ amount, timestamp }] */
    bidHistory: [{
        amount: { type: Number, default: 0 },
        timestamp: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true, collection: 'bids' });

bidSchema.index({ influencer: 1, promotion: 1 }, { unique: true });
bidSchema.index({ promotion: 1, status: 1 });

module.exports = mongoose.model('Bid', bidSchema);
