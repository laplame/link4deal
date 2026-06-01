'use strict';

const mongoose = require('mongoose');
const Influencer = require('../models/Influencer');
const InstagramLead = require('../models/InstagramLead');

const INFLUENCER_GENERAL_USERNAME = 'influencer-general';

function normalizeIgUsername(raw) {
    return String(raw || '')
        .trim()
        .toLowerCase()
        .replace(/^@/, '')
        .replace(/[^a-z0-9._]/g, '');
}

/**
 * Intenta vincular lead a influencer por handle en socialMedia o username.
 */
async function resolveInfluencerByInstagramUsername(username) {
    const u = normalizeIgUsername(username);
    if (!u) return null;

    const candidates = await Influencer.find({
        username: { $ne: INFLUENCER_GENERAL_USERNAME },
        $or: [
            { 'socialMedia.instagram': new RegExp(`^@?${u}$`, 'i') },
            { username: new RegExp(`^@?${u}$`, 'i') },
        ],
    })
        .select('_id name username socialMedia')
        .limit(2)
        .lean();

    if (candidates.length === 1) return candidates[0];
    return null;
}

function serializeLead(doc) {
    const d = doc.toObject ? doc.toObject() : doc;
    return {
        id: String(d._id),
        externalId: d.externalId || null,
        source: d.source,
        eventType: d.eventType,
        instagramUserId: d.instagramUserId || null,
        instagramUsername: d.instagramUsername || '',
        displayName: d.displayName || '',
        message: d.message || '',
        mediaId: d.mediaId || null,
        mediaType: d.mediaType || '',
        permalink: d.permalink || '',
        influencerId: d.influencer ? String(d.influencer) : null,
        promotionId: d.promotion ? String(d.promotion) : null,
        pipelineStage: d.pipelineStage,
        status: d.status,
        adminNotes: d.adminNotes || '',
        receivedAt: d.receivedAt ? new Date(d.receivedAt).toISOString() : null,
        lastActivityAt: d.lastActivityAt ? new Date(d.lastActivityAt).toISOString() : null,
        createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : null,
        updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : null,
    };
}

/**
 * Upsert lead por externalId + eventType cuando exista.
 */
async function upsertLead(fields) {
    const externalId = fields.externalId ? String(fields.externalId).trim() : null;
    const eventType = fields.eventType || 'other';
    const now = new Date();

    let influencerId = fields.influencerId || null;
    const username = normalizeIgUsername(fields.instagramUsername);
    if (!influencerId && username) {
        const inf = await resolveInfluencerByInstagramUsername(username);
        if (inf) influencerId = inf._id;
    }

    const base = {
        source: fields.source || 'webhook',
        eventType,
        instagramUserId: fields.instagramUserId || null,
        instagramUsername: username,
        displayName: fields.displayName || '',
        message: fields.message || '',
        mediaId: fields.mediaId || null,
        mediaType: fields.mediaType || '',
        permalink: fields.permalink || '',
        influencer: influencerId || null,
        promotion: fields.promotionId || null,
        lastActivityAt: now,
        rawPayload: fields.rawPayload || null,
    };

    if (externalId) {
        const existing = await InstagramLead.findOne({ externalId, eventType }).lean();
        if (existing) {
            const updated = await InstagramLead.findByIdAndUpdate(
                existing._id,
                { $set: base },
                { new: true },
            ).lean();
            return { lead: serializeLead(updated), created: false };
        }
    }

    const created = await InstagramLead.create({
        ...base,
        externalId,
        receivedAt: fields.receivedAt || now,
        pipelineStage: fields.pipelineStage || 'new',
        status: fields.status || 'open',
        adminNotes: fields.adminNotes || '',
    });
    return { lead: serializeLead(created), created: true };
}

/**
 * Parsea payloads comunes del webhook Meta (instagram / page).
 */
async function ingestWebhookPayload(body) {
    const objectType = body?.object;
    const entries = Array.isArray(body?.entry) ? body.entry : [];
    const results = [];

    for (const entry of entries) {
        const entryId = entry?.id != null ? String(entry.id) : '';
        const time = entry?.time ? new Date(entry.time * 1000) : new Date();

        const changes = Array.isArray(entry?.changes) ? entry.changes : [];
        for (const ch of changes) {
            const field = ch?.field;
            const value = ch?.value || {};
            if (field === 'comments') {
                const from = value.from || {};
                const r = await upsertLead({
                    externalId: value.id || value.comment_id || `${entryId}_comment_${Date.now()}`,
                    source: 'webhook',
                    eventType: 'comment',
                    instagramUserId: from.id != null ? String(from.id) : null,
                    instagramUsername: from.username || '',
                    displayName: from.username || '',
                    message: value.text || value.message || '',
                    mediaId: value.media?.id != null ? String(value.media.id) : value.media_id || null,
                    mediaType: value.media?.media_product_type || 'FEED',
                    receivedAt: time,
                    rawPayload: { object: objectType, entry, change: ch },
                });
                results.push(r);
            }
            if (field === 'mentions') {
                const r = await upsertLead({
                    externalId: value.id || `${entryId}_mention_${Date.now()}`,
                    source: 'webhook',
                    eventType: 'mention',
                    instagramUsername: value.username || '',
                    message: value.caption || value.text || 'Mención en Instagram',
                    mediaId: value.media_id || null,
                    receivedAt: time,
                    rawPayload: { object: objectType, entry, change: ch },
                });
                results.push(r);
            }
        }

        const messaging = Array.isArray(entry?.messaging) ? entry.messaging : [];
        for (const msg of messaging) {
            const sender = msg?.sender || {};
            const message = msg?.message || {};
            const r = await upsertLead({
                externalId: message.mid || `${entryId}_dm_${msg.timestamp || Date.now()}`,
                source: 'webhook',
                eventType: 'dm',
                instagramUserId: sender.id != null ? String(sender.id) : null,
                message: message.text || '[adjunto/multimedia]',
                receivedAt: msg.timestamp ? new Date(Number(msg.timestamp)) : time,
                rawPayload: { object: objectType, entry, messaging: msg },
            });
            results.push(r);
        }
    }

    if (!entries.length && body && typeof body === 'object') {
        const r = await upsertLead({
            externalId: `raw_${Date.now()}`,
            source: 'webhook',
            eventType: 'other',
            message: 'Evento webhook sin estructura entry[]',
            rawPayload: body,
        });
        results.push(r);
    }

    return results;
}

async function listLeads(query = {}) {
    const filter = {};
    if (query.influencerId && mongoose.Types.ObjectId.isValid(String(query.influencerId))) {
        filter.influencer = query.influencerId;
    }
    if (query.pipelineStage) filter.pipelineStage = String(query.pipelineStage);
    if (query.status) filter.status = String(query.status);
    if (query.eventType) filter.eventType = String(query.eventType);
    if (query.username) {
        const u = normalizeIgUsername(query.username);
        if (u) filter.instagramUsername = new RegExp(u, 'i');
    }

    const limit = Math.min(200, Math.max(1, parseInt(String(query.limit || '50'), 10) || 50));
    const docs = await InstagramLead.find(filter)
        .sort({ receivedAt: -1 })
        .limit(limit)
        .populate('influencer', 'name username avatar')
        .lean();

    return docs.map((d) => {
        const row = serializeLead(d);
        if (d.influencer && typeof d.influencer === 'object') {
            row.influencerName = d.influencer.name || null;
            row.influencerUsername = d.influencer.username || null;
        }
        return row;
    });
}

async function leadStats() {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const [totalOpen, last24h, byStage] = await Promise.all([
        InstagramLead.countDocuments({ status: 'open' }),
        InstagramLead.countDocuments({ receivedAt: { $gte: dayAgo } }),
        InstagramLead.aggregate([
            { $group: { _id: '$pipelineStage', count: { $sum: 1 } } },
        ]),
    ]);
    const stageMap = {};
    for (const row of byStage) stageMap[row._id || 'unknown'] = row.count;
    return { totalOpen, last24h, byStage: stageMap };
}

module.exports = {
    normalizeIgUsername,
    resolveInfluencerByInstagramUsername,
    serializeLead,
    upsertLead,
    ingestWebhookPayload,
    listLeads,
    leadStats,
};
