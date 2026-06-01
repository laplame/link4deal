import {
    TERMS_ACCEPTED_AT_KEY,
    TERMS_ACCEPTED_VERSION_KEY,
    TERMS_VERSION,
} from '../data/termsContent';

export function hasAcceptedTerms(): boolean {
    try {
        return localStorage.getItem(TERMS_ACCEPTED_VERSION_KEY) === TERMS_VERSION;
    } catch {
        return false;
    }
}

export function persistTermsAcceptance(): string {
    const acceptedAt = new Date().toISOString();
    try {
        localStorage.setItem(TERMS_ACCEPTED_VERSION_KEY, TERMS_VERSION);
        localStorage.setItem(TERMS_ACCEPTED_AT_KEY, acceptedAt);
    } catch {
        /* ignore */
    }
    return acceptedAt;
}

export function notifyTermsAccepted(acceptedAt: string): void {
    const payload = JSON.stringify({ type: 'terms_accepted', version: TERMS_VERSION, acceptedAt });
    try {
        (window as unknown as { ReactNativeWebView?: { postMessage?: (m: string) => void } })
            .ReactNativeWebView?.postMessage?.(payload);
    } catch {
        /* ignore */
    }
    try {
        window.parent?.postMessage?.(payload, '*');
    } catch {
        /* ignore */
    }
}

export function acceptTerms(): string {
    const acceptedAt = persistTermsAcceptance();
    notifyTermsAccepted(acceptedAt);
    return acceptedAt;
}
