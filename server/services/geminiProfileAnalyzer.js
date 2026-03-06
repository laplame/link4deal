/**
 * Analiza imagen de perfil (menú/screenshot de negocio o perfil de influencer) con Gemini.
 * type: 'brand' | 'influencer'
 * Variable de entorno: gemini-api-key o GEMINI_API_KEY
 */

const GEMINI_API_KEY = process.env['gemini-api-key'] || process.env.GEMINI_API_KEY;
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const MODEL = 'gemini-2.5-flash-lite';

const BRAND_PROMPT = `Analiza esta imagen (menú, screenshot de negocio, fachada o material comercial) y extrae información de la marca/negocio.
Responde ÚNICAMENTE con un JSON válido (sin markdown):
{
  "companyName": "string nombre del negocio o marca",
  "industry": "string industria o sector",
  "website": "string URL o vacío",
  "description": "string descripción breve",
  "headquarters": "string ciudad o ubicación",
  "categories": ["string"] array de categorías (ej: fashion, technology, food)
}`;

const INFLUENCER_PROMPT = `Analiza esta imagen (screenshot de perfil de red social, bio o perfil de influencer) y extrae información del creador de contenido.
Responde ÚNICAMENTE con un JSON válido (sin markdown):
{
  "displayName": "string nombre o alias",
  "bio": "string biografía o descripción",
  "location": "string ciudad o país",
  "platforms": ["string"] ej: instagram, tiktok, youtube,
  "categories": ["string"] ej: lifestyle, fashion, beauty, fitness
  "socialMedia": [{"platform": "string", "username": "string", "followers": number}]
}`;

function toInlineData(file) {
    const mimeType = file.mimetype || 'image/jpeg';
    const base64 = file.buffer.toString('base64');
    return { inline_data: { mime_type: mimeType, data: base64 } };
}

async function analyzeProfileImage(file, type) {
    if (!GEMINI_API_KEY) {
        return { success: false, message: 'Gemini API key no configurada' };
    }
    if (!file || !file.buffer) {
        return { success: false, message: 'Se requiere una imagen' };
    }
    const prompt = type === 'brand' ? BRAND_PROMPT : type === 'influencer' ? INFLUENCER_PROMPT : null;
    if (!prompt) {
        return { success: false, message: 'type debe ser brand o influencer' };
    }

    const body = {
        contents: [{ role: 'user', parts: [{ text: prompt }, toInlineData(file)] }],
        generationConfig: {
            response_mime_type: 'application/json',
            temperature: 0.2,
            max_output_tokens: 2048
        }
    };

    const url = `${GEMINI_BASE}/models/${MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error('Gemini profile API error:', res.status, errText);
            return { success: false, message: `Gemini: ${res.status}` };
        }

        const json = await res.json();
        const candidate = json.candidates && json.candidates[0];
        if (!candidate?.content?.parts?.[0]) {
            return { success: false, message: 'Gemini no devolvió contenido' };
        }

        const text = (candidate.content.parts[0].text || '').replace(/^[\s\n]*```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
        const data = JSON.parse(text);
        return { success: true, data };
    } catch (err) {
        console.error('Error analizando perfil con Gemini:', err);
        return { success: false, message: err.message || 'Error al analizar' };
    }
}

module.exports = { analyzeProfileImage };
