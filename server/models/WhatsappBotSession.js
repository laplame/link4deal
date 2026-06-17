const mongoose = require('mongoose');

/**
 * Estado de una conversación de onboarding por WhatsApp (Twilio + Claude).
 * La clave es el número de WhatsApp del usuario (ej. "whatsapp:+52999...").
 * Colección: whatsapp_bot_sessions
 */
const whatsappBotSessionSchema = new mongoose.Schema(
    {
        waNumber: { type: String, required: true, unique: true, index: true },
        /** Historial de mensajes en el formato de la API de Anthropic (role + content). */
        history: { type: [mongoose.Schema.Types.Mixed], default: [] },
        lead: {
            telefono: { type: String, default: '' },
            name: { type: String, default: null },
            email: { type: String, default: null },
            ciudad: { type: String, default: null },
            comercios: { type: [mongoose.Schema.Types.Mixed], default: [] },
        },
        emailCaptured: { type: Boolean, default: false },
        lastInboundAt: { type: Date, default: null },
    },
    { timestamps: true, collection: 'whatsapp_bot_sessions' }
);

module.exports =
    mongoose.models.WhatsappBotSession ||
    mongoose.model('WhatsappBotSession', whatsappBotSessionSchema);
