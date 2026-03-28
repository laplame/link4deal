import React, { useState, useEffect } from 'react';
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

/** URL pública en Polygonscan (mainnet) para la dirección del contrato mostrada en esta página. */
function getPolygonscanAddressUrl(address: string): string {
  const trimmed = (address || '').trim();
  const hex = trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`;
  return `https://polygonscan.com/address/${hex}`;
}

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
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Influencers en la promoción</p>
                <p className="font-medium text-slate-900 flex items-center gap-2">
                  <Users className="h-4 w-4 text-pink-500" />
                  En proceso
                </p>
                <p className="text-xs text-slate-500 mt-1">Los influencers asociados se mostrarán cuando estén verificados.</p>
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
