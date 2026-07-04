'use strict';

const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

const GEMINI_API_KEY = process.env['gemini-api-key'] || process.env.GEMINI_API_KEY;
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const FLYER_MODEL =
    process.env.GEMINI_FLYER_MODEL ||
    process.env.GEMINI_STORY_CARD_MODEL ||
    process.env.GEMINI_NANO_BANANA_MODEL ||
    'gemini-2.5-flash-image';
const PROOFREAD_MODEL = process.env.GEMINI_PROOFREAD_MODEL || 'gemini-2.5-flash-lite';

const FLYER_WIDTH = 1080;
const FLYER_HEIGHT = 1920;

const DEFAULT_HASHTAGS = [
    '#DameCodigo',
    '#Link4Deal',
    '#CryptoMarketing',
    '#Cashback',
    '#Descuentos',
    '#Ofertas',
    '#Tokens',
    '#ComprasInteligentes',
    '#Web3Commerce',
    '#Deals',
];

function toNumber(value) {
    const n = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
}

function formatMoney(value, currency) {
    const n = toNumber(value);
    const cur = String(currency || 'MXN').toUpperCase();
    const formatted = n.toLocaleString('es-MX', { maximumFractionDigits: 2 });
    return `$${formatted} ${cur}`;
}

/**
 * Normaliza los detalles que llegan del formulario.
 */
function normalizeFlyerDetails(input = {}) {
    const productName = String(input.productName || input.title || 'Producto').trim().slice(0, 160);
    const currency = String(input.currency || 'MXN').trim().toUpperCase().slice(0, 8) || 'MXN';
    const originalPrice = toNumber(input.originalPrice);
    const finalPrice = toNumber(input.finalPrice ?? input.currentPrice);

    let discountPercentage = toNumber(input.discountPercentage ?? input.discountPercent);
    if (!discountPercentage && originalPrice > 0 && finalPrice > 0 && finalPrice < originalPrice) {
        discountPercentage = Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
    }
    discountPercentage = Math.min(99, Math.max(0, Math.round(discountPercentage)));

    const savings = originalPrice > finalPrice ? originalPrice - finalPrice : 0;
    const cashbackText = String(input.cashbackText || input.cashback || '').trim().slice(0, 120);
    const platform = String(input.platform || 'DameCodigo + Link4Deal').trim().slice(0, 120);
    const headline = String(input.headline || '').trim().slice(0, 80);
    const extraNotes = String(input.extraNotes || input.notes || '').trim().slice(0, 400);

    return {
        productName,
        currency,
        originalPrice,
        finalPrice,
        discountPercentage,
        savings,
        cashbackText,
        platform,
        headline,
        extraNotes,
    };
}

/**
 * Copy de marketing (texto del anuncio) construido con la estructura del prompt maestro.
 */
function buildPromoFlyerCopy(d) {
    const headline = d.headline || (d.discountPercentage ? `${d.discountPercentage}% OFF EXCLUSIVO` : 'Compra Inteligente');
    const cashbackLine = d.cashbackText
        ? `💰 Además recibe ${d.cashbackText} en tokens acumulables.`
        : '💰 Además recibe cashback en tokens acumulables.';

    const lines = [
        `🔥 ${headline} 🔥`,
        '',
        `Compra tu ${d.productName}${d.finalPrice ? ` por solo ${formatMoney(d.finalPrice, d.currency)}` : ''} usando ${d.platform}.`,
    ];
    if (d.originalPrice && d.finalPrice && d.originalPrice > d.finalPrice) {
        lines.push(`Antes ${formatMoney(d.originalPrice, d.currency)} → Ahora ${formatMoney(d.finalPrice, d.currency)} (ahorras ${formatMoney(d.savings, d.currency)}).`);
    }
    lines.push(
        '',
        cashbackLine,
        '',
        '⚡ Compra inteligente.',
        '⚡ Descuentos reales.',
        '⚡ Recompensas por comprar.',
        '',
        'Esto es CryptoMarketing.',
        '',
        '📲 Exclusivo por la app',
        '🪙 Gana tokens en cada compra',
        '🔥 Oferta limitada',
        '',
        DEFAULT_HASHTAGS.join(' '),
    );
    return lines.join('\n');
}

/**
 * PROMPT MAESTRO — flyer vertical 9:16 pensado como FONDO de un video vertical móvil.
 */
function buildPromoFlyerPrompt(details) {
    const d = normalizeFlyerDetails(details);
    const headline = d.headline || (d.discountPercentage ? `${d.discountPercentage}% OFF` : 'COMPRA INTELIGENTE');
    const priceBlock = [];
    if (d.originalPrice) priceBlock.push(`- Original price (struck-through): ${formatMoney(d.originalPrice, d.currency)}`);
    if (d.finalPrice) priceBlock.push(`- Final price (big, highlighted): ${formatMoney(d.finalPrice, d.currency)}`);
    if (d.discountPercentage) priceBlock.push(`- Discount badge: ${d.discountPercentage}% OFF`);
    if (d.savings) priceBlock.push(`- Total savings: ${formatMoney(d.savings, d.currency)}`);
    const cashbackLine = d.cashbackText
        ? `Cashback benefit: ${d.cashbackText} in accumulable tokens.`
        : 'Cashback benefit: token cashback on every purchase.';

    return `Create a VERTICAL smartphone poster, aspect ratio 9:16 (1080x1920 px), designed to be used as the BACKGROUND of a vertical mobile video (reel / TikTok / Instagram story).

ROLE: You are an expert in performance marketing, crypto marketing and viral promotions for ecommerce and retail (Link4Deal + DameCodigo / CryptoMarketing).

PRODUCT
- Name: "${d.productName}".
- Platform / where to buy: ${d.platform}.
${priceBlock.join('\n')}
${cashbackLine}
${d.extraNotes ? `Extra context: ${d.extraNotes}` : ''}

LAYOUT (must be readable and bold)
- Strong impactful headline at the top: "${headline}".
- Hero product image area in the upper-center.
- Large discount label / badge (e.g. "${d.discountPercentage || 0}% OFF" or "${d.discountPercentage || 0}% DESCUENTO").
- Clear price block: original price struck-through and final price emphasized.
- A "cashback in tokens" element: token coins, glowing cashback meter / progress.
- A clear Call To Action zone near the bottom: "Solo en la app", "Escanea el QR", "Descárgala ahora".
- Branding: small "DameCodigo" + "Link4Deal" / CryptoMarketing lockup.
- Leave a clean SAFE AREA in the lower-center third (less busy / darker) so video text and UI overlays can sit on top.

VISUAL STYLE
- Premium dark background, neon / fintech accents (purple, electric blue, neon green glow).
- Crypto / web3 aesthetic, cashback meter, token coins, subtle glow, exclusivity feel.
- Bold typography, high contrast, minimalist, optimized for conversion and urgency.
- No fake/scannable QR code (leave a placeholder square area labeled "QR" instead), no watermark.

TONE: aggressive commercial, modern, fintech/crypto, viral, easy to understand. "Paga menos. Gana más."

The product name, the discount "${d.discountPercentage || 0}%" and the prices must be clearly legible and be the focal points.
All Spanish text visible in the design must use correct spelling and grammar (Mexican Spanish).`;
}

function parseGeminiJsonText(text) {
    const cleaned = String(text || '')
        .replace(/^[\s\n]*```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/i, '')
        .trim();
    return JSON.parse(cleaned);
}

function extractGeminiText(data) {
    const parts = data?.candidates?.[0]?.content?.parts || [];
    return parts.map((p) => p.text || '').join('').trim();
}

/**
 * Corrige ortografía y gramática (es-MX) en los textos del flyer antes de generar imagen/copy.
 */
async function proofreadSpanishFlyerFields(details) {
    const fallback = { details, proofread: { applied: false, corrections: [] } };
    if (!GEMINI_API_KEY) return fallback;

    const payload = {
        productName: details.productName || '',
        headline: details.headline || '',
        extraNotes: details.extraNotes || '',
        cashbackText: details.cashbackText || '',
        platform: details.platform || '',
    };

    const prompt = `Eres corrector profesional de español de México.
Revisa ortografía, gramática, acentuación y puntuación de los textos de un flyer promocional.
Mantén el mismo tono comercial, el significado y los datos (precios, porcentajes, marcas).
No traduzcas al inglés. No inventes ofertas ni cifras.
Si un campo ya está correcto, devuélvelo igual.

Responde ÚNICAMENTE con JSON válido (sin markdown):
{
  "productName": "string",
  "headline": "string",
  "extraNotes": "string",
  "cashbackText": "string",
  "platform": "string",
  "corrections": ["lista breve de cambios realizados en español, o [] si no hubo cambios"]
}

Textos a revisar:
${JSON.stringify(payload, null, 2)}`;

    const url = `${GEMINI_BASE}/models/${PROOFREAD_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.1, max_output_tokens: 2048 },
            }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            console.error('Gemini proofread flyer error:', res.status, JSON.stringify(data).slice(0, 300));
            return fallback;
        }

        const parsed = parseGeminiJsonText(extractGeminiText(data));
        const corrections = Array.isArray(parsed.corrections)
            ? parsed.corrections.map((c) => String(c).trim()).filter(Boolean).slice(0, 12)
            : [];

        const merged = normalizeFlyerDetails({
            ...details,
            productName: parsed.productName ?? details.productName,
            headline: parsed.headline ?? details.headline,
            extraNotes: parsed.extraNotes ?? details.extraNotes,
            cashbackText: parsed.cashbackText ?? details.cashbackText,
            platform: parsed.platform ?? details.platform,
        });

        const changed =
            merged.productName !== details.productName ||
            merged.headline !== details.headline ||
            merged.extraNotes !== details.extraNotes ||
            merged.cashbackText !== details.cashbackText ||
            merged.platform !== details.platform;

        return {
            details: merged,
            proofread: {
                applied: changed || corrections.length > 0,
                corrections,
            },
        };
    } catch (err) {
        console.error('Error proofreading flyer texts:', err);
        return fallback;
    }
}

/**
 * Genera el flyer vertical 9:16 con Gemini Image. Acepta una imagen de producto opcional como referencia.
 * @param {object} params
 * @param {object} params.details
 * @param {{ buffer: Buffer, mimetype: string }} [params.productImage]
 */
async function generatePromoFlyerWithNanoBanana({ details, productImage } = {}) {
    const normalized = normalizeFlyerDetails(details);
    const { details: reviewed, proofread } = await proofreadSpanishFlyerFields(normalized);
    const prompt = buildPromoFlyerPrompt(reviewed);
    const copy = buildPromoFlyerCopy(reviewed);

    const basePayload = {
        proofread,
        correctedFields: {
            productName: reviewed.productName,
            headline: reviewed.headline,
            extraNotes: reviewed.extraNotes,
            cashbackText: reviewed.cashbackText,
            platform: reviewed.platform,
        },
    };

    if (!GEMINI_API_KEY) {
        return {
            ok: true,
            generated: false,
            prompt,
            copy,
            model: FLYER_MODEL,
            message: 'GEMINI_API_KEY no configurada; usa el prompt en cliente o configura el servidor',
            promptForClient: prompt,
            ...basePayload,
        };
    }

    const parts = [];
    if (productImage?.buffer?.length) {
        parts.push({
            inlineData: {
                mimeType: productImage.mimetype || 'image/png',
                data: productImage.buffer.toString('base64'),
            },
        });
        parts.push({
            text: 'Use the provided product photo as the hero product in the flyer (keep the product recognizable).',
        });
    }
    parts.push({ text: prompt });

    const url = `${GEMINI_BASE}/models/${FLYER_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
    const body = {
        contents: [{ role: 'user', parts }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
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
            console.error('Gemini flyer image error:', res.status, errText);
            return {
                ok: true,
                generated: false,
                prompt,
                copy,
                model: FLYER_MODEL,
                message: `Generación de imagen falló (${res.status}). Usa el prompt en cliente.`,
                promptForClient: prompt,
                ...basePayload,
            };
        }

        const responseParts = data?.candidates?.[0]?.content?.parts || [];
        let imagePart = null;
        for (const part of responseParts) {
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
                copy,
                model: FLYER_MODEL,
                message: 'Gemini no devolvió imagen; usa el prompt en cliente',
                promptForClient: prompt,
                ...basePayload,
            };
        }

        const mime = imagePart.mimeType || 'image/png';
        const ext = mime.includes('jpeg') ? 'jpg' : 'png';
        const buf = Buffer.from(imagePart.data, 'base64');
        const uploadsDir = path.join(__dirname, '..', 'uploads', 'flyers');
        await fs.mkdir(uploadsDir, { recursive: true });
        const filename = `flyer-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
        await fs.writeFile(path.join(uploadsDir, filename), buf);

        return {
            ok: true,
            generated: true,
            prompt,
            copy,
            model: FLYER_MODEL,
            image: {
                filename,
                url: `/uploads/flyers/${filename}`,
                mimeType: mime,
                width: FLYER_WIDTH,
                height: FLYER_HEIGHT,
            },
            ...basePayload,
        };
    } catch (err) {
        console.error('Error generando flyer:', err);
        return {
            ok: true,
            generated: false,
            prompt,
            copy,
            model: FLYER_MODEL,
            message: err.message || 'Error al generar imagen',
            promptForClient: prompt,
            ...basePayload,
        };
    }
}

module.exports = {
    FLYER_WIDTH,
    FLYER_HEIGHT,
    DEFAULT_HASHTAGS,
    normalizeFlyerDetails,
    buildPromoFlyerPrompt,
    buildPromoFlyerCopy,
    proofreadSpanishFlyerFields,
    generatePromoFlyerWithNanoBanana,
};
