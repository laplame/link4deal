import React, { useState, useEffect } from 'react';
import { 
    DollarSign, 
    Users, 
    TrendingUp, 
    Shield, 
    Zap, 
    Star, 
    CheckCircle, 
    ArrowRight, 
    Play,
    Globe,
    Smartphone,
    Target,
    BarChart3,
    Wallet,
    Rocket,
    Award,
    Clock,
    CreditCard,
    Share2,
    Network,
    Handshake,
    PiggyBank,
    ChartLine,
    UserPlus,
    Gift,
    Calendar,
    MapPin,
    MessageCircle,
    Instagram,
    Youtube,
    Video,
    Store
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DigitalCommissionerLanding: React.FC = () => {
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [activeTestimonial, setActiveTestimonial] = useState(0);
    const [isSticky, setIsSticky] = useState(false);

    // Testimonios de comisionistas exitosos
    const testimonials = [
        {
            name: "Ana Martínez",
            role: "Influencer de Moda",
            city: "CDMX",
            image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&w=300&q=80",
            text: "Empecé ganando $50 USD por campaña. Ahora gano más de $2,000 USD mensuales promocionando negocios locales. Link4Deal me cambió la vida.",
            results: "$2,000+ USD mensuales",
            followers: "25K+ seguidores"
        },
        {
            name: "Carlos López",
            role: "Creador de Contenido",
            city: "Guadalajara",
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
            text: "La plataforma me conectó con negocios reales de mi ciudad. En 3 meses pasé de $0 a $800 USD mensuales. Es increíble.",
            results: "$800 USD mensuales",
            followers: "15K+ seguidores"
        },
        {
            name: "María González",
            role: "Blogger de Lifestyle",
            city: "Monterrey",
            image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80",
            text: "Link4Deal me dio la oportunidad de monetizar mi audiencia local. Ahora tengo ingresos estables y creo contenido auténtico.",
            results: "$1,200 USD mensuales",
            followers: "30K+ seguidores"
        },
        {
            name: "Roberto Silva",
            role: "TikToker",
            city: "Puebla",
            image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=300&q=80",
            text: "Como creador de contenido, siempre busqué formas de monetizar. Esta plataforma me conectó con negocios que valoran mi creatividad.",
            results: "$600 USD mensuales",
            followers: "40K+ seguidores"
        },
        {
            name: "Carmen Vega",
            role: "Instagram Influencer",
            city: "Querétaro",
            image: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=300&q=80",
            text: "La transparencia del blockchain me da confianza. Sé exactamente cuánto gano por cada campaña y puedo planificar mi futuro.",
            results: "$900 USD mensuales",
            followers: "20K+ seguidores"
        }
    ];

    // Estadísticas del sistema
    const stats = [
        { number: "2,000+", label: "Comisionistas Activos", icon: Users },
        { number: "500+", label: "Negocios Conectados", icon: Store },
        { number: "$50K+", label: "Comisiones Pagadas", icon: DollarSign },
        { number: "95%", label: "Tasa de Satisfacción", icon: Star }
    ];

    // Características del programa
    const features = [
        {
            icon: DollarSign,
            title: "Ganancias Garantizadas",
            description: "Gana desde $50 USD por campaña exitosa. Sin límites en tus ingresos potenciales."
        },
        {
            icon: Target,
            title: "Negocios Locales Reales",
            description: "Conecta con negocios de tu ciudad que buscan influencers auténticos."
        },
        {
            icon: Shield,
            title: "Pagos Automáticos",
            description: "Recibe tus comisiones automáticamente en tu wallet digital o cuenta bancaria."
        },
        {
            icon: Zap,
            title: "Campañas Flexibles",
            description: "Elige las campañas que mejor se adapten a tu estilo y audiencia."
        },
        {
            icon: Wallet,
            title: "Múltiples Fuentes",
            description: "Diversifica tus ingresos con diferentes tipos de promociones y negocios."
        },
        {
            icon: BarChart3,
            title: "Analytics Detallados",
            description: "Monitorea tu rendimiento y optimiza tus estrategias de contenido."
        }
    ];

    // Tipos de comisiones
    const commissionTypes = [
        {
            icon: Instagram,
            title: "Posts en Redes Sociales",
            description: "Crea contenido auténtico para Instagram, TikTok, YouTube y más",
            earnings: "$50 - $200 USD por campaña"
        },
        {
            icon: MessageCircle,
            title: "Recomendaciones Personales",
            description: "Comparte experiencias reales con tu audiencia",
            earnings: "$30 - $150 USD por recomendación"
        },
        {
            icon: Share2,
            title: "Cupones de Descuento",
            description: "Promociona ofertas especiales y gana por cada redención",
            earnings: "$5 - $25 USD por cupón usado"
        },
        {
            icon: UserPlus,
            title: "Referencias de Clientes",
            description: "Lleva clientes a negocios y gana comisiones por ventas",
            earnings: "10-25% de la primera compra"
        }
    ];

    // Proceso paso a paso
    const processSteps = [
        {
            step: "01",
            title: "Regístrate Gratis",
            description: "Crea tu perfil de comisionista en menos de 5 minutos.",
            icon: UserPlus
        },
        {
            step: "02",
            title: "Configura tu Perfil",
            description: "Define tus nichos, ubicación y redes sociales.",
            icon: UserPlus
        },
        {
            step: "03",
            title: "Explora Campañas",
            description: "Encuentra oportunidades que se adapten a tu audiencia.",
            icon: Target
        },
        {
            step: "04",
            title: "Gana Comisiones",
            description: "Crea contenido, promociona negocios y recibe pagos.",
            icon: DollarSign
        }
    ];

    // Plataformas soportadas
    const platforms = [
        { name: "Instagram", icon: Instagram, color: "from-pink-500 to-purple-600" },
        { name: "TikTok", icon: Video, color: "from-black to-gray-800" },
        { name: "YouTube", icon: Youtube, color: "from-red-500 to-red-700" },
        { name: "Facebook", icon: MessageCircle, color: "from-blue-500 to-blue-700" },
        { name: "Twitter", icon: Share2, color: "from-blue-400 to-blue-600" },
        { name: "LinkedIn", icon: Network, color: "from-blue-600 to-blue-800" }
    ];

    useEffect(() => {
        const handleScroll = () => {
            setIsSticky(window.scrollY > 100);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [testimonials.length]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50">
            {/* Header Sticky */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                isSticky ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
            }`}>
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <img 
                                src="/logo.png" 
                                alt="Link4Deal" 
                                className="w-10 h-10 object-contain"
                            />
                            <span className="text-xl font-bold text-gray-900">Link4Deal</span>
                        </div>
                        
                        <nav className="hidden md:flex items-center space-x-8">
                            <a href="#beneficios" className="text-gray-700 hover:text-green-600 transition-colors">Beneficios</a>
                            <a href="#leads" className="text-gray-700 hover:text-green-600 transition-colors">¿Qué es un Lead?</a>
                            <a href="#comisiones" className="text-gray-700 hover:text-green-600 transition-colors">Comisiones</a>
                            <a href="#proceso" className="text-gray-700 hover:text-green-600 transition-colors">Proceso</a>
                            <a href="#testimonios" className="text-gray-700 hover:text-green-600 transition-colors">Casos de Éxito</a>
                        </nav>

                        <div className="flex items-center space-x-4">
                            <Link 
                                to="/login" 
                                className="text-gray-700 hover:text-green-600 transition-colors"
                            >
                                Iniciar Sesión
                            </Link>
                            <Link 
                                to="/signup" 
                                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105"
                            >
                                Registrarse Gratis
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-emerald-600/10"></div>
                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-6">
                            <DollarSign className="h-4 w-4" />
                            PROGRAMA DE COMISIONISTAS DIGITALES
                        </div>
                        
                        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                            Conviértete en{' '}
                            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                Comisionista Digital
                            </span>
                        </h1>
                        
                        <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
                            Gana dinero promocionando negocios locales en tus redes sociales. 
                            Desde <span className="font-bold text-green-600">$50 USD por campaña</span> hasta 
                            <span className="font-bold text-green-600"> $2,000+ USD mensuales</span>.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                            <Link 
                                to="/signup" 
                                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-xl"
                            >
                                Registrarme Gratis
                                <ArrowRight className="h-5 w-5 inline ml-2" />
                            </Link>
                            
                            <button 
                                onClick={() => setIsVideoModalOpen(true)}
                                className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors"
                            >
                                <Play className="h-5 w-5" />
                                Ver Demo (3 min)
                            </button>
                        </div>

                        {/* Estadísticas rápidas */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-green-100">
                                <div className="text-2xl font-bold text-green-600">$50+</div>
                                <div className="text-sm text-gray-600">Por campaña</div>
                            </div>
                            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-green-100">
                                <div className="text-2xl font-bold text-green-600">2,000+</div>
                                <div className="text-sm text-gray-600">Comisionistas</div>
                            </div>
                            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-green-100">
                                <div className="text-2xl font-bold text-green-600">500+</div>
                                <div className="text-sm text-gray-600">Negocios</div>
                            </div>
                            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-green-100">
                                <div className="text-2xl font-bold text-green-600">95%</div>
                                <div className="text-sm text-gray-600">Satisfacción</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Background decoration */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-green-400/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl"></div>
            </section>

            {/* Estadísticas */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <stat.icon className="h-8 w-8 text-green-600" />
                                </div>
                                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                                <div className="text-gray-600">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Beneficios */}
            <section id="beneficios" className="py-20 bg-gradient-to-br from-gray-50 to-green-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            ¿Por qué ser Comisionista Digital?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Descubre las ventajas únicas de nuestro programa y cómo puede transformar 
                            tu presencia en redes sociales en una fuente de ingresos estable.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                                <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                                    <feature.icon className="h-8 w-8 text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ¿Qué es un Lead? */}
            <section id="leads" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            ¿Qué es un Lead y por qué es tu fuente de ingresos?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Entiende el valor real que generas y por qué los negocios están dispuestos 
                            a pagarte por cada cliente que les lleves.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Explicación del Lead */}
                        <div className="space-y-6">
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
                                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                    <Target className="h-8 w-8 text-green-600" />
                                    ¿Qué es un Lead?
                                </h3>
                                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                                    Un <strong>lead</strong> es una persona interesada en un producto o servicio 
                                    que tiene el potencial de convertirse en cliente. En el mundo digital, 
                                    cada like, comentario, clic o interacción puede ser un lead valioso.
                                </p>
                                <div className="bg-white rounded-xl p-4 border border-green-200">
                                    <p className="text-sm text-gray-600">
                                        <strong>Ejemplo:</strong> Cuando recomiendas un restaurante y tu seguidor 
                                        hace clic en el enlace, ese clic es un lead que puede convertirse en una reserva.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
                                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                    <DollarSign className="h-8 w-8 text-blue-600" />
                                    ¿Por qué los Leads valen dinero?
                                </h3>
                                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                                    Los negocios pagan por leads porque:
                                </p>
                                <ul className="space-y-3 text-gray-700">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <span><strong>Reducen costos de marketing:</strong> Es más barato pagar comisiones que publicidad tradicional</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <span><strong>Mayor tasa de conversión:</strong> Los leads de influencers tienen más confianza</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <span><strong>Audiencia segmentada:</strong> Llegan clientes realmente interesados</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <span><strong>ROI medible:</strong> Saben exactamente cuánto pagan por cada cliente</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Visualización del Proceso */}
                        <div className="space-y-6">
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100">
                                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                                    El Flujo del Lead
                                </h3>
                                
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                            1
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900">Tu Contenido</h4>
                                            <p className="text-sm text-gray-600">Creas contenido auténtico sobre un negocio</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                            2
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900">Audiencia Interesada</h4>
                                            <p className="text-sm text-gray-600">Tu seguidor interactúa con el contenido</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                            3
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900">Lead Generado</h4>
                                            <p className="text-sm text-gray-600">El negocio recibe un cliente potencial</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                            4
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900">Comisión Ganada</h4>
                                            <p className="text-sm text-gray-600">Recibes tu pago por el lead generado</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-8 border border-yellow-100">
                                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                    <TrendingUp className="h-8 w-8 text-orange-600" />
                                    Valor del Lead por Industria
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-700">Restaurantes</span>
                                        <span className="font-bold text-green-600">$50 - $150</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-700">Servicios de Belleza</span>
                                        <span className="font-bold text-green-600">$80 - $200</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-700">Fitness & Wellness</span>
                                        <span className="font-bold text-green-600">$100 - $300</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-700">E-commerce</span>
                                        <span className="font-bold text-green-600">10-25% venta</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ¿Cómo se Generan los Deals? */}
            <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            ¿Cómo se Generan los Deals?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Los <strong>deals</strong> son la unidad fundamental que conecta marcas e influencers, 
                            creando oportunidades de monetización para ambos.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Definición de Deal */}
                        <div className="bg-white rounded-2xl p-8 shadow-lg border border-blue-100">
                            <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                                <Handshake className="h-8 w-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">¿Qué es un Deal?</h3>
                            <p className="text-gray-600 leading-relaxed mb-4">
                                Un <strong>deal</strong> es un acuerdo entre una marca y un influencer donde:
                            </p>
                            <ul className="space-y-2 text-gray-600 text-sm">
                                <li>• La marca define su objetivo y presupuesto</li>
                                <li>• Los influencers pujan por la campaña</li>
                                <li>• Se selecciona el mejor candidato</li>
                                <li>• Se ejecuta la promoción</li>
                                <li>• Se pagan las comisiones por resultados</li>
                            </ul>
                        </div>

                        {/* Proceso de Generación */}
                        <div className="bg-white rounded-2xl p-8 shadow-lg border border-green-100">
                            <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                                <Rocket className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Proceso de Generación</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                                    <span className="text-gray-600 text-sm">Marca crea campaña</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                                    <span className="text-gray-600 text-sm">Influencers pujan</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
                                    <span className="text-gray-600 text-sm">Selección del ganador</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">4</div>
                                    <span className="text-gray-600 text-sm">Ejecución y pago</span>
                                </div>
                            </div>
                        </div>

                        {/* Tipos de Deals */}
                        <div className="bg-white rounded-2xl p-8 shadow-lg border border-purple-100">
                            <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mb-6">
                                <Gift className="h-8 w-8 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Tipos de Deals</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700 text-sm">Posts Únicos</span>
                                    <span className="font-bold text-green-600 text-sm">$50 - $200</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700 text-sm">Campañas Múltiples</span>
                                    <span className="font-bold text-green-600 text-sm">$200 - $500</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700 text-sm">Colaboraciones Largo Plazo</span>
                                    <span className="font-bold text-green-600 text-sm">$500 - $2,000</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700 text-sm">Eventos Especiales</span>
                                    <span className="font-bold text-green-600 text-sm">$300 - $1,000</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Explicación del Sistema */}
                    <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                        <div className="text-center mb-8">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                El Sistema de Deals en Acción
                            </h3>
                            <p className="text-lg text-gray-600 max-w-4xl mx-auto">
                                Cada deal que participas genera leads, y cada lead te genera ingresos. 
                                Es un sistema donde todos ganan: las marcas obtienen clientes, 
                                tú obtienes comisiones, y tu audiencia descubre productos valiosos.
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-green-600" />
                                    Para el Influencer
                                </h4>
                                <ul className="space-y-2 text-gray-700 text-sm">
                                    <li>• Ingresos predecibles por campaña</li>
                                    <li>• Oportunidades de crecimiento</li>
                                    <li>• Relaciones con marcas establecidas</li>
                                    <li>• Portfolio de trabajos exitosos</li>
                                </ul>
                            </div>
                            
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <Store className="h-5 w-5 text-blue-600" />
                                    Para la Marca
                                </h4>
                                <ul className="space-y-2 text-gray-700 text-sm">
                                    <li>• Acceso a audiencias segmentadas</li>
                                    <li>• Marketing con ROI medible</li>
                                    <li>• Contenido auténtico y confiable</li>
                                    <li>• Costos de adquisición predecibles</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tipos de Comisiones */}
            <section id="comisiones" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Múltiples Formas de Ganar
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Diversifica tus ingresos con diferentes tipos de promociones y campañas 
                            que se adaptan a tu estilo de contenido.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {commissionTypes.map((type, index) => (
                            <div key={index} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                                <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                                    <type.icon className="h-8 w-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">{type.title}</h3>
                                <p className="text-gray-600 leading-relaxed mb-4">{type.description}</p>
                                <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                                    <DollarSign className="h-4 w-4" />
                                    {type.earnings}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Plataformas Soportadas */}
            <section className="py-20 bg-gradient-to-br from-gray-50 to-green-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Todas las Redes Sociales
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            No importa en qué plataforma tengas tu audiencia. 
                            Link4Deal te conecta con negocios en todas las redes sociales principales.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                        {platforms.map((platform, index) => (
                            <div key={index} className="text-center">
                                <div className={`w-20 h-20 bg-gradient-to-r ${platform.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                                    <platform.icon className="h-10 w-10 text-white" />
                                </div>
                                <h3 className="font-semibold text-gray-900">{platform.name}</h3>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Proceso */}
            <section id="proceso" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Proceso Simple en 4 Pasos
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Desde el registro hasta tu primera comisión, 
                            todo está diseñado para ser simple y rápido.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {processSteps.map((step, index) => (
                            <div key={index} className="text-center relative">
                                {index < processSteps.length - 1 && (
                                    <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-green-200 to-emerald-200 transform -translate-y-1/2 z-0"></div>
                                )}
                                
                                <div className="relative z-10">
                                    <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                                        {step.step}
                                    </div>
                                    <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                        <step.icon className="h-8 w-8 text-green-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">{step.title}</h3>
                                    <p className="text-gray-600 leading-relaxed">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Casos de Éxito */}
            <section id="testimonios" className="py-20 bg-gradient-to-br from-gray-50 to-green-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Comisionistas Exitosos
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Descubre cómo otros creadores de contenido han transformado 
                            sus redes sociales en fuentes de ingresos estables.
                        </p>
                    </div>

                    <div className="relative">
                        {/* Botones de navegación */}
                        <button
                            onClick={() => setActiveTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-gray-700 hover:text-green-600 p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        
                        <button
                            onClick={() => setActiveTestimonial((prev) => (prev + 1) % testimonials.length)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-gray-700 hover:text-green-600 p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        
                        <div className="flex overflow-hidden">
                            {testimonials.map((testimonial, index) => (
                                <div 
                                    key={index}
                                    className={`w-full flex-shrink-0 transition-transform duration-700 ease-in-out ${
                                        index === activeTestimonial ? 'translate-x-0' : 'translate-x-full'
                                    }`}
                                >
                                    <div className="max-w-4xl mx-auto">
                                        <div className="bg-white rounded-2xl p-12 shadow-2xl text-center border-2 border-green-100">
                                            <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-6 shadow-lg">
                                                <img 
                                                    src={testimonial.image} 
                                                    alt={testimonial.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            
                                            <div className="mb-6">
                                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                                    {testimonial.name}
                                                </h3>
                                                <p className="text-green-600 font-semibold mb-1">
                                                    {testimonial.role}
                                                </p>
                                                <p className="text-gray-500">
                                                    {testimonial.city}
                                                </p>
                                            </div>
                                            
                                            <blockquote className="text-xl text-gray-700 mb-6 italic">
                                                "{testimonial.text}"
                                            </blockquote>
                                            
                                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                                <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold">
                                                    <DollarSign className="h-5 w-5" />
                                                    {testimonial.results}
                                                </div>
                                                <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold">
                                                    <Users className="h-5 w-5" />
                                                    {testimonial.followers}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Indicadores */}
                        <div className="flex justify-center mt-8 space-x-3">
                            {testimonials.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setActiveTestimonial(index)}
                                    className={`w-4 h-4 rounded-full transition-all duration-300 ${
                                        index === activeTestimonial 
                                            ? 'bg-green-600 scale-110 shadow-lg' 
                                            : 'bg-gray-300 hover:bg-gray-400'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section className="py-20 bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900 text-white">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-6">
                        ¿Listo para convertirte en Comisionista Digital?
                    </h2>
                    <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto">
                        Únete a miles de creadores de contenido que ya están ganando dinero 
                        promocionando negocios locales en sus redes sociales.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link 
                            to="/signup" 
                            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105"
                        >
                            Registrarme Gratis
                        </Link>
                        
                        <button 
                            onClick={() => setIsVideoModalOpen(true)}
                            className="bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/30 transition-all duration-300"
                        >
                            Ver Demo Completo
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-16">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center space-x-3 mb-4">
                                <img 
                                    src="/logo.png" 
                                    alt="Link4Deal" 
                                    className="w-10 h-10 object-contain"
                                />
                                <span className="text-xl font-bold">Link4Deal</span>
                            </div>
                            <p className="text-gray-400">
                                Conectando creadores de contenido con negocios locales para generar ingresos mutuos.
                            </p>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold mb-4">Para Comisionistas</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">Registro Gratis</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Tipos de Comisiones</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Guía de Inicio</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Soporte</a></li>
                            </ul>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold mb-4">Recursos</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Casos de Éxito</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Comunidad</a></li>
                            </ul>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold mb-4">Contacto</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li>contacto@link4deal.com</li>
                                <li>+52 55 1234 5678</li>
                                <li>CDMX, México</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
                        <p>&copy; 2024 Link4Deal. Todos los derechos reservados.</p>
                    </div>
                </div>
            </footer>

            {/* Modal de Video */}
            {isVideoModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-4xl w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Demo del Programa de Comisionistas</h3>
                            <button 
                                onClick={() => setIsVideoModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                                <Play className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">Video demo aquí</p>
                                <p className="text-sm text-gray-500">Implementar reproductor de video</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DigitalCommissionerLanding;

