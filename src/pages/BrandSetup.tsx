import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    Target, 
    Upload, 
    Plus, 
    X,
    Building2,
    Globe,
    Users,
    DollarSign,
    CheckCircle,
    FileText
} from 'lucide-react';

interface BrandCategory {
    id: string;
    name: string;
    selected: boolean;
}

interface TargetAudience {
    ageRange: {
        min: number;
        max: number;
    };
    gender: string[];
    locations: string[];
    interests: string[];
    incomeLevel: string;
}

const BrandSetup: React.FC = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    
    // Form data
    const [formData, setFormData] = useState({
        companyName: '',
        industry: '',
        website: '',
        description: '',
        founded: new Date().getFullYear(),
        employees: '',
        headquarters: '',
        categories: [] as string[],
        targetAudience: {
            ageRange: { min: 18, max: 65 },
            gender: [],
            locations: [],
            interests: [],
            incomeLevel: ''
        } as TargetAudience,
        marketingBudget: {
            min: 0,
            max: 0,
            currency: 'MXN'
        },
        preferredChannels: [] as string[],
        campaignTypes: [] as string[],
        documents: [] as File[],
        logo: null as File | null
    });

    const brandCategories: BrandCategory[] = [
        { id: 'fashion', name: 'Moda', selected: false },
        { id: 'beauty', name: 'Belleza', selected: false },
        { id: 'technology', name: 'Tecnología', selected: false },
        { id: 'food-beverage', name: 'Comida y Bebidas', selected: false },
        { id: 'automotive', name: 'Automotriz', selected: false },
        { id: 'healthcare', name: 'Salud', selected: false },
        { id: 'finance', name: 'Finanzas', selected: false },
        { id: 'education', name: 'Educación', selected: false },
        { id: 'entertainment', name: 'Entretenimiento', selected: false },
        { id: 'sports', name: 'Deportes', selected: false },
        { id: 'travel', name: 'Viajes', selected: false },
        { id: 'home-garden', name: 'Hogar y Jardín', selected: false },
        { id: 'pets', name: 'Mascotas', selected: false },
        { id: 'baby-kids', name: 'Bebés y Niños', selected: false },
        { id: 'gaming', name: 'Gaming', selected: false },
        { id: 'fitness', name: 'Fitness', selected: false },
        { id: 'luxury', name: 'Lujo', selected: false },
        { id: 'sustainable', name: 'Sostenible', selected: false },
        { id: 'startup', name: 'Startup', selected: false },
        { id: 'enterprise', name: 'Empresa', selected: false }
    ];

    const marketingChannels = [
        'influencer-marketing',
        'social-media',
        'content-marketing',
        'email-marketing',
        'search-ads',
        'display-ads',
        'video-ads',
        'affiliate-marketing'
    ];

    const campaignTypes = [
        'brand-awareness',
        'product-launch',
        'seasonal-campaign',
        'influencer-collaboration',
        'user-generated-content',
        'loyalty-program',
        'referral-program',
        'event-marketing'
    ];

    const incomeLevels = [
        'low',
        'medium-low',
        'medium',
        'medium-high',
        'high',
        'luxury'
    ];

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleCategoryToggle = (categoryId: string) => {
        setFormData(prev => ({
            ...prev,
            categories: prev.categories.includes(categoryId)
                ? prev.categories.filter(id => id !== categoryId)
                : [...prev.categories, categoryId]
        }));
    };

    const handleChannelToggle = (channel: string) => {
        setFormData(prev => ({
            ...prev,
            preferredChannels: prev.preferredChannels.includes(channel)
                ? prev.preferredChannels.filter(c => c !== channel)
                : [...prev.preferredChannels, channel]
        }));
    };

    const handleCampaignToggle = (type: string) => {
        setFormData(prev => ({
            ...prev,
            campaignTypes: prev.campaignTypes.includes(type)
                ? prev.campaignTypes.filter(t => t !== type)
                : [...prev.campaignTypes, type]
        }));
    };

    const handleTargetAudienceChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            targetAudience: {
                ...prev.targetAudience,
                [field]: value
            }
        }));
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'documents') => {
        const files = Array.from(event.target.files || []);
        
        if (type === 'logo') {
            setFormData(prev => ({
                ...prev,
                logo: files[0] || null
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                documents: [...prev.documents, ...files]
            }));
        }
    };

    const handleRemoveFile = (index: number) => {
        setFormData(prev => ({
            ...prev,
            documents: prev.documents.filter((_, i) => i !== index)
        }));
    };

    const handleNext = () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        
        try {
            // Aquí se haría la llamada a la API para crear el perfil de marca
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Redirigir al dashboard
            navigate('/dashboard');
        } catch (error) {
            console.error('Error al crear perfil de marca:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const renderStep1 = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Información de la Empresa</h2>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Empresa *
                </label>
                <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nombre oficial de tu empresa"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industria *
                </label>
                <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Tecnología, Moda, Alimentación..."
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sitio Web
                </label>
                <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://www.tuempresa.com"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción de la Empresa *
                </label>
                <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe qué hace tu empresa, su misión y valores..."
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Año de Fundación
                    </label>
                    <select
                        value={formData.founded}
                        onChange={(e) => handleInputChange('founded', parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i).map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de Empleados
                    </label>
                    <select
                        value={formData.employees}
                        onChange={(e) => handleInputChange('employees', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Seleccionar</option>
                        <option value="1-10">1-10</option>
                        <option value="11-50">11-50</option>
                        <option value="51-200">51-200</option>
                        <option value="201-1000">201-1000</option>
                        <option value="1000+">1000+</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sede Principal
                    </label>
                    <input
                        type="text"
                        value={formData.headquarters}
                        onChange={(e) => handleInputChange('headquarters', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ciudad, País"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo de la Empresa
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {formData.logo ? (
                        <div className="flex items-center justify-center space-x-4">
                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                <img 
                                    src={URL.createObjectURL(formData.logo)} 
                                    alt="Logo preview" 
                                    className="w-12 h-12 object-contain"
                                />
                            </div>
                            <div className="text-left">
                                <p className="font-medium text-gray-900">{formData.logo.name}</p>
                                <p className="text-sm text-gray-500">
                                    ({(formData.logo.size / 1024 / 1024).toFixed(2)} MB)
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, logo: null }))}
                                className="text-red-500 hover:text-red-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="mt-4">
                                <label htmlFor="logo-upload" className="cursor-pointer">
                                    <span className="text-blue-600 hover:text-blue-500 font-medium">
                                        Haz clic para subir logo
                                    </span>
                                </label>
                                <input
                                    id="logo-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e, 'logo')}
                                    className="sr-only"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                PNG, JPG, SVG hasta 5MB
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Categorías y Audiencia Objetivo</h2>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categorías de Marca
                </label>
                <p className="text-sm text-gray-600 mb-4">Selecciona las categorías que mejor describan tu marca</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {brandCategories.map(category => (
                        <button
                            key={category.id}
                            type="button"
                            onClick={() => handleCategoryToggle(category.id)}
                            className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                                formData.categories.includes(category.id)
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Audiencia Objetivo
                </label>
                <p className="text-sm text-gray-600 mb-4">Define quién es tu público objetivo</p>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rango de Edad
                        </label>
                        <div className="flex items-center space-x-4">
                            <input
                                type="number"
                                value={formData.targetAudience.ageRange.min}
                                onChange={(e) => handleTargetAudienceChange('ageRange', {
                                    ...formData.targetAudience.ageRange,
                                    min: parseInt(e.target.value) || 18
                                })}
                                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                min="13"
                                max="100"
                            />
                            <span className="text-gray-500">a</span>
                            <input
                                type="number"
                                value={formData.targetAudience.ageRange.max}
                                onChange={(e) => handleTargetAudienceChange('ageRange', {
                                    ...formData.targetAudience.ageRange,
                                    max: parseInt(e.target.value) || 65
                                })}
                                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                min="13"
                                max="100"
                            />
                            <span className="text-gray-500">años</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Género
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {['Masculino', 'Femenino', 'No binario', 'Todos'].map(gender => (
                                <button
                                    key={gender}
                                    type="button"
                                    onClick={() => {
                                        const newGenders = formData.targetAudience.gender.includes(gender)
                                            ? formData.targetAudience.gender.filter(g => g !== gender)
                                            : [...formData.targetAudience.gender, gender];
                                        handleTargetAudienceChange('gender', newGenders);
                                    }}
                                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        formData.targetAudience.gender.includes(gender)
                                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                            : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                                    }`}
                                >
                                    {gender}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nivel de Ingresos
                        </label>
                        <select
                            value={formData.targetAudience.incomeLevel}
                            onChange={(e) => handleTargetAudienceChange('incomeLevel', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Seleccionar</option>
                            <option value="low">Bajo</option>
                            <option value="medium-low">Medio-Bajo</option>
                            <option value="medium">Medio</option>
                            <option value="medium-high">Medio-Alto</option>
                            <option value="high">Alto</option>
                            <option value="luxury">Lujo</option>
                        </select>
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Canales de Marketing Preferidos
                </label>
                <p className="text-sm text-gray-600 mb-4">Selecciona los canales que prefieres usar</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {marketingChannels.map(channel => (
                        <button
                            key={channel}
                            type="button"
                            onClick={() => handleChannelToggle(channel)}
                            className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                                formData.preferredChannels.includes(channel)
                                    ? 'border-green-500 bg-green-50 text-green-700'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            {channel.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipos de Campañas
                </label>
                <p className="text-sm text-gray-600 mb-4">Selecciona los tipos de campañas que te interesan</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {campaignTypes.map(type => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => handleCampaignToggle(type)}
                            className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                                formData.campaignTypes.includes(type)
                                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Presupuesto y Documentos</h2>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Presupuesto Mensual de Marketing
                </label>
                <p className="text-sm text-gray-600 mb-4">Define tu rango de presupuesto para campañas</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mínimo
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={formData.marketingBudget.min}
                                onChange={(e) => handleInputChange('marketingBudget', {
                                    ...formData.marketingBudget,
                                    min: parseInt(e.target.value) || 0
                                })}
                                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0"
                            />
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Máximo
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={formData.marketingBudget.max}
                                onChange={(e) => handleInputChange('marketingBudget', {
                                    ...formData.marketingBudget,
                                    max: parseInt(e.target.value) || 0
                                })}
                                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0"
                            />
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Moneda
                        </label>
                        <select
                            value={formData.marketingBudget.currency}
                            onChange={(e) => handleInputChange('marketingBudget', {
                                ...formData.marketingBudget,
                                currency: e.target.value
                            })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="MXN">MXN (Peso Mexicano)</option>
                            <option value="USD">USD (Dólar Americano)</option>
                            <option value="EUR">EUR (Euro)</option>
                        </select>
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Documentos de Verificación
                </label>
                <p className="text-sm text-gray-600 mb-4">Sube los documentos necesarios para verificar tu empresa</p>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                        <label htmlFor="documents-upload" className="cursor-pointer">
                            <span className="text-blue-600 hover:text-blue-500 font-medium">
                                Haz clic para subir documentos
                            </span>
                            <span className="text-gray-500"> o arrastra y suelta</span>
                        </label>
                        <input
                            id="documents-upload"
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload(e, 'documents')}
                            className="sr-only"
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        PDF, DOC, JPG hasta 10MB por archivo
                    </p>
                </div>

                {formData.documents.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {formData.documents.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                                        <span className="text-xs text-gray-600">
                                            {file.name.split('.').pop()?.toUpperCase()}
                                        </span>
                                    </div>
                                    <span className="text-sm font-medium">{file.name}</span>
                                    <span className="text-xs text-gray-500">
                                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveFile(index)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Documentos Requeridos</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Registro de empresa o acta constitutiva</li>
                    <li>• Identificación fiscal (RFC)</li>
                    <li>• Comprobante de domicilio</li>
                    <li>• Política de privacidad</li>
                    <li>• Términos y condiciones</li>
                </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">Próximos pasos</h3>
                <ul className="text-sm text-green-800 space-y-1">
                    <li>• Revisaremos tu información en 24-48 horas</li>
                    <li>• Te contactaremos para verificación si es necesario</li>
                    <li>• Una vez aprobado, podrás crear campañas y conectar con influencers</li>
                </ul>
            </div>
        </div>
    );

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return renderStep1();
            case 2:
                return renderStep2();
            case 3:
                return renderStep3();
            default:
                return renderStep1();
        }
    };

    const canProceed = () => {
        switch (currentStep) {
            case 1:
                return formData.companyName && formData.industry && formData.description;
            case 2:
                return formData.categories.length > 0 && formData.preferredChannels.length > 0;
            case 3:
                return formData.documents.length > 0;
            default:
                return false;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link to="/user-type-selector" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                            <ArrowLeft className="w-5 h-5" />
                            <span>Volver</span>
                        </Link>
                        
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-500">
                                Paso {currentStep} de 3
                            </span>
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(currentStep / 3) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mb-4">
                        <Target className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Configura tu perfil de Marca
                    </h1>
                    <p className="text-gray-600">
                        Completa la información para crear tu perfil de marca profesional
                    </p>
                </div>

                {/* Step Content */}
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                    {renderStepContent()}
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center">
                    <button
                        onClick={handlePrevious}
                        disabled={currentStep === 1}
                        className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                            currentStep === 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        Anterior
                    </button>

                    {currentStep < 3 ? (
                        <button
                            onClick={handleNext}
                            disabled={!canProceed()}
                            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                                canProceed()
                                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            Siguiente
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || !canProceed()}
                            className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                                isLoading || !canProceed()
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600'
                            }`}
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Creando perfil...
                                </>
                            ) : (
                                'Crear perfil de Marca'
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BrandSetup;
