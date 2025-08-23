const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    // Basic Information
    firstName: {
        type: String,
        required: [true, 'El nombre es requerido'],
        trim: true,
        maxlength: [50, 'El nombre no puede tener más de 50 caracteres']
    },
    lastName: {
        type: String,
        required: [true, 'El apellido es requerido'],
        trim: true,
        maxlength: [50, 'El apellido no puede tener más de 50 caracteres']
    },
    email: {
        type: String,
        required: [true, 'El email es requerido'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
    },
    password: {
        type: String,
        required: [true, 'La contraseña es requerida'],
        minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
        select: false // No incluir en queries por defecto
    },
    
    // Profile Information
    profileImage: {
        type: String,
        default: null
    },
    phone: {
        type: String,
        trim: true
    },
    dateOfBirth: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer-not-to-say'],
        default: 'prefer-not-to-say'
    },
    
    // User Status and Verification
    isVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    
    // User Roles and Permissions - Updated for multiple roles
    roles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        required: true
    }],
    
    // Primary Role (for quick access)
    primaryRole: {
        type: String,
        enum: ['user', 'influencer', 'brand', 'agency', 'admin', 'moderator', 'support', 'analyst'],
        default: 'user'
    },
    
    // User Profile Types (can have multiple)
    profileTypes: [{
        type: String,
        enum: ['influencer', 'brand', 'agency'],
        default: []
    }],
    
    // Reference to UserProfile
    userProfile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserProfile'
    },
    
    // Agency Membership (if user is part of an agency)
    agencyMembership: {
        agency: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Agency'
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
    },
    
    // Social Media Links (simplified, detailed info in UserProfile)
    socialMedia: {
        instagram: String,
        tiktok: String,
        youtube: String,
        twitter: String,
        facebook: String,
        linkedin: String
    },
    
    // Blockchain Integration (simplified, detailed info in UserProfile)
    blockchain: {
        walletAddress: String,
        preferredNetwork: {
            type: String,
            enum: ['ethereum', 'polygon', 'bsc', 'avalanche'],
            default: 'ethereum'
        }
    },
    
    // Account Settings
    settings: {
        language: {
            type: String,
            default: 'es'
        },
        timezone: {
            type: String,
            default: 'America/Mexico_City'
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
        privacy: {
            profileVisibility: {
                type: String,
                enum: ['public', 'private', 'friends-only'],
                default: 'public'
            },
            showEmail: {
                type: Boolean,
                default: false
            },
            showPhone: {
                type: Boolean,
                default: false
            }
        }
    },
    
    // Account Statistics
    stats: {
        lastLogin: Date,
        loginCount: {
            type: Number,
            default: 0
        },
        profileViews: {
            type: Number,
            default: 0
        },
        accountAge: {
            type: Number,
            default: 0
        }
    },
    
    // Security and Authentication
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    
    twoFactorSecret: String,
    
    loginAttempts: {
        type: Number,
        default: 0
    },
    
    lockUntil: Date,
    
    // Email and Phone Verification
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    phoneVerificationToken: String,
    phoneVerificationExpires: Date,
    
    // Password Reset
    passwordResetToken: String,
    passwordResetExpires: Date
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for total social media followers
userSchema.virtual('totalFollowers').get(function() {
    if (!this.socialMedia) return 0;
    
    return (
        (this.socialMedia.instagram?.followers || 0) +
        (this.socialMedia.tiktok?.followers || 0) +
        (this.socialMedia.youtube?.subscribers || 0) +
        (this.socialMedia.twitter?.followers || 0)
    );
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ primaryRole: 1 });
userSchema.index({ profileTypes: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ isVerified: 1 });
userSchema.index({ 'agencyMembership.agency': 1 });
userSchema.index({ roles: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile
userSchema.methods.getPublicProfile = function() {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.email;
    delete userObject.phone;
    delete userObject.dateOfBirth;
    delete userObject.blockchain;
    delete userObject.twoFactorSecret;
    delete userObject.loginAttempts;
    delete userObject.lockUntil;
    return userObject;
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

// Static method to find by role
userSchema.statics.findByRole = function(role) {
    return this.find({ primaryRole: role, isActive: true });
};

// Static method to find by profile type
userSchema.statics.findByProfileType = function(profileType) {
    return this.find({ profileTypes: profileType, isActive: true });
};

// Method to add role
userSchema.methods.addRole = function(roleId) {
    if (!this.roles.includes(roleId)) {
        this.roles.push(roleId);
    }
    return this.save();
};

// Method to remove role
userSchema.methods.removeRole = function(roleId) {
    this.roles = this.roles.filter(role => role.toString() !== roleId.toString());
    return this.save();
};

// Method to check if user has role
userSchema.methods.hasRole = function(roleId) {
    return this.roles.some(role => role.toString() === roleId.toString());
};

// Method to check if user has profile type
userSchema.methods.hasProfileType = function(profileType) {
    return this.profileTypes.includes(profileType);
};

// Method to add profile type
userSchema.methods.addProfileType = function(profileType) {
    if (!this.profileTypes.includes(profileType)) {
        this.profileTypes.push(profileType);
    }
    return this.save();
};

// Method to remove profile type
userSchema.methods.removeProfileType = function(profileType) {
    this.profileTypes = this.profileTypes.filter(type => type !== profileType);
    return this.save();
};

// Method to check if user is locked
userSchema.methods.isLocked = function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
    this.loginAttempts += 1;
    if (this.loginAttempts >= 5) {
        this.lockUntil = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
    }
    return this.save();
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
    this.loginAttempts = 0;
    this.lockUntil = undefined;
    return this.save();
};

// Method to update last login
userSchema.methods.updateLastLogin = function() {
    this.stats.lastLogin = new Date();
    this.stats.loginCount += 1;
    return this.save();
};

module.exports = mongoose.model('User', userSchema);
