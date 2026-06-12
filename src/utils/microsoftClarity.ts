import { CLARITY_PROJECT_ID, CLARITY_SCRIPT_SRC } from '../config/clarity';
import { isExcludedAnalyticsHost } from './isExcludedAnalyticsHost';

type ClarityFn = ((...args: unknown[]) => void) & { q?: unknown[] };

declare global {
    interface Window {
        clarity?: ClarityFn;
    }
}

let injectStarted = false;

function clarityScriptInDom(): boolean {
    if (typeof document === 'undefined') return false;
    return !!document.querySelector(`script[src*="clarity.ms/tag/${CLARITY_PROJECT_ID}"]`);
}

/** Snippet oficial Clarity; idempotente si ya está en index.html. */
export function initMicrosoftClarity(): void {
    if (typeof window === 'undefined' || injectStarted) return;
    injectStarted = true;
    if (isExcludedAnalyticsHost()) return;

    if (clarityScriptInDom() && typeof window.clarity === 'function') {
        return;
    }

    const c = window as Window & { clarity?: ClarityFn };
    c.clarity =
        c.clarity ||
        function clarity(...args: unknown[]) {
            (c.clarity!.q = c.clarity!.q || []).push(args);
        };

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.id = 'ms-clarity-tag';
    script.src = CLARITY_SCRIPT_SRC;
    const first = document.getElementsByTagName('script')[0];
    if (first?.parentNode) {
        first.parentNode.insertBefore(script, first);
    } else {
        document.head.appendChild(script);
    }
}

export function isClarityAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    if (isExcludedAnalyticsHost()) return false;
    return typeof window.clarity === 'function' && (clarityScriptInDom() || injectStarted);
}

/** Actualiza la página virtual en SPA (React Router). */
export function trackClarityPageView(pathname: string, search: string, hash = ''): void {
    if (isExcludedAnalyticsHost() || typeof window.clarity !== 'function') return;
    const page = pathname + search + hash;
    try {
        window.clarity('set', 'page', page);
    } catch {
        /* ignore */
    }
}
