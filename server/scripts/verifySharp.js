/**
 * Verifica que Sharp esté instalado y pueda procesar imágenes.
 * Uso: node scripts/verifySharp.js
 */

const path = require('path');
const { envPath } = require('../config/envPath');
require('dotenv').config({ path: envPath });

async function verifySharp() {
    console.log('🔍 Verificando Sharp para edición de imágenes...\n');

    try {
        const sharp = require('sharp');
        const pkg = require('sharp/package.json');
        console.log('✅ Sharp cargado correctamente');
        console.log('   Versión:', pkg.version, sharp.versions ? `(libvips: ${sharp.versions.vips})` : '');

        // Crear una imagen mínima con Sharp y procesarla
        const minimalImage = await sharp({
            create: { width: 100, height: 100, channels: 3, background: { r: 200, g: 100, b: 50 } }
        })
            .jpeg({ quality: 90 })
            .toBuffer();

        const metadata = await sharp(minimalImage).metadata();
        console.log('✅ Lectura de metadatos:', metadata.width + 'x' + metadata.height, metadata.format);

        const resized = await sharp(minimalImage)
            .resize(10, 10, { fit: 'inside' })
            .webp({ quality: 80 })
            .toBuffer();
        console.log('✅ Redimensionado + WebP:', resized.length, 'bytes');

        const imageOptimizer = require('../utils/imageOptimizer');
        const result = await imageOptimizer.optimizeImage(minimalImage, { maxWidth: 80, maxHeight: 80, quality: 85 });
        console.log('✅ imageOptimizer.optimizeImage():', result.optimizedSize, 'bytes,', result.compressionRatio + '% reducción');

        const thumb = await imageOptimizer.generateThumbnail(minimalImage, { width: 50, height: 50 });
        console.log('✅ imageOptimizer.generateThumbnail():', thumb.length, 'bytes');

        console.log('\n✅ Sharp listo para editar imágenes (optimización, resize, thumbnails).');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Error verificando Sharp:', err.message);
        if (err.message && (err.message.includes('libvips') || err.message.includes('ELF'))) {
            console.error('   Sugerencia: reinstala dependencias con npm install (Sharp usa binarios nativos por plataforma).');
        }
        process.exit(1);
    }
}

verifySharp();
