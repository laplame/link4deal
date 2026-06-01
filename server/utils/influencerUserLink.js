'use strict';

const Influencer = require('../models/Influencer');
const { docMatchesPublicSlug, normalizeSlugInput } = require('./influencerSlug');

const INFLUENCER_GENERAL_USERNAME = 'influencer-general';

function normalizeHandle(raw) {
    return normalizeSlugInput(String(raw || '').replace(/^@+/, ''));
}

function handleCandidates(raw) {
    const n = normalizeHandle(raw);
    if (!n) return [];
    return [...new Set([n, n.replace(/-/g, ''), `@${n}`])];
}

/** Handles de username / redes para buscar perfil sin userId. */
function collectHandlesFromBody(body = {}) {
    const sm = body.socialMedia && typeof body.socialMedia === 'object' ? body.socialMedia : {};
    const raw = [
        body.username,
        body.slug,
        sm.instagram,
        sm.tiktok,
        sm.youtube,
        sm.twitter,
    ];
    const set = new Set();
    for (const item of raw) {
        for (const c of handleCandidates(item)) set.add(c);
    }
    return [...set];
}

/**
 * Busca un influencer sin userId que coincida con handles o slug público.
 */
async function findUnclaimedInfluencer({ handles = [], slug = '' } = {}) {
    const normalizedHandles = [];
    for (const h of handles) {
        normalizedHandles.push(...handleCandidates(h));
    }
    const wanted = normalizeHandle(slug);
    if (wanted) {
        normalizedHandles.push(...handleCandidates(wanted));
    }
    const unique = [...new Set(normalizedHandles.filter(Boolean))];
    if (!unique.length && !wanted) return null;

    const or = [];
    if (unique.length) {
        or.push({ username: { $in: unique } });
        or.push({ 'socialMedia.instagram': { $in: unique } });
        or.push({ 'socialMedia.tiktok': { $in: unique } });
        or.push({ 'socialMedia.youtube': { $in: unique } });
        or.push({ 'socialMedia.twitter': { $in: unique } });
    }

    const query = {
        userId: null,
        username: { $ne: INFLUENCER_GENERAL_USERNAME },
    };
    if (or.length) query.$or = or;

    const candidates = await Influencer.find(query).limit(20).lean();
    if (!candidates.length) return null;

    if (wanted) {
        const bySlug = candidates.find((doc) => docMatchesPublicSlug(doc, wanted));
        if (bySlug) return bySlug;
    }

    if (unique.length === 1) {
        return candidates.find((doc) => {
            const docHandles = [
                doc.username,
                doc.socialMedia?.instagram,
                doc.socialMedia?.tiktok,
            ].flatMap((v) => handleCandidates(v));
            return docHandles.some((h) => unique.includes(h));
        }) || candidates[0];
    }

    return candidates[0] || null;
}

async function linkInfluencerToUser(influencerDoc, userId) {
    const id = influencerDoc._id || influencerDoc.id;
    if (!id) return null;
    const updated = await Influencer.findByIdAndUpdate(
        id,
        { $set: { userId } },
        { new: true },
    );
    return updated;
}

module.exports = {
    collectHandlesFromBody,
    findUnclaimedInfluencer,
    linkInfluencerToUser,
    normalizeHandle,
};
