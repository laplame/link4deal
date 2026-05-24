'use strict';

/** Variantes de email (Gmail ignora puntos en local-part). */
function buildEmailCandidates(inputEmail) {
    const email = (inputEmail || '').toLowerCase().trim();
    if (!email.includes('@')) return [email];
    const [localRaw, domainRaw] = email.split('@');
    const domain = domainRaw.trim();
    const local = localRaw.trim();
    const localNoPlus = local.split('+')[0];
    const candidates = new Set([`${local}@${domain}`, `${localNoPlus}@${domain}`]);
    if (domain === 'gmail.com' || domain === 'googlemail.com') {
        candidates.add(`${local.replace(/\./g, '')}@${domain}`);
        candidates.add(`${localNoPlus.replace(/\./g, '')}@${domain}`);
    }
    return [...candidates];
}

module.exports = { buildEmailCandidates };
