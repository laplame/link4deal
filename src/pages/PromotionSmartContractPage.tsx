import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileCode,
  Building2,
  Ticket,
  DollarSign,
  Calendar,
  Coins,
  Users,
  Hash,
  ExternalLink,
  Shield,
  AlertCircle
} from 'lucide-react';
import { getPromotionImageUrl } from '../utils/promotionImage';
import { getPolygonscanAddressUrl } from '../utils/polygonExplorer';
import {
  RedemptionCard,
  type RedemptionRow,
} from './RedemptionsLivePage';

const REDEMPTIONS_POLL_MS = 6000;

const OFFER_TYPE_LABELS: Record<string, string> = {
  percentage: 'Descuento por porcentaje',
  bogo: 'Compra 1 lleva 2 (BOGO)',
  cashback_fixed: 'Cashback fijo (USD)',
  cashback_percentage: 'Cashback por porcentaje'
};

const CATEGORY_LABELS: Record<string, string> = {
  electronics: 'Electrónicos',
  fashion: 'Moda',
  home: 'Hogar',
  beauty: 'Belleza',
  sports: 'Deportes',
  books: 'Libros',
  food: 'Comida',
  other: 'Otros'
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  active: 'Activo',
  paused: 'Pausado',
  completed: 'Completado',
  expired: 'Expirado',
  deleted: 'Eliminado'
};

interface PromotionData {
  _id: string;
  title: string;
  description?: string;
  brand?: string;
  productName?: string;
  category?: string;
  offerType?: string;
  originalPrice?: number;
  currentPrice?: number;
  currency?: string;
  currencyDisplay?: string;
  discountPercentage?: number;
  promotionalValueUsd?: number;
  totalQuantity?: number | null;
  validFrom?: string;
  validUntil?: string;
  status?: string;
  conversions?: number;
  views?: number;
  clicks?: number;
  images?: Array<{ url?: string; cloudinaryUrl?: string }>;
  storeLocation?: { country?: string };
  smartContract?: { address?: string; network?: string; tokenStandard?: string; blockchainExplorer?: string };
  /** Valor por cupón en USD = tokens LUXAE por cupón (calculado en backend, puede incluir FX MXN→USD) */
  valuePerCouponUsd?: number | null;
  /** Emisión máxima del contrato en USD = MaxEmission (PSCS-1) */
  maxEmissionUsd?: number | null;
  /** Tipo de cambio usado si currency era MXN */
  fxRateUsed?: number | null;
}

export default function PromotionSmartContractPage() {
  const { id } = useParams<{ id: string }>();
  const [promotion, setPromotion] = useState<PromotionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveRows, setLiveRows] = useState<RedemptionRow[]>([]);
  const [liveLoading, setLiveLoading] = useState(true);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveHint, setLiveHint] = useState<string | null>(null);
  const [liveLastAt, setLiveLastAt] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('ID de promoción no válido');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/promotions/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.success && data?.data) {
          setPromotion(data.data);
        } else {
          setError(data?.message || 'Promoción no encontrada');
        }
      })
      .catch(() => {
        if (!cancelled) setError('Error al cargar la promoción');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  const fetchLiveRedemptions = useCallback(
    async (silent: boolean) => {
      if (!id) return;
      if (!silent) setLiveLoading(true);
      try {
        const q = new URLSearchParams();
        q.set('promotionId', id);
        q.set('limit', '40');
        const headers: HeadersInit = { Accept: 'application/json' };
        const key = import.meta.env.VITE_REDEMPTIONS_LIST_API_KEY;
        if (key) headers['x-redemptions-api-key'] = key;
        const res = await fetch(`/api/discount-qr/redemptions/recent?${q.toString()}`, { headers });
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          setLiveError(
            'Listado de redenciones protegido. Configura VITE_REDEMPTIONS_LIST_API_KEY en el front igual que REDEMPTIONS_LIST_API_KEY en el servidor.'
          );
          setLiveRows([]);
          setLiveHint(null);
          return;
        }
        if (!res.ok || !data.ok) {
          setLiveError(typeof data.message === 'string' ? data.message : 'No se pudo cargar redenciones');
          setLiveRows([]);
          setLiveHint(null);
          return;
        }
        setLiveError(null);
        setLiveRows(Array.isArray(data.data) ? data.data : []);
        setLiveHint(typeof data.hint === 'string' ? data.hint : null);
        setLiveLastAt(new Date().toISOString());
      } catch {
        setLiveError('Error de red al cargar redenciones');
        setLiveRows([]);
        setLiveHint(null);
      } finally {
        if (!silent) setLiveLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    if (!id) return;
    void fetchLiveRedemptions(false);
    const timer = window.setInterval(() => void fetchLiveRedemptions(true), REDEMPTIONS_POLL_MS);
    return () => window.clearInterval(timer);
  }, [id, fetchLiveRedemptions]);

  const influencerSummaries = useMemo(() => {
    const byKey = new Map<
      string,
      { label: string; count: number; lastAt: string | null }
    >();
    for (const row of liveRows) {
      if (!row.influencerId && !row.influencerName && !row.influencerUsername) continue;
      const key =
        row.influencerId ||
        row.influencerUsername ||
        row.influencerName ||
        'unknown';
      const label =
        row.influencerName ||
        row.influencerUsername ||
        (row.influencerId ? `${row.influencerId.slice(0, 8)}…` : '—');
      const prev = byKey.get(key);
      const usedAt = row.usedAt;
      if (!prev) {
        byKey.set(key, { label, count: 1, lastAt: usedAt });
      } else {
        prev.count += 1;
        if (
          usedAt &&
          (!prev.lastAt || new Date(usedAt).getTime() > new Date(prev.lastAt).getTime())
        ) {
          prev.lastAt = usedAt;
        }
      }
    }
    return Array.from(byKey.values()).sort((a, b) => b.count - a.count);
  }, [liveRows]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Cargando smart contract...</p>
        </div>
      </div>
    );
  }

  if (error || !promotion) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">No se encontró la promoción</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al marketplace
          </Link>
        </div>
      </div>
    );
  }

  const validUntil = promotion.validUntil ? new Date(promotion.validUntil) : null;
  const validFrom = promotion.validFrom ? new Date(promotion.validFrom) : null;
  const totalCupones = promotion.totalQuantity ?? null;
  const redenciones = promotion.conversions ?? 0;
  // Backend calcula valuePerCouponUsd y maxEmissionUsd (incluye conversión MXN→USD si aplica)
  const valuePerCouponUsd = promotion.valuePerCouponUsd ?? promotion.promotionalValueUsd ?? (totalCupones && totalCupones > 0 && promotion.maxEmissionUsd ? promotion.maxEmissionUsd / totalCupones : null);
  const maxEmissionUsd = promotion.maxEmissionUsd ?? (valuePerCouponUsd != null && totalCupones != null && totalCupones > 0 ? valuePerCouponUsd * totalCupones : promotion.promotionalValueUsd ?? null);
  const emisionUsd = maxEmissionUsd;
  // LUXAE = USD (PSCS-1); emisión máxima en tokens = maxEmissionUsd
  const luxaeCreados = maxEmissionUsd;
  const offerTypeLabel = OFFER_TYPE_LABELS[promotion.offerType || 'percentage'] || promotion.offerType || 'Descuento';
  const categoryLabel = CATEGORY_LABELS[promotion.category || ''] || promotion.category || 'Otros';
  const statusLabel = STATUS_LABELS[promotion.status || ''] || promotion.status || '—';
  const jurisdiction = promotion.storeLocation?.country || 'MX';
  const isMxn = (promotion.currency || promotion.currencyDisplay || '').toUpperCase() === 'MXN';
  const valuePerCoupon = valuePerCouponUsd;

  const contractAddress =
    promotion.smartContract?.address || `0x${(id || '').padEnd(40, '0').slice(0, 42)}`;
  const polygonExplorerUrl = getPolygonscanAddressUrl(contractAddress);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          to={`/promotion-details/${id}`}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a la promoción
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header con imagen y título */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white">
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <FileCode className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Smart Contract</h1>
                  <p className="text-slate-300 text-sm">Detalle de la promoción en blockchain</p>
                </div>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                PSCS-1
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-slate-400">
              <span className="font-mono">promotion_id: {id}</span>
              <span>·</span>
              <span>contract_version: PSCS-1</span>
              <span>·</span>
              <span>jurisdiction: {jurisdiction}</span>
            </div>
            {promotion.images?.length ? (
              <img
                src={getPromotionImageUrl(promotion.images)}
                alt={promotion.title}
                className="w-full h-40 object-cover rounded-lg mt-4"
              />
            ) : null}
            <h2 className="text-lg font-semibold mt-4">{promotion.title}</h2>
            {promotion.brand && (
              <p className="text-slate-300 text-sm flex items-center gap-1 mt-1">
                <Building2 className="h-4 w-4" />
                {promotion.brand}
              </p>
            )}
          </div>

          <div className="p-6 space-y-6">
            {/* Grid de datos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Tipo de promoción</p>
                <p className="font-medium text-slate-900 flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-blue-500" />
                  {offerTypeLabel}
                </p>
                {promotion.category && (
                  <p className="text-sm text-slate-500 mt-1">{categoryLabel}</p>
                )}
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Emisor / Marca</p>
                <p className="font-medium text-slate-900 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-purple-500" />
                  {promotion.brand || '—'}
                </p>
                <p className="text-xs text-slate-500 mt-1">Jurisdicción: {jurisdiction}</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Estado del contrato</p>
                <p className="font-medium text-slate-900">{statusLabel}</p>
                <p className="text-xs text-slate-500 mt-1">PSCS-1: draft | active | paused | completed | expired</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Inventario (total_coupons / redeemed)</p>
                <p className="font-medium text-slate-900 flex items-center gap-2">
                  <Hash className="h-4 w-4 text-slate-500" />
                  {totalCupones != null ? `${totalCupones.toLocaleString()} / ${redenciones}` : `— / ${redenciones}`}
                </p>
                <p className="text-xs text-slate-500 mt-1">Cupones disponibles para redención</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Emisión máxima (USD)</p>
                <p className="font-medium text-slate-900 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  {maxEmissionUsd != null ? `$${Number(maxEmissionUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD` : '—'}
                </p>
                <p className="text-xs text-slate-500 mt-1">MaxEmission = ValuePerCoupon × TotalCoupons (PSCS-1 §5)</p>
                {valuePerCoupon != null && (
                  <p className="text-xs text-slate-500 mt-0.5">Valor por cupón: ${Number(valuePerCoupon).toFixed(2)} USD = {Number(valuePerCoupon).toFixed(2)} LUXAE/cupón</p>
                )}
                {isMxn && promotion.fxRateUsed != null && (
                  <p className="text-xs text-amber-700 mt-1">Precios en MXN convertidos a USD (tipo de cambio: {Number(promotion.fxRateUsed).toFixed(4)} USD/MXN)</p>
                )}
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Vigencia (validity)</p>
                <p className="font-medium text-slate-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber-500" />
                  {validUntil ? validUntil.toLocaleDateString('es-MX', { dateStyle: 'long' }) : '—'}
                </p>
                {validFrom && (
                  <p className="text-xs text-slate-500 mt-1">start_date: {validFrom.toLocaleDateString('es-MX')}</p>
                )}
                {validUntil && (
                  <p className="text-xs text-slate-500 mt-0.5">end_date: {validUntil.toLocaleDateString('es-MX')}</p>
                )}
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Luxae (tokens) por cupón / Emisión máxima</p>
                <p className="font-medium text-slate-900 flex items-center gap-2">
                  <Coins className="h-4 w-4 text-amber-500" />
                  {valuePerCoupon != null ? `${Number(valuePerCoupon).toFixed(2)} LUXAE/cupón` : '—'}
                </p>
                {luxaeCreados != null && (
                  <p className="text-sm font-medium text-slate-700 mt-1">Máx. {luxaeCreados.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} LUXAE</p>
                )}
                <p className="text-xs text-slate-500 mt-1">1 LUXAE = 1 USD (PSCS-1 §6). Tokens se emiten bajo redención.</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 sm:col-span-2">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                  Influencers (canjes recientes en ventana del feed)
                </p>
                {influencerSummaries.length === 0 ? (
                  <p className="text-sm text-slate-600 mt-1">
                    Aún no hay cupones redimidos con influencer asignado en los últimos resultados del API, o el listado
                    está vacío.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {influencerSummaries.map((inf, idx) => (
                      <li
                        key={`${inf.label}-${idx}`}
                        className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-800"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <Users className="h-4 w-4 text-pink-500 shrink-0" />
                          {inf.label}
                        </span>
                        <span className="text-xs text-slate-500 tabular-nums">
                          {inf.count} canje{inf.count !== 1 ? 's' : ''}
                          {inf.lastAt
                            ? ` · último ${new Date(inf.lastAt).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}`
                            : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Dirección del contrato y redes */}
            <div className="border-t border-slate-200 pt-6">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Contrato y redes</p>
              <div className="bg-slate-100 rounded-xl p-4 border border-slate-200">
                <p className="text-[11px] font-mono text-slate-600 break-all mb-3">
                  {contractAddress}
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-[#8247E5]/15 text-[#6B21A8] border border-[#8247E5]/30">
                    Polygon
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-100 text-purple-800">Solana</span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-sky-100 text-sky-800">XRP</span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-200 text-slate-700">Ethereum</span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-800">Avalanche</span>
                </div>
                <p className="text-xs text-slate-500 mb-2">
                  El enlace abre{' '}
                  <span className="font-medium text-slate-700">Polygonscan</span> (red Polygon PoS) con esta dirección como referencia.
                </p>
                <a
                  href={polygonExplorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ver smart contract en Polygonscan
                </a>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Redenciones en vivo
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Mismo origen que la página «Redenciones en vivo». Actualización cada {REDEMPTIONS_POLL_MS / 1000}s.
                  </p>
                  {liveLastAt && (
                    <p className="text-xs text-slate-400 mt-1 tabular-nums">
                      Sincronizado: {new Date(liveLastAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <Link
                  to={`/redenciones-en-vivo?promotionId=${encodeURIComponent(id || '')}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  Abrir panel completo
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
              {liveHint && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900 text-xs mb-4">
                  {liveHint}
                </div>
              )}
              {liveError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-800 text-sm mb-4">
                  {liveError}
                </div>
              )}
              {liveLoading && liveRows.length === 0 && !liveError ? (
                <div className="grid gap-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-32 rounded-xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : liveRows.length === 0 && !liveError ? (
                <p className="text-sm text-slate-500">
                  No hay redenciones recientes para esta promoción (o el TTL del cupón eliminó el historial).
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {liveRows.map((row, idx) => (
                    <RedemptionCard
                      key={`${row.couponId}-${idx}`}
                      row={row}
                      initiallyOpen={idx === 0}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-500 text-sm">
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4 flex-shrink-0" />
                Información de lectura pública. Los datos pueden variar según la red.
              </span>
              <span className="text-slate-400">Estándar: PSCS-1 (docs/PSCS-1.md)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
