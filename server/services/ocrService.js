const axios = require('axios');
require('dotenv').config();

class OCRService {
    constructor() {
        this.rapidApiKey = process.env.RAPIDAPI_KEY;
        this.rapidApiHost = process.env.RAPIDAPI_HOST || 'ocr.space';
        this.pythonServerUrl = process.env.OCR_SERVICE_URL || 'http://localhost:8000';
        this.timeout = parseInt(process.env.OCR_SERVICE_TIMEOUT) || 30000;
    }

    async processImageWithPython(imageBuffer, options = {}) {
        try {
            console.log('🔄 Procesando imagen con servidor Python...');
            
            const formData = new FormData();
            formData.append('image', imageBuffer, {
                filename: 'promotion.jpg',
                contentType: 'image/jpeg'
            });
            
            // Agregar opciones de OCR
            if (options.language) formData.append('language', options.language);
            if (options.ocrEngine) formData.append('ocr_engine', options.ocr_engine);
            if (options.scale) formData.append('scale', options.scale);
            if (options.contrast) formData.append('contrast', options.contrast);

            const response = await axios.post(`${this.pythonServerUrl}/ocr/process`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-API-Key': process.env.OCR_API_KEY || 'default-key'
                },
                timeout: this.timeout
            });

            if (response.data.success) {
                console.log('✅ OCR procesado exitosamente con Python');
                return {
                    success: true,
                    data: response.data.data,
                    provider: 'python-server',
                    message: 'OCR procesado exitosamente'
                };
            } else {
                throw new Error(response.data.message || 'Error en el servidor Python');
            }

        } catch (error) {
            console.error('❌ Error procesando OCR con Python:', error.message);
            
            // Fallback a RapidAPI si falla Python
            console.log('🔄 Intentando fallback a RapidAPI...');
            return await this.processImageWithRapidAPI(imageBuffer, options);
        }
    }

    async processImageWithRapidAPI(imageBuffer, options = {}) {
        try {
            console.log('🔄 Procesando imagen con RapidAPI...');
            
            if (!this.rapidApiKey) {
                throw new Error('RAPIDAPI_KEY no está configurado');
            }

            const formData = new FormData();
            formData.append('image', imageBuffer, {
                filename: 'promotion.jpg',
                contentType: 'image/jpeg'
            });

            // Configurar parámetros de OCR
            const ocrParams = {
                language: options.language || 'eng',
                OCREngine: options.ocrEngine || '2',
                scale: options.scale || 'true',
                contrast: options.contrast || 'true',
                detectOrientation: 'true',
                isTable: 'false',
                filetype: 'JPG'
            };

            // Agregar parámetros al formData
            Object.entries(ocrParams).forEach(([key, value]) => {
                formData.append(key, value);
            });

            const response = await axios.post('https://ocr.space/parse/image', formData, {
                headers: {
                    'X-RapidAPI-Key': this.rapidApiKey,
                    'X-RapidAPI-Host': this.rapidApiHost,
                    'Content-Type': 'multipart/form-data'
                },
                timeout: this.timeout
            });

            if (response.data && response.data.ParsedResults && response.data.ParsedResults.length > 0) {
                const parsedText = response.data.ParsedResults
                    .map(result => result.ParsedText)
                    .join('\n')
                    .trim();

                console.log('✅ OCR procesado exitosamente con RapidAPI');
                
                return {
                    success: true,
                    data: {
                        text: parsedText,
                        confidence: this.calculateConfidence(response.data),
                        language: ocrParams.language,
                        engine: `RapidAPI-${ocrParams.OCREngine}`,
                        rawResponse: response.data
                    },
                    provider: 'rapidapi',
                    message: 'OCR procesado exitosamente'
                };
            } else {
                throw new Error('No se pudo extraer texto de la imagen');
            }

        } catch (error) {
            console.error('❌ Error procesando OCR con RapidAPI:', error.message);
            return {
                success: false,
                error: error.message,
                provider: 'rapidapi',
                message: 'Error procesando OCR'
            };
        }
    }

    calculateConfidence(rapidApiResponse) {
        try {
            if (rapidApiResponse.ParsedResults && rapidApiResponse.ParsedResults.length > 0) {
                const results = rapidApiResponse.ParsedResults;
                const totalConfidence = results.reduce((sum, result) => {
                    return sum + (result.TextOverlay?.Lines?.reduce((lineSum, line) => {
                        return lineSum + (line.Words?.reduce((wordSum, word) => {
                            return wordSum + (parseFloat(word.Confidence) || 0);
                        }, 0) || 0);
                    }, 0) || 0);
                }, 0);

                const totalWords = results.reduce((sum, result) => {
                    return sum + (result.TextOverlay?.Lines?.reduce((lineSum, line) => {
                        return lineSum + (line.Words?.length || 0);
                    }, 0) || 0);
                }, 0);

                return totalWords > 0 ? Math.round(totalConfidence / totalWords) : 0;
            }
            return 0;
        } catch (error) {
            console.warn('⚠️ Error calculando confianza:', error.message);
            return 0;
        }
    }

    async extractPromotionData(ocrResult) {
        try {
            if (!ocrResult.success || !ocrResult.data.text) {
                throw new Error('No hay texto OCR para procesar');
            }

            const text = ocrResult.data.text.toLowerCase();
            console.log('🔍 Analizando texto OCR para extraer datos de promoción...');

            // Extraer información básica
            const extractedData = {
                productName: this.extractProductName(text),
                price: this.extractPrice(text),
                originalPrice: this.extractOriginalPrice(text),
                discount: this.extractDiscount(text),
                brand: this.extractBrand(text),
                category: this.extractCategory(text),
                storeName: this.extractStoreName(text),
                validUntil: this.extractValidUntil(text),
                tags: this.extractTags(text)
            };

            // Limpiar datos extraídos
            Object.keys(extractedData).forEach(key => {
                if (extractedData[key] === null || extractedData[key] === undefined) {
                    delete extractedData[key];
                }
            });

            console.log('✅ Datos extraídos del OCR:', extractedData);
            
            return {
                success: true,
                data: extractedData,
                confidence: ocrResult.data.confidence || 0,
                rawText: ocrResult.data.text
            };

        } catch (error) {
            console.error('❌ Error extrayendo datos de promoción:', error.message);
            return {
                success: false,
                error: error.message,
                message: 'Error extrayendo datos de promoción'
            };
        }
    }

    extractProductName(text) {
        // Buscar patrones de nombres de productos
        const productPatterns = [
            /(?:producto|artículo|item|modelo)[:\s]+([^\n\r]+)/i,
            /(?:nombre|descripción)[:\s]+([^\n\r]+)/i,
            /^([a-z0-9\s\-]+)(?=\s*\d+[.,]\d+)/i
        ];

        for (const pattern of productPatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }

        return null;
    }

    extractPrice(text) {
        // Buscar precios (formato mexicano y otros)
        const pricePatterns = [
            /\$\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/i,
            /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(?:pesos|mxn|usd|eur)/i,
            /precio[:\s]+(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/i
        ];

        for (const pattern of pricePatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                return parseFloat(match[1].replace(/[.,]/g, ''));
            }
        }

        return null;
    }

    extractOriginalPrice(text) {
        // Buscar precios originales/tachados
        const originalPricePatterns = [
            /(?:antes|original|tachado)[:\s]*\$\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/i,
            /precio\s+original[:\s]+(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/i
        ];

        for (const pattern of originalPricePatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                return parseFloat(match[1].replace(/[.,]/g, ''));
            }
        }

        return null;
    }

    extractDiscount(text) {
        // Buscar descuentos
        const discountPatterns = [
            /(?:descuento|rebaja|oferta)[:\s]*(\d{1,3})%/i,
            /(\d{1,3})%\s*(?:off|descuento|rebaja)/i,
            /-(\d{1,3})%/i
        ];

        for (const pattern of discountPatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                return parseInt(match[1]);
            }
        }

        return null;
    }

    extractBrand(text) {
        // Buscar marcas conocidas
        const brands = [
            'samsung', 'apple', 'sony', 'lg', 'nike', 'adidas', 'nike', 'adidas',
            'microsoft', 'google', 'amazon', 'walmart', 'costco', 'target'
        ];

        for (const brand of brands) {
            if (text.includes(brand)) {
                return brand.charAt(0).toUpperCase() + brand.slice(1);
            }
        }

        return null;
    }

    extractCategory(text) {
        // Buscar categorías
        const categories = {
            'electronics': ['electrónico', 'tecnología', 'smartphone', 'laptop', 'computadora'],
            'fashion': ['ropa', 'zapatos', 'accesorios', 'moda'],
            'home': ['hogar', 'casa', 'muebles', 'decoración'],
            'beauty': ['belleza', 'cosméticos', 'perfume', 'maquillaje'],
            'sports': ['deportes', 'fitness', 'ejercicio', 'gimnasio']
        };

        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                return category;
            }
        }

        return 'other';
    }

    extractStoreName(text) {
        // Buscar nombres de tiendas
        const storePatterns = [
            /(?:tienda|store|local)[:\s]+([^\n\r]+)/i,
            /(?:en|en la|en el)\s+([a-z\s]+)(?=\s+encontramos)/i
        ];

        for (const pattern of storePatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }

        return null;
    }

    extractValidUntil(text) {
        // Buscar fechas de expiración
        const datePatterns = [
            /(?:válido|expira|hasta)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
            /(?:fecha límite|último día)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
        ];

        for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                const date = new Date(match[1]);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }
        }

        return null;
    }

    extractTags(text) {
        // Extraer tags relevantes
        const tags = [];
        const tagKeywords = [
            'nuevo', 'original', 'garantía', 'envío gratis', 'entrega rápida',
            'stock limitado', 'oferta especial', 'flash sale', 'black friday'
        ];

        tagKeywords.forEach(tag => {
            if (text.includes(tag)) {
                tags.push(tag);
            }
        });

        return tags.length > 0 ? tags : null;
    }

    async healthCheck() {
        try {
            // Verificar servidor Python
            const pythonHealth = await axios.get(`${this.pythonServerUrl}/health`, {
                timeout: 5000
            }).catch(() => ({ status: 'unhealthy' }));

            // Verificar RapidAPI
            const rapidApiHealth = this.rapidApiKey ? 'configured' : 'not-configured';

            return {
                status: 'healthy',
                python: pythonHealth.status === 200 ? 'healthy' : 'unhealthy',
                rapidapi: rapidApiHealth,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = new OCRService();
