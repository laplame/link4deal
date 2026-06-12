const cloudinary = require('cloudinary').v2;
require('./envPath');

class CloudinaryConfig {
    constructor() {
        this.isConfigured = false;
        this.config = {
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        };
    }

    /** Ignora placeholders de env.example para no intentar subir con credenciales falsas. */
    isPlaceholderCredential(value) {
        if (!value || typeof value !== 'string') return true;
        const v = value.trim().toLowerCase();
        return (
            !v ||
            v.startsWith('your_') ||
            v.includes('your_api_key') ||
            v.includes('your_cloud_name') ||
            v.includes('your_api_secret') ||
            v === 'changeme' ||
            v === 'xxx' ||
            v === 'placeholder'
        );
    }

    /**
     * Parsea CLOUDINARY_URL (cloudinary://api_key:api_secret@cloud_name).
     * Acepta secretos URL-encoded.
     */
    parseCloudinaryUrl(rawUrl) {
        if (!rawUrl || typeof rawUrl !== 'string') return null;
        const trimmed = rawUrl.trim();
        if (!trimmed.startsWith('cloudinary://')) return null;

        try {
            const parsed = new URL(trimmed);
            const cloud_name = decodeURIComponent(parsed.hostname || '');
            const api_key = decodeURIComponent(parsed.username || '');
            const api_secret = decodeURIComponent(parsed.password || '');
            if (!cloud_name || !api_key || !api_secret) return null;
            return { cloud_name, api_key, api_secret };
        } catch {
            return null;
        }
    }

    /** Resuelve credenciales: CLOUDINARY_URL tiene prioridad sobre CLOUDINARY_* sueltas. */
    resolveCredentials() {
        const fromUrl = this.parseCloudinaryUrl(process.env.CLOUDINARY_URL);
        if (fromUrl && !this.isPlaceholderCredential(fromUrl.api_key)) {
            return fromUrl;
        }

        const { cloud_name, api_key, api_secret } = this.config;
        if (
            !this.isPlaceholderCredential(cloud_name) &&
            !this.isPlaceholderCredential(api_key) &&
            !this.isPlaceholderCredential(api_secret)
        ) {
            return { cloud_name, api_key, api_secret };
        }

        return null;
    }

    configure() {
        try {
            const creds = this.resolveCredentials();
            if (!creds) {
                throw new Error(
                    'Cloudinary no configurado (define CLOUDINARY_URL o CLOUDINARY_CLOUD_NAME + API_KEY + API_SECRET)',
                );
            }

            cloudinary.config({
                cloud_name: creds.cloud_name,
                api_key: creds.api_key,
                api_secret: creds.api_secret,
                secure: true,
            });

            this.config = creds;
            this.isConfigured = true;
            console.log(`✅ Cloudinary configurado (${creds.cloud_name})`);
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
                transformation: [{ quality: 'auto:good' }, { fetch_format: 'auto' }],
                ...options,
            };

            if (file.buffer) {
                const result = await new Promise((resolve, reject) => {
                    let settled = false;
                    const finish = (err, res) => {
                        if (settled) return;
                        settled = true;
                        if (err) reject(err);
                        else resolve(res);
                    };
                    const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, uploadResult) => {
                        finish(error, uploadResult);
                    });
                    uploadStream.on('error', (streamErr) => finish(streamErr, null));
                    uploadStream.end(file.buffer);
                });

                return {
                    success: true,
                    data: result,
                    message: 'Imagen subida exitosamente',
                };
            }

            if (file.path) {
                const result = await cloudinary.uploader.upload(file.path, uploadOptions);

                return {
                    success: true,
                    data: result,
                    message: 'Imagen subida exitosamente',
                };
            }

            throw new Error('Formato de archivo no soportado');
        } catch (error) {
            console.error('❌ Error subiendo imagen a Cloudinary:', error);
            return {
                success: false,
                error: error.message,
                message: 'Error subiendo imagen',
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
                message: 'Imagen eliminada exitosamente',
            };
        } catch (error) {
            console.error('❌ Error eliminando imagen de Cloudinary:', error);
            return {
                success: false,
                error: error.message,
                message: 'Error eliminando imagen',
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
                message: 'Información de imagen obtenida',
            };
        } catch (error) {
            console.error('❌ Error obteniendo información de imagen:', error);
            return {
                success: false,
                error: error.message,
                message: 'Error obteniendo información de imagen',
            };
        }
    }

    async createTransformation(publicId, transformations) {
        if (!this.isConfigured) {
            throw new Error('Cloudinary no está configurado');
        }

        try {
            const url = cloudinary.url(publicId, {
                transformation: transformations,
            });

            return {
                success: true,
                url: url,
                message: 'Transformación creada exitosamente',
            };
        } catch (error) {
            console.error('❌ Error creando transformación:', error);
            return {
                success: false,
                error: error.message,
                message: 'Error creando transformación',
            };
        }
    }

    getUploadPreset() {
        return {
            cloud_name: this.config.cloud_name,
            upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || 'ml_default',
            folder: process.env.CLOUDINARY_FOLDER || 'link4deal/promotions',
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
            hasApiSecret: !!this.config.api_secret,
            configuredViaUrl: Boolean(
                process.env.CLOUDINARY_URL &&
                    !this.isPlaceholderCredential(process.env.CLOUDINARY_URL),
            ),
        };
    }
}

const cloudinaryConfig = new CloudinaryConfig();

module.exports = cloudinaryConfig;
