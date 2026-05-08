import React, { useCallback, useMemo, useState } from 'react';
import { apiUrl } from '../../utils/apiUrl';
import type { UgcProfilePublic, UgcQuoteItem, UgcVideoItem } from '../influencer/InfluencerUgcShowcase';
import { Link } from 'react-router-dom';
import { LayoutGrid, Loader2, Plus, Save, Trash2 } from 'lucide-react';

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'twitter', label: 'X / Twitter' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'pinterest', label: 'Pinterest' },
  { id: 'other', label: 'Otro' },
] as const;

interface InfluencerUgcEditorProps {
  initial: UgcProfilePublic | undefined;
  publicProfilePath: string;
  onSaved?: (profile: UgcProfilePublic) => void;
}

/** Formulario oscuro hub: guardado vía PATCH /api/influencers/me/ugc-profile */
export function InfluencerUgcEditor({ initial, publicProfilePath, onSaved }: InfluencerUgcEditorProps) {
  const base = useMemo(() => ({
    enabled: !!(initial?.enabled ?? false),
    headline: initial?.headline ?? '',
    intro: initial?.intro ?? '',
    quotes: [...(initial?.quotes ?? [])].map((q) => ({ text: q.text ?? '' })),
    videos: [...(initial?.videos ?? [])]
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((v) => ({
        url: v.url ?? '',
        platform: v.platform ?? 'other',
        label: v.label ?? '',
      })),
  }), [initial]);

  const [draft, setDraft] = useState(base);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const syncDraft = useCallback(() => setDraft(base), [base]);

  React.useEffect(() => {
    syncDraft();
  }, [syncDraft]);

  const persist = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    const token = localStorage.getItem('auth_token');
    const payload = {
      enabled: draft.enabled,
      headline: draft.headline.trim(),
      intro: draft.intro.trim(),
      quotes: draft.quotes.map((q: UgcQuoteItem) => q.text.trim()).filter(Boolean),
      videos: draft.videos
        .map((v) => ({
          url: v.url.trim(),
          platform: v.platform,
          label: v.label.trim(),
        }))
        .filter((v) => v.url),
    };
    try {
      const res = await fetch(apiUrl('/api/influencers/me/ugc-profile'), {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.message === 'string' ? data.message : 'No se pudo guardar.');
        return;
      }
      if (data.success && data.data) {
        const d = data.data;
        const next: UgcProfilePublic = {
          enabled: !!d.enabled,
          headline: String(d.headline ?? ''),
          intro: String(d.intro ?? ''),
          quotes: (Array.isArray(d.quotes) ? d.quotes : []).map((q: UgcQuoteItem | string) =>
            typeof q === 'string' ? { text: q } : { text: String((q as UgcQuoteItem)?.text ?? '') },
          ),
          videos: (Array.isArray(d.videos) ? d.videos : []).map((x: UgcVideoItem) => ({
            url: String(x?.url ?? ''),
            platform: String(x?.platform ?? 'other'),
            label: String(x?.label ?? ''),
            sortOrder: typeof x?.sortOrder === 'number' ? x.sortOrder : 0,
          })),
        };
        setDraft({
          enabled: next.enabled,
          headline: next.headline,
          intro: next.intro,
          quotes: next.quotes,
          videos: next.videos.map(({ url, platform, label }) => ({ url, platform, label })),
        });
        onSaved?.(next);
      }
      setMessage(data.message || 'Guardado.');
    } catch {
      setError('Error de red.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8 pb-16">
      <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-6 space-y-2">
        <div className="flex items-start gap-3">
          <LayoutGrid className="w-10 h-10 text-amber-400 shrink-0" />
          <div>
            <h2 className="text-xl font-semibold text-white">Perfil UGC público</h2>
            <p className="text-sm text-gray-400 mt-1 leading-relaxed">
              Pon aquí tus piezas más representativas usando solo enlaces (Reel, TikTok, Shorts). No pegamos vídeos: el
              visitante va a tu canal. Añade frases en tu voz que refuercen confianza.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Una vez guardado con “Mostrar vitrinta”, se verá en tu{' '}
              <Link to={publicProfilePath} className="text-violet-300 underline-offset-2 hover:underline font-medium">
                perfil público
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer select-none rounded-2xl border border-white/10 bg-gray-900/50 px-4 py-3">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-white/25 text-amber-500 focus:ring-amber-500/40"
          checked={draft.enabled}
          onChange={(e) => setDraft((x) => ({ ...x, enabled: e.target.checked }))}
        />
        <span className="text-sm text-gray-100">Mostrar esta vitrina en mi perfil público</span>
      </label>

      <div className="rounded-2xl border border-white/10 bg-gray-900/55 p-5 space-y-3">
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide">Título corto del bloque</label>
        <input
          className="w-full rounded-xl border border-white/10 bg-gray-950/80 px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-amber-500/40 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          maxLength={120}
          placeholder="Ej. Piezas destacadas · UGC"
          value={draft.headline ?? ''}
          onChange={(e) => setDraft((x) => ({ ...x, headline: e.target.value }))}
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-gray-900/55 p-5 space-y-3">
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide">Nota por el creador</label>
        <textarea
          className="w-full rounded-xl border border-white/10 bg-gray-950/80 px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-amber-500/40 focus:outline-none focus:ring-2 focus:ring-amber-500/20 min-h-[120px]"
          maxLength={2000}
          placeholder="Cómo trabajas tus piezas UGC, qué marcas sueles destacar…"
          value={draft.intro ?? ''}
          onChange={(e) => setDraft((x) => ({ ...x, intro: e.target.value }))}
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-gray-900/55 p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-100">Enlaces a piezas (máx. 16)</h3>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-gray-100 hover:bg-white/15"
            onClick={() =>
              setDraft((x) => ({
                ...x,
                videos: [...x.videos, { url: '', platform: 'other', label: '' }],
              }))
            }
            disabled={(draft.videos?.length ?? 0) >= 16}
          >
            <Plus className="w-3.5 h-3.5" /> Enlace
          </button>
        </div>
        <ul className="space-y-3">
          {(draft.videos ?? []).map((row, idx) => (
            <li
              key={idx}
              className="rounded-xl border border-white/10 bg-gray-950/50 p-3 space-y-2"
            >
              <div className="flex gap-2">
                <select
                  className="rounded-lg border border-white/15 bg-gray-900 text-xs text-gray-100 px-2 py-2 max-w-[8.5rem] shrink-0"
                  value={row.platform || 'other'}
                  onChange={(e) =>
                    setDraft((x) => ({
                      ...x,
                      videos: x.videos.map((v: { url: string; platform: string; label: string }, i: number) =>
                        i === idx ? { ...v, platform: e.target.value } : v
                      ),
                    }))
                  }
                >
                  {PLATFORMS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="HTTPS del post o video"
                  className="flex-1 min-w-0 rounded-lg border border-white/10 bg-gray-900 px-2 py-2 text-xs text-gray-100 font-mono"
                  value={row.url}
                  onChange={(e) =>
                    setDraft((x) => ({
                      ...x,
                      videos: x.videos.map((v: { url: string; platform: string; label: string }, i: number) =>
                        i === idx ? { ...v, url: e.target.value } : v
                      ),
                    }))
                  }
                />
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-400"
                  aria-label="Quitar fila"
                  onClick={() =>
                    setDraft((x) => ({ ...x, videos: x.videos.filter((_v: unknown, i: number) => i !== idx) }))
                  }
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <input
                placeholder="Título opcional visible en tu perfil (ej. “Unboxing natural light”)"
                className="w-full rounded-lg border border-white/10 bg-gray-900 px-2 py-1.5 text-xs text-gray-200"
                value={row.label}
                maxLength={140}
                onChange={(e) =>
                  setDraft((x) => ({
                    ...x,
                    videos: x.videos.map((v: { url: string; platform: string; label: string }, i: number) =>
                      i === idx ? { ...v, label: e.target.value } : v
                    ),
                  }))
                }
              />
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-white/10 bg-gray-900/55 p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-100">Frases (máx. 10)</h3>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-gray-100 hover:bg-white/15"
            disabled={(draft.quotes?.length ?? 0) >= 10}
            onClick={() => setDraft((x) => ({ ...x, quotes: [...x.quotes, { text: '' }] }))}
          >
            <Plus className="w-3.5 h-3.5" /> Frase
          </button>
        </div>
        {(draft.quotes ?? []).map((q, qi) => (
          <div key={qi} className="flex gap-2">
            <textarea
              className="flex-1 rounded-xl border border-white/10 bg-gray-950 text-sm text-gray-100 px-3 py-2 min-h-[3.75rem]"
              maxLength={550}
              value={q.text}
              placeholder="Ej. Solo recomiendo cosas que ya uso en casa…"
              onChange={(e) =>
                setDraft((x) => ({
                  ...x,
                  quotes: x.quotes.map((cq: UgcQuoteItem, i: number) => (i === qi ? { ...cq, text: e.target.value } : cq)),
                }))
              }
            />
            <button
              type="button"
              className="shrink-0 p-2 h-fit rounded-lg hover:bg-white/10 text-gray-400 mt-1"
              onClick={() =>
                setDraft((x) => ({
                  ...x,
                  quotes: x.quotes.filter((_c: unknown, i: number) => i !== qi),
                }))
              }
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => persist()}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-5 py-2.5 text-sm font-semibold text-gray-950 disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar perfil UGC
        </button>
        {message ? <span className="text-sm text-emerald-400">{message}</span> : null}
        {error ? <span className="text-sm text-rose-400">{error}</span> : null}
      </div>
    </div>
  );
}
