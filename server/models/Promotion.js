const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
    // Información básica de la promoción
    title: {
        type: String,
        required: [true, 'El título es requerido'],
        trim: true,
        maxlength: [200, 'El título no puede exceder 200 caracteres']
    },
    description: {
        type: String,
        required: [true, 'La descripción es requerida'],
        trim: true,
        maxlength: [1000, 'La descripción no puede exceder 1000 caracteres']
    },
    
    // Información del producto
    productName: {
        type: String,
        required: [true, 'El nombre del producto es requerido'],
        trim: true
    },
    brand: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        required: [true, 'La categoría es requerida'],
        enum: ['electronics', 'fashion', 'home', 'beauty', 'sports', 'books', 'food', 'other']
    },
    
    // Precios y descuentos
    originalPrice: {
        type: Number,
        required: [true, 'El precio original es requerido'],
        min: [0, 'El precio no puede ser negativo']
    },
    currentPrice: {
        type: Number,
        required: [true, 'El precio actual es requerido'],
        min: [0, 'El precio no puede ser negativo']
    },
    currency: {
        type: String,
        required: [true, 'La moneda es requerida'],
        default: 'MXN',
        enum: ['MXN', 'USD', 'EUR']
    },
    discountPercentage: {
        type: Number,
        min: [0, 'El descuento no puede ser negativo'],
        max: [100, 'El descuento no puede exceder 100%']
    },
    
    // Información de ubicación y tienda
    storeName: {
        type: String,
        trim: true
    },
    storeLocation: {
        address: String,
        city: String,
        state: String,
        country: {
            type: String,
            default: 'México'
        },
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    isPhysicalStore: {
        type: Boolean,
        default: false
    },
    
    // Imágenes y archivos
    images: [{
        originalName: String,
        filename: String,
        path: String,
        cloudinaryUrl: String,
        cloudinaryPublicId: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Información de OCR
    ocrData: {
        extractedText: String,
        confidence: Number,
        ocrProvider: String,
        processedAt: Date
    },
    
    // Metadatos de la promoción
    tags: [String],
    features: [String],
    specifications: mongoose.Schema.Types.Mixed,
    
    // Estado y disponibilidad
    status: {
        type: String,
        enum: ['draft', 'active', 'paused', 'expired', 'deleted'],
        default: 'draft'
    },
    isHotOffer: {
        type: Boolean,
        default: false
    },
    hotness: {
        type: String,
        enum: ['fire', 'hot', 'warm'],
        default: 'warm'
    },
    
    // Fechas importantes
    validFrom: {
        type: Date,
        required: [true, 'La fecha de inicio es requerida']
    },
    validUntil: {
        type: Date,
        required: [true, 'La fecha de expiración es requerida']
    },
    
    // Información del vendedor
    seller: {
        name: String,
        email: String,
        phone: String,
        verified: {
            type: Boolean,
            default: false
        }
    },
    
    // Smart Contract (opcional)
    smartContract: {
        address: String,
        network: String,
        tokenStandard: String,
        blockchainExplorer: String
    },
    
    // Estadísticas
    views: {
        type: Number,
        default: 0
    },
    clicks: {
        type: Number,
        default: 0
    },
    conversions: {
        type: Number,
        default: 0
    },
    
    // Metadatos del sistema
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Índices para optimizar consultas
promotionSchema.index({ status: 1, validUntil: 1 });
promotionSchema.index({ category: 1, status: 1 });
promotionSchema.index({ isHotOffer: 1, status: 1 });
promotionSchema.index({ 'storeLocation.coordinates': '2dsphere' });
promotionSchema.index({ createdAt: -1 });

// Virtual para calcular si la promoción está activa
promotionSchema.virtual('isActive').get(function() {
    const now = new Date();
    return this.status === 'active' && 
           this.validFrom <= now && 
           this.validUntil >= now;
});

// Virtual para calcular días restantes
promotionSchema.virtual('daysRemaining').get(function() {
    if (!this.validUntil) return null;
    const now = new Date();
    const diffTime = this.validUntil - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
});

// Virtual para calcular el ahorro
promotionSchema.virtual('savings').get(function() {
    if (!this.originalPrice || !this.currentPrice) return 0;
    return this.originalPrice - this.currentPrice;
});

// Middleware para actualizar updatedAt
promotionSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Método estático para buscar promociones activas
promotionSchema.statics.findActive = function() {
    const now = new Date();
    return this.find({
        status: 'active',
        validFrom: { $lte: now },
        validUntil: { $gte: now }
    });
};

// Método estático para buscar ofertas calientes
promotionSchema.statics.findHotOffers = function() {
    return this.find({
        isHotOffer: true,
        status: 'active'
    });
};

// Método de instancia para incrementar vistas
promotionSchema.methods.incrementViews = function() {
    this.views += 1;
    return this.save();
};

// Método de instancia para incrementar clicks
promotionSchema.methods.incrementClicks = function() {
    this.clicks += 1;
    return this.save();
};

module.exports = mongoose.model('Promotion', promotionSchema);
