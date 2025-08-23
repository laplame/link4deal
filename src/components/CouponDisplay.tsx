import React, { useState } from 'react';
import { QrCode, CheckCircle, X, Copy, Download } from 'lucide-react';

interface Coupon {
    id: string;
    code: string;
    productName: string;
    discount: number;
    discountType: 'percentage' | 'fixed';
    validUntil: string;
    isApplied: boolean;
    qrCode: string;
}

interface CouponDisplayProps {
    coupon: Coupon;
    onApply: (couponId: string) => void;
    onRemove: (couponId: string) => void;
    onDownload: (couponId: string) => void;
}

const CouponDisplay: React.FC<CouponDisplayProps> = ({
    coupon,
    onApply,
    onRemove,
    onDownload
}) => {
    const [showQR, setShowQR] = useState(false);
    const [copied, setCopied] = useState(false);

    const formatDiscount = () => {
        if (coupon.discountType === 'percentage') {
            return `${coupon.discount}%`;
        }
        return `$${coupon.discount.toFixed(2)}`;
    };

    const formatValidUntil = () => {
        const date = new Date(coupon.validUntil);
        return date.toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(coupon.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Error copying to clipboard:', err);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <QrCode className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900">Cupón de Descuento</h4>
                        <p className="text-sm text-gray-500">{coupon.productName}</p>
                    </div>
                </div>
                
                {coupon.isApplied && (
                    <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Aplicado</span>
                    </div>
                )}
            </div>

            {/* Coupon Code */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Código del Cupón:</p>
                        <p className="text-lg font-mono font-bold text-blue-600">{coupon.code}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={copyToClipboard}
                            className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                            title="Copiar código"
                        >
                            {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => setShowQR(!showQR)}
                            className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                            title="Ver QR"
                        >
                            <QrCode className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* QR Code (Conditional) */}
            {showQR && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg text-center">
                    <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 mx-auto mb-3">
                        <div className="text-center">
                            <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">QR Code</p>
                            <p className="text-xs text-gray-400">{coupon.code}</p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500">
                        Escanea este código para activar tu cupón
                    </p>
                </div>
            )}

            {/* Coupon Details */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Descuento</p>
                    <p className="text-lg font-bold text-blue-600">{formatDiscount()}</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-600">Válido hasta</p>
                    <p className="text-sm font-medium text-orange-600">{formatValidUntil()}</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                {!coupon.isApplied ? (
                    <button
                        onClick={() => onApply(coupon.id)}
                        className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <CheckCircle className="w-4 h-4" />
                        Aplicar Cupón
                    </button>
                ) : (
                    <button
                        onClick={() => onRemove(coupon.id)}
                        className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <X className="w-4 h-4" />
                        Remover Cupón
                    </button>
                )}
                
                <button
                    onClick={() => onDownload(coupon.id)}
                    className="px-4 py-3 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors flex items-center gap-2"
                >
                    <Download className="w-4 h-4" />
                    Descargar
                </button>
            </div>

            {/* Terms */}
            <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                    Este cupón es válido solo para el producto especificado y no es transferible.
                    El descuento se aplicará automáticamente al finalizar la compra.
                </p>
            </div>
        </div>
    );
};

export default CouponDisplay;
