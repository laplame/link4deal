#!/usr/bin/env node
/**
 * Rellena username (si vacío) y asegura slug público coherente.
 *   node server/scripts/backfill-influencer-public-slug.js
 *   SLUG=luccylamademoiselita node server/scripts/backfill-influencer-public-slug.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const database = require('../config/database');
const Influencer = require('../models/Influencer');
const { resolveCanonicalPublicSlug, docMatchesPublicSlug } = require('../utils/influencerSlug');

const TARGET = (process.env.SLUG || '').trim();

async function main() {
    await database.connect();
    if (!database.isReady()) {
        console.error('❌ Sin MongoDB');
        process.exit(1);
    }

    const docs = await Influencer.find({ username: { $ne: 'influencer-general' } }).lean();
    let updated = 0;

    for (const doc of docs) {
        if (TARGET && !docMatchesPublicSlug(doc, TARGET)) continue;
        const canonical = resolveCanonicalPublicSlug(doc);
        if (!canonical) continue;
        const patch = {};
        if (!doc.username || !String(doc.username).trim()) {
            patch.username = canonical;
        }
        if (Object.keys(patch).length) {
            await Influencer.updateOne({ _id: doc._id }, { $set: patch });
            console.log('✅', doc.name, '→ username:', patch.username);
            updated += 1;
        }
    }

    console.log(`Listo. ${updated} influencer(s) actualizados.`);
    await mongoose.connection.close();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
