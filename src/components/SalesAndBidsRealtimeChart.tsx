import React from 'react';
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
const formatPujas = (value: number) => `$${value.toFixed(2)}`;

export function SalesAndBidsRealtimeChart({ data, refreshIntervalMs = 0 }: SalesAndBidsRealtimeChartProps) {
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

/**
 * Serie diaria últimos 7 días solo con datos reales:
 * - Cupones redimidos (Mongo) agrupados por día, o si no hay listado API, uso `couponUsage` en recentPromotions.
 * - Pujas: historial por fecha / currentBid solo en día de inicio (sin curvas sintéticas).
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
): ChartDataPoint[] {
  const now = new Date();
  const points: ChartDataPoint[] = [];
  const dayMap = new Map<string, { ventas: number; pujas: number }>();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dayMap.set(key, { ventas: 0, pujas: 0 });
  }

  const usePromotionFallback = redemptions.length === 0;

  if (!usePromotionFallback) {
    redemptions.forEach((r) => {
      const when = r.redeemedAt || r.usedAt;
      if (!when) return;
      const dateStr = new Date(when).toISOString().slice(0, 10);
      if (!dayMap.has(dateStr)) return;
      const cur = dayMap.get(dateStr)!;
      cur.ventas += 1;
    });
  } else if (influencer?.recentPromotions?.length) {
    influencer.recentPromotions.forEach((p) => {
      const dateStr = (p.date || '').toString().slice(0, 10);
      if (dateStr && dayMap.has(dateStr)) {
        const cur = dayMap.get(dateStr)!;
        cur.ventas += Number(p.couponUsage) || 0;
      }
    });
  }

  bids.forEach((bid) => {
    bid.bidHistory?.forEach((h) => {
      const ts = (h.timestamp || '').toString();
      const dateStr = ts.slice(0, 10);
      if (dateStr && dayMap.has(dateStr)) {
        const cur = dayMap.get(dateStr)!;
        cur.pujas = Math.max(cur.pujas, h.amount ?? 0);
      }
    });
    const start = bid.startDate ? bid.startDate.toString().slice(0, 10) : '';
    if (start && dayMap.has(start)) {
      const cur = dayMap.get(start)!;
      if ((bid.currentBid ?? 0) > cur.pujas) cur.pujas = bid.currentBid ?? 0;
    }
  });

  dayMap.forEach((val, key) => {
    const d = new Date(key);
    points.push({
      fecha: key,
      label: d.toLocaleDateString('es', { day: '2-digit', month: 'short' }),
      ventas: val.ventas,
      pujas: Number(val.pujas.toFixed(2)),
    });
  });

  return points.sort((a, b) => a.fecha.localeCompare(b.fecha));
}
