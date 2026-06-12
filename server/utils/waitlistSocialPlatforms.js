const WAITLIST_SOCIAL_PLATFORMS = Object.freeze([
    'instagram',
    'tiktok',
    'youtube',
    'twitter',
    'facebook',
    'twitch',
    'other',
]);

const PLATFORM_LABELS = Object.freeze({
    instagram: 'Instagram',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    twitter: 'X (Twitter)',
    facebook: 'Facebook',
    twitch: 'Twitch',
    other: 'Otra',
});

function normalizeSocialHandle(raw) {
    return String(raw || '')
        .trim()
        .replace(/^@+/, '')
        .slice(0, 80);
}

function parsePrimarySocial(body) {
    const rawPlatform = String(body?.primarySocialPlatform || body?.socialPlatform || '').trim().toLowerCase();
    let handle = normalizeSocialHandle(body?.primarySocialHandle || body?.socialHandle);
    let platform = WAITLIST_SOCIAL_PLATFORMS.includes(rawPlatform) ? rawPlatform : '';

    const legacyIg = normalizeSocialHandle(body?.instagramHandle);
    if (!handle && legacyIg) {
        handle = legacyIg;
        if (!platform) platform = 'instagram';
    }

    return {
        primarySocialPlatform: platform,
        primarySocialHandle: handle,
        instagramHandle: platform === 'instagram' ? handle : legacyIg,
    };
}

function formatPrimarySocialDisplay(entry) {
    const platform = entry?.primarySocialPlatform || (entry?.instagramHandle ? 'instagram' : '');
    const handle = entry?.primarySocialHandle || entry?.instagramHandle || '';
    if (!platform && !handle) return '';
    const label = PLATFORM_LABELS[platform] || platform || 'Red social';
    return handle ? `${label}: @${handle.replace(/^@+/, '')}` : label;
}

module.exports = {
    WAITLIST_SOCIAL_PLATFORMS,
    PLATFORM_LABELS,
    normalizeSocialHandle,
    parsePrimarySocial,
    formatPrimarySocialDisplay,
};
