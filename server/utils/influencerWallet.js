'use strict';

const UserProfile = require('../models/UserProfile');

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

module.exports = {
    normalizeWalletAddress,
    resolveWalletForUser,
    persistWalletForUser,
};
