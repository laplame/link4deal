const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
    // Usuario que realizó la acción
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El usuario es requerido'],
        index: true
    },
    
    // Tipo de acción
    action: {
        type: String,
        required: [true, 'El tipo de acción es requerido'],
        enum: {
            values: [
                // Acciones de usuario
                'user_login', 'user_logout', 'user_register', 'user_profile_update',
                'user_password_change', 'user_email_verify', 'user_role_change',
                
                // Acciones de productos
                'product_view', 'product_search', 'product_favorite', 'product_unfavorite',
                'product_review', 'product_share',
                
                // Acciones de carrito
                'cart_add_item', 'cart_remove_item', 'cart_update_quantity', 'cart_clear',
                'cart_apply_coupon', 'cart_remove_coupon',
                
                // Acciones de promociones
                'promotion_view', 'promotion_use', 'promotion_share', 'promotion_favorite',
                'promotion_review', 'promotion_click',
                
                // Acciones de compra
                'order_create', 'order_update', 'order_cancel', 'order_complete',
                'payment_initiate', 'payment_success', 'payment_fail',
                
                // Acciones de agencia
                'agency_create', 'agency_update', 'agency_member_add', 'agency_member_remove',
                'agency_verify', 'agency_delete',
                
                // Acciones administrativas
                'admin_user_verify', 'admin_user_block', 'admin_user_delete',
                'admin_promotion_verify', 'admin_promotion_reject',
                'admin_agency_verify', 'admin_agency_reject',
                
                // Acciones de sistema
                'system_error', 'system_maintenance', 'system_backup'
            ],
            message: 'Tipo de acción no válido'
        },
        index: true
    },
    
    // Categoría de la acción
    category: {
        type: String,
        required: [true, 'La categoría es requerida'],
        enum: {
            values: ['user', 'product', 'cart', 'promotion', 'order', 'payment', 'agency', 'admin', 'system'],
            message: 'Categoría no válida'
        },
        index: true
    },
    
    // Descripción de la acción
    description: {
        type: String,
        required: [true, 'La descripción es requerida'],
        trim: true,
        maxlength: [500, 'La descripción no puede exceder 500 caracteres']
    },
    
    // Recurso afectado
    resource: {
        type: {
            type: String,
            enum: ['User', 'Product', 'Promotion', 'Agency', 'Cart', 'Order', 'Payment', 'Review'],
            required: true
        },
        id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'resource.type'
        }
    },
    
    // Datos antes del cambio (para acciones de actualización)
    previousData: {
        type: mongoose.Schema.Types.Mixed
    },
    
    // Datos después del cambio
    newData: {
        type: mongoose.Schema.Types.Mixed
    },
    
    // Detalles adicionales de la acción
    details: {
        // Información de la sesión
        sessionId: String,
        
        // Información del dispositivo/navegador
        userAgent: String,
        
        // Información de ubicación
        ip: String,
        location: {
            country: String,
            state: String,
            city: String,
            coordinates: {
                lat: Number,
                lng: Number
            }
        },
        
        // Información de la solicitud HTTP
        method: {
            type: String,
            enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
        },
        
        endpoint: String,
        
        statusCode: Number,
        
        responseTime: Number, // en milisegundos
        
        // Información adicional específica de la acción
        metadata: {
            type: Map,
            of: mongoose.Schema.Types.Mixed
        }
    },
    
    // Resultado de la acción
    result: {
        type: String,
        enum: {
            values: ['success', 'failure', 'partial', 'pending'],
            message: 'Resultado no válido'
        },
        default: 'success',
        index: true
    },
    
    // Mensaje de error (si aplica)
    error: {
        message: String,
        code: String,
        stack: String
    },
    
    // Nivel de importancia
    severity: {
        type: String,
        enum: {
            values: ['low', 'medium', 'high', 'critical'],
            message: 'Nivel de severidad no válido'
        },
        default: 'low',
        index: true
    },
    
    // Información de auditoría
    audit: {
        // Si la acción fue realizada por un administrador en nombre de otro usuario
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        
        // Razón de la acción (para acciones administrativas)
        reason: String,
        
        // Si la acción requiere aprobación
        requiresApproval: {
            type: Boolean,
            default: false
        },
        
        // Estado de aprobación
        approvalStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: function() {
                return this.requiresApproval ? 'pending' : 'approved';
            }
        },
        
        // Usuario que aprobó/rechazó
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        
        approvedAt: Date,
        
        // Notas de aprobación/rechazo
        approvalNotes: String
    },
    
    // Etiquetas para clasificación adicional
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    
    // Si la acción es visible para el usuario
    isVisible: {
        type: Boolean,
        default: true
    },
    
    // Si la acción ha sido archivada
    isArchived: {
        type: Boolean,
        default: false,
        index: true
    },
    
    // Fecha de expiración (para acciones temporales)
    expiresAt: {
        type: Date,
        index: { expireAfterSeconds: 0 }
    }
    
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Índices compuestos
historySchema.index({ user: 1, category: 1, createdAt: -1 });
historySchema.index({ action: 1, createdAt: -1 });
historySchema.index({ 'resource.type': 1, 'resource.id': 1, createdAt: -1 });
historySchema.index({ result: 1, severity: 1, createdAt: -1 });
historySchema.index({ category: 1, result: 1, createdAt: -1 });
historySchema.index({ tags: 1, createdAt: -1 });
historySchema.index({ 'audit.requiresApproval': 1, 'audit.approvalStatus': 1 });

// Índice de texto para búsqueda
historySchema.index({
    description: 'text',
    'audit.reason': 'text',
    tags: 'text'
});

// Virtuals
historySchema.virtual('isRecent').get(function() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.createdAt > oneDayAgo;
});

historySchema.virtual('isError').get(function() {
    return this.result === 'failure' || this.error;
});

historySchema.virtual('isCritical').get(function() {
    return this.severity === 'critical';
});

historySchema.virtual('requiresAttention').get(function() {
    return this.isCritical || 
           (this.audit.requiresApproval && this.audit.approvalStatus === 'pending') ||
           this.isError;
});

historySchema.virtual('formattedAction').get(function() {
    return this.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
});

// Middleware pre-save
historySchema.pre('save', function(next) {
    // Auto-asignar categoría basada en la acción
    if (!this.category) {
        if (this.action.startsWith('user_')) {
            this.category = 'user';
        } else if (this.action.startsWith('product_')) {
            this.category = 'product';
        } else if (this.action.startsWith('cart_')) {
            this.category = 'cart';
        } else if (this.action.startsWith('promotion_')) {
            this.category = 'promotion';
        } else if (this.action.startsWith('order_') || this.action.startsWith('payment_')) {
            this.category = 'order';
        } else if (this.action.startsWith('agency_')) {
            this.category = 'agency';
        } else if (this.action.startsWith('admin_')) {
            this.category = 'admin';
        } else if (this.action.startsWith('system_')) {
            this.category = 'system';
        }
    }
    
    // Auto-asignar severidad basada en el resultado
    if (!this.severity) {
        if (this.result === 'failure' && this.error) {
            this.severity = 'high';
        } else if (this.category === 'admin' || this.category === 'system') {
            this.severity = 'medium';
        } else {
            this.severity = 'low';
        }
    }
    
    // Establecer fecha de expiración para acciones de bajo impacto
    if (!this.expiresAt && this.severity === 'low' && this.category !== 'admin') {
        // Expirar después de 1 año
        this.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    }
    
    next();
});

// Métodos estáticos
historySchema.statics.logAction = function(actionData) {
    const history = new this(actionData);
    return history.save();
};

historySchema.statics.findByUser = function(userId, options = {}) {
    const query = { user: userId, isArchived: false };
    
    if (options.category) {
        query.category = options.category;
    }
    
    if (options.action) {
        query.action = options.action;
    }
    
    if (options.result) {
        query.result = options.result;
    }
    
    if (options.startDate || options.endDate) {
        query.createdAt = {};
        if (options.startDate) query.createdAt.$gte = options.startDate;
        if (options.endDate) query.createdAt.$lte = options.endDate;
    }
    
    return this.find(query)
        .sort({ createdAt: -1 })
        .limit(options.limit || 50)
        .populate('user', 'firstName lastName email')
        .populate('audit.performedBy', 'firstName lastName email')
        .populate('audit.approvedBy', 'firstName lastName email');
};

historySchema.statics.findByResource = function(resourceType, resourceId, options = {}) {
    const query = {
        'resource.type': resourceType,
        'resource.id': resourceId,
        isArchived: false
    };
    
    return this.find(query)
        .sort({ createdAt: -1 })
        .limit(options.limit || 20)
        .populate('user', 'firstName lastName email');
};

historySchema.statics.findErrors = function(options = {}) {
    const query = {
        result: 'failure',
        isArchived: false
    };
    
    if (options.severity) {
        query.severity = options.severity;
    }
    
    if (options.category) {
        query.category = options.category;
    }
    
    if (options.startDate || options.endDate) {
        query.createdAt = {};
        if (options.startDate) query.createdAt.$gte = options.startDate;
        if (options.endDate) query.createdAt.$lte = options.endDate;
    }
    
    return this.find(query)
        .sort({ createdAt: -1 })
        .limit(options.limit || 100)
        .populate('user', 'firstName lastName email');
};

historySchema.statics.findPendingApprovals = function(options = {}) {
    const query = {
        'audit.requiresApproval': true,
        'audit.approvalStatus': 'pending',
        isArchived: false
    };
    
    return this.find(query)
        .sort({ createdAt: -1 })
        .limit(options.limit || 50)
        .populate('user', 'firstName lastName email')
        .populate('audit.performedBy', 'firstName lastName email');
};

historySchema.statics.getActivityStats = function(startDate, endDate, groupBy = 'day') {
    const groupFormat = {
        day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        hour: { $dateToString: { format: '%Y-%m-%d %H:00', date: '$createdAt' } },
        month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }
    };
    
    return this.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate },
                isArchived: false
            }
        },
        {
            $group: {
                _id: {
                    date: groupFormat[groupBy],
                    category: '$category',
                    result: '$result'
                },
                count: { $sum: 1 }
            }
        },
        {
            $group: {
                _id: '$_id.date',
                categories: {
                    $push: {
                        category: '$_id.category',
                        result: '$_id.result',
                        count: '$count'
                    }
                },
                total: { $sum: '$count' }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);
};

historySchema.statics.getUserActivitySummary = function(userId, days = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return this.aggregate([
        {
            $match: {
                user: mongoose.Types.ObjectId(userId),
                createdAt: { $gte: startDate },
                isArchived: false
            }
        },
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 },
                lastAction: { $max: '$createdAt' },
                actions: { $addToSet: '$action' }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);
};

// Métodos de instancia
historySchema.methods.approve = function(approvedBy, notes) {
    if (!this.audit.requiresApproval) {
        throw new Error('Esta acción no requiere aprobación');
    }
    
    this.audit.approvalStatus = 'approved';
    this.audit.approvedBy = approvedBy;
    this.audit.approvedAt = new Date();
    if (notes) this.audit.approvalNotes = notes;
    
    return this.save();
};

historySchema.methods.reject = function(rejectedBy, reason) {
    if (!this.audit.requiresApproval) {
        throw new Error('Esta acción no requiere aprobación');
    }
    
    this.audit.approvalStatus = 'rejected';
    this.audit.approvedBy = rejectedBy;
    this.audit.approvedAt = new Date();
    this.audit.approvalNotes = reason;
    
    return this.save();
};

historySchema.methods.archive = function() {
    this.isArchived = true;
    return this.save();
};

historySchema.methods.addTag = function(tag) {
    if (!this.tags.includes(tag.toLowerCase())) {
        this.tags.push(tag.toLowerCase());
        return this.save();
    }
    return Promise.resolve(this);
};

historySchema.methods.removeTag = function(tag) {
    this.tags = this.tags.filter(t => t !== tag.toLowerCase());
    return this.save();
};

historySchema.methods.getPublicData = function() {
    const history = this.toObject();
    
    // Remover información sensible
    delete history.details.ip;
    delete history.error?.stack;
    delete history.__v;
    
    return history;
};

// Función helper para crear entradas de historial
historySchema.statics.createEntry = function(data) {
    return this.create({
        user: data.userId,
        action: data.action,
        description: data.description,
        resource: data.resource,
        previousData: data.previousData,
        newData: data.newData,
        details: {
            sessionId: data.sessionId,
            userAgent: data.userAgent,
            ip: data.ip,
            location: data.location,
            method: data.method,
            endpoint: data.endpoint,
            statusCode: data.statusCode,
            responseTime: data.responseTime,
            metadata: data.metadata
        },
        result: data.result || 'success',
        error: data.error,
        severity: data.severity,
        audit: data.audit,
        tags: data.tags,
        isVisible: data.isVisible !== false
    });
};

module.exports = mongoose.model('History', historySchema);
