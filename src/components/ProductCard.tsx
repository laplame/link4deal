import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, ShoppingCart, Eye, Share2, Truck, Shield, Clock, Tag, MapPin, FileText, ExternalLink, Flame, Zap, Target, Navigation, Info } from 'lucide-react';
import { formatPrice, calculateDiscountPercentage, shortenAddress } from '../utils/formatters';

interface ProductCardProps {
    product: {
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
        };
        specifications: Record<string, string | undefined>;
        smartContract: {
            address: string;
            network: string;
            tokenStandard: string;
            blockchainExplorer: string;
        };
        // Nuevos campos para geolocalización
        isHotOffer?: boolean;
        hotness?: 'fire' | 'hot' | 'warm';
        expiresIn?: number; // en horas
        storeLocation?: {
            latitude: number;
            longitude: number;
            address: string;
            storeName: string;
        };
        distance?: number; // en metros
    };
    onAddToCart?: (productId: string) => void;
    onAddToWishlist?: (productId: string) => void;
    onViewDetails?: (productId: string) => void;
}

export default function ProductCard({ 
    product, 
    onAddToCart, 
    onAddToWishlist, 
    onViewDetails 
}: ProductCardProps) {
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [imageError, setImageError] = useState(false);
    const imageSrc = imageError ? 'https://via.placeholder.com/400x300?text=Oferta' : product.image;

    const discountPercentage = product.originalPrice 
        ? calculateDiscountPercentage(product.originalPrice, product.price)
        : 0;

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                className={`h-4 w-4 ${
                    i < Math.floor(rating) 
                        ? 'text-yellow-400 fill-current' 
                        : 'text-gray-300'
                }`}
            />
        ));
    };

    const getStockStatus = (stock: number) => {
        if (stock === 0) return { text: 'Agotado', color: 'text-red-600', bgColor: 'bg-red-100' };
        if (stock <= 5) return { text: 'Últimas unidades', color: 'text-orange-600', bgColor: 'bg-orange-100' };
        return { text: 'En stock', color: 'text-green-600', bgColor: 'bg-green-100' };
    };

    const stockStatus = getStockStatus(product.stock);

    const getHotnessColor = (hotness: 'fire' | 'hot' | 'warm') => {
        switch (hotness) {
            case 'fire': return 'from-red-500 to-orange-500';
            case 'hot': return 'from-orange-500 to-yellow-500';
            case 'warm': return 'from-yellow-500 to-green-500';
            default: return 'from-gray-400 to-gray-500';
        }
    };

    const getHotnessIcon = (hotness: 'fire' | 'hot' | 'warm') => {
        switch (hotness) {
            case 'fire': return <Flame className="h-3 w-3" />;
            case 'hot': return <Zap className="h-3 w-3" />;
            case 'warm': return <Target className="h-3 w-3" />;
            default: return null;
        }
    };

    return (
        <div 
            className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Image Section */}
            <div className="relative overflow-hidden">
                <Link to={`/promotion-details/${product.id}`} className="block cursor-pointer">
                    <img
                        src={imageSrc}
                        alt={product.name}
                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() => setImageError(true)}
                    />
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center">
                        <div className="bg-white bg-opacity-90 text-gray-800 px-4 py-2 rounded-full font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            Ver Detalles
                        </div>
                    </div>
                </Link>
                
                {/* Discount Badge */}
                {discountPercentage > 0 && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                        -{discountPercentage}%
                    </div>
                )}

                {/* Hot Offer Badge */}
                {product.isHotOffer && product.hotness && (
                    <div className={`absolute top-3 left-3 bg-gradient-to-r ${getHotnessColor(product.hotness)} text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse`}>
                        {getHotnessIcon(product.hotness)}
                        {product.hotness.toUpperCase()}
                    </div>
                )}

                {/* Expires In */}
                {product.expiresIn && (
                    <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {product.expiresIn}h
                    </div>
                )}

                {/* Stock Status - moved down if hot offer exists */}
                <div className={`absolute ${product.isHotOffer ? 'top-12' : 'top-3'} right-3 ${stockStatus.bgColor} ${stockStatus.color} px-2 py-1 rounded-full text-xs font-medium`}>
                    {stockStatus.text}
                </div>

                {/* Action Buttons */}
                <div className={`absolute top-3 right-3 flex flex-col gap-2 transition-opacity duration-300 ${
                    isHovered ? 'opacity-100' : 'opacity-0'
                }`}>
                    <button
                        onClick={() => onAddToWishlist?.(product.id)}
                        className={`p-2 rounded-full shadow-lg transition-colors ${
                            isWishlisted 
                                ? 'bg-red-500 text-white' 
                                : 'bg-white text-gray-600 hover:text-red-500'
                        }`}
                    >
                        <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
                    </button>
                    
                    <button className="p-2 rounded-full bg-white text-gray-600 hover:text-blue-600 shadow-lg transition-colors">
                        <Eye className="h-4 w-4" />
                    </button>
                    
                    <button className="p-2 rounded-full bg-white text-gray-600 hover:text-green-600 shadow-lg transition-colors">
                        <Share2 className="h-4 w-4" />
                    </button>
                </div>

                {/* Category Badge */}
                <div className="absolute bottom-3 left-3 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    {product.category}
                </div>
            </div>

            {/* Content Section */}
            <div className="p-6">
                {/* Brand & Rating */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600">{product.brand}</span>
                        {product.seller.verified && (
                            <Shield className="h-4 w-4 text-blue-500" />
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        {renderStars(product.rating)}
                        <span className="text-sm text-gray-600 ml-1">({product.reviewCount})</span>
                    </div>
                </div>

                {/* Product Name */}
                <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {product.name}
                </h3>

                {/* Price Section */}
                <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl font-bold text-blue-600">
                        {formatPrice(product.price, product.currency)}
                    </span>
                    {product.originalPrice && (
                        <span className="text-lg text-gray-400 line-through">
                            {formatPrice(product.originalPrice, product.currency)}
                        </span>
                    )}
                </div>

                {/* Offer Badge */}
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mb-4 inline-block">
                    {product.offer}
                </div>

                {/* Smart Contract Info */}
                <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-800">Smart Contract ERC-777</span>
                    </div>
                    <div className="text-xs text-purple-700 mb-2">
                        <span className="font-medium">Red:</span> {product.smartContract.network}
                    </div>
                    <div className="flex items-center gap-2">
                        <code className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded font-mono">
                            {shortenAddress(product.smartContract.address)}
                        </code>
                        <a 
                            href={product.smartContract.blockchainExplorer} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-800 transition-colors"
                        >
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                </div>

                {/* Features Preview */}
                <div className="mb-4">
                    <div className="flex flex-wrap gap-1 mb-2">
                        {product.features.slice(0, 3).map((feature, index) => (
                            <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                {feature}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Seller Info */}
                <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 text-sm font-bold">
                                {product.seller.name.charAt(0)}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-800">{product.seller.name}</p>
                            <div className="flex items-center gap-1">
                                {renderStars(product.seller.rating)}
                                <span className="text-xs text-gray-500">({product.seller.rating})</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Store Location Info for Hot Offers */}
                {product.isHotOffer && product.storeLocation && (
                    <div className="mb-4 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                        <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-orange-600" />
                            <span className="text-sm font-medium text-orange-800">Tienda Física</span>
                        </div>
                        <p className="text-xs text-orange-700 mb-1">{product.storeLocation.storeName}</p>
                        <p className="text-xs text-orange-600">{product.storeLocation.address}</p>
                        {product.distance && (
                            <div className="flex items-center gap-1 mt-2">
                                <Navigation className="h-3 w-3 text-orange-600" />
                                <span className="text-xs text-orange-700 font-medium">
                                    A {(product.distance / 1000).toFixed(1)} km de ti
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Additional Info */}
                <div className="space-y-2 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{product.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        <span>{product.shipping}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Envío en 24h</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <Link
                        to="/signup"
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-4 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105 shadow-lg"
                    >
                        <Tag className="w-4 h-4" />
                        <span>Pedir Cupón</span>
                    </Link>
                    
                    <Link
                        to={`/promotion-details/${product.id}`}
                        className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors inline-block text-center"
                    >
                        Ver Detalles
                    </Link>
                </div>

                {/* Info Message */}
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-xs text-blue-700">
                        <Info className="w-3 h-3" />
                        <span>Regístrate para obtener tu cupón y acceder al carrito</span>
                    </div>
                </div>

                {/* Tags */}
                <div className="mt-4 flex flex-wrap gap-1">
                    {product.tags.map((tag, index) => (
                        <span key={index} className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs">
                            #{tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
