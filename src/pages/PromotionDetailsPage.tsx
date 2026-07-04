import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { apiUrl } from '../utils/apiUrl';
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
    Info,
    ZoomIn,
    X,
    MessageSquare,
    ShieldCheck
} from 'lucide-react';
import PageSeo from '../components/seo/PageSeo';
import {
    buildPromotionMetaDescription,
    buildPromotionOfferJsonLd,
    buildPromotionPageTitle,
} from '../utils/promotionSeo';
import { promotionAbsoluteUrl, promotionDetailPath } from '../utils/promotionPublicUrl';
import CouponRequestForm from '../components/CouponRequestForm';
import DiscountHistoryTimeline from '../components/DiscountHistoryTimeline';
import { getPromotionImageUrl } from '../utils/promotionImage';
import { findNearestChainBranch, resolveBranchMapsUrl, normalizeChainBranchesFromApi, type ChainBranch } from '../utils/geo';
import { getPolygonscanAddressUrl } from '../utils/polygonExplorer';
import PromotionAttributionContractDisplay, {
    hasAttributionContract,
    PromotionAttributionContractEmptyState,
    type AttributionContractView
} from '../components/promo/PromotionAttributionContractDisplay';
import AmazonAffiliateComplianceNotice from '../components/promo/AmazonAffiliateComplianceNotice';
import {
    AMAZON_MX_STORE_LABEL,
    buildAmazonRedirectUrl,
    isAmazonPromotion,
} from '../utils/amazonPromotion';

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
        phone?: string;
        totalSales: number;
        memberSince: string;
    };
    publicSlug?: string;
    publicUrl?: string;
    promotionKind?: 'verification_only' | 'with_deal';
    hasDeal?: boolean;
    showRedeemButton?: boolean;
    communityVerificationBadgeLabel?: string;
    thirdPartyDisclaimers?: {
        es?: { notNative?: string; noContract?: string };
    };
    isExpired?: boolean;
    status?: string;
    redirectInsteadOfQr?: boolean;
    redirectToUrl?: string;
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
    /** Activación solo cerca de coordenadas de tienda (GPS) */
    activateByGps?: boolean;
    gpsRadiusMeters?: number;
    promotionLat?: number | null;
    promotionLng?: number | null;
    /** Cadena (varias sucursales); GPS usa la más cercana si hay permiso de ubicación */
    isChainStore?: boolean;
    chainBrandName?: string;
    chainLocations?: ChainBranch[];
    attributionContract?: AttributionContractView | null;
}

function buildWhatsAppUrl(phone: string, message: string): string {
    const digits = phone.replace(/\D/g, '');
    if (!digits) return '';
    const normalized = digits.length === 10 ? `52${digits}` : digits;
    return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export default function PromotionDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<ProductDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [copiedAddress, setCopiedAddress] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [showCouponForm, setShowCouponForm] = useState(false);
    const [showAddedToCart] = useState(false);
    const [priceHistory, setPriceHistory] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [imageLightboxOpen, setImageLightboxOpen] = useState(false);
    const [nearestBranchInfo, setNearestBranchInfo] = useState<{
        branch: ChainBranch;
        distanceMeters: number;
    } | null>(null);
    const [chainGeoStatus, setChainGeoStatus] = useState<
        'idle' | 'loading' | 'ok' | 'denied' | 'unavailable'
    >('idle');
    const [shareCopied, setShareCopied] = useState(false);
    const [linkedProduct, setLinkedProduct] = useState<{ _id: string; name: string; price: number; originalPrice?: number; currency: string; images: Array<{ path: string; isPrimary?: boolean }>; brand?: { name?: string } } | null>(null);
    const { state, addItem } = useCart();

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
                const validUntilDate = promo.validUntil ? new Date(promo.validUntil) : null;
                const isExpired =
                    promo.status === 'expired' ||
                    (validUntilDate != null && validUntilDate.getTime() < Date.now());

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
                    currency: promo.currency || 'USD',
                    image: getPromotionImageUrl(promo.images),
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
                        phone: promo.seller?.phone ? String(promo.seller.phone) : undefined,
                        totalSales: promo.conversions || 0,
                        memberSince: promo.createdAt ? new Date(promo.createdAt).toISOString().split('T')[0] : '2024-01-01'
                    },
                    publicSlug: promo.publicSlug ? String(promo.publicSlug) : undefined,
                    publicUrl: promo.publicUrl ? String(promo.publicUrl) : undefined,
                    promotionKind: promo.promotionKind,
                    hasDeal: promo.hasDeal,
                    showRedeemButton: promo.showRedeemButton,
                    communityVerificationBadgeLabel: promo.communityVerificationBadgeLabel
                        ? String(promo.communityVerificationBadgeLabel)
                        : undefined,
                    thirdPartyDisclaimers: promo.thirdPartyDisclaimers,
                    isExpired,
                    status: promo.status,
                    redirectInsteadOfQr: !!promo.redirectInsteadOfQr,
                    redirectToUrl: promo.redirectToUrl ? String(promo.redirectToUrl) : '',
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
                        terms: promo.termsAndConditions
                            ? String(promo.termsAndConditions)
                                  .split(/\n+/)
                                  .map((t: string) => t.trim())
                                  .filter(Boolean)
                            : promo.terms || [
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
                    },
                    activateByGps: !!promo.activateByGps,
                    gpsRadiusMeters: typeof promo.gpsRadiusMeters === 'number' ? promo.gpsRadiusMeters : 500,
                    promotionLat: promo.storeLocation?.coordinates?.latitude ?? null,
                    promotionLng: promo.storeLocation?.coordinates?.longitude ?? null,
                    isChainStore: !!promo.isChainStore,
                    chainBrandName: promo.chainBrandName ? String(promo.chainBrandName) : '',
                    chainLocations: normalizeChainBranchesFromApi(promo.chainLocations),
                    attributionContract: promo.attributionContract || null
                };

                setProduct(transformedProduct);

                const canonicalSlug = promo.publicSlug ? String(promo.publicSlug) : '';
                if (
                    canonicalSlug &&
                    id &&
                    id !== canonicalSlug &&
                    /^[a-f0-9]{24}$/i.test(id)
                ) {
                    navigate(promotionDetailPath({ publicSlug: canonicalSlug }), { replace: true });
                }
            } catch (err: any) {
                console.error('Error cargando promoción:', err);
                setError(err.message || 'No se pudo cargar la promoción');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPromotion();
    }, [id]);

    const chainBranchesWithCoords = useMemo(
        () => (product ? normalizeChainBranchesFromApi(product.chainLocations) : []),
        [product?.chainLocations]
    );

    useEffect(() => {
        if (!product) {
            setChainGeoStatus('idle');
            setNearestBranchInfo(null);
            return;
        }
        const coordBranches = chainBranchesWithCoords;
        if (coordBranches.length === 0) {
            setChainGeoStatus('idle');
            setNearestBranchInfo(null);
            return;
        }
        if (coordBranches.length === 1) {
            setNearestBranchInfo({ branch: coordBranches[0], distanceMeters: 0 });
            setChainGeoStatus('ok');
            return;
        }
        setChainGeoStatus('loading');
        setNearestBranchInfo(null);
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            setChainGeoStatus('unavailable');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const r = findNearestChainBranch(
                    pos.coords.latitude,
                    pos.coords.longitude,
                    coordBranches
                );
                if (r) setNearestBranchInfo(r);
                setChainGeoStatus('ok');
            },
            () => setChainGeoStatus('denied'),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 120000 }
        );
    }, [product?.id, chainBranchesWithCoords]);

    // Buscar producto de nuestra tienda vinculado a esta promoción
    useEffect(() => {
        if (!product?.id) return;
        fetch(apiUrl(`/api/products/by-promotion/${product.id}`))
            .then(r => r.json())
            .then(d => {
                if (d.success && d.data?.length > 0) setLinkedProduct(d.data[0]);
            })
            .catch(() => {});
    }, [product?.id]);

    // Cargar historial de precios
    useEffect(() => {
        const fetchPriceHistory = async () => {
            // Usar el id real de la promoción ya cargada (no el slug de la URL),
            // porque el endpoint /history espera un ObjectId.
            const historyId = product?.id || id;
            if (!historyId) return;

            setIsLoadingHistory(true);
            try {
                const response = await fetch(`/api/promotions/${historyId}/history`);
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

    useEffect(() => {
        if (!imageLightboxOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setImageLightboxOpen(false);
        };
        window.addEventListener('keydown', onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [imageLightboxOpen]);

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

    const isVerificationOnly =
        product.promotionKind === 'verification_only' || product.hasDeal === false;
    const isAmazon = isAmazonPromotion(product);
    const canRedeemCoupon = product.showRedeemButton !== false && !product.isExpired;
    const dameCodigoSlotsRemaining = Math.max(
        0,
        (product.promotionDetails.maxQuantity || 0) - (product.promotionDetails.soldQuantity || 0),
    );
    const amazonSlotsExhausted = isAmazon && dameCodigoSlotsRemaining <= 0;

    const handleAmazonRedirect = () => {
        const url = buildAmazonRedirectUrl(product.redirectToUrl);
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    // Agrega el producto vinculado al carrito y lleva al checkout de la tienda
    const handleAddLinkedToCart = () => {
        if (!product) return;
        const cartItem = linkedProduct
            ? {
                id: linkedProduct._id,
                name: linkedProduct.name,
                price: linkedProduct.price,
                currency: linkedProduct.currency,
                image: linkedProduct.images?.find(i => i.isPrimary)?.path || linkedProduct.images?.[0]?.path || product.image,
                originalPrice: linkedProduct.originalPrice,
                brand: linkedProduct.brand?.name,
            }
            : {
                // fallback: usar datos de la promoción directamente
                id: product.id,
                name: product.name,
                price: product.price,
                currency: product.currency,
                image: product.image,
                originalPrice: product.originalPrice,
                brand: product.brand !== 'Sin marca' ? product.brand : undefined,
            };
        addItem(cartItem);
        navigate('/tienda/checkout');
    };

    const seoInput = {
        id: product.id,
        publicSlug: product.publicSlug,
        title: product.name,
        description: product.description,
        brand: product.brand,
        storeName: product.seller.name,
        discountPercentage,
        currentPrice: product.price,
        originalPrice: product.originalPrice,
        currency: product.currency,
        validUntil: product.promotionDetails.endDate,
        image: product.image,
        storeLocation: {
            city: product.location.split(',')[0]?.trim(),
            address: product.location,
        },
        isExpired: product.isExpired,
    };

    const whatsAppUrl = product.seller.phone
        ? buildWhatsAppUrl(
              product.seller.phone,
              `Hola, vi la promoción "${product.name}" en DameCodigo y me interesa.`
          )
        : '';

    const handleShare = async () => {
        const url = product.publicUrl || promotionAbsoluteUrl(product);
        try {
            if (navigator.share) {
                await navigator.share({ title: product.name, url });
                return;
            }
        } catch {
            /* cancelado */
        }
        try {
            await navigator.clipboard.writeText(url);
            setShareCopied(true);
            window.setTimeout(() => setShareCopied(false), 2000);
        } catch {
            /* ignore */
        }
    };

    const couponLat =
        nearestBranchInfo?.branch.coordinates.latitude ??
        (product.promotionLat != null ? product.promotionLat : undefined) ??
        chainBranchesWithCoords[0]?.coordinates.latitude;
    const couponLng =
        nearestBranchInfo?.branch.coordinates.longitude ??
        (product.promotionLng != null ? product.promotionLng : undefined) ??
        chainBranchesWithCoords[0]?.coordinates.longitude;

    const waitingForNearest =
        !!product.activateByGps &&
        chainBranchesWithCoords.length > 1 &&
        chainGeoStatus === 'loading';

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
            <PageSeo
                title={buildPromotionPageTitle(seoInput)}
                description={buildPromotionMetaDescription(seoInput)}
                canonicalUrl={product.publicUrl || promotionAbsoluteUrl(product)}
                ogImage={product.image}
                ogType="product"
                noindex={!!product.isExpired}
                jsonLd={buildPromotionOfferJsonLd(seoInput)}
            />

            {product.isExpired && (
                <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <p className="text-sm text-amber-900">
                            <strong>Esta promoción ya no está vigente.</strong> La información se muestra solo como referencia.
                        </p>
                        <Link
                            to="/marketplace"
                            className="text-sm font-medium text-amber-800 underline hover:text-amber-950 shrink-0"
                        >
                            Ver promociones activas
                        </Link>
                    </div>
                </div>
            )}

            {isVerificationOnly && (
                <div className="bg-violet-50 border-b border-violet-200 px-4 py-3">
                    <div className="max-w-7xl mx-auto flex items-start gap-2 text-sm text-violet-900">
                        <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" aria-hidden />
                        <div>
                            {product.communityVerificationBadgeLabel && (
                                <p className="font-semibold">{product.communityVerificationBadgeLabel}</p>
                            )}
                            <p>{product.thirdPartyDisclaimers?.es?.notNative || 'Oferta de tercero verificada por la comunidad.'}</p>
                            {product.thirdPartyDisclaimers?.es?.noContract && (
                                <p className="text-violet-800/90 mt-1">{product.thirdPartyDisclaimers.es.noContract}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isAmazon && (
                <AmazonAffiliateComplianceNotice
                    variant="banner"
                    dameCodigoSlotsRemaining={dameCodigoSlotsRemaining}
                />
            )}

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
                    <div className="lg:col-span-2 min-w-0">
                        {/* Product Images & Basic Info */}
                        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => setImageLightboxOpen(true)}
                                        className="relative w-full rounded-lg overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 group"
                                        aria-label={`Ver foto ampliada: ${product.name}`}
                                    >
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-80 object-cover rounded-lg transition-opacity group-hover:opacity-95 cursor-zoom-in"
                                        />
                                        <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/65 text-white text-xs font-medium px-2.5 py-1.5 pointer-events-none shadow-sm">
                                            <ZoomIn className="h-4 w-4 shrink-0" aria-hidden />
                                            Ampliar
                                        </span>
                                    </button>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                                        {isAmazon && (
                                            <span className="bg-[#FF9900] text-black px-3 py-1 rounded-full text-sm font-bold">
                                                {AMAZON_MX_STORE_LABEL}
                                            </span>
                                        )}
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
                                    
                                    <div className="flex items-center gap-4 mb-2 flex-wrap">
                                        <span className="text-4xl font-bold text-blue-600">
                                            {formatPrice(product.price, product.currency)}
                                        </span>
                                        {product.originalPrice && (
                                            <span className="text-2xl text-gray-400 line-through">
                                                {formatPrice(product.originalPrice, product.currency)}
                                            </span>
                                        )}
                                        {discountPercentage > 0 && (
                                            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                                -{discountPercentage}%
                                            </span>
                                        )}
                                    </div>
                                    {isAmazon && (
                                        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                                            <AmazonAffiliateComplianceNotice
                                                variant="priceNote"
                                                dameCodigoSlotsRemaining={dameCodigoSlotsRemaining}
                                            />
                                        </div>
                                    )}
                                    
                                    {!isAmazon && (
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
                                    )}

                                    {!isAmazon &&
                                    (product.isChainStore || chainBranchesWithCoords.length > 0) &&
                                        product.chainLocations &&
                                        product.chainLocations.length > 0 && (
                                            <div className="mb-6 p-4 rounded-lg border border-indigo-200 bg-indigo-50/90">
                                                <p className="text-sm font-semibold text-indigo-900">
                                                    Cadena:{' '}
                                                    {product.chainBrandName || product.seller.name}
                                                </p>
                                                <p className="text-xs text-indigo-800 mt-1">
                                                    {product.chainLocations.length} sucursales incluidas en esta
                                                    promoción.
                                                </p>
                                                {chainGeoStatus === 'loading' && (
                                                    <p className="text-xs text-indigo-700 mt-2">
                                                        Detectando la sucursal más cercana a tu ubicación…
                                                    </p>
                                                )}
                                                {nearestBranchInfo && (
                                                    <div className="mt-2 text-sm text-indigo-900">
                                                        <p>
                                                            Sucursal más cercana:{' '}
                                                            <strong>
                                                                {nearestBranchInfo.branch.branchName ||
                                                                    nearestBranchInfo.branch.city ||
                                                                    'Sucursal'}
                                                            </strong>{' '}
                                                            (
                                                            {(nearestBranchInfo.distanceMeters / 1000).toFixed(1)}{' '}
                                                            km)
                                                        </p>
                                                        <a
                                                            href={resolveBranchMapsUrl(nearestBranchInfo.branch)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-indigo-600 font-medium mt-1 hover:underline"
                                                        >
                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                            Cómo llegar (mapa)
                                                        </a>
                                                    </div>
                                                )}
                                                {chainGeoStatus === 'denied' && (
                                                    <p className="text-xs text-amber-900 mt-2">
                                                        Activa el permiso de ubicación para ver la sucursal más cercana
                                                        y validar el cupón en la tienda correcta.
                                                    </p>
                                                )}
                                                {chainGeoStatus === 'unavailable' && (
                                                    <p className="text-xs text-gray-600 mt-2">
                                                        Tu navegador no expone ubicación; se usará la primera sucursal
                                                        de la lista para el radio del cupón si aplica GPS.
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                    {!isAmazon && product.activateByGps && (
                                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                            <div className="flex items-start gap-2">
                                                <MapPin className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-medium text-amber-900">Activación por ubicación (GPS)</p>
                                                    <p className="text-sm text-amber-800 mt-1">
                                                        Para obtener el cupón debes permitir acceso a tu ubicación y estar dentro de{' '}
                                                        <strong>{product.gpsRadiusMeters ?? 500} m</strong>
                                                        {product.isChainStore && nearestBranchInfo
                                                            ? ' de la sucursal más cercana a ti.'
                                                            : product.promotionLat != null && product.promotionLng != null
                                                              ? ' del punto configurado para esta promoción.'
                                                              : ' del punto de la tienda (coordenadas pendientes en la promoción).'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="flex gap-3">
                                        {isAmazon ? (
                                            canRedeemCoupon && !amazonSlotsExhausted ? (
                                                <button
                                                    type="button"
                                                    onClick={handleAmazonRedirect}
                                                    className="flex-1 bg-[#FF9900] text-black py-3 px-6 rounded-lg font-semibold hover:bg-[#e88b00] transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <ExternalLink className="h-5 w-5" />
                                                    Ir a {AMAZON_MX_STORE_LABEL}
                                                </button>
                                            ) : (
                                                <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 text-center">
                                                    {product.isExpired
                                                        ? 'Promoción no vigente'
                                                        : amazonSlotsExhausted
                                                          ? 'Cupo de accesos DameCodigo agotado para esta campaña'
                                                          : 'Enlace no disponible'}
                                                </div>
                                            )
                                        ) : canRedeemCoupon ? (
                                            <button
                                                type="button"
                                                disabled={waitingForNearest}
                                                onClick={() => setShowCouponForm(true)}
                                                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <MessageCircle className="h-5 w-5" />
                                                {waitingForNearest ? 'Ubicando sucursal…' : 'Solicitar Cupón'}
                                            </button>
                                        ) : (
                                            <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 text-center">
                                                {product.isExpired
                                                    ? 'Cupón no disponible: promoción expirada'
                                                    : 'Esta oferta es solo informativa (sin cupón QR)'}
                                            </div>
                                        )}
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
                                        <button
                                            type="button"
                                            onClick={handleShare}
                                            className="p-3 rounded-lg border border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors"
                                            aria-label={shareCopied ? 'Enlace copiado' : 'Compartir oferta'}
                                        >
                                            {shareCopied ? (
                                                <CheckCircle className="h-5 w-5 text-green-600" />
                                            ) : (
                                                <Share2 className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>

                                    {whatsAppUrl && (
                                        <a
                                            href={whatsAppUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 py-2.5 px-4 text-sm font-medium hover:bg-emerald-100 transition-colors"
                                        >
                                            <MessageSquare className="h-4 w-4" />
                                            Contactar al comercio por WhatsApp
                                        </a>
                                    )}
                                    
                                    {/* Información sobre el proceso de compra */}
                                    <div className={`mt-4 p-4 rounded-lg border ${isAmazon ? 'bg-blue-50 border-blue-200' : 'bg-blue-50 border-blue-200'}`}>
                                        <div className="flex items-start gap-3">
                                            <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                {isAmazon ? (
                                                    <AmazonAffiliateComplianceNotice
                                                        variant="redirectNote"
                                                        dameCodigoSlotsRemaining={dameCodigoSlotsRemaining}
                                                    />
                                                ) : (
                                                    <>
                                                        <p className="text-blue-800 font-medium mb-1">
                                                            {linkedProduct ? 'Disponible en nuestra tienda' : 'Proceso de Compra'}
                                                        </p>
                                                        <p className="text-blue-700 text-sm">
                                                            {linkedProduct
                                                                ? 'Solicita tu cupón y desde ahí podrás agregarlo directamente al carrito para comprarlo en nuestra tienda con el descuento ya aplicado.'
                                                                : 'Para comprar este producto, primero solicita tu cupón de descuento. Después del registro, podrás agregar el producto al carrito con el cupón aplicado.'}
                                                        </p>
                                                        {linkedProduct && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowCouponForm(true)}
                                                                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 underline hover:text-blue-900"
                                                            >
                                                                Solicitar cupón y comprar →
                                                            </button>
                                                        )}
                                                    </>
                                                )}
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
                        <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
                            <div className="border-b border-gray-200 relative">
                                <div
                                    className="overflow-x-auto overscroll-x-contain [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]"
                                    aria-label="Secciones de la promoción"
                                >
                                    <nav className="flex flex-nowrap items-stretch gap-0 px-3 sm:px-6 min-w-max">
                                        {[
                                            { id: 'overview', label: 'Descripción General', shortLabel: 'General', icon: TrendingUp },
                                            { id: 'smart-contract', label: 'Smart Contract', shortLabel: 'Contract', icon: FileText },
                                            { id: 'promotion', label: 'Detalles Promoción', shortLabel: 'Promoción', icon: Zap },
                                            ...(hasAttributionContract(product.attributionContract)
                                                ? [{
                                                    id: 'attribution-contract',
                                                    label: 'Contrato de atribución',
                                                    shortLabel: 'Atribución',
                                                    icon: FileText
                                                }]
                                                : []),
                                            { id: 'history', label: 'Historial de Precios', shortLabel: 'Precios', icon: Clock },
                                            { id: 'seller', label: 'Información Vendedor', shortLabel: 'Vendedor', icon: Users },
                                            { id: 'specifications', label: 'Especificaciones', shortLabel: 'Especific.', icon: Lock }
                                        ].map((tab) => (
                                            <button
                                                key={tab.id}
                                                type="button"
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`shrink-0 py-3 sm:py-4 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap ${
                                                    activeTab === tab.id
                                                        ? 'border-blue-500 text-blue-600 bg-blue-50/40'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                }`}
                                            >
                                                <tab.icon className="h-4 w-4 shrink-0" />
                                                <span className="sm:hidden">{tab.shortLabel}</span>
                                                <span className="hidden sm:inline">{tab.label}</span>
                                            </button>
                                        ))}
                                    </nav>
                                </div>
                            </div>

                            <div className="p-4 sm:p-6 min-w-0">
                                {/* Overview Tab */}
                                {activeTab === 'overview' && (
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Descripción del Producto</h3>
                                        <p className="text-gray-700 mb-6 leading-relaxed">{product.description}</p>

                                        {isAmazon && (
                                            <AmazonAffiliateComplianceNotice
                                                variant="full"
                                                className="mb-6"
                                                dameCodigoSlotsRemaining={dameCodigoSlotsRemaining}
                                            />
                                        )}
                                        
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
                                                <h3 className="text-xl font-semibold text-purple-900">Smart contract (PSCS-1)</h3>
                                            </div>
                                            <p className="text-purple-700 mb-4">
                                                Resumen en esta pestaña. La ficha con inventario, emisión LUXAE y redenciones en
                                                vivo coincide con nuestra vista pública; desde ahí enlazamos a Polygonscan.
                                            </p>
                                            {id && (
                                                <Link
                                                    to={`/promocion/${id}/smart-contract`}
                                                    className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                                                >
                                                    Ver ficha del contrato y Polygonscan
                                                    <ExternalLink className="h-4 w-4" />
                                                </Link>
                                            )}
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
                                                    href={getPolygonscanAddressUrl(product.smartContract.address)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                    Ver en Polygonscan
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

                                        <div className="mt-8 pt-8 border-t border-gray-200">
                                            {hasAttributionContract(product.attributionContract) ? (
                                                <PromotionAttributionContractDisplay
                                                    contract={product.attributionContract!}
                                                    onCopy={copyToClipboard}
                                                    compact
                                                />
                                            ) : (
                                                <PromotionAttributionContractEmptyState brand={product.brand} />
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'attribution-contract' && hasAttributionContract(product.attributionContract) && (
                                    <PromotionAttributionContractDisplay
                                        contract={product.attributionContract!}
                                        onCopy={copyToClipboard}
                                    />
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
                                <Link
                                    to={`/promocion/${id}/smart-contract`}
                                    className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                                >
                                    <FileText className="h-4 w-4" />
                                    Ficha contrato (PSCS-1)
                                </Link>
                                <a
                                    href={getPolygonscanAddressUrl(product.smartContract.address)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full inline-flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Polygonscan
                                </a>
                            </div>
                        </div>

                        {hasAttributionContract(product.attributionContract) && (
                            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-indigo-600" />
                                    Contrato de atribución
                                </h3>
                                <p className="text-sm text-gray-600 mb-3">
                                    {product.attributionContract?.clientName} ↔ {product.attributionContract?.providerName}
                                    {product.attributionContract?.promotionTotalQuantity
                                        ? ` · ${product.attributionContract.promotionTotalQuantity} piezas`
                                        : ''}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('attribution-contract')}
                                    className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                                >
                                    <FileText className="h-4 w-4" />
                                    Ver contrato completo
                                </button>
                            </div>
                        )}

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
                                <div className="text-sm text-gray-600 mb-2">
                                    {isAmazon ? 'Cupo DameCodigo (no excedible)' : 'Progreso de venta'}
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                    <div 
                                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${product.promotionDetails.maxQuantity > 0 ? (product.promotionDetails.soldQuantity / product.promotionDetails.maxQuantity) * 100 : 0}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>
                                        {isAmazon
                                            ? `${product.promotionDetails.soldQuantity} accesos usados`
                                            : `${product.promotionDetails.soldQuantity} vendidos`}
                                    </span>
                                    <span>
                                        {isAmazon
                                            ? `${dameCodigoSlotsRemaining} disponibles en DameCodigo`
                                            : `${dameCodigoSlotsRemaining} disponibles`}
                                    </span>
                                </div>
                                {isAmazon && (
                                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                                        Este límite lo define DameCodigo para la campaña. No refleja el stock de Amazon
                                        ni garantiza precio ni disponibilidad en la tienda.
                                    </p>
                                )}
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
                                
                                <button
                                    type="button"
                                    onClick={handleShare}
                                    className="w-full bg-green-100 text-green-700 py-3 px-4 rounded-lg font-medium hover:bg-green-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Share2 className="h-5 w-5" />
                                    {shareCopied ? 'Enlace copiado' : 'Compartir Oferta'}
                                </button>
                                {whatsAppUrl && (
                                    <a
                                        href={whatsAppUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <MessageSquare className="h-5 w-5" />
                                        WhatsApp comercio
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Coupon Request Form Modal — no aplica a promociones Amazon (solo redirección) */}
            {showCouponForm && product && !isAmazon && (
                <CouponRequestForm
                    productId={product.id}
                    productName={product.name}
                    productPrice={product.price}
                    productCurrency={product.currency}
                    productImage={product.image}
                    brandId={product.brand}
                    discountPercentage={product.originalPrice && product.originalPrice > 0
                        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                        : undefined}
                    autoGenerateOnOpen={!product.activateByGps}
                    activateByGps={product.activateByGps}
                    gpsRadiusMeters={product.gpsRadiusMeters ?? 500}
                    promotionLat={couponLat}
                    promotionLng={couponLng}
                    chainLocations={chainBranchesWithCoords}
                    onClose={() => setShowCouponForm(false)}
                    onAddToCart={handleAddLinkedToCart}
                    promoPrice={linkedProduct ? linkedProduct.price : product.price}
                    promoCurrency={linkedProduct ? linkedProduct.currency : product.currency}
                />
            )}

            {imageLightboxOpen && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8 bg-black/85"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Foto de la promoción"
                    onClick={() => setImageLightboxOpen(false)}
                >
                    <button
                        type="button"
                        className="absolute top-4 right-4 z-10 rounded-full p-2 text-white hover:bg-white/15 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            setImageLightboxOpen(false);
                        }}
                        aria-label="Cerrar vista ampliada"
                    >
                        <X className="h-7 w-7" />
                    </button>
                    <img
                        src={product.image}
                        alt={product.name}
                        className="max-h-[min(90vh,900px)] max-w-full w-auto object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
