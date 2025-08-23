import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Zap, Clock, Star, Eye, Flame, Target } from 'lucide-react';
import { useGeolocation } from '../context/GeolocationContext';
import { formatPrice } from '../utils/formatters';

interface HotOffer {
    id: string;
    name: string;
    price: number;
    originalPrice: number;
    currency: string;
    discount: number;
    image: string;
    brand: string;
    rating: number;
    reviewCount: number;
    location: {
        latitude: number;
        longitude: number;
        address: string;
        storeName: string;
        city: string;
    };
    distance?: number; // en metros
    expiresIn: number; // en horas
    hotness: 'fire' | 'hot' | 'warm'; // qué tan caliente está la oferta
    soldCount: number;
    maxQuantity: number;
    tags: string[];
}

const OffersMap: React.FC = () => {
    const [selectedOffer, setSelectedOffer] = useState<HotOffer | null>(null);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
    const { location: geoLocation } = useGeolocation();

    // Ofertas calientes simuladas con ubicaciones en CDMX
    const hotOffers: HotOffer[] = [
        {
            id: 'hot-1',
            name: 'iPhone 15 Pro Max',
            price: 18999,
            originalPrice: 24999,
            currency: 'MXN',
            discount: 24,
            image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=400&q=80',
            brand: 'Apple',
            rating: 4.9,
            reviewCount: 2847,
            location: {
                latitude: 19.4326,
                longitude: -99.1332,
                address: 'Av. Insurgentes Sur 123, Del Valle',
                storeName: 'Apple Store Insurgentes',
                city: 'CDMX'
            },
            expiresIn: 2,
            hotness: 'fire',
            soldCount: 847,
            maxQuantity: 1000,
            tags: ['5G', 'Pro', 'Titanio', 'Cámara 48MP']
        },
        {
            id: 'hot-2',
            name: 'Samsung Galaxy S24 Ultra',
            price: 16499,
            originalPrice: 21999,
            currency: 'MXN',
            discount: 25,
            image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80',
            brand: 'Samsung',
            rating: 4.8,
            reviewCount: 1923,
            location: {
                latitude: 19.4284,
                longitude: -99.1276,
                address: 'Av. Chapultepec 204, Roma Norte',
                storeName: 'Samsung Experience Store',
                city: 'CDMX'
            },
            expiresIn: 6,
            hotness: 'hot',
            soldCount: 623,
            maxQuantity: 800,
            tags: ['S Pen', 'AI', '200MP', 'Zoom 100x']
        },
        {
            id: 'hot-3',
            name: 'MacBook Air M3',
            price: 21999,
            originalPrice: 27999,
            currency: 'MXN',
            discount: 21,
            image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80',
            brand: 'Apple',
            rating: 4.9,
            reviewCount: 1456,
            location: {
                latitude: 19.4205,
                longitude: -99.1590,
                address: 'Av. Santa Fe 482, Santa Fe',
                storeName: 'Apple Store Santa Fe',
                city: 'CDMX'
            },
            expiresIn: 12,
            hotness: 'hot',
            soldCount: 234,
            maxQuantity: 500,
            tags: ['M3 Chip', 'Retina', '18h Batería']
        },
        {
            id: 'hot-4',
            name: 'Sony WH-1000XM5',
            price: 4999,
            originalPrice: 7999,
            currency: 'MXN',
            discount: 37,
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80',
            brand: 'Sony',
            rating: 4.7,
            reviewCount: 892,
            location: {
                latitude: 19.4010,
                longitude: -99.1705,
                address: 'Blvd. Manuel Ávila Camacho 40, Polanco',
                storeName: 'Best Buy Polanco',
                city: 'CDMX'
            },
            expiresIn: 18,
            hotness: 'warm',
            soldCount: 445,
            maxQuantity: 600,
            tags: ['Noise Cancelling', '30h Batería', 'Premium']
        },
        {
            id: 'hot-5',
            name: 'Nintendo Switch OLED',
            price: 6999,
            originalPrice: 8999,
            currency: 'MXN',
            discount: 22,
            image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=400&q=80',
            brand: 'Nintendo',
            rating: 4.8,
            reviewCount: 1267,
            location: {
                latitude: 19.3635,
                longitude: -99.1821,
                address: 'Av. Universidad 1200, Coyoacán',
                storeName: 'GamePlanet Coyoacán',
                city: 'CDMX'
            },
            expiresIn: 8,
            hotness: 'fire',
            soldCount: 789,
            maxQuantity: 1200,
            tags: ['OLED', 'Portátil', 'Dock incluido']
        }
    ];

    // Calcular distancia usando fórmula de Haversine
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371e3; // Radio de la Tierra en metros
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    };

    // Obtener ubicación del usuario
    const getUserLocation = async () => {
        if (isGettingLocation) return;
        
        setIsGettingLocation(true);
        try {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setUserLocation({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        });
                        setIsGettingLocation(false);
                    },
                    (error) => {
                        console.error('Error getting location:', error);
                        setIsGettingLocation(false);
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
                );
            }
        } catch (error) {
            console.error('Geolocation error:', error);
            setIsGettingLocation(false);
        }
    };

    // Calcular distancias cuando se obtiene la ubicación
    const offersWithDistance = hotOffers.map(offer => ({
        ...offer,
        distance: userLocation 
            ? calculateDistance(
                userLocation.latitude, 
                userLocation.longitude, 
                offer.location.latitude, 
                offer.location.longitude
            ) 
            : undefined
    })).sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));

    const getHotnessColor = (hotness: HotOffer['hotness']) => {
        switch (hotness) {
            case 'fire': return 'from-red-500 to-orange-500';
            case 'hot': return 'from-orange-500 to-yellow-500';
            case 'warm': return 'from-yellow-500 to-green-500';
        }
    };

    const getHotnessIcon = (hotness: HotOffer['hotness']) => {
        switch (hotness) {
            case 'fire': return <Flame className="h-4 w-4" />;
            case 'hot': return <Zap className="h-4 w-4" />;
            case 'warm': return <Target className="h-4 w-4" />;
        }
    };

    const renderMapView = () => (
        <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 min-h-[600px]">
            {/* Mapa simulado */}
            <div className="relative w-full h-96 bg-gray-200 rounded-xl overflow-hidden mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100">
                    {/* Grid pattern para simular mapa */}
                    <div className="absolute inset-0 opacity-20" 
                         style={{
                             backgroundImage: 'linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px)',
                             backgroundSize: '20px 20px'
                         }}>
                    </div>
                    
                    {/* Marcadores de ofertas */}
                    {offersWithDistance.map((offer, index) => (
                        <button
                            key={offer.id}
                            onClick={() => setSelectedOffer(offer)}
                            className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hover:scale-110 ${
                                selectedOffer?.id === offer.id ? 'scale-125 z-20' : 'z-10'
                            }`}
                            style={{
                                left: `${20 + index * 15}%`,
                                top: `${30 + (index % 3) * 20}%`
                            }}
                        >
                            <div className={`relative bg-gradient-to-r ${getHotnessColor(offer.hotness)} p-3 rounded-full shadow-lg animate-pulse`}>
                                <MapPin className="h-6 w-6 text-white" />
                                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                                    {offer.discount}%
                                </div>
                            </div>
                        </button>
                    ))}
                    
                    {/* Ubicación del usuario */}
                    {userLocation && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div className="relative">
                                <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>
                                <div className="absolute inset-0 w-4 h-4 bg-blue-400 rounded-full animate-ping"></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Botón para obtener ubicación */}
            <div className="flex justify-center mb-6">
                <button
                    onClick={getUserLocation}
                    disabled={isGettingLocation}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isGettingLocation ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Obteniendo ubicación...
                        </>
                    ) : (
                        <>
                            <Navigation className="h-4 w-4" />
                            {userLocation ? 'Actualizar Mi Ubicación' : 'Encontrar Ofertas Cerca de Mí'}
                        </>
                    )}
                </button>
            </div>

            {/* Detalles de la oferta seleccionada */}
            {selectedOffer && (
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-gradient-to-b from-blue-500 to-purple-500">
                    <div className="flex items-start gap-4">
                        <img
                            src={selectedOffer.image}
                            alt={selectedOffer.name}
                            className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-bold text-lg text-gray-900">{selectedOffer.name}</h4>
                                <span className={`inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r ${getHotnessColor(selectedOffer.hotness)} text-white text-xs rounded-full`}>
                                    {getHotnessIcon(selectedOffer.hotness)}
                                    {selectedOffer.hotness.toUpperCase()}
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-4 mb-2">
                                <span className="text-2xl font-bold text-green-600">
                                    {formatPrice(selectedOffer.price, selectedOffer.currency)}
                                </span>
                                <span className="text-lg text-gray-400 line-through">
                                    {formatPrice(selectedOffer.originalPrice, selectedOffer.currency)}
                                </span>
                                <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                                    -{selectedOffer.discount}%
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {selectedOffer.location.storeName}
                                </div>
                                {selectedOffer.distance && (
                                    <div className="flex items-center gap-1">
                                        <Navigation className="h-4 w-4" />
                                        {(selectedOffer.distance / 1000).toFixed(1)} km
                                    </div>
                                )}
                                <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {selectedOffer.expiresIn}h restantes
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                        <span className="text-sm font-medium">{selectedOffer.rating}</span>
                                        <span className="text-sm text-gray-500">({selectedOffer.reviewCount})</span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {selectedOffer.soldCount}/{selectedOffer.maxQuantity} vendidos
                                    </div>
                                </div>
                                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                    Ver Oferta
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderListView = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offersWithDistance.map((offer) => (
                <div key={offer.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group">
                    <div className="relative">
                        <img
                            src={offer.image}
                            alt={offer.name}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        
                        {/* Badge de hotness */}
                        <div className={`absolute top-3 left-3 bg-gradient-to-r ${getHotnessColor(offer.hotness)} text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1`}>
                            {getHotnessIcon(offer.hotness)}
                            {offer.hotness.toUpperCase()}
                        </div>
                        
                        {/* Descuento */}
                        <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                            -{offer.discount}%
                        </div>
                        
                        {/* Tiempo restante */}
                        <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {offer.expiresIn}h
                        </div>
                    </div>
                    
                    <div className="p-4">
                        <h3 className="font-bold text-lg text-gray-900 mb-2">{offer.name}</h3>
                        
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl font-bold text-green-600">
                                {formatPrice(offer.price, offer.currency)}
                            </span>
                            <span className="text-lg text-gray-400 line-through">
                                {formatPrice(offer.originalPrice, offer.currency)}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                            <MapPin className="h-4 w-4" />
                            <span>{offer.location.storeName}</span>
                            {offer.distance && (
                                <>
                                    <span>•</span>
                                    <span>{(offer.distance / 1000).toFixed(1)} km</span>
                                </>
                            )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                <span className="text-sm font-medium">{offer.rating}</span>
                                <span className="text-sm text-gray-500">({offer.reviewCount})</span>
                            </div>
                            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                                Ver Oferta
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-20 left-10 w-72 h-72 bg-red-500 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500 rounded-full blur-3xl"></div>
            </div>
            
            <div className="max-w-7xl mx-auto px-4 relative z-10">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
                        <Flame className="h-4 w-4" />
                        OFERTAS CALIENTES
                    </div>
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        🔥 Ofertas Cerca de Ti
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Descubre las mejores ofertas en tiendas físicas cerca de tu ubicación. 
                        ¡Aprovecha los descuentos exclusivos antes de que se agoten!
                    </p>
                </div>

                {/* View Toggle */}
                <div className="flex justify-center mb-8">
                    <div className="bg-white rounded-lg p-1 shadow-md">
                        <button
                            onClick={() => setViewMode('map')}
                            className={`px-6 py-2 rounded-md transition-colors ${
                                viewMode === 'map'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-600 hover:text-blue-600'
                            }`}
                        >
                            <MapPin className="h-4 w-4 inline mr-2" />
                            Vista de Mapa
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-6 py-2 rounded-md transition-colors ${
                                viewMode === 'list'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-600 hover:text-blue-600'
                            }`}
                        >
                            <Eye className="h-4 w-4 inline mr-2" />
                            Vista de Lista
                        </button>
                    </div>
                </div>

                {/* Content */}
                {viewMode === 'map' ? renderMapView() : renderListView()}

                {/* Stats */}
                <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center bg-white rounded-xl p-6 shadow-md">
                        <div className="text-3xl font-bold text-red-500 mb-2">{hotOffers.length}</div>
                        <div className="text-gray-600">Ofertas Activas</div>
                    </div>
                    <div className="text-center bg-white rounded-xl p-6 shadow-md">
                        <div className="text-3xl font-bold text-orange-500 mb-2">
                            {Math.max(...hotOffers.map(o => o.discount))}%
                        </div>
                        <div className="text-gray-600">Descuento Máximo</div>
                    </div>
                    <div className="text-center bg-white rounded-xl p-6 shadow-md">
                        <div className="text-3xl font-bold text-green-500 mb-2">
                            {Math.min(...hotOffers.map(o => o.expiresIn))}h
                        </div>
                        <div className="text-gray-600">Expira Pronto</div>
                    </div>
                    <div className="text-center bg-white rounded-xl p-6 shadow-md">
                        <div className="text-3xl font-bold text-blue-500 mb-2">
                            {hotOffers.reduce((sum, o) => sum + o.soldCount, 0)}
                        </div>
                        <div className="text-gray-600">Productos Vendidos</div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default OffersMap;
