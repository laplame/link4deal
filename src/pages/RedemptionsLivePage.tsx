import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  MapPin,
  RefreshCw,
  Smartphone,
  Store,
  Ticket,
  TrendingUp,
  UserCircle,
  Eye,
} from 'lucide-react';
import { CouponQrActivitySection, type CouponActivityPack } from '../components/CouponQrActivitySection';

const POLL_MS = 10_000;

interface LuxaeByPromotionRow {
  promotionId: string;
  title: string | null;
  brand: string | null;
  redemptionCount: number;
  luxaeUsd: number;
  valuePerCouponUsd: number | null;
}

interface LuxaeStatsPayload {
  totalUsdLuxae: number;
  totalRedemptionsInDb: number;
  totalRedemptionsAttributed: number;
  currency: string;
  byPromotion: LuxaeByPromotionRow[];
  exclusions: {
    missingPromotionFieldRedemptions: number;
    invalidPromotionIdRedemptions: number;
    redemptionsPromotionNotFound: number;
    redemptionsValueUnknown: number;
  };
  noteEs?: string;
  qrRedeemRetention?: { configured: boolean; daysAfterRedeem?: number };
}

interface AttributionBreakdownRow {
  influencerId: string | null;
  influencerIdRawPresentation: string;
  redemptionCount: number;
  influencerName: string | null;
  influencerUsername: string | null;
  isInvalidObjectId: boolean;
  isLikelyGuestString: boolean;
  influencerDocumentFound?: boolean;
}

interface RedemptionAttributionVerification {
  distinctInfluencersInCollection: number;
  onlyOneInfluencerInDb: boolean;
  allExplainedBySingleProfile: boolean;
  redemptionsMatchedInfluencerCollection: number;
  redemptionsValidObjectIdNoDocument: number;
  redemptionsNoValidObjectId: number;
  influencersWithRedemptionsInDb: Array<{
    influencerId: string;
    redemptionCount: number;
    name: string | null;
    username: string | null;
  }>;
  summaryLinesEs: string[];
}

/** Respuesta GET /api/discount-qr/stats/verify-vs-redeem */
interface VerifyVsRedeemPayload {
  generatedAt?: string;
  noteEs?: string;
  totals: {
    matchingCoupons: number;
    redeemed: number;
    open: number;
    expiredUnused: number;
    everHadPosVerify: number;
  };
  breakdown: {
    redeemedWithPriorPosView: number;
    redeemedNoPriorPosRecorded: number;
    openWithVerifyNotRedeem: number;
    openNeverShownPos: number;
    expiredHadVerifyUnused: number;
    expiredNeverHadVerifyUnused: number;
  };
  rates: {
    pctRedemptionsWithPriorPosView: number | null;
    pctOfVerifiedCouponsEndingRedeemedWithOrderedView: number | null;
    pctEverVerifiedAmongAllMatching: number | null;
  };
}

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

function fmtPctLabel(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return '—';
  return `${Number(v).toFixed(1)}%`;
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
  const influencerIdFromUrl = searchParams.get('influencerId')?.trim() || '';
  const influencerSlugFromUrl = searchParams.get('influencerSlug')?.trim() || '';

  const [slugResolvedInfluencerId, setSlugResolvedInfluencerId] = useState('');
  const [slugResolveError, setSlugResolveError] = useState<string | null>(null);
  const [attributionRows, setAttributionRows] = useState<AttributionBreakdownRow[] | null>(null);
  const [attributionVerification, setAttributionVerification] = useState<RedemptionAttributionVerification | null>(null);
  const [attributionError, setAttributionError] = useState<string | null>(null);

  const [rows, setRows] = useState<RedemptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [lastAt, setLastAt] = useState<string | null>(null);
  const [couponActivity, setCouponActivity] = useState<CouponActivityPack | null>(null);
  const [couponActivityLoading, setCouponActivityLoading] = useState(true);
  const [couponActivityError, setCouponActivityError] = useState<string | null>(null);
  const [luxaeStats, setLuxaeStats] = useState<LuxaeStatsPayload | null>(null);
  const [luxaeLoading, setLuxaeLoading] = useState(true);
  const [luxaeError, setLuxaeError] = useState<string | null>(null);
  const [verifyFunnel, setVerifyFunnel] = useState<VerifyVsRedeemPayload | null>(null);
  const [verifyFunnelLoading, setVerifyFunnelLoading] = useState(true);
  const [verifyFunnelError, setVerifyFunnelError] = useState<string | null>(null);

  const limit = useMemo(() => {
    const n = parseInt(limitParam, 10);
    return Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 40;
  }, [limitParam]);

  const appliedInfluencerId = useMemo(
    () => influencerIdFromUrl || slugResolvedInfluencerId,
    [influencerIdFromUrl, slugResolvedInfluencerId],
  );

  const verifyFunnelChartData = useMemo(() => {
    if (!verifyFunnel?.breakdown) return [];
    const b = verifyFunnel.breakdown;
    return [
      {
        name: 'Canjeados',
        escaneoPos: Number(b.redeemedWithPriorPosView) || 0,
        sinRegistroPos: Number(b.redeemedNoPriorPosRecorded) || 0,
      },
      {
        name: 'Vigentes (sin canje)',
        escaneoPos: Number(b.openWithVerifyNotRedeem) || 0,
        sinRegistroPos: Number(b.openNeverShownPos) || 0,
      },
      {
        name: 'Caducados sin uso',
        escaneoPos: Number(b.expiredHadVerifyUnused) || 0,
        sinRegistroPos: Number(b.expiredNeverHadVerifyUnused) || 0,
      },
    ];
  }, [verifyFunnel]);

  useEffect(() => {
    if (influencerIdFromUrl) {
      setSlugResolvedInfluencerId('');
      setSlugResolveError(null);
      return;
    }
    const slug = influencerSlugFromUrl.trim();
    if (!slug) {
      setSlugResolvedInfluencerId('');
      setSlugResolveError(null);
      return;
    }
    let cancel = false;
    setSlugResolveError(null);
    fetch(`/api/influencers/by-slug/${encodeURIComponent(slug)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancel) return;
        if (data.success && data.data?.id) {
          setSlugResolvedInfluencerId(String(data.data.id));
          setSlugResolveError(null);
        } else {
          setSlugResolvedInfluencerId('');
          setSlugResolveError(`Slug «${slug}» sin perfil público`);
        }
      })
      .catch(() => {
        if (cancel) return;
        setSlugResolvedInfluencerId('');
        setSlugResolveError('No se pudo resolver el slug del influencer');
      });
    return () => {
      cancel = true;
    };
  }, [influencerIdFromUrl, influencerSlugFromUrl]);

  useEffect(() => {
    let cancel = false;
    const headers: HeadersInit = { Accept: 'application/json' };
    const key = import.meta.env.VITE_REDEMPTIONS_LIST_API_KEY;
    if (key) headers['x-redemptions-api-key'] = key;
    fetch('/api/discount-qr/stats/redemptions-by-influencer', { headers })
      .then((res) =>
        res.json().then((data) => {
          if (cancel) return;
          if (res.status === 401) {
            setAttributionRows(null);
            setAttributionVerification(null);
            setAttributionError(null);
            return;
          }
          if (data.ok && Array.isArray(data.rows)) {
            setAttributionRows(data.rows as AttributionBreakdownRow[]);
            setAttributionVerification(
              data.verification && typeof data.verification === 'object'
                ? (data.verification as RedemptionAttributionVerification)
                : null,
            );
            setAttributionError(null);
          } else {
            setAttributionRows(null);
            setAttributionVerification(null);
            setAttributionError(null);
          }
        }),
      )
      .catch(() => {
        if (!cancel) {
          setAttributionRows(null);
          setAttributionVerification(null);
          setAttributionError('No se pudo cargar el desglose por influencer');
        }
      });
    return () => {
      cancel = true;
    };
  }, []);

  const fetchRedemptions = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const q = new URLSearchParams();
      q.set('limit', String(limit));
      if (promotionFilter.trim()) q.set('promotionId', promotionFilter.trim());
      if (shopFilter.trim()) q.set('shopId', shopFilter.trim());
      if (appliedInfluencerId.trim()) q.set('influencerId', appliedInfluencerId.trim());

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

      if (res.status === 429) {
        setError(
          typeof data.message === 'string'
            ? data.message
            : 'Demasiadas consultas seguidas. Espera unos minutos (el servidor limita refrescos muy frecuentes).',
        );
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
  }, [limit, promotionFilter, shopFilter, appliedInfluencerId]);

  const fetchCouponDashboard = useCallback(async (silent = false) => {
    if (!silent) setCouponActivityLoading(true);
    try {
      const q = new URLSearchParams();
      q.set('limit', String(limit));
      if (promotionFilter.trim()) q.set('promotionId', promotionFilter.trim());
      if (shopFilter.trim()) q.set('shopId', shopFilter.trim());
      if (appliedInfluencerId.trim()) q.set('influencerId', appliedInfluencerId.trim());

      const headers: HeadersInit = { Accept: 'application/json' };
      const key = import.meta.env.VITE_REDEMPTIONS_LIST_API_KEY;
      if (key) headers['x-redemptions-api-key'] = key;

      const res = await fetch(`/api/discount-qr/coupons/dashboard?${q.toString()}`, { headers });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setCouponActivityError(
          'Tablero de cupones: no autorizado. Configura VITE_REDEMPTIONS_LIST_API_KEY igual que REDEMPTIONS_LIST_API_KEY en el servidor.',
        );
        setCouponActivity(null);
        return;
      }

      if (res.status === 429) {
        setCouponActivityError(
          typeof data.message === 'string'
            ? data.message
            : 'Demasiadas consultas al tablero de cupones. Espera un momento.',
        );
        return;
      }

      setCouponActivityError(null);
      if (
        (data.success || data.ok) &&
        Array.isArray(data.open) &&
        Array.isArray(data.redeemed) &&
        Array.isArray(data.expiredUnused)
      ) {
        setCouponActivity({
          open: data.open,
          redeemed: data.redeemed,
          expiredUnused: data.expiredUnused,
        });
      } else {
        setCouponActivity({ open: [], redeemed: [], expiredUnused: [] });
      }
    } catch {
      setCouponActivityError('Tablero de cupones: error de red');
      setCouponActivity(null);
    } finally {
      if (!silent) setCouponActivityLoading(false);
    }
  }, [limit, promotionFilter, shopFilter, appliedInfluencerId]);

  const fetchLuxaeStats = useCallback(async (silent = false) => {
    if (!silent) setLuxaeLoading(true);
    try {
      const headers: HeadersInit = { Accept: 'application/json' };
      const key = import.meta.env.VITE_REDEMPTIONS_LIST_API_KEY;
      if (key) headers['x-redemptions-api-key'] = key;

      const iq = new URLSearchParams();
      if (appliedInfluencerId.trim()) iq.set('influencerId', appliedInfluencerId.trim());
      const luxaePath =
        iq.toString().length > 0
          ? `/api/discount-qr/stats/luxae-usd?${iq.toString()}`
          : '/api/discount-qr/stats/luxae-usd';

      const res = await fetch(luxaePath, { headers });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setLuxaeError(
          'Contador USDLXE: no autorizado. Iguala VITE_REDEMPTIONS_LIST_API_KEY con REDEMPTIONS_LIST_API_KEY.',
        );
        setLuxaeStats(null);
        return;
      }

      if (res.status === 429) {
        setLuxaeError(typeof data.message === 'string' ? data.message : 'Demasiadas consultas al contador.');
        return;
      }

      setLuxaeError(null);
      if (data.ok && typeof data.totalUsdLuxae === 'number') {
        setLuxaeStats({
          totalUsdLuxae: data.totalUsdLuxae,
          totalRedemptionsInDb: Number(data.totalRedemptionsInDb) || 0,
          totalRedemptionsAttributed: Number(data.totalRedemptionsAttributed) || 0,
          currency: typeof data.currency === 'string' ? data.currency : 'USD',
          byPromotion: Array.isArray(data.byPromotion) ? data.byPromotion : [],
          exclusions: data.exclusions && typeof data.exclusions === 'object' ? data.exclusions : {
            missingPromotionFieldRedemptions: 0,
            invalidPromotionIdRedemptions: 0,
            redemptionsPromotionNotFound: 0,
            redemptionsValueUnknown: 0,
          },
          noteEs: typeof data.noteEs === 'string' ? data.noteEs : undefined,
          qrRedeemRetention:
            data.qrRedeemRetention && typeof data.qrRedeemRetention === 'object'
              ? {
                  configured: Boolean(data.qrRedeemRetention.configured),
                  daysAfterRedeem:
                    typeof data.qrRedeemRetention.daysAfterRedeem === 'number'
                      ? data.qrRedeemRetention.daysAfterRedeem
                      : undefined,
                }
              : undefined,
        });
      } else {
        setLuxaeStats(null);
      }
    } catch {
      setLuxaeError('Contador USDLXE: error de red');
      setLuxaeStats(null);
    } finally {
      if (!silent) setLuxaeLoading(false);
    }
  }, [appliedInfluencerId]);

  const fetchVerifyFunnel = useCallback(async (silent = false) => {
    if (!silent) setVerifyFunnelLoading(true);
    try {
      const q = new URLSearchParams();
      if (promotionFilter.trim()) q.set('promotionId', promotionFilter.trim());
      if (shopFilter.trim()) q.set('shopId', shopFilter.trim());
      if (appliedInfluencerId.trim()) q.set('influencerId', appliedInfluencerId.trim());

      const headers: HeadersInit = { Accept: 'application/json' };
      const key = import.meta.env.VITE_REDEMPTIONS_LIST_API_KEY;
      if (key) headers['x-redemptions-api-key'] = key;

      const path =
        q.toString().length > 0
          ? `/api/discount-qr/stats/verify-vs-redeem?${q.toString()}`
          : '/api/discount-qr/stats/verify-vs-redeem';

      const res = await fetch(path, { headers });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setVerifyFunnelError(
          'Embudo POS: configura VITE_REDEMPTIONS_LIST_API_KEY igual que REDEMPTIONS_LIST_API_KEY en el servidor.',
        );
        setVerifyFunnel(null);
        return;
      }

      if (res.status === 429) {
        setVerifyFunnelError(typeof data.message === 'string' ? data.message : 'Demasiadas consultas al embudo.');
        return;
      }

      setVerifyFunnelError(null);
      if (
        data.ok &&
        data.totals &&
        data.breakdown &&
        data.rates &&
        typeof data.totals.matchingCoupons === 'number'
      ) {
        setVerifyFunnel(data as VerifyVsRedeemPayload);
      } else {
        setVerifyFunnel(null);
      }
    } catch {
      setVerifyFunnelError('Embudo POS: error de red');
      setVerifyFunnel(null);
    } finally {
      if (!silent) setVerifyFunnelLoading(false);
    }
  }, [promotionFilter, shopFilter, appliedInfluencerId]);

  useEffect(() => {
    void fetchRedemptions(false);
  }, [fetchRedemptions]);

  useEffect(() => {
    void fetchCouponDashboard(false);
  }, [fetchCouponDashboard]);

  useEffect(() => {
    void fetchLuxaeStats(false);
  }, [fetchLuxaeStats]);

  useEffect(() => {
    void fetchVerifyFunnel(false);
  }, [fetchVerifyFunnel]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void fetchRedemptions(true);
      void fetchCouponDashboard(true);
      void fetchLuxaeStats(true);
      void fetchVerifyFunnel(true);
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [fetchRedemptions, fetchCouponDashboard, fetchLuxaeStats, fetchVerifyFunnel]);

  const applyFilters = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next = new URLSearchParams();
    const pid = String(fd.get('promotionId') || '').trim();
    const sid = String(fd.get('shopId') || '').trim();
    const lim = String(fd.get('limit') || '40').trim();
    const infId = String(fd.get('influencerId') || '').trim();
    const infSlug = String(fd.get('influencerSlug') || '').trim();
    if (pid) next.set('promotionId', pid);
    if (sid) next.set('shopId', sid);
    if (lim) next.set('limit', lim);
    if (infId) next.set('influencerId', infId);
    if (infSlug) next.set('influencerSlug', infSlug);
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
                onClick={() => {
                  void fetchRedemptions(false);
                  void fetchCouponDashboard(false);
                  void fetchLuxaeStats(false);
                  void fetchVerifyFunnel(false);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-medium transition-colors"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading || couponActivityLoading || luxaeLoading || verifyFunnelLoading ? 'animate-spin' : ''}`}
                />
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
          <div className="w-full rounded-xl border border-violet-500/25 bg-violet-950/25 px-4 py-3 text-sm text-gray-300 space-y-2">
            <p>
              Los cupones guardan{' '}
              <code className="text-violet-200/95 bg-black/35 px-1 rounded text-xs">influencerId</code> al crearse (
              mismo valor que al copiar desde el perfil). Filtra por{' '}
              <strong className="text-gray-100">slug</strong> público (
              <code className="text-emerald-200/95 bg-black/35 px-1 rounded text-xs">damecodigo</code>) o{' '}
              <strong className="text-gray-100">ObjectId</strong>.
            </p>
            <div className="flex flex-wrap gap-3 text-xs">
              <Link
                to="/redenciones-en-vivo?influencerSlug=damecodigo"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/25 border border-emerald-500/40 text-emerald-100 hover:bg-emerald-600/35"
              >
                Sólo DameCodigo (slug)
              </Link>
              <Link
                to="/redenciones-en-vivo"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/15 text-gray-400 hover:bg-white/10"
              >
                Quitar filtros influencer
              </Link>
              <Link
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/15 text-violet-200 hover:bg-white/10"
                to="/influencer/damecodigo"
              >
                Abrir perfil DameCodigo
              </Link>
            </div>
            {slugResolveError && (
              <p className="text-amber-200/95 text-xs border border-amber-500/30 rounded-lg px-2 py-1.5 bg-amber-950/35">
                {slugResolveError}
              </p>
            )}
            {appliedInfluencerId ? (
              <p className="text-xs text-gray-400 font-mono break-all">
                Filtro atribución activo: <span className="text-emerald-200/90">{appliedInfluencerId}</span>
                {influencerSlugFromUrl && !influencerIdFromUrl ? (
                  <span className="text-gray-500 font-sans"> · desde slug «{influencerSlugFromUrl}»</span>
                ) : null}
              </p>
            ) : influencerSlugFromUrl && !slugResolveError && !slugResolvedInfluencerId ? (
              <p className="text-xs text-gray-500">Resolviendo slug del influencer…</p>
            ) : null}
          </div>
          <div className="flex-1 min-w-[12rem] space-y-1.5">
            <label className="text-xs text-gray-500 uppercase tracking-wide">Influencer · slug público</label>
            <input
              name="influencerSlug"
              key={influencerSlugFromUrl ? `s-${influencerSlugFromUrl}` : 's-none'}
              defaultValue={influencerSlugFromUrl}
              placeholder="ej. damecodigo"
              className="w-full bg-gray-950/80 border border-gray-700 rounded-xl py-2.5 px-3 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/55"
              autoCapitalize="none"
            />
          </div>
          <div className="flex-[1.2] min-w-[14rem] space-y-1.5">
            <label className="text-xs text-gray-500 uppercase tracking-wide">Influencer · ObjectId</label>
            <input
              name="influencerId"
              key={influencerIdFromUrl ? `i-${influencerIdFromUrl}` : 'i-none'}
              defaultValue={influencerIdFromUrl}
              placeholder="Opcional si usas slug"
              className="w-full bg-gray-950/80 border border-gray-700 rounded-xl py-2.5 px-3 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/55 font-mono"
              autoCapitalize="none"
            />
          </div>
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

        {attributionVerification && (
          <div
            className={`rounded-2xl border px-4 py-4 ${
              attributionVerification.allExplainedBySingleProfile
                ? 'border-emerald-500/40 bg-emerald-950/25'
                : attributionVerification.onlyOneInfluencerInDb
                  ? 'border-amber-500/35 bg-amber-950/20'
                  : attributionVerification.distinctInfluencersInCollection > 1
                    ? 'border-sky-500/30 bg-sky-950/15'
                    : 'border-white/10 bg-gray-900/50'
            }`}
          >
            <div className="flex flex-wrap items-start gap-3">
              {attributionVerification.allExplainedBySingleProfile ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" aria-hidden />
              ) : attributionVerification.distinctInfluencersInCollection <= 1 ? (
                <AlertTriangle className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" aria-hidden />
              ) : (
                <Activity className="h-6 w-6 text-sky-400 shrink-0 mt-0.5" aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-gray-100">Verificación de atribución</h3>
                <p className="text-[11px] text-gray-500 mt-0.5 mb-3">
                  Basado en <code className="text-gray-400">DiscountQrToken.usedAt</code> y coincidencia con la colección{' '}
                  <code className="text-gray-400">Influencer</code> por <code className="text-gray-400">payload.influencerId</code>.
                </p>
                <ul className="text-sm text-gray-200 space-y-1.5 list-disc pl-4 marker:text-gray-500">
                  {attributionVerification.summaryLinesEs.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
                <dl className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-gray-400">
                  <div className="rounded-lg bg-black/20 px-2 py-1.5 border border-white/5">
                    <dt className="text-gray-500">Perfiles Influencer con canjes</dt>
                    <dd className="text-gray-100 font-mono tabular-nums text-sm">
                      {attributionVerification.distinctInfluencersInCollection}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-black/20 px-2 py-1.5 border border-white/5">
                    <dt className="text-gray-500">Canjes con perfil en BD</dt>
                    <dd className="text-gray-100 font-mono tabular-nums text-sm">
                      {attributionVerification.redemptionsMatchedInfluencerCollection}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-black/20 px-2 py-1.5 border border-white/5">
                    <dt className="text-gray-500">ObjectId sin perfil / sin id válido</dt>
                    <dd className="text-gray-100 font-mono tabular-nums text-sm">
                      {attributionVerification.redemptionsValidObjectIdNoDocument} /{' '}
                      {attributionVerification.redemptionsNoValidObjectId}
                    </dd>
                  </div>
                </dl>
                {attributionVerification.influencersWithRedemptionsInDb.length > 0 && (
                  <ul className="mt-3 text-xs text-gray-400 space-y-1">
                    {attributionVerification.influencersWithRedemptionsInDb.map((row) => (
                      <li key={row.influencerId} className="flex flex-wrap gap-x-2 gap-y-0.5">
                        <span className="text-emerald-200/90 font-medium tabular-nums">{row.redemptionCount}</span>
                        <span>
                          {row.username || row.name || 'sin nombre'}
                          {row.username && row.name ? <span className="text-gray-600"> · {row.name}</span> : null}
                        </span>
                        <Link
                          to={`/redenciones-en-vivo?influencerId=${encodeURIComponent(row.influencerId)}`}
                          className="text-violet-400 hover:text-violet-300 underline-offset-2 hover:underline"
                        >
                          Filtrar este ID
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {attributionError && (
          <div className="rounded-xl border border-rose-500/35 bg-rose-950/30 px-4 py-3 text-rose-100 text-sm">
            {attributionError}
          </div>
        )}

        {attributionRows != null && attributionRows.length > 0 && (
          <details className="group rounded-2xl border border-white/10 bg-gray-900/45 px-4 py-3 text-gray-300">
            <summary className="cursor-pointer text-sm font-medium text-gray-200 list-none flex items-center gap-2 [&::-webkit-details-marker]:hidden">
              <Activity className="h-4 w-4 text-cyan-400 shrink-0" />
              Diagnóstico: cupones QR canjeados por <code className="text-xs text-emerald-200/95">influencerId</code>{' '}
              <span className="text-gray-600 text-xs font-normal">({attributionRows.length} filas)</span>
            </summary>
            <p className="text-xs text-gray-500 mt-2 mb-2">
              Lista el detalle por fila de agrupación en MongoDB; el resumen y el veredicto automático están arriba en{' '}
              <strong className="text-gray-400 font-medium">Verificación de atribución</strong>.
            </p>
            <div className="overflow-x-auto rounded-xl border border-white/10 mt-2">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-gray-950/80 text-gray-500 border-b border-white/10">
                  <tr>
                    <th className="px-3 py-2 font-medium">Influencer</th>
                    <th className="px-3 py-2 font-medium tabular-nums">Canjes</th>
                    <th className="px-3 py-2 font-medium">payload.influencerId</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {attributionRows.slice(0, 40).map((row, idx) => (
                    <tr key={`${String(row.influencerId ?? row.influencerIdRawPresentation)}-${idx}`}>
                      <td className="px-3 py-2">
                        {row.influencerName ? (
                          <span className="text-gray-200">{row.influencerName}</span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                        {row.influencerUsername ? (
                          <span className="block text-[10px] text-gray-500">{row.influencerUsername}</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-emerald-200/95 font-medium">{row.redemptionCount}</td>
                      <td className="px-3 py-2 font-mono text-[10px] text-gray-500 break-all max-w-[16rem]" title={row.influencerIdRawPresentation}>
                        {row.influencerId ? shortenId(row.influencerId, 14, 6) : row.influencerIdRawPresentation}
                        {row.isInvalidObjectId ? (
                          <span className="block text-amber-400 text-[10px]">valor no-ObjectId</span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}

        {luxaeError && (
          <div className="rounded-xl border border-rose-500/35 bg-rose-950/30 px-4 py-3 text-rose-100 text-sm">
            {luxaeError}
          </div>
        )}

        {luxaeLoading && !luxaeStats && !luxaeError && (
          <div className="h-28 rounded-2xl bg-gray-900/50 border border-white/10 animate-pulse" />
        )}

        {luxaeStats && (
          <section className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/35 via-gray-900/55 to-slate-950/50 p-5 md:p-6 backdrop-blur-sm">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 text-violet-300/95 text-xs font-semibold uppercase tracking-wide mb-1">
                  <TrendingUp className="h-4 w-4" />
                  USDLXE · contador desde el primer canje registrado
                </div>
                <p className="text-[11px] text-gray-500 max-w-2xl leading-relaxed">
                  Cada promoción aporta <span className="text-gray-400">redenciones × LUXAE/USD por cupón</span> (campo PSCS{' '}
                  <code className="text-violet-200/85 bg-black/35 px-1 rounded">promotionalValueUsd</code> o valor derivado). 1&nbsp;LUXAE = 1&nbsp;USD en el modelo económico.{' '}
                  {appliedInfluencerId ? (
                    <span className="text-violet-200">
                      Totales{' '}
                      <strong>sólo cupones atribuidos al influencer filtrado</strong> (<span className="font-mono text-[10px]">{appliedInfluencerId}</span>).
                    </span>
                  ) : (
                    <span>
                      Totales <strong className="text-gray-400">sin filtro</strong> de promoción/tienda/influencer.
                    </span>
                  )}
                </p>
              </div>
              <div>
                {luxaeStats.qrRedeemRetention?.configured &&
                typeof luxaeStats.qrRedeemRetention.daysAfterRedeem === 'number' ? (
                  <span className="inline-flex items-center rounded-lg bg-emerald-500/15 border border-emerald-400/35 px-2.5 py-1.5 text-xs text-emerald-200">
                    TTL +{luxaeStats.qrRedeemRetention.daysAfterRedeem} d tras canje
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center rounded-lg bg-amber-500/15 border border-amber-400/35 px-2.5 py-1.5 text-xs text-amber-100"
                    title="Configura QR_REDEEM_RETENTION_DAYS para conservar registros tras el canje"
                  >
                    Revisa retención QR
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-8 mb-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total acumulado</p>
                <p className="text-3xl md:text-4xl font-bold text-white tabular-nums tracking-tight">
                  {luxaeStats.totalUsdLuxae.toLocaleString('es-MX', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  <span className="text-lg font-semibold text-violet-200/90">{luxaeStats.currency}</span>
                </p>
                <p className="text-[10px] text-gray-600 mt-1">Etiqueta USDLXE = suma en USD de unidades LUXAE contabilizadas.</p>
              </div>
              <div className="text-sm text-gray-400 space-y-1">
                <p>
                  Canjes en base:{' '}
                  <span className="text-gray-100 font-semibold tabular-nums">{luxaeStats.totalRedemptionsInDb}</span>
                </p>
                <p>
                  Atribuidos a promoción válida:{' '}
                  <span className="text-gray-100 font-semibold tabular-nums">{luxaeStats.totalRedemptionsAttributed}</span>
                </p>
              </div>
            </div>

            {(() => {
              const x = luxaeStats.exclusions;
              const n =
                (x.missingPromotionFieldRedemptions || 0) +
                (x.invalidPromotionIdRedemptions || 0) +
                (x.redemptionsPromotionNotFound || 0) +
                (x.redemptionsValueUnknown || 0);
              if (!n) return null;
              return (
                <p className="text-[11px] text-amber-200/95 bg-amber-950/25 border border-amber-500/25 rounded-lg px-3 py-2 mb-3">
                  Ajustes: {n} redención(es) sin sumar al total económico (sin promotionId, id inválido, promo borrada o sin valor/cupón).
                </p>
              );
            })()}

            {luxaeStats.noteEs ? (
              <p className="text-[11px] text-gray-600 mb-3">{luxaeStats.noteEs}</p>
            ) : null}

            {luxaeStats.byPromotion.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-white/10 mt-2">
                <table className="min-w-full text-xs text-left text-gray-300">
                  <thead className="bg-gray-950/80 text-gray-400 border-b border-white/10">
                    <tr>
                      <th className="px-3 py-2 font-medium">Promoción</th>
                      <th className="px-3 py-2 font-medium tabular-nums">Canjes</th>
                      <th className="px-3 py-2 font-medium tabular-nums">LUXAE/USD × cupón</th>
                      <th className="px-3 py-2 font-medium tabular-nums">Suma USD</th>
                      <th className="px-3 py-2 font-medium font-mono">ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {luxaeStats.byPromotion.slice(0, 20).map((row) => (
                      <tr key={row.promotionId} className="bg-transparent hover:bg-violet-950/25">
                        <td className="px-3 py-2">
                          <span className="text-gray-200 block truncate max-w-[14rem]" title={row.title || ''}>
                            {row.title || '—'}
                          </span>
                          {row.brand ? (
                            <span className="text-gray-500 block truncate max-w-[14rem]">{row.brand}</span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-gray-100">{row.redemptionCount}</td>
                        <td className="px-3 py-2 tabular-nums">
                          {row.valuePerCouponUsd != null
                            ? row.valuePerCouponUsd.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : '—'}
                        </td>
                        <td className="px-3 py-2 tabular-nums font-medium text-violet-200/95">
                          {row.luxaeUsd.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-2 font-mono text-[10px] text-gray-500 whitespace-nowrap">
                          <Link
                            to={`/promotion-details/${row.promotionId}`}
                            className="text-violet-400 hover:text-violet-300"
                          >
                            {row.promotionId.slice(0, 8)}…
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Sin desglose por promoción (no hay datos o todo quedó en exclusiones).</p>
            )}
            {luxaeStats.byPromotion.length > 20 ? (
              <p className="text-[11px] text-gray-600 mt-2">Mostrando 20 filas de {luxaeStats.byPromotion.length}; el total incluye todas.</p>
            ) : null}
          </section>
        )}

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
              Puede deberse al TTL del índice de Mongo en <code className="text-emerald-200/90 bg-black/40 px-1.5 py-0.5 rounded">expiresAt</code>: sin{' '}
              <code className="text-emerald-200/90 bg-black/40 px-1.5 py-0.5 rounded">QR_REDEEM_RETENTION_DAYS</code>{' '}
              el documento se borra al vencer ese plazo incluso después de redimir — el listado sólo muestra lo que sigue vivo en la base (ver aviso ámbar arriba y el panel USDLXE). Valor ejemplo en .env:{' '}
              <code className="text-emerald-200/90 bg-black/40 px-1 rounded">QR_REDEEM_RETENTION_DAYS=90</code>.
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

        {verifyFunnelError && (
          <div className="rounded-xl border border-rose-500/35 bg-rose-950/30 px-4 py-3 text-rose-100 text-sm">
            {verifyFunnelError}
          </div>
        )}

        {verifyFunnelLoading && !verifyFunnel && !verifyFunnelError && (
          <div className="h-44 rounded-2xl bg-gray-900/50 border border-white/10 animate-pulse" />
        )}

        {verifyFunnel && verifyFunnel.totals.matchingCoupons > 0 && (
          <section className="rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-950/35 via-gray-900/55 to-slate-950/55 p-5 md:p-6 backdrop-blur-sm">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 text-cyan-300/95 text-xs font-semibold uppercase tracking-wide mb-1">
                  <Eye className="h-4 w-4" />
                  Visto en POS (verify) vs canje
                </div>
                <p className="text-[11px] text-gray-500 max-w-3xl leading-relaxed">
                  <strong className="text-gray-300">Visto</strong> significa que el cupón tiene{' '}
                  <code className="text-cyan-200/90 bg-black/35 px-1 rounded text-[10px]">lastVerifiedAt</code>{' '}
                  (endpoint <code className="text-cyan-200/90 bg-black/35 px-1 rounded text-[10px]">/api/discount-qr/verify</code>). El{' '}
                  <strong className="text-gray-300">canje directo sin verify</strong> es habitual en algunos flujos móvil — no es fallo por sí solo.
                  Estos totales<strong className="text-gray-400"> sí respetan</strong> promoción, tienda e influencer seleccionados, y agrupan{' '}
                  <strong>todos</strong> los documentos coincidentes (no el límite de la tabla siguiente).
                </p>
              </div>
              <span className="text-[11px] text-gray-600 tabular-nums">
                {verifyFunnel.generatedAt
                  ? `Datos · ${new Date(verifyFunnel.generatedAt).toLocaleString()}`
                  : null}
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 md:gap-3 mb-5">
              {[
                { k: 'Cupones coincidentes', v: verifyFunnel.totals.matchingCoupons },
                { k: 'Canjeados', v: verifyFunnel.totals.redeemed },
                { k: 'Vigentes sin canje', v: verifyFunnel.totals.open },
                { k: 'Caducados sin uso', v: verifyFunnel.totals.expiredUnused },
                { k: 'Alguna vez verify POS', v: verifyFunnel.totals.everHadPosVerify },
              ].map(({ k, v }) => (
                <div
                  key={k}
                  className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-center lg:text-left"
                >
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide leading-tight mb-1">{k}</p>
                  <p className="text-lg font-bold tabular-nums text-white">{v}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-3">
                <p className="text-[10px] text-gray-500 uppercase mb-1">Canjes con vista POS previa</p>
                <p className="text-2xl font-bold text-emerald-200 tabular-nums">
                  {fmtPctLabel(verifyFunnel.rates.pctRedemptionsWithPriorPosView)}
                </p>
                <p className="text-[11px] text-gray-600 mt-1">
                  Respecto del total <span className="text-gray-400">canjeado</span> en este filtro.
                </p>
              </div>
              <div className="rounded-xl border border-teal-500/25 bg-teal-950/15 px-4 py-3">
                <p className="text-[10px] text-gray-500 uppercase mb-1">Ratio verify → canje ordenado</p>
                <p className="text-2xl font-bold text-teal-200 tabular-nums">
                  {fmtPctLabel(verifyFunnel.rates.pctOfVerifiedCouponsEndingRedeemedWithOrderedView)}
                </p>
                <p className="text-[11px] text-gray-600 mt-1">
                  <span className="text-teal-200/85 font-medium">Numerador:</span> canjes con{' '}
                  <code className="text-gray-400 text-[10px]">verify ≤ canje</code>.{' '}
                  <span className="text-teal-200/85 font-medium">Denominador:</span> cualquier cupón con al menos un verify en el mismo filtro
                  (vigentes o caducados sin canje siguen ahí — el % sube cuando esos culminan).
                </p>
              </div>
              <div className="rounded-xl border border-sky-500/25 bg-sky-950/15 px-4 py-3">
                <p className="text-[10px] text-gray-500 uppercase mb-1">Con al menos un verify</p>
                <p className="text-2xl font-bold text-sky-200 tabular-nums">
                  {fmtPctLabel(verifyFunnel.rates.pctEverVerifiedAmongAllMatching)}
                </p>
                <p className="text-[11px] text-gray-600 mt-1">
                  Respecto de todos los cupones del mismo filtro.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-3 md:p-4" style={{ minHeight: 300 }}>
              <ResponsiveContainer width="100%" height={290}>
                <BarChart data={verifyFunnelChartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#475569' }} />
                  <YAxis
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: '#475569' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(34,211,238,0.06)' }}
                    contentStyle={{
                      background: '#020617',
                      border: '1px solid #334155',
                      borderRadius: 12,
                      fontSize: 12,
                      color: '#e2e8f0',
                    }}
                    formatter={(value: number, name: string) => [
                      `${value}`,
                      name === 'conVerify' ? 'Con verify POS' : 'Sin verify POS',
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8, color: '#94a3b8' }} />
                  <Bar dataKey="escaneoPos" stackId="a" fill="#34d399" name="conVerify" />
                  <Bar dataKey="sinRegistroPos" stackId="a" fill="#475569" name="sinVerify" />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-gray-600 mt-2">{verifyFunnel.noteEs ?? ''}</p>
            </div>
          </section>
        )}

        {couponActivityError && (
          <div className="rounded-xl border border-amber-500/35 bg-amber-950/25 px-4 py-3 text-amber-100/95 text-sm">
            {couponActivityError}
          </div>
        )}

        <section className="rounded-2xl border border-white/10 bg-gray-900/40 p-5 md:p-6 backdrop-blur-sm">
          <p className="text-xs text-gray-500 mb-3">
            Comparación global con los mismos filtros: hasta {limit} cupones (orden por emisión reciente). Incluye{' '}
            <code className="text-emerald-200/90 bg-black/40 px-1 py-0.5 rounded">abiertos</code>,{' '}
            <code className="text-violet-200/90 bg-black/40 px-1 py-0.5 rounded">canjeados</code> y{' '}
            <code className="text-gray-300 bg-black/40 px-1 py-0.5 rounded">caducados sin uso</code>.
          </p>
          <CouponQrActivitySection
            theme="live"
            activity={couponActivity}
            loading={couponActivityLoading}
            showInfluencerColumn
            emptyMessage="No hay cupones en el resultado de esta consulta. Ajusta promoción, tienda o la cantidad máxima si hace falta."
          />
        </section>
      </div>
    </div>
  );
}
