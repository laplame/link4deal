import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target, 
  BarChart3,
  Eye,
  Heart,
  Share2,
  Calendar,
  MapPin,
  Tag,
  Zap,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Download,
  Filter as FilterIcon,
  Search as SearchIcon,
  Plus,
  Settings,
  Bell,
  Mail,
  Phone,
  Globe,
  MapPin as MapPinIcon,
  Tag as TagIcon,
  ShoppingBag,
  CreditCard,
  Wallet,
  Gift,
  Trophy,
  Flame,
  Sparkles,
  Edit,
  Star,
  Instagram,
  Youtube,
  Twitter
} from 'lucide-react';
import { NavigationHeader } from '../components/navigation/NavigationHeader';
import InfluencerProfileModal from '../components/InfluencerProfileModal';

interface Influencer {
  id: string;
  name: string;
  username: string;
  avatar: string;
  followers: {
    instagram: number;
    tiktok: number;
    youtube: number;
    twitter: number;
  };
  totalFollowers: number;
  engagement: number;
  categories: string[];
  status: 'active' | 'pending' | 'verified' | 'suspended';
  joinDate: string;
  totalEarnings: number;
  monthlyEarnings: number;
  completedPromotions: number;
  activePromotions: number;
  rating: number;
  location: string;
  bio: string;
  socialMedia: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    twitter?: string;
  };
  recentPromotions: PromotionHistory[];
  recentPayments: PaymentHistory[];
  couponStats: CouponStats;
  hot: boolean;
  featured: boolean;
}

interface PromotionHistory {
  id: string;
  brand: string;
  title: string;
  date: string;
  status: 'completed' | 'active' | 'pending';
  earnings: number;
  couponCode: string;
  couponUsage: number;
  totalSales: number;
}

interface PaymentHistory {
  id: string;
  date: string;
  amount: number;
  type: 'commission' | 'bonus' | 'referral';
  status: 'paid' | 'pending' | 'processing';
  description: string;
}

interface CouponStats {
  totalCoupons: number;
  activeCoupons: number;
  totalSales: number;
  totalCommission: number;
  averageConversion: number;
}

interface FilterState {
  category: string;
  location: string;
  followersRange: string;
  engagementRange: string;
  status: string;
  sortBy: string;
}

export default function InfluencersMarketplace() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [filteredInfluencers, setFilteredInfluencers] = useState<Influencer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    location: 'all',
    followersRange: 'all',
    engagementRange: 'all',
    status: 'all',
    sortBy: 'trending'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock data - en producción esto vendría de una API
  useEffect(() => {
    const mockInfluencers: Influencer[] = [
      {
        id: '1',
        name: 'María García',
        username: '@mariagarcia',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        followers: {
          instagram: 125000,
          tiktok: 89000,
          youtube: 45000,
          twitter: 32000
        },
        totalFollowers: 291000,
        engagement: 4.8,
        categories: ['Moda', 'Belleza', 'Lifestyle'],
        status: 'verified',
        joinDate: '2023-03-15',
        totalEarnings: 45000,
        monthlyEarnings: 3800,
        completedPromotions: 24,
        activePromotions: 3,
        rating: 4.9,
        location: 'Madrid, España',
        bio: 'Influencer de moda y lifestyle. Especializada en contenido de belleza y tendencias.',
        socialMedia: {
          instagram: '@mariagarcia',
          tiktok: '@mariagarcia',
          youtube: 'María García'
        },
        recentPromotions: [
          {
            id: 'p1',
            brand: 'Zara',
            title: 'Lanzamiento Colección Primavera',
            date: '2024-01-15',
            status: 'completed',
            earnings: 2500,
            couponCode: 'MARIA20',
            couponUsage: 156,
            totalSales: 23400
          },
          {
            id: 'p2',
            brand: 'Sephora',
            title: 'Beauty Box Premium',
            date: '2024-01-20',
            status: 'active',
            earnings: 1800,
            couponCode: 'MARIA15',
            couponUsage: 89,
            totalSales: 12450
          }
        ],
        recentPayments: [
          {
            id: 'pay1',
            date: '2024-01-15',
            amount: 2500,
            type: 'commission',
            status: 'paid',
            description: 'Comisión Zara - Colección Primavera'
          },
          {
            id: 'pay2',
            date: '2024-01-10',
            amount: 500,
            type: 'bonus',
            status: 'paid',
            description: 'Bono por alcance excepcional'
          }
        ],
        couponStats: {
          totalCoupons: 15,
          activeCoupons: 8,
          totalSales: 125000,
          totalCommission: 45000,
          averageConversion: 3.2
        },
        hot: true,
        featured: true
      },
      {
        id: '2',
        name: 'Carlos Rodríguez',
        username: '@carlosrodriguez',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        followers: {
          instagram: 89000,
          tiktok: 156000,
          youtube: 78000,
          twitter: 45000
        },
        totalFollowers: 368000,
        engagement: 4.6,
        categories: ['Tecnología', 'Gaming', 'Reviews'],
        status: 'verified',
        joinDate: '2022-11-08',
        totalEarnings: 32000,
        monthlyEarnings: 2800,
        completedPromotions: 18,
        activePromotions: 2,
        rating: 4.7,
        location: 'Barcelona, España',
        bio: 'Content creator especializado en tecnología y gaming. Reviews honestos y análisis detallados.',
        socialMedia: {
          instagram: '@carlosrodriguez',
          tiktok: '@carlosrodriguez',
          youtube: 'Carlos Tech'
        },
        recentPromotions: [
          {
            id: 'p3',
            brand: 'Samsung',
            title: 'Review Galaxy S24',
            date: '2024-01-18',
            status: 'completed',
            earnings: 1800,
            couponCode: 'CARLOS10',
            couponUsage: 234,
            totalSales: 187200
          }
        ],
        recentPayments: [
          {
            id: 'pay3',
            date: '2024-01-18',
            amount: 1800,
            type: 'commission',
            status: 'paid',
            description: 'Comisión Samsung - Galaxy S24'
          }
        ],
        couponStats: {
          totalCoupons: 12,
          activeCoupons: 5,
          totalSales: 89000,
          totalCommission: 32000,
          averageConversion: 2.8
        },
        hot: true,
        featured: false
      },
      {
        id: '3',
        name: 'Ana Martínez',
        username: '@anamartinez',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        followers: {
          instagram: 234000,
          tiktok: 189000,
          youtube: 67000,
          twitter: 56000
        },
        totalFollowers: 546000,
        engagement: 4.9,
        categories: ['Fitness', 'Salud', 'Bienestar'],
        status: 'verified',
        joinDate: '2023-01-22',
        totalEarnings: 67000,
        monthlyEarnings: 5200,
        completedPromotions: 31,
        activePromotions: 4,
        rating: 4.9,
        location: 'Valencia, España',
        bio: 'Coach de fitness y bienestar. Contenido motivacional y rutinas de entrenamiento.',
        socialMedia: {
          instagram: '@anamartinez',
          tiktok: '@anamartinez',
          youtube: 'Ana Fitness'
        },
        recentPromotions: [
          {
            id: 'p4',
            brand: 'Nike',
            title: 'Campaña Fitness & Wellness',
            date: '2024-01-22',
            status: 'active',
            earnings: 3200,
            couponCode: 'ANA25',
            couponUsage: 67,
            totalSales: 15600
          }
        ],
        recentPayments: [
          {
            id: 'pay4',
            date: '2024-01-22',
            amount: 3200,
            type: 'commission',
            status: 'processing',
            description: 'Comisión Nike - Campaña Fitness'
          }
        ],
        couponStats: {
          totalCoupons: 22,
          activeCoupons: 12,
          totalSales: 234000,
          totalCommission: 67000,
          averageConversion: 4.1
        },
        hot: false,
        featured: true
      }
    ];

    setInfluencers(mockInfluencers);
    setFilteredInfluencers(mockInfluencers);
  }, []);

  // Filtrar influencers
  useEffect(() => {
    let filtered = influencers;

    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(influencer => 
        influencer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        influencer.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        influencer.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtros
    if (filters.category !== 'all') {
      filtered = filtered.filter(influencer => influencer.categories.includes(filters.category));
    }
    if (filters.location !== 'all') {
      filtered = filtered.filter(influencer => influencer.location.includes(filters.location));
    }
    if (filters.status !== 'all') {
      filtered = filtered.filter(influencer => influencer.status === filters.status);
    }

    // Ordenamiento
    switch (filters.sortBy) {
      case 'trending':
        filtered = [...filtered].sort((a, b) => b.totalFollowers - a.totalFollowers);
        break;
      case 'engagement':
        filtered = [...filtered].sort((a, b) => b.engagement - a.engagement);
        break;
      case 'earnings':
        filtered = [...filtered].sort((a, b) => b.totalEarnings - a.totalEarnings);
        break;
      case 'rating':
        filtered = [...filtered].sort((a, b) => b.rating - a.rating);
        break;
      case 'recent':
        filtered = [...filtered].sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime());
        break;
    }

    setFilteredInfluencers(filtered);
  }, [influencers, searchTerm, filters]);

  const categories = ['Moda', 'Belleza', 'Lifestyle', 'Tecnología', 'Gaming', 'Fitness', 'Salud', 'Comida', 'Viajes'];
  const locations = ['Madrid, España', 'Barcelona, España', 'Valencia, España', 'México DF', 'Monterrey', 'Guadalajara'];
  const followerRanges = ['0-10K', '10K-50K', '50K-100K', '100K-500K', '500K+'];
  const engagementRanges = ['0-2%', '2-4%', '4-6%', '6%+'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500 bg-green-100';
      case 'pending': return 'text-yellow-500 bg-yellow-100';
      case 'verified': return 'text-blue-500 bg-blue-100';
      case 'suspended': return 'text-red-500 bg-red-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram className="w-4 h-4" />;
      case 'tiktok': return <Globe className="w-4 h-4" />;
      case 'youtube': return <Youtube className="w-4 h-4" />;
      case 'twitter': return <Twitter className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  const handleViewProfile = (influencer: Influencer) => {
    setSelectedInfluencer(influencer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedInfluencer(null);
  };

  const handleContactInfluencer = (influencer: Influencer) => {
    console.log('Contactando influencer:', influencer.name);
    // Aquí se implementaría la funcionalidad de contacto
    // Por ejemplo, abrir un modal de chat o enviar un email
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationHeader title="Marketplace de Influencers" />
      
      {/* Header del Marketplace */}
      <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Marketplace de Influencers</h1>
            <p className="text-xl text-pink-100 mb-6">
              Descubre influencers talentosos para tus campañas y promociones
            </p>
            <div className="flex justify-center space-x-4">
              <div className="bg-white/20 rounded-lg p-3">
                <Users className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm">Perfiles Verificados</p>
                <p className="text-xs text-pink-200">Calidad garantizada</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <BarChart3 className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm">Estadísticas Reales</p>
                <p className="text-xs text-pink-200">Métricas verificadas</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <DollarSign className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm">Sistema de Comisiones</p>
                <p className="text-xs text-pink-200">Pagos automáticos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Barra de búsqueda y filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar influencers, categorías o ubicaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Botón de filtros */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <Filter className="w-5 h-5" />
              Filtros
            </button>

            {/* Ordenamiento */}
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="trending">Más Seguidores</option>
              <option value="engagement">Mayor Engagement</option>
              <option value="earnings">Mayores Ganancias</option>
              <option value="rating">Mejor Rating</option>
              <option value="recent">Más Recientes</option>
            </select>
          </div>

          {/* Filtros expandibles */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">Todas las Categorías</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <select
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">Todas las Ubicaciones</option>
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>

                <select
                  value={filters.followersRange}
                  onChange={(e) => setFilters({ ...filters, followersRange: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">Todos los Seguidores</option>
                  {followerRanges.map(range => (
                    <option key={range} value={range}>{range}</option>
                  ))}
                </select>

                <select
                  value={filters.engagementRange}
                  onChange={(e) => setFilters({ ...filters, engagementRange: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">Todo el Engagement</option>
                  {engagementRanges.map(range => (
                    <option key={range} value={range}>{range}</option>
                  ))}
                </select>

                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">Todos los Estados</option>
                  <option value="active">Activos</option>
                  <option value="verified">Verificados</option>
                  <option value="pending">Pendientes</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Influencers</p>
                <p className="text-2xl font-bold text-gray-900">{filteredInfluencers.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Seguidores Totales</p>
                <p className="text-2xl font-bold text-purple-600">
                  {(filteredInfluencers.reduce((sum, i) => sum + i.totalFollowers, 0) / 1000000).toFixed(1)}M
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ganancias Totales</p>
                <p className="text-2xl font-bold text-green-600">
                  ${(filteredInfluencers.reduce((sum, i) => sum + i.totalEarnings, 0) / 1000).toFixed(0)}K
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Promociones Activas</p>
                <p className="text-2xl font-bold text-orange-600">
                  {filteredInfluencers.reduce((sum, i) => sum + i.activePromotions, 0)}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Grid de influencers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInfluencers.map((influencer) => (
            <div key={influencer.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Header con avatar y badges */}
              <div className="relative p-6 pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={influencer.avatar} 
                      alt={influencer.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{influencer.name}</h3>
                      <p className="text-sm text-gray-600">{influencer.username}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(influencer.status)}`}>
                          {influencer.status === 'active' ? 'Activo' : influencer.status === 'verified' ? 'Verificado' : influencer.status === 'pending' ? 'Pendiente' : 'Suspendido'}
                        </span>
                        {influencer.hot && (
                          <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                            <Flame className="w-3 h-3" />
                            HOT
                          </span>
                        )}
                        {influencer.featured && (
                          <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            FEATURED
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{influencer.bio}</p>

                {/* Categorías */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {influencer.categories.map((category, index) => (
                    <span key={index} className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
                      {category}
                    </span>
                  ))}
                </div>

                {/* Ubicación */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <MapPin className="w-4 h-4" />
                  {influencer.location}
                </div>
              </div>

              {/* Estadísticas principales */}
              <div className="px-6 pb-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Total Seguidores</p>
                    <p className="font-semibold text-gray-900">
                      {(influencer.totalFollowers / 1000).toFixed(1)}K
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Engagement</p>
                    <p className="font-semibold text-blue-600">{influencer.engagement}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Rating</p>
                    <p className="font-semibold text-yellow-600">{influencer.rating}/5</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Ganancias</p>
                    <p className="font-semibold text-green-600">
                      ${(influencer.totalEarnings / 1000).toFixed(1)}K
                    </p>
                  </div>
                </div>

                {/* Redes sociales */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Redes Sociales:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(influencer.followers).map(([platform, count]) => (
                      <div key={platform} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs">
                        {getSocialIcon(platform)}
                        <span className="text-gray-700">
                          {(count / 1000).toFixed(1)}K
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Estadísticas de cupones */}
                <div className="bg-blue-50 rounded-lg p-3 mb-4">
                  <p className="text-xs text-blue-600 mb-2 font-medium">Estadísticas de Cupones:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-blue-600">Total Cupones:</span>
                      <span className="ml-1 text-blue-900 font-medium">{influencer.couponStats.totalCoupons}</span>
                    </div>
                    <div>
                      <span className="text-blue-600">Ventas Totales:</span>
                      <span className="ml-1 text-blue-900 font-medium">${(influencer.couponStats.totalSales / 1000).toFixed(1)}K</span>
                    </div>
                    <div>
                      <span className="text-blue-600">Conversión:</span>
                      <span className="ml-1 text-blue-900 font-medium">{influencer.couponStats.averageConversion}%</span>
                    </div>
                    <div>
                      <span className="text-blue-600">Comisión Total:</span>
                      <span className="ml-1 text-blue-900 font-medium">${(influencer.couponStats.totalCommission / 1000).toFixed(1)}K</span>
                    </div>
                  </div>
                </div>

                {/* Promociones recientes */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2 font-medium">Promociones Recientes:</p>
                  <div className="space-y-2">
                    {influencer.recentPromotions.slice(0, 2).map((promo) => (
                      <div key={promo.id} className="bg-gray-50 rounded p-2 text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{promo.brand}</p>
                            <p className="text-gray-600">{promo.title}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            promo.status === 'completed' ? 'bg-green-100 text-green-700' :
                            promo.status === 'active' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {promo.status === 'completed' ? 'Completada' : promo.status === 'active' ? 'Activa' : 'Pendiente'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-1 text-gray-500">
                          <span>Cupón: {promo.couponCode}</span>
                          <span>${promo.earnings}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botón de ver perfil */}
                                        <Link
                          to={`/influencer/${influencer.name.toLowerCase()
                            .normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '')
                            .replace(/\s+/g, '-')
                            .replace(/[^a-z0-9-]/g, '')}`}
                          className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-pink-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                  <Eye className="w-5 h-5" />
                  Ver Perfil Completo
                </Link>

                {/* Acciones adicionales */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <button className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors">
                    <Heart className="w-4 h-4" />
                    <span className="text-sm">Guardar</span>
                  </button>
                  <button className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors">
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm">Compartir</span>
                  </button>
                  <button className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">Contactar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mensaje si no hay resultados */}
        {filteredInfluencers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron influencers</h3>
            <p className="text-gray-500">Intenta ajustar los filtros o la búsqueda</p>
          </div>
        )}
      </div>

      {/* Modal de Perfil de Influencer */}
      <InfluencerProfileModal
        influencer={selectedInfluencer}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onContact={handleContactInfluencer}
      />
    </div>
  );
}
