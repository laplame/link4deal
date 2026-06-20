import { useEffect, useMemo, useState } from 'react';
import { FileText, ChevronDown, ChevronUp, Calendar, Package } from 'lucide-react';
import {
    emptyPromotionAttributionContract,
    renderAttributionContract,
    syncAttributionContractWithPromotion,
    formatAttributionContractSignDate,
    formatAgreedRedemptionPercent,
    type AttributionContractPromotionContext,
    type PromotionAttributionContract
} from '../../utils/cryptomarketingAttributionContract';

export type { PromotionAttributionContract, AttributionContractPromotionContext };
export { emptyPromotionAttributionContract };

interface PromotionAttributionContractSectionProps {
    value: PromotionAttributionContract;
    onChange: (patch: Partial<PromotionAttributionContract>) => void;
    /** Fechas, piezas y % de redención tomados de la promoción. */
    promotionContext: AttributionContractPromotionContext;
    /** Nombre sugerido para EL CLIENTE (marca, tienda, etc.). */
    suggestedClientName?: string;
    idPrefix?: string;
    variant?: 'light' | 'dark';
}

const inputClassLight =
    'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white';
const inputClassDark =
    'w-full px-3 py-2 text-sm border border-white/15 rounded-lg focus:ring-2 focus:ring-amber-500/25 focus:border-amber-400/50 bg-gray-900/60 text-gray-100 placeholder:text-gray-500';

export default function PromotionAttributionContractSection({
    value,
    onChange,
    promotionContext,
    suggestedClientName = '',
    idPrefix = 'attr-contract',
    variant = 'light'
}: PromotionAttributionContractSectionProps) {
    const [previewOpen, setPreviewOpen] = useState(false);
    const isDark = variant === 'dark';
    const inputClass = isDark ? inputClassDark : inputClassLight;
    const mutedText = isDark ? 'text-gray-400' : 'text-gray-600';
    const labelText = isDark ? 'text-gray-300' : 'text-gray-700';
    const boxClass = isDark
        ? 'rounded-lg border border-white/10 bg-black/20 p-3'
        : 'rounded-lg border border-indigo-100 bg-white/80 p-3';

    useEffect(() => {
        const suggested = suggestedClientName.trim();
        if (!suggested || value.clientName.trim()) return;
        onChange({ clientName: suggested });
    }, [suggestedClientName, value.clientName, onChange]);

    useEffect(() => {
        if (value.type !== 'cryptomarketing') return;
        const patch = syncAttributionContractWithPromotion(value, promotionContext);
        if (Object.keys(patch).length === 0) return;
        const changed = (Object.keys(patch) as (keyof PromotionAttributionContract)[]).some(
            (k) => patch[k] !== value[k]
        );
        if (changed) onChange(patch);
    }, [
        value.type,
        value.promotionValidFrom,
        value.promotionValidUntil,
        value.promotionTotalQuantity,
        value.agreedRedemptionPercent,
        promotionContext.validFrom,
        promotionContext.validUntil,
        promotionContext.totalQuantity,
        promotionContext.agreedRedemptionPercent,
        promotionContext.discountPercentage,
        onChange
    ]);

    const rendered = useMemo(() => renderAttributionContract(value), [value]);
    const enabled = value.type === 'cryptomarketing';

    return (
        <div
            className={
                isDark
                    ? 'rounded-xl border border-white/10 bg-gray-900/40 p-4 space-y-4'
                    : 'rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-4'
            }
        >
            <div className="flex items-start gap-2">
                <FileText className={`h-5 w-5 shrink-0 mt-0.5 ${isDark ? 'text-amber-400' : 'text-indigo-600'}`} />
                <div>
                    <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                        Contrato de atribución (opcional)
                    </h3>
                    <p className={`text-xs mt-1 ${mutedText}`}>
                        Vigencia y piezas se calculan automáticamente desde la promoción. Incluye cláusula obligatoria de BizneAI.
                    </p>
                </div>
            </div>

            <div>
                <label htmlFor={`${idPrefix}-type`} className={`block text-xs font-medium mb-1 ${labelText}`}>
                    Tipo de contrato
                </label>
                <select
                    id={`${idPrefix}-type`}
                    value={value.type}
                    onChange={(e) =>
                        onChange({
                            type: e.target.value as PromotionAttributionContract['type']
                        })
                    }
                    className={inputClass}
                >
                    <option value="none">Sin contrato de atribución</option>
                    <option value="cryptomarketing">Cryptomarketing — atribución propietaria</option>
                </select>
            </div>

            {enabled && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label htmlFor={`${idPrefix}-client`} className={`block text-xs font-medium mb-1 ${labelText}`}>
                                EL CLIENTE *
                            </label>
                            <input
                                id={`${idPrefix}-client`}
                                type="text"
                                value={value.clientName}
                                onChange={(e) => onChange({ clientName: e.target.value })}
                                className={inputClass}
                                placeholder="Nombre legal o razón social de la marca"
                            />
                        </div>
                        <div>
                            <label htmlFor={`${idPrefix}-provider`} className={`block text-xs font-medium mb-1 ${labelText}`}>
                                EL PRESTADOR *
                            </label>
                            <input
                                id={`${idPrefix}-provider`}
                                type="text"
                                value={value.providerName}
                                onChange={(e) => onChange({ providerName: e.target.value })}
                                className={inputClass}
                                placeholder="DameCodigo"
                            />
                        </div>
                    </div>

                    <div className={boxClass}>
                        <p className={`text-xs font-medium mb-2 ${labelText}`}>Vigencia dinámica (desde la promoción)</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className={`flex items-center gap-2 ${mutedText}`}>
                                <Calendar className="h-4 w-4 shrink-0" />
                                <span>
                                    {formatAttributionContractSignDate(value.promotionValidFrom)} —{' '}
                                    {formatAttributionContractSignDate(value.promotionValidUntil)}
                                </span>
                            </div>
                            <div className={`flex items-center gap-2 ${mutedText}`}>
                                <Package className="h-4 w-4 shrink-0" />
                                <span>{value.promotionTotalQuantity} piezas</span>
                            </div>
                        </div>
                        <p className={`text-xs mt-2 ${mutedText}`}>
                            Redención pactada: {formatAgreedRedemptionPercent(value.agreedRedemptionPercent)}.
                            BizneAI es obligatorio para verificar compra y redención.
                        </p>
                    </div>
                </>
            )}

            {enabled && rendered && (
                <div>
                    <button
                        type="button"
                        onClick={() => setPreviewOpen((o) => !o)}
                        className={`flex items-center gap-1 text-xs font-medium ${
                            isDark ? 'text-amber-400 hover:text-amber-300' : 'text-indigo-700 hover:text-indigo-900'
                        }`}
                    >
                        {previewOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {previewOpen ? 'Ocultar vista previa del contrato' : 'Ver vista previa del contrato'}
                    </button>
                    {previewOpen && (
                        <pre
                            className={`mt-2 max-h-80 overflow-auto rounded-lg p-3 text-xs whitespace-pre-wrap font-mono ${
                                isDark ? 'bg-black/40 text-gray-200 border border-white/10' : 'bg-white text-gray-800 border border-gray-200'
                            }`}
                        >
                            {rendered}
                        </pre>
                    )}
                </div>
            )}
        </div>
    );
}
