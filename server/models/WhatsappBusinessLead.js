const mongoose = require('mongoose');

/**
 * Lead de comercio/negocio que un influencer quisiera traer a la red,
 * capturado por el bot de onboarding de WhatsApp.
 * Colección: whatsapp_business_leads
 */
const whatsappBusinessLeadSchema = new mongoose.Schema(
    {
        nombre: { type: String, required: true, trim: true, maxlength: 200 },
        ciudad: { type: String, trim: true, default: null, maxlength: 120 },
        nota: { type: String, trim: true, default: null, maxlength: 2000 },
        /** WhatsApp del influencer que trajo el lead (ej. "whatsapp:+52..."). */
        sourcePhone: { type: String, trim: true, default: '', index: true },
        /** Email del influencer (tester) si ya lo capturamos en la misma sesión. */
        influencerEmail: { type: String, trim: true, lowercase: true, default: '' },
        status: {
            type: String,
            enum: ['new', 'contacted', 'qualified', 'converted', 'dismissed'],
            default: 'new',
            index: true,
        },
    },
    { timestamps: true, collection: 'whatsapp_business_leads' }
);

whatsappBusinessLeadSchema.index({ sourcePhone: 1, nombre: 1 });

module.exports =
    mongoose.models.WhatsappBusinessLead ||
    mongoose.model('WhatsappBusinessLead', whatsappBusinessLeadSchema);
