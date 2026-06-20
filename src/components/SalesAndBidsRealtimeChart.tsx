import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface ChartDataPoint {
  fecha: string;
  label: string;
  ventas: number;
  pujas: number;
}

interface SalesAndBidsRealtimeChartProps {
  data: ChartDataPoint[];
  /** Actualizar cada N ms; 0 = no auto-refresh */
  refreshIntervalMs?: number;
}

const formatVentas = (value: number) => (value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value));

export function SalesAndBidsRealtimeChart({ data }: SalesAndBidsRealtimeChartProps) {
  const hasData = data.length > 0;

  if (!hasData) {
    return (
      <div className="h-72 flex flex-col items-center justify-center text-center px-4 text-gray-500 bg-gray-50 rounded-lg">
        <p className="font-medium text-gray-700">Sin datos suficientes en este periodo</p>
        <p className="text-sm mt-2 max-w-md">
          Las barras muestran cupones redimidos por día; la línea, comisión de pujas (USD). Hasta que haya registros reales no se muestran estimaciones visuales.
        </p>
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 50, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            stroke="#9ca3af"
          />
          <YAxis
            yAxisId="ventas"
            orientation="left"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickFormatter={formatVentas}
            stroke="#059669"
            label={{ value: 'Ventas', angle: -90, position: 'insideLeft', style: { fill: '#059669', fontSize: 12 } }}
          />
          <YAxis
            yAxisId="pujas"
            orientation="right"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickFormatter={(v) => `$${v}`}
            stroke="#7c3aed"
            label={{ value: 'Pujas (USD)', angle: 90, position: 'insideRight', style: { fill: '#7c3aed', fontSize: 12 } }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="bg-gray-900 text-white rounded-lg shadow-lg border border-gray-700 p-3 text-sm">
                  <p className="font-medium text-gray-200 mb-2">{label}</p>
                  <p className="text-emerald-400">Ventas: {payload.find(p => p.dataKey === 'ventas')?.value ?? 0}</p>
                  <p className="text-purple-400">Puja (USD): ${Number(payload.find(p => p.dataKey === 'pujas')?.value ?? 0).toFixed(2)}</p>
                </div>
              );
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value) => (value === 'ventas' ? 'Ventas (cupones redimidos)' : 'Comisión por venta (USD)')}
          />
          <Bar
            yAxisId="ventas"
            dataKey="ventas"
            fill="#10b981"
            fillOpacity={0.7}
            name="ventas"
            radius={[4, 4, 0, 0]}
          />
          <Line
            yAxisId="pujas"
            type="monotone"
            dataKey="pujas"
            stroke="#7c3aed"
            strokeWidth={2}
            dot={{ fill: '#7c3aed', r: 4 }}
            name="pujas"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Fila de GET /api/influencers/:id/coupons-activity o :id/coupon-redemptions (redimidos). */
export interface PublicCouponRedemption {
  couponId: string;
  /** Fecha/hora del canje (única fuente para redimidos). */
  redeemedAt?: string | null;
  /** @deprecated usar redeemedAt */
  usedAt?: string | null;
  promotionId: string | null;
  /** shopId del payload de la promoción */
  promoShopId?: string | null;
  /** alias legado */
  shopId?: string | null;
  discountPercentage: number | null;
  referralCode: string | null;
  createdAt?: string | null;
  expiresAt?: string | null;
  /** Último escaneo / verify en tienda */
  lastOpenedAt?: string | null;
  /** Tienda informada por el lector al verificar */
  openedAtShopId?: string | null;
  openLocation?: { lat: number; lng: number; accuracyM?: number | null } | null;
  redeemLocation?: { lat: number; lng: number; accuracyM?: number | null } | null;
  /** Presente en el panel global cuando el payload incluye influencerId. */
  influencerId?: string | null;
}

/** Hay señal de cupones redimidos o uso registrado por promoción (no inventamos barras si esto es falso). */
export function hasCouponRedemptionEvidence(
  redemptions: PublicCouponRedemption[],
  influencer: { recentPromotions?: Array<{ couponUsage?: number }> } | null | undefined,
): boolean {
  if (redemptions.length > 0) return true;
  return Boolean(
    influencer?.recentPromotions?.some((p) => (Number(p.couponUsage) || 0) > 0),
  );
}

export function chartShowsActivity(chartData: ChartDataPoint[]): boolean {
  return chartData.some((d) => d.ventas > 0 || d.pujas > 0);
}

export type ChartAnalyticsRange = '7d' | '30d' | '90d' | 'all';

export const CHART_RANGE_OPTIONS: { key: ChartAnalyticsRange; label: string; description: string }[] = [
  { key: '7d', label: '7 días', description: 'Últimos 7 días' },
  { key: '30d', label: '30 días', description: 'Últimos 30 días' },
  { key: '90d', label: '3 meses', description: 'Últimos 3 meses' },
  { key: 'all', label: 'Histórico', description: 'Todo el historial disponible' },
];

const RANGE_DAY_COUNT: Record<Exclude<ChartAnalyticsRange, 'all'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

/** Más de este rango en días → buckets semanales (histórico largo). */
const WEEKLY_BUCKET_MIN_SPAN_DAYS = 120;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Lunes de la semana que contiene la fecha YYYY-MM-DD. */
function weekStartKeyFromDateStr(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  const dow = d.getDay();
  const diff = dow === 0 ? 6 : dow - 1;
  d.setDate(d.getDate() - diff);
  return toDateKey(startOfDay(d));
}

function startOfWeekMonday(d: Date): Date {
  const x = startOfDay(d);
  const dow = x.getDay();
  const diff = dow === 0 ? 6 : dow - 1;
  x.setDate(x.getDate() - diff);
  return x;
}

function earliestActivityDate(
  influencer: {
    recentPromotions?: Array<{ date?: string }>;
  } | null,
  bids: Array<{
    bidHistory?: Array<{ timestamp?: string }>;
    startDate?: string;
  }>,
  redemptions: PublicCouponRedemption[],
): Date | null {
  let min: Date | null = null;
  const consider = (raw: string | null | undefined) => {
    const s = (raw || '').toString().trim();
    if (!s) return;
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return;
    const day = startOfDay(d);
    if (!min || day < min) min = day;
  };
  redemptions.forEach((r) => consider(r.redeemedAt || r.usedAt));
  bids.forEach((bid) => {
    bid.bidHistory?.forEach((h) => consider(h.timestamp));
    consider(bid.startDate);
  });
  influencer?.recentPromotions?.forEach((p) => consider(p.date));
  return min;
}

/**
 * Serie temporal solo con datos reales:
 * - Cupones redimidos (Mongo) por día/semana, o `couponUsage` en recentPromotions si no hay listado.
 * - Pujas: historial por fecha / currentBid en día de inicio (sin curvas sintéticas).
 */
export function buildSalesAndBidsChartData(
  influencer: {
    recentPromotions?: Array<{ date?: string; couponUsage?: number; totalSales?: number }>;
    couponStats?: { totalSales?: number; totalCoupons?: number };
  } | null,
  bids: Array<{
    bidHistory?: Array<{ timestamp?: string; amount?: number }>;
    currentBid?: number;
    startDate?: string;
    endDate?: string;
  }>,
  redemptions: PublicCouponRedemption[] = [],
  range: ChartAnalyticsRange = '7d',
): ChartDataPoint[] {
  const now = startOfDay(new Date());
  let rangeStart: Date;
  let useWeeklyBuckets = false;

  if (range === 'all') {
    const earliest = earliestActivityDate(influencer, bids, redemptions);
    rangeStart = earliest ?? addDays(now, -6);
    const spanDays = Math.floor((now.getTime() - rangeStart.getTime()) / 86400000) + 1;
    if (spanDays > WEEKLY_BUCKET_MIN_SPAN_DAYS) {
      useWeeklyBuckets = true;
      rangeStart = startOfWeekMonday(rangeStart);
    }
  } else {
    const days = RANGE_DAY_COUNT[range];
    rangeStart = addDays(now, -(days - 1));
  }

  const bucketMap = new Map<string, { ventas: number; pujas: number }>();

  if (!useWeeklyBuckets) {
    for (let cursor = new Date(rangeStart); cursor <= now; cursor = addDays(cursor, 1)) {
      bucketMap.set(toDateKey(cursor), { ventas: 0, pujas: 0 });
    }
  } else {
    for (let cursor = startOfWeekMonday(rangeStart); cursor <= now; cursor = addDays(cursor, 7)) {
      bucketMap.set(toDateKey(cursor), { ventas: 0, pujas: 0 });
    }
  }

  const bucketForDateStr = (dateStr: string): string | null => {
    if (!dateStr || dateStr.length < 10) return null;
    const key = useWeeklyBuckets ? weekStartKeyFromDateStr(dateStr) : dateStr.slice(0, 10);
    return bucketMap.has(key) ? key : null;
  };

  const usePromotionFallback = redemptions.length === 0;

  if (!usePromotionFallback) {
    redemptions.forEach((r) => {
      const when = r.redeemedAt || r.usedAt;
      if (!when) return;
      const dateStr = new Date(when).toISOString().slice(0, 10);
      const key = bucketForDateStr(dateStr);
      if (!key) return;
      bucketMap.get(key)!.ventas += 1;
    });
  } else if (influencer?.recentPromotions?.length) {
    influencer.recentPromotions.forEach((p) => {
      const dateStr = (p.date || '').toString().slice(0, 10);
      const key = dateStr ? bucketForDateStr(dateStr) : null;
      if (key) bucketMap.get(key)!.ventas += Number(p.couponUsage) || 0;
    });
  }

  bids.forEach((bid) => {
    bid.bidHistory?.forEach((h) => {
      const ts = (h.timestamp || '').toString();
      const dateStr = ts.slice(0, 10);
      const key = dateStr ? bucketForDateStr(dateStr) : null;
      if (key) {
        const cur = bucketMap.get(key)!;
        cur.pujas = Math.max(cur.pujas, h.amount ?? 0);
      }
    });
    const start = bid.startDate ? bid.startDate.toString().slice(0, 10) : '';
    const key = start ? bucketForDateStr(start) : null;
    if (key) {
      const cur = bucketMap.get(key)!;
      if ((bid.currentBid ?? 0) > cur.pujas) cur.pujas = bid.currentBid ?? 0;
    }
  });

  const points: ChartDataPoint[] = [];
  bucketMap.forEach((val, key) => {
    const d = new Date(`${key}T12:00:00`);
    const label = useWeeklyBuckets
      ? `Sem ${d.toLocaleDateString('es', { day: '2-digit', month: 'short' })}`
      : d.toLocaleDateString('es', { day: '2-digit', month: 'short' });
    points.push({
      fecha: key,
      label,
      ventas: val.ventas,
      pujas: Number(val.pujas.toFixed(2)),
    });
  });

  return points.sort((a, b) => a.fecha.localeCompare(b.fecha));
}
