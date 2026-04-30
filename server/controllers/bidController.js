const mongoose = require('mongoose');
const Bid = require('../models/Bid');
const { getDisplayContractAddress, getPolygonscanAddressUrl } = require('../utils/polygonContract');

function isMongoConnected() {
    return mongoose.connection.readyState === 1;
}

const CATEGORY_LABELS = {
    electronics: 'Electrónica',
    fashion: 'Moda',
    home: 'Hogar',
    beauty: 'Belleza',
    sports: 'Deportes',
    books: 'Libros',
    food: 'Alimentos',
    other: 'General'
};

class BidController {
    /**
     * GET /api/bids/live
     * Pujas activas con promoción vigente, para dashboard en tiempo real (polling).
     */
    async getLive(req, res) {
        try {
            if (!isMongoConnected()) {
                return res.status(200).json({
                    success: true,
                    data: [],
                    summary: { total: 0, bySector: {}, avgAmountUsd: 0, maxAmountUsd: 0 },
                    generatedAt: new Date().toISOString(),
                    message: 'Sin conexión a BD'
                });
            }

            const now = new Date();
            const bidDocs = await Bid.find({ status: 'active' })
                .populate('influencer', 'name username avatar categories totalFollowers status')
                .populate('promotion', 'title brand category tags validUntil validFrom views conversions smartContract')
                .sort({ updatedAt: -1 })
                .limit(500)
                .lean();

            const feed = [];
            for (const b of bidDocs) {
                const promo = b.promotion;
                if (!promo || !promo.validUntil || new Date(promo.validUntil) < now) continue;

                const inf = b.influencer;
                if (!inf) continue;

                const infCats = Array.isArray(inf.categories) ? inf.categories.filter(Boolean) : [];
                const promoTags = Array.isArray(promo.tags) ? promo.tags.filter(Boolean) : [];
                const primarySector =
                    (infCats[0] && String(infCats[0]).trim()) ||
                    (promoTags[0] && String(promoTags[0]).trim()) ||
                    CATEGORY_LABELS[promo.category] ||
                    promo.category ||
                    'General';

                const amountUsd = Math.round((Number(b.amountUsd) || 1) * 100) / 100;
                const history = Array.isArray(b.bidHistory) ? b.bidHistory : [];
                const recentPujas = history.slice(-8).map((h) => ({
                    amount: Math.round((Number(h.amount) || amountUsd) * 100) / 100,
                    at: h.timestamp ? new Date(h.timestamp).toISOString() : null
                }));

                const promoIdStr = promo._id.toString();
                const smartContractAddress = getDisplayContractAddress(promoIdStr, promo.smartContract);
                const polygonscanUrl = getPolygonscanAddressUrl(smartContractAddress);

                feed.push({
                    bidId: b._id.toString(),
                    influencerId: inf._id.toString(),
                    influencerName: inf.name || 'Influencer',
                    influencerUsername: inf.username || '',
                    avatar: inf.avatar || '',
                    influencerCategories: infCats,
                    promotionId: promoIdStr,
                    campaignTitle: promo.title || 'Campaña',
                    brandName: promo.brand || '—',
                    amountUsd,
                    sector: primarySector,
                    sectorsLabel: infCats.length ? infCats : promoTags,
                    promoCategory: promo.category,
                    promoCategoryLabel: CATEGORY_LABELS[promo.category] || promo.category,
                    bidHistoryCount: history.length || 1,
                    recentPujas,
                    updatedAt: (b.updatedAt || b.createdAt || now).toISOString(),
                    validUntil: new Date(promo.validUntil).toISOString(),
                    smartContractAddress,
                    polygonscanUrl,
                    smartContractPagePath: `/promocion/${promoIdStr}/smart-contract`,
                    targetMetrics: {
                        reach: (promo.views || 0) * 10 || 5000,
                        conversions: promo.conversions || 0
                    }
                });
            }

            const bySector = {};
            let sum = 0;
            let maxAmt = 0;
            for (const row of feed) {
                const key = row.sector;
                if (!bySector[key]) {
                    bySector[key] = { count: 0, maxBid: 0, sumBid: 0 };
                }
                bySector[key].count += 1;
                bySector[key].sumBid += row.amountUsd;
                bySector[key].maxBid = Math.max(bySector[key].maxBid, row.amountUsd);
                sum += row.amountUsd;
                maxAmt = Math.max(maxAmt, row.amountUsd);
            }
            const n = feed.length || 1;
            const summary = {
                total: feed.length,
                bySector,
                avgAmountUsd: Math.round((sum / n) * 100) / 100,
                maxAmountUsd: Math.round(maxAmt * 100) / 100
            };

            return res.status(200).json({
                success: true,
                data: feed,
                summary,
                generatedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('❌ Error feed pujas live:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al cargar subastas',
                error: error.message
            });
        }
    }
}

module.exports = new BidController();
