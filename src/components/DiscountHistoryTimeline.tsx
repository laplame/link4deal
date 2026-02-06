import React from 'react';
import { Clock, TrendingDown, TrendingUp, DollarSign, Calendar, Tag } from 'lucide-react';
import { formatPrice } from '../utils/formatters';

interface PriceHistoryEntry {
    date: string;
    originalPrice: number;
    currentPrice: number;
    discountPercentage: number;
    currency: string;
    event: 'price_increase' | 'price_decrease' | 'discount_added' | 'discount_removed' | 'promotion_created';
    description?: string;
}

interface DiscountHistoryTimelineProps {
    promotionId: string;
    brand?: string;
    currentPrice: number;
    originalPrice?: number;
    currency: string;
    history?: PriceHistoryEntry[];
}

export default function DiscountHistoryTimeline({
    promotionId,
    brand,
    currentPrice,
    originalPrice,
    currency,
    history = []
}: DiscountHistoryTimelineProps) {
    // Si no hay historial, mostrar mensaje
    if (history.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Clock className="h-6 w-6 text-blue-600" />
                    <h3 className="text-xl font-bold text-gray-900">Historial de Precios</h3>
                </div>
                <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No hay historial de precios disponible</p>
                    <p className="text-sm text-gray-500 mt-2">Este es el primer registro de precio para este producto</p>
                </div>
            </div>
        );
    }

    const getEventIcon = (event: PriceHistoryEntry['event']) => {
        switch (event) {
            case 'price_decrease':
            case 'discount_added':
                return <TrendingDown className="h-5 w-5 text-green-500" />;
            case 'price_increase':
            case 'discount_removed':
                return <TrendingUp className="h-5 w-5 text-red-500" />;
            case 'promotion_created':
                return <Tag className="h-5 w-5 text-blue-500" />;
            default:
                return <DollarSign className="h-5 w-5 text-gray-500" />;
        }
    };

    const getEventColor = (event: PriceHistoryEntry['event']) => {
        switch (event) {
            case 'price_decrease':
            case 'discount_added':
                return 'bg-green-100 border-green-300';
            case 'price_increase':
            case 'discount_removed':
                return 'bg-red-100 border-red-300';
            case 'promotion_created':
                return 'bg-blue-100 border-blue-300';
            default:
                return 'bg-gray-100 border-gray-300';
        }
    };

    const getEventLabel = (event: PriceHistoryEntry['event']) => {
        switch (event) {
            case 'price_decrease':
                return 'Precio reducido';
            case 'price_increase':
                return 'Precio aumentado';
            case 'discount_added':
                return 'Descuento agregado';
            case 'discount_removed':
                return 'Descuento removido';
            case 'promotion_created':
                return 'Promoción creada';
            default:
                return 'Cambio de precio';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Hoy';
        } else if (diffDays === 1) {
            return 'Ayer';
        } else if (diffDays < 7) {
            return `Hace ${diffDays} días`;
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `Hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
        } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
        } else {
            return date.toLocaleDateString('es-MX', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Clock className="h-6 w-6 text-blue-600" />
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Historial de Precios</h3>
                        {brand && (
                            <p className="text-sm text-gray-600">Historial de descuentos de {brand}</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                {/* Timeline entries */}
                <div className="space-y-6">
                    {history.map((entry, index) => {
                        const isLatest = index === 0;
                        const priceChange = entry.originalPrice - entry.currentPrice;
                        const isDiscount = priceChange > 0;

                        return (
                            <div key={index} className="relative flex items-start gap-4">
                                {/* Timeline dot */}
                                <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 ${getEventColor(entry.event)}`}>
                                    {getEventIcon(entry.event)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 pb-6">
                                    <div className={`p-4 rounded-lg border-2 ${getEventColor(entry.event)}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-900">
                                                    {getEventLabel(entry.event)}
                                                </span>
                                                {isLatest && (
                                                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                                        Actual
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-sm text-gray-500">
                                                {formatDate(entry.date)}
                                            </span>
                                        </div>

                                        {entry.description && (
                                            <p className="text-sm text-gray-600 mb-3">
                                                {entry.description}
                                            </p>
                                        )}

                                        <div className="grid grid-cols-2 gap-4 mt-3">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Precio Original</p>
                                                <p className="text-lg font-semibold text-gray-700 line-through">
                                                    {formatPrice(entry.originalPrice, entry.currency)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Precio Actual</p>
                                                <p className={`text-lg font-bold ${isDiscount ? 'text-green-600' : 'text-gray-900'}`}>
                                                    {formatPrice(entry.currentPrice, entry.currency)}
                                                </p>
                                            </div>
                                        </div>

                                        {isDiscount && (
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600">Descuento</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg font-bold text-green-600">
                                                            -{entry.discountPercentage}%
                                                        </span>
                                                        <span className="text-sm text-gray-600">
                                                            Ahorro: {formatPrice(priceChange, entry.currency)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Summary */}
            {history.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Precio más bajo</p>
                            <p className="text-lg font-bold text-green-600">
                                {formatPrice(
                                    Math.min(...history.map(h => h.currentPrice)),
                                    currency
                                )}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Descuento máximo</p>
                            <p className="text-lg font-bold text-blue-600">
                                {Math.max(...history.map(h => h.discountPercentage))}%
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Cambios registrados</p>
                            <p className="text-lg font-bold text-gray-900">
                                {history.length}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
