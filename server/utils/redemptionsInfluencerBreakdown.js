'use strict';

const mongoose = require('mongoose');
const DiscountQrToken = require('../models/DiscountQrToken');
const Influencer = require('../models/Influencer');

function keyToString(val) {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object' && val && typeof val.toHexString === 'function') {
        return val.toHexString();
    }
    return String(val).trim();
}

/**
 * Canjes agrupados por payload.influencerId (sirve para comprobar si un solo influencer concentra redenciones).
 */
async function summarizeRedemptionsByInfluencer() {
    const groups = await DiscountQrToken.aggregate([
        { $match: { usedAt: { $exists: true, $ne: null, $type: 'date' } } },
        { $group: { _id: '$payload.influencerId', redemptionCount: { $sum: 1 } } },
    ]);

    /** @type {{ keyRaw: unknown, redemptionCount: number, idStr: string|null, invalidOid: boolean, empty: boolean }[]} */
    const parsed = [];

    for (const g of groups) {
        const raw = g._id;
        const redemptionCount = Number(g.redemptionCount) || 0;
        const s = keyToString(raw);
        const empty = s === '';
        const invalidOid = !empty && !mongoose.Types.ObjectId.isValid(s);
        const idStr = !empty && !invalidOid ? s : null;
        parsed.push({ keyRaw: raw, redemptionCount, idStr, invalidOid, empty });
    }

    parsed.sort((a, b) => b.redemptionCount - a.redemptionCount);

    const oidList = [...new Set(parsed.filter((p) => p.idStr).map((p) => /** @type {string} */ (p.idStr)))];
    let inflById = new Map();
    if (oidList.length > 0) {
        const rows = await Influencer.find({ _id: { $in: oidList } })
            .select('name username')
            .lean();
        inflById = new Map(rows.map((r) => [String(r._id), { name: r.name || '', username: r.username || '' }]));
    }

    const rowsOut = parsed.map((p) => {
        const labelGuest = keyToString(p.keyRaw).toLowerCase() === 'guest';
        const inf = p.idStr ? inflById.get(p.idStr) : null;
        const influencerDocumentFound = Boolean(p.idStr && inflById.has(p.idStr));
        return {
            influencerId: p.idStr,
            influencerIdRawPresentation: p.empty ? '(vacío/null)' : keyToString(p.keyRaw),
            redemptionCount: p.redemptionCount,
            isInvalidObjectId: p.invalidOid,
            isLikelyGuestString: labelGuest || Boolean(p.invalidOid && keyToString(p.keyRaw).length > 0),
            influencerName: inf ? inf.name : null,
            influencerUsername: inf ? inf.username : null,
            influencerDocumentFound,
        };
    });

    const totalRedemptions = parsed.reduce((s, p) => s + p.redemptionCount, 0);
    const verification = buildRedemptionAttributionVerification(rowsOut, totalRedemptions);

    return {
        totalRedemptions,
        rowCount: rowsOut.length,
        rows: rowsOut,
        verification,
    };
}

/**
 * Resumen listo para UI / comprobar si un solo influencer concentra canjes con payload resuelto en BD.
 * @param {Array<{
 *   influencerId: string | null,
 *   redemptionCount: number,
 *   isInvalidObjectId: boolean,
 *   influencerIdRawPresentation: string,
 *   influencerName: string | null,
 *   influencerUsername: string | null,
 *   influencerDocumentFound: boolean
 * }>} rowsOut
 * @param {number} totalRedemptions
 */
function buildRedemptionAttributionVerification(rowsOut, totalRedemptions) {
    let redemptionsMatchedInfluencerCollection = 0;
    let redemptionsValidObjectIdNoDocument = 0;
    let redemptionsNoValidObjectId = 0;

    /** @type {Map<string, { influencerId: string, redemptionCount: number, name: string | null, username: string | null }>} */
    const byId = new Map();

    for (const r of rowsOut) {
        const c = Number(r.redemptionCount) || 0;
        if (!r.influencerId) {
            redemptionsNoValidObjectId += c;
            continue;
        }
        if (r.influencerDocumentFound) {
            redemptionsMatchedInfluencerCollection += c;
            const prev = byId.get(r.influencerId);
            if (prev) prev.redemptionCount += c;
            else
                byId.set(r.influencerId, {
                    influencerId: r.influencerId,
                    redemptionCount: c,
                    name: r.influencerName ?? null,
                    username: r.influencerUsername ?? null,
                });
        } else {
            redemptionsValidObjectIdNoDocument += c;
        }
    }

    const influencersWithRedemptionsInDb = [...byId.values()].sort((a, b) => b.redemptionCount - a.redemptionCount);
    const distinctInfluencersInCollection = influencersWithRedemptionsInDb.length;
    const onlyOneInfluencerInDb = distinctInfluencersInCollection === 1;
    const top = influencersWithRedemptionsInDb[0];
    const allExplainedBySingleProfile =
        onlyOneInfluencerInDb &&
        top &&
        redemptionsValidObjectIdNoDocument === 0 &&
        redemptionsNoValidObjectId === 0 &&
        top.redemptionCount === totalRedemptions;

    /** @type {string[]} */
    const summaryLinesEs = [];
    if (totalRedemptions === 0) {
        summaryLinesEs.push('No hay tokens con fecha de uso (usedAt): no hay canjes que agrupar.');
    } else {
        summaryLinesEs.push(`Total de canjes en DiscountQrToken: ${totalRedemptions}.`);
        if (distinctInfluencersInCollection === 0) {
            summaryLinesEs.push(
                'Ningún canje tiene un influencerId válido que exista como documento Influencer en MongoDB.',
            );
            if (redemptionsValidObjectIdNoDocument > 0) {
                summaryLinesEs.push(
                    `Hay ${redemptionsValidObjectIdNoDocument} canje(s) con ObjectId en el payload pero sin fila Influencer.`,
                );
            }
            if (redemptionsNoValidObjectId > 0) {
                summaryLinesEs.push(
                    `${redemptionsNoValidObjectId} canje(s) con payload sin ObjectId válido (vacío, huérfano o texto).`,
                );
            }
        } else if (onlyOneInfluencerInDb) {
            const label = top.username || top.name || shortenHexId(top.influencerId);
            summaryLinesEs.push(
                `Un único perfil Influencer coincide con los canjes: «${label}» (${top.redemptionCount} canjes).`,
            );
            if (allExplainedBySingleProfile) {
                summaryLinesEs.push(
                    'Verificación estricta: el 100% de los canjes se atribuye a ese influencer; no hay otros ObjectId ni payloads inválidos.',
                );
            } else {
                const extra = redemptionsValidObjectIdNoDocument + redemptionsNoValidObjectId;
                if (extra > 0) {
                    summaryLinesEs.push(
                        `Atención: ${extra} canje(s) no encajan sólo en ese perfil (${redemptionsNoValidObjectId} sin ObjectId válido, ${redemptionsValidObjectIdNoDocument} ObjectId sin documento Influencer).`,
                    );
                }
            }
        } else {
            summaryLinesEs.push(`Hay ${distinctInfluencersInCollection} influencers distintos en BD con canjes atribuidos.`);
            if (top) {
                const share = Math.round((100 * top.redemptionCount) / totalRedemptions);
                summaryLinesEs.push(`El mayor volumen es ${top.username || top.name || shortenHexId(top.influencerId)} (~${share}% del total).`);
            }
            if (redemptionsValidObjectIdNoDocument + redemptionsNoValidObjectId > 0) {
                summaryLinesEs.push(
                    `Además: ${redemptionsNoValidObjectId} canje(s) sin ObjectId válido y ${redemptionsValidObjectIdNoDocument} con ObjectId sin perfil.`,
                );
            }
        }
    }

    return {
        distinctInfluencersInCollection,
        onlyOneInfluencerInDb,
        allExplainedBySingleProfile,
        redemptionsMatchedInfluencerCollection,
        redemptionsValidObjectIdNoDocument,
        redemptionsNoValidObjectId,
        influencersWithRedemptionsInDb,
        summaryLinesEs,
    };
}

function shortenHexId(id) {
    if (!id || id.length <= 14) return id || '—';
    return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

module.exports = { summarizeRedemptionsByInfluencer };
