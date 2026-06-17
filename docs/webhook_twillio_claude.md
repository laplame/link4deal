/**
 * Bot de onboarding de influencers — Link4Deal
 * Twilio WhatsApp  +  Claude (Anthropic)
 *
 * Flujo: saludar -> calificar (ciudad/audiencia) -> ofrecer cupo de tester
 *        -> CAPTURAR EMAIL -> confirmar -> PUENTE A COMERCIOS.
 *
 * Claude lleva la conversación natural; dos "tools" guardan los datos:
 *   - capturar_email_tester      (objetivo principal: alta de tester)
 *   - registrar_lead_comercio    (objetivo estratégico: traer oferta)
 *
 * --- Setup ---
 *   npm init -y
 *   npm install express twilio @anthropic-ai/sdk
 *   export ANTHROPIC_API_KEY=sk-ant-...
 *   export TWILIO_AUTH_TOKEN=...        // para validar la firma del webhook
 *   node whatsapp-claude-bot.js
 *
 * En la consola de Twilio, apunta el webhook de WhatsApp (sandbox o sender)
 * a:  https://TU-DOMINIO/webhook/whatsapp   (método POST)
 * Para desarrollo local usa ngrok:  ngrok http 3000
 */

const express = require("express");
const twilio = require("twilio");
const Anthropic = require("@anthropic-ai/sdk");

const app = express();
app.use(express.urlencoded({ extended: false })); // Twilio envía form-urlencoded

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Modelo: Sonnet da buen balance de naturalidad/costo para ventas.
// Para alto volumen y respuestas más baratas/rápidas, prueba claude-haiku-4-5.
// (Confirma los modelos vigentes en https://docs.claude.com/en/api/overview)
const MODEL = "claude-sonnet-4-6";

// ---------------------------------------------------------------------------
// Estado de la conversación.
// DEMO: en memoria. En producción usa Redis o una DB (cae al reiniciar y no
// escala a varios procesos). La clave es el número de WhatsApp del usuario.
// ---------------------------------------------------------------------------
const sessions = new Map(); // waNumber -> { history: [...], lead: {...} }

function getSession(waNumber) {
  if (!sessions.has(waNumber)) {
    sessions.set(waNumber, {
      history: [],
      lead: { telefono: waNumber, email: null, ciudad: null, comercios: [] },
    });
  }
  return sessions.get(waNumber);
}

// ---------------------------------------------------------------------------
// System prompt: la "personalidad" + el flujo + la estrategia.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Definición de las tools que Claude puede invocar.
// ---------------------------------------------------------------------------
const TOOLS = [
  {
    name: "capturar_email_tester",
    description:
      "Guarda el email del influencer para darlo de alta como tester. Úsala en cuanto el usuario proporcione un correo electrónico válido.",
    input_schema: {
      type: "object",
      properties: {
        email: { type: "string", description: "Correo del influencer" },
        ciudad: {
          type: "string",
          description: "Ciudad donde crea contenido, si ya la mencionó",
        },
      },
      required: ["email"],
    },
  },
  {
    name: "registrar_lead_comercio",
    description:
      "Registra un negocio/comercio que el influencer quisiera ver en la red. Llámala una vez por cada negocio mencionado.",
    input_schema: {
      type: "object",
      properties: {
        nombre_comercio: { type: "string", description: "Nombre del negocio" },
        ciudad: { type: "string", description: "Ciudad del negocio, si la sabe" },
        nota: { type: "string", description: "Cualquier detalle útil" },
      },
      required: ["nombre_comercio"],
    },
  },
];

// Ejecuta la tool y actualiza el lead. Aquí es donde, en producción,
// escribirías a tu CRM/DB (Airtable, Supabase, etc.).
function ejecutarTool(name, input, session) {
  if (name === "capturar_email_tester") {
    session.lead.email = input.email;
    if (input.ciudad) session.lead.ciudad = input.ciudad;
    console.log("📧 EMAIL DE TESTER:", session.lead);
    // TODO: aquí dispara el alta real (crear cuenta, enviar invitación, etc.)
    return "Email guardado. Cuenta de tester en proceso de creación.";
  }
  if (name === "registrar_lead_comercio") {
    session.lead.comercios.push({
      nombre: input.nombre_comercio,
      ciudad: input.ciudad || null,
      nota: input.nota || null,
    });
    console.log("🏬 LEAD DE COMERCIO:", input);
    // TODO: aquí lo mandas a tu pipeline de adquisición de comercios.
    return "Comercio registrado como lead de oferta.";
  }
  return "Tool desconocida.";
}

// ---------------------------------------------------------------------------
// Llama a Claude con loop de tool use hasta obtener la respuesta de texto.
// ---------------------------------------------------------------------------
async function responderConClaude(session, mensajeUsuario) {
  session.history.push({ role: "user", content: mensajeUsuario });

  // Loop por si Claude encadena varias tools antes de responder texto.
  while (true) {
    const resp = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages: session.history,
    });

    // Guarda el turno del asistente (texto + posibles tool_use).
    session.history.push({ role: "assistant", content: resp.content });

    const toolUses = resp.content.filter((b) => b.type === "tool_use");

    if (toolUses.length === 0) {
      // No hay tools: junta el texto y devuélvelo.
      const texto = resp.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      return texto || "🙌";
    }

    // Ejecuta cada tool y agrega los resultados como mensaje del usuario.
    const toolResults = toolUses.map((tu) => ({
      type: "tool_result",
      tool_use_id: tu.id,
      content: ejecutarTool(tu.name, tu.input, session),
    }));
    session.history.push({ role: "user", content: toolResults });
    // El loop vuelve a llamar a Claude para que continúe.
  }
}

// ---------------------------------------------------------------------------
// Webhook de Twilio WhatsApp.
// ---------------------------------------------------------------------------
app.post(
  "/webhook/whatsapp",
  // Valida que la petición venga de Twilio (recomendado en producción).
  twilio.webhook({ authToken: process.env.TWILIO_AUTH_TOKEN }),
  async (req, res) => {
    const from = req.body.From; // p.ej. "whatsapp:+52999..."
    const body = (req.body.Body || "").trim();

    try {
      const session = getSession(from);
      const respuesta = await responderConClaude(session, body);

      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message(respuesta);
      res.type("text/xml").send(twiml.toString());
    } catch (err) {
      console.error("Error:", err);
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message(
        "¡Ups! 🙈 Tuvimos un detalle técnico. ¿Me repites tu último mensaje?"
      );
      res.type("text/xml").send(twiml.toString());
    }
  }
);

app.get("/", (_req, res) => res.send("Link4Deal WhatsApp bot OK ✅"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Escuchando en :${PORT}`));