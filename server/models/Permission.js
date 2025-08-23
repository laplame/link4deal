const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    // Permission Name
    name: {
        type: String,
        required: [true, 'El nombre del permiso es requerido'],
        unique: true,
        trim: true,
        lowercase: true
    },
    
    // Permission Description
    description: {
        type: String,
        required: [true, 'La descripción del permiso es requerida'],
        trim: true
    },
    
    // Permission Category
    category: {
        type: String,
        required: [true, 'La categoría del permiso es requerida'],
        enum: [
            'user-management',
            'content-management',
            'promotion-management',
            'agency-management',
            'influencer-management',
            'brand-management',
            'analytics',
            'billing',
            'admin',
            'moderation',
            'blockchain',
            'reporting'
        ]
    },
    
    // Permission Type
    type: {
        type: String,
        required: [true, 'El tipo de permiso es requerido'],
        enum: ['read', 'write', 'delete', 'admin', 'full-access'],
        default: 'read'
    },
    
    // Resource (what this permission applies to)
    resource: {
        type: String,
        required: [true, 'El recurso del permiso es requerido'],
        enum: [
            'users',
            'promotions',
            'agencies',
            'influencers',
            'brands',
            'campaigns',
            'analytics',
            'reports',
            'settings',
            'billing',
            'content',
            'moderation'
        ]
    },
    
    // Specific Actions allowed
    actions: [{
        type: String,
        enum: [
            'create',
            'read',
            'update',
            'delete',
            'approve',
            'reject',
            'publish',
            'unpublish',
            'export',
            'import',
            'manage',
            'view',
            'edit',
            'delete',
            'assign',
            'revoke'
        ]
    }],
    
    // Permission Level (hierarchical)
    level: {
        type: Number,
        required: [true, 'El nivel del permiso es requerido'],
        min: 1,
        max: 10,
        default: 1
    },
    
    // Is Active
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Is System Permission (cannot be deleted)
    isSystem: {
        type: Boolean,
        default: false
    },
    
    // Dependencies (other permissions required)
    dependencies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission'
    }],
    
    // Metadata
    metadata: {
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        lastModifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        version: {
            type: Number,
            default: 1
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
permissionSchema.index({ name: 1 });
permissionSchema.index({ category: 1 });
permissionSchema.index({ resource: 1 });
permissionSchema.index({ level: 1 });
permissionSchema.index({ isActive: 1 });

// Virtual for full permission identifier
permissionSchema.virtual('fullIdentifier').get(function() {
    return `${this.category}:${this.resource}:${this.name}`;
});

// Pre-save middleware to ensure lowercase name
permissionSchema.pre('save', function(next) {
    if (this.isModified('name')) {
        this.name = this.name.toLowerCase();
    }
    next();
});

// Static method to find by category
permissionSchema.statics.findByCategory = function(category) {
    return this.find({ category, isActive: true });
};

// Static method to find by resource
permissionSchema.statics.findByResource = function(resource) {
    return this.find({ resource, isActive: true });
};

// Static method to find system permissions
permissionSchema.statics.findSystemPermissions = function() {
    return this.find({ isSystem: true, isActive: true });
};

// Method to check if permission allows action
permissionSchema.methods.allowsAction = function(action) {
    return this.actions.includes(action);
};

// Method to check if permission has dependency
permissionSchema.methods.hasDependency = function(permissionId) {
    return this.dependencies.includes(permissionId);
};

module.exports = mongoose.model('Permission', permissionSchema);
