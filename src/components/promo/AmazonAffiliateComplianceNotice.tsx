import { AlertTriangle, Clock, ExternalLink, FileText, Scale, ShoppingBag, Ticket } from 'lucide-react';
import { AMAZON_MX_STORE_LABEL } from '../../utils/amazonPromotion';

/** Frase obligatoria del programa Amazon Associates (texto exacto, en inglés). */
export const AMAZON_ASSOCIATE_DISCLOSURE =
  'As an Amazon Associate I earn from qualifying purchases';

type Variant = 'banner' | 'full' | 'priceNote' | 'redirectNote';

interface AmazonAffiliateComplianceNoticeProps {
  variant?: Variant;
  className?: string;
  /** Cupo restante en DameCodigo (totalQuantity − conversiones). */
  dameCodigoSlotsRemaining?: number | null;
}

/**
 * Avisos de cumplimiento del programa de afiliados Amazon (precios en tiempo real,
 * disclosure obligatorio, redirección sin cupón guardado, cupo DameCodigo).
 */
export default function AmazonAffiliateComplianceNotice({
  variant = 'full',
  className = '',
  dameCodigoSlotsRemaining = null,
}: AmazonAffiliateComplianceNoticeProps) {
  if (variant === 'priceNote') {
    return (
      <p className={`text-xs text-amber-900/90 leading-relaxed ${className}`}>
        Los montos mostrados son orientativos. El <strong>precio puede cambiar</strong> en cualquier
        momento según la <strong>disponibilidad y las ofertas vigentes en Amazon</strong>. Lo
        definitivo se confirma en {AMAZON_MX_STORE_LABEL} al hacer la compra.
      </p>
    );
  }

  if (variant === 'redirectNote') {
    return (
      <div className={`text-sm text-blue-900/90 leading-relaxed ${className}`}>
        <p className="font-medium text-blue-950 mb-1 flex items-center gap-1.5">
          <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
          Compra solo por redirección
        </p>
        <p>
          Las promociones de {AMAZON_MX_STORE_LABEL} <strong>no generan cupones guardables</strong> en
          DameCodigo: te llevamos directamente a la tienda oficial para completar la compra.
        </p>
        {dameCodigoSlotsRemaining != null && dameCodigoSlotsRemaining >= 0 ? (
          <p className="mt-2 text-xs text-blue-800/90">
            Accesos disponibles en DameCodigo:{' '}
            <strong>{dameCodigoSlotsRemaining.toLocaleString('es-MX')}</strong>. Este cupo lo
            administra DameCodigo y <strong>no puede excederse</strong>; no depende del inventario
            de Amazon.
          </p>
        ) : null}
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-[#232F3E] border-b border-[#FF9900]/40 px-4 py-3 ${className}`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-start gap-3 text-sm">
          <div className="flex items-start gap-2 text-white min-w-0 flex-1">
            <ShoppingBag className="h-5 w-5 shrink-0 mt-0.5 text-[#FF9900]" aria-hidden />
            <div>
              <p className="font-semibold text-[#FF9900]">{AMAZON_MX_STORE_LABEL}</p>
              <p className="text-white/90 mt-1">
                Sin cupones guardables: solo redirección a la tienda. Precio y disponibilidad pueden
                cambiar según Amazon.
              </p>
            </div>
          </div>
          <p
            className="sm:max-w-md shrink-0 rounded-lg border border-[#FF9900]/50 bg-[#131921] px-3 py-2 text-xs font-medium text-white leading-snug"
            lang="en"
          >
            {AMAZON_ASSOCIATE_DISCLOSURE}
          </p>
        </div>
      </div>
    );
  }

  return (
    <section
      className={`rounded-xl border border-amber-200 bg-amber-50/80 overflow-hidden ${className}`}
      aria-labelledby="amazon-compliance-heading"
    >
      <div className="px-4 sm:px-5 py-4 border-b border-amber-200/80 bg-amber-100/60">
        <h3
          id="amazon-compliance-heading"
          className="text-base font-semibold text-amber-950 flex items-center gap-2"
        >
          <Scale className="h-5 w-5 text-amber-700 shrink-0" aria-hidden />
          Información legal · Programa de afiliados Amazon
        </h3>
        <p className="text-sm text-amber-900/85 mt-1">
          Transparencia sobre precios, cupones, cupo en DameCodigo y alcance de nuestra plataforma.
        </p>
      </div>

      <div className="px-4 sm:px-5 py-4 space-y-5 text-sm text-amber-950/95">
        <div className="flex gap-3">
          <Ticket className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" aria-hidden />
          <div>
            <h4 className="font-semibold text-amber-950 mb-1">Sin cupones guardables · Solo redirección</h4>
            <p className="leading-relaxed text-amber-900/90">
              Por las políticas de Amazon y de nuestro programa de afiliados,{' '}
              <strong>no emitimos ni guardamos cupones</strong> para estas promociones. El flujo es
              únicamente <strong>redirigirte a {AMAZON_MX_STORE_LABEL}</strong> para que compres allí
              con el enlace de afiliado correspondiente.
            </p>
            {dameCodigoSlotsRemaining != null && dameCodigoSlotsRemaining >= 0 ? (
              <p className="mt-2 leading-relaxed text-amber-900/90">
                El número de accesos o atribuciones disponibles lo define{' '}
                <strong>DameCodigo</strong> (actualmente{' '}
                <strong>{dameCodigoSlotsRemaining.toLocaleString('es-MX')}</strong> restantes en esta
                campaña). Ese cupo <strong>no puede excederse</strong> y es independiente del stock o
                la disponibilidad del producto en Amazon.
              </p>
            ) : (
              <p className="mt-2 leading-relaxed text-amber-900/90">
                El cupo de accesos o atribuciones lo administra <strong>DameCodigo</strong> por
                campaña y <strong>no puede excederse</strong>; no refleja el inventario de Amazon.
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Clock className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" aria-hidden />
          <div>
            <h4 className="font-semibold text-amber-950 mb-1">Precios y disponibilidad en tiempo real</h4>
            <p className="leading-relaxed text-amber-900/90">
              Amazon no permite mostrar precios, descuentos ni disponibilidad de forma estática. Lo
              que ves aquí es orientativo: el <strong>precio puede variar</strong> en cualquier
              momento según la <strong>disponibilidad del producto y las ofertas activas en Amazon</strong>.
              La información comercial debe obtenerse en tiempo real vía las APIs autorizadas, con
              estos límites de caché:
            </p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-amber-900/90">
              <li>
                <strong>Precios y disponibilidad:</strong> caché máximo de 1 hora.
              </li>
              <li>
                <strong>Títulos y descripciones:</strong> caché máximo de 24 horas.
              </li>
              <li>
                <strong>Imágenes de producto:</strong> no se guardan en nuestros servidores; deben
                enlazarse directamente desde Amazon y renovarse como máximo cada 24 horas.
              </li>
            </ul>
            <p className="mt-2 text-xs text-amber-800/90 leading-relaxed">
              La Product Advertising API (PA-API) dejará de estar disponible el{' '}
              <strong>15 de mayo de 2026</strong>. Amazon la sustituye por la Creators API.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <FileText className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" aria-hidden />
          <div>
            <h4 className="font-semibold text-amber-950 mb-1">Divulgación obligatoria</h4>
            <p className="leading-relaxed text-amber-900/90 mb-2">
              Donde mostramos contenido del programa de afiliados, Amazon exige una declaración clara
              y visible. Además cumplimos las directrices de la FTC sobre enlaces de afiliado.
            </p>
            <blockquote
              className="rounded-lg border border-amber-300 bg-white/70 px-4 py-3 text-sm font-semibold text-gray-900 not-italic"
              lang="en"
            >
              {AMAZON_ASSOCIATE_DISCLOSURE}
            </blockquote>
          </div>
        </div>

        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" aria-hidden />
          <div>
            <h4 className="font-semibold text-amber-950 mb-1">Contenido con valor añadido</h4>
            <p className="leading-relaxed text-amber-900/90">
              El programa exige comentario, análisis o contexto que aporte valor más allá del
              catálogo. DameCodigo y los creadores actúan como intermediarios de recomendación, no
              como vendedores de Amazon.
            </p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-amber-900/90">
              <li>
                Los <strong>clientes pertenecen a Amazon</strong>, no a DameCodigo ni al influencer.
              </li>
              <li>
                No gestionamos pedidos, devoluciones ni atención al cliente en nombre de Amazon.
              </li>
              <li>
                Compras, envíos y soporte se resuelven exclusivamente con {AMAZON_MX_STORE_LABEL}.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
