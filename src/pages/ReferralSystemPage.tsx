import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
    ArrowLeft, 
    Users, 
    TrendingUp, 
    DollarSign, 
    Target, 
    BarChart3, 
    Share2, 
    Copy, 
    CheckCircle, 
    Star,
    Award,
    Zap,
    Globe,
    Smartphone,
    Monitor,
    Camera,
    Heart,
    ShoppingBag,
    Plane,
    Coffee
} from 'lucide-react';

interface ReferralProgram {
    id: string;
    name: string;
    brand: string;
    category: string;
    commission: number;
    commissionType: 'percentage' | 'fixed';
    minReferrals: number;
    maxReferrals: number;
    currentReferrals: number;
    totalEarnings: number;
    status: 'active' | 'paused' | 'completed';
    startDate: string;
    endDate: string;
    description: string;
    requirements: string[];
    benefits: string[];
    smartContract: {
        address: string;
        network: string;
        tokenStandard: string;
    };
}

interface ReferralStats {
    totalReferrals: number;
    totalEarnings: number;
    activePrograms: number;
    conversionRate: number;
    topPerformingCategory: string;
    monthlyGrowth: number;
}

const mockReferralPrograms: ReferralProgram[] = [
    {
        id: "1",
        name: "Programa iPhone 15 Pro",
        brand: "Apple",
        category: "Electrónica",
        commission: 15,
        commissionType: 'percentage',
        minReferrals: 5,
        maxReferrals: 100,
        currentReferrals: 23,
        totalEarnings: 3450,
        status: 'active',
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        description: "Programa de referencias para el nuevo iPhone 15 Pro con comisiones atractivas.",
        requirements: ["Mínimo 5 referencias", "Audiencia tech-savvy", "Contenido original"],
        benefits: ["Comisión del 15%", "Productos para review", "Acceso exclusivo a eventos"],
        smartContract: {
            address: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
            network: "Ethereum",
            tokenStandard: "ERC-777"
        }
    },
    {
        id: "2",
        name: "Colección Verano Nike",
        brand: "Nike",
        category: "Moda",
        commission: 20,
        commissionType: 'percentage',
        minReferrals: 10,
        maxReferrals: 200,
        currentReferrals: 45,
        totalEarnings: 1800,
        status: 'active',
        startDate: "2024-03-01",
        endDate: "2024-08-31",
        description: "Promociona la nueva colección de verano de Nike y gana comisiones por cada venta.",
        requirements: ["Mínimo 10 referencias", "Audiencia deportiva", "Contenido fitness"],
        benefits: ["Comisión del 20%", "Ropa deportiva gratis", "Colaboración con atletas"],
        smartContract: {
            address: "0x8ba1f109551bD432803012645Hac136c22C177e9",
            network: "Ethereum",
            tokenStandard: "ERC-777"
        }
    },
    {
        id: "3",
        name: "Curso Marketing Digital",
        brand: "Digital Academy",
        category: "Educación",
        commission: 50,
        commissionType: 'fixed',
        minReferrals: 3,
        maxReferrals: 50,
        currentReferrals: 12,
        totalEarnings: 600,
        status: 'active',
        startDate: "2024-02-01",
        endDate: "2024-11-30",
        description: "Programa de referencias para cursos online de marketing digital.",
        requirements: ["Mínimo 3 referencias", "Audiencia emprendedora", "Contenido educativo"],
        benefits: ["$50 por referencia", "Acceso al curso", "Certificación"],
        smartContract: {
            address: "0x1234567890abcdef1234567890abcdef12345678",
            network: "Ethereum",
            tokenStandard: "ERC-777"
        }
    },
    {
        id: "4",
        name: "Restaurante Gourmet",
        brand: "Gourmet Express",
        category: "Comida",
        commission: 25,
        commissionType: 'percentage',
        minReferrals: 8,
        maxReferrals: 80,
        currentReferrals: 18,
        totalEarnings: 450,
        status: 'active',
        startDate: "2024-01-15",
        endDate: "2024-10-31",
        description: "Promociona experiencias gastronómicas premium y gana por cada reserva.",
        requirements: ["Mínimo 8 referencias", "Audiencia foodie", "Contenido gastronómico"],
        benefits: ["Comisión del 25%", "Cenas gratis", "Eventos exclusivos"],
        smartContract: {
            address: "0xabcdef1234567890abcdef1234567890abcdef12",
            network: "Ethereum",
            tokenStandard: "ERC-777"
        }
    }
];

const mockStats: ReferralStats = {
    totalReferrals: 98,
    totalEarnings: 6300,
    activePrograms: 4,
    conversionRate: 23.5,
    topPerformingCategory: "Electrónica",
    monthlyGrowth: 18.2
};

const categoryIcons: Record<string, React.ReactNode> = {
    "Electrónica": <Smartphone className="h-5 w-5" />,
    "Moda": <ShoppingBag className="h-5 w-5" />,
    "Educación": <Monitor className="h-5 w-5" />,
    "Comida": <Coffee className="h-5 w-5" />,
    "Hogar": <Heart className="h-5 w-5" />,
    "Deportes": <Zap className="h-5 w-5" />,
    "Fotografía": <Camera className="h-5 w-5" />,
    "Servicios": <Globe className="h-5 w-5" />,
    "Digital": <Monitor className="h-5 w-5" />,
    "Viajes": <Plane className="h-5 w-5" />,
    "Belleza": <Heart className="h-5 w-5" />
};

export default function ReferralSystemPage() {
    const [activeTab, setActiveTab] = useState<'overview' | 'programs' | 'analytics' | 'earnings'>('overview');
    const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedAddress(text);
        setTimeout(() => setCopiedAddress(null), 2000);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'paused': return 'bg-yellow-100 text-yellow-800';
            case 'completed': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active': return 'Activo';
            case 'paused': return 'Pausado';
            case 'completed': return 'Completado';
            default: return 'Desconocido';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="flex items-center gap-4 mb-4">
                        <Link to="/" className="text-purple-200 hover:text-white transition-colors">
                            <ArrowLeft className="h-6 w-6" />
                        </Link>
                        <Users className="h-8 w-8" />
                        <h1 className="text-3xl font-bold">Sistema de Referencias</h1>
                    </div>
                    <p className="text-xl text-purple-100 max-w-2xl">
                        Gana comisiones promocionando productos y servicios de marcas confiables a través de nuestro sistema blockchain
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Navigation Tabs */}
                <div className="bg-white rounded-lg shadow-md mb-8">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6">
                            {[
                                { id: 'overview', label: 'Resumen', icon: <BarChart3 className="h-5 w-5" /> },
                                { id: 'programs', label: 'Programas', icon: <Target className="h-5 w-5" /> },
                                { id: 'analytics', label: 'Analíticas', icon: <TrendingUp className="h-5 w-5" /> },
                                { id: 'earnings', label: 'Ganancias', icon: <DollarSign className="h-5 w-5" /> }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-purple-500 text-purple-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Content based on active tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Referencias</p>
                                        <p className="text-3xl font-bold text-gray-900">{mockStats.totalReferrals}</p>
                                    </div>
                                    <div className="p-3 bg-blue-100 rounded-full">
                                        <Users className="h-6 w-6 text-blue-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Ganancias Totales</p>
                                        <p className="text-3xl font-bold text-gray-900">${mockStats.totalEarnings}</p>
                                    </div>
                                    <div className="p-3 bg-green-100 rounded-full">
                                        <DollarSign className="h-6 w-6 text-green-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Programas Activos</p>
                                        <p className="text-3xl font-bold text-gray-900">{mockStats.activePrograms}</p>
                                    </div>
                                    <div className="p-3 bg-purple-100 rounded-full">
                                        <Target className="h-6 w-6 text-purple-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Tasa de Conversión</p>
                                        <p className="text-3xl font-bold text-gray-900">{mockStats.conversionRate}%</p>
                                    </div>
                                    <div className="p-3 bg-orange-100 rounded-full">
                                        <TrendingUp className="h-6 w-6 text-orange-600" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Top Programs */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Programas Destacados</h3>
                            <div className="space-y-4">
                                {mockReferralPrograms.slice(0, 3).map((program) => (
                                    <div key={program.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-purple-100 rounded-lg">
                                                {categoryIcons[program.category] || <Star className="h-5 w-5 text-purple-600" />}
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900">{program.name}</h4>
                                                <p className="text-sm text-gray-600">{program.brand} • {program.category}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-gray-900">
                                                {program.commissionType === 'percentage' ? `${program.commission}%` : `$${program.commission}`}
                                            </p>
                                            <p className="text-sm text-gray-600">{program.currentReferrals} referencias</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* How It Works */}
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-8">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">¿Cómo Funciona el Sistema de Referencias?</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-2xl font-bold text-purple-600">1</span>
                                    </div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Únete a Programas</h4>
                                    <p className="text-gray-600">Selecciona programas de referencias que se alineen con tu audiencia y contenido.</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-2xl font-bold text-blue-600">2</span>
                                    </div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Promociona Productos</h4>
                                    <p className="text-gray-600">Crea contenido auténtico promocionando los productos o servicios seleccionados.</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-2xl font-bold text-green-600">3</span>
                                    </div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Gana Comisiones</h4>
                                    <p className="text-gray-600">Recibe comisiones automáticas por cada venta generada a través de tus referencias.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'programs' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">Programas de Referencias Disponibles</h3>
                            <Link
                                to="/add-offer"
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                Crear Nuevo Programa
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {mockReferralPrograms.map((program) => (
                                <div key={program.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-purple-100 rounded-lg">
                                                    {categoryIcons[program.category] || <Star className="h-5 w-5 text-purple-600" />}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">{program.name}</h4>
                                                    <p className="text-sm text-gray-600">{program.brand}</p>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(program.status)}`}>
                                                {getStatusText(program.status)}
                                            </span>
                                        </div>

                                        <p className="text-gray-600 mb-4">{program.description}</p>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <p className="text-sm text-gray-500">Comisión</p>
                                                <p className="font-semibold text-gray-900">
                                                    {program.commissionType === 'percentage' ? `${program.commission}%` : `$${program.commission}`}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Referencias</p>
                                                <p className="font-semibold text-gray-900">
                                                    {program.currentReferrals}/{program.maxReferrals}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Ganancias</p>
                                                <p className="font-semibold text-green-600">${program.totalEarnings}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Categoría</p>
                                                <p className="font-semibold text-gray-900">{program.category}</p>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <p className="text-sm font-medium text-gray-700 mb-2">Requisitos:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {program.requirements.map((req, index) => (
                                                    <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                                                        {req}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <p className="text-sm font-medium text-gray-700 mb-2">Beneficios:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {program.benefits.map((benefit, index) => (
                                                    <span key={index} className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                                                        {benefit}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="border-t pt-4">
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-gray-500">
                                                    <p>Smart Contract: {program.smartContract.address.slice(0, 6)}...{program.smartContract.address.slice(-4)}</p>
                                                    <p>Red: {program.smartContract.network}</p>
                                                </div>
                                                <button
                                                    onClick={() => copyToClipboard(program.smartContract.address)}
                                                    className="text-purple-600 hover:text-purple-700 transition-colors"
                                                >
                                                    {copiedAddress === program.smartContract.address ? (
                                                        <CheckCircle className="h-5 w-5" />
                                                    ) : (
                                                        <Copy className="h-5 w-5" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex gap-2">
                                            <button className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
                                                Unirse al Programa
                                            </button>
                                            <button className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                                                Ver Detalles
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900">Analíticas de Referencias</h3>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Performance by Category */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h4 className="font-semibold text-gray-900 mb-4">Rendimiento por Categoría</h4>
                                <div className="space-y-3">
                                    {[
                                        { category: "Electrónica", referrals: 23, earnings: 3450, color: "bg-blue-500" },
                                        { category: "Moda", referrals: 45, earnings: 1800, color: "bg-pink-500" },
                                        { category: "Educación", referrals: 12, earnings: 600, color: "bg-green-500" },
                                        { category: "Comida", referrals: 18, earnings: 450, color: "bg-orange-500" }
                                    ].map((item, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                                                <span className="text-sm text-gray-700">{item.category}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-gray-900">{item.referrals} ref.</p>
                                                <p className="text-xs text-gray-500">${item.earnings}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Monthly Growth */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h4 className="font-semibold text-gray-900 mb-4">Crecimiento Mensual</h4>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-green-600 mb-2">+{mockStats.monthlyGrowth}%</div>
                                    <p className="text-sm text-gray-600">vs. mes anterior</p>
                                </div>
                                <div className="mt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Referencias</span>
                                        <span className="text-green-600">+12</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Ganancias</span>
                                        <span className="text-green-600">+$890</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Conversiones</span>
                                        <span className="text-green-600">+2.3%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Conversion Funnel */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h4 className="font-semibold text-gray-900 mb-4">Embudo de Conversión</h4>
                            <div className="grid grid-cols-4 gap-4">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <span className="text-xl font-bold text-blue-600">100</span>
                                    </div>
                                    <p className="text-sm text-gray-600">Impresiones</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <span className="text-xl font-bold text-purple-600">45</span>
                                    </div>
                                    <p className="text-sm text-gray-600">Clicks</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <span className="text-xl font-bold text-green-600">23</span>
                                    </div>
                                    <p className="text-sm text-gray-600">Conversiones</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <span className="text-xl font-bold text-orange-600">$345</span>
                                    </div>
                                    <p className="text-sm text-gray-600">Ganancias</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'earnings' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900">Ganancias y Pagos</h3>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h4 className="font-semibold text-gray-900 mb-4">Resumen de Ganancias</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Este mes:</span>
                                        <span className="font-medium">$890</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Mes anterior:</span>
                                        <span className="font-medium">$750</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Total acumulado:</span>
                                        <span className="font-medium text-green-600">$6,300</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h4 className="font-semibold text-gray-900 mb-4">Próximo Pago</h4>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600 mb-2">$890</div>
                                    <p className="text-sm text-gray-600">Disponible para retiro</p>
                                    <button className="mt-3 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                                        Retirar Fondos
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h4 className="font-semibold text-gray-900 mb-4">Historial de Pagos</h4>
                                <div className="space-y-2">
                                    {[
                                        { date: "2024-03-01", amount: 750, status: "Completado" },
                                        { date: "2024-02-01", amount: 680, status: "Completado" },
                                        { date: "2024-01-01", amount: 590, status: "Completado" }
                                    ].map((payment, index) => (
                                        <div key={index} className="flex justify-between text-sm">
                                            <span className="text-gray-600">{payment.date}</span>
                                            <span className="font-medium">${payment.amount}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Smart Contract Earnings */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h4 className="font-semibold text-gray-900 mb-4">Ganancias en Smart Contracts</h4>
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-2 text-sm font-medium text-gray-700">Contrato</th>
                                            <th className="text-left py-2 text-sm font-medium text-gray-700">Red</th>
                                            <th className="text-left py-2 text-sm font-medium text-gray-700">Tokens Ganados</th>
                                            <th className="text-left py-2 text-sm font-medium text-gray-700">Valor USD</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mockReferralPrograms.map((program) => (
                                            <tr key={program.id} className="border-b border-gray-100">
                                                <td className="py-2 text-sm text-gray-900">
                                                    {program.smartContract.address.slice(0, 8)}...{program.smartContract.address.slice(-6)}
                                                </td>
                                                <td className="py-2 text-sm text-gray-600">{program.smartContract.network}</td>
                                                <td className="py-2 text-sm text-gray-900">{program.currentReferrals}</td>
                                                <td className="py-2 text-sm text-green-600">${program.totalEarnings}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
