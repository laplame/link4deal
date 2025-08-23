import React from 'react';
import { Link } from 'react-router-dom';
import { 
    ArrowLeft, 
    Users, 
    ShoppingBag, 
    Plus, 
    BarChart3, 
    Settings, 
    FileText, 
    Globe, 
    Building2, 
    UserPlus,
    Target,
    Zap,
    Camera,
    Monitor,
    Shirt,
    Home,
    Trophy,
    Plane,
    Coffee,
    Heart,
    ShoppingCart,
    Eye,
    Shield,
    Clock,
    Tag,
    MapPin,
    FileText as FileTextIcon,
    ExternalLink,
    Database,
    CheckCircle,
    Ticket,
    CreditCard,
    Store
} from 'lucide-react';

interface AdminSection {
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    links: {
        name: string;
        path: string;
        description: string;
        icon: React.ReactNode;
    }[];
}

export default function AdminPage() {
    const adminSections: AdminSection[] = [
        {
            title: "Gestión de Usuarios",
            description: "Administra usuarios, marcas e influencers",
            icon: <Users className="w-6 h-6" />,
            color: "from-blue-500 to-blue-600",
            links: [
                {
                    name: "Selector de Usuario",
                    path: "/user-type-selector",
                    description: "Página para seleccionar tipo de usuario",
                    icon: <UserPlus className="w-5 h-5" />
                },
                {
                    name: "Iniciar Sesión",
                    path: "/signin",
                    description: "Acceso para usuarios existentes",
                    icon: <UserPlus className="w-5 h-5" />
                },
                {
                    name: "Registro de Usuario",
                    path: "/signup",
                    description: "Formulario de registro para nuevos usuarios",
                    icon: <UserPlus className="w-5 h-5" />
                }
            ]
        },
        {
            title: "Configuración de Perfiles",
            description: "Setup avanzado para usuarios especializados",
            icon: <UserPlus className="w-6 h-6" />,
            color: "from-indigo-500 to-indigo-600",
            links: [
                {
                    name: "Setup de Influencer",
                    path: "/influencer-setup",
                    description: "Configuración completa del perfil de influencer",
                    icon: <Camera className="w-5 h-5" />
                },
                {
                    name: "Setup de Marca",
                    path: "/brand-setup",
                    description: "Configuración completa del perfil de marca",
                    icon: <Building2 className="w-5 h-5" />
                },
                {
                    name: "Setup de Agencia",
                    path: "/agency-setup",
                    description: "Configuración completa del perfil de agencia",
                    icon: <Building2 className="w-5 h-5" />
                }
            ]
        },
        {
            title: "Verificación KYC",
            description: "Know Your Customer y verificación de identidad",
            icon: <Shield className="w-6 h-6" />,
            color: "from-green-500 to-green-600",
            links: [
                {
                    name: "Formulario KYC",
                    path: "/kyc-form",
                    description: "Verificación de identidad y wallet blockchain",
                    icon: <Shield className="w-5 h-5" />
                }
            ]
        },
        {
            title: "Gestión de Ofertas",
            description: "Administra promociones y ofertas",
            icon: <ShoppingBag className="w-6 h-6" />,
            color: "from-green-500 to-green-600",
            links: [
                {
                    name: "Crear Promoción (Wizard)",
                    path: "/create-promotion",
                    description: "Asistente paso a paso para crear promociones",
                    icon: <Plus className="w-5 h-5" />
                },

                {
                    name: "Sistema de Referencias",
                    path: "/referral-system",
                    description: "Gestión del sistema de referencias para influencers",
                    icon: <Target className="w-5 h-5" />
                }
            ]
        },
        {
            title: "Cupones y Descuentos",
            description: "Gestión de cupones y sistema de descuentos",
            icon: <Ticket className="w-6 h-6" />,
            color: "from-yellow-500 to-yellow-600",
            links: [
                {
                    name: "Crear Cupón",
                    path: "/create-coupon",
                    description: "Crear nuevos cupones y descuentos",
                    icon: <Plus className="w-5 h-5" />
                }
            ]
        },
        {
            title: "Geolocalización",
            description: "Sistema de ubicación y proximidad",
            icon: <MapPin className="w-6 h-6" />,
            color: "from-red-500 to-red-600",
            links: [

            ]
        },
        {
            title: "Categorías y Productos",
            description: "Explora productos por categorías",
            icon: <Tag className="w-6 h-6" />,
            color: "from-purple-500 to-purple-600",
            links: [
                {
                    name: "Todas las Categorías",
                    path: "/categories",
                    description: "Vista general de todas las categorías disponibles",
                    icon: <Globe className="w-5 h-5" />
                },
                {
                    name: "Electrónicos",
                    path: "/category/electronicos",
                    description: "Productos electrónicos y tecnología",
                    icon: <Monitor className="w-5 h-5" />
                },
                {
                    name: "Moda y Accesorios",
                    path: "/category/moda-y-accesorios",
                    description: "Ropa, calzado y accesorios de moda",
                    icon: <Shirt className="w-5 h-5" />
                },
                {
                    name: "Hogar y Jardín",
                    path: "/category/hogar-y-jardin",
                    description: "Productos para el hogar y jardín",
                    icon: <Home className="w-5 h-5" />
                },
                {
                    name: "Deportes y Aire Libre",
                    path: "/category/deportes-y-aire-libre",
                    description: "Equipamiento deportivo y actividades al aire libre",
                    icon: <Trophy className="w-5 h-5" />
                },
                {
                    name: "Fotografía y Video",
                    path: "/category/fotografia-y-video",
                    description: "Cámaras, lentes y equipos audiovisuales",
                    icon: <Camera className="w-5 h-5" />
                },
                {
                    name: "Comida y Bebidas",
                    path: "/category/comida-y-bebidas",
                    description: "Alimentos, bebidas y restaurantes",
                    icon: <Coffee className="w-5 h-5" />
                },
                {
                    name: "Servicios",
                    path: "/category/servicios",
                    description: "Servicios profesionales y personales",
                    icon: <Zap className="w-5 h-5" />
                },
                {
                    name: "Productos Digitales",
                    path: "/category/productos-digitales",
                    description: "Software, cursos online y contenido digital",
                    icon: <Monitor className="w-5 h-5" />
                },
                {
                    name: "Viajes y Turismo",
                    path: "/category/viajes-y-turismo",
                    description: "Paquetes turísticos y servicios de viaje",
                    icon: <Plane className="w-5 h-5" />
                },
                {
                    name: "Belleza y Cuidado",
                    path: "/category/belleza-y-cuidado",
                    description: "Productos de belleza y cuidado personal",
                    icon: <Heart className="w-5 h-5" />
                }
            ]
        },
        {
            title: "Información y Contenido",
            description: "Páginas informativas y de contenido",
            icon: <FileText className="w-6 h-6" />,
            color: "from-orange-500 to-orange-600",
            links: [
                {
                    name: "Acerca de Nosotros",
                    path: "/about",
                    description: "Información sobre la empresa y cómo funciona",
                    icon: <Building2 className="w-5 h-5" />
                },
                {
                    name: "Página Principal",
                    path: "/",
                    description: "Landing page principal con ofertas destacadas",
                    icon: <Home className="w-5 h-5" />
                }
            ]
        },
        {
            title: "Carrito y Sistema de Pagos",
            description: "Gestión del carrito y procesamiento de transacciones",
            icon: <ShoppingCart className="w-6 h-6" />,
            color: "from-emerald-500 to-emerald-600",
            links: [
                {
                    name: "Vista del Carrito",
                    path: "/cart",
                    description: "Página del carrito de compras",
                    icon: <ShoppingCart className="w-5 h-5" />
                },

            ]
        },
        {
            title: "Gestión Avanzada de Usuarios",
            description: "Administración especializada por tipo de usuario",
            icon: <Users className="w-6 h-6" />,
            color: "from-teal-500 to-teal-600",
            links: [
                {
                    name: "Panel de Influencers",
                    path: "/admin/influencers",
                    description: "Gestión completa de influencers y sus perfiles",
                    icon: <Camera className="w-5 h-5" />
                },
                {
                    name: "Panel de Marcas",
                    path: "/admin/brands",
                    description: "Administración de marcas y empresas",
                    icon: <Building2 className="w-5 h-5" />
                },
                {
                    name: "Panel de Agencias",
                    path: "/admin/agencies",
                    description: "Control de agencias y sus servicios",
                    icon: <Globe className="w-5 h-5" />
                },

            ]
        },
        {
            title: "Analíticas y Reportes",
            description: "Dashboard y métricas del sistema",
            icon: <BarChart3 className="w-6 h-6" />,
            color: "from-red-500 to-red-600",
            links: [

            ]
        },
        {
            title: "Herramientas de Desarrollo",
            description: "Acceso a funcionalidades de testing y desarrollo",
            icon: <Settings className="w-6 h-6" />,
            color: "from-gray-500 to-gray-600",
            links: [

            ]
        },
        {
            title: "Sistema de Negocios e Inauguraciones",
            description: "Paquetes de inauguración y checkout para negocios",
            icon: <Store className="w-6 h-6" />,
            color: "from-violet-500 to-violet-600",
            links: [
                {
                    name: "Landing para Negocios",
                    path: "/landing",
                    description: "Página de venta del paquete de inauguración",
                    icon: <Building2 className="w-5 h-5" />
                },
                {
                    name: "Checkout",
                    path: "/checkout",
                    description: "Formulario de pago con Stripe",
                    icon: <CreditCard className="w-5 h-5" />
                },
                {
                    name: "Confirmación de Pago",
                    path: "/checkout/success",
                    description: "Página de éxito después del pago",
                    icon: <CheckCircle className="w-5 h-5" />
                }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Link 
                                to="/" 
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Panel de Administración
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    Acceso centralizado a todas las páginas del sistema
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                Admin
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {adminSections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="bg-white rounded-lg shadow-md overflow-hidden">
                            {/* Section Header */}
                            <div className={`bg-gradient-to-r ${section.color} p-6 text-white`}>
                                <div className="flex items-center space-x-3">
                                    <div className="bg-white/20 p-2 rounded-lg">
                                        {section.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold">{section.title}</h3>
                                        <p className="text-blue-100 text-sm mt-1">{section.description}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Section Links */}
                            <div className="p-6">
                                <div className="space-y-3">
                                    {section.links.map((link, linkIndex) => (
                                        <Link
                                            key={linkIndex}
                                            to={link.path}
                                            className="block p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
                                        >
                                            <div className="flex items-start space-x-3">
                                                <div className="text-blue-600 group-hover:text-blue-700 transition-colors">
                                                    {link.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-gray-900 group-hover:text-blue-900 transition-colors">
                                                        {link.name}
                                                    </h4>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {link.description}
                                                    </p>
                                                </div>
                                                <div className="text-gray-400 group-hover:text-blue-500 transition-colors">
                                                    <ExternalLink className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Stats */}
                <div className="mt-12 bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas Rápidas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">25</div>
                            <div className="text-sm text-gray-600">Páginas Disponibles</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">11</div>
                            <div className="text-sm text-gray-600">Categorías</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">8</div>
                            <div className="text-sm text-gray-600">Secciones Principales</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-teal-600">3</div>
                            <div className="text-sm text-gray-600">Tipos de Usuario</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">100%</div>
                            <div className="text-sm text-gray-600">Funcional</div>
                        </div>
                    </div>
                </div>

                {/* User Types Overview */}
                <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Tipos de Usuario Disponibles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Influencer */}
                        <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <Camera className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900">Influencer</h4>
                                    <p className="text-sm text-gray-600">Creador de contenido</p>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm text-gray-600">
                                <p>• Configuración de perfil social</p>
                                <p>• Gestión de categorías de contenido</p>
                                <p>• Portfolio y métricas de audiencia</p>
                                <p>• Sistema de referencias</p>
                            </div>
                            <div className="mt-4">
                                <Link 
                                    to="/influencer-setup"
                                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Configurar Perfil
                                    <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
                                </Link>
                            </div>
                        </div>

                        {/* Brand */}
                        <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                    <Building2 className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900">Marca</h4>
                                    <p className="text-sm text-gray-600">Empresa o negocio</p>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm text-gray-600">
                                <p>• Información corporativa</p>
                                <p>• Categorías de productos/servicios</p>
                                <p>• Audiencia objetivo</p>
                                <p>• Presupuesto de marketing</p>
                            </div>
                            <div className="mt-4">
                                <Link 
                                    to="/brand-setup"
                                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Configurar Perfil
                                    <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
                                </Link>
                            </div>
                        </div>

                        {/* Agency */}
                        <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                                    <Globe className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900">Agencia</h4>
                                    <p className="text-sm text-gray-600">Servicios profesionales</p>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm text-gray-600">
                                <p>• Servicios ofrecidos</p>
                                <p>• Equipo y experiencia</p>
                                <p>• Portfolio de clientes</p>
                                <p>• Gestión de marcas e influencers</p>
                            </div>
                            <div className="mt-4">
                                <Link 
                                    to="/agency-setup"
                                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Configurar Perfil
                                    <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
