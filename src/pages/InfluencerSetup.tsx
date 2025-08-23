import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    Star, 
    Upload, 
    Plus, 
    X,
    Instagram,
    Tiktok,
    Youtube,
    Twitter,
    CheckCircle
} from 'lucide-react';

interface SocialMediaAccount {
    platform: string;
    username: string;
    followers: number;
    verified: boolean;
}

interface ContentCategory {
    id: string;
    name: string;
    selected: boolean;
}

const InfluencerSetup: React.FC = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    
    // Form data
    const [formData, setFormData] = useState({
        displayName: '',
        bio: '',
        location: '',
        languages: ['Español'],
        experience: 1,
        collaborationPreferences: [] as string[],
        portfolio: [] as File[],
        socialMedia: [] as SocialMediaAccount[]
    });

    const [newSocialMedia, setNewSocialMedia] = useState({
        platform: '',
        username: '',
        followers: 0,
        verified: false
    });

    const contentCategories: ContentCategory[] = [
        { id: 'lifestyle', name: 'Lifestyle', selected: false },
        { id: 'fashion', name: 'Moda', selected: false },
        { id: 'beauty', name: 'Belleza', selected: false },
        { id: 'fitness', name: 'Fitness', selected: false },
        { id: 'food', name: 'Comida', selected: false },
        { id: 'travel', name: 'Viajes', selected: false },
        { id: 'technology', name: 'Tecnología', selected: false },
        { id: 'gaming', name: 'Gaming', selected: false },
        { id: 'education', name: 'Educación', selected: false },
        { id: 'business', name: 'Negocios', selected: false },
        { id: 'entertainment', name: 'Entretenimiento', selected: false },
        { id: 'sports', name: 'Deportes', selected: false },
        { id: 'parenting', name: 'Paternidad', selected: false },
        { id: 'health', name: 'Salud', selected: false },
        { id: 'automotive', name: 'Automotriz', selected: false },
        { id: 'real-estate', name: 'Bienes Raíces', selected: false },
        { id: 'finance', name: 'Finanzas', selected: false },
        { id: 'pets', name: 'Mascotas', selected: false },
        { id: 'art', name: 'Arte', selected: false },
        { id: 'music', name: 'Música', selected: false }
    ];

    const collaborationTypes = [
        'sponsored-posts',
        'product-reviews',
        'event-attendance',
        'brand-ambassador',
        'live-streaming',
        'giveaway',
        'affiliate'
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
            collaborationPreferences: prev.collaborationPreferences.includes(categoryId)
                ? prev.collaborationPreferences.filter(id => id !== categoryId)
                : [...prev.collaborationPreferences, categoryId]
        }));
    };

    const handleCollaborationToggle = (type: string) => {
        setFormData(prev => ({
            ...prev,
            collaborationPreferences: prev.collaborationPreferences.includes(type)
                ? prev.collaborationPreferences.filter(t => t !== type)
                : [...prev.collaborationPreferences, type]
        }));
    };

    const handleAddSocialMedia = () => {
        if (newSocialMedia.platform && newSocialMedia.username) {
            setFormData(prev => ({
                ...prev,
                socialMedia: [...prev.socialMedia, { ...newSocialMedia }]
            }));
            setNewSocialMedia({ platform: '', username: '', followers: 0, verified: false });
        }
    };

    const handleRemoveSocialMedia = (index: number) => {
        setFormData(prev => ({
            ...prev,
            socialMedia: prev.socialMedia.filter((_, i) => i !== index)
        }));
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        setFormData(prev => ({
            ...prev,
            portfolio: [...prev.portfolio, ...files]
        }));
    };

    const handleRemoveFile = (index: number) => {
        setFormData(prev => ({
            ...prev,
            portfolio: prev.portfolio.filter((_, i) => i !== index)
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
            // Aquí se haría la llamada a la API para crear el perfil de influencer
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Redirigir al dashboard
            navigate('/dashboard');
        } catch (error) {
            console.error('Error al crear perfil de influencer:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const renderStep1 = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Información Básica</h2>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de Influencer *
                </label>
                <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tu nombre artístico o de marca"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Biografía *
                </label>
                <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Cuéntanos sobre ti y tu contenido..."
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ubicación
                </label>
                <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ciudad, País"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Idiomas que manejas
                </label>
                <div className="flex flex-wrap gap-2">
                    {['Español', 'Inglés', 'Francés', 'Alemán', 'Portugués', 'Italiano'].map(lang => (
                        <button
                            key={lang}
                            type="button"
                            onClick={() => {
                                const newLanguages = formData.languages.includes(lang)
                                    ? formData.languages.filter(l => l !== lang)
                                    : [...formData.languages, lang];
                                handleInputChange('languages', newLanguages);
                            }}
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                                formData.languages.includes(lang)
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                            }`}
                        >
                            {lang}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Años de experiencia como creador de contenido
                </label>
                <select
                    value={formData.experience}
                    onChange={(e) => handleInputChange('experience', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, '10+'].map(year => (
                        <option key={year} value={year}>{year} {year === 1 ? 'año' : 'años'}</option>
                    ))}
                </select>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Redes Sociales y Categorías</h2>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categorías de contenido
                </label>
                <p className="text-sm text-gray-600 mb-4">Selecciona las categorías que mejor describan tu contenido</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {contentCategories.map(category => (
                        <button
                            key={category.id}
                            type="button"
                            onClick={() => handleCategoryToggle(category.id)}
                            className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                                formData.collaborationPreferences.includes(category.id)
                                    ? 'border-pink-500 bg-pink-50 text-pink-700'
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
                    Tipos de colaboración
                </label>
                <p className="text-sm text-gray-600 mb-4">Selecciona los tipos de colaboración que te interesan</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {collaborationTypes.map(type => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => handleCollaborationToggle(type)}
                            className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                                formData.collaborationPreferences.includes(type)
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cuentas de redes sociales
                </label>
                <p className="text-sm text-gray-600 mb-4">Agrega tus cuentas de redes sociales para verificación</p>
                
                <div className="space-y-4">
                    {formData.socialMedia.map((account, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium">{account.platform}</span>
                                    <span className="text-gray-500">@{account.username}</span>
                                    <span className="text-sm text-gray-600">({account.followers.toLocaleString()} seguidores)</span>
                                    {account.verified && (
                                        <CheckCircle className="w-4 h-4 text-blue-500" />
                                    )}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemoveSocialMedia(index)}
                                className="text-red-500 hover:text-red-700"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-4 p-4 border border-gray-300 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <select
                            value={newSocialMedia.platform}
                            onChange={(e) => setNewSocialMedia(prev => ({ ...prev, platform: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Plataforma</option>
                            <option value="Instagram">Instagram</option>
                            <option value="TikTok">TikTok</option>
                            <option value="YouTube">YouTube</option>
                            <option value="Twitter">Twitter</option>
                            <option value="Facebook">Facebook</option>
                            <option value="LinkedIn">LinkedIn</option>
                            <option value="Twitch">Twitch</option>
                        </select>
                        
                        <input
                            type="text"
                            value={newSocialMedia.username}
                            onChange={(e) => setNewSocialMedia(prev => ({ ...prev, username: e.target.value }))}
                            placeholder="Usuario"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        
                        <input
                            type="number"
                            value={newSocialMedia.followers}
                            onChange={(e) => setNewSocialMedia(prev => ({ ...prev, followers: parseInt(e.target.value) || 0 }))}
                            placeholder="Seguidores"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        
                        <button
                            type="button"
                            onClick={handleAddSocialMedia}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Portfolio y Documentos</h2>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Portfolio de trabajo
                </label>
                <p className="text-sm text-gray-600 mb-4">Sube ejemplos de tu mejor trabajo (imágenes, videos, enlaces)</p>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                        <label htmlFor="file-upload" className="cursor-pointer">
                            <span className="text-blue-600 hover:text-blue-500 font-medium">
                                Haz clic para subir archivos
                            </span>
                            <span className="text-gray-500"> o arrastra y suelta</span>
                        </label>
                        <input
                            id="file-upload"
                            type="file"
                            multiple
                            accept="image/*,video/*,.pdf,.doc,.docx"
                            onChange={handleFileUpload}
                            className="sr-only"
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        PNG, JPG, GIF, MP4, PDF hasta 10MB
                    </p>
                </div>

                {formData.portfolio.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {formData.portfolio.map((file, index) => (
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
                <h3 className="font-medium text-blue-900 mb-2">Próximos pasos</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Revisaremos tu información en 24-48 horas</li>
                    <li>• Te contactaremos para verificación si es necesario</li>
                    <li>• Una vez aprobado, tendrás acceso completo a la plataforma</li>
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
                return formData.displayName && formData.bio;
            case 2:
                return formData.collaborationPreferences.length > 0;
            case 3:
                return true;
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
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full mb-4">
                        <Star className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Configura tu perfil de Influencer
                    </h1>
                    <p className="text-gray-600">
                        Completa la información para crear tu perfil profesional
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
                                    : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600'
                            }`}
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Creando perfil...
                                </>
                            ) : (
                                'Crear perfil de Influencer'
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InfluencerSetup;
