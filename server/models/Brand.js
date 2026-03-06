const mongoose = require('mongoose');

/**
 * Marca o negocio (brand or business).
 * Colección: brands. Campos alineados con el formulario BrandSetup.
 */
const brandSchema = new mongoose.Schema({
    companyName: { type: String, required: true, trim: true },
    industry: { type: String, trim: true },
    website: { type: String, trim: true },
    description: { type: String, trim: true },
    headquarters: { type: String, trim: true },
    founded: { type: Number },
    employees: { type: String, trim: true },
    categories: [{ type: String, trim: true }],
    targetAudience: {
        ageRange: { min: { type: Number }, max: { type: Number } },
        gender: [{ type: String, trim: true }],
        locations: [{ type: String, trim: true }],
        interests: [{ type: String, trim: true }],
        incomeLevel: { type: String, trim: true }
    },
    marketingBudget: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 0 },
        currency: { type: String, default: 'USD' }
    },
    preferredChannels: [{ type: String, trim: true }],
    campaignTypes: [{ type: String, trim: true }],
    status: {
        type: String,
        enum: ['active', 'pending', 'verified', 'suspended'],
        default: 'active'
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { collection: 'brands' });

brandSchema.index({ companyName: 'text', industry: 'text', description: 'text' });

module.exports = mongoose.models.Brand || mongoose.model('Brand', brandSchema);
