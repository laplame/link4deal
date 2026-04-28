const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const KycWhatsappVerification = require('../models/KycWhatsappVerification');
const database = require('../config/database');

const router = express.Router();

const OTP_TTL_MINUTES = Number(process.env.KYC_WHATSAPP_OTP_TTL_MINUTES || 10);
const MAX_ATTEMPTS = Number(process.env.KYC_WHATSAPP_MAX_ATTEMPTS || 5);
const PHONE_WINDOW_MS = 15 * 60 * 1000;
const MAX_CODES_PER_PHONE_WINDOW = Number(process.env.KYC_WHATSAPP_MAX_CODES_PER_15_MIN || 3);
const DEFAULT_MOCK_CODE = '123456';

function createVerificationId() {
    return `wh_${Date.now().toString(36)}_${crypto.randomBytes(8).toString('hex')}`;
}

function generateSixDigitCode() {
    return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

function getOtpCode(provider) {
    const mockCode = String(process.env.KYC_WHATSAPP_MOCK_CODE || '').trim();
    if (provider === 'mock' && /^\d{6}$/.test(mockCode)) {
        return mockCode;
    }
    if (provider === 'mock') {
        return DEFAULT_MOCK_CODE;
    }
    return generateSixDigitCode();
}

function normalizePhone(raw) {
    const cleaned = String(raw || '').trim().replace(/[^\d+]/g, '');
    if (!cleaned) return null;

    let phone = cleaned;
    if (!phone.startsWith('+')) {
        const defaultCountryCode = String(process.env.KYC_WHATSAPP_DEFAULT_COUNTRY_CODE || '+52').trim();
        phone = `${defaultCountryCode.startsWith('+') ? defaultCountryCode : `+${defaultCountryCode}`}${phone}`;
    }

    if (!/^\+\d{8,15}$/.test(phone)) return null;
    return phone;
}

function getOtpHashSecret() {
    const configuredSecret = process.env.OTP_HASH_SECRET || process.env.QR_HMAC_SECRET || process.env.JWT_SECRET || '';
    if (configuredSecret) return configuredSecret;
    return isMockAllowed() ? 'link4deal-kyc-whatsapp-relaxed-local' : '';
}

function hashOtp(phoneE164, code) {
    const secret = getOtpHashSecret();
    if (!secret) {
        const err = new Error('OTP_HASH_SECRET no configurado');
        err.status = 500;
        throw err;
    }

    return crypto
        .createHmac('sha256', secret)
        .update(`${phoneE164}:${String(code).trim()}`)
        .digest('hex');
}

function getProvider() {
    const configured = String(process.env.KYC_WHATSAPP_PROVIDER || '').toLowerCase();
    if (['twilio', 'cloud', 'mock'].includes(configured)) return configured;

    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID) {
        return 'twilio';
    }
    if (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_TEMPLATE_NAME) {
        return 'cloud';
    }
    return 'mock';
}

function isMockAllowed() {
    return process.env.NODE_ENV !== 'production' ||
        process.env.KYC_WHATSAPP_ALLOW_MOCK === 'true' ||
        process.env.KYC_WHATSAPP_RELAXED_MODE === 'true';
}

function isBypassVerifyAllowed() {
    return isMockAllowed() && process.env.KYC_WHATSAPP_BYPASS_VERIFY === 'true';
}

async function sendWithTwilioVerify(phoneE164) {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID } = process.env;
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
        const err = new Error('Twilio Verify no configurado');
        err.status = 500;
        throw err;
    }

    const url = `https://verify.twilio.com/v2/Services/${encodeURIComponent(TWILIO_VERIFY_SERVICE_SID)}/Verifications`;
    const params = new URLSearchParams();
    params.set('To', phoneE164);
    params.set('Channel', 'whatsapp');

    const { data } = await axios.post(url, params, {
        auth: {
            username: TWILIO_ACCOUNT_SID,
            password: TWILIO_AUTH_TOKEN
        },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 20000
    });

    return data?.sid || null;
}

async function verifyWithTwilio(phoneE164, code) {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID } = process.env;
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
        const err = new Error('Twilio Verify no configurado');
        err.status = 500;
        throw err;
    }

    const url = `https://verify.twilio.com/v2/Services/${encodeURIComponent(TWILIO_VERIFY_SERVICE_SID)}/VerificationCheck`;
    const params = new URLSearchParams();
    params.set('To', phoneE164);
    params.set('Code', String(code).trim());

    const { data } = await axios.post(url, params, {
        auth: {
            username: TWILIO_ACCOUNT_SID,
            password: TWILIO_AUTH_TOKEN
        },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 20000
    });

    return data?.status === 'approved';
}

async function sendWithWhatsappCloud(phoneE164, code) {
    const {
        WHATSAPP_ACCESS_TOKEN,
        WHATSAPP_PHONE_NUMBER_ID,
        WHATSAPP_TEMPLATE_NAME,
        WHATSAPP_TEMPLATE_LANGUAGE = 'es_MX'
    } = process.env;

    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_TEMPLATE_NAME) {
        const err = new Error('WhatsApp Cloud API no configurada');
        err.status = 500;
        throw err;
    }

    const url = `https://graph.facebook.com/v20.0/${encodeURIComponent(WHATSAPP_PHONE_NUMBER_ID)}/messages`;
    await axios.post(
        url,
        {
            messaging_product: 'whatsapp',
            to: phoneE164.replace(/^\+/, ''),
            type: 'template',
            template: {
                name: WHATSAPP_TEMPLATE_NAME,
                language: { code: WHATSAPP_TEMPLATE_LANGUAGE },
                components: [
                    {
                        type: 'body',
                        parameters: [{ type: 'text', text: code }]
                    }
                ]
            }
        },
        {
            headers: {
                Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            timeout: 20000
        }
    );
}

async function sendWhatsappOtp(provider, phoneE164, code) {
    if (provider === 'twilio') {
        return { twilioSid: await sendWithTwilioVerify(phoneE164) };
    }
    if (provider === 'cloud') {
        await sendWithWhatsappCloud(phoneE164, code);
        return {};
    }

    if (!isMockAllowed()) {
        const err = new Error('Proveedor WhatsApp no configurado');
        err.status = 500;
        throw err;
    }

    return {};
}

router.post('/request-code', async (req, res) => {
    try {
        if (!database.isConnected) {
            return res.status(503).json({ success: false, message: 'Base de datos no disponible' });
        }

        const phoneE164 = normalizePhone(req.body?.phone);
        if (!phoneE164) {
            return res.status(400).json({ success: false, message: 'Telefono invalido' });
        }

        const since = new Date(Date.now() - PHONE_WINDOW_MS);
        const recentCount = await KycWhatsappVerification.countDocuments({
            phoneE164,
            createdAt: { $gte: since }
        });
        if (recentCount >= MAX_CODES_PER_PHONE_WINDOW) {
            return res.status(429).json({ success: false, message: 'Demasiados codigos solicitados. Intenta mas tarde.' });
        }

        const provider = getProvider();
        const code = getOtpCode(provider);
        const verificationId = createVerificationId();
        const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
        const codeHash = provider === 'twilio' ? '' : hashOtp(phoneE164, code);

        await KycWhatsappVerification.updateMany(
            { phoneE164, status: 'pending' },
            { $set: { status: 'expired', updatedAt: new Date() } }
        );

        const sendResult = await sendWhatsappOtp(provider, phoneE164, code);

        await KycWhatsappVerification.create({
            verificationId,
            phoneE164,
            provider,
            codeHash,
            status: 'pending',
            attempts: 0,
            maxAttempts: MAX_ATTEMPTS,
            expiresAt,
            ipAddress: req.ip,
            userAgent: req.get('user-agent') || '',
            twilioSid: sendResult.twilioSid || ''
        });

        const responseData = { verificationId, expiresAt };
        if (provider === 'mock' && isMockAllowed()) {
            responseData.mockMode = true;
            if (process.env.NODE_ENV !== 'production') {
                responseData.devCode = code;
            }
        }

        return res.json({
            success: true,
            message: 'Codigo enviado por WhatsApp',
            data: responseData
        });
    } catch (err) {
        console.error('Error solicitando OTP WhatsApp KYC:', err.message);
        return res.status(err.status || 500).json({
            success: false,
            message: 'No se pudo enviar el codigo'
        });
    }
});

router.post('/verify-code', async (req, res) => {
    try {
        if (!database.isConnected) {
            return res.status(503).json({ success: false, message: 'Base de datos no disponible' });
        }

        const phoneE164 = normalizePhone(req.body?.phone);
        const code = String(req.body?.code || '').trim();
        const verificationId = String(req.body?.verificationId || '').trim();

        if (!phoneE164 || !/^\d{6}$/.test(code) || !verificationId) {
            return res.status(400).json({ success: false, message: 'Codigo invalido o expirado' });
        }

        const verification = await KycWhatsappVerification.findOne({
            verificationId,
            phoneE164,
            status: 'pending'
        });

        if (!verification) {
            return res.status(400).json({ success: false, message: 'Codigo invalido o expirado' });
        }

        if (verification.expiresAt < new Date()) {
            verification.status = 'expired';
            await verification.save();
            return res.status(400).json({ success: false, message: 'Codigo invalido o expirado' });
        }

        if (verification.attempts >= verification.maxAttempts) {
            verification.status = 'blocked';
            await verification.save();
            return res.status(429).json({ success: false, message: 'Demasiados intentos' });
        }

        verification.attempts += 1;
        let isValid = false;
        if (verification.provider === 'mock' && isBypassVerifyAllowed()) {
            isValid = true;
        } else if (verification.provider === 'twilio') {
            isValid = await verifyWithTwilio(phoneE164, code);
        } else {
            isValid = verification.codeHash === hashOtp(phoneE164, code);
        }

        if (!isValid) {
            if (verification.attempts >= verification.maxAttempts) {
                verification.status = 'blocked';
            }
            await verification.save();
            return res.status(400).json({ success: false, message: 'Codigo invalido o expirado' });
        }

        verification.status = 'verified';
        verification.verifiedAt = new Date();
        await verification.save();

        return res.json({
            success: true,
            message: 'WhatsApp verificado',
            data: {
                verified: true,
                verifiedAt: verification.verifiedAt
            }
        });
    } catch (err) {
        console.error('Error verificando OTP WhatsApp KYC:', err.message);
        return res.status(err.status || 500).json({
            success: false,
            message: 'Codigo invalido o expirado'
        });
    }
});

module.exports = router;
