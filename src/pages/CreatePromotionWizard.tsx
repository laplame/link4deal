import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
    ArrowLeft, 
    ArrowRight, 
    CheckCircle, 
    Circle, 
    Plus, 
    Trash2,
    Upload,
    DollarSign,
    Calendar,
    Tag,
    MapPin,
    Users,
    FileText,
    Smartphone,
    Globe,
    Zap,
    Sparkles,
    Loader2
} from 'lucide-react';
import PromotionLegalInfo from '../components/PromotionLegalInfo';
import PromotionOptionalAttributionSection, {
    emptyPromotionOptionalAttribution,
    type PromotionOptionalAttribution
} from '../components/PromotionOptionalAttributionSection';
import type { BizneShop } from '../components/BizneShopCard';
import { formatPromotionCreateError } from '../utils/formatPromotionCreateError';

interface PromotionData {
    basicInfo: {
        title: string;
        description: string;
        category: string;
        subcategory: string;
        brand: string;
    };
    pricing: {
        originalPrice: number;
        offerPrice: number;
        currency: string;
        offerType: 'percentage' | 'fixed' | 'bogo';
        offerValue: number;
    };
    inventory: {
        totalQuantity: number;
        minOrderQuantity: number;
        maxOrderQuantity: number;
        stock: number;
    };
    timing: {
        startDate: string;
        endDate: string;
        validUntil: string;
        isLimitedTime: boolean;
    };
    targeting: {
        targetAudience: string[];
        ageRange: string;
        location: string[];
        interests: string[];
        influencerRequirements: string[];
        /** Cupón solo activable dentro del radio GPS respecto al punto de la tienda */
        activateByGps: boolean;
        gpsRadiusMeters: number;
        storeLatitude: string;
        storeLongitude: string;
        /** Misma promoción en varias sucursales (cadena); el cliente usa la más cercana con GPS */
        isChainStore: boolean;
        chainBrandName: string;
        chainBranches: Array<{
            key: string;
            branchName: string;
            address: string;
            city: string;
            latitude: string;
            longitude: string;
            mapsUrl: string;
        }>;
    };
    smartContract: {
        network: string;
        tokenStandard: string;
        commissionStructure: 'percentage' | 'fixed';
        commissionValue: number;
        referralRewards: boolean;
    };
    media: {
        images: string[];
        videos: string[];
        documents: string[];
    };
    terms: {
        conditions: string[];
        restrictions: string[];
        benefits: string[];
        returnPolicy: string;
        warranty: string;
    };
    optionalAttribution: PromotionOptionalAttribution;
}

type ChainPresetMeta = {
    id: string;
    label: string;
    chainBrandName: string;
    branchCount: number;
};

const categories = [
    { name: "Electrónica", subcategories: ["Smartphones", "Laptops", "Auriculares", "Smartwatches", "Tablets"] },
    { name: "Moda", subcategories: ["Ropa", "Zapatos", "Accesorios", "Bolsos", "Joyería"] },
    { name: "Hogar", subcategories: ["Muebles", "Decoración", "Cocina", "Jardín", "Iluminación"] },
    { name: "Deportes", subcategories: ["Fitness", "Running", "Fútbol", "Natación", "Ciclismo"] },
    { name: "Fotografía", subcategories: ["Cámaras", "Lentes", "Trípodes", "Iluminación", "Accesorios"] },
    { name: "Comida y Bebidas", subcategories: ["Restaurantes", "Delivery", "Bebidas", "Snacks", "Postres"] },
    { name: "Servicios", subcategories: ["Educación", "Salud", "Belleza", "Transporte", "Entretenimiento"] },
    { name: "Productos Digitales", subcategories: ["Software", "Cursos Online", "E-books", "Música", "Streaming"] },
    { name: "Viajes y Turismo", subcategories: ["Hoteles", "Vuelos", "Paquetes", "Actividades", "Seguros"] },
    { name: "Belleza y Cuidado", subcategories: ["Cosméticos", "Skincare", "Perfumes", "Tratamientos", "Accesorios"] }
];

const steps = [
    { id: 'media', title: 'Foto de la promoción', icon: <Upload className="h-5 w-5" /> },
    { id: 'basicInfo', title: 'Información Básica', icon: <FileText className="h-5 w-5" /> },
    { id: 'pricing', title: 'Precios y Ofertas', icon: <DollarSign className="h-5 w-5" /> },
    { id: 'inventory', title: 'Inventario', icon: <Smartphone className="h-5 w-5" /> },
    { id: 'timing', title: 'Tiempo y Validez', icon: <Calendar className="h-5 w-5" /> },
    { id: 'targeting', title: 'Audiencia y GPS', icon: <Users className="h-5 w-5" /> },
    { id: 'smartContract', title: 'Smart Contract', icon: <Zap className="h-5 w-5" /> },
    { id: 'terms', title: 'Términos y Condiciones', icon: <Tag className="h-5 w-5" /> }
];

export default function CreatePromotionWizard() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [promotionData, setPromotionData] = useState<PromotionData>({
        basicInfo: {
            title: '',
            description: '',
            category: '',
            subcategory: '',
            brand: ''
        },
        pricing: {
            originalPrice: 0,
            offerPrice: 0,
            currency: 'USD',
            offerType: 'percentage',
            offerValue: 0
        },
        inventory: {
            totalQuantity: 0,
            minOrderQuantity: 1,
            maxOrderQuantity: 0,
            stock: 0
        },
        timing: {
            startDate: '',
            endDate: '',
            validUntil: '',
            isLimitedTime: false
        },
        targeting: {
            targetAudience: [],
            ageRange: '',
            location: [],
            interests: [],
            influencerRequirements: [],
            activateByGps: false,
            gpsRadiusMeters: 500,
            storeLatitude: '',
            storeLongitude: '',
            isChainStore: false,
            chainBrandName: '',
            chainBranches: []
        },
        smartContract: {
            network: 'Ethereum',
            tokenStandard: 'ERC-777',
            commissionStructure: 'percentage',
            commissionValue: 0,
            referralRewards: true
        },
        media: {
            images: [],
            videos: [],
            documents: []
        },
        terms: {
            conditions: [],
            restrictions: [],
            benefits: [],
            returnPolicy: '',
            warranty: ''
        },
        optionalAttribution: emptyPromotionOptionalAttribution()
    });

    useEffect(() => {
        if (searchParams.get('importChain') !== '1') return;
        const raw = sessionStorage.getItem('link4deal_chain_import');
        if (!raw) return;
        try {
            const data = JSON.parse(raw) as {
                chainBrandName?: string;
                chainLocations?: Array<{
                    branchName?: string;
                    address?: string;
                    city?: string;
                    coordinates?: { latitude?: number; longitude?: number };
                    mapsUrl?: string;
                }>;
            };
            const locs = Array.isArray(data.chainLocations) ? data.chainLocations : [];
            const branches = locs.map((loc, i) => ({
                key: `imp-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
                branchName: loc.branchName != null ? String(loc.branchName) : '',
                address: loc.address != null ? String(loc.address) : '',
                city: loc.city != null ? String(loc.city) : '',
                latitude:
                    loc.coordinates?.latitude != null && Number.isFinite(loc.coordinates.latitude)
                        ? String(loc.coordinates.latitude)
                        : '',
                longitude:
                    loc.coordinates?.longitude != null && Number.isFinite(loc.coordinates.longitude)
                        ? String(loc.coordinates.longitude)
                        : '',
                mapsUrl: loc.mapsUrl != null ? String(loc.mapsUrl) : ''
            }));
            if (branches.length === 0) return;
            setPromotionData((prev) => ({
                ...prev,
                targeting: {
                    ...prev.targeting,
                    isChainStore: true,
                    chainBrandName:
                        (data.chainBrandName != null && String(data.chainBrandName).trim()) ||
                        prev.targeting.chainBrandName,
                    chainBranches: branches
                }
            }));
            sessionStorage.removeItem('link4deal_chain_import');
            setSearchParams({}, { replace: true });
            const targetingIdx = steps.findIndex((s) => s.id === 'targeting');
            if (targetingIdx >= 0) setCurrentStep(targetingIdx);
        } catch {
            /* ignore */
        }
    }, [searchParams, setSearchParams]);

    const catalogChainParam = searchParams.get('catalogChain');

    useEffect(() => {
        if (!catalogChainParam?.trim()) return;
        let cancelled = false;
        const id = catalogChainParam.trim();
        (async () => {
            setChainPresetApplying(true);
            setChainPresetLoadError(null);
            try {
                const res = await fetch(`/api/geo/chain-presets/${encodeURIComponent(id)}`);
                const data = await res.json();
                if (cancelled) return;
                if (!data.success || !data.preset) {
                    setChainPresetLoadError(data.message || 'Catálogo no encontrado');
                    setChainPresetApplying(false);
                    return;
                }
                const preset = data.preset as {
                    id?: string;
                    label?: string;
                    chainBrandName?: string;
                    chainLocations?: Array<{
                        branchName?: string;
                        address?: string;
                        city?: string;
                        coordinates?: { latitude?: number; longitude?: number };
                        mapsUrl?: string;
                    }>;
                };
                const locs = Array.isArray(preset.chainLocations) ? preset.chainLocations : [];
                const branches = locs.map((loc, i) => ({
                    key: `cat-url-${id}-${i}-${Math.random().toString(36).slice(2, 9)}`,
                    branchName: loc.branchName != null ? String(loc.branchName) : '',
                    address: loc.address != null ? String(loc.address) : '',
                    city: loc.city != null ? String(loc.city) : '',
                    latitude:
                        loc.coordinates?.latitude != null && Number.isFinite(loc.coordinates.latitude)
                            ? String(loc.coordinates.latitude)
                            : '',
                    longitude:
                        loc.coordinates?.longitude != null && Number.isFinite(loc.coordinates.longitude)
                            ? String(loc.coordinates.longitude)
                            : '',
                    mapsUrl: loc.mapsUrl != null ? String(loc.mapsUrl) : ''
                }));
                setPromotionData((prev) => ({
                    ...prev,
                    basicInfo: {
                        ...prev.basicInfo,
                        brand:
                            prev.basicInfo.brand ||
                            (preset.chainBrandName != null ? String(preset.chainBrandName).trim() : '') ||
                            (preset.label != null ? String(preset.label).trim() : '') ||
                            prev.basicInfo.brand
                    },
                    targeting: {
                        ...prev.targeting,
                        isChainStore: true,
                        chainBrandName:
                            (preset.chainBrandName != null && String(preset.chainBrandName).trim()) ||
                            (preset.label != null && String(preset.label).trim()) ||
                            prev.targeting.chainBrandName,
                        chainBranches: branches
                    }
                }));
                setChainPresetId(String(preset.id || id));
                setSearchParams(
                    (prev) => {
                        const next = new URLSearchParams(prev);
                        next.delete('catalogChain');
                        return next;
                    },
                    { replace: true }
                );
                const targetingIdx = steps.findIndex((s) => s.id === 'targeting');
                if (targetingIdx >= 0) setCurrentStep(targetingIdx);
                if (branches.length === 0) {
                    setChainPresetLoadError(
                        'Este catálogo no tiene sucursales con coordenadas. Complétalo en Importar sucursales.'
                    );
                }
            } catch {
                if (!cancelled) setChainPresetLoadError('Error al cargar el catálogo');
            } finally {
                if (!cancelled) setChainPresetApplying(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [catalogChainParam, setSearchParams]);

    const [chainPresets, setChainPresets] = useState<ChainPresetMeta[]>([]);
    const [chainPresetId, setChainPresetId] = useState('');
    const [chainPresetApplying, setChainPresetApplying] = useState(false);
    const [chainPresetLoadError, setChainPresetLoadError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch('/api/geo/chain-presets');
                const data = await res.json();
                if (!cancelled && data.success && Array.isArray(data.presets)) {
                    setChainPresets(data.presets);
                }
            } catch {
                /* ignore */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const [gpsFromDeviceLoading, setGpsFromDeviceLoading] = useState(false);
    const [gpsFromDeviceError, setGpsFromDeviceError] = useState<string | null>(null);

    const [promotionalImageFiles, setPromotionalImageFiles] = useState<File[]>([]);
    const [promotionalPreviewUrls, setPromotionalPreviewUrls] = useState<string[]>([]);
    const [termsImageFiles, setTermsImageFiles] = useState<File[]>([]);
    const [termsPreviewUrls, setTermsPreviewUrls] = useState<string[]>([]);
    const [isAnalyzingMedia, setIsAnalyzingMedia] = useState(false);
    const [analyzeMediaError, setAnalyzeMediaError] = useState<string | null>(null);

    const updatePromotionData = (section: keyof PromotionData, data: Partial<PromotionData[keyof PromotionData]>) => {
        setPromotionData(prev => ({
            ...prev,
            [section]: { ...prev[section], ...data }
        }));
    };

    const applySelectedShopGps = (
        shop: BizneShop,
        coordinates: { latitude: number; longitude: number } | null
    ) => {
        if (!coordinates) return;
        setPromotionData((prev) => ({
            ...prev,
            basicInfo: {
                ...prev.basicInfo,
                brand: prev.basicInfo.brand || shop.storeName || prev.basicInfo.brand
            },
            targeting: {
                ...prev.targeting,
                activateByGps: true,
                storeLatitude: String(coordinates.latitude),
                storeLongitude: String(coordinates.longitude),
                location: shop.city ? [shop.city] : prev.targeting.location
            }
        }));
    };

    const fillGpsCoordinatesFromDevice = () => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            setGpsFromDeviceError('Tu navegador no permite geolocalización.');
            return;
        }
        setGpsFromDeviceLoading(true);
        setGpsFromDeviceError(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                updatePromotionData('targeting', {
                    storeLatitude: String(pos.coords.latitude),
                    storeLongitude: String(pos.coords.longitude)
                });
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

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const goToStep = (stepIndex: number) => {
        setCurrentStep(stepIndex);
    };

    const isStepValid = (stepIndex: number): boolean => {
        const step = steps[stepIndex];
        switch (step.id) {
            case 'media':
                return promotionalImageFiles.length > 0;
            case 'basicInfo':
                return !!(promotionData.basicInfo.title && promotionData.basicInfo.category && promotionData.basicInfo.brand);
            case 'pricing':
                return !!(promotionData.pricing.originalPrice > 0 && promotionData.pricing.offerPrice > 0);
            case 'inventory':
                return !!(promotionData.inventory.totalQuantity > 0);
            case 'timing':
                return !!(promotionData.timing.startDate && promotionData.timing.endDate);
            default:
                return true;
        }
    };

    const getStepProgress = () => {
        return ((currentStep + 1) / steps.length) * 100;
    };

    const renderBasicInfoStep = () => (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título de la Promoción *
                </label>
                <input
                    type="text"
                    value={promotionData.basicInfo.title}
                    onChange={(e) => updatePromotionData('basicInfo', { title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ej: iPhone 15 Pro con 20% de descuento"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción *
                </label>
                <textarea
                    value={promotionData.basicInfo.description}
                    onChange={(e) => updatePromotionData('basicInfo', { description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Describe tu promoción de manera atractiva..."
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Categoría Principal *
                    </label>
                    <select
                        value={promotionData.basicInfo.category}
                        onChange={(e) => {
                            updatePromotionData('basicInfo', { 
                                category: e.target.value,
                                subcategory: ''
                            });
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                        <option value="">Selecciona una categoría</option>
                        {categories.map((cat) => (
                            <option key={cat.name} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subcategoría
                    </label>
                    <select
                        value={promotionData.basicInfo.subcategory}
                        onChange={(e) => updatePromotionData('basicInfo', { subcategory: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        disabled={!promotionData.basicInfo.category}
                    >
                        <option value="">Selecciona una subcategoría</option>
                        {promotionData.basicInfo.category && 
                            categories.find(c => c.name === promotionData.basicInfo.category)?.subcategories.map((sub) => (
                                <option key={sub} value={sub}>{sub}</option>
                            ))
                        }
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marca *
                </label>
                <input
                    type="text"
                    value={promotionData.basicInfo.brand}
                    onChange={(e) => updatePromotionData('basicInfo', { brand: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ej: Apple, Nike, Samsung..."
                />
            </div>

            <div className="pt-2">
                <PromotionOptionalAttributionSection
                    idPrefix="wizard-promo"
                    value={promotionData.optionalAttribution}
                    onChange={(patch) => updatePromotionData('optionalAttribution', patch)}
                    onShopSelect={applySelectedShopGps}
                />
            </div>
        </div>
    );

    const isPricingMxn = (promotionData.pricing.currency || 'USD').toUpperCase() === 'MXN';

    const renderPricingStep = () => (
        <div className="space-y-6">
            <p className="text-sm text-gray-600 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                El valor promocional se representa en tokens estables (BizneAI/DameCodigo). Si tu producto está en <strong>español / pesos (MXN)</strong>, elige MXN y los precios se convertirán a USD para el cálculo de tokens. Los tokens siempre son en <strong>USD</strong> (1 token = 1 USD).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Moneda del producto
                    </label>
                    <select
                        value={promotionData.pricing.currency || 'USD'}
                        onChange={(e) => updatePromotionData('pricing', { currency: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                        <option value="USD">USD (Dólares americanos)</option>
                        <option value="MXN">MXN (Pesos – producto en español)</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                        {isPricingMxn ? 'Precios en pesos: el backend convierte a USD para los tokens.' : 'Los tokens se calculan en USD.'}
                    </p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Precio Original (base) * {isPricingMxn && <span className="text-gray-500">(MXN)</span>}
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-500">$</span>
                        <input
                            type="number"
                            value={promotionData.pricing.originalPrice}
                            onChange={(e) => updatePromotionData('pricing', { originalPrice: Number(e.target.value) })}
                            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder={isPricingMxn ? 'Ej: 60' : '0.00'}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Precio con Oferta * {isPricingMxn && <span className="text-gray-500">(MXN)</span>}
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-500">$</span>
                        <input
                            type="number"
                            value={promotionData.pricing.offerPrice}
                            onChange={(e) => updatePromotionData('pricing', { offerPrice: Number(e.target.value) })}
                            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder={isPricingMxn ? 'Ej: 29' : '0.00'}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <p className="text-xs text-gray-500">
                        Los cálculos de tokens se normalizan siempre en <strong>USD</strong>. Si elegiste MXN, el servidor convierte a dólares al guardar.
                    </p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Oferta
                    </label>
                    <select
                        value={promotionData.pricing.offerType}
                        onChange={(e) => updatePromotionData('pricing', { offerType: e.target.value as any })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                        <option value="percentage">Porcentaje de descuento</option>
                        <option value="fixed">Descuento fijo (cashback fijo)</option>
                        <option value="bogo">2x1 (Compra 1, Lleva 2)</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valor de la Oferta
                    </label>
                    <input
                        type="number"
                        value={promotionData.pricing.offerValue}
                        onChange={(e) => updatePromotionData('pricing', { offerValue: Number(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder={promotionData.pricing.offerType === 'percentage' ? '20' : '10.00'}
                    />
                </div>
            </div>
        </div>
    );

    const renderInventoryStep = () => (
        <div className="space-y-6">
            <p className="text-sm text-gray-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                El <strong>límite de promociones disponibles</strong> controla cuántas redenciones se permiten. Al llegar al límite la promoción se considera agotada (BizneAI: control de inventario promocional).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Máximo de cupones redimibles *
                    </label>
                    <input
                        type="number"
                        min={1}
                        value={promotionData.inventory.totalQuantity}
                        onChange={(e) => updatePromotionData('inventory', { totalQuantity: Number(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="100"
                    />
                    <p className="mt-1 text-xs text-gray-500">Límite legal y financiero de redenciones.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stock Actual
                    </label>
                    <input
                        type="number"
                        value={promotionData.inventory.stock}
                        onChange={(e) => updatePromotionData('inventory', { stock: Number(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="50"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cantidad Mínima por Pedido
                    </label>
                    <input
                        type="number"
                        value={promotionData.inventory.minOrderQuantity}
                        onChange={(e) => updatePromotionData('inventory', { minOrderQuantity: Number(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="1"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cantidad Máxima por Pedido
                    </label>
                    <input
                        type="number"
                        value={promotionData.inventory.maxOrderQuantity}
                        onChange={(e) => updatePromotionData('inventory', { maxOrderQuantity: Number(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="10"
                    />
                </div>
            </div>
        </div>
    );

    const renderTimingStep = () => (
        <div className="space-y-6">
            <p className="text-sm text-gray-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                Las redenciones solo son válidas <strong>entre la fecha de inicio y la fecha de fin</strong>. Fuera de ese periodo el sistema rechazará el cupón (vigencia legal BizneAI).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Inicio *
                    </label>
                    <input
                        type="date"
                        value={promotionData.timing.startDate}
                        onChange={(e) => updatePromotionData('timing', { startDate: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Fin *
                    </label>
                    <input
                        type="date"
                        value={promotionData.timing.endDate}
                        onChange={(e) => updatePromotionData('timing', { endDate: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                </div>
            </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Válido Hasta
                    </label>
                <select
                        value={promotionData.timing.validUntil}
                        onChange={(e) => updatePromotionData('timing', { validUntil: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                    <option value="">Selecciona una opción</option>
                    <option value="end-date">Hasta la fecha de fin</option>
                    <option value="30-days">30 días después del fin</option>
                    <option value="60-days">60 días después del fin</option>
                    <option value="90-days">90 días después del fin</option>
                    <option value="lifetime">De por vida</option>
                    <option value="no-warranty">Sin garantía</option>
                </select>
                </div>
        </div>
    );

    const renderTargetingStep = () => (
        <div className="space-y-6">
            <div className="border border-amber-200 rounded-xl p-4 bg-amber-50/60 space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={promotionData.targeting.isChainStore}
                        onChange={(e) => {
                            const on = e.target.checked;
                            setChainPresetId('');
                            setChainPresetLoadError(null);
                            updatePromotionData('targeting', {
                                isChainStore: on,
                                ...(on
                                    ? {}
                                    : { chainBrandName: '', chainBranches: [] })
                            });
                        }}
                        className="mt-1 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span>
                        <span className="block text-sm font-medium text-gray-900">
                            Cadena de tiendas (varias sucursales)
                        </span>
                        <span className="block text-sm text-gray-600 mt-0.5">
                            Misma oferta en todas las sucursales que agregues. Con GPS, el usuario valida el cupón contra
                            la <strong>sucursal más cercana</strong>.
                        </span>
                    </span>
                </label>

                {promotionData.targeting.isChainStore && (
                    <div className="space-y-4 pl-1">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Catálogo de sucursales
                            </label>
                            <p className="text-xs text-gray-600 mb-2">
                                Carga coordenadas guardadas para cadenas conocidas (Sam&apos;s, Comfort, …).{' '}
                                <strong>Sustituye</strong> la tabla de sucursales actual. Puedes ampliar el catálogo en{' '}
                                <code className="text-[11px] bg-white/80 px-1 rounded">server/data/chainLocationPresets.json</code>
                                .
                            </p>
                            <div className="relative">
                                <select
                                    value={chainPresetId}
                                    disabled={chainPresetApplying || chainPresets.length === 0}
                                    onChange={async (e) => {
                                        const id = e.target.value;
                                        setChainPresetId(id);
                                        setChainPresetLoadError(null);
                                        if (!id) return;
                                        setChainPresetApplying(true);
                                        try {
                                            const res = await fetch(
                                                `/api/geo/chain-presets/${encodeURIComponent(id)}`
                                            );
                                            const data = await res.json();
                                            if (!data.success || !data.preset) {
                                                setChainPresetLoadError(
                                                    data.message || 'No se pudo cargar el catálogo'
                                                );
                                                return;
                                            }
                                            const preset = data.preset as {
                                                chainBrandName?: string;
                                                chainLocations?: Array<{
                                                    branchName?: string;
                                                    address?: string;
                                                    city?: string;
                                                    coordinates?: { latitude?: number; longitude?: number };
                                                    mapsUrl?: string;
                                                }>;
                                            };
                                            const locs = Array.isArray(preset.chainLocations)
                                                ? preset.chainLocations
                                                : [];
                                            const branches = locs.map((loc, i) => ({
                                                key: `cat-${id}-${i}-${Math.random().toString(36).slice(2, 9)}`,
                                                branchName:
                                                    loc.branchName != null ? String(loc.branchName) : '',
                                                address: loc.address != null ? String(loc.address) : '',
                                                city: loc.city != null ? String(loc.city) : '',
                                                latitude:
                                                    loc.coordinates?.latitude != null &&
                                                    Number.isFinite(loc.coordinates.latitude)
                                                        ? String(loc.coordinates.latitude)
                                                        : '',
                                                longitude:
                                                    loc.coordinates?.longitude != null &&
                                                    Number.isFinite(loc.coordinates.longitude)
                                                        ? String(loc.coordinates.longitude)
                                                        : '',
                                                mapsUrl: loc.mapsUrl != null ? String(loc.mapsUrl) : ''
                                            }));
                                            setPromotionData((prev) => ({
                                                ...prev,
                                                targeting: {
                                                    ...prev.targeting,
                                                    isChainStore: true,
                                                    chainBrandName:
                                                        (preset.chainBrandName != null &&
                                                            String(preset.chainBrandName).trim()) ||
                                                        prev.targeting.chainBrandName,
                                                    chainBranches: branches
                                                }
                                            }));
                                            if (branches.length === 0) {
                                                setChainPresetLoadError(
                                                    'Este catálogo aún no tiene sucursales con coordenadas. Edita chainLocationPresets.json o usa Importar desde listado.'
                                                );
                                            }
                                        } catch {
                                            setChainPresetLoadError('Error de red al cargar el catálogo');
                                        } finally {
                                            setChainPresetApplying(false);
                                        }
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white text-sm appearance-none"
                                >
                                    <option value="">
                                        — Elegir tipo de tienda / cadena ({chainPresets.length} en catálogo) —
                                    </option>
                                    {chainPresets.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.label} ({p.branchCount} sucursales)
                                        </option>
                                    ))}
                                </select>
                                {chainPresetApplying && (
                                    <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-amber-600 pointer-events-none" />
                                )}
                            </div>
                            {chainPresets.length === 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                    No hay entradas en el catálogo del servidor. Asegúrate de desplegar{' '}
                                    <code className="text-[11px]">server/data/chainLocationPresets.json</code>.
                                </p>
                            )}
                            {chainPresetLoadError && (
                                <p className="text-sm text-amber-900 mt-2 bg-amber-100/80 border border-amber-200 rounded-lg px-3 py-2">
                                    {chainPresetLoadError}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre de la cadena (ej. Starbucks)
                            </label>
                            <input
                                type="text"
                                value={promotionData.targeting.chainBrandName}
                                onChange={(e) =>
                                    updatePromotionData('targeting', {
                                        chainBrandName: e.target.value
                                    })
                                }
                                placeholder={promotionData.basicInfo.brand || 'Marca o cadena'}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-medium text-gray-800">Sucursales</span>
                            <div className="flex flex-wrap gap-2">
                                <Link
                                    to="/importar-sucursales?returnTo=/create-promotion"
                                    className="text-sm px-3 py-1.5 border border-amber-300 text-amber-900 rounded-lg hover:bg-amber-100/80"
                                >
                                    Importar desde listado
                                </Link>
                                <button
                                    type="button"
                                    onClick={() =>
                                        updatePromotionData('targeting', {
                                            chainBranches: [
                                                ...promotionData.targeting.chainBranches,
                                                {
                                                    key: `br-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                                                    branchName: '',
                                                    address: '',
                                                    city: '',
                                                    latitude: '',
                                                    longitude: '',
                                                    mapsUrl: ''
                                                }
                                            ]
                                        })
                                    }
                                    className="text-sm px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                                >
                                    + Agregar sucursal
                                </button>
                            </div>
                        </div>

                        {promotionData.targeting.chainBranches.length === 0 ? (
                            <p className="text-sm text-amber-900 bg-amber-100/80 border border-amber-200 rounded-lg px-3 py-2">
                                Añade al menos una sucursal con coordenadas (lat / long).
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {promotionData.targeting.chainBranches.map((row) => (
                                    <div
                                        key={row.key}
                                        className="border border-gray-200 rounded-lg p-3 bg-white space-y-2"
                                    >
                                        <div className="flex justify-between items-center gap-2">
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                Sucursal
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    updatePromotionData('targeting', {
                                                        chainBranches:
                                                            promotionData.targeting.chainBranches.filter(
                                                                (b) => b.key !== row.key
                                                            )
                                                    })
                                                }
                                                className="text-red-600 hover:text-red-800 p-1"
                                                aria-label="Quitar sucursal"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Nombre (ej. Starbucks Reforma)"
                                            value={row.branchName}
                                            onChange={(e) =>
                                                updatePromotionData('targeting', {
                                                    chainBranches: promotionData.targeting.chainBranches.map((b) =>
                                                        b.key === row.key
                                                            ? { ...b, branchName: e.target.value }
                                                            : b
                                                    )
                                                })
                                            }
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                        />
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <input
                                                type="text"
                                                placeholder="Ciudad"
                                                value={row.city}
                                                onChange={(e) =>
                                                    updatePromotionData('targeting', {
                                                        chainBranches:
                                                            promotionData.targeting.chainBranches.map((b) =>
                                                                b.key === row.key
                                                                    ? { ...b, city: e.target.value }
                                                                    : b
                                                            )
                                                    })
                                                }
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Dirección (opcional)"
                                                value={row.address}
                                                onChange={(e) =>
                                                    updatePromotionData('targeting', {
                                                        chainBranches:
                                                            promotionData.targeting.chainBranches.map((b) =>
                                                                b.key === row.key
                                                                    ? { ...b, address: e.target.value }
                                                                    : b
                                                            )
                                                    })
                                                }
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder="Latitud"
                                                value={row.latitude}
                                                onChange={(e) =>
                                                    updatePromotionData('targeting', {
                                                        chainBranches:
                                                            promotionData.targeting.chainBranches.map((b) =>
                                                                b.key === row.key
                                                                    ? { ...b, latitude: e.target.value }
                                                                    : b
                                                            )
                                                    })
                                                }
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                            />
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder="Longitud"
                                                value={row.longitude}
                                                onChange={(e) =>
                                                    updatePromotionData('targeting', {
                                                        chainBranches:
                                                            promotionData.targeting.chainBranches.map((b) =>
                                                                b.key === row.key
                                                                    ? { ...b, longitude: e.target.value }
                                                                    : b
                                                            )
                                                    })
                                                }
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                        <input
                                            type="url"
                                            placeholder="Link mapa o tienda (opcional)"
                                            value={row.mapsUrl}
                                            onChange={(e) =>
                                                updatePromotionData('targeting', {
                                                    chainBranches: promotionData.targeting.chainBranches.map((b) =>
                                                        b.key === row.key ? { ...b, mapsUrl: e.target.value } : b
                                                    )
                                                })
                                            }
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Audiencia Objetivo
                </label>
                <div className="space-y-2">
                    {['Estudiantes', 'Profesionales', 'Padres', 'Jóvenes', 'Adultos Mayores'].map((audience) => (
                        <label key={audience} className="flex items-center">
                            <input
                                type="checkbox"
                                checked={promotionData.targeting.targetAudience.includes(audience)}
                                onChange={(e) => {
                                    const newAudience = e.target.checked
                                        ? [...promotionData.targeting.targetAudience, audience]
                                        : promotionData.targeting.targetAudience.filter(a => a !== audience);
                                    updatePromotionData('targeting', { targetAudience: newAudience });
                                }}
                                className="mr-2"
                            />
                            {audience}
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rango de Edad
                </label>
                <select
                    value={promotionData.targeting.ageRange}
                    onChange={(e) => updatePromotionData('targeting', { ageRange: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                    <option value="">Selecciona un rango</option>
                    <option value="13-17">13-17 años</option>
                    <option value="18-24">18-24 años</option>
                    <option value="25-34">25-34 años</option>
                    <option value="35-44">35-44 años</option>
                    <option value="45-54">45-54 años</option>
                    <option value="55+">55+ años</option>
                </select>
            </div>

            <div className="border border-purple-200 rounded-xl p-4 bg-purple-50/50 space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={promotionData.targeting.activateByGps}
                        onChange={(e) => updatePromotionData('targeting', { activateByGps: e.target.checked })}
                        className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span>
                        <span className="block text-sm font-medium text-gray-900">Activación por ubicación (GPS)</span>
                        <span className="block text-sm text-gray-600 mt-0.5">
                            Solo promociones seleccionadas: el usuario deberá estar cerca del punto de la tienda para obtener el cupón (se valida en el navegador).
                        </span>
                    </span>
                </label>

                {promotionData.targeting.activateByGps && (
                    <>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex-1">
                                <p className="text-xs text-gray-600 mb-2">
                                    En móvil puedes usar tu posición actual como punto de la tienda.
                                </p>
                                <button
                                    type="button"
                                    onClick={fillGpsCoordinatesFromDevice}
                                    disabled={gpsFromDeviceLoading}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm transition-colors"
                                >
                                    <Smartphone className="h-4 w-4 shrink-0" />
                                    {gpsFromDeviceLoading ? 'Obteniendo ubicación…' : 'Obtener del dispositivo'}
                                </button>
                            </div>
                        </div>
                        {gpsFromDeviceError && (
                            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{gpsFromDeviceError}</p>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Latitud del punto (WGS84)</label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="ej. 19.432608"
                                    value={promotionData.targeting.storeLatitude}
                                    onChange={(e) => updatePromotionData('targeting', { storeLatitude: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Longitud del punto (WGS84)</label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="ej. -99.133209"
                                    value={promotionData.targeting.storeLongitude}
                                    onChange={(e) => updatePromotionData('targeting', { storeLongitude: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Radio permitido (metros)</label>
                            <input
                                type="number"
                                min={50}
                                max={50000}
                                step={50}
                                value={promotionData.targeting.gpsRadiusMeters}
                                onChange={(e) => updatePromotionData('targeting', { gpsRadiusMeters: Math.min(50000, Math.max(50, parseInt(e.target.value, 10) || 500)) })}
                                className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Entre 50 m y 50 km. El usuario debe estar dentro de este radio del punto indicado.</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    const renderSmartContractStep = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Red Blockchain
                    </label>
                    <select
                        value={promotionData.smartContract.network}
                        onChange={(e) => updatePromotionData('smartContract', { network: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                        <option value="Ethereum">Ethereum</option>
                        <option value="Polygon">Polygon</option>
                        <option value="BSC">Binance Smart Chain</option>
                        <option value="Solana">Solana</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estándar de Token
                    </label>
                    <select
                        value={promotionData.smartContract.tokenStandard}
                        onChange={(e) => updatePromotionData('smartContract', { tokenStandard: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                        <option value="ERC-20">ERC-20</option>
                        <option value="ERC-777">ERC-777</option>
                        <option value="ERC-1155">ERC-1155</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estructura de Comisión
                    </label>
                    <select
                        value={promotionData.smartContract.commissionStructure}
                        onChange={(e) => updatePromotionData('smartContract', { commissionStructure: e.target.value as any })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                        <option value="percentage">Porcentaje</option>
                        <option value="fixed">Monto fijo</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valor de Comisión
                    </label>
                        <input
                            type="number"
                            value={promotionData.smartContract.commissionValue}
                            onChange={(e) => updatePromotionData('smartContract', { commissionValue: Number(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder={promotionData.smartContract.commissionStructure === 'percentage' ? '15' : '10.00'}
                        />
                    </div>
                </div>
        </div>
    );

    const syncCombinedMediaPreviews = (promoUrls: string[], termUrls: string[]) => {
        updatePromotionData('media', { images: [...promoUrls, ...termUrls] });
    };

    const categoryNameFromSlug = (slug: string): string => {
        const map: Record<string, string> = {
            electronics: 'Electrónica',
            fashion: 'Moda',
            home: 'Hogar',
            beauty: 'Belleza y Cuidado',
            sports: 'Deportes',
            books: 'Productos Digitales',
            food: 'Comida y Bebidas',
            other: 'Electrónica'
        };
        return map[slug] || slug;
    };

    /** Analiza con Gemini: cartel(es) en `images`, T&C en `termsImages`. */
    const handleAnalyzeWithGemini = async (promoFiles?: File[], termsFiles?: File[]) => {
        const promos = promoFiles ?? promotionalImageFiles;
        const terms = termsFiles ?? termsImageFiles;
        if (promos.length === 0 && terms.length === 0) {
            setAnalyzeMediaError('Sube al menos una imagen (promoción y/o términos) para analizar.');
            return;
        }
        setIsAnalyzingMedia(true);
        setAnalyzeMediaError(null);
        try {
            const fd = new FormData();
            promos.forEach((file) => fd.append('images', file));
            terms.forEach((file) => fd.append('termsImages', file));
            const res = await fetch('/api/promotions/analyze-image', { method: 'POST', body: fd });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Error al analizar');
            const d = json.data || {};
            updatePromotionData('basicInfo', {
                title: d.title ?? promotionData.basicInfo.title,
                description: d.description ?? promotionData.basicInfo.description,
                brand: d.brand ?? promotionData.basicInfo.brand,
                category: categoryNameFromSlug(d.category || 'other')
            });
            const orig = typeof d.originalPrice === 'number' ? d.originalPrice : promotionData.pricing.originalPrice;
            const offer = typeof d.currentPrice === 'number' ? d.currentPrice : promotionData.pricing.offerPrice;
            updatePromotionData('pricing', {
                originalPrice: orig,
                offerPrice: offer,
                offerType: (d.offerType === 'bogo' ? 'bogo' : d.offerType === 'percentage' ? 'percentage' : 'fixed') as any,
                offerValue: typeof d.discountPercentage === 'number' ? d.discountPercentage : (orig > 0 ? Math.round(((orig - offer) / orig) * 100) : 0)
            });
            if (typeof d.termsAndConditions === 'string' && d.termsAndConditions.trim()) {
                updatePromotionData('terms', {
                    conditions: [d.termsAndConditions.trim()]
                });
            }
        } catch (e: any) {
            setAnalyzeMediaError(e.message || 'Error al analizar con Gemini.');
        } finally {
            setIsAnalyzingMedia(false);
        }
    };

    const handlePromotionalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const fileArray = Array.from(files);
            const merged = [...promotionalImageFiles, ...fileArray].slice(0, 8);
            promotionalPreviewUrls.forEach((u) => URL.revokeObjectURL(u));
            const urls = merged.map((file) => URL.createObjectURL(file));
            setPromotionalImageFiles(merged);
            setPromotionalPreviewUrls(urls);
            syncCombinedMediaPreviews(urls, termsPreviewUrls);
            e.target.value = '';
            handleAnalyzeWithGemini(merged, termsImageFiles);
        }
    };

    const handleTermsImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const fileArray = Array.from(files);
            const merged = [...termsImageFiles, ...fileArray].slice(0, 8);
            termsPreviewUrls.forEach((u) => URL.revokeObjectURL(u));
            const urls = merged.map((file) => URL.createObjectURL(file));
            setTermsImageFiles(merged);
            setTermsPreviewUrls(urls);
            syncCombinedMediaPreviews(promotionalPreviewUrls, urls);
            e.target.value = '';
            handleAnalyzeWithGemini(promotionalImageFiles, merged);
        }
    };

    const removePromotionalImage = (index: number) => {
        const newFiles = promotionalImageFiles.filter((_, i) => i !== index);
        promotionalPreviewUrls.forEach((u) => URL.revokeObjectURL(u));
        const urls = newFiles.map((f) => URL.createObjectURL(f));
        setPromotionalImageFiles(newFiles);
        setPromotionalPreviewUrls(urls);
        syncCombinedMediaPreviews(urls, termsPreviewUrls);
    };

    const removeTermsImage = (index: number) => {
        const newFiles = termsImageFiles.filter((_, i) => i !== index);
        termsPreviewUrls.forEach((u) => URL.revokeObjectURL(u));
        const urls = newFiles.map((f) => URL.createObjectURL(f));
        setTermsImageFiles(newFiles);
        setTermsPreviewUrls(urls);
        syncCombinedMediaPreviews(promotionalPreviewUrls, urls);
    };

    const renderMediaStep = () => (
        <div className="space-y-6">
            <p className="text-sm text-gray-600 bg-purple-50 border border-purple-100 rounded-lg px-4 py-3">
                <strong>Imagen(es) del cartel o anuncio</strong> (precios, producto, marca) y, si las tienes,{' '}
                <strong>foto(s) aparte de términos y condiciones</strong> o letra pequeña. Todo se envía al OCR del
                servidor y, si configuras Gemini, también al análisis inteligente para rellenar el formulario y el texto
                legal.
            </p>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cartel / promoción * (mínimo 1, máx. 8)
                </label>
                <div className="border-2 border-dashed border-purple-200 rounded-lg p-6 text-center hover:border-purple-500 transition-colors bg-purple-50/30">
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePromotionalImageUpload}
                        className="hidden"
                        id="promo-image-upload"
                    />
                    <label htmlFor="promo-image-upload" className="cursor-pointer">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">
                            Sube el arte principal de la oferta (pueden ser varias si es un carrusel).
                        </p>
                    </label>
                </div>
                {promotionalPreviewUrls.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {promotionalPreviewUrls.map((image, index) => (
                            <div key={`p-${index}`} className="relative group">
                                <span className="absolute top-2 left-2 z-10 text-[10px] font-semibold uppercase tracking-wide bg-purple-600 text-white px-2 py-0.5 rounded">
                                    Promo
                                </span>
                                <img
                                    src={image}
                                    alt={`Promoción ${index + 1}`}
                                    className="w-full h-32 object-cover rounded-lg"
                                />
                                <button
                                    type="button"
                                    onClick={() => removePromotionalImage(index)}
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label="Quitar imagen"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Términos y condiciones (opcional, máx. 8)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                    Foto del reverso, letra chica o pantalla solo de bases legales. El OCR acumula este texto en los
                    términos de la promoción.
                </p>
                <div className="border-2 border-dashed border-amber-200 rounded-lg p-6 text-center hover:border-amber-500 transition-colors bg-amber-50/30">
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleTermsImageUpload}
                        className="hidden"
                        id="terms-image-upload"
                    />
                    <label htmlFor="terms-image-upload" className="cursor-pointer">
                        <Upload className="mx-auto h-12 w-12 text-amber-600/80" />
                        <p className="mt-2 text-sm text-gray-600">Añadir imágenes solo de T&amp;C / legal</p>
                    </label>
                </div>
                {termsPreviewUrls.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {termsPreviewUrls.map((image, index) => (
                            <div key={`t-${index}`} className="relative group">
                                <span className="absolute top-2 left-2 z-10 text-[10px] font-semibold uppercase tracking-wide bg-amber-600 text-white px-2 py-0.5 rounded">
                                    T&amp;C
                                </span>
                                <img
                                    src={image}
                                    alt={`Términos ${index + 1}`}
                                    className="w-full h-32 object-cover rounded-lg"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeTermsImage(index)}
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label="Quitar imagen de términos"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {(promotionalPreviewUrls.length > 0 || termsPreviewUrls.length > 0) && (
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={() => handleAnalyzeWithGemini()}
                        disabled={isAnalyzingMedia}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-teal-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isAnalyzingMedia ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                Analizando con Gemini...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-5 w-5" />
                                Analizar todas las fotos (Gemini)
                            </>
                        )}
                    </button>
                    <span className="text-xs text-gray-500">
                        Incluye cartel(es) y fotos de términos en un solo análisis.
                    </span>
                </div>
            )}
            {analyzeMediaError && <p className="text-sm text-red-600">{analyzeMediaError}</p>}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Videos (opcional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">Arrastra y suelta videos aquí o haz clic para seleccionar</p>
                </div>
            </div>
        </div>
    );

    const renderTermsStep = () => (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Condiciones de la Promoción
                </label>
                <textarea
                    value={promotionData.terms.conditions.join('\n')}
                    onChange={(e) => updatePromotionData('terms', { conditions: e.target.value.split('\n').filter(c => c.trim()) })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ingresa las condiciones una por línea..."
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Restricciones
                </label>
                <textarea
                    value={promotionData.terms.restrictions.join('\n')}
                    onChange={(e) => updatePromotionData('terms', { restrictions: e.target.value.split('\n').filter(r => r.trim()) })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ingresa las restricciones una por línea..."
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beneficios
                </label>
                <textarea
                    value={promotionData.terms.benefits.join('\n')}
                    onChange={(e) => updatePromotionData('terms', { benefits: e.target.value.split('\n').filter(b => b.trim()) })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ingresa los beneficios uno por línea..."
                />
            </div>
        </div>
    );

    const renderStepContent = () => {
        switch (currentStep) {
            case 0: return renderMediaStep();
            case 1: return renderBasicInfoStep();
            case 2: return renderPricingStep();
            case 3: return renderInventoryStep();
            case 4: return renderTimingStep();
            case 5: return renderTargetingStep();
            case 6: return renderSmartContractStep();
            case 7: return renderTermsStep();
            default: return null;
        }
    };

    const handleSubmit = async () => {
        // Validar datos requeridos
        if (!promotionData.basicInfo.title || !promotionData.basicInfo.category || !promotionData.basicInfo.brand) {
            setSubmitError('Por favor completa la información básica');
            setCurrentStep(0);
            return;
        }

        if (!promotionData.pricing.originalPrice || !promotionData.pricing.offerPrice) {
            setSubmitError('Por favor completa la información de precios');
            setCurrentStep(1);
            return;
        }

        if (promotionalImageFiles.length === 0) {
            setSubmitError('Por favor sube al menos una foto del cartel o promoción (paso 1)');
            setCurrentStep(0);
            return;
        }

        if (promotionData.targeting.isChainStore) {
            const validBranches = promotionData.targeting.chainBranches.filter((b) => {
                const la = parseFloat(String(b.latitude).replace(',', '.'));
                const lo = parseFloat(String(b.longitude).replace(',', '.'));
                return Number.isFinite(la) && Number.isFinite(lo);
            });
            if (validBranches.length === 0) {
                setSubmitError(
                    'Cadena de tiendas: agrega al menos una sucursal con latitud y longitud válidas (paso Audiencia y GPS).'
                );
                setCurrentStep(steps.findIndex((s) => s.id === 'targeting'));
                return;
            }
        }

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // Preparar FormData para enviar imágenes
            const formData = new FormData();

            // Información básica
            formData.append('title', promotionData.basicInfo.title);
            formData.append('description', promotionData.basicInfo.description);
            formData.append('productName', promotionData.basicInfo.title);
            formData.append('brand', promotionData.basicInfo.brand);
            formData.append('category', promotionData.basicInfo.category);
            formData.append('subcategory', promotionData.basicInfo.subcategory);

            // Precios
            formData.append('originalPrice', promotionData.pricing.originalPrice.toString());
            formData.append('currentPrice', promotionData.pricing.offerPrice.toString());
            formData.append('currency', promotionData.pricing.currency);
            
            // Calcular descuento
            const discount = promotionData.pricing.originalPrice > 0
                ? Math.round(((promotionData.pricing.originalPrice - promotionData.pricing.offerPrice) / promotionData.pricing.originalPrice) * 100)
                : 0;
            formData.append('discountPercentage', discount.toString());

            // Inventario
            formData.append('stock', promotionData.inventory.stock.toString());
            formData.append('totalQuantity', promotionData.inventory.totalQuantity.toString());

            // Fechas
            formData.append('validFrom', promotionData.timing.startDate);
            formData.append('validUntil', promotionData.timing.endDate || promotionData.timing.validUntil);

            // Ubicación
            if (promotionData.targeting.location.length > 0) {
                formData.append('storeCity', promotionData.targeting.location[0]);
                formData.append('storeState', promotionData.targeting.location[0]);
            }

            formData.append('activateByGps', promotionData.targeting.activateByGps ? 'true' : 'false');
            formData.append('gpsRadiusMeters', String(promotionData.targeting.gpsRadiusMeters));
            if (promotionData.targeting.storeLatitude.trim()) {
                formData.append('storeLatitude', promotionData.targeting.storeLatitude.trim());
            }
            if (promotionData.targeting.storeLongitude.trim()) {
                formData.append('storeLongitude', promotionData.targeting.storeLongitude.trim());
            }

            formData.append(
                'isChainStore',
                promotionData.targeting.isChainStore ? 'true' : 'false'
            );
            if (promotionData.targeting.isChainStore) {
                const brandChain =
                    promotionData.targeting.chainBrandName.trim() ||
                    promotionData.basicInfo.brand;
                if (brandChain) formData.append('chainBrandName', brandChain);
                const locs = promotionData.targeting.chainBranches
                    .map((b) => ({
                        branchName: b.branchName.trim(),
                        address: b.address.trim(),
                        city: b.city.trim(),
                        latitude: parseFloat(String(b.latitude).replace(',', '.')),
                        longitude: parseFloat(String(b.longitude).replace(',', '.')),
                        mapsUrl: b.mapsUrl.trim() || undefined
                    }))
                    .filter((b) => Number.isFinite(b.latitude) && Number.isFinite(b.longitude));
                if (locs.length > 0) {
                    formData.append('chainLocations', JSON.stringify(locs));
                }
            }
            const storeNameVal = promotionData.targeting.isChainStore
                ? promotionData.targeting.chainBrandName.trim() ||
                  promotionData.basicInfo.brand ||
                  promotionData.basicInfo.title
                : promotionData.basicInfo.brand || promotionData.basicInfo.title;
            if (storeNameVal) {
                formData.append('storeName', storeNameVal);
            }

            // Tags
            if (promotionData.targeting.interests.length > 0) {
                formData.append('tags', JSON.stringify(promotionData.targeting.interests));
            }

            // Términos y condiciones (desde el paso terms o extraídos por Gemini)
            const termsText = promotionData.terms.conditions.filter(c => c.trim()).join('\n\n');
            if (termsText) formData.append('termsAndConditions', termsText);

            const o = promotionData.optionalAttribution;
            ['brandId', 'shopId', 'gtmTag', 'campaignId', 'source', 'medium'].forEach((k) => {
                const v = o[k as keyof PromotionOptionalAttribution];
                if (v !== undefined && v !== null && String(v).trim() !== '') {
                    formData.append(k, String(v).trim());
                }
            });
            if (o.externalProductId?.trim()) {
                formData.append('externalProductId', o.externalProductId.trim());
            }

            // Category: backend espera slug (electronics, fashion...); el wizard usa nombre (Electrónica, Moda...)
            const categoryToSlug: Record<string, string> = {
                'Electrónica': 'electronics', 'Moda': 'fashion', 'Hogar': 'home',
                'Deportes': 'sports', 'Fotografía': 'other', 'Comida y Bebidas': 'food',
                'Servicios': 'other', 'Productos Digitales': 'books', 'Viajes y Turismo': 'other',
                'Belleza y Cuidado': 'beauty'
            };
            const categorySlug = categoryToSlug[promotionData.basicInfo.category] || 'other';
            formData.set('category', categorySlug);

            // Imágenes: cartel (images) + términos (termsImages) para OCR / Gemini en servidor
            if (promotionalImageFiles.length === 0) {
                throw new Error('Por favor sube al menos una imagen de la promoción');
            }

            promotionalImageFiles.forEach((file) => {
                formData.append('images', file);
            });
            termsImageFiles.forEach((file) => {
                formData.append('termsImages', file);
            });

            // Enviar a la API
            const response = await fetch('/api/promotions', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok && data.success) {
                const id = data.data?.id != null ? String(data.data.id) : null;
                if (data.mode === 'simulated' && typeof data.warning === 'string') {
                    window.alert(data.warning);
                }
                setSubmitSuccess(true);
                if (id) {
                    navigate(`/promotion-details/${id}`);
                } else {
                    setTimeout(() => navigate('/promotions-marketplace'), 1500);
                }
            } else {
                throw new Error(formatPromotionCreateError(data));
            }
        } catch (error: any) {
            console.error('Error creando promoción:', error);
            setSubmitError(error.message || 'Error al crear la promoción. Por favor, intenta de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen relative">
            {/* Full Page Background */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1527264935190-1401c51b5bbc?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="Page Background"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40"></div>
            </div>

            {/* Content */}
            <div className="relative z-10">
            {/* Header */}
                <div className="bg-gradient-to-r from-purple-600/90 to-blue-600/90 backdrop-blur-sm text-white">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="flex items-center gap-4 mb-4">
                        <Link to="/" className="text-purple-200 hover:text-white transition-colors">
                            <ArrowLeft className="h-6 w-6" />
                        </Link>
                        <Plus className="h-8 w-8" />
                        <h1 className="text-3xl font-bold">Crear Nueva Promoción</h1>
                    </div>
                    <p className="text-xl text-purple-100 max-w-2xl">
                        Crea promociones atractivas paso a paso con nuestro asistente inteligente
                    </p>
                    <p className="text-sm text-purple-200/90 max-w-2xl mt-3">
                        <strong>Activación por GPS:</strong> configúrala en el paso <strong>«Audiencia y GPS»</strong> (radio en metros y coordenadas del punto de la tienda).
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Mensajes de éxito/error */}
                {submitSuccess && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-green-800 mb-1">¡Promoción creada exitosamente!</h3>
                            <p className="text-sm text-green-600">Redirigiendo al marketplace...</p>
                        </div>
                    </div>
                )}

                {submitError && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                        <div className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5">⚠️</div>
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-red-800 mb-1">Error al crear la promoción</h3>
                            <p className="text-sm text-red-600">{submitError}</p>
                        </div>
                        <button
                            onClick={() => setSubmitError(null)}
                            className="text-red-600 hover:text-red-800"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-white drop-shadow-lg">
                            Paso {currentStep + 1} de {steps.length}
                        </span>
                            <span className="text-sm font-medium text-white drop-shadow-lg">
                            {Math.round(getStepProgress())}% Completado
                        </span>
                    </div>
                        <div className="w-full bg-white/20 rounded-full h-2 backdrop-blur-sm">
                        <div 
                            className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${getStepProgress()}%` }}
                        ></div>
                    </div>
                </div>

                {/* Guía BizneAI / definición legal y tokenización */}
                <div className="mb-6">
                    <PromotionLegalInfo />
                </div>

                {/* Step Navigation */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-6 mb-8 border border-white/20">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                            {steps[currentStep].icon}
                            {steps[currentStep].title}
                        </h2>
                        <div className="flex items-center gap-2">
                            {steps.map((step, index) => (
                                <button
                                    key={step.id}
                                    onClick={() => goToStep(index)}
                                    className={`p-2 rounded-full transition-colors ${
                                        index === currentStep
                                            ? 'bg-purple-100 text-purple-600'
                                            : index < currentStep
                                            ? 'bg-green-100 text-green-600'
                                            : 'bg-gray-100 text-gray-400'
                                    }`}
                                    disabled={index > currentStep}
                                >
                                    {index < currentStep ? (
                                        <CheckCircle className="h-5 w-5" />
                                    ) : (
                                        <Circle className="h-5 w-5" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Step Content */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-8 mb-8 relative overflow-hidden border border-white/20">
                    {/* Content with relative positioning */}
                    <div className="relative z-10">
                        {renderStepContent()}
                    </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between">
                    <button
                        onClick={prevStep}
                        disabled={currentStep === 0}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors backdrop-blur-sm ${
                            currentStep === 0
                                    ? 'bg-white/20 text-white/50 cursor-not-allowed'
                                    : 'bg-white/30 text-white hover:bg-white/40 border border-white/20'
                        }`}
                    >
                        <ArrowLeft className="h-5 w-5" />
                        Anterior
                    </button>

                    <div className="flex gap-4">
                        {currentStep < steps.length - 1 ? (
                            <button
                                onClick={nextStep}
                                disabled={!isStepValid(currentStep)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors backdrop-blur-sm ${
                                    isStepValid(currentStep)
                                            ? 'bg-purple-600/90 text-white hover:bg-purple-700/90 border border-purple-500/50'
                                            : 'bg-white/20 text-white/50 cursor-not-allowed'
                                }`}
                            >
                                Siguiente
                                <ArrowRight className="h-5 w-5" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || submitSuccess}
                                className={`flex items-center gap-2 px-8 py-3 rounded-lg transition-colors backdrop-blur-sm border ${
                                    isSubmitting || submitSuccess
                                        ? 'bg-green-600/70 text-white cursor-not-allowed border-green-500/30'
                                        : 'bg-green-600/90 text-white hover:bg-green-700/90 border-green-500/50'
                                }`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Creando...
                                    </>
                                ) : submitSuccess ? (
                                    <>
                                        <CheckCircle className="h-5 w-5" />
                                        ¡Creada!
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-5 w-5" />
                                        Crear Promoción
                                    </>
                                )}
                            </button>
                        )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
