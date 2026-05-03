/**
 * Cadena de búsqueda para Nominatim: la dirección aporta más señal que el nombre de tienda.
 * @param {string} branchName
 * @param {string} address
 * @param {string} [countryDefault]
 */
function buildNominatimSearchQuery(branchName, address, countryDefault = 'México') {
    const country =
        countryDefault && String(countryDefault).trim() ? String(countryDefault).trim() : 'México';
    let a = String(address || '')
        .trim()
        .replace(/\bState of Mexico\b/gi, 'Estado de México')
        .replace(/\bMexico City\b/gi, 'Ciudad de México');

    const metroContext =
        /ciudad de méxico|cdmx|ciudad de mexico|estado de méxico|edomex|tlalnepantla|neza|ecatepec|chimalhuac|cuautitlán|cuautitlan|ixtapaluca|santiago cuautlalpan|texcoco|cuautlalpan|nezahualcóyotl|nezahualcoyotl/i;
    const hasMetro = metroContext.test(a);
    const looksLikeStreet =
        /\d/.test(a) || /\b(no\.|av\.|av\s|calle|local|cp\.|c\.p\.|col\.|deleg|vialidad)\b/i.test(a);

    if (looksLikeStreet && !hasMetro) {
        a = `${a}, Ciudad de México`;
    }

    if (!a) {
        const bn = branchName != null ? String(branchName).trim() : '';
        return bn ? `${bn}, ${country}` : country;
    }

    return `${a}, ${country}`;
}

/**
 * @param {string} address
 */
function simplifyAddressForGeocode(address) {
    let a = String(address || '')
        .split('·')[0]
        .trim()
        .replace(/\bGral\.\s*/gi, 'General ')
        .replace(/-Piso\s+\d+/gi, ' ')
        .replace(/\bLocal\s+"[^"]*"\s*/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return a;
}

/**
 * Variantes de búsqueda (Nominatim a veces falla con texto largo o "Piso 2").
 * @param {string} branchName
 * @param {string} address
 * @param {string} [countryDefault]
 * @returns {string[]}
 */
function buildNominatimSearchQueryVariants(branchName, address, countryDefault = 'México') {
    const primary = buildNominatimSearchQuery(branchName, address, countryDefault);
    const simplified = simplifyAddressForGeocode(address);
    const variants = [primary];
    const second = buildNominatimSearchQuery(branchName, simplified, countryDefault);
    if (second !== primary) variants.push(second);
    if (/delegaci|cuauhtémoc|cuauhtemoc|centro|C\.P\./i.test(simplified) && simplified.length > 30) {
        const shorter = simplified
            .replace(/\s*,\s*Col\.\s*[^,]+/i, '')
            .replace(/\s*,\s*delegaci[^,]*/i, '')
            .replace(/\s+C\.P\.\s*\d+/i, '')
            .trim();
        if (shorter.length > 10 && shorter.length < simplified.length) {
            const third = buildNominatimSearchQuery(branchName, `${shorter}, Centro, Cuauhtémoc`, countryDefault);
            if (!variants.includes(third)) variants.push(third);
        }
    }
    const normS = simplified.replace(/\s+/g, ' ');
    if (/miguel alem[aá]n\s+no\.?\s*14/i.test(normS)) {
        const v = buildNominatimSearchQuery(
            branchName,
            'Miguel Alemán 14, Centro, Cuauhtémoc, Ciudad de México',
            countryDefault
        );
        if (!variants.includes(v)) variants.push(v);
    }
    if (/izazaga\s+111/i.test(normS)) {
        const v = buildNominatimSearchQuery(
            branchName,
            'José María Izazaga 111, Centro, Ciudad de México',
            countryDefault
        );
        if (!variants.includes(v)) variants.push(v);
    }
    return variants;
}

/**
 * Variantes para formulario estructurado: calle, CP, ciudad, estado (México y similar).
 * @param {{ address?: string, postalCode?: string, city?: string, state?: string, country?: string }} parts
 * @returns {string[]}
 */
function buildStructuredAddressGeocodeVariants(parts) {
    const street = parts.address != null ? String(parts.address).trim() : '';
    const cpRaw =
        parts.postalCode != null
            ? String(parts.postalCode).replace(/\s+/g, '').trim()
            : parts.cp != null
              ? String(parts.cp).replace(/\s+/g, '').trim()
              : '';
    const ci = parts.city != null ? String(parts.city).trim() : '';
    const st = parts.state != null ? String(parts.state).trim() : '';
    const c =
        parts.country != null && String(parts.country).trim()
            ? String(parts.country).trim()
            : 'México';

    const variants = [];
    if (street && ci && st) variants.push(`${street}, ${ci}, ${st}, ${c}`);
    if (street && ci) variants.push(`${street}, ${ci}, ${c}`);
    if (cpRaw && ci && st) variants.push(`C.P. ${cpRaw}, ${ci}, ${st}, ${c}`);
    if (cpRaw && ci) variants.push(`C.P. ${cpRaw}, ${ci}, ${c}`);
    if (cpRaw && st && !ci) variants.push(`C.P. ${cpRaw}, ${st}, ${c}`);
    if (street && st && !ci) variants.push(`${street}, ${st}, ${c}`);
    if (!street && cpRaw && ci) variants.push(`${ci} ${cpRaw}, ${c}`);

    const out = [];
    const seen = new Set();
    for (const v of variants) {
        if (v && !seen.has(v)) {
            seen.add(v);
            out.push(v);
        }
    }
    return out;
}

module.exports = {
    buildNominatimSearchQuery,
    simplifyAddressForGeocode,
    buildNominatimSearchQueryVariants,
    buildStructuredAddressGeocodeVariants
};
