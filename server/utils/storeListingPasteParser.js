/**
 * Convierte texto pegado desde listados tipo Google Maps / pack local
 * (nombre de sucursal + línea de dirección · teléfono) a filas estructuradas.
 * No hace scraping HTTP: solo interpreta el texto que el usuario pega.
 */

function shouldSkipLine(line) {
    if (!line || line.length < 2) return true;
    return (
        /^(Open|Closes|Delivery|Website|Directions|Google|Maps|Images|Videos|News|Books)/i.test(line) ||
        /^(Sign in|Settings|Privacy|Terms|Dark theme|Can't determine|Unknown|Search tools|Any time|Past hour)/i.test(
            line
        ) ||
        /^All results$/i.test(line)
    );
}

/**
 * Línea tipo categoría de sitio (Google Maps): viene entre nombre y dirección.
 */
function isLikelyCategoryLine(line) {
    if (!line || line.length > 90) return false;
    if (/^Open\b|^Closes\b/i.test(line)) return false;
    if (/·/.test(line) && /\d{2,}/.test(line)) return false;
    return /store|shop|shops|boutique|outlet|market|mall|center|centre|salon|restaurant|café|cafe|hotel|bank|pharmacy|vintage|jeans|clothing|children/i.test(
        line
    );
}

/**
 * @param {string} text
 * @returns {Array<{ branchName: string, address: string, phone?: string }>}
 */
function parseStoreListingPaste(text) {
    if (!text || typeof text !== 'string') return [];
    const lines = String(text)
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

    const out = [];
    for (let i = 0; i < lines.length; i++) {
        if (shouldSkipLine(lines[i])) continue;
        const line = lines[i];
        const next = lines[i + 1];
        if (!next) break;

        /** Fila 1: nombre · dirección · tel (estilo Sam's) */
        if (next.includes('·') && /\d/.test(next)) {
            const parts = next.split('·').map((p) => p.trim()).filter(Boolean);
            const address = parts[0] || '';
            const phone = parts.length > 1 ? parts.slice(1).join(' · ') : undefined;
            if (address || line) {
                out.push({ branchName: line, address, phone });
            }
            i += 1;
            continue;
        }

        /** Google: nombre / categoría / dirección [/ · tel] / Open · Closes… */
        const afterCat = lines[i + 2];
        const afterAddr = lines[i + 3];
        if (isLikelyCategoryLine(next) && afterCat && !shouldSkipLine(afterCat) && afterAddr && /^Open\b/i.test(afterAddr)) {
            let address = afterCat;
            let phone;
            if (afterCat.includes('·')) {
                const parts = afterCat.split('·').map((p) => p.trim()).filter(Boolean);
                address = parts[0] || afterCat;
                phone = parts.length > 1 ? parts.slice(1).join(' · ') : undefined;
            }
            if (line && address) {
                out.push({ branchName: line, address, phone });
            }
            i += 3;
            continue;
        }

        const third = lines[i + 2];
        if (next && !next.includes('·') && third && /^Open\b/i.test(third)) {
            out.push({ branchName: line, address: next, phone: undefined });
            i += 1;
            continue;
        }
    }
    return out;
}

module.exports = { parseStoreListingPaste, shouldSkipLine, isLikelyCategoryLine };
