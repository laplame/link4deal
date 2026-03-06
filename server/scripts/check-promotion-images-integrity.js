/**
 * Revisa integridad de imágenes de promociones:
 * - Referencias en MongoDB vs archivos físicos en disco
 * - Busca en rutas actuales y legacy (public/uploads)
 *
 * Uso:
 *   node server/scripts/check-promotion-images-integrity.js
 */
const path = require('path');
const fs = require('fs').promises;
const { envPath } = require('../config/envPath');
require('dotenv').config({ path: envPath });
const mongoose = require('mongoose');
const database = require('../config/database');
const Promotion = require('../models/Promotion');
const { getPromotionUploadDir } = require('../middleware/upload');

async function listFiles(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isFile()) files.push(fullPath);
      if (entry.isDirectory()) {
        const nested = await listFiles(fullPath);
        files.push(...nested);
      }
    }
    return files;
  } catch {
    return [];
  }
}

function filenameFromImage(image) {
  if (image?.filename) return image.filename;
  if (typeof image?.url === 'string' && image.url.trim()) {
    try {
      const clean = image.url.split('?')[0];
      return path.basename(clean);
    } catch {
      return null;
    }
  }
  return null;
}

async function main() {
  console.log('===============================================');
  console.log('  Check Integridad Imágenes de Promociones');
  console.log('===============================================\n');

  await database.connect();
  if (!database.isConnected || mongoose.connection.readyState !== 1) {
    console.error('❌ No hay conexión a MongoDB.');
    process.exit(1);
  }

  const currentDir = path.resolve(getPromotionUploadDir()); // server/uploads/promotions
  const legacyDir = path.resolve(path.join(__dirname, '../public/uploads/promotions'));

  const [currentFiles, legacyFiles] = await Promise.all([listFiles(currentDir), listFiles(legacyDir)]);
  const diskFileSet = new Set(
    [...currentFiles, ...legacyFiles].map((f) => path.basename(f))
  );

  const promotions = await Promotion.find({}, { _id: 1, title: 1, images: 1 }).lean();
  const referenced = [];
  const missing = [];

  for (const promo of promotions) {
    const images = Array.isArray(promo.images) ? promo.images : [];
    for (const img of images) {
      const filename = filenameFromImage(img);
      if (!filename) continue;
      referenced.push({ promotionId: String(promo._id), title: promo.title, filename });
      if (!diskFileSet.has(filename)) {
        missing.push({ promotionId: String(promo._id), title: promo.title, filename });
      }
    }
  }

  const referencedSet = new Set(referenced.map((r) => r.filename));
  const orphanCurrent = currentFiles
    .map((f) => path.basename(f))
    .filter((filename) => !referencedSet.has(filename));
  const orphanLegacy = legacyFiles
    .map((f) => path.basename(f))
    .filter((filename) => !referencedSet.has(filename));

  console.log(`📦 Promociones revisadas: ${promotions.length}`);
  console.log(`🖼️ Archivos en ${currentDir}: ${currentFiles.length}`);
  console.log(`🖼️ Archivos en ${legacyDir}: ${legacyFiles.length}`);
  console.log(`🔗 Referencias en DB: ${referenced.length}`);
  console.log(`❌ Referencias faltantes en disco: ${missing.length}`);
  console.log(`🧹 Huérfanos en ruta actual: ${orphanCurrent.length}`);
  console.log(`🧹 Huérfanos en ruta legacy: ${orphanLegacy.length}\n`);

  if (missing.length > 0) {
    console.log('--- FALTANTES (primeros 20) ---');
    missing.slice(0, 20).forEach((m, i) => {
      console.log(`${i + 1}. ${m.filename} | promo=${m.promotionId} | ${m.title || 'Sin título'}`);
    });
    console.log('');
  }

  if (orphanCurrent.length > 0 || orphanLegacy.length > 0) {
    console.log('--- HUÉRFANOS (primeros 20) ---');
    [...orphanCurrent.map((x) => ({ path: 'current', filename: x })), ...orphanLegacy.map((x) => ({ path: 'legacy', filename: x }))]
      .slice(0, 20)
      .forEach((o, i) => {
        console.log(`${i + 1}. [${o.path}] ${o.filename}`);
      });
    console.log('');
  }

  await mongoose.connection.close();
  process.exit(0);
}

main().catch(async (error) => {
  console.error('❌ Error:', error.message);
  try { await mongoose.connection.close(); } catch {}
  process.exit(1);
});
