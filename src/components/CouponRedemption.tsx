import React, { useState, useEffect } from 'react';
import { Ticket, CheckCircle, X, AlertCircle, Info, MapPin, Navigation } from 'lucide-react';
import { useGeolocation } from '../context/GeolocationContext';

export interface Coupon {
    id: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minPurchase: number;
    maxDiscount?: number;
    validFrom: string;
    validTo: string;
    usageLimit: number;
    usedCount: number;
    applicableProducts?: string[];
    description: string;
    // Nuevos campos para cupones de tienda física
    isPhysicalStore?: boolean;
    storeLocation?: {
        latitude: number;
        longitude: number;
        address: string;
        name: string;
    };
    proximityRadius?: number; // en metros
    requiresProximity?: boolean;
}

interface CouponRedemptionProps {
    subtotal: number;
    currency: string;
    onCouponApplied: (coupon: Coupon, discountAmount: number) => void;
    onCouponRemoved: () => void;
    appliedCoupon?: Coupon;
    appliedDiscount?: number;
}

const CouponRedemption: React.FC<CouponRedemptionProps> = ({
    subtotal,
    currency,
    onCouponApplied,
    onCouponRemoved,
    appliedCoupon,
    appliedDiscount
}) => {
    const [couponCode, setCouponCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    
    const { location: geoLocation } = useGeolocation();

    // Mock de cupones disponibles (en una app real vendría de una API)
    const availableCoupons: Coupon[] = [
        {
            id: 'WELCOME10',
            code: 'WELCOME10',
            discountType: 'percentage',
            discountValue: 10,
            minPurchase: 1000,
            maxDiscount: 500,
            validFrom: '2024-01-01',
            validTo: '2024-12-31',
            usageLimit: 1000,
            usedCount: 150,
            description: '10% de descuento en tu primera compra'
        },
        {
            id: 'SAVE20',
            code: 'SAVE20',
            discountType: 'percentage',
            discountValue: 20,
            minPurchase: 2000,
            maxDiscount: 1000,
            validFrom: '2024-01-01',
            validTo: '2024-06-30',
            usageLimit: 500,
            usedCount: 89,
            description: '20% de descuento en compras mayores a $2,000'
        },
        {
            id: 'FLAT500',
            code: 'FLAT500',
            discountType: 'fixed',
            discountValue: 500,
            minPurchase: 3000,
            validFrom: '2024-01-01',
            validTo: '2024-12-31',
            usageLimit: 200,
            usedCount: 45,
            description: '$500 de descuento fijo en compras mayores a $3,000'
        },
        {
            id: 'STORE15',
            code: 'STORE15',
            discountType: 'percentage',
            discountValue: 15,
            minPurchase: 1500,
            maxDiscount: 750,
            validFrom: '2024-01-01',
            validTo: '2024-12-31',
            usageLimit: 300,
            usedCount: 67,
            description: '15% de descuento exclusivo en tienda física',
            isPhysicalStore: true,
            storeLocation: {
                latitude: 19.4326,
                longitude: -99.1332,
                address: 'Av. Insurgentes Sur 123, Col. Del Valle, CDMX',
                name: 'Tienda Principal Link4Deal'
            },
            proximityRadius: 1000, // 1km
            requiresProximity: true
        },
        {
            id: 'LOCAL25',
            code: 'LOCAL25',
            discountType: 'percentage',
            discountValue: 25,
            minPurchase: 500,
            maxDiscount: 1000,
            validFrom: '2024-01-01',
            validTo: '2024-12-31',
            usageLimit: 150,
            usedCount: 23,
            description: '25% de descuento para clientes locales',
            isPhysicalStore: true,
            storeLocation: {
                latitude: 19.4326,
                longitude: -99.1332,
                address: 'Av. Insurgentes Sur 123, Col. Del Valle, CDMX',
                name: 'Tienda Principal Link4Deal'
            },
            proximityRadius: 500, // 500m
            requiresProximity: true
        }
    ];

    // Función para obtener la ubicación del usuario
    const getUserLocation = (): Promise<{ latitude: number; longitude: number }> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocalización no está soportada en este navegador'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (error) => {
                    reject(new Error('No se pudo obtener tu ubicación'));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutos
                }
            );
        });
    };

    // Función para calcular distancia entre dos puntos (fórmula de Haversine)
    const calculateDistance = (
        lat1: number, lon1: number,
        lat2: number, lon2: number
    ): number => {
        const R = 6371e3; // Radio de la Tierra en metros
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distancia en metros
    };

    // Función para verificar proximidad a tienda física
    const checkProximity = async (coupon: Coupon): Promise<boolean> => {
        if (!coupon.requiresProximity || !coupon.storeLocation) {
            return true; // No requiere proximidad
        }

        try {
            if (!userLocation) {
                setIsGettingLocation(true);
                const location = await getUserLocation();
                setUserLocation(location);
                setIsGettingLocation(false);
            }

            if (!userLocation) {
                throw new Error('No se pudo obtener tu ubicación');
            }

            const distance = calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                coupon.storeLocation.latitude,
                coupon.storeLocation.longitude
            );

            return distance <= (coupon.proximityRadius || 1000);
        } catch (error) {
            console.error('Error checking proximity:', error);
            return false;
        } finally {
            setIsGettingLocation(false);
        }
    };

    const validateCoupon = async (code: string): Promise<Coupon> => {
        const coupon = availableCoupons.find(c => c.code === code.toUpperCase());
        if (!coupon) {
            throw new Error('Código de cupón inválido');
        }

        const now = new Date();
        const validFrom = new Date(coupon.validFrom);
        const validTo = new Date(coupon.validTo);

        if (now < validFrom || now > validTo) {
            throw new Error('Este cupón ha expirado o aún no es válido');
        }

        if (coupon.usedCount >= coupon.usageLimit) {
            throw new Error('Este cupón ha alcanzado su límite de uso');
        }

        if (subtotal < coupon.minPurchase) {
            throw new Error(`Compra mínima requerida: $${coupon.minPurchase.toLocaleString()} ${currency}`);
        }

        // Verificar proximidad para cupones de tienda física
        if (coupon.requiresProximity) {
            const isNearby = await checkProximity(coupon);
            if (!isNearby) {
                throw new Error(`Este cupón solo está disponible cerca de ${coupon.storeLocation?.name}. Debes estar a ${(coupon.proximityRadius || 1000) / 1000}km o menos de la tienda.`);
            }
        }

        return coupon;
    };

    const calculateDiscount = (coupon: Coupon): number => {
        let discountAmount = 0;

        if (coupon.discountType === 'percentage') {
            discountAmount = (subtotal * coupon.discountValue) / 100;
            if (coupon.maxDiscount) {
                discountAmount = Math.min(discountAmount, coupon.maxDiscount);
            }
        } else {
            discountAmount = coupon.discountValue;
        }

        return Math.min(discountAmount, subtotal); // No puede ser mayor al subtotal
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            setError('Por favor ingresa un código de cupón');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const coupon = await validateCoupon(couponCode);
            const discountAmount = calculateDiscount(coupon);
            onCouponApplied(coupon, discountAmount);
            
            setSuccess(`¡Cupón aplicado! Descuento: ${coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `$${coupon.discountValue.toLocaleString()}`}`);
            setCouponCode('');
            
            // Limpiar mensaje de éxito después de 3 segundos
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al aplicar el cupón');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveCoupon = () => {
        onCouponRemoved();
        setSuccess(null);
    };

    const formatCurrency = (amount: number) => {
        return `$${amount.toLocaleString('es-MX')} ${currency}`;
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
                <Ticket className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Cupones y Descuentos</h3>
            </div>

            {/* Cupón Aplicado */}
            {appliedCoupon && appliedDiscount && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <div>
                                <p className="font-medium text-green-900">
                                    Cupón aplicado: {appliedCoupon.code}
                                </p>
                                <p className="text-sm text-green-700">
                                    {appliedCoupon.description}
                                </p>
                                <p className="text-sm font-medium text-green-800">
                                    Descuento: {formatCurrency(appliedDiscount)}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleRemoveCoupon}
                            className="text-green-600 hover:text-green-800 p-1"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Aplicar Nuevo Cupón */}
            {!appliedCoupon && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Código de Cupón
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                placeholder="Ingresa tu código de cupón"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                            />
                            <button
                                onClick={handleApplyCoupon}
                                disabled={isLoading || !couponCode.trim()}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? 'Aplicando...' : 'Aplicar'}
                            </button>
                        </div>
                    </div>

                    {/* Mensajes de Error/Success */}
                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                            <CheckCircle className="h-4 w-4" />
                            {success}
                        </div>
                    )}

                    {/* Cupones Disponibles */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Info className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">
                                Cupones Disponibles
                            </span>
                        </div>
                        <div className="space-y-3">
                            {availableCoupons.map((coupon) => (
                                <div key={coupon.id} className="flex items-start gap-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-blue-800">{coupon.code}</span>
                                            {coupon.isPhysicalStore && (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                                    <MapPin className="h-3 w-3" />
                                                    Tienda Física
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-blue-700 mt-1">
                                            {coupon.description}
                                        </div>
                                        {coupon.isPhysicalStore && coupon.storeLocation && (
                                            <div className="text-xs text-orange-700 mt-1 flex items-center gap-1">
                                                <Navigation className="h-3 w-3" />
                                                {coupon.storeLocation.name} - Radio: {(coupon.proximityRadius || 1000) / 1000}km
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Botón para obtener ubicación */}
                        {availableCoupons.some(c => c.requiresProximity) && (
                            <div className="mt-4 pt-3 border-t border-blue-200">
                                <button
                                    onClick={async () => {
                                        try {
                                            setIsGettingLocation(true);
                                            const location = await getUserLocation();
                                            setUserLocation(location);
                                            setSuccess('Ubicación obtenida correctamente');
                                            setTimeout(() => setSuccess(null), 3000);
                                        } catch (error) {
                                            setError('No se pudo obtener tu ubicación. Algunos cupones pueden no estar disponibles.');
                                        } finally {
                                            setIsGettingLocation(false);
                                        }
                                    }}
                                    disabled={isGettingLocation}
                                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                                >
                                    {isGettingLocation ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Obteniendo ubicación...
                                        </>
                                    ) : (
                                        <>
                                            <Navigation className="h-4 w-4" />
                                            Obtener Mi Ubicación
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Resumen de Descuentos */}
            {appliedCoupon && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                        <span>Descuento ({appliedCoupon.code}):</span>
                        <span className="font-medium">-{formatCurrency(appliedDiscount)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-100">
                        <span>Total:</span>
                        <span>{formatCurrency(subtotal - appliedDiscount)}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CouponRedemption;
