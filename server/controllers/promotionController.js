const Promotion = require('../models/Promotion');
const cloudinaryConfig = require('../config/cloudinary');
const ocrService = require('../services/ocrService');
const database = require('../config/database');
const { getPromotionUploadDir } = require('../middleware/upload');
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

class PromotionController {
    // Helper para verificar conexión a MongoDB
    isMongoConnected() {
        return database.isConnected && mongoose.connection.readyState === 1;
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
                tags,
                features,
                specifications,
                isHotOffer,
                hotness
            } = req.body;

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

            // Procesar imágenes con OCR (opcional: se puede crear promoción sin imagen)
            const processedImages = [];
            let ocrData = null;

            if (req.files && req.files.length > 0) {
            const imageOptimizer = require('../utils/imageOptimizer');

            for (const file of req.files) {
                try {
                    console.log(`🔄 Procesando imagen: ${file.originalname}`);
                    
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
                    // Nota: Cloudinary también optimiza imágenes automáticamente
                    let cloudinaryUrl = null;
                    let cloudinaryPublicId = null;
                    
                    if (cloudinaryConfig.isConfigured) {
                        try {
                            // Usar la imagen optimizada para Cloudinary
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

                    // Procesar OCR solo en la primera imagen
                    // Usar imagen original (no optimizada) para mejor precisión del OCR
                    if (processedImages.length === 0) {
                        console.log('🔍 Procesando OCR de la imagen principal...');
                        const ocrResult = await ocrService.processImageWithPython(originalBuffer);
                        
                        if (ocrResult.success) {
                            // Extraer datos de promoción del OCR
                            const extractedData = await ocrService.extractPromotionData(ocrResult);
                            
                            if (extractedData.success) {
                                ocrData = {
                                    extractedText: extractedData.rawText,
                                    confidence: extractedData.confidence,
                                    ocrProvider: ocrResult.provider,
                                    processedAt: new Date()
                                };

                                // Usar datos del OCR si no se proporcionaron manualmente
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

                    // URL pública: única ruta para todas las imágenes de promociones
                    const publicUrl = `/uploads/promotions/${uniqueFilename}`;
                    
                    processedImages.push({
                        originalName: file.originalname,
                        filename: uniqueFilename,
                        path: localPath,
                        url: publicUrl, // URL pública para acceder desde el frontend
                        cloudinaryUrl: cloudinaryUrl, // Opcional, solo si Cloudinary está configurado
                        cloudinaryPublicId: cloudinaryPublicId, // Opcional
                        uploadedAt: new Date(),
                        optimized: file.optimized || false,
                        optimizationStats: file.optimizationStats || null,
                        format: optimizedImage?.format || path.extname(file.originalname).slice(1),
                        dimensions: optimizedImage ? {
                            width: optimizedImage.width,
                            height: optimizedImage.height
                        } : null
                    });

                } catch (error) {
                    console.error(`❌ Error procesando imagen ${file.originalname}:`, error.message);
                    
                    // Continuar con otras imágenes
                    continue;
                }
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

            const numOriginal = (originalPrice !== undefined && originalPrice !== '') ? parseFloat(originalPrice) : 0;
            const numCurrent = (currentPrice !== undefined && currentPrice !== '') ? parseFloat(currentPrice) : 0;

            // Crear la promoción (campos con valores por defecto para máxima flexibilidad)
            const promotionData = {
                title: title.trim(),
                description: (description && String(description).trim()) ? String(description).trim() : '',
                productName: (productName && String(productName).trim()) ? String(productName).trim() : title.trim(),
                brand: brand ? String(brand).trim() : '',
                category: category && ['electronics', 'fashion', 'home', 'beauty', 'sports', 'books', 'food', 'other'].includes(category) ? category : 'other',
                originalPrice: Number.isFinite(numOriginal) ? numOriginal : 0,
                currentPrice: Number.isFinite(numCurrent) ? numCurrent : 0,
                currency: currency || 'MXN',
                discountPercentage: discountPercentage || 0,
                storeName: storeName ? String(storeName).trim() : '',
                storeLocation: {
                    address: storeAddress ? String(storeAddress).trim() : '',
                    city: storeCity ? String(storeCity).trim() : '',
                    state: storeState ? String(storeState).trim() : '',
                    country: 'México'
                },
                isPhysicalStore: isPhysicalStore === 'true' || isPhysicalStore === true,
                images: processedImages,
                ocrData: ocrData || undefined,
                tags: parsedTags,
                features: parsedFeatures,
                specifications: parsedSpecifications,
                isHotOffer: isHotOffer === 'true' || isHotOffer === true,
                hotness: hotness || 'warm',
                validFrom: dateValidation.validFrom,
                validUntil: dateValidation.validUntil,
                status: 'active',
                seller: {
                    name: 'Usuario del sistema',
                    email: 'system@link4deal.com',
                    verified: false
                }
            };

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
                    console.error('❌ Error guardando en MongoDB, intentando modo simulado:', dbError.message);
                    // Continuar con modo simulado si falla MongoDB
                }
            }

            // Si MongoDB no está conectado o falló, guardar en memoria (modo simulado)
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
                message: 'Promoción creada exitosamente (modo simulado - MongoDB no conectado)',
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
                            docs: paginatedPromotions,
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
            if (status) query.status = status;
            // Por vigencia: si se pide status active, solo promociones vigentes (validUntil >= hoy)
            if (status === 'active') {
                query.validUntil = { $gte: new Date() };
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

            res.json({
                success: true,
                data: promotions,
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

    async getPromotionById(req, res) {
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
                // Buscar en promociones simuladas
                if (global.simulatedPromotions) {
                    const promo = global.simulatedPromotions.find(p => p._id === id || p.id === id);
                    if (promo) {
                        return res.json({
                            success: true,
                            data: promo,
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

            res.json({
                success: true,
                data: promotion,
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
                currency: promotion.currency || 'MXN',
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
                        currency: promotion.currency || 'MXN',
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
                'features', 'specifications', 'isHotOffer', 'hotness',
                'validFrom', 'validUntil', 'status'
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

            const updatedPromotion = await Promotion.findByIdAndUpdate(
                id,
                filteredData,
                { new: true, runValidators: true }
            );

            res.json({
                success: true,
                data: updatedPromotion,
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
}

module.exports = new PromotionController();
