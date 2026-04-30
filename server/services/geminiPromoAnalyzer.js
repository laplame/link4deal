/**
 * Analiza imágenes de promoción con Gemini y extrae datos estructurados
 * (cartel principal + imágenes solo de términos y condiciones).
 * Variable de entorno: gemini-api-key
 */

const GEMINI_API_KEY = process.env['gemini-api-key'] || process.env.GEMINI_API_KEY;
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

function buildPrompt(hasPromo, hasTerms) {
    let intro = `Eres un asistente que analiza imágenes de promociones u ofertas comerciales.
`;
    if (hasPromo) {
        intro += `
Recibirás primero una o más imágenes del CARTEL o ANUNCIO PRINCIPAL (producto, precios visibles, marca, diseño publicitario).
De estas imágenes extrae: título, descripción breve, producto, marca, categoría, precios, descuento, tipo de oferta.
`;
    }
    if (hasTerms) {
        intro += `
Luego recibirás una o más imágenes que corresponden SOLO a TÉRMINOS Y CONDICIONES, letra pequeña, bases legales o reverso del cupón.
Para esas imágenes: transcribe TODO el texto legal visible. NO resumas. Concatena en un solo string en el campo termsAndConditions.
Si el cartel principal ya mostraba algo de términos, combina sin duplicar párrafos idénticos cuando sea obvio.
`;
    }
    intro += `
Reglas generales:
- Los precios deben estar en USD. Si en la imagen aparecen en otra moneda (MXN, EUR, etc.), conviértelos a USD de forma aproximada (MXN ~17 por USD, EUR ~1.05 por USD) e indica en description que son aproximados si aplica.
- Si no hay imágenes de términos, termsAndConditions puede quedar vacío o con lo extraído solo del cartel si allí aparece texto legal.
- offerType debe ser exactamente uno de: "percentage", "bogo", "cashback_fixed", "cashback_percentage". Si no se puede determinar, usa "percentage".
- category debe ser uno de: "electronics", "fashion", "home", "beauty", "sports", "books", "food", "other".

Responde ÚNICAMENTE con un JSON válido (sin markdown, sin comentarios) con esta estructura:
{
  "title": "string o vacío",
  "description": "string o vacío",
  "productName": "string o vacío",
  "brand": "string o vacío",
  "category": "electronics|fashion|home|beauty|sports|books|food|other",
  "originalPrice": number en USD o 0,
  "currentPrice": number en USD o 0,
  "discountPercentage": number 0-100 o 0,
  "offerType": "percentage|bogo|cashback_fixed|cashback_percentage",
  "cashbackValue": number o null,
  "termsAndConditions": "string con todo el texto legal (especialmente de imágenes de T&C), o vacío"
}`;
    return intro;
}

/**
 * Convierte un buffer de imagen a parte inline_data para Gemini
 */
function toInlineData(file) {
    const mimeType = file.mimetype || 'image/jpeg';
    const base64 = file.buffer.toString('base64');
    return { inline_data: { mime_type: mimeType, data: base64 } };
}

/**
 * Analiza imágenes: cartel(s) promocional(es) y opcionalmente imágenes solo de términos.
 * @param {Express.Multer.File[]} promotionalFiles
 * @param {Express.Multer.File[]} termsFiles
 * @returns {Promise<{ success: boolean, data?: object, message?: string }>}
 */
async function analyzePromotionImages(promotionalFiles = [], termsFiles = []) {
    const promos = Array.isArray(promotionalFiles) ? promotionalFiles : [];
    const terms = Array.isArray(termsFiles) ? termsFiles : [];

    if (!GEMINI_API_KEY) {
        return { success: false, message: 'Gemini API key no configurada (gemini-api-key o GEMINI_API_KEY)' };
    }
    if (promos.length === 0 && terms.length === 0) {
        return { success: false, message: 'Se requiere al menos una imagen (promoción o términos)' };
    }

    const parts = [{ text: buildPrompt(promos.length > 0, terms.length > 0) }];

    if (promos.length > 0) {
        parts.push({
            text: `=== INICIO: imágenes del CARTEL / ANUNCIO DE LA PROMOCIÓN (${promos.length} archivo(s)) ===`
        });
        for (const file of promos) {
            if (file.buffer && file.mimetype) parts.push(toInlineData(file));
        }
    }

    if (terms.length > 0) {
        parts.push({
            text: `=== INICIO: imágenes SOLO DE TÉRMINOS Y CONDICIONES / BASE LEGAL (${terms.length} archivo(s)) ===\nTranscribe el texto completo.`
        });
        for (const file of terms) {
            if (file.buffer && file.mimetype) parts.push(toInlineData(file));
        }
    }

    const body = {
        contents: [{ role: 'user', parts }],
        generationConfig: {
            response_mime_type: 'application/json',
            temperature: 0.2,
            max_output_tokens: 8192
        }
    };

    const model = 'gemini-2.5-flash-lite';
    const url = `${GEMINI_BASE}/models/${model}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error('Gemini API error:', res.status, errText);
            return { success: false, message: `Gemini API: ${res.status} - ${errText.slice(0, 200)}` };
        }

        const json = await res.json();
        const candidate = json.candidates && json.candidates[0];
        if (!candidate || !candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
            return { success: false, message: 'Gemini no devolvió contenido válido' };
        }

        const text = candidate.content.parts[0].text || '';
        const cleaned = text.replace(/^[\s\n]*```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
        const data = JSON.parse(cleaned);

        if (typeof data.originalPrice !== 'number') data.originalPrice = parseFloat(data.originalPrice) || 0;
        if (typeof data.currentPrice !== 'number') data.currentPrice = parseFloat(data.currentPrice) || 0;
        if (typeof data.discountPercentage !== 'number') data.discountPercentage = parseFloat(data.discountPercentage) || 0;
        if (typeof data.termsAndConditions !== 'string') data.termsAndConditions = '';
        if (!['percentage', 'bogo', 'cashback_fixed', 'cashback_percentage'].includes(data.offerType)) {
            data.offerType = 'percentage';
        }
        if (!['electronics', 'fashion', 'home', 'beauty', 'sports', 'books', 'food', 'other'].includes(data.category)) {
            data.category = 'other';
        }

        return { success: true, data };
    } catch (err) {
        console.error('Error analizando imágenes con Gemini:', err);
        return {
            success: false,
            message: err.message || 'Error al analizar las imágenes'
        };
    }
}

module.exports = { analyzePromotionImages, GEMINI_API_KEY };
