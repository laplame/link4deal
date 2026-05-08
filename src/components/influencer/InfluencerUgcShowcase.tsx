import React from 'react';
import { ExternalLink, Quote, Sparkles } from 'lucide-react';

export type UgcVideoItem = {
  url: string;
  platform: string;
  label: string;
  sortOrder: number;
};

export type UgcQuoteItem = {
  text: string;
};

export type UgcProfilePublic = {
  enabled?: boolean;
  headline?: string;
  intro?: string;
  quotes?: UgcQuoteItem[];
  videos?: UgcVideoItem[];
};

const PLATFORM_BADGE: Record<string, { abbr: string; className: string; name: string }> = {
  instagram: { abbr: 'IG', className: 'bg-gradient-to-r from-purple-600 to-pink-500 text-white', name: 'Instagram' },
  tiktok: { abbr: 'TT', className: 'bg-slate-900 text-cyan-300 ring-1 ring-white/15', name: 'TikTok' },
  youtube: { abbr: 'YT', className: 'bg-red-600 text-white', name: 'YouTube' },
  facebook: { abbr: 'FB', className: 'bg-blue-600 text-white', name: 'Facebook' },
  twitter: { abbr: 'X', className: 'bg-slate-950 text-gray-50', name: 'X / Twitter' },
  linkedin: { abbr: 'in', className: 'bg-sky-700 text-white', name: 'LinkedIn' },
  pinterest: { abbr: 'P', className: 'bg-rose-700 text-white', name: 'Pinterest' },
  other: { abbr: '▶', className: 'bg-gray-600 text-white', name: 'Enlace' },
};

function truncateUrlPreview(urlStr: string, max = 52): string {
  try {
    const u = new URL(urlStr);
    const path = (u.pathname + u.search).replace(/^\//, '');
    const host = u.hostname.replace(/^www\./, '');
    const short = path.length > max ? `${path.slice(0, max)}…` : path;
    return short ? `${host}/${short}` : host;
  } catch {
    return urlStr.length > max ? `${urlStr.slice(0, max)}…` : urlStr;
  }
}

function masonrySpan(idx: number, total: number): string {
  if (total <= 1) return 'lg:col-span-2 lg:row-span-2';
  if (total === 2) return 'lg:col-span-1 lg:row-span-2';
  if (idx === 0) return 'lg:col-span-2 lg:row-span-2';
  if (idx === 3 && total >= 6) return 'lg:col-span-2';
  return 'lg:col-span-1';
}

export interface InfluencerUgcShowcaseProps {
  influencerName: string;
  ugc: UgcProfilePublic | undefined | null;
  ownerEditHref?: string;
}

/** Vitrinta público UGC: collage de enlaces por red + frases del creador */
export function InfluencerUgcShowcase({ influencerName, ugc, ownerEditHref }: InfluencerUgcShowcaseProps) {
  const enabled = !!ugc?.enabled;
  const videos = [...(ugc?.videos ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const quotes = ugc?.quotes ?? [];
  const intro = ugc?.intro ?? '';
  const headline = ugc?.headline?.trim() || 'Piezas destacadas · UGC';

  if (!enabled || (!videos.length && !quotes.length && !intro)) {
    if (!ownerEditHref) return null;
    return (
        <section className="bg-white rounded-xl shadow-sm border border-dashed border-violet-200 p-8 text-center">
        <Sparkles className="w-10 h-10 text-violet-400 mx-auto mb-3 opacity-90" />
        <h2 className="text-lg font-semibold text-gray-900">Vitrina UGC</h2>
        <p className="text-sm text-gray-600 mt-2 max-w-lg mx-auto">
          Aún no has publicado contenido destacado tipo UGC. Enlaza tus mejores piezas por red y tus frases; los visitantes
          abrirán cada video en Instagram, TikTok, YouTube, etc.
        </p>
        <a
          href={ownerEditHref}
          className="inline-flex mt-5 items-center justify-center px-5 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
        >
          Crear perfil UGC
        </a>
      </section>
    );
  }

  return (
    <section className="bg-gradient-to-br from-violet-50/90 via-white to-fuchsia-50/40 rounded-2xl border border-violet-100 shadow-sm overflow-hidden">
      <div className="p-6 md:p-8 border-b border-violet-100/80 bg-white/55 backdrop-blur-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 flex items-center gap-2 tracking-tight">
              <Sparkles className="w-6 h-6 text-violet-500 shrink-0" aria-hidden />
              {headline}
            </h2>
            <p className="text-sm text-gray-600 mt-2 max-w-3xl leading-relaxed">
              <strong className="text-gray-800">¿Qué es UGC?</strong> Contenido generado por el usuario o la comunidad —
              vídeos, fotos o publicaciones organicas que demuestran estilo real. Aquí hay muestras de{' '}
              <span className="font-medium text-violet-800">{influencerName}</span> en redes: solo enlaces al canal
              original (Instagram, TikTok, YouTube, Facebook, etc.); así ves cada pieza con su contexto nativo.
            </p>
          </div>
          {ownerEditHref ? (
            <a
              href={ownerEditHref}
              className="text-sm font-medium text-violet-700 hover:text-violet-900 whitespace-nowrap"
            >
              Editar perfil UGC →
            </a>
          ) : null}
        </div>
        {intro ? (
          <blockquote className="mt-5 pl-4 border-l-4 border-violet-300 text-gray-800 text-[15px] leading-relaxed">
            <span className="text-xs font-semibold uppercase tracking-wide text-violet-600 block mb-1">Por el creador</span>
            {intro}
          </blockquote>
        ) : null}
      </div>

      {videos.length > 0 ? (
        <div className="p-6 md:p-8">
          <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-4">Piezas enlazadas</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:auto-rows-[minmax(5.5rem,1fr)]">
            {videos.map((v, idx) => {
              const plat = PLATFORM_BADGE[v.platform?.toLowerCase?.()] ?? PLATFORM_BADGE.other;
              const badge = plat;
              const span = masonrySpan(idx, videos.length);
              return (
                <a
                  key={`${v.url}-${idx}`}
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Abrir en ${badge.name}: ${v.label || truncateUrlPreview(v.url)}`}
                  className={`group relative flex flex-col rounded-2xl border border-violet-200/70 bg-white/90 hover:bg-violet-50/80 hover:border-violet-400/60 shadow-sm hover:shadow-md transition-all duration-200 min-h-[7rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${span}`}
                >
                  <div className="p-4 flex flex-col gap-3 flex-1">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${badge.className}`}
                      >
                        {badge.abbr}
                      </span>
                      <span className="text-xs font-medium text-gray-500 uppercase truncate">{badge.name}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-violet-900">
                      {v.label || `Ver contenido (${badge.name})`}
                    </p>
                    <p className="text-[11px] text-gray-500 font-mono leading-snug line-clamp-2 break-all mt-auto opacity-90">
                      {truncateUrlPreview(v.url, 64)}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600">
                      Abrir publicación original
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden />
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      ) : null}

      {quotes.length > 0 ? (
        <div className={`px-6 md:px-8 ${videos.length ? 'pb-8' : 'py-8'}`}>
          <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Quote className="w-4 h-4 text-violet-500" />
            Frases
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {quotes.map((q, i) => (
              <figure
                key={i}
                className="rounded-xl border border-fuchsia-100 bg-white/95 px-4 py-4 text-gray-800 text-sm leading-relaxed shadow-sm italic"
              >
                <blockquote className="not-italic">“{q.text}”</blockquote>
                <figcaption className="mt-3 text-[11px] text-gray-400 not-italic font-medium">{influencerName}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
