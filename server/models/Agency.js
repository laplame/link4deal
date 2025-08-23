const mongoose = require('mongoose');

const agencySchema = new mongoose.Schema({
    // Basic Agency Information
    name: {
        type: String,
        required: [true, 'El nombre de la agencia es requerido'],
        trim: true,
        maxlength: [100, 'El nombre no puede tener más de 100 caracteres']
    },
    
    // Agency Type and Category
    type: {
        type: String,
        required: [true, 'El tipo de agencia es requerido'],
        enum: [
            'advertising',
            'digital-marketing',
            'public-relations',
            'influencer-marketing',
            'creative',
            'media-buying',
            'full-service',
            'specialized',
            'boutique',
            'corporate'
        ]
    },
    
    category: {
        type: String,
        required: [true, 'La categoría de la agencia es requerida'],
        enum: [
            'startup',
            'small',
            'medium',
            'large',
            'enterprise',
            'multinational'
        ]
    },
    
    // Agency Details
    description: {
        type: String,
        required: [true, 'La descripción de la agencia es requerida'],
        maxlength: [1000, 'La descripción no puede tener más de 1000 caracteres']
    },
    
    logo: {
        type: String,
        default: null
    },
    
    website: {
        type: String,
        trim: true,
        match: [/^https?:\/\/.+/, 'URL inválida']
    },
    
    // Contact Information
    contact: {
        email: {
            type: String,
            required: [true, 'El email de contacto es requerido'],
            lowercase: true,
            trim: true
        },
        phone: {
            type: String,
            trim: true
        },
        address: {
            street: String,
            city: String,
            state: String,
            country: String,
            zipCode: String
        }
    },
    
    // Agency Size and Structure
    size: {
        employees: {
            type: Number,
            min: 1
        },
        founded: Number,
        headquarters: String,
        offices: [{
            city: String,
            country: String,
            type: {
                type: String,
                enum: ['headquarters', 'branch', 'representative']
            }
        }]
    },
    
    // Services and Specializations
    services: [{
        type: String,
        enum: [
            'brand-strategy',
            'creative-design',
            'digital-advertising',
            'social-media-marketing',
            'influencer-marketing',
            'content-creation',
            'media-planning',
            'public-relations',
            'event-marketing',
            'performance-marketing',
            'seo-sem',
            'email-marketing',
            'video-production',
            'photography',
            'web-development',
            'mobile-app-development',
            'e-commerce',
            'analytics-reporting'
        ]
    }],
    
    specializations: [{
        industry: String,
        expertise: String,
        yearsOfExperience: Number
    }],
    
    // Industries Served
    industries: [{
        type: String,
        enum: [
            'technology',
            'healthcare',
            'finance',
            'retail',
            'automotive',
            'fashion',
            'food-beverage',
            'travel-tourism',
            'education',
            'entertainment',
            'sports',
            'real-estate',
            'non-profit',
            'government',
            'manufacturing',
            'energy',
            'telecommunications',
            'media-publishing'
        ]
    }],
    
    // Agency Performance and Metrics
    metrics: {
        clientsCount: {
            type: Number,
            default: 0
        },
        projectsCompleted: {
            type: Number,
            default: 0
        },
        averageProjectValue: Number,
        clientRetentionRate: Number,
        awards: [{
            name: String,
            year: Number,
            organization: String
        }],
        certifications: [{
            name: String,
            issuer: String,
            date: Date,
            expiryDate: Date
        }]
    },
    
    // Team and Leadership
    team: {
        ceo: {
            name: String,
            email: String,
            linkedin: String
        },
        keyMembers: [{
            name: String,
            position: String,
            email: String,
            linkedin: String,
            photo: String
        }],
        totalTeamSize: Number
    },
    
    // Financial Information
    financial: {
        annualRevenue: {
            type: String,
            enum: ['under-1m', '1m-5m', '5m-10m', '10m-25m', '25m-50m', '50m-100m', 'over-100m']
        },
        currency: {
            type: String,
            default: 'MXN'
        },
        paymentTerms: String,
        minimumProjectValue: Number
    },
    
    // Portfolio and Case Studies
    portfolio: {
        featuredProjects: [{
            title: String,
            description: String,
            client: String,
            industry: String,
            services: [String],
            results: String,
            images: [String],
            videoUrl: String,
            year: Number
        }],
        testimonials: [{
            clientName: String,
            clientPosition: String,
            clientCompany: String,
            testimonial: String,
            rating: {
                type: Number,
                min: 1,
                max: 5
            },
            date: Date
        }]
    },
    
    // Social Media Presence
    socialMedia: {
        linkedin: String,
        twitter: String,
        facebook: String,
        instagram: String,
        youtube: String,
        tiktok: String
    },
    
    // Agency Status and Verification
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'pending-verification'],
        default: 'pending-verification'
    },
    
    isVerified: {
        type: Boolean,
        default: false
    },
    
    verificationDate: Date,
    
    // Blockchain Integration
    blockchain: {
        walletAddress: String,
        preferredNetwork: {
            type: String,
            enum: ['ethereum', 'polygon', 'bsc', 'avalanche'],
            default: 'ethereum'
        },
        smartContracts: [{
            name: String,
            address: String,
            network: String,
            type: String
        }]
    },
    
    // Agency Settings and Preferences
    settings: {
        autoAcceptProjects: {
            type: Boolean,
            default: false
        },
        minimumBudget: Number,
        preferredPaymentMethods: [String],
        workingHours: {
            monday: { start: String, end: String },
            tuesday: { start: String, end: String },
            wednesday: { start: String, end: String },
            thursday: { start: String, end: String },
            friday: { start: String, end: String },
            saturday: { start: String, end: String },
            sunday: { start: String, end: String }
        },
        timezone: {
            type: String,
            default: 'America/Mexico_City'
        }
    },
    
    // Agency Members (Users associated with this agency)
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: ['owner', 'admin', 'manager', 'member', 'viewer'],
            default: 'member'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        permissions: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Permission'
        }]
    }],
    
    // Agency Owner
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
agencySchema.index({ name: 1 });
agencySchema.index({ type: 1 });
agencySchema.index({ category: 1 });
agencySchema.index({ 'contact.email': 1 });
agencySchema.index({ status: 1 });
agencySchema.index({ isVerified: 1 });
agencySchema.index({ owner: 1 });
agencySchema.index({ 'services': 1 });
agencySchema.index({ 'industries': 1 });

// Virtual for full address
agencySchema.virtual('fullAddress').get(function() {
    if (!this.contact.address) return '';
    const addr = this.contact.address;
    return `${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''}, ${addr.country || ''}`.trim();
});

// Virtual for agency age
agencySchema.virtual('age').get(function() {
    if (!this.size.founded) return null;
    return new Date().getFullYear() - this.size.founded;
});

// Virtual for member count
agencySchema.virtual('memberCount').get(function() {
    return this.members.length;
});

// Pre-save middleware
agencySchema.pre('save', function(next) {
    if (this.isModified('contact.email')) {
        this.contact.email = this.contact.email.toLowerCase();
    }
    next();
});

// Static method to find by type
agencySchema.statics.findByType = function(type) {
    return this.find({ type, status: 'active', isVerified: true });
};

// Static method to find by industry
agencySchema.statics.findByIndustry = function(industry) {
    return this.find({ 
        industries: industry, 
        status: 'active', 
        isVerified: true 
    });
};

// Static method to find verified agencies
agencySchema.statics.findVerified = function() {
    return this.find({ status: 'active', isVerified: true });
};

// Method to add member
agencySchema.methods.addMember = function(userId, role = 'member') {
    const existingMember = this.members.find(member => member.user.toString() === userId.toString());
    if (existingMember) {
        existingMember.role = role;
    } else {
        this.members.push({ user: userId, role });
    }
    return this.save();
};

// Method to remove member
agencySchema.methods.removeMember = function(userId) {
    this.members = this.members.filter(member => member.user.toString() !== userId.toString());
    return this.save();
};

// Method to check if user is member
agencySchema.methods.isMember = function(userId) {
    return this.members.some(member => member.user.toString() === userId.toString());
};

// Method to check if user has role
agencySchema.methods.hasRole = function(userId, role) {
    const member = this.members.find(member => member.user.toString() === userId.toString());
    return member && member.role === role;
};

module.exports = mongoose.model('Agency', agencySchema);
