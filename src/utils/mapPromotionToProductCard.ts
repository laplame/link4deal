import { getPromotionImageUrl } from './promotionImage';
import { normalizeChainBranchesFromApi } from './geo';
import { getDisplayContractAddress, getPolygonscanAddressUrl } from './polygonContract';

/** Shape expected by `ProductCard` (promotion id as `id` for /promotion-details). */
export interface ProductCardItem {
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
    isHotOffer?: boolean;
    hotness?: 'fire' | 'hot' | 'warm';
    expiresIn?: number;
    storeLocation?: {
        latitude: number;
        longitude: number;
        address: string;
        storeName: string;
    };
    distance?: number;
    activateByGps?: boolean;
    gpsRadiusMeters?: number;
    isChainStore?: boolean;
    chainLocations?: ReturnType<typeof normalizeChainBranchesFromApi>;
}

const CATEGORY_MAP: Record<string, string> = {
    electronics: 'electronicos',
    fashion: 'moda',
    sports: 'deportes',
    beauty: 'belleza',
    home: 'hogar',
    books: 'libros',
    food: 'comida',
    other: 'otros',
};

export function mapPromoDocsToProductCards(docs: unknown[]): ProductCardItem[] {
    return ((Array.isArray(docs) ? docs : []) as Record<string, unknown>[]).map((promo) => {
        const originalPrice = Number(promo.originalPrice) || 0;
        const currentPrice = Number(promo.currentPrice) || 0;
        const discountPercentage =
            Number(promo.discountPercentage) ||
            (originalPrice > 0 ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0);

        const validUntil = new Date(String(promo.validUntil || Date.now() + 7 * 24 * 60 * 60 * 1000));
        const now = new Date();
        const diffTime = validUntil.getTime() - now.getTime();
        const expiresIn = Math.ceil(diffTime / (1000 * 60 * 60));

        const promoId = String(promo._id ?? promo.id ?? '');
        const smartContractAddress = getDisplayContractAddress(promoId, promo.smartContract as { address?: string });

        const tags = Array.isArray(promo.tags) ? (promo.tags as string[]) : [];
        const storeLoc = promo.storeLocation as Record<string, unknown> | undefined;
        const coords = storeLoc?.coordinates as { latitude?: number; longitude?: number } | undefined;

        return {
            id: promoId,
            name: String(promo.title || promo.productName || 'Sin título'),
            price: currentPrice,
            originalPrice: originalPrice > 0 ? originalPrice : undefined,
            currency: String(promo.currency || 'USD'),
            image: getPromotionImageUrl(promo.images as Parameters<typeof getPromotionImageUrl>[0]),
            offer: discountPercentage > 0 ? `${discountPercentage}% de descuento` : 'Oferta especial',
            category: CATEGORY_MAP[String(promo.category)] || String(promo.category || 'otros'),
            brand: String(promo.brand || 'Sin marca'),
            rating: 4.5,
            reviewCount: Number(promo.views) || 0,
            stock:
                promo.totalQuantity != null
                    ? Math.max(0, (Number(promo.totalQuantity) || 0) - (Number(promo.conversions) || 0))
                    : 999,
            location: String(
                (storeLoc?.city as string) || (storeLoc?.address as string) || 'CDMX',
            ),
            shipping: 'Envío disponible',
            warranty: 'Garantía incluida',
            tags: tags.slice(0, 4).length ? tags.slice(0, 4) : ['Oferta', 'Promoción'],
            description: String(promo.description || 'Promoción especial disponible'),
            features: tags.slice(0, 5).length ? tags.slice(0, 5) : [],
            seller: {
                name: String(promo.storeName || promo.brand || 'Tienda'),
                rating: 4.5,
                verified: true,
            },
            specifications: {
                Categoría: String(promo.category || ''),
                Marca: String(promo.brand || ''),
                Descuento: `${discountPercentage}%`,
            },
            smartContract: {
                address: smartContractAddress,
                network: 'Polygon',
                tokenStandard: 'ERC-777',
                blockchainExplorer: getPolygonscanAddressUrl(smartContractAddress),
            },
            isHotOffer: !!(promo.isHotOffer || promo.hotness === 'fire' || promo.hotness === 'hot'),
            hotness: (promo.hotness as 'fire' | 'hot' | 'warm') || (promo.isHotOffer ? 'hot' : undefined),
            expiresIn: expiresIn > 0 ? expiresIn : undefined,
            storeLocation: coords
                ? {
                      latitude: Number(coords.latitude) || 0,
                      longitude: Number(coords.longitude) || 0,
                      address: String(storeLoc?.address || ''),
                      storeName: String(promo.storeName || ''),
                  }
                : undefined,
            distance: undefined,
            activateByGps: !!(promo.activateByGps || promo.gpsActivationEnabled),
            gpsRadiusMeters:
                typeof promo.gpsRadiusMeters === 'number'
                    ? promo.gpsRadiusMeters
                    : typeof promo.locationRadiusMeters === 'number'
                      ? promo.locationRadiusMeters
                      : 500,
            isChainStore: !!promo.isChainStore,
            chainLocations: normalizeChainBranchesFromApi(promo.chainLocations),
        };
    });
}

export interface InfluencerAvailableProductApiRow {
    cardKey: string;
    kind: 'promotion' | 'catalog';
    promotionId: string;
    catalogProductId: string | null;
    promotion: Record<string, unknown>;
    catalogProduct: {
        id: string;
        name: string;
        description?: string;
        category?: string;
        tags?: string[];
        price?: number;
        originalPrice?: number;
        currency?: string;
        stock?: number;
        brand?: string;
        image?: string;
        metrics?: { rating?: number; reviewCount?: number };
    } | null;
    brandApprovedAt: string;
    applicationId: string;
}

/** Maps API row to ProductCard; links always use promotionId. */
export function mapInfluencerAvailableRowToProductCard(row: InfluencerAvailableProductApiRow): ProductCardItem {
    const base = mapPromoDocsToProductCards([row.promotion])[0];
    if (!base) {
        return {
            id: row.promotionId,
            name: 'Promoción',
            price: 0,
            currency: 'USD',
            image: '',
            offer: 'Oferta',
            category: 'otros',
            brand: '',
            rating: 4.5,
            reviewCount: 0,
            stock: 0,
            location: '',
            shipping: '',
            warranty: '',
            tags: [],
            description: '',
            features: [],
            seller: { name: '', rating: 4.5, verified: true },
            specifications: {},
            smartContract: {
                address: '0x0000000000000000000000000000000000000000',
                network: 'Polygon',
                tokenStandard: 'ERC-777',
                blockchainExplorer: 'https://polygonscan.com',
            },
        };
    }

    base.id = row.promotionId;

    const prod = row.catalogProduct;
    if (!prod || row.kind !== 'catalog') return base;

    const promo = row.promotion;
    const promoOriginal = Number(promo.originalPrice) || Number(prod.originalPrice) || 0;
    const promoCurrent = Number(promo.currentPrice) || Number(prod.price) || base.price;
    const discountPercentage =
        Number(promo.discountPercentage) ||
        (promoOriginal > 0 ? Math.round(((promoOriginal - promoCurrent) / promoOriginal) * 100) : 0);

    const prodImage = (prod.image || '').trim();
    const image = prodImage
        ? prodImage.startsWith('http') || prodImage.startsWith('/')
            ? prodImage
            : `/${prodImage.replace(/^\/+/, '')}`
        : base.image;

    return {
        ...base,
        name: prod.name || base.name,
        price: Number(prod.price) > 0 ? Number(prod.price) : promoCurrent,
        originalPrice:
            Number(prod.originalPrice) > 0
                ? Number(prod.originalPrice)
                : promoOriginal > 0
                  ? promoOriginal
                  : base.originalPrice,
        currency: prod.currency || base.currency,
        image,
        offer: discountPercentage > 0 ? `${discountPercentage}% de descuento` : base.offer,
        category: CATEGORY_MAP[String(prod.category)] || String(prod.category || base.category),
        brand: prod.brand || base.brand,
        stock: prod.stock != null ? Math.max(0, Number(prod.stock)) : base.stock,
        description: prod.description || base.description,
        tags: prod.tags?.length ? prod.tags.slice(0, 4) : base.tags,
        features: prod.tags?.length ? prod.tags.slice(0, 5) : base.features,
        rating: Number(prod.metrics?.rating) || base.rating,
        reviewCount: Number(prod.metrics?.reviewCount) || base.reviewCount,
        specifications: {
            ...base.specifications,
            Producto: prod.name,
        },
    };
}
