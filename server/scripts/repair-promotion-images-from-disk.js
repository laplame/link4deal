/**
 * Repara referencias de imágenes de promociones desde disco.
 *
 * Estrategia:
 * 1) Match por _id dentro del filename
 * 2) Match por slug de title/productName/brand dentro del filename
 * 3) Fallback por orden cronológico (archivo -> promoción sin imagen)
 *
 * Uso:
 *   node server/scripts/repair-promotion-images-from-disk.js          # dry-run (no guarda)
 *   node server/scripts/repair-promotion-images-from-disk.js --apply  # aplica cambios
 */
const path = require('path');
const fs = require('fs').promises;
const { envPath } = require('../config/envPath');
require('dotenv').config({ path: envPath });
const mongoose = require('mongoose');
const database = require('../config/database');
const Promotion = require('../models/Promotion');
const { getPromotionUploadDir } = require('../middleware/upload');

const APPLY = process.argv.includes('--apply');

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

function slugify(input) {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isImageFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return IMAGE_EXTS.has(ext);
}

function hasImages(promo) {
  return Array.isArray(promo.images) && promo.images.length > 0;
}

async function safeListFiles(dir) {
  try {
    const names = await fs.readdir(dir);
    const files = [];
    for (const name of names) {
      if (name.startsWith('.')) continue;
      if (!isImageFile(name)) continue;
      const full = path.join(dir, name);
      const stat = await fs.stat(full);
      if (stat.isFile()) {
        files.push({
          filename: name,
          fullPath: full,
          mtimeMs: stat.mtimeMs
        });
      }
    }
    return files;
  } catch {
    return [];
  }
}

async function main() {
  console.log('===============================================');
  console.log('  Reparar imágenes de promociones desde disco');
  console.log('===============================================');
  console.log(`Modo: ${APPLY ? 'APPLY' : 'DRY-RUN'}\n`);

  await database.connect();
  if (!database.isConnected || mongoose.connection.readyState !== 1) {
    console.error('❌ No hay conexión a MongoDB.');
    process.exit(1);
  }

  const currentDir = path.resolve(getPromotionUploadDir()); // server/uploads/promotions
  const legacyDir = path.resolve(path.join(__dirname, '../public/uploads/promotions'));

  const [currentFiles, legacyFiles] = await Promise.all([
    safeListFiles(currentDir),
    safeListFiles(legacyDir)
  ]);
  const allDiskFiles = [...currentFiles, ...legacyFiles];

  const promotions = await Promotion.find({}, {
    _id: 1,
    title: 1,
    productName: 1,
    brand: 1,
    images: 1,
    createdAt: 1
  }).sort({ createdAt: 1 }).lean();

  const referenced = new Set();
  for (const p of promotions) {
    const imgs = Array.isArray(p.images) ? p.images : [];
    for (const img of imgs) {
      if (img?.filename) referenced.add(img.filename);
      else if (img?.url) referenced.add(path.basename(String(img.url).split('?')[0]));
    }
  }

  let candidates = allDiskFiles.filter((f) => !referenced.has(f.filename));
  const targets = promotions.filter((p) => !hasImages(p));
  const plan = [];

  // 1) Match por _id dentro filename
  for (const promo of targets) {
    const id = String(promo._id);
    const idx = candidates.findIndex((f) => f.filename.includes(id));
    if (idx >= 0) {
      plan.push({ promo, file: candidates[idx], reason: 'match_by_id' });
      candidates.splice(idx, 1);
    }
  }

  // 2) Match por slug de title/productName/brand
  for (const promo of targets) {
    if (plan.some((p) => String(p.promo._id) === String(promo._id))) continue;
    const slugs = [
      slugify(promo.title),
      slugify(promo.productName),
      slugify(promo.brand)
    ].filter(Boolean);
    if (slugs.length === 0) continue;
    const idx = candidates.findIndex((f) => slugs.some((s) => s && f.filename.toLowerCase().includes(s)));
    if (idx >= 0) {
      plan.push({ promo, file: candidates[idx], reason: 'match_by_slug' });
      candidates.splice(idx, 1);
    }
  }

  // 3) Fallback cronológico
  const remainingPromos = targets.filter((p) => !plan.some((x) => String(x.promo._id) === String(p._id)));
  const remainingFiles = [...candidates].sort((a, b) => a.mtimeMs - b.mtimeMs);
  for (let i = 0; i < Math.min(remainingPromos.length, remainingFiles.length); i += 1) {
    plan.push({
      promo: remainingPromos[i],
      file: remainingFiles[i],
      reason: 'fallback_chronological'
    });
  }

  console.log(`📦 Promociones totales: ${promotions.length}`);
  console.log(`🖼️ Archivos candidatos en disco (no referenciados): ${allDiskFiles.filter((f) => !referenced.has(f.filename)).length}`);
  console.log(`🎯 Promociones sin imágenes: ${targets.length}`);
  console.log(`🧩 Asignaciones propuestas: ${plan.length}\n`);

  if (plan.length > 0) {
    console.log('--- PLAN (primeros 30) ---');
    plan.slice(0, 30).forEach((item, idx) => {
      console.log(
        `${idx + 1}. promo=${item.promo._id} | "${item.promo.title || item.promo.productName || 'Sin título'}" -> ${item.file.filename} (${item.reason})`
      );
    });
    console.log('');
  }

  if (APPLY && plan.length > 0) {
    let updated = 0;
    for (const item of plan) {
      const publicUrl = `/uploads/promotions/${item.file.filename}`;
      const update = {
        $set: {
          images: [
            {
              originalName: item.file.filename,
              filename: item.file.filename,
              path: item.file.fullPath,
              url: publicUrl,
              uploadedAt: new Date(item.file.mtimeMs)
            }
          ]
        }
      };
      await Promotion.updateOne({ _id: item.promo._id }, update);
      updated += 1;
    }
    console.log(`✅ Promociones actualizadas: ${updated}`);
  } else if (!APPLY) {
    console.log('ℹ️ Dry-run: no se escribieron cambios. Usa --apply para aplicar.');
  }

  await mongoose.connection.close();
  process.exit(0);
}

main().catch(async (error) => {
  console.error('❌ Error:', error.message);
  try { await mongoose.connection.close(); } catch {}
  process.exit(1);
});

