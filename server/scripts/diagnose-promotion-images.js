/**
 * Diagnóstico detallado: MongoDB vs disco vs rutas que usa el servidor.
 *
 * Uso (en el VPS o local):
 *   node server/scripts/diagnose-promotion-images.js
 */
const path = require('path');
const fs = require('fs').promises;
const { envPath } = require('../config/envPath');
require('dotenv').config({ path: envPath });
const mongoose = require('mongoose');
const database = require('../config/database');
const Promotion = require('../models/Promotion');
const { getUploadDir, getPromotionUploadDir } = require('../middleware/upload');
const { resolveLocalPromotionFilePath, firstExistingPath } = require('../utils/promotionImageStorage');

function filenameFromImage(image) {
    if (image?.filename) return image.filename;
    if (typeof image?.url === 'string' && image.url.trim()) {
        return path.basename(image.url.split('?')[0]);
    }
    return null;
}

async function countDir(dir) {
    try {
        const names = await fs.readdir(dir);
        return names.filter((n) => !n.startsWith('.')).length;
    } catch {
        return -1;
    }
}

async function main() {
    const uploadDir = path.resolve(getUploadDir());
    const promoDir = path.resolve(getPromotionUploadDir());

    console.log('===============================================');
    console.log('  Diagnóstico imágenes de promociones');
    console.log('===============================================\n');
    console.log(`UPLOAD_PATH (env): ${process.env.UPLOAD_PATH || '(no definido — default server/uploads)'}`);
    console.log(`getUploadDir():     ${uploadDir}`);
    console.log(`promotions/:         ${promoDir}`);
    console.log(`Archivos en promotions/: ${await countDir(promoDir)}`);
    console.log(`Archivos en upload root: ${await countDir(uploadDir)}\n`);

    await database.connect();
    if (!database.isConnected) {
        console.error('❌ Sin MongoDB');
        process.exit(1);
    }

    const promotions = await Promotion.find({ 'images.0': { $exists: true } })
        .select('_id title images')
        .lean();

    let okCloud = 0;
    let okDisk = 0;
    let broken = 0;

    for (const promo of promotions) {
        const images = Array.isArray(promo.images) ? promo.images : [];
        for (const img of images) {
            const fn = filenameFromImage(img);
            const hasCloud = Boolean(img?.cloudinaryUrl);
            const candidates = fn ? resolveLocalPromotionFilePath(fn) : [];
            const found = fn ? await firstExistingPath(candidates) : null;

            if (hasCloud) okCloud += 1;
            if (found) okDisk += 1;
            if (!hasCloud && !found) {
                broken += 1;
                console.log('--- ROTA ---');
                console.log(`  Promo: ${promo._id} | ${promo.title || 'Sin título'}`);
                console.log(`  filename: ${fn || '(sin filename)'}`);
                console.log(`  url en DB: ${img?.url || '—'}`);
                console.log(`  cloudinaryUrl: ${img?.cloudinaryUrl || '—'}`);
                if (candidates.length) {
                    console.log('  Rutas buscadas (ninguna existe):');
                    for (const c of candidates) console.log(`    - ${c}`);
                }
                console.log('');
            }
        }
    }

    console.log('--- Resumen ---');
    console.log(`Promociones con al menos 1 imagen: ${promotions.length}`);
    console.log(`Referencias con Cloudinary: ${okCloud}`);
    console.log(`Referencias con archivo en disco: ${okDisk}`);
    console.log(`Referencias rotas (sin Cloudinary ni disco): ${broken}`);

    if (broken > 0) {
        console.log('\nRecuperación posible:');
        console.log('  1) Si el archivo estuvo en git: git show <commit>^:server/uploads/promotions/<file> > server/uploads/promotions/<file>');
        console.log('  2) Copiar desde otro equipo: scp …/promotions/<file> vps:~/project/link4deal/server/uploads/promotions/');
        console.log('  3) Volver a subir la imagen en el panel de la promoción');
        console.log('  4) node server/scripts/backfill-cloudinary-from-local.js --apply (tras recuperar archivos)');
    }

    await mongoose.connection.close();
    process.exit(0);
}

main().catch(async (e) => {
    console.error('❌', e.message);
    try {
        await mongoose.connection.close();
    } catch {
        /* ignore */
    }
    process.exit(1);
});
