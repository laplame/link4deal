import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Library, Sparkles } from 'lucide-react';

export type ChainPresetDirectoryItem = {
    id: string;
    label: string;
    chainBrandName: string;
    branchCount: number;
};

interface Props {
    preset: ChainPresetDirectoryItem;
    language: 'en' | 'es';
}

/**
 * Entrada de directorio para presets en chainLocationPresets.json (cadenas con sucursales / GPS).
 */
export function ChainPresetBrandCard({ preset, language }: Props) {
    const hasGpsBranches = preset.branchCount > 0;
    const branchLabel =
        language === 'es'
            ? `${preset.branchCount} sucursal${preset.branchCount === 1 ? '' : 'es'} en mapa`
            : `${preset.branchCount} branch${preset.branchCount === 1 ? '' : 'es'} on map`;

    return (
        <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-amber-500/40 hover:ring-1 hover:ring-amber-500/25 transition-all p-4 text-left flex flex-col h-full">
            <div className="flex items-start gap-3 flex-1">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-amber-500/15 flex items-center justify-center border border-amber-500/25">
                    <Library className="h-6 w-6 text-amber-400" />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-white truncate">{preset.label}</h3>
                    {preset.chainBrandName !== preset.label && (
                        <p className="text-sm text-gray-400 mt-0.5 truncate">{preset.chainBrandName}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1 font-mono">id: {preset.id}</p>
                </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
                {hasGpsBranches ? (
                    <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-amber-500/20 text-amber-200 border border-amber-400/35"
                        title={
                            language === 'es'
                                ? 'Catálogo con coordenadas para promociones por ubicación y cupón GPS'
                                : 'Directory with coordinates for location-based promotions and GPS coupons'
                        }
                    >
                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {language === 'es' ? 'Cadena GPS' : 'GPS chain'}
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-gray-700/80 text-gray-400 border border-gray-600">
                        {language === 'es' ? 'Sin sucursales geocodificadas' : 'No geocoded branches yet'}
                    </span>
                )}
                <span className="inline-flex items-center gap-1 text-xs text-gray-400">{branchLabel}</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-gray-700/80">
                <Link
                    to={`/create-promotion?catalogChain=${encodeURIComponent(preset.id)}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300"
                >
                    <Sparkles className="h-3.5 w-3.5" />
                    {language === 'es' ? 'Crear promoción' : 'Create promotion'}
                </Link>
                <Link
                    to="/importar-sucursales?returnTo=/brands"
                    className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-amber-300"
                >
                    {language === 'es' ? 'Importar / editar sucursales' : 'Import / edit branches'}
                </Link>
            </div>
        </div>
    );
}
