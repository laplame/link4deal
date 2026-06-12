import { GTM_ID } from '../config/gtm';
import { isExcludedAnalyticsHost } from './isExcludedAnalyticsHost';

declare global {
    interface Window {
        dataLayer?: Record<string, unknown>[];
        google_tag_manager?: Record<string, unknown>;
    }
}

export interface EntryAttribution {
    capturedAt: string;
    landingPath: string;
    landingTitle: string;
    referrer: string;
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
    utm_term: string;
    utm_content: string;
    gclid: string;
    fbclid: string;
}

export interface RouteLogEntry {
    at: string;
    page_path: string;
    page_title: string;
    page_location: string;
}

const ENTRY_KEY = 'dc_entry_attribution';
const ROUTE_LOG_KEY = 'dc_gtm_route_log';
const MAX_ROUTE_LOG = 30;

function ensureDataLayer(): Record<string, unknown>[] {
    window.dataLayer = window.dataLayer || [];
    return window.dataLayer;
}

export function pushDataLayer(payload: Record<string, unknown>): void {
    if (isExcludedAnalyticsHost()) return;
    ensureDataLayer().push(payload);
}

function readUtm(search: string): Pick<
    EntryAttribution,
    'utm_source' | 'utm_medium' | 'utm_campaign' | 'utm_term' | 'utm_content' | 'gclid' | 'fbclid'
> {
    const params = new URLSearchParams(search);
    return {
        utm_source: params.get('utm_source') ?? '',
        utm_medium: params.get('utm_medium') ?? '',
        utm_campaign: params.get('utm_campaign') ?? '',
        utm_term: params.get('utm_term') ?? '',
        utm_content: params.get('utm_content') ?? '',
        gclid: params.get('gclid') ?? '',
        fbclid: params.get('fbclid') ?? '',
    };
}

/** Primera visita de la sesión: guarda landing + UTMs y empuja a dataLayer. */
export function captureEntryAttribution(): EntryAttribution | null {
    if (typeof window === 'undefined') return null;
    if (isExcludedAnalyticsHost()) return null;
    try {
        const existing = sessionStorage.getItem(ENTRY_KEY);
        if (existing) return JSON.parse(existing) as EntryAttribution;
    } catch {
        /* ignore */
    }

    const landingPath = window.location.pathname + window.location.search + window.location.hash;
    const entry: EntryAttribution = {
        capturedAt: new Date().toISOString(),
        landingPath,
        landingTitle: document.title,
        referrer: document.referrer || '(directo)',
        ...readUtm(window.location.search),
    };

    try {
        sessionStorage.setItem(ENTRY_KEY, JSON.stringify(entry));
    } catch {
        /* ignore */
    }

    pushDataLayer({
        event: 'entry_attribution',
        ...entry,
    });

    return entry;
}

export function getEntryAttribution(): EntryAttribution | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = sessionStorage.getItem(ENTRY_KEY);
        return raw ? (JSON.parse(raw) as EntryAttribution) : null;
    } catch {
        return null;
    }
}

function appendRouteLog(entry: RouteLogEntry): void {
    try {
        const raw = sessionStorage.getItem(ROUTE_LOG_KEY);
        const list: RouteLogEntry[] = raw ? (JSON.parse(raw) as RouteLogEntry[]) : [];
        list.unshift(entry);
        sessionStorage.setItem(ROUTE_LOG_KEY, JSON.stringify(list.slice(0, MAX_ROUTE_LOG)));
    } catch {
        /* ignore */
    }
}

export function getRouteLog(): RouteLogEntry[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = sessionStorage.getItem(ROUTE_LOG_KEY);
        return raw ? (JSON.parse(raw) as RouteLogEntry[]) : [];
    } catch {
        return [];
    }
}

/** Page view virtual para SPA (React Router). */
export function trackVirtualPageView(pathname: string, search: string, hash = ''): void {
    if (isExcludedAnalyticsHost()) return;
    const page_path = pathname + search + hash;
    const page_location = `${window.location.origin}${page_path}`;
    const payload: Record<string, unknown> = {
        event: 'virtual_page_view',
        page_path,
        page_location,
        page_title: document.title,
    };
    const entry = getEntryAttribution();
    if (entry) {
        payload.entry_landing_path = entry.landingPath;
        payload.entry_utm_source = entry.utm_source;
        payload.entry_utm_medium = entry.utm_medium;
        payload.entry_utm_campaign = entry.utm_campaign;
    }
    try {
        const infRaw = sessionStorage.getItem('dc_influencer_attribution');
        if (infRaw) {
            const inf = JSON.parse(infRaw) as {
                influencerId?: string;
                influencerSlug?: string;
                entryPath?: string;
                entryType?: string;
            };
            if (inf.influencerId) payload.influencer_id = inf.influencerId;
            if (inf.influencerSlug) payload.influencer_slug = inf.influencerSlug;
            if (inf.entryPath) payload.influencer_entry_path = inf.entryPath;
            if (inf.entryType) payload.influencer_entry_type = inf.entryType;
        }
    } catch {
        /* ignore */
    }
    pushDataLayer(payload);
    appendRouteLog({
        at: new Date().toISOString(),
        page_path,
        page_title: document.title,
        page_location,
    });
}

export function isGtmScriptLoaded(): boolean {
    if (typeof window === 'undefined') return false;
    const gtm = window.google_tag_manager as Record<string, { dataLayer?: unknown }> | undefined;
    if (gtm && GTM_ID in gtm) return true;
    return ensureDataLayer().some(
        (row) => row && typeof row === 'object' && 'gtm.start' in row
    );
}

export function getDataLayerSnapshot(): Record<string, unknown>[] {
    return [...ensureDataLayer()];
}

/** Rutas de entrada frecuentes para validar en admin. */
export const KEY_ENTRY_ROUTES: { path: string; label: string }[] = [
    { path: '/', label: 'Home' },
    { path: '/landing', label: 'Landing negocios' },
    { path: '/quick-promotion', label: 'Promoción rápida' },
    { path: '/marketplace', label: 'Marketplace' },
    { path: '/influencer', label: 'Influencers' },
    { path: '/signin', label: 'Login' },
    { path: '/admin', label: 'Admin' },
    { path: '/comisionista-digital', label: 'Comisionista digital' },
    { path: '/economia', label: 'Economía Link4Deal' },
];
