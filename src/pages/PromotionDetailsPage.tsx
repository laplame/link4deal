import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatPrice, calculateDiscountPercentage } from '../utils/formatters';
import { 
    ArrowLeft, 
    Heart, 
    Star, 
    ShoppingCart, 
    Share2, 
    Truck, 
    Shield, 
    Clock, 
    MapPin, 
    FileText, 
    ExternalLink,
    Copy,
    CheckCircle,
    AlertCircle,
    TrendingUp,
    Users,
    Zap,
    Lock,
    MessageCircle,
    Info
} from 'lucide-react';
import CouponRequestForm from '../components/CouponRequestForm';
import DiscountHistoryTimeline from '../components/DiscountHistoryTimeline';
import { getPromotionImageUrl } from '../utils/promotionImage';

interface SmartContract {
    address: string;
    network: string;
    tokenStandard: string;
    blockchainExplorer: string;
    totalSupply: string;
    circulatingSupply: string;
    holders: number;
    transactions: number;
    lastUpdated: string;
    contractVerified: boolean;
    sourceCode: string;
}

interface ProductDetails {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    currency: string;
    image: string;
    offer: string;
    category: string;
    brand: string;
    rating: number;
    reviewCount: number;
    stock: number;
    location: string;
    shipping: string;
    warranty: string;
    tags: string[];
    description: string;
    features: string[];
    seller: {
        name: string;
        rating: number;
        verified: boolean;
        address: string;
        totalSales: number;
        memberSince: string;
    };
    specifications: Record<string, string | undefined>;
    smartContract: SmartContract;
    promotionDetails: {
        startDate: string;
        endDate: string;
        maxQuantity: number;
        soldQuantity: number;
        terms: string[];
        benefits: string[];
        restrictions: string[];
    };
}

export default function PromotionDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const [product, setProduct] = useState<ProductDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [copiedAddress, setCopiedAddress] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [showCouponForm, setShowCouponForm] = useState(false);
    const [showAddedToCart, setShowAddedToCart] = useState(false);
    const [priceHistory, setPriceHistory] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const { addItem, state } = useCart();

    // Cargar promoción desde la API
    useEffect(() => {
        const fetchPromotion = async () => {
            if (!id) {
                setError('ID de promoción no proporcionado');
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(`/api/promotions/${id}`);
                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.message || 'Error al cargar la promoción');
                }

                const promo = data.data;

                // Calcular descuento
                const originalPrice = promo.originalPrice || 0;
                const currentPrice = promo.currentPrice || 0;
                const discountPercentage = promo.discountPercentage || 
                    (originalPrice > 0 ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0);

                // Mapeo de categorías
                const categoryMap: { [key: string]: string } = {
                    'electronics': 'Electrónicos',
                    'fashion': 'Moda',
                    'sports': 'Deportes',
                    'beauty': 'Belleza',
                    'home': 'Hogar',
                    'books': 'Libros',
                    'food': 'Comida',
                    'other': 'Otros'
                };

                // Transformar datos de la API al formato esperado
                const transformedProduct: ProductDetails = {
                    id: promo._id || promo.id,
                    name: promo.title || promo.productName || 'Sin título',
                    price: currentPrice,
                    originalPrice: originalPrice > 0 ? originalPrice : undefined,
                    currency: promo.currency || 'MXN',
                    image: getPromotionImageUrl(promo.images, 'https://via.placeholder.com/800x600'),
                    offer: discountPercentage > 0 ? `${discountPercentage}% de descuento` : 'Oferta especial',
                    category: categoryMap[promo.category] || promo.category || 'Otros',
                    brand: promo.brand || 'Sin marca',
                    rating: 4.5, // Valor por defecto
                    reviewCount: promo.views || 0,
                    stock: promo.stock || promo.totalQuantity || 0,
                    location: promo.storeLocation?.city 
                        ? `${promo.storeLocation.city}, ${promo.storeLocation.country || 'México'}`
                        : promo.storeLocation?.address || 'CDMX, México',
                    shipping: 'Envío disponible',
                    warranty: 'Garantía incluida',
                    tags: promo.tags || [],
                    description: promo.description || 'Promoción especial disponible',
                    features: promo.features || promo.tags?.slice(0, 5) || [],
                    seller: {
                        name: promo.storeName || promo.seller?.name || promo.brand || 'Tienda',
                        rating: 4.5,
                        verified: promo.seller?.verified || false,
                        address: promo.seller?.address || '0x0000000000000000000000000000000000000000',
                        totalSales: promo.conversions || 0,
                        memberSince: promo.createdAt ? new Date(promo.createdAt).toISOString().split('T')[0] : '2024-01-01'
                    },
                    specifications: promo.specifications || {
                        'Categoría': categoryMap[promo.category] || promo.category,
                        'Marca': promo.brand,
                        'Descuento': `${discountPercentage}%`
                    },
                    smartContract: {
                        address: promo.smartContract?.address || '0x0000000000000000000000000000000000000000',
                        network: promo.smartContract?.network || 'Ethereum Mainnet',
                        tokenStandard: promo.smartContract?.tokenStandard || 'ERC-777',
                        blockchainExplorer: promo.smartContract?.blockchainExplorer || 'https://etherscan.io',
                        totalSupply: promo.smartContract?.totalSupply || '1,000,000 L4D',
                        circulatingSupply: promo.smartContract?.circulatingSupply || '750,000 L4D',
                        holders: promo.smartContract?.holders || 0,
                        transactions: promo.smartContract?.transactions || 0,
                        lastUpdated: promo.updatedAt || new Date().toISOString(),
                        contractVerified: promo.smartContract?.contractVerified || false,
                        sourceCode: promo.smartContract?.sourceCode || 'https://github.com/link4deal/smart-contracts'
                    },
                    promotionDetails: {
                        startDate: promo.validFrom ? new Date(promo.validFrom).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                        endDate: promo.validUntil ? new Date(promo.validUntil).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        maxQuantity: promo.maxQuantity || promo.totalQuantity || 1000,
                        soldQuantity: promo.soldQuantity || promo.conversions || 0,
                        terms: promo.terms || [
                            'Oferta válida hasta agotar existencias',
                            'Precio especial solo para usuarios registrados',
                            'Envío disponible'
                        ],
                        benefits: promo.benefits || [
                            `Descuento del ${discountPercentage}% sobre precio original`,
                            'Envío disponible',
                            'Garantía incluida'
                        ],
                        restrictions: promo.restrictions || [
                            'Oferta válida mientras duren existencias',
                            'No combinable con otros descuentos'
                        ]
                    }
                };

                setProduct(transformedProduct);
            } catch (err: any) {
                console.error('Error cargando promoción:', err);
                setError(err.message || 'No se pudo cargar la promoción');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPromotion();
    }, [id]);

    // Cargar historial de precios
    useEffect(() => {
        const fetchPriceHistory = async () => {
            if (!id) return;

            setIsLoadingHistory(true);
            try {
                const response = await fetch(`/api/promotions/${id}/history`);
                const data = await response.json();

                if (data.success && data.data.history) {
                    setPriceHistory(data.data.history);
                }
            } catch (error) {
                console.error('Error cargando historial de precios:', error);
            } finally {
                setIsLoadingHistory(false);
            }
        };

        if (product) {
            fetchPriceHistory();
        }
    }, [id, product]);

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedAddress(true);
            setTimeout(() => setCopiedAddress(false), 2000);
        } catch (err) {
            console.error('Error copying to clipboard:', err);
        }
    };



    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando promoción...</p>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar la promoción</h1>
                    <p className="text-gray-600 mb-6">{error || 'La promoción no se pudo cargar'}</p>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver al inicio
                    </Link>
                </div>
            </div>
        );
    }

    const discountPercentage = product.originalPrice 
        ? calculateDiscountPercentage(product.originalPrice, product.price)
        : 0;

    const handleAddToCart = () => {
        addItem({
            id: product.id,
            name: product.name,
            price: product.price,
            currency: product.currency,
            image: product.image
        });
        
        // Mostrar feedback visual
        setShowAddedToCart(true);
        setTimeout(() => setShowAddedToCart(false), 3000);
    };

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                className={`h-5 w-5 ${
                    i < Math.floor(rating) 
                        ? 'text-yellow-400 fill-current' 
                        : 'text-gray-300'
                }`}
            />
        ));
    };

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
                                <h1 className="text-2xl font-bold text-gray-900">Detalles de la Promoción</h1>
                                <p className="text-gray-600">Información completa del producto y smart contract</p>
                            </div>
                        </div>
                        
                        {/* Cart Button */}
                        <Link
                            to="/cart"
                            className="relative bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <ShoppingCart className="h-6 w-6" />
                            {state.items.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                                    {state.items.length}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Product Info */}
                    <div className="lg:col-span-2">
                        {/* Product Images & Basic Info */}
                        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-80 object-cover rounded-lg"
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                            {product.category}
                                        </span>
                                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                            {product.offer}
                                        </span>
                                    </div>
                                    
                                    <h2 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h2>
                                    
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="flex items-center gap-1">
                                            {renderStars(product.rating)}
                                            <span className="text-gray-600 ml-2">({product.reviewCount} reviews)</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 mb-6">
                                        <span className="text-4xl font-bold text-blue-600">
                                            {formatPrice(product.price, product.currency)}
                                        </span>
                                        {product.originalPrice && (
                                            <span className="text-2xl text-gray-400 line-through">
                                                {formatPrice(product.originalPrice, product.currency)}
                                            </span>
                                        )}
                                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                            -{discountPercentage}%
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <MapPin className="h-4 w-4" />
                                            <span>Ubicación: {product.location}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Truck className="h-4 w-4" />
                                            <span>Envío: {product.shipping}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Shield className="h-4 w-4" />
                                            <span>Garantía: {product.warranty}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Clock className="h-4 w-4" />
                                            <span>Stock: {product.stock} unidades disponibles</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowCouponForm(true)}
                                            className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <MessageCircle className="h-5 w-5" />
                                            Solicitar Cupón
                                        </button>
                                        <button
                                            onClick={() => setIsWishlisted(!isWishlisted)}
                                            className={`p-3 rounded-lg border transition-colors ${
                                                isWishlisted 
                                                    ? 'border-red-500 text-red-500' 
                                                    : 'border-gray-300 text-gray-600 hover:border-red-500 hover:text-red-500'
                                            }`}
                                        >
                                            <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
                                        </button>
                                        <button className="p-3 rounded-lg border border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors">
                                            <Share2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                    
                                    {/* Información sobre el proceso de compra */}
                                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-start gap-3">
                                            <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-blue-800 font-medium mb-1">
                                                    Proceso de Compra
                                                </p>
                                                <p className="text-blue-700 text-sm">
                                                    Para comprar este producto, primero solicita tu cupón de descuento. 
                                                    Después del registro, podrás agregar el producto al carrito con el cupón aplicado.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Feedback de producto agregado al carrito */}
                                    {showAddedToCart && (
                                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                            <span className="text-green-700 font-medium">
                                                ¡Producto agregado al carrito exitosamente!
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tabs Navigation */}
                        <div className="bg-white rounded-xl shadow-lg mb-8">
                            <div className="border-b border-gray-200">
                                <nav className="flex space-x-8 px-6">
                                    {[
                                        { id: 'overview', label: 'Descripción General', icon: TrendingUp },
                                        { id: 'smart-contract', label: 'Smart Contract', icon: FileText },
                                        { id: 'promotion', label: 'Detalles Promoción', icon: Zap },
                                        { id: 'history', label: 'Historial de Precios', icon: Clock },
                                        { id: 'seller', label: 'Información Vendedor', icon: Users },
                                        { id: 'specifications', label: 'Especificaciones', icon: Lock }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                                                activeTab === tab.id
                                                    ? 'border-blue-500 text-blue-600'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                        >
                                            <tab.icon className="h-4 w-4" />
                                            {tab.label}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                            
                            <div className="p-6">
                                {/* Overview Tab */}
                                {activeTab === 'overview' && (
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Descripción del Producto</h3>
                                        <p className="text-gray-700 mb-6 leading-relaxed">{product.description}</p>
                                        
                                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Características Principales</h4>
                                        <div className="grid grid-cols-2 gap-3 mb-6">
                                            {product.features.map((feature, index) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                    <span className="text-gray-700">{feature}</span>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Tags</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {product.tags.map((tag, index) => (
                                                <span key={index} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Smart Contract Tab */}
                                {activeTab === 'smart-contract' && (
                                    <div>
                                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <FileText className="h-6 w-6 text-purple-600" />
                                                <h3 className="text-xl font-semibold text-purple-900">Smart Contract ERC-777</h3>
                                            </div>
                                            <p className="text-purple-700 mb-4">
                                                Este producto está respaldado por un smart contract en la blockchain de Ethereum, 
                                                garantizando transparencia y seguridad en todas las transacciones.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Dirección del Contrato</label>
                                                    <div className="flex items-center gap-2">
                                                        <code className="flex-1 bg-gray-100 text-gray-800 px-3 py-2 rounded font-mono text-sm">
                                                            {product.smartContract.address}
                                                        </code>
                                                        <button
                                                            onClick={() => copyToClipboard(product.smartContract.address)}
                                                            className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                                                        >
                                                            {copiedAddress ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Red Blockchain</label>
                                                    <div className="bg-gray-100 px-3 py-2 rounded">
                                                        <span className="text-gray-800">{product.smartContract.network}</span>
                                                    </div>
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Estándar de Token</label>
                                                    <div className="bg-gray-100 px-3 py-2 rounded">
                                                        <span className="text-gray-800">{product.smartContract.tokenStandard}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Suministro Total</label>
                                                    <div className="bg-gray-100 px-3 py-2 rounded">
                                                        <span className="text-gray-800">{product.smartContract.totalSupply}</span>
                                                    </div>
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">En Circulación</label>
                                                    <div className="bg-gray-100 px-3 py-2 rounded">
                                                        <span className="text-gray-800">{product.smartContract.circulatingSupply}</span>
                                                    </div>
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Holders</label>
                                                    <div className="bg-gray-100 px-3 py-2 rounded">
                                                        <span className="text-gray-800">{product.smartContract.holders.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 space-y-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-700">Estado del Contrato:</span>
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                    product.smartContract.contractVerified 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {product.smartContract.contractVerified ? (
                                                        <>
                                                            <CheckCircle className="h-3 w-3" />
                                                            Verificado
                                                        </>
                                                    ) : (
                                                        <>
                                                            <AlertCircle className="h-3 w-3" />
                                                            No Verificado
                                                        </>
                                                    )}
                                                </span>
                                            </div>
                                            
                                            <div className="flex gap-3">
                                                <a
                                                    href={product.smartContract.blockchainExplorer}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                    Ver en Blockchain Explorer
                                                </a>
                                                
                                                <a
                                                    href={product.smartContract.sourceCode}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                                                >
                                                    <FileText className="h-4 w-4" />
                                                    Ver Código Fuente
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* History Tab */}
                                {activeTab === 'history' && (
                                    <div>
                                        {isLoadingHistory ? (
                                            <div className="flex items-center justify-center py-12">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                                <span className="ml-3 text-gray-600">Cargando historial...</span>
                                            </div>
                                        ) : (
                                            <DiscountHistoryTimeline
                                                promotionId={id || ''}
                                                brand={product.brand}
                                                currentPrice={product.price}
                                                originalPrice={product.originalPrice}
                                                currency={product.currency}
                                                history={priceHistory}
                                            />
                                        )}
                                    </div>
                                )}

                                {/* Promotion Tab */}
                                {activeTab === 'promotion' && (
                                    <div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                            <div>
                                                <h4 className="text-lg font-semibold text-gray-900 mb-3">Período de la Promoción</h4>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Inicio:</span>
                                                        <span className="font-medium">{new Date(product.promotionDetails.startDate).toLocaleDateString('es-ES')}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Fin:</span>
                                                        <span className="font-medium">{new Date(product.promotionDetails.endDate).toLocaleDateString('es-ES')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <h4 className="text-lg font-semibold text-gray-900 mb-3">Inventario</h4>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Disponible:</span>
                                                        <span className="font-medium">{product.promotionDetails.maxQuantity - product.promotionDetails.soldQuantity}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Vendido:</span>
                                                        <span className="font-medium">{product.promotionDetails.soldQuantity}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="mt-3">
                                                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                                                        <span>Progreso de venta</span>
                                                        <span>{Math.round((product.promotionDetails.soldQuantity / product.promotionDetails.maxQuantity) * 100)}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                            style={{ width: `${(product.promotionDetails.soldQuantity / product.promotionDetails.maxQuantity) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div>
                                                <h4 className="text-lg font-semibold text-gray-900 mb-3 text-green-700">Términos y Condiciones</h4>
                                                <ul className="space-y-2">
                                                    {product.promotionDetails.terms.map((term, index) => (
                                                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                                                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                            <span>{term}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            
                                            <div>
                                                <h4 className="text-lg font-semibold text-gray-900 mb-3 text-blue-700">Beneficios Incluidos</h4>
                                                <ul className="space-y-2">
                                                    {product.promotionDetails.benefits.map((benefit, index) => (
                                                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                                                            <Zap className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                                            <span>{benefit}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            
                                            <div>
                                                <h4 className="text-lg font-semibold text-gray-900 mb-3 text-orange-700">Restricciones</h4>
                                                <ul className="space-y-2">
                                                    {product.promotionDetails.restrictions.map((restriction, index) => (
                                                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                                                            <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                                            <span>{restriction}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Seller Tab */}
                                {activeTab === 'seller' && (
                                    <div>
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <span className="text-blue-600 text-2xl font-bold">
                                                        {product.seller.name.charAt(0)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-semibold text-blue-900">{product.seller.name}</h3>
                                                    <div className="flex items-center gap-2">
                                                        {renderStars(product.seller.rating)}
                                                        <span className="text-blue-700">({product.seller.rating})</span>
                                                        {product.seller.verified && (
                                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                                                Verificado
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <h4 className="text-lg font-semibold text-gray-900 mb-3">Información del Vendedor</h4>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Dirección:</span>
                                                        <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                                                            {product.seller.address.slice(0, 10)}...{product.seller.address.slice(-8)}
                                                        </code>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Ventas Totales:</span>
                                                        <span className="font-medium">{product.seller.totalSales.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Miembro desde:</span>
                                                        <span className="font-medium">{new Date(product.seller.memberSince).toLocaleDateString('es-ES')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <h4 className="text-lg font-semibold text-gray-900 mb-3">Estadísticas</h4>
                                                <div className="space-y-3">
                                                    <div className="bg-gray-50 p-4 rounded-lg">
                                                        <div className="text-2xl font-bold text-blue-600">{product.seller.rating}</div>
                                                        <div className="text-sm text-gray-600">Rating Promedio</div>
                                                    </div>
                                                    <div className="bg-gray-50 p-4 rounded-lg">
                                                        <div className="text-2xl font-bold text-green-600">{product.seller.totalSales.toLocaleString()}</div>
                                                        <div className="text-sm text-gray-600">Productos Vendidos</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Specifications Tab */}
                                {activeTab === 'specifications' && (
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Especificaciones Técnicas</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {Object.entries(product.specifications).map(([key, value]) => (
                                                <div key={key} className="flex justify-between py-3 border-b border-gray-200">
                                                    <span className="font-medium text-gray-700">{key}:</span>
                                                    <span className="text-gray-900">{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Smart Contract & Actions */}
                    <div className="lg:col-span-1">
                        {/* Smart Contract Summary */}
                        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-purple-600" />
                                Smart Contract
                            </h3>
                            
                            <div className="space-y-3 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Red:</span>
                                    <span className="font-medium">{product.smartContract.network}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Estándar:</span>
                                    <span className="font-medium">{product.smartContract.tokenStandard}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Estado:</span>
                                    <span className={`font-medium ${
                                        product.smartContract.contractVerified ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {product.smartContract.contractVerified ? 'Verificado' : 'No Verificado'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="border-t pt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Dirección del Contrato</label>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 bg-gray-100 text-gray-800 px-3 py-2 rounded font-mono text-xs">
                                        {product.smartContract.address.slice(0, 10)}...{product.smartContract.address.slice(-8)}
                                    </code>
                                    <button
                                        onClick={() => copyToClipboard(product.smartContract.address)}
                                        className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                                    >
                                        {copiedAddress ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="mt-4 space-y-2">
                                <a
                                    href={product.smartContract.blockchainExplorer}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full inline-flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Ver en Explorer
                                </a>
                            </div>
                        </div>

                        {/* Promotion Summary */}
                        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Zap className="h-5 w-5 text-yellow-600" />
                                Resumen de Promoción
                            </h3>
                            
                            <div className="space-y-3 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Descuento:</span>
                                    <span className="font-medium text-green-600">-{discountPercentage}%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Precio Original:</span>
                                    <span className="font-medium line-through">{formatPrice(product.originalPrice || 0, product.currency)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Precio Final:</span>
                                    <span className="font-medium text-blue-600 text-lg">{formatPrice(product.price, product.currency)}</span>
                                </div>
                            </div>
                            
                            <div className="border-t pt-4">
                                <div className="text-sm text-gray-600 mb-2">Progreso de venta</div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                    <div 
                                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${(product.promotionDetails.soldQuantity / product.promotionDetails.maxQuantity) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>{product.promotionDetails.soldQuantity} vendidos</span>
                                    <span>{product.promotionDetails.maxQuantity - product.promotionDetails.soldQuantity} disponibles</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
                            
                            <div className="space-y-3">
                                <button className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                                    <Heart className="h-5 w-5" />
                                    Agregar a Favoritos
                                </button>
                                
                                <button className="w-full bg-green-100 text-green-700 py-3 px-4 rounded-lg font-medium hover:bg-green-200 transition-colors flex items-center justify-center gap-2">
                                    <Share2 className="h-5 w-5" />
                                    Compartir Oferta
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Coupon Request Form Modal */}
            {showCouponForm && product && (
                <CouponRequestForm
                    productId={product.id}
                    productName={product.name}
                    productPrice={product.price}
                    productCurrency={product.currency}
                    productImage={product.image}
                    onClose={() => setShowCouponForm(false)}
                />
            )}
        </div>
    );
}
