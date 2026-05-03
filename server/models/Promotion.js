const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

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
        default: '',
        trim: true,
        maxlength: [1000, 'La descripción no puede exceder 1000 caracteres']
    },
    
    // Información del producto
    productName: {
        type: String,
        default: '',
        trim: true
    },
    brand: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        default: 'other',
        enum: ['electronics', 'fashion', 'home', 'beauty', 'sports', 'books', 'food', 'other']
    },
    
    // Precios y descuentos
    originalPrice: {
        type: Number,
        default: 0,
        min: [0, 'El precio no puede ser negativo']
    },
    currentPrice: {
        type: Number,
        default: 0,
        min: [0, 'El precio no puede ser negativo']
    },
    currency: {
        type: String,
        default: 'USD',
        enum: ['USD', 'MXN']
    },
    discountPercentage: {
        type: Number,
        min: [0, 'El descuento no puede ser negativo'],
        max: [100, 'El descuento no puede exceder 100%']
    },
    /** Tipo de oferta para conversión a unidad calculable (contrato): percentage | bogo | cashback_fixed | cashback_percentage */
    offerType: {
        type: String,
        enum: ['percentage', 'bogo', 'cashback_fixed', 'cashback_percentage'],
        default: 'percentage'
    },
    /** Valor del cashback cuando es fijo (USD) o porcentaje aplicado sobre compra (0-100). Para cashback_percentage se usa sobre originalPrice o monto de compra. */
    cashbackValue: { type: Number, default: null },
    /** Valor promocional en USD = unidad calculable del contrato. X tokens = X USD. Pasivo financiero medible. Calculable por getPromotionalValueUsd(). */
    promotionalValueUsd: {
        type: Number,
        default: null,
        min: [0, 'El valor promocional no puede ser negativo']
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
    /**
     * Si es true, el cupón solo debe activarse cuando el usuario está dentro del radio
     * respecto a storeLocation.coordinates (validación en cliente; backend puede ampliarse).
     */
    activateByGps: {
        type: Boolean,
        default: false
    },
    /** Radio en metros para geocerca (solo aplica con activateByGps y coordenadas de tienda). */
    gpsRadiusMeters: {
        type: Number,
        default: 500,
        min: [50, 'El radio mínimo es 50 m'],
        max: [50000, 'El radio máximo es 50 km']
    },
    /** IDs de tiendas donde aplica la promoción (si está vacío, aplica a todas) */
    allowedShopIds: [{
        type: String,
        trim: true
    }],
    /** IDs de productos a los que aplica la promoción (si está vacío, aplica a todos) */
    allowedProductIds: [{
        type: String,
        trim: true
    }],

    /**
     * Cadena de tiendas: misma promoción en todas las sucursales listadas.
     * Con activateByGps, la validación puede usar la sucursal más cercana al usuario.
     */
    isChainStore: {
        type: Boolean,
        default: false
    },
    /** Nombre comercial de la cadena (ej. Starbucks); puede coincidir con storeName. */
    chainBrandName: {
        type: String,
        trim: true,
        default: ''
    },
    chainLocations: [{
        branchName: { type: String, trim: true },
        address: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        country: { type: String, trim: true, default: 'México' },
        coordinates: {
            latitude: Number,
            longitude: Number
        },
        mapsUrl: { type: String, trim: true }
    }],

    // Imágenes y archivos
    images: [{
        originalName: String,
        filename: String,
        path: String,
        url: String,           // URL pública para el frontend (ej: /uploads/promotions/promotion-xxx.jpg)
        cloudinaryUrl: String,
        cloudinaryPublicId: String,
        /** Origen del archivo: cartel promocional o imagen solo de términos y condiciones */
        imageRole: {
            type: String,
            enum: ['promotional', 'terms'],
            default: 'promotional'
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Información de OCR
    ocrData: {
        extractedText: String,
        /** Texto legal acumulado solo desde imágenes enviadas como términos (OCR). */
        termsFromAttachments: String,
        confidence: Number,
        ocrProvider: String,
        processedAt: Date
    },
    
    // Metadatos de la promoción
    tags: [String],
    features: [String],
    specifications: mongoose.Schema.Types.Mixed,
    /** Términos y condiciones (ej. extraídos de imagen con Gemini). */
    termsAndConditions: {
        type: String,
        default: '',
        trim: true,
        maxlength: [5000, 'Términos y condiciones no puede exceder 5000 caracteres']
    },
    
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
    
    // Fechas importantes (por defecto: desde ahora hasta 30 días)
    validFrom: {
        type: Date,
        default: Date.now
    },
    validUntil: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },

    /** Límite de promociones redimibles (control de inventario promocional). Si se define, al llegar a este número la promoción se considera agotada. */
    totalQuantity: {
        type: Number,
        default: null,
        min: [0, 'totalQuantity no puede ser negativo']
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

    /**
     * Atribución / integración (opcionales; alineados al payload opcional del cupón QR).
     * No son obligatorios para crear la promoción.
     */
    brandId: { type: String, trim: true },
    shopId: { type: String, trim: true },
    /** Id de producto en catálogo externo (distinto de _id de la promoción). */
    externalProductId: { type: String, trim: true },
    gtmTag: { type: String, trim: true },
    campaignId: { type: String, trim: true },
    source: { type: String, trim: true },
    medium: { type: String, trim: true },

    /** Si es true, al solicitar cupón no se genera QR; se redirige a redirectToUrl (ej. link de afiliado Amazon). */
    redirectInsteadOfQr: { type: Boolean, default: false },
    /** URL de redirección para comprar (ej. Amazon afiliado). Si redirectInsteadOfQr y está vacío, se usa el default del sistema (amzn.to). */
    redirectToUrl: { type: String, trim: true, default: '' },
    
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
// Nota: 2dsphere exige GeoJSON { type: 'Point', coordinates: [lng, lat] } o par legacy [lng, lat].
// Las coordenadas del modelo son { latitude, longitude }; un índice 2dsphere aquí hace fallar insertMany/save.
// Si necesitas búsquedas por radio, añade un campo GeoJSON y rellénalo en el controlador, o migra coordenadas a ese formato.
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

// Agregar plugin de paginación
promotionSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Promotion', promotionSchema);
