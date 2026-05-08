'use strict';

const PLATFORM_ENUM = ['instagram', 'tiktok', 'youtube', 'facebook', 'twitter', 'linkedin', 'pinterest', 'other'];

/** @returns {typeof PLATFORM_ENUM[number]} */
function inferPlatform(hrefNorm) {
    let u;
    try {
        u = new URL(hrefNorm);
    } catch {
        return 'other';
    }
    const host = u.hostname.replace(/^www\./, '').toLowerCase();

    if (host.includes('instagram') || host === 'instagr.am') return 'instagram';
    if (host.includes('tiktok')) return 'tiktok';
    if (host.includes('youtube.com') || host === 'youtu.be') return 'youtube';
    if (host.includes('facebook.com') || host === 'fb.watch' || host.includes('fb.com')) return 'facebook';
    if (host.includes('twitter.com') || host === 'x.com' || host === 'mobile.twitter.com') return 'twitter';
    if (host.includes('linkedin.com')) return 'linkedin';
    if (host.includes('pinterest.')) return 'pinterest';

    const s = String(hrefNorm || '').toLowerCase();
    for (const p of PLATFORM_ENUM) {
        if (p !== 'other' && s.includes(p)) return p;
    }
    return 'other';
}

/**
 * Normaliza URL a http(s) válida para guardar/enlazar.
 * @returns {string|null}
 */
function sanitizeHttpUrl(raw) {
    let s = String(raw || '').trim();
    if (!s) return null;
    let url;
    try {
        url = new URL(s);
    } catch {
        try {
            url = new URL(`https://${s}`);
        } catch {
            return null;
        }
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.href.split('#')[0].trim();
}

const MAX_QUOTES = 10;
const MAX_VIDEOS = 16;

/**
 * @param {Record<string, unknown>} body - req.body
 * @returns {{ ok: true, ugcProfile: object } | { ok: false, message: string }}
 */
function normalizeUgcProfileInput(body) {
    if (!body || typeof body !== 'object') {
        return { ok: false, message: 'Body JSON inválido' };
    }

    const enabled = Boolean(body.enabled);

    const headline = String(body.headline != null ? body.headline : '')
        .trim()
        .slice(0, 120);
    const intro = String(body.intro != null ? body.intro : '')
        .trim()
        .slice(0, 2000);

    /** @type {{ text: string }[]} */
    const quotesOut = [];
    if (Array.isArray(body.quotes)) {
        for (const q of body.quotes) {
            let text = '';
            if (typeof q === 'string') text = q.trim();
            else if (q && typeof q === 'object' && q.text != null) text = String(q.text).trim();
            if (!text) continue;
            quotesOut.push({ text: text.slice(0, 550) });
            if (quotesOut.length >= MAX_QUOTES) break;
        }
    }

    /** @type {{ url: string, platform: string, label: string, sortOrder: number }[]} */
    const videosOut = [];
    if (Array.isArray(body.videos)) {
        body.videos.forEach((v, idx) => {
            if (!v || typeof v !== 'object') return;
            const href = sanitizeHttpUrl(v.url);
            if (!href) return;
            let platform = String(v.platform || '').toLowerCase().trim();
            if (!PLATFORM_ENUM.includes(platform)) {
                platform = inferPlatform(href);
            }
            const label = String(v.label != null ? v.label : '')
                .trim()
                .slice(0, 140);
            const sortOrderNum = Number(v.sortOrder);
            const sortOrder = Number.isFinite(sortOrderNum) ? sortOrderNum : idx;
            videosOut.push({ url: href, platform, label, sortOrder });
        });
        videosOut.sort((a, b) => a.sortOrder - b.sortOrder || String(a.url).localeCompare(String(b.url)));
        if (videosOut.length > MAX_VIDEOS) {
            videosOut.length = MAX_VIDEOS;
        }
    }

    return {
        ok: true,
        ugcProfile: {
            enabled,
            headline,
            intro,
            quotes: quotesOut,
            videos: videosOut.map(({ url, platform, label }, i) => ({
                url,
                platform,
                label,
                sortOrder: i,
            })),
        },
    };
}

function toFrontendUgc(docUgc) {
    if (!docUgc || typeof docUgc !== 'object') {
        return {
            enabled: false,
            headline: '',
            intro: '',
            quotes: [],
            videos: [],
        };
    }
    const quotes = Array.isArray(docUgc.quotes) ? docUgc.quotes.map((q) => ({ text: String(q.text || '').trim() })).filter((q) => q.text) : [];
    const videos = Array.isArray(docUgc.videos)
        ? docUgc.videos.map((v, i) => ({
              url: String(v.url || '').trim(),
              platform: PLATFORM_ENUM.includes(String(v.platform).toLowerCase())
                  ? String(v.platform).toLowerCase()
                  : 'other',
              label: String(v.label || '').trim(),
              sortOrder: typeof v.sortOrder === 'number' ? v.sortOrder : i,
          }))
        : [];
    return {
        enabled: !!docUgc.enabled,
        headline: String(docUgc.headline != null ? docUgc.headline : '').trim(),
        intro: String(docUgc.intro != null ? docUgc.intro : '').trim(),
        quotes,
        videos: videos.sort((a, b) => a.sortOrder - b.sortOrder),
    };
}

module.exports = {
    normalizeUgcProfileInput,
    sanitizeHttpUrl,
    inferPlatform,
    toFrontendUgc,
    PLATFORM_ENUM,
    MAX_QUOTES,
    MAX_VIDEOS,
};
