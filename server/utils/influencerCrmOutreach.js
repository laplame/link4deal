'use strict';

const InfluencerCrmOutreach = require('../models/InfluencerCrmOutreach');

/** Orden visual del tablero CRM (izquierda → derecha). */
const PIPELINE_STAGE_ORDER = [
    'lead',
    'contacted',
    'awaiting_contact_email',
    'profile_link_sent',
    'profile_confirmed',
    'in_database',
    'app_link_sent',
    'terms_sent',
    'materials_complete',
    'onboarded',
    'stalled',
    'inactive',
];

const PIPELINE_LABELS = {
    lead: 'Lead',
    contacted: 'Contactado',
    profile_confirmed: 'Perfil confirmado',
    in_database: 'En base de datos',
    profile_link_sent: 'Enlace perfil enviado',
    awaiting_contact_email: 'Esperando correo Gmail',
    app_link_sent: 'App enviada',
    terms_sent: 'Términos enviados',
    materials_complete: 'Materiales completos',
    onboarded: 'Onboarded',
    stalled: 'Estancado',
    inactive: 'Inactivo',
};

function isValidPipelineStage(stage) {
    return PIPELINE_STAGE_ORDER.includes(String(stage || '').trim());
}

const DELIVERY_TYPE_LABELS = {
    spotify_episode: 'Episodio Spotify',
    pitch_message: 'Pitch / presentación',
    profile_link: 'Enlace perfil público',
    profile_confirmation: 'Confirmación de perfil',
    app_link: 'Enlace app DameCodigo',
    terms_document: 'Términos y condiciones',
    terms_and_app_bundle: 'App + términos',
    bizneai_link: 'Enlace BizneAI',
    other: 'Otro',
};

const DELIVERY_STATUS_LABELS = {
    pending: 'Pendiente',
    sent: 'Enviado',
    delivered: 'Entregado',
    opened: 'Abierto',
    failed: 'Fallido',
    cancelled: 'Cancelado',
};

function defaultOutreachPayload(influencerId, slug = '') {
    const base =
        typeof process !== 'undefined' && process.env?.PUBLIC_WEB_BASE_URL
            ? String(process.env.PUBLIC_WEB_BASE_URL).replace(/\/$/, '')
            : 'https://damecodigo.com';
    const publicSlug = (slug || '').trim().replace(/^@/, '');
    return {
        influencerId,
        publicSlug,
        profilePublicUrl: publicSlug ? `${base}/influencer/${encodeURIComponent(publicSlug)}` : '',
        primaryChannel: 'whatsapp',
        pipelineStage: 'lead',
        contactEmailStatus: 'not_requested',
        deliveries: [],
    };
}

function serializeOutreach(doc) {
    if (!doc) return null;
    const d = doc.toObject ? doc.toObject() : doc;
    return {
        id: String(d._id),
        influencerId: String(d.influencerId),
        publicSlug: d.publicSlug || '',
        primaryChannel: d.primaryChannel || 'whatsapp',
        pipelineStage: d.pipelineStage || 'lead',
        pipelineStageLabel: PIPELINE_LABELS[d.pipelineStage] || d.pipelineStage,
        contactEmail: d.contactEmail || '',
        contactEmailStatus: d.contactEmailStatus || 'not_requested',
        contactEmailRequestedAt: d.contactEmailRequestedAt
            ? new Date(d.contactEmailRequestedAt).toISOString()
            : null,
        contactEmailReceivedAt: d.contactEmailReceivedAt
            ? new Date(d.contactEmailReceivedAt).toISOString()
            : null,
        profilePublicUrl: d.profilePublicUrl || '',
        profileConfirmedAt: d.profileConfirmedAt
            ? new Date(d.profileConfirmedAt).toISOString()
            : null,
        profileInDbAt: d.profileInDbAt ? new Date(d.profileInDbAt).toISOString() : null,
        nextAction: d.nextAction || '',
        nextActionDueAt: d.nextActionDueAt ? new Date(d.nextActionDueAt).toISOString() : null,
        conversationSummary: d.conversationSummary || '',
        lastOutboundAt: d.lastOutboundAt ? new Date(d.lastOutboundAt).toISOString() : null,
        lastInboundAt: d.lastInboundAt ? new Date(d.lastInboundAt).toISOString() : null,
        deliveries: (d.deliveries || []).map((item) => ({
            id: String(item._id),
            deliveryKey: item.deliveryKey,
            type: item.type,
            typeLabel: DELIVERY_TYPE_LABELS[item.type] || item.type,
            status: item.status,
            statusLabel: DELIVERY_STATUS_LABELS[item.status] || item.status,
            channel: item.channel,
            title: item.title || '',
            url: item.url || '',
            sentAt: item.sentAt ? new Date(item.sentAt).toISOString() : null,
            notes: item.notes || '',
        })),
        updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : null,
    };
}

/**
 * @param {string} influencerId
 * @param {string} [slug]
 */
async function getOrCreateOutreach(influencerId, slug = '') {
    let doc = await InfluencerCrmOutreach.findOne({ influencerId });
    if (!doc) {
        doc = await InfluencerCrmOutreach.create(defaultOutreachPayload(influencerId, slug));
    } else if (slug && !doc.publicSlug) {
        doc.publicSlug = slug.replace(/^@/, '');
        if (!doc.profilePublicUrl) {
            const base =
                (process.env.PUBLIC_WEB_BASE_URL || 'https://damecodigo.com').replace(/\/$/, '');
            doc.profilePublicUrl = `${base}/influencer/${encodeURIComponent(doc.publicSlug)}`;
        }
        await doc.save();
    }
    return doc;
}

/**
 * Plantilla de outreach para moris.fitnesscoach (conversación WhatsApp + Spotify).
 */
function buildMorisFitnessCoachOutreach(influencerId) {
    const slug = 'moris.fitnesscoach';
    const profileUrl = 'https://damecodigo.com/influencer/moris.fitnesscoach';
    const spotifyUrl =
        'https://open.spotify.com/episode/72xov3TYpannkBJMj14azc?si=VjH3J06FRGqkOxcPT9zu0w';

    return {
        influencerId,
        publicSlug: slug,
        primaryChannel: 'whatsapp',
        pipelineStage: 'awaiting_contact_email',
        contactEmail: '',
        contactEmailStatus: 'requested',
        contactEmailRequestedAt: new Date('2026-05-07T14:41:00-05:00'),
        profilePublicUrl: profileUrl,
        profileConfirmedAt: new Date('2026-05-06T11:46:00-05:00'),
        profileInDbAt: new Date('2026-05-07T00:00:00-05:00'),
        nextAction:
            'Solicitar y registrar correo Gmail del influencer; enviar enlace de la app DameCodigo y términos y condiciones.',
        nextActionDueAt: new Date('2026-05-08T18:00:00-05:00'),
        lastOutboundAt: new Date('2026-05-07T14:41:00-05:00'),
        lastInboundAt: new Date('2026-05-06T11:46:00-05:00'),
        conversationSummary: [
            '5 may 2026: Pitch DameCodigo + episodio Spotify (Monetiza tu comunidad sin seguidores mínimos).',
            '6 may 2026: Influencer confirma "Sí, ese es mi perfil".',
            '6–7 may: Equipo indica que compartirá enlace del perfil cuando esté en BD (perfil ya creado 7 may).',
            '7 may ~14:41: Se solicita correo Gmail para enviar link de la app y términos y condiciones — pendiente de respuesta.',
        ].join('\n'),
        deliveries: [
            {
                deliveryKey: 'spotify_episode_may2026',
                type: 'spotify_episode',
                status: 'sent',
                channel: 'whatsapp',
                title: 'Monetiza tu comunidad sin seguidores mínimos — DameCodigo',
                url: spotifyUrl,
                sentAt: new Date('2026-05-05T18:30:00-05:00'),
                notes: 'Episodio Spotify compartido en conversación.',
            },
            {
                deliveryKey: 'pitch_damecodigo_may2026',
                type: 'pitch_message',
                status: 'sent',
                channel: 'whatsapp',
                title: 'Presentación DameCodigo',
                sentAt: new Date('2026-05-05T18:30:00-05:00'),
                notes: 'Mensaje inicial de monetización de comunidad.',
            },
            {
                deliveryKey: 'profile_confirmation_may2026',
                type: 'profile_confirmation',
                status: 'delivered',
                channel: 'whatsapp',
                title: 'Confirmación de perfil',
                sentAt: new Date('2026-05-06T11:46:00-05:00'),
                notes: 'Respuesta del influencer: "Sí, ese es mi perfil."',
            },
            {
                deliveryKey: 'profile_in_db_promise',
                type: 'other',
                status: 'sent',
                channel: 'whatsapp',
                title: 'Compromiso envío enlace cuando esté en BD',
                sentAt: new Date('2026-05-06T14:00:00-05:00'),
                notes: '"En cuanto tenga tu perfil en nuestra bd te la comparto"',
            },
            {
                deliveryKey: 'profile_link_public',
                type: 'profile_link',
                status: 'pending',
                channel: 'whatsapp',
                title: 'Perfil público DameCodigo',
                url: profileUrl,
                notes: 'Perfil ya existe en BD; pendiente reenviar enlace por WhatsApp.',
            },
            {
                deliveryKey: 'gmail_request_app_terms',
                type: 'terms_and_app_bundle',
                status: 'pending',
                channel: 'whatsapp',
                title: 'Solicitud correo Gmail + app + T&C',
                sentAt: new Date('2026-05-07T14:41:00-05:00'),
                notes: 'Mensaje saliente: se necesita correo Gmail para mandar link de app y términos.',
            },
            {
                deliveryKey: 'app_link_damecodigo',
                type: 'app_link',
                status: 'pending',
                channel: 'email',
                title: 'App DameCodigo (influencer)',
                notes: 'Bloqueado hasta recibir correo Gmail.',
            },
            {
                deliveryKey: 'terms_conditions',
                type: 'terms_document',
                status: 'pending',
                channel: 'email',
                title: 'Términos y condiciones',
                notes: 'Bloqueado hasta recibir correo Gmail.',
            },
        ],
    };
}

module.exports = {
    PIPELINE_STAGE_ORDER,
    PIPELINE_LABELS,
    isValidPipelineStage,
    DELIVERY_TYPE_LABELS,
    DELIVERY_STATUS_LABELS,
    defaultOutreachPayload,
    serializeOutreach,
    getOrCreateOutreach,
    buildMorisFitnessCoachOutreach,
};
