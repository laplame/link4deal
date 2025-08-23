const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'El producto es requerido']
    },
    
    promotion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Promotion'
    },
    
    quantity: {
        type: Number,
        required: [true, 'La cantidad es requerida'],
        min: [1, 'La cantidad mínima es 1'],
        max: [100, 'La cantidad máxima es 100']
    },
    
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
    
    // Variante del producto seleccionada
    variant: {
        name: String,
        value: String,
        sku: String
    },
    
    // Descuentos aplicados
    discounts: [{
        type: {
            type: String,
            enum: ['promotion', 'coupon', 'loyalty', 'bulk'],
            required: true
        },
        name: String,
        code: String,
        amount: {
            type: Number,
            min: [0, 'El descuento debe ser positivo']
        },
        percentage: {
            type: Number,
            min: [0, 'El porcentaje debe ser positivo'],
            max: [100, 'El porcentaje no puede exceder 100%']
        },
        appliedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Notas especiales del cliente
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Las notas no pueden exceder 500 caracteres']
    },
    
    // Estado del item
    isAvailable: {
        type: Boolean,
        default: true
    },
    
    // Información de envío específica
    shipping: {
        required: {
            type: Boolean,
            default: true
        },
        cost: {
            type: Number,
            min: [0, 'El costo de envío debe ser positivo']
        },
        estimatedDays: {
            type: Number,
            min: [1, 'Los días estimados deben ser al menos 1']
        }
    },
    
    addedAt: {
        type: Date,
        default: Date.now
    },
    
    lastModified: {
        type: Date,
        default: Date.now
    }
}, {
    _id: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const cartSchema = new mongoose.Schema({
    // Usuario propietario del carrito
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El usuario es requerido'],
        unique: true,
        index: true
    },
    
    // Items en el carrito
    items: [cartItemSchema],
    
    // Información de totales
    totals: {
        subtotal: {
            type: Number,
            default: 0,
            min: [0, 'El subtotal debe ser positivo']
        },
        
        discounts: {
            type: Number,
            default: 0,
            min: [0, 'Los descuentos deben ser positivos']
        },
        
        taxes: {
            type: Number,
            default: 0,
            min: [0, 'Los impuestos deben ser positivos']
        },
        
        shipping: {
            type: Number,
            default: 0,
            min: [0, 'El costo de envío debe ser positivo']
        },
        
        total: {
            type: Number,
            default: 0,
            min: [0, 'El total debe ser positivo']
        },
        
        currency: {
            type: String,
            enum: {
                values: ['MXN', 'USD', 'EUR', 'COP', 'ARS', 'BRL'],
                message: 'Moneda no válida'
            },
            default: 'MXN'
        }
    },
    
    // Cupones aplicados al carrito completo
    coupons: [{
        code: {
            type: String,
            required: true,
            uppercase: true
        },
        name: String,
        type: {
            type: String,
            enum: ['percentage', 'fixed', 'free-shipping'],
            required: true
        },
        value: {
            type: Number,
            required: true,
            min: [0, 'El valor del cupón debe ser positivo']
        },
        minimumPurchase: {
            type: Number,
            min: [0, 'La compra mínima debe ser positiva']
        },
        maximumDiscount: {
            type: Number,
            min: [0, 'El descuento máximo debe ser positivo']
        },
        appliedAt: {
            type: Date,
            default: Date.now
        },
        discount: {
            type: Number,
            min: [0, 'El descuento debe ser positivo']
        }
    }],
    
    // Información de envío
    shipping: {
        address: {
            street: String,
            city: String,
            state: String,
            zipCode: String,
            country: String
        },
        
        method: {
            type: String,
            enum: ['standard', 'express', 'overnight', 'pickup'],
            default: 'standard'
        },
        
        cost: {
            type: Number,
            default: 0,
            min: [0, 'El costo de envío debe ser positivo']
        },
        
        estimatedDays: {
            type: Number,
            min: [1, 'Los días estimados deben ser al menos 1']
        },
        
        isFree: {
            type: Boolean,
            default: false
        }
    },
    
    // Estado del carrito
    status: {
        type: String,
        enum: {
            values: ['active', 'abandoned', 'converted', 'expired'],
            message: 'Estado no válido'
        },
        default: 'active',
        index: true
    },
    
    // Información de sesión
    sessionId: {
        type: String,
        index: true
    },
    
    // Fecha de expiración
    expiresAt: {
        type: Date,
        default: function() {
            return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días
        },
        index: { expireAfterSeconds: 0 }
    },
    
    // Información de conversión
    conversion: {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order'
        },
        convertedAt: Date,
        conversionValue: Number
    },
    
    // Metadatos
    metadata: {
        source: String, // web, mobile, api
        referrer: String,
        userAgent: String,
        ip: String,
        location: {
            country: String,
            state: String,
            city: String
        }
    }
    
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Índices
cartSchema.index({ user: 1, status: 1 });
cartSchema.index({ sessionId: 1 });
cartSchema.index({ status: 1, updatedAt: 1 });
cartSchema.index({ expiresAt: 1 });

// Virtuals para cartItemSchema
cartItemSchema.virtual('totalPrice').get(function() {
    let total = this.price * this.quantity;
    
    // Aplicar descuentos
    if (this.discounts && this.discounts.length > 0) {
        this.discounts.forEach(discount => {
            if (discount.percentage) {
                total -= (total * discount.percentage / 100);
            } else if (discount.amount) {
                total -= discount.amount;
            }
        });
    }
    
    return Math.max(0, total);
});

cartItemSchema.virtual('savings').get(function() {
    if (!this.originalPrice) return 0;
    return (this.originalPrice - this.price) * this.quantity;
});

cartItemSchema.virtual('discountAmount').get(function() {
    let discount = 0;
    
    if (this.discounts && this.discounts.length > 0) {
        const basePrice = this.price * this.quantity;
        this.discounts.forEach(d => {
            if (d.percentage) {
                discount += (basePrice * d.percentage / 100);
            } else if (d.amount) {
                discount += d.amount;
            }
        });
    }
    
    return discount;
});

// Virtuals para cartSchema
cartSchema.virtual('itemCount').get(function() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
});

cartSchema.virtual('uniqueItemCount').get(function() {
    return this.items.length;
});

cartSchema.virtual('totalSavings').get(function() {
    return this.items.reduce((total, item) => total + (item.savings || 0), 0);
});

cartSchema.virtual('isEmpty').get(function() {
    return this.items.length === 0;
});

cartSchema.virtual('isExpired').get(function() {
    return new Date() > this.expiresAt;
});

cartSchema.virtual('daysUntilExpiration').get(function() {
    const now = new Date();
    const diffTime = this.expiresAt - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Middleware pre-save
cartSchema.pre('save', function(next) {
    // Actualizar lastModified en items modificados
    this.items.forEach(item => {
        if (item.isModified()) {
            item.lastModified = new Date();
        }
    });
    
    // Recalcular totales
    this.calculateTotals();
    
    // Verificar disponibilidad de items
    this.checkItemAvailability();
    
    next();
});

// Métodos de instancia
cartSchema.methods.addItem = function(productId, quantity = 1, options = {}) {
    const existingItemIndex = this.items.findIndex(
        item => item.product.toString() === productId.toString() &&
                JSON.stringify(item.variant) === JSON.stringify(options.variant)
    );
    
    if (existingItemIndex > -1) {
        // Actualizar cantidad del item existente
        this.items[existingItemIndex].quantity += quantity;
        this.items[existingItemIndex].lastModified = new Date();
    } else {
        // Agregar nuevo item
        this.items.push({
            product: productId,
            quantity,
            price: options.price,
            originalPrice: options.originalPrice,
            currency: options.currency || 'MXN',
            variant: options.variant,
            promotion: options.promotion,
            notes: options.notes,
            shipping: options.shipping
        });
    }
    
    return this.save();
};

cartSchema.methods.removeItem = function(itemId) {
    this.items = this.items.filter(item => item._id.toString() !== itemId.toString());
    return this.save();
};

cartSchema.methods.updateItemQuantity = function(itemId, quantity) {
    const item = this.items.id(itemId);
    if (!item) {
        throw new Error('Item no encontrado en el carrito');
    }
    
    if (quantity <= 0) {
        return this.removeItem(itemId);
    }
    
    item.quantity = quantity;
    item.lastModified = new Date();
    
    return this.save();
};

cartSchema.methods.clearItems = function() {
    this.items = [];
    this.coupons = [];
    return this.save();
};

cartSchema.methods.applyCoupon = function(couponCode, couponData) {
    // Verificar que el cupón no esté ya aplicado
    const existingCoupon = this.coupons.find(c => c.code === couponCode.toUpperCase());
    if (existingCoupon) {
        throw new Error('Este cupón ya está aplicado');
    }
    
    // Verificar compra mínima
    if (couponData.minimumPurchase && this.totals.subtotal < couponData.minimumPurchase) {
        throw new Error(`Compra mínima de ${couponData.minimumPurchase} requerida`);
    }
    
    // Calcular descuento
    let discount = 0;
    if (couponData.type === 'percentage') {
        discount = this.totals.subtotal * (couponData.value / 100);
        if (couponData.maximumDiscount) {
            discount = Math.min(discount, couponData.maximumDiscount);
        }
    } else if (couponData.type === 'fixed') {
        discount = couponData.value;
    } else if (couponData.type === 'free-shipping') {
        discount = this.totals.shipping;
    }
    
    this.coupons.push({
        code: couponCode.toUpperCase(),
        name: couponData.name,
        type: couponData.type,
        value: couponData.value,
        minimumPurchase: couponData.minimumPurchase,
        maximumDiscount: couponData.maximumDiscount,
        discount: discount
    });
    
    return this.save();
};

cartSchema.methods.removeCoupon = function(couponCode) {
    this.coupons = this.coupons.filter(c => c.code !== couponCode.toUpperCase());
    return this.save();
};

cartSchema.methods.calculateTotals = function() {
    // Calcular subtotal
    this.totals.subtotal = this.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
    
    // Calcular descuentos de items
    const itemDiscounts = this.items.reduce((total, item) => {
        return total + (item.discountAmount || 0);
    }, 0);
    
    // Calcular descuentos de cupones
    const couponDiscounts = this.coupons.reduce((total, coupon) => {
        return total + (coupon.discount || 0);
    }, 0);
    
    this.totals.discounts = itemDiscounts + couponDiscounts;
    
    // Calcular envío
    this.totals.shipping = this.items.reduce((total, item) => {
        return total + (item.shipping?.cost || 0);
    }, 0);
    
    // Aplicar envío gratis de cupones
    const freeShippingCoupon = this.coupons.find(c => c.type === 'free-shipping');
    if (freeShippingCoupon) {
        this.totals.shipping = 0;
    }
    
    // Calcular impuestos (ejemplo: 16% IVA en México)
    const taxableAmount = this.totals.subtotal - this.totals.discounts;
    this.totals.taxes = taxableAmount * 0.16;
    
    // Calcular total
    this.totals.total = this.totals.subtotal - this.totals.discounts + this.totals.taxes + this.totals.shipping;
    this.totals.total = Math.max(0, this.totals.total);
};

cartSchema.methods.checkItemAvailability = async function() {
    const Product = mongoose.model('Product');
    
    for (let item of this.items) {
        const product = await Product.findById(item.product);
        if (!product || product.status !== 'active' || product.stock < item.quantity) {
            item.isAvailable = false;
        } else {
            item.isAvailable = true;
        }
    }
};

cartSchema.methods.convertToOrder = function(orderId) {
    this.status = 'converted';
    this.conversion = {
        orderId: orderId,
        convertedAt: new Date(),
        conversionValue: this.totals.total
    };
    
    return this.save();
};

cartSchema.methods.markAsAbandoned = function() {
    this.status = 'abandoned';
    return this.save();
};

cartSchema.methods.extendExpiration = function(days = 30) {
    this.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return this.save();
};

cartSchema.methods.getCheckoutData = function() {
    return {
        items: this.items.map(item => ({
            product: item.product,
            quantity: item.quantity,
            price: item.price,
            totalPrice: item.totalPrice,
            variant: item.variant,
            notes: item.notes
        })),
        totals: this.totals,
        coupons: this.coupons,
        shipping: this.shipping,
        itemCount: this.itemCount,
        totalSavings: this.totalSavings
    };
};

// Métodos estáticos
cartSchema.statics.findByUser = function(userId) {
    return this.findOne({ user: userId, status: 'active' });
};

cartSchema.statics.findAbandonedCarts = function(daysOld = 7) {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    return this.find({
        status: 'active',
        updatedAt: { $lt: cutoffDate },
        items: { $ne: [] }
    });
};

cartSchema.statics.getConversionStats = function(startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalValue: { $sum: '$totals.total' }
            }
        }
    ]);
};

module.exports = mongoose.model('Cart', cartSchema);
