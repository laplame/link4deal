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

module.exports = {
    listPresetsMeta,
    getPresetById,
    invalidateCache,
    presetsFilePath,
    findPresetMatchingPromotion,
    normalizeBrandKey
};
