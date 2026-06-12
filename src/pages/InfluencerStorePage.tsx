import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, LayoutGrid, Loader2, User } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import QRCode from 'qrcode';
import { apiUrl } from '../utils/apiUrl';
import { fetchInfluencerByPublicSlug } from '../utils/fetchInfluencerByPublicSlug';
import {
  mapInfluencerAvailableRowToProductCard,
  type InfluencerAvailableProductApiRow,
} from '../utils/mapPromotionToProductCard';
import { masonryTierFromId } from '../utils/masonryVariant';
import { applyMobileWebAppHtmlFlags, getMobileWebAppContext } from '../utils/mobileWebApp';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

type InfluencerLite = {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  profileShortCode?: string;
};

type StoreModalShellProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  mobileInApp: boolean;
};

function StoreModalShell({ open, onClose, children, mobileInApp }: StoreModalShellProps) {
  if (!open) return null;
  return (
    <div
      className={cn(
        'influencer-store-modal-backdrop fixed inset-0 z-[100] flex bg-black/70',
        mobileInApp ? 'items-center justify-center p-2' : 'items-center justify-center px-4 py-6',
      )}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={cn(
          'influencer-store-modal-panel w-full bg-white shadow-2xl overflow-y-auto overscroll-contain',
          mobileInApp
            ? 'max-w-md rounded-2xl max-h-[min(100dvh,720px)] flex flex-col my-auto'
            : 'max-w-lg rounded-2xl max-h-[min(90dvh,720px)] p-6',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cn(mobileInApp && 'p-4 sm:p-5 flex flex-col min-h-0 flex-1')}>{children}</div>
      </div>
    </div>
  );
}

export default function InfluencerStorePage() {
  const { influencerSlug } = useParams();
  const mobileCtx = useMemo(() => getMobileWebAppContext(), []);
  const mobileInApp = mobileCtx.isMobileInApp;

  useEffect(() => {
    applyMobileWebAppHtmlFlags(mobileCtx);
  }, [mobileCtx]);

  const [influencer, setInfluencer] = useState<InfluencerLite | null>(null);
  const [loadingInfluencer, setLoadingInfluencer] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rows, setRows] = useState<InfluencerAvailableProductApiRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);

  const products = useMemo(() => rows.map(mapInfluencerAvailableRowToProductCard), [rows]);

  const [redirectModal, setRedirectModal] = useState<{
    open: boolean;
    targetUrl: string;
    endsAtMs: number;
  }>({ open: false, targetUrl: '', endsAtMs: 0 });
  const [redirectCountdownSec, setRedirectCountdownSec] = useState<number>(0);

  const [qrModal, setQrModal] = useState<{
    open: boolean;
    title: string;
    qrValue: string;
    qrDataUrl: string;
    error: string | null;
    loading: boolean;
    endsAtMs: number;
  }>({
    open: false,
    title: '',
    qrValue: '',
    qrDataUrl: '',
    error: null,
    loading: false,
    endsAtMs: 0,
  });
  const [qrCountdownSec, setQrCountdownSec] = useState<number>(0);
  const [lastQrRow, setLastQrRow] = useState<InfluencerAvailableProductApiRow | null>(null);

  useBodyScrollLock(redirectModal.open || qrModal.open);

  const getOrCreateDeviceId = () => {
    const key = 'l4d_device_id';
    try {
      const existing = localStorage.getItem(key);
      if (existing && existing.trim()) return existing.trim();
      const bytes = new Uint8Array(12);
      crypto.getRandomValues(bytes);
      const id = `web_${Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')}`;
      localStorage.setItem(key, id);
      return id;
    } catch {
      return `web_${Date.now().toString(16)}`;
    }
  };

  const trackAndOpen = async (row: InfluencerAvailableProductApiRow) => {
    const promo = (row.promotion || {}) as Record<string, unknown>;
    const redirectInsteadOfQr = Boolean(promo.redirectInsteadOfQr);
    if (!redirectInsteadOfQr) return;
    const raw = typeof promo.redirectToUrl === 'string' ? promo.redirectToUrl.trim() : '';
    const targetUrl = raw || 'https://amzn.to/3NfsW8K';
    try {
      await fetch(apiUrl(`/api/influencers/${influencer?.id}/outbound-click`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promotionId: row.promotionId,
          catalogProductId: row.catalogProductId,
          targetUrl,
          page: 'influencer_store',
          referrer: typeof document !== 'undefined' ? document.referrer : '',
        }),
      });
    } catch {
      // best-effort
    } finally {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const startQrCouponFlow = async (row: InfluencerAvailableProductApiRow) => {
    const promo = (row.promotion || {}) as Record<string, unknown>;
    const isRedirect = Boolean(promo.redirectInsteadOfQr);
    if (isRedirect) return;

    const influencerId = influencer?.id;
    if (!influencerId) return;

    const promotionId = row.promotionId;
    const deviceId = getOrCreateDeviceId();
    const baseRef =
      (influencer?.profileShortCode || influencer?.username || 'STORE').toString().toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 16) ||
      'STORE';
    const referralCode = `L4D-${baseRef}-${Date.now().toString(36).toUpperCase()}`;
    const discountPercentage =
      typeof promo.discountPercentage === 'number' && Number.isFinite(promo.discountPercentage)
        ? Math.min(100, Math.max(0, Math.round(promo.discountPercentage)))
        : 0;

    const endsAtMs = Date.now() + 10 * 60 * 1000;
    setLastQrRow(row);
    setQrModal({
      open: true,
      title: typeof promo.title === 'string' ? promo.title : 'Cupón',
      qrValue: '',
      qrDataUrl: '',
      error: null,
      loading: true,
      endsAtMs,
    });
    setQrCountdownSec(Math.ceil((endsAtMs - Date.now()) / 1000));

    try {
      const url = apiUrl(
        `/api/discount-qr/create?deviceId=${encodeURIComponent(deviceId)}&influencerId=${encodeURIComponent(
          influencerId,
        )}&promotionId=${encodeURIComponent(promotionId)}&referralCode=${encodeURIComponent(
          referralCode,
        )}&discountPercentage=${encodeURIComponent(String(discountPercentage))}&walletAddress=not-provided`,
      );
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok || !data?.qrValue) {
        throw new Error(data?.message || 'No se pudo emitir el cupón.');
      }
      const qrValue = String(data.qrValue);
      const qrDataUrl = await QRCode.toDataURL(qrValue, { width: 480, margin: 1, errorCorrectionLevel: 'L' });
      setQrModal((s) => ({
        ...s,
        open: true,
        loading: false,
        qrValue,
        qrDataUrl,
        error: null,
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error emitiendo cupón';
      setQrModal((s) => ({ ...s, open: true, loading: false, error: msg }));
    }
  };

  const startRedirectFlow = async (row: InfluencerAvailableProductApiRow) => {
    const promo = (row.promotion || {}) as Record<string, unknown>;
    const redirectInsteadOfQr = Boolean(promo.redirectInsteadOfQr);
    if (!redirectInsteadOfQr) return;
    const raw = typeof promo.redirectToUrl === 'string' ? promo.redirectToUrl.trim() : '';
    const targetUrl = raw || 'https://amzn.to/3NfsW8K';
    const endsAtMs = Date.now() + 10 * 60 * 1000;

    // Open immediately (popup blockers may apply)
    window.open(targetUrl, '_blank', 'noopener,noreferrer');

    setRedirectModal({ open: true, targetUrl, endsAtMs });
    setRedirectCountdownSec(Math.ceil((endsAtMs - Date.now()) / 1000));

    // Track best-effort (do not block UI)
    void trackAndOpen({
      ...row,
      promotion: { ...promo, redirectToUrl: targetUrl },
    } as InfluencerAvailableProductApiRow);
  };

  useEffect(() => {
    if (!redirectModal.open) return;
    const t = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((redirectModal.endsAtMs - Date.now()) / 1000));
      setRedirectCountdownSec(left);
      if (left <= 0) {
        window.clearInterval(t);
      }
    }, 1000);
    return () => window.clearInterval(t);
  }, [redirectModal.open, redirectModal.endsAtMs]);

  const countdownLabel = useMemo(() => {
    const s = Math.max(0, redirectCountdownSec);
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }, [redirectCountdownSec]);

  useEffect(() => {
    if (!qrModal.open) return;
    const t = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((qrModal.endsAtMs - Date.now()) / 1000));
      setQrCountdownSec(left);
      if (left <= 0) window.clearInterval(t);
    }, 1000);
    return () => window.clearInterval(t);
  }, [qrModal.open, qrModal.endsAtMs]);

  const qrCountdownLabel = useMemo(() => {
    const s = Math.max(0, qrCountdownSec);
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }, [qrCountdownSec]);

  useEffect(() => {
    if (!influencerSlug) {
      setError('Influencer no encontrado');
      setInfluencer(null);
      setLoadingInfluencer(false);
      return;
    }

    let cancelled = false;
    setLoadingInfluencer(true);
    setError(null);
    setInfluencer(null);

    (async () => {
      try {
        const result = await fetchInfluencerByPublicSlug(influencerSlug);
        if (cancelled) return;
        if (!result.ok) {
          setError(result.message);
          setInfluencer(null);
          return;
        }
        const d = result.data;
        setInfluencer({
          id: String(d.id || ''),
          name: String(d.name || ''),
          username: typeof d.username === 'string' ? d.username : undefined,
          avatar: typeof d.avatar === 'string' ? d.avatar : undefined,
          profileShortCode: typeof d.profileShortCode === 'string' ? d.profileShortCode : undefined,
        });
      } catch {
        if (!cancelled) setError('No se pudo conectar con el API.');
      } finally {
        if (!cancelled) setLoadingInfluencer(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [influencerSlug]);

  useEffect(() => {
    if (!influencer?.id) {
      setRows([]);
      return;
    }
    let cancelled = false;
    setLoadingRows(true);
    fetch(apiUrl(`/api/influencers/${influencer.id}/available-products`))
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.success && Array.isArray(data.data)) {
          setRows(data.data as InfluencerAvailableProductApiRow[]);
        } else {
          setRows([]);
        }
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingRows(false);
      });

    return () => {
      cancelled = true;
    };
  }, [influencer?.id]);

  if (loadingInfluencer) {
    return (
      <div
        className={cn(
          'influencer-store-page flex min-h-[50dvh] items-center justify-center px-4 py-10',
          mobileInApp && 'min-h-[100dvh]',
        )}
      >
        <div className="flex items-center justify-center gap-2 text-gray-700 text-center">
          <Loader2 className="h-5 w-5 animate-spin shrink-0" aria-hidden />
          Verificando cupones…
        </div>
      </div>
    );
  }

  if (error || !influencer?.id) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-red-800">
          {error || 'Influencer no encontrado'}
        </div>
        <div className="mt-4">
          <Link
            to="/influencer"
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Volver a influencers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'influencer-store-page container mx-auto px-4 py-8 space-y-6',
        mobileInApp && 'max-w-lg px-3 py-4 space-y-4',
      )}
    >
      {mobileInApp && mobileCtx.inAppId ? (
        <p className="text-[11px] text-center text-gray-500 -mb-2">
          Vista optimizada para{' '}
          {mobileCtx.inAppId === 'instagram'
            ? 'Instagram'
            : mobileCtx.inAppId === 'tiktok'
              ? 'TikTok'
              : mobileCtx.inAppId === 'facebook'
                ? 'Facebook'
                : 'esta app'}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to={`/influencer/${encodeURIComponent(influencerSlug || '')}`}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {mobileInApp ? 'Perfil' : 'Volver al perfil'}
          </Link>
          <div className="flex items-center gap-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
              <User className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 leading-tight">
                Deals del influencer {influencer.name || influencer.username || 'influencer'}
              </h1>
              <p className="text-xs text-gray-500">
                Cupones disponibles (aprobados por la marca) para este influencer
                {influencer.profileShortCode ? (
                  <>
                    {' '}
                    · Código: <code className="rounded bg-gray-100 px-1 font-mono">{influencer.profileShortCode}</code>
                  </>
                ) : null}
              </p>
            </div>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-800">
          <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
          {loadingRows ? 'Verificando…' : `${products.length} oferta(s)`}
        </div>
      </div>

      {loadingRows ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50/80 py-12 text-gray-700">
          <Loader2 className="h-5 w-5 animate-spin text-purple-600" aria-hidden />
          Verificando cupones disponibles…
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/80 py-12 px-4 text-center">
          <p className="mb-1 text-gray-700">Aún no hay cupones disponibles en esta tienda.</p>
          <p className="text-sm text-gray-500">
            Cuando una marca apruebe una campaña y esté activa/vigente, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div
          className={cn(
            'columns-1 gap-6 [column-fill:_balance]',
            !mobileInApp && 'md:columns-2 xl:columns-3',
          )}
        >
          {rows.map((row, index) => {
            const product = products[index];
            if (!product) return null;
            const promo = (row.promotion || {}) as Record<string, unknown>;
            const isRedirect = Boolean(promo.redirectInsteadOfQr);
            return (
              <div key={row.cardKey} className="break-inside-avoid mb-6">
                <ProductCard
                  product={product}
                  masonryTier={masonryTierFromId(product.id, index)}
                  onRequestCoupon={
                    isRedirect
                      ? () => void startRedirectFlow(row)
                      : () => void startQrCouponFlow(row)
                  }
                />
              </div>
            );
          })}
        </div>
      )}

      <StoreModalShell
        open={redirectModal.open}
        onClose={() => setRedirectModal({ open: false, targetUrl: '', endsAtMs: 0 })}
        mobileInApp={mobileInApp}
      >
            <div className="flex items-start justify-between gap-3 shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Te vamos a redireccionar a la tienda</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Tienes <span className="font-semibold text-purple-700">10 minutos</span> para completar la compra.
                  No cierres esta página.
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 shrink-0"
                onClick={() => setRedirectModal({ open: false, targetUrl: '', endsAtMs: 0 })}
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 shrink-0">
              <p className="text-sm text-purple-900">
                Tiempo restante: <span className="font-mono font-bold">{countdownLabel}</span>
              </p>
              <p className="mt-1 text-xs text-purple-800/90">
                Se abrió la tienda en otra pestaña. Si no se abrió (bloqueador de popups), usa el botón de abajo.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 shrink-0 pb-[env(safe-area-inset-bottom,0px)]">
              <a
                href={redirectModal.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700"
              >
                Abrir tienda
              </a>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
                onClick={() => setRedirectModal({ open: false, targetUrl: '', endsAtMs: 0 })}
              >
                Ya la abrí
              </button>
            </div>
      </StoreModalShell>

      <StoreModalShell
        open={qrModal.open}
        onClose={() =>
          setQrModal({
            open: false,
            title: '',
            qrValue: '',
            qrDataUrl: '',
            error: null,
            loading: false,
            endsAtMs: 0,
          })
        }
        mobileInApp={mobileInApp}
      >
            <div className="flex items-start justify-between gap-3 shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Tu cupón está listo</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Escanea el QR en la app o muéstralo en tienda. No cierres esta página.
                </p>
                {qrModal.title ? (
                  <p className="mt-1 text-xs text-gray-500">Promoción: {qrModal.title}</p>
                ) : null}
              </div>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 shrink-0"
                onClick={() =>
                  setQrModal({
                    open: false,
                    title: '',
                    qrValue: '',
                    qrDataUrl: '',
                    error: null,
                    loading: false,
                    endsAtMs: 0,
                  })
                }
              >
                Cerrar
              </button>
            </div>

            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shrink-0">
              <p className="text-sm text-emerald-900">
                Tiempo restante: <span className="font-mono font-bold">{qrCountdownLabel}</span>
              </p>
              <p className="mt-1 text-xs text-emerald-800/90">
                Este cupón es temporal; si expira, vuelve a generarlo desde la tienda del influencer.
              </p>
            </div>

            <div
              className={cn(
                'mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-center',
                mobileInApp && 'flex-1 flex flex-col items-center justify-center min-h-[min(52dvh,340px)]',
              )}
            >
              {qrModal.loading ? (
                <div className="flex flex-col items-center justify-center gap-2 text-gray-700 py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" aria-hidden />
                  <span className="text-sm font-medium">Verificando cupón…</span>
                </div>
              ) : qrModal.error ? (
                <div className="text-sm text-red-700 py-4">{qrModal.error}</div>
              ) : qrModal.qrDataUrl ? (
                <>
                  <img
                    src={qrModal.qrDataUrl}
                    alt="QR cupón"
                    className={cn(
                      'mx-auto rounded-lg bg-white p-2 object-contain',
                      mobileInApp ? 'w-[min(72vw,280px)] h-[min(72vw,280px)]' : 'h-56 w-56',
                    )}
                  />
                  {qrModal.qrValue && !mobileInApp ? (
                    <p className="mt-3 text-[11px] text-gray-600 break-all font-mono">{qrModal.qrValue}</p>
                  ) : null}
                </>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 shrink-0 pb-[env(safe-area-inset-bottom,0px)]">
              <Link
                to="/"
                className="inline-flex flex-1 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Abrir / Descargar app
              </Link>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
                onClick={() => {
                  if (lastQrRow) void startQrCouponFlow(lastQrRow);
                }}
              >
                Generar otro
              </button>
            </div>
      </StoreModalShell>
    </div>
  );
}

