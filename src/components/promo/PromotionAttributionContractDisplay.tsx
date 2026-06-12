import React, { useState } from 'react';
import { FileText, Copy, CheckCircle } from 'lucide-react';
import {
    formatAttributionContractSignDate,
    formatAgreedRedemptionPercent
} from '../../utils/cryptomarketingAttributionContract';

export interface AttributionContractView {
    type?: string;
    clientName?: string;
    providerName?: string;
    contractMonths?: number;
    signDate?: string;
    promotionValidFrom?: string;
    promotionValidUntil?: string;
    promotionTotalQuantity?: number;
    agreedRedemptionPercent?: number | null;
    renderedText?: string;
}

interface PromotionAttributionContractDisplayProps {
    contract: AttributionContractView;
    onCopy?: (text: string) => void | Promise<void>;
    compact?: boolean;
}

export function hasAttributionContract(contract: AttributionContractView | null | undefined): boolean {
    if (!contract) return false;
    if (contract.type && contract.type !== 'cryptomarketing') return false;
    return Boolean((contract.renderedText || '').trim());
}

export function PromotionAttributionContractEmptyState({ brand }: { brand?: string }) {
    return (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5">
            <div className="flex items-start gap-2">
                <FileText className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                    <h3 className="text-sm font-semibold text-gray-900">Sin contrato de atribución</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Esta promoción no tiene el contrato Cryptomarketing asociado.
                        {brand ? (
                            <> Al crearla o editarla, elige «Cryptomarketing — atribución propietaria» y usa la marca ({brand}) como EL CLIENTE.</>
                        ) : (
                            <> Al crearla o editarla, elige «Cryptomarketing — atribución propietaria» en el formulario.</>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function PromotionAttributionContractDisplay({
    contract,
    onCopy,
    compact = false
}: PromotionAttributionContractDisplayProps) {
    const [copied, setCopied] = useState(false);
    const text = (contract.renderedText || '').trim();

    if (!hasAttributionContract(contract)) return null;

    const handleCopy = async () => {
        if (!text) return;
        if (onCopy) {
            await onCopy(text);
        } else if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
        }
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`min-w-0 ${compact ? 'space-y-3' : 'space-y-4'}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-2 min-w-0">
                    <FileText className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                        <h3 className={`font-semibold text-gray-900 break-words ${compact ? 'text-base' : 'text-lg sm:text-xl'}`}>
                            Contrato de atribución Cryptomarketing
                        </h3>
                        {!compact && (
                            <p className="text-sm text-gray-600 mt-1">
                                Acuerdo de prestación de servicios con modelo de atribución propietario asociado a esta promoción.
                            </p>
                        )}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex w-full sm:w-auto shrink-0 items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                    {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copiado' : 'Copiar contrato'}
                </button>
            </div>

            <div className="flex flex-wrap gap-2 max-w-full">
                {contract.clientName && (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        Cliente: {contract.clientName}
                    </span>
                )}
                {contract.providerName && (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        Prestador: {contract.providerName}
                    </span>
                )}
                {contract.promotionValidFrom && contract.promotionValidUntil ? (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        Vigencia: {formatAttributionContractSignDate(contract.promotionValidFrom)} —{' '}
                        {formatAttributionContractSignDate(contract.promotionValidUntil)}
                    </span>
                ) : typeof contract.contractMonths === 'number' && contract.contractMonths > 0 ? (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        Vigencia: {contract.contractMonths} meses
                    </span>
                ) : null}
                {typeof contract.promotionTotalQuantity === 'number' && contract.promotionTotalQuantity > 0 && (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        Piezas: {contract.promotionTotalQuantity}
                    </span>
                )}
                {(contract.agreedRedemptionPercent != null || contract.renderedText?.includes('BizneAI')) && (
                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-800">
                        Redención: {formatAgreedRedemptionPercent(contract.agreedRedemptionPercent)}
                    </span>
                )}
                {contract.signDate && (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        Firma: {formatAttributionContractSignDate(contract.signDate)}
                    </span>
                )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden min-w-0">
                <pre className="max-h-[45vh] sm:max-h-[32rem] overflow-auto overscroll-contain p-3 sm:p-4 text-[11px] sm:text-xs leading-relaxed whitespace-pre-wrap break-words font-mono text-gray-800 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]">
                    {text}
                </pre>
            </div>
        </div>
    );
}
