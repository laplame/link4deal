'use strict';

/**
 * Evidencia de compra para promociones verification_only (ofertas de terceros / sin deal).
 * La app envía foto de ticket/recibo (verificationImages) y/o link a video (purchaseProofVideoUrl).
 */

const PURCHASE_PROOF_MEDIA_TYPES = Object.freeze(['image', 'video', 'video_link']);

const VIDEO_URL_ALIASES = [
    'purchaseProofVideoUrl',
    'verificationVideoUrl',
    'purchaseProofVideoLink',
    'verificationVideoLink',
];

function parseBooleanField(value) {
    if (value === true || value === 'true' || value === '1') return true;
    if (value === false || value === 'false' || value === '0') return false;
    return undefined;
}

function isValidHttpsUrl(raw) {
    const s = String(raw || '').trim();
    if (!s || s.length > 2048) return false;
    try {
        const u = new URL(s);
        return u.protocol === 'https:' || u.protocol === 'http:';
    } catch {
        return false;
    }
}

/**
 * Extrae URLs de video desde body (campo único, lista JSON o CSV).
 */
function parseVideoLinksFromBody(body) {
    if (!body || typeof body !== 'object') return [];

    const urls = new Set();

    for (const key of VIDEO_URL_ALIASES) {
        const v = body[key];
        if (v == null || String(v).trim() === '') continue;
        const s = String(v).trim();
        if (isValidHttpsUrl(s)) urls.add(s);
    }

    const listRaw = body.purchaseProofVideoUrls ?? body.verificationVideoUrls;
    if (listRaw != null && String(listRaw).trim()) {
        let parsed = null;
        if (Array.isArray(listRaw)) {
            parsed = listRaw;
        } else if (typeof listRaw === 'string') {
            try {
                const j = JSON.parse(listRaw);
                parsed = Array.isArray(j) ? j : listRaw.split(/[\n,;]+/);
            } catch {
                parsed = listRaw.split(/[\n,;]+/);
            }
        }
        if (Array.isArray(parsed)) {
            for (const item of parsed) {
                const s = String(item || '').trim();
                if (isValidHttpsUrl(s)) urls.add(s);
            }
        }
    }

    if (body.purchaseProof != null && String(body.purchaseProof).trim()) {
        try {
            const j = typeof body.purchaseProof === 'string' ? JSON.parse(body.purchaseProof) : body.purchaseProof;
            if (Array.isArray(j)) {
                for (const item of j) {
                    if (!item || typeof item !== 'object') continue;
                    const mt = String(item.mediaType || '').toLowerCase();
                    if (mt === 'video_link' || mt === 'video') {
                        const s = String(item.url || '').trim();
                        if (isValidHttpsUrl(s)) urls.add(s);
                    }
                }
            }
        } catch {
            /* ignore malformed JSON */
        }
    }

    return [...urls];
}

function getUploadProofFileGroups(req) {
    const f = req.files;
    if (!f || typeof f !== 'object') {
        return { verificationImages: [], videos: [] };
    }
    return {
        verificationImages: Array.isArray(f.verificationImages) ? f.verificationImages : [],
        videos: Array.isArray(f.videos) ? f.videos : [],
    };
}

function countProofEvidenceFromRequest(body, req) {
    const { verificationImages, videos } = getUploadProofFileGroups(req);
    const videoLinks = parseVideoLinksFromBody(body);
    return {
        proofImageCount: verificationImages.length,
        proofVideoUploadCount: videos.length,
        proofVideoLinkCount: videoLinks.length,
        proofEvidenceCount: verificationImages.length + videos.length + videoLinks.length,
        videoLinks,
        verificationImages,
        videos,
    };
}

function buildPurchaseProofEntries({ proofImages = [], proofVideos = [], videoLinks = [] }) {
    const now = new Date();
    const entries = [];

    for (const img of proofImages) {
        if (!img?.url) continue;
        entries.push({
            mediaType: 'image',
            source: 'upload',
            url: img.url,
            originalName: img.originalName || '',
            uploadedAt: img.uploadedAt || now,
        });
    }

    for (const vid of proofVideos) {
        if (!vid?.url) continue;
        entries.push({
            mediaType: 'video',
            source: 'upload',
            url: vid.url,
            originalName: vid.originalName || '',
            uploadedAt: vid.uploadedAt || now,
        });
    }

    for (const link of videoLinks) {
        entries.push({
            mediaType: 'video_link',
            source: 'external_link',
            url: link,
            uploadedAt: now,
        });
    }

    return entries;
}

function mergePurchaseProof(existingProof, newEntries) {
    const prev = Array.isArray(existingProof) ? existingProof : [];
    return [...prev, ...newEntries];
}

function countStoredPurchaseProof(promotion) {
    const proof = promotion?.verification?.purchaseProof;
    return Array.isArray(proof) ? proof.length : 0;
}

function summarizePurchaseProof(promotion) {
    const proof = Array.isArray(promotion?.verification?.purchaseProof)
        ? promotion.verification.purchaseProof
        : [];
    let imageCount = 0;
    let videoUploadCount = 0;
    let videoLinkCount = 0;
    for (const p of proof) {
        if (!p) continue;
        if (p.mediaType === 'image') imageCount += 1;
        else if (p.mediaType === 'video') videoUploadCount += 1;
        else if (p.mediaType === 'video_link') videoLinkCount += 1;
    }
    return {
        purchaseProofCount: proof.length,
        purchaseProofImageCount: imageCount,
        purchaseProofVideoUploadCount: videoUploadCount,
        purchaseProofVideoLinkCount: videoLinkCount,
        hasPurchaseProof: proof.length > 0,
        purchaseProof: proof,
    };
}

function enrichPurchaseProofClientFields(promo) {
    if (!promo || typeof promo !== 'object') return promo;
    const summary = summarizePurchaseProof(promo);
    return {
        ...promo,
        ...summary,
    };
}

/**
 * Procesa verificationImages, videos (multipart) y links del body → entradas purchaseProof.
 */
async function processPurchaseProofUploads(req, body) {
    const { verificationImages, videos } = getUploadProofFileGroups(req);
    const videoLinks = parseVideoLinksFromBody(body);
    if (!verificationImages.length && !videos.length && !videoLinks.length) {
        return [];
    }

    const imageOptimizer = require('./imageOptimizer');
    const { persistPromotionProofImage, persistPromotionProofVideo } = require('./promotionImageStorage');

    const proofImages = [];
    for (const file of verificationImages) {
        try {
            let optimizedImage = null;
            try {
                optimizedImage = await imageOptimizer.optimizeImage(file.buffer, {
                    maxWidth: 1920,
                    maxHeight: 1920,
                    quality: 85,
                    format: 'auto',
                    progressive: true,
                });
                file.buffer = optimizedImage.buffer;
            } catch (optErr) {
                console.warn(`⚠️ [purchaseProof] optimizar imagen: ${optErr.message}`);
            }
            const stored = await persistPromotionProofImage(file, optimizedImage);
            proofImages.push(stored);
        } catch (err) {
            console.error('❌ [purchaseProof] imagen:', err.message);
        }
    }

    const proofVideos = [];
    for (const file of videos) {
        try {
            const stored = await persistPromotionProofVideo(file);
            proofVideos.push(stored);
        } catch (err) {
            console.error('❌ [purchaseProof] video:', err.message);
        }
    }

    return buildPurchaseProofEntries({ proofImages, proofVideos, videoLinks });
}

module.exports = {
    PURCHASE_PROOF_MEDIA_TYPES,
    parseVideoLinksFromBody,
    getUploadProofFileGroups,
    countProofEvidenceFromRequest,
    buildPurchaseProofEntries,
    mergePurchaseProof,
    countStoredPurchaseProof,
    summarizePurchaseProof,
    enrichPurchaseProofClientFields,
    isValidHttpsUrl,
    parseBooleanField,
    processPurchaseProofUploads,
};
