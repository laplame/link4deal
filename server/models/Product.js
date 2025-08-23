const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    // Información básica del producto
    name: {
        type: String,
        required: [true, 'El nombre del producto es requerido'],
        trim: true,
        maxlength: [200, 'El nombre no puede exceder 200 caracteres']
    },
    
    description: {
        type: String,
        required: [true, 'La descripción del producto es requerida'],
        trim: true,
        maxlength: [2000, 'La descripción no puede exceder 2000 caracteres']
    },
    
    shortDescription: {
        type: String,
        trim: true,
        maxlength: [500, 'La descripción corta no puede exceder 500 caracteres']
    },
    
    // Categorización
    category: {
        type: String,
        required: [true, 'La categoría es requerida'],
        trim: true,
        index: true
    },
    
    subcategory: {
        type: String,
        trim: true,
        index: true
    },
    
    tags: [{
        type: String,
        trim: true,
        index: true
    }],
    
    // Información de precio
    price: {
        type: Number,
        required: [true, 'El precio es requerido'],
        min: [0, 'El precio debe ser positivo']
    },
    
    originalPrice: {
        type: Number,
        min: [0, 'El precio original debe ser positivo']
    },
    
    currency: {
        type: String,
        required: [true, 'La moneda es requerida'],
        enum: {
            values: ['MXN', 'USD', 'EUR', 'COP', 'ARS', 'BRL'],
            message: 'Moneda no válida'
        },
        default: 'MXN'
    },
    
    // Inventario
    stock: {
        type: Number,
        required: [true, 'El stock es requerido'],
        min: [0, 'El stock no puede ser negativo'],
        default: 0
    },
    
    sku: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        uppercase: true
    },
    
    // Medios
    images: [{
        filename: String,
        originalName: String,
        path: String,
        alt: String,
        isPrimary: {
            type: Boolean,
            default: false
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    videos: [{
        filename: String,
        originalName: String,
        path: String,
        thumbnail: String,
        duration: Number,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Especificaciones técnicas
    specifications: {
        type: Map,
        of: String
    },
    
    dimensions: {
        length: Number,
        width: Number,
        height: Number,
        weight: Number,
        unit: {
            type: String,
            enum: ['cm', 'in', 'm'],
            default: 'cm'
        },
        weightUnit: {
            type: String,
            enum: ['g', 'kg', 'lb', 'oz'],
            default: 'kg'
        }
    },
    
    // Información del vendedor
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El vendedor es requerido'],
        index: true
    },
    
    brand: {
        name: String,
        logo: String,
        website: String
    },
    
    // Smart Contract (ERC-777)
    smartContract: {
        address: {
            type: String,
            validate: {
                validator: function(v) {
                    return !v || /^0x[a-fA-F0-9]{40}$/.test(v);
                },
                message: 'Dirección de smart contract inválida'
            }
        },
        network: {
            type: String,
            enum: ['ethereum', 'polygon', 'binance', 'arbitrum', 'optimism']
        },
        tokenStandard: {
            type: String,
            enum: ['ERC-20', 'ERC-721', 'ERC-777', 'ERC-1155'],
            default: 'ERC-777'
        },
        totalSupply: Number,
        decimals: {
            type: Number,
            default: 18
        },
        symbol: String,
        isActive: {
            type: Boolean,
            default: false
        }
    },
    
    // Estado y disponibilidad
    status: {
        type: String,
        enum: {
            values: ['draft', 'active', 'inactive', 'out-of-stock', 'discontinued'],
            message: 'Estado no válido'
        },
        default: 'draft',
        index: true
    },
    
    isAvailable: {
        type: Boolean,
        default: true,
        index: true
    },
    
    isFeatured: {
        type: Boolean,
        default: false,
        index: true
    },
    
    // Información de envío
    shipping: {
        weight: Number,
        dimensions: {
            length: Number,
            width: Number,
            height: Number
        },
        freeShipping: {
            type: Boolean,
            default: false
        },
        shippingCost: {
            type: Number,
            min: [0, 'El costo de envío debe ser positivo']
        },
        processingTime: {
            type: Number, // días
            min: [0, 'El tiempo de procesamiento debe ser positivo']
        },
        origin: {
            country: String,
            state: String,
            city: String
        }
    },
    
    // SEO
    seo: {
        title: String,
        description: String,
        keywords: [String],
        slug: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
            lowercase: true
        }
    },
    
    // Métricas
    metrics: {
        views: {
            type: Number,
            default: 0
        },
        purchases: {
            type: Number,
            default: 0
        },
        wishlistAdds: {
            type: Number,
            default: 0
        },
        cartAdds: {
            type: Number,
            default: 0
        },
        rating: {
            type: Number,
            min: [0, 'La calificación mínima es 0'],
            max: [5, 'La calificación máxima es 5'],
            default: 0
        },
        reviewCount: {
            type: Number,
            default: 0
        }
    },
    
    // Reseñas
    reviews: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        rating: {
            type: Number,
            required: [true, 'La calificación es requerida'],
            min: [1, 'La calificación mínima es 1'],
            max: [5, 'La calificación máxima es 5']
        },
        title: {
            type: String,
            trim: true,
            maxlength: [100, 'El título no puede exceder 100 caracteres']
        },
        comment: {
            type: String,
            trim: true,
            maxlength: [1000, 'El comentario no puede exceder 1000 caracteres']
        },
        images: [{
            filename: String,
            path: String,
            uploadedAt: {
                type: Date,
                default: Date.now
            }
        }],
        isVerified: {
            type: Boolean,
            default: false
        },
        helpfulCount: {
            type: Number,
            default: 0
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Promociones activas
    activePromotions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Promotion'
    }],
    
    // Variantes del producto
    variants: [{
        name: String, // Color, Talla, etc.
        value: String, // Rojo, XL, etc.
        price: Number,
        stock: Number,
        sku: String,
        images: [String]
    }],
    
    // Metadatos
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
    
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Índices compuestos
productSchema.index({ category: 1, status: 1 });
productSchema.index({ seller: 1, status: 1 });
productSchema.index({ price: 1, category: 1 });
productSchema.index({ 'metrics.rating': -1, 'metrics.reviewCount': -1 });
productSchema.index({ isFeatured: 1, createdAt: -1 });
productSchema.index({ tags: 1, status: 1 });

// Índice de texto para búsqueda
productSchema.index({
    name: 'text',
    description: 'text',
    'brand.name': 'text',
    tags: 'text'
}, {
    weights: {
        name: 10,
        'brand.name': 5,
        tags: 3,
        description: 1
    }
});

// Virtuals
productSchema.virtual('primaryImage').get(function() {
    const primary = this.images.find(img => img.isPrimary);
    return primary || this.images[0];
});

productSchema.virtual('isOnSale').get(function() {
    return this.originalPrice && this.originalPrice > this.price;
});

productSchema.virtual('discountPercentage').get(function() {
    if (!this.isOnSale) return 0;
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
});

productSchema.virtual('isInStock').get(function() {
    return this.stock > 0;
});

productSchema.virtual('averageRating').get(function() {
    return this.metrics.rating;
});

productSchema.virtual('url').get(function() {
    return `/products/${this.seo.slug || this._id}`;
});

// Middleware pre-save
productSchema.pre('save', function(next) {
    // Generar SKU si no existe
    if (!this.sku) {
        this.sku = `PRD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    }
    
    // Generar slug si no existe
    if (!this.seo.slug && this.name) {
        this.seo.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    
    // Actualizar estado basado en stock
    if (this.stock === 0 && this.status === 'active') {
        this.status = 'out-of-stock';
    } else if (this.stock > 0 && this.status === 'out-of-stock') {
        this.status = 'active';
    }
    
    // Validar que solo una imagen sea primaria
    const primaryImages = this.images.filter(img => img.isPrimary);
    if (primaryImages.length > 1) {
        this.images.forEach((img, index) => {
            img.isPrimary = index === 0;
        });
    } else if (primaryImages.length === 0 && this.images.length > 0) {
        this.images[0].isPrimary = true;
    }
    
    next();
});

// Middleware post-save
productSchema.post('save', function() {
    // Actualizar métricas de calificación
    if (this.reviews.length > 0) {
        const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
        this.metrics.rating = totalRating / this.reviews.length;
        this.metrics.reviewCount = this.reviews.length;
    }
});

// Métodos estáticos
productSchema.statics.findByCategory = function(category, options = {}) {
    const query = { category, status: 'active' };
    return this.find(query, null, options);
};

productSchema.statics.findFeatured = function(limit = 10) {
    return this.find({ isFeatured: true, status: 'active' })
        .sort({ createdAt: -1 })
        .limit(limit);
};

productSchema.statics.searchProducts = function(searchTerm, options = {}) {
    return this.find(
        { 
            $text: { $search: searchTerm },
            status: 'active'
        },
        { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .limit(options.limit || 20);
};

productSchema.statics.findBySeller = function(sellerId, options = {}) {
    return this.find({ seller: sellerId }, null, options);
};

productSchema.statics.getTopRated = function(limit = 10) {
    return this.find({ status: 'active', 'metrics.reviewCount': { $gte: 5 } })
        .sort({ 'metrics.rating': -1, 'metrics.reviewCount': -1 })
        .limit(limit);
};

// Métodos de instancia
productSchema.methods.addReview = function(userId, rating, comment, title) {
    // Verificar que el usuario no haya dejado ya una reseña
    const existingReview = this.reviews.find(
        review => review.user.toString() === userId.toString()
    );
    
    if (existingReview) {
        throw new Error('Ya has dejado una reseña para este producto');
    }
    
    this.reviews.push({
        user: userId,
        rating,
        comment,
        title,
        createdAt: new Date()
    });
    
    // Recalcular métricas
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.metrics.rating = totalRating / this.reviews.length;
    this.metrics.reviewCount = this.reviews.length;
    
    return this.save();
};

productSchema.methods.updateStock = function(quantity) {
    this.stock = Math.max(0, this.stock + quantity);
    
    // Actualizar estado basado en stock
    if (this.stock === 0 && this.status === 'active') {
        this.status = 'out-of-stock';
    } else if (this.stock > 0 && this.status === 'out-of-stock') {
        this.status = 'active';
    }
    
    return this.save();
};

productSchema.methods.incrementViews = function() {
    this.metrics.views += 1;
    return this.save();
};

productSchema.methods.addToWishlist = function() {
    this.metrics.wishlistAdds += 1;
    return this.save();
};

productSchema.methods.addToCart = function() {
    this.metrics.cartAdds += 1;
    return this.save();
};

productSchema.methods.recordPurchase = function() {
    this.metrics.purchases += 1;
    return this.save();
};

productSchema.methods.getPublicData = function() {
    const product = this.toObject();
    
    // Remover información sensible
    delete product.metrics.purchases;
    delete product.__v;
    
    return product;
};

module.exports = mongoose.model('Product', productSchema);
