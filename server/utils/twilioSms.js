'use strict';

/**
 * Envío de SMS por Twilio. Si faltan env vars, cae en modo stub (no falla).
 */

function twilioConfigured() {
    return Boolean(
        process.env.TWILIO_ACCOUNT_SID &&
            process.env.TWILIO_AUTH_TOKEN &&
            process.env.TWILIO_FROM_NUMBER
    );
}

async function sendSms(to, body) {
    const toNorm = String(to || '').trim();
    const msg = String(body || '').trim();
    if (!toNorm || !msg) return { ok: false, mode: 'invalid', sid: null };

    if (!twilioConfigured()) {
        // Stub mode: keep system functional until keys exist
        console.log('[twilioSms stub] to=%s body=%s', toNorm, msg);
        return { ok: true, mode: 'stub', sid: 'stub' };
    }

    // Lazy require to avoid crashing on missing dependency
    // eslint-disable-next-line global-require
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const resp = await client.messages.create({
        to: toNorm,
        from: process.env.TWILIO_FROM_NUMBER,
        body: msg,
    });
    return { ok: true, mode: 'twilio', sid: resp.sid || null };
}

module.exports = { sendSms, twilioConfigured };

