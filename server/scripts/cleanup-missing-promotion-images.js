/**
 * Limpia referencias de imágenes locales inexistentes en promociones.
 *
 * Uso:
 *   node server/scripts/cleanup-missing-promotion-images.js
 */
const path = require('path');
const fs = require('fs').promises;
const { envPath } = require('../config/envPath');
require('dotenv').config({ path: envPath });
const mongoose = require('mongoose');
const database = require('../config/database');
const Promotion = require('../models/Promotion');
const { getPromotionUploadDir } = require('../middleware/upload');

function looksLikeRemoteUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url);
}

async function localImageExists(filename) {
  if (!filename) return false;
  const full = path.join(getPromotionUploadDir(), filename);
  try {
    await fs.access(full);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log('===============================================');
  console.log('  Limpiar referencias de imágenes rotas');
  console.log('===============================================');

  await database.connect();
  if (!database.isConnected || mongoose.connection.readyState !== 1) {
    console.error('❌ No hay conexión a MongoDB.');
    process.exit(1);
  }

  const promotions = await Promotion.find({ 'images.0': { $exists: true } });
  let promotionsUpdated = 0;
  let imagesRemoved = 0;

  for (const promo of promotions) {
    const originalImages = Array.isArray(promo.images) ? promo.images : [];
    const kept = [];

    for (const img of originalImages) {
      // Si existe Cloudinary o URL remota, conservar.
      if (img?.cloudinaryUrl || looksLikeRemoteUrl(img?.url)) {
        kept.push(img);
        continue;
      }

      // Si tiene filename local, validar existencia física.
      const exists = await localImageExists(img?.filename);
      if (exists) {
        kept.push(img);
      } else {
        imagesRemoved += 1;
      }
    }

    if (kept.length !== originalImages.length) {
      promo.images = kept;
      await promo.save();
      promotionsUpdated += 1;
    }
  }

  console.log(`✅ Promociones revisadas: ${promotions.length}`);
  console.log(`🧹 Promociones actualizadas: ${promotionsUpdated}`);
  console.log(`🗑️ Referencias de imagen eliminadas: ${imagesRemoved}`);

  await mongoose.connection.close();
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});

