'use strict';

const mongoose = require('mongoose');
const Influencer = require('../models/Influencer');
const InfluencerPromoShortCode = require('../models/InfluencerPromoShortCode');
const {
    ensureInfluencerHasProfileShortCode,
    computeDiscountPctFromPromotion,
} = require('./influencerPromoShortCodes');
const {
    normalizeWalletAddress,
    resolveWalletForUser,
    persistWalletForUser,
} = require('./influencerWallet');
const {
    getSettlementSummaryForInfluencer,
    settlementSummaryForPromotion,
    resolveCommissionUsd,
    isSettlementEnabled,
} = require('./influencerTokenSettlement');

const INFLUENCER_GENERAL_USERNAME = 'influencer-general';
const PROMOTION_CATALOG_SELECT =
    'title brand description currentPrice originalPrice currency discountPercentage status validFrom validUntil image redirectInsteadOfQr';

function mapPromoRowToCampaignEntry(d, influencer, settlementCtx = null) {
    const p = d.promotion;
    const discountPct = computeDiscountPctFromPromotion(p);
    const pid = p && p._id ? String(p._id) : null;
    let settlement = null;
    if (settlementCtx && pid) {
        const perPromo = settlementSummaryForPromotion(settlementCtx.summary, pid);
        settlement = {
            commissionPerRedemptionUsd: settlementCtx.commissionByPromo?.[pid] ?? null,
            pendingCount: perPromo.pendingCount,
            pendingAmountUsd: perPromo.pendingAmountUsd,
            paidCount: perPromo.paidCount,
            paidAmountUsd: perPromo.paidAmountUsd,
            tokenSymbol: settlementCtx.tokenSymbol || 'LUXAE',
            transferMethod: 'mongo_ledger',
        };
    }
    const redirectInsteadOfQr = Boolean(p?.redirectInsteadOfQr);
    const blocked = influencer.username === INFLUENCER_GENERAL_USERNAME;
    let issueMode = 'qr';
    if (blocked) issueMode = 'blocked';
    else if (redirectInsteadOfQr) issueMode = 'redirect';
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
        settlement,
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

    let settlementCtx = null;
    if (isSettlementEnabled()) {
        const summary = await getSettlementSummaryForInfluencer(influencerId);
        /** @type {Record<string, number>} */
        const commissionByPromo = {};
        for (const d of rows) {
            const p = d.promotion;
            if (p && p._id) {
                const pid = String(p._id);
                commissionByPromo[pid] = await resolveCommissionUsd(influencerId, pid);
            }
        }
        settlementCtx = {
            summary,
            commissionByPromo,
            tokenSymbol: process.env.INFLUENCER_SETTLEMENT_TOKEN_SYMBOL || 'LUXAE',
        };
    }

    const campaigns = rows
        .filter((d) => d.promotion && d.promotion.status === 'active')
        .map((d) => mapPromoRowToCampaignEntry(d, inf, settlementCtx));

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
        settlementsEnabled: isSettlementEnabled(),
        settlementSummary: settlementCtx?.summary || null,
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
        settlements: catalog.settlementsEnabled
            ? {
                  enabled: true,
                  transferMethod: 'mongo_ledger',
                  tokenSymbol: process.env.INFLUENCER_SETTLEMENT_TOKEN_SYMBOL || 'LUXAE',
                  payoutWallet: wallet.address,
                  payoutWalletRequired: !wallet.address,
                  summary: catalog.settlementSummary,
              }
            : { enabled: false },
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
