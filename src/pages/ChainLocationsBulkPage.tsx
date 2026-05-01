import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ClipboardCopy, Loader2, MapPin, Sparkles } from 'lucide-react';

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

export default function ChainLocationsBulkPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const returnTo = searchParams.get('returnTo') || '/create-promotion';

    const [pasteText, setPasteText] = useState('');
    const [country, setCountry] = useState('México');
    const [chainBrandName, setChainBrandName] = useState('');

    const [parsed, setParsed] = useState<ParsedItem[]>([]);
    const [geocoded, setGeocoded] = useState<GeocodedBranch[]>([]);
    const [errors, setErrors] = useState<Array<{ index: number; branchName: string; address: string; reason: string }>>(
        []
    );

    const [parseLoading, setParseLoading] = useState(false);
    const [geocodeLoading, setGeocodeLoading] = useState(false);
    const [pageError, setPageError] = useState<string | null>(null);
    const [copyDone, setCopyDone] = useState(false);

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

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50/80 to-gray-50 pb-16">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Link
                        to={returnTo}
                        className="inline-flex items-center gap-2 text-sm text-amber-900 hover:text-amber-950"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver
                    </Link>
                    <span className="text-gray-300">|</span>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <MapPin className="h-7 w-7 text-amber-600" />
                        Importar sucursales
                    </h1>
                </div>

                <p className="text-gray-600 mb-6">
                    Pega el listado copiado desde búsqueda local (nombre de tienda + dirección). No accedemos a Google:
                    el texto se interpreta aquí y las coordenadas salen de{' '}
                    <a
                        className="text-amber-700 underline"
                        href="https://nominatim.org/release-info/"
                        target="_blank"
                        rel="noreferrer"
                    >
                        OpenStreetMap Nominatim
                    </a>
                    , con pausa entre peticiones. Revisa puntos críticos a mano.
                </p>

                {pageError && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {pageError}
                    </div>
                )}

                <div className="space-y-4 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">País (geocodificación)</label>
                            <input
                                type="text"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                placeholder="México"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre de cadena (opcional, para el asistente)
                            </label>
                            <input
                                type="text"
                                value={chainBrandName}
                                onChange={(e) => setChainBrandName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                placeholder="Ej. Sam's Club"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Texto pegado</label>
                        <textarea
                            value={pasteText}
                            onChange={(e) => setPasteText(e.target.value)}
                            rows={12}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                            placeholder="Sam's Club Portal Centro&#10;Lorenzo Boturini S/N · 800 999 7267&#10;..."
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={handleParse}
                            disabled={parseLoading || !pasteText.trim()}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-gray-800 disabled:opacity-50"
                        >
                            {parseLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            1. Analizar pegado
                        </button>
                        <button
                            type="button"
                            onClick={handleGeocode}
                            disabled={geocodeLoading || parsed.length === 0}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm hover:bg-amber-700 disabled:opacity-50"
                        >
                            {geocodeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            2. Geocodificar ({parsed.length} filas)
                        </button>
                    </div>

                    {parsed.length > 0 && (
                        <p className="text-sm text-gray-600">
                            Detectadas <strong>{parsed.length}</strong> sucursales. La geocodificación puede tardar unos{' '}
                            {Math.ceil((parsed.length * 1.2) / 60)} min aprox. (límite ~1 req/s a Nominatim).
                        </p>
                    )}
                </div>

                {errors.length > 0 && (
                    <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/80 p-4">
                        <h2 className="text-sm font-semibold text-amber-900 mb-2">Filas sin coordenadas</h2>
                        <ul className="text-xs text-amber-900 space-y-1 max-h-40 overflow-y-auto">
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
                            <h2 className="text-lg font-semibold text-gray-900">
                                Resultado ({geocoded.length} con coordenadas)
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={copyJson}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
                                >
                                    <ClipboardCopy className="h-4 w-4" />
                                    {copyDone ? 'Copiado' : 'Copiar JSON'}
                                </button>
                                <button
                                    type="button"
                                    onClick={applyToWizard}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700"
                                >
                                    Usar en crear promoción
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                                    <tr>
                                        <th className="px-3 py-2">Sucursal</th>
                                        <th className="px-3 py-2">Ciudad</th>
                                        <th className="px-3 py-2">Dirección</th>
                                        <th className="px-3 py-2">Lat</th>
                                        <th className="px-3 py-2">Lng</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {geocoded.map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50/80">
                                            <td className="px-3 py-2 font-medium text-gray-900">{row.branchName}</td>
                                            <td className="px-3 py-2 text-gray-600">{row.city}</td>
                                            <td className="px-3 py-2 text-gray-600 max-w-xs truncate" title={row.address}>
                                                {row.address}
                                            </td>
                                            <td className="px-3 py-2 font-mono text-xs">
                                                {row.coordinates.latitude.toFixed(5)}
                                            </td>
                                            <td className="px-3 py-2 font-mono text-xs">
                                                {row.coordinates.longitude.toFixed(5)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <details className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
                            <summary className="cursor-pointer font-medium text-gray-800">Vista JSON (chainLocations)</summary>
                            <pre className="mt-2 overflow-x-auto text-xs p-2 bg-white rounded border border-gray-100 max-h-64">
                                {jsonExport}
                            </pre>
                        </details>
                    </div>
                )}
            </div>
        </div>
    );
}
