/**
 * Promueve un usuario a super admin y actualiza su contraseña.
 *
 * Uso (desde raíz):
 *   node server/scripts/promote-user-to-super-admin.js
 *
 * Opcional:
 *   SUPER_ADMIN_EMAIL=saul.laplame@gmail.com SUPER_ADMIN_PASSWORD="Therion@69" node server/scripts/promote-user-to-super-admin.js
 */

const path = require('path');
const { envPath } = require('../config/envPath');
require('dotenv').config({ path: envPath });
const mongoose = require('mongoose');
const database = require('../config/database');
const User = require('../models/User');
const Role = require('../models/Role');

const TARGET_EMAIL = (process.env.SUPER_ADMIN_EMAIL || 'saul.laplame@gmail.com').toLowerCase().trim();
const NEW_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'Therion@69';

function buildEmailCandidates(inputEmail) {
  const email = (inputEmail || '').toLowerCase().trim();
  if (!email.includes('@')) return [email];
  const [localRaw, domainRaw] = email.split('@');
  const domain = domainRaw.trim();
  const local = localRaw.trim();
  const localNoPlus = local.split('+')[0];

  const candidates = new Set([`${local}@${domain}`, `${localNoPlus}@${domain}`]);

  // Gmail/Googlemail: suele ignorar puntos en el local-part
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    candidates.add(`${local.replace(/\./g, '')}@${domain}`);
    candidates.add(`${localNoPlus.replace(/\./g, '')}@${domain}`);
  }

  return Array.from(candidates);
}

async function ensureAdminRole() {
  let adminRole = await Role.findOne({ name: 'admin' });
  if (adminRole) return adminRole;

  adminRole = await Role.create({
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
      canAccessAdminPanel: true,
      canManageSystem: true,
      canManageRoles: true
    }
  });

  console.log('✅ Rol "admin" creado automáticamente.');
  return adminRole;
}

async function ensureUserRole() {
  let userRole = await Role.findOne({ name: 'user' });
  if (userRole) return userRole;

  userRole = await Role.create({
    name: 'user',
    displayName: 'Usuario',
    description: 'Usuario básico de la plataforma',
    type: 'user',
    level: 1,
    isDefault: true,
    isSystem: true,
    permissions: [],
    capabilities: {
      canCreateContent: true
    }
  });

  console.log('✅ Rol "user" creado automáticamente.');
  return userRole;
}

async function main() {
  console.log('===============================================');
  console.log('  Promover usuario a SUPER ADMIN');
  console.log('===============================================');
  console.log(`📧 Usuario objetivo: ${TARGET_EMAIL}`);

  try {
    await database.connect();

    if (!database.isConnected || mongoose.connection.readyState !== 1) {
      console.error('❌ No hay conexión a MongoDB.');
      process.exit(1);
    }

    const emailCandidates = buildEmailCandidates(TARGET_EMAIL);
    const user = await User.findOne({ email: { $in: emailCandidates } });
    if (!user) {
      console.error(`❌ No se encontró usuario con email: ${TARGET_EMAIL}`);
      console.error(`   Variantes buscadas: ${emailCandidates.join(', ')}`);
      process.exit(1);
    }

    const adminRole = await ensureAdminRole();
    const userRole = await ensureUserRole();

    user.primaryRole = 'admin';
    user.isSuperAdmin = true;
    user.isActive = true;
    user.roles = [adminRole._id, userRole._id];
    user.password = NEW_PASSWORD; // Se hashea automáticamente en pre-save

    await user.save();

    console.log('✅ Usuario actualizado correctamente.');
    console.log(`   - email: ${user.email}`);
    console.log(`   - primaryRole: ${user.primaryRole}`);
    console.log(`   - isSuperAdmin: ${user.isSuperAdmin}`);
    console.log(`   - roles: ${user.roles.length} (admin + user)`);
    console.log('🔐 Password actualizada.');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
