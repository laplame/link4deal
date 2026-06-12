import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Activity,
    CheckCircle2,
    Copy,
    ExternalLink,
    Radio,
    RefreshCw,
    Route,
    XCircle,
} from 'lucide-react';
import { CLARITY_PROJECT_ID, CLARITY_SCRIPT_SRC } from '../../config/clarity';
import { GA4_MEASUREMENT_ID } from '../../config/ga4';
import { GTM_ID, GTM_NOSCRIPT_SRC, GTM_SCRIPT_SRC } from '../../config/gtm';
import { isClarityAvailable, trackClarityPageView } from '../../utils/microsoftClarity';
import {
    KEY_ENTRY_ROUTES,
    getDataLayerSnapshot,
    getEntryAttribution,
    getRouteLog,
    isGtmScriptLoaded,
    pushDataLayer,
    trackVirtualPageView,
    type EntryAttribution,
    type RouteLogEntry,
} from '../../utils/googleTagManager';
import { getDownloadCount } from '../../services/appDownloads';
import AppDownloadMinimalCounter from './AppDownloadMinimalCounter';

function utmSummary(entry: EntryAttribution | null): string {
    if (!entry) return '—';
    const parts = [
        entry.utm_source && `source=${entry.utm_source}`,
        entry.utm_medium && `medium=${entry.utm_medium}`,
        entry.utm_campaign && `campaign=${entry.utm_campaign}`,
    ].filter(Boolean);
    return parts.length ? parts.join(' · ') : '(sin UTM en landing)';
}

export default function AdminGtmPanel() {
    const location = useLocation();
    const [gtmOk, setGtmOk] = useState(false);
    const [clarityOk, setClarityOk] = useState(false);
    const [entry, setEntry] = useState<EntryAttribution | null>(null);
    const [routeLog, setRouteLog] = useState<RouteLogEntry[]>([]);
    const [layerSize, setLayerSize] = useState(0);
    const [copied, setCopied] = useState(false);
    const [downloadCount, setDownloadCount] = useState<number | null>(null);
    const [downloadsLoading, setDownloadsLoading] = useState(true);

    const refresh = useCallback(() => {
        setGtmOk(isGtmScriptLoaded());
        setClarityOk(isClarityAvailable());
        setEntry(getEntryAttribution());
        setRouteLog(getRouteLog());
        setLayerSize(getDataLayerSnapshot().length);
    }, []);

    useEffect(() => {
        refresh();
        const t = window.setInterval(refresh, 2000);
        return () => window.clearInterval(t);
    }, [refresh, location.pathname, location.search]);

    useEffect(() => {
        let cancelled = false;
        setDownloadsLoading(true);
        getDownloadCount()
            .then(({ count }) => {
                if (!cancelled) setDownloadCount(count);
            })
            .catch(() => {
                if (!cancelled) setDownloadCount(0);
            })
            .finally(() => {
                if (!cancelled) setDownloadsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const snapshotJson = useMemo(
        () =>
            JSON.stringify(
                {
                    gtmId: GTM_ID,
                    gtmLoaded: gtmOk,
                    ga4MeasurementId: GA4_MEASUREMENT_ID,
                    ga4ViaGtm: true,
                    clarityProjectId: CLARITY_PROJECT_ID,
                    clarityLoaded: clarityOk,
                    current: {
                        path: location.pathname + location.search,
                        title: document.title,
                    },
                    entry,
                    routeLog: routeLog.slice(0, 15),
                    dataLayer: getDataLayerSnapshot().slice(-20),
                },
                null,
                2
            ),
        [gtmOk, clarityOk, entry, routeLog, location.pathname, location.search]
    );

    const ga4GtmNote = useMemo(() => {
        if (gtmOk) {
            return {
                tone: 'ok' as const,
                text: `GA4 (${GA4_MEASUREMENT_ID}) se gestiona solo desde GTM (${GTM_ID}). En el contenedor debe existir un tag «Google Analytics: GA4 Configuration» con ese ID, publicado. Las rutas SPA envían eventos al dataLayer (virtual_page_view). Sin gtag duplicado en el HTML.`,
            };
        }
        return {
            tone: 'warn' as const,
            text: `GTM no detectado. Sin el contenedor ${GTM_ID} no hay GA4 ni tags gestionados desde Tag Manager.`,
        };
    }, [gtmOk]);

    const sendTestEvent = () => {
        pushDataLayer({
            event: 'admin_gtm_test',
            page_path: location.pathname,
            triggered_by: 'admin_panel',
            at: new Date().toISOString(),
        });
        trackVirtualPageView(location.pathname, location.search, location.hash);
        trackClarityPageView(location.pathname, location.search, location.hash);
        refresh();
    };

    const copySnapshot = async () => {
        try {
            await navigator.clipboard.writeText(snapshotJson);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            /* ignore */
        }
    };

    return (
        <div id="gtm" className="mb-8 rounded-xl border border-slate-200 bg-white shadow-md overflow-hidden scroll-mt-24">
            <div className="bg-gradient-to-r from-sky-600 to-indigo-700 px-4 sm:px-6 py-4 text-white">
                <div className="flex flex-col gap-3 sm:gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                            <Radio className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                            <div className="min-w-0">
                                <h2 className="text-base sm:text-lg font-semibold leading-tight">
                                    Analítica web
                                </h2>
                                <p className="text-xs sm:text-sm text-sky-100 mt-0.5">
                                    GTM (GA4 y tags) · Clarity — UTMs y rutas SPA
                                </p>
                            </div>
                            <AppDownloadMinimalCounter
                                count={downloadCount}
                                loading={downloadsLoading}
                                className="self-end sm:self-start shadow-sm"
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pl-[3.25rem] sm:pl-14">
                        {gtmOk ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/25 px-3 py-1 text-sm font-medium">
                                <CheckCircle2 className="w-4 h-4" />
                                GTM activo
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/30 px-3 py-1 text-sm font-medium">
                                <XCircle className="w-4 h-4" />
                                GTM pendiente
                            </span>
                        )}
                        {gtmOk ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/25 px-3 py-1 text-sm font-medium">
                                <CheckCircle2 className="w-4 h-4" />
                                GA4 vía GTM
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/30 px-3 py-1 text-sm font-medium">
                                <XCircle className="w-4 h-4" />
                                GA4 vía GTM (GTM off)
                            </span>
                        )}
                        {clarityOk ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/25 px-3 py-1 text-sm font-medium">
                                <CheckCircle2 className="w-4 h-4" />
                                Clarity activo
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/30 px-3 py-1 text-sm font-medium">
                                <XCircle className="w-4 h-4" />
                                Clarity off
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">GTM</p>
                        <p className="font-mono font-semibold text-slate-900">{GTM_ID}</p>
                        <p className="text-xs text-slate-500 mt-2 break-all">{GTM_SCRIPT_SRC}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">GA4 (en GTM)</p>
                        <p className="font-mono font-semibold text-slate-900">{GA4_MEASUREMENT_ID}</p>
                        <p className="text-xs text-slate-500 mt-2">
                            Tag «GA4 Configuration» dentro de {GTM_ID}
                        </p>
                        <p
                            className={`text-xs mt-2 leading-relaxed ${
                                ga4GtmNote.tone === 'warn'
                                    ? 'text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-2'
                                    : 'text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md p-2'
                            }`}
                        >
                            {ga4GtmNote.text}
                        </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Microsoft Clarity</p>
                        <p className="font-mono font-semibold text-slate-900">{CLARITY_PROJECT_ID}</p>
                        <p className="text-xs text-slate-500 mt-2 break-all">{CLARITY_SCRIPT_SRC}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Ruta actual</p>
                        <p className="font-mono text-slate-900 break-all">
                            {location.pathname}
                            {location.search}
                        </p>
                        <p className="text-xs text-slate-600 mt-1 truncate">{document.title}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">dataLayer</p>
                        <p className="text-2xl font-bold text-indigo-600">{layerSize}</p>
                        <p className="text-xs text-slate-500">eventos en cola (sesión)</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
                        <h3 className="text-sm font-semibold text-emerald-900 flex items-center gap-2 mb-2">
                            <Activity className="w-4 h-4" />
                            Entrada de la sesión (landing inteligente)
                        </h3>
                        {entry ? (
                            <dl className="text-sm space-y-1.5 text-slate-700">
                                <div>
                                    <dt className="text-xs text-slate-500">Landing</dt>
                                    <dd className="font-mono break-all">{entry.landingPath}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-slate-500">Referrer</dt>
                                    <dd className="break-all">{entry.referrer}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-slate-500">UTM / ads</dt>
                                    <dd>{utmSummary(entry)}</dd>
                                </div>
                                {(entry.gclid || entry.fbclid) && (
                                    <div>
                                        <dt className="text-xs text-slate-500">Click IDs</dt>
                                        <dd className="font-mono text-xs">
                                            {entry.gclid && `gclid=${entry.gclid} `}
                                            {entry.fbclid && `fbclid=${entry.fbclid}`}
                                        </dd>
                                    </div>
                                )}
                                <div>
                                    <dt className="text-xs text-slate-500">Capturado</dt>
                                    <dd>{new Date(entry.capturedAt).toLocaleString('es-MX')}</dd>
                                </div>
                            </dl>
                        ) : (
                            <p className="text-sm text-slate-600">
                                Navega con ?utm_source=test en la URL de entrada para probar atribución.
                            </p>
                        )}
                    </div>

                    <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-4">
                        <h3 className="text-sm font-semibold text-indigo-900 flex items-center gap-2 mb-2">
                            <Route className="w-4 h-4" />
                            Historial de rutas (virtual_page_view)
                        </h3>
                        {routeLog.length === 0 ? (
                            <p className="text-sm text-slate-600">Aún no hay cambios de ruta en esta sesión.</p>
                        ) : (
                            <ul className="text-xs font-mono space-y-1 max-h-40 overflow-auto">
                                {routeLog.map((row, i) => (
                                    <li key={`${row.at}-${i}`} className="text-slate-700 border-b border-indigo-100 pb-1">
                                        <span className="text-slate-400">{row.at.slice(11, 19)}</span>{' '}
                                        {row.page_path}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-semibold text-slate-800 mb-2">Rutas clave para probar entradas</h3>
                    <div className="flex flex-wrap gap-2">
                        {KEY_ENTRY_ROUTES.map((r) => (
                            <Link
                                key={r.path}
                                to={r.path}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
                            >
                                {r.label}
                                <span className="text-slate-400 font-mono text-xs">{r.path}</span>
                            </Link>
                        ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        Prueba:{' '}
                        <code className="bg-slate-100 px-1 rounded">
                            /quick-promotion?utm_source=admin&utm_medium=test
                        </code>{' '}
                        en ventana privada para ver landing nueva.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={sendTestEvent}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Enviar evento de prueba
                    </button>
                    <button
                        type="button"
                        onClick={copySnapshot}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
                    >
                        <Copy className="w-4 h-4" />
                        {copied ? 'Copiado' : 'Copiar snapshot JSON'}
                    </button>
                    <a
                        href="https://tagmanager.google.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
                    >
                        Abrir GTM ({GTM_ID})
                        <ExternalLink className="w-4 h-4" />
                    </a>
                    <a
                        href={`https://clarity.microsoft.com/projects/view/${CLARITY_PROJECT_ID}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
                    >
                        Abrir Clarity
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>

                <details className="text-xs">
                    <summary className="cursor-pointer text-slate-500 hover:text-slate-700">
                        Snippets instalados (head + body)
                    </summary>
                    <pre className="mt-2 p-3 bg-slate-900 text-slate-300 rounded-lg overflow-auto max-h-32">
                        {`<!-- head: ${GTM_SCRIPT_SRC} -->\n<!-- body: ${GTM_NOSCRIPT_SRC} -->`}
                    </pre>
                </details>
            </div>
        </div>
    );
}
