const Promotion = require('../models/Promotion');
const cloudinaryConfig = require('../config/cloudinary');
const ocrService = require('../services/ocrService');
const fs = require('fs').promises;
const path = require('path');

class PromotionController {
    async createPromotion(req, res) {
        try {
            console.log('🔄 Creando nueva promoción...');
            
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere al menos una imagen'
                });
            }

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

            // Procesar imágenes con OCR
            const processedImages = [];
            let ocrData = null;

            for (const file of req.files) {
                try {
                    console.log(`🔄 Procesando imagen: ${file.originalname}`);
                    
                    // Subir a Cloudinary
                    const cloudinaryResult = await cloudinaryConfig.uploadImage(file);
                    
                    if (!cloudinaryResult.success) {
                        throw new Error(`Error subiendo imagen a Cloudinary: ${cloudinaryResult.error}`);
                    }

                    // Guardar localmente como respaldo
                    const localPath = path.join(process.env.UPLOAD_PATH || './public/uploads', file.filename);
                    await fs.writeFile(localPath, file.buffer);

                    // Procesar OCR solo en la primera imagen
                    if (processedImages.length === 0) {
                        console.log('🔍 Procesando OCR de la imagen principal...');
                        const ocrResult = await ocrService.processImageWithPython(file.buffer);
                        
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

                    processedImages.push({
                        originalName: file.originalname,
                        filename: file.filename,
                        path: localPath,
                        cloudinaryUrl: cloudinaryResult.data.secure_url,
                        cloudinaryPublicId: cloudinaryResult.data.public_id,
                        uploadedAt: new Date()
                    });

                } catch (error) {
                    console.error(`❌ Error procesando imagen ${file.originalname}:`, error.message);
                    
                    // Continuar con otras imágenes
                    continue;
                }
            }

            if (processedImages.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No se pudo procesar ninguna imagen'
                });
            }

            // Calcular descuento si no se proporcionó
            let discountPercentage = req.body.discountPercentage;
            if (!discountPercentage && originalPrice && currentPrice) {
                discountPercentage = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
            }

            // Crear la promoción
            const promotionData = {
                title: title || 'Promoción sin título',
                description: description || 'Descripción de la promoción',
                productName: productName || 'Producto sin nombre',
                brand: brand || 'Marca no especificada',
                category: category || 'other',
                originalPrice: parseFloat(originalPrice) || 0,
                currentPrice: parseFloat(currentPrice) || 0,
                currency: currency || 'MXN',
                discountPercentage: discountPercentage || 0,
                storeName: storeName || 'Tienda no especificada',
                storeLocation: {
                    address: storeAddress || '',
                    city: storeCity || '',
                    state: storeState || '',
                    country: 'México'
                },
                isPhysicalStore: isPhysicalStore === 'true',
                images: processedImages,
                ocrData: ocrData,
                tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
                features: features ? features.split(',').map(feature => feature.trim()) : [],
                specifications: specifications ? JSON.parse(specifications) : {},
                isHotOffer: isHotOffer === 'true',
                hotness: hotness || 'warm',
                validFrom: validFrom ? new Date(validFrom) : new Date(),
                validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días por defecto
                status: 'active',
                seller: {
                    name: 'Usuario del sistema',
                    email: 'system@link4deal.com',
                    verified: false
                }
            };

            const promotion = new Promotion(promotionData);
            await promotion.save();

            console.log('✅ Promoción creada exitosamente:', promotion._id);

            res.status(201).json({
                success: true,
                message: 'Promoción creada exitosamente',
                data: {
                    id: promotion._id,
                    title: promotion.title,
                    productName: promotion.productName,
                    images: promotion.images.length,
                    ocrProcessed: !!promotion.ocrData,
                    status: promotion.status
                }
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

    async updatePromotion(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Verificar que la promoción existe
            const existingPromotion = await Promotion.findById(id);
            if (!existingPromotion) {
                return res.status(404).json({
                    success: false,
                    message: 'Promoción no encontrada'
                });
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
                    filteredData[field] = updateData[field];
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
