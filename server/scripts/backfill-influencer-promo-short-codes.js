#!/usr/bin/env node
'use strict';

/**
 * Crea registros en `influencer_promo_short_codes` para emparejar influencers con promociones
 * conocidas por el sistema (misma lógica que `ensureInfluencerPromoShortCodes.js`).
 *
 * Uso:
 *   node server/scripts/backfill-influencer-promo-short-codes.js
 *   node server/scripts/backfill-influencer-promo-short-codes.js --dry-run
 *   node server/scripts/backfill-influencer-promo-short-codes.js --influencer=<ObjectId>
 */

const { envPath } = require('../config/envPath');
require('dotenv').config({ path: envPath });
const mongoose = require('mongoose');
const database = require('../config/database');
const Influencer = require('../models/Influencer');
const {
    collectPromotionIdsForInfluencer,
    existingPromotionIdsForInfluencer,
    ensurePromoShortCodesForInfluencer,
} = require('../utils/ensureInfluencerPromoShortCodes');

const INFLUENCER_GENERAL_USERNAME = 'influencer-general';

function parseCli(argv) {
    let dryRun = false;
    let influencerOnly = null;
    for (let i = 2; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--dry-run') dryRun = true;
        else if (a.startsWith('--influencer=')) influencerOnly = a.slice('--influencer='.length).trim();
    }
    return { dryRun, influencerOnly };
}

async function main() {
    const { dryRun, influencerOnly } = parseCli(process.argv);

    try {
        await database.connect();
        if (!database.isConnected || mongoose.connection.readyState !== 1) {
            console.error('❌ No se pudo conectar a MongoDB.');
            process.exit(1);
        }

        const query = { username: { $ne: INFLUENCER_GENERAL_USERNAME } };
        if (influencerOnly) {
            if (!mongoose.Types.ObjectId.isValid(influencerOnly)) {
                console.error('❌ --influencer= debe ser un ObjectId válido.');
                process.exit(1);
            }
            query._id = influencerOnly;
        }

        const influencers = await Influencer.find(query).select('_id name username').sort({ _id: 1 }).lean();

        let created = 0;
        let skippedNoPromotionData = 0;
        let skippedAllPairsAlreadyHadCode = 0;
        let errors = 0;

        for (const inf of influencers) {
            const iid = String(inf._id);
            const candidates = await collectPromotionIdsForInfluencer(iid);
            const already = await existingPromotionIdsForInfluencer(iid);

            const toCreate = candidates.filter((pid) => !already.has(pid));

            if (toCreate.length === 0) {
                if (candidates.length === 0) skippedNoPromotionData++;
                else skippedAllPairsAlreadyHadCode++;
                continue;
            }

            if (dryRun) {
                for (const promoId of toCreate) {
                    console.log(
                        `[dry-run] crear código · influencer=${iid} (${inf.name || inf.username || '?'}) · promotion=${promoId}`,
                    );
                    created++;
                }
                continue;
            }

            const r = await ensurePromoShortCodesForInfluencer(iid, { includeEnvDefaults: false });
            created += r.created;
            errors += r.errors;
            if (r.created > 0) {
                console.log(`✅ ${iid}: +${r.created} código(s) (${inf.name || inf.username || iid})`);
            }
        }

        console.log('');
        console.log(dryRun ? '--- Dry-run (sin escrituras en BD) ---' : '--- Backfill aplicado ---');
        console.log(`Influencers analizados: ${influencers.length}`);
        console.log(`Códigos ${dryRun ? 'que se crearían' : 'nuevos creados'}: ${created}`);
        console.log(
            `Sin promoción enlazada (bids/aprobaciones/recientes/token QR): ${skippedNoPromotionData} influencers`,
        );
        console.log(
            `Con promos conocidas pero ya tenían código para todos los pares: ${skippedAllPairsAlreadyHadCode} influencers`,
        );
        console.log(`Errores al crear (promo borrada, colisión código, etc.): ${errors}`);

        await mongoose.connection.close();
        process.exit(errors > 0 && !dryRun ? 1 : 0);
    } catch (e) {
        console.error('❌ Fallo script:', e);
        try {
            await mongoose.connection.close();
        } catch {
            /* ignore */
        }
        process.exit(1);
    }
}

main();
