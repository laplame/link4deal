/**
 * Enriquece un documento de promoción (plain object) con campos alineados a la app móvil
 * y textos localizados para listados / detalle.
 */
function enrichPromotionClientFields(promo) {
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
