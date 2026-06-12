/** Hosts de desarrollo: no registrar visitas ni eventos de analítica. */
const DEV_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]', '0.0.0.0']);

/** Puertos típicos de Vite / dev local (incl. 5173). */
const DEV_PORTS = new Set(['5173', '5174', '4173', '3000']);

function parseHostPort(host?: string, port?: string): { hostname: string; port: string } {
    if (typeof window !== 'undefined' && !host) {
        return {
            hostname: window.location.hostname.toLowerCase(),
            port: window.location.port || (window.location.protocol === 'https:' ? '443' : '80'),
        };
    }
    return {
        hostname: String(host || '').toLowerCase(),
        port: String(port || ''),
    };
}

export function isExcludedAnalyticsHost(host?: string, port?: string): boolean {
    const { hostname, port: p } = parseHostPort(host, port);
    if (!DEV_HOSTNAMES.has(hostname)) return false;
    if (!p || p === '80' || p === '443') return true;
    return DEV_PORTS.has(p);
}

/** Excluye tráfico cuyo origen sea localhost:5173 (u otros dev arriba). */
export function isExcludedAnalyticsUrl(url?: string | null): boolean {
    if (!url) {
        if (typeof window === 'undefined') return false;
        return isExcludedAnalyticsHost();
    }
    try {
        const u = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
        return isExcludedAnalyticsHost(u.hostname, u.port);
    } catch {
        return /localhost|127\.0\.0\.1/i.test(url);
    }
}
