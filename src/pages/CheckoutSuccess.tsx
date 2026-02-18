import React, { useEffect, useState } from 'react';
import { 
    CheckCircle, 
    Mail, 
    Smartphone, 
    MapPin, 
    Users, 
    TrendingUp, 
    ArrowRight, 
    Download,
    Share2,
    Calendar,
    Rocket,
    Shield,
    Zap,
    Target,
    BarChart3,
    Wallet
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SITE_CONFIG } from '../config/site';

const CheckoutSuccess: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(10);
    
    // Datos del checkout (en producción vendrían del estado de navegación)
    const checkoutData = location.state || {
        currency: 'USD',
        amount: 1,
        businessName: 'Tu Negocio'
    };

    // Configuración de precios por moneda
    const pricingConfig = {
        USD: { symbol: '$', flag: '🇺🇸', name: 'US Dollar' },
        MXN: { symbol: '$', flag: '🇲🇽', name: 'Peso Mexicano' },
        EUR: { symbol: '€', flag: '🇪🇺', name: 'Euro' }
    };

    const selectedPrice = pricingConfig[checkoutData.currency as keyof typeof pricingConfig];

    // Próximos pasos
    const nextSteps = [
        {
            icon: Mail,
            title: "Confirmación por Email",
            description: "Recibirás un email con tus credenciales de acceso y confirmación del pago",
            time: "Inmediato"
        },
        {
            icon: Smartphone,
            title: "Acceso al Dashboard",
            description: "Inicia sesión en tu dashboard personalizado para configurar tu negocio",
            time: "5 minutos"
        },
        {
            icon: MapPin,
            title: "Configuración de Ubicación",
            description: "Define la ubicación exacta de tu tienda para activar cupones geolocalizados",
            time: "15 minutos"
        },
        {
            icon: Users,
            title: "Activación de Campaña",
            description: "Tu campaña se activa automáticamente y comienzas a recibir propuestas",
            time: "24-48 horas"
        }
    ];

    // Características del paquete
    const packageFeatures = [
        {
            icon: Rocket,
            title: "Lanzamiento Garantizado",
            description: "Asegura clientes desde el primer día"
        },
        {
            icon: Target,
            title: "Audiencia Localizada",
            description: "Llega a clientes reales cerca de tu tienda"
        },
        {
            icon: Shield,
            title: "Transparencia Total",
            description: "Todo registrado en blockchain"
        },
        {
            icon: Zap,
            title: "Resultados Inmediatos",
            description: "Métricas en tiempo real"
        },
        {
            icon: Wallet,
            title: "Fidelización Automática",
            description: "Tokens para mantener clientes"
        },
        {
            icon: BarChart3,
            title: "Analytics Avanzados",
            description: "Insights para optimizar campañas"
        }
    ];

    useEffect(() => {
        // Redirigir al dashboard después de 10 segundos
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    navigate('/dashboard');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [navigate]);

    const handleDownloadInvoice = () => {
        // Aquí se implementaría la descarga del invoice
        console.log('Descargando invoice...');
    };

    const handleShareSuccess = () => {
        // Aquí se implementaría el compartir en redes sociales
        if (navigator.share) {
            navigator.share({
                title: `¡Contraté mi Paquete de Inauguración en ${SITE_CONFIG.name}!`,
                text: `Acabo de contratar el paquete de inauguración por ${selectedPrice.symbol}${checkoutData.amount} y estoy emocionado por llenar mi tienda desde el primer día.`,
                url: window.location.origin
            });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link to="/" className="flex items-center space-x-3">
                            <img 
                                src="/logo.png" 
                                alt="DameCódigo" 
                                className="w-8 h-8 object-contain"
                            />
                            <span className="font-bold text-gray-900">{SITE_CONFIG.name}</span>
                        </Link>

                        <div className="text-sm text-gray-500">
                            Redirigiendo al dashboard en {countdown} segundos...
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 py-12">
                {/* Mensaje de Éxito */}
                <div className="text-center mb-12">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                    
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        ¡Pago Exitoso!
                    </h1>
                    
                    <p className="text-xl text-gray-600 mb-6">
                        Tu paquete de inauguración ha sido contratado exitosamente
                    </p>

                    <div className="bg-white rounded-2xl p-6 shadow-lg inline-block">
                        <div className="flex items-center space-x-4">
                            <div className="text-3xl">{selectedPrice.flag}</div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {selectedPrice.symbol}{checkoutData.amount}
                                </div>
                                <div className="text-sm text-gray-600">{selectedPrice.name}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Resumen de la Compra */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                        Resumen de tu Compra
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-gray-50 rounded-xl p-4">
                            <h3 className="font-semibold text-gray-900 mb-2">Negocio</h3>
                            <p className="text-gray-600">{checkoutData.businessName}</p>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-4">
                            <h3 className="font-semibold text-gray-900 mb-2">Paquete</h3>
                            <p className="text-gray-600">Inauguración Completa</p>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-4">
                            <h3 className="font-semibold text-gray-900 mb-2">Precio</h3>
                            <p className="text-gray-600">{selectedPrice.symbol}{checkoutData.amount} {selectedPrice.flag}</p>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-4">
                            <h3 className="font-semibold text-gray-900 mb-2">Estado</h3>
                            <p className="text-green-600 font-semibold">Pagado y Confirmado</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={handleDownloadInvoice}
                            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Download className="h-5 w-5" />
                            Descargar Invoice
                        </button>
                        
                        <button
                            onClick={handleShareSuccess}
                            className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <Share2 className="h-5 w-5" />
                            Compartir Éxito
                        </button>
                    </div>
                </div>

                {/* Próximos Pasos */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                        Próximos Pasos
                    </h2>
                    
                    <div className="space-y-6">
                        {nextSteps.map((step, index) => (
                            <div key={index} className="flex items-start space-x-4">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <step.icon className="h-5 w-5 text-blue-600" />
                                </div>
                                
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-gray-900">{step.title}</h3>
                                        <span className="text-sm text-blue-600 font-medium">{step.time}</span>
                                    </div>
                                    <p className="text-gray-600">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Características del Paquete */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                        Lo que Incluye tu Paquete
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {packageFeatures.map((feature, index) => (
                            <div key={index} className="bg-gray-50 rounded-xl p-6 text-center">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <feature.icon className="h-6 w-6 text-blue-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-sm text-gray-600">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Acciones Principales */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
                    <h2 className="text-2xl font-bold mb-4">
                        ¿Listo para comenzar?
                    </h2>
                    
                    <p className="text-blue-100 mb-6">
                        Accede a tu dashboard y comienza a configurar tu campaña de inauguración
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link 
                            to="/dashboard" 
                            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
                        >
                            Ir al Dashboard
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                        
                        <Link 
                            to="/help" 
                            className="bg-white/20 backdrop-blur-sm text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/30 transition-colors"
                        >
                            Ver Tutorial
                        </Link>
                    </div>
                </div>

                {/* Información de Soporte */}
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                        ¿Necesitas Ayuda?
                    </h3>
                    
                    <p className="text-gray-600 mb-6">
                        Nuestro equipo está disponible para ayudarte con cualquier pregunta
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                            <h4 className="font-semibold text-gray-900 mb-1">Email</h4>
                            <p className="text-sm text-gray-600">soporte@link4deal.com</p>
                        </div>
                        
                        <div className="text-center">
                            <Smartphone className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                            <h4 className="font-semibold text-gray-900 mb-1">WhatsApp</h4>
                            <p className="text-sm text-gray-600">+52 55 1234 5678</p>
                        </div>
                        
                        <div className="text-center">
                            <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                            <h4 className="font-semibold text-gray-900 mb-1">Horario</h4>
                            <p className="text-sm text-gray-600">Lun-Vie 9:00-18:00</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutSuccess;
