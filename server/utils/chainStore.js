function parseCoord(v) {
    if (v === undefined || v === null || v === '') return NaN;
    const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : NaN;
}

/**
 * Normaliza el payload de sucursales (JSON string, array, o campo FormData).
 * @param {unknown} raw
 * @returns {Array<{
 *   branchName: string,
 *   address: string,
 *   city: string,
 *   state: string,
 *   country: string,
 *   coordinates?: { latitude: number, longitude: number },
 *   mapsUrl: string
 * }>}
 */
function parseChainLocations(raw) {
    if (raw === undefined || raw === null || raw === '') return [];

    let arr = raw;
    if (typeof raw === 'string') {
        try {
            arr = JSON.parse(raw);
        } catch {
            return [];
        }
    }
    if (!Array.isArray(arr)) return [];

    const out = [];
    for (const item of arr) {
        if (!item || typeof item !== 'object') continue;
        const branchName =
            item.branchName != null
                ? String(item.branchName).trim()
                : item.name != null
                  ? String(item.name).trim()
                  : '';
        const address = item.address != null ? String(item.address).trim() : '';
        const city = item.city != null ? String(item.city).trim() : '';
        const state = item.state != null ? String(item.state).trim() : '';
        const country =
            item.country != null && String(item.country).trim()
                ? String(item.country).trim()
                : 'México';
        const mapsUrl = item.mapsUrl != null ? String(item.mapsUrl).trim() : '';

        const lat = parseCoord(
            item.latitude !== undefined ? item.latitude : item.lat ?? item.coordinates?.latitude
        );
        const lng = parseCoord(
            item.longitude !== undefined ? item.longitude : item.lng ?? item.coordinates?.longitude
        );
        const hasCoords =
            Number.isFinite(lat) &&
            Number.isFinite(lng) &&
            lat >= -90 &&
            lat <= 90 &&
            lng >= -180 &&
            lng <= 180;

        const base = { branchName, address, city, state, country, mapsUrl };

        if (hasCoords) {
            out.push({ ...base, coordinates: { latitude: lat, longitude: lng } });
            continue;
        }
        if (branchName || address || city || state) {
            out.push({ ...base });
        }
    }
    return out;
}

module.exports = {
    parseChainLocations,
    parseCoord
};
