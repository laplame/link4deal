/**
 * One-off: genera chainLocations geocodificados para chainLocationPresets.json (Nominatim).
 * Uso: node server/scripts/geocodePresetSeed.js
 */
require('../config/envPath');
const fs = require('fs');
const path = require('path');

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const DEFAULT_UA =
    process.env.NOMINATIM_USER_AGENT || 'DameCodigo-Link4Deal/1.0 (contacto: soporte@damecodigo.com)';
const DELAY_MS = 1200;

const SAMS_ITEMS = [
    ['Sam\'s Club Portal Centro', 'Lorenzo Boturini S/N, Ciudad de México'],
    ['Sam\'s Club Jacarandas', 'Paseo de las Jacarandas 375, Ciudad de México'],
    ['Sam\'s Club Universidad', 'Municipio Libre 450, Ciudad de México'],
    ['Sam\'s Club', 'FC Hidalgo S/N, Ciudad de México'],
    ['Sam\'s Club', 'Av. Ejército Nacional Mexicano 559, Ciudad de México'],
    ['Sam\'s Club', 'Av. Canal de Tezontle 1520, Ciudad de México'],
    ['Sam\'s Club', 'Av. Revolución 1267, Ciudad de México'],
    ['Sam\'s Club', 'Calz. Ignacio Zaragoza 1385, Ciudad de México'],
    ['Sam\'s Club Toreo', 'Perif. Blvd. Manuel Ávila Camacho 631, Ciudad de México'],
    ['Sam\'s Club', 'Calz. Acoxpa 438, Ciudad de México'],
    ['Sam\'s Club', 'Av. San Jerónimo 630, Ciudad de México'],
    ['Sam\'s Club', 'Perales 222, Ciudad de México'],
    ['Sam\'s Club Río de los Remedios', 'Tlalnepantla de Baz, Estado de México'],
    ['Sam\'s Club Ciudad Jardín', 'Ciudad Nezahualcóyotl, Estado de México'],
    ['Sam\'s Club', 'Prolongación Paseo de la Reforma 400, Ciudad de México'],
    ['Sam\'s Club', 'Ecatepec de Morelos, Estado de México'],
    ['Sam\'s', 'Av. El Rosario 1025, Azcapotzalco, Ciudad de México'],
    ['Sam\'s Club', 'Av. Tamaulipas 3000, Ciudad de México'],
    ['Sam\'s Club Satélite', 'Tlalnepantla de Baz, Estado de México']
];

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

async function geocode(query) {
    const url = `${NOMINATIM_URL}?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
        headers: {
            'User-Agent': DEFAULT_UA,
            'Accept-Language': 'es,en;q=0.8'
        }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return null;
    const hit = data[0];
    const lat = parseFloat(hit.lat);
    const lon = parseFloat(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    const addr = hit.address || {};
    const city =
        addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
    const state = addr.state || addr.region || '';
    const country = addr.country || 'México';
    return {
        branchName: '',
        address: query.split(',').slice(0, 2).join(', ').trim(),
        city: city ? String(city) : '',
        state: state ? String(state) : '',
        country: country ? String(country) : 'México',
        coordinates: { latitude: lat, longitude: lon },
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lon}`)}`,
        _displayName: hit.display_name
    };
}

async function main() {
    const chainLocations = [];
    for (let i = 0; i < SAMS_ITEMS.length; i++) {
        const [branchName, address] = SAMS_ITEMS[i];
        const query = `${branchName}, ${address}, México`;
        process.stdout.write(`${i + 1}/${SAMS_ITEMS.length} ${branchName}... `);
        try {
            if (i > 0) await sleep(DELAY_MS);
            const g = await geocode(query);
            if (!g) {
                console.log('sin resultado');
                continue;
            }
            g.branchName = branchName;
            g.address = address;
            delete g._displayName;
            chainLocations.push(g);
            console.log('ok');
        } catch (e) {
            console.log('error', e.message);
        }
    }

    const outPath = path.join(__dirname, '..', 'data', 'chainLocationPresets.json');
    const payload = {
        presets: [
            {
                id: 'sams',
                label: "Sam's Club",
                chainBrandName: "Sam's Club",
                chainLocations
            },
            {
                id: 'comfort',
                label: 'Comfort',
                chainBrandName: 'Comfort',
                chainLocations: []
            }
        ],
        _comment:
            'chainLocations generados con server/scripts/geocodePresetSeed.js (Nominatim). Comfort: completar o usar /importar-sucursales y pegar en este JSON.'
    };

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
    console.log(`\nEscrito ${outPath} (${chainLocations.length} sucursales Sam's).`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
