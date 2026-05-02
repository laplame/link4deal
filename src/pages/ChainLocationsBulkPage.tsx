import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ClipboardCopy, Loader2, MapPin, Sparkles, Library } from 'lucide-react';

type ParsedItem = { branchName: string; address: string; phone?: string };

type GeocodedBranch = {
    branchName: string;
    address: string;
    city: string;
    state: string;
    country: string;
    coordinates: { latitude: number; longitude: number };
    mapsUrl: string;
};

const STORAGE_KEY = 'link4deal_chain_import';

function slugFromBrand(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 48);
}

export default function ChainLocationsBulkPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const returnTo = searchParams.get('returnTo') || '/create-promotion';

    const [pasteText, setPasteText] = useState('');
    const [country, setCountry] = useState('México');
    const [chainBrandName, setChainBrandName] = useState('');
    const [catalogSlug, setCatalogSlug] = useState('');
    const [matchNamesInput, setMatchNamesInput] = useState('');
    const [presetWriteSecret, setPresetWriteSecret] = useState('');

    const [parsed, setParsed] = useState<ParsedItem[]>([]);
    const [geocoded, setGeocoded] = useState<GeocodedBranch[]>([]);
    const [errors, setErrors] = useState<Array<{ index: number; branchName: string; address: string; reason: string }>>(
        []
    );

    const [parseLoading, setParseLoading] = useState(false);
    const [geocodeLoading, setGeocodeLoading] = useState(false);
    const [pageError, setPageError] = useState<string | null>(null);
    const [copyDone, setCopyDone] = useState(false);
    const [saveBrandLoading, setSaveBrandLoading] = useState(false);
    const [saveBrandMessage, setSaveBrandMessage] = useState<string | null>(null);

    const handleParse = async () => {
        setPageError(null);
        setParseLoading(true);
        setGeocoded([]);
        setErrors([]);
        try {
            const res = await fetch('/api/geo/parse-store-paste', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: pasteText })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message || 'No se pudo analizar el texto');
            setParsed(data.items || []);
        } catch (e) {
            setPageError(e instanceof Error ? e.message : 'Error al parsear');
        } finally {
            setParseLoading(false);
        }
    };

    const handleGeocode = async () => {
        if (parsed.length === 0) {
            setPageError('Primero analiza el pegado o no hay filas detectadas.');
            return;
        }
        setPageError(null);
        setGeocodeLoading(true);
        setGeocoded([]);
        setErrors([]);
        try {
            const res = await fetch('/api/geo/geocode-chain-locations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: parsed.map((p) => ({ branchName: p.branchName, address: p.address })),
                    country: country.trim() || 'México'
                })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message || 'Geocodificación rechazada');
            setGeocoded(data.chainLocations || []);
            setErrors(data.errors || []);
        } catch (e) {
            setPageError(e instanceof Error ? e.message : 'Error al geocodificar');
        } finally {
            setGeocodeLoading(false);
        }
    };

    const jsonExport = JSON.stringify(geocoded, null, 2);

    const copyJson = async () => {
        if (!geocoded.length) return;
        try {
            await navigator.clipboard.writeText(jsonExport);
            setCopyDone(true);
            setTimeout(() => setCopyDone(false), 2000);
        } catch {
            setPageError('No se pudo copiar al portapapeles');
        }
    };

    const applyToWizard = () => {
        if (!geocoded.length) {
            setPageError('Geocodifica al menos una sucursal antes de abrir el asistente.');
            return;
        }
        if (!chainBrandName.trim()) {
            setPageError('Indica el nombre de la cadena arriba para que la promoción quede bien etiquetada.');
            return;
        }
        try {
            sessionStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    chainBrandName: chainBrandName.trim(),
                    chainLocations: geocoded
                })
            );
            navigate(`${returnTo}?importChain=1`);
        } catch {
            setPageError('No se pudo guardar datos para el asistente');
        }
    };

    const saveBrandToCatalog = async () => {
        if (!geocoded.length) {
            setPageError('Geocodifica al menos una sucursal antes de guardar la brand.');
            setSaveBrandMessage(null);
            return;
        }
        const brand = chainBrandName.trim();
        if (!brand) {
            setPageError('Escribe el nombre de la brand / cadena (se usará en promociones y catálogo).');
            setSaveBrandMessage(null);
            return;
        }
        const id = catalogSlug.trim() || slugFromBrand(brand) || 'brand';
        const matchNames = matchNamesInput
            .split(/[,;\n]+/)
            .map((s) => s.trim())
            .filter(Boolean);

        setPageError(null);
        setSaveBrandMessage(null);
        setSaveBrandLoading(true);
        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (presetWriteSecret.trim()) {
                headers['X-Geo-Preset-Secret'] = presetWriteSecret.trim();
            }
            const res = await fetch('/api/geo/save-chain-preset', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    id,
                    label: brand,
                    chainBrandName: brand,
                    matchNames: matchNames.length ? matchNames : undefined,
                    chainLocations: geocoded
                })
            });
            const rawText = await res.text();
            let data: { success?: boolean; message?: string; error?: string; id?: string; branchCount?: number } =
                {};
            try {
                data = rawText ? (JSON.parse(rawText) as typeof data) : {};
            } catch {
                setPageError(
                    `Respuesta no válida (${res.status}). ¿Está el backend en marcha? ${rawText.slice(0, 120)}`
                );
                return;
            }
            const apiErr = data.message || data.error;
            if (!res.ok || !data.success) {
                throw new Error(apiErr || `Error HTTP ${res.status}`);
            }
            setSaveBrandMessage(data.message || `Brand "${data.id}" guardada (${data.branchCount} sucursales).`);
        } catch (e) {
            setPageError(e instanceof Error ? e.message : 'Error al guardar brand');
        } finally {
            setSaveBrandLoading(false);
        }
    };

    const fieldClass =
        'w-full px-3 py-2 rounded-lg text-sm border border-white/15 bg-gray-900/60 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-400/50';

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-gray-100 pb-16">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-950/30 via-gray-900/80 to-rose-950/20 px-4 py-5 mb-8 backdrop-blur-sm">
                    <div className="flex flex-wrap items-center gap-3">
                        <Link
                            to={returnTo}
                            className="inline-flex items-center gap-2 text-sm text-amber-300 hover:text-amber-200 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4 shrink-0" />
                            Volver
                        </Link>
                        <span className="text-white/25 hidden sm:inline">|</span>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <MapPin className="h-7 w-7 text-amber-400 shrink-0" />
                            Importar sucursales
                        </h1>
                    </div>
                    <p className="text-gray-400 text-sm mt-4 leading-relaxed max-w-3xl">
                        Pega el listado copiado desde búsqueda local (nombre de tienda + dirección). No accedemos a Google:
                        el texto se interpreta aquí y las coordenadas salen de{' '}
                        <a
                            className="text-amber-400 underline hover:text-amber-300"
                            href="https://nominatim.org/release-info/"
                            target="_blank"
                            rel="noreferrer"
                        >
                            OpenStreetMap Nominatim
                        </a>
                        , con pausa entre peticiones. Revisa puntos críticos a mano.
                    </p>
                </div>

                {saveBrandMessage && (
                    <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-950/35 px-4 py-3 text-sm text-emerald-100">
                        {saveBrandMessage}{' '}
                        Luego, al crear una promoción, elige esta brand en el catálogo o usa «Usar en crear promoción».
                    </div>
                )}

                {pageError && (
                    <div className="mb-4 rounded-xl border border-rose-500/35 bg-rose-950/40 px-4 py-3 text-sm text-rose-100">
                        {pageError}
                    </div>
                )}

                <div className="space-y-4 rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm p-6 shadow-lg shadow-black/20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">País (geocodificación)</label>
                            <input
                                type="text"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                className={fieldClass}
                                placeholder="México"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Nombre de cadena / brand (promoción y catálogo)
                            </label>
                            <input
                                type="text"
                                value={chainBrandName}
                                onChange={(e) => setChainBrandName(e.target.value)}
                                className={fieldClass}
                                placeholder="Ej. Comfort Jeans"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                ID en catálogo (slug, opcional)
                            </label>
                            <input
                                type="text"
                                value={catalogSlug}
                                onChange={(e) => setCatalogSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                className={`${fieldClass} font-mono`}
                                placeholder={chainBrandName ? slugFromBrand(chainBrandName) : 'ej. comfort-jeans'}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Alias para coincidir con promos (opcional, separados por coma)
                            </label>
                            <input
                                type="text"
                                value={matchNamesInput}
                                onChange={(e) => setMatchNamesInput(e.target.value)}
                                className={fieldClass}
                                placeholder="Comfort, COMFORTJEANS, comfortjeans"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Clave de escritura del servidor{' '}
                            <span className="font-normal text-gray-500">(solo producción, si está configurada)</span>
                        </label>
                        <input
                            type="password"
                            autoComplete="off"
                            value={presetWriteSecret}
                            onChange={(e) => setPresetWriteSecret(e.target.value)}
                            className={`${fieldClass} max-w-md font-mono`}
                            placeholder="Misma clave que GEO_CHAIN_PRESET_WRITE_SECRET en el servidor"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Texto pegado</label>
                        <textarea
                            value={pasteText}
                            onChange={(e) => setPasteText(e.target.value)}
                            rows={12}
                            className={`${fieldClass} font-mono`}
                            placeholder="Sam's Club Portal Centro&#10;Lorenzo Boturini S/N · 800 999 7267&#10;..."
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={handleParse}
                            disabled={parseLoading || !pasteText.trim()}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/15 bg-gray-950/80 text-gray-100 text-sm hover:bg-white/10 disabled:opacity-50 transition-colors"
                        >
                            {parseLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            1. Analizar pegado
                        </button>
                        <button
                            type="button"
                            onClick={handleGeocode}
                            disabled={geocodeLoading || parsed.length === 0}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-white text-sm hover:bg-amber-500 disabled:opacity-50 transition-colors shadow-lg shadow-amber-900/20"
                        >
                            {geocodeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            2. Geocodificar ({parsed.length} filas)
                        </button>
                    </div>

                    {parsed.length > 0 && (
                        <p className="text-sm text-gray-400">
                            Detectadas <strong className="text-amber-200/90">{parsed.length}</strong> sucursales. La
                            geocodificación puede tardar unos {Math.ceil((parsed.length * 1.2) / 60)} min aprox.
                            (límite ~1 req/s a Nominatim).
                        </p>
                    )}
                </div>

                {errors.length > 0 && (
                    <div className="mt-6 rounded-2xl border border-amber-500/25 bg-amber-950/30 p-4 backdrop-blur-sm">
                        <h2 className="text-sm font-semibold text-amber-200 mb-2">Filas sin coordenadas</h2>
                        <ul className="text-xs text-amber-100/90 space-y-1 max-h-40 overflow-y-auto">
                            {errors.map((err, i) => (
                                <li key={i}>
                                    #{err.index} {err.branchName || '(sin nombre)'} — {err.address || '(sin dirección)'} —{' '}
                                    {err.reason}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {geocoded.length > 0 && (
                    <div className="mt-8 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h2 className="text-lg font-semibold text-white">
                                Resultado ({geocoded.length} con coordenadas)
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={copyJson}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/15 bg-gray-900/50 text-gray-200 text-sm hover:bg-white/10 transition-colors"
                                >
                                    <ClipboardCopy className="h-4 w-4" />
                                    {copyDone ? 'Copiado' : 'Copiar JSON'}
                                </button>
                                <button
                                    type="button"
                                    onClick={applyToWizard}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/20"
                                >
                                    Usar en crear promoción
                                </button>
                                <button
                                    type="button"
                                    onClick={saveBrandToCatalog}
                                    disabled={saveBrandLoading || !geocoded.length}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-violet-500/45 bg-violet-950/40 text-violet-100 text-sm font-medium hover:bg-violet-900/50 disabled:opacity-50 transition-colors"
                                >
                                    {saveBrandLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Library className="h-4 w-4" />
                                    )}
                                    Agregar brand al catálogo
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-950/70 text-left text-xs uppercase tracking-wide text-gray-400 border-b border-white/10">
                                    <tr>
                                        <th className="px-3 py-2">Sucursal</th>
                                        <th className="px-3 py-2">Ciudad</th>
                                        <th className="px-3 py-2">Dirección</th>
                                        <th className="px-3 py-2">Lat</th>
                                        <th className="px-3 py-2">Lng</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {geocoded.map((row, i) => (
                                        <tr key={i} className="hover:bg-white/5 transition-colors">
                                            <td className="px-3 py-2 font-medium text-white">{row.branchName}</td>
                                            <td className="px-3 py-2 text-gray-400">{row.city}</td>
                                            <td className="px-3 py-2 text-gray-400 max-w-xs truncate" title={row.address}>
                                                {row.address}
                                            </td>
                                            <td className="px-3 py-2 font-mono text-xs text-gray-300">
                                                {row.coordinates.latitude.toFixed(5)}
                                            </td>
                                            <td className="px-3 py-2 font-mono text-xs text-gray-300">
                                                {row.coordinates.longitude.toFixed(5)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <details className="rounded-xl border border-white/10 bg-gray-900/50 p-3 text-sm backdrop-blur-sm">
                            <summary className="cursor-pointer font-medium text-gray-200 hover:text-white">
                                Vista JSON (chainLocations)
                            </summary>
                            <pre className="mt-2 overflow-x-auto text-xs p-3 bg-gray-950/80 rounded-lg border border-white/10 text-gray-300 max-h-64">
                                {jsonExport}
                            </pre>
                        </details>
                    </div>
                )}
            </div>
        </div>
    );
}
