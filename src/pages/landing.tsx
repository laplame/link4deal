import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { Loader2, AlertCircle, Search, X } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import Toast from '../components/Toast';
import DownloadApp from '../components/DownloadApp';
import NewsSection from '../components/NewsSection';
import SpotifyPodcastEmbed from '../components/SpotifyPodcastEmbed';
import OffersMap from '../components/OffersMap';
import { useCart } from '../context/CartContext';
import { SITE_CONFIG } from '../config/site';
import { masonryTierFromId } from '../utils/masonryVariant';
import {
    mapPromoDocsToProductCards,
    type ProductCardItem as Product,
} from '../utils/mapPromotionToProductCard';

/** Resaltador claro sobre fondo oscuro del shell (estilo marcador). */
const LANDING_HIGHLIGHT =
    'box-decoration-clone bg-amber-100/95 text-gray-900 px-2 py-0.5 rounded-sm shadow-sm';
const LANDING_HIGHLIGHT_PANEL =
    'rounded-xl bg-amber-50/95 backdrop-blur-sm border border-amber-200/70 shadow-md';

function normalizeShortCodeInput(raw: string): string {
    const s = String(raw || '')
        .trim()
        .toUpperCase()
        .replace(/[\s_-]+/g, '')
        .replace(/[^0-9A-Z]/g, '');
    return s.length >= 6 && s.length <= 16 ? s : '';
}

function productMatchesTextQuery(p: Product, q: string): boolean {
    if (!q) return true;
    const hay = [
        p.name,
        p.brand,
        p.category,
        p.description,
        ...(p.tags || []),
        ...(p.features || []),
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    return hay.includes(q);
}

export default function LandingPage() {
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [productsError, setProductsError] = useState<string | null>(null);
    const [promoSearchQuery, setPromoSearchQuery] = useState('');
    /** Normalizado del último código con el que se cargó la lista desde GET /promotions/active?shortCode= */
    const [creatorCodeFilterNorm, setCreatorCodeFilterNorm] = useState<string | null>(null);
    const [shortCodeFilterLabel, setShortCodeFilterLabel] = useState<string | null>(null);
    /** ObjectId del influencer resuelto por el código de creador; se usa para atribuir el cupón. */
    const [creatorInfluencerId, setCreatorInfluencerId] = useState<string | null>(null);
    const [catalogSearchLoading, setCatalogSearchLoading] = useState(false);
    const [catalogSearchMessage, setCatalogSearchMessage] = useState<string | null>(null);
    const { addItem } = useCart();

    const reloadFeaturedRef = useRef<() => Promise<void>>(async () => {});

    // Cargar promociones desde la API (portada sin filtro)
    useEffect(() => {
        const fetchPromotions = async () => {
            setIsLoadingProducts(true);
            setProductsError(null);

            try {
                const response = await fetch('/api/promotions/active?limit=50&page=1');
                const contentType = response.headers.get('content-type') || '';
                const text = await response.text();
                let data: { success?: boolean; data?: { docs?: unknown[] }; docs?: unknown[]; message?: string; error?: string };
                try {
                    if (!contentType.includes('application/json')) {
                        throw new Error('API_NO_JSON');
                    }
                    data = JSON.parse(text);
                } catch (parseError: unknown) {
                    if (parseError instanceof SyntaxError || (parseError as Error)?.message === 'API_NO_JSON') {
                        console.warn('[Promociones] Respuesta no JSON:', response.status, contentType, text.slice(0, 200));
                        setProductsError('El servicio de ofertas no está disponible (comprueba que el backend y Nginx estén configurados).');
                        setProducts([]);
                        return;
                    }
                    throw parseError;
                }

                if (!response.ok) {
                    const serverMessage = data?.message || data?.error || `Error HTTP: ${response.status}`;
                    throw new Error(serverMessage);
                }

                const docs = Array.isArray(data?.data?.docs) ? data.data.docs : Array.isArray(data?.docs) ? data.docs : [];
                if (data.success) {
                    setProducts(mapPromoDocsToProductCards(docs));
                } else {
                    setProducts([]);
                }
            } catch (error: any) {
                console.error('Error cargando promociones:', error);
                if (error.name === 'TypeError' || error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
                    setProductsError('No se pudo conectar al servidor. Verifica tu conexión a internet.');
                } else if (error?.message && typeof error.message === 'string' && error.message.length > 0 && error.message.length < 200) {
                    setProductsError(error.message);
                } else {
                    setProductsError('No se pudieron cargar las promociones.');
                }
                setProducts([]);
            } finally {
                setIsLoadingProducts(false);
            }
        };

        reloadFeaturedRef.current = fetchPromotions;
        void fetchPromotions();
    }, []);

    const filteredProducts = useMemo(() => {
        const qRaw = promoSearchQuery.trim().toLowerCase();
        const codeNorm = normalizeShortCodeInput(promoSearchQuery);
        const qForText =
            creatorCodeFilterNorm &&
            codeNorm &&
            codeNorm === creatorCodeFilterNorm &&
            qRaw === codeNorm.toLowerCase()
                ? ''
                : qRaw;

        const list = products;
        if (!qForText) return list;
        return list.filter((p) => productMatchesTextQuery(p, qForText));
    }, [products, promoSearchQuery, creatorCodeFilterNorm]);

    const resetShortCodeIdsOnly = () => {
        setShortCodeFilterLabel(null);
        setCreatorCodeFilterNorm(null);
        setCreatorInfluencerId(null);
    };

    const clearShortCodeFilter = () => {
        resetShortCodeIdsOnly();
        setCatalogSearchMessage(null);
        setPromoSearchQuery('');
        void reloadFeaturedRef.current();
    };

    const runShortCodeCatalogSearch = async () => {
        const norm = normalizeShortCodeInput(promoSearchQuery);
        if (!norm) {
            resetShortCodeIdsOnly();
            setCatalogSearchMessage(
                'Para buscar por código de creador o campaña usa 6–16 caracteres (letras y números), luego pulsa el botón o Enter.'
            );
            return;
        }
        setCatalogSearchLoading(true);
        setCatalogSearchMessage(null);
        try {
            const res = await fetch(
                `/api/promotions/active?shortCode=${encodeURIComponent(norm)}&limit=50&page=1`
            );
            const contentType = res.headers.get('content-type') || '';
            const text = await res.text();
            let data: {
                success?: boolean;
                data?: {
                    docs?: unknown[];
                    shortCodeMeta?: {
                        lookupCode?: string;
                        resolvedVia?: string;
                        influencer?: { id?: string | null; username?: string | null; name?: string | null };
                        catalogPromotionCount?: number;
                        activeMatchingCount?: number;
                    };
                };
                message?: string;
            };
            try {
                if (!contentType.includes('application/json')) {
                    throw new Error('API_NO_JSON');
                }
                data = JSON.parse(text);
            } catch {
                setCatalogSearchMessage('Respuesta inválida del servidor.');
                resetShortCodeIdsOnly();
                return;
            }

            if (res.status === 429) {
                setCatalogSearchMessage('Demasiadas búsquedas. Espera un momento e inténtalo de nuevo.');
                resetShortCodeIdsOnly();
                return;
            }
            if (res.status === 400) {
                setCatalogSearchMessage(data?.message || 'Código no válido.');
                resetShortCodeIdsOnly();
                return;
            }
            if (res.status === 404) {
                setCatalogSearchMessage(data?.message || 'No encontramos un creador con ese código.');
                resetShortCodeIdsOnly();
                return;
            }
            if (!res.ok) {
                setCatalogSearchMessage(data?.message || 'No se pudieron cargar las promociones.');
                resetShortCodeIdsOnly();
                return;
            }

            const docs = Array.isArray(data?.data?.docs) ? data.data.docs : [];
            const meta = data.data?.shortCodeMeta;
            setProducts(mapPromoDocsToProductCards(data.success ? docs : []));
            setCreatorCodeFilterNorm(norm);
            setCreatorInfluencerId(
                meta?.influencer?.id && /^[a-f0-9]{24}$/i.test(String(meta.influencer.id))
                    ? String(meta.influencer.id)
                    : null
            );
            setShortCodeFilterLabel(
                meta?.influencer?.username
                    ? `@${meta.influencer.username}`
                    : meta?.influencer?.name || norm
            );
            const nActive = docs.length;
            const nCat = meta?.catalogPromotionCount ?? 0;
            setCatalogSearchMessage(
                nActive === 0
                    ? nCat === 0
                        ? 'Código resuelto: no hay campañas en el catálogo de códigos cortos para este literal.'
                        : `Hay ${nCat} campaña(s) en catálogo, pero ninguna está activa y vigente ahora mismo.`
                    : `${nActive} promoción(es) activa(s) del creador. Puedes acotar con texto (título, marca…).`
            );
        } catch {
            setCatalogSearchMessage('Error de red al buscar el código.');
            resetShortCodeIdsOnly();
        } finally {
            setCatalogSearchLoading(false);
        }
    };

    const handleAddToCart = (productId: string) => {
        const product = products.find(p => p.id === productId);
        if (product) {
            addItem({
                id: product.id,
                name: product.name,
                price: product.price,
                currency: product.currency,
                image: product.image,
            });
            setToastMessage(`${product.name} agregado al carrito`);
            setShowToast(true);
            console.log('Producto agregado al carrito:', product.name);
        }
    };

    const handleAddToWishlist = (productId: string) => {
        console.log('Producto agregado a favoritos:', productId);
    };

    const handleViewDetails = (productId: string) => {
        console.log('Ver detalles del producto:', productId);
    };

    return (
        <>
            {/* Main Content */}
            <main className="relative">
                {/* Hero Section with Background */}
                <section className="relative py-24 mb-20 overflow-hidden">
                    {/* Background Image with Overlay */}
                    <div className="absolute inset-0 z-0">
                        <img
                            src="https://plus.unsplash.com/premium_photo-1683733841845-29e325968e27?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                            alt="Hero Background - Tecnología y Innovación"
                            className="w-full h-full object-cover"
                        />

                    </div>
                    
                    {/* Content */}
                    <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
                        <h2 className="text-6xl font-extrabold text-white mb-8 leading-tight drop-shadow-lg text-stroke-white text-shadow-hero">
                        ¡Descubre las mejores ofertas en {SITE_CONFIG.name}!
                    </h2>
                        <p className="text-xl text-gray-900 mb-12 max-w-3xl mx-auto leading-relaxed font-bold text-shadow-white">
                            Conectamos marcas con influencers a través de tecnología blockchain, 
                            creando promociones auténticas y descuentos exclusivos para ti.
                        </p>
                        
                        {/* CTA Buttons */}
                        <div className="flex justify-center mb-16">
                            <Link 
                                to="/empezar" 
                                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-2xl"
                            >
                                🚀 Empezar Ahora
                            </Link>
                        </div>
                    </div>
                    
                    {/* Floating Elements */}
                    <div className="absolute top-20 left-10 w-20 h-20 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
                    <div className="absolute top-40 right-20 w-32 h-32 bg-purple-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
                    <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-green-400/20 rounded-full blur-xl animate-pulse delay-2000"></div>
                </section>

                {/* Deal Explanation with Enhanced Design */}
                <section id="que-es-deal" className="max-w-7xl mx-auto px-4 mb-20">
                    <div className="bg-gradient-to-br from-white via-blue-50 to-purple-50 rounded-3xl shadow-2xl p-12 relative overflow-hidden">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-5">
                            <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600 rounded-full -translate-x-32 -translate-y-32"></div>
                            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600 rounded-full translate-x-48 translate-y-48"></div>
                        </div>
                        
                        <div className="relative z-10">
                            <div className="text-center mb-12">
                                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full text-lg font-semibold mb-6">
                                    <span className="text-2xl">🤝</span>
                                    ¿Qué es un "Deal" en {SITE_CONFIG.name}?
                                </div>
                                <p className="text-xl text-gray-700 leading-relaxed max-w-4xl mx-auto">
                                    Un <strong className="text-blue-600 font-bold">"Deal"</strong> es una promoción especial creada por marcas 
                                    y difundida por influencers para ofrecer descuentos exclusivos a sus seguidores. 
                                    Es la forma más inteligente de conectar marcas con audiencias reales.
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                                <div className="group text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                        <span className="text-3xl">🏢</span>
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-900 mb-4">Para las Marcas</h4>
                                    <p className="text-gray-600 leading-relaxed">
                                        Crean promociones verificadas y las distribuyen a través de influencers 
                                        para llegar a audiencias específicas y medibles.
                                    </p>
                                </div>
                                
                                <div className="group text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                        <span className="text-3xl">🌟</span>
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-900 mb-4">Para los Influencers</h4>
                                    <p className="text-gray-600 leading-relaxed">
                                        Comparten ofertas auténticas con sus seguidores, ganan comisiones 
                                        por ventas y construyen confianza con su audiencia.
                                    </p>
                                </div>
                                
                                <div className="group text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                        <span className="text-3xl">💎</span>
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-900 mb-4">Para los Usuarios</h4>
                                    <p className="text-gray-600 leading-relaxed">
                                        Acceden a descuentos exclusivos respaldados por smart contracts, 
                                        garantizando transparencia y autenticidad en cada oferta.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section id="como-funciona" className="max-w-7xl mx-auto px-4 mb-20">
                    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 rounded-3xl shadow-2xl p-12 relative overflow-hidden">
                        {/* Background Elements */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-10 right-10 w-32 h-32 border-2 border-blue-400 rounded-full"></div>
                            <div className="absolute bottom-10 left-10 w-24 h-24 border-2 border-purple-400 rounded-full"></div>
                            <div className="absolute top-1/2 left-1/2 w-16 h-16 border-2 border-green-400 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                        </div>
                        
                        <div className="relative z-10">
                            <div className="text-center mb-12">
                                <h4 className="text-3xl font-bold text-white mb-6">
                                    🚀 ¿Cómo Funciona el Ecosistema?
                                </h4>
                                <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                                    Descubre el proceso completo desde la creación hasta la redención de cada deal
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0">
                                            1
                                        </div>
                                        <div>
                                            <h5 className="text-xl font-bold text-white mb-2">Creación del Deal</h5>
                                            <p className="text-blue-100 leading-relaxed">
                                                La marca define la promoción y crea un smart contract que garantiza 
                                                la transparencia y seguridad de la oferta.
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start gap-4 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0">
                                            2
                                        </div>
                                        <div>
                                            <h5 className="text-xl font-bold text-white mb-2">Distribución por Influencers</h5>
                                            <p className="text-blue-100 leading-relaxed">
                                                Los influencers seleccionan deals que se alinean con su audiencia 
                                                y los comparten de forma auténtica en sus redes sociales.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0">
                                            3
                                        </div>
                                        <div>
                                            <h5 className="text-xl font-bold text-white mb-2">Captación de Usuarios</h5>
                                            <p className="text-blue-100 leading-relaxed">
                                                Los seguidores descargan la app, reclaman sus cupones digitales 
                                                y los almacenan en su wallet seguro.
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start gap-4 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                                        <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0">
                                            4
                                        </div>
                                        <div>
                                            <h5 className="text-xl font-bold text-white mb-2">Redención y Beneficios</h5>
                                            <p className="text-blue-100 leading-relaxed">
                                                Los usuarios canjean sus cupones, todos ganan: descuentos reales, 
                                                clientes nuevos para marcas y comisiones para influencers.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Products Section Header */}
                <section className="text-center mb-16 px-4">
                    <div className={`max-w-4xl mx-auto ${LANDING_HIGHLIGHT_PANEL} px-6 py-6 sm:px-8 sm:py-7`}>
                        <h3 className="text-4xl font-bold mb-4">
                            <span className={LANDING_HIGHLIGHT}>🎯 Ofertas Destacadas</span>
                        </h3>
                        <p className="text-xl leading-relaxed">
                            <span className={LANDING_HIGHLIGHT}>
                                Productos seleccionados con descuentos exclusivos respaldados por smart contracts.
                                ¡No te los pierdas!
                            </span>
                        </p>
                    </div>
                </section>
                
                {/* Mensaje de error si existe */}
                {productsError && (
                    <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm text-yellow-800">{productsError}</p>
                        </div>
                    </div>
                )}

                {/* Estado de carga */}
                {isLoadingProducts ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                        <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
                        <p className="text-lg">
                            <span className={LANDING_HIGHLIGHT}>Cargando promociones...</span>
                        </p>
                    </div>
                ) : (
                    <section id="ofertas" className="max-w-7xl mx-auto px-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                            <div className={`${LANDING_HIGHLIGHT_PANEL} px-4 py-3 inline-block max-w-full`}>
                                <h3 className="text-xl font-semibold">
                                    <span className={LANDING_HIGHLIGHT}>Promociones activas</span>
                                </h3>
                                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm">
                                    <span className={`inline-flex flex-wrap items-center gap-x-2 gap-y-1 ${LANDING_HIGHLIGHT}`}>
                                        <Link
                                            to="/marketplace"
                                            className="text-purple-800 hover:text-purple-950 font-semibold underline-offset-2 hover:underline"
                                        >
                                            Marketplace de ofertas
                                        </Link>
                                        <span className="text-gray-500" aria-hidden>
                                            ·
                                        </span>
                                        <Link
                                            to="/brands"
                                            className="text-violet-800 hover:text-violet-950 font-semibold underline-offset-2 hover:underline"
                                        >
                                            Marcas y negocios
                                        </Link>
                                        <span className="text-gray-500" aria-hidden>
                                            ·
                                        </span>
                                        <Link
                                            to="/tiendas"
                                            className="text-indigo-800 hover:text-indigo-950 font-semibold underline-offset-2 hover:underline"
                                        >
                                            Tiendas BizneAI
                                        </Link>
                                    </span>
                                </div>
                            </div>
                            <span className="text-sm shrink-0 text-right sm:text-left">
                                <span className={LANDING_HIGHLIGHT}>
                                    {filteredProducts.length === products.length
                                        ? `${products.length} ofertas desde la API`
                                        : `${filteredProducts.length} mostradas · ${products.length} en portada`}
                                </span>
                            </span>
                        </div>
                        {products.length > 0 ? (
                            <>
                                <div className="mb-8 rounded-xl border border-gray-200 bg-white/90 p-4 shadow-sm">
                                    <label htmlFor="landing-promo-search" className="sr-only">
                                        Buscar en promociones activas
                                    </label>
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                                        <div className="relative min-w-0 flex-1">
                                            <Search
                                                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                                                aria-hidden
                                            />
                                            <input
                                                id="landing-promo-search"
                                                type="search"
                                                autoComplete="off"
                                                value={promoSearchQuery}
                                                onChange={(e) => setPromoSearchQuery(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        void runShortCodeCatalogSearch();
                                                    }
                                                }}
                                                placeholder="Buscar por título, marca… o código corto del creador (6–16 caracteres + Enter)"
                                                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 shadow-inner outline-none ring-purple-500/30 placeholder:text-gray-400 focus:border-purple-400 focus:ring-2"
                                            />
                                            {promoSearchQuery ? (
                                                <button
                                                    type="button"
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                                    aria-label="Limpiar búsqueda"
                                                    onClick={() => {
                                                        setPromoSearchQuery('');
                                                        clearShortCodeFilter();
                                                    }}
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            ) : null}
                                        </div>
                                        <button
                                            type="button"
                                            disabled={catalogSearchLoading}
                                            onClick={() => void runShortCodeCatalogSearch()}
                                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {catalogSearchLoading ? (
                                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                            ) : (
                                                <Search className="h-4 w-4" aria-hidden />
                                            )}
                                            Por código creador
                                        </button>
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500">
                                        El texto filtra al instante sobre la lista actual. Con código alfanumérico
                                        (6–16), Enter o «Por código creador» llama a{' '}
                                        <code className="rounded bg-gray-100 px-1 text-xs">
                                            GET /api/promotions/active?shortCode=…
                                        </code>{' '}
                                        y sustituye la lista por las promociones activas y vigentes de ese creador.
                                    </p>
                                    {shortCodeFilterLabel ? (
                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-900">
                                                Creador: {shortCodeFilterLabel}
                                                <button
                                                    type="button"
                                                    onClick={clearShortCodeFilter}
                                                    className="ml-1 rounded-full p-0.5 hover:bg-purple-200/80"
                                                    aria-label="Quitar filtro por creador"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </span>
                                            <Link
                                                to="/marketplace"
                                                className="text-xs font-medium text-purple-600 hover:text-purple-800"
                                            >
                                                Ver marketplace completo
                                            </Link>
                                        </div>
                                    ) : null}
                                    {catalogSearchMessage ? (
                                        <p
                                            className={`mt-2 text-sm ${
                                                catalogSearchMessage.includes('Filtrando')
                                                    ? 'text-emerald-800'
                                                    : 'text-amber-800'
                                            }`}
                                        >
                                            {catalogSearchMessage}
                                        </p>
                                    ) : null}
                                </div>
                                {filteredProducts.length > 0 ? (
                                    <div className="columns-1 md:columns-2 xl:columns-3 gap-8 [column-fill:_balance]">
                                        {filteredProducts.map((product, index) => (
                                            <div key={product.id} className="break-inside-avoid mb-8">
                                                <ProductCard
                                                    product={product}
                                                    onAddToCart={handleAddToCart}
                                                    onAddToWishlist={handleAddToWishlist}
                                                    onViewDetails={handleViewDetails}
                                                    masonryTier={masonryTierFromId(product.id, index)}
                                                    influencerProfileId={creatorInfluencerId ?? undefined}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/80 py-12 text-center">
                                        <p className="mb-2 text-gray-700">
                                            {creatorCodeFilterNorm && products.length === 0
                                                ? 'No hay promociones activas y vigentes para las campañas de este código en este momento.'
                                                : products.length > 0 && filteredProducts.length === 0
                                                  ? 'Ninguna oferta coincide con el texto de búsqueda. Borra el texto o quita el filtro de creador.'
                                                  : 'No hay ofertas que coincidan con tu búsqueda o el filtro por creador.'}
                                        </p>
                                        <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
                                            <button
                                                type="button"
                                                className="font-medium text-purple-600 hover:text-purple-800"
                                                onClick={() => {
                                                    setPromoSearchQuery('');
                                                    clearShortCodeFilter();
                                                }}
                                            >
                                                Limpiar filtros
                                            </button>
                                            <span className="text-gray-300" aria-hidden>
                                                ·
                                            </span>
                                            <Link
                                                to="/marketplace"
                                                className="font-medium text-purple-600 hover:text-purple-800"
                                            >
                                                Ir al marketplace
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-gray-600 mb-4">No hay promociones disponibles en este momento.</p>
                                <Link
                                    to="/create-promotion"
                                    className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    Crear Primera Promoción
                                </Link>
                            </div>
                        )}
                    </section>
                )}

                {/* Hot Offers Map */}
                <OffersMap />

                {/* Download App Section */}
                <DownloadApp />

                <SpotifyPodcastEmbed className="mb-8" />

                {/* News Section */}
                <NewsSection />
            </main>

            {/* Toast Notification */}
            <Toast 
                message={toastMessage}
                isVisible={showToast}
                onClose={() => setShowToast(false)}
            />
        </>
    );
}