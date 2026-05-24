const mongoose = require('mongoose');

/**
 * Abono de tokens/comisión al influencer por canje de cupón (ledger Mongo; on-chain futuro).
 * Colección: influencer_token_settlements
 */
const influencerTokenSettlementSchema = new mongoose.Schema(
    {
        settlementId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },
        influencer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Influencer',
            required: true,
            index: true,
        },
        promotion: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Promotion',
            required: true,
            index: true,
        },
        /** tokenId de discount_qr_tokens — idempotencia por canje */
        couponTokenId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },
        shortCode: { type: String, trim: true, uppercase: true, maxlength: 16 },
        referralCode: { type: String, trim: true, maxlength: 128 },
        shopId: { type: String, trim: true },
        /** 1 token = 1 USD (narrativa producto LUXAE) */
        amountTokens: { type: Number, required: true, min: 0 },
        amountUsd: { type: Number, required: true, min: 0 },
        commissionPerRedemptionUsd: { type: Number, required: true, min: 0 },
        currency: { type: String, trim: true, default: 'USD', maxlength: 8 },
        tokenSymbol: { type: String, trim: true, default: 'LUXAE', maxlength: 16 },
        walletAddress: { type: String, trim: true, default: null },
        preferredNetwork: { type: String, trim: true, default: null },
        status: {
            type: String,
            enum: ['pending', 'processing', 'paid', 'failed', 'cancelled'],
            default: 'pending',
            index: true,
        },
        transfer: {
            method: {
                type: String,
                enum: ['mongo_ledger', 'on_chain', 'manual'],
                default: 'mongo_ledger',
            },
            paidAt: { type: Date, default: null },
            /** Referencia interna (ej. mongo-67abc...) o txHash futuro */
            txRef: { type: String, trim: true, default: null },
            note: { type: String, trim: true, maxlength: 500, default: '' },
            error: { type: String, trim: true, maxlength: 500, default: '' },
            processedBy: { type: String, trim: true, default: 'system' },
        },
        redeemedAt: { type: Date, required: true },
        source: { type: String, trim: true, default: 'coupon_redeem', maxlength: 32 },
    },
    { timestamps: true, collection: 'influencer_token_settlements' },
);

influencerTokenSettlementSchema.index({ influencer: 1, promotion: 1, status: 1 });
influencerTokenSettlementSchema.index({ influencer: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('InfluencerTokenSettlement', influencerTokenSettlementSchema);
