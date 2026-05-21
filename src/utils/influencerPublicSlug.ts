/** Misma lógica que server/utils/influencerSlug.js (perfil público /influencer/:slug). */

export function normalizeSlugInput(raw: string): string {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^@+/, '')
    .replace(/[^a-z0-9-]/g, '');
}

export function nameToSlug(name: string): string {
  if (!name?.trim()) return '';
  return normalizeSlugInput(name.toLowerCase().replace(/\s+/g, '-'));
}

export function nameToCompactSlug(name: string): string {
  return nameToSlug(name).replace(/-/g, '');
}

function addSlugVariants(set: Set<string>, value: string) {
  const v = normalizeSlugInput(value);
  if (!v) return;
  set.add(v);
  set.add(v.replace(/-/g, ''));
}

/** Variantes de URL válidas (alineado con server/utils/influencerSlug.js). */
export function collectPublicSlugVariants(inf: {
  name?: string;
  username?: string;
  socialMedia?: { instagram?: string; tiktok?: string; youtube?: string; twitter?: string };
}): Set<string> {
  const variants = new Set<string>();
  addSlugVariants(variants, inf.username || '');
  addSlugVariants(variants, inf.name || '');
  addSlugVariants(variants, nameToSlug(inf.name || ''));
  addSlugVariants(variants, nameToCompactSlug(inf.name || ''));
  const sm = inf.socialMedia || {};
  for (const key of ['instagram', 'tiktok', 'youtube', 'twitter'] as const) {
    addSlugVariants(variants, sm[key] || '');
  }
  return variants;
}

export function docMatchesPublicSlug(
  inf: Parameters<typeof collectPublicSlugVariants>[0],
  slugParam: string,
): boolean {
  const wanted = normalizeSlugInput(slugParam);
  if (!wanted) return false;
  const wantedCompact = wanted.replace(/-/g, '');
  const variants = collectPublicSlugVariants(inf);
  return variants.has(wanted) || variants.has(wantedCompact);
}

export function resolveCanonicalPublicSlug(inf: {
  id?: string;
  name?: string;
  username?: string;
  socialMedia?: { instagram?: string; tiktok?: string; youtube?: string; twitter?: string };
  publicSlug?: string;
}): string {
  if (inf.publicSlug?.trim()) return normalizeSlugInput(inf.publicSlug);
  const u = normalizeSlugInput((inf.username || '').replace(/^@/, ''));
  if (u) return u;
  const ig = normalizeSlugInput(inf.socialMedia?.instagram);
  if (ig) return ig;
  const compact = nameToCompactSlug(inf.name || '');
  if (compact) return compact;
  const hyphen = nameToSlug(inf.name || '');
  if (hyphen) return hyphen;
  return '';
}

/** Ruta del perfil: slug público o ObjectId si no hay slug. */
export function influencerProfilePath(inf: {
  id: string;
  name?: string;
  username?: string;
  socialMedia?: { instagram?: string; tiktok?: string };
  publicSlug?: string;
}): string {
  const slug = resolveCanonicalPublicSlug(inf);
  if (slug) return `/influencer/${encodeURIComponent(slug)}`;
  return `/influencer/${inf.id}`;
}
