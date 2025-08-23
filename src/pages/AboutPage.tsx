import React from 'react';
import { Link } from 'react-router-dom';
import { 
    ArrowLeft, 
    Users, 
    Target, 
    Award, 
    Globe, 
    Shield, 
    TrendingUp, 
    Heart, 
    Zap, 
    Star,
    CheckCircle,
    Building2,
    Lightbulb,
    Rocket
} from 'lucide-react';

export default function AboutPage() {
    const teamMembers = [
        {
            name: "Carlos Rodríguez",
            position: "CEO & Fundador",
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
            bio: "Emprendedor serial con más de 15 años de experiencia en e-commerce y blockchain. Apasionado por conectar marcas con influencers de manera transparente.",
            linkedin: "https://linkedin.com/in/carlos-rodriguez"
        },
        {
            name: "Ana Martínez",
            position: "CTO & Co-Fundadora",
            image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&w=300&q=80",
            bio: "Ingeniera de software especializada en blockchain y smart contracts. Lidera el desarrollo tecnológico de la plataforma Link4Deal.",
            linkedin: "https://linkedin.com/in/ana-martinez"
        },
        {
            name: "Miguel Sánchez",
            position: "Head of Marketing",
            image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80",
            bio: "Experto en marketing digital y estrategias de influencer marketing. Ayuda a las marcas a maximizar su ROI en campañas digitales.",
            linkedin: "https://linkedin.com/in/miguel-sanchez"
        },
        {
            name: "Laura Fernández",
            position: "Head of Partnerships",
            image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80",
            bio: "Especialista en relaciones estratégicas y desarrollo de negocios. Construye alianzas duraderas entre marcas e influencers.",
            linkedin: "https://linkedin.com/in/laura-fernandez"
        }
    ];

    const values = [
        {
            icon: Shield,
            title: "Transparencia",
            description: "Creemos en la transparencia total en todas nuestras transacciones y relaciones comerciales."
        },
        {
            icon: Heart,
            title: "Confianza",
            description: "Construimos relaciones duraderas basadas en la confianza mutua y la integridad."
        },
        {
            icon: Zap,
            title: "Innovación",
            description: "Utilizamos tecnología blockchain para revolucionar el marketing de influencers."
        },
        {
            icon: Users,
            title: "Comunidad",
            description: "Fomentamos una comunidad colaborativa donde todos pueden crecer juntos."
        }
    ];

    const milestones = [
        {
            year: "2020",
            title: "Fundación",
            description: "Link4Deal nace con la visión de revolucionar el marketing de influencers"
        },
        {
            year: "2021",
            title: "Primera Plataforma",
            description: "Lanzamiento de la plataforma beta con 100 marcas y 500 influencers"
        },
        {
            year: "2022",
            title: "Expansión",
            description: "Crecimiento a 1000+ marcas y 5000+ influencers registrados"
        },
        {
            year: "2023",
            title: "Blockchain Integration",
            description: "Implementación de smart contracts ERC-777 para transacciones seguras"
        },
        {
            year: "2024",
            title: "Lanzamiento Global",
            description: "Expansión internacional y más de 10,000 transacciones exitosas"
        }
    ];

    const stats = [
        { number: "10,000+", label: "Transacciones Exitosas" },
        { number: "500+", label: "Marcas Activas" },
        { number: "2,000+", label: "Influencers Verificados" },
        { number: "€2M+", label: "Volumen de Negocio" }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors">
                            <ArrowLeft className="h-6 w-6" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Sobre Nosotros</h1>
                            <p className="text-gray-600">Conoce más sobre Link4Deal y nuestro equipo</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 text-white py-20">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h2 className="text-5xl font-bold mb-6">Conectando el Futuro del Marketing Digital</h2>
                    <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
                        Link4Deal es la plataforma líder que revoluciona la forma en que las marcas se conectan 
                        con influencers, utilizando tecnología blockchain para garantizar transparencia, 
                        seguridad y resultados medibles.
                    </p>
                    <div className="mt-8 flex justify-center">
                        <Link 
                            to="/contact" 
                            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                        >
                            Contáctanos
                        </Link>
                    </div>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="text-center lg:text-left">
                            <div className="flex justify-center lg:justify-start mb-6">
                                <Target className="h-16 w-16 text-blue-600" />
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 mb-4">Nuestra Misión</h3>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                Democratizar el acceso al marketing de influencers, proporcionando una plataforma 
                                transparente y segura donde marcas e influencers puedan crear asociaciones 
                                auténticas y rentables.
                            </p>
                        </div>
                        
                        <div className="text-center lg:text-left">
                            <div className="flex justify-center lg:justify-start mb-6">
                                <Rocket className="h-16 w-16 text-purple-600" />
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 mb-4">Nuestra Visión</h3>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                Ser la plataforma global de referencia para el marketing de influencers, 
                                liderando la transformación digital del sector con tecnología blockchain 
                                y un enfoque centrado en la comunidad.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h3 className="text-3xl font-bold text-gray-900 mb-4">Números que Hablan</h3>
                        <p className="text-lg text-gray-600">El impacto de Link4Deal en números</p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-4xl font-bold text-blue-600 mb-2">{stat.number}</div>
                                <div className="text-gray-600">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h3 className="text-3xl font-bold text-gray-900 mb-4">Nuestros Valores</h3>
                        <p className="text-lg text-gray-600">Los principios que guían todo lo que hacemos</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {values.map((value, index) => (
                            <div key={index} className="text-center p-6 bg-white rounded-xl shadow-lg">
                                <div className="flex justify-center mb-4">
                                    <value.icon className="h-12 w-12 text-blue-600" />
                                </div>
                                <h4 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h4>
                                <p className="text-gray-600">{value.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h3 className="text-3xl font-bold text-gray-900 mb-4">Nuestro Equipo</h3>
                        <p className="text-lg text-gray-600">Conoce a las mentes detrás de Link4Deal</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {teamMembers.map((member, index) => (
                            <div key={index} className="text-center">
                                <div className="mb-4">
                                    <img
                                        src={member.image}
                                        alt={member.name}
                                        className="w-32 h-32 rounded-full mx-auto object-cover shadow-lg"
                                    />
                                </div>
                                <h4 className="text-xl font-semibold text-gray-900 mb-2">{member.name}</h4>
                                <p className="text-blue-600 font-medium mb-3">{member.position}</p>
                                <p className="text-gray-600 text-sm mb-4 leading-relaxed">{member.bio}</p>
                                <a
                                    href={member.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 transition-colors text-sm"
                                >
                                    Ver en LinkedIn
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Milestones */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h3 className="text-3xl font-bold text-gray-900 mb-4">Nuestro Camino</h3>
                        <p className="text-lg text-gray-600">Los hitos que han marcado nuestra historia</p>
                    </div>
                    
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-1/2 transform -translate-x-px h-full w-0.5 bg-blue-200"></div>
                        
                        <div className="space-y-12">
                            {milestones.map((milestone, index) => (
                                <div key={index} className={`relative flex items-center ${
                                    index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
                                }`}>
                                    {/* Timeline dot */}
                                    <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-lg"></div>
                                    
                                    {/* Content */}
                                    <div className={`w-5/12 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                                        <div className="bg-white p-6 rounded-lg shadow-lg">
                                            <div className="text-2xl font-bold text-blue-600 mb-2">{milestone.year}</div>
                                            <h4 className="text-xl font-semibold text-gray-900 mb-2">{milestone.title}</h4>
                                            <p className="text-gray-600">{milestone.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Technology */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h3 className="text-3xl font-bold text-gray-900 mb-4">Tecnología de Vanguardia</h3>
                        <p className="text-lg text-gray-600">Innovación blockchain para el futuro del marketing</p>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h4 className="text-2xl font-bold text-gray-900 mb-6">Smart Contracts ERC-777</h4>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                                    <div>
                                        <h5 className="font-semibold text-gray-900">Transacciones Seguras</h5>
                                        <p className="text-gray-600">Cada transacción está respaldada por contratos inteligentes verificados</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                                    <div>
                                        <h5 className="font-semibold text-gray-900">Transparencia Total</h5>
                                        <p className="text-gray-600">Todas las operaciones son visibles y auditables en la blockchain</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                                    <div>
                                        <h5 className="font-semibold text-gray-900">Automatización</h5>
                                        <p className="text-gray-600">Procesos automáticos que eliminan intermediarios y reducen costos</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl">
                            <div className="text-center">
                                <Building2 className="h-24 w-24 text-blue-600 mx-auto mb-4" />
                                <h5 className="text-xl font-semibold text-gray-900 mb-2">Blockchain Ethereum</h5>
                                <p className="text-gray-600">
                                    Utilizamos la red más segura y descentralizada para garantizar 
                                    la integridad de todas nuestras operaciones.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <div className="flex justify-center mb-4">
                            <span className="text-4xl">🌟</span>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-4">¿Cómo Funciona Link4Deal?</h3>
                        <p className="text-lg text-gray-600">Un ejemplo práctico del ecosistema completo</p>
                    </div>

                    {/* Example Story */}
                    <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
                        <div className="text-center mb-8">
                            <h4 className="text-2xl font-bold text-gray-900 mb-4">Ejemplo: Laura, la Influencer de Moda</h4>
                            <p className="text-lg text-gray-600">
                                Imagina que Laura, una influencer de moda, se asocia con una marca de zapatos deportivos.
                                La marca quiere atraer nuevos clientes y acuerda con Link4Deal lanzar una promoción:
                            </p>
                            <div className="mt-4 inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full font-semibold">
                                👉 "20% de descuento en los primeros 500 pares de tenis"
                            </div>
                        </div>

                        {/* Story Characters */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <img 
                                    src="https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&w=200&q=80" 
                                    alt="Laura - Influencer" 
                                    className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
                                />
                                <h5 className="font-semibold text-blue-900">Laura</h5>
                                <p className="text-sm text-blue-700">Influencer de Moda</p>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <img 
                                    src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=200&q=80" 
                                    alt="Marca de Zapatos" 
                                    className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
                                />
                                <h5 className="font-semibold text-green-900">Marca Deportiva</h5>
                                <p className="text-sm text-green-700">Zapatos Deportivos</p>
                            </div>
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                                <img 
                                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80" 
                                    alt="Carlos - Usuario" 
                                    className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
                                />
                                <h5 className="font-semibold text-purple-900">Carlos</h5>
                                <p className="text-sm text-purple-700">Cliente Final</p>
                            </div>
                        </div>

                        {/* Process Steps */}
                        <div className="space-y-8">
                            {/* Step 1 */}
                            <div className="flex flex-col lg:flex-row items-center gap-8 p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                                <div className="lg:w-1/3">
                                    <div className="text-center">
                                        <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                            1
                                        </div>
                                        <h5 className="text-xl font-bold text-blue-900 mb-2">Creación del Contrato</h5>
                                        <img 
                                            src="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=300&q=80" 
                                            alt="Smart Contract" 
                                            className="w-full h-32 object-cover rounded-lg"
                                        />
                                    </div>
                                </div>
                                <div className="lg:w-2/3">
                                    <p className="text-gray-700 mb-4">
                                        Se genera un smart contract que define:
                                    </p>
                                    <ul className="space-y-2 text-gray-700">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-blue-600" />
                                            <span>500 cupones disponibles</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-blue-600" />
                                            <span>Valor económico de cada cupón ($20 de descuento en una compra de $100)</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-blue-600" />
                                            <span>Vigencia y condiciones de uso</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="flex flex-col lg:flex-row-reverse items-center gap-8 p-6 bg-gradient-to-r from-purple-100 to-purple-50 rounded-xl">
                                <div className="lg:w-1/3">
                                    <div className="text-center">
                                        <div className="bg-purple-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                            2
                                        </div>
                                        <h5 className="text-xl font-bold text-purple-900 mb-2">Emisión de Tokens</h5>
                                        <img 
                                            src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=300&q=80" 
                                            alt="Digital Tokens" 
                                            className="w-full h-32 object-cover rounded-lg"
                                        />
                                    </div>
                                </div>
                                <div className="lg:w-2/3">
                                    <p className="text-gray-700 mb-4">
                                        Cada cupón se convierte en un token digital único:
                                    </p>
                                    <ul className="space-y-2 text-gray-700">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-purple-600" />
                                            <span>Los tokens aparecen en la app de Link4Deal (wallet digital)</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-purple-600" />
                                            <span>Los usuarios pueden ver todas las promociones activas</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-purple-600" />
                                            <span>Guardan sus cupones/tokens en su wallet con seguridad blockchain</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="flex flex-col lg:flex-row items-center gap-8 p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
                                <div className="lg:w-1/3">
                                    <div className="text-center">
                                        <div className="bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                            3
                                        </div>
                                        <h5 className="text-xl font-bold text-green-900 mb-2">Influencer y Usuarios</h5>
                                        <img 
                                            src="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=300&q=80" 
                                            alt="Social Media Marketing" 
                                            className="w-full h-32 object-cover rounded-lg"
                                        />
                                    </div>
                                </div>
                                <div className="lg:w-2/3">
                                    <p className="text-gray-700 mb-4">
                                        Laura comparte la promoción con sus seguidores:
                                    </p>
                                    <ul className="space-y-2 text-gray-700">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                            <span>Comparte en Instagram y TikTok</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                            <span>Sus seguidores descargan la app Link4Deal</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                            <span>Reclaman cupones/tokens digitales en su wallet</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Step 4 */}
                            <div className="flex flex-col lg:flex-row-reverse items-center gap-8 p-6 bg-gradient-to-r from-orange-100 to-orange-50 rounded-xl">
                                <div className="lg:w-1/3">
                                    <div className="text-center">
                                        <div className="bg-orange-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                            4
                                        </div>
                                        <h5 className="text-xl font-bold text-orange-900 mb-2">Redención en el Mundo Real</h5>
                                        <img 
                                            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=300&q=80" 
                                            alt="Shopping Experience" 
                                            className="w-full h-32 object-cover rounded-lg"
                                        />
                                    </div>
                                </div>
                                <div className="lg:w-2/3">
                                    <p className="text-gray-700 mb-4">
                                        Carlos usa su cupón digital en la tienda:
                                    </p>
                                    <ul className="space-y-2 text-gray-700">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-orange-600" />
                                            <span>Entra a la tienda física y compra los tenis</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-orange-600" />
                                            <span>Paga con el cupón digital desde la app</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-orange-600" />
                                            <span>El smart contract valida la transacción en blockchain</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-orange-600" />
                                            <span>El token se "quema" y se registra en el ecosistema</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Step 5 */}
                            <div className="flex flex-col lg:flex-row items-center gap-8 p-6 bg-gradient-to-r from-red-50 to-red-100 rounded-xl">
                                <div className="lg:w-1/3">
                                    <div className="text-center">
                                        <div className="bg-red-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                            5
                                        </div>
                                        <h5 className="text-xl font-bold text-red-900 mb-2">Reparto de Beneficios</h5>
                                        <img 
                                            src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=300&q=80" 
                                            alt="Benefits Distribution" 
                                            className="w-full h-32 object-cover rounded-lg"
                                        />
                                    </div>
                                </div>
                                <div className="lg:w-2/3">
                                    <p className="text-gray-700 mb-4">
                                        Todos ganan en el ecosistema:
                                    </p>
                                    <ul className="space-y-2 text-gray-700">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-red-600" />
                                            <span><strong>Carlos (usuario):</strong> ahorra dinero en su compra</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-red-600" />
                                            <span><strong>La marca:</strong> consigue un cliente nuevo y medible</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-red-600" />
                                            <span><strong>Laura (influencer):</strong> gana comisión por la referencia</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-red-600" />
                                            <span><strong>Link4Deal:</strong> mantiene registro transparente del proceso</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Conclusion */}
                        <div className="mt-12 text-center p-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white">
                            <div className="text-4xl mb-4">✨</div>
                            <h4 className="text-2xl font-bold mb-4">El Valor Real de Link4Deal</h4>
                            <p className="text-lg text-blue-100 leading-relaxed">
                                Así, cada token en Link4Deal es más que una criptomoneda: es un vale digital con valor económico real, 
                                disponible en nuestra app-wallet y respaldado por transacciones auténticas en tiendas físicas o virtuales.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h3 className="text-3xl font-bold mb-6">¿Listo para Revolucionar tu Marketing?</h3>
                    <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                        Únete a miles de marcas e influencers que ya están transformando 
                        sus estrategias digitales con Link4Deal.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link 
                            to="/signup" 
                            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                        >
                            Registrarse Ahora
                        </Link>
                        <Link 
                            to="/contact" 
                            className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                        >
                            Hablar con un Experto
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <h4 className="text-xl font-bold mb-4">Link4Deal</h4>
                            <p className="text-gray-400">
                                Conectando marcas con influencers a través de tecnología blockchain.
                            </p>
                        </div>
                        <div>
                            <h5 className="font-semibold mb-4">Producto</h5>
                            <ul className="space-y-2 text-gray-400">
                                <li><Link to="/" className="hover:text-white transition-colors">Inicio</Link></li>
                                <li><Link to="/about" className="hover:text-white transition-colors">Nosotros</Link></li>
                                <li><Link to="/contact" className="hover:text-white transition-colors">Contacto</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h5 className="font-semibold mb-4">Recursos</h5>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Documentación</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                            </ul>
                        </div>
                        <div>
                            <h5 className="font-semibold mb-4">Legal</h5>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">Términos</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Privacidad</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                        <p>&copy; 2024 Link4Deal. Todos los derechos reservados.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
