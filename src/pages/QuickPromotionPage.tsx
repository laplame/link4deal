import React, { useState } from 'react';
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
    Sparkles
} from 'lucide-react';
import PromotionLegalInfo from '../components/PromotionLegalInfo';

type OfferType = 'percentage' | 'bogo' | 'cashback_fixed' | 'cashback_percentage';

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
    validFrom: string;
    validUntil: string;
    totalQuantity: number;
    images: File[];
    termsAndConditions: string;
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
    const [formData, setFormData] = useState<QuickPromotionData>({
        title: '',
        description: '',
        brand: '',
        category: 'electronics',
        originalPrice: 0,
        currentPrice: 0,
        currency: 'USD',
        storeCity: 'Ciudad de México',
        validFrom: defaultValidFrom,
        validUntil: defaultValidUntil,
        totalQuantity: 100,
        offerType: 'percentage',
        cashbackValue: 0,
        images: [],
        termsAndConditions: ''
    });
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analyzeError, setAnalyzeError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [showReward, setShowReward] = useState(false);
    const [createdPromotionId, setCreatedPromotionId] = useState<string | null>(null);

    const loadTemplate = (template: typeof QUICK_TEMPLATES[0]) => {
        setFormData({
            ...formData,
            ...template.data,
            images: [],
            termsAndConditions: formData.termsAndConditions
        });
        setImagePreviews([]);
    };

    /** Analiza imágenes con Gemini. Si se pasan `files`, se usan esos; si no, formData.images. */
    const handleAnalyzeWithGemini = async (files?: File[]) => {
        const toUse = files && files.length > 0 ? files : formData.images;
        if (toUse.length === 0) {
            setAnalyzeError('Sube al menos una imagen para analizar.');
            return;
        }
        setIsAnalyzing(true);
        setAnalyzeError(null);
        try {
            const fd = new FormData();
            toUse.forEach((file) => fd.append('images', file));
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
            const fileArray = Array.from(files).slice(0, 5);
            const newFiles = [...formData.images, ...fileArray].slice(0, 5);
            
            setFormData(prev => ({
                ...prev,
                images: newFiles
            }));

            const newPreviews = fileArray.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews].slice(0, 5));
            e.target.value = '';
            // Prioridad foto: analizar con Gemini en cuanto haya imágenes y rellenar el formulario
            handleAnalyzeWithGemini(newFiles);
        }
    };

    const removeImage = (index: number) => {
        const newImages = formData.images.filter((_, i) => i !== index);
        const newPreviews = imagePreviews.filter((_, i) => i !== index);
        
        // Revocar URL
        URL.revokeObjectURL(imagePreviews[index]);
        
        setFormData(prev => ({ ...prev, images: newImages }));
        setImagePreviews(newPreviews);
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
            formDataToSend.append('storeState', formData.storeCity);
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
            
            // Imágenes
            formData.images.forEach((file) => {
                formDataToSend.append('images', file);
            });

            const response = await fetch('/api/promotions', {
                method: 'POST',
                body: formDataToSend
            });

            const data = await response.json();

            if (response.ok && data.success) {
                const id = data.data?.id ?? null;
                setSubmitSuccess(true);
                if (id) {
                    navigate(`/promotion-details/${id}`);
                } else {
                    setCreatedPromotionId(id);
                    setShowReward(true);
                }
            } else {
                throw new Error(data.message || 'Error al crear la promoción');
            }
        } catch (error: any) {
            console.error('Error creando promoción:', error);
            setSubmitError(error.message || 'Error al crear la promoción. Por favor, intenta de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link 
                                to="/" 
                                className="text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                <ArrowLeft className="h-6 w-6" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Agregar Promoción Rápida</h1>
                                <p className="text-sm text-gray-600">Crea una promoción en minutos</p>
                            </div>
                        </div>
                        <Link
                            to="/create-promotion"
                            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                        >
                            Modo Avanzado →
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Templates Rápidos */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Plantillas Rápidas</h2>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Selecciona una plantilla para pre-llenar el formulario</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {QUICK_TEMPLATES.map((template) => (
                            <button
                                key={template.name}
                                onClick={() => loadTemplate(template)}
                                className="px-4 py-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg hover:from-purple-100 hover:to-blue-100 transition-all text-sm font-medium text-gray-700"
                            >
                                {template.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Modal de éxito: recompensa y redirección a la promoción */}
                {showReward && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="success-modal-title"
                        onClick={() => {
                            const id = createdPromotionId;
                            setShowReward(false);
                            setSubmitSuccess(false);
                            setFormData({ title: '', description: '', brand: '', category: 'electronics', originalPrice: 0, currentPrice: 0, currency: 'USD', storeCity: 'Ciudad de México', validFrom: defaultValidFrom, validUntil: defaultValidUntil, totalQuantity: 100, offerType: 'percentage', cashbackValue: 0, images: [], termsAndConditions: '' });
                            setImagePreviews([]);
                            setCreatedPromotionId(null);
                            if (id) navigate(`/promotion-details/${id}`);
                        }}
                    >
                        <div
                            className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border-2 border-yellow-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                                            <Gift className="w-7 h-7 text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 id="success-modal-title" className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                                            <Zap className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                                            ¡Promoción Creada Exitosamente!
                                        </h3>
                                        <p className="text-base text-gray-800 mb-2">
                                            Has ganado <span className="font-bold text-orange-600">50 Tokens Luxae</span> de premio
                                        </p>
                                        <p className="text-sm text-gray-600 mb-4">
                                            Valida tu KYC para recibir tus tokens. Los tokens se acreditarán automáticamente una vez completada la verificación.
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const id = createdPromotionId;
                                                    setShowReward(false);
                                                    setSubmitSuccess(false);
                                                    setFormData({
                                                        title: '',
                                                        description: '',
                                                        brand: '',
                                                        category: 'electronics',
                                                        originalPrice: 0,
                                                        currentPrice: 0,
                                                        currency: 'USD',
                                                        storeCity: 'Ciudad de México',
                                                        validFrom: defaultValidFrom,
                                                        validUntil: defaultValidUntil,
                                                        totalQuantity: 100,
                                                        offerType: 'percentage',
                                                        cashbackValue: 0,
                                                        images: [],
                                                        termsAndConditions: ''
                                                    });
                                                    setImagePreviews([]);
                                                    setCreatedPromotionId(null);
                                                    if (id) navigate(`/promotion-details/${id}`);
                                                }}
                                                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-yellow-600 transition-all shadow-md"
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                                {createdPromotionId ? 'Ver promoción creada' : 'Aceptar'}
                                            </button>
                                            <Link
                                                to="/kyc-form"
                                                className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-orange-400 text-orange-600 rounded-lg font-medium hover:bg-orange-50 transition-colors"
                                                onClick={() => {
                                                    setShowReward(false);
                                                    setSubmitSuccess(false);
                                                    setFormData({ title: '', description: '', brand: '', category: 'electronics', originalPrice: 0, currentPrice: 0, currency: 'USD', storeCity: 'Ciudad de México', validFrom: defaultValidFrom, validUntil: defaultValidUntil, totalQuantity: 100, offerType: 'percentage', cashbackValue: 0, images: [], termsAndConditions: '' });
                                                    setImagePreviews([]);
                                                    setCreatedPromotionId(null);
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
                                            setFormData({ title: '', description: '', brand: '', category: 'electronics', originalPrice: 0, currentPrice: 0, currency: 'USD', storeCity: 'Ciudad de México', validFrom: defaultValidFrom, validUntil: defaultValidUntil, totalQuantity: 100, offerType: 'percentage', cashbackValue: 0, images: [], termsAndConditions: '' });
                                            setImagePreviews([]);
                                            setCreatedPromotionId(null);
                                            if (id) navigate(`/promotion-details/${id}`);
                                        }}
                                        className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded"
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
                    <PromotionLegalInfo />
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    {submitError && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <div className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5">⚠️</div>
                            <div className="flex-1">
                                <p className="text-sm text-red-800">{submitError}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSubmitError(null)}
                                className="text-red-600 hover:text-red-800"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* 1. Prioridad: foto de la promoción → Gemini extrae datos */}
                    <div className="mb-8 pb-8 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold">1</span>
                            Sube la foto de la promoción
                        </h2>
                        <p className="text-sm text-gray-600 mb-4">
                            Con Gemini extraemos título, precios, marca y términos si aparecen. Luego solo completa lo que falte.
                        </p>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
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
                                <p className="text-sm text-gray-600">Haz clic o arrastra aquí la foto (máx. 5)</p>
                                <p className="text-xs text-gray-500 mt-1">Se analizará automáticamente con Gemini</p>
                            </label>
                        </div>
                        {imagePreviews.length > 0 && (
                            <>
                                <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                                    {imagePreviews.map((preview, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={preview}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-32 object-cover rounded-lg border border-gray-200"
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
                                <div className="mt-4 flex flex-wrap items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleAnalyzeWithGemini()}
                                        disabled={isAnalyzing}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-teal-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                                Analizando con Gemini...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="h-5 w-5" />
                                                Volver a analizar
                                            </>
                                        )}
                                    </button>
                                    <span className="text-xs text-gray-500">Reanaliza si cambiaste la imagen.</span>
                                </div>
                                {analyzeError && <p className="mt-2 text-sm text-red-600">{analyzeError}</p>}
                            </>
                        )}
                    </div>

                    {/* 2. Completa solo lo que no se haya detectado */}
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold">2</span>
                        Completa lo que falte
                    </h2>
                    <p className="text-sm text-gray-600 mb-6">
                        Revisa y rellena solo los datos que Gemini no pudo obtener (por ejemplo fechas, ciudad, cantidad de cupones).
                    </p>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Título de la Promoción *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Ej: Oferta Especial de Electrónica"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Descripción adicional
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Texto extra que se sumará al título (ej: condiciones, beneficios...)"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                La descripción final será: <strong>«{formData.title.trim() || 'Título'}</strong>{formData.description?.trim() ? ` ${formData.description.trim()}` : ''}».
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Marca *
                                </label>
                                <input
                                    type="text"
                                    value={formData.brand}
                                    onChange={(e) => handleInputChange('brand', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Ej: Apple, Nike, Samsung"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Categoría *
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => handleInputChange('category', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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

                        {/* Precios */}
                        <div className="border-t border-gray-200 pt-6">
                            <div className="flex items-center gap-2 mb-4">
                                <DollarSign className="h-5 w-5 text-gray-600" />
                                <h3 className="text-lg font-semibold text-gray-900">Precios</h3>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Moneda del producto
                                </label>
                                <select
                                    value={formData.currency || 'USD'}
                                    onChange={(e) => handleInputChange('currency', e.target.value)}
                                    className="w-full max-w-xs px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Precio Original * {isMxn && <span className="text-gray-500">(MXN)</span>}
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-gray-500">$</span>
                                        <input
                                            type="number"
                                            value={formData.originalPrice || ''}
                                            onChange={(e) => handleInputChange('originalPrice', parseFloat(e.target.value) || 0)}
                                            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder={isMxn ? 'Ej: 60' : '0.00'}
                                            min="0"
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Precio con Oferta * {isMxn && <span className="text-gray-500">(MXN)</span>}
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-gray-500">$</span>
                                        <input
                                            type="number"
                                            value={formData.currentPrice || ''}
                                            onChange={(e) => handleInputChange('currentPrice', parseFloat(e.target.value) || 0)}
                                            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder={isMxn ? 'Ej: 29' : '0.00'}
                                            min="0"
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Descuento
                                    </label>
                                    <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
                                        <span className="text-2xl font-bold text-green-600">
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
                        <div className="border-t border-gray-200 pt-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Tag className="h-5 w-5 text-indigo-600" />
                                <h3 className="text-lg font-semibold text-gray-900">Tipo de promoción y valor en tokens</h3>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">
                                El tipo define cómo se calcula el valor promocional en USD. <strong>X tokens = X USD</strong> (pasivo financiero medible).
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tipo de promoción
                                    </label>
                                    <select
                                        value={formData.offerType}
                                        onChange={(e) => handleInputChange('offerType', e.target.value as OfferType)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {formData.offerType === 'cashback_fixed' ? 'Monto cashback (USD)' : 'Porcentaje cashback (0-100)'}
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={formData.offerType === 'cashback_percentage' ? 100 : undefined}
                                            step={formData.offerType === 'cashback_fixed' ? 0.01 : 1}
                                            value={formData.cashbackValue ?? ''}
                                            onChange={(e) => handleInputChange('cashbackValue', parseFloat(e.target.value) || 0)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder={formData.offerType === 'cashback_fixed' ? '10' : '10'}
                                        />
                                    </div>
                                )}
                            </div>
                            {promotionalValueUsd != null && (
                                <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                                    <p className="text-sm font-medium text-indigo-900">
                                        Valor en tokens (USD): <span className="text-xl font-bold text-indigo-600">{promotionalValueUsd.toFixed(2)} USD</span>
                                        <span className="text-indigo-700 font-normal"> = {promotionalValueUsd.toFixed(2)} tokens</span>
                                    </p>
                                    {isMxn && (
                                        <p className="text-xs text-indigo-600 mt-1">
                                            Equivalente en dólares (vista previa con tipo de cambio aproximado). Al guardar se usará el tipo de cambio actual del servidor.
                                        </p>
                                    )}
                                    <p className="text-xs text-indigo-600 mt-1">Unidad calculable del contrato (pasivo financiero medible). Siempre en USD.</p>
                                </div>
                            )}
                        </div>

                        {/* Vigencia y límite de redenciones */}
                        <div className="border-t border-gray-200 pt-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Calendar className="h-5 w-5 text-gray-600" />
                                <h3 className="text-lg font-semibold text-gray-900">Vigencia y disponibilidad</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Fecha de inicio *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.validFrom}
                                        onChange={(e) => handleInputChange('validFrom', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Fecha de fin *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.validUntil}
                                        onChange={(e) => handleInputChange('validUntil', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Máximo de cupones redimibles
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={formData.totalQuantity || ''}
                                        onChange={(e) => handleInputChange('totalQuantity', parseInt(e.target.value, 10) || 0)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="100"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Límite legal y financiero de redenciones.</p>
                                </div>
                            </div>
                        </div>

                        {/* Ubicación */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-200 pt-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <MapPin className="h-4 w-4 inline mr-1" />
                                    Ciudad *
                                </label>
                                <input
                                    type="text"
                                    value={formData.storeCity}
                                    onChange={(e) => handleInputChange('storeCity', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Ciudad de México"
                                    required
                                />
                            </div>
                        </div>

                        {/* Términos y condiciones (opcional; se puede rellenar con Gemini) */}
                        <div className="border-t border-gray-200 pt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Términos y condiciones
                            </label>
                            <textarea
                                value={formData.termsAndConditions}
                                onChange={(e) => handleInputChange('termsAndConditions', e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Opcional. Si en la foto aparecen términos y condiciones, Gemini los habrá rellenado aquí."
                            />
                        </div>

                        {/* Botones */}
                        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                            <Link
                                to="/promotions-marketplace"
                                className="text-gray-600 hover:text-gray-900 font-medium"
                            >
                                Cancelar
                            </Link>
                            <button
                                type="submit"
                                disabled={isSubmitting || submitSuccess}
                                className={`px-8 py-3 rounded-lg font-medium transition-all ${
                                    isSubmitting || submitSuccess
                                        ? 'bg-green-500 text-white cursor-not-allowed'
                                        : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg'
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
