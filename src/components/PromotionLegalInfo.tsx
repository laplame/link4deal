import React, { useState } from 'react';
import { FileCheck, DollarSign, Calendar, Package, Info } from 'lucide-react';

/**
 * Panel de información alineado con el Gherkin BizneAI/DameCodigo:
 * definición legal, conversión USD, vigencia y límite de redenciones.
 * Para usar en /quick-promotion y /create-promotion.
 */
export default function PromotionLegalInfo() {
    const [open, setOpen] = useState(false);

    return (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/80 text-left">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full px-4 py-3 flex items-center justify-between gap-2 text-sm font-medium text-indigo-900 hover:bg-indigo-100/80 rounded-xl transition-colors"
            >
                <span className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-indigo-600" />
                    Cómo crear promociones válidas y tokenizables (BizneAI / DameCodigo)
                </span>
                <span className="text-indigo-500">{open ? '▼' : '▶'}</span>
            </button>
            {open && (
                <div className="px-4 pb-4 pt-0 space-y-4 text-sm text-indigo-900/90">
                    <div className="flex gap-3">
                        <FileCheck className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-indigo-900 mb-1">Definición legal</p>
                            <p className="text-indigo-800/90">
                                Indica precio base, producto o servicio aplicable, características comerciales,
                                cantidad máxima de promociones disponibles y vigencia (fecha inicio y fin).
                                Así la promoción es auditable y financieramente determinística.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <DollarSign className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-indigo-900 mb-1">Valor en USD (tokenización)</p>
                            <p className="text-indigo-800/90">
                                Usa precio en USD cuando quieras que el valor promocional se represente en tokens estables.
                                Descuento % → valor en USD; 2x1 y cashback fijo también se convierten a monto exacto en USD.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Calendar className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-indigo-900 mb-1">Vigencia</p>
                            <p className="text-indigo-800/90">
                                Las redenciones solo son válidas entre la fecha de inicio y la fecha de fin.
                                Fuera de ese periodo el sistema rechazará el cupón.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Package className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-indigo-900 mb-1">Límite de redenciones</p>
                            <p className="text-indigo-800/90">
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
