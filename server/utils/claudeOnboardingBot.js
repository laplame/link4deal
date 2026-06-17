'use strict';

/**
 * Bot de onboarding de influencers por WhatsApp (Twilio) con Claude (Anthropic).
 *
 * Flujo: saludar -> calificar (ciudad/audiencia) -> ofrecer cupo de tester
 *        -> CAPTURAR EMAIL -> confirmar -> PUENTE A COMERCIOS.
 *
 * - Estado de conversación persistido en MongoDB (WhatsappBotSession).
 * - Dos "tools" guardan datos reales:
 *     capturar_email_tester    -> upsert en InfluencerWaitlistEntry
 *     registrar_lead_comercio  -> alta en WhatsappBusinessLead
 * - Si no hay ANTHROPIC_API_KEY, cae a un flujo por reglas (sin Claude) que
 *   igual captura el email y registra comercios, para no dejar el webhook muerto.
 */

const WhatsappBotSession = require('../models/WhatsappBotSession');
const WhatsappBusinessLead = require('../models/WhatsappBusinessLead');
const InfluencerWaitlistEntry = require('../models/InfluencerWaitlistEntry');

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
const MAX_HISTORY = Number(process.env.WHATSAPP_BOT_MAX_HISTORY || 24);
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

let anthropicClient = null;
function getAnthropic() {
    if (!process.env.ANTHROPIC_API_KEY) return null;
    if (anthropicClient) return anthropicClient;
    // Require perezoso: no romper si el paquete no está instalado.
    // eslint-disable-next-line global-require
    const Anthropic = require('@anthropic-ai/sdk');
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    return anthropicClient;
}

const SYSTEM_PROMPT = `
Eres el asistente de onboarding de Link4Deal por WhatsApp. Hablas con un
influencer/creador que llegó por Instagram y quiere ser parte de la red.

TONO: cálido, breve, directo, en español de México. Usa emojis con medida.
Mensajes cortos (es WhatsApp), una idea por mensaje.

MODELO DE LINK4DEAL: no cobramos por anuncios; el creador gana por cada
persona que usa su código. Reportes y pagos transparentes en tiempo real.
Promos y experiencias exclusivas en su ciudad.

OBJETIVO #1 (crítico): conseguir su EMAIL para darlo de alta como TESTER.
El email es necesario porque su código y su panel de ganancias viven en una
cuenta ligada a su correo; es la única forma de que el dinero quede a su nombre.

OBJETIVO #2 (estratégico): antes de cerrar, preguntar si hay algún NEGOCIO de
su ciudad con el que siempre quiso un trato/descuento para su comunidad. Esos
comercios son leads de oferta valiosísimos y él sería quien los trajo.

FLUJO SUGERIDO (adáptalo con naturalidad, no lo recites):
1. Agradece el interés y pregunta en qué ciudad crea contenido / dónde tiene
   más audiencia. (Califica; aún NO pidas el email.)
2. Posiciona el cupo de TESTER como limitado y con beneficios (código antes
   que nadie, comisiones más altas en lanzamiento, línea directa con el equipo).
3. Pide el email para crear su cuenta de tester. Si duda, explica el porqué
   (su dinero queda registrado a su nombre). Cuando lo dé, CONFÍRMALO de vuelta.
4. Confirma el alta y crea compromiso (revisar bandeja y spam).
5. Haz el puente a comercios (Objetivo #2).

REGLAS DE HERRAMIENTAS:
- En cuanto el usuario te dé un email válido, llama a capturar_email_tester.
- Cada vez que mencione un negocio que quisiera en la red, llama a
  registrar_lead_comercio (uno por negocio).
- Llama a las tools en silencio; no le digas al usuario que estás "guardando
  datos". Tú solo sigues la conversación con naturalidad.

Nunca inventes datos. Si no entiendes algo, pregunta de forma simple.
`.trim();

const TOOLS = [
    {
        name: 'capturar_email_tester',
        description:
            'Guarda el email del influencer para darlo de alta como tester. Úsala en cuanto el usuario proporcione un correo electrónico válido.',
        input_schema: {
            type: 'object',
            properties: {
                email: { type: 'string', description: 'Correo del influencer' },
                ciudad: {
                    type: 'string',
                    description: 'Ciudad donde crea contenido, si ya la mencionó',
                },
                nombre: { type: 'string', description: 'Nombre del influencer, si lo dijo' },
            },
            required: ['email'],
        },
    },
    {
        name: 'registrar_lead_comercio',
        description:
            'Registra un negocio/comercio que el influencer quisiera ver en la red. Llámala una vez por cada negocio mencionado.',
        input_schema: {
            type: 'object',
            properties: {
                nombre_comercio: { type: 'string', description: 'Nombre del negocio' },
                ciudad: { type: 'string', description: 'Ciudad del negocio, si la sabe' },
                nota: { type: 'string', description: 'Cualquier detalle útil' },
            },
            required: ['nombre_comercio'],
        },
    },
];

async function upsertTester(lead) {
    const email = String(lead.email || '').trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email)) return;
    try {
        await InfluencerWaitlistEntry.findOneAndUpdate(
            { email },
            {
                $set: {
                    email,
                    ...(lead.name ? { name: lead.name } : {}),
                    ...(lead.ciudad ? { city: lead.ciudad } : {}),
                    source: 'whatsapp_onboarding_bot',
                    landingPath: '/webhook/whatsapp',
                },
                $setOnInsert: { status: 'pending' },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    } catch (err) {
        // Email duplicado u otro: no romper la conversación.
        console.warn('[whatsappBot] upsertTester:', err.message);
    }
}

async function ejecutarTool(name, input, session) {
    if (name === 'capturar_email_tester') {
        const email = String(input.email || '').trim();
        session.lead.email = email;
        session.emailCaptured = true;
        if (input.ciudad) session.lead.ciudad = input.ciudad;
        if (input.nombre) session.lead.name = input.nombre;
        await upsertTester(session.lead);
        console.log('📧 EMAIL DE TESTER:', { email, ciudad: session.lead.ciudad });
        return 'Email guardado. Cuenta de tester en proceso de creación.';
    }
    if (name === 'registrar_lead_comercio') {
        const nombre = String(input.nombre_comercio || '').trim();
        if (!nombre) return 'Falta el nombre del comercio.';
        const entry = {
            nombre,
            ciudad: input.ciudad || session.lead.ciudad || null,
            nota: input.nota || null,
        };
        session.lead.comercios.push(entry);
        try {
            await WhatsappBusinessLead.create({
                ...entry,
                sourcePhone: session.waNumber,
                influencerEmail: session.lead.email || '',
            });
        } catch (err) {
            console.warn('[whatsappBot] registrar_lead_comercio:', err.message);
        }
        console.log('🏬 LEAD DE COMERCIO:', entry);
        return 'Comercio registrado como lead de oferta.';
    }
    return 'Tool desconocida.';
}

function trimHistory(history) {
    if (history.length <= MAX_HISTORY) return history;
    return history.slice(history.length - MAX_HISTORY);
}

async function responderConClaude(session, mensajeUsuario) {
    const client = getAnthropic();
    session.history.push({ role: 'user', content: mensajeUsuario });

    // Loop por si Claude encadena varias tools antes de responder texto.
    // Tope de iteraciones para evitar bucles infinitos.
    for (let i = 0; i < 6; i++) {
        const resp = await client.messages.create({
            model: MODEL,
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            tools: TOOLS,
            messages: session.history,
        });

        session.history.push({ role: 'assistant', content: resp.content });

        const toolUses = (resp.content || []).filter((b) => b.type === 'tool_use');
        if (toolUses.length === 0) {
            const texto = (resp.content || [])
                .filter((b) => b.type === 'text')
                .map((b) => b.text)
                .join('\n')
                .trim();
            return texto || '🙌';
        }

        const toolResults = [];
        for (const tu of toolUses) {
            // eslint-disable-next-line no-await-in-loop
            const content = await ejecutarTool(tu.name, tu.input, session);
            toolResults.push({ type: 'tool_result', tool_use_id: tu.id, content });
        }
        session.history.push({ role: 'user', content: toolResults });
    }
    return 'Gracias, lo registré. ¿Te ayudo con algo más? 🙌';
}

/**
 * Flujo por reglas cuando no hay Claude disponible. Captura email y comercios.
 */
async function responderConReglas(session, mensajeUsuario) {
    const texto = String(mensajeUsuario || '').trim();
    session.history.push({ role: 'user', content: texto });

    const emailMatch = texto.match(EMAIL_RE);
    let reply;

    if (emailMatch) {
        session.lead.email = emailMatch[0];
        session.emailCaptured = true;
        await upsertTester(session.lead);
        reply =
            `¡Listo! 🎉 Registré ${emailMatch[0]} para tu cupo de tester. ` +
            'Revisa tu bandeja (y spam) en breve. ' +
            'Una última: ¿hay algún negocio de tu ciudad que te encantaría ver en Link4Deal? 🏬';
    } else if (!session.emailCaptured) {
        reply =
            '¡Hola! 👋 Soy el asistente de Link4Deal. Para apartar tu cupo de tester ' +
            '(código antes que nadie y comisiones más altas en el lanzamiento) necesito tu ' +
            'email: ahí vivirá tu panel de ganancias a tu nombre. ¿Me lo compartes? 📧';
    } else {
        // Ya tenemos email: tratamos el mensaje como un posible comercio.
        const nombre = texto.slice(0, 200);
        if (nombre && !/^(no|nada|ninguno|gracias)\b/i.test(nombre)) {
            session.lead.comercios.push({ nombre, ciudad: session.lead.ciudad || null, nota: null });
            try {
                await WhatsappBusinessLead.create({
                    nombre,
                    ciudad: session.lead.ciudad || null,
                    sourcePhone: session.waNumber,
                    influencerEmail: session.lead.email || '',
                });
            } catch (err) {
                console.warn('[whatsappBot] reglas comercio:', err.message);
            }
            reply = `¡Anotado ${nombre}! 🙌 Si se te ocurre otro, mándalo. Si no, ¡bienvenido a Link4Deal! 🚀`;
        } else {
            reply = '¡Perfecto! 🚀 Cualquier cosa, aquí estoy. ¡Bienvenido a Link4Deal!';
        }
    }

    session.history.push({ role: 'assistant', content: reply });
    return reply;
}

/**
 * Procesa un mensaje entrante de WhatsApp y devuelve el texto de respuesta.
 * @param {{ waNumber: string, body: string }} args
 * @returns {Promise<string>}
 */
async function handleIncomingMessage({ waNumber, body }) {
    const number = String(waNumber || '').trim();
    if (!number) return '🙌';

    let session = await WhatsappBotSession.findOne({ waNumber: number });
    if (!session) {
        session = new WhatsappBotSession({
            waNumber: number,
            history: [],
            lead: { telefono: number, comercios: [] },
        });
    }

    const reply = getAnthropic()
        ? await responderConClaude(session, body)
        : await responderConReglas(session, body);

    session.history = trimHistory(session.history);
    session.lastInboundAt = new Date();
    session.markModified('history');
    session.markModified('lead');
    await session.save();

    return reply;
}

module.exports = {
    handleIncomingMessage,
    SYSTEM_PROMPT,
    TOOLS,
    MODEL,
};
