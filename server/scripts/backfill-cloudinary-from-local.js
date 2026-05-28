/**
 * Sube a Cloudinary imágenes que solo existen en disco local y actualiza MongoDB.
 * Ejecutar en el VPS (donde están los archivos) con credenciales Cloudinary en .env.
 *
 * Uso:
 *   node server/scripts/backfill-cloudinary-from-local.js           # dry-run
 *   node server/scripts/backfill-cloudinary-from-local.js --apply
 */
const path = require('path');
const { envPath } = require('../config/envPath');
require('dotenv').config({ path: envPath });
const mongoose = require('mongoose');
const database = require('../config/database');
const cloudinaryConfig = require('../config/cloudinary');
const Promotion = require('../models/Promotion');
const {
    firstExistingPath,
    resolveLocalPromotionFilePath,
    uploadLocalFileToCloudinary,
    getUploadDir,
    getPromotionUploadDir,
} = require('../utils/promotionImageStorage');

const APPLY = process.argv.includes('--apply');

function filenameFromImage(image) {
    if (image?.filename) return image.filename;
    if (typeof image?.url === 'string' && image.url.trim()) {
        const clean = image.url.split('?')[0];
        return path.basename(clean);
    }
    return null;
}

async function main() {
    console.log('===============================================');
    console.log('  Backfill Cloudinary desde disco local');
    console.log('===============================================');
    console.log(`Modo: ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
    console.log(`UPLOAD_PATH efectivo: ${getUploadDir()}`);
    console.log(`Promociones en: ${getPromotionUploadDir()}\n`);

    cloudinaryConfig.configure();
    if (!cloudinaryConfig.isConfigured) {
        console.error('❌ Cloudinary no configurado. Define CLOUDINARY_* en .env');
        process.exit(1);
    }

    await database.connect();
    if (!database.isConnected || mongoose.connection.readyState !== 1) {
        console.error('❌ Sin conexión MongoDB');
        process.exit(1);
    }

    const promotions = await Promotion.find({ 'images.0': { $exists: true } });
    let scanned = 0;
    let needsUpload = 0;
    let uploaded = 0;
    let skipped = 0;
    let missingFile = 0;

    for (const promo of promotions) {
        const images = Array.isArray(promo.images) ? promo.images : [];
        let changed = false;

        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            scanned += 1;
            if (img?.cloudinaryUrl) {
                skipped += 1;
                continue;
            }

            const filename = filenameFromImage(img);
            if (!filename) continue;

            const localPath = await firstExistingPath(resolveLocalPromotionFilePath(filename));
            if (!localPath) {
                missingFile += 1;
                console.log(`❌ Sin archivo: ${filename} | promo ${promo._id} ${promo.title || ''}`);
                continue;
            }

            needsUpload += 1;
            console.log(`⬆️  ${filename} → Cloudinary | promo ${promo._id}`);

            if (!APPLY) continue;

            const up = await uploadLocalFileToCloudinary(localPath);
            if (!up.ok) {
                console.log(`   ⚠️ Falló: ${up.reason}`);
                continue;
            }

            images[i].cloudinaryUrl = up.cloudinaryUrl;
            images[i].cloudinaryPublicId = up.cloudinaryPublicId;
            images[i].url = up.cloudinaryUrl;
            changed = true;
            uploaded += 1;
        }

        if (changed && APPLY) {
            promo.images = images;
            await promo.save();
        }
    }

    console.log('\n--- Resumen ---');
    console.log(`Referencias revisadas: ${scanned}`);
    console.log(`Ya en Cloudinary: ${skipped}`);
    console.log(`Pendientes de subir (archivo OK): ${needsUpload}`);
    console.log(`Sin archivo en disco: ${missingFile}`);
    if (APPLY) console.log(`Subidas aplicadas: ${uploaded}`);

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
