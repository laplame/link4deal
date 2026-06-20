import { GA4_MEASUREMENT_ID } from '../config/ga4';
import { isExcludedAnalyticsHost } from './isExcludedAnalyticsHost';

declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void;
    }
}

let injectStarted = false;

function gtagScriptInDom(): boolean {
    if (typeof document === 'undefined') return false;
    return !!document.querySelector(`script[src*="gtag/js?id=${GA4_MEASUREMENT_ID}"]`);
}

/** Fallback si index.html no incluyó el snippet (p. ej. build antiguo). */
export function initGoogleAnalytics(): void {
    if (typeof window === 'undefined' || injectStarted) return;
    injectStarted = true;
    if (isExcludedAnalyticsHost()) return;

    if (gtagScriptInDom() && typeof window.gtag === 'function') {
        return;
    }

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
        window.dataLayer!.push(args as unknown as Record<string, unknown>);
    };

    const script = document.createElement('script');
    script.async = true;
    script.id = 'ga4-gtag-js';
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_MEASUREMENT_ID)}`;
    document.head.appendChild(script);

    window.gtag('js', new Date());
    window.gtag('config', GA4_MEASUREMENT_ID);
}

export function isGtagAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    if (isExcludedAnalyticsHost()) return false;
    return typeof window.gtag === 'function' && (gtagScriptInDom() || injectStarted);
}

/** Page view en SPA (React Router). */
export function trackGa4PageView(pathname: string, search: string, hash = ''): void {
    if (isExcludedAnalyticsHost()) return;
    if (typeof window.gtag !== 'function') return;
    const page_path = pathname + search + hash;
    window.gtag!('config', GA4_MEASUREMENT_ID, {
        page_path,
        page_location: `${window.location.origin}${page_path}`,
        page_title: document.title,
    });
}
