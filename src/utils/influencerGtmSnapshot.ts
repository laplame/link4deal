import { GTM_ID } from '../config/gtm';
import {
    getDataLayerSnapshot,
    getEntryAttribution,
    getRouteLog,
    isGtmScriptLoaded,
    type EntryAttribution,
    type RouteLogEntry,
} from './googleTagManager';
import { getInfluencerSessionAttribution, type InfluencerSessionAttribution } from './influencerTrafficAttribution';
import { isExcludedAnalyticsHost } from './isExcludedAnalyticsHost';

export interface InfluencerGtmSnapshot {
    gtmId: string;
    gtmLoaded: boolean;
    analyticsExcluded: boolean;
    excludedReason: string | null;
    currentPath: string;
    pageTitle: string;
    influencerId: string;
    influencerSlug: string;
    publicProfilePath: string;
    entryAttribution: EntryAttribution | null;
    influencerSession: InfluencerSessionAttribution | null;
    sessionMatchesProfile: boolean;
    routeLog: RouteLogEntry[];
    dataLayerRecent: Record<string, unknown>[];
    dataLayerInfluencerEvents: Record<string, unknown>[];
}

function layerMatchesInfluencer(
    row: Record<string, unknown>,
    influencerId: string,
    slug: string,
): boolean {
    const id = row.influencer_id;
    const s = row.influencer_slug;
    if (typeof id === 'string' && id === influencerId) return true;
    if (typeof s === 'string' && s.toLowerCase() === slug.toLowerCase()) return true;
    const path = row.page_path ?? row.landingPath ?? row.entry_landing_path;
    if (typeof path === 'string' && path.includes(`/influencer/${slug}`)) return true;
    return false;
}

export function buildInfluencerGtmSnapshot(
    influencerId: string,
    influencerSlug: string,
): InfluencerGtmSnapshot {
    const slug = influencerSlug.trim();
    const publicProfilePath = `/influencer/${slug}`;
    const excluded = isExcludedAnalyticsHost();
    const entry = getEntryAttribution();
    const influencerSession = getInfluencerSessionAttribution();
    const sessionMatchesProfile =
        !!influencerSession &&
        (influencerSession.influencerId === influencerId ||
            influencerSession.influencerSlug.toLowerCase() === slug.toLowerCase());

    const allLayer = getDataLayerSnapshot();
    const dataLayerInfluencerEvents = allLayer.filter((row) =>
        row && typeof row === 'object'
            ? layerMatchesInfluencer(row as Record<string, unknown>, influencerId, slug)
            : false,
    );

    const currentPath =
        typeof window !== 'undefined'
            ? window.location.pathname + window.location.search + window.location.hash
            : publicProfilePath;

    return {
        gtmId: GTM_ID,
        gtmLoaded: isGtmScriptLoaded(),
        analyticsExcluded: excluded,
        excludedReason: excluded
            ? 'En localhost / puertos de desarrollo no se envían eventos a GTM ni visitas al servidor.'
            : null,
        currentPath,
        pageTitle: typeof document !== 'undefined' ? document.title : '',
        influencerId,
        influencerSlug: slug,
        publicProfilePath,
        entryAttribution: entry,
        influencerSession,
        sessionMatchesProfile,
        routeLog: getRouteLog().slice(0, 20),
        dataLayerRecent: allLayer.slice(-20),
        dataLayerInfluencerEvents: dataLayerInfluencerEvents.slice(-15),
    };
}

export function utmSummaryFromEntry(entry: EntryAttribution | null): string {
    if (!entry) return '—';
    const parts = [
        entry.utm_source && `source=${entry.utm_source}`,
        entry.utm_medium && `medium=${entry.utm_medium}`,
        entry.utm_campaign && `campaign=${entry.utm_campaign}`,
    ].filter(Boolean);
    return parts.length ? parts.join(' · ') : '(sin UTM en landing)';
}
