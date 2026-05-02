/**
 * Carga una sola vez la API de JavaScript de Google Maps (callback global).
 * La clave debe venir de import.meta.env.VITE_GOOGLE_MAPS_API_KEY (inyectada desde google_maps en vite.config).
 */
let loadPromise: Promise<void> | null = null;

export function loadGoogleMapsApi(apiKey: string): Promise<void> {
    if (!apiKey || !apiKey.trim()) {
        return Promise.reject(new Error('Falta la clave de Google Maps'));
    }
    if (typeof window !== 'undefined' && window.google?.maps) {
        return Promise.resolve();
    }
    if (loadPromise) return loadPromise;

    loadPromise = new Promise((resolve, reject) => {
        const cb = `__link4dealGmaps_${Date.now()}`;
        const w = window as unknown as Record<string, (() => void) | undefined>;
        w[cb] = () => {
            resolve();
            try {
                delete w[cb];
            } catch {
                w[cb] = undefined;
            }
        };

        const script = document.createElement('script');
        script.async = true;
        script.defer = true;
        script.onerror = () => {
            loadPromise = null;
            try {
                delete w[cb];
            } catch {
                /* ignore */
            }
            reject(new Error('No se pudo cargar el script de Google Maps'));
        };
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey.trim())}&callback=${cb}`;
        document.head.appendChild(script);
    });

    return loadPromise;
}
