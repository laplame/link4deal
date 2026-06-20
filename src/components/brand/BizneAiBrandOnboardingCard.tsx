import { ExternalLink, Smartphone, Store } from 'lucide-react';
import { SITE_CONFIG } from '../../config/site';

interface Props {
  className?: string;
  compact?: boolean;
}

/**
 * Instrucciones para marcas: dar de alta el negocio en la app BizneAI y copiar el shopId.
 */
export function BizneAiBrandOnboardingCard({ className = '', compact = false }: Props) {
  const url = SITE_CONFIG.bizneAiWebsiteUrl;

  return (
    <aside
      className={`rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-4 md:p-5 ${className}`}
      aria-label="Alta de negocio en BizneAI"
    >
      <div className="flex gap-3">
        <div className="shrink-0 rounded-lg bg-violet-100 p-2.5">
          <Smartphone className="h-6 w-6 text-violet-700" aria-hidden />
        </div>
        <div className="min-w-0 space-y-2 text-sm text-gray-700">
          <h2 className="text-base font-semibold text-gray-900">
            Paso obligatorio: app BizneAI
          </h2>
          {!compact && (
            <p>
              Para operar como marca en DameCodigo debes dar de alta tu negocio en la app{' '}
              <strong>BizneAI</strong>. Al registrar tu tienda en la app obtienes un{' '}
              <strong>ID de tienda (shopId)</strong> que vinculamos aquí con tu perfil de marca.
            </p>
          )}
          <ol className="list-decimal list-inside space-y-1 text-gray-600">
            <li>
              Descarga BizneAI en{' '}
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-700 font-medium underline inline-flex items-center gap-0.5"
              >
                bizneai.com
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>Registra tu negocio / tienda en la app</li>
            <li>
              Abre la página de tu negocio en bizneai.com y pega la <strong>URL</strong> abajo (o el shopId si
              lo copias de la app)
            </li>
          </ol>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 transition-colors"
          >
            <Store className="h-4 w-4" />
            Ir a www.bizneai.com
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </aside>
  );
}
