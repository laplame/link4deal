import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    BarChart3,
    Loader2,
    RefreshCw,
    Store,
    User,
    Ticket,
    Tag,
    HelpCircle,
    TrendingUp,
    Users,
    MousePointerClick,
} from 'lucide-react';
import { apiUrl } from '../../utils/apiUrl';

export interface PublicDemandData {
    periodDays: number;
    since: string;
    totalVisits: number;
    entryVisits: number;
    uniqueSessions: number;
    entriesPerSession: number;
    influencerSlug: string;
    publicProfilePath: string;
    channelBreakdown: {
        channel: string;
        label: string;
        views: number;
        entries: number;
        uniqueSessions: number;
    }[];
    promoDemand: {
        promotionId: string;
        title: string | null;
        brand: string | null;
        views: number;
        entries: number;
    }[];
    topEntryPaths: { path: string; count: number }[];
    topPages: { path: string; count: number }[];
    utmBreakdown: {
        utmSource: string;
        utmMedium: string;
        utmCampaign: string;
        entries: number;
    }[];
}

interface Props {
    publicSlug: string;
    influencerName: string;
}

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
    profile: <User className="w-4 h-4" />,
    store: <Store className="w-4 h-4" />,
    promo: <Tag className="w-4 h-4" />,
    coupon: <Ticket className="w-4 h-4" />,
    faq: <HelpCircle className="w-4 h-4" />,
};

const CHANNEL_COLORS: Record<string, string> = {
    profile: 'bg-violet-500',
    store: 'bg-emerald-500',
    promo: 'bg-amber-500',
    coupon: 'bg-pink-500',
    faq: 'bg-sky-500',
};

function maxCount(rows: { count?: number; entries?: number; views?: number }[], key: 'count' | 'entries' | 'views') {
    return Math.max(1, ...rows.map((r) => Number(r[key]) || 0));
}

export default function InfluencerPublicDemandPanel({ publicSlug, influencerName }: Props) {
    const [days, setDays] = useState(30);
    const [data, setData] = useState<PublicDemandData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const slug = publicSlug.trim();

    const load = useCallback(async () => {
        if (!slug) {
            setError('Perfil sin slug público');
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(
                apiUrl(`/api/influencers/by-slug/${encodeURIComponent(slug)}/demand-stats?days=${days}`),
            );
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(json.message || `Error ${res.status}`);
            }
            setData(json.data as PublicDemandData);
        } catch (e) {
            setData(null);
            setError(e instanceof Error ? e.message : 'No se pudo cargar la demanda');
        } finally {
            setLoading(false);
        }
    }, [slug, days]);

    useEffect(() => {
        void load();
    }, [load]);

    const channelMax = useMemo(
        () => (data ? maxCount(data.channelBreakdown, 'entries') : 1),
        [data],
    );

    const demandLabel = useMemo(() => {
        if (!data || data.entryVisits === 0) return 'Sin señales aún';
        if (data.entryVisits >= 50) return 'Demanda alta';
        if (data.entryVisits >= 15) return 'Demanda media';
        return 'Demanda en crecimiento';
    }, [data]);

    return (
        <section
            className="bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden"
            aria-labelledby="influencer-demand-heading"
        >
            <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 px-6 py-5 text-white">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 id="influencer-demand-heading" className="text-xl font-semibold flex items-center gap-2">
                            <BarChart3 className="w-6 h-6" aria-hidden />
                            Interés y demanda
                        </h2>
                        <p className="text-sm text-indigo-100 mt-1 max-w-2xl">
                            Señales públicas de tráfico hacia los enlaces de {influencerName}: entradas, sesiones y
                            canales más usados. Útil para marcas y colaboraciones.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={days}
                            onChange={(e) => setDays(Number(e.target.value))}
                            className="text-sm border border-white/30 rounded-lg px-3 py-2 bg-white/10 text-white"
                            aria-label="Periodo de análisis"
                        >
                            <option value={7} className="text-gray-900">
                                7 días
                            </option>
                            <option value={30} className="text-gray-900">
                                30 días
                            </option>
                            <option value={90} className="text-gray-900">
                                90 días
                            </option>
                        </select>
                        <button
                            type="button"
                            onClick={() => void load()}
                            disabled={loading}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-sm disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Actualizar
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {loading && (
                    <div className="flex items-center justify-center gap-2 py-12 text-gray-600">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                        Cargando métricas…
                    </div>
                )}

                {error && !loading && (
                    <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
                        {error}
                    </p>
                )}

                {data && !loading && (
                    <div className="space-y-8">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 text-indigo-800 px-3 py-1 text-sm font-medium border border-indigo-100">
                                <TrendingUp className="w-4 h-4" />
                                {demandLabel}
                            </span>
                            <span className="text-xs text-gray-500">
                                Desde {new Date(data.since).toLocaleDateString('es-MX', { dateStyle: 'medium' })}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                                    <MousePointerClick className="w-3.5 h-3.5" />
                                    Páginas vistas
                                </p>
                                <p className="text-3xl font-bold text-gray-900 tabular-nums mt-1">
                                    {data.totalVisits.toLocaleString('es-MX')}
                                </p>
                            </div>
                            <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
                                <p className="text-xs text-indigo-700 uppercase tracking-wide">
                                    Entradas por sus enlaces
                                </p>
                                <p className="text-3xl font-bold text-indigo-800 tabular-nums mt-1">
                                    {data.entryVisits.toLocaleString('es-MX')}
                                </p>
                            </div>
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5" />
                                    Sesiones estimadas
                                </p>
                                <p className="text-3xl font-bold text-gray-900 tabular-nums mt-1">
                                    {data.uniqueSessions.toLocaleString('es-MX')}
                                </p>
                                {data.uniqueSessions > 0 && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        ~{data.entriesPerSession} entradas / sesión
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-gray-800 mb-3">Demanda por canal de enlace</h3>
                            <div className="space-y-3">
                                {data.channelBreakdown.map((row) => {
                                    const pct = Math.round((row.entries / channelMax) * 100);
                                    const barColor = CHANNEL_COLORS[row.channel] || 'bg-gray-400';
                                    return (
                                        <div key={row.channel}>
                                            <div className="flex items-center justify-between text-sm mb-1 gap-2">
                                                <span className="flex items-center gap-2 font-medium text-gray-800">
                                                    {CHANNEL_ICONS[row.channel]}
                                                    {row.label}
                                                </span>
                                                <span className="tabular-nums text-gray-600 shrink-0">
                                                    {row.entries} entradas · {row.views} vistas ·{' '}
                                                    {row.uniqueSessions} ses.
                                                </span>
                                            </div>
                                            <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${barColor} transition-all`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {data.promoDemand.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-800 mb-2">
                                    Promos y cupones con más interés
                                </h3>
                                <div className="overflow-x-auto rounded-lg border border-gray-200">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-gray-50 text-gray-600 text-xs">
                                            <tr>
                                                <th className="px-3 py-2 text-left">Oferta</th>
                                                <th className="px-3 py-2 text-right">Entradas</th>
                                                <th className="px-3 py-2 text-right">Vistas</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {data.promoDemand.map((row) => (
                                                <tr key={row.promotionId}>
                                                    <td className="px-3 py-2">
                                                        <p className="font-medium text-gray-900">
                                                            {row.title || 'Promoción'}
                                                        </p>
                                                        {row.brand && (
                                                            <p className="text-xs text-gray-500">{row.brand}</p>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-semibold text-indigo-700 tabular-nums">
                                                        {row.entries}
                                                    </td>
                                                    <td className="px-3 py-2 text-right tabular-nums text-gray-700">
                                                        {row.views}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {data.utmBreakdown.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-800 mb-2">Origen del tráfico (UTM)</h3>
                                <ul className="text-sm space-y-2">
                                    {data.utmBreakdown.map((u, i) => (
                                        <li
                                            key={`${u.utmSource}-${u.utmMedium}-${i}`}
                                            className="flex justify-between gap-2 border-b border-gray-100 pb-1"
                                        >
                                            <span className="text-gray-700">
                                                {u.utmSource} / {u.utmMedium}
                                                {u.utmCampaign !== '—' && (
                                                    <span className="text-gray-500"> · {u.utmCampaign}</span>
                                                )}
                                            </span>
                                            <span className="font-semibold text-indigo-700 tabular-nums shrink-0">
                                                {u.entries}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-800 mb-2">Enlaces de entrada más usados</h3>
                                {data.topEntryPaths.length === 0 ? (
                                    <p className="text-sm text-gray-500">Aún no hay entradas registradas.</p>
                                ) : (
                                    <ul className="text-sm space-y-2 max-h-48 overflow-auto">
                                        {data.topEntryPaths.map((row) => (
                                            <li
                                                key={row.path}
                                                className="flex justify-between gap-2 border-b border-gray-100 pb-1"
                                            >
                                                <code className="text-xs text-gray-700 break-all flex-1">
                                                    {row.path}
                                                </code>
                                                <span className="font-semibold text-indigo-700 tabular-nums shrink-0">
                                                    {row.count}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-800 mb-2">Páginas más visitadas</h3>
                                {data.topPages.length === 0 ? (
                                    <p className="text-sm text-gray-500">Sin navegación adicional.</p>
                                ) : (
                                    <ul className="text-sm space-y-2 max-h-48 overflow-auto">
                                        {data.topPages.map((row) => (
                                            <li
                                                key={row.path}
                                                className="flex justify-between gap-2 border-b border-gray-100 pb-1"
                                            >
                                                <code className="text-xs text-gray-700 break-all flex-1">
                                                    {row.path}
                                                </code>
                                                <span className="font-medium text-gray-900 tabular-nums shrink-0">
                                                    {row.count}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {data.entryVisits === 0 && data.totalVisits === 0 && (
                            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                                Cuando la audiencia use el perfil, tienda o links de promo de este influencer, las
                                métricas aparecerán aquí de forma pública.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
