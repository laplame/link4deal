import React from 'react';

interface Props {
    count: number | null;
    loading?: boolean;
    className?: string;
}

/** Contador minimal (solo número de descargas APK, sin %). */
export default function AppDownloadMinimalCounter({ count, loading, className = '' }: Props) {
    const display =
        loading || count === null ? '—' : count.toLocaleString('es-MX', { maximumFractionDigits: 0 });

    return (
        <div
            className={`bg-white text-black px-3 py-2 sm:px-4 sm:py-3 min-w-[6.5rem] sm:min-w-[7.5rem] shrink-0 border-t-[3px] border-black ${className}`}
            aria-label={`Descargas de la app: ${display}`}
        >
            <p className="font-mono text-[10px] sm:text-[11px] lowercase text-black/75 leading-tight">
                descargas app
            </p>
            <div className="w-6 sm:w-7 border-t border-black my-1.5 sm:my-2" aria-hidden />
            <p className="text-3xl sm:text-[2.35rem] font-black tabular-nums leading-none tracking-tight">
                {display}
            </p>
        </div>
    );
}
