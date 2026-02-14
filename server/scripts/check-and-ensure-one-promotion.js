/**
 * Comprueba si hay al menos una promoción activa en la BD.
 * Si no hay ninguna, crea una promoción de ejemplo para que el index la muestre.
 *
 * Ejecutar desde la raíz del proyecto:
 *   node server/scripts/check-and-ensure-one-promotion.js
 *
 * O desde server/:
 *   node scripts/check-and-ensure-one-promotion.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const database = require('../config/database');
const Promotion = require('../models/Promotion');

const ONE_PROMOTION = {
  title: 'Oferta de ejemplo - Link4Deal',
  description: 'Promoción de ejemplo para verificar que la API y el index muestran datos de la BD.',
  productName: 'Producto de ejemplo',
  brand: 'Marca Demo',
  category: 'other',
  originalPrice: 100,
  currentPrice: 50,
  currency: 'MXN',
  discountPercentage: 50,
  storeName: 'Tienda Demo',
  storeLocation: {
    address: '',
    city: 'Ciudad de México',
    state: 'CDMX',
    country: 'México'
  },
  images: [],
  tags: ['ejemplo', 'demo'],
  status: 'active',
  isHotOffer: false,
  hotness: 'warm',
  validFrom: new Date(),
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  seller: {
    name: 'Sistema',
    email: 'sistema@link4deal.com',
    verified: false
  },
  views: 0,
  clicks: 0,
  conversions: 0
};

async function main() {
  console.log('==========================================');
  console.log('  Comprobar / asegurar 1 promoción activa');
  console.log('==========================================\n');

  try {
    await database.connect();

    if (!database.isConnected || mongoose.connection.readyState !== 1) {
      console.error('❌ No hay conexión a MongoDB. Revisa MONGODB_URI_ATLAS en server/.env');
      process.exit(1);
    }

    console.log('✅ Conectado a MongoDB\n');

    const activeCount = await Promotion.countDocuments({ status: 'active' });
    console.log(`📊 Promociones con status=active: ${activeCount}`);

    if (activeCount > 0) {
      const one = await Promotion.findOne({ status: 'active' }).sort({ createdAt: -1 }).lean();
      console.log(`   Última: "${one.title}" (ID: ${one._id})`);
      console.log('\n✅ Ya hay al menos una promoción activa. El index puede mostrarla.');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log('   No hay ninguna. Creando una promoción de ejemplo...\n');

    const created = await Promotion.create(ONE_PROMOTION);
    console.log(`✅ Promoción creada: "${created.title}"`);
    console.log(`   ID: ${created._id}`);
    console.log('\n✅ El index puede mostrarla con GET /api/promotions?limit=1&page=1&status=active');

    await mongoose.connection.close();
    console.log('\n🔌 Conexión cerrada.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
