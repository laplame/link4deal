const mongoose = require('mongoose');
const Permission = require('../models/Permission');
const Role = require('../models/Role');
const User = require('../models/User');
const Agency = require('../models/Agency');
const UserProfile = require('../models/UserProfile');

// Connect to MongoDB
const connectDB = require('../config/database');

const seedInitialData = async () => {
    try {
        await connectDB();
        console.log('🌱 Starting to seed initial data...');

        // Clear existing data
        await Permission.deleteMany({});
        await Role.deleteMany({});
        console.log('🗑️  Cleared existing data');

        // Create Permissions
        console.log('🔐 Creating permissions...');
        
        const permissions = await Permission.create([
            // User Management Permissions
            {
                name: 'user-read',
                description: 'Ver información de usuarios',
                category: 'user-management',
                type: 'read',
                resource: 'users',
                actions: ['read', 'view'],
                level: 1,
                isSystem: true
            },
            {
                name: 'user-create',
                description: 'Crear nuevos usuarios',
                category: 'user-management',
                type: 'write',
                resource: 'users',
                actions: ['create'],
                level: 2,
                isSystem: true
            },
            {
                name: 'user-update',
                description: 'Actualizar información de usuarios',
                category: 'user-management',
                type: 'write',
                resource: 'users',
                actions: ['update', 'edit'],
                level: 2,
                isSystem: true
            },
            {
                name: 'user-delete',
                description: 'Eliminar usuarios',
                category: 'user-management',
                type: 'delete',
                resource: 'users',
                actions: ['delete'],
                level: 3,
                isSystem: true
            },

            // Promotion Management Permissions
            {
                name: 'promotion-read',
                description: 'Ver promociones',
                category: 'promotion-management',
                type: 'read',
                resource: 'promotions',
                actions: ['read', 'view'],
                level: 1,
                isSystem: true
            },
            {
                name: 'promotion-create',
                description: 'Crear promociones',
                category: 'promotion-management',
                type: 'write',
                resource: 'promotions',
                actions: ['create'],
                level: 2,
                isSystem: true
            },
            {
                name: 'promotion-update',
                description: 'Actualizar promociones',
                category: 'promotion-management',
                type: 'write',
                resource: 'promotions',
                actions: ['update', 'edit'],
                level: 2,
                isSystem: true
            },
            {
                name: 'promotion-delete',
                description: 'Eliminar promociones',
                category: 'promotion-management',
                type: 'delete',
                resource: 'promotions',
                actions: ['delete'],
                level: 3,
                isSystem: true
            },
            {
                name: 'promotion-approve',
                description: 'Aprobar promociones',
                category: 'promotion-management',
                type: 'admin',
                resource: 'promotions',
                actions: ['approve', 'reject'],
                level: 4,
                isSystem: true
            },

            // Agency Management Permissions
            {
                name: 'agency-read',
                description: 'Ver información de agencias',
                category: 'agency-management',
                type: 'read',
                resource: 'agencies',
                actions: ['read', 'view'],
                level: 1,
                isSystem: true
            },
            {
                name: 'agency-create',
                description: 'Crear agencias',
                category: 'agency-management',
                type: 'write',
                resource: 'agencies',
                actions: ['create'],
                level: 2,
                isSystem: true
            },
            {
                name: 'agency-update',
                description: 'Actualizar información de agencias',
                category: 'agency-management',
                type: 'write',
                resource: 'agencies',
                actions: ['update', 'edit'],
                level: 2,
                isSystem: true
            },
            {
                name: 'agency-delete',
                description: 'Eliminar agencias',
                category: 'agency-management',
                type: 'delete',
                resource: 'agencies',
                actions: ['delete'],
                level: 3,
                isSystem: true
            },

            // Influencer Management Permissions
            {
                name: 'influencer-read',
                description: 'Ver información de influencers',
                category: 'influencer-management',
                type: 'read',
                resource: 'influencers',
                actions: ['read', 'view'],
                level: 1,
                isSystem: true
            },
            {
                name: 'influencer-approve',
                description: 'Aprobar influencers',
                category: 'influencer-management',
                type: 'admin',
                resource: 'influencers',
                actions: ['approve', 'reject'],
                level: 4,
                isSystem: true
            },
            {
                name: 'influencer-verify',
                description: 'Verificar influencers',
                category: 'influencer-management',
                type: 'admin',
                resource: 'influencers',
                actions: ['verify'],
                level: 4,
                isSystem: true
            },

            // Brand Management Permissions
            {
                name: 'brand-read',
                description: 'Ver información de marcas',
                category: 'brand-management',
                type: 'read',
                resource: 'brands',
                actions: ['read', 'view'],
                level: 1,
                isSystem: true
            },
            {
                name: 'brand-approve',
                description: 'Aprobar marcas',
                category: 'brand-management',
                type: 'admin',
                resource: 'brands',
                actions: ['approve', 'reject'],
                level: 4,
                isSystem: true
            },
            {
                name: 'brand-verify',
                description: 'Verificar marcas',
                category: 'brand-management',
                type: 'admin',
                resource: 'brands',
                actions: ['verify'],
                level: 4,
                isSystem: true
            },

            // Analytics Permissions
            {
                name: 'analytics-view',
                description: 'Ver analytics básicos',
                category: 'analytics',
                type: 'read',
                resource: 'analytics',
                actions: ['read', 'view'],
                level: 2,
                isSystem: true
            },
            {
                name: 'analytics-export',
                description: 'Exportar reportes',
                category: 'analytics',
                type: 'write',
                resource: 'analytics',
                actions: ['export'],
                level: 3,
                isSystem: true
            },
            {
                name: 'analytics-financial',
                description: 'Ver datos financieros',
                category: 'analytics',
                type: 'read',
                resource: 'analytics',
                actions: ['read', 'view'],
                level: 5,
                isSystem: true
            },

            // Admin Permissions
            {
                name: 'admin-panel-access',
                description: 'Acceso al panel de administración',
                category: 'admin',
                type: 'admin',
                resource: 'admin',
                actions: ['access', 'view'],
                level: 5,
                isSystem: true
            },
            {
                name: 'system-manage',
                description: 'Gestionar sistema',
                category: 'admin',
                type: 'full-access',
                resource: 'system',
                actions: ['manage', 'configure'],
                level: 10,
                isSystem: true
            },
            {
                name: 'roles-manage',
                description: 'Gestionar roles y permisos',
                category: 'admin',
                type: 'admin',
                resource: 'roles',
                actions: ['manage', 'create', 'update', 'delete'],
                level: 8,
                isSystem: true
            },

            // Blockchain Permissions
            {
                name: 'blockchain-manage',
                description: 'Gestionar contratos inteligentes',
                category: 'blockchain',
                type: 'admin',
                resource: 'blockchain',
                actions: ['manage', 'deploy'],
                level: 6,
                isSystem: true
            },
            {
                name: 'wallets-manage',
                description: 'Gestionar wallets',
                category: 'blockchain',
                type: 'admin',
                resource: 'blockchain',
                actions: ['manage'],
                level: 5,
                isSystem: true
            },

            // Referral System Permissions
            {
                name: 'referrals-manage',
                description: 'Gestionar sistema de referidos',
                category: 'referral-system',
                type: 'admin',
                resource: 'referrals',
                actions: ['manage'],
                level: 4,
                isSystem: true
            },
            {
                name: 'referrals-view',
                description: 'Ver estadísticas de referidos',
                category: 'referral-system',
                type: 'read',
                resource: 'referrals',
                actions: ['read', 'view'],
                level: 3,
                isSystem: true
            }
        ]);

        console.log(`✅ Created ${permissions.length} permissions`);

        // Create Roles
        console.log('👥 Creating roles...');
        
        const roles = await Role.create([
            // Basic User Role
            {
                name: 'user',
                displayName: 'Usuario',
                description: 'Usuario básico de la plataforma',
                type: 'user',
                level: 1,
                isDefault: true,
                isSystem: true,
                permissions: [
                    permissions.find(p => p.name === 'promotion-read')._id
                ],
                capabilities: {
                    canCreateContent: true,
                    canViewAnalytics: false
                },
                limits: {
                    maxPromotionsPerMonth: 0,
                    maxFileUploadSize: 5 * 1024 * 1024, // 5MB
                    maxStorageQuota: 100 * 1024 * 1024 // 100MB
                }
            },

            // Influencer Role
            {
                name: 'influencer',
                displayName: 'Influencer',
                description: 'Creador de contenido e influencer',
                type: 'influencer',
                level: 2,
                isDefault: false,
                isSystem: true,
                permissions: [
                    permissions.find(p => p.name === 'promotion-read')._id,
                    permissions.find(p => p.name === 'promotion-create')._id,
                    permissions.find(p => p.name === 'promotion-update')._id
                ],
                capabilities: {
                    canCreateContent: true,
                    canCreatePromotions: true,
                    canEditPromotions: true,
                    canViewAnalytics: true
                },
                limits: {
                    maxPromotionsPerMonth: 10,
                    maxFileUploadSize: 50 * 1024 * 1024, // 50MB
                    maxStorageQuota: 1 * 1024 * 1024 * 1024 // 1GB
                },
                features: {
                    canUseAdvancedAnalytics: true,
                    canUseAIBeta: false,
                    canUsePrioritySupport: false
                }
            },

            // Brand Role
            {
                name: 'brand',
                displayName: 'Marca',
                description: 'Empresa o marca que crea promociones',
                type: 'brand',
                level: 3,
                isDefault: false,
                isSystem: true,
                permissions: [
                    permissions.find(p => p.name === 'promotion-read')._id,
                    permissions.find(p => p.name === 'promotion-create')._id,
                    permissions.find(p => p.name === 'promotion-update')._id,
                    permissions.find(p => p.name === 'promotion-delete')._id
                ],
                capabilities: {
                    canCreateContent: true,
                    canCreatePromotions: true,
                    canEditPromotions: true,
                    canDeletePromotions: true,
                    canViewAnalytics: true,
                    canExportReports: true
                },
                limits: {
                    maxPromotionsPerMonth: 50,
                    maxInfluencersPerBrand: 100,
                    maxFileUploadSize: 100 * 1024 * 1024, // 100MB
                    maxStorageQuota: 5 * 1024 * 1024 * 1024 // 5GB
                },
                features: {
                    canUseAdvancedAnalytics: true,
                    canUseAIBeta: true,
                    canUsePrioritySupport: true,
                    canUseCustomBranding: true
                }
            },

            // Agency Role
            {
                name: 'agency',
                displayName: 'Agencia',
                description: 'Agencia de publicidad y marketing',
                type: 'agency',
                level: 4,
                isDefault: false,
                isSystem: true,
                permissions: [
                    permissions.find(p => p.name === 'promotion-read')._id,
                    permissions.find(p => p.name === 'promotion-create')._id,
                    permissions.find(p => p.name === 'promotion-update')._id,
                    permissions.find(p => p.name === 'promotion-delete')._id,
                    permissions.find(p => p.name === 'agency-manage')._id,
                    permissions.find(p => p.name === 'influencer-read')._id,
                    permissions.find(p => p.name === 'brand-read')._id
                ],
                capabilities: {
                    canCreateContent: true,
                    canCreatePromotions: true,
                    canEditPromotions: true,
                    canDeletePromotions: true,
                    canManageAgencies: true,
                    canViewAnalytics: true,
                    canExportReports: true,
                    canViewFinancialData: true
                },
                limits: {
                    maxPromotionsPerMonth: 200,
                    maxInfluencersPerBrand: 500,
                    maxBrandsPerAgency: 50,
                    maxTeamMembers: 100,
                    maxFileUploadSize: 500 * 1024 * 1024, // 500MB
                    maxStorageQuota: 25 * 1024 * 1024 * 1024 // 25GB
                },
                features: {
                    canUseAdvancedAnalytics: true,
                    canUseAIBeta: true,
                    canUsePrioritySupport: true,
                    canUseCustomBranding: true,
                    canUseAPI: true,
                    canUseWebhooks: true
                }
            },

            // Moderator Role
            {
                name: 'moderator',
                displayName: 'Moderador',
                description: 'Moderador de contenido y promociones',
                type: 'moderator',
                level: 6,
                isDefault: false,
                isSystem: true,
                permissions: [
                    permissions.find(p => p.name === 'promotion-read')._id,
                    permissions.find(p => p.name === 'promotion-approve')._id,
                    permissions.find(p => p.name === 'influencer-approve')._id,
                    permissions.find(p => p.name === 'brand-approve')._id,
                    permissions.find(p => p.name === 'analytics-view')._id
                ],
                capabilities: {
                    canCreateContent: false,
                    canApprovePromotions: true,
                    canApproveInfluencers: true,
                    canApproveBrands: true,
                    canViewAnalytics: true
                },
                limits: {
                    maxPromotionsPerMonth: 0,
                    maxFileUploadSize: 10 * 1024 * 1024, // 10MB
                    maxStorageQuota: 500 * 1024 * 1024 // 500MB
                }
            },

            // Admin Role
            {
                name: 'admin',
                displayName: 'Administrador',
                description: 'Administrador del sistema',
                type: 'admin',
                level: 9,
                isDefault: false,
                isSystem: true,
                permissions: [
                    permissions.find(p => p.name === 'user-read')._id,
                    permissions.find(p => p.name === 'user-create')._id,
                    permissions.find(p => p.name === 'user-update')._id,
                    permissions.find(p => p.name === 'user-delete')._id,
                    permissions.find(p => p.name === 'promotion-read')._id,
                    permissions.find(p => p.name === 'promotion-create')._id,
                    permissions.find(p => p.name === 'promotion-update')._id,
                    permissions.find(p => p.name === 'promotion-delete')._id,
                    permissions.find(p => p.name === 'promotion-approve')._id,
                    permissions.find(p => p.name === 'agency-read')._id,
                    permissions.find(p => p.name === 'agency-create')._id,
                    permissions.find(p => p.name === 'agency-update')._id,
                    permissions.find(p => p.name === 'agency-delete')._id,
                    permissions.find(p => p.name === 'influencer-read')._id,
                    permissions.find(p => p.name === 'influencer-approve')._id,
                    permissions.find(p => p.name === 'influencer-verify')._id,
                    permissions.find(p => p.name === 'brand-read')._id,
                    permissions.find(p => p.name === 'brand-approve')._id,
                    permissions.find(p => p.name === 'brand-verify')._id,
                    permissions.find(p => p.name === 'analytics-view')._id,
                    permissions.find(p => p.name === 'analytics-export')._id,
                    permissions.find(p => p.name === 'analytics-financial')._id,
                    permissions.find(p => p.name === 'admin-panel-access')._id,
                    permissions.find(p => p.name === 'system-manage')._id,
                    permissions.find(p => p.name === 'roles-manage')._id,
                    permissions.find(p => p.name === 'blockchain-manage')._id,
                    permissions.find(p => p.name === 'wallets-manage')._id,
                    permissions.find(p => p.name === 'referrals-manage')._id,
                    permissions.find(p => p.name === 'referrals-view')._id
                ],
                capabilities: {
                    canManageUsers: true,
                    canCreateUsers: true,
                    canDeleteUsers: true,
                    canCreateContent: true,
                    canCreatePromotions: true,
                    canEditPromotions: true,
                    canDeletePromotions: true,
                    canApprovePromotions: true,
                    canManagePromotions: true,
                    canManageAgencies: true,
                    canCreateAgencies: true,
                    canEditAgencies: true,
                    canDeleteAgencies: true,
                    canManageInfluencers: true,
                    canApproveInfluencers: true,
                    canVerifyInfluencers: true,
                    canManageBrands: true,
                    canApproveBrands: true,
                    canVerifyBrands: true,
                    canViewAnalytics: true,
                    canExportReports: true,
                    canViewFinancialData: true,
                    canAccessAdminPanel: true,
                    canManageSystem: true,
                    canManageRoles: true,
                    canManageSmartContracts: true,
                    canDeployContracts: true,
                    canManageWallets: true,
                    canManageReferrals: true,
                    canViewReferralStats: true,
                    canManageReferralPrograms: true
                },
                limits: {
                    maxPromotionsPerMonth: 1000,
                    maxInfluencersPerBrand: 10000,
                    maxBrandsPerAgency: 1000,
                    maxTeamMembers: 1000,
                    maxFileUploadSize: 1024 * 1024 * 1024, // 1GB
                    maxStorageQuota: 100 * 1024 * 1024 * 1024 // 100GB
                },
                features: {
                    canUseAdvancedAnalytics: true,
                    canUseAIBeta: true,
                    canUsePrioritySupport: true,
                    canUseCustomBranding: true,
                    canUseAPI: true,
                    canUseWebhooks: true
                }
            }
        ]);

        console.log(`✅ Created ${roles.length} roles`);

        // Create default admin user
        console.log('👤 Creating default admin user...');
        
        const adminUser = await User.create({
            firstName: 'Admin',
            lastName: 'Sistema',
            email: 'admin@link4deal.com',
            password: 'Admin123!',
            primaryRole: 'admin',
            profileTypes: ['admin'],
            isVerified: true,
            isActive: true,
            roles: [roles.find(r => r.name === 'admin')._id]
        });

        console.log(`✅ Created admin user: ${adminUser.email}`);

        console.log('🎉 Initial data seeding completed successfully!');
        console.log('\n📋 Summary:');
        console.log(`   - Permissions: ${permissions.length}`);
        console.log(`   - Roles: ${roles.length}`);
        console.log(`   - Admin User: ${adminUser.email}`);
        console.log('\n🔑 Default Admin Credentials:');
        console.log(`   Email: admin@link4deal.com`);
        console.log(`   Password: Admin123!`);

    } catch (error) {
        console.error('❌ Error seeding initial data:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
};

// Run seeder if called directly
if (require.main === module) {
    seedInitialData();
}

module.exports = seedInitialData;
