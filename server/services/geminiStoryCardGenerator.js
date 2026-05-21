'use strict';

const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

const GEMINI_API_KEY = process.env['gemini-api-key'] || process.env.GEMINI_API_KEY;
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const STORY_MODEL =
    process.env.GEMINI_STORY_CARD_MODEL || process.env.GEMINI_NANO_BANANA_MODEL || 'gemini-2.5-flash-image';

const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;

/**
 * Prompt para Nano Banana (Gemini Image): vertical 9:16, código y % visibles.
 */
function buildStoryCardPrompt({ shortCode, discountPercentage, promotion, influencerName, brand }) {
    const title = promotion?.title || 'Oferta exclusiva';
    const pct = Math.min(100, Math.max(0, Math.round(Number(discountPercentage) || 0)));
    const creator = influencerName || 'Creador';
    const brandLine = brand ? `Marca: ${brand}.` : '';

    return `Create a vertical smartphone story image, aspect ratio 9:16 (1080x1920), modern promotional design for a discount campaign.

${brandLine}
Promotion: "${title}".
Influencer: ${creator}.

MUST include clearly readable large text:
- Discount: ${pct}% OFF (or "${pct}% DESCUENTO" in Spanish)
- Promo code: ${shortCode}

Style: bold typography, high contrast, social-media story aesthetic (Instagram/TikTok), purple and dark gradient accents, no watermark, no fake QR code, leave safe margins for mobile UI overlays.

The code "${shortCode}" and "${pct}%" must be the focal points.`;
}

/**
 * @param {object} params
 * @returns {Promise<{ ok: boolean, generated: boolean, prompt: string, model: string, image?: object, message?: string }>}
 */
async function generateStoryCardWithNanoBanana(params) {
    const prompt = buildStoryCardPrompt(params);

    if (!GEMINI_API_KEY) {
        return {
            ok: true,
            generated: false,
            prompt,
            model: STORY_MODEL,
            message: 'GEMINI_API_KEY no configurada; usa prompt en cliente o configura servidor',
        };
    }

    const url = `${GEMINI_BASE}/models/${STORY_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
    const body = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
        },
    };

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            const errText = JSON.stringify(data).slice(0, 400);
            console.error('Nano Banana / Gemini story card error:', res.status, errText);
            return {
                ok: true,
                generated: false,
                prompt,
                model: STORY_MODEL,
                message: `Generación de imagen falló (${res.status}). Usa el prompt en la app.`,
            };
        }

        const parts = data?.candidates?.[0]?.content?.parts || [];
        let imagePart = null;
        for (const part of parts) {
            if (part.inlineData?.data) {
                imagePart = part.inlineData;
                break;
            }
        }

        if (!imagePart) {
            return {
                ok: true,
                generated: false,
                prompt,
                model: STORY_MODEL,
                message: 'Gemini no devolvió imagen; usa el prompt en cliente',
            };
        }

        const mime = imagePart.mimeType || 'image/png';
        const ext = mime.includes('jpeg') ? 'jpg' : 'png';
        const buf = Buffer.from(imagePart.data, 'base64');
        const uploadsDir = path.join(__dirname, '..', 'uploads', 'story-cards');
        await fs.mkdir(uploadsDir, { recursive: true });
        const filename = `story-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
        const filePath = path.join(uploadsDir, filename);
        await fs.writeFile(filePath, buf);

        return {
            ok: true,
            generated: true,
            prompt,
            model: STORY_MODEL,
            image: {
                filename,
                url: `/uploads/story-cards/${filename}`,
                mimeType: mime,
                width: STORY_WIDTH,
                height: STORY_HEIGHT,
            },
        };
    } catch (err) {
        console.error('Error generando story card Nano Banana:', err);
        return {
            ok: true,
            generated: false,
            prompt,
            model: STORY_MODEL,
            message: err.message || 'Error al generar imagen',
        };
    }
}

module.exports = {
    STORY_WIDTH,
    STORY_HEIGHT,
    buildStoryCardPrompt,
    generateStoryCardWithNanoBanana,
};
