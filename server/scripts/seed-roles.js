/**
 * Crea los roles del sistema si no existen (sin depender de Permissions).
 * No borra roles ni permisos existentes.
 *
 * Uso (desde raíz del proyecto):
 *   node server/scripts/seed-roles.js
 *   npm run seed:roles
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const database = require('../config/database');
const Role = require('../models/Role');

const ROLES = [
  {
    name: 'user',
    displayName: 'Usuario',
    description: 'Usuario básico de la plataforma',
    type: 'user',
    level: 1,
    isDefault: true,
    isSystem: true,
    permissions: [],
    capabilities: { canCreateContent: true, canViewAnalytics: false },
    limits: { maxPromotionsPerMonth: 0, maxFileUploadSize: 5 * 1024 * 1024, maxStorageQuota: 100 * 1024 * 1024 }
  },
  {
    name: 'influencer',
    displayName: 'Influencer',
    description: 'Creador de contenido e influencer',
    type: 'influencer',
    level: 2,
    isDefault: false,
    isSystem: true,
    permissions: [],
    capabilities: {
      canCreateContent: true,
      canCreatePromotions: true,
      canEditPromotions: true,
      canViewAnalytics: true
    },
    limits: {
      maxPromotionsPerMonth: 10,
      maxFileUploadSize: 50 * 1024 * 1024,
      maxStorageQuota: 1024 * 1024 * 1024
    }
  },
  {
    name: 'brand',
    displayName: 'Marca',
    description: 'Empresa o marca que crea promociones',
    type: 'brand',
    level: 3,
    isDefault: false,
    isSystem: true,
    permissions: [],
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
      maxFileUploadSize: 100 * 1024 * 1024,
      maxStorageQuota: 5 * 1024 * 1024 * 1024
    }
  },
  {
    name: 'agency',
    displayName: 'Agencia',
    description: 'Agencia de publicidad y marketing',
    type: 'agency',
    level: 4,
    isDefault: false,
    isSystem: true,
    permissions: [],
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
      maxFileUploadSize: 500 * 1024 * 1024,
      maxStorageQuota: 25 * 1024 * 1024 * 1024
    }
  },
  {
    name: 'moderator',
    displayName: 'Moderador',
    description: 'Moderador de contenido y promociones',
    type: 'moderator',
    level: 6,
    isDefault: false,
    isSystem: true,
    permissions: [],
    capabilities: {
      canApprovePromotions: true,
      canApproveInfluencers: true,
      canApproveBrands: true,
      canViewAnalytics: true
    },
    limits: {
      maxFileUploadSize: 10 * 1024 * 1024,
      maxStorageQuota: 500 * 1024 * 1024
    }
  },
  {
    name: 'admin',
    displayName: 'Administrador',
    description: 'Administrador del sistema',
    type: 'admin',
    level: 9,
    isDefault: false,
    isSystem: true,
    permissions: [],
    capabilities: {
      canManageUsers: true,
      canCreateUsers: true,
      canDeleteUsers: true,
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
      maxFileUploadSize: 1024 * 1024 * 1024,
      maxStorageQuota: 100 * 1024 * 1024 * 1024
    }
  }
];

async function main() {
  console.log('===============================================');
  console.log('  Generar roles del sistema');
  console.log('===============================================');

  try {
    await database.connect();
    if (!database.isConnected) {
      console.error('❌ No hay conexión a MongoDB.');
      process.exit(1);
    }

    let created = 0;
    let existing = 0;

    for (const roleData of ROLES) {
      const existingRole = await Role.findOne({ name: roleData.name });
      if (existingRole) {
        console.log(`⏭️  ${roleData.name}: ya existe`);
        existing++;
      } else {
        await Role.create(roleData);
        console.log(`✅ ${roleData.name}: creado`);
        created++;
      }
    }

    console.log('-----------------------------------------------');
    console.log(`Creados: ${created} | Ya existían: ${existing}`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
