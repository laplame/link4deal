'use strict';

/**
 * Meta / Instagram Graph API — configuración, OAuth y llamadas HTTP.
 * Sin credenciales: modo stub (no falla; útil para desarrollo).
 */

const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v21.0';

function metaAppId() {
    return String(process.env.META_APP_ID || process.env.FACEBOOK_APP_ID || '').trim();
}

function metaAppSecret() {
    return String(process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET || '').trim();
}

function apiPublicBase() {
    const explicit = String(process.env.API_PUBLIC_URL || '').trim();
    if (explicit) return explicit.replace(/\/$/, '');
    const port = process.env.PORT || 3000;
    return `http://localhost:${port}`;
}

function metaRedirectUri() {
    const explicit = String(process.env.META_INSTAGRAM_REDIRECT_URI || '').trim();
    if (explicit) return explicit;
    return `${apiPublicBase()}/api/instagram/oauth/callback`;
}

function webhookVerifyToken() {
    return String(process.env.META_WEBHOOK_VERIFY_TOKEN || 'link4deal_ig_webhook_dev').trim();
}

function isMetaConfigured() {
    return Boolean(metaAppId() && metaAppSecret());
}

function buildOAuthUrl(state) {
    if (!isMetaConfigured()) {
        return null;
    }
    const scopes = [
        'instagram_basic',
        'instagram_manage_comments',
        'instagram_manage_messages',
        'pages_show_list',
        'pages_read_engagement',
        'pages_manage_metadata',
    ].join(',');
    const params = new URLSearchParams({
        client_id: metaAppId(),
        redirect_uri: metaRedirectUri(),
        scope: scopes,
        response_type: 'code',
        state: state || 'link4deal',
    });
    return `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
}

async function exchangeCodeForToken(code) {
    if (!isMetaConfigured()) {
        return { ok: false, mode: 'stub', message: 'META_APP_ID / META_APP_SECRET no configurados' };
    }
    const params = new URLSearchParams({
        client_id: metaAppId(),
        client_secret: metaAppSecret(),
        redirect_uri: metaRedirectUri(),
        code: String(code),
    });
    const url = `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token?${params.toString()}`;
    const res = await fetch(url);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
        return { ok: false, mode: 'api', message: data.error?.message || 'Error intercambiando código OAuth' };
    }
    return {
        ok: true,
        mode: 'api',
        accessToken: data.access_token,
        tokenType: data.token_type,
        expiresIn: data.expires_in,
    };
}

async function graphGet(path, accessToken, query = {}) {
    if (!accessToken) {
        return { ok: false, mode: 'stub', data: null };
    }
    const q = new URLSearchParams({ ...query, access_token: accessToken });
    const url = `https://graph.facebook.com/${GRAPH_VERSION}${path.startsWith('/') ? path : `/${path}`}?${q}`;
    const res = await fetch(url);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
        return { ok: false, mode: 'api', error: data.error || { message: 'Graph API error' }, data: null };
    }
    return { ok: true, mode: 'api', data };
}

function integrationStatusPayload() {
    return {
        configured: isMetaConfigured(),
        graphApiVersion: GRAPH_VERSION,
        appIdPresent: Boolean(metaAppId()),
        appSecretPresent: Boolean(metaAppSecret()),
        redirectUri: metaRedirectUri(),
        webhookVerifyTokenConfigured: Boolean(process.env.META_WEBHOOK_VERIFY_TOKEN),
        oauthUrl: buildOAuthUrl('admin_crm'),
        setupChecklist: [
            'Crear app en developers.facebook.com (tipo Business)',
            'Añadir producto Instagram Graph API y Webhooks',
            'Configurar META_APP_ID, META_APP_SECRET, META_WEBHOOK_VERIFY_TOKEN',
            'OAuth redirect: META_INSTAGRAM_REDIRECT_URI o FRONTEND_URL + /api/instagram/oauth/callback',
            'Webhook URL: {tu-dominio}/api/instagram/webhook',
            'Suscribir campos: comments, messages, mentions (instagram)',
            'Vincular cuenta Instagram Business a una página de Facebook',
        ],
        docsUrl: 'https://developers.facebook.com/docs/instagram-api/',
    };
}

module.exports = {
    GRAPH_VERSION,
    metaAppId,
    metaAppSecret,
    metaRedirectUri,
    webhookVerifyToken,
    isMetaConfigured,
    buildOAuthUrl,
    exchangeCodeForToken,
    graphGet,
    integrationStatusPayload,
};
