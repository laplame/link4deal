import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  Store,
  Ticket,
  ExternalLink,
  Share2,
  Check,
  BadgePercent,
  ShieldCheck,
} from 'lucide-react';
import { apiUrl } from '../utils/apiUrl';
import { fetchInfluencerByPublicSlug } from '../utils/fetchInfluencerByPublicSlug';
import {
  mapInfluencerAvailableRowToProductCard,
  type InfluencerAvailableProductApiRow,
} from '../utils/mapPromotionToProductCard';
import { AMAZON_MX_STORE_LABEL } from '../utils/amazonPromotion';
import {
  applyMobileWebAppHtmlFlags,
  getMobileWebAppContext,
  buildInfluencerPromoUrl,
} from '../utils/mobileWebApp';
import {
  useInfluencerCouponFlow,
  type CouponFlowInfluencer,
} from '../components/influencer/InfluencerCouponFlow';
import { formatPrice } from '../utils/formatters';

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

const PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"%3E%3Crect fill="%23ede9fe" width="600" height="600"/%3E%3Ctext fill="%23a78bfa" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="28"%3EOferta%3C/text%3E%3C/svg%3E';

export default function InfluencerPromoPage() {
  const { influencerSlug, promotionId } = useParams();
  const mobileCtx = useMemo(() => getMobileWebAppContext(), []);
  const mobileInApp = mobileCtx.isMobileInApp;

  useEffect(() => {
    applyMobileWebAppHtmlFlags(mobileCtx);
  }, [mobileCtx]);

  const [influencer, setInfluencer] = useState<CouponFlowInfluencer | null>(null);
  const [row, setRow] = useState<InfluencerAvailableProductApiRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { startFlowForRow, modals } = useInfluencerCouponFlow(influencer, mobileInApp);

  const product = useMemo(
    () => (row ? mapInfluencerAvailableRowToProductCard(row) : null),
    [row],
  );

  useEffect(() => {
    if (!influencerSlug || !promotionId) {
      setError('Promoción no encontrada');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const result = await fetchInfluencerByPublicSlug(influencerSlug);
        if (cancelled) return;
        if (!result.ok) {
          setError(result.message);
          return;
        }
        const d = result.data;
        const inf: CouponFlowInfluencer = {
          id: String(d.id || ''),
          name: typeof d.name === 'string' ? d.name : undefined,
          username: typeof d.username === 'string' ? d.username : undefined,
          profileShortCode:
            typeof d.profileShortCode === 'string' ? d.profileShortCode : undefined,
        };
        setInfluencer(inf);

        const res = await fetch(apiUrl(`/api/influencers/${inf.id}/available-products`));
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        const rows: InfluencerAvailableProductApiRow[] =
          data?.success && Array.isArray(data.data) ? data.data : [];
        const found = rows.find((r) => String(r.promotionId) === String(promotionId)) || null;
        if (!found) {
          setError('Esta oferta no está disponible (puede haber expirado o no estar aprobada).');
          return;
        }
        setRow(found);
      } catch {
        if (!cancelled) setError('No se pudo conectar con el servidor.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [influencerSlug, promotionId]);

  const promo = (row?.promotion || {}) as Record<string, unknown>;
  const isRedirect = Boolean(promo.redirectInsteadOfQr);

  const handleShare = async () => {
    const url = buildInfluencerPromoUrl(influencerSlug || '', promotionId || '');
    try {
      if (navigator.share) {
        await navigator.share({ title: product?.name || 'Oferta', url });
        return;
      }
    } catch {
      /* usuario canceló o no soportado */
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  if (loading) {
    return (
      <div className="influencer-promo-page flex min-h-[100dvh] items-center justify-center px-4">
        <div className="flex items-center gap-2 text-gray-700">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          Cargando oferta…
        </div>
      </div>
    );
  }

  if (error || !row || !product || !influencer?.id) {
    return (
      <div className="container mx-auto max-w-md px-4 py-12 text-center">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-red-800">
          {error || 'Oferta no disponible'}
        </div>
        <Link
          to={`/influencer/${encodeURIComponent(influencerSlug || '')}`}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Ver perfil del influencer
        </Link>
      </div>
    );
  }

  const discountPct =
    typeof promo.discountPercentage === 'number' && promo.discountPercentage > 0
      ? Math.round(promo.discountPercentage)
      : product.originalPrice && product.originalPrice > product.price
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

  return (
    <div
      className={cn(
        'influencer-promo-page min-h-[100dvh] bg-gradient-to-b from-purple-50 via-white to-white',
        mobileInApp ? 'pb-[env(safe-area-inset-bottom,0px)]' : '',
      )}
    >
      <div className={cn('mx-auto px-4 py-5', mobileInApp ? 'max-w-md' : 'max-w-md sm:max-w-lg')}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <Link
            to={`/influencer/${encodeURIComponent(influencerSlug || '')}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Perfil
          </Link>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-50"
          >
            {copied ? <Check className="h-4 w-4" aria-hidden /> : <Share2 className="h-4 w-4" aria-hidden />}
            {copied ? 'Copiado' : 'Compartir'}
          </button>
        </div>

        {influencer.name || influencer.username ? (
          <p className="mb-2 text-center text-xs text-gray-500">
            Oferta de{' '}
            <span className="font-semibold text-gray-700">
              {influencer.name || `@${influencer.username}`}
            </span>
          </p>
        ) : null}

        <div className="overflow-hidden rounded-3xl border border-purple-100 bg-white shadow-lg">
          <div className="relative">
            <img
              src={product.image || PLACEHOLDER}
              alt={product.name}
              className="aspect-square w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = PLACEHOLDER;
              }}
            />
            {discountPct > 0 && (
              <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-red-500 px-3 py-1 text-sm font-bold text-white shadow">
                <BadgePercent className="h-4 w-4" aria-hidden />
                {discountPct}% OFF
              </div>
            )}
            {product.isAmazonMx && (
              <div className="absolute right-3 top-3 rounded-full bg-[#FF9900] px-3 py-1 text-xs font-bold text-black shadow">
                {AMAZON_MX_STORE_LABEL}
              </div>
            )}
          </div>

          <div className="p-5">
            {product.brand ? (
              <p className="text-xs font-medium uppercase tracking-wide text-purple-600">{product.brand}</p>
            ) : null}
            <h1 className="mt-1 text-xl font-bold leading-tight text-gray-900">{product.name}</h1>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-gray-900">
                {formatPrice(product.price, product.currency)}
              </span>
              {product.originalPrice && product.originalPrice > product.price ? (
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(product.originalPrice, product.currency)}
                </span>
              ) : null}
            </div>

            {product.description ? (
              <p className="mt-3 text-sm leading-relaxed text-gray-600 line-clamp-4">
                {product.description}
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => startFlowForRow(row)}
              className={cn(
                'mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-base font-semibold text-white shadow-lg transition active:scale-[0.99]',
                isRedirect
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-emerald-600 hover:bg-emerald-700',
              )}
            >
              {isRedirect ? (
                <>
                  <ExternalLink className="h-5 w-5" aria-hidden />
                  Ir a la tienda y comprar
                </>
              ) : (
                <>
                  <Ticket className="h-5 w-5" aria-hidden />
                  Conseguir mi cupón
                </>
              )}
            </button>

            <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
              {isRedirect
                ? 'Te llevamos a la tienda oficial para completar la compra.'
                : 'Cupón verificable con QR. Válido por tiempo limitado.'}
            </div>

            <Link
              to={`/influencer/${encodeURIComponent(influencerSlug || '')}/deals`}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Store className="h-4 w-4" aria-hidden />
              Ver todas las ofertas de este influencer
            </Link>
          </div>
        </div>
      </div>

      {modals}
    </div>
  );
}
