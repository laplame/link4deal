'use strict';

const mongoose = require('mongoose');
const Influencer = require('../models/Influencer');
const InfluencerPromoShortCode = require('../models/InfluencerPromoShortCode');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const {
    ensureInfluencerHasProfileShortCode,
    computeDiscountPctFromPromotion,
} = require('./influencerPromoShortCodes');

const INFLUENCER_GENERAL_USERNAME = 'influencer-general';
const PROMOTION_CATALOG_SELECT =
    'title brand description currentPrice originalPrice currency discountPercentage status validFrom validUntil image redirectInsteadOfQr';

/**
 * Normaliza dirección de wallet desde la app (EVM u otras cadenas).
 * @param {unknown} raw
 * @returns {string|null}
 */
function normalizeWalletAddress(raw) {
    const s = String(raw ?? '').trim();
    if (!s) return null;
    if (/^0x[a-fA-F0-9]{40}$/.test(s)) return s;
    if (/^[1-9A-HJ-NP-Za-km-z]{32,64}$/.test(s)) return s;
    if (s.length >= 26 && s.length <= 128 && /^[a-zA-Z0-9._-]+$/.test(s)) return s;
    return null;
}

/**
 * @param {import('mongoose').Document|object} user
 * @returns {Promise<{ address: string|null, preferredNetwork: string|null, source: 'user'|'profile'|'app'|null }>}
 */
async function resolveWalletForUser(user) {
    const fromUser = user?.blockchain?.walletAddress && String(user.blockchain.walletAddress).trim();
    if (fromUser) {
        return {
            address: fromUser,
            preferredNetwork: user.blockchain?.preferredNetwork || null,
            source: 'user',
        };
    }
    const profile = await UserProfile.findOne({ user: user._id })
        .select('blockchain.walletAddress blockchain.preferredNetwork')
        .lean();
    const fromProfile = profile?.blockchain?.walletAddress && String(profile.blockchain.walletAddress).trim();
    if (fromProfile) {
        return {
            address: fromProfile,
            preferredNetwork: profile.blockchain?.preferredNetwork || null,
            source: 'profile',
        };
    }
    return { address: null, preferredNetwork: null, source: null };
}

/**
 * Persiste wallet en User y UserProfile (influencer app).
 * @param {import('mongoose').Document} user
 * @param {string} walletAddress
 * @param {string} [preferredNetwork]
 */
async function persistWalletForUser(user, walletAddress, preferredNetwork) {
    user.blockchain = user.blockchain || {};
    user.blockchain.walletAddress = walletAddress;
    if (preferredNetwork) {
        user.blockchain.preferredNetwork = preferredNetwork;
    }
    await user.save();

    let profile = await UserProfile.findOne({ user: user._id });
    if (!profile) {
        profile = new UserProfile({
            user: user._id,
            profileType: 'influencer',
            status: 'active',
        });
    }
    profile.blockchain = profile.blockchain || {};
    profile.blockchain.walletAddress = walletAddress;
    if (preferredNetwork) {
        profile.blockchain.preferredNetwork = preferredNetwork;
    }
    await profile.save();
}

function mapPromoRowToCampaignEntry(d, influencer) {
    const p = d.promotion;
    const discountPct = computeDiscountPctFromPromotion(p);
    const redirectInsteadOfQr = Boolean(p?.redirectInsteadOfQr);
    const blocked = influencer.username === INFLUENCER_GENERAL_USERNAME;
    let issueMode = 'qr';
    if (blocked) issueMode = 'blocked';
    else if (redirectInsteadOfQr) issueMode = 'redirect';
    const pid = p && p._id ? String(p._id) : null;
    return {
        shortCode: d.code,
        label: (d.label && String(d.label).trim()) || null,
        referralPrefix: d.referralPrefix || 'L4D',
        referralCode: `${d.referralPrefix || 'L4D'}-${d.code}`,
        expiresAt: d.expiresAt ? new Date(d.expiresAt).toISOString() : null,
        canIssueCoupon: issueMode !== 'blocked' && Boolean(pid),
        issueMode,
        discountPercentage: discountPct,
        promotion: p && p._id
            ? {
                  id: pid,
                  title: p.title || null,
                  brand: p.brand || null,
                  image: p.image || null,
                  status: p.status || null,
                  validUntil: p.validUntil ? new Date(p.validUntil).toISOString() : null,
                  redirectInsteadOfQr,
              }
            : null,
    };
}

/**
 * Campañas activas con código corto para un influencer (app).
 * @param {string} influencerId
 */
async function listActiveCampaignsForInfluencer(influencerId) {
    if (mongoose.connection.readyState !== 1) {
        return { campaigns: [], influencerProfileShortCode: null };
    }
    const inf = await Influencer.findById(influencerId)
        .select('username profileShortCode name avatar userId status')
        .lean();
    if (!inf || inf.username === INFLUENCER_GENERAL_USERNAME) {
        return null;
    }

    const profileShortCode = await ensureInfluencerHasProfileShortCode(influencerId);
    const now = new Date();
    const rows = await InfluencerPromoShortCode.find({
        influencer: influencerId,
        active: true,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    })
        .populate('promotion', PROMOTION_CATALOG_SELECT)
        .sort({ code: 1 })
        .lean();

    const campaigns = rows
        .filter((d) => d.promotion && d.promotion.status === 'active')
        .map((d) => mapPromoRowToCampaignEntry(d, inf));

    return {
        influencer: {
            id: String(inf._id),
            name: inf.name || null,
            username: inf.username || null,
            avatar: inf.avatar || null,
            status: inf.status || null,
            userId: inf.userId ? String(inf.userId) : null,
        },
        influencerProfileShortCode: profileShortCode || inf.profileShortCode || null,
        campaigns,
        totalCampaigns: campaigns.length,
    };
}

/**
 * @param {import('mongoose').Document} user — req.user
 * @param {{ walletAddress?: string, preferredNetwork?: string, syncWalletFromApp?: boolean }} opts
 */
async function buildInfluencerAppSession(user, opts = {}) {
    if (mongoose.connection.readyState !== 1) {
        const e = new Error('Base de datos no disponible');
        e.status = 503;
        throw e;
    }

    const influencer = await Influencer.findOne({ userId: user._id }).lean();
    if (!influencer) {
        const e = new Error('No tienes perfil de influencer vinculado a esta cuenta');
        e.status = 404;
        e.code = 'INFLUENCER_NOT_LINKED';
        throw e;
    }

    let walletSynced = false;
    const incomingWallet = normalizeWalletAddress(opts.walletAddress);
    if (incomingWallet && opts.syncWalletFromApp !== false) {
        await persistWalletForUser(user, incomingWallet, opts.preferredNetwork);
        walletSynced = true;
    }

    const wallet = await resolveWalletForUser(user);
    const catalog = await listActiveCampaignsForInfluencer(influencer._id.toString());
    if (!catalog) {
        const e = new Error('Perfil de influencer no disponible');
        e.status = 404;
        throw e;
    }

    return {
        ok: true,
        verified: true,
        identity: {
            userId: String(user._id),
            email: user.email || null,
            influencerId: String(influencer._id),
            influencerStatus: influencer.status || null,
        },
        wallet: {
            address: wallet.address,
            preferredNetwork: wallet.preferredNetwork,
            source: walletSynced ? 'app' : wallet.source,
            syncedFromApp: walletSynced,
        },
        influencer: catalog.influencer,
        influencerProfileShortCode: catalog.influencerProfileShortCode,
        campaigns: catalog.campaigns,
        totalCampaigns: catalog.totalCampaigns,
        verifiedAt: new Date().toISOString(),
    };
}

module.exports = {
    normalizeWalletAddress,
    resolveWalletForUser,
    persistWalletForUser,
    listActiveCampaignsForInfluencer,
    buildInfluencerAppSession,
};
