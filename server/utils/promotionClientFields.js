const { findNearestBranch } = require('./geoDistance');
const { findPresetMatchingPromotion } = require('./chainLocationPresets');
const { serializePromotionKindFields } = require('./promotionKind');
const { enrichPurchaseProofClientFields } = require('./promotionPurchaseProof');
const {
    buildPromotionPublicSlug,
    resolvePromotionPublicUrl,
} = require('./promotionPublicSlug');

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

    /**
     * Preset de catálogo solo si la promoción no trae sucursales guardadas en BD
     * (quick-promotion / wizard con chainLocations debe prevalecer sobre el JSON de marca).
     */
    const hasStoredChain = Array.isArray(o.chainLocations) && o.chainLocations.length > 0;
    const presetForBrand = !hasStoredChain ? findPresetMatchingPromotion(o) : null;
    if (presetForBrand && presetForBrand.chainLocations.length > 0) {
        o.chainLocations = presetForBrand.chainLocations.map((loc) => ({
            branchName: loc.branchName,
            address: loc.address,
            city: loc.city,
            state: loc.state,
            country: loc.country,
            coordinates: {
                latitude: loc.coordinates.latitude,
                longitude: loc.coordinates.longitude
            },
            mapsUrl: loc.mapsUrl
        }));
        if (o.chainLocations.length > 1) {
            o.isChainStore = true;
        }
        o.chainBrandName = presetForBrand.chainBrandName || o.chainBrandName;
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

    if (Array.isArray(o.images) && o.images.length > 1) {
        const promo = o.images.filter((img) => img && img.imageRole !== 'terms');
        const terms = o.images.filter((img) => img && img.imageRole === 'terms');
        const sortNewest = (a, b) => {
            const ta = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
            const tb = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
            return tb - ta;
        };
        o.images = [...promo.sort(sortNewest), ...terms.sort(sortNewest)];
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

    Object.assign(o, serializePromotionKindFields(o));

    if (!o.publicSlug || !String(o.publicSlug).trim()) {
        const generated = buildPromotionPublicSlug(o);
        if (generated) o.publicSlug = generated;
    }
    o.publicUrl = resolvePromotionPublicUrl(o.publicSlug, o._id || o.id);

    return enrichPurchaseProofClientFields(o);
}

module.exports = { enrichPromotionClientFields };
