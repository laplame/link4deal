import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    ArrowLeft, 
    Globe, 
    TrendingUp, 
    DollarSign, 
    Target, 
    BarChart3, 
    Users,
    Eye,
    MessageCircle,
    Zap,
    Star,
    Clock,
    CheckCircle,
    AlertCircle,
    ExternalLink,
    Download,
    Search,
    Plus,
    Settings,
    Building2,
    MapPin,
    Tag,
    CreditCard,
    Calendar,
    Award,
    Fire,
    Sparkles,
    Edit,
    Filter,
    PieChart,
    Activity,
    ShoppingCart,
    Package,
    Truck,
    Heart,
    Share2,
    Briefcase,
    Handshake,
    FileText,
    Phone,
    Mail
} from 'lucide-react';

interface Agency {
    id: string;
    name: string;
    logo: string;
    industry: string;
    status: 'active' | 'pending' | 'verified' | 'suspended';
    joinDate: string;
    totalRevenue: number;
    monthlyRevenue: number;
    totalClients: number;
    activeClients: number;
    totalInfluencers: number;
    activeInfluencers: number;
    rating: number;
    location: string;
    website: string;
    services: string[];
    teamSize: number;
    socialMedia: {
        instagram?: string;
        facebook?: string;
        twitter?: string;
        linkedin?: string;
    };
}

interface Client {
    id: string;
    name: string;
    logo: string;
    industry: string;
    status: 'active' | 'inactive' | 'pending';
    joinDate: string;
    monthlyBudget: number;
    totalSpent: number;
    activeCampaigns: number;
    completedCampaigns: number;
    rating: number;
    lastContact: string;
}

interface Service {
    id: string;
    name: string;
    client: string;
    status: 'active' | 'completed' | 'pending' | 'cancelled';
    startDate: string;
    endDate: string;
    budget: number;
    revenue: number;
    commission: number;
    progress: number;
    type: 'influencer_marketing' | 'brand_strategy' | 'content_creation' | 'social_media';
    description: string;
}

interface Commission {
    id: string;
    service: string;
    client: string;
    amount: number;
    date: string;
    status: 'paid' | 'pending' | 'processing';
    type: 'monthly' | 'project' | 'bonus' | 'referral';
}

export default function AgencyDashboard() {
    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterIndustry, setFilterIndustry] = useState<string>('all');

    // Mock data - en una aplicación real esto vendría de una API
    useEffect(() => {
        const mockAgencies: Agency[] = [
            {
                id: '1',
                name: 'Digital Marketing Pro',
                logo: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=150&h=150&fit=crop',
                industry: 'Marketing Digital',
                status: 'verified',
                joinDate: '2023-01-15',
                totalRevenue: 850000,
                monthlyRevenue: 72000,
                totalClients: 25,
                activeClients: 18,
                totalInfluencers: 45,
                activeInfluencers: 38,
                rating: 4.9,
                location: 'Madrid, España',
                website: 'www.digitalmarketingpro.es',
                services: ['Influencer Marketing', 'Brand Strategy', 'Content Creation', 'Social Media Management'],
                teamSize: 12,
                socialMedia: {
                    instagram: '@digitalmarketingpro',
                    facebook: 'Digital Marketing Pro',
                    linkedin: 'Digital Marketing Pro'
                }
            },
            {
                id: '2',
                name: 'Creative Solutions Agency',
                logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=150&h=150&fit=crop',
                industry: 'Creatividad',
                status: 'verified',
                joinDate: '2023-03-20',
                totalRevenue: 620000,
                monthlyRevenue: 55000,
                totalClients: 18,
                activeClients: 15,
                totalInfluencers: 32,
                activeInfluencers: 28,
                rating: 4.7,
                location: 'Barcelona, España',
                website: 'www.creativesolutions.es',
                services: ['Content Creation', 'Brand Identity', 'Video Production', 'Social Media'],
                teamSize: 8,
                socialMedia: {
                    instagram: '@creativesolutions',
                    facebook: 'Creative Solutions',
                    linkedin: 'Creative Solutions Agency'
                }
            },
            {
                id: '3',
                name: 'Influencer Connect',
                logo: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=150&h=150&fit=crop',
                industry: 'Influencer Marketing',
                status: 'active',
                joinDate: '2023-05-10',
                totalRevenue: 380000,
                monthlyRevenue: 32000,
                totalClients: 12,
                activeClients: 10,
                totalInfluencers: 28,
                activeInfluencers: 25,
                rating: 4.6,
                location: 'Valencia, España',
                website: 'www.influencerconnect.es',
                services: ['Influencer Discovery', 'Campaign Management', 'Performance Analytics', 'Brand Partnerships'],
                teamSize: 6,
                socialMedia: {
                    instagram: '@influencerconnect',
                    facebook: 'Influencer Connect'
                }
            }
        ];

        const mockClients: Client[] = [
            {
                id: '1',
                name: 'Zara',
                logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=150&h=150&fit=crop',
                industry: 'Moda',
                status: 'active',
                joinDate: '2023-02-15',
                monthlyBudget: 15000,
                totalSpent: 125000,
                activeCampaigns: 3,
                completedCampaigns: 12,
                rating: 4.8,
                lastContact: '2024-01-20'
            },
            {
                id: '2',
                name: 'Samsung',
                logo: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=150&h=150&fit=crop',
                industry: 'Tecnología',
                status: 'active',
                joinDate: '2023-04-10',
                monthlyBudget: 12000,
                totalSpent: 98000,
                activeCampaigns: 2,
                completedCampaigns: 8,
                rating: 4.7,
                lastContact: '2024-01-18'
            },
            {
                id: '3',
                name: 'MyProtein',
                logo: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop',
                industry: 'Fitness',
                status: 'active',
                joinDate: '2023-06-05',
                monthlyBudget: 8000,
                totalSpent: 45000,
                activeCampaigns: 1,
                completedCampaigns: 5,
                rating: 4.6,
                lastContact: '2024-01-15'
            }
        ];

        const mockServices: Service[] = [
            {
                id: '1',
                name: 'Campaña Influencer Marketing Q1',
                client: 'Zara',
                status: 'active',
                startDate: '2024-01-01',
                endDate: '2024-03-31',
                budget: 25000,
                revenue: 35000,
                commission: 5250,
                progress: 75,
                type: 'influencer_marketing',
                description: 'Campaña de primavera con 5 influencers de moda'
            },
            {
                id: '2',
                name: 'Estrategia de Marca Digital',
                client: 'Samsung',
                status: 'active',
                startDate: '2024-01-15',
                endDate: '2024-04-15',
                budget: 18000,
                revenue: 22000,
                commission: 3300,
                progress: 60,
                type: 'brand_strategy',
                description: 'Desarrollo de estrategia de marca para productos tecnológicos'
            },
            {
                id: '3',
                name: 'Creación de Contenido Fitness',
                client: 'MyProtein',
                status: 'pending',
                startDate: '2024-02-01',
                endDate: '2024-05-01',
                budget: 12000,
                revenue: 0,
                commission: 0,
                progress: 0,
                type: 'content_creation',
                description: 'Serie de videos y posts para redes sociales'
            }
        ];

        const mockCommissions: Commission[] = [
            {
                id: '1',
                service: 'Campaña Influencer Marketing Q1',
                client: 'Zara',
                amount: 5250,
                date: '2024-01-15',
                status: 'paid',
                type: 'project'
            },
            {
                id: '2',
                service: 'Estrategia de Marca Digital',
                client: 'Samsung',
                amount: 3300,
                date: '2024-01-20',
                status: 'processing',
                type: 'project'
            },
            {
                id: '3',
                service: 'Comisión Mensual',
                client: 'Zara',
                amount: 1500,
                date: '2024-01-01',
                status: 'paid',
                type: 'monthly'
            }
        ];

        setAgencies(mockAgencies);
        setClients(mockClients);
        setServices(mockServices);
        setCommissions(mockCommissions);
    }, []);

    const totalAgencies = agencies.length;
    const activeAgencies = agencies.filter(a => a.status === 'active' || a.status === 'verified').length;
    const totalRevenue = agencies.reduce((sum, a) => sum + a.totalRevenue, 0);
    const totalMonthlyRevenue = agencies.reduce((sum, a) => sum + a.monthlyRevenue, 0);
    const totalClients = agencies.reduce((sum, a) => sum + a.totalClients, 0);
    const totalActiveClients = agencies.reduce((sum, a) => sum + a.activeClients, 0);
    const totalInfluencers = agencies.reduce((sum, a) => sum + a.totalInfluencers, 0);
    const totalActiveInfluencers = agencies.reduce((sum, a) => sum + a.activeInfluencers, 0);
    const activeServices = services.filter(s => s.status === 'active').length;

    const filteredAgencies = agencies.filter(agency => {
        const matchesSearch = agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            agency.industry.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || agency.status === filterStatus;
        const matchesIndustry = filterIndustry === 'all' || agency.industry === filterIndustry;
        return matchesSearch && matchesStatus && matchesIndustry;
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

    const industries = Array.from(new Set(agencies.map(a => a.industry)));

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
                                    Panel de Agencias
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    Gestión completa de agencias, clientes y servicios
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Nueva Agencia
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Agencias</p>
                                <p className="text-2xl font-bold text-gray-900">{totalAgencies}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Globe className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-green-600">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            +18% este mes
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                                <p className="text-2xl font-bold text-gray-900">${(totalRevenue / 1000).toFixed(0)}k</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-green-600" />
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
                                <p className="text-sm font-medium text-gray-600">Total Clientes</p>
                                <p className="text-2xl font-bold text-gray-900">{totalClients}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Users className="w-6 h-6 text-purple-600" />
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
                                <p className="text-sm font-medium text-gray-600">Servicios Activos</p>
                                <p className="text-2xl font-bold text-gray-900">{activeServices}</p>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <Target className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-green-600">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            +8% este mes
                        </div>
                    </div>
                </div>

                {/* Additional Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Clientes Activos</p>
                            <p className="text-2xl font-bold text-gray-900">{totalActiveClients}</p>
                            <div className="mt-2 flex items-center justify-center text-sm text-blue-600">
                                <TrendingUp className="w-4 h-4 mr-1" />
                                +12% este mes
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Influencers Gestionados</p>
                            <p className="text-2xl font-bold text-gray-900">{totalActiveInfluencers}</p>
                            <div className="mt-2 flex items-center justify-center text-sm text-green-600">
                                <TrendingUp className="w-4 h-4 mr-1" />
                                +20% este mes
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Ingresos Mensuales</p>
                            <p className="text-2xl font-bold text-gray-900">${(totalMonthlyRevenue / 1000).toFixed(0)}k</p>
                            <div className="mt-2 flex items-center justify-center text-sm text-green-600">
                                <TrendingUp className="w-4 h-4 mr-1" />
                                +25% este mes
                            </div>
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
                                    placeholder="Buscar agencias..."
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
                                <option value="verified">Verificadas</option>
                                <option value="active">Activas</option>
                                <option value="pending">Pendientes</option>
                                <option value="suspended">Suspendidas</option>
                            </select>
                            
                            <select
                                value={filterIndustry}
                                onChange={(e) => setFilterIndustry(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">Todas las industrias</option>
                                {industries.map(industry => (
                                    <option key={industry} value={industry}>{industry}</option>
                                ))}
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

                {/* Agencies List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">Lista de Agencias</h2>
                        <p className="text-gray-600 mt-1">Gestiona todas las agencias registradas en la plataforma</p>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Agencia
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Industria
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Clientes
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Influencers
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ingresos
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
                                {filteredAgencies.map((agency) => (
                                    <tr key={agency.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <img
                                                    className="w-10 h-10 rounded-lg object-cover"
                                                    src={agency.logo}
                                                    alt={agency.name}
                                                />
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {agency.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {agency.website}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {agency.location} • {agency.teamSize} personas
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {agency.industry}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {agency.activeClients} activos
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {agency.totalClients} total
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {agency.activeInfluencers} activos
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {agency.totalInfluencers} total
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                ${(agency.totalRevenue / 1000).toFixed(0)}k
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                total
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(agency.status)}`}>
                                                {getStatusIcon(agency.status)}
                                                <span className="ml-1 capitalize">{agency.status}</span>
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

                {/* Services and Commissions Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Active Services */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Servicios Activos</h3>
                            <p className="text-gray-600 text-sm">Servicios en curso con métricas de rendimiento</p>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {services.filter(s => s.status === 'active').map((service) => (
                                    <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium text-gray-900">{service.name}</h4>
                                            <span className="text-sm text-green-600 font-medium">
                                                ${service.commission.toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">{service.client} • {service.description}</p>
                                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 mb-3">
                                            <div>
                                                <span className="font-medium">Presupuesto:</span> ${service.budget.toLocaleString()}
                                            </div>
                                            <div>
                                                <span className="font-medium">Ingresos:</span> ${service.revenue.toLocaleString()}
                                            </div>
                                            <div>
                                                <span className="font-medium">Comisión:</span> ${service.commission.toLocaleString()}
                                            </div>
                                            <div>
                                                <span className="font-medium">Tipo:</span> {service.type.replace('_', ' ')}
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${service.progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Recent Commissions */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Comisiones Recientes</h3>
                            <p className="text-gray-600 text-sm">Últimas comisiones por tipo de servicio</p>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {commissions.slice(0, 5).map((commission) => (
                                    <div key={commission.id} className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900">{commission.service}</p>
                                            <p className="text-sm text-gray-600">{commission.client}</p>
                                            <p className="text-xs text-gray-500">{commission.date}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-green-600">
                                                ${commission.amount.toLocaleString()}
                                            </p>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                commission.status === 'paid' ? 'bg-green-100 text-green-800' :
                                                commission.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {commission.status === 'paid' ? 'Pagado' : 
                                                 commission.status === 'processing' ? 'Procesando' : 'Pendiente'}
                                            </span>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {commission.type === 'monthly' ? 'Mensual' : 
                                                 commission.type === 'project' ? 'Proyecto' : 
                                                 commission.type === 'bonus' ? 'Bono' : 'Referido'}
                                            </div>
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
                                <span className="text-sm font-medium text-gray-900">Nueva Agencia</span>
                            </button>
                            
                            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all duration-200">
                                <Handshake className="w-8 h-8 text-green-600 mb-2" />
                                <span className="text-sm font-medium text-gray-900">Nuevo Cliente</span>
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
