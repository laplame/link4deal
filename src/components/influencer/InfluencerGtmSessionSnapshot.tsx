import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Activity,
    CheckCircle2,
    ChevronDown,
    Copy,
    ExternalLink,
    Radio,
    Route,
    XCircle,
} from 'lucide-react';
import { GTM_ID } from '../../config/gtm';
import {
    buildInfluencerGtmSnapshot,
    utmSummaryFromEntry,
} from '../../utils/influencerGtmSnapshot';
import { isExcludedAnalyticsHost } from '../../utils/isExcludedAnalyticsHost';

interface Props {
    influencerId: string;
    influencerName: string;
    publicSlug: string;
}

export default function InfluencerGtmSessionSnapshot({
    influencerId,
    influencerName,
    publicSlug,
}: Props) {
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const [gtmOk, setGtmOk] = useState(false);
    const [copied, setCopied] = useState(false);
    const [tick, setTick] = useState(0);

    const slug = publicSlug.trim();
    const profilePath = `/influencer/${slug}`;
    const excluded = isExcludedAnalyticsHost();

    const refresh = useCallback(() => {
        const snap = buildInfluencerGtmSnapshot(influencerId, slug);
        setGtmOk(snap.gtmLoaded);
        setTick((n) => n + 1);
    }, [influencerId, slug]);

    useEffect(() => {
        if (!open) return;
        refresh();
        const t = window.setInterval(refresh, 2500);
        return () => window.clearInterval(t);
    }, [open, refresh, location.pathname, location.search]);

    const snapshot = useMemo(
        () => buildInfluencerGtmSnapshot(influencerId, slug),
        [influencerId, slug, tick, location.pathname, location.search],
    );

    const snapshotJson = useMemo(() => JSON.stringify(snapshot, null, 2), [snapshot]);

    const copySnapshot = async () => {
        try {
            await navigator.clipboard.writeText(snapshotJson);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            /* ignore */
        }
    };

    const testProfileUrl = useMemo(() => {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        return `${origin}${profilePath}?utm_source=perfil_test&utm_medium=influencer`;
    }, [profilePath]);

    return (
        <section className="bg-white rounded-xl shadow-sm border border-sky-200/80 overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-left hover:bg-sky-50/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700">
                        <Radio className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Snapshot GTM (esta sesión)</h2>
                        <p className="text-sm text-gray-600">
                            Lo que Tag Manager recibe ahora en tu navegador — no sustituye el tráfico histórico de arriba.
                        </p>
                    </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                    {open ? 'Ocultar' : 'Ver detalle'}
                    <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                </span>
            </button>

            {open && (
                <div className="px-6 pb-6 pt-0 border-t border-sky-100 space-y-5">
                    {excluded && (
                        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                            Estás en <strong>localhost</strong>: GTM y las visitas al servidor están desactivadas aquí.
                            Abre tu perfil en producción (
                            <code className="text-xs">link4deal.com{profilePath}</code>) o usa ventana privada con
                            UTMs para ver datos reales.
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                        {gtmOk ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-sm font-medium">
                                <CheckCircle2 className="w-4 h-4" />
                                GTM cargado ({GTM_ID})
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-900 px-3 py-1 text-sm font-medium">
                                <XCircle className="w-4 h-4" />
                                GTM no detectado (bloqueador o aún cargando)
                            </span>
                        )}
                        {snapshot.sessionMatchesProfile ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 text-indigo-800 px-3 py-1 text-sm font-medium">
                                Sesión atribuida a {influencerName}
                            </span>
                        ) : (
                            <span className="text-sm text-gray-500">
                                Entra por tu link de perfil para atribuir esta sesión.
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Tu perfil público</p>
                            <code className="text-xs text-gray-800 break-all block">{profilePath}</code>
                            <a
                                href={testProfileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                            >
                                Probar con UTMs
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Ruta actual</p>
                            <code className="text-xs text-gray-800 break-all block">
                                {location.pathname}
                                {location.search}
                            </code>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Eventos dataLayer</p>
                            <p className="text-2xl font-bold text-indigo-600 tabular-nums">
                                {snapshot.dataLayerRecent.length}
                            </p>
                            <p className="text-xs text-gray-500">
                                {snapshot.dataLayerInfluencerEvents.length} con tu influencer en esta sesión
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4">
                            <h3 className="text-sm font-semibold text-emerald-900 flex items-center gap-2 mb-2">
                                <Activity className="w-4 h-4" />
                                Landing GTM (primera página de la sesión)
                            </h3>
                            {snapshot.entryAttribution ? (
                                <dl className="text-sm space-y-1.5 text-gray-700">
                                    <div>
                                        <dt className="text-xs text-gray-500">Landing</dt>
                                        <dd className="font-mono text-xs break-all">
                                            {snapshot.entryAttribution.landingPath}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-gray-500">Referrer</dt>
                                        <dd className="text-xs break-all">{snapshot.entryAttribution.referrer}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-gray-500">UTM</dt>
                                        <dd>{utmSummaryFromEntry(snapshot.entryAttribution)}</dd>
                                    </div>
                                </dl>
                            ) : (
                                <p className="text-sm text-gray-600">
                                    Sin captura aún. Abre tu perfil en una pestaña nueva (ideal con UTMs).
                                </p>
                            )}
                        </div>

                        <div className="rounded-lg border border-violet-200 bg-violet-50/40 p-4">
                            <h3 className="text-sm font-semibold text-violet-900 flex items-center gap-2 mb-2">
                                <Route className="w-4 h-4" />
                                Atribución influencer (sesión)
                            </h3>
                            {snapshot.influencerSession ? (
                                <dl className="text-sm space-y-1.5 text-gray-700">
                                    <div>
                                        <dt className="text-xs text-gray-500">Entrada</dt>
                                        <dd className="font-mono text-xs break-all">
                                            {snapshot.influencerSession.entryPath}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-gray-500">Tipo</dt>
                                        <dd>{snapshot.influencerSession.entryType}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-gray-500">Slug</dt>
                                        <dd className="font-mono text-xs">{snapshot.influencerSession.influencerSlug}</dd>
                                    </div>
                                </dl>
                            ) : (
                                <p className="text-sm text-gray-600">
                                    Visita <code className="bg-white/80 px-1 rounded">{profilePath}</code> para
                                    enlazar esta sesión a tu cuenta.
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-2">
                            Rutas SPA enviadas a GTM (virtual_page_view)
                        </h3>
                        {snapshot.routeLog.length === 0 ? (
                            <p className="text-sm text-gray-500">Sin cambios de ruta en esta sesión.</p>
                        ) : (
                            <ul className="text-xs font-mono max-h-36 overflow-auto space-y-1 border border-gray-100 rounded-lg p-3 bg-gray-50">
                                {snapshot.routeLog.map((row, i) => (
                                    <li key={`${row.at}-${i}`} className="text-gray-700 border-b border-gray-100 pb-1">
                                        <span className="text-gray-400">{row.at.slice(11, 19)}</span> {row.page_path}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {snapshot.dataLayerInfluencerEvents.length > 0 && (
                        <details className="text-xs">
                            <summary className="cursor-pointer text-gray-600 hover:text-gray-900 font-medium">
                                Últimos eventos dataLayer con tu influencer ({snapshot.dataLayerInfluencerEvents.length})
                            </summary>
                            <pre className="mt-2 p-3 bg-slate-900 text-slate-300 rounded-lg overflow-auto max-h-48">
                                {JSON.stringify(snapshot.dataLayerInfluencerEvents, null, 2)}
                            </pre>
                        </details>
                    )}

                    <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => void copySnapshot()}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            <Copy className="w-4 h-4" />
                            {copied ? 'Copiado' : 'Copiar snapshot JSON'}
                        </button>
                        <a
                            href="https://tagmanager.google.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Abrir Google Tag Manager
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>

                    <p className="text-xs text-gray-500">
                        Métricas agregadas (visitas de todos tus seguidores) están en «Tráfico por enlace» y en Google
                        Analytics si el contenedor {GTM_ID} publica allí. Este bloque solo refleja tu navegador actual.
                    </p>
                </div>
            )}
        </section>
    );
}
