import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Menu, X, ShoppingCart, User, Download, Store, Users, Loader2, AlertCircle, LogOut, Search } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import AdminAccessModal from '../components/AdminAccessModal';
import CartIcon from '../components/CartIcon';
import Toast from '../components/Toast';
import DownloadApp from '../components/DownloadApp';
import NewsSection from '../components/NewsSection';
import SpotifyPodcastEmbed from '../components/SpotifyPodcastEmbed';
import LocationSelector from '../components/LocationSelector';
import OffersMap from '../components/OffersMap';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { SITE_CONFIG } from '../config/site';
import { masonryTierFromId } from '../utils/masonryVariant';
import {
    mapPromoDocsToProductCards,
    type ProductCardItem as Product,
} from '../utils/mapPromotionToProductCard';

// Productos de ejemplo (fallback si no hay datos de la API)
const fallbackProducts = [
    {
        id: "1",
        name: "Smartphone Samsung Galaxy S23 Ultra",
        price: 24999,
        originalPrice: 29999,
        currency: "MXN",
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
        offer: "17% de descuento",
        category: "electronicos",
        brand: "Samsung",
        rating: 4.8,
        reviewCount: 1247,
        stock: 45,
        location: "CDMX",
        shipping: "Envío gratis",
        warranty: "2 años",
        tags: ["5G", "256GB", "Cámara 200MP", "S Pen"],
        description: "El smartphone más avanzado de Samsung con cámara de 200MP, S Pen integrado y procesador Snapdragon 8 Gen 2.",
        features: [
            "Pantalla Dynamic AMOLED 2X de 6.8 pulgadas",
            "Cámara principal de 200MP",
            "S Pen integrado",
            "Procesador Snapdragon 8 Gen 2",
            "Batería de 5000mAh"
        ],
        seller: {
            name: "Samsung Store",
            rating: 4.9,
            verified: true
        },
        specifications: {
            "Pantalla": "6.8\" Dynamic AMOLED 2X",
            "Procesador": "Snapdragon 8 Gen 2",
            "RAM": "12GB",
            "Almacenamiento": "256GB",
            "Cámara": "200MP + 12MP + 10MP + 10MP",
            "Batería": "5000mAh"
        },
        smartContract: {
            address: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
            network: "Ethereum",
            tokenStandard: "ERC-777",
            blockchainExplorer: "https://etherscan.io"
        },
        // Oferta caliente
        isHotOffer: true,
        hotness: "fire" as const,
        expiresIn: 6,
        storeLocation: {
            latitude: 19.4326,
            longitude: -99.1332,
            address: "Av. Insurgentes Sur 123, Del Valle",
            storeName: "Samsung Store Del Valle"
        },
        distance: 1200
    },
    {
        id: "2",
        name: "Laptop MacBook Pro 16\" M2 Pro",
        price: 89999,
        originalPrice: 109999,
        currency: "MXN",
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
        offer: "18% de descuento",
        category: "electronicos",
        brand: "Apple",
        rating: 4.9,
        reviewCount: 892,
        stock: 23,
        location: "Monterrey",
        shipping: "Envío gratis",
        warranty: "1 año AppleCare+",
        tags: ["M2 Pro", "16GB RAM", "512GB SSD", "Retina Display"],
        description: "Potente laptop para profesionales con chip M2 Pro, pantalla Liquid Retina XDR y hasta 22 horas de batería.",
        features: [
            "Chip M2 Pro con 12 núcleos CPU y 19 núcleos GPU",
            "Pantalla Liquid Retina XDR de 16.2 pulgadas",
            "16GB de RAM unificada",
            "512GB SSD",
            "Hasta 22 horas de batería"
        ],
        seller: {
            name: "Apple Store",
            rating: 4.8,
            verified: true
        },
        specifications: {
            "Procesador": "Apple M2 Pro",
            "RAM": "16GB unificada",
            "Almacenamiento": "512GB SSD",
            "Pantalla": "16.2\" Liquid Retina XDR",
            "Batería": "Hasta 22 horas",
            "Puertos": "3x Thunderbolt 4, HDMI, SDXC"
        },
        smartContract: {
            address: "0x8f2a559d38bcd6337d00c07c0b063c7846a8a8e1",
            network: "Ethereum",
            tokenStandard: "ERC-777",
            blockchainExplorer: "https://etherscan.io"
        },
        // Oferta caliente
        isHotOffer: true,
        hotness: "hot" as const,
        expiresIn: 12,
        storeLocation: {
            latitude: 19.4205,
            longitude: -99.1590,
            address: "Av. Santa Fe 482, Santa Fe",
            storeName: "Apple Store Santa Fe"
        },
        distance: 2500
    },
    {
        id: "3",
        name: "Cámara Sony A7 IV Mirrorless",
        price: 45999,
        originalPrice: 54999,
        currency: "MXN",
        image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
        offer: "16% de descuento",
        category: "fotografia-y-video",
        brand: "Sony",
        rating: 4.7,
        reviewCount: 567,
        stock: 18,
        location: "Guadalajara",
        shipping: "Envío $299",
        warranty: "2 años",
        tags: ["Full Frame", "33MP", "4K 60p", "IBIS"],
        description: "Cámara mirrorless full frame con sensor de 33MP, grabación 4K 60p y estabilización de imagen en el cuerpo.",
        features: [
            "Sensor full frame de 33MP",
            "Grabación 4K 60p",
            "Estabilización de imagen en el cuerpo (IBIS)",
            "Autofocus híbrido de 759 puntos",
            "Pantalla táctil articulada"
        ],
        seller: {
            name: "Sony Store",
            rating: 4.6,
            verified: true
        },
        specifications: {
            "Sensor": "Full Frame 33MP",
            "Video": "4K 60p",
            "Autofocus": "759 puntos híbridos",
            "Pantalla": "3.0\" táctil articulada",
            "Batería": "NP-FZ100",
            "Conectividad": "WiFi, Bluetooth, USB-C"
        },
        smartContract: {
            address: "0x9a3b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
            network: "Polygon",
            tokenStandard: "ERC-777",
            blockchainExplorer: "https://polygonscan.com"
        }
    },
    {
        id: "4",
        name: "Zapatillas Nike Air Max 270",
        price: 2499,
        originalPrice: 3499,
        currency: "MXN",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
        offer: "29% de descuento",
        category: "moda-y-accesorios",
        brand: "Nike",
        rating: 4.6,
        reviewCount: 2341,
        stock: 156,
        location: "CDMX",
        shipping: "Envío gratis",
        warranty: "30 días",
        tags: ["Running", "Air Max", "Comfort", "Estilo"],
        description: "Zapatillas deportivas con tecnología Air Max para máximo confort y estilo urbano.",
        features: [
            "Tecnología Air Max en el talón",
            "Material transpirable",
            "Suela de goma duradera",
            "Diseño urbano moderno",
            "Múltiples colores disponibles"
        ],
        seller: {
            name: "Nike Store",
            rating: 4.7,
            verified: true
        },
        specifications: {
            "Material": "Malla transpirable",
            "Suela": "Goma duradera",
            "Tecnología": "Air Max",
            "Peso": "310g",
            "Cierre": "Cordones",
            "Uso": "Running, Casual"
        },
        smartContract: {
            address: "0xb1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0",
            network: "Binance Smart Chain",
            tokenStandard: "ERC-777",
            blockchainExplorer: "https://bscscan.com"
        }
    },
    {
        id: "5",
        name: "Sofá Modular 3 Plazas",
        price: 12999,
        originalPrice: 15999,
        currency: "MXN",
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
        offer: "19% de descuento",
        category: "hogar-y-jardin",
        brand: "IKEA",
        rating: 4.4,
        reviewCount: 892,
        stock: 34,
        location: "Monterrey",
        shipping: "Envío $599",
        warranty: "10 años",
        tags: ["Modular", "3 Plazas", "Moderno", "Confortable"],
        description: "Sofá modular moderno y confortable perfecto para salas de estar contemporáneas.",
        features: [
            "Diseño modular personalizable",
            "Tela resistente y fácil de limpiar",
            "Estructura de madera sólida",
            "Asientos extra confortables",
            "Múltiples configuraciones posibles"
        ],
        seller: {
            name: "IKEA",
            rating: 4.5,
            verified: true
        },
        specifications: {
            "Material": "Tela resistente, madera sólida",
            "Dimensiones": "220x85x85 cm",
            "Capacidad": "3 personas",
            "Color": "Gris moderno",
            "Garantía": "10 años",
            "Ensamblaje": "Requiere montaje"
        },
        smartContract: {
            address: "0xc2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1",
            network: "Avalanche",
            tokenStandard: "ERC-777",
            blockchainExplorer: "https://snowtrace.io"
        }
    },
    {
        id: "6",
        name: "Bicicleta de Montaña Trek Marlin 7",
        price: 15999,
        originalPrice: 18999,
        currency: "MXN",
        image: "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=800&q=80",
        offer: "16% de descuento",
        category: "deportes-y-aire-libre",
        brand: "Trek",
        rating: 4.8,
        reviewCount: 445,
        stock: 12,
        location: "Guadalajara",
        shipping: "Envío $899",
        warranty: "Lifetime frame",
        tags: ["MTB", "29\"", "Shimano", "Suspensión"],
        description: "Bicicleta de montaña profesional con cuadro de aluminio Alpha Gold y componentes Shimano de alta calidad.",
        features: [
            "Cuadro Alpha Gold de aluminio",
            "Ruedas de 29 pulgadas",
            "Suspensión delantera SR Suntour",
            "Frenos de disco hidráulicos",
            "21 velocidades Shimano"
        ],
        seller: {
            name: "Trek Store",
            rating: 4.9,
            verified: true
        },
        specifications: {
            "Cuadro": "Aluminio Alpha Gold",
            "Talla": "M (17.5\")",
            "Ruedas": "29\"",
            "Velocidades": "21",
            "Frenos": "Disco hidráulicos",
            "Peso": "12.5 kg"
        },
        smartContract: {
            address: "0xd3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2",
            network: "Solana",
            tokenStandard: "ERC-777",
            blockchainExplorer: "https://solscan.io"
        }
    }
];

// Helper function to generate consistent slugs
const generateSlug = (text: string): string => {
    return text.toLowerCase()
        .replace(/\s+/g, '-')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
};

const categories = [
    {
        name: "Electrónica",
        slug: "electronica",
        subcategories: ["Smartphones", "Laptops", "Auriculares", "Smartwatches", "Tablets"]
    },
    {
        name: "Moda",
        slug: "moda",
        subcategories: ["Ropa", "Zapatos", "Accesorios", "Bolsos", "Joyería"]
    },
    {
        name: "Hogar",
        slug: "hogar",
        subcategories: ["Muebles", "Decoración", "Cocina", "Jardín", "Iluminación"]
    },
    {
        name: "Deportes",
        slug: "deportes",
        subcategories: ["Fitness", "Running", "Fútbol", "Natación", "Ciclismo"]
    },
    {
        name: "Fotografía",
        slug: "fotografia",
        subcategories: ["Cámaras", "Lentes", "Trípodes", "Iluminación", "Accesorios"]
    },
    {
        name: "Comida y Bebidas",
        slug: "comida",
        subcategories: ["Restaurantes", "Delivery", "Bebidas", "Snacks", "Postres"]
    },
    {
        name: "Servicios",
        slug: "servicios",
        subcategories: ["Educación", "Salud", "Belleza", "Transporte", "Entretenimiento"]
    },
    {
        name: "Productos Digitales",
        slug: "digital",
        subcategories: ["Software", "Cursos Online", "E-books", "Música", "Streaming"]
    },
    {
        name: "Viajes y Turismo",
        slug: "viajes",
        subcategories: ["Hoteles", "Vuelos", "Paquetes", "Actividades", "Seguros"]
    },
    {
        name: "Belleza y Cuidado",
        slug: "belleza",
        subcategories: ["Cosméticos", "Skincare", "Perfumes", "Tratamientos", "Accesorios"]
    }
];

// Tipo para producto transformado
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
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [adminModalOpen, setAdminModalOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [marketplaceDropdownOpen, setMarketplaceDropdownOpen] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [productsError, setProductsError] = useState<string | null>(null);
    const [promoSearchQuery, setPromoSearchQuery] = useState('');
    /** Normalizado del último código con el que se cargó la lista desde GET /promotions/active?shortCode= */
    const [creatorCodeFilterNorm, setCreatorCodeFilterNorm] = useState<string | null>(null);
    const [shortCodeFilterLabel, setShortCodeFilterLabel] = useState<string | null>(null);
    const [catalogSearchLoading, setCatalogSearchLoading] = useState(false);
    const [catalogSearchMessage, setCatalogSearchMessage] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { addItem } = useCart();
    const { user, isAuthenticated, logout } = useAuth();

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
                let data: { success?: boolean; data?: { docs?: unknown[] }; message?: string };
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
                        influencer?: { username?: string | null; name?: string | null };
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

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setMarketplaceDropdownOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center space-x-3">
                            <img 
                                src="/logo.png" 
                                alt="DameCódigo" 
                                className="w-8 h-8 object-contain"
                            />
                            <span className="text-xl font-bold text-gray-900">{SITE_CONFIG.name}</span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-6">
                            <LocationSelector />
                            <CartIcon />
                            {/* Marketplace Dropdown */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setMarketplaceDropdownOpen(!marketplaceDropdownOpen)}
                                    className="flex items-center gap-1 text-gray-700 hover:text-blue-600 font-medium transition-colors"
                                >
                                    Marketplace
                                    <ChevronDown className={`w-4 h-4 transition-transform ${marketplaceDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {marketplaceDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                        <div className="py-2">
                                            <Link
                                                to="/marketplace"
                                                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                onClick={() => setMarketplaceDropdownOpen(false)}
                                            >
                                                <div className="p-2 bg-purple-100 rounded-lg">
                                                    <Store className="w-4 h-4 text-purple-600" />
                                                </div>
                                                <div>
                                                    <div className="font-medium">Promociones</div>
                                                    <div className="text-sm text-gray-500">Descubre ofertas de marcas</div>
                                                </div>
                                            </Link>
                                            <Link
                                                to="/influencers"
                                                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                onClick={() => setMarketplaceDropdownOpen(false)}
                                            >
                                                <div className="p-2 bg-pink-100 rounded-lg">
                                                    <Users className="w-4 h-4 text-pink-600" />
                                                </div>
                                                <div>
                                                    <div className="font-medium">Influencers</div>
                                                    <div className="text-sm text-gray-500">Encuentra creadores de contenido</div>
                                                </div>
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>


                            <Link 
                                to="/landing" 
                                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                            >
                                Para Negocios
                            </Link>
                            <a
                                href={SITE_CONFIG.apkDownloadUrl}
                                download="damecodigo-link4deal.apk"
                                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                            >
                                <Download className="w-4 h-4" />
                                Descargar App
                            </a>
                            {isAuthenticated && user ? (
                                <>
                                    <span className="text-gray-600 font-medium">Hola, {user.firstName}</span>
                                    <Link to="/dashboard" className="flex items-center gap-1.5 text-gray-700 hover:text-blue-600 font-medium transition-colors">
                                        <User className="w-4 h-4" />
                                        Mi cuenta
                                    </Link>
                                    <button type="button" onClick={() => logout()} className="flex items-center gap-1.5 text-gray-700 hover:text-red-600 font-medium transition-colors">
                                        <LogOut className="w-4 h-4" />
                                        Salir
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/signin" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                                        Iniciar Sesión
                                    </Link>
                                    <Link to="/signup" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
                                        Registrarse
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="text-gray-700 hover:text-blue-600 transition-colors"
                            >
                                {mobileMenuOpen ? (
                                    <X className="w-6 h-6" />
                                ) : (
                                    <Menu className="w-6 h-6" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    {mobileMenuOpen && (
                        <div className="md:hidden py-4 border-t border-gray-200">
                            <div className="space-y-4">
                                <div className="flex items-center justify-center">
                                    <LocationSelector />
                                </div>
                                <div className="flex items-center justify-center">
                                    <CartIcon />
                                </div>
                                {/* Marketplace Options for Mobile */}
                                <div className="space-y-2">
                                    <Link
                                        to="/marketplace"
                                        className="flex items-center justify-center gap-3 text-gray-700 hover:text-blue-600 font-medium transition-colors py-2"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <div className="p-1.5 bg-purple-100 rounded-lg">
                                            <Store className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <div className="text-center">
                                            <div className="font-medium">Promociones</div>
                                            <div className="text-xs text-gray-500">Ofertas de marcas</div>
                                        </div>
                                    </Link>
                                    <Link
                                        to="/influencers"
                                        className="flex items-center justify-center gap-3 text-gray-700 hover:text-blue-600 font-medium transition-colors py-2"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <div className="p-1.5 bg-pink-100 rounded-lg">
                                            <Users className="w-4 h-4 text-pink-600" />
                                        </div>
                                        <div className="text-center">
                                            <div className="font-medium">Influencers</div>
                                            <div className="text-xs text-gray-500">Creadores de contenido</div>
                                        </div>
                                    </Link>
                                </div>


                                <Link
                                    to="/landing"
                                    className="block text-gray-700 hover:text-blue-600 font-medium transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Para Negocios
                                </Link>
                                <a
                                    href={SITE_CONFIG.apkDownloadUrl}
                                    download="damecodigo-link4deal.apk"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg font-medium text-center hover:from-green-600 hover:to-green-700 transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Descargar App
                                </a>
                                {isAuthenticated && user ? (
                                    <>
                                        <div className="text-gray-600 font-medium text-center">Hola, {user.firstName}</div>
                                        <Link to="/dashboard" className="flex items-center justify-center gap-2 text-gray-700 hover:text-blue-600 font-medium py-2" onClick={() => setMobileMenuOpen(false)}>
                                            <User className="w-4 h-4" /> Mi cuenta
                                        </Link>
                                        <button type="button" onClick={() => { setMobileMenuOpen(false); logout(); }} className="flex items-center justify-center gap-2 w-full text-gray-700 hover:text-red-600 font-medium py-2">
                                            <LogOut className="w-4 h-4" /> Salir
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link to="/signin" className="block text-gray-700 hover:text-blue-600 font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
                                            Iniciar Sesión
                                        </Link>
                                        <Link to="/signup" className="block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium text-center hover:from-blue-600 hover:to-purple-700 transition-all duration-300" onClick={() => setMobileMenuOpen(false)}>
                                            Registrarse
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </nav>

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
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                            <Link 
                                to="/signup" 
                                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-2xl"
                            >
                                🚀 Empezar Ahora
                            </Link>
                            <Link 
                                to="/about" 
                                className="bg-white border-2 border-gray-900 text-gray-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-900 hover:text-white transition-all duration-300 transform hover:scale-105 shadow-lg"
                            >
                                📖 Saber Más
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
                <section className="text-center mb-16">
                    <div className="max-w-4xl mx-auto">
                        <h3 className="text-4xl font-bold text-gray-900 mb-6">
                            🎯 Ofertas Destacadas
                        </h3>
                        <p className="text-xl text-gray-600 leading-relaxed">
                            Productos seleccionados con descuentos exclusivos respaldados por smart contracts. 
                            ¡No te los pierdas!
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
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
                        <p className="text-gray-600">Cargando promociones...</p>
                    </div>
                ) : (
                    <section id="ofertas">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900">Promociones activas</h3>
                                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                                    <Link
                                        to="/marketplace"
                                        className="text-purple-600 hover:text-purple-800 font-medium"
                                    >
                                        Marketplace de ofertas
                                    </Link>
                                    <span className="text-gray-300 hidden sm:inline" aria-hidden>
                                        ·
                                    </span>
                                    <Link to="/brands" className="text-violet-600 hover:text-violet-800">
                                        Marcas y negocios
                                    </Link>
                                    <span className="text-gray-300 hidden sm:inline" aria-hidden>
                                        ·
                                    </span>
                                    <Link to="/tiendas" className="text-indigo-600 hover:text-indigo-800">
                                        Tiendas BizneAI
                                    </Link>
                                </div>
                            </div>
                            <span className="text-sm text-gray-500 shrink-0 text-right">
                                {filteredProducts.length === products.length
                                    ? `${products.length} ofertas desde la API`
                                    : `${filteredProducts.length} mostradas · ${products.length} en portada`}
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
            {/* Footer */}
            <footer className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white relative">
                {/* Main Footer Content */}
                <div className="max-w-7xl mx-auto px-4 py-16">
                    {/* Company Info */}
                    <div className="text-center mb-12">
                        <div className="flex items-center justify-center space-x-3 mb-6">
                            <img 
                                src="/logo.png" 
                                alt="DameCódigo" 
                                className="w-12 h-12 object-contain"
                            />
                            <span className="text-3xl font-bold">{SITE_CONFIG.name}</span>
                        </div>
                        <p className="text-blue-100 text-lg max-w-2xl mx-auto leading-relaxed">
                            Conectamos marcas con influencers a través de tecnología blockchain, 
                            creando promociones auténticas y descuentos exclusivos.
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-blue-800 mb-8"></div>

                    {/* Bottom Section */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-gray-400 text-sm">
                {SITE_CONFIG.copyright}
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                            <Link to="/privacy" className="text-blue-200 hover:text-white transition-colors">Privacidad</Link>
                            <span className="text-gray-500">•</span>
                            <Link to="/cookies" className="text-blue-200 hover:text-white transition-colors">Cookies</Link>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-400">Tecnología Blockchain</span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-400">Promociones Inteligentes</span>
                        </div>
                    </div>
                </div>
            </footer>
            {/* Floating Download App Button */}
            <div className="fixed bottom-6 left-6 z-50">
                <a
                    href={SITE_CONFIG.apkDownloadUrl}
                    download="damecodigo-link4deal.apk"
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-full shadow-2xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-110 flex items-center space-x-2 group"
                >
                    <Download className="w-6 h-6" />
                    <span className="font-medium">App</span>
                    <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-yellow-800">📱</span>
                    </div>
                </a>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                    ¡Descarga nuestra app móvil!
                    <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
            </div>

            {/* Floating Admin Button */}
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={() => setAdminModalOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-110 flex items-center space-x-2 group"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium">Admin</span>
                    <svg className="w-4 h-4 text-yellow-300 group-hover:text-yellow-200 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                </button>
                
                {/* Tooltip */}
                <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                    Panel de Administración (Protegido)
                    <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
            </div>
            {/* Admin Access Modal */}
            <AdminAccessModal isOpen={adminModalOpen} onClose={() => setAdminModalOpen(false)} />
            
            {/* Toast Notification */}
            <Toast 
                message={toastMessage}
                isVisible={showToast}
                onClose={() => setShowToast(false)}
            />
        </div>
    );
}