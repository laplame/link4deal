import React, { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import QRCode from 'qrcode';
import { apiUrl } from '../../utils/apiUrl';
import { apkDownloadAnchorProps } from '../../utils/appDownload';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import type { InfluencerAvailableProductApiRow } from '../../utils/mapPromotionToProductCard';

export type CouponFlowInfluencer = {
  id: string;
  name?: string;
  username?: string;
  profileShortCode?: string;
};

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** Device id estable para emisión de cupones (mismo bucket que la tienda). */
export function getOrCreateDeviceId(): string {
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
}

type StoreModalShellProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  mobileInApp: boolean;
};

/** Modal a pantalla casi completa, optimizado para webviews de redes sociales. */
export function StoreModalShell({ open, onClose, children, mobileInApp }: StoreModalShellProps) {
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

type RedirectModalState = { open: boolean; targetUrl: string; endsAtMs: number };
type QrModalState = {
  open: boolean;
  title: string;
  qrValue: string;
  qrDataUrl: string;
  error: string | null;
  loading: boolean;
  endsAtMs: number;
};

const CLOSED_REDIRECT: RedirectModalState = { open: false, targetUrl: '', endsAtMs: 0 };
const CLOSED_QR: QrModalState = {
  open: false,
  title: '',
  qrValue: '',
  qrDataUrl: '',
  error: null,
  loading: false,
  endsAtMs: 0,
};

/**
 * Encapsula el flujo de cupón QR y de redirección (tienda externa) para un
 * influencer. Devuelve handlers por fila y el JSX de los modales para montar.
 */
export function useInfluencerCouponFlow(
  influencer: CouponFlowInfluencer | null,
  mobileInApp: boolean,
) {
  const [redirectModal, setRedirectModal] = useState<RedirectModalState>(CLOSED_REDIRECT);
  const [redirectCountdownSec, setRedirectCountdownSec] = useState(0);
  const [qrModal, setQrModal] = useState<QrModalState>(CLOSED_QR);
  const [qrCountdownSec, setQrCountdownSec] = useState(0);
  const [lastQrRow, setLastQrRow] = useState<InfluencerAvailableProductApiRow | null>(null);

  useBodyScrollLock(redirectModal.open || qrModal.open);

  const trackAndOpen = async (row: InfluencerAvailableProductApiRow, targetUrl: string) => {
    try {
      await fetch(apiUrl(`/api/influencers/${influencer?.id}/outbound-click`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promotionId: row.promotionId,
          catalogProductId: row.catalogProductId,
          targetUrl,
          page: 'influencer_promo',
          referrer: typeof document !== 'undefined' ? document.referrer : '',
        }),
      });
    } catch {
      /* best-effort */
    }
  };

  const startRedirectFlow = (row: InfluencerAvailableProductApiRow) => {
    const promo = (row.promotion || {}) as Record<string, unknown>;
    if (!promo.redirectInsteadOfQr) return;
    const raw = typeof promo.redirectToUrl === 'string' ? promo.redirectToUrl.trim() : '';
    const targetUrl = raw || 'https://amzn.to/3NfsW8K';
    const endsAtMs = Date.now() + 10 * 60 * 1000;

    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    setRedirectModal({ open: true, targetUrl, endsAtMs });
    setRedirectCountdownSec(Math.ceil((endsAtMs - Date.now()) / 1000));
    void trackAndOpen(row, targetUrl);
  };

  const startQrCouponFlow = async (row: InfluencerAvailableProductApiRow) => {
    const promo = (row.promotion || {}) as Record<string, unknown>;
    if (promo.redirectInsteadOfQr) return;
    const influencerId = influencer?.id;
    if (!influencerId) return;

    const promotionId = row.promotionId;
    const deviceId = getOrCreateDeviceId();
    const baseRef =
      (influencer?.profileShortCode || influencer?.username || 'STORE')
        .toString()
        .toUpperCase()
        .replace(/[^0-9A-Z]/g, '')
        .slice(0, 16) || 'STORE';
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
      setQrModal((s) => ({ ...s, open: true, loading: false, qrValue, qrDataUrl, error: null }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error emitiendo cupón';
      setQrModal((s) => ({ ...s, open: true, loading: false, error: msg }));
    }
  };

  /** Decide automáticamente entre cupón QR y redirección según la promo. */
  const startFlowForRow = (row: InfluencerAvailableProductApiRow) => {
    const promo = (row.promotion || {}) as Record<string, unknown>;
    if (promo.redirectInsteadOfQr) startRedirectFlow(row);
    else void startQrCouponFlow(row);
  };

  useEffect(() => {
    if (!redirectModal.open) return;
    const t = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((redirectModal.endsAtMs - Date.now()) / 1000));
      setRedirectCountdownSec(left);
      if (left <= 0) window.clearInterval(t);
    }, 1000);
    return () => window.clearInterval(t);
  }, [redirectModal.open, redirectModal.endsAtMs]);

  useEffect(() => {
    if (!qrModal.open) return;
    const t = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((qrModal.endsAtMs - Date.now()) / 1000));
      setQrCountdownSec(left);
      if (left <= 0) window.clearInterval(t);
    }, 1000);
    return () => window.clearInterval(t);
  }, [qrModal.open, qrModal.endsAtMs]);

  const redirectLabel = useMemo(() => {
    const s = Math.max(0, redirectCountdownSec);
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }, [redirectCountdownSec]);

  const qrLabel = useMemo(() => {
    const s = Math.max(0, qrCountdownSec);
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }, [qrCountdownSec]);

  const modals = (
    <>
      <StoreModalShell
        open={redirectModal.open}
        onClose={() => setRedirectModal(CLOSED_REDIRECT)}
        mobileInApp={mobileInApp}
      >
        <div className="flex items-start justify-between gap-3 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Te vamos a redireccionar a la tienda</h2>
            <p className="mt-1 text-sm text-gray-600">
              Tienes <span className="font-semibold text-purple-700">10 minutos</span> para completar la
              compra. No cierres esta página.
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 shrink-0"
            onClick={() => setRedirectModal(CLOSED_REDIRECT)}
          >
            Cerrar
          </button>
        </div>
        <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 shrink-0">
          <p className="text-sm text-purple-900">
            Tiempo restante: <span className="font-mono font-bold">{redirectLabel}</span>
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
            onClick={() => setRedirectModal(CLOSED_REDIRECT)}
          >
            Ya la abrí
          </button>
        </div>
      </StoreModalShell>

      <StoreModalShell open={qrModal.open} onClose={() => setQrModal(CLOSED_QR)} mobileInApp={mobileInApp}>
        <div className="flex items-start justify-between gap-3 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Tu cupón está listo</h2>
            <p className="mt-1 text-sm text-gray-600">
              Escanea el QR en la app o muéstralo en tienda. No cierres esta página.
            </p>
            {qrModal.title ? <p className="mt-1 text-xs text-gray-500">Promoción: {qrModal.title}</p> : null}
          </div>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 shrink-0"
            onClick={() => setQrModal(CLOSED_QR)}
          >
            Cerrar
          </button>
        </div>
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shrink-0">
          <p className="text-sm text-emerald-900">
            Tiempo restante: <span className="font-mono font-bold">{qrLabel}</span>
          </p>
          <p className="mt-1 text-xs text-emerald-800/90">
            Este cupón es temporal; si expira, vuelve a generarlo.
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
          <a
            {...apkDownloadAnchorProps()}
            className="inline-flex flex-1 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Abrir / Descargar app
          </a>
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
    </>
  );

  return { startQrCouponFlow, startRedirectFlow, startFlowForRow, modals };
}
