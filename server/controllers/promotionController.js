const Promotion = require('../models/Promotion');
const PromotionConversion = require('../models/PromotionConversion');
const Influencer = require('../models/Influencer');
const cloudinaryConfig = require('../config/cloudinary');
const ocrService = require('../services/ocrService');
const { analyzePromotionImages } = require('../services/geminiPromoAnalyzer');
const database = require('../config/database');
const { getPromotionUploadDir } = require('../middleware/upload');
const { getPromotionalValueUsd, getValuePerCouponAndMaxEmissionAsync } = require('../utils/promotionValueUsd');
const { enrichPromotionClientFields } = require('../utils/promotionClientFields');
const { parseChainLocations } = require('../utils/chainStore');
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

/** Términos por defecto para promociones tipo Amazon (redirección a Amazon sin URL custom). */
const DEFAULT_TERMS_AMAZON = `Términos de la promoción
Esta oferta de 90 días de periodo de prueba gratis de un Plan Individual mensual de Amazon Music Unlimited solo está disponible para nuevos suscriptores de Amazon Music Unlimited que compren un producto elegible enviado y vendido por www.amazon.com.mx, para los que se registren a una suscripción elegible de Amazon (por ejemplo, Prime) o los que registren un dispositivo elegible en la app de Alexa. Después de tu compra o registro, se aplicará automáticamente a tu cuenta una suscripción promocional de 90 días a un Plan Individual de Amazon Music Unlimited. También recibirás un correo electrónico con más información sobre cómo canjear esta oferta. La oferta debe canjearse en un plazo de 30 días a partir de la fecha de compra, suscripción o registro de un producto o servicio elegible. Después del periodo de prueba promocional, tu suscripción continuará automáticamente al precio mensual de $129 hasta que la canceles. El contenido y los servicios digitales podrían estar disponibles únicamente para los clientes en México y están sujetos a los términos y condiciones de uso de Servicios Comerciales Amazon México, S. de R.L. de C.V. Esta promoción esta limitada a una por cliente y por cuenta. Amazon se reserva el derecho de modificar o cancelar esta promoción en cualquier momento. La promoción no es transferible y está prohibida su reventa. Si infringes cualquiera de estos términos, la promoción no será válida. Si devuelves alguno de los productos o contenidos relacionado con esta oferta, tu reembolso será igual al monto que pagaste por el producto o contenido, sujeto a las políticas de reembolso aplicables.`;

/** Términos genéricos cuando la promoción no tiene términos (ej. no extraídos de imagen). */
const DEFAULT_TERMS_GENERIC = '1 promoción por cliente. Válido hasta agotar existencias o fin de los cupones, lo que suceda primero.';

/**
 * Promociones con id `sim-…` solo viven en memoria del proceso (se pierden al reiniciar y no comparten entre instancias).
 * En producción exigimos MongoDB salvo ALLOW_SIMULATED_PROMOTIONS=true.
 */
function shouldAllowSimulatedPromotions() {
    if (process.env.ALLOW_SIMULATED_PROMOTIONS === 'true') return true;
    if (process.env.ALLOW_SIMULATED_PROMOTIONS === 'false') return false;
    return process.env.NODE_ENV !== 'production';
}

/** Agrupa archivos multer: campos `images` (promo) y `termsImages` (T&C), o legacy array. */
function getPromotionUploadFileGroups(req) {
    const f = req.files;
    if (Array.isArray(f)) return { promo: f, terms: [] };
    if (!f || typeof f !== 'object') return { promo: [], terms: [] };
    return {
        promo: Array.isArray(f.images) ? f.images : [],
        terms: Array.isArray(f.termsImages) ? f.termsImages : []
    };
}

/**
 * Procesa subidas en PUT (append) sin OCR — optimiza, guarda en disco y opcional Cloudinary.
 * @returns {Promise<Array<Object>>} entradas para el array images del modelo
 */
async function processAppendPromotionImages(req) {
    const { promo: promoFiles, terms: termsFiles } = getPromotionUploadFileGroups(req);
    const filesToProcess = [...promoFiles, ...termsFiles];
    if (!filesToProcess.length) return [];
    const imageOptimizer = require('../utils/imageOptimizer');
    const newEntries = [];
    for (let fileIndex = 0; fileIndex < filesToProcess.length; fileIndex++) {
        const file = filesToProcess[fileIndex];
        const isTermsSlot = termsFiles.length > 0 && fileIndex >= promoFiles.length;
        try {
            let optimizedImage;
            try {
                optimizedImage = await imageOptimizer.optimizeImage(file.buffer, {
                    maxWidth: parseInt(process.env.IMAGE_MAX_WIDTH) || 1920,
                    maxHeight: parseInt(process.env.IMAGE_MAX_HEIGHT) || 1920,
                    quality: parseInt(process.env.IMAGE_QUALITY) || 85,
                    format: process.env.IMAGE_FORMAT || 'auto',
                    progressive: true
                });
                file.buffer = optimizedImage.buffer;
            } catch (optErr) {
                console.warn(`⚠️ [update] optimizar imagen: ${optErr.message}`);
            }
            const uploadDir = getPromotionUploadDir();
            await fs.mkdir(uploadDir, { recursive: true });
            const optimizedFormat = optimizedImage?.format || path.extname(file.originalname).slice(1) || 'jpg';
            const fileExtension = optimizedFormat === 'webp' ? '.webp' :
                optimizedFormat === 'png' ? '.png' : '.jpg';
            const uniqueFilename = `promotion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
            const localPath = path.join(uploadDir, uniqueFilename);
            await fs.writeFile(localPath, file.buffer);
            let cloudinaryUrl = null;
            let cloudinaryPublicId = null;
            if (cloudinaryConfig.isConfigured) {
                try {
                    const cloudinaryFile = {
                        ...file,
                        buffer: file.buffer,
                        mimetype: optimizedImage?.format === 'webp' ? 'image/webp' :
                            optimizedImage?.format === 'png' ? 'image/png' : 'image/jpeg'
                    };
                    const cloudinaryResult = await cloudinaryConfig.uploadImage(cloudinaryFile);
                    if (cloudinaryResult.success) {
                        cloudinaryUrl = cloudinaryResult.data.secure_url;
                        cloudinaryPublicId = cloudinaryResult.data.public_id;
                    }
                } catch (cErr) {
                    console.warn(`⚠️ [update] Cloudinary: ${cErr.message}`);
                }
            }
            const publicUrl = `/uploads/promotions/${uniqueFilename}`;
            newEntries.push({
                originalName: file.originalname,
                filename: uniqueFilename,
                path: localPath,
                url: publicUrl,
                cloudinaryUrl,
                cloudinaryPublicId,
                uploadedAt: new Date(),
                imageRole: isTermsSlot ? 'terms' : 'promotional'
            });
        } catch (err) {
            console.error('❌ [update] error procesando imagen:', err.message);
        }
    }
    return newEntries;
}

class PromotionController {
    // Helper para verificar conexión a MongoDB (readyState es la fuente de verdad)
    isMongoConnected() {
        return database.isReady();
    }

    // Helper para validar ObjectId
    isValidObjectId(id) {
        return mongoose.Types.ObjectId.isValid(id);
    }

    // Helper para respuesta vacía cuando no hay conexión
    getEmptyResponse(req, message = 'MongoDB no conectado - modo simulado activo') {
        return {
            success: true,
            data: {
                docs: [],
                totalDocs: 0,
                limit: parseInt(req.query?.limit) || 10,
                page: parseInt(req.query?.page) || 1,
                totalPages: 0,
                hasNextPage: false,
                hasPrevPage: false
            },
            message
        };
    }

    // Helper para validar campos requeridos
    validateRequiredFields(data, requiredFields) {
        const missing = [];
        for (const field of requiredFields) {
            if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
                missing.push(field);
            }
        }
        return missing;
    }

    // Helper para parsear tags y features (pueden venir como JSON string o array)
    parseArrayField(field) {
        if (!field) return [];
        if (Array.isArray(field)) return field;
        if (typeof field === 'string') {
            try {
                // Intentar parsear como JSON
                const parsed = JSON.parse(field);
                return Array.isArray(parsed) ? parsed : field.split(',').map(item => item.trim());
            } catch {
                // Si no es JSON, tratar como string separado por comas
                return field.split(',').map(item => item.trim()).filter(item => item);
            }
        }
        return [];
    }

    // Helper para validar fechas
    validateDates(validFrom, validUntil) {
        const from = validFrom ? new Date(validFrom) : new Date();
        const until = validUntil ? new Date(validUntil) : null;
        
        if (isNaN(from.getTime())) {
            return { valid: false, error: 'Fecha de inicio inválida' };
        }
        
        if (until && isNaN(until.getTime())) {
            return { valid: false, error: 'Fecha de expiración inválida' };
        }
        
        if (until && until <= from) {
            return { valid: false, error: 'La fecha de expiración debe ser posterior a la fecha de inicio' };
        }
        
        return { valid: true, validFrom: from, validUntil: until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) };
    }

    async createPromotion(req, res) {
        try {
            console.log('🔄 Creando nueva promoción...');

            const {
                title,
                description,
                productName,
                brand,
                category,
                originalPrice,
                currentPrice,
                currency,
                storeName,
                storeAddress,
                storeCity,
                storeState,
                isPhysicalStore,
                validFrom,
                validUntil,
                totalQuantity,
                offerType,
                cashbackValue,
                tags,
                features,
                specifications,
                termsAndConditions,
                isHotOffer,
                hotness,
                storeLatitude,
                storeLongitude,
                activateByGps,
                gpsRadiusMeters,
                // Alias usados por la app móvil (mismo significado que activateByGps / gpsRadiusMeters)
                gpsActivationEnabled,
                locationRadiusMeters,
                storeCountry
            } = req.body;

            /** App móvil envía gpsActivationEnabled / locationRadiusMeters; web envía activateByGps / gpsRadiusMeters */
            const effectiveActivateByGps =
                activateByGps !== undefined && activateByGps !== null ? activateByGps : gpsActivationEnabled;
            const effectiveGpsRadiusMeters =
                gpsRadiusMeters !== undefined && gpsRadiusMeters !== null && gpsRadiusMeters !== ''
                    ? gpsRadiusMeters
                    : locationRadiusMeters;

            const parseCoord = (v) => {
                if (v === undefined || v === null || v === '') return NaN;
                const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
                return Number.isFinite(n) ? n : NaN;
            };

            // Solo el título es obligatorio para permitir crear promociones de forma amplia
            const requiredFields = ['title'];
            const missingFields = this.validateRequiredFields(req.body, requiredFields);

            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El título es requerido',
                    missingFields: missingFields
                });
            }

            // Validar fechas (por defecto: desde ahora hasta 30 días)
            const dateValidation = this.validateDates(validFrom, validUntil);
            if (!dateValidation.valid) {
                return res.status(400).json({
                    success: false,
                    message: dateValidation.error
                });
            }

            // Procesar imágenes con OCR en todas (promo + T&C); términos legales vienen de `termsImages`.
            const processedImages = [];
            let ocrData = null;
            const ocrAllChunks = [];
            const ocrTermsChunks = [];
            let lastOcrMeta = { confidence: 0, provider: 'unknown' };

            const { promo: promoFiles, terms: termsFiles } = getPromotionUploadFileGroups(req);
            const filesToProcess = [...promoFiles, ...termsFiles];

            if (filesToProcess.length > 0) {
            const imageOptimizer = require('../utils/imageOptimizer');

            for (let fileIndex = 0; fileIndex < filesToProcess.length; fileIndex++) {
                const file = filesToProcess[fileIndex];
                try {
                    const isTermsSlot = termsFiles.length > 0 && fileIndex >= promoFiles.length;
                    console.log(`🔄 Procesando imagen: ${file.originalname} (${isTermsSlot ? 'términos' : 'promoción'})`);
                    
                    // Guardar buffer original para OCR (mejor calidad)
                    const originalBuffer = Buffer.from(file.buffer);
                    
                    // Optimizar imagen antes de guardar
                    let optimizedImage;
                    
                    try {
                        const optimizationResult = await imageOptimizer.optimizeImage(file.buffer, {
                            maxWidth: parseInt(process.env.IMAGE_MAX_WIDTH) || 1920,
                            maxHeight: parseInt(process.env.IMAGE_MAX_HEIGHT) || 1920,
                            quality: parseInt(process.env.IMAGE_QUALITY) || 85,
                            format: process.env.IMAGE_FORMAT || 'auto', // 'auto', 'jpeg', 'png', 'webp'
                            progressive: true
                        });
                        
                        optimizedImage = optimizationResult;
                        file.buffer = optimizationResult.buffer;
                        file.optimized = true;
                        file.optimizationStats = {
                            originalSize: optimizationResult.originalSize,
                            optimizedSize: optimizationResult.optimizedSize,
                            compressionRatio: optimizationResult.compressionRatio,
                            dimensions: {
                                original: { width: file.width, height: file.height },
                                optimized: { width: optimizationResult.width, height: optimizationResult.height }
                            }
                        };
                        
                        console.log(`✨ Imagen optimizada: ${optimizationResult.compressionRatio}% de reducción`);
                    } catch (optimizationError) {
                        console.warn(`⚠️ Error optimizando imagen, usando original: ${optimizationError.message}`);
                        file.optimized = false;
                        // Continuar con imagen original si falla la optimización
                    }
                    
                    // Carpeta única para imágenes de promociones (servida en /uploads/promotions/)
                    const uploadDir = getPromotionUploadDir();
                    await fs.mkdir(uploadDir, { recursive: true });
                    
                    // Generar nombre único para el archivo (usar extensión del formato optimizado)
                    const optimizedFormat = optimizedImage?.format || path.extname(file.originalname).slice(1) || 'jpg';
                    const fileExtension = optimizedFormat === 'webp' ? '.webp' : 
                                         optimizedFormat === 'png' ? '.png' : '.jpg';
                    const uniqueFilename = `promotion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
                    const localPath = path.join(uploadDir, uniqueFilename);
                    
                    // Guardar imagen optimizada localmente
                    await fs.writeFile(localPath, file.buffer);
                    console.log(`✅ Imagen optimizada guardada localmente: ${localPath}`);
                    
                    // Intentar subir a Cloudinary si está configurado (opcional)
                    let cloudinaryUrl = null;
                    let cloudinaryPublicId = null;
                    
                    if (cloudinaryConfig.isConfigured) {
                        try {
                            const cloudinaryFile = {
                                ...file,
                                buffer: file.buffer,
                                mimetype: optimizedImage?.format === 'webp' ? 'image/webp' : 
                                         optimizedImage?.format === 'png' ? 'image/png' : 'image/jpeg'
                            };
                            
                            const cloudinaryResult = await cloudinaryConfig.uploadImage(cloudinaryFile);
                            if (cloudinaryResult.success) {
                                cloudinaryUrl = cloudinaryResult.data.secure_url;
                                cloudinaryPublicId = cloudinaryResult.data.public_id;
                                console.log(`✅ Imagen optimizada también subida a Cloudinary: ${cloudinaryUrl}`);
                            }
                        } catch (cloudinaryError) {
                            console.log(`⚠️ Cloudinary no disponible, usando solo almacenamiento local: ${cloudinaryError.message}`);
                        }
                    } else {
                        console.log(`ℹ️ Cloudinary no configurado, usando solo almacenamiento local`);
                    }

                    // OCR en cada imagen; texto de `termsImages` alimenta términos legales
                    try {
                        console.log(`🔍 OCR (${isTermsSlot ? 'términos' : 'promo'}) ${file.originalname}...`);
                        const ocrResult = await ocrService.processImageWithPython(originalBuffer, {
                            suggestedFilename: file.originalname || 'promotion.jpg'
                        });

                        if (ocrResult.success && ocrResult.data && ocrResult.data.text) {
                            const raw = String(ocrResult.data.text).trim();
                            if (raw.length > 0) {
                                ocrAllChunks.push(
                                    `--- Imagen ${fileIndex + 1}/${filesToProcess.length}${isTermsSlot ? ' · términos y condiciones' : ' · material promocional'} ---\n${raw}`
                                );
                                if (isTermsSlot) ocrTermsChunks.push(raw);
                            }
                            if (ocrResult.data.confidence != null) {
                                lastOcrMeta.confidence = ocrResult.data.confidence;
                            }
                            if (ocrResult.provider) lastOcrMeta.provider = ocrResult.provider;

                            const firstPromotionalOcr =
                                promoFiles.length > 0 && fileIndex === 0 && !isTermsSlot;
                            if (firstPromotionalOcr) {
                                const extractedData = await ocrService.extractPromotionData(ocrResult);

                                if (extractedData.success) {
                                    if (!productName && extractedData.data.productName) {
                                        req.body.productName = extractedData.data.productName;
                                    }
                                    if (!brand && extractedData.data.brand) {
                                        req.body.brand = extractedData.data.brand;
                                    }
                                    if (!category && extractedData.data.category) {
                                        req.body.category = extractedData.data.category;
                                    }
                                    if (!originalPrice && extractedData.data.originalPrice) {
                                        req.body.originalPrice = extractedData.data.originalPrice;
                                    }
                                    if (!currentPrice && extractedData.data.price) {
                                        req.body.currentPrice = extractedData.data.price;
                                    }
                                    if (!storeName && extractedData.data.storeName) {
                                        req.body.storeName = extractedData.data.storeName;
                                    }
                                    if (!tags && extractedData.data.tags) {
                                        req.body.tags = extractedData.data.tags;
                                    }
                                }
                            }
                        }
                    } catch (ocrErr) {
                        console.warn(`⚠️ OCR omitido o falló para ${file.originalname}:`, ocrErr.message);
                    }

                    // URL pública: única ruta para todas las imágenes de promociones
                    const publicUrl = `/uploads/promotions/${uniqueFilename}`;
                    
                    processedImages.push({
                        originalName: file.originalname,
                        filename: uniqueFilename,
                        path: localPath,
                        url: publicUrl,
                        cloudinaryUrl: cloudinaryUrl,
                        cloudinaryPublicId: cloudinaryPublicId,
                        uploadedAt: new Date(),
                        optimized: file.optimized || false,
                        optimizationStats: file.optimizationStats || null,
                        format: optimizedImage?.format || path.extname(file.originalname).slice(1),
                        dimensions: optimizedImage ? {
                            width: optimizedImage.width,
                            height: optimizedImage.height
                        } : null,
                        imageRole: isTermsSlot ? 'terms' : 'promotional'
                    });

                } catch (error) {
                    console.error(`❌ Error procesando imagen ${file.originalname}:`, error.message);
                    
                    // Continuar con otras imágenes
                    continue;
                }
            }

            if (ocrAllChunks.length > 0) {
                const termsJoined = ocrTermsChunks.join('\n\n---\n\n');
                ocrData = {
                    extractedText: ocrAllChunks.join('\n\n').slice(0, 120000),
                    termsFromAttachments: termsJoined ? termsJoined.slice(0, 50000) : '',
                    confidence: lastOcrMeta.confidence,
                    ocrProvider: lastOcrMeta.provider,
                    processedAt: new Date()
                };
            }
            }

            // Calcular descuento si no se proporcionó
            let discountPercentage = req.body.discountPercentage;
            if (!discountPercentage && originalPrice && currentPrice) {
                discountPercentage = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
            }

            // Parsear arrays (tags y features)
            const parsedTags = this.parseArrayField(tags);
            const parsedFeatures = this.parseArrayField(features);
            
            // Parsear specifications
            let parsedSpecifications = {};
            if (specifications) {
                try {
                    parsedSpecifications = typeof specifications === 'string' 
                        ? JSON.parse(specifications) 
                        : specifications;
                } catch (error) {
                    console.warn('⚠️ Error parseando specifications, usando objeto vacío:', error.message);
                    parsedSpecifications = {};
                }
            }

            const parsedChainLocations = parseChainLocations(req.body.chainLocations);

            const numOriginal = (originalPrice !== undefined && originalPrice !== '') ? parseFloat(originalPrice) : 0;
            const numCurrent = (currentPrice !== undefined && currentPrice !== '') ? parseFloat(currentPrice) : 0;

            const optionalAttribution = {};
            ['brandId', 'shopId', 'gtmTag', 'campaignId', 'source', 'medium'].forEach((k) => {
                const v = req.body[k];
                if (v !== undefined && v !== null && String(v).trim() !== '') {
                    optionalAttribution[k] = String(v).trim();
                }
            });
            const extPid = req.body.externalProductId ?? req.body.productId;
            if (extPid !== undefined && extPid !== null && String(extPid).trim() !== '') {
                optionalAttribution.externalProductId = String(extPid).trim();
            }

            // Crear la promoción (campos con valores por defecto para máxima flexibilidad)
            const promotionData = {
                title: title.trim(),
                description: (() => {
                    const d = (description && String(description).trim()) ? String(description).trim() : '';
                    return d.length > 1000 ? d.slice(0, 1000) : d;
                })(),
                productName: (productName && String(productName).trim()) ? String(productName).trim() : title.trim(),
                brand: brand ? String(brand).trim() : '',
                category: category && ['electronics', 'fashion', 'home', 'beauty', 'sports', 'books', 'food', 'other'].includes(category) ? category : 'other',
                originalPrice: Number.isFinite(numOriginal) ? numOriginal : 0,
                currentPrice: Number.isFinite(numCurrent) ? numCurrent : 0,
                currency: currency || 'USD',
                discountPercentage: discountPercentage || 0,
                storeName: storeName ? String(storeName).trim() : '',
                storeLocation: (() => {
                    const lat = parseCoord(storeLatitude);
                    const lng = parseCoord(storeLongitude);
                    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
                    const countryStr = storeCountry && String(storeCountry).trim() ? String(storeCountry).trim() : 'México';
                    return {
                        address: storeAddress ? String(storeAddress).trim() : '',
                        city: storeCity ? String(storeCity).trim() : '',
                        state: storeState ? String(storeState).trim() : '',
                        country: countryStr,
                        ...(hasCoords ? { coordinates: { latitude: lat, longitude: lng } } : {})
                    };
                })(),
                isPhysicalStore: (() => {
                    if (isPhysicalStore === false || isPhysicalStore === 'false') return false;
                    if (isPhysicalStore === true || isPhysicalStore === 'true') return true;
                    const gpsOn =
                        effectiveActivateByGps === true ||
                        effectiveActivateByGps === 'true';
                    return gpsOn;
                })(),
                activateByGps: effectiveActivateByGps === true || effectiveActivateByGps === 'true',
                gpsRadiusMeters: (() => {
                    const raw =
                        effectiveGpsRadiusMeters !== undefined &&
                        effectiveGpsRadiusMeters !== null &&
                        effectiveGpsRadiusMeters !== ''
                            ? effectiveGpsRadiusMeters
                            : 500;
                    const r = typeof raw === 'number' ? Math.round(raw) : parseInt(String(raw), 10);
                    if (!Number.isFinite(r)) return 500;
                    return Math.min(50000, Math.max(50, r));
                })(),
                isChainStore: req.body.isChainStore === true || req.body.isChainStore === 'true',
                chainBrandName: (req.body.chainBrandName && String(req.body.chainBrandName).trim())
                    ? String(req.body.chainBrandName).trim()
                    : '',
                chainLocations: parsedChainLocations,
                images: processedImages,
                ocrData: ocrData || undefined,
                tags: parsedTags,
                features: parsedFeatures,
                specifications: parsedSpecifications,
                termsAndConditions: (() => {
                    const provided = (termsAndConditions && String(termsAndConditions).trim()) ? String(termsAndConditions).trim() : '';
                    if (provided) return provided;
                    const fromTermsImgs = ocrTermsChunks.length
                        ? ocrTermsChunks.join('\n\n').trim().slice(0, 5000)
                        : '';
                    if (fromTermsImgs) return fromTermsImgs;
                    const isAmazonRedirect = (req.body.redirectInsteadOfQr === 'true' || req.body.redirectInsteadOfQr === true) && !(req.body.redirectToUrl && String(req.body.redirectToUrl).trim());
                    return isAmazonRedirect ? DEFAULT_TERMS_AMAZON : DEFAULT_TERMS_GENERIC;
                })(),
                isHotOffer: isHotOffer === 'true' || isHotOffer === true,
                hotness: hotness || 'warm',
                validFrom: dateValidation.validFrom,
                validUntil: dateValidation.validUntil,
                totalQuantity: totalQuantity !== undefined && totalQuantity !== '' ? parseInt(totalQuantity, 10) : undefined,
                offerType: (() => {
                    const t = offerType && String(offerType).toLowerCase();
                    if (['percentage', 'bogo', 'cashback_fixed', 'cashback_percentage'].includes(t)) return t;
                    if (t === 'fixed') return 'cashback_fixed';
                    return 'percentage';
                })(),
                cashbackValue: cashbackValue !== undefined && cashbackValue !== '' ? parseFloat(cashbackValue) : null,
                promotionalValueUsd: null,
                status: 'active',
                redirectInsteadOfQr: req.body.redirectInsteadOfQr === 'true' || req.body.redirectInsteadOfQr === true,
                redirectToUrl: (req.body.redirectToUrl && String(req.body.redirectToUrl).trim()) ? String(req.body.redirectToUrl).trim() : '',
                seller: {
                    name: 'Usuario del sistema',
                    email: 'system@link4deal.com',
                    verified: false
                },
                ...optionalAttribution
            };

            if (promotionData.isChainStore && parsedChainLocations.length > 0) {
                const first = parsedChainLocations[0];
                const hasMainCoords =
                    promotionData.storeLocation &&
                    promotionData.storeLocation.coordinates &&
                    typeof promotionData.storeLocation.coordinates.latitude === 'number' &&
                    Number.isFinite(promotionData.storeLocation.coordinates.latitude);
                if (!hasMainCoords) {
                    const merged = {
                        address: first.address || (promotionData.storeLocation && promotionData.storeLocation.address) || '',
                        city: first.city || (promotionData.storeLocation && promotionData.storeLocation.city) || '',
                        state: first.state || (promotionData.storeLocation && promotionData.storeLocation.state) || '',
                        country: first.country || (promotionData.storeLocation && promotionData.storeLocation.country) || 'México'
                    };
                    const fc = first.coordinates;
                    if (
                        fc &&
                        typeof fc.latitude === 'number' &&
                        Number.isFinite(fc.latitude) &&
                        typeof fc.longitude === 'number' &&
                        Number.isFinite(fc.longitude)
                    ) {
                        merged.coordinates = { latitude: fc.latitude, longitude: fc.longitude };
                    }
                    promotionData.storeLocation = merged;
                }
                const brandLabel = promotionData.chainBrandName || promotionData.brand || '';
                if (brandLabel && !(promotionData.storeName && String(promotionData.storeName).trim())) {
                    promotionData.storeName = brandLabel;
                }
            }

            // Sanear límites del esquema Mongoose (evita save() rechazado sin mensaje claro)
            if (promotionData.title.length > 200) {
                promotionData.title = promotionData.title.slice(0, 200);
            }
            const rawTerms = promotionData.termsAndConditions || '';
            if (rawTerms.length > 5000) {
                promotionData.termsAndConditions = rawTerms.slice(0, 5000);
            }
            const dp = Number(promotionData.discountPercentage);
            promotionData.discountPercentage = Number.isFinite(dp)
                ? Math.min(100, Math.max(0, Math.round(dp)))
                : 0;
            const hz = String(promotionData.hotness || 'warm').toLowerCase();
            promotionData.hotness = ['fire', 'hot', 'warm'].includes(hz) ? hz : 'warm';

            // Validar que los precios no sean negativos y que actual <= original (si hay precios)
            if (promotionData.originalPrice < 0 || promotionData.currentPrice < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Los precios no pueden ser negativos'
                });
            }
            if (promotionData.currentPrice > promotionData.originalPrice) {
                return res.status(400).json({
                    success: false,
                    message: 'El precio actual no puede ser mayor al precio original'
                });
            }

            // Unidad calculable del contrato (PSCS-1): valor en USD (stablecoin). Si la promoción está en español (MXN),
            // se convierte a USD y se normaliza en dólares americanos para todos los cálculos de token.
            const currencyCode = (promotionData.currency || currency || 'USD').toUpperCase();
            let fxRateMxnToUsd;
            if (currencyCode === 'MXN') {
                try {
                    const fxService = require('../services/fxRate');
                    fxRateMxnToUsd = await fxService.getMxnToUsdRate();
                } catch (e) {
                    fxRateMxnToUsd = process.env.FX_MXN_USD ? Number(process.env.FX_MXN_USD) : 0.058;
                }
            }
            const valueUsd = getPromotionalValueUsd({
                currency: promotionData.currency || currency || 'USD',
                fxRateMxnToUsd: currencyCode === 'MXN' ? fxRateMxnToUsd : undefined,
                offerType: promotionData.offerType,
                originalPrice: promotionData.originalPrice,
                currentPrice: promotionData.currentPrice,
                discountPercentage: promotionData.discountPercentage,
                cashbackValue: promotionData.cashbackValue,
                purchaseAmount: promotionData.originalPrice
            });
            if (valueUsd != null) promotionData.promotionalValueUsd = valueUsd;

            // Verificar si MongoDB está conectado
            const isConnected = this.isMongoConnected();

            // Si MongoDB está conectado, guardar en la base de datos
            if (isConnected) {
                try {
                    const promotion = new Promotion(promotionData);
                    await promotion.save();

                    console.log('✅ Promoción creada exitosamente en MongoDB:', promotion._id);

                    return res.status(201).json({
                        success: true,
                        message: 'Promoción creada exitosamente',
                        data: {
                            id: promotion._id,
                            title: promotion.title,
                            productName: promotion.productName,
                            images: promotion.images.length,
                            ocrProcessed: !!promotion.ocrData,
                            status: promotion.status
                        },
                        mode: 'database'
                    });
                } catch (dbError) {
                    console.error('❌ Error guardando promoción en MongoDB:', dbError.message);
                    if (dbError.name) console.error('   Tipo:', dbError.name);
                    if (dbError.code) console.error('   Código MongoDB:', dbError.code);
                    if (dbError.errors) console.error('   Validación:', JSON.stringify(dbError.errors, null, 2));
                    if (dbError.stack) console.error(dbError.stack);

                    const isValidation = dbError.name === 'ValidationError';
                    const isBadGeoIndex = dbError.code === 16755;
                    const status = isValidation ? 400 : 500;
                    const body = {
                        success: false,
                        message: isValidation
                            ? 'No se pudo guardar la promoción: revisa los datos enviados.'
                            : isBadGeoIndex
                              ? 'Índice geoespacial incompatible en la base de datos (storeLocation.coordinates). En el servidor ejecuta: npm run db:drop-promo-geo-index'
                              : 'Error al guardar la promoción en la base de datos.',
                        mode: 'error'
                    };
                    if (isBadGeoIndex) {
                        body.code = 'MONGO_GEO_INDEX_FIX';
                    }
                    if (dbError.errors && typeof dbError.errors === 'object') {
                        body.fieldErrors = Object.fromEntries(
                            Object.entries(dbError.errors).map(([k, v]) => [
                                k,
                                v && typeof v === 'object' && 'message' in v ? v.message : String(v)
                            ])
                        );
                    }
                    if (process.env.NODE_ENV === 'development') {
                        body.error = dbError.message;
                    }
                    return res.status(status).json(body);
                }
            }

            if (!shouldAllowSimulatedPromotions()) {
                console.warn('⚠️ Crear promoción rechazada: sin MongoDB y modo simulado desactivado en producción.');
                return res.status(503).json({
                    success: false,
                    code: 'DB_UNAVAILABLE',
                    message:
                        'No hay conexión a la base de datos. Configura MONGODB_URI_ATLAS en el servidor (o NODE_ENV=development solo para pruebas locales). Las promociones no simuladas requieren MongoDB.',
                    mode: 'database_required'
                });
            }

            // Sin BD o desarrollo: guardar en memoria (modo simulado)
            console.log('💾 Guardando promoción en modo simulado (memoria)');
            
            // Inicializar array de promociones simuladas si no existe
            if (!global.simulatedPromotions) {
                global.simulatedPromotions = [];
            }

            // Crear promoción simulada con ID único
            const simulatedId = `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const simulatedPromotion = {
                _id: simulatedId,
                id: simulatedId,
                ...promotionData,
                createdAt: new Date(),
                updatedAt: new Date(),
                views: 0,
                clicks: 0,
                conversions: 0
            };

            // Agregar a la lista de promociones simuladas
            global.simulatedPromotions.push(simulatedPromotion);

            console.log('✅ Promoción creada exitosamente en modo simulado:', simulatedId);

            res.status(201).json({
                success: true,
                message:
                    'Promoción guardada solo en memoria del servidor (id sim-…). No es persistente; en otro nodo o tras reinicio no existirá. Usa MongoDB en producción.',
                data: {
                    id: simulatedId,
                    title: simulatedPromotion.title,
                    productName: simulatedPromotion.productName,
                    images: simulatedPromotion.images.length,
                    ocrProcessed: !!simulatedPromotion.ocrData,
                    status: simulatedPromotion.status
                },
                mode: 'simulated',
                warning: 'Esta promoción se guardó en memoria. Conecta MongoDB para persistencia real.'
            });

        } catch (error) {
            console.error('❌ Error creando promoción:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    async getAllPromotions(req, res) {
        try {
            // Verificar si hay conexión a MongoDB
            if (!this.isMongoConnected()) {
                console.log('⚠️ MongoDB no conectado - verificando promociones simuladas');
                
                // Si hay promociones simuladas en memoria, devolverlas
                if (global.simulatedPromotions && global.simulatedPromotions.length > 0) {
                    const { page = 1, limit = 10 } = req.query;
                    const pageNum = parseInt(page);
                    const limitNum = parseInt(limit);
                    const startIndex = (pageNum - 1) * limitNum;
                    const endIndex = startIndex + limitNum;
                    
                    const paginatedPromotions = global.simulatedPromotions.slice(startIndex, endIndex);
                    
                    return res.json({
                        success: true,
                        data: {
                            docs: paginatedPromotions.map((p) => enrichPromotionClientFields(p)),
                            totalDocs: global.simulatedPromotions.length,
                            limit: limitNum,
                            page: pageNum,
                            totalPages: Math.ceil(global.simulatedPromotions.length / limitNum),
                            hasNextPage: endIndex < global.simulatedPromotions.length,
                            hasPrevPage: pageNum > 1
                        },
                        message: 'Promociones en modo simulado'
                    });
                }
                
                // Si no hay promociones simuladas, devolver respuesta vacía
                return res.json(this.getEmptyResponse(req));
            }

            const { 
                page = 1, 
                limit = 10, 
                category, 
                status, 
                isHotOffer,
                search 
            } = req.query;

            const query = {};

            // Filtros
            if (category) query.category = category;
            // Por defecto (index, marketplace, app): solo activas y vigentes. Terminadas no se listan.
            // Para admin: pasar status=all para ver todas (draft, active, paused, expired).
            const wantAll = status === 'all';
            const wantOnlyActive = !wantAll && (status === undefined || status === 'active' || status === '');
            if (wantOnlyActive) {
                query.status = 'active';
                query.validUntil = { $gte: new Date() };
            } else if (status && status !== 'all') {
                query.status = status;
                if (status === 'active') {
                    query.validUntil = { $gte: new Date() };
                }
            }
            if (isHotOffer) query.isHotOffer = isHotOffer === 'true';
            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { productName: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { tags: { $in: [new RegExp(search, 'i')] } }
                ];
            }

            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                sort: { createdAt: -1 },
                populate: 'seller'
            };

            const promotions = await Promotion.paginate(query, options);
            const data = {
                ...promotions,
                docs: (promotions.docs || []).map((doc) =>
                    enrichPromotionClientFields(doc.toObject ? doc.toObject() : doc)
                )
            };

            res.json({
                success: true,
                data,
                message: 'Promociones obtenidas exitosamente'
            });

        } catch (error) {
            console.error('❌ Error obteniendo promociones:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * GET /api/promotions/active
     * Lista solo promociones activas y vigentes (validUntil >= ahora en el servidor).
     * El cálculo de vigencia se hace en el servidor para evitar desfases por zona horaria en el cliente.
     * Respuesta: { success, data: { docs, totalDocs, ... }, message } con cada doc incluyendo:
     * - isActive, validUntilISO, daysLeft, timeLeftLabel, displayStatus ('active'|'ending'|'closed').
     */
    async getActivePromotions(req, res) {
        try {
            if (!this.isMongoConnected()) {
                const empty = this.getEmptyResponse(req, 'MongoDB no conectado');
                return res.json(empty);
            }
            const now = new Date();
            const query = {
                status: 'active',
                validUntil: { $gte: now }
            };
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
            const options = {
                page,
                limit,
                sort: { createdAt: -1 },
                populate: 'seller'
            };
            const result = await Promotion.paginate(query, options);
            const uLa = parseFloat(req.query.userLat);
            const uLo = parseFloat(req.query.userLng);
            const geoEnrichOpts = {};
            if (Number.isFinite(uLa) && Number.isFinite(uLo)) {
                geoEnrichOpts.userLatitude = uLa;
                geoEnrichOpts.userLongitude = uLo;
            }
            const docs = (result.docs || []).map((doc) => {
                const promo = doc.toObject ? doc.toObject() : doc;
                const validUntil = promo.validUntil ? new Date(promo.validUntil) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                const diffMs = validUntil.getTime() - now.getTime();
                const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                const diffHours = Math.max(0, Math.ceil((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
                const diffMinutes = Math.max(0, Math.ceil((diffMs % (1000 * 60 * 60)) / (1000 * 60 * 60)));
                let displayStatus = 'active';
                if (diffDays <= 0) displayStatus = 'closed';
                else if (diffDays <= 3) displayStatus = 'ending';
                const timeLeftLabel = diffDays > 0
                    ? `${diffDays}d ${diffHours}h ${diffMinutes}m`
                    : diffHours > 0 ? `${diffHours}h ${diffMinutes}m` : `${diffMinutes}m`;
                return enrichPromotionClientFields({
                    ...promo,
                    id: promo._id ? promo._id.toString() : promo.id,
                    isActive: true,
                    validUntilISO: validUntil.toISOString(),
                    daysLeft: Math.max(0, diffDays),
                    timeLeftLabel,
                    displayStatus
                }, geoEnrichOpts);
            });
            return res.json({
                success: true,
                data: {
                    docs,
                    totalDocs: result.totalDocs ?? docs.length,
                    limit: result.limit ?? limit,
                    page: result.page ?? page,
                    totalPages: result.totalPages ?? 1,
                    hasNextPage: result.hasNextPage ?? false,
                    hasPrevPage: result.hasPrevPage ?? false
                },
                message: 'Promociones activas y vigentes (cálculo de fecha en servidor).'
            });
        } catch (error) {
            console.error('❌ Error getActivePromotions:', error);
            res.status(500).json({
                success: false,
                message: 'Error al listar promociones activas',
                error: error.message
            });
        }
    }

    async getPromotionById(req, res) {
        try {
            const { id } = req.params;

            const geoEnrichOpts = {};
            const uLa = parseFloat(req.query.userLat);
            const uLo = parseFloat(req.query.userLng);
            if (Number.isFinite(uLa) && Number.isFinite(uLo)) {
                geoEnrichOpts.userLatitude = uLa;
                geoEnrichOpts.userLongitude = uLo;
            }

            // Si el ID no es ObjectId (ej. sim-xxx de modo simulado), buscar en memoria o devolver 404
            if (!this.isValidObjectId(id)) {
                if (global.simulatedPromotions) {
                    const promo = global.simulatedPromotions.find(p => p._id === id || p.id === id);
                    if (promo) {
                        return res.json({
                            success: true,
                            data: enrichPromotionClientFields(promo, geoEnrichOpts),
                            message: 'Promoción obtenida (modo simulado)'
                        });
                    }
                }
                return res.status(404).json({
                    success: false,
                    message: 'Promoción no encontrada'
                });
            }

            if (!this.isMongoConnected()) {
                // Buscar en promociones simuladas
                if (global.simulatedPromotions) {
                    const promo = global.simulatedPromotions.find(p => p._id === id || p.id === id);
                    if (promo) {
                        return res.json({
                            success: true,
                            data: enrichPromotionClientFields(promo, geoEnrichOpts),
                            message: 'Promoción obtenida (modo simulado)'
                        });
                    }
                }
                
                return res.status(404).json({
                    success: false,
                    message: 'MongoDB no conectado - modo simulado activo'
                });
            }

            const promotion = await Promotion.findById(id)
                .populate('seller', 'name email verified')
                .populate('createdBy', 'name email');

            if (!promotion) {
                return res.status(404).json({
                    success: false,
                    message: 'Promoción no encontrada'
                });
            }

            // Incrementar vistas
            await promotion.incrementViews();

            const promoObj = promotion.toObject ? promotion.toObject() : promotion;
            const contractValues = await getValuePerCouponAndMaxEmissionAsync(promoObj);
            const enriched = enrichPromotionClientFields({
                ...promoObj,
                valuePerCouponUsd: contractValues.valuePerCouponUsd,
                maxEmissionUsd: contractValues.maxEmissionUsd,
                fxRateUsed: contractValues.fxRateUsed,
                currencyDisplay: promoObj.currency || 'USD',
                normalizedCurrency: contractValues.normalizedCurrency || 'USD'
            }, geoEnrichOpts);

            res.json({
                success: true,
                data: enriched,
                message: 'Promoción obtenida exitosamente'
            });

        } catch (error) {
            console.error('❌ Error obteniendo promoción:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    async getPriceHistory(req, res) {
        try {
            const { id } = req.params;

            // Validar ObjectId
            if (!this.isValidObjectId(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de promoción inválido'
                });
            }

            if (!this.isMongoConnected()) {
                return res.status(503).json({
                    success: false,
                    message: 'MongoDB no conectado - modo simulado activo'
                });
            }

            const promotion = await Promotion.findById(id);

            if (!promotion) {
                return res.status(404).json({
                    success: false,
                    message: 'Promoción no encontrada'
                });
            }

            // Generar historial de precios basado en la promoción
            // En el futuro, esto podría venir de un modelo de historial separado
            const history = [];

            // Entrada actual
            const currentDiscount = promotion.originalPrice > 0 
                ? Math.round(((promotion.originalPrice - promotion.currentPrice) / promotion.originalPrice) * 100)
                : 0;

            history.push({
                date: promotion.createdAt || new Date(),
                originalPrice: promotion.originalPrice,
                currentPrice: promotion.currentPrice,
                discountPercentage: currentDiscount,
                currency: promotion.currency || 'USD',
                event: 'promotion_created',
                description: `Promoción creada para ${promotion.productName || promotion.title}`
            });

            // Si la promoción fue actualizada, agregar entrada de actualización
            if (promotion.updatedAt && promotion.updatedAt.getTime() !== promotion.createdAt.getTime()) {
                // Simular un cambio de precio anterior (datos de ejemplo)
                const daysSinceCreation = Math.floor((promotion.updatedAt - promotion.createdAt) / (1000 * 60 * 60 * 24));
                
                if (daysSinceCreation > 0) {
                    // Simular que antes había un precio más alto
                    const previousPrice = promotion.currentPrice * 1.1; // 10% más caro antes
                    const previousDiscount = promotion.originalPrice > 0
                        ? Math.round(((promotion.originalPrice - previousPrice) / promotion.originalPrice) * 100)
                        : 0;

                    history.push({
                        date: new Date(promotion.createdAt.getTime() + (daysSinceCreation / 2) * 24 * 60 * 60 * 1000),
                        originalPrice: promotion.originalPrice,
                        currentPrice: previousPrice,
                        discountPercentage: previousDiscount,
                        currency: promotion.currency || 'USD',
                        event: 'price_decrease',
                        description: `Precio reducido para mejorar la oferta`
                    });
                }
            }

            // Ordenar por fecha (más reciente primero)
            history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            res.json({
                success: true,
                data: {
                    promotionId: id,
                    brand: promotion.brand,
                    productName: promotion.productName || promotion.title,
                    history: history
                },
                message: 'Historial de precios obtenido exitosamente'
            });

        } catch (error) {
            console.error('❌ Error obteniendo historial de precios:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Analiza imágenes de promoción con Gemini y devuelve datos extraídos
     * (título, precios, descuento, términos y condiciones si aparecen).
     */
    async analyzePromotionImage(req, res) {
        try {
            const { promo: promoFiles, terms: termsFiles } = getPromotionUploadFileGroups(req);
            const legacy = Array.isArray(req.files) ? req.files : null;
            const promos = legacy && legacy.length ? legacy : promoFiles;
            const terms = legacy && legacy.length ? [] : termsFiles;

            if ((!promos || promos.length === 0) && (!terms || terms.length === 0)) {
                return res.status(400).json({
                    success: false,
                    message: 'Sube al menos una imagen (campo images y/o termsImages)'
                });
            }
            const result = await analyzePromotionImages(promos, terms);
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.message || 'Error al analizar las imágenes'
                });
            }
            return res.json({
                success: true,
                data: result.data,
                message: 'Análisis completado'
            });
        } catch (error) {
            console.error('❌ Error en analyzePromotionImage:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al analizar las imágenes'
            });
        }
    }

    async updatePromotion(req, res) {
        try {
            const { id } = req.params;

            // Validar ObjectId
            if (!this.isValidObjectId(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de promoción inválido'
                });
            }

            // Verificar conexión MongoDB
            if (!this.isMongoConnected()) {
                return res.status(503).json({
                    success: false,
                    message: 'MongoDB no está conectado. No se puede actualizar la promoción.'
                });
            }

            const updateData = req.body;
            // Alias app móvil → campos del modelo
            if (updateData.activateByGps === undefined && updateData.gpsActivationEnabled !== undefined) {
                updateData.activateByGps = updateData.gpsActivationEnabled;
            }
            if (updateData.gpsRadiusMeters === undefined && updateData.locationRadiusMeters !== undefined) {
                updateData.gpsRadiusMeters = updateData.locationRadiusMeters;
            }

            // Verificar que la promoción existe
            const existingPromotion = await Promotion.findById(id);
            if (!existingPromotion) {
                return res.status(404).json({
                    success: false,
                    message: 'Promoción no encontrada'
                });
            }

            // Validar fechas si se están actualizando
            if (updateData.validFrom || updateData.validUntil) {
                const validFrom = updateData.validFrom || existingPromotion.validFrom;
                const validUntil = updateData.validUntil || existingPromotion.validUntil;
                const dateValidation = this.validateDates(validFrom, validUntil);
                
                if (!dateValidation.valid) {
                    return res.status(400).json({
                        success: false,
                        message: dateValidation.error
                    });
                }
            }

            // Actualizar solo campos permitidos
            const allowedFields = [
                'title', 'description', 'productName', 'brand', 'category',
                'originalPrice', 'currentPrice', 'currency', 'discountPercentage',
                'storeName', 'storeLocation', 'isPhysicalStore', 'tags',
                'features', 'specifications', 'termsAndConditions', 'isHotOffer', 'hotness',
                'validFrom', 'validUntil', 'totalQuantity', 'offerType', 'cashbackValue', 'promotionalValueUsd', 'status',
                'redirectInsteadOfQr', 'redirectToUrl',
                'activateByGps', 'gpsRadiusMeters',
                'brandId', 'shopId', 'externalProductId', 'gtmTag', 'campaignId', 'source', 'medium',
                'isChainStore', 'chainBrandName', 'chainLocations'
            ];

            const filteredData = {};
            allowedFields.forEach(field => {
                if (updateData[field] !== undefined) {
                    // Parsear arrays si es necesario
                    if (field === 'tags' || field === 'features') {
                        filteredData[field] = this.parseArrayField(updateData[field]);
                    } else if (field === 'specifications') {
                        try {
                            filteredData[field] = typeof updateData[field] === 'string' 
                                ? JSON.parse(updateData[field]) 
                                : updateData[field];
                        } catch (error) {
                            console.warn(`⚠️ Error parseando ${field}:`, error.message);
                            filteredData[field] = updateData[field];
                        }
                    } else if (field === 'isChainStore') {
                        const v = updateData[field];
                        if (v === false || v === 'false') filteredData[field] = false;
                        else filteredData[field] = v === true || v === 'true';
                    } else if (field === 'redirectInsteadOfQr' || field === 'activateByGps') {
                        filteredData[field] = updateData[field] === true || updateData[field] === 'true';
                    } else if (field === 'chainBrandName' || field === 'redirectToUrl') {
                        filteredData[field] = (updateData[field] && String(updateData[field]).trim()) ? String(updateData[field]).trim() : '';
                    } else if (field === 'chainLocations') {
                        filteredData[field] = parseChainLocations(updateData[field]);
                    } else if (field === 'gpsRadiusMeters') {
                        const r = parseInt(updateData[field], 10);
                        filteredData[field] = Number.isFinite(r) ? Math.min(50000, Math.max(50, r)) : 500;
                    } else {
                        filteredData[field] = updateData[field];
                    }
                }
            });

            // Recalcular descuento si se actualizaron precios
            if (filteredData.originalPrice && filteredData.currentPrice) {
                filteredData.discountPercentage = Math.round(
                    ((filteredData.originalPrice - filteredData.currentPrice) / filteredData.originalPrice) * 100
                );
            }

            // Recalcular valor promocional en USD (unidad calculable del contrato) si aplica
            const existing = await Promotion.findById(id).lean();
            const promoForValue = { ...existing, ...filteredData };
            const valueUsd = getPromotionalValueUsd({
                offerType: promoForValue.offerType || 'percentage',
                originalPrice: promoForValue.originalPrice,
                currentPrice: promoForValue.currentPrice,
                discountPercentage: promoForValue.discountPercentage,
                cashbackValue: promoForValue.cashbackValue,
                purchaseAmount: promoForValue.originalPrice
            });
            if (valueUsd != null) filteredData.promotionalValueUsd = valueUsd;

            const appendedImages = await processAppendPromotionImages(req);
            const updatePayload = { ...filteredData };
            if (appendedImages.length > 0) {
                const prevImages = Array.isArray(existingPromotion.images) ? existingPromotion.images : [];
                const asPlain = prevImages.map((img) => (img && img.toObject ? img.toObject() : { ...img }));
                updatePayload.images = [...asPlain, ...appendedImages];
            }

            const updatedPromotion = await Promotion.findByIdAndUpdate(
                id,
                updatePayload,
                { new: true, runValidators: true }
            );

            const updatedPlain = updatedPromotion.toObject ? updatedPromotion.toObject() : updatedPromotion;

            res.json({
                success: true,
                data: enrichPromotionClientFields(updatedPlain),
                message: 'Promoción actualizada exitosamente'
            });

        } catch (error) {
            console.error('❌ Error actualizando promoción:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    async deletePromotion(req, res) {
        try {
            const { id } = req.params;

            // Validar ObjectId
            if (!this.isValidObjectId(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de promoción inválido'
                });
            }

            // Verificar conexión MongoDB
            if (!this.isMongoConnected()) {
                return res.status(503).json({
                    success: false,
                    message: 'MongoDB no está conectado. No se puede eliminar la promoción.'
                });
            }

            const promotion = await Promotion.findById(id);
            if (!promotion) {
                return res.status(404).json({
                    success: false,
                    message: 'Promoción no encontrada'
                });
            }

            // Eliminar imágenes de Cloudinary
            for (const image of promotion.images) {
                if (image.cloudinaryPublicId) {
                    try {
                        await cloudinaryConfig.deleteImage(image.cloudinaryPublicId);
                    } catch (error) {
                        console.warn(`⚠️ Error eliminando imagen de Cloudinary: ${error.message}`);
                    }
                }

                // Eliminar archivo local
                try {
                    await fs.unlink(image.path);
                } catch (error) {
                    console.warn(`⚠️ Error eliminando archivo local: ${error.message}`);
                }
            }

            // Eliminar la promoción
            await Promotion.findByIdAndDelete(id);

            res.json({
                success: true,
                message: 'Promoción eliminada exitosamente'
            });

        } catch (error) {
            console.error('❌ Error eliminando promoción:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    async getHotOffers(req, res) {
        try {
            if (!this.isMongoConnected()) {
                return res.json({
                    success: true,
                    data: [],
                    message: 'MongoDB no conectado - modo simulado activo'
                });
            }

            const hotOffers = await Promotion.findHotOffers()
                .sort({ createdAt: -1 })
                .limit(10);

            res.json({
                success: true,
                data: hotOffers,
                message: 'Ofertas calientes obtenidas exitosamente'
            });

        } catch (error) {
            console.error('❌ Error obteniendo ofertas calientes:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    async getPromotionsByCategory(req, res) {
        try {
            if (!this.isMongoConnected()) {
                return res.json(this.getEmptyResponse(req));
            }

            const { category } = req.params;
            const { page = 1, limit = 10 } = req.query;

            const query = { 
                category, 
                status: 'active',
                validUntil: { $gte: new Date() }
            };

            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                sort: { createdAt: -1 }
            };

            const promotions = await Promotion.paginate(query, options);

            res.json({
                success: true,
                data: promotions,
                message: `Promociones de categoría ${category} obtenidas exitosamente`
            });

        } catch (error) {
            console.error('❌ Error obteniendo promociones por categoría:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    async searchPromotions(req, res) {
        try {
            if (!this.isMongoConnected()) {
                return res.json(this.getEmptyResponse(req));
            }

            const { q, page = 1, limit = 10 } = req.query;

            if (!q) {
                return res.status(400).json({
                    success: false,
                    message: 'Término de búsqueda requerido'
                });
            }

            const query = {
                status: 'active',
                validUntil: { $gte: new Date() },
                $or: [
                    { title: { $regex: q, $options: 'i' } },
                    { productName: { $regex: q, $options: 'i' } },
                    { description: { $regex: q, $options: 'i' } },
                    { brand: { $regex: q, $options: 'i' } },
                    { tags: { $in: [new RegExp(q, 'i')] } }
                ]
            };

            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                sort: { createdAt: -1 }
            };

            const promotions = await Promotion.paginate(query, options);

            res.json({
                success: true,
                data: promotions,
                message: `Búsqueda completada para: ${q}`
            });

        } catch (error) {
            console.error('❌ Error buscando promociones:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    async getPromotionStats(req, res) {
        try {
            const stats = await Promotion.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        active: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$status', 'active'] },
                                    1,
                                    0
                                ]
                            }
                        },
                        hotOffers: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$isHotOffer', true] },
                                    1,
                                    0
                                ]
                            }
                        },
                        totalViews: { $sum: '$views' },
                        totalClicks: { $sum: '$clicks' },
                        totalConversions: { $sum: '$conversions' }
                    }
                }
            ]);

            const categoryStats = await Promotion.aggregate([
                {
                    $group: {
                        _id: '$category',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            res.json({
                success: true,
                data: {
                    overview: stats[0] || {},
                    categories: categoryStats
                },
                message: 'Estadísticas obtenidas exitosamente'
            });

        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Asegura "Influencer General" y crea registros de éxito (PromotionConversion) para
     * cada promoción con conversions > 0, atribuidos a ese influencer (no reclamados por nadie).
     */
    async backfillConversionsToInfluencerGeneral(req, res) {
        try {
            if (!this.isMongoConnected()) {
                return res.status(503).json({
                    success: false,
                    message: 'MongoDB no conectado'
                });
            }
            const GENERAL_USERNAME = 'influencer-general';
            const GENERAL_NAME = 'Influencer General';

            let general = await Influencer.findOne({ username: GENERAL_USERNAME });
            if (!general) {
                general = await Influencer.create({
                    name: GENERAL_NAME,
                    username: GENERAL_USERNAME,
                    status: 'active',
                    totalFollowers: 0,
                    completedPromotions: 0,
                    activePromotions: 0,
                    totalEarnings: 0,
                    monthlyEarnings: 0,
                    couponStats: {
                        totalCoupons: 0,
                        activeCoupons: 0,
                        totalSales: 0,
                        totalCommission: 0,
                        averageConversion: 0
                    }
                });
            }
            const generalId = general._id;

            const promotions = await Promotion.find({
                $or: [
                    { conversions: { $gt: 0 } },
                    { conversions: { $exists: false } }
                ]
            }).lean();

            let created = 0;
            let skipped = 0;
            for (const promo of promotions) {
                const conversions = promo.conversions || 0;
                if (conversions <= 0) continue;
                const existing = await PromotionConversion.findOne({
                    promotion: promo._id,
                    influencer: generalId,
                    source: 'general'
                });
                if (existing) {
                    skipped++;
                    continue;
                }
                await PromotionConversion.create({
                    promotion: promo._id,
                    influencer: generalId,
                    quantity: conversions,
                    source: 'general',
                    note: 'Atribución a Influencer General: promoción no reclamada por ningún influencer.'
                });
                created++;
            }

            return res.json({
                success: true,
                message: 'Backfill de conversiones a Influencer General completado',
                data: {
                    influencerGeneralId: generalId.toString(),
                    recordsCreated: created,
                    recordsSkipped: skipped
                }
            });
        } catch (error) {
            console.error('❌ Error en backfill conversiones:', error);
            res.status(500).json({
                success: false,
                message: 'Error en backfill de conversiones',
                error: error.message
            });
        }
    }
}

module.exports = new PromotionController();
