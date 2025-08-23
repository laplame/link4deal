const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    // Role Name
    name: {
        type: String,
        required: [true, 'El nombre del rol es requerido'],
        unique: true,
        trim: true,
        lowercase: true
    },
    
    // Role Display Name
    displayName: {
        type: String,
        required: [true, 'El nombre de visualización del rol es requerido'],
        trim: true
    },
    
    // Role Description
    description: {
        type: String,
        required: [true, 'La descripción del rol es requerida'],
        trim: true
    },
    
    // Role Type (User Type)
    type: {
        type: String,
        required: [true, 'El tipo de rol es requerido'],
        enum: [
            'user',           // Usuario básico
            'influencer',     // Influencer
            'brand',          // Marca
            'agency',         // Agencia
            'admin',          // Administrador
            'moderator',      // Moderador
            'support',        // Soporte
            'analyst'         // Analista
        ]
    },
    
    // Role Level (hierarchical access)
    level: {
        type: Number,
        required: [true, 'El nivel del rol es requerido'],
        min: 1,
        max: 10,
        default: 1
    },
    
    // Is Default Role (assigned to new users)
    isDefault: {
        type: Boolean,
        default: false
    },
    
    // Is System Role (cannot be deleted/modified)
    isSystem: {
        type: Boolean,
        default: false
    },
    
    // Role Status
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Permissions associated with this role
    permissions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission',
        required: true
    }],
    
    // Role-specific capabilities
    capabilities: {
        // User Management
        canManageUsers: {
            type: Boolean,
            default: false
        },
        canCreateUsers: {
            type: Boolean,
            default: false
        },
        canDeleteUsers: {
            type: Boolean,
            default: false
        },
        
        // Content Management
        canCreateContent: {
            type: Boolean,
            default: false
        },
        canEditContent: {
            type: Boolean,
            default: false
        },
        canDeleteContent: {
            type: Boolean,
            default: false
        },
        canPublishContent: {
            type: Boolean,
            default: false
        },
        
        // Promotion Management
        canCreatePromotions: {
            type: Boolean,
            default: false
        },
        canEditPromotions: {
            type: Boolean,
            default: false
        },
        canDeletePromotions: {
            type: Boolean,
            default: false
        },
        canApprovePromotions: {
            type: Boolean,
            default: false
        },
        canManagePromotions: {
            type: Boolean,
            default: false
        },
        
        // Agency Management
        canManageAgencies: {
            type: Boolean,
            default: false
        },
        canCreateAgencies: {
            type: Boolean,
            default: false
        },
        canEditAgencies: {
            type: Boolean,
            default: false
        },
        canDeleteAgencies: {
            type: Boolean,
            default: false
        },
        
        // Influencer Management
        canManageInfluencers: {
            type: Boolean,
            default: false
        },
        canApproveInfluencers: {
            type: Boolean,
            default: false
        },
        canVerifyInfluencers: {
            type: Boolean,
            default: false
        },
        
        // Brand Management
        canManageBrands: {
            type: Boolean,
            default: false
        },
        canApproveBrands: {
            type: Boolean,
            default: false
        },
        canVerifyBrands: {
            type: Boolean,
            default: false
        },
        
        // Analytics and Reporting
        canViewAnalytics: {
            type: Boolean,
            default: false
        },
        canExportReports: {
            type: Boolean,
            default: false
        },
        canViewFinancialData: {
            type: Boolean,
            default: false
        },
        
        // System Administration
        canAccessAdminPanel: {
            type: Boolean,
            default: false
        },
        canManageSystem: {
            type: Boolean,
            default: false
        },
        canManageRoles: {
            type: Boolean,
            default: false
        },
        
        // Blockchain Operations
        canManageSmartContracts: {
            type: Boolean,
            default: false
        },
        canDeployContracts: {
            type: Boolean,
            default: false
        },
        canManageWallets: {
            type: Boolean,
            default: false
        },
        
        // Referral System
        canManageReferrals: {
            type: Boolean,
            default: false
        },
        canViewReferralStats: {
            type: Boolean,
            default: false
        },
        canManageReferralPrograms: {
            type: Boolean,
            default: false
        }
    },
    
    // Role-specific limits and restrictions
    limits: {
        maxPromotionsPerMonth: {
            type: Number,
            default: 0
        },
        maxInfluencersPerBrand: {
            type: Number,
            default: 0
        },
        maxBrandsPerAgency: {
            type: Number,
            default: 0
        },
        maxTeamMembers: {
            type: Number,
            default: 0
        },
        maxFileUploadSize: {
            type: Number,
            default: 0
        },
        maxStorageQuota: {
            type: Number,
            default: 0
        }
    },
    
    // Role-specific features access
    features: {
        canUseAdvancedAnalytics: {
            type: Boolean,
            default: false
        },
        canUseAIBeta: {
            type: Boolean,
            default: false
        },
        canUsePrioritySupport: {
            type: Boolean,
            default: false
        },
        canUseCustomBranding: {
            type: Boolean,
            default: false
        },
        canUseAPI: {
            type: Boolean,
            default: false
        },
        canUseWebhooks: {
            type: Boolean,
            default: false
        }
    },
    
    // Role metadata
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
        },
        notes: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
roleSchema.index({ name: 1 });
roleSchema.index({ type: 1 });
roleSchema.index({ level: 1 });
roleSchema.index({ isActive: 1 });
roleSchema.index({ isDefault: 1 });

// Virtual for role identifier
roleSchema.virtual('roleIdentifier').get(function() {
    return `${this.type}:${this.name}`;
});

// Pre-save middleware
roleSchema.pre('save', function(next) {
    if (this.isModified('name')) {
        this.name = this.name.toLowerCase();
    }
    next();
});

// Static method to find by type
roleSchema.statics.findByType = function(type) {
    return this.find({ type, isActive: true });
};

// Static method to find default roles
roleSchema.statics.findDefaultRoles = function() {
    return this.find({ isDefault: true, isActive: true });
};

// Static method to find system roles
roleSchema.statics.findSystemRoles = function() {
    return this.find({ isSystem: true, isActive: true });
};

// Static method to find by level
roleSchema.statics.findByLevel = function(level) {
    return this.find({ level, isActive: true });
};

// Method to check if role has permission
roleSchema.methods.hasPermission = function(permissionId) {
    return this.permissions.some(permission => 
        permission.toString() === permissionId.toString()
    );
};

// Method to check if role has capability
roleSchema.methods.hasCapability = function(capability) {
    return this.capabilities[capability] === true;
};

// Method to check if role can perform action
roleSchema.methods.canPerformAction = function(action, resource) {
    // Check if role has the specific permission for this action/resource
    const hasPermission = this.permissions.some(permission => {
        // This would need to be implemented based on your permission structure
        return permission.resource === resource && permission.actions.includes(action);
    });
    
    return hasPermission;
};

// Method to add permission
roleSchema.methods.addPermission = function(permissionId) {
    if (!this.permissions.includes(permissionId)) {
        this.permissions.push(permissionId);
    }
    return this.save();
};

// Method to remove permission
roleSchema.methods.removePermission = function(permissionId) {
    this.permissions = this.permissions.filter(permission => 
        permission.toString() !== permissionId.toString()
    );
    return this.save();
};

module.exports = mongoose.model('Role', roleSchema);
