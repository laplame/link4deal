/**
 * Distancia en metros entre dos puntos WGS84 (Haversine).
 */
function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Encuentra la sucursal con coordenadas válidas más cercana al usuario.
 * @param {number} userLat
 * @param {number} userLng
 * @param {Array<{ coordinates?: { latitude?: number, longitude?: number } }>} branches
 * @returns {{ branch: object, distanceMeters: number } | null}
 */
function findNearestBranch(userLat, userLng, branches) {
    if (!Array.isArray(branches) || branches.length === 0) return null;
    let best = null;
    let bestD = Infinity;
    for (const b of branches) {
        const c = b && b.coordinates;
        if (!c) continue;
        const lat = typeof c.latitude === 'number' ? c.latitude : parseFloat(c.latitude);
        const lng = typeof c.longitude === 'number' ? c.longitude : parseFloat(c.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
        const d = haversineDistanceMeters(userLat, userLng, lat, lng);
        if (d < bestD) {
            bestD = d;
            best = b;
        }
    }
    if (!best) return null;
    return { branch: best, distanceMeters: bestD };
}

module.exports = {
    haversineDistanceMeters,
    findNearestBranch
};
