import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SITE_CONFIG } from '../config/site';
import { 
    Building2, 
    Users, 
    Star, 
    ArrowRight, 
    CheckCircle,
    TrendingUp,
    Target,
    Award,
    Globe,
    Zap
} from 'lucide-react';

interface UserType {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    features: string[];
    benefits: string[];
    requirements: string[];
    color: string;
    gradient: string;
}

const UserTypeSelector: React.FC = () => {
    const navigate = useNavigate();
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const userTypes: UserType[] = [
        {
            id: 'influencer',
            name: 'Influencer',
            description: 'Creador de contenido y líder de opinión',
            icon: <Star className="w-8 h-8" />,
            features: [
                'Crear contenido promocional',
                'Conectar con marcas',
                'Ganar comisiones por referidos',
                'Acceso a herramientas de análisis',
                'Dashboard personalizado'
            ],
            benefits: [
                'Monetiza tu audiencia',
                'Colabora con marcas reconocidas',
                'Accede a productos exclusivos',
                'Construye tu marca personal',
                'Recibe pagos en criptomonedas'
            ],
            requirements: [
                'Mínimo 1,000 seguidores',
                'Contenido original y auténtico',
                'Cumplir con políticas de la plataforma',
                'Verificación de identidad'
            ],
            color: 'from-pink-500 to-rose-500',
            gradient: 'bg-gradient-to-r from-pink-500 to-rose-500'
        },
        {
            id: 'brand',
            name: 'Marca',
            description: 'Empresa que promociona productos y servicios',
            icon: <Target className="w-8 h-8" />,
            features: [
                'Crear campañas promocionales',
                'Conectar con influencers',
                'Analytics avanzados',
                'Gestión de presupuestos',
                'Reportes detallados'
            ],
            benefits: [
                'Aumenta tu visibilidad',
                'Accede a audiencias específicas',
                'ROI medible y transparente',
                'Herramientas de marketing avanzadas',
                'Soporte prioritario'
            ],
            requirements: [
                'Empresa registrada legalmente',
                'Verificación de documentos',
                'Política de privacidad',
                'Cumplimiento normativo'
            ],
            color: 'from-blue-500 to-cyan-500',
            gradient: 'bg-gradient-to-r from-blue-500 to-cyan-500'
        },
        {
            id: 'agency',
            name: 'Agencia',
            description: 'Agencia de publicidad y marketing digital',
            icon: <Building2 className="w-8 h-8" />,
            features: [
                'Gestionar múltiples marcas',
                'Dashboard de agencia',
                'Herramientas de colaboración',
                'Analytics empresariales',
                'API y webhooks'
            ],
            benefits: [
                'Escala tu negocio',
                'Gestiona múltiples clientes',
                'Herramientas profesionales',
                'Soporte dedicado',
                'Integración con sistemas existentes'
            ],
            requirements: [
                'Agencia registrada legalmente',
                'Portfolio de clientes',
                'Verificación de documentos',
                'Equipo mínimo de 2 personas'
            ],
            color: 'from-purple-500 to-indigo-500',
            gradient: 'bg-gradient-to-r from-purple-500 to-indigo-500'
        }
    ];

    const handleTypeSelection = (typeId: string) => {
        setSelectedType(typeId);
    };

    const handleContinue = async () => {
        if (!selectedType) return;

        setIsLoading(true);
        
        try {
            // Aquí se haría la llamada a la API para actualizar el tipo de usuario
            // Por ahora simulamos un delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Redirigir según el tipo seleccionado
            switch (selectedType) {
                case 'influencer':
                    navigate('/influencer-setup');
                    break;
                case 'brand':
                    navigate('/brand-setup');
                    break;
                case 'agency':
                    navigate('/agency-setup');
                    break;
                default:
                    navigate('/dashboard');
            }
        } catch (error) {
            console.error('Error al actualizar tipo de usuario:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link to="/" className="flex items-center space-x-3">
                            <img 
                                src="/logo.png" 
                                alt="DameCódigo" 
                                className="w-8 h-8 object-contain"
                            />
                            <span className="text-xl font-bold text-gray-900">{SITE_CONFIG.name}</span>
                        </Link>
                        
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-500">
                                Paso 1 de 2
                            </span>
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full w-1/2"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        ¿Qué tipo de cuenta quieres crear?
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Selecciona el tipo de cuenta que mejor se adapte a tus necesidades. 
                        Puedes cambiar esto más tarde desde tu perfil.
                    </p>
                </div>

                {/* User Type Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {userTypes.map((type) => (
                        <div
                            key={type.id}
                            className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-xl transform hover:-translate-y-1 ${
                                selectedType === type.id
                                    ? `border-${type.color.split('-')[1]}-500 shadow-2xl`
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleTypeSelection(type.id)}
                        >
                            {/* Selection Indicator */}
                            {selectedType === type.id && (
                                <div className={`absolute -top-3 -right-3 w-8 h-8 ${type.gradient} rounded-full flex items-center justify-center shadow-lg`}>
                                    <CheckCircle className="w-5 h-5 text-white" />
                                </div>
                            )}

                            {/* Card Header */}
                            <div className={`p-8 ${type.gradient} rounded-t-2xl text-white`}>
                                <div className="flex items-center justify-center mb-4">
                                    {type.icon}
                                </div>
                                <h3 className="text-2xl font-bold mb-2">{type.name}</h3>
                                <p className="text-white/90 text-center">{type.description}</p>
                            </div>

                            {/* Card Body */}
                            <div className="p-8">
                                {/* Features */}
                                <div className="mb-6">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                        <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                                        Características principales
                                    </h4>
                                    <ul className="space-y-2">
                                        {type.features.map((feature, index) => (
                                            <li key={index} className="flex items-start text-sm text-gray-600">
                                                <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Benefits */}
                                <div className="mb-6">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                        <Award className="w-4 h-4 mr-2 text-blue-500" />
                                        Beneficios
                                    </h4>
                                    <ul className="space-y-2">
                                        {type.benefits.map((benefit, index) => (
                                            <li key={index} className="flex items-start text-sm text-gray-600">
                                                <TrendingUp className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                                                {benefit}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Requirements */}
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                        <Globe className="w-4 h-4 mr-2 text-purple-500" />
                                        Requisitos
                                    </h4>
                                    <ul className="space-y-2">
                                        {type.requirements.map((requirement, index) => (
                                            <li key={index} className="flex items-start text-sm text-gray-600">
                                                <div className="w-2 h-2 bg-gray-400 rounded-full mr-2 mt-2 flex-shrink-0"></div>
                                                {requirement}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="text-center">
                    {selectedType ? (
                        <div className="space-y-4">
                            <button
                                onClick={handleContinue}
                                disabled={isLoading}
                                className={`inline-flex items-center px-8 py-4 text-lg font-semibold text-white rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 ${
                                    isLoading 
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                                }`}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Procesando...
                                    </>
                                ) : (
                                    <>
                                        Continuar como {userTypes.find(t => t.id === selectedType)?.name}
                                        <ArrowRight className="ml-2 w-5 h-5" />
                                    </>
                                )}
                            </button>
                            
                            <p className="text-sm text-gray-500">
                                Al continuar, aceptas nuestros{' '}
                                <Link to="/terms" className="text-blue-600 hover:underline">
                                    Términos y Condiciones
                                </Link>
                                {' '}y{' '}
                                <Link to="/privacy" className="text-blue-600 hover:underline">
                                    Política de Privacidad
                                </Link>
                            </p>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="text-gray-500 mb-4">
                                Selecciona un tipo de cuenta para continuar
                            </p>
                            <div className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed">
                                Continuar
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Additional Info */}
                <div className="mt-16 text-center">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                        ¿No estás seguro?
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                        Puedes comenzar como usuario básico y cambiar tu tipo de cuenta más tarde. 
                        Cada tipo ofrece diferentes funcionalidades y beneficios.
                    </p>
                    <Link
                        to="/dashboard"
                        className="inline-flex items-center px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Continuar como usuario básico
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default UserTypeSelector;
