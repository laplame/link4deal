import React, { useMemo } from 'react';
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
      <div className="h-72 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
        <p>No hay datos de ventas y pujas para mostrar aún.</p>
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

/** Genera datos de ejemplo para la gráfica a partir de influencer y bids (mock/API). */
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
  }>
): ChartDataPoint[] {
  const now = new Date();
  const points: ChartDataPoint[] = [];
  const dayMap = new Map<string, { ventas: number; pujas: number }>();

  // Inicializar últimos 7 días
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dayMap.set(key, { ventas: 0, pujas: 0 });
  }

  // Ventas desde promociones (recentPromotions) por fecha
  if (influencer?.recentPromotions?.length) {
    influencer.recentPromotions.forEach((p) => {
      const dateStr = (p.date || '').toString().slice(0, 10);
      if (dateStr && dayMap.has(dateStr)) {
        const cur = dayMap.get(dateStr)!;
        cur.ventas += p.couponUsage ?? 0;
      }
    });
  }
  // Si no hay por día, repartir total en los últimos días
  if (influencer?.couponStats && !influencer?.recentPromotions?.length) {
    const total = influencer.couponStats.totalCoupons ?? 0;
    const perDay = Math.max(0, Math.floor(total / 7));
    dayMap.forEach((val, key) => {
      val.ventas = perDay + Math.floor(Math.random() * 5);
    });
  }

  // Pujas desde bidHistory por fecha
  bids.forEach((bid) => {
    bid.bidHistory?.forEach((h) => {
      const ts = h.timestamp || '';
      const dateStr = ts.slice(0, 10);
      if (dateStr && dayMap.has(dateStr)) {
        const cur = dayMap.get(dateStr)!;
        cur.pujas = Math.max(cur.pujas, h.amount ?? 0);
      }
    });
    // También considerar currentBid en el rango startDate–endDate
    const start = bid.startDate ? bid.startDate.toString().slice(0, 10) : '';
    if (start && dayMap.has(start)) {
      const cur = dayMap.get(start)!;
      if ((bid.currentBid ?? 0) > cur.pujas) cur.pujas = bid.currentBid ?? 0;
    }
  });

  // Si no hay pujas por día en el rango, mostrar tendencia hasta currentBid en el último día
  const anyBidAmount = bids.map((b) => b.currentBid ?? 0).filter(Boolean);
  if (anyBidAmount.length > 0) {
    const maxBid = Math.max(...anyBidAmount);
    const keys = Array.from(dayMap.keys()).sort();
    const allPujasZero = keys.every((k) => dayMap.get(k)!.pujas === 0);
    if (allPujasZero) {
      keys.forEach((key, idx) => {
        const val = dayMap.get(key)!;
        val.pujas = Number((1 + (idx / Math.max(1, keys.length - 1)) * (maxBid - 1)).toFixed(2));
      });
    }
  }

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
