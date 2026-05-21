#!/usr/bin/env node
/**
 * Crea/actualiza el modelo CRM de outreach para moris.fitnesscoach.
 *
 *   node server/scripts/seed-influencer-crm-outreach-moris.js
 *
 * Opcional: INFLUENCER_ID=... SLUG=moris.fitnesscoach
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const Influencer = require('../models/Influencer');
const InfluencerCrmOutreach = require('../models/InfluencerCrmOutreach');
const { buildMorisFitnessCoachOutreach } = require('../utils/influencerCrmOutreach');

const TARGET_SLUG = (process.env.SLUG || 'moris.fitnesscoach').trim().toLowerCase();
const TARGET_ID = (process.env.INFLUENCER_ID || '').trim();

function nameToSlug(name) {
    return String(name || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9-]/g, '');
}

async function main() {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
        console.error('Falta MONGODB_URI en .env');
        process.exit(1);
    }
    await mongoose.connect(uri);

    let influencer;
    if (TARGET_ID && mongoose.Types.ObjectId.isValid(TARGET_ID)) {
        influencer = await Influencer.findById(TARGET_ID).lean();
    } else {
        const docs = await Influencer.find({}).lean();
        influencer =
            docs.find((d) => (d.username || '').toLowerCase() === TARGET_SLUG) ||
            docs.find((d) => nameToSlug(d.name) === TARGET_SLUG) ||
            docs.find((d) => (d.socialMedia?.instagram || '').toLowerCase().replace(/^@/, '') === TARGET_SLUG);
    }

    if (!influencer) {
        console.error(`No se encontró influencer para slug/id: ${TARGET_SLUG || TARGET_ID}`);
        process.exit(1);
    }

    const influencerId = influencer._id;
    const slug = TARGET_SLUG || (influencer.socialMedia?.instagram || '').replace(/^@/, '') || nameToSlug(influencer.name);
    const payload = buildMorisFitnessCoachOutreach(influencerId);
    payload.publicSlug = slug;
    if (!payload.profilePublicUrl) {
        payload.profilePublicUrl = `https://damecodigo.com/influencer/${encodeURIComponent(slug)}`;
    }

    const existing = await InfluencerCrmOutreach.findOne({ influencerId });
    let doc;
    if (existing) {
        existing.set(payload);
        doc = await existing.save();
        console.log('✅ Outreach CRM actualizado:', doc._id.toString());
    } else {
        doc = await InfluencerCrmOutreach.create(payload);
        console.log('✅ Outreach CRM creado:', doc._id.toString());
    }

    await Influencer.updateOne(
        { _id: influencerId },
        {
            $set: {
                username: influencer.username || slug,
                'crm.activationStatus': 'onboarding',
                'crm.dataSubmissionStatus': 'partial',
                'crm.onboardingStep': 'awaiting_gmail_for_app_terms',
                'crm.lastContactAt': new Date('2026-05-07T14:41:00-05:00'),
                'crm.adminNotes':
                    'WhatsApp: perfil confirmado 6-may. Perfil en BD 7-may. Pendiente correo Gmail para enviar app + T&C. Spotify episodio enviado 5-may.',
            },
        },
    );

    console.log('   influencerId:', influencerId.toString());
    console.log('   slug:', slug);
    console.log('   pipeline:', doc.pipelineStage);
    console.log('   entregas:', doc.deliveries.length);
    console.log('   perfil:', doc.profilePublicUrl);

    await mongoose.disconnect();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
