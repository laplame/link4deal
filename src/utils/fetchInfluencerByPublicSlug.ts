import { apiUrl } from './apiUrl';
import { docMatchesPublicSlug, normalizeSlugInput } from './influencerPublicSlug';

type ApiInfluencerPayload = {
  success?: boolean;
  data?: Record<string, unknown>;
  message?: string;
};

async function parseInfluencerResponse(
  res: Response,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; status: number; message: string }> {
  let body: ApiInfluencerPayload | null = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok || !body?.success || !body.data) {
    return {
      ok: false,
      status: res.status,
      message:
        typeof body?.message === 'string'
          ? body.message
          : res.status === 0 || res.status >= 500
            ? 'No se pudo conectar con el API'
            : `Influencer no encontrado (${res.status})`,
    };
  }
  return { ok: true, data: body.data };
}

async function fetchBySlugAttempt(slug: string) {
  return fetch(apiUrl(`/api/influencers/by-slug/${encodeURIComponent(slug)}`), {
    headers: { Accept: 'application/json' },
  });
}

async function fetchById(id: string) {
  return fetch(apiUrl(`/api/influencers/${id}`), {
    headers: { Accept: 'application/json' },
  });
}

/** Lista pública (fallback si el API en prod no resuelve slug compacto). */
async function findInfluencerInMarketplaceList(slug: string): Promise<Record<string, unknown> | null> {
  const wanted = normalizeSlugInput(slug);
  if (!wanted) return null;

  let page = 1;
  const limit = 100;
  for (let guard = 0; guard < 20; guard += 1) {
    const res = await fetch(
      apiUrl(`/api/influencers?page=${page}&limit=${limit}&enrich=false`),
      { headers: { Accept: 'application/json' } },
    );
    if (!res.ok) return null;
    const body = await res.json().catch(() => ({}));
    const docs: Record<string, unknown>[] = Array.isArray(body?.data?.docs)
      ? body.data.docs
      : Array.isArray(body?.data)
        ? body.data
        : [];
    const hit = docs.find((row) =>
      docMatchesPublicSlug(
        {
          name: String(row.name || ''),
          username: String(row.username || ''),
          socialMedia: row.socialMedia as { instagram?: string; tiktok?: string } | undefined,
        },
        wanted,
      ),
    );
    if (hit?.id) {
      const detail = await fetchById(String(hit.id));
      const parsed = await parseInfluencerResponse(detail);
      if (parsed.ok) return parsed.data;
      return hit;
    }
    const totalPages = Number(body?.data?.totalPages) || 1;
    if (page >= totalPages || docs.length < limit) break;
    page += 1;
  }
  return null;
}

/**
 * Resuelve un influencer por slug público o ObjectId.
 * Reintenta variantes y, si hace falta, busca en el listado (API legacy en producción).
 */
export async function fetchInfluencerByPublicSlug(
  slugParam: string,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; message: string }> {
  const slug = slugParam.trim();
  if (!slug) return { ok: false, message: 'Influencer no encontrado' };

  if (/^[a-f0-9]{24}$/i.test(slug)) {
    const res = await fetchById(slug);
    const parsed = await parseInfluencerResponse(res);
    if (parsed.ok) return parsed;
    return { ok: false, message: parsed.message };
  }

  const normalized = normalizeSlugInput(slug);
  const attempts = [...new Set([normalized, normalized.replace(/-/g, '')].filter(Boolean))];

  for (const attempt of attempts) {
    const res = await fetchBySlugAttempt(attempt);
    const parsed = await parseInfluencerResponse(res);
    if (parsed.ok) return parsed;
    if (res.status !== 404) {
      return { ok: false, message: parsed.message };
    }
  }

  const fromList = await findInfluencerInMarketplaceList(normalized);
  if (fromList) return { ok: true, data: fromList };

  return { ok: false, message: 'Influencer no encontrado' };
}
