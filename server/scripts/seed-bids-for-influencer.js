/**
 * Crea pujas realistas (bids) para un influencer sobre promociones activas y vigentes.
 * Montos en USD por venta, ej: 1.2, 1.35, 1.5 (comisión por venta).
 *
 * Uso: node server/scripts/seed-bids-for-influencer.js [influencerId]
 * Por defecto usa: 69ac5c693f1bd4ba748d3266
 */

const { envPath } = require('../config/envPath');
require('dotenv').config({ path: envPath });
const mongoose = require('mongoose');
const database = require('../config/database');
const Influencer = require('../models/Influencer');
const Promotion = require('../models/Promotion');
const Bid = require('../models/Bid');

const DEFAULT_INFLUENCER_ID = '69ac5c693f1bd4ba748d3266';
const REALISTIC_AMOUNTS_USD = [1.2, 1.35, 1.5, 1.25, 1.4, 1.6, 1.15, 1.45];

async function main() {
    const influencerId = process.argv[2] || DEFAULT_INFLUENCER_ID;
    try {
        await database.connect();
        if (!database.isConnected || mongoose.connection.readyState !== 1) {
            console.error('❌ No se pudo conectar a MongoDB.');
            process.exit(1);
        }
        const influencer = await Influencer.findById(influencerId).lean();
        if (!influencer) {
            console.error('❌ Influencer no encontrado:', influencerId);
            process.exit(1);
        }
        const now = new Date();
        const promotions = await Promotion.find({
            status: 'active',
            validUntil: { $gte: now }
        }).select('_id title brand validFrom validUntil').lean();

        if (promotions.length === 0) {
            console.log('⚠️ No hay promociones activas y vigentes. Crea al menos una con status=active y validUntil en el futuro.');
            await mongoose.connection.close();
            process.exit(0);
        }

        let created = 0;
        let skipped = 0;
        for (let i = 0; i < promotions.length; i++) {
            const promo = promotions[i];
            const existing = await Bid.findOne({ influencer: influencerId, promotion: promo._id }).lean();
            if (existing) {
                skipped++;
                continue;
            }
            const amountUsd = REALISTIC_AMOUNTS_USD[i % REALISTIC_AMOUNTS_USD.length];
            const initialAmount = Math.max(1, amountUsd - 0.2);
            await Bid.create({
                influencer: influencerId,
                promotion: promo._id,
                amountUsd,
                status: 'active',
                bidHistory: [
                    { amount: initialAmount, timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
                    { amount: initialAmount + 0.1, timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
                    { amount: amountUsd, timestamp: now }
                ]
            });
            created++;
            console.log(`  Promo "${promo.title || promo._id}": $${amountUsd} USD por venta`);
        }
        console.log(`✅ Bids: ${created} creados, ${skipped} ya existían.`);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('Conexión cerrada.');
    }
}

main();
