const mongoose = require('mongoose');

const kycWhatsappVerificationSchema = new mongoose.Schema({
    verificationId: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true
    },
    phoneE164: {
        type: String,
        required: true,
        index: true,
        trim: true
    },
    provider: {
        type: String,
        enum: ['cloud', 'twilio', 'mock'],
        default: 'cloud'
    },
    codeHash: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'verified', 'expired', 'blocked'],
        default: 'pending',
        index: true
    },
    attempts: {
        type: Number,
        default: 0
    },
    maxAttempts: {
        type: Number,
        default: 5
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true
    },
    verifiedAt: Date,
    ipAddress: String,
    userAgent: String,
    twilioSid: String,
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { collection: 'kyc_whatsapp_verifications' });

kycWhatsappVerificationSchema.pre('save', function updateTimestamp(next) {
    this.updatedAt = new Date();
    next();
});

kycWhatsappVerificationSchema.index({ phoneE164: 1, status: 1, createdAt: -1 });

module.exports = mongoose.models.KycWhatsappVerification ||
    mongoose.model('KycWhatsappVerification', kycWhatsappVerificationSchema);
