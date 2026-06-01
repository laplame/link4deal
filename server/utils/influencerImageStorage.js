'use strict';

const path = require('path');
const fs = require('fs').promises;
const cloudinaryConfig = require('../config/cloudinary');
const { getInfluencerUploadDir } = require('../middleware/upload');

/**
 * Guarda imagen de influencer (avatar, verificación) en disco + Cloudinary.
 * Devuelve URL pública priorizando Cloudinary.
 */
async function persistInfluencerImage(file, options = {}) {
    const folder = options.cloudinaryFolder || 'link4deal/influencers';
    const filenamePrefix = options.filenamePrefix || 'influencer-avatar';

    if (!file?.buffer) {
        throw new Error('Buffer de imagen requerido');
    }

    const dir = getInfluencerUploadDir();
    await fs.mkdir(dir, { recursive: true });
    const ext = path.extname(file.originalname || '') || '.jpg';
    const filename = `${filenamePrefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const localPath = path.join(dir, filename);
    const publicLocalUrl = `/uploads/influencers/${filename}`;

    await fs.writeFile(localPath, file.buffer);

    let cloudinaryUrl = null;
    let cloudinaryPublicId = null;

    if (cloudinaryConfig.isConfigured) {
        try {
            const cloudinaryResult = await cloudinaryConfig.uploadImage(
                {
                    buffer: file.buffer,
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                },
                { folder },
            );
            if (cloudinaryResult?.success && cloudinaryResult.data?.secure_url) {
                cloudinaryUrl = cloudinaryResult.data.secure_url;
                cloudinaryPublicId = cloudinaryResult.data.public_id;
            }
        } catch (e) {
            console.warn(`⚠️ Cloudinary influencer image: ${e.message}`);
        }
    }

    return {
        url: cloudinaryUrl || publicLocalUrl,
        cloudinaryUrl,
        cloudinaryPublicId,
        publicLocalUrl,
        localPath,
        filename,
        savedToCloudinary: Boolean(cloudinaryUrl),
    };
}

module.exports = { persistInfluencerImage };
