import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { 
    QrCode, 
    Share2, 
    MessageCircle, 
    CheckCircle, 
    Clock, 
    Shield,
    ArrowLeft,
    Star,
    TrendingUp,
    Users,
    Zap,
    AlertCircle
} from 'lucide-react';

interface CouponData {
    id: string;
    code: string;
    productName: string;
    productImage: string;
    originalPrice: number;
    discountedPrice: number;
    discount: number;
    discountType: 'percentage' | 'fixed';
    validUntil: string;
    terms: string[];
    benefits: string[];
    restrictions: string[];
    maxUses: number;
    currentUses: number;
    influencer: {
        name: string;
        avatar: string;
        followers: number;
        category: string;
    };
    brand: {
        name: string;
        logo: string;
        verified: boolean;
    };
}

interface AttributionData {
    source: 'influencer' | 'agency' | 'brand' | 'direct';
    referrerId?: string;
    referrerType: string;
    referrerName: string;
    campaign?: string;
    medium: string;
    timestamp: string;
    userAgent: string;
    ipAddress?: string;
}

const CouponPage: React.FC = () => {
    const { couponId } = useParams<{ couponId: string }>();
    const [searchParams] = useSearchParams();
    const [coupon, setCoupon] = useState<CouponData | null>(null);
    const [attributionData, setAttributionData] = useState<AttributionData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showQR, setShowQR] = useState(false);
    const [copied, setCopied] = useState(false);

    // Extraer parámetros de tracking de la URL
    const ref = searchParams.get('ref');
    const source = searchParams.get('source');
    const campaign = searchParams.get('campaign');
    const medium = searchParams.get('medium') || 'social';

    useEffect(() => {
        // Capturar datos de atribución
        captureAttributionData();
        
        // Cargar datos del cupón
        loadCouponData();
        
        // Guardar en localStorage para tracking
        saveToLocalStorage();
    }, [couponId, ref, source, campaign, medium]);

    const captureAttributionData = () => {
        const attribution: AttributionData = {
            source: (source as 'influencer' | 'agency' | 'brand' | 'direct') || 'direct',
            referrerId: ref || undefined,
            referrerType: source || 'direct',
            referrerName: getReferrerName(source, ref),
            campaign: campaign || undefined,
            medium: medium,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            ipAddress: undefined // En producción, esto se obtendría del backend
        };

        setAttributionData(attribution);
        
        // Enviar datos de atribución a la base de datos
        sendAttributionToDB(attribution);
    };

    const getReferrerName = (source: string | null, ref: string | null): string => {
        if (!source || !ref) return 'Tráfico Directo';
        
        // En producción, esto se obtendría de la base de datos
        const referrerNames: Record<string, string> = {
            'influencer': 'Influencer',
            'agency': 'Agencia de Marketing',
            'brand': 'Marca',
            'direct': 'Tráfico Directo'
        };
        
        return referrerNames[source] || 'Referido';
    };

    const sendAttributionToDB = async (attribution: AttributionData) => {
        try {
            // En producción, esto se enviaría a tu API
            const response = await fetch('/api/attribution', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    couponId,
                    attribution,
                    timestamp: new Date().toISOString()
                })
            });

            if (response.ok) {
                console.log('Atribución guardada exitosamente');
            }
        } catch (error) {
            console.error('Error al guardar atribución:', error);
        }
    };

    const saveToLocalStorage = () => {
        const trackingData = {
            couponId,
            attribution: attributionData,
            timestamp: new Date().toISOString(),
            lastVisit: new Date().toISOString()
        };

        localStorage.setItem('link4deal_tracking', JSON.stringify(trackingData));
    };

    const loadCouponData = async () => {
        setIsLoading(true);
        
        try {
            // Simular carga de datos del cupón
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Mock data - en producción esto vendría de tu API
            const mockCoupon: CouponData = {
                id: couponId || '1',
                code: `L4D-${couponId || '1'}-${Date.now().toString(36).toUpperCase()}`,
                productName: "Auriculares Inalámbricos Sony WH-1000XM4",
                productImage: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80",
                originalPrice: 89.99,
                discountedPrice: 49.99,
                discount: 44,
                discountType: 'percentage',
                validUntil: "2024-02-15T23:59:59Z",
                terms: [
                    "Oferta válida hasta agotar existencias",
                    "Precio especial solo para usuarios registrados",
                    "Envío gratuito a toda España",
                    "Garantía de 2 años incluida",
                    "Devolución gratuita en 30 días"
                ],
                benefits: [
                    "Descuento del 44% sobre precio original",
                    "Envío express gratuito",
                    "Acceso a soporte premium",
                    "Membresía VIP por 6 meses",
                    "Acceso anticipado a futuras ofertas"
                ],
                restrictions: [
                    "Máximo 2 unidades por cliente",
                    "No válido para revendedores",
                    "Oferta no combinable con otros descuentos",
                    "Válido solo para envíos a España"
                ],
                maxUses: 1000,
                currentUses: 750,
                influencer: {
                    name: "María Tech",
                    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&w=150&q=80",
                    followers: 125000,
                    category: "Tecnología"
                },
                brand: {
                    name: "Sony",
                    logo: "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=100&q=80",
                    verified: true
                }
            };

            setCoupon(mockCoupon);
        } catch (error) {
            console.error('Error al cargar el cupón:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = async () => {
        if (!coupon) return;
        
        try {
            await navigator.clipboard.writeText(coupon.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Error copying to clipboard:', err);
        }
    };

    const shareCoupon = async () => {
        if (!coupon) return;

        const shareData = {
            title: `¡${coupon.discount}% de descuento en ${coupon.productName}!`,
            text: `Descubre esta increíble oferta en Link4Deal. Código: ${coupon.code}`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            // Fallback para navegadores que no soportan Web Share API
            copyToClipboard();
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando cupón...</p>
                </div>
            </div>
        );
    }

    if (!coupon) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Cupón no encontrado</h1>
                    <p className="text-gray-600 mb-6">El cupón que buscas no existe o ha expirado.</p>
                    <Link to="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                        Volver al Inicio
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors">
                                <ArrowLeft className="h-6 w-6" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Cupón de Descuento</h1>
                                <p className="text-gray-600">Oferta especial compartida por {coupon.influencer.name}</p>
                            </div>
                        </div>
                        
                        {/* Attribution Badge */}
                        {attributionData && (
                            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                📍 {attributionData.referrerName}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Main Coupon Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column - Product Info */}
                        <div>
                            <div className="mb-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <img
                                        src={coupon.brand.logo}
                                        alt={coupon.brand.name}
                                        className="w-12 h-12 rounded-lg object-cover"
                                    />
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">{coupon.brand.name}</h2>
                                        {coupon.brand.verified && (
                                            <span className="text-blue-600 text-sm">✓ Verificado</span>
                                        )}
                                    </div>
                                </div>
                                
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">{coupon.productName}</h3>
                                
                                <div className="flex items-center gap-4 mb-6">
                                    <span className="text-4xl font-bold text-blue-600">
                                        €{coupon.discountedPrice}
                                    </span>
                                    <span className="text-2xl text-gray-400 line-through">
                                        €{coupon.originalPrice}
                                    </span>
                                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                        -{coupon.discount}%
                                    </span>
                                </div>
                            </div>

                            {/* Product Image */}
                            <img
                                src={coupon.productImage}
                                alt={coupon.productName}
                                className="w-full h-64 object-cover rounded-lg mb-6"
                            />

                            {/* Progress Bar */}
                            <div className="mb-6">
                                <div className="flex justify-between text-sm text-gray-600 mb-2">
                                    <span>Ofertas utilizadas</span>
                                    <span>{coupon.currentUses} / {coupon.maxUses}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${(coupon.currentUses / coupon.maxUses) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Coupon Details */}
                        <div>
                            {/* Coupon Code */}
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-dashed border-blue-300 rounded-xl p-6 mb-6 text-center">
                                <h4 className="text-lg font-semibold text-gray-900 mb-3">Tu Código de Cupón</h4>
                                <div className="bg-white rounded-lg p-4 mb-4">
                                    <p className="text-2xl font-mono font-bold text-blue-600">{coupon.code}</p>
                                </div>
                                
                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={copyToClipboard}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                                    >
                                        {copied ? <CheckCircle className="w-4 h-4" /> : '📋'}
                                        {copied ? 'Copiado' : 'Copiar'}
                                    </button>
                                    
                                    <button
                                        onClick={() => setShowQR(!showQR)}
                                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                                    >
                                        <QrCode className="w-4 h-4" />
                                        QR
                                    </button>
                                </div>
                            </div>

                            {/* QR Code */}
                            {showQR && (
                                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 text-center">
                                    <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 mx-auto mb-4">
                                        <div className="text-center">
                                            <QrCode className="w-20 h-20 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500">QR Code</p>
                                            <p className="text-xs text-gray-400">{coupon.code}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        Escanea este código para activar tu cupón
                                    </p>
                                </div>
                            )}

                            {/* Validity Info */}
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="w-5 h-5 text-orange-600" />
                                    <span className="font-semibold text-orange-800">Válido hasta</span>
                                </div>
                                <p className="text-orange-700">{formatDate(coupon.validUntil)}</p>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <Link
                                    to={`/promotion-details/${coupon.id}`}
                                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    🛒 Ver Producto
                                </Link>
                                
                                <button
                                    onClick={shareCoupon}
                                    className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Share2 className="w-5 h-5" />
                                    Compartir Oferta
                                </button>
                                
                                <button
                                    onClick={() => window.open(`https://wa.me/+1234567890?text=${encodeURIComponent(`¡Hola! Necesito ayuda con mi cupón de Link4Deal:\n\n🎫 Código: ${coupon.code}\n🏷️ Producto: ${coupon.productName}`)}`, '_blank')}
                                    className="w-full bg-green-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    Contactar por WhatsApp
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Influencer Info */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Users className="w-6 h-6 text-blue-600" />
                        Compartido por
                    </h3>
                    
                    <div className="flex items-center gap-4">
                        <img
                            src={coupon.influencer.avatar}
                            alt={coupon.influencer.name}
                            className="w-16 h-16 rounded-full object-cover"
                        />
                        <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900">{coupon.influencer.name}</h4>
                            <p className="text-gray-600 mb-2">{coupon.influencer.category}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <TrendingUp className="w-4 h-4" />
                                    {formatNumber(coupon.influencer.followers)} seguidores
                                </span>
                                <span className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-500" />
                                    Verificado
                                </span>
                            </div>
                        </div>
                        
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                            Seguir
                        </button>
                    </div>
                </div>

                {/* Terms and Benefits */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Benefits */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Zap className="w-6 h-6 text-yellow-600" />
                            Beneficios
                        </h3>
                        <ul className="space-y-3">
                            {coupon.benefits.map((benefit, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <span className="text-gray-700">{benefit}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Terms */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Shield className="w-6 h-6 text-blue-600" />
                            Términos y Condiciones
                        </h3>
                        <ul className="space-y-3">
                            {coupon.terms.map((term, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <span className="text-gray-700">{term}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Restrictions */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <AlertCircle className="w-6 h-6 text-orange-600" />
                        Restricciones
                    </h3>
                    <ul className="space-y-3">
                        {coupon.restrictions.map((restriction, index) => (
                            <li key={index} className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-gray-700">{restriction}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Attribution Tracking Info (Debug) */}
                {attributionData && (
                    <div className="bg-gray-100 rounded-lg p-4 mt-8">
                        <h4 className="font-semibold text-gray-700 mb-2">📊 Datos de Tracking (Debug)</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Fuente:</strong> {attributionData.source}</p>
                            <p><strong>Referente:</strong> {attributionData.referrerName}</p>
                            <p><strong>Campaign:</strong> {attributionData.campaign || 'N/A'}</p>
                            <p><strong>Medium:</strong> {attributionData.medium}</p>
                            <p><strong>Timestamp:</strong> {new Date(attributionData.timestamp).toLocaleString()}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CouponPage;
