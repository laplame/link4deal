/**
 * Analiza imágenes de promoción con Gemini y extrae datos estructurados
 * (título, precios, descuento, términos y condiciones si aparecen en alguna imagen).
 * Variable de entorno: gemini-api-key
 */

const GEMINI_API_KEY = process.env['gemini-api-key'] || process.env.GEMINI_API_KEY;
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

const ANALYSIS_PROMPT = `Eres un asistente que analiza imágenes de promociones u ofertas comerciales.
Analiza TODAS las imágenes que te envío y extrae la información de la promoción.

Reglas:
- Los precios deben estar en USD. Si en la imagen aparecen en otra moneda (MXN, EUR, etc.), conviértelos a USD de forma aproximada (usa tasas razonables: MXN ~17 por USD, EUR ~1.05 por USD) e indica que son aproximados.
- Si en alguna de las imágenes aparece texto de "términos y condiciones", "bases legales", "condiciones de la promoción" o similar, extrae ese texto completo en el campo termsAndConditions. Si no hay tal texto en ninguna imagen, deja termsAndConditions como string vacío.
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
  "termsAndConditions": "string con el texto de términos si aparece en alguna imagen, o vacío"
}`;

/**
 * Convierte un buffer de imagen a parte inline_data para Gemini
 */
function toInlineData(file) {
    const mimeType = file.mimetype || 'image/jpeg';
    const base64 = file.buffer.toString('base64');
    return { inline_data: { mime_type: mimeType, data: base64 } };
}

/**
 * Analiza una o más imágenes de promoción con Gemini y devuelve datos estructurados
 * @param {Express.Multer.File[]} files - Array de archivos (req.files)
 * @returns {Promise<{ success: boolean, data?: object, message?: string }>}
 */
async function analyzePromotionImages(files) {
    if (!GEMINI_API_KEY) {
        return { success: false, message: 'Gemini API key no configurada (gemini-api-key o GEMINI_API_KEY)' };
    }
    if (!files || files.length === 0) {
        return { success: false, message: 'Se requiere al menos una imagen' };
    }

    const parts = [{ text: ANALYSIS_PROMPT }];
    for (const file of files) {
        if (file.buffer && file.mimetype) {
            parts.push(toInlineData(file));
        }
    }

    const body = {
        contents: [{ role: 'user', parts }],
        generationConfig: {
            response_mime_type: 'application/json',
            temperature: 0.2,
            max_output_tokens: 2048
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

        // Normalizar tipos
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
