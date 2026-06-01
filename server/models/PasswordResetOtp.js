const mongoose = require('mongoose');

/**
 * OTP para recuperación de contraseña vía SMS (Twilio).
 * Colección: password_reset_otps
 */
const passwordResetOtpSchema = new mongoose.Schema(
    {
        phone: { type: String, required: true, trim: true, index: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        otpHash: { type: String, required: true, trim: true },
        expiresAt: { type: Date, required: true, index: true },
        attempts: { type: Number, default: 0, min: 0 },
        verifiedAt: { type: Date, default: null },
        consumedAt: { type: Date, default: null },
        lastSentAt: { type: Date, default: null },
        sendCount: { type: Number, default: 0, min: 0 },
    },
    { timestamps: true, collection: 'password_reset_otps' },
);

// TTL
passwordResetOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
passwordResetOtpSchema.index({ phone: 1, user: 1, expiresAt: -1 });

module.exports = mongoose.model('PasswordResetOtp', passwordResetOtpSchema);

