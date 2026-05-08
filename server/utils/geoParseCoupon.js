'use strict';

/**
 * Interpreta lat/lng desde body, query u objeto anidado (POS / app lector).
 * @param {object} source
 * @returns {{ latitude: number, longitude: number, locationAccuracyM?: number } | null}
 */
function parseLatLngFromUnknown(source) {
    if (!source || typeof source !== 'object' || Array.isArray(source)) return null;
    let lat = source.latitude ?? source.lat;
    let lng = source.longitude ?? source.lng ?? source.lon;
    let acc = source.accuracy ?? source.locationAccuracy ?? source.locationAccuracyM;
    if (lat == null || lng == null) {
        const loc = source.location;
        if (loc && typeof loc === 'object' && !Array.isArray(loc)) {
            lat = loc.latitude ?? loc.lat;
            lng = loc.longitude ?? loc.lng ?? loc.lon;
            if (acc == null) acc = loc.accuracy ?? loc.locationAccuracyM;
        }
    }
    if (lat == null || lng == null) {
        const gps = source.gps;
        if (gps && typeof gps === 'object' && !Array.isArray(gps)) {
            lat = gps.latitude ?? gps.lat;
            lng = gps.longitude ?? gps.lng ?? gps.lon;
            if (acc == null) acc = gps.accuracy ?? gps.locationAccuracyM;
        }
    }
    const la = Number(lat);
    const lo = Number(lng);
    if (!Number.isFinite(la) || !Number.isFinite(lo)) return null;
    if (la < -90 || la > 90 || lo < -180 || lo > 180) return null;
    const out = { latitude: la, longitude: lo };
    const acn = Number(acc);
    if (Number.isFinite(acn) && acn >= 0 && acn < 1e7) out.locationAccuracyM = acn;
    return out;
}

module.exports = { parseLatLngFromUnknown };
