import { parseInfluencerPublicPath } from './influencerPublicSlug';
import { getEntryAttribution } from './googleTagManager';
import { detectInAppBrowser } from './mobileWebApp';
import { isExcludedAnalyticsHost } from './isExcludedAnalyticsHost';

const SESSION_KEY = 'dc_influencer_attribution';
const ENTRY_LOGGED_KEY = 'dc_influencer_entry_logged';
const VISITOR_KEY = 'dc_visitor_id';

export interface InfluencerSessionAttribution {
    influencerId: string;
    influencerSlug: string;
    entryPath: string;
    entryType: string;
    capturedAt: string;
}

function randomId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return `v_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export function getOrCreateVisitorId(): string {
    try {
        let id = localStorage.getItem(VISITOR_KEY);
        if (!id) {
            id = randomId();
            localStorage.setItem(VISITOR_KEY, id);
        }
        return id;
    } catch {
        return randomId();
    }
}

export function getOrCreateSessionId(): string {
    try {
        let id = sessionStorage.getItem('dc_session_id');
        if (!id) {
            id = randomId();
            sessionStorage.setItem('dc_session_id', id);
        }
        return id;
    } catch {
        return randomId();
    }
}

export function getInfluencerSessionAttribution(): InfluencerSessionAttribution | null {
    try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        return raw ? (JSON.parse(raw) as InfluencerSessionAttribution) : null;
    } catch {
        return null;
    }
}

function saveInfluencerSessionAttribution(attr: InfluencerSessionAttribution): void {
    try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(attr));
    } catch {
        /* ignore */
    }
}

/** Detecta slug en ruta /influencer/:slug, /coupon/… o query ?infl= & ?ref=id */
export function detectInfluencerFromLocation(
    pathname: string,
    search: string,
): { slug?: string; influencerId?: string; entryPath: string; entryType: string } | null {
    const params = new URLSearchParams(search);
    if (/^\/coupon\//i.test(pathname)) {
        const ref = params.get('ref')?.trim();
        if (ref && /^[a-f0-9]{24}$/i.test(ref)) {
            return {
                influencerId: ref,
                entryPath: pathname + search,
                entryType: 'coupon',
            };
        }
    }

    const parsed = parseInfluencerPublicPath(pathname);
    if (parsed) {
        return {
            slug: parsed.slug,
            entryPath: pathname + search,
            entryType: parsed.entryType,
        };
    }
    const infl = params.get('infl')?.trim() || params.get('influencer')?.trim();
    const ref = params.get('ref')?.trim();
    if (infl) {
        return { slug: infl.replace(/^@/, '').toLowerCase(), entryPath: pathname + search, entryType: 'other' };
    }
    if (ref && /^[a-f0-9]{24}$/i.test(ref)) {
        return { influencerId: ref, entryPath: pathname + search, entryType: 'other' };
    }
    return null;
}

/**
 * Fija el influencer de entrada de la sesión (first-touch).
 * Si ya hay uno, no sobrescribe salvo forceFromPath en URL de otro influencer.
 */
export function ensureInfluencerSessionAttribution(
    pathname: string,
    search: string,
    resolved?: { influencerId: string; influencerSlug: string },
): InfluencerSessionAttribution | null {
    const hit = detectInfluencerFromLocation(pathname, search);
    if (!hit) return getInfluencerSessionAttribution();

    const existing = getInfluencerSessionAttribution();
    const isNewInfluencerRoute = Boolean(parseInfluencerPublicPath(pathname));

    if (!resolved?.influencerId) {
        return existing;
    }

    const sameInfluencer =
        existing &&
        (existing.influencerId === resolved.influencerId ||
            (hit.slug &&
                normalizeSlug(existing.influencerSlug) === normalizeSlug(hit.slug)));

    if (existing && sameInfluencer && !isNewInfluencerRoute) {
        return existing;
    }

    const next: InfluencerSessionAttribution = {
        influencerId: resolved.influencerId,
        influencerSlug: resolved.influencerSlug,
        entryPath: hit.entryPath,
        entryType: hit.entryType,
        capturedAt: new Date().toISOString(),
    };

    if (!existing || isNewInfluencerRoute || !sameInfluencer) {
        saveInfluencerSessionAttribution(next);
        try {
            sessionStorage.removeItem(ENTRY_LOGGED_KEY);
        } catch {
            /* ignore */
        }
        return next;
    }
    return existing;
}

function normalizeSlug(s: string): string {
    return String(s || '')
        .toLowerCase()
        .replace(/-/g, '');
}

export async function resolveInfluencerAttribution(
    hit: NonNullable<ReturnType<typeof detectInfluencerFromLocation>>,
): Promise<{ influencerId: string; influencerSlug: string } | null> {
    if (hit.influencerId) {
        try {
            const res = await fetch(`/api/influencers/${encodeURIComponent(hit.influencerId)}`);
            const json = await res.json().catch(() => ({}));
            if (res.ok && json.data?.id) {
                return {
                    influencerId: String(json.data.id),
                    influencerSlug: String(json.data.publicSlug || json.data.username || hit.slug || ''),
                };
            }
        } catch {
            /* ignore */
        }
    }
    const slug = hit.slug;
    if (!slug) return null;
    try {
        const res = await fetch(`/api/influencers/traffic/resolve-slug/${encodeURIComponent(slug)}`);
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.data?.id) {
            return { influencerId: String(json.data.id), influencerSlug: String(json.data.slug || slug) };
        }
    } catch {
        /* ignore */
    }
    return null;
}

export async function recordAttributedPageView(pathname: string, search: string, hash: string): Promise<void> {
    if (isExcludedAnalyticsHost()) return;

    const hit = detectInfluencerFromLocation(pathname, search);
    let attr = getInfluencerSessionAttribution();

    if (hit) {
        const resolved = await resolveInfluencerAttribution(hit);
        if (resolved) {
            attr = ensureInfluencerSessionAttribution(pathname, search, resolved);
        }
    }

    if (!attr?.influencerId) return;

    const pagePath = pathname + search + hash;
    const entry = getEntryAttribution();
    let isEntry = false;
    try {
        const logged = sessionStorage.getItem(ENTRY_LOGGED_KEY);
        isEntry = logged !== attr.influencerId;
        if (isEntry) sessionStorage.setItem(ENTRY_LOGGED_KEY, attr.influencerId);
    } catch {
        isEntry =
            pagePath === attr.entryPath ||
            pagePath.startsWith(attr.entryPath.split('?')[0]);
    }

    try {
        await fetch('/api/influencers/traffic/visit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                influencerId: attr.influencerId,
                influencerSlug: attr.influencerSlug,
                sessionId: getOrCreateSessionId(),
                visitorId: getOrCreateVisitorId(),
                isEntry,
                entryType: attr.entryType,
                entryPath: attr.entryPath,
                pagePath,
                pageTitle: document.title,
                pageLocation: `${window.location.origin}${pagePath}`,
                referrer: document.referrer || null,
                utmSource: entry?.utm_source,
                utmMedium: entry?.utm_medium,
                utmCampaign: entry?.utm_campaign,
                utmTerm: entry?.utm_term,
                utmContent: entry?.utm_content,
                inAppBrowser: detectInAppBrowser(),
                userAgent: navigator.userAgent,
            }),
        });
    } catch {
        /* no bloquear navegación */
    }
}
