'use strict';

const express = require('express');
const database = require('../config/database');
const { handleIncomingMessage } = require('../utils/claudeOnboardingBot');

const router = express.Router();

/**
 * Valida que la petición venga de Twilio usando X-Twilio-Signature.
 * Reconstruye la URL pública real (detrás de nginx) con los headers X-Forwarded-*.
 * Si no hay TWILIO_AUTH_TOKEN, se omite la validación (solo dev/sandbox).
 */
function isValidTwilioRequest(req) {
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!authToken) {
        if (process.env.NODE_ENV === 'production') {
            console.warn('[whatsappBot] TWILIO_AUTH_TOKEN ausente: no se valida la firma.');
        }
        return true;
    }
    if (process.env.TWILIO_WEBHOOK_VALIDATE === 'false') return true;

    try {
        // eslint-disable-next-line global-require
        const twilio = require('twilio');
        const signature = req.header('X-Twilio-Signature') || '';
        const proto = (req.header('X-Forwarded-Proto') || req.protocol || 'https').split(',')[0].trim();
        const host = req.header('X-Forwarded-Host') || req.get('host');
        const explicitUrl = process.env.TWILIO_WEBHOOK_URL;
        const url = explicitUrl || `${proto}://${host}${req.originalUrl}`;
        return twilio.validateRequest(authToken, signature, url, req.body || {});
    } catch (err) {
        console.error('[whatsappBot] error validando firma Twilio:', err.message);
        return false;
    }
}

function twiml(message) {
    const safe = String(message || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${safe}</Message></Response>`;
}

router.get('/webhook/whatsapp', (_req, res) => {
    res.type('text/plain').send('Link4Deal WhatsApp bot OK');
});

router.post('/webhook/whatsapp', async (req, res) => {
    if (!isValidTwilioRequest(req)) {
        return res.status(403).type('text/plain').send('Firma inválida');
    }

    const from = String(req.body?.From || '').trim(); // ej. "whatsapp:+52999..."
    const body = String(req.body?.Body || '').trim();

    if (!from) {
        return res.type('text/xml').send(twiml('No pude identificar tu número. Intenta de nuevo.'));
    }

    if (!database.getConnectionStatus().isConnected) {
        return res
            .type('text/xml')
            .send(twiml('Estamos con mantenimiento un momento 🙏. Escríbenos en un ratito.'));
    }

    try {
        const respuesta = await handleIncomingMessage({ waNumber: from, body });
        return res.type('text/xml').send(twiml(respuesta));
    } catch (err) {
        console.error('[whatsappBot] error procesando mensaje:', err);
        return res
            .type('text/xml')
            .send(twiml('¡Ups! 🙈 Tuvimos un detalle técnico. ¿Me repites tu último mensaje?'));
    }
});

module.exports = router;
