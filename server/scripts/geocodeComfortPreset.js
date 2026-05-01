/**
 * Genera chainLocations para preset comfort (Comfort Jeans) vía Nominatim.
 * Uso: node server/scripts/geocodeComfortPreset.js
 */
require('../config/envPath');
const fs = require('fs');
const path = require('path');
const { parseStoreListingPaste } = require('../utils/storeListingPasteParser');
const { buildNominatimSearchQueryVariants } = require('../utils/nominatimQuery');

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const DEFAULT_UA =
    process.env.NOMINATIM_USER_AGENT || 'DameCodigo-Link4Deal/1.0 (contacto: soporte@damecodigo.com)';
const DELAY_MS = 1200;

const PASTE = `comfortjeans Pino Suarez 1
Boutique
José María Pino Suárez No. 43-A
Open · Closes 7:30 PM
Comfort Jeans
Boutique
José María Izazaga 166-Piso 2 · 55 5542 4506
Open · Closes 7:30 PM
Comfort Jeans Rodríguez Puebla 2
Clothing store
Rodríguez Puebla No. 11 Local "G" Colonia Centro, delegación Cuauhtémoc C.P. 06000 · 55 8686 8687
Open · Closes 6 PM
Kid´S OK
Clothing store
José María Izazaga 160 · 55 5709 0758
Open · Closes 6 PM
COMFORTJEANS MIGUEL ALEMAN
Clothing store
Miguel Alemán No.14 Loc. L Col. Centro Del. Cuauhtemoc
Open · Closes 6:30 PM
comfortjeans Izazaga 2
Boutique
José María Izazaga 111-Local A · 55 5709 0603
Open · Closes 6:30 PM
Comfort Jeans Parque Tezontle
Clothing store
Av. Canal de Tezontle 1512
Open · Closes 9 PM
Comfort Kids
Children's clothing store
José María Pino Suárez 66 · 55 1826 1841
Open · Closes 8:30 PM
Comfort Jeans Parque Las Antenas
Clothing store
Mexico City
Open · Closes 9 PM
Comfort Jeans
Jeans shop
Tlalnepantla de Baz, State of Mexico
Open · Closes 9 PM
COMFORTJEANS PLAZA CHIMALHUACAN
Clothing store
Chimalhuacán, State of Mexico · 55 5044 1173
Open · Closes 9 PM
Comfort Kids Las Américas
Clothing store
Ecatepec de Morelos, State of Mexico
Open · Closes 9 PM
Comfort Jeans Plaza Cd. Jardín
Clothing store
Ciudad Nezahualcóyotl, State of Mexico
Open · Closes 9 PM
Comfort Kids
Children's clothing store
Gral. Miguel Alemán 38
Open · Closes 7:30 PM
Outlet de Pantalones
Vintage clothing store
José María Pino Suárez 56 · 55 4233 1988
Open · Closes 7:30 PM
Comfort Jeans • Sendero Ixtapaluca
Clothing store
Ixtapaluca, State of Mexico
Open · Closes 9 PM
COMFORTJEANS
Clothing store
Cuautitlán, State of Mexico
Open · Closes 9 PM
Comfort Jeans Puerta Texcoco
Clothing store
Santiago Cuautlalpan, State of Mexico
Open · Closes 8 PM
Lee Outlet Izazaga
Clothing store
José María Izazaga 160 · 55 5522 9480
Open · Closes 7 PM
Comfort Jeans
Clothing store
Tlalnepantla de Baz, State of Mexico · 56 4539 7560
Open · Closes 8:30 PM`;

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

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
    const parts = pickAddressParts(hit.address);
    return {
        latitude: lat,
        longitude: lon,
        city: parts.city,
        state: parts.state,
        country: parts.country,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lon}`)}`
    };
}

async function main() {
    const items = parseStoreListingPaste(PASTE);
    const chainLocations = [];
    for (let i = 0; i < items.length; i++) {
        const { branchName, address } = items[i];
        process.stdout.write(`${i + 1}/${items.length} ${branchName.slice(0, 35)}... `);
        try {
            if (i > 0) await sleep(DELAY_MS);
            const variants = buildNominatimSearchQueryVariants(branchName, address, 'México');
            let g = null;
            for (let vi = 0; vi < variants.length; vi++) {
                if (vi > 0) await sleep(Math.min(800, DELAY_MS));
                g = await geocode(variants[vi]);
                if (g) break;
            }
            if (!g) {
                console.log('sin resultado');
                continue;
            }
            chainLocations.push({
                branchName,
                address,
                city: g.city || '',
                state: g.state || '',
                country: g.country || 'México',
                coordinates: { latitude: g.latitude, longitude: g.longitude },
                mapsUrl: g.mapsUrl
            });
            console.log('ok');
        } catch (e) {
            console.log('error', e.message);
        }
    }

    const presetPath = path.join(__dirname, '..', 'data', 'chainLocationPresets.json');
    const all = JSON.parse(fs.readFileSync(presetPath, 'utf8'));
    const presets = Array.isArray(all.presets) ? all.presets : [];
    const nextPresets = presets.map((p) => {
        if (p && String(p.id).toLowerCase() === 'comfort') {
            return {
                id: 'comfort',
                label: 'Comfort Jeans',
                chainBrandName: 'Comfort Jeans',
                matchNames: ['Comfort', 'Comfort Jeans', 'COMFORTJEANS', 'comfortjeans'],
                chainLocations
            };
        }
        return p;
    });

    const out = {
        presets: nextPresets,
        _comment:
            'Comfort: pegado UX Comfort Jeans + server/scripts/geocodeComfortPreset.js. Sam: geocodePresetSeed.js.'
    };
    fs.writeFileSync(presetPath, JSON.stringify(out, null, 2), 'utf8');
    console.log(`\n${presetPath}: comfort → ${chainLocations.length} sucursales.`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
