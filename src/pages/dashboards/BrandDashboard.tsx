import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    ArrowLeft, 
    Building2, 
    TrendingUp, 
    DollarSign, 
    Target, 
    BarChart3, 
    ShoppingBag,
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
    Globe,
    MapPin,
    Tag,
    CreditCard,
    Users,
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
    Share2
} from 'lucide-react';

interface Brand {
    id: string;
    name: string;
    logo: string;
    industry: string;
    status: 'active' | 'pending' | 'verified' | 'suspended';
    joinDate: string;
    totalRevenue: number;
    monthlyRevenue: number;
    totalSpent: number;
    monthlySpent: number;
    activeCampaigns: number;
    completedCampaigns: number;
    rating: number;
    location: string;
    website: string;
    socialMedia: {
        instagram?: string;
        facebook?: string;
        twitter?: string;
        linkedin?: string;
    };
}

interface Campaign {
    id: string;
    title: string;
    influencer: string;
    status: 'active' | 'completed' | 'pending' | 'cancelled';
    startDate: string;
    endDate: string;
    budget: number;
    spent: number;
    revenue: number;
    roi: number;
    progress: number;
    type: 'post' | 'story' | 'video' | 'live';
    category: string;
    metrics: {
        impressions: number;
        clicks: number;
        conversions: number;
        ctr: number;
        cpc: number;
    };
}

interface Sale {
    id: string;
    product: string;
    customer: string;
    amount: number;
    date: string;
    status: 'completed' | 'pending' | 'cancelled';
    source: 'influencer' | 'organic' | 'paid' | 'referral';
    influencer?: string;
}

export default function BrandDashboard() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterIndustry, setFilterIndustry] = useState<string>('all');

    // Mock data - en una aplicación real esto vendría de una API
    useEffect(() => {
        const mockBrands: Brand[] = [
            {
                id: '1',
                name: 'Zara',
                logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=150&h=150&fit=crop',
                industry: 'Moda',
                status: 'verified',
                joinDate: '2023-01-15',
                totalRevenue: 1250000,
                monthlyRevenue: 98000,
                totalSpent: 45000,
                monthlySpent: 3800,
                activeCampaigns: 8,
                completedCampaigns: 45,
                rating: 4.8,
                location: 'Madrid, España',
                website: 'www.zara.com',
                socialMedia: {
                    instagram: '@zara',
                    facebook: 'Zara',
                    twitter: '@zara'
                }
            },
            {
                id: '2',
                name: 'Samsung',
                logo: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=150&h=150&fit=crop',
                industry: 'Tecnología',
                status: 'verified',
                joinDate: '2023-03-20',
                totalRevenue: 890000,
                monthlyRevenue: 75000,
                totalSpent: 32000,
                monthlySpent: 2800,
                activeCampaigns: 6,
                completedCampaigns: 32,
                rating: 4.7,
                location: 'Barcelona, España',
                website: 'www.samsung.com',
                socialMedia: {
                    instagram: '@samsung',
                    facebook: 'Samsung',
                    twitter: '@samsung'
                }
            },
            {
                id: '3',
                name: 'MyProtein',
                logo: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop',
                industry: 'Fitness',
                status: 'active',
                joinDate: '2023-05-10',
                totalRevenue: 450000,
                monthlyRevenue: 38000,
                totalSpent: 18000,
                monthlySpent: 1500,
                activeCampaigns: 4,
                completedCampaigns: 18,
                rating: 4.6,
                location: 'Valencia, España',
                website: 'www.myprotein.es',
                socialMedia: {
                    instagram: '@myprotein',
                    facebook: 'MyProtein'
                }
            }
        ];

        const mockCampaigns: Campaign[] = [
            {
                id: '1',
                title: 'Lanzamiento Nueva Colección Primavera',
                influencer: 'María García',
                status: 'active',
                startDate: '2024-01-15',
                endDate: '2024-02-15',
                budget: 5000,
                spent: 3750,
                revenue: 12500,
                roi: 150,
                progress: 75,
                type: 'post',
                category: 'Moda',
                metrics: {
                    impressions: 45000,
                    clicks: 2250,
                    conversions: 180,
                    ctr: 5.0,
                    cpc: 1.67
                }
            },
            {
                id: '2',
                title: 'Review Producto Tecnológico',
                influencer: 'Carlos Rodríguez',
                status: 'active',
                startDate: '2024-01-20',
                endDate: '2024-02-20',
                budget: 3000,
                spent: 1500,
                revenue: 8000,
                roi: 167,
                progress: 50,
                type: 'video',
                category: 'Tecnología',
                metrics: {
                    impressions: 32000,
                    clicks: 1600,
                    conversions: 120,
                    ctr: 5.0,
                    cpc: 1.25
                }
            },
            {
                id: '3',
                title: 'Promoción Suplementos Deportivos',
                influencer: 'Ana Martínez',
                status: 'pending',
                startDate: '2024-02-01',
                endDate: '2024-03-01',
                budget: 4000,
                spent: 0,
                revenue: 0,
                roi: 0,
                progress: 0,
                type: 'post',
                category: 'Fitness',
                metrics: {
                    impressions: 0,
                    clicks: 0,
                    conversions: 0,
                    ctr: 0,
                    cpc: 0
                }
            }
        ];

        const mockSales: Sale[] = [
            {
                id: '1',
                product: 'Vestido Primavera',
                customer: 'Laura Pérez',
                amount: 89.99,
                date: '2024-01-15',
                status: 'completed',
                source: 'influencer',
                influencer: 'María García'
            },
            {
                id: '2',
                product: 'Smartphone Galaxy S23',
                customer: 'Miguel López',
                amount: 899.99,
                date: '2024-01-20',
                status: 'completed',
                source: 'influencer',
                influencer: 'Carlos Rodríguez'
            },
            {
                id: '3',
                product: 'Whey Protein 1kg',
                customer: 'David García',
                amount: 29.99,
                date: '2024-01-18',
                status: 'completed',
                source: 'organic'
            }
        ];

        setBrands(mockBrands);
        setCampaigns(mockCampaigns);
        setSales(mockSales);
    }, []);

    const totalBrands = brands.length;
    const activeBrands = brands.filter(b => b.status === 'active' || b.status === 'verified').length;
    const totalRevenue = brands.reduce((sum, b) => sum + b.totalRevenue, 0);
    const totalMonthlyRevenue = brands.reduce((sum, b) => sum + b.monthlyRevenue, 0);
    const totalSpent = brands.reduce((sum, b) => sum + b.totalSpent, 0);
    const totalMonthlySpent = brands.reduce((sum, b) => sum + b.monthlySpent, 0);
    const totalROI = totalRevenue > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : 0;
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

    const filteredBrands = brands.filter(brand => {
        const matchesSearch = brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            brand.industry.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || brand.status === filterStatus;
        const matchesIndustry = filterIndustry === 'all' || brand.industry === filterIndustry;
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

    const industries = Array.from(new Set(brands.map(b => b.industry)));

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
                                    Panel de Marcas
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    Gestión completa de marcas, métricas de ventas y ROI
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Nueva Marca
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
                                <p className="text-sm font-medium text-gray-600">Total Marcas</p>
                                <p className="text-2xl font-bold text-gray-900">{totalBrands}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-blue-600" />
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
                                <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                                <p className="text-2xl font-bold text-gray-900">${(totalRevenue / 1000).toFixed(0)}k</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-green-600" />
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
                                <p className="text-sm font-medium text-gray-600">ROI Promedio</p>
                                <p className="text-2xl font-bold text-gray-900">{totalROI.toFixed(0)}%</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-green-600">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            +25% este mes
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
                            +12% este mes
                        </div>
                    </div>
                </div>

                {/* Additional Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Gasto Total en Marketing</p>
                            <p className="text-2xl font-bold text-gray-900">${(totalSpent / 1000).toFixed(0)}k</p>
                            <div className="mt-2 flex items-center justify-center text-sm text-blue-600">
                                <TrendingUp className="w-4 h-4 mr-1" />
                                +8% este mes
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Ingresos Mensuales</p>
                            <p className="text-2xl font-bold text-gray-900">${(totalMonthlyRevenue / 1000).toFixed(0)}k</p>
                            <div className="mt-2 flex items-center justify-center text-sm text-green-600">
                                <TrendingUp className="w-4 h-4 mr-1" />
                                +22% este mes
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Gasto Mensual</p>
                            <p className="text-2xl font-bold text-gray-900">${(totalMonthlySpent / 1000).toFixed(0)}k</p>
                            <div className="mt-2 flex items-center justify-center text-sm text-blue-600">
                                <TrendingUp className="w-4 h-4 mr-1" />
                                +5% este mes
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
                                    placeholder="Buscar marcas..."
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

                {/* Brands List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">Lista de Marcas</h2>
                        <p className="text-gray-600 mt-1">Gestiona todas las marcas registradas en la plataforma</p>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Marca
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Industria
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ingresos
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ROI
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
                                {filteredBrands.map((brand) => {
                                    const brandROI = brand.totalRevenue > 0 ? ((brand.totalRevenue - brand.totalSpent) / brand.totalSpent) * 100 : 0;
                                    return (
                                        <tr key={brand.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <img
                                                        className="w-10 h-10 rounded-lg object-cover"
                                                        src={brand.logo}
                                                        alt={brand.name}
                                                    />
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {brand.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {brand.website}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            {brand.location}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {brand.industry}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    ${(brand.totalRevenue / 1000).toFixed(0)}k
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    total
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {brandROI.toFixed(0)}%
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    retorno
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {brand.activeCampaigns} activas
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {brand.completedCampaigns} completadas
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(brand.status)}`}>
                                                    {getStatusIcon(brand.status)}
                                                    <span className="ml-1 capitalize">{brand.status}</span>
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
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Campaigns and Sales Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Active Campaigns */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Campañas Activas</h3>
                            <p className="text-gray-600 text-sm">Campañas en curso con métricas de rendimiento</p>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {campaigns.filter(c => c.status === 'active').map((campaign) => (
                                    <div key={campaign.id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium text-gray-900">{campaign.title}</h4>
                                            <span className="text-sm text-green-600 font-medium">
                                                {campaign.roi.toFixed(0)}% ROI
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">{campaign.influencer} • {campaign.brand}</p>
                                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 mb-3">
                                            <div>
                                                <span className="font-medium">Presupuesto:</span> ${campaign.budget.toLocaleString()}
                                            </div>
                                            <div>
                                                <span className="font-medium">Gastado:</span> ${campaign.spent.toLocaleString()}
                                            </div>
                                            <div>
                                                <span className="font-medium">Ingresos:</span> ${campaign.revenue.toLocaleString()}
                                            </div>
                                            <div>
                                                <span className="font-medium">CTR:</span> {campaign.metrics.ctr}%
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
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

                    {/* Recent Sales */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Ventas Recientes</h3>
                            <p className="text-gray-600 text-sm">Últimas transacciones por fuente</p>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {sales.slice(0, 5).map((sale) => (
                                    <div key={sale.id} className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900">{sale.product}</p>
                                            <p className="text-sm text-gray-600">{sale.customer}</p>
                                            <p className="text-xs text-gray-500">{sale.date}</p>
                                            {sale.influencer && (
                                                <p className="text-xs text-blue-600">via {sale.influencer}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-green-600">
                                                ${sale.amount.toLocaleString()}
                                            </p>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                sale.source === 'influencer' ? 'bg-blue-100 text-blue-800' :
                                                sale.source === 'organic' ? 'bg-green-100 text-green-800' :
                                                sale.source === 'paid' ? 'bg-purple-100 text-purple-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {sale.source === 'influencer' ? 'Influencer' : 
                                                 sale.source === 'organic' ? 'Orgánico' : 
                                                 sale.source === 'paid' ? 'Pago' : 'Referido'}
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
                                <span className="text-sm font-medium text-gray-900">Nueva Marca</span>
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
