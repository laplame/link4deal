/**
 * Lista canjes (DiscountQrToken con usedAt) en un día civil concreto.
 *
 * Uso:
 *   node server/scripts/list-redemptions-by-day.js
 *   node server/scripts/list-redemptions-by-day.js 2026-05-12
 *
 * Sin argumento: usa el día actual en la zona LIST_REDEMPTIONS_TZ (por defecto America/Mexico_City).
 * Con YYYY-MM-DD: ese día en la misma zona.
 *
 * Requiere MONGODB_URI_ATLAS (mismo esquema que otros scripts del repo).
 *
 * MongoDB Compass / shell (colección discountqrtokens), mismo criterio en UTC:
 *   ver comentario QUERY_UTC al final del archivo.
 */
'use strict';

require('../config/envPath');
const mongoose = require('mongoose');
const { normalizeAtlasUri } = require('../utils/normalizeAtlasUri');
const DiscountQrToken = require('../models/DiscountQrToken');

const DEFAULT_TZ = process.env.LIST_REDEMPTIONS_TZ || 'America/Mexico_City';

/**
 * YYYY-MM-DD del instante `date` en zona IANA.
 * @param {Date} date
 * @param {string} timeZone
 */
function ymdInZone(date, timeZone) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date);
    const get = (t) => parts.find((p) => p.type === t)?.value;
    return `${get('year')}-${get('month')}-${get('day')}`;
}

/**
 * Inicio local 00:00 y fin exclusivo (siguiente 00:00) para un Y-M-D en zona.
 * Barrido por minutos alrededor del mediodía UTC del calendario (suficiente para cualquier offset IANA).
 * @param {number} y
 * @param {number} m 1-12
 * @param {number} d 1-31
 * @param {string} timeZone
 * @returns {{ start: Date, end: Date }}
 */
function localDayBoundsUtc(y, m, d, timeZone) {
    const target = `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const anchor = Date.UTC(y, m - 1, d, 12, 0, 0);
    let firstMin = null;
    for (let t = anchor - 50 * 3600000; t <= anchor + 50 * 3600000; t += 60000) {
        if (ymdInZone(new Date(t), timeZone) === target) {
            firstMin = t;
            break;
        }
    }
    if (firstMin == null) {
        throw new Error(`No se encontró el día ${target} en zona ${timeZone} (revisa la fecha).`);
    }
    let startMs = firstMin;
    while (startMs > 0 && ymdInZone(new Date(startMs - 1), timeZone) === target) {
        startMs -= 1;
    }
    const partsStart = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).formatToParts(new Date(startMs));
    const h0 = +partsStart.find((p) => p.type === 'hour')?.value;
    const m0 = +partsStart.find((p) => p.type === 'minute')?.value;
    const s0 = +partsStart.find((p) => p.type === 'second')?.value;
    startMs -= ((h0 * 60 + m0) * 60 + s0) * 1000;

    const endMs = startMs + 86400000;
    return { start: new Date(startMs), end: new Date(endMs) };
}

function parseYmdArg(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
    if (!m) return null;
    const y = +m[1];
    const mo = +m[2];
    const d = +m[3];
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    return { y, m: mo, d };
}

async function main() {
    const arg = process.argv[2];
    const tz = DEFAULT_TZ;

    let y;
    let mo;
    let d;
    if (arg) {
        const p = parseYmdArg(arg);
        if (!p) {
            console.error('Argumento inválido. Usa YYYY-MM-DD o sin argumento para hoy en', tz);
            process.exit(1);
        }
        y = p.y;
        mo = p.m;
        d = p.d;
    } else {
        const now = new Date();
        const ymd = ymdInZone(now, tz);
        const p = parseYmdArg(ymd);
        if (!p) {
            console.error('No se pudo calcular la fecha de hoy en zona', tz);
            process.exit(1);
        }
        y = p.y;
        mo = p.m;
        d = p.d;
    }

    const { start, end } = localDayBoundsUtc(y, mo, d, tz);

    const uri = normalizeAtlasUri(process.env.MONGODB_URI_ATLAS);
    if (!uri) {
        console.error('MONGODB_URI_ATLAS no configurado.');
        process.exit(1);
    }

    await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000, bufferCommands: false });

    const filter = {
        usedAt: { $gte: start, $lt: end },
    };

    const count = await DiscountQrToken.countDocuments(filter);
    const rows = await DiscountQrToken.find(filter)
        .sort({ usedAt: -1 })
        .select('tokenId usedAt expiresAt createdAt payload.referralCode payload.promotionId payload.influencerId payload.shopId redeemedBy.readerDeviceId redeemedBy.idempotencyKey')
        .limit(500)
        .lean();

    console.log('\n=== Redenciones por día (DiscountQrToken.usedAt) ===');
    console.log('Zona horaria:', tz);
    console.log('Día civil:', `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    console.log('Rango UTC usado en query:');
    console.log('  $gte', start.toISOString());
    console.log('  $lt ', end.toISOString());
    console.log('\nTotal documentos con usedAt en ese rango:', count);
    if (count > rows.length) {
        console.log('(Mostrando como máximo', rows.length, 'filas; sube el limit en el script si hace falta.)');
    }

    if (rows.length === 0) {
        console.log('\n(i) Cero canjes en ese intervalo. Posibles causas:');
        console.log('    · TZ distinta (prueba LIST_REDEMPTIONS_TZ=UTC y fecha explícita).');
        console.log('    · Canjes con fecha en otro día local.');
        console.log('    · TTL borró docs (expiresAt); revisa QR_REDEEM_RETENTION_DAYS.');
        console.log('    · Canje nunca llegó a POST /api/discount-qr/redeem en este cluster.');
    }

    for (const doc of rows) {
        const p = doc.payload || {};
        console.log('\n---');
        console.log('usedAt:  ', doc.usedAt ? new Date(doc.usedAt).toISOString() : null);
        console.log('tokenId: ', doc.tokenId);
        console.log('code:    ', p.referralCode ?? '—');
        console.log('promo:   ', p.promotionId ?? '—');
        console.log('influencer:', p.influencerId ?? '—');
        console.log('shopId(payload):', p.shopId ?? '—');
        const rb = doc.redeemedBy || {};
        console.log('POS device:', rb.readerDeviceId ?? '—');
        console.log('idempotencyKey:', rb.idempotencyKey ?? '—');
    }

    const near = await DiscountQrToken.countDocuments({
        usedAt: { $gte: new Date(start.getTime() - 48 * 3600000), $lt: new Date(end.getTime() + 48 * 3600000) },
    });
    console.log('\n--- Contexto 48h antes/después del rango (conteo usedAt):', near);

    const verifyScans = await DiscountQrToken.countDocuments({
        lastVerifiedAt: { $gte: start, $lt: end },
    });
    console.log('Documentos con lastVerifiedAt (scan/verify) en el mismo rango:', verifyScans);
    console.log('(Si hay verify y cero canjes, el POS pudo validar sin llegar a redeem.)');

    await mongoose.disconnect();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});

/*
MongoDB Compass / mongosh — colección discountqrtokens

Día civil en UTC (ej. 12 may 2026):

const s = ISODate("2026-05-12T00:00:00.000Z");
const e = ISODate("2026-05-13T00:00:00.000Z");
db.discountqrtokens.find({ usedAt: { $gte: s, $lt: e } }).sort({ usedAt: -1 }).limit(100);
db.discountqrtokens.countDocuments({ usedAt: { $gte: s, $lt: e } });

Últimas 24h desde ahora:

const since = new Date(Date.now() - 24*60*60*1000);
db.discountqrtokens.find({ usedAt: { $gte: since } }).sort({ usedAt: -1 });

Solo escaneos verify ese día UTC (sin obligar canje):

db.discountqrtokens.countDocuments({ lastVerifiedAt: { $gte: s, $lt: e } });
*/
