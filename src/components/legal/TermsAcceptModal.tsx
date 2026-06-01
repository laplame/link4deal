import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ExternalLink, ScrollText, ShieldCheck, X } from 'lucide-react';
import TermsContentBody from './TermsContentBody';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { acceptTerms } from '../../utils/termsAcceptance';

interface TermsAcceptModalProps {
    open: boolean;
    onClose: () => void;
    onAccept: () => void;
    /** Ruta a la página completa de términos (se abre en pestaña nueva). */
    fullPageHref?: string;
}

export default function TermsAcceptModal({
    open,
    onClose,
    onAccept,
    fullPageHref = '/terminos',
}: TermsAcceptModalProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [scrolledToEnd, setScrolledToEnd] = useState(false);
    const [checked, setChecked] = useState(false);

    useBodyScrollLock(open);

    const evaluateScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 32;
        setScrolledToEnd(atBottom);
    }, []);

    useEffect(() => {
        if (!open) {
            setScrolledToEnd(false);
            setChecked(false);
            return;
        }
        const id = window.requestAnimationFrame(() => {
            const el = scrollRef.current;
            if (el && el.scrollHeight <= el.clientHeight + 8) {
                setScrolledToEnd(true);
            } else {
                evaluateScroll();
            }
        });
        return () => window.cancelAnimationFrame(id);
    }, [open, evaluateScroll]);

    const handleAccept = () => {
        if (!scrolledToEnd || !checked) return;
        acceptTerms();
        onAccept();
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="terms-modal-title"
        >
            <button
                type="button"
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
                aria-label="Cerrar"
            />

            <div className="relative z-10 flex flex-col w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[88vh] rounded-t-3xl sm:rounded-3xl border border-white/10 bg-gray-950 shadow-2xl shadow-black/50 overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 bg-gray-900/80 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <ScrollText className="h-5 w-5 text-fuchsia-300 shrink-0" />
                        <h2 id="terms-modal-title" className="text-base font-semibold text-white truncate">
                            Términos y Condiciones
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                        aria-label="Cerrar modal"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div
                    ref={scrollRef}
                    onScroll={evaluateScroll}
                    className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 min-h-0"
                >
                    <TermsContentBody compact showHeader />

                    <div className="mt-4 pt-4 border-t border-white/10 text-center space-y-2 pb-2">
                        <p className="text-xs text-gray-500">
                            ¿Prefieres leer en pantalla completa?
                        </p>
                        <Link
                            to={fullPageHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-fuchsia-300 hover:text-fuchsia-200 underline underline-offset-2"
                        >
                            Abrir Términos y Condiciones completos
                            <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>

                <div className="shrink-0 border-t border-white/10 bg-gray-900/95 px-4 py-4 space-y-3">
                    {!scrolledToEnd && (
                        <p className="text-xs text-amber-200/90 text-center">
                            Desplázate hasta el final del documento para habilitar la aceptación.
                        </p>
                    )}

                    <label
                        className={`flex items-start gap-3 select-none ${
                            scrolledToEnd ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                        }`}
                    >
                        <input
                            type="checkbox"
                            checked={checked}
                            disabled={!scrolledToEnd}
                            onChange={(e) => setChecked(e.target.checked)}
                            className="mt-0.5 h-5 w-5 rounded border-white/20 bg-gray-900 text-fuchsia-600 focus:ring-fuchsia-500 disabled:opacity-40"
                        />
                        <span className="text-sm text-gray-200">
                            He leído y acepto los <strong>Términos y Condiciones</strong> de DameCodigo, Link4Deal y
                            BizneAI.
                        </span>
                    </label>

                    <button
                        type="button"
                        onClick={handleAccept}
                        disabled={!scrolledToEnd || !checked}
                        className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                            scrolledToEnd && checked
                                ? 'bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white hover:from-fuchsia-500 hover:to-purple-600 shadow-lg shadow-fuchsia-900/30'
                                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        <ShieldCheck className="h-5 w-5" />
                        Aceptar y continuar
                    </button>
                </div>
            </div>
        </div>
    );
}

/** Indicador compacto de términos ya aceptados (opcional en formularios). */
export function TermsAcceptedBadge({ onReview }: { onReview?: () => void }) {
    return (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-3 py-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Términos aceptados
            </span>
            {onReview && (
                <button
                    type="button"
                    onClick={onReview}
                    className="text-[11px] text-fuchsia-300 hover:text-fuchsia-200 underline"
                >
                    Revisar
                </button>
            )}
        </div>
    );
}
