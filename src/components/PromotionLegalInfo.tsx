import React, { useState } from 'react';
import { FileCheck, DollarSign, Calendar, Package, Info } from 'lucide-react';

/**
 * Panel de información alineado con el Gherkin BizneAI/DameCodigo:
 * definición legal, conversión USD, vigencia y límite de redenciones.
 * Para usar en /quick-promotion y /create-promotion.
 */
interface PromotionLegalInfoProps {
    /** Tema visual; `dark` alinea con subastas / formularios oscuros. */
    variant?: 'light' | 'dark';
}

export default function PromotionLegalInfo({ variant = 'light' }: PromotionLegalInfoProps) {
    const [open, setOpen] = useState(false);

    const shell =
        variant === 'dark'
            ? 'rounded-xl border border-indigo-500/35 bg-indigo-950/45 text-left backdrop-blur-sm'
            : 'rounded-xl border border-indigo-200 bg-indigo-50/80 text-left';
    const btn =
        variant === 'dark'
            ? 'w-full px-4 py-3 flex items-center justify-between gap-2 text-sm font-medium text-indigo-200 hover:bg-white/5 rounded-xl transition-colors'
            : 'w-full px-4 py-3 flex items-center justify-between gap-2 text-sm font-medium text-indigo-900 hover:bg-indigo-100/80 rounded-xl transition-colors';
    const caret = variant === 'dark' ? 'text-indigo-400' : 'text-indigo-500';
    const body = variant === 'dark' ? 'px-4 pb-4 pt-0 space-y-4 text-sm text-indigo-100/95' : 'px-4 pb-4 pt-0 space-y-4 text-sm text-indigo-900/90';
    const icon = variant === 'dark' ? 'text-indigo-400' : 'text-indigo-600';
    const heading = variant === 'dark' ? 'font-medium text-indigo-100 mb-1' : 'font-medium text-indigo-900 mb-1';
    const para = variant === 'dark' ? 'text-indigo-200/90' : 'text-indigo-800/90';

    return (
        <div className={shell}>
            <button type="button" onClick={() => setOpen(!open)} className={btn}>
                <span className="flex items-center gap-2">
                    <Info className={`h-5 w-5 ${icon}`} />
                    Cómo crear promociones válidas y tokenizables (BizneAI / DameCodigo)
                </span>
                <span className={caret}>{open ? '▼' : '▶'}</span>
            </button>
            {open && (
                <div className={body}>
                    <div className="flex gap-3">
                        <FileCheck className={`h-5 w-5 ${icon} flex-shrink-0 mt-0.5`} />
                        <div>
                            <p className={heading}>Definición legal</p>
                            <p className={para}>
                                Indica precio base, producto o servicio aplicable, características comerciales,
                                cantidad máxima de promociones disponibles y vigencia (fecha inicio y fin).
                                Así la promoción es auditable y financieramente determinística.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <DollarSign className={`h-5 w-5 ${icon} flex-shrink-0 mt-0.5`} />
                        <div>
                            <p className={heading}>Valor en USD (tokenización)</p>
                            <p className={para}>
                                Usa precio en USD cuando quieras que el valor promocional se represente en tokens estables.
                                Descuento % → valor en USD; 2x1 y cashback fijo también se convierten a monto exacto en USD.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Calendar className={`h-5 w-5 ${icon} flex-shrink-0 mt-0.5`} />
                        <div>
                            <p className={heading}>Vigencia</p>
                            <p className={para}>
                                Las redenciones solo son válidas entre la fecha de inicio y la fecha de fin.
                                Fuera de ese periodo el sistema rechazará el cupón.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Package className={`h-5 w-5 ${icon} flex-shrink-0 mt-0.5`} />
                        <div>
                            <p className={heading}>Límite de redenciones</p>
                            <p className={para}>
                                El número máximo de promociones disponibles controla cuántas veces se puede redimir.
                                Al llegar al límite la promoción se considera agotada y no se permiten más redenciones.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
