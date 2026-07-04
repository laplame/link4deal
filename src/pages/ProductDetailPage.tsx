import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
    ShoppingCart, ArrowLeft, Star, Heart, Share2, Package,
    Truck, Shield, RefreshCw, ChevronLeft, ChevronRight,
    Minus, Plus, Check, Loader2, Tag, Building2,
    Ticket, Flame, Zap,
} from 'lucide-react';
import { getProduct, getProductImageUrl, formatPrice, type ProductDoc, type ActivePromotion } from '../services/productsApi';
import { useCart } from '../context/CartContext';
import CouponRequestForm from '../components/CouponRequestForm';

const CATEGORY_LABELS: Record<string, string> = {
    electronics: 'Electrónica', fashion: 'Moda', home: 'Hogar',
    beauty: 'Belleza', sports: 'Deportes', books: 'Libros', food: 'Alimentos', other: 'Otros',
};

function StarRow({ rating, count }: { rating: number; count: number }) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex">
                {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`h-4 w-4 ${s <= Math.round(rating) ? 'fill-amber-400 stroke-amber-500' : 'stroke-gray-300'}`} />
                ))}
            </div>
            <span className="text-sm text-gray-600">{rating.toFixed(1)} ({count} reseñas)</span>
        </div>
    );
}

export default function ProductDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addItem, state: cartState } = useCart();
    const [product, setProduct] = useState<ProductDoc | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeImg, setActiveImg] = useState(0);
    const [qty, setQty] = useState(1);
    const [added, setAdded] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState<{ name: string; value: string } | null>(null);
    const [activeCouponPromo, setActiveCouponPromo] = useState<ActivePromotion | null>(null);

    const inCart = product ? cartState.items.some(i => i.id === product._id) : false;

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setError(null);
        getProduct(id)
            .then(r => { setProduct(r.data); setActiveImg(0); })
            .catch(() => setError('Producto no encontrado'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
                <Package className="h-16 w-16 text-gray-300" />
                <h1 className="text-xl font-semibold text-gray-700">{error || 'Producto no encontrado'}</h1>
                <Link to="/tienda" className="text-blue-600 hover:underline flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" /> Volver a la tienda
                </Link>
            </div>
        );
    }

    const images = product.images?.length > 0 ? product.images : [{ path: '/placeholder-product.png', alt: product.name, isPrimary: true }];
    const discount = product.originalPrice && product.originalPrice > product.price
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;
    const inStock = product.stock > 0;
    const variants = product.variants || [];
    const groupedVariants = variants.reduce<Record<string, string[]>>((acc, v) => {
        if (!acc[v.name]) acc[v.name] = [];
        if (!acc[v.name].includes(v.value)) acc[v.name].push(v.value);
        return acc;
    }, {});

    const handleAddToCart = () => {
        if (!inStock) return;
        for (let i = 0; i < qty; i++) {
            addItem({
                id: product._id,
                name: product.name,
                price: product.price,
                currency: product.currency,
                image: getProductImageUrl(product),
                originalPrice: product.originalPrice,
                brand: product.brand?.name,
                slug: product.seo?.slug,
            });
        }
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    const handleBuyNow = () => {
        handleAddToCart();
        navigate('/tienda/checkout');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Breadcrumb */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-gray-500 flex-wrap">
                    <Link to="/tienda" className="hover:text-blue-600 flex items-center gap-1">
                        <Package className="h-3.5 w-3.5" /> Tienda
                    </Link>
                    <span>/</span>
                    {product.category && (
                        <>
                            <Link to={`/tienda?category=${product.category}`} className="hover:text-blue-600">
                                {CATEGORY_LABELS[product.category] || product.category}
                            </Link>
                            <span>/</span>
                        </>
                    )}
                    <span className="text-gray-900 line-clamp-1">{product.name}</span>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-2 gap-10">
                    {/* Images */}
                    <div className="space-y-3">
                        <div className="relative bg-white rounded-2xl border border-gray-200 overflow-hidden aspect-square">
                            <img
                                src={images[activeImg]?.path.startsWith('http') ? images[activeImg].path : images[activeImg]?.path || '/placeholder-product.png'}
                                alt={images[activeImg]?.alt || product.name}
                                className="w-full h-full object-contain p-4"
                                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.png'; }}
                            />
                            {discount > 0 && (
                                <span className="absolute top-3 left-3 bg-red-500 text-white text-sm font-bold px-2.5 py-1 rounded-full">
                                    -{discount}%
                                </span>
                            )}
                            {images.length > 1 && (
                                <>
                                    <button type="button" onClick={() => setActiveImg(i => Math.max(0, i - 1))} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full shadow flex items-center justify-center text-gray-700 hover:bg-white">
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <button type="button" onClick={() => setActiveImg(i => Math.min(images.length - 1, i + 1))} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full shadow flex items-center justify-center text-gray-700 hover:bg-white">
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </>
                            )}
                        </div>
                        {images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {images.map((img, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setActiveImg(i)}
                                        className={`shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden bg-white transition-colors ${activeImg === i ? 'border-blue-500' : 'border-gray-200 hover:border-gray-400'}`}
                                    >
                                        <img src={img.path || '/placeholder-product.png'} alt="" className="w-full h-full object-contain p-1" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="space-y-5">
                        {product.brand?.name && (
                            <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                                <Building2 className="h-4 w-4" />
                                {product.brand.name}
                            </div>
                        )}

                        <h1 className="text-2xl font-bold text-gray-900 leading-tight">{product.name}</h1>

                        {product.metrics.rating > 0 && (
                            <StarRow rating={product.metrics.rating} count={product.metrics.reviewCount} />
                        )}

                        {/* Price */}
                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-bold text-gray-900">
                                {formatPrice(product.price, product.currency)}
                            </span>
                            {product.originalPrice && (
                                <span className="text-lg text-gray-400 line-through">
                                    {formatPrice(product.originalPrice, product.currency)}
                                </span>
                            )}
                            {discount > 0 && (
                                <span className="bg-red-100 text-red-700 text-sm font-semibold px-2 py-0.5 rounded-full">
                                    Ahorras {discount}%
                                </span>
                            )}
                        </div>

                        {/* Stock */}
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${inStock ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <span className={`text-sm font-medium ${inStock ? 'text-emerald-700' : 'text-red-600'}`}>
                                {inStock ? `En stock (${product.stock} disponibles)` : 'Sin stock'}
                            </span>
                        </div>

                        {/* Variants */}
                        {Object.entries(groupedVariants).map(([varName, values]) => (
                            <div key={varName}>
                                <p className="text-sm font-medium text-gray-700 mb-2">{varName}:</p>
                                <div className="flex flex-wrap gap-2">
                                    {values.map(val => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setSelectedVariant(prev =>
                                                prev?.name === varName && prev.value === val ? null : { name: varName, value: val }
                                            )}
                                            className={`px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${selectedVariant?.name === varName && selectedVariant.value === val ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}
                                        >
                                            {val}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Quantity */}
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Cantidad:</p>
                            <div className="inline-flex items-center border border-gray-300 rounded-xl overflow-hidden">
                                <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))} className="px-4 py-2.5 text-gray-700 hover:bg-gray-50 disabled:opacity-40" disabled={qty <= 1}>
                                    <Minus className="h-4 w-4" />
                                </button>
                                <span className="px-5 py-2.5 font-semibold text-gray-900 min-w-[3rem] text-center">{qty}</span>
                                <button type="button" onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="px-4 py-2.5 text-gray-700 hover:bg-gray-50 disabled:opacity-40" disabled={qty >= product.stock || !inStock}>
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Promo activa */}
                        {product.activePromotions && product.activePromotions.length > 0 && (() => {
                            const promo = product.activePromotions![0];
                            const isHot = promo.isHotOffer;
                            const offerLabel: Record<string, string> = {
                                percentage: `${promo.discountPercentage}% OFF`,
                                bogo: '2×1',
                                cashback_fixed: `Cashback $${promo.cashbackValue}`,
                                cashback_percentage: `${promo.cashbackValue}% Cashback`,
                            };
                            const validUntil = promo.validUntil
                                ? new Date(promo.validUntil).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
                                : null;
                            return (
                                <div className={`rounded-xl border-2 p-4 ${isHot ? 'border-orange-400 bg-orange-50' : 'border-blue-300 bg-blue-50'}`}>
                                    <div className="flex items-start gap-3">
                                        <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${isHot ? 'bg-orange-500' : 'bg-blue-600'}`}>
                                            {isHot ? <Flame className="h-5 w-5 text-white" /> : <Zap className="h-5 w-5 text-white" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isHot ? 'bg-orange-500 text-white' : 'bg-blue-600 text-white'}`}>
                                                    {offerLabel[promo.offerType] || 'Oferta'}
                                                </span>
                                                {validUntil && (
                                                    <span className="text-xs text-gray-500">Hasta {validUntil}</span>
                                                )}
                                            </div>
                                            <p className="text-sm font-semibold text-gray-900 leading-snug">{promo.title}</p>
                                            {promo.description && (
                                                <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{promo.description}</p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setActiveCouponPromo(promo)}
                                        className={`mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors ${isHot ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                                    >
                                        <Ticket className="h-4 w-4" />
                                        Obtener cupón con descuento
                                    </button>
                                </div>
                            );
                        })()}

                        {/* CTA Buttons */}
                        <div className="flex gap-3 flex-wrap">
                            <button
                                type="button"
                                onClick={handleAddToCart}
                                disabled={!inStock}
                                className="flex-1 min-w-[160px] flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl border-2 border-blue-600 text-blue-700 font-semibold hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                {added ? <Check className="h-5 w-5 text-emerald-600" /> : <ShoppingCart className="h-5 w-5" />}
                                {added ? '¡Agregado!' : 'Agregar al carrito'}
                            </button>
                            <button
                                type="button"
                                onClick={handleBuyNow}
                                disabled={!inStock}
                                className="flex-1 min-w-[160px] py-3.5 px-5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Comprar ahora
                            </button>
                            <button type="button" className="w-12 h-12 rounded-xl border border-gray-300 flex items-center justify-center text-gray-600 hover:text-red-500 hover:border-red-300 transition-colors">
                                <Heart className="h-5 w-5" />
                            </button>
                            <button type="button" className="w-12 h-12 rounded-xl border border-gray-300 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-colors">
                                <Share2 className="h-5 w-5" />
                            </button>
                        </div>

                        {inCart && !added && (
                            <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm">
                                <span className="text-emerald-700 font-medium flex items-center gap-2">
                                    <Check className="h-4 w-4" /> Ya está en tu carrito
                                </span>
                                <Link to="/cart" className="text-blue-600 font-medium hover:underline">Ver carrito →</Link>
                            </div>
                        )}

                        {/* Trust badges */}
                        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-200">
                            <div className="text-center text-xs text-gray-600 space-y-1">
                                <Truck className="h-5 w-5 text-blue-600 mx-auto" />
                                <p>{product.shipping?.freeShipping ? 'Envío gratis' : 'Envío disponible'}</p>
                            </div>
                            <div className="text-center text-xs text-gray-600 space-y-1">
                                <Shield className="h-5 w-5 text-blue-600 mx-auto" />
                                <p>Pago seguro</p>
                            </div>
                            <div className="text-center text-xs text-gray-600 space-y-1">
                                <RefreshCw className="h-5 w-5 text-blue-600 mx-auto" />
                                <p>Devoluciones</p>
                            </div>
                        </div>

                        {/* SKU / Category tags */}
                        <div className="flex flex-wrap gap-2 pt-1">
                            {product.category && (
                                <Link to={`/tienda?category=${product.category}`} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs hover:bg-gray-200">
                                    <Tag className="h-3 w-3" />{CATEGORY_LABELS[product.category] || product.category}
                                </Link>
                            )}
                            {product.tags?.map(t => (
                                <span key={t} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">{t}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Description & Specs */}
                <div className="mt-12 grid md:grid-cols-2 gap-8">
                    <section className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Descripción</h2>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">{product.description}</p>
                    </section>

                    {product.specifications && Object.keys(product.specifications).length > 0 && (
                        <section className="bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Especificaciones</h2>
                            <dl className="space-y-2">
                                {Object.entries(product.specifications as Record<string, string>).map(([k, v]) => (
                                    <div key={k} className="flex gap-3 text-sm py-1.5 border-b border-gray-100 last:border-0">
                                        <dt className="text-gray-500 min-w-[120px] shrink-0">{k}</dt>
                                        <dd className="text-gray-900 font-medium">{v}</dd>
                                    </div>
                                ))}
                            </dl>
                        </section>
                    )}
                </div>

                {/* Seller info */}
                {product.seller && (
                    <section className="mt-6 bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                            <Building2 className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">
                                {(product.seller as any).firstName} {(product.seller as any).lastName}
                            </p>
                            <p className="text-sm text-gray-500">Vendedor verificado en Link4Deal</p>
                        </div>
                        <Link to="/tienda" className="ml-auto text-sm text-blue-600 hover:underline">
                            Ver más productos
                        </Link>
                    </section>
                )}
            </div>

            {/* Coupon modal — se activa al pulsar "Obtener cupón" en el banner de promo */}
            {activeCouponPromo && (
                <CouponRequestForm
                    productId={activeCouponPromo._id}
                    productName={product.name}
                    productPrice={product.price}
                    productCurrency={product.currency}
                    productImage={getProductImageUrl(product)}
                    discountPercentage={activeCouponPromo.discountPercentage}
                    onClose={() => setActiveCouponPromo(null)}
                    onAddToCart={() => {
                        handleAddToCart();
                        setActiveCouponPromo(null);
                    }}
                    promoPrice={product.price}
                    promoCurrency={product.currency}
                    autoGenerateOnOpen={false}
                />
            )}
        </div>
    );
}
