const sharp = require('sharp');
const path = require('path');

/**
 * Optimiza una imagen para web manteniendo buena calidad
 * @param {Buffer} imageBuffer - Buffer de la imagen original
 * @param {Object} options - Opciones de optimización
 * @returns {Promise<Buffer>} - Buffer de la imagen optimizada
 */
async function optimizeImage(imageBuffer, options = {}) {
    const {
        maxWidth = 1920,
        maxHeight = 1920,
        quality = 85,
        format = 'auto', // 'auto', 'jpeg', 'png', 'webp'
        progressive = true
    } = options;

    try {
        // Obtener metadatos de la imagen
        const metadata = await sharp(imageBuffer).metadata();
        const originalSize = imageBuffer.length;
        
        console.log(`📊 Imagen original: ${metadata.width}x${metadata.height}, ${(originalSize / 1024).toFixed(2)}KB`);

        // Determinar formato de salida
        let outputFormat = format;
        if (format === 'auto') {
            // Usar WebP si es posible (mejor compresión), sino mantener formato original
            if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
                outputFormat = 'webp'; // WebP tiene mejor compresión que JPEG
            } else if (metadata.format === 'png') {
                // Para PNG, usar WebP si tiene transparencia, sino JPEG
                outputFormat = metadata.hasAlpha ? 'webp' : 'jpeg';
            } else {
                outputFormat = metadata.format;
            }
        }

        // Calcular dimensiones manteniendo aspect ratio
        let width = metadata.width;
        let height = metadata.height;
        
        if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
        }

        // Crear pipeline de optimización
        let pipeline = sharp(imageBuffer)
            .resize(width, height, {
                fit: 'inside',
                withoutEnlargement: true
            });

        // Aplicar optimizaciones según formato
        if (outputFormat === 'jpeg' || outputFormat === 'jpg') {
            pipeline = pipeline
                .jpeg({
                    quality: quality,
                    progressive: progressive,
                    mozjpeg: true // Usar mozjpeg para mejor compresión
                });
        } else if (outputFormat === 'png') {
            pipeline = pipeline
                .png({
                    quality: quality,
                    compressionLevel: 9,
                    adaptiveFiltering: true
                });
        } else if (outputFormat === 'webp') {
            pipeline = pipeline
                .webp({
                    quality: quality,
                    effort: 6 // 0-6, mayor esfuerzo = mejor compresión pero más lento
                });
        }

        // Procesar imagen
        const optimizedBuffer = await pipeline.toBuffer();
        const optimizedSize = optimizedBuffer.length;
        const compressionRatio = ((1 - optimizedSize / originalSize) * 100).toFixed(1);

        console.log(`✅ Imagen optimizada: ${width}x${height}, ${(optimizedSize / 1024).toFixed(2)}KB (${compressionRatio}% reducción)`);

        return {
            buffer: optimizedBuffer,
            width,
            height,
            format: outputFormat,
            originalSize,
            optimizedSize,
            compressionRatio: parseFloat(compressionRatio),
            metadata: {
                ...metadata,
                width,
                height,
                format: outputFormat
            }
        };

    } catch (error) {
        console.error('❌ Error optimizando imagen:', error);
        throw error;
    }
}

/**
 * Optimiza múltiples imágenes
 * @param {Array<Buffer>} imageBuffers - Array de buffers de imágenes
 * @param {Object} options - Opciones de optimización
 * @returns {Promise<Array>} - Array de resultados de optimización
 */
async function optimizeImages(imageBuffers, options = {}) {
    const results = [];
    
    for (let i = 0; i < imageBuffers.length; i++) {
        try {
            const result = await optimizeImage(imageBuffers[i], options);
            results.push(result);
        } catch (error) {
            console.error(`❌ Error optimizando imagen ${i + 1}:`, error);
            // Si falla la optimización, usar imagen original
            results.push({
                buffer: imageBuffers[i],
                error: error.message
            });
        }
    }
    
    return results;
}

/**
 * Genera thumbnail de una imagen
 * @param {Buffer} imageBuffer - Buffer de la imagen original
 * @param {Object} options - Opciones del thumbnail
 * @returns {Promise<Buffer>} - Buffer del thumbnail
 */
async function generateThumbnail(imageBuffer, options = {}) {
    const {
        width = 300,
        height = 300,
        quality = 80
    } = options;

    try {
        const thumbnail = await sharp(imageBuffer)
            .resize(width, height, {
                fit: 'cover',
                position: 'center'
            })
            .jpeg({
                quality: quality,
                progressive: true
            })
            .toBuffer();

        return thumbnail;
    } catch (error) {
        console.error('❌ Error generando thumbnail:', error);
        throw error;
    }
}

module.exports = {
    optimizeImage,
    optimizeImages,
    generateThumbnail
};
