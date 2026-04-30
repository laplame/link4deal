/**
 * Genera promociones de demo (por sector/categoría de influencers) y pujas (Bid) realistas
 * vinculadas a los influencers existentes y a sus categorías.
 *
 * Idempotente: no duplica par (influencer + promotion). Promos marcadas con tag "subasta-seed"
 * + la categoría literal del influencer.
 *
 * Uso:
 *   node server/scripts/seed-influencer-auctions.js
 *   node server/scripts/seed-influencer-auctions.js --dry-run
 *
 * Requiere: MongoDB (misma URI que .env / server/config).
 */

const { envPath } = require('../config/envPath');
require('dotenv').config({ path: envPath });
const mongoose = require('mongoose');
const database = require('../config/database');
const Influencer = require('../models/Influencer');
const Promotion = require('../models/Promotion');
const Bid = require('../models/Bid');

const SEED_TAG = 'subasta-seed';
const REALISTIC_AMOUNTS = [1.05, 1.15, 1.22, 1.28, 1.35, 1.42, 1.55, 1.68, 1.85, 2.1, 2.35];

const BRANDS_BY_ENUM = {
    electronics: ['TechNova', 'PixelHouse', 'SoundEdge'],
    fashion: ['Urban Thread', 'Áurea Moda', 'Loop Street'],
    home: ['Habitat+', 'Nido Home', 'Madera Viva'],
    beauty: ['GlowLab', 'SkinFirst', 'Natura Bloom'],
    sports: ['Momentum Fit', 'Ruta Trail', 'AquaSport'],
    books: ['Lectoría', 'Papel Nómada', 'Estante 12'],
    food: ['Café Origen', 'Bistro Norte', 'Fresh Bowl MX'],
    other: ['Marca Demo', 'Partner Co.', 'Retail MX']
};

function inferPromoCategory(label) {
    const s = String(label || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    if (/electron|tech|gadget|movil|mobile|audio/.test(s)) return 'electronics';
    if (/moda|fashion|ropa|style|wear/.test(s)) return 'fashion';
    if (/hogar|casa|home|decor|mueble/.test(s)) return 'home';
    if (/bellez|beauty|maquill|skincare|spa|cosmetic/.test(s)) return 'beauty';
    if (/deport|sport|fitness|gym|running/.test(s)) return 'sports';
    if (/libro|book|lectura|ebook/.test(s)) return 'books';
    if (/comida|food|bebida|restaurant|cafe|gastro|bar/.test(s)) return 'food';
    return 'other';
}

function pickBrand(catEnum) {
    const list = BRANDS_BY_ENUM[catEnum] || BRANDS_BY_ENUM.other;
    return list[Math.floor(Math.random() * list.length)];
}

function buildBidHistory(finalAmount, now) {
    const steps = 3 + Math.floor(Math.random() * 4);
    const start = Math.max(1, finalAmount - 0.12 * steps);
    const history = [];
    for (let i = 0; i < steps; i++) {
        const t = new Date(now.getTime() - (steps - i) * (8 + Math.random() * 20) * 60 * 60 * 1000);
        const amt = Math.round((start + ((finalAmount - start) * i) / Math.max(1, steps - 1)) * 100) / 100;
        history.push({ amount: Math.max(1, amt), timestamp: t });
    }
    history.push({ amount: Math.round(finalAmount * 100) / 100, timestamp: now });
    return history;
}

function promoMatchesInfluencer(promo, inf) {
    const tags = (promo.tags || []).map((t) => String(t).toLowerCase());
    const cats = (inf.categories || []).map((c) => String(c).toLowerCase().trim()).filter(Boolean);
    if (!cats.length) return false;
    return cats.some((c) => tags.some((t) => t === c || t.includes(c) || c.includes(t)));
}

async function ensurePromotionForCategory(rawCat, now, dryRun) {
    const label = String(rawCat || 'General').trim() || 'General';
    const catEnum = inferPromoCategory(label);
    const existing = await Promotion.findOne({
        tags: { $all: [label, SEED_TAG] },
        status: 'active',
        validUntil: { $gte: now }
    }).lean();

    if (existing) return existing;

    const title = `Campaña ${label} · comisión por venta`;
    const brand = pickBrand(catEnum);
    const doc = {
        title,
        description: `Oferta demo alineada al sector «${label}». Comisiones por cupón redimido.`,
        brand,
        category: catEnum,
        tags: [label, SEED_TAG, catEnum],
        status: 'active',
        validFrom: now,
        validUntil: new Date(now.getTime() + 62 * 24 * 60 * 60 * 1000),
        discountPercentage: Math.min(45, 15 + Math.floor(Math.random() * 25)),
        originalPrice: 100 + Math.floor(Math.random() * 400),
        currentPrice: 80 + Math.floor(Math.random() * 200),
        currency: 'MXN',
        isHotOffer: Math.random() > 0.7,
        views: 200 + Math.floor(Math.random() * 8000),
        conversions: Math.floor(Math.random() * 120)
    };

    if (dryRun) {
        console.log(`  [dry-run] crearía promo: "${title}" (${catEnum})`);
        return { _id: new mongoose.Types.ObjectId(), ...doc };
    }

    const created = await Promotion.create(doc);
    console.log(`  ✅ Promo creada: "${title}" — ${created._id}`);
    return created.toObject ? created.toObject() : created;
}

async function main() {
    const dryRun = process.argv.includes('--dry-run');

    try {
        await database.connect();
        if (!database.isConnected || mongoose.connection.readyState !== 1) {
            console.error('❌ No se pudo conectar a MongoDB.');
            process.exit(1);
        }

        const influencers = await Influencer.find({}).lean();
        if (!influencers.length) {
            console.log('⚠️ No hay influencers en la BD. Crea perfiles primero (InfluencerSetup).');
            await mongoose.connection.close();
            process.exit(0);
        }

        const categorySet = new Set();
        for (const inf of influencers) {
            const cats = Array.isArray(inf.categories) ? inf.categories : [];
            if (cats.length) {
                for (const c of cats) {
                    if (c && String(c).trim()) categorySet.add(String(c).trim());
                }
            } else {
                categorySet.add('General');
            }
        }

        const uniqueCats = [...categorySet];
        console.log(`📂 Categorías / sectores detectados (${uniqueCats.length}):`, uniqueCats.join(', '));

        const now = new Date();
        const promotionByKey = new Map();

        for (const cat of uniqueCats) {
            const p = await ensurePromotionForCategory(cat, now, dryRun);
            promotionByKey.set(String(cat).toLowerCase(), p);
        }

        let allSeedPromos = await Promotion.find({
            tags: SEED_TAG,
            status: 'active',
            validUntil: { $gte: now }
        }).lean();

        if (dryRun) {
            allSeedPromos = [...promotionByKey.values()].filter(Boolean);
        }

        let created = 0;
        let skipped = 0;

        for (const inf of influencers) {
            const cats = Array.isArray(inf.categories) && inf.categories.length
                ? inf.categories.map((c) => String(c).trim()).filter(Boolean)
                : ['General'];

            let candidates = allSeedPromos.filter((p) => promoMatchesInfluencer(p, { ...inf, categories: cats }));
            if (!candidates.length) {
                candidates = allSeedPromos;
            }

            const pickCount = Math.min(2, candidates.length || 0);
            const chosen = [];
            const pool = [...candidates].sort(() => Math.random() - 0.5);
            for (let i = 0; i < pickCount; i++) {
                if (pool[i]) chosen.push(pool[i]);
            }

            if (!chosen.length) {
                console.log(`  ⚠️ Sin promoción asignable para influencer ${inf._id} (${inf.name || inf.username || 'sin nombre'})`);
                continue;
            }

            for (let j = 0; j < chosen.length; j++) {
                const promo = chosen[j];
                const promoId = promo._id;
                const existing = dryRun
                    ? null
                    : await Bid.findOne({ influencer: inf._id, promotion: promoId }).lean();
                if (existing) {
                    skipped++;
                    continue;
                }

                const amountUsd =
                    REALISTIC_AMOUNTS[(inf.name || '').length % REALISTIC_AMOUNTS.length] +
                    j * 0.07 +
                    Math.round(Math.random() * 15) / 100;
                const finalAmt = Math.max(1, Math.round(amountUsd * 100) / 100);
                const bidHistory = buildBidHistory(finalAmt, new Date(now.getTime() - j * 60000));

                if (dryRun) {
                    console.log(
                        `  [dry-run] bid: influencer ${inf.name || inf.username} → promo ${promo.title} ($${finalAmt} USD)`
                    );
                    created++;
                    continue;
                }

                await Bid.create({
                    influencer: inf._id,
                    promotion: promoId,
                    amountUsd: finalAmt,
                    status: 'active',
                    bidHistory
                });
                created++;
                console.log(
                    `  💵 Puja: ${inf.name || inf.username || inf._id} → "${promo.title}" @ $${finalAmt} USD/venta (${cats[0] || 'General'})`
                );
            }
        }

        console.log(`\n✅ Listo. Pujas nuevas: ${created}. Omitidas (ya existían): ${skipped}.`);
        if (dryRun) console.log('(Modo dry-run: no se escribió en la BD.)');
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('Conexión cerrada.');
    }
}

main();
