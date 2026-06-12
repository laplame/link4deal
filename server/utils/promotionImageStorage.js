'use strict';

const path = require('path');
const fs = require('fs').promises;
const cloudinaryConfig = require('../config/cloudinary');
const { getUploadDir, getPromotionUploadDir } = require('../middleware/upload');

function getPromotionProofUploadDir() {
    return path.join(getPromotionUploadDir(), 'proof');
}

/**
 * Resuelve ruta física de una imagen de promoción (ruta actual, legacy o raíz uploads).
 */
function resolveLocalPromotionFilePath(filename) {
    if (!filename) return null;
    const base = getUploadDir();
    const candidates = [
        path.join(getPromotionUploadDir(), filename),
        path.join(base, filename),
        path.join(__dirname, '../public/uploads/promotions', filename),
    ];
    return candidates;
}

async function firstExistingPath(candidates) {
    for (const p of candidates) {
        try {
            await fs.access(p);
            return p;
        } catch {
            /* siguiente */
        }
    }
    return null;
}

function extensionForFormat(optimizedFormat, originalName) {
    const fmt = optimizedFormat || path.extname(originalName || '').slice(1) || 'jpg';
    if (fmt === 'webp') return '.webp';
    if (fmt === 'png') return '.png';
    return '.jpg';
}

function mimetypeForFormat(optimizedFormat) {
    if (optimizedFormat === 'webp') return 'image/webp';
    if (optimizedFormat === 'png') return 'image/png';
    return 'image/jpeg';
}

/**
 * Guarda en disco + Cloudinary (si está configurado).
 * `url` en Mongo apunta a Cloudinary cuando existe (sobrevive git pull en el VPS).
 */
async function persistPromotionImage(file, optimizedImage = null) {
    const uploadDir = getPromotionUploadDir();
    await fs.mkdir(uploadDir, { recursive: true });

    const optimizedFormat = optimizedImage?.format || path.extname(file.originalname || '').slice(1) || 'jpg';
    const fileExtension = extensionForFormat(optimizedFormat, file.originalname);
    const uniqueFilename = `promotion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
    const localPath = path.join(uploadDir, uniqueFilename);
    const publicLocalUrl = `/uploads/promotions/${uniqueFilename}`;

    await fs.writeFile(localPath, file.buffer);

    let cloudinaryUrl = null;
    let cloudinaryPublicId = null;

    if (cloudinaryConfig.isConfigured) {
        try {
            const cloudinaryFile = {
                ...file,
                buffer: file.buffer,
                mimetype: mimetypeForFormat(optimizedFormat),
            };
            const cloudinaryResult = await cloudinaryConfig.uploadImage(cloudinaryFile);
            if (cloudinaryResult.success) {
                cloudinaryUrl = cloudinaryResult.data.secure_url;
                cloudinaryPublicId = cloudinaryResult.data.public_id;
            } else {
                console.warn(
                    `⚠️ Cloudinary upload falló para ${file.originalname}: ${cloudinaryResult.message || cloudinaryResult.error}`,
                );
            }
        } catch (cloudinaryError) {
            console.warn(`⚠️ Cloudinary no disponible para ${file.originalname}: ${cloudinaryError.message}`);
        }
    }

    const url = cloudinaryUrl || publicLocalUrl;

    return {
        originalName: file.originalname,
        filename: uniqueFilename,
        path: localPath,
        url,
        cloudinaryUrl,
        cloudinaryPublicId,
        publicLocalUrl,
        savedToCloudinary: Boolean(cloudinaryUrl),
    };
}

async function persistPromotionProofImage(file, optimizedImage = null) {
    const uploadDir = getPromotionProofUploadDir();
    await fs.mkdir(uploadDir, { recursive: true });

    const optimizedFormat = optimizedImage?.format || path.extname(file.originalname || '').slice(1) || 'jpg';
    const fileExtension = extensionForFormat(optimizedFormat, file.originalname);
    const uniqueFilename = `proof-image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
    const localPath = path.join(uploadDir, uniqueFilename);
    const publicLocalUrl = `/uploads/promotions/proof/${uniqueFilename}`;

    await fs.writeFile(localPath, file.buffer);

    let cloudinaryUrl = null;
    if (cloudinaryConfig.isConfigured) {
        try {
            const cloudinaryFile = {
                ...file,
                buffer: file.buffer,
                mimetype: mimetypeForFormat(optimizedFormat),
            };
            const cloudinaryResult = await cloudinaryConfig.uploadImage(cloudinaryFile, {
                folder: 'link4deal/promotions/proof',
            });
            if (cloudinaryResult.success) {
                cloudinaryUrl = cloudinaryResult.data.secure_url;
            }
        } catch (cloudinaryError) {
            console.warn(`⚠️ Cloudinary proof image: ${cloudinaryError.message}`);
        }
    }

    return {
        originalName: file.originalname,
        filename: uniqueFilename,
        path: localPath,
        url: cloudinaryUrl || publicLocalUrl,
        uploadedAt: new Date(),
    };
}

async function persistPromotionProofVideo(file) {
    const uploadDir = getPromotionProofUploadDir();
    await fs.mkdir(uploadDir, { recursive: true });

    const ext = path.extname(file.originalname || '').toLowerCase() || '.mp4';
    const allowed = ['.mp4', '.mov', '.webm', '.m4v'];
    const safeExt = allowed.includes(ext) ? ext : '.mp4';
    const uniqueFilename = `proof-video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}${safeExt}`;
    const localPath = path.join(uploadDir, uniqueFilename);
    const publicLocalUrl = `/uploads/promotions/proof/${uniqueFilename}`;

    await fs.writeFile(localPath, file.buffer);

    return {
        originalName: file.originalname,
        filename: uniqueFilename,
        path: localPath,
        url: publicLocalUrl,
        uploadedAt: new Date(),
    };
}

/**
 * Sube un archivo local existente a Cloudinary y devuelve URLs.
 */
async function uploadLocalFileToCloudinary(localPath, options = {}) {
    if (!cloudinaryConfig.isConfigured) {
        return { ok: false, reason: 'cloudinary_not_configured' };
    }
    try {
        const result = await cloudinaryConfig.uploadImage({ path: localPath }, options);
        if (!result.success) {
            return { ok: false, reason: result.error || result.message };
        }
        return {
            ok: true,
            cloudinaryUrl: result.data.secure_url,
            cloudinaryPublicId: result.data.public_id,
        };
    } catch (e) {
        return { ok: false, reason: e.message };
    }
}

module.exports = {
    getUploadDir,
    getPromotionUploadDir,
    getPromotionProofUploadDir,
    resolveLocalPromotionFilePath,
    firstExistingPath,
    persistPromotionImage,
    persistPromotionProofImage,
    persistPromotionProofVideo,
    uploadLocalFileToCloudinary,
};
