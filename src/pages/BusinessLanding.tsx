import React, { useState, useEffect } from 'react';
import { 
    Store, 
    Users, 
    MapPin, 
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
    DollarSign,
    Euro,
    CreditCard
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SITE_CONFIG } from '../config/site';

const BusinessLanding: React.FC = () => {
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [activeTestimonial, setActiveTestimonial] = useState(0);
    const [isSticky, setIsSticky] = useState(false);

    // Testimonios de negocios exitosos
    const testimonials = [
        {
            name: "María González",
            business: "Boutique 'Elegance'",
            city: "CDMX",
            image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&w=300&q=80",
            text: "Con Link4Deal llenamos nuestra boutique desde el primer día. Los cupones geolocalizados fueron clave para atraer clientes del barrio.",
            results: "150+ clientes en inauguración"
        },
        {
            name: "Carlos Mendoza",
            business: "Restaurante 'Sabor Mexicano'",
            city: "Guadalajara",
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
            text: "La estrategia de influencers locales nos dio credibilidad inmediata. Los tokens de fidelidad mantienen a nuestros clientes regresando.",
            results: "200+ reservas en la primera semana"
        },
        {
            name: "Ana Rodríguez",
            business: "Cafetería 'Aroma'",
            city: "Monterrey",
            image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80",
            text: "Invertimos solo $1 USD y conseguimos una campaña completa de marketing. Los resultados superaron nuestras expectativas.",
            results: "300+ visitantes en el primer mes"
        },
        {
            name: "Roberto Silva",
            business: "Gimnasio 'PowerFit'",
            city: "Puebla",
            image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=300&q=80",
            text: "Los cupones geolocalizados nos ayudaron a captar clientes del área. Ahora tenemos una base sólida de miembros fieles.",
            results: "180+ membresías en 30 días"
        },
        {
            name: "Carmen Vega",
            business: "Spa 'Belleza Natural'",
            city: "Querétaro",
            image: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=300&q=80",
            text: "La combinación de influencers locales y blockchain nos dio credibilidad inmediata. Los clientes confían en nuestra transparencia.",
            results: "120+ citas reservadas en la primera semana"
        }
    ];

    // Estadísticas del sistema
    const stats = [
        { number: "500+", label: "Negocios Inaugurados", icon: Store },
        { number: "2,000+", label: "Influencers Activos", icon: Users },
        { number: "50,000+", label: "Cupones Redimidos", icon: TrendingUp },
        { number: "95%", label: "Tasa de Éxito", icon: Star }
    ];

    // Características del paquete
    const features = [
        {
            icon: Rocket,
            title: "Lanzamiento Garantizado",
            description: "Asegura clientes desde el primer día con cupones geolocalizados y influencers locales."
        },
        {
            icon: Target,
            title: "Audiencia Localizada",
            description: "Llega a clientes reales que viven cerca de tu tienda y están listos para visitarte."
        },
        {
            icon: Shield,
            title: "Transparencia Total",
            description: "Todo el proceso se registra en blockchain, desde las pujas hasta los resultados."
        },
        {
            icon: Zap,
            title: "Resultados Inmediatos",
            description: "Ve el impacto de tu campaña en tiempo real con métricas detalladas."
        },
        {
            icon: Wallet,
            title: "Fidelización Automática",
            description: "Los clientes reciben tokens que los mantienen conectados con tu negocio."
        },
        {
            icon: BarChart3,
            title: "Analytics Avanzados",
            description: "Obtén insights valiosos sobre tu audiencia y optimiza futuras campañas."
        }
    ];

    // Precios en diferentes monedas
    const pricing = [
        {
            currency: "USD",
            symbol: "$",
            amount: "1",
            flag: "🇺🇸",
            popular: false
        },
        {
            currency: "MXN",
            symbol: "$",
            amount: "20",
            flag: "🇲🇽",
            popular: true
        },
        {
            currency: "EUR",
            symbol: "€",
            amount: "1",
            flag: "🇪🇺",
            popular: false
        }
    ];

    // Proceso paso a paso
    const processSteps = [
        {
            step: "01",
            title: "Contrata el Paquete",
            description: "Paga solo $1 USD, €1 EUR o $20 MXN para acceder al ecosistema completo.",
            icon: CreditCard
        },
        {
            step: "02",
            title: "Configura tu Tienda",
            description: "Registra la ubicación, horarios y detalles de tu negocio en la plataforma.",
            icon: Store
        },
        {
            step: "03",
            title: "Selecciona Influencers",
            description: "Elige entre cientos de influencers locales que pujarán por tu campaña.",
            icon: Users
        },
        {
            step: "04",
            title: "Lanza tu Campaña",
            description: "Activa cupones geolocalizados y comienza a recibir clientes.",
            icon: Rocket
        }
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
            {/* Header Sticky */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                isSticky ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
            }`}>
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link to="/" className="flex items-center space-x-3">
                            <img 
                                src="/logo.png" 
                                alt="DameCódigo" 
                                className="w-10 h-10 object-contain"
                            />
                            <span className="text-xl font-bold text-gray-900">{SITE_CONFIG.name}</span>
                        </Link>
                        
                        <nav className="hidden md:flex items-center space-x-8">
                            <a href="#beneficios" className="text-gray-700 hover:text-blue-600 transition-colors">Beneficios</a>
                            <a href="#proceso" className="text-gray-700 hover:text-blue-600 transition-colors">Proceso</a>
                            <a href="#testimonios" className="text-gray-700 hover:text-blue-600 transition-colors">Casos de Éxito</a>
                            <a href="#precios" className="text-gray-700 hover:text-blue-600 transition-colors">Precios</a>
                        </nav>

                        <div className="flex items-center space-x-4">
                            <Link 
                                to="/login" 
                                className="text-gray-700 hover:text-blue-600 transition-colors"
                            >
                                Iniciar Sesión
                            </Link>
                            <Link 
                                to="/checkout" 
                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
                            >
                                Contratar Ahora
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-20 relative overflow-hidden">
                {/* Background image (solo aquí en /landing) */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1761805662068-147b10c3cc76?q=80&w=1032&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                        alt=""
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/45 z-[1]" aria-hidden="true" />
                </div>
                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-bold mb-6 border border-white/30 text-stroke-black-thin text-shadow-soft">
                            <Rocket className="h-4 w-4" />
                            PAQUETE DE INAUGURACIÓN
                        </div>
                        
                        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight text-stroke-black text-shadow-hero">
                            Llena tu tienda con clientes desde el{' '}
                            <span className="text-blue-200 text-stroke-black">
                                primer día
                            </span>
                        </h1>
                        
                        <p className="text-xl md:text-2xl text-gray-100 mb-8 leading-relaxed">
                            Conecta con influencers locales, genera cupones geolocalizados y construye una comunidad leal 
                            desde tu inauguración. Todo por solo{' '}
                            <span className="font-bold text-blue-200">$1 USD, €1 EUR o $20 MXN</span>.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                            <Link 
                                to="/checkout" 
                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl"
                            >
                                Contratar Paquete de Inauguración
                                <ArrowRight className="h-5 w-5 inline ml-2" />
                            </Link>
                            
                            <button 
                                onClick={() => setIsVideoModalOpen(true)}
                                className="flex items-center gap-2 text-white/90 hover:text-white transition-colors text-stroke-black-thin text-shadow-soft"
                            >
                                <Play className="h-5 w-5" />
                                Ver Demo (2 min)
                            </button>
                        </div>

                        {/* Precios destacados */}
                        <div className="flex flex-wrap justify-center gap-4">
                            {pricing.map((price) => (
                                <div key={price.currency} className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                                    price.popular 
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                                        : 'bg-white/90 text-gray-700 border border-white/50 backdrop-blur-sm'
                                }`}>
                                    <span className="text-2xl">{price.flag}</span>
                                    <span className="font-bold">{price.symbol}{price.amount}</span>
                                    <span className="text-sm">{price.currency}</span>
                                    {price.popular && (
                                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                                            POPULAR
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Background decoration */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"></div>
            </section>

            {/* Estadísticas */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <stat.icon className="h-8 w-8 text-blue-600" />
                                </div>
                                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                                <div className="text-gray-600">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Beneficios */}
            <section id="beneficios" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            ¿Por qué elegir {SITE_CONFIG.name}?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Nuestro paquete de inauguración combina la mejor tecnología de marketing digital 
                            con la transparencia de blockchain para garantizar tu éxito.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                                <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6">
                                    <feature.icon className="h-8 w-8 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
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
                            Desde la contratación hasta el lanzamiento de tu campaña, 
                            todo está diseñado para ser simple y efectivo.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {processSteps.map((step, index) => (
                            <div key={index} className="text-center relative">
                                {index < processSteps.length - 1 && (
                                    <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-blue-200 to-purple-200 transform -translate-y-1/2 z-0"></div>
                                )}
                                
                                <div className="relative z-10">
                                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                                        {step.step}
                                    </div>
                                    <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                        <step.icon className="h-8 w-8 text-blue-600" />
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
            <section id="testimonios" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Casos de Éxito Reales
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Descubre cómo otros negocios han transformado su inauguración 
                            con nuestro paquete de cryptomarketing.
                        </p>
                    </div>

                    <div className="relative">
                        {/* Botones de navegación */}
                        <button
                            onClick={() => setActiveTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        
                        <button
                            onClick={() => setActiveTestimonial((prev) => (prev + 1) % testimonials.length)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
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
                                        <div className="bg-white rounded-2xl p-12 shadow-2xl text-center border-2 border-blue-100">
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
                                                <p className="text-blue-600 font-semibold mb-1">
                                                    {testimonial.business}
                                                </p>
                                                <p className="text-gray-500">
                                                    {testimonial.city}
                                                </p>
                                            </div>
                                            
                                            <blockquote className="text-xl text-gray-700 mb-6 italic">
                                                "{testimonial.text}"
                                            </blockquote>
                                            
                                            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold">
                                                <CheckCircle className="h-5 w-5" />
                                                {testimonial.results}
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
                                            ? 'bg-blue-600 scale-110 shadow-lg' 
                                            : 'bg-gray-300 hover:bg-gray-400'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Precios */}
            <section id="precios" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Precio Único y Simbólico
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            El paquete de inauguración está diseñado para ser accesible a cualquier negocio, 
                            sin importar su tamaño o presupuesto.
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-12 text-white text-center relative overflow-hidden">
                            {/* Background decoration */}
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 to-purple-600/20"></div>
                            <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full"></div>
                            <div className="absolute bottom-10 left-10 w-24 h-24 bg-white/10 rounded-full"></div>
                            
                            <div className="relative z-10">
                                <h3 className="text-3xl font-bold mb-6">
                                    Paquete de Inauguración Completo
                                </h3>
                                
                                <div className="flex flex-wrap justify-center gap-6 mb-8">
                                    {pricing.map((price) => (
                                        <div key={price.currency} className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 min-w-[120px]">
                                            <div className="text-4xl mb-2">{price.flag}</div>
                                            <div className="text-3xl font-bold">
                                                {price.symbol}{price.amount}
                                            </div>
                                            <div className="text-sm opacity-90">{price.currency}</div>
                                        </div>
                                    ))}
                                </div>
                                
                                <p className="text-xl mb-8 opacity-90">
                                    Acceso completo al ecosistema {SITE_CONFIG.name} por un solo pago
                                </p>
                                
                                <Link 
                                    to="/checkout" 
                                    className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
                                >
                                    Contratar Ahora
                                    <ArrowRight className="h-5 w-5" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section className="py-20 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-6">
                        ¿Listo para llenar tu tienda desde el primer día?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
                        Únete a cientos de negocios que ya han transformado su inauguración 
                        con nuestro paquete de cryptomarketing.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link 
                            to="/checkout" 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105"
                        >
                            Contratar por $1 USD
                        </Link>
                        
                        <Link 
                            to="/checkout" 
                            className="bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/30 transition-all duration-300"
                        >
                            Ver Demo Completo
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-16">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <Link to="/" className="flex items-center space-x-3 mb-4">
                                <img 
                                    src="/logo.png" 
                                    alt="DameCódigo" 
                                    className="w-10 h-10 object-contain"
                                />
                                <span className="text-xl font-bold">{SITE_CONFIG.name}</span>
                            </Link>
                            <p className="text-gray-400">
                                Revolucionando el marketing digital con blockchain y geolocalización.
                            </p>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold mb-4">Productos</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">Paquete de Inauguración</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Cupones Geolocalizados</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Marketplace de Influencers</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Analytics Avanzados</a></li>
                            </ul>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold mb-4">Recursos</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">Documentación</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Casos de Éxito</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Soporte</a></li>
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
                        <p>{SITE_CONFIG.copyright}</p>
                    </div>
                </div>
            </footer>

            {/* Modal de Video */}
            {isVideoModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-4xl w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Demo del Paquete de Inauguración</h3>
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

export default BusinessLanding;
