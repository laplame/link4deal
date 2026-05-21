'use strict';

/**
 * Slugs públicos para /influencer/:slug — alineado con handles de red y nombres sin guiones.
 */

function normalizeSlugInput(raw) {
    return String(raw || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/^@+/, '')
        .replace(/[^a-z0-9-]/g, '');
}

/** Nombre → slug con guiones (legacy). */
function nameToSlug(name) {
    if (!name || typeof name !== 'string') return '';
    return normalizeSlugInput(
        name
            .toLowerCase()
            .replace(/\s+/g, '-'),
    );
}

/** Nombre → slug compacto (ej. "luccy la mademoiselita" → luccylamademoiselita). */
function nameToCompactSlug(name) {
    const hyphenated = nameToSlug(name);
    return hyphenated.replace(/-/g, '');
}

function addSlugVariants(set, value) {
    const v = normalizeSlugInput(value);
    if (!v) return;
    set.add(v);
    set.add(v.replace(/-/g, ''));
}

/**
 * Todas las formas de URL válidas para un influencer.
 * @param {object} doc lean o plain
 * @returns {Set<string>}
 */
function collectPublicSlugVariants(doc) {
    const variants = new Set();
    if (!doc) return variants;

    addSlugVariants(variants, doc.username);
    addSlugVariants(variants, doc.name);
    addSlugVariants(variants, nameToSlug(doc.name));
    addSlugVariants(variants, nameToCompactSlug(doc.name));

    const sm = doc.socialMedia || {};
    for (const key of ['instagram', 'tiktok', 'youtube', 'twitter']) {
        addSlugVariants(variants, sm[key]);
    }

    return variants;
}

/** Slug canónico preferido para enlaces (username > instagram > compact name > hyphen name > id). */
function resolveCanonicalPublicSlug(doc) {
    if (!doc) return '';
    const u = normalizeSlugInput((doc.username || '').replace(/^@/, ''));
    if (u) return u;

    const ig = normalizeSlugInput(doc.socialMedia?.instagram);
    if (ig) return ig;

    const compact = nameToCompactSlug(doc.name);
    if (compact) return compact;

    const hyphen = nameToSlug(doc.name);
    if (hyphen) return hyphen;

    return '';
}

function docMatchesPublicSlug(doc, slugParam) {
    const wanted = normalizeSlugInput(slugParam);
    if (!wanted) return false;
    const wantedCompact = wanted.replace(/-/g, '');
    const variants = collectPublicSlugVariants(doc);
    return variants.has(wanted) || variants.has(wantedCompact);
}

module.exports = {
    normalizeSlugInput,
    nameToSlug,
    nameToCompactSlug,
    collectPublicSlugVariants,
    resolveCanonicalPublicSlug,
    docMatchesPublicSlug,
};
