const cloudinary = require('cloudinary').v2;
require('dotenv').config();

class CloudinaryConfig {
    constructor() {
        this.isConfigured = false;
        this.config = {
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        };
    }

    configure() {
        try {
            // Verificar que todas las variables estén configuradas
            if (!this.config.cloud_name || !this.config.api_key || !this.config.api_secret) {
                throw new Error('Faltan variables de entorno de Cloudinary');
            }

            // Configurar Cloudinary
            cloudinary.config({
                cloud_name: this.config.cloud_name,
                api_key: this.config.api_key,
                api_secret: this.config.api_secret
            });

            this.isConfigured = true;
            console.log('✅ Cloudinary configurado correctamente');
            
            return true;
        } catch (error) {
            console.error('❌ Error configurando Cloudinary:', error.message);
            this.isConfigured = false;
            return false;
        }
    }

    async uploadImage(file, options = {}) {
        if (!this.isConfigured) {
            throw new Error('Cloudinary no está configurado');
        }

        try {
            const uploadOptions = {
                folder: process.env.CLOUDINARY_FOLDER || 'link4deal/promotions',
                resource_type: 'auto',
                allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
                transformation: [
                    { quality: 'auto:good' },
                    { fetch_format: 'auto' }
                ],
                ...options
            };

            // Si es un buffer (archivo subido)
            if (file.buffer) {
                const result = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        uploadOptions,
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    
                    uploadStream.end(file.buffer);
                });

                return {
                    success: true,
                    data: result,
                    message: 'Imagen subida exitosamente'
                };
            }

            // Si es una ruta de archivo
            if (file.path) {
                const result = await cloudinary.uploader.upload(file.path, uploadOptions);
                
                return {
                    success: true,
                    data: result,
                    message: 'Imagen subida exitosamente'
                };
            }

            throw new Error('Formato de archivo no soportado');

        } catch (error) {
            console.error('❌ Error subiendo imagen a Cloudinary:', error);
            return {
                success: false,
                error: error.message,
                message: 'Error subiendo imagen'
            };
        }
    }

    async deleteImage(publicId) {
        if (!this.isConfigured) {
            throw new Error('Cloudinary no está configurado');
        }

        try {
            const result = await cloudinary.uploader.destroy(publicId);
            
            return {
                success: true,
                data: result,
                message: 'Imagen eliminada exitosamente'
            };
        } catch (error) {
            console.error('❌ Error eliminando imagen de Cloudinary:', error);
            return {
                success: false,
                error: error.message,
                message: 'Error eliminando imagen'
            };
        }
    }

    async getImageInfo(publicId) {
        if (!this.isConfigured) {
            throw new Error('Cloudinary no está configurado');
        }

        try {
            const result = await cloudinary.api.resource(publicId);
            
            return {
                success: true,
                data: result,
                message: 'Información de imagen obtenida'
            };
        } catch (error) {
            console.error('❌ Error obteniendo información de imagen:', error);
            return {
                success: false,
                error: error.message,
                message: 'Error obteniendo información de imagen'
            };
        }
    }

    async createTransformation(publicId, transformations) {
        if (!this.isConfigured) {
            throw new Error('Cloudinary no está configurado');
        }

        try {
            const url = cloudinary.url(publicId, {
                transformation: transformations
            });
            
            return {
                success: true,
                url: url,
                message: 'Transformación creada exitosamente'
            };
        } catch (error) {
            console.error('❌ Error creando transformación:', error);
            return {
                success: false,
                error: error.message,
                message: 'Error creando transformación'
            };
        }
    }

    getUploadPreset() {
        return {
            cloud_name: this.config.cloud_name,
            upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || 'ml_default',
            folder: process.env.CLOUDINARY_FOLDER || 'link4deal/promotions'
        };
    }

    isReady() {
        return this.isConfigured;
    }

    getConfig() {
        return {
            isConfigured: this.isConfigured,
            cloudName: this.config.cloud_name,
            hasApiKey: !!this.config.api_key,
            hasApiSecret: !!this.config.api_secret
        };
    }
}

// Crear instancia singleton
const cloudinaryConfig = new CloudinaryConfig();

module.exports = cloudinaryConfig;
