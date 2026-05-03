/**
 * Distancia en metros entre dos puntos WGS84 (Haversine).
 */
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

export interface ChainBranch {
    branchName?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    coordinates: { latitude: number; longitude: number };
    mapsUrl?: string;
}

export function buildGoogleMapsSearchUrl(lat: number, lng: number): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
}

export function resolveBranchMapsUrl(branch: {
    mapsUrl?: string;
    coordinates?: { latitude?: number; longitude?: number };
}): string {
    const u = branch.mapsUrl?.trim();
    if (u) return u;
    const c = branch.coordinates;
    if (
        c != null &&
        typeof c.latitude === 'number' &&
        Number.isFinite(c.latitude) &&
        typeof c.longitude === 'number' &&
        Number.isFinite(c.longitude)
    ) {
        return buildGoogleMapsSearchUrl(c.latitude, c.longitude);
    }
    return '';
}

/**
 * Sucursal más cercana con coordenadas válidas.
 */
export function findNearestChainBranch(
    userLat: number,
    userLng: number,
    branches: Array<
        Partial<ChainBranch> & { coordinates?: { latitude?: number; longitude?: number } }
    >
): { branch: ChainBranch; distanceMeters: number } | null {
    let best: ChainBranch | null = null;
    let bestD = Infinity;
    for (const b of branches) {
        const c = b?.coordinates;
        if (!c) continue;
        const lat = typeof c.latitude === 'number' ? c.latitude : parseFloat(String(c.latitude).replace(',', '.'));
        const lng = typeof c.longitude === 'number' ? c.longitude : parseFloat(String(c.longitude).replace(',', '.'));
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
        const d = haversineDistanceMeters(userLat, userLng, lat, lng);
        if (d < bestD) {
            bestD = d;
            best = {
                branchName: b.branchName,
                address: b.address,
                city: b.city,
                state: b.state,
                country: b.country,
                coordinates: { latitude: lat, longitude: lng },
                mapsUrl: b.mapsUrl
            };
        }
    }
    if (!best) return null;
    return { branch: best, distanceMeters: bestD };
}

/** Normaliza el array `chainLocations` de la API a sucursales con coordenadas válidas. */
export function normalizeChainBranchesFromApi(raw: unknown): ChainBranch[] {
    if (!Array.isArray(raw)) return [];
    const out: ChainBranch[] = [];
    for (const item of raw) {
        if (!item || typeof item !== 'object') continue;
        const c = (item as { coordinates?: { latitude?: unknown; longitude?: unknown } }).coordinates;
        if (!c) continue;
        const lat = typeof c.latitude === 'number' ? c.latitude : parseFloat(String(c.latitude).replace(',', '.'));
        const lng = typeof c.longitude === 'number' ? c.longitude : parseFloat(String(c.longitude).replace(',', '.'));
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
        const o = item as Record<string, unknown>;
        out.push({
            branchName: o.branchName != null ? String(o.branchName) : undefined,
            address: o.address != null ? String(o.address) : undefined,
            city: o.city != null ? String(o.city) : undefined,
            state: o.state != null ? String(o.state) : undefined,
            country: o.country != null ? String(o.country) : undefined,
            coordinates: { latitude: lat, longitude: lng },
            mapsUrl: o.mapsUrl != null ? String(o.mapsUrl) : undefined
        });
    }
    return out;
}
