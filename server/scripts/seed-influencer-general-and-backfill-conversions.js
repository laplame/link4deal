/**
 * 1) Crea o asegura el influencer "Influencer General" (conversiones no reclamadas por ningún influencer).
 * 2) Crea registros de éxito (PromotionConversion) por cada promoción con conversions > 0,
 *    atribuidos a "Influencer General", para que queden registrados como éxito.
 *
 * Uso (desde raíz del proyecto):
 *   node server/scripts/seed-influencer-general-and-backfill-conversions.js
 */

const path = require('path');
const { envPath } = require('../config/envPath');
require('dotenv').config({ path: envPath });
const mongoose = require('mongoose');
const database = require('../config/database');
const Influencer = require('../models/Influencer');
const Promotion = require('../models/Promotion');
const PromotionConversion = require('../models/PromotionConversion');

const GENERAL_USERNAME = 'influencer-general';
const GENERAL_NAME = 'Influencer General';

async function ensureInfluencerGeneral() {
    let general = await Influencer.findOne({ username: GENERAL_USERNAME }).lean();
    if (general) {
        console.log('✅ Influencer General ya existe:', general._id.toString());
        return general._id;
    }
    const doc = await Influencer.create({
        name: GENERAL_NAME,
        username: GENERAL_USERNAME,
        status: 'active',
        totalFollowers: 0,
        completedPromotions: 0,
        activePromotions: 0,
        totalEarnings: 0,
        monthlyEarnings: 0,
        couponStats: {
            totalCoupons: 0,
            activeCoupons: 0,
            totalSales: 0,
            totalCommission: 0,
            averageConversion: 0
        }
    });
    console.log('✅ Creado Influencer General:', doc._id.toString());
    return doc._id;
}

async function backfillConversionsToGeneral(generalInfluencerId) {
    const promotions = await Promotion.find({
        $or: [
            { conversions: { $gt: 0 } },
            { conversions: { $exists: false } }
        ]
    }).lean();

    let created = 0;
    let skipped = 0;
    for (const promo of promotions) {
        const conversions = promo.conversions || 0;
        if (conversions <= 0) continue;

        const existing = await PromotionConversion.findOne({
            promotion: promo._id,
            influencer: generalInfluencerId,
            source: 'general'
        });
        if (existing) {
            skipped++;
            continue;
        }

        await PromotionConversion.create({
            promotion: promo._id,
            influencer: generalInfluencerId,
            quantity: conversions,
            source: 'general',
            note: 'Atribución a Influencer General: promoción no reclamada por ningún influencer.'
        });
        created++;
        console.log(`  Promoción ${promo._id} (${promo.title || promo._id}): ${conversions} conversión(es) → Influencer General`);
    }
    console.log(`✅ Backfill: ${created} registros creados, ${skipped} ya existían.`);
    return { created, skipped };
}

async function main() {
    try {
        await database.connect();
        if (!database.isConnected || mongoose.connection.readyState !== 1) {
            console.error('❌ No se pudo conectar a MongoDB.');
            process.exit(1);
        }

        const generalId = await ensureInfluencerGeneral();
        await backfillConversionsToGeneral(generalId);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('Conexión cerrada.');
    }
}

main();
