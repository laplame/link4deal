import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  MapPin,
  RefreshCw,
  Smartphone,
  Store,
  Ticket,
  UserCircle,
} from 'lucide-react';

const POLL_MS = 6000;

export interface RedemptionDevice {
  readerId: string | null;
  readerDeviceId: string | null;
  customerDeviceId: string | null;
}

export interface RedemptionLocation {
  latitude: number;
  longitude: number;
  locationAccuracyM?: number;
}

export interface RedemptionRow {
  couponId: string;
  usedAt: string | null;
  promotionId: string | null;
  shopId: string | null;
  referralCode: string | null;
  discountPercentage: number | null;
  payloadDeviceId: string | null;
  devices: RedemptionDevice;
  location: RedemptionLocation | null;
  redemptionMetadata: Record<string, unknown> | null;
  cashier: {
    redeemedByUserId: string | null;
    redeemedByUserName: string | null;
    userId: string | null;
  };
  redeemedAtUnix: number | null;
  redeemedAtUnixClockSkew: boolean;
  redeemGpsFixUnix: number | null;
  redeemGpsAccuracyMeters: number | null;
  idempotencyKey: string | null;
  idempotencyShopId: string | null;
  idempotencyProductId: string | null;
  /** Del payload del cupón (asignación al crear el QR). */
  influencerId?: string | null;
  influencerName?: string | null;
  influencerUsername?: string | null;
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  const diff = Date.now() - t;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `hace ${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

function shortenId(s: string | null, head = 6, tail = 4): string {
  if (!s) return '—';
  if (s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

export function RedemptionCard({ row, initiallyOpen }: { row: RedemptionRow; initiallyOpen: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  const mapsUrl =
    row.location != null
      ? `https://www.google.com/maps?q=${row.location.latitude},${row.location.longitude}`
      : null;

  return (
    <article
      className="group relative rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-gray-900/90 via-slate-900/95 to-emerald-950/20 overflow-hidden shadow-lg shadow-emerald-950/10 hover:border-emerald-400/35 hover:shadow-emerald-500/10 transition-all duration-300"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/8 via-transparent to-transparent pointer-events-none" />
      <div className="relative p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 rounded-xl bg-emerald-500/15 border border-emerald-400/25 p-2.5">
              <Ticket className="h-6 w-6 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {typeof row.discountPercentage === 'number' && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500 text-gray-950">
                    −{row.discountPercentage}%
                  </span>
                )}
                <span className="text-xs font-medium text-emerald-200/90 tabular-nums">
                  {formatRelativeTime(row.usedAt)}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-1 font-mono truncate" title={row.couponId}>
                {shortenId(row.couponId, 8, 6)}
              </p>
              {row.referralCode && (
                <p className="text-xs text-gray-500 truncate mt-0.5" title={row.referralCode}>
                  {row.referralCode}
                </p>
              )}
              {(row.influencerId || row.influencerName || row.influencerUsername) && (
                <p className="text-xs text-violet-300/95 truncate mt-0.5" title={row.influencerId || ''}>
                  Influencer:{' '}
                  {row.influencerName ||
                    row.influencerUsername ||
                    (row.influencerId ? shortenId(row.influencerId, 10, 6) : '')}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <time
              className="text-[11px] text-gray-500 tabular-nums"
              dateTime={row.usedAt || undefined}
            >
              {row.usedAt ? new Date(row.usedAt).toLocaleString() : ''}
            </time>
            {row.redeemedAtUnixClockSkew && (
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-200 border border-amber-500/35"
                title="Cliente envió redeemedAtUnix fuera de la ventana tolerada vs servidor"
              >
                Reloj: revisar
              </span>
            )}
            {typeof row.redeemedAtUnix === 'number' && (
              <span className="text-[10px] text-gray-600 font-mono flex items-center gap-1">
                <Clock className="h-3 w-3 opacity-70" />
                unix canje {row.redeemedAtUnix}
              </span>
            )}
            {typeof row.redeemGpsFixUnix === 'number' && (
              <span className="text-[10px] text-gray-600 font-mono">GPS unix {row.redeemGpsFixUnix}</span>
            )}
            {row.idempotencyKey && (
              <span
                className="text-[10px] text-cyan-500/90 font-mono truncate max-w-[12rem]"
                title={row.idempotencyKey}
              >
                idem {shortenId(row.idempotencyKey, 8, 6)}
              </span>
            )}
            {row.promotionId && (
              <Link
                to={`/promotion-details/${row.promotionId}`}
                className="text-xs font-medium text-violet-300 hover:text-violet-200 inline-flex items-center gap-1"
              >
                Ver promoción
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {row.shopId && (
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300">
              <Store className="h-3.5 w-3.5 text-violet-400 shrink-0" />
              <span className="truncate max-w-[14rem]" title={row.shopId}>
                {row.shopId}
              </span>
            </span>
          )}
          {row.devices.readerDeviceId && (
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300">
              <Smartphone className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span className="font-mono truncate max-w-[12rem]" title={row.devices.readerDeviceId}>
                POS {shortenId(row.devices.readerDeviceId, 10, 4)}
              </span>
            </span>
          )}
          {row.devices.customerDeviceId && (
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300">
              <Smartphone className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span className="font-mono truncate max-w-[12rem]" title={row.devices.customerDeviceId}>
                Cliente {shortenId(row.devices.customerDeviceId, 10, 4)}
              </span>
            </span>
          )}
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-600/30 transition-colors"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              GPS
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>
          )}
        </div>

        {(row.cashier.redeemedByUserName || row.cashier.redeemedByUserId || row.cashier.userId) && (
          <div className="mt-3 flex items-start gap-2 text-xs text-gray-400">
            <UserCircle className="h-4 w-4 text-gray-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              {row.cashier.redeemedByUserName && (
                <p className="text-gray-300 font-medium">{row.cashier.redeemedByUserName}</p>
              )}
              <p className="text-[11px] text-gray-500 font-mono truncate" title={`userId ${row.cashier.userId || ''}`}>
                Usuario BizneAI: {row.cashier.userId || row.cashier.redeemedByUserId || '—'}
              </p>
            </div>
          </div>
        )}

        {row.location && (
          <p className="mt-2 text-[11px] text-gray-500 font-mono">
            {row.location.latitude.toFixed(5)}, {row.location.longitude.toFixed(5)}
            {typeof row.location.locationAccuracyM === 'number' && (
              <span className="text-gray-600"> ±{Math.round(row.location.locationAccuracyM)}m</span>
            )}
          </p>
        )}

        {row.redemptionMetadata && Object.keys(row.redemptionMetadata).length > 0 && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="mt-3 flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
          >
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Metadata ({Object.keys(row.redemptionMetadata).length})
          </button>
        )}
        {open && row.redemptionMetadata && (
          <pre className="mt-2 p-3 rounded-xl bg-black/40 border border-white/5 text-[10px] text-gray-400 overflow-x-auto max-h-40 overflow-y-auto">
            {JSON.stringify(row.redemptionMetadata, null, 2)}
          </pre>
        )}
      </div>
    </article>
  );
}

export default function RedemptionsLivePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const promotionFilter = searchParams.get('promotionId') ?? '';
  const shopFilter = searchParams.get('shopId') ?? '';
  const limitParam = searchParams.get('limit') ?? '40';

  const [rows, setRows] = useState<RedemptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [lastAt, setLastAt] = useState<string | null>(null);

  const limit = useMemo(() => {
    const n = parseInt(limitParam, 10);
    return Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 40;
  }, [limitParam]);

  const fetchRedemptions = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const q = new URLSearchParams();
      q.set('limit', String(limit));
      if (promotionFilter.trim()) q.set('promotionId', promotionFilter.trim());
      if (shopFilter.trim()) q.set('shopId', shopFilter.trim());

      const headers: HeadersInit = { Accept: 'application/json' };
      const key = import.meta.env.VITE_REDEMPTIONS_LIST_API_KEY;
      if (key) headers['x-redemptions-api-key'] = key;

      const res = await fetch(`/api/discount-qr/redemptions/recent?${q.toString()}`, { headers });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setError('No autorizado. Configura VITE_REDEMPTIONS_LIST_API_KEY igual que REDEMPTIONS_LIST_API_KEY en el servidor.');
        setRows([]);
        setHint(null);
        return;
      }

      if (!res.ok || !data.ok) {
        setError(typeof data.message === 'string' ? data.message : 'No se pudo cargar el listado');
        setRows([]);
        setHint(null);
        return;
      }

      setError(null);
      setRows(Array.isArray(data.data) ? data.data : []);
      setHint(typeof data.hint === 'string' ? data.hint : null);
      setLastAt(new Date().toISOString());
    } catch {
      setError('Error de red');
      setRows([]);
      setHint(null);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [limit, promotionFilter, shopFilter]);

  useEffect(() => {
    void fetchRedemptions(false);
  }, [fetchRedemptions]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void fetchRedemptions(true);
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [fetchRedemptions]);

  const applyFilters = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next = new URLSearchParams();
    const pid = String(fd.get('promotionId') || '').trim();
    const sid = String(fd.get('shopId') || '').trim();
    const lim = String(fd.get('limit') || '40').trim();
    if (pid) next.set('promotionId', pid);
    if (sid) next.set('shopId', sid);
    if (lim) next.set('limit', lim);
    setSearchParams(next);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-950 to-gray-950 text-gray-100">
      <div className="border-b border-emerald-500/25 bg-gradient-to-r from-emerald-950/50 via-gray-900/92 to-teal-950/35">
        <div className="container mx-auto px-4 py-10 md:py-12">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-emerald-400/95 text-sm font-semibold uppercase tracking-wider mb-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                </span>
                En vivo
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Ticket className="h-9 w-9 md:h-10 md:w-10 text-emerald-400 shrink-0" />
                Cupones redimidos
              </h1>
              <p className="text-gray-400 max-w-2xl text-lg">
                Actividad reciente de canjes en tienda: dispositivos, tienda y ubicación cuando el POS las envía.
                Actualización automática cada {POLL_MS / 1000}s.
              </p>
              {lastAt && (
                <p className="text-xs text-gray-500 mt-3 tabular-nums">
                  Última sincronización: {new Date(lastAt).toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void fetchRedemptions(false)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-medium transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
              <Link
                to="/marketplace"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-medium transition-colors"
              >
                Ver ofertas
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        <form
          onSubmit={applyFilters}
          className="rounded-2xl border border-white/10 bg-gray-900/50 p-4 md:p-5 backdrop-blur-sm flex flex-col lg:flex-row flex-wrap gap-4 items-end"
        >
          <div className="flex-1 min-w-[12rem] space-y-1.5">
            <label className="text-xs text-gray-500 uppercase tracking-wide">Promoción (ID)</label>
            <input
              name="promotionId"
              key={promotionFilter}
              defaultValue={promotionFilter}
              placeholder="ObjectId opcional"
              className="w-full bg-gray-950/80 border border-gray-700 rounded-xl py-2.5 px-3 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 font-mono"
            />
          </div>
          <div className="flex-1 min-w-[12rem] space-y-1.5">
            <label className="text-xs text-gray-500 uppercase tracking-wide">Tienda Bizne (shopId)</label>
            <input
              name="shopId"
              key={shopFilter}
              defaultValue={shopFilter}
              placeholder="Opcional"
              className="w-full bg-gray-950/80 border border-gray-700 rounded-xl py-2.5 px-3 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
            />
          </div>
          <div className="w-full sm:w-28 space-y-1.5">
            <label className="text-xs text-gray-500 uppercase tracking-wide">Cantidad</label>
            <input
              name="limit"
              key={limitParam}
              type="number"
              min={1}
              max={200}
              defaultValue={limit}
              className="w-full bg-gray-950/80 border border-gray-700 rounded-xl py-2.5 px-3 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
          >
            Aplicar filtros
          </button>
        </form>

        {hint && (
          <div className="rounded-xl border border-amber-500/35 bg-amber-950/25 px-4 py-3 text-amber-100/95 text-sm flex items-start gap-2">
            <Activity className="h-5 w-5 shrink-0 text-amber-400" />
            <span>{hint}</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-red-200 text-sm">
            {error}
          </div>
        )}

        {loading && rows.length === 0 && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-48 rounded-2xl bg-gray-900/60 border border-white/5 animate-pulse"
              />
            ))}
          </div>
        )}

        {!loading && rows.length === 0 && !error && (
          <div className="rounded-3xl border border-white/10 bg-gray-900/40 p-14 text-center space-y-4">
            <Ticket className="h-14 w-14 text-gray-600 mx-auto" />
            <p className="text-gray-400 text-lg">Aún no hay redenciones visibles en el servidor.</p>
            <p className="text-sm text-gray-500 max-w-lg mx-auto">
              Puede deberse al TTL de los cupones: en el servidor, define{' '}
              <code className="text-emerald-200/90 bg-black/40 px-1.5 py-0.5 rounded">QR_REDEEM_RETENTION_DAYS</code>{' '}
              para conservar canjes unos días tras redimir.
            </p>
          </div>
        )}

        {rows.length > 0 && (
          <>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-sm text-gray-400">
                <span className="text-white font-semibold tabular-nums">{rows.length}</span> cupones en esta vista
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Activity className="h-4 w-4 text-emerald-500/80" />
                Auto-refresh {POLL_MS / 1000}s
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
              {rows.map((row, idx) => (
                <RedemptionCard
                  key={`${row.couponId}-${row.usedAt}`}
                  row={row}
                  initiallyOpen={idx === 0 && rows.length === 1}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
