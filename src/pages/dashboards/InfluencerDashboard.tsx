import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
    Mail,
    Inbox,
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

interface InboxMessage {
    id: string;
    senderName: string;
    senderEmail: string | null;
    message: string;
    read: boolean;
    createdAt: string;
}

export default function InfluencerDashboard() {
    const { hasRole } = useAuth();
    const isInfluencerRole = hasRole('influencer');
    const [influencers, setInfluencers] = useState<Influencer[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [earnings, setEarnings] = useState<Earning[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [inboxMessages, setInboxMessages] = useState<InboxMessage[]>([]);
    const [inboxLoading, setInboxLoading] = useState(false);

    useEffect(() => {
        if (!isInfluencerRole) return;
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        setInboxLoading(true);
        fetch('/api/influencers/messages/inbox', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.data?.messages) {
                    setInboxMessages(data.data.messages);
                }
            })
            .catch(() => {})
            .finally(() => setInboxLoading(false));
    }, [isInfluencerRole]);

    // Datos desde la API (BD); con populate en backend
    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

        if (isInfluencerRole && token) {
            fetch('/api/influencers/me', { headers })
                .then((res) => res.json())
                .then((data) => {
                    if (data.success && data.data) {
                        const inf = data.data;
                        const asDashboardInfluencer: Influencer = {
                            id: inf.id,
                            name: inf.name || '',
                            username: inf.username || '',
                            avatar: inf.avatar || '',
                            followers: inf.totalFollowers ?? 0,
                            engagement: inf.engagement ?? 0,
                            categories: Array.isArray(inf.categories) ? inf.categories : [],
                            status: inf.status || 'pending',
                            joinDate: inf.joinDate || '',
                            totalEarnings: inf.totalEarnings ?? 0,
                            monthlyEarnings: inf.monthlyEarnings ?? 0,
                            completedCampaigns: inf.completedPromotions ?? 0,
                            activeCampaigns: inf.activePromotions ?? 0,
                            rating: inf.rating ?? 0,
                            location: inf.location || '',
                            socialMedia: inf.socialMedia || {},
                        };
                        setInfluencers([asDashboardInfluencer]);
                        const promos = Array.isArray(inf.recentPromotions) ? inf.recentPromotions : [];
                        setCampaigns(promos.map((p: any) => ({
                            id: p.id || '',
                            title: p.title || '',
                            brand: p.brand || '',
                            status: (p.status || 'pending') as Campaign['status'],
                            startDate: p.date || '',
                            endDate: p.date || '',
                            budget: p.earnings ?? 0,
                            earnings: p.earnings ?? 0,
                            progress: p.status === 'completed' ? 100 : p.status === 'active' ? 50 : 0,
                            type: 'post',
                            category: '',
                            requirements: [],
                        })));
                        const pays = Array.isArray(inf.recentPayments) ? inf.recentPayments : [];
                        setEarnings(pays.map((p: any) => ({
                            id: p.id || '',
                            campaign: p.description || '',
                            brand: '',
                            amount: p.amount ?? 0,
                            date: p.date || '',
                            status: (p.status || 'pending') as Earning['status'],
                            type: (p.type || 'commission') as Earning['type'],
                        })));
                    } else {
                        setInfluencers([]);
                        setCampaigns([]);
                        setEarnings([]);
                    }
                })
                .catch(() => {
                    setInfluencers([]);
                    setCampaigns([]);
                    setEarnings([]);
                });
        } else {
            fetch('/api/influencers?limit=50&page=1')
                .then((res) => res.json())
                .then((data) => {
                    if (data.success && data.data?.docs) {
                        const list = (data.data.docs as any[]).map((inf) => ({
                            id: inf.id,
                            name: inf.name || '',
                            username: inf.username || '',
                            avatar: inf.avatar || '',
                            followers: inf.totalFollowers ?? 0,
                            engagement: inf.engagement ?? 0,
                            categories: Array.isArray(inf.categories) ? inf.categories : [],
                            status: inf.status || 'pending',
                            joinDate: inf.joinDate || '',
                            totalEarnings: inf.totalEarnings ?? 0,
                            monthlyEarnings: inf.monthlyEarnings ?? 0,
                            completedCampaigns: inf.completedPromotions ?? 0,
                            activeCampaigns: inf.activePromotions ?? 0,
                            rating: inf.rating ?? 0,
                            location: inf.location || '',
                            socialMedia: inf.socialMedia || {},
                        })) as Influencer[];
                        setInfluencers(list);
                    } else {
                        setInfluencers([]);
                    }
                    setCampaigns([]);
                    setEarnings([]);
                })
                .catch(() => {
                    setInfluencers([]);
                    setCampaigns([]);
                    setEarnings([]);
                });
        }
    }, [isInfluencerRole]);

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

                    {isInfluencerRole && (
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 md:col-span-2 lg:col-span-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Inbox className="w-5 h-5 text-purple-600" />
                                <h2 className="text-lg font-semibold text-gray-900">Mensajes recibidos</h2>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">
                                Mensajes que te han dejado desde tu perfil público. Los ves aquí al iniciar sesión.
                            </p>
                            {inboxLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" />
                                </div>
                            ) : inboxMessages.length === 0 ? (
                                <p className="text-gray-500 py-6">No tienes mensajes aún.</p>
                            ) : (
                                <ul className="space-y-3 max-h-80 overflow-y-auto">
                                    {inboxMessages.map((msg) => (
                                        <li
                                            key={msg.id}
                                            className={`border rounded-lg p-4 ${msg.read ? 'bg-gray-50 border-gray-200' : 'bg-purple-50/50 border-purple-200'}`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium text-gray-900">{msg.senderName}</p>
                                                    {msg.senderEmail && (
                                                        <p className="text-sm text-gray-500">{msg.senderEmail}</p>
                                                    )}
                                                    <p className="text-gray-700 mt-2 whitespace-pre-wrap">{msg.message}</p>
                                                    <p className="text-xs text-gray-400 mt-2">
                                                        {new Date(msg.createdAt).toLocaleString('es')}
                                                    </p>
                                                </div>
                                                {!msg.read && (
                                                    <span className="shrink-0 px-2 py-0.5 rounded text-xs font-medium bg-purple-200 text-purple-800">
                                                        Nuevo
                                                    </span>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

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
