import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  CalendarClock,
  ExternalLink,
  FileCode2,
  Gavel,
  RefreshCw,
  Sparkles,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react';
import { getPromotionImageUrl } from '../utils/promotionImage';
import { getDisplayContractAddress, getPolygonscanAddressUrl, shortenAddress } from '../utils/polygonContract';

const POLL_MS = 5000;

interface RecentPuja {
  amount: number;
  at: string | null;
}

interface LiveBidRow {
  bidId: string;
  influencerId: string;
  influencerName: string;
  influencerUsername: string;
  avatar: string;
  promotionId: string;
  campaignTitle: string;
  brandName: string;
  amountUsd: number;
  sector: string;
  sectorsLabel: string[];
  promoCategoryLabel?: string;
  bidHistoryCount: number;
  recentPujas: RecentPuja[];
  updatedAt: string;
  validUntil: string;
  smartContractAddress?: string;
  polygonscanUrl?: string;
  smartContractPagePath?: string;
}

interface Summary {
  total: number;
  bySector: Record<string, { count: number; maxBid: number; sumBid: number }>;
  avgAmountUsd: number;
  maxAmountUsd: number;
}

interface ActivePromoDoc {
  _id?: string;
  id?: string;
  title?: string;
  brand?: string;
  images?: Array<{ cloudinaryUrl?: string; url?: string; filename?: string }>;
  timeLeftLabel?: string;
  discountPercentage?: number;
  smartContract?: { address?: string };
}

function sectorHue(label: string): string {
  let h = 0;
  for (let i = 0; i < label.length; i++) {
    h = (h * 31 + label.charCodeAt(i)) >>> 0;
  }
  return `${h % 360}`;
}

function rowContractLinks(row: LiveBidRow) {
  const addr = row.smartContractAddress ?? getDisplayContractAddress(row.promotionId);
  const scan = row.polygonscanUrl ?? getPolygonscanAddressUrl(addr);
  const appPath = row.smartContractPagePath ?? `/promocion/${row.promotionId}/smart-contract`;
  return { addr, scan, appPath };
}

export default function InfluencerAuctionsLivePage() {
  const [rows, setRows] = useState<LiveBidRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [activePromos, setActivePromos] = useState<ActivePromoDoc[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);

  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch('/api/bids/live');
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setError(typeof data.message === 'string' ? data.message : 'No se pudo cargar el feed');
        setRows([]);
        setSummary(null);
        return;
      }
      setError(null);
      setRows(Array.isArray(data.data) ? data.data : []);
      setSummary(data.summary ?? null);
      setGeneratedAt(typeof data.generatedAt === 'string' ? data.generatedAt : null);
    } catch {
      setError('Error de red');
      setRows([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActiveCampaigns = useCallback(async () => {
    setCampaignsLoading(true);
    try {
      const res = await fetch('/api/promotions/active?limit=12&page=1');
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.data?.docs && Array.isArray(data.data.docs)) {
        setActivePromos(data.data.docs);
      } else {
        setActivePromos([]);
      }
    } catch {
      setActivePromos([]);
    } finally {
      setCampaignsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLive();
  }, [fetchLive, tick]);

  useEffect(() => {
    fetchActiveCampaigns();
  }, [fetchActiveCampaigns, tick]);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), POLL_MS);
    return () => window.clearInterval(id);
  }, []);

  const promoInfluencers = useMemo(() => {
    const m = new Map<
      string,
      Array<{ id: string; name: string; avatar: string; username: string; amountUsd: number }>
    >();
    for (const r of rows) {
      const pid = r.promotionId;
      if (!m.has(pid)) m.set(pid, []);
      const list = m.get(pid)!;
      if (!list.some((x) => x.id === r.influencerId)) {
        list.push({
          id: r.influencerId,
          name: r.influencerName,
          avatar: r.avatar,
          username: r.influencerUsername,
          amountUsd: r.amountUsd,
        });
      }
    }
    return m;
  }, [rows]);

  const sortedCampaignCards = useMemo(() => {
    const docs = [...activePromos];
    docs.sort((a, b) => {
      const ida = String(a.id || a._id || '');
      const idb = String(b.id || b._id || '');
      const ca = promoInfluencers.get(ida)?.length ?? 0;
      const cb = promoInfluencers.get(idb)?.length ?? 0;
      return cb - ca;
    });
    return docs;
  }, [activePromos, promoInfluencers]);

  const sectorCards = useMemo(() => {
    if (!summary?.bySector) return [];
    return Object.entries(summary.bySector)
      .map(([sector, v]) => ({
        sector,
        count: v.count,
        maxBid: v.maxBid,
        avg: Math.round((v.sumBid / Math.max(1, v.count)) * 100) / 100,
      }))
      .sort((a, b) => b.count - a.count);
  }, [summary]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-gray-100">
      <div className="border-b border-amber-500/20 bg-gradient-to-r from-amber-950/40 via-gray-900/90 to-rose-950/30">
        <div className="container mx-auto px-4 py-10 md:py-12">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-amber-400/90 text-sm font-semibold uppercase tracking-wider mb-2">
                <Gavel className="h-5 w-5" />
                Tiempo real
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Subastas de influencers</h1>
              <p className="text-gray-400 max-w-2xl text-lg">
                Comisión actual pujada por venta (USD), agrupada por sector según categorías del influencer y la
                campaña. Cada oferta enlaza al smart contract en Polygon (vista en app y Polygonscan). Actualización
                cada {POLL_MS / 1000}s.
              </p>
              {generatedAt && (
                <p className="text-xs text-gray-500 mt-3">
                  Última actualización: {new Date(generatedAt).toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setTick((t) => t + 1);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-medium transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
              <Link
                to="/influencers"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm font-medium transition-colors"
              >
                <Users className="h-4 w-4" />
                Ver influencers
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Pujas activas</span>
              <Activity className="h-5 w-5 text-amber-400" />
            </div>
            <p className="text-3xl font-bold text-white">{summary?.total ?? rows.length}</p>
            <p className="text-xs text-gray-500 mt-1">Promociones vigentes con puja</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Promedio USD / venta</span>
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="text-3xl font-bold text-emerald-300">
              ${(summary?.avgAmountUsd ?? 0).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Comisión pujada promedio</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Puja máxima</span>
              <Gavel className="h-5 w-5 text-rose-400" />
            </div>
            <p className="text-3xl font-bold text-rose-300">
              ${(summary?.maxAmountUsd ?? 0).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Mayor comisión por venta hoy</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Sectores</span>
              <Store className="h-5 w-5 text-violet-400" />
            </div>
            <p className="text-3xl font-bold text-violet-300">{sectorCards.length}</p>
            <p className="text-xs text-gray-500 mt-1">Con actividad en panel</p>
          </div>
        </div>

        <section className="relative rounded-3xl border border-indigo-500/25 overflow-hidden bg-gradient-to-br from-indigo-950/50 via-gray-900/80 to-violet-950/40">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-violet-500/10 via-transparent to-transparent pointer-events-none" />
          <div className="relative p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-2 text-violet-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  <Sparkles className="h-4 w-4" />
                  Vista de campañas
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white">Campañas vigentes e influencers</h2>
                <p className="text-sm text-gray-400 mt-1 max-w-2xl">
                  Mockup con datos reales: ofertas activas de la API. Los avatares muestran influencers que tienen
                  puja sobre esa promoción (desde el feed en vivo).
                </p>
              </div>
              <Link
                to="/marketplace"
                className="inline-flex items-center gap-2 text-sm text-violet-300 hover:text-violet-200 font-medium shrink-0"
              >
                Ir al marketplace <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {campaignsLoading && activePromos.length === 0 ? (
              <p className="text-gray-500 text-sm py-8 text-center">Cargando campañas…</p>
            ) : sortedCampaignCards.length === 0 ? (
              <p className="text-gray-500 text-sm py-6 text-center">No hay promociones activas en este momento.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {sortedCampaignCards.map((promo) => {
                  const pid = String(promo.id || promo._id || '');
                  const img = getPromotionImageUrl(promo.images);
                  const infl = promoInfluencers.get(pid) || [];
                  const cAddr = getDisplayContractAddress(pid, promo.smartContract);
                  const scan = getPolygonscanAddressUrl(cAddr);
                  const scPath = `/promocion/${pid}/smart-contract`;

                  return (
                    <div
                      key={pid}
                      className="group rounded-2xl border border-white/10 bg-gray-950/60 overflow-hidden hover:border-violet-500/35 hover:shadow-lg hover:shadow-violet-500/10 transition-all"
                    >
                      <div className="relative h-36 bg-gray-800">
                        <img src={img} alt="" className="w-full h-full object-cover opacity-95 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          {typeof promo.discountPercentage === 'number' && (
                            <span className="text-xs font-bold px-2 py-1 rounded-lg bg-amber-500 text-gray-900">
                              -{promo.discountPercentage}%
                            </span>
                          )}
                        </div>
                        {promo.timeLeftLabel && (
                          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg bg-black/55 text-white backdrop-blur-sm">
                            <CalendarClock className="h-3.5 w-3.5" />
                            {promo.timeLeftLabel}
                          </div>
                        )}
                      </div>
                      <div className="p-4 space-y-3">
                        <div>
                          <p className="text-xs text-violet-400 font-medium uppercase tracking-wide">
                            {promo.brand || 'Marca'}
                          </p>
                          <h3 className="text-base font-semibold text-white leading-snug line-clamp-2 mt-0.5">
                            {promo.title || 'Campaña'}
                          </h3>
                        </div>

                        <div>
                          <p className="text-[11px] text-gray-500 uppercase mb-1.5">Influencers pujando</p>
                          {infl.length === 0 ? (
                            <p className="text-xs text-gray-500">Sin pujas registradas en panel (otras campañas sí).</p>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2">
                              {infl.slice(0, 5).map((p) => (
                                <Link
                                  key={`${pid}-${p.id}`}
                                  to={`/influencer/${encodeURIComponent(
                                    (p.username || '').replace(/^@/, '') || p.id
                                  )}`}
                                  className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 hover:bg-white/10 transition-colors"
                                  title={p.name}
                                >
                                  {p.avatar ? (
                                    <img src={p.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                                  ) : (
                                    <div className="w-7 h-7 rounded-full bg-violet-600/40 flex items-center justify-center text-[10px] text-white">
                                      {(p.name || '?').slice(0, 1)}
                                    </div>
                                  )}
                                  <div className="text-left min-w-0">
                                    <p className="text-[11px] text-gray-300 truncate max-w-[6rem]">{p.name}</p>
                                    <p className="text-[10px] text-emerald-400/90">${p.amountUsd.toFixed(2)} / venta</p>
                                  </div>
                                </Link>
                              ))}
                              {infl.length > 5 && (
                                <span className="text-xs text-gray-500">+{infl.length - 5}</span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          <Link
                            to={`/promotion-details/${pid}`}
                            className="inline-flex flex-1 min-w-[7rem] justify-center items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10"
                          >
                            Ver oferta
                          </Link>
                          <Link
                            to={scPath}
                            className="inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl bg-violet-600/80 hover:bg-violet-600 text-white"
                          >
                            <FileCode2 className="h-3.5 w-3.5" />
                            Contrato
                          </Link>
                          <a
                            href={scan}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border border-violet-400/40 text-violet-200 hover:bg-violet-500/10"
                          >
                            Polygonscan
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <p className="text-[10px] text-gray-500 font-mono truncate" title={cAddr}>
                          Polygon · {shortenAddress(cAddr, 5)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {sectorCards.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Store className="h-5 w-5 text-violet-400" />
              Por sector
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {sectorCards.map(({ sector, count, maxBid, avg }) => (
                <div
                  key={sector}
                  className="rounded-xl border border-white/10 bg-gray-900/50 px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span
                      className="inline-block text-xs font-semibold px-2 py-0.5 rounded-md text-white/95 truncate max-w-full"
                      style={{
                        backgroundColor: `hsl(${sectorHue(sector)} 45% 32%)`,
                      }}
                    >
                      {sector}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{count} pujas · prom. ${avg.toFixed(2)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm text-gray-400">tope</p>
                    <p className="font-bold text-amber-300">${maxBid.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Listado en vivo</h2>
          {loading && rows.length === 0 ? (
            <p className="text-gray-500 py-12 text-center">Cargando subastas…</p>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-gray-900/40 p-10 text-center space-y-3">
              <Gavel className="h-12 w-12 text-gray-600 mx-auto" />
              <p className="text-gray-400">No hay pujas activas con promociones vigentes.</p>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Ejecuta en el servidor{' '}
                <code className="text-amber-200/90 bg-black/30 px-1.5 py-0.5 rounded">
                  npm run seed:influencer-auctions
                </code>{' '}
                para crear promociones de demo y pujas ligadas a tus influencers.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-gray-900/40">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-gray-400">
                    <th className="p-4 font-medium">Influencer</th>
                    <th className="p-4 font-medium">Sector</th>
                    <th className="p-4 font-medium">Marca / campaña</th>
                    <th className="p-4 font-medium text-right">USD / venta</th>
                    <th className="p-4 font-medium text-right">Historial</th>
                    <th className="p-4 font-medium">Polygon</th>
                    <th className="p-4 font-medium w-12" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const { scan, appPath, addr } = rowContractLinks(row);
                    return (
                      <tr key={row.bidId} className="border-b border-white/5 hover:bg-white/[0.03]">
                        <td className="p-4">
                          <div className="flex items-center gap-3 min-w-[200px]">
                            {row.avatar ? (
                              <img
                                src={row.avatar}
                                alt=""
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">
                                {(row.influencerName || '?').slice(0, 1)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-white truncate">{row.influencerName}</p>
                              <p className="text-xs text-gray-500 truncate">
                                {row.influencerUsername ? `@${row.influencerUsername.replace(/^@/, '')}` : '—'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-top">
                          <span
                            className="inline-block text-xs font-semibold px-2.5 py-1 rounded-lg text-white"
                            style={{
                              backgroundColor: `hsl(${sectorHue(row.sector)} 50% 36%)`,
                            }}
                          >
                            {row.sector}
                          </span>
                          {row.promoCategoryLabel && (
                            <p className="text-[11px] text-gray-500 mt-1">{row.promoCategoryLabel}</p>
                          )}
                        </td>
                        <td className="p-4 align-top min-w-[220px]">
                          <p className="text-white font-medium line-clamp-2">{row.campaignTitle}</p>
                          <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
                            <Store className="h-3 w-3 shrink-0" />
                            {row.brandName}
                          </p>
                        </td>
                        <td className="p-4 text-right align-top">
                          <span className="text-xl font-bold text-emerald-400">${row.amountUsd.toFixed(2)}</span>
                          <p className="text-[11px] text-gray-500 mt-1">por venta</p>
                        </td>
                        <td className="p-4 align-top text-right">
                          <p className="text-gray-300">{row.bidHistoryCount} pasos</p>
                          {row.recentPujas.length > 0 && (
                            <p className="text-[11px] text-gray-500 mt-1">
                              último ${row.recentPujas[row.recentPujas.length - 1]?.amount.toFixed(2)}
                            </p>
                          )}
                        </td>
                        <td className="p-4 align-top min-w-[140px]">
                          <div className="flex flex-col gap-1.5">
                            <Link
                              to={appPath}
                              className="inline-flex items-center gap-1 text-xs font-medium text-violet-300 hover:text-violet-200"
                            >
                              <FileCode2 className="h-3.5 w-3.5 shrink-0" />
                              Ver contrato
                            </Link>
                            <a
                              href={scan}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white"
                              title={addr}
                            >
                              Polygonscan
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <span className="text-[10px] text-gray-600 font-mono truncate" title={addr}>
                              {shortenAddress(addr, 4)}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 align-top">
                          <Link
                            to={`/influencer/${encodeURIComponent(
                              (row.influencerUsername || '').replace(/^@/, '') || row.influencerId
                            )}`}
                            className="inline-flex p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
                            title="Ver perfil"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
