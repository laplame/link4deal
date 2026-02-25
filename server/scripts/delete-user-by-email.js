/**
 * Elimina un usuario por email (para poder registrarse de nuevo y luego promover a super admin).
 *
 * Uso (desde raíz del proyecto):
 *   node server/scripts/delete-user-by-email.js
 *   node server/scripts/delete-user-by-email.js otro@email.com
 *
 * Con variable de entorno:
 *   SUPER_ADMIN_EMAIL=saul.laplame@gmail.com node server/scripts/delete-user-by-email.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const database = require('../config/database');
const User = require('../models/User');

const TARGET_EMAIL = (process.env.SUPER_ADMIN_EMAIL || process.argv[2] || 'saul.laplame@gmail.com').toLowerCase().trim();

async function main() {
  console.log('===============================================');
  console.log('  Eliminar usuario por email');
  console.log('===============================================');
  console.log(`📧 Email: ${TARGET_EMAIL}`);

  try {
    await database.connect();

    if (!database.isConnected) {
      console.error('❌ No hay conexión a MongoDB.');
      process.exit(1);
    }

    const user = await User.findOne({ email: TARGET_EMAIL });
    if (!user) {
      console.log(`⚠️ No existe ningún usuario con email: ${TARGET_EMAIL}`);
      process.exit(0);
    }

    await User.deleteOne({ _id: user._id });
    console.log('✅ Usuario eliminado correctamente.');
    console.log('   Ahora puedes registrarte de nuevo en la app y luego ejecutar:');
    console.log('   npm run promote:superadmin');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
