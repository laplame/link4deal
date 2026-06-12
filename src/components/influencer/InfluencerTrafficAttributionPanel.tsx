import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Link2,
    Route,
    Users,
    Loader2,
    RefreshCw,
    ExternalLink,
    Store,
    User,
    Ticket,
    Tag,
    HelpCircle,
    Copy,
    Check,
} from 'lucide-react';
import { apiUrl } from '../../utils/apiUrl';
import { getAuthToken } from '../../context/AuthContext';
import { buildInfluencerChannelLinks } from '../../utils/influencerChannelLinks';

export interface ChannelBreakdownRow {
    channel: string;
    label: string;
    examplePath: string;
    views: number;
    entries: number;
    uniqueSessions: number;
}

export interface PromoLinkBreakdownRow {
    promotionId: string;
    title: string | null;
    brand: string | null;
    views: number;
    entries: number;
    path: string;
}

export interface TrafficStatsData {
    periodDays: number;
    since: string;
    totalVisits: number;
    entryVisits: number;
    uniqueSessions: number;
    influencerSlug: string;
    publicProfileUrl: string;
    pageBreakdown: { pagePath: string; count: number }[];
    entryLinkBreakdown: { entryPath: string; count: number }[];
    channelBreakdown: ChannelBreakdownRow[];
    promoLinkBreakdown: PromoLinkBreakdownRow[];
    recentVisits: {
        visitId: string;
        at: string;
        isEntry: boolean;
        entryType: string;
        visitChannel?: string;
        entryPath: string;
        pagePath: string;
        pageTitle: string;
        promoId?: string | null;
        utmSource: string;
        utmMedium: string;
        utmCampaign: string;
        sessionSuffix: string;
    }[];
}

interface Props {
    influencerId: string;
    influencerName: string;
    publicSlug?: string;
}

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
    profile: <User className="w-5 h-5" />,
    store: <Store className="w-5 h-5" />,
    promo: <Tag className="w-5 h-5" />,
    coupon: <Ticket className="w-5 h-5" />,
    faq: <HelpCircle className="w-5 h-5" />,
};

const CHANNEL_STYLES: Record<string, string> = {
    profile: 'from-violet-500 to-purple-600',
    store: 'from-emerald-500 to-teal-600',
    promo: 'from-amber-500 to-orange-600',
    coupon: 'from-pink-500 to-rose-600',
    faq: 'from-sky-500 to-blue-600',
};

const ENTRY_TYPE_LABELS: Record<string, string> = {
    profile: 'Perfil',
    store: 'Tienda',
    promo: 'Promo',
    coupon: 'Cupón',
    faq: 'FAQ',
    edit: 'Edición',
    auth: 'Auth',
    other: 'Otro',
};

export default function InfluencerTrafficAttributionPanel({
    influencerId,
    influencerName,
    publicSlug,
}: Props) {
    const [days, setDays] = useState(30);
    const [stats, setStats] = useState<TrafficStatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copiedPath, setCopiedPath] = useState<string | null>(null);

    const slug = publicSlug || stats?.influencerSlug || '';
    const channelLinks = useMemo(
        () => buildInfluencerChannelLinks(slug, influencerId),
        [slug, influencerId],
    );

    const copyPath = async (path: string) => {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const full = path.includes('://') ? path : `${origin}${path}`;
        try {
            await navigator.clipboard.writeText(full);
            setCopiedPath(path);
            window.setTimeout(() => setCopiedPath(null), 2000);
        } catch {
            /* ignore */
        }
    };

    const load = useCallback(async () => {
        const token = getAuthToken();
        if (!token) {
            setError('Inicia sesión para ver el tráfico atribuido.');
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(apiUrl(`/api/influencers/${influencerId}/traffic-stats?days=${days}`), {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(json.message || `Error ${res.status}`);
            }
            setStats(json.data as TrafficStatsData);
        } catch (e) {
            setStats(null);
            setError(e instanceof Error ? e.message : 'No se pudieron cargar las visitas');
        } finally {
            setLoading(false);
        }
    }, [influencerId, days]);

    useEffect(() => {
        void load();
    }, [load]);

    const channelRows = stats?.channelBreakdown?.length
        ? stats.channelBreakdown
        : channelLinks.map((l) => ({
              channel: l.channel,
              label: l.label,
              examplePath: l.path,
              views: 0,
              entries: 0,
              uniqueSessions: 0,
          }));

    return (
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Route className="w-5 h-5 text-indigo-600" />
                        Tráfico por enlace
                    </h2>
                    <p className="text-sm text-gray-600 mt-1 max-w-2xl">
                        Visitas atribuidas a {influencerName} según el enlace por el que entraron: perfil, tienda,
                        promos/cupones o FAQ. Las vistas en otras páginas del sitio siguen contando para el mismo
                        influencer de la sesión.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
                    >
                        <option value={7}>7 días</option>
                        <option value={30}>30 días</option>
                        <option value={90}>90 días</option>
                    </select>
                    <button
                        type="button"
                        onClick={() => void load()}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </button>
                </div>
            </div>

            {loading && (
                <div className="flex items-center justify-center gap-2 py-10 text-gray-600">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                    Cargando visitas…
                </div>
            )}

            {error && !loading && (
                <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">{error}</p>
            )}

            {stats && !loading && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Páginas vistas</p>
                            <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.totalVisits}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Entradas por tu link</p>
                            <p className="text-2xl font-bold text-indigo-700 tabular-nums">{stats.entryVisits}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
                            <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                Sesiones
                            </p>
                            <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.uniqueSessions}</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <Link2 className="w-4 h-4 text-indigo-500" />
                            Tráfico por tipo de enlace
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {channelRows.map((row) => {
                                const linkDef = channelLinks.find((l) => l.channel === row.channel);
                                const grad =
                                    CHANNEL_STYLES[row.channel] || 'from-gray-500 to-gray-600';
                                return (
                                    <div
                                        key={row.channel}
                                        className="rounded-xl border border-gray-200 overflow-hidden flex flex-col"
                                    >
                                        <div
                                            className={`bg-gradient-to-r ${grad} px-4 py-3 text-white flex items-center gap-2`}
                                        >
                                            {CHANNEL_ICONS[row.channel]}
                                            <span className="font-semibold">{row.label}</span>
                                        </div>
                                        <div className="p-4 flex-1 flex flex-col gap-3">
                                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                                <div>
                                                    <p className="text-gray-500">Entradas</p>
                                                    <p className="text-lg font-bold text-indigo-700 tabular-nums">
                                                        {row.entries}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Vistas</p>
                                                    <p className="text-lg font-bold text-gray-900 tabular-nums">
                                                        {row.views}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Sesiones</p>
                                                    <p className="text-lg font-bold text-gray-700 tabular-nums">
                                                        {row.uniqueSessions}
                                                    </p>
                                                </div>
                                            </div>
                                            <code className="text-[10px] text-gray-600 break-all bg-gray-50 rounded px-2 py-1.5 block">
                                                {row.examplePath || linkDef?.path}
                                            </code>
                                            {linkDef?.description && (
                                                <p className="text-xs text-gray-500">{linkDef.description}</p>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    copyPath(row.examplePath || linkDef?.path || '')
                                                }
                                                className="mt-auto inline-flex items-center justify-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                                            >
                                                {copiedPath === (row.examplePath || linkDef?.path) ? (
                                                    <>
                                                        <Check className="w-3.5 h-3.5" />
                                                        Copiado
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-3.5 h-3.5" />
                                                        Copiar enlace ejemplo
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {stats.promoLinkBreakdown.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                <Tag className="w-4 h-4 text-amber-500" />
                                Tráfico por promo / cupón (link único)
                            </h3>
                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-600 text-xs">
                                        <tr>
                                            <th className="px-3 py-2 text-left">Promoción</th>
                                            <th className="px-3 py-2 text-left">URL</th>
                                            <th className="px-3 py-2 text-right">Entradas</th>
                                            <th className="px-3 py-2 text-right">Vistas</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {stats.promoLinkBreakdown.map((row) => (
                                            <tr key={row.promotionId}>
                                                <td className="px-3 py-2">
                                                    <p className="font-medium text-gray-900">
                                                        {row.title || 'Sin título'}
                                                    </p>
                                                    {row.brand && (
                                                        <p className="text-xs text-gray-500">{row.brand}</p>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <code className="text-xs text-gray-700 break-all">{row.path}</code>
                                                </td>
                                                <td className="px-3 py-2 text-right tabular-nums font-medium text-indigo-700">
                                                    {row.entries}
                                                </td>
                                                <td className="px-3 py-2 text-right tabular-nums">{row.views}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-800 mb-2">URLs de entrada exactas</h3>
                            {stats.entryLinkBreakdown.length === 0 ? (
                                <p className="text-sm text-gray-500">Sin entradas aún.</p>
                            ) : (
                                <ul className="text-sm space-y-2 max-h-52 overflow-auto">
                                    {stats.entryLinkBreakdown.map((row) => (
                                        <li
                                            key={row.entryPath}
                                            className="flex justify-between gap-2 border-b border-gray-100 pb-1"
                                        >
                                            <code className="text-xs text-gray-700 break-all flex-1">
                                                {row.entryPath}
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
                            <h3 className="text-sm font-semibold text-gray-800 mb-2">Otras páginas vistas (sesión)</h3>
                            {stats.pageBreakdown.length === 0 ? (
                                <p className="text-sm text-gray-500">Sin navegación adicional.</p>
                            ) : (
                                <ul className="text-sm space-y-2 max-h-52 overflow-auto">
                                    {stats.pageBreakdown.map((row) => (
                                        <li
                                            key={row.pagePath}
                                            className="flex justify-between gap-2 border-b border-gray-100 pb-1"
                                        >
                                            <code className="text-xs text-gray-700 break-all flex-1">
                                                {row.pagePath}
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

                    <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-2">Últimos accesos</h3>
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="min-w-full text-xs">
                                <thead className="bg-gray-50 text-gray-600">
                                    <tr>
                                        <th className="px-3 py-2 text-left">Hora</th>
                                        <th className="px-3 py-2 text-left">Canal</th>
                                        <th className="px-3 py-2 text-left">Entrada</th>
                                        <th className="px-3 py-2 text-left">Página</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {stats.recentVisits.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
                                                Comparte tu tienda o links de promo para ver datos aquí.
                                            </td>
                                        </tr>
                                    ) : (
                                        stats.recentVisits.map((v) => (
                                            <tr key={v.visitId}>
                                                <td className="px-3 py-2 whitespace-nowrap text-gray-600">
                                                    {new Date(v.at).toLocaleString('es-MX', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-700">
                                                        {ENTRY_TYPE_LABELS[v.visitChannel || v.entryType] ||
                                                            v.entryType}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2">
                                                    {v.isEntry && (
                                                        <span className="text-[10px] text-indigo-600 font-medium block mb-0.5">
                                                            ENTRADA
                                                        </span>
                                                    )}
                                                    <code className="text-gray-700 break-all">{v.entryPath}</code>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <code className="text-gray-800 break-all">{v.pagePath}</code>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <p className="text-xs text-gray-500 flex items-center gap-1">
                        <ExternalLink className="w-3.5 h-3.5" />
                        Cupones en <code>/coupon/…?ref={influencerId}</code> se atribuyen a este perfil.
                    </p>
                </div>
            )}
        </section>
    );
}
