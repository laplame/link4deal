const { findNearestBranch } = require('./geoDistance');

function resolveBranchMapsUrl(branch) {
    if (!branch || typeof branch !== 'object') return '';
    if (branch.mapsUrl && String(branch.mapsUrl).trim()) return String(branch.mapsUrl).trim();
    const c = branch.coordinates;
    if (
        c &&
        typeof c.latitude === 'number' &&
        Number.isFinite(c.latitude) &&
        typeof c.longitude === 'number' &&
        Number.isFinite(c.longitude)
    ) {
        return `https://www.google.com/maps/search/?api=1&query=${c.latitude},${c.longitude}`;
    }
    return '';
}

/**
 * Enriquece un documento de promoción (plain object) con campos alineados a la app móvil
 * y textos localizados para listados / detalle.
 * @param {object} promo
 * @param {{ userLatitude?: number, userLongitude?: number }} [opts] - Si vienen, se calcula la sucursal más cercana (cadenas).
 */
function enrichPromotionClientFields(promo, opts = {}) {
    if (!promo || typeof promo !== 'object') return promo;
    const o = { ...promo };
    const gpsOn = !!o.activateByGps;
    o.gpsActivationEnabled = gpsOn;
    const r = o.gpsRadiusMeters;
    o.locationRadiusMeters =
        typeof r === 'number' && Number.isFinite(r) ? Math.min(50000, Math.max(50, r)) : 500;

    const coords = o.storeLocation && o.storeLocation.coordinates;
    if (
        coords &&
        typeof coords.latitude === 'number' &&
        Number.isFinite(coords.latitude) &&
        typeof coords.longitude === 'number' &&
        Number.isFinite(coords.longitude)
    ) {
        o.storeLatitude = coords.latitude;
        o.storeLongitude = coords.longitude;
    }
    if (o.storeLocation && o.storeLocation.country) {
        o.storeCountry = o.storeLocation.country;
    }

    if (o.isChainStore && Array.isArray(o.chainLocations) && o.chainLocations.length > 0) {
        const ulat = opts.userLatitude;
        const ulng = opts.userLongitude;
        if (typeof ulat === 'number' && Number.isFinite(ulat) && typeof ulng === 'number' && Number.isFinite(ulng)) {
            const nearest = findNearestBranch(ulat, ulng, o.chainLocations);
            if (nearest) {
                const b = nearest.branch;
                const mapsUrl = resolveBranchMapsUrl(b);
                o.nearestChainLocation = {
                    branchName: b.branchName,
                    address: b.address,
                    city: b.city,
                    state: b.state,
                    country: b.country,
                    coordinates: b.coordinates,
                    mapsUrl,
                    distanceMeters: Math.round(nearest.distanceMeters),
                    distanceKm: Math.round((nearest.distanceMeters / 1000) * 10) / 10
                };
                o.nearestBranchMapsUrl = mapsUrl;
            }
        }
    }

    o.localizedStrings = {
        es: {
            activationByLocationTitle: 'Activación por ubicación',
            activationByLocationDescription:
                'El cupón solo se obtiene dentro del radio configurado respecto al punto de la tienda.',
            badgeShort: 'Por ubicación',
            badgeAria: 'Requiere estar en la zona de la tienda para el cupón'
        },
        en: {
            activationByLocationTitle: 'Location-based activation',
            activationByLocationDescription:
                'The coupon is only available within the configured radius from the store point.',
            badgeShort: 'Location',
            badgeAria: 'Must be near the store area to get the coupon'
        }
    };

    return o;
}

module.exports = { enrichPromotionClientFields };
