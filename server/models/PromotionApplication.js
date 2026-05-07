const mongoose = require('mongoose');

const portfolioFileSchema = new mongoose.Schema({
    originalName: { type: String, trim: true },
    storedName: { type: String, trim: true },
    mimeType: { type: String, trim: true },
    urlPath: { type: String, trim: true }
}, { _id: false });

const promotionApplicationSchema = new mongoose.Schema({
    promotion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Promotion',
        required: true,
        index: true
    },
    /** Perfil público Influencer que envía la solicitud (ObjectId). */
    influencerApplicant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Influencer',
        default: null,
        index: true
    },
    contentProposal: { type: String, trim: true, default: '' },
    platforms: [{ type: String, trim: true }],
    estimatedReach: { type: Number, default: 0, min: 0 },
    portfolio: [portfolioFileSchema],
    pricing: {
        type: { type: String, enum: ['fixed', 'commission', 'hybrid'], default: 'commission' },
        amount: { type: Number, default: 0 },
        currency: { type: String, trim: true, default: 'MXN' }
    },
    timeline: {
        startDate: { type: String, trim: true, default: '' },
        endDate: { type: String, trim: true, default: '' },
        deliverables: [{ type: String, trim: true }]
    },
    additionalNotes: { type: String, trim: true, default: '' },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'withdrawn'],
        default: 'pending',
        index: true
    }
}, { timestamps: true, collection: 'promotion_applications' });

promotionApplicationSchema.index({ promotion: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('PromotionApplication', promotionApplicationSchema);
