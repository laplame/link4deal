'use strict';

const DEV_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]', '0.0.0.0']);
const DEV_PORTS = new Set(['5173', '5174', '4173', '3000']);

function hostPortFromUrl(url) {
    try {
        const u = new URL(String(url));
        return { hostname: u.hostname.toLowerCase(), port: u.port || '' };
    } catch {
        return null;
    }
}

function isLocalDevHost(hostname, port) {
    const h = String(hostname || '').toLowerCase();
    if (!DEV_HOSTNAMES.has(h)) return false;
    const p = String(port || '');
    if (!p || p === '80' || p === '443') return true;
    return DEV_PORTS.has(p);
}

/**
 * No persistir visitas/eventos de Vite (localhost:5173) ni dev local.
 * @param {{ pageLocation?: string, referrer?: string, requestHost?: string }} opts
 */
function isExcludedAnalyticsTraffic(opts = {}) {
    const candidates = [opts.pageLocation, opts.referrer].filter(Boolean);
    for (const url of candidates) {
        const hp = hostPortFromUrl(url);
        if (hp && isLocalDevHost(hp.hostname, hp.port)) return true;
    }
    if (opts.requestHost) {
        const hp = hostPortFromUrl(`http://${opts.requestHost}`);
        if (hp && isLocalDevHost(hp.hostname, hp.port)) return true;
    }
    return false;
}

module.exports = {
    DEV_HOSTNAMES,
    DEV_PORTS,
    isExcludedAnalyticsTraffic,
    isLocalDevHost,
};
