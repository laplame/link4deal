/**
 * Reasigna payload.influencerId en DiscountQrToken (cupones QR) para corregir atribución errónea
 * (p. ej. literal "guest" cuando la venta/canje correspondía a un influencer concreto).
 *
 * No modifica el texto del QR ya impreso (el tokenId sigue igual); la app y los listados usan el documento en BD.
 *
 * Por defecto sólo muestra un resumen y una muestra de documentos (--dry-run implícito).
 * Para ejecutar escritura: pasar explícitamente --apply junto con --to <ObjectId válido influencer>.
 *
 * Ejemplos:
 *   node server/scripts/reassign-discount-qr-influencer.js --from guest --promotion-id 69fb8c2100fd7f1ab7656671 --to 507f1f77bcf86cd799439011
 *   node server/scripts/reassign-discount-qr-influencer.js --apply --from guest --promotion-id 69fb8c2100fd7f1ab7656671 --to 507f1f77bcf86cd799439011
 *   node server/scripts/reassign-discount-qr-influencer.js --apply --from guest,guest,GUEST --redeemed-only --to 507f1f77bcf86cd799439011
 *   node server/scripts/reassign-discount-qr-influencer.js --apply --token-id pZkom6CQ3erO --token-id otroId --to 507f1f77bcf86cd799439011
 */
'use strict';

require('../config/envPath');
const mongoose = require('mongoose');
const { normalizeAtlasUri } = require('../utils/normalizeAtlasUri');
const DiscountQrToken = require('../models/DiscountQrToken');
const Influencer = require('../models/Influencer');

function getMongoUri() {
    const atlas = normalizeAtlasUri(process.env.MONGODB_URI_ATLAS);
    if (atlas) return atlas;
    const local = process.env.MONGODB_URI != null ? String(process.env.MONGODB_URI).trim() : '';
    return local || '';
}

/**
 * @param {string[]} argv
 * @returns {{
 *   apply: boolean,
 *   from: string[],
 *   to: string | null,
 *   promotionId: string | null,
 *   tokenIds: string[],
 *   redeemedOnly: boolean,
 *   limitPreview: number,
 *   help: boolean,
 * }}
 */
function parseArgs(argv) {
    const out = {
        apply: false,
        from: ['guest'],
        to: null,
        promotionId: null,
        tokenIds: [],
        redeemedOnly: false,
        limitPreview: 30,
        help: false,
    };
    for (let i = 2; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--apply') out.apply = true;
        else if (a === '--help' || a === '-h') out.help = true;
        else if (a === '--from' && argv[i + 1]) {
            out.from = argv[++i]
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
        } else if (a === '--to' && argv[i + 1]) out.to = argv[++i].trim();
        else if (a === '--promotion-id' && argv[i + 1]) out.promotionId = argv[++i].trim();
        else if (a === '--token-id' && argv[i + 1]) out.tokenIds.push(argv[++i].trim());
        else if (a === '--redeemed-only') out.redeemedOnly = true;
        else if (a === '--limit-preview' && argv[i + 1]) out.limitPreview = Math.max(1, parseInt(argv[++i], 10) || 30);
    }
    return out;
}

function printHelp() {
    console.log(`
reassign-discount-qr-influencer.js

  --to <ObjectId>        Influencer destino en BD (obligatorio con --apply; opcional en dry-run si sólo exploras coincidencias)
  --from <lista>         Valores actuales de payload.influencerId a reemplazar (coma-separados). Default: guest
                         Si incluyes "guest", también se buscan variantes de mayúsculas comunes.
  --promotion-id <id>    Sólo cupones cuyo payload.promotionId coincide (string u ObjectId)
  --token-id <id>        Filtrar por tokenId (repetible). Si se usa, --from puede seguir restringiendo.
  --redeemed-only        Sólo documentos con usedAt definido (canjes / “ventas” registradas)
  --apply                Escribir en BD (sin esto, sólo listado y conteo)
  --limit-preview <n>    Cuántos documentos mostrar en muestra (default 30)
  --help

Conexión: MONGODB_URI_ATLAS o MONGODB_URI (local).
`);
}

function expandFromMatchValues(fromList) {
    const set = new Set();
    for (const raw of fromList) {
        const v = String(raw).trim();
        if (!v) continue;
        set.add(v);
        if (v.toLowerCase() === 'guest') {
            set.add('guest');
            set.add('Guest');
            set.add('GUEST');
        }
    }
    return Array.from(set);
}

/**
 * @param {ReturnType<typeof parseArgs>} opts
 */
function buildFilter(opts) {
    const and = [];

    if (opts.tokenIds.length > 0) {
        and.push({ tokenId: { $in: opts.tokenIds } });
    }

    const fromVals = expandFromMatchValues(opts.from);
    const orFrom = [];
    for (const val of fromVals) {
        orFrom.push({ 'payload.influencerId': val });
        if (mongoose.Types.ObjectId.isValid(val) && String(val).length === 24) {
            try {
                orFrom.push({ 'payload.influencerId': new mongoose.Types.ObjectId(val) });
            } catch {
                /* ignore */
            }
        }
    }
    if (orFrom.length === 1) and.push(orFrom[0]);
    else and.push({ $or: orFrom });

    if (opts.promotionId) {
        const pid = opts.promotionId;
        const orPromo = [{ 'payload.promotionId': pid }];
        if (mongoose.Types.ObjectId.isValid(pid) && pid.length === 24) {
            try {
                orPromo.push({ 'payload.promotionId': new mongoose.Types.ObjectId(pid) });
            } catch {
                /* ignore */
            }
        }
        and.push(orPromo.length === 1 ? orPromo[0] : { $or: orPromo });
    }

    if (opts.redeemedOnly) {
        and.push({ usedAt: { $type: 'date' } });
    }

    return and.length === 1 ? and[0] : { $and: and };
}

function rowBrief(doc) {
    const p = doc.payload || {};
    return {
        tokenId: doc.tokenId,
        promotionId: p.promotionId != null ? String(p.promotionId) : null,
        influencerIdWas: p.influencerId != null ? String(p.influencerId) : null,
        usedAt: doc.usedAt || null,
        referralCode: p.referralCode != null ? String(p.referralCode).slice(0, 24) : null,
    };
}

async function main() {
    const opts = parseArgs(process.argv);

    if (opts.help || process.argv.length <= 2) {
        printHelp();
        process.exit(opts.help ? 0 : 1);
    }

    if (opts.apply && !opts.to) {
        console.error('Con --apply es obligatorio --to <ObjectId del influencer>.');
        process.exit(1);
    }

    if (opts.to && !mongoose.Types.ObjectId.isValid(opts.to)) {
        console.error('--to no es un ObjectId válido:', opts.to);
        process.exit(1);
    }

    const uri = getMongoUri();
    if (!uri) {
        console.error('No hay URI MongoDB: define MONGODB_URI_ATLAS o MONGODB_URI.');
        process.exit(1);
    }

    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 20000,
        bufferCommands: false,
    });

    if (opts.to) {
        const targetInf = await Influencer.findById(opts.to).select('name username').lean();
        if (!targetInf) {
            console.warn(
                'Advertencia: no existe documento Influencer con _id',
                opts.to,
                '(el update igualmente pondrá ese string en payload).'
            );
        } else {
            console.log('\nInfluencer destino:', { id: opts.to, name: targetInf.name, username: targetInf.username });
        }
    } else {
        console.log('\n(sin --to: vista previa de coincidencias solamente)');
    }

    const filter = buildFilter(opts);
    const total = await DiscountQrToken.countDocuments(filter);

    console.log('\nModo:', opts.apply ? 'APLICAR CAMBIOS (--apply)' : 'Sólo lectura (dry-run)');
    console.log('Filtro resumido:', JSON.stringify(filter, null, 2));
    console.log('Documentos que coinciden:', total);

    const sample = await DiscountQrToken.find(filter)
        .select('tokenId payload usedAt')
        .sort({ usedAt: -1, createdAt: -1 })
        .limit(opts.limitPreview)
        .lean();

    console.log('\nMuestra (hasta', opts.limitPreview, '):');
    for (const d of sample) console.log(JSON.stringify(rowBrief(d)));

    if (!opts.apply) {
        console.log(
            '\nNo se modificó nada. Para escribir: --apply --to <ObjectId> … (payload.influencerId quedará como el --to).'
        );
        await mongoose.disconnect();
        return;
    }

    if (opts.apply && !opts.promotionId && opts.tokenIds.length === 0 && total > 0) {
        console.warn(
            '\n⚠️  --apply sin --promotion-id ni --token-id: afecta TODOS los cupones que coincidan con --from en toda la BD.'
        );
    }

    const upd = await DiscountQrToken.updateMany(filter, {
        $set: { 'payload.influencerId': opts.to },
    });

    console.log('\n✅ updateMany ejecutado:', {
        matchedCount: upd.matchedCount,
        modifiedCount: upd.modifiedCount,
    });

    await mongoose.disconnect();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
