import React, { useState, useEffect } from 'react';
import { 
    Store, 
    CheckCircle, 
    Shield, 
    Users, 
    MapPin, 
    TrendingUp, 
    Zap, 
    ArrowLeft,
    CreditCard,
    Lock,
    Globe,
    Smartphone,
    Target,
    BarChart3,
    Wallet,
    Rocket,
    Clock,
    DollarSign,
    Euro,
    Flag
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const CheckoutPage: React.FC = () => {
    const navigate = useNavigate();
    const [selectedCurrency, setSelectedCurrency] = useState('USD');
    const [isProcessing, setIsProcessing] = useState(false);
    const [formData, setFormData] = useState({
        businessName: '',
        ownerName: '',
        email: '',
        phone: '',
        businessType: '',
        city: '',
        country: 'México',
        expectedOpening: '',
        description: ''
    });

    // Configuración de precios por moneda
    const pricingConfig = {
        USD: { amount: 1, symbol: '$', flag: '🇺🇸', name: 'US Dollar' },
        MXN: { amount: 20, symbol: '$', flag: '🇲🇽', name: 'Peso Mexicano' },
        EUR: { amount: 1, symbol: '€', flag: '🇪🇺', name: 'Euro' }
    };

    // Características incluidas en el paquete
    const packageFeatures = [
        {
            icon: Store,
            title: "Registro en Blockchain",
            description: "Tu negocio queda registrado en la blockchain ERC-777 con ubicación verificada"
        },
        {
            icon: Users,
            title: "Marketplace de Influencers",
            description: "Acceso a cientos de influencers locales que pujarán por tu campaña"
        },
        {
            icon: MapPin,
            title: "Cupones Geolocalizados",
            description: "Genera cupones que solo se pueden redimir cerca de tu tienda"
        },
        {
            icon: TrendingUp,
            title: "Analytics en Tiempo Real",
            description: "Monitorea el rendimiento de tu campaña con métricas detalladas"
        },
        {
            icon: Zap,
            title: "Fidelización Automática",
            description: "Los clientes reciben tokens que los mantienen conectados contigo"
        },
        {
            icon: Shield,
            title: "Transparencia Total",
            description: "Todo el proceso se registra en blockchain para máxima confianza"
        }
    ];

    // Proceso post-compra
    const postPurchaseSteps = [
        {
            step: "01",
            title: "Confirmación Inmediata",
            description: "Recibes confirmación por email y acceso al dashboard"
        },
        {
            step: "02",
            title: "Configuración de Tienda",
            description: "Completa el perfil de tu negocio y define tu ubicación"
        },
        {
            step: "03",
            title: "Activación de Campaña",
            description: "Tu campaña se activa automáticamente en 24-48 horas"
        },
        {
            step: "04",
            title: "Gestión de Influencers",
            description: "Comienza a recibir propuestas de influencers locales"
        }
    ];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCurrencyChange = (currency: string) => {
        setSelectedCurrency(currency);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        try {
            // Aquí se implementará la integración con Stripe
            console.log('Procesando pago con Stripe...', {
                currency: selectedCurrency,
                amount: pricingConfig[selectedCurrency as keyof typeof pricingConfig].amount,
                formData
            });

            // Simular procesamiento
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Redirigir a página de éxito
            navigate('/checkout/success', { 
                state: { 
                    currency: selectedCurrency,
                    amount: pricingConfig[selectedCurrency as keyof typeof pricingConfig].amount,
                    businessName: formData.businessName
                }
            });

        } catch (error) {
            console.error('Error en el checkout:', error);
            setIsProcessing(false);
        }
    };

    const selectedPrice = pricingConfig[selectedCurrency as keyof typeof pricingConfig];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link to="/" className="flex items-center space-x-2">
                            <ArrowLeft className="h-5 w-5 text-gray-600" />
                            <span className="text-gray-600">Volver al inicio</span>
                        </Link>
                        
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">L</span>
                            </div>
                            <span className="font-bold text-gray-900">Link4Deal</span>
                        </div>

                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Lock className="h-4 w-4" />
                            <span>Pago Seguro</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Formulario de Checkout */}
                    <div className="lg:order-1">
                        <div className="bg-white rounded-2xl shadow-xl p-8">
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                    Contratar Paquete de Inauguración
                                </h1>
                                <p className="text-gray-600">
                                    Completa los datos de tu negocio para continuar
                                </p>
                            </div>

                            {/* Selector de Moneda */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Selecciona tu moneda preferida
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {Object.entries(pricingConfig).map(([currency, config]) => (
                                        <button
                                            key={currency}
                                            onClick={() => handleCurrencyChange(currency)}
                                            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                                                selectedCurrency === currency
                                                    ? 'border-blue-600 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="text-2xl mb-2">{config.flag}</div>
                                            <div className="font-bold text-lg">
                                                {config.symbol}{config.amount}
                                            </div>
                                            <div className="text-sm text-gray-600">{config.name}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Formulario */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nombre del Negocio *
                                        </label>
                                        <input
                                            type="text"
                                            name="businessName"
                                            value={formData.businessName}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Ej: Boutique Elegance"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nombre del Propietario *
                                        </label>
                                        <input
                                            type="text"
                                            name="ownerName"
                                            value={formData.ownerName}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Tu nombre completo"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="tu@email.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Teléfono *
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="+52 55 1234 5678"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tipo de Negocio *
                                        </label>
                                        <select
                                            name="businessType"
                                            value={formData.businessType}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Selecciona un tipo</option>
                                            <option value="retail">Comercio Minorista</option>
                                            <option value="restaurant">Restaurante/Café</option>
                                            <option value="beauty">Belleza/Estética</option>
                                            <option value="fitness">Fitness/Gimnasio</option>
                                            <option value="services">Servicios</option>
                                            <option value="other">Otro</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ciudad *
                                        </label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Ej: CDMX, Guadalajara"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Fecha Esperada de Apertura *
                                    </label>
                                    <input
                                        type="date"
                                        name="expectedOpening"
                                        value={formData.expectedOpening}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Descripción del Negocio
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Describe brevemente tu negocio y lo que ofreces..."
                                    />
                                </div>

                                {/* Resumen del Pago */}
                                <div className="bg-gray-50 rounded-xl p-6">
                                    <h3 className="font-semibold text-gray-900 mb-4">Resumen del Pago</h3>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-gray-600">Paquete de Inauguración</span>
                                        <span className="font-medium">Incluido</span>
                                    </div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-gray-600">Acceso al Ecosistema</span>
                                        <span className="font-medium">Incluido</span>
                                    </div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-gray-600">Soporte Técnico</span>
                                        <span className="font-medium">Incluido</span>
                                    </div>
                                    <div className="border-t pt-4 mt-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-bold text-gray-900">Total a Pagar</span>
                                            <span className="text-2xl font-bold text-blue-600">
                                                {selectedPrice.symbol}{selectedPrice.amount} {selectedPrice.flag}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Botón de Pago */}
                                <button
                                    type="submit"
                                    disabled={isProcessing}
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {isProcessing ? (
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                                            Procesando Pago...
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center">
                                            <CreditCard className="h-5 w-5 mr-2" />
                                            Pagar {selectedPrice.symbol}{selectedPrice.amount} {selectedPrice.flag}
                                        </div>
                                    )}
                                </button>

                                <div className="text-center text-sm text-gray-500">
                                    <div className="flex items-center justify-center mb-2">
                                        <Lock className="h-4 w-4 mr-2" />
                                        Pago seguro con Stripe
                                    </div>
                                    <p>
                                        Al completar tu compra, aceptas nuestros{' '}
                                        <a href="#" className="text-blue-600 hover:underline">Términos y Condiciones</a>
                                    </p>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Información del Paquete */}
                    <div className="lg:order-2">
                        <div className="sticky top-8">
                            {/* Resumen del Paquete */}
                            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Rocket className="h-8 w-8 text-blue-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                        Paquete de Inauguración
                                    </h2>
                                    <p className="text-gray-600">
                                        Todo lo que necesitas para llenar tu tienda desde el primer día
                                    </p>
                                </div>

                                <div className="space-y-4 mb-6">
                                    {packageFeatures.map((feature, index) => (
                                        <div key={index} className="flex items-start space-x-3">
                                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900">{feature.title}</h4>
                                                <p className="text-sm text-gray-600">{feature.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-blue-50 rounded-xl p-4">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Clock className="h-5 w-5 text-blue-600" />
                                        <span className="font-semibold text-blue-900">Activación Rápida</span>
                                    </div>
                                    <p className="text-sm text-blue-800">
                                        Tu campaña se activa en 24-48 horas después del pago
                                    </p>
                                </div>
                            </div>

                            {/* Proceso Post-Compra */}
                            <div className="bg-white rounded-2xl shadow-xl p-8">
                                <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
                                    ¿Qué pasa después de tu compra?
                                </h3>
                                
                                <div className="space-y-6">
                                    {postPurchaseSteps.map((step, index) => (
                                        <div key={index} className="flex items-start space-x-4">
                                            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                {step.step}
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900 mb-1">{step.title}</h4>
                                                <p className="text-sm text-gray-600">{step.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
