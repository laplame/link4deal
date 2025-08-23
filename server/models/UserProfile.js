const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
    // Reference to User
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    
    // Profile Type
    profileType: {
        type: String,
        required: [true, 'El tipo de perfil es requerido'],
        enum: ['influencer', 'brand', 'agency', 'hybrid']
    },
    
    // Profile Status
    status: {
        type: String,
        enum: ['draft', 'pending', 'active', 'suspended', 'verified'],
        default: 'draft'
    },
    
    // Verification Status
    isVerified: {
        type: Boolean,
        default: false
    },
    
    verificationDate: Date,
    
    // Profile Information
    profile: {
        // Basic Info
        displayName: {
            type: String,
            required: [true, 'El nombre de visualización es requerido'],
            trim: true,
            maxlength: [100, 'El nombre no puede tener más de 100 caracteres']
        },
        
        bio: {
            type: String,
            maxlength: [500, 'La biografía no puede tener más de 500 caracteres']
        },
        
        avatar: String,
        coverImage: String,
        
        // Contact Information
        contact: {
            email: String,
            phone: String,
            website: String,
            address: {
                street: String,
                city: String,
                state: String,
                country: String,
                zipCode: String
            }
        },
        
        // Social Media Links
        socialMedia: {
            instagram: String,
            tiktok: String,
            youtube: String,
            twitter: String,
            facebook: String,
            linkedin: String,
            twitch: String,
            snapchat: String
        }
    },
    
    // Influencer-specific fields
    influencer: {
        // Content Categories
        categories: [{
            type: String,
            enum: [
                'lifestyle',
                'fashion',
                'beauty',
                'fitness',
                'food',
                'travel',
                'technology',
                'gaming',
                'education',
                'business',
                'entertainment',
                'sports',
                'parenting',
                'health',
                'automotive',
                'real-estate',
                'finance',
                'pets',
                'art',
                'music'
            ]
        }],
        
        // Audience Demographics
        audience: {
            ageRange: {
                min: Number,
                max: Number
            },
            gender: {
                male: Number,
                female: Number,
                other: Number
            },
            locations: [{
                country: String,
                city: String,
                percentage: Number
            }],
            languages: [String],
            interests: [String]
        },
        
        // Social Media Stats
        socialStats: {
            instagram: {
                followers: Number,
                engagement: Number,
                posts: Number
            },
            tiktok: {
                followers: Number,
                engagement: Number,
                videos: Number
            },
            youtube: {
                subscribers: Number,
                views: Number,
                videos: Number
            },
            twitter: {
                followers: Number,
                tweets: Number
            }
        },
        
        // Content Performance
        performance: {
            averageViews: Number,
            averageLikes: Number,
            averageComments: Number,
            averageShares: Number,
            engagementRate: Number
        },
        
        // Collaboration Preferences
        collaboration: {
            preferredBrands: [String],
            preferredCategories: [String],
            minimumBudget: Number,
            currency: {
                type: String,
                default: 'MXN'
            },
            collaborationTypes: [{
                type: String,
                enum: [
                    'sponsored-post',
                    'product-review',
                    'brand-ambassador',
                    'event-attendance',
                    'video-creation',
                    'story-post',
                    'live-stream',
                    'giveaway',
                    'affiliate'
                ]
            }],
            availability: {
                monday: { start: String, end: String },
                tuesday: { start: String, end: String },
                wednesday: { start: String, end: String },
                thursday: { start: String, end: String },
                friday: { start: String, end: String },
                saturday: { start: String, end: String },
                sunday: { start: String, end: String }
            }
        },
        
        // Portfolio
        portfolio: [{
            title: String,
            description: String,
            media: [String],
            brand: String,
            category: String,
            performance: {
                views: Number,
                likes: Number,
                comments: Number,
                shares: Number
            },
            date: Date
        }],
        
        // Rates and Packages
        rates: [{
            packageName: String,
            description: String,
            deliverables: [String],
            price: Number,
            currency: String,
            duration: String,
            revisions: Number
        }]
    },
    
    // Brand-specific fields
    brand: {
        // Company Information
        company: {
            name: String,
            industry: String,
            founded: Number,
            employees: Number,
            website: String,
            logo: String
        },
        
        // Brand Categories
        categories: [{
            type: String,
            enum: [
                'fashion',
                'beauty',
                'technology',
                'food-beverage',
                'automotive',
                'healthcare',
                'finance',
                'education',
                'entertainment',
                'sports',
                'travel',
                'home-garden',
                'pets',
                'baby-kids',
                'gaming',
                'fitness',
                'luxury',
                'sustainable',
                'startup',
                'enterprise'
            ]
        }],
        
        // Target Audience
        targetAudience: {
            ageRange: {
                min: Number,
                max: Number
            },
            gender: [String],
            locations: [String],
            interests: [String],
            incomeLevel: String
        },
        
        // Marketing Budget
        marketing: {
            monthlyBudget: {
                min: Number,
                max: Number,
                currency: String
            },
            preferredChannels: [String],
            campaignTypes: [String]
        },
        
        // Collaboration History
        collaborations: [{
            influencer: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            campaign: String,
            date: Date,
            performance: String,
            rating: Number
        }],
        
        // Brand Guidelines
        guidelines: {
            tone: String,
            colors: [String],
            fonts: [String],
            doAndDont: [String]
        }
    },
    
    // Agency-specific fields
    agency: {
        // Agency Information
        agencyInfo: {
            name: String,
            type: String,
            founded: Number,
            employees: Number,
            headquarters: String,
            website: String,
            logo: String
        },
        
        // Services Offered
        services: [{
            type: String,
            enum: [
                'influencer-marketing',
                'social-media-management',
                'content-creation',
                'brand-strategy',
                'creative-design',
                'media-buying',
                'public-relations',
                'event-marketing',
                'performance-marketing',
                'analytics'
            ]
        }],
        
        // Client Portfolio
        clients: [{
            name: String,
            industry: String,
            services: [String],
            duration: String,
            results: String
        }],
        
        // Team Structure
        team: [{
            name: String,
            position: String,
            expertise: [String],
            experience: Number
        }],
        
        // Pricing Models
        pricing: [{
            model: String,
            description: String,
            basePrice: Number,
            currency: String,
            additionalFees: [String]
        }]
    },
    
    // Hybrid Profile (user can be both influencer and brand/agency)
    hybrid: {
        primaryRole: {
            type: String,
            enum: ['influencer', 'brand', 'agency']
        },
        secondaryRoles: [String],
        canSwitchRoles: {
            type: Boolean,
            default: true
        }
    },
    
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
        }],
        nftCollections: [{
            name: String,
            contractAddress: String,
            network: String
        }]
    },
    
    // Analytics and Metrics
    analytics: {
        profileViews: {
            type: Number,
            default: 0
        },
        profileLikes: {
            type: Number,
            default: 0
        },
        collaborationRequests: {
            type: Number,
            default: 0
        },
        successfulCollaborations: {
            type: Number,
            default: 0
        },
        totalEarnings: {
            type: Number,
            default: 0
        },
        averageRating: {
            type: Number,
            default: 0
        },
        reviewCount: {
            type: Number,
            default: 0
        }
    },
    
    // Settings and Preferences
    settings: {
        privacy: {
            showEmail: {
                type: Boolean,
                default: false
            },
            showPhone: {
                type: Boolean,
                default: false
            },
            showAddress: {
                type: Boolean,
                default: false
            },
            showAnalytics: {
                type: Boolean,
                default: true
            }
        },
        notifications: {
            email: {
                type: Boolean,
                default: true
            },
            push: {
                type: Boolean,
                default: true
            },
            sms: {
                type: Boolean,
                default: false
            }
        },
        autoAccept: {
            collaborations: {
                type: Boolean,
                default: false
            },
            messages: {
                type: Boolean,
                default: false
            }
        }
    },
    
    // Verification Documents
    verification: {
        documents: [{
            type: String,
            enum: ['id-card', 'passport', 'business-license', 'tax-id', 'bank-statement', 'utility-bill']
        }],
        documentUrls: [String],
        verificationMethod: {
            type: String,
            enum: ['manual', 'automatic', 'third-party']
        },
        verificationNotes: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
userProfileSchema.index({ user: 1 });
userProfileSchema.index({ profileType: 1 });
userProfileSchema.index({ status: 1 });
userProfileSchema.index({ isVerified: 1 });
userProfileSchema.index({ 'influencer.categories': 1 });
userProfileSchema.index({ 'brand.categories': 1 });
userProfileSchema.index({ 'agency.services': 1 });

// Virtual for full profile name
userProfileSchema.virtual('fullProfileName').get(function() {
    return this.profile.displayName || 'Sin nombre';
});

// Virtual for profile age
userProfileSchema.virtual('profileAge').get(function() {
    if (!this.brand?.company?.founded && !this.agency?.agencyInfo?.founded) return null;
    const founded = this.brand?.company?.founded || this.agency?.agencyInfo?.founded;
    return new Date().getFullYear() - founded;
});

// Pre-save middleware
userProfileSchema.pre('save', function(next) {
    if (this.isModified('profile.contact.email')) {
        this.profile.contact.email = this.profile.contact.email.toLowerCase();
    }
    next();
});

// Static method to find by profile type
userProfileSchema.statics.findByProfileType = function(profileType) {
    return this.find({ profileType, status: 'active' });
};

// Static method to find verified profiles
userProfileSchema.statics.findVerified = function() {
    return this.find({ isVerified: true, status: 'active' });
};

// Static method to find by category
userProfileSchema.statics.findByCategory = function(category, profileType) {
    const query = { status: 'active' };
    
    if (profileType === 'influencer') {
        query['influencer.categories'] = category;
    } else if (profileType === 'brand') {
        query['brand.categories'] = category;
    }
    
    return this.find(query);
};

// Method to update analytics
userProfileSchema.methods.updateAnalytics = function(type, value = 1) {
    if (this.analytics[type] !== undefined) {
        this.analytics[type] += value;
    }
    return this.save();
};

// Method to add collaboration
userProfileSchema.methods.addCollaboration = function(collaborationData) {
    if (this.brand && this.brand.collaborations) {
        this.brand.collaborations.push(collaborationData);
    }
    return this.save();
};

// Method to check if profile is complete
userProfileSchema.methods.isComplete = function() {
    const requiredFields = ['profile.displayName', 'profile.bio'];
    
    if (this.profileType === 'influencer') {
        requiredFields.push('influencer.categories');
    } else if (this.profileType === 'brand') {
        requiredFields.push('brand.company.name');
    } else if (this.profileType === 'agency') {
        requiredFields.push('agency.agencyInfo.name');
    }
    
    return requiredFields.every(field => {
        const value = field.split('.').reduce((obj, key) => obj?.[key], this);
        return value && (Array.isArray(value) ? value.length > 0 : true);
    });
};

module.exports = mongoose.model('UserProfile', userProfileSchema);
