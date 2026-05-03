/**
 * Normaliza MONGODB_URI_ATLAS igual que database.connectToAtlas (contraseña, path de BD, query inválida).
 * Evita MongoParseError "option X is not supported" cuando la URI trae basura tipo ?link4deal=Cluster0.
 *
 * @param {string | undefined} rawUri
 * @returns {string} URI lista para mongoose.connect, o '' si rawUri vacío
 */
function normalizeAtlasUri(rawUri) {
    let atlasUri = rawUri != null ? String(rawUri).trim() : '';
    if (!atlasUri) return '';

    const uriMatch = atlasUri.match(/^(mongodb\+srv:\/\/)([^:]+):([^@]+)@(.+)$/);
    if (uriMatch) {
        const protocol = uriMatch[1];
        const user = uriMatch[2];
        let password = uriMatch[3];
        const rest = uriMatch[4];

        if (password && !password.startsWith('%')) {
            password = encodeURIComponent(password);
        }

        atlasUri = `${protocol}${user}:${password}@${rest}`;
    }

    if (atlasUri.includes('?link4deal=') || atlasUri.match(/\?[^=]*=Cluster0/)) {
        const baseUri = atlasUri.split('?')[0];
        const cleanBase = baseUri.replace(/\/+$/, '');
        atlasUri = `${cleanBase}/link4deal?retryWrites=true&w=majority`;
        console.log('🔧 URI MongoDB corregida (query inválida reemplazada por /link4deal?retryWrites=true&w=majority)');
    } else {
        if (!atlasUri.match(/\/[^/?]+(\?|$)/)) {
            const separator = atlasUri.includes('?') ? '' : '/';
            atlasUri = atlasUri.replace(/(\?|$)/, `${separator}link4deal$1`);
        }
    }

    atlasUri = atlasUri.replace(/([^:]\/)\/+/g, '$1');
    return atlasUri;
}

module.exports = { normalizeAtlasUri };
