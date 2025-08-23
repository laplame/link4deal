import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    Zap
} from 'lucide-react';

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
}

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
    { id: 'basicInfo', title: 'Información Básica', icon: <FileText className="h-5 w-5" /> },
    { id: 'pricing', title: 'Precios y Ofertas', icon: <DollarSign className="h-5 w-5" /> },
    { id: 'inventory', title: 'Inventario', icon: <Smartphone className="h-5 w-5" /> },
    { id: 'timing', title: 'Tiempo y Validez', icon: <Calendar className="h-5 w-5" /> },
    { id: 'targeting', title: 'Audiencia Objetivo', icon: <Users className="h-5 w-5" /> },
    { id: 'smartContract', title: 'Smart Contract', icon: <Zap className="h-5 w-5" /> },
    { id: 'media', title: 'Medios y Contenido', icon: <Upload className="h-5 w-5" /> },
    { id: 'terms', title: 'Términos y Condiciones', icon: <Tag className="h-5 w-5" /> }
];

export default function CreatePromotionWizard() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
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
            influencerRequirements: []
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
        }
    });

    const updatePromotionData = (section: keyof PromotionData, data: Partial<PromotionData[keyof PromotionData]>) => {
        setPromotionData(prev => ({
            ...prev,
            [section]: { ...prev[section], ...data }
        }));
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
        </div>
    );

    const renderPricingStep = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Precio Original *
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-500">$</span>
                        <input
                            type="number"
                            value={promotionData.pricing.originalPrice}
                            onChange={(e) => updatePromotionData('pricing', { originalPrice: Number(e.target.value) })}
                            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Precio con Oferta *
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-500">$</span>
                        <input
                            type="number"
                            value={promotionData.pricing.offerPrice}
                            onChange={(e) => updatePromotionData('pricing', { offerPrice: Number(e.target.value) })}
                            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="0.00"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <option value="fixed">Descuento fijo</option>
                        <option value="bogo">Compra 1, Lleva 2</option>
                    </select>
                </div>

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cantidad Total Disponible *
                    </label>
                    <input
                        type="number"
                        value={promotionData.inventory.totalQuantity}
                        onChange={(e) => updatePromotionData('inventory', { totalQuantity: Number(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="100"
                    />
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

    const renderMediaStep = () => (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imágenes de la Promoción
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">Arrastra y suelta imágenes aquí o haz clic para seleccionar</p>
                </div>
            </div>

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
            case 0: return renderBasicInfoStep();
            case 1: return renderPricingStep();
            case 2: return renderInventoryStep();
            case 3: return renderTimingStep();
            case 4: return renderTargetingStep();
            case 5: return renderSmartContractStep();
            case 6: return renderMediaStep();
            case 7: return renderTermsStep();
            default: return null;
        }
    };

    const handleSubmit = () => {
        // Aquí se enviaría la promoción al backend
        console.log('Promoción creada:', promotionData);
        navigate('/referral-system');
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
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
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
                                    className="flex items-center gap-2 px-8 py-3 bg-green-600/90 text-white rounded-lg hover:bg-green-700/90 transition-colors backdrop-blur-sm border border-green-500/50"
                            >
                                <CheckCircle className="h-5 w-5" />
                                Crear Promoción
                            </button>
                        )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
