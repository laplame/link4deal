import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
    Search, SlidersHorizontal, X, ShoppingCart, Star, Package,
    ChevronLeft, ChevronRight, Tag, Flame, TrendingUp,
    Grid3X3, List, Heart, Eye,
} from 'lucide-react';
import { listProducts, listCategories, getProductImageUrl, formatPrice, type ProductDoc } from '../services/productsApi';
import { useCart } from '../context/CartContext';

const CATEGORY_LABELS: Record<string, string> = {
    electronics: 'Electrónica',
    fashion: 'Moda',
    home: 'Hogar',
    beauty: 'Belleza',
    sports: 'Deportes',
    books: 'Libros',
    food: 'Alimentos',
    other: 'Otros',
};

const SORT_OPTIONS = [
    { value: 'newest', label: 'Más nuevos' },
    { value: 'price_asc', label: 'Precio: menor a mayor' },
    { value: 'price_desc', label: 'Precio: mayor a menor' },
    { value: 'rating', label: 'Mejor calificados' },
    { value: 'popular', label: 'Más vendidos' },
] as const;

function ProductCard({ product, view }: { product: ProductDoc; view: 'grid' | 'list' }) {
    const { addItem } = useCart();
    const imgUrl = getProductImageUrl(product);
    const discount = product.originalPrice && product.originalPrice > product.price
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;
    const inStock = product.stock > 0;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!inStock) return;
        addItem({
            id: product._id,
            name: product.name,
            price: product.price,
            currency: product.currency,
            image: imgUrl,
            originalPrice: product.originalPrice,
            brand: product.brand?.name,
            slug: product.seo?.slug,
        });
    };

    if (view === 'list') {
        return (
            <Link
                to={`/producto/${product.seo?.slug || product._id}`}
                className="flex gap-4 items-start bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all group"
            >
                <div className="relative shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                    <img src={imgUrl} alt={product.name} className="w-full h-full object-cover" />
                    {discount > 0 && (
                        <span className="absolute top-1 left-1 bg-red-500 text-white text-xs font-bold px-1 py-0.5 rounded">
                            -{discount}%
                        </span>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-0.5">{product.brand?.name}</p>
                    <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {product.name}
                    </h3>
                    {product.shortDescription && (
                        <p className="text-sm text-gray-500 line-clamp-1 mt-1">{product.shortDescription}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                        {product.metrics.rating > 0 && (
                            <span className="flex items-center gap-0.5 text-xs text-amber-600">
                                <Star className="h-3 w-3 fill-amber-400 stroke-amber-500" />
                                {product.metrics.rating.toFixed(1)}
                            </span>
                        )}
                        {!inStock && <span className="text-xs text-red-500">Sin stock</span>}
                    </div>
                </div>
                <div className="shrink-0 text-right">
                    <p className="text-lg font-bold text-gray-900">{formatPrice(product.price, product.currency)}</p>
                    {product.originalPrice && (
                        <p className="text-sm text-gray-400 line-through">{formatPrice(product.originalPrice, product.currency)}</p>
                    )}
                    <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={!inStock}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        Agregar
                    </button>
                </div>
            </Link>
        );
    }

    return (
        <Link
            to={`/producto/${product.seo?.slug || product._id}`}
            className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-blue-300 hover:shadow-md transition-all flex flex-col"
        >
            <div className="relative aspect-square overflow-hidden bg-gray-100">
                <img
                    src={imgUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.png'; }}
                />
                {discount > 0 && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        -{discount}%
                    </span>
                )}
                {product.isFeatured && (
                    <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Flame className="h-3 w-3" /> Destacado
                    </span>
                )}
                {!inStock && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <span className="bg-gray-900 text-white text-xs font-semibold px-3 py-1 rounded-full">Agotado</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors">
                    <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" className="w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-gray-600 hover:text-red-500">
                            <Heart className="h-4 w-4" />
                        </button>
                        <button type="button" className="w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-gray-600 hover:text-blue-500">
                            <Eye className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
            <div className="p-4 flex flex-col flex-1">
                {product.brand?.name && (
                    <p className="text-xs text-blue-600 font-medium mb-1">{product.brand.name}</p>
                )}
                <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm flex-1 leading-snug">
                    {product.name}
                </h3>
                {product.metrics.rating > 0 && (
                    <div className="flex items-center gap-1 mt-1.5">
                        <div className="flex">
                            {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} className={`h-3 w-3 ${s <= Math.round(product.metrics.rating) ? 'fill-amber-400 stroke-amber-500' : 'stroke-gray-300'}`} />
                            ))}
                        </div>
                        <span className="text-xs text-gray-500">({product.metrics.reviewCount})</span>
                    </div>
                )}
                <div className="mt-3 flex items-end justify-between gap-2">
                    <div>
                        <p className="text-lg font-bold text-gray-900 leading-none">
                            {formatPrice(product.price, product.currency)}
                        </p>
                        {product.originalPrice && (
                            <p className="text-xs text-gray-400 line-through mt-0.5">
                                {formatPrice(product.originalPrice, product.currency)}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={!inStock}
                        className="shrink-0 w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title="Agregar al carrito"
                    >
                        <ShoppingCart className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </Link>
    );
}

export default function ShopPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState<ProductDoc[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const searchInputRef = useRef<HTMLInputElement>(null);

    const page = Number(searchParams.get('page') || 1);
    const category = searchParams.get('category') || '';
    const search = searchParams.get('q') || '';
    const sort = (searchParams.get('sort') || 'newest') as typeof SORT_OPTIONS[number]['value'];
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;

    const setParam = useCallback((key: string, value: string | null) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (value) next.set(key, value); else next.delete(key);
            if (key !== 'page') next.set('page', '1');
            return next;
        });
    }, [setSearchParams]);

    useEffect(() => {
        listCategories().then(r => setCategories(r.data)).catch(() => {});
    }, []);

    useEffect(() => {
        setLoading(true);
        listProducts({ page, category: category || undefined, search: search || undefined, sort, minPrice, maxPrice, limit: 24 })
            .then(r => {
                setProducts(r.data.docs);
                setTotal(r.data.total);
                setTotalPages(r.data.totalPages);
            })
            .catch(() => { setProducts([]); })
            .finally(() => setLoading(false));
    }, [page, category, search, sort, minPrice, maxPrice]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const q = searchInputRef.current?.value.trim() || '';
        setParam('q', q || null);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 shrink-0">
                        <Package className="h-5 w-5 text-blue-600" />
                        <h1 className="text-lg font-bold text-gray-900">Tienda</h1>
                        {total > 0 && <span className="text-sm text-gray-500">({total} productos)</span>}
                    </div>

                    <form onSubmit={handleSearch} className="flex-1 min-w-[200px] max-w-md">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                defaultValue={search}
                                placeholder="Buscar productos, marcas..."
                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </form>

                    <div className="flex items-center gap-2 ml-auto">
                        <select
                            value={sort}
                            onChange={e => setParam('sort', e.target.value)}
                            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <button
                            type="button"
                            onClick={() => setShowFilters(v => !v)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${showFilters ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            Filtros
                        </button>
                        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                            <button type="button" onClick={() => setView('grid')} className={`px-2.5 py-2 ${view === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <Grid3X3 className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => setView('list')} className={`px-2.5 py-2 ${view === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <List className="h-4 w-4" />
                            </button>
                        </div>
                        <Link to="/cart" className="relative p-2 text-gray-600 hover:text-blue-600">
                            <ShoppingCart className="h-5 w-5" />
                        </Link>
                    </div>
                </div>

                {/* Filters row */}
                {showFilters && (
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
                            <div className="flex flex-wrap gap-2 items-center">
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Categoría:</span>
                                <button
                                    type="button"
                                    onClick={() => setParam('category', null)}
                                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${!category ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'}`}
                                >
                                    Todas
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setParam('category', cat)}
                                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${category === cat ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'}`}
                                    >
                                        {CATEGORY_LABELS[cat] || cat}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 ml-auto">
                                <span className="text-xs font-medium text-gray-500">Precio:</span>
                                <input
                                    type="number"
                                    placeholder="Mín."
                                    defaultValue={minPrice}
                                    onBlur={e => setParam('minPrice', e.target.value || null)}
                                    className="w-20 text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <span className="text-gray-400">—</span>
                                <input
                                    type="number"
                                    placeholder="Máx."
                                    defaultValue={maxPrice}
                                    onBlur={e => setParam('maxPrice', e.target.value || null)}
                                    className="w-20 text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                {(category || search || minPrice || maxPrice) && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchParams(new URLSearchParams({ page: '1' }))}
                                        className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                                    >
                                        <X className="h-4 w-4" /> Limpiar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Active filters chips */}
                {(search || category) && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {search && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200">
                                <Search className="h-3.5 w-3.5" />"{search}"
                                <button type="button" onClick={() => setParam('q', null)} className="hover:text-blue-900"><X className="h-3 w-3" /></button>
                            </span>
                        )}
                        {category && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200">
                                <Tag className="h-3.5 w-3.5" />{CATEGORY_LABELS[category] || category}
                                <button type="button" onClick={() => setParam('category', null)} className="hover:text-blue-900"><X className="h-3 w-3" /></button>
                            </span>
                        )}
                    </div>
                )}

                {/* Empty state – no products in DB */}
                {!loading && products.length === 0 && (
                    <div className="text-center py-24">
                        <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">
                            {search || category ? 'Sin resultados' : 'El catálogo está vacío'}
                        </h2>
                        <p className="text-gray-500 mb-6">
                            {search || category
                                ? 'Prueba con otros filtros o limpia la búsqueda.'
                                : 'Las marcas aún no han publicado productos. ¿Eres una marca? '}
                        </p>
                        {!search && !category && (
                            <Link to="/brands/panel" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                                Publicar mis productos
                            </Link>
                        )}
                    </div>
                )}

                {/* Loading skeleton */}
                {loading && (
                    <div className={`grid gap-4 ${view === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'grid-cols-1'}`}>
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className={`bg-white rounded-xl border border-gray-200 animate-pulse ${view === 'grid' ? 'aspect-[3/4]' : 'h-24'}`} />
                        ))}
                    </div>
                )}

                {/* Product grid/list */}
                {!loading && products.length > 0 && (
                    <div className={view === 'grid'
                        ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
                        : 'flex flex-col gap-3'}>
                        {products.map(p => <ProductCard key={p._id} product={p} view={view} />)}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && !loading && (
                    <div className="flex items-center justify-center gap-3 mt-8">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => setParam('page', String(page - 1))}
                            className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-50"
                        >
                            <ChevronLeft className="h-4 w-4" /> Anterior
                        </button>
                        <span className="text-sm text-gray-600">
                            Página {page} de {totalPages}
                        </span>
                        <button
                            type="button"
                            disabled={page >= totalPages}
                            onClick={() => setParam('page', String(page + 1))}
                            className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-50"
                        >
                            Siguiente <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* Featured link */}
                {!search && !category && !loading && products.length > 0 && (
                    <div className="mt-10 p-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl text-white flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="h-5 w-5" />
                                <span className="font-semibold">¿Tienes una tienda o marca?</span>
                            </div>
                            <p className="text-blue-100 text-sm">Publica tus productos en el marketplace de Link4Deal y llega a miles de clientes.</p>
                        </div>
                        <Link to="/brands/setup" className="shrink-0 px-5 py-2.5 bg-white text-blue-700 font-semibold rounded-xl text-sm hover:bg-blue-50 transition-colors">
                            Registrar mi tienda
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
