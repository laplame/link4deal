import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Smartphone, Store } from 'lucide-react';
import { SITE_CONFIG } from '../config/site';

type Locale = 'es' | 'en';

interface Props {
  locale?: Locale;
  className?: string;
}

export function BizneAiAuctionBusinessCta({ locale = 'es', className = '' }: Props) {
  const url = SITE_CONFIG.bizneAiWebsiteUrl;
  const isEs = locale === 'es';

  return (
    <aside
      className={`rounded-2xl border border-violet-500/35 bg-gradient-to-br from-violet-950/55 via-gray-900/90 to-slate-950/90 p-5 md:p-6 shadow-lg shadow-violet-950/20 ${className}`}
      aria-label={isEs ? 'Cómo dar de alta tu negocio con BizneAI' : 'How to list your business with BizneAI'}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-4 min-w-0">
          <div className="shrink-0 rounded-xl bg-violet-600/25 p-3 border border-violet-400/20">
            <Smartphone className="h-7 w-7 text-violet-200" aria-hidden />
          </div>
          <div className="min-w-0 space-y-2">
            <h2 className="text-base md:text-lg font-semibold text-white leading-snug">
              {isEs
                ? 'Negocios: participa en subastas con BizneAI'
                : 'Businesses: join auctions with BizneAI'}
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed max-w-2xl">
              {isEs ? (
                <>
                  Para <strong className="text-white font-medium">dar de alta tu negocio</strong> y aparecer en el{' '}
                  <strong className="text-white font-medium">listado de negocios</strong> desde el que las marcas e
                  influencers vinculan campañas y subastas, necesitas la app{' '}
                  <strong className="text-white font-medium">BizneAI</strong>. Descárgala desde{' '}
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-300 hover:text-violet-200 underline underline-offset-2 font-medium inline-flex items-center gap-1"
                  >
                    bizneai.com
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80" />
                  </a>
                  . Al completar el registro en BizneAI, tu tienda se sincroniza y{' '}
                  <strong className="text-white font-medium">aparece aquí automáticamente</strong> en este directorio.
                </>
              ) : (
                <>
                  To <strong className="text-white font-medium">onboard your business</strong> and appear in the{' '}
                  <strong className="text-white font-medium">public business listing</strong> used for campaigns and
                  live auctions, use the <strong className="text-white font-medium">BizneAI</strong> app. Download it
                  from{' '}
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-300 hover:text-violet-200 underline underline-offset-2 font-medium inline-flex items-center gap-1"
                  >
                    bizneai.com
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80" />
                  </a>
                  . After you register in BizneAI, your store{' '}
                  <strong className="text-white font-medium">shows up here automatically</strong>.
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 md:min-w-[11rem]">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2.5 transition-colors"
          >
            {isEs ? 'Ir a BizneAI' : 'Visit BizneAI'}
            <ExternalLink className="h-4 w-4" />
          </a>
          <Link
            to="/tiendas"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-gray-100 text-sm font-medium px-4 py-2.5 transition-colors"
          >
            <Store className="h-4 w-4" />
            {isEs ? 'Ver listado de tiendas' : 'View store directory'}
          </Link>
        </div>
      </div>
    </aside>
  );
}
