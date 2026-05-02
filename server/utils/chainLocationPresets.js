/**
 * Catálogo de cadenas con sucursales predefinidas (sams, comfort, etc.).
 * Datos en server/data/chainLocationPresets.json; opcional override por env CHAIN_LOCATION_PRESETS_PATH.
 */
const fs = require('fs');
const path = require('path');
const { parseChainLocations } = require('./chainStore');

const DEFAULT_FILE = path.join(__dirname, '..', 'data', 'chainLocationPresets.json');

function presetsFilePath() {
    const p = process.env.CHAIN_LOCATION_PRESETS_PATH;
    if (p && String(p).trim()) return path.resolve(process.cwd(), String(p).trim());
    return DEFAULT_FILE;
}

let cached = null;
let cachedMtime = null;

function readRaw() {
    const file = presetsFilePath();
    if (!fs.existsSync(file)) {
        return { presets: [] };
    }
    const stat = fs.statSync(file);
    if (cached && cachedMtime === stat.mtimeMs) return cached;
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    cached = raw && typeof raw === 'object' ? raw : { presets: [] };
    cachedMtime = stat.mtimeMs;
    return cached;
}

function invalidateCache() {
    cached = null;
    cachedMtime = null;
}

/**
 * @param {string} s
 */
function normalizeBrandKey(s) {
    if (s == null || typeof s !== 'string') return '';
    return s
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function collectPresetMatchKeys(entry, preset) {
    const keys = new Set(
        [preset.id, preset.label, preset.chainBrandName].map(normalizeBrandKey).filter(Boolean)
    );
    if (entry && Array.isArray(entry.matchNames)) {
        for (const m of entry.matchNames) {
            const s = m != null ? String(m).trim() : '';
            if (s) keys.add(normalizeBrandKey(s));
        }
    }
    return keys;
}

/**
 * @param {string} nk normalized candidate
 * @param {Set<string>} presetKeys
 */
function candidateMatchesPresetKeys(nk, presetKeys) {
    if (!nk || !presetKeys.size) return false;
    if (presetKeys.has(nk)) return true;
    for (const pk of presetKeys) {
        if (!pk || pk.length < 4) continue;
        if (nk === pk) return true;
        if (pk.length >= 8 && nk.startsWith(`${pk} `)) return true;
    }
    return false;
}

/**
 * Encuentra un preset cuyo id, label o chainBrandName coincide con brand, chainBrandName o storeName de la promoción.
 * @param {object} promo — plain object (brand, chainBrandName, storeName, isChainStore)
 * @returns {{ id: string, label: string, chainBrandName: string, chainLocations: ReturnType<parseChainLocations> } | null}
 */
function findPresetMatchingPromotion(promo) {
    if (!promo || typeof promo !== 'object') return null;
    const candidates = [];
    for (const key of ['chainBrandName', 'brand', 'storeName']) {
        const v = promo[key];
        if (v != null && String(v).trim()) candidates.push(String(v).trim());
    }
    if (candidates.length === 0) return null;

    const raw = readRaw();
    const list = Array.isArray(raw.presets) ? raw.presets : [];
    for (const entry of list) {
        if (!entry || !entry.id) continue;
        const preset = getPresetById(entry.id);
        if (!preset || !preset.chainLocations.length) continue;

        const presetKeys = collectPresetMatchKeys(entry, preset);

        for (const c of candidates) {
            const nk = normalizeBrandKey(c);
            if (!nk) continue;
            if (candidateMatchesPresetKeys(nk, presetKeys)) return preset;
        }
    }
    return null;
}

/**
 * @returns {Array<{ id: string, label: string, chainBrandName: string, branchCount: number }>}
 */
function listPresetsMeta() {
    const raw = readRaw();
    const list = Array.isArray(raw.presets) ? raw.presets : [];
    return list
        .filter((p) => p && p.id && String(p.id).trim())
        .map((p) => {
            const norm = parseChainLocations(p.chainLocations);
            return {
                id: String(p.id).trim(),
                label: p.label != null ? String(p.label).trim() : String(p.id).trim(),
                chainBrandName:
                    p.chainBrandName != null && String(p.chainBrandName).trim()
                        ? String(p.chainBrandName).trim()
                        : p.label != null
                          ? String(p.label).trim()
                          : String(p.id).trim(),
                branchCount: norm.length
            };
        });
}

/**
 * @param {string} id
 * @returns {{ id: string, label: string, chainBrandName: string, chainLocations: ReturnType<parseChainLocations> } | null}
 */
function getPresetById(id) {
    if (!id || !String(id).trim()) return null;
    const key = String(id).trim().toLowerCase();
    const raw = readRaw();
    const list = Array.isArray(raw.presets) ? raw.presets : [];
    const p = list.find((x) => x && String(x.id).trim().toLowerCase() === key);
    if (!p) return null;
    const chainLocations = parseChainLocations(p.chainLocations);
    return {
        id: String(p.id).trim(),
        label: p.label != null ? String(p.label).trim() : String(p.id).trim(),
        chainBrandName:
            p.chainBrandName != null && String(p.chainBrandName).trim()
                ? String(p.chainBrandName).trim()
                : p.label != null
                  ? String(p.label).trim()
                  : String(p.id).trim(),
        chainLocations
    };
}

function slugPresetId(s) {
    const t = String(s || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    return t.slice(0, 48) || 'brand';
}

/**
 * @param {string} incomingId
 * @param {string} label
 * @param {string} chainBrandName
 * @param {string[]} matchNames
 * @param {object} raw — objeto leído de chainLocationPresets.json
 * @returns {{ id: string, label: string, branchCount: number } | null}
 */
function findConflictingChainPreset(incomingId, label, chainBrandName, matchNames, raw) {
    const list = Array.isArray(raw.presets) ? raw.presets : [];
    const presetMeta = { id: incomingId, label, chainBrandName };
    const entryShape = { matchNames };
    const incomingKeys = collectPresetMatchKeys(entryShape, presetMeta);
    const incId = String(incomingId).trim().toLowerCase();

    for (const entry of list) {
        if (!entry || !entry.id) continue;
        const eid = String(entry.id).trim().toLowerCase();
        if (eid === incId) continue;

        const locCount = parseChainLocations(entry.chainLocations).length;
        if (locCount === 0) continue;

        const meta = {
            id: String(entry.id).trim(),
            label:
                entry.label != null && String(entry.label).trim()
                    ? String(entry.label).trim()
                    : String(entry.id).trim(),
            chainBrandName:
                entry.chainBrandName != null && String(entry.chainBrandName).trim()
                    ? String(entry.chainBrandName).trim()
                    : entry.label != null && String(entry.label).trim()
                      ? String(entry.label).trim()
                      : String(entry.id).trim()
        };
        const presetKeys = collectPresetMatchKeys(entry, meta);

        for (const ik of incomingKeys) {
            if (candidateMatchesPresetKeys(ik, presetKeys)) {
                return { id: meta.id, label: meta.label, branchCount: locCount };
            }
        }
    }
    return null;
}

/**
 * Crea o actualiza un preset en chainLocationPresets.json (disco del servidor).
 * @param {{ id?: string, label?: string, chainBrandName: string, matchNames?: string[], chainLocations: unknown }}
 * @returns {{ id: string, label: string, chainBrandName: string, branchCount: number }}
 */
function upsertPresetFromPayload(payload) {
    const chainBrandName =
        payload.chainBrandName != null && String(payload.chainBrandName).trim()
            ? String(payload.chainBrandName).trim()
            : '';
    if (!chainBrandName) {
        const err = new Error('chainBrandName es obligatorio');
        err.status = 400;
        throw err;
    }
    const norm = parseChainLocations(payload.chainLocations);
    if (norm.length === 0) {
        const err = new Error('No hay sucursales con coordenadas válidas');
        err.status = 400;
        throw err;
    }
    let id = payload.id != null && String(payload.id).trim() ? String(payload.id).trim().toLowerCase() : '';
    if (!id) id = slugPresetId(chainBrandName);
    if (!/^[-a-z0-9]{1,48}$/.test(id)) {
        const err = new Error('id debe ser un slug (minúsculas, números y guiones, máx. 48 caracteres)');
        err.status = 400;
        throw err;
    }
    const label =
        payload.label != null && String(payload.label).trim()
            ? String(payload.label).trim()
            : chainBrandName;
    const matchNames = Array.isArray(payload.matchNames)
        ? [...new Set(payload.matchNames.map((m) => String(m).trim()).filter(Boolean))]
        : [];

    const file = presetsFilePath();
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    let raw = { presets: [] };
    if (fs.existsSync(file)) {
        try {
            raw = JSON.parse(fs.readFileSync(file, 'utf8'));
        } catch (e) {
            const err = new Error(
                `No se pudo leer ${path.basename(file)}: ${e instanceof Error ? e.message : 'JSON inválido'}`
            );
            err.status = 500;
            throw err;
        }
    }
    if (!Array.isArray(raw.presets)) {
        raw.presets = [];
    }

    const list = raw.presets;
    const idx = list.findIndex((p) => p && String(p.id).toLowerCase() === id);

    // Alta nueva: evitar otra entrada con la misma brand ya geolocalizada.
    // Mismo id: es actualización de sucursales; no aplicar conflicto con otros slugs.
    if (idx < 0) {
        const conflict = findConflictingChainPreset(id, label, chainBrandName, matchNames, raw);
        if (conflict) {
            const err = new Error(
                `Ya está dado de alta la brand "${conflict.label}" (catálogo id: ${conflict.id}, ${conflict.branchCount} sucursales). ` +
                    'Actualiza ese registro o usa otro nombre / slug distinto.'
            );
            err.status = 409;
            throw err;
        }
    }

    const entry = {
        id,
        label,
        chainBrandName,
        chainLocations: norm
    };
    if (matchNames.length) {
        entry.matchNames = matchNames;
    }

    if (idx >= 0) {
        list[idx] = { ...list[idx], ...entry };
    } else {
        list.push(entry);
    }

    const out = { presets: list };
    if (raw._comment != null) {
        out._comment = raw._comment;
    }

    const tmp = `${file}.tmp.${process.pid}`;
    let serialized;
    try {
        serialized = JSON.stringify(out, null, 2);
    } catch (e) {
        const err = new Error(
            `No se pudo serializar el catálogo (¿datos no válidos para JSON?): ${e instanceof Error ? e.message : String(e)}`
        );
        err.status = 500;
        throw err;
    }
    try {
        fs.writeFileSync(tmp, serialized, 'utf8');
        fs.renameSync(tmp, file);
    } catch (e) {
        try {
            if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
        } catch {
            /* ignore */
        }
        const err = new Error(
            `No se pudo guardar el archivo de catálogo: ${e instanceof Error ? e.message : String(e)}`
        );
        err.status = 500;
        throw err;
    }
    invalidateCache();

    return { id, label, chainBrandName, branchCount: norm.length };
}

module.exports = {
    listPresetsMeta,
    getPresetById,
    invalidateCache,
    presetsFilePath,
    findPresetMatchingPromotion,
    normalizeBrandKey,
    upsertPresetFromPayload
};
