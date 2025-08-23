import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    ArrowLeft, 
    Camera, 
    Users, 
    TrendingUp, 
    DollarSign, 
    Target, 
    BarChart3, 
    Calendar,
    Eye,
    Heart,
    Share2,
    MessageCircle,
    Zap,
    Star,
    Award,
    Clock,
    CheckCircle,
    AlertCircle,
    ExternalLink,
    Download,
    Filter,
    Search,
    Plus,
    Settings,
    Bell,
    Mail,
    Phone,
    Globe,
    MapPin,
    Tag,
    ShoppingBag,
    CreditCard,
    Wallet,
    Gift,
    Trophy,
    Fire,
    Sparkles,
    Edit
} from 'lucide-react';

interface Influencer {
    id: string;
    name: string;
    username: string;
    avatar: string;
    followers: number;
    engagement: number;
    categories: string[];
    status: 'active' | 'pending' | 'verified' | 'suspended';
    joinDate: string;
    totalEarnings: number;
    monthlyEarnings: number;
    completedCampaigns: number;
    activeCampaigns: number;
    rating: number;
    location: string;
    socialMedia: {
        instagram?: string;
        tiktok?: string;
        youtube?: string;
        twitter?: string;
    };
}

interface Campaign {
    id: string;
    title: string;
    brand: string;
    status: 'active' | 'completed' | 'pending' | 'cancelled';
    startDate: string;
    endDate: string;
    budget: number;
    earnings: number;
    progress: number;
    type: 'post' | 'story' | 'video' | 'live';
    category: string;
    requirements: string[];
}

interface Earning {
    id: string;
    campaign: string;
    brand: string;
    amount: number;
    date: string;
    status: 'paid' | 'pending' | 'processing';
    type: 'commission' | 'bonus' | 'referral';
}

export default function InfluencerDashboard() {
    const [influencers, setInfluencers] = useState<Influencer[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [earnings, setEarnings] = useState<Earning[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    // Mock data - en una aplicación real esto vendría de una API
    useEffect(() => {
        const mockInfluencers: Influencer[] = [
            {
                id: '1',
                name: 'María García',
                username: '@mariagarcia',
                avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
                followers: 125000,
                engagement: 4.8,
                categories: ['Moda', 'Belleza', 'Lifestyle'],
                status: 'verified',
                joinDate: '2023-03-15',
                totalEarnings: 45000,
                monthlyEarnings: 3800,
                completedCampaigns: 24,
                activeCampaigns: 3,
                rating: 4.9,
                location: 'Madrid, España',
                socialMedia: {
                    instagram: '@mariagarcia',
                    tiktok: '@mariagarcia',
                    youtube: 'María García'
                }
            },
            {
                id: '2',
                name: 'Carlos Rodríguez',
                username: '@carlosrodriguez',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
                followers: 89000,
                engagement: 3.2,
                categories: ['Tecnología', 'Gaming', 'Reviews'],
                status: 'active',
                joinDate: '2023-06-20',
                totalEarnings: 28000,
                monthlyEarnings: 2200,
                completedCampaigns: 18,
                activeCampaigns: 2,
                rating: 4.7,
                location: 'Barcelona, España',
                socialMedia: {
                    instagram: '@carlosrodriguez',
                    youtube: 'Carlos Tech'
                }
            },
            {
                id: '3',
                name: 'Ana Martínez',
                username: '@anamartinez',
                avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
                followers: 210000,
                engagement: 5.1,
                categories: ['Fitness', 'Salud', 'Motivación'],
                status: 'verified',
                joinDate: '2022-11-10',
                totalEarnings: 78000,
                monthlyEarnings: 6500,
                completedCampaigns: 35,
                activeCampaigns: 4,
                rating: 4.8,
                location: 'Valencia, España',
                socialMedia: {
                    instagram: '@anamartinez',
                    tiktok: '@anamartinez',
                    youtube: 'Ana Fitness'
                }
            }
        ];

        const mockCampaigns: Campaign[] = [
            {
                id: '1',
                title: 'Lanzamiento Nueva Colección Primavera',
                brand: 'Zara',
                status: 'active',
                startDate: '2024-01-15',
                endDate: '2024-02-15',
                budget: 5000,
                earnings: 2500,
                progress: 75,
                type: 'post',
                category: 'Moda',
                requirements: ['3 posts en Instagram', '2 stories', '1 reel']
            },
            {
                id: '2',
                title: 'Review Producto Tecnológico',
                brand: 'Samsung',
                status: 'active',
                startDate: '2024-01-20',
                endDate: '2024-02-20',
                budget: 3000,
                earnings: 1500,
                progress: 50,
                type: 'video',
                category: 'Tecnología',
                requirements: ['1 video review', '2 posts', '1 story']
            },
            {
                id: '3',
                title: 'Promoción Suplementos Deportivos',
                brand: 'MyProtein',
                status: 'pending',
                startDate: '2024-02-01',
                endDate: '2024-03-01',
                budget: 4000,
                earnings: 0,
                progress: 0,
                type: 'post',
                category: 'Fitness',
                requirements: ['4 posts', '3 stories', '1 video testimonial']
            }
        ];

        const mockEarnings: Earning[] = [
            {
                id: '1',
                campaign: 'Lanzamiento Nueva Colección Primavera',
                brand: 'Zara',
                amount: 2500,
                date: '2024-01-15',
                status: 'paid',
                type: 'commission'
            },
            {
                id: '2',
                campaign: 'Review Producto Tecnológico',
                brand: 'Samsung',
                amount: 1500,
                date: '2024-01-20',
                status: 'processing',
                type: 'commission'
            },
            {
                id: '3',
                campaign: 'Referral Influencer',
                brand: 'Sistema',
                amount: 500,
                date: '2024-01-10',
                status: 'paid',
                type: 'referral'
            }
        ];

        setInfluencers(mockInfluencers);
        setCampaigns(mockCampaigns);
        setEarnings(mockEarnings);
    }, []);

    const totalInfluencers = influencers.length;
    const activeInfluencers = influencers.filter(i => i.status === 'active' || i.status === 'verified').length;
    const totalEarnings = influencers.reduce((sum, i) => sum + i.totalEarnings, 0);
    const totalMonthlyEarnings = influencers.reduce((sum, i) => sum + i.monthlyEarnings, 0);
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

    const filteredInfluencers = influencers.filter(influencer => {
        const matchesSearch = influencer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            influencer.username.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || influencer.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'verified': return 'bg-green-100 text-green-800';
            case 'active': return 'bg-blue-100 text-blue-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'suspended': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'verified': return <CheckCircle className="w-4 h-4" />;
            case 'active': return <Zap className="w-4 h-4" />;
            case 'pending': return <Clock className="w-4 h-4" />;
            case 'suspended': return <AlertCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Link 
                                to="/admin" 
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Panel de Influencers
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    Gestión completa de influencers, métricas y campañas
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Nuevo Influencer
                            </button>
                            <button className="bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition-colors">
                                <Settings className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Influencers</p>
                                <p className="text-2xl font-bold text-gray-900">{totalInfluencers}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-green-600">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            +12% este mes
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Activos</p>
                                <p className="text-2xl font-bold text-gray-900">{activeInfluencers}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <Zap className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-green-600">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            +8% este mes
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Ganancias Totales</p>
                                <p className="text-2xl font-bold text-gray-900">${totalEarnings.toLocaleString()}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-green-600">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            +15% este mes
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Ganancias Mensuales</p>
                                <p className="text-2xl font-bold text-gray-900">${totalMonthlyEarnings.toLocaleString()}</p>
                            </div>
                            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-green-600">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            +22% este mes
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Campañas Activas</p>
                                <p className="text-2xl font-bold text-gray-900">{activeCampaigns}</p>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <Target className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-green-600">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            +5% este mes
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex-1 max-w-md">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Buscar influencers..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        
                        <div className="flex gap-3">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">Todos los estados</option>
                                <option value="verified">Verificados</option>
                                <option value="active">Activos</option>
                                <option value="pending">Pendientes</option>
                                <option value="suspended">Suspendidos</option>
                            </select>
                            
                            <select
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="7d">Últimos 7 días</option>
                                <option value="30d">Últimos 30 días</option>
                                <option value="90d">Últimos 90 días</option>
                                <option value="1y">Último año</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Influencers List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">Lista de Influencers</h2>
                        <p className="text-gray-600 mt-1">Gestiona todos los influencers registrados en la plataforma</p>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Influencer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Seguidores
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Engagement
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ganancias
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Campañas
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredInfluencers.map((influencer) => (
                                    <tr key={influencer.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <img
                                                    className="w-10 h-10 rounded-full"
                                                    src={influencer.avatar}
                                                    alt={influencer.name}
                                                />
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {influencer.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {influencer.username}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {influencer.location}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {influencer.followers.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                seguidores
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="text-sm text-gray-900">
                                                    {influencer.engagement}%
                                                </div>
                                                <div className="ml-2 flex items-center text-yellow-400">
                                                    <Star className="w-4 h-4 fill-current" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                ${influencer.totalEarnings.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                total
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {influencer.activeCampaigns} activas
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {influencer.completedCampaigns} completadas
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(influencer.status)}`}>
                                                {getStatusIcon(influencer.status)}
                                                <span className="ml-1 capitalize">{influencer.status}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button className="text-blue-600 hover:text-blue-900">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button className="text-green-600 hover:text-green-900">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button className="text-purple-600 hover:text-purple-900">
                                                    <MessageCircle className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Campaigns Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Active Campaigns */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Campañas Activas</h3>
                            <p className="text-gray-600 text-sm">Campañas en curso y próximas</p>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {campaigns.filter(c => c.status === 'active').map((campaign) => (
                                    <div key={campaign.id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium text-gray-900">{campaign.title}</h4>
                                            <span className="text-sm text-blue-600 font-medium">
                                                ${campaign.earnings.toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">{campaign.brand}</p>
                                        <div className="flex items-center justify-between text-sm text-gray-500">
                                            <span>{campaign.type} • {campaign.category}</span>
                                            <span>{campaign.progress}% completado</span>
                                        </div>
                                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${campaign.progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Recent Earnings */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Ganancias Recientes</h3>
                            <p className="text-gray-600 text-sm">Últimas transacciones y comisiones</p>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {earnings.slice(0, 5).map((earning) => (
                                    <div key={earning.id} className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900">{earning.campaign}</p>
                                            <p className="text-sm text-gray-600">{earning.brand}</p>
                                            <p className="text-xs text-gray-500">{earning.date}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-green-600">
                                                ${earning.amount.toLocaleString()}
                                            </p>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                earning.status === 'paid' ? 'bg-green-100 text-green-800' :
                                                earning.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {earning.status === 'paid' ? 'Pagado' : 
                                                 earning.status === 'processing' ? 'Procesando' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h3>
                        <p className="text-gray-600 text-sm">Acceso directo a funciones principales</p>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200">
                                <Plus className="w-8 h-8 text-blue-600 mb-2" />
                                <span className="text-sm font-medium text-gray-900">Nuevo Influencer</span>
                            </button>
                            
                            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all duration-200">
                                <Target className="w-8 h-8 text-green-600 mb-2" />
                                <span className="text-sm font-medium text-gray-900">Nueva Campaña</span>
                            </button>
                            
                            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all duration-200">
                                <BarChart3 className="w-8 h-8 text-purple-600 mb-2" />
                                <span className="text-sm font-medium text-gray-900">Ver Reportes</span>
                            </button>
                            
                            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all duration-200">
                                <Download className="w-8 h-8 text-orange-600 mb-2" />
                                <span className="text-sm font-medium text-gray-900">Exportar Datos</span>
                            </button>

                            <Link 
                                to="/admin/ocr-profile" 
                                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all duration-200"
                            >
                                <Camera className="w-8 h-8 text-red-600 mb-2" />
                                <span className="text-sm font-medium text-gray-900">OCR Perfiles</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
