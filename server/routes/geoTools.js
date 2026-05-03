/**
 * Herramientas de geolocalización masiva: parse de pegado + geocodificación vía Nominatim (OSM).
 * Política Nominatim: máx. ~1 petición/s, User-Agent identificable.
 */
const express = require('express');
const { parseStoreListingPaste } = require('../utils/storeListingPasteParser');
const { listPresetsMeta, getPresetById, upsertPresetFromPayload } = require('../utils/chainLocationPresets');
const { buildNominatimSearchQueryVariants, buildStructuredAddressGeocodeVariants } = require('../utils/nominatimQuery');

const router = express.Router();

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const DEFAULT_UA =
    process.env.NOMINATIM_USER_AGENT || 'DameCodigo-Link4Deal/1.0 (contacto: soporte@damecodigo.com)';
const GEO_BATCH_MAX = Math.min(50, Math.max(5, parseInt(process.env.GEO_GEOCODE_BATCH_MAX || '35', 10) || 35));
const GEO_DELAY_MS = Math.max(1100, parseInt(process.env.GEO_NOMINATIM_DELAY_MS || '1200', 10) || 1200);

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

/**
 * @param {object} addr
 * @returns {{ city: string, state: string, country: string }}
 */
function pickAddressParts(addr) {
    if (!addr || typeof addr !== 'object') {
        return { city: '', state: '', country: 'México' };
    }
    const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.county ||
        addr.city_district ||
        '';
    const state = addr.state || addr.region || '';
    const country = addr.country || 'México';
    return {
        city: city ? String(city) : '',
        state: state ? String(state) : '',
        country: country ? String(country) : 'México'
    };
}

async function nominatimGeocode(query) {
    const url = `${NOMINATIM_URL}?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
        headers: {
            'User-Agent': DEFAULT_UA,
            'Accept-Language': 'es,en;q=0.8'
        }
    });
    if (!res.ok) {
        const err = new Error(`Nominatim HTTP ${res.status}`);
        err.status = res.status;
        throw err;
    }
    const data = await res.json().catch(() => []);
    if (!Array.isArray(data) || data.length === 0) return null;
    const hit = data[0];
    const lat = parseFloat(hit.lat);
    const lon = parseFloat(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    const parts = pickAddressParts(hit.address);
    return {
        latitude: lat,
        longitude: lon,
        city: parts.city,
        state: parts.state,
        country: parts.country,
        displayName: hit.display_name || query,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lon}`)}`
    };
}

function requireChainPresetWrite(req, res, next) {
    const secret = process.env.GEO_CHAIN_PRESET_WRITE_SECRET;
    if (secret && String(secret).trim()) {
        const h = req.headers['x-geo-preset-secret'];
        if (h !== secret) {
            return res.status(403).json({
                success: false,
                message: 'No autorizado para guardar en el catálogo (X-Geo-Preset-Secret incorrecta o vacía).'
            });
        }
    }
    return next();
}

// GET /api/geo/chain-presets — catálogo (sams, comfort, …) con conteo de sucursales
router.get('/chain-presets', (req, res) => {
    try {
        return res.json({
            success: true,
            presets: listPresetsMeta()
        });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message || 'Error al leer catálogo' });
    }
});

// GET /api/geo/chain-presets/:id — sucursales con coordenadas para el asistente
router.get('/chain-presets/:id', (req, res) => {
    try {
        const preset = getPresetById(req.params.id);
        if (!preset) {
            return res.status(404).json({
                success: false,
                message: `No existe el catálogo "${req.params.id}".`
            });
        }
        return res.json({ success: true, preset });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message || 'Error al cargar catálogo' });
    }
});

/**
 * POST /api/geo/save-chain-preset
 * Guarda o actualiza una brand en server/data/chainLocationPresets.json (para promos posteriores).
 * Body: { id?, label?, chainBrandName, matchNames?, chainLocations }
 */
router.post('/save-chain-preset', requireChainPresetWrite, (req, res) => {
    try {
        const data = upsertPresetFromPayload(req.body || {});
        return res.json({
            success: true,
            ...data,
            message: `Catálogo "${data.id}" guardado con ${data.branchCount} sucursales.`
        });
    } catch (e) {
        const code = e.status && Number(e.status) >= 400 && Number(e.status) < 600 ? e.status : 500;
        const msg = e.message || 'Error al guardar catálogo';
        return res.status(code).json({
            success: false,
            message: msg,
            error: msg
        });
    }
});

/**
 * POST /api/geo/geocode-address
 * Geocodifica dirección + código postal + ciudad/estado (Nominatim). Respuesta incluye mapsUrl (Google) para verificar.
 * Body: { address?, postalCode?, cp?, city?, state?, country? }
 */
router.post('/geocode-address', async (req, res) => {
    try {
        const body = req.body || {};
        const address = body.address != null ? String(body.address).trim() : '';
        const postalCode =
            body.postalCode != null
                ? String(body.postalCode).trim()
                : body.cp != null
                  ? String(body.cp).trim()
                  : '';
        const city = body.city != null ? String(body.city).trim() : '';
        const state = body.state != null ? String(body.state).trim() : '';
        const country =
            body.country != null && String(body.country).trim()
                ? String(body.country).trim()
                : 'México';

        const variants = buildStructuredAddressGeocodeVariants({
            address,
            postalCode,
            city,
            state,
            country
        });
        if (variants.length === 0) {
            return res.status(400).json({
                success: false,
                message:
                    'Indica al menos: (dirección y ciudad) o (código postal y ciudad) o (código postal y estado), para poder geocodificar.'
            });
        }

        let lastErr = null;
        for (let vi = 0; vi < variants.length; vi++) {
            if (vi > 0) await sleep(GEO_DELAY_MS);
            try {
                const geo = await nominatimGeocode(variants[vi]);
                if (geo) {
                    return res.json({
                        success: true,
                        data: {
                            ...geo,
                            queryUsed: variants[vi],
                            openStreetMapUrl: `https://www.openstreetmap.org/?mlat=${geo.latitude}&mlon=${geo.longitude}&zoom=18`
                        },
                        message: 'Ubicación encontrada. Abre mapsUrl para verificar en Google Maps.'
                    });
                }
            } catch (e) {
                lastErr = e;
            }
        }
        return res.status(404).json({
            success: false,
            message:
                lastErr?.message ||
                'No se encontró la ubicación. Revisa dirección, código postal y ciudad; compara con Google Maps.'
        });
    } catch (e) {
        return res.status(500).json({
            success: false,
            message: e.message || 'Error de geocodificación'
        });
    }
});

// POST /api/geo/parse-store-paste  { text }
router.post('/parse-store-paste', (req, res) => {
    try {
        const text = req.body && req.body.text != null ? String(req.body.text) : '';
        const items = parseStoreListingPaste(text);
        return res.json({
            success: true,
            count: items.length,
            items
        });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message || 'Error al parsear' });
    }
});

/**
 * POST /api/geo/geocode-chain-locations
 * Body: { items: [{ branchName, address }], country?: string }
 * Respuesta: formato compatible con chainLocations / wizard
 */
router.post('/geocode-chain-locations', async (req, res) => {
    try {
        const countryDefault =
            (req.body && req.body.country != null && String(req.body.country).trim()) || 'México';
        let items = req.body && Array.isArray(req.body.items) ? req.body.items : [];
        if (items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'items debe ser un array no vacío'
            });
        }
        if (items.length > GEO_BATCH_MAX) {
            return res.status(400).json({
                success: false,
                message: `Máximo ${GEO_BATCH_MAX} filas por solicitud (política Nominatim / tiempo de respuesta).`
            });
        }

        const chainLocations = [];
        const errors = [];

        for (let i = 0; i < items.length; i++) {
            const raw = items[i];
            if (!raw || typeof raw !== 'object') continue;
            const branchName = raw.branchName != null ? String(raw.branchName).trim() : '';
            const address = raw.address != null ? String(raw.address).trim() : '';
            if (!address && !branchName) continue;

            if (i > 0) await sleep(GEO_DELAY_MS);

            const variants = buildNominatimSearchQueryVariants(branchName, address, countryDefault);
            let geo = null;
            for (let vi = 0; vi < variants.length; vi++) {
                if (vi > 0) await sleep(Math.min(800, GEO_DELAY_MS));
                try {
                    geo = await nominatimGeocode(variants[vi]);
                } catch (e) {
                    errors.push({
                        index: i,
                        branchName,
                        address,
                        reason: e.message || 'geocode_error'
                    });
                    geo = null;
                    break;
                }
                if (geo) break;
            }

            if (!geo) {
                if (!errors.some((e) => e.index === i)) {
                    errors.push({ index: i, branchName, address, reason: 'sin_resultado' });
                }
                continue;
            }
            chainLocations.push({
                branchName,
                address,
                city: geo.city || '',
                state: geo.state || '',
                country: geo.country || countryDefault,
                coordinates: {
                    latitude: geo.latitude,
                    longitude: geo.longitude
                },
                mapsUrl: geo.mapsUrl
            });
        }

        return res.json({
            success: true,
            count: chainLocations.length,
            chainLocations,
            errors,
            note: 'Coordenadas vía OpenStreetMap Nominatim; verificar sucursales críticas a mano.'
        });
    } catch (e) {
        return res.status(500).json({
            success: false,
            message: e.message || 'Error en geocodificación'
        });
    }
});

module.exports = router;
