import { apiUrl } from '../utils/apiUrl';
import type { WaitlistSocialPlatformId } from '../config/waitlistSocialPlatforms';

export interface InfluencerWaitlistSignup {
    email: string;
    name?: string;
    /** Red principal (mayor audiencia o preferida) */
    primarySocialPlatform?: WaitlistSocialPlatformId;
    primarySocialHandle?: string;
    /** @deprecated usar primarySocial* */
    instagramHandle?: string;
    city?: string;
    niche?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    referrer?: string;
    landingPath?: string;
}

export interface InfluencerWaitlistResult {
    email: string;
    position: number;
    status: string;
}

export async function submitInfluencerWaitlist(
    payload: InfluencerWaitlistSignup
): Promise<{ ok: true; data: InfluencerWaitlistResult; alreadyRegistered?: boolean; message: string } | { ok: false; message: string }> {
    const res = await fetch(apiUrl('/api/waitlist/influencer'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
        return { ok: false, message: json.message || 'No se pudo registrar el correo.' };
    }
    return {
        ok: true,
        data: json.data as InfluencerWaitlistResult,
        alreadyRegistered: !!json.alreadyRegistered,
        message: json.message || 'Registrado.',
    };
}

export async function fetchInfluencerWaitlistStats(): Promise<number | null> {
    try {
        const res = await fetch(apiUrl('/api/waitlist/influencer/stats'));
        const json = await res.json();
        if (json.success && typeof json.data?.total === 'number') return json.data.total;
    } catch {
        /* ignore */
    }
    return null;
}
