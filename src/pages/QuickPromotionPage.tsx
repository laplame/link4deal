import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    Upload, 
    DollarSign, 
    Calendar, 
    Tag, 
    MapPin,
    CheckCircle,
    X,
    Zap,
    Gift,
    Sparkles,
    QrCode,
    ExternalLink,
    Smartphone,
    Plus,
    Search,
    Trash2
} from 'lucide-react';
import { brands as catalogBrands } from '../data/brands';
import PromotionLegalInfo from '../components/PromotionLegalInfo';
import PromotionOptionalAttributionSection, {
    emptyPromotionOptionalAttribution,
    type PromotionOptionalAttribution
} from '../components/PromotionOptionalAttributionSection';
import type { BizneShop } from '../components/BizneShopCard';
import { formatPromotionCreateError } from '../utils/formatPromotionCreateError';

type OfferType = 'percentage' | 'bogo' | 'cashback_fixed' | 'cashback_percentage';

const BRAND_CUSTOM = '__custom__';

interface RedemptionLocationRow {
    branchName: string;
    address: string;
    postalCode: string;
    city: string;
    state: string;
    latitude: string;
    longitude: string;
    mapsUrl: string;
}

const emptyRedemptionRow = (): RedemptionLocationRow => ({
    branchName: '',
    address: '',
    postalCode: '',
    city: '',
    state: '',
    latitude: '',
    longitude: '',
    mapsUrl: '',
});

/** Lee JSON del body o devuelve objeto vacío (p. ej. HTML de error 413 de Nginx). */
async function readResponseBodyJson(res: Response): Promise<{ data: Record<string, unknown>; raw: string }> {
    const raw = await res.text();
    if (!raw.trim()) return { data: {}, raw };
    try {
        return { data: JSON.parse(raw) as Record<string, unknown>, raw };
    } catch {
        return { data: {}, raw };
    }
}

interface QuickPromotionData {
    title: string;
    description: string;
    brand: string;
    category: string;
    originalPrice: number;
    currentPrice: number;
    currency: string;
    offerType: OfferType;
    cashbackValue: number;
    storeCity: string;
    /** Calle, número, colonia (geocodificación y tienda). */
    storeAddress: string;
    /** Código postal (geocodificación). */
    storePostalCode: string;
    /** Estado o entidad (ej. CDMX, Nuevo León). */
    storeState: string;
    validFrom: string;
    validUntil: string;
    totalQuantity: number;
    images: File[];
    /** Fotos solo de términos y condiciones (OCR aparte en servidor). */
    termsImages: File[];
    termsAndConditions: string;
    activateByGps: boolean;
    gpsRadiusMeters: number;
    storeLatitude: string;
    storeLongitude: string;
    optionalAttribution: PromotionOptionalAttribution;
    /** Sucursales / puntos donde se puede canjear (se envían como chainLocations). */
    redemptionLocations: RedemptionLocationRow[];
}

const OFFER_TYPES: { value: OfferType; label: string; description: string }[] = [
    { value: 'percentage', label: 'Descuento %', description: 'Ej: Producto $20, 25% → $5 USD (5 tokens)' },
    { value: 'bogo', label: '2x1', description: 'Ej: Precio $30 → $15 USD (15 tokens) por unidad gratis' },
    { value: 'cashback_percentage', label: 'Cashback %', description: 'Ej: Compra $50, 10% → $5 USD (5 tokens)' },
    { value: 'cashback_fixed', label: 'Cashback fijo', description: 'Ej: $10 USD fijos → 10 tokens' },
];

const QUICK_TEMPLATES = [
    {
        name: 'Electrónica',
        data: {
            title: 'Oferta Especial de Electrónica',
            description: 'Promoción exclusiva con descuento especial. Productos de alta calidad garantizados.',
            brand: 'Marca Premium',
            category: 'electronics',
            originalPrice: 5000,
            currentPrice: 3999,
            currency: 'USD',
            storeCity: 'Ciudad de México',
            validFrom: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        totalQuantity: 100,
        offerType: 'percentage' as OfferType,
        cashbackValue: 0
        }
    },
    {
        name: 'Moda',
        data: {
            title: 'Nueva Colección de Moda',
            description: 'Descubre las últimas tendencias en moda. Estilos únicos y exclusivos.',
            brand: 'Fashion Brand',
            category: 'fashion',
            originalPrice: 1500,
            currentPrice: 999,
            currency: 'USD',
            storeCity: 'Monterrey',
            validFrom: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        totalQuantity: 100,
        offerType: 'percentage' as OfferType,
        cashbackValue: 0
        }
    },
    {
        name: 'Deportes',
        data: {
            title: 'Equipamiento Deportivo',
            description: 'Todo lo que necesitas para tu entrenamiento. Calidad profesional.',
            brand: 'Sport Pro',
            category: 'sports',
            originalPrice: 2500,
            currentPrice: 1999,
            currency: 'USD',
            storeCity: 'Guadalajara',
            validFrom: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        totalQuantity: 100,
        offerType: 'percentage' as OfferType,
        cashbackValue: 0
        }
    },
    {
        name: 'Belleza',
        data: {
            title: 'Productos de Belleza',
            description: 'Cuidado personal y cosméticos de las mejores marcas.',
            brand: 'Beauty Care',
            category: 'beauty',
            originalPrice: 800,
            currentPrice: 599,
            currency: 'USD',
            storeCity: 'Puebla',
            validFrom: new Date().toISOString().split('T')[0],
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            totalQuantity: 100,
            offerType: 'percentage' as OfferType,
            cashbackValue: 0
        }
    }
];

const CATEGORIES = [
    { value: 'electronics', label: 'Electrónica' },
    { value: 'fashion', label: 'Moda' },
    { value: 'sports', label: 'Deportes' },
    { value: 'beauty', label: 'Belleza' },
    { value: 'home', label: 'Hogar' },
    { value: 'food', label: 'Comida' },
    { value: 'books', label: 'Libros' },
    { value: 'other', label: 'Otros' }
];

export default function QuickPromotionPage() {
    const navigate = useNavigate();
    const defaultValidFrom = new Date().toISOString().split('T')[0];
    const defaultValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const emptyQuickForm = (): QuickPromotionData => ({
        title: '',
        description: '',
        brand: '',
        category: 'electronics',
        originalPrice: 0,
        currentPrice: 0,
        currency: 'USD',
        storeCity: 'Ciudad de México',
        storeAddress: '',
        storePostalCode: '',
        storeState: '',
        validFrom: defaultValidFrom,
        validUntil: defaultValidUntil,
        totalQuantity: 100,
        offerType: 'percentage',
        cashbackValue: 0,
        images: [],
        termsImages: [],
        termsAndConditions: '',
        activateByGps: false,
        gpsRadiusMeters: 500,
        storeLatitude: '',
        storeLongitude: '',
        optionalAttribution: emptyPromotionOptionalAttribution(),
        redemptionLocations: []
    });

    const [formData, setFormData] = useState<QuickPromotionData>(() => emptyQuickForm());
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [termsImagePreviews, setTermsImagePreviews] = useState<string[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analyzeError, setAnalyzeError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [showReward, setShowReward] = useState(false);
    const [createdPromotionId, setCreatedPromotionId] = useState<string | null>(null);
    /** Tipo de promoción: cupón con QR o quick-promotion (redirección a comprar). */
    const [promotionType, setPromotionType] = useState<'coupon' | 'quick-promotion'>('coupon');
    /** Si es quick-promotion: Amazon (URL por defecto) o URL personalizada. */
    const [redirectDestination, setRedirectDestination] = useState<'amazon' | 'custom'>('amazon');
    /** URL del producto Amazon (opcional). Si se indica, se redirige directo a ese producto con el tag de afiliado. */
    const [amazonProductUrl, setAmazonProductUrl] = useState('');
    /** URL de redirección cuando redirectDestination === 'custom'. */
    const [customRedirectUrl, setCustomRedirectUrl] = useState('');
    const [gpsFromDeviceLoading, setGpsFromDeviceLoading] = useState(false);
    const [gpsFromDeviceError, setGpsFromDeviceError] = useState<string | null>(null);
    const [geocodeMainLoading, setGeocodeMainLoading] = useState(false);
    const [geocodeMainError, setGeocodeMainError] = useState<string | null>(null);
    const [geocodeVerifiedUrl, setGeocodeVerifiedUrl] = useState<string | null>(null);
    const [geocodeRowLoading, setGeocodeRowLoading] = useState<number | null>(null);
    const [geocodeRowError, setGeocodeRowError] = useState<string | null>(null);

    const catalogBrandNames = useMemo(
        () => [...new Set(catalogBrands.map((b) => b.name))].sort((a, b) => a.localeCompare(b, 'es')),
        []
    );

    const brandSelectValue = catalogBrandNames.includes(formData.brand.trim())
        ? formData.brand.trim()
        : BRAND_CUSTOM;

    const fillStoreCoordsFromDevice = () => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            setGpsFromDeviceError('Tu navegador no permite geolocalización.');
            return;
        }
        setGpsFromDeviceLoading(true);
        setGpsFromDeviceError(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setFormData((prev) => ({
                    ...prev,
                    storeLatitude: String(pos.coords.latitude),
                    storeLongitude: String(pos.coords.longitude)
                }));
                setGpsFromDeviceLoading(false);
            },
            (err) => {
                setGpsFromDeviceLoading(false);
                setGpsFromDeviceError(
                    err.code === 1
                        ? 'Permiso de ubicación denegado. Actívalo en el navegador o en Ajustes del sistema.'
                        : 'No se pudo obtener la ubicación. Inténtalo de nuevo o escribe latitud y longitud a mano.'
                );
            },
            { enableHighAccuracy: true, timeout: 25000, maximumAge: 0 }
        );
    };

    const geocodeMainFromAddress = async () => {
        setGeocodeMainError(null);
        setGeocodeVerifiedUrl(null);
        setGeocodeMainLoading(true);
        try {
            const res = await fetch('/api/geo/geocode-address', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: formData.storeAddress,
                    postalCode: formData.storePostalCode,
                    city: formData.storeCity,
                    state: formData.storeState,
                    country: 'México'
                })
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || !json.success) {
                throw new Error(json.message || 'No se encontró la ubicación');
            }
            const d = json.data as {
                latitude: number;
                longitude: number;
                city?: string;
                state?: string;
                mapsUrl?: string;
                displayName?: string;
            };
            setFormData((prev) => ({
                ...prev,
                storeLatitude: String(d.latitude),
                storeLongitude: String(d.longitude),
                storeCity: d.city || prev.storeCity,
                storeState: d.state || prev.storeState
            }));
            setGeocodeVerifiedUrl(typeof d.mapsUrl === 'string' ? d.mapsUrl : null);
        } catch (e: unknown) {
            setGeocodeMainError(e instanceof Error ? e.message : 'Error al geocodificar');
        } finally {
            setGeocodeMainLoading(false);
        }
    };

    const geocodeRedemptionRowAt = async (index: number) => {
        const row = formData.redemptionLocations[index];
        if (!row) return;
        setGeocodeRowError(null);
        setGeocodeRowLoading(index);
        try {
            const res = await fetch('/api/geo/geocode-address', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: row.address,
                    postalCode: row.postalCode,
                    city: row.city,
                    state: row.state,
                    country: 'México'
                })
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || !json.success) {
                throw new Error(json.message || 'No se encontró la ubicación');
            }
            const d = json.data as {
                latitude: number;
                longitude: number;
                city?: string;
                state?: string;
                mapsUrl?: string;
            };
            setFormData((prev) => {
                const rows = [...prev.redemptionLocations];
                const cur = rows[index];
                if (!cur) return prev;
                rows[index] = {
                    ...cur,
                    latitude: String(d.latitude),
                    longitude: String(d.longitude),
                    city: d.city || cur.city,
                    state: d.state || cur.state,
                    mapsUrl: (typeof d.mapsUrl === 'string' && d.mapsUrl) || cur.mapsUrl
                };
                return { ...prev, redemptionLocations: rows };
            });
        } catch (e: unknown) {
            setGeocodeRowError(e instanceof Error ? e.message : 'Error al geocodificar la fila');
        } finally {
            setGeocodeRowLoading(null);
        }
    };

    const addRedemptionRow = () => {
        setFormData((prev) => ({
            ...prev,
            redemptionLocations: [...prev.redemptionLocations, emptyRedemptionRow()]
        }));
    };

    const updateRedemptionRow = (index: number, field: keyof RedemptionLocationRow, value: string) => {
        setFormData((prev) => ({
            ...prev,
            redemptionLocations: prev.redemptionLocations.map((row, i) =>
                i === index ? { ...row, [field]: value } : row
            )
        }));
    };

    const removeRedemptionRow = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            redemptionLocations: prev.redemptionLocations.filter((_, i) => i !== index)
        }));
    };

    const loadTemplate = (template: typeof QUICK_TEMPLATES[0]) => {
        setFormData({
            ...emptyQuickForm(),
            ...template.data,
            images: [],
            termsImages: [],
            termsAndConditions: formData.termsAndConditions
        });
        setImagePreviews([]);
        setTermsImagePreviews([]);
    };

    /** Analiza imágenes con Gemini. Si se pasan `files`, se usan esos; si no, formData.images. */
    const handleAnalyzeWithGemini = async (promoFiles?: File[], termsFiles?: File[]) => {
        const promos = promoFiles ?? formData.images;
        const terms = termsFiles ?? formData.termsImages;
        if (promos.length === 0 && terms.length === 0) {
            setAnalyzeError('Sube al menos una imagen (promoción y/o términos) para analizar.');
            return;
        }
        setIsAnalyzing(true);
        setAnalyzeError(null);
        try {
            const fd = new FormData();
            promos.forEach((file) => fd.append('images', file));
            terms.forEach((file) => fd.append('termsImages', file));
            const res = await fetch('/api/promotions/analyze-image', { method: 'POST', body: fd });
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.message || 'Error al analizar');
            }
            const d = json.data || {};
            setFormData(prev => ({
                ...prev,
                title: d.title ?? prev.title,
                description: d.description ?? prev.description,
                brand: d.brand ?? prev.brand,
                category: (d.category && ['electronics', 'fashion', 'home', 'beauty', 'sports', 'books', 'food', 'other'].includes(d.category)) ? d.category : prev.category,
                originalPrice: typeof d.originalPrice === 'number' ? d.originalPrice : prev.originalPrice,
                currentPrice: typeof d.currentPrice === 'number' ? d.currentPrice : prev.currentPrice,
                offerType: (d.offerType && ['percentage', 'bogo', 'cashback_fixed', 'cashback_percentage'].includes(d.offerType)) ? d.offerType : prev.offerType,
                cashbackValue: typeof d.cashbackValue === 'number' ? d.cashbackValue : (prev.cashbackValue ?? 0),
                termsAndConditions: typeof d.termsAndConditions === 'string' ? d.termsAndConditions : prev.termsAndConditions
            }));
        } catch (e: any) {
            setAnalyzeError(e.message || 'Error al analizar las imágenes con Gemini.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    /** Ajusta campos según el tipo de promoción (porcentajes y valores automáticos). */
    const applyOfferTypeAuto = (
        prev: QuickPromotionData,
        opts: { newOfferType?: OfferType; priceChanged?: 'original' | 'current' }
    ): Partial<QuickPromotionData> => {
        const type = opts.newOfferType ?? prev.offerType;
        const original = Number(prev.originalPrice) || 0;
        const current = Number(prev.currentPrice) || 0;
        const discountPct = original > 0 ? ((original - current) / original) * 100 : 0;
        const savings = Math.max(0, original - current);

        switch (type) {
            case 'bogo':
                return opts.priceChanged === 'original' || opts.newOfferType
                    ? { currentPrice: original > 0 ? Math.round((original / 2) * 100) / 100 : 0 }
                    : {};
            case 'cashback_percentage':
                return { cashbackValue: Math.round(discountPct * 100) / 100 };
            case 'cashback_fixed':
                return { cashbackValue: Math.round(savings * 100) / 100 };
            default:
                return {};
        }
    };

    const patchOptionalAttribution = (patch: Partial<PromotionOptionalAttribution>) => {
        setFormData((prev) => ({
            ...prev,
            optionalAttribution: { ...prev.optionalAttribution, ...patch }
        }));
    };

    const applySelectedShopGps = (
        shop: BizneShop,
        coordinates: { latitude: number; longitude: number } | null
    ) => {
        if (!coordinates) return;
        setFormData((prev) => ({
            ...prev,
            brand: prev.brand || shop.storeName || prev.brand,
            storeCity: shop.city || prev.storeCity,
            activateByGps: true,
            storeLatitude: String(coordinates.latitude),
            storeLongitude: String(coordinates.longitude)
        }));
    };

    const handleInputChange = (field: keyof QuickPromotionData, value: any) => {
        setFormData(prev => {
            const next = { ...prev, [field]: value };

            if (field === 'offerType') {
                Object.assign(next, applyOfferTypeAuto(next, { newOfferType: value as OfferType }));
            } else if (field === 'originalPrice') {
                Object.assign(next, applyOfferTypeAuto(next, { priceChanged: 'original' }));
                Object.assign(next, applyOfferTypeAuto(next, {}));
            } else if (field === 'currentPrice') {
                Object.assign(next, applyOfferTypeAuto(next, {}));
            }
            return next;
        });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const fileArray = Array.from(files);
            const merged = [...formData.images, ...fileArray].slice(0, 8);
            imagePreviews.forEach((u) => URL.revokeObjectURL(u));
            const urls = merged.map((file) => URL.createObjectURL(file));

            setFormData((prev) => ({
                ...prev,
                images: merged
            }));

            setImagePreviews(urls);
            e.target.value = '';
            handleAnalyzeWithGemini(merged, formData.termsImages);
        }
    };

    const handleTermsImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const fileArray = Array.from(files);
            const merged = [...formData.termsImages, ...fileArray].slice(0, 8);
            termsImagePreviews.forEach((u) => URL.revokeObjectURL(u));
            const urls = merged.map((file) => URL.createObjectURL(file));

            setFormData((prev) => ({
                ...prev,
                termsImages: merged
            }));

            setTermsImagePreviews(urls);
            e.target.value = '';
            handleAnalyzeWithGemini(formData.images, merged);
        }
    };

    const removeImage = (index: number) => {
        const newImages = formData.images.filter((_, i) => i !== index);
        imagePreviews.forEach((u) => URL.revokeObjectURL(u));
        const urls = newImages.map((f) => URL.createObjectURL(f));

        setFormData((prev) => ({ ...prev, images: newImages }));
        setImagePreviews(urls);
    };

    const removeTermsImage = (index: number) => {
        const newFiles = formData.termsImages.filter((_, i) => i !== index);
        termsImagePreviews.forEach((u) => URL.revokeObjectURL(u));
        const urls = newFiles.map((f) => URL.createObjectURL(f));

        setFormData((prev) => ({ ...prev, termsImages: newFiles }));
        setTermsImagePreviews(urls);
    };

    const calculateDiscount = () => {
        if (formData.originalPrice > 0 && formData.currentPrice > 0) {
            return Math.round(((formData.originalPrice - formData.currentPrice) / formData.originalPrice) * 100);
        }
        return 0;
    };

    /** Tipo de cambio MXN→USD aproximado para vista previa (el backend usa tipo de cambio real al guardar). */
    const PREVIEW_FX_MXN_USD = 0.058;

    /** Valor promocional en USD = tokens (X tokens = X USD). Si la moneda es MXN, convierte a USD para el cálculo. */
    const calculatePromotionalValueUsd = (): number | null => {
        const { offerType, originalPrice, currentPrice, cashbackValue, currency } = formData;
        const rate = (currency || 'USD').toUpperCase() === 'MXN' ? PREVIEW_FX_MXN_USD : 1;
        const price = (Number(originalPrice) || 0) * rate;
        const current = (Number(currentPrice) ?? 0) * rate;
        if (price < 0) return null;
        switch (offerType) {
            case 'percentage': {
                const pct = price > 0 && current >= 0
                    ? ((price - current) / price) * 100
                    : 0;
                if (pct < 0 || pct > 100) return null;
                return Math.round((price * pct / 100) * 100) / 100;
            }
            case 'bogo':
                return price <= 0 ? null : Math.round((price / 2) * 100) / 100;
            case 'cashback_fixed': {
                const v = Number(cashbackValue);
                return Number.isFinite(v) && v >= 0 ? Math.round(v * 100) / 100 : null;
            }
            case 'cashback_percentage': {
                const pct = Number(cashbackValue) || 0;
                if (pct < 0 || pct > 100) return null;
                return Math.round((price * pct / 100) * 100) / 100;
            }
            default:
                return null;
        }
    };

    const promotionalValueUsd = calculatePromotionalValueUsd();
    const isMxn = (formData.currency || 'USD').toUpperCase() === 'MXN';

    const fieldInput =
        'w-full px-4 py-3 rounded-lg border border-white/15 bg-gray-900/60 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-400/50';
    const fieldInputCompact =
        'w-full px-4 py-2 rounded-lg border border-white/15 bg-gray-900/60 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-400/50';
    const fieldInputPrice =
        'w-full pl-8 pr-4 py-3 rounded-lg border border-white/15 bg-gray-900/60 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-400/50';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.images.length) {
            setSubmitError('Sube al menos una foto de la promoción.');
            return;
        }
        if (!formData.title.trim()) {
            setSubmitError('El título es requerido. Sube una foto para extraerlo con Gemini o escríbelo tú.');
            return;
        }
        if (formData.originalPrice < 0 || formData.currentPrice < 0) {
            setSubmitError('Los precios no pueden ser negativos');
            return;
        }
        if (formData.currentPrice > formData.originalPrice && formData.originalPrice > 0) {
            setSubmitError('El precio con oferta no puede ser mayor al precio original');
            return;
        }
        if (!formData.brand.trim()) {
            setSubmitError('Indica la marca: elige una de la lista o escribe el nombre manualmente.');
            return;
        }
        if (promotionType === 'quick-promotion' && redirectDestination === 'custom' && !customRedirectUrl.trim()) {
            setSubmitError('Para quick promotion con URL personalizada debes indicar la URL de compra.');
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const formDataToSend = new FormData();
            
            // Información básica
            formDataToSend.append('title', formData.title);
            formDataToSend.append('description', [formData.title.trim(), (formData.description || '').trim()].filter(Boolean).join(' ') || 'Promoción especial');
            formDataToSend.append('productName', formData.title);
            formDataToSend.append('brand', formData.brand);
            formDataToSend.append('category', formData.category);
            
            // Precios
            formDataToSend.append('originalPrice', formData.originalPrice.toString());
            formDataToSend.append('currentPrice', formData.currentPrice.toString());
            formDataToSend.append('currency', formData.currency);
            formDataToSend.append('discountPercentage', calculateDiscount().toString());
            
            // Ubicación y fechas
            formDataToSend.append('storeCity', formData.storeCity);
            const stateVal = formData.storeState.trim() || formData.storeCity;
            formDataToSend.append('storeState', stateVal);
            const addrLine = [
                formData.storeAddress.trim(),
                formData.storePostalCode.trim() ? `C.P. ${formData.storePostalCode.trim()}` : ''
            ]
                .filter(Boolean)
                .join(', ');
            if (addrLine) {
                formDataToSend.append('storeAddress', addrLine);
            }
            formDataToSend.append('validFrom', formData.validFrom);
            formDataToSend.append('validUntil', formData.validUntil);
            formDataToSend.append('totalQuantity', String(formData.totalQuantity > 0 ? formData.totalQuantity : 100));
            formDataToSend.append('offerType', formData.offerType);
            if (formData.offerType === 'cashback_fixed' || formData.offerType === 'cashback_percentage') {
                formDataToSend.append('cashbackValue', String(formData.cashbackValue));
            }
            if (formData.termsAndConditions?.trim()) {
                formDataToSend.append('termsAndConditions', formData.termsAndConditions.trim());
            }
            formDataToSend.append('activateByGps', formData.activateByGps ? 'true' : 'false');
            formDataToSend.append('gpsRadiusMeters', String(formData.gpsRadiusMeters));
            if (formData.storeLatitude.trim()) {
                formDataToSend.append('storeLatitude', formData.storeLatitude.trim());
            }
            if (formData.storeLongitude.trim()) {
                formDataToSend.append('storeLongitude', formData.storeLongitude.trim());
            }
            const chainPayload = formData.redemptionLocations
                .map((row) => {
                    const addr =
                        [row.address.trim(), row.postalCode.trim() ? `C.P. ${row.postalCode.trim()}` : '']
                            .filter(Boolean)
                            .join(', ') || row.address.trim();
                    return {
                        branchName: row.branchName.trim(),
                        address: addr,
                        city: row.city.trim(),
                        state: row.state.trim(),
                        country: 'México',
                        latitude: row.latitude.trim(),
                        longitude: row.longitude.trim(),
                        mapsUrl: row.mapsUrl.trim()
                    };
                })
                .filter(
                    (row) =>
                        row.branchName ||
                        row.address ||
                        row.city ||
                        row.state ||
                        (row.latitude && row.longitude)
                );
            if (chainPayload.length > 0) {
                formDataToSend.append('chainLocations', JSON.stringify(chainPayload));
                formDataToSend.append('isChainStore', 'true');
                if (formData.brand.trim()) {
                    formDataToSend.append('chainBrandName', formData.brand.trim());
                }
            }
            const o = formData.optionalAttribution;
            ['brandId', 'shopId', 'gtmTag', 'campaignId', 'source', 'medium'].forEach((k) => {
                const v = o[k as keyof PromotionOptionalAttribution];
                if (v !== undefined && v !== null && String(v).trim() !== '') {
                    formDataToSend.append(k, String(v).trim());
                }
            });
            if (o.externalProductId?.trim()) {
                formDataToSend.append('externalProductId', o.externalProductId.trim());
            }
            // Tipo de promoción: redirección en lugar de QR
            formDataToSend.append('redirectInsteadOfQr', promotionType === 'quick-promotion' ? 'true' : 'false');
            if (promotionType === 'quick-promotion') {
                if (redirectDestination === 'custom' && customRedirectUrl.trim()) {
                    formDataToSend.append('redirectToUrl', customRedirectUrl.trim());
                } else if (redirectDestination === 'amazon' && amazonProductUrl.trim()) {
                    formDataToSend.append('redirectToUrl', amazonProductUrl.trim());
                }
            }
            
            formData.images.forEach((file) => {
                formDataToSend.append('images', file);
            });
            formData.termsImages.forEach((file) => {
                formDataToSend.append('termsImages', file);
            });

            const response = await fetch('/api/promotions', {
                method: 'POST',
                body: formDataToSend
            });

            const { data, raw } = await readResponseBodyJson(response);

            if (response.ok && data.success) {
                const id = data.data != null && typeof data.data === 'object' && 'id' in data.data
                    ? String((data.data as { id: unknown }).id)
                    : null;
                if (data.mode === 'simulated' && typeof data.warning === 'string') {
                    window.alert(data.warning);
                }
                setSubmitSuccess(true);
                if (id) {
                    navigate(`/promotion-details/${id}`);
                } else {
                    setCreatedPromotionId(id);
                    setShowReward(true);
                }
            } else {
                let msg = formatPromotionCreateError(
                    data as { message?: unknown; fieldErrors?: Record<string, unknown> }
                );
                if (msg === 'Error al crear la promoción' || msg.trim() === '') {
                    if (response.status === 413) {
                        msg =
                            'El tamaño total de las fotos es demasiado grande para el servidor. Reduce la resolución o el número de imágenes.';
                    } else if (response.status === 429) {
                        msg = 'Demasiadas promociones desde esta red. Espera unos minutos e intenta de nuevo.';
                    } else if (response.status === 503) {
                        msg =
                            (typeof data.message === 'string' && data.message) ||
                            'Servicio no disponible (¿base de datos?). Revisa la configuración del servidor.';
                    } else if (response.status >= 500) {
                        msg = `Error del servidor (${response.status}). Revisa logs del API y MongoDB.`;
                    } else if (!response.ok && raw.trim().startsWith('<')) {
                        msg = `Respuesta inesperada del servidor (HTTP ${response.status}). Si subes muchas fotos, revisa en Nginx client_max_body_size para /api/.`;
                    } else if (!response.ok) {
                        msg = `No se pudo crear la promoción (HTTP ${response.status}).`;
                    }
                }
                throw new Error(msg);
            }
        } catch (error: any) {
            console.error('Error creando promoción:', error);
            setSubmitError(error.message || 'Error al crear la promoción. Por favor, intenta de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-gray-100">
            <div className="border-b border-white/10 bg-gray-900/50 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                            <Link to="/" className="text-gray-400 hover:text-amber-200 transition-colors shrink-0">
                                <ArrowLeft className="h-6 w-6" />
                            </Link>
                            <div className="min-w-0">
                                <h1 className="text-2xl font-bold text-white truncate">Agregar Promoción Rápida</h1>
                                <p className="text-sm text-gray-400">Crea una promoción en minutos</p>
                            </div>
                        </div>
                        <Link
                            to="/create-promotion"
                            className="text-sm text-violet-400 hover:text-violet-300 font-medium shrink-0"
                        >
                            Modo Avanzado →
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm p-6 mb-6 shadow-lg shadow-black/20">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="h-5 w-5 text-amber-400 shrink-0" />
                        <h2 className="text-lg font-semibold text-white">Plantillas Rápidas</h2>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">Selecciona una plantilla para pre-llenar el formulario</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {QUICK_TEMPLATES.map((template) => (
                            <button
                                key={template.name}
                                onClick={() => loadTemplate(template)}
                                type="button"
                                className="px-4 py-3 rounded-xl border border-violet-500/30 bg-violet-950/25 text-sm font-medium text-gray-200 hover:bg-violet-900/35 hover:border-violet-400/40 transition-all"
                            >
                                {template.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Modal de éxito: recompensa y redirección a la promoción */}
                {showReward && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="success-modal-title"
                        onClick={() => {
                            const id = createdPromotionId;
                            setShowReward(false);
                            setSubmitSuccess(false);
                            setFormData(emptyQuickForm());
                            setImagePreviews([]);
                            setTermsImagePreviews([]);
                            setCreatedPromotionId(null);
                            setPromotionType('coupon');
                            setRedirectDestination('amazon');
                            setCustomRedirectUrl('');
                            setAmazonProductUrl('');
                            if (id) navigate(`/promotion-details/${id}`);
                        }}
                    >
                        <div
                            className="rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-amber-500/30 bg-gray-900/95 backdrop-blur-md"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-gradient-to-r from-amber-950/50 via-gray-900/90 to-orange-950/40 p-6 border-b border-white/10">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center ring-2 ring-amber-400/30">
                                            <Gift className="w-7 h-7 text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 id="success-modal-title" className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                            <Zap className="w-5 h-5 text-amber-400 flex-shrink-0" />
                                            ¡Promoción Creada Exitosamente!
                                        </h3>
                                        <p className="text-base text-gray-200 mb-2">
                                            Has ganado <span className="font-bold text-amber-300">50 Tokens Luxae</span> de premio
                                        </p>
                                        <p className="text-sm text-gray-400 mb-4">
                                            Valida tu KYC para recibir tus tokens. Los tokens se acreditarán automáticamente una vez completada la verificación.
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const id = createdPromotionId;
                                                    setShowReward(false);
                                                    setSubmitSuccess(false);
                                                    setFormData(emptyQuickForm());
                                                    setImagePreviews([]);
                            setTermsImagePreviews([]);
                                                    setCreatedPromotionId(null);
                                                    setPromotionType('coupon');
                                                    setRedirectDestination('amazon');
                                                    setCustomRedirectUrl('');
                                                    setAmazonProductUrl('');
                                                    if (id) navigate(`/promotion-details/${id}`);
                                                }}
                                                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-medium hover:from-amber-500 hover:to-orange-500 transition-all shadow-lg shadow-amber-900/30"
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                                {createdPromotionId ? 'Ver promoción creada' : 'Aceptar'}
                                            </button>
                                            <Link
                                                to="/kyc-form"
                                                className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-amber-500/50 text-amber-200 rounded-xl font-medium hover:bg-amber-500/10 transition-colors"
                                                onClick={() => {
                                                    setShowReward(false);
                                                    setSubmitSuccess(false);
                                                    setFormData(emptyQuickForm());
                                                    setImagePreviews([]);
                            setTermsImagePreviews([]);
                                                    setCreatedPromotionId(null);
                                                    setPromotionType('coupon');
                                                    setRedirectDestination('amazon');
                                                    setCustomRedirectUrl('');
                                                    setAmazonProductUrl('');
                                                }}
                                            >
                                                Validar KYC Ahora
                                            </Link>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const id = createdPromotionId;
                                            setShowReward(false);
                                            setSubmitSuccess(false);
                                            setFormData(emptyQuickForm());
                                            setImagePreviews([]);
                                            setTermsImagePreviews([]);
                                            setCreatedPromotionId(null);
                                            setPromotionType('coupon');
                                            setRedirectDestination('amazon');
                                            setCustomRedirectUrl('');
                                            setAmazonProductUrl('');
                                            if (id) navigate(`/promotion-details/${id}`);
                                        }}
                                        className="flex-shrink-0 p-1 text-gray-500 hover:text-gray-200 rounded transition-colors"
                                        aria-label="Cerrar"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Guía BizneAI / definición legal y tokenización */}
                <div className="mb-6">
                    <PromotionLegalInfo variant="dark" />
                </div>

                <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm p-6 shadow-lg shadow-black/20">
                    {submitError && (
                        <div className="mb-6 bg-rose-950/40 border border-rose-500/35 rounded-xl p-4 flex items-start gap-3">
                            <div className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5">⚠️</div>
                            <div className="flex-1">
                                <p className="text-sm text-rose-100">{submitError}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSubmitError(null)}
                                className="text-rose-300 hover:text-rose-100"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* 1. Foto primero (opcional): ver CREAR_PROMOCION_APP_REFERENCIA.md — opcionalmente analyze-image con Gemini */}
                    <div className="mb-8 pb-8 border-b border-white/10">
                        <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-500/20 text-violet-200 ring-1 ring-violet-500/35 font-bold">1</span>
                            Fotos: promoción y términos
                        </h2>
                        <p className="text-sm text-gray-400 mb-4">
                            Sube el <strong>cartel</strong> (una o varias fotos). Opcional: fotos <strong>solo de términos y condiciones</strong>.
                            El servidor ejecuta OCR en todas; con Gemini se rellenan datos y texto legal.
                        </p>
                        <div className="border-2 border-dashed border-violet-500/35 rounded-xl p-6 text-center hover:border-violet-400/60 transition-colors bg-violet-950/25">
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageUpload}
                                className="hidden"
                                id="image-upload"
                            />
                            <label htmlFor="image-upload" className="cursor-pointer">
                                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                                <p className="text-sm text-gray-400">Cartel / promoción (máx. 8)</p>
                            </label>
                        </div>
                        {imagePreviews.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="relative group">
                                        <span className="absolute top-2 left-2 z-10 text-[10px] font-bold uppercase bg-violet-600 text-white px-2 py-0.5 rounded">Promo</span>
                                        <img
                                            src={preview}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-32 object-cover rounded-lg border border-white/10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <p className="text-sm font-medium text-gray-300 mt-6 mb-2">Términos y condiciones (opcional)</p>
                        <div className="border-2 border-dashed border-amber-500/30 rounded-xl p-6 text-center hover:border-amber-400/70 transition-colors bg-amber-950/20">
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleTermsImageUpload}
                                className="hidden"
                                id="terms-image-upload-quick"
                            />
                            <label htmlFor="terms-image-upload-quick" className="cursor-pointer">
                                <Upload className="mx-auto h-12 w-12 text-amber-400/90 mb-2" />
                                <p className="text-sm text-gray-400">Fotos solo de letra legal / reverso (máx. 8)</p>
                            </label>
                        </div>
                        {termsImagePreviews.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                {termsImagePreviews.map((preview, index) => (
                                    <div key={`t-${index}`} className="relative group">
                                        <span className="absolute top-2 left-2 z-10 text-[10px] font-bold uppercase bg-amber-600 text-white px-2 py-0.5 rounded">T&amp;C</span>
                                        <img
                                            src={preview}
                                            alt={`Términos ${index + 1}`}
                                            className="w-full h-32 object-cover rounded-lg border border-white/10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeTermsImage(index)}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {(imagePreviews.length > 0 || termsImagePreviews.length > 0) && (
                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleAnalyzeWithGemini()}
                                    disabled={isAnalyzing}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-medium hover:from-emerald-500 hover:to-teal-600 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20"
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                            Analizando con AI (Gemini)...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-5 w-5" />
                                            Analizar todas las fotos (Gemini)
                                        </>
                                    )}
                                </button>
                                <span className="text-xs text-gray-500">Incluye cartel y fotos de T&amp;C en un solo envío.</span>
                            </div>
                        )}
                        {analyzeError && <p className="mt-2 text-sm text-rose-400">{analyzeError}</p>}
                    </div>

                    {/* 2. Bloque de datos mínimos (doc: CREAR_PROMOCION_APP_REFERENCIA) */}
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-500/20 text-violet-200 ring-1 ring-violet-500/35 font-bold">2</span>
                        Datos mínimos
                    </h2>
                    <p className="text-sm text-gray-400 mb-6">
                        Título*, descripción, moneda, precios, tipo de oferta, vigencia, cantidad de cupones. Revisa lo que haya rellenado la AI y completa lo que falte.
                    </p>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Título de la Promoción *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                className={fieldInput}
                                placeholder="Ej: Oferta Especial de Electrónica"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Descripción adicional
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                rows={3}
                                className={fieldInput}
                                placeholder="Texto extra que se sumará al título (ej: condiciones, beneficios...)"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                La descripción final será: <strong>«{formData.title.trim() || 'Título'}</strong>{formData.description?.trim() ? ` ${formData.description.trim()}` : ''}».
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-300">
                                    Marca *
                                </label>
                                <select
                                    value={brandSelectValue}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        if (v === BRAND_CUSTOM) {
                                            handleInputChange('brand', '');
                                        } else {
                                            handleInputChange('brand', v);
                                        }
                                    }}
                                    className={fieldInput}
                                >
                                    {catalogBrandNames.map((name) => (
                                        <option key={name} value={name}>
                                            {name}
                                        </option>
                                    ))}
                                    <option value={BRAND_CUSTOM}>Otra marca / no está en la lista</option>
                                </select>
                                {brandSelectValue === BRAND_CUSTOM && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">
                Nombre de marca (texto libre)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.brand}
                                            onChange={(e) => handleInputChange('brand', e.target.value)}
                                            className={fieldInput}
                                            placeholder="Ej: tu marca o comercio"
                                            required
                                        />
                                    </div>
                                )}
                                <div className="rounded-lg border border-cyan-500/25 bg-cyan-950/20 px-3 py-2.5 text-xs text-cyan-100/95 leading-relaxed">
                                    <Smartphone className="inline h-3.5 w-3.5 mr-1 align-text-bottom text-cyan-300 shrink-0" />
                                    Si tu marca no aparece en la lista, descarga la app{' '}
                                    <a
                                        href="https://www.bizneai.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-medium text-cyan-300 underline hover:text-cyan-200"
                                    >
                                        BizneAI
                                    </a>{' '}
                                    en{' '}
                                    <a
                                        href="https://www.bizneai.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-mono text-cyan-200/90 hover:text-cyan-100"
                                    >
                                        www.bizneai.com
                                    </a>{' '}
                                    para dar de alta tu marca. Mientras tanto puedes escribir el nombre manualmente arriba.
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Categoría *
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => handleInputChange('category', e.target.value)}
                                    className={fieldInput}
                                    required
                                >
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-gray-950/35 p-4 space-y-4">
                            <div className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-amber-400 shrink-0" />
                                <h3 className="text-lg font-semibold text-white">Localizaciones para redimir</h3>
                            </div>
                            <p className="text-sm text-gray-400">
                                Agrega todas las tiendas o sucursales donde se puede canjear el cupón. Dirección, código
                                postal y ciudad permiten rellenar coordenadas con «Buscar coordenadas (mapa)» en cada fila;
                                abre el enlace para comprobar el punto en Google Maps.
                            </p>
                            {formData.redemptionLocations.length === 0 && (
                                <p className="text-xs text-gray-500">Sin filas aún — pulsa «Añadir localización».</p>
                            )}
                            <div className="space-y-4">
                                {formData.redemptionLocations.map((row, index) => (
                                    <div
                                        key={index}
                                        className="rounded-lg border border-white/10 bg-gray-900/50 p-4 space-y-3"
                                    >
                                        <div className="flex justify-between items-start gap-2">
                                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                                Punto {index + 1}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeRedemptionRow(index)}
                                                className="text-rose-400 hover:text-rose-300 p-1 rounded transition-colors"
                                                aria-label="Eliminar localización"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs text-gray-400 mb-1">Sucursal / nombre</label>
                                                <input
                                                    type="text"
                                                    value={row.branchName}
                                                    onChange={(e) => updateRedemptionRow(index, 'branchName', e.target.value)}
                                                    className={fieldInputCompact}
                                                    placeholder="Ej: Centro, Polanco"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-400 mb-1">Ciudad</label>
                                                <input
                                                    type="text"
                                                    value={row.city}
                                                    onChange={(e) => updateRedemptionRow(index, 'city', e.target.value)}
                                                    className={fieldInputCompact}
                                                    placeholder="Ciudad"
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-xs text-gray-400 mb-1">Dirección</label>
                                                <input
                                                    type="text"
                                                    value={row.address}
                                                    onChange={(e) => updateRedemptionRow(index, 'address', e.target.value)}
                                                    className={fieldInputCompact}
                                                    placeholder="Calle, número, colonia"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-400 mb-1">Código postal</label>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={row.postalCode}
                                                    onChange={(e) => updateRedemptionRow(index, 'postalCode', e.target.value)}
                                                    className={fieldInputCompact}
                                                    placeholder="CP"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-400 mb-1">Estado</label>
                                                <input
                                                    type="text"
                                                    value={row.state}
                                                    onChange={(e) => updateRedemptionRow(index, 'state', e.target.value)}
                                                    className={fieldInputCompact}
                                                    placeholder="Ej: CDMX, NL"
                                                />
                                            </div>
                                            <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => void geocodeRedemptionRowAt(index)}
                                                    disabled={geocodeRowLoading === index}
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-600/85 text-white text-xs font-medium hover:bg-amber-500 disabled:opacity-50"
                                                >
                                                    <Search className="h-3.5 w-3.5" />
                                                    {geocodeRowLoading === index ? 'Buscando…' : 'Buscar coordenadas (mapa)'}
                                                </button>
                                                {row.mapsUrl?.trim() && (
                                                    <a
                                                        href={row.mapsUrl.trim()}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs text-emerald-400 underline"
                                                    >
                                                        <ExternalLink className="h-3 w-3" />
                                                        Ver en Maps
                                                    </a>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-400 mb-1">Link a mapas (opcional)</label>
                                                <input
                                                    type="url"
                                                    value={row.mapsUrl}
                                                    onChange={(e) => updateRedemptionRow(index, 'mapsUrl', e.target.value)}
                                                    className={fieldInputCompact}
                                                    placeholder="https://maps.google.com/..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-400 mb-1">Latitud (opcional)</label>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={row.latitude}
                                                    onChange={(e) => updateRedemptionRow(index, 'latitude', e.target.value)}
                                                    className={fieldInputCompact}
                                                    placeholder="19.432608"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-400 mb-1">Longitud (opcional)</label>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={row.longitude}
                                                    onChange={(e) => updateRedemptionRow(index, 'longitude', e.target.value)}
                                                    className={fieldInputCompact}
                                                    placeholder="-99.133209"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {geocodeRowError && (
                                <p className="text-sm text-rose-300 bg-rose-950/25 border border-rose-500/20 rounded-lg px-3 py-2">
                                    {geocodeRowError}
                                </p>
                            )}
                            <button
                                type="button"
                                onClick={addRedemptionRow}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-500/40 text-amber-200 text-sm font-medium hover:bg-amber-500/10 transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                Añadir localización
                            </button>
                        </div>

                        {/* Tipo de promoción: cupón QR vs quick-promotion (redirección) */}
                        <div className="border-t border-white/10 pt-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Tag className="h-5 w-5 text-gray-400" />
                                <h3 className="text-lg font-semibold text-white">Tipo de promoción</h3>
                            </div>
                            <p className="text-sm text-gray-400 mb-4">
                                Cupón con QR: el usuario obtiene un código/QR para canjear en tienda. Quick promotion: se redirige directo a una página para comprar (ej. Amazon, Adidas).
                            </p>
                            <div className="flex flex-wrap gap-3 mb-4">
                                <label className="inline-flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="promotionType"
                                        checked={promotionType === 'coupon'}
                                        onChange={() => setPromotionType('coupon')}
                                        className="text-amber-500 focus:ring-amber-500/40 bg-gray-900/80 border-white/20"
                                    />
                                    <span className="flex items-center gap-1.5">
                                        <QrCode className="h-4 w-4" />
                                        Cupón con QR
                                    </span>
                                </label>
                                <label className="inline-flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="promotionType"
                                        checked={promotionType === 'quick-promotion'}
                                        onChange={() => setPromotionType('quick-promotion')}
                                        className="text-amber-500 focus:ring-amber-500/40 bg-gray-900/80 border-white/20"
                                    />
                                    <span className="flex items-center gap-1.5">
                                        <ExternalLink className="h-4 w-4" />
                                        Quick promotion (redirección)
                                    </span>
                                </label>
                            </div>
                            {promotionType === 'quick-promotion' && (
                                <div className="bg-violet-950/35 border border-violet-500/30 rounded-xl p-4 space-y-4">
                                    <p className="text-sm font-medium text-gray-700">¿A dónde redirigir?</p>
                                    <div className="flex flex-wrap gap-3">
                                        <label className="inline-flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="redirectDestination"
                                                checked={redirectDestination === 'amazon'}
                                                onChange={() => setRedirectDestination('amazon')}
                                                className="text-amber-600 focus:ring-amber-500"
                                            />
                                            <span>Amazon (link de afiliado por defecto)</span>
                                        </label>
                                        <label className="inline-flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="redirectDestination"
                                                checked={redirectDestination === 'custom'}
                                                onChange={() => setRedirectDestination('custom')}
                                                className="text-amber-600 focus:ring-amber-500"
                                            />
                                            <span>URL personalizada (Adidas, etc.)</span>
                                        </label>
                                    </div>
                                    {redirectDestination === 'amazon' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">URL del producto Amazon (opcional)</label>
                                            <input
                                                type="url"
                                                value={amazonProductUrl}
                                                onChange={(e) => setAmazonProductUrl(e.target.value)}
                                                placeholder="https://www.amazon.com.mx/dp/B0DMV3BMGP?th=1"
                                                className={fieldInput}
                                            />
                                            <p className="mt-1 text-xs text-gray-500">Pega el enlace del producto para redirigir directo a la compra. Se aplicará tu tag de afiliado. Si lo dejas vacío, se usará el link genérico por defecto.</p>
                                        </div>
                                    )}
                                    {redirectDestination === 'custom' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">URL de compra (afiliado o tienda)</label>
                                            <input
                                                type="url"
                                                value={customRedirectUrl}
                                                onChange={(e) => setCustomRedirectUrl(e.target.value)}
                                                placeholder="https://www.adidas.mx/..."
                                                className={fieldInput}
                                            />
                                            <p className="mt-1 text-xs text-gray-500">Ej: link de afiliado Adidas, Nike, etc.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Precios */}
                        <div className="border-t border-white/10 pt-6">
                            <div className="flex items-center gap-2 mb-4">
                                <DollarSign className="h-5 w-5 text-gray-400" />
                                <h3 className="text-lg font-semibold text-white">Precios</h3>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Moneda del producto
                                </label>
                                <select
                                    value={formData.currency || 'USD'}
                                    onChange={(e) => handleInputChange('currency', e.target.value)}
                                    className={`w-full max-w-xs ${fieldInput}`}
                                >
                                    <option value="USD">USD (Dólares americanos)</option>
                                    <option value="MXN">MXN (Pesos – producto en español)</option>
                                </select>
                                <p className="mt-1 text-xs text-gray-500">
                                    {isMxn
                                        ? 'Si tu producto está en pesos (español), elige MXN. Los tokens se calculan convirtiendo a USD.'
                                        : 'Los tokens siempre se expresan en USD (1 token = 1 USD).'}
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Precio Original * {isMxn && <span className="text-gray-500">(MXN)</span>}
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-gray-500">$</span>
                                        <input
                                            type="number"
                                            value={formData.originalPrice || ''}
                                            onChange={(e) => handleInputChange('originalPrice', parseFloat(e.target.value) || 0)}
                                            className={fieldInputPrice}
                                            placeholder={isMxn ? 'Ej: 60' : '0.00'}
                                            min="0"
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Precio con Oferta * {isMxn && <span className="text-gray-500">(MXN)</span>}
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-gray-500">$</span>
                                        <input
                                            type="number"
                                            value={formData.currentPrice || ''}
                                            onChange={(e) => handleInputChange('currentPrice', parseFloat(e.target.value) || 0)}
                                            className={fieldInputPrice}
                                            placeholder={isMxn ? 'Ej: 29' : '0.00'}
                                            min="0"
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Descuento
                                    </label>
                                    <div className="px-4 py-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg">
                                        <span className="text-2xl font-bold text-emerald-400">
                                            {calculateDiscount()}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                                Los cálculos de tokens se normalizan siempre en <strong>USD</strong> (unidad del stablecoin). Si elegiste MXN, el backend convierte a dólares al guardar.
                            </p>
                        </div>

                        {/* Tipo de promoción (cálculo de tokens) */}
                        <div className="border-t border-white/10 pt-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Tag className="h-5 w-5 text-violet-400" />
                                <h3 className="text-lg font-semibold text-white">Tipo de promoción y valor en tokens</h3>
                            </div>
                            <p className="text-sm text-gray-400 mb-4">
                                El tipo define cómo se calcula el valor promocional en USD. <strong>X tokens = X USD</strong> (pasivo financiero medible).
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Tipo de promoción
                                    </label>
                                    <select
                                        value={formData.offerType}
                                        onChange={(e) => handleInputChange('offerType', e.target.value as OfferType)}
                                        className={fieldInput}
                                    >
                                        {OFFER_TYPES.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label} – {opt.description}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {(formData.offerType === 'cashback_fixed' || formData.offerType === 'cashback_percentage') && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            {formData.offerType === 'cashback_fixed' ? 'Monto cashback (USD)' : 'Porcentaje cashback (0-100)'}
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={formData.offerType === 'cashback_percentage' ? 100 : undefined}
                                            step={formData.offerType === 'cashback_fixed' ? 0.01 : 1}
                                            value={formData.cashbackValue ?? ''}
                                            onChange={(e) => handleInputChange('cashbackValue', parseFloat(e.target.value) || 0)}
                                            className={fieldInput}
                                            placeholder={formData.offerType === 'cashback_fixed' ? '10' : '10'}
                                        />
                                    </div>
                                )}
                            </div>
                            {promotionalValueUsd != null && (
                                <div className="mt-4 p-4 bg-indigo-950/45 border border-indigo-500/30 rounded-xl">
                                    <p className="text-xs font-medium text-violet-300 uppercase tracking-wide mb-1">Vista previa de valor en tokens</p>
                                    <p className="text-sm font-medium text-gray-100">
                                        <span className="text-xl font-bold text-violet-300">{promotionalValueUsd.toFixed(2)} USD</span>
                                        <span className="text-gray-300 font-normal"> = {promotionalValueUsd.toFixed(2)} tokens</span>
                                    </p>
                                    {isMxn && (
                                        <p className="text-xs text-indigo-300/90 mt-1">
                                            Equivalente en dólares (vista previa con tipo de cambio aproximado). Al guardar se usará el tipo de cambio actual del servidor.
                                        </p>
                                    )}
                                    <p className="text-xs text-indigo-300/90 mt-1">Unidad calculable del contrato (pasivo financiero medible). Siempre en USD.</p>
                                </div>
                            )}
                        </div>

                        {/* Vigencia y límite de redenciones */}
                        <div className="border-t border-white/10 pt-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Calendar className="h-5 w-5 text-gray-400" />
                                <h3 className="text-lg font-semibold text-white">Vigencia y disponibilidad</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Fecha de inicio *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.validFrom}
                                        onChange={(e) => handleInputChange('validFrom', e.target.value)}
                                        className={fieldInput}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Fecha de fin *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.validUntil}
                                        onChange={(e) => handleInputChange('validUntil', e.target.value)}
                                        className={fieldInput}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Máximo de cupones redimibles
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={formData.totalQuantity || ''}
                                        onChange={(e) => handleInputChange('totalQuantity', parseInt(e.target.value, 10) || 0)}
                                        className={fieldInput}
                                        placeholder="100"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Límite legal y financiero de redenciones.</p>
                                </div>
                            </div>
                        </div>

                        {/* Ubicación y activación GPS */}
                        <div className="border-t border-white/10 pt-6 space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-amber-400" />
                                    Ubicación de la tienda (para mapa y GPS)
                                </h3>
                                <p className="text-xs text-gray-500 mb-4">
                                    Puedes rellenar dirección y código postal y usar «Buscar en mapa» para obtener
                                    latitud/longitud vía OpenStreetMap; el enlace abre Google Maps para que verifiques
                                    el punto.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Ciudad *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.storeCity}
                                        onChange={(e) => handleInputChange('storeCity', e.target.value)}
                                        className={fieldInput}
                                        placeholder="Ciudad de México"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Estado / entidad
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.storeState}
                                        onChange={(e) => handleInputChange('storeState', e.target.value)}
                                        className={fieldInput}
                                        placeholder="Ej: CDMX, Nuevo León, Jalisco"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Dirección (calle, número, colonia)</label>
                                <input
                                    type="text"
                                    value={formData.storeAddress}
                                    onChange={(e) => handleInputChange('storeAddress', e.target.value)}
                                    className={fieldInput}
                                    placeholder="Ej: Av. Insurgentes Sur 123, Col. Del Valle"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Código postal</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={formData.storePostalCode}
                                        onChange={(e) => handleInputChange('storePostalCode', e.target.value)}
                                        className={fieldInput}
                                        placeholder="Ej: 03100"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => void geocodeMainFromAddress()}
                                        disabled={geocodeMainLoading}
                                        className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-600/90 text-white text-sm font-medium hover:bg-amber-500 disabled:opacity-60 border border-amber-500/40"
                                    >
                                        <Search className="h-4 w-4 shrink-0" />
                                        {geocodeMainLoading ? 'Buscando…' : 'Buscar coordenadas (mapa)'}
                                    </button>
                                </div>
                            </div>
                            {geocodeMainError && (
                                <p className="text-sm text-rose-300 bg-rose-950/30 border border-rose-500/25 rounded-lg px-3 py-2">
                                    {geocodeMainError}
                                </p>
                            )}
                            {geocodeVerifiedUrl && (
                                <p className="text-sm text-emerald-200/95 flex flex-wrap items-center gap-2">
                                    <span>Ubicación encontrada.</span>
                                    <a
                                        href={geocodeVerifiedUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-emerald-400 underline hover:text-emerald-300"
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Verificar en Google Maps
                                    </a>
                                </p>
                            )}

                            <div className="border border-white/10 rounded-xl p-4 bg-gray-950/40 space-y-4 backdrop-blur-sm">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.activateByGps}
                                        onChange={(e) => handleInputChange('activateByGps', e.target.checked)}
                                        className="mt-1 rounded border-white/25 text-amber-500 focus:ring-amber-500/40 bg-gray-900/80"
                                    />
                                    <span>
                                        <span className="block text-sm font-medium text-white">Activación por ubicación (GPS)</span>
                                        <span className="block text-sm text-gray-400 mt-0.5">
                                            El usuario deberá estar cerca del punto de la tienda para obtener el cupón (validación en el navegador al solicitar el cupón).
                                        </span>
                                    </span>
                                </label>

                                {formData.activateByGps && (
                                    <>
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-400 mb-2">
                                                    En móvil puedes usar tu posición actual como punto de la tienda.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={fillStoreCoordsFromDevice}
                                                    disabled={gpsFromDeviceLoading}
                                                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 rounded-xl hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-violet-900/25 transition-colors"
                                                >
                                                    <Smartphone className="h-4 w-4 shrink-0" />
                                                    {gpsFromDeviceLoading ? 'Obteniendo ubicación…' : 'Obtener del dispositivo'}
                                                </button>
                                            </div>
                                        </div>
                                        {gpsFromDeviceError && (
                                            <p className="text-sm text-rose-200 bg-rose-950/40 border border-rose-500/30 rounded-lg px-3 py-2">{gpsFromDeviceError}</p>
                                        )}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">Latitud (WGS84)</label>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    placeholder="ej. 19.432608"
                                                    value={formData.storeLatitude}
                                                    onChange={(e) => handleInputChange('storeLatitude', e.target.value)}
                                                    className={fieldInputCompact}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">Longitud (WGS84)</label>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    placeholder="ej. -99.133209"
                                                    value={formData.storeLongitude}
                                                    onChange={(e) => handleInputChange('storeLongitude', e.target.value)}
                                                    className={fieldInputCompact}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">Radio permitido (metros)</label>
                                            <input
                                                type="number"
                                                min={50}
                                                max={50000}
                                                step={50}
                                                value={formData.gpsRadiusMeters}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'gpsRadiusMeters',
                                                        Math.min(50000, Math.max(50, parseInt(e.target.value, 10) || 500))
                                                    )
                                                }
                                                className={`w-full max-w-xs ${fieldInputCompact}`}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Entre 50 m y 50 km.</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <PromotionOptionalAttributionSection
                            idPrefix="quick-promo"
                            value={formData.optionalAttribution}
                            onChange={patchOptionalAttribution}
                            onShopSelect={applySelectedShopGps}
                            variant="dark"
                        />

                        {/* Términos y condiciones (opcional; se puede rellenar con Gemini) */}
                        <div className="border-t border-white/10 pt-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Términos y condiciones
                            </label>
                            <textarea
                                value={formData.termsAndConditions}
                                onChange={(e) => handleInputChange('termsAndConditions', e.target.value)}
                                rows={4}
                                className={fieldInput}
                                placeholder="Opcional. Si en la foto aparecen términos y condiciones, Gemini los habrá rellenado aquí."
                            />
                        </div>

                        {/* Botones */}
                        <div className="flex items-center justify-between pt-6 border-t border-white/10">
                            <Link
                                to="/promotions-marketplace"
                                className="text-gray-400 hover:text-amber-200 font-medium transition-colors"
                            >
                                Cancelar
                            </Link>
                            <button
                                type="submit"
                                disabled={isSubmitting || submitSuccess}
                                className={`px-8 py-3 rounded-xl font-medium transition-all shadow-lg ${
                                    isSubmitting || submitSuccess
                                        ? 'bg-emerald-600 text-white cursor-not-allowed shadow-emerald-900/20'
                                        : 'bg-gradient-to-r from-violet-600 to-indigo-700 text-white hover:from-violet-500 hover:to-indigo-600 shadow-violet-900/30'
                                }`}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Creando...
                                    </span>
                                ) : submitSuccess ? (
                                    <span className="flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" />
                                        ¡Creada!
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Zap className="w-5 h-5" />
                                        Crear Promoción
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
