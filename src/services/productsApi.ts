import { apiUrl } from '../utils/apiUrl';
import { getAuthToken } from '../context/AuthContext';

export interface ProductImage {
    filename: string;
    path: string;
    alt?: string;
    isPrimary?: boolean;
}

export interface ActivePromotion {
    _id: string;
    title: string;
    description?: string;
    discountPercentage?: number;
    offerType: 'percentage' | 'bogo' | 'cashback_fixed' | 'cashback_percentage';
    cashbackValue?: number;
    originalPrice?: number;
    currentPrice?: number;
    currency?: string;
    validFrom?: string;
    validUntil?: string;
    isHotOffer?: boolean;
    hotness?: string;
    publicSlug?: string;
}

export interface ProductDoc {
    _id: string;
    name: string;
    description: string;
    shortDescription?: string;
    category: string;
    subcategory?: string;
    tags: string[];
    price: number;
    originalPrice?: number;
    currency: string;
    stock: number;
    sku?: string;
    images: ProductImage[];
    brand?: { name?: string; logo?: string; website?: string };
    status: string;
    isFeatured: boolean;
    isAvailable: boolean;
    shipping?: {
        freeShipping?: boolean;
        shippingCost?: number;
        processingTime?: number;
        origin?: { city?: string; country?: string };
    };
    metrics: {
        views: number;
        purchases: number;
        rating: number;
        reviewCount: number;
    };
    seo?: { slug?: string };
    seller?: { firstName?: string; lastName?: string; email?: string };
    variants?: Array<{ name: string; value: string; price?: number; stock?: number; sku?: string }>;
    specifications?: Record<string, string>;
    activePromotions?: ActivePromotion[];
    createdAt: string;
}

export interface ProductListResponse {
    success: boolean;
    data: {
        docs: ProductDoc[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface ProductListParams {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular';
    featured?: boolean;
    seller?: string;
}

export async function listProducts(params: ProductListParams = {}): Promise<ProductListResponse> {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.category) qs.set('category', params.category);
    if (params.search) qs.set('search', params.search);
    if (params.minPrice != null) qs.set('minPrice', String(params.minPrice));
    if (params.maxPrice != null) qs.set('maxPrice', String(params.maxPrice));
    if (params.sort) qs.set('sort', params.sort);
    if (params.featured) qs.set('featured', 'true');
    if (params.seller) qs.set('seller', params.seller);

    const res = await fetch(apiUrl(`/api/products?${qs}`));
    if (!res.ok) throw new Error('Error al cargar productos');
    return res.json();
}

export async function getProduct(id: string): Promise<{ success: boolean; data: ProductDoc }> {
    const res = await fetch(apiUrl(`/api/products/${id}`));
    if (!res.ok) throw new Error('Producto no encontrado');
    return res.json();
}

export async function listCategories(): Promise<{ success: boolean; data: string[] }> {
    const res = await fetch(apiUrl('/api/products/categories'));
    if (!res.ok) throw new Error('Error al cargar categorías');
    return res.json();
}

export async function createProduct(formData: FormData): Promise<{ success: boolean; data: ProductDoc }> {
    const token = getAuthToken();
    const res = await fetch(apiUrl('/api/products'), {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error al crear producto');
    return data;
}

export function getProductImageUrl(product: ProductDoc): string {
    const primary = product.images?.find(i => i.isPrimary) ?? product.images?.[0];
    if (!primary) return '/placeholder-product.png';
    if (primary.path.startsWith('http')) return primary.path;
    return primary.path;
}

export function formatPrice(price: number, currency = 'MXN'): string {
    try {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(price);
    } catch {
        return `$${price.toFixed(2)} ${currency}`;
    }
}
