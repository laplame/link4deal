/**
 * Diagnóstico: influencer vs promoción Café (QR, pujas, solicitudes).
 * Uso: node server/scripts/diagnose-influencer-cafe-promotion.js [influencerId]
 */
'use strict';

require('../config/envPath');
const mongoose = require('mongoose');
const { normalizeAtlasUri } = require('../utils/normalizeAtlasUri');
const Promotion = require('../models/Promotion');
const DiscountQrToken = require('../models/DiscountQrToken');
const Bid = require('../models/Bid');
const PromotionApplication = require('../models/PromotionApplication');
const Influencer = require('../models/Influencer');

const INFL_DEFAULT = '69d7dfc5fde91526607458d9';

async function main() {
    const influencerId = (process.argv[2] || INFL_DEFAULT).trim();
    if (!mongoose.Types.ObjectId.isValid(influencerId)) {
        console.error('Invalid ObjectId');
        process.exit(1);
    }

    const uri = normalizeAtlasUri(process.env.MONGODB_URI_ATLAS);
    if (!uri) {
        console.error('MONGODB_URI_ATLAS no configurado: no puedo consultar la BD.');
        process.exit(1);
    }

    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 15000,
        bufferCommands: false,
    });

    const oid = new mongoose.Types.ObjectId(influencerId);
    const inf = await Influencer.findById(influencerId).select('name username').lean();

    console.log('\n=== Influencer ===');
    console.log(inf ? { id: influencerId, name: inf.name, username: inf.username } : 'NOT FOUND in influencers collection');

    const cafeRegex = /\b(ca[fé]|cafe|coffee|cafeter)/i;

    const cafePromos = await Promotion.find({
        $or: [{ title: { $regex: cafeRegex } }, { brand: { $regex: cafeRegex } }, { description: { $regex: cafeRegex } }],
    })
        .select('title brand status validFrom validUntil shopId seller')
        .lean()
        .limit(40);

    console.log('\n=== Promotions matching Café / Cafe / Coffee ===');
    console.log('count:', cafePromos.length);
    for (const p of cafePromos) {
        console.log({
            id: String(p._id),
            title: p.title,
            brand: p.brand,
            status: p.status,
            shopId: p.shopId || null,
            validUntil: p.validUntil,
        });
    }

    const matchInf = { $or: [{ 'payload.influencerId': influencerId }, { 'payload.influencerId': oid }] };

    const tokenCount = await DiscountQrToken.countDocuments(matchInf);

    const byPromo = await DiscountQrToken.aggregate([
        { $match: matchInf },
        {
            $addFields: {
                pid: {
                    $cond: [
                        { $or: [{ $eq: ['$payload.promotionId', null] }, { $eq: ['$payload.promotionId', ''] }] },
                        '__missing__',
                        { $toString: '$payload.promotionId' },
                    ],
                },
            },
        },
        { $group: { _id: '$pid', n: { $sum: 1 }, redeemed: { $sum: { $cond: [{ $ne: ['$usedAt', null] }, 1, 0] } } } },
        { $sort: { n: -1 } },
        { $limit: 25 },
    ]);

    console.log('\n=== DiscountQrToken for this influencerId ===');
    console.log('total tokens:', tokenCount);
    console.log('by promotionId (top 25):');
    for (const g of byPromo) console.log(`  ${_idStr(g._id)}  total=${g.n}  redeemed=${g.redeemed}`);

    const cafeIds = new Set(cafePromos.map((p) => String(p._id)));
    const linkedCafePromos = byPromo.filter((g) => cafeIds.has(String(g._id)));

    console.log('\n=== Overlap Café-named promos vs QR tokens ===');
    console.log(linkedCafePromos.length ? linkedCafePromos : 'No QR tokens for Café-titled promos from search above.');

    const bids = await Bid.find({ influencer: influencerId })
        .populate('promotion', 'title brand status validUntil shopId')
        .lean();

    console.log('\n=== Bids (this influencer) ===');
    console.log('count:', bids.length);
    for (const b of bids) {
        const pr = b.promotion;
        console.log({
            bidStatus: b.status,
            promotionId: pr ? String(pr._id) : null,
            title: pr?.title,
            promoShopId: pr?.shopId,
        });
    }

    const apps = await PromotionApplication.find({ influencerApplicant: oid })
        .populate('promotion', 'title brand shopId status')
        .select('promotion status createdAt')
        .lean();

    console.log('\n=== PromotionApplications (influencerApplicant = id) ===');
    console.log('count:', apps.length);
    for (const a of apps) {
        const pr = a.promotion;
        console.log({
            status: a.status,
            promoId: pr ? String(pr._id) : null,
            title: pr?.title,
            shopId: pr?.shopId,
        });
    }

    await mongoose.disconnect();
}

function _idStr(x) {
    if (x === '__missing__') return '(missing promotionId)';
    return String(x);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
