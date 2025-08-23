import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft,
  Instagram, 
  Youtube, 
  Twitter, 
  Globe, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Award, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  Mail, 
  Heart, 
  Share2, 
  Eye, 
  BarChart3, 
  Target, 
  CreditCard, 
  Flame, 
  Star,
  Plus,
  XCircle,
  Eye as EyeIcon,
  Users as UsersIcon,
  TrendingUp as TrendingUpIcon,
  DollarSign as DollarSignIcon
} from 'lucide-react';
import { NavigationHeader } from '../components/navigation/NavigationHeader';

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

export default function InfluencerProfilePage() {
  const { influencerSlug } = useParams();
  const navigate = useNavigate();
  const [influencer, setInfluencer] = useState<Influencer | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'promotions' | 'payments' | 'analytics' | 'bidding'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para el módulo de pujas
  const [showBidModal, setShowBidModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedBid, setSelectedBid] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);

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
          bio: 'Content creator especializado en tecnología y gaming. Reviews honestos y análisis detallados de productos tech.',
          socialMedia: {
            instagram: '@carlosrodriguez',
            tiktok: '@carlosrodriguez',
            youtube: 'Carlos Tech'
          },
          recentPromotions: [
            {
              id: 'p2',
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
              id: 'pay2',
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
              id: 'p3',
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
              id: 'pay3',
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

    // Simular búsqueda por slug
    const foundInfluencer = mockInfluencers.find(inf => {
      const normalizedName = inf.name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/\s+/g, '-') // Reemplazar espacios con guiones
        .replace(/[^a-z0-9-]/g, ''); // Solo letras, números y guiones
      
      const normalizedSlug = influencerSlug?.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9-]/g, '');
      
      return normalizedName === normalizedSlug;
    });

    if (foundInfluencer) {
      setInfluencer(foundInfluencer);
    } else {
      setError('Influencer no encontrado');
    }
    
    setLoading(false);
  }, [influencerSlug]);

  // Mock data para pujas - en producción esto vendría de una API
  useEffect(() => {
    if (influencer) {
      const mockBids = [
        {
          id: 'bid1',
          campaignId: 'camp1',
          campaignTitle: 'Lanzamiento Colección Primavera 2024',
          brandName: 'Zara',
          initialBid: 1.00,
          currentBid: 3.50,
          bidIncrement: 0.25,
          totalBids: 8,
          status: 'active',
          startDate: '2024-01-15',
          endDate: '2024-01-25',
          requirements: ['Instagram', 'TikTok', 'Mínimo 100K seguidores', 'Engagement >4%'],
          targetMetrics: {
            reach: 500000,
            engagement: 4.5,
            conversions: 150
          },
          bidHistory: [
            {
              id: 'bh1',
              bidderId: 'brand1',
              bidderName: 'Zara',
              bidderType: 'brand',
              amount: 1.00,
              timestamp: '2024-01-15T10:00:00Z',
              status: 'active'
            },
            {
              id: 'bh2',
              bidderId: 'agency1',
              bidderName: 'Marketing Pro Agency',
              bidderType: 'agency',
              amount: 1.50,
              timestamp: '2024-01-16T14:30:00Z',
              status: 'outbid'
            },
            {
              id: 'bh3',
              bidderId: 'brand1',
              bidderName: 'Zara',
              bidderType: 'brand',
              amount: 2.00,
              timestamp: '2024-01-17T09:15:00Z',
              status: 'outbid'
            },
            {
              id: 'bh4',
              bidderId: 'agency2',
              bidderName: 'Digital Influencers Co',
              bidderType: 'agency',
              amount: 2.50,
              timestamp: '2024-01-18T16:45:00Z',
              status: 'outbid'
            },
            {
              id: 'bh5',
              bidderId: 'brand1',
              bidderName: 'Zara',
              bidderType: 'brand',
              amount: 3.00,
              timestamp: '2024-01-19T11:20:00Z',
              status: 'outbid'
            },
            {
              id: 'bh6',
              bidderId: 'agency3',
              bidderName: 'Social Boost Agency',
              bidderType: 'agency',
              amount: 3.25,
              timestamp: '2024-01-20T13:10:00Z',
              status: 'outbid'
            },
            {
              id: 'bh7',
              bidderId: 'brand1',
              bidderName: 'Zara',
              bidderType: 'brand',
              amount: 3.50,
              timestamp: '2024-01-21T15:30:00Z',
              status: 'active'
            }
          ],
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-21T15:30:00Z'
        },
        {
          id: 'bid2',
          campaignId: 'camp2',
          campaignTitle: 'Campaña Fitness & Wellness',
          brandName: 'Nike',
          initialBid: 1.00,
          currentBid: 4.00,
          bidIncrement: 0.50,
          totalBids: 12,
          status: 'active',
          startDate: '2024-01-20',
          endDate: '2024-01-30',
          requirements: ['Instagram', 'TikTok', 'Mínimo 200K seguidores', 'Contenido fitness'],
          targetMetrics: {
            reach: 800000,
            engagement: 4.8,
            conversions: 250
          },
          bidHistory: [
            {
              id: 'bh8',
              bidderId: 'brand2',
              bidderName: 'Nike',
              bidderType: 'brand',
              amount: 1.00,
              timestamp: '2024-01-20T09:00:00Z',
              status: 'outbid'
            },
            {
              id: 'bh9',
              bidderId: 'agency4',
              bidderName: 'Fitness Influencers Co',
              bidderType: 'agency',
              amount: 2.00,
              timestamp: '2024-01-20T11:00:00Z',
              status: 'outbid'
            },
            {
              id: 'bh10',
              bidderId: 'brand2',
              bidderName: 'Nike',
              bidderType: 'brand',
              amount: 3.00,
              timestamp: '2024-01-20T17:00:00Z',
              status: 'outbid'
            },
            {
              id: 'bh11',
              bidderId: 'brand2',
              bidderName: 'Nike',
              bidderType: 'brand',
              amount: 4.00,
              timestamp: '2024-01-21T10:00:00Z',
              status: 'active'
            }
          ],
          createdAt: '2024-01-20T09:00:00Z',
          updatedAt: '2024-01-21T10:00:00Z'
        }
      ];
      setBids(mockBids);
    }
  }, [influencer]);

  // Funciones del módulo de pujas
  const handlePlaceBid = (bid: any) => {
    setSelectedBid(bid);
    setShowBidModal(true);
  };

  const handleViewHistory = (bid: any) => {
    setSelectedBid(bid);
    setShowHistoryModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'won': return 'text-blue-600 bg-blue-100';
      case 'lost': return 'text-red-600 bg-red-100';
      case 'expired': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activa';
      case 'won': return 'Ganada';
      case 'lost': return 'Perdida';
      case 'expired': return 'Expirada';
      default: return 'Desconocido';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (endDate: string) => {
    const now = new Date().getTime();
    const end = new Date(endDate).getTime();
    const diff = end - now;

    if (diff <= 0) return 'Expirada';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil del influencer...</p>
        </div>
      </div>
    );
  }

  if (error || !influencer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Influencer no encontrado</h2>
          <p className="text-gray-600 mb-6">{error || 'El perfil que buscas no existe'}</p>
          <Link
            to="/influencers"
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Volver al Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: <EyeIcon className="w-4 h-4" /> },
    { id: 'promotions', label: 'Promociones', icon: <Target className="w-4 h-4" /> },
    { id: 'payments', label: 'Pagos', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'bidding', label: 'Pujas', icon: <DollarSign className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationHeader title="Perfil de Influencer" />
      
      {/* Header del Perfil */}
      <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb y botón de regreso */}
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/influencers"
              className="flex items-center gap-2 text-pink-100 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver al Marketplace
            </Link>
          </div>

          {/* Información principal del influencer */}
          <div className="flex flex-col lg:flex-row items-start gap-8">
            {/* Avatar y badges */}
            <div className="relative">
              <img 
                src={influencer.avatar} 
                alt={influencer.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-white/20"
              />
              <div className="absolute -bottom-2 -right-2 flex flex-col gap-2">
                {influencer.hot && (
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <Flame className="w-4 h-4" />
                    HOT
                  </span>
                )}
                {influencer.featured && (
                  <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    FEATURED
                  </span>
                )}
              </div>
            </div>

            {/* Información del perfil */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{influencer.name}</h1>
              <p className="text-2xl text-pink-100 mb-4">{influencer.username}</p>
              <p className="text-lg text-pink-100 leading-relaxed max-w-3xl">{influencer.bio}</p>
              
              {/* Categorías */}
              <div className="flex flex-wrap gap-2 mt-4">
                {influencer.categories.map((category, index) => (
                  <span key={index} className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {category}
                  </span>
                ))}
              </div>
            </div>

            {/* Estadísticas principales */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 text-center">
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-2xl font-bold">{(influencer.totalFollowers / 1000).toFixed(1)}K</div>
                <div className="text-sm text-pink-100">Seguidores</div>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-2xl font-bold">{influencer.engagement}%</div>
                <div className="text-sm text-pink-100">Engagement</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Tabs de navegación */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="flex space-x-8 px-6 border-b border-gray-200">
            {tabs.map((tab) => (
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
          </div>

          {/* Contenido de las tabs */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="text-center py-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Resumen del Perfil</h3>
                <p className="text-gray-600">Contenido del resumen del influencer...</p>
              </div>
            )}
            
            {activeTab === 'promotions' && (
              <div className="text-center py-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Promociones</h3>
                <p className="text-gray-600">Historial de promociones del influencer...</p>
              </div>
            )}
            
            {activeTab === 'payments' && (
              <div className="text-center py-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Pagos</h3>
                <p className="text-gray-600">Historial de pagos del influencer...</p>
              </div>
            )}
            
            {activeTab === 'analytics' && (
              <div className="text-center py-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Analytics</h3>
                <p className="text-gray-600">Métricas y análisis del influencer...</p>
              </div>
            )}
            
            {activeTab === 'bidding' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Sistema de Pujas</h3>
                  <p className="text-gray-600">
                    Todas las pujas inician en $1.00 por venta (cupón redimido). 
                    Participa en las subastas para contratar a este influencer.
                  </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Pujas Activas</p>
                        <p className="text-2xl font-bold text-gray-900">{bids.filter(b => b.status === 'active').length}</p>
                      </div>
                      <div className="p-2 bg-green-100 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total de Pujas</p>
                        <p className="text-2xl font-bold text-gray-900">{bids.reduce((sum, bid) => sum + bid.totalBids, 0)}</p>
                      </div>
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Puja Promedio</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ${bids.length > 0 ? (bids.reduce((sum, bid) => sum + bid.currentBid, 0) / bids.length).toFixed(2) : '0.00'}
                        </p>
                      </div>
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Award className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Próximas a Expirar</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {bids.filter(b => {
                            const end = new Date(b.endDate).getTime();
                            const now = new Date().getTime();
                            const diff = end - now;
                            return diff > 0 && diff <= 24 * 60 * 60 * 1000; // 24 horas
                          }).length}
                        </p>
                      </div>
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Clock className="h-5 w-5 text-yellow-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bids List */}
                <div className="space-y-4">
                  {bids.map((bid) => (
                    <div key={bid.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{bid.campaignTitle}</h4>
                          <p className="text-gray-600">{bid.brandName}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(bid.status)}`}>
                            {getStatusText(bid.status)}
                          </span>
                          <div className="mt-2">
                            <span className="text-xs text-gray-500">Puja actual:</span>
                            <div className="text-2xl font-bold text-green-600">${bid.currentBid.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-2">Requisitos</p>
                          <div className="space-y-1">
                            {bid.requirements.slice(0, 3).map((req: string, index: number) => (
                              <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                {req}
                              </div>
                            ))}
                            {bid.requirements.length > 3 && (
                              <p className="text-sm text-gray-500">+{bid.requirements.length - 3} más</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-2">Métricas Objetivo</p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Alcance:</span>
                              <span className="font-medium">{(bid.targetMetrics.reach / 1000).toFixed(1)}K</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Engagement:</span>
                              <span className="font-medium">{bid.targetMetrics.engagement}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Conversiones:</span>
                              <span className="font-medium">{bid.targetMetrics.conversions}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-2">Información de Puja</p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Puja inicial:</span>
                              <span className="font-medium">${bid.initialBid.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Incremento:</span>
                              <span className="font-medium">${bid.bidIncrement.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Total pujas:</span>
                              <span className="font-medium">{bid.totalBids}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Tiempo restante:</span>
                              <span className={`font-medium ${getTimeRemaining(bid.endDate) === 'Expirada' ? 'text-red-600' : 'text-green-600'}`}>
                                {getTimeRemaining(bid.endDate)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Inicia: {formatDate(bid.startDate)}</span>
                          <span>•</span>
                          <span>Termina: {formatDate(bid.endDate)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleViewHistory(bid)}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                          >
                            <BarChart3 className="h-4 w-4" />
                            Ver Historial
                          </button>
                          {bid.status === 'active' && (
                            <button
                              onClick={() => handlePlaceBid(bid)}
                              className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              <Plus className="h-4 w-4" />
                              Pujar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* No Results */}
                {bids.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <DollarSign className="w-16 h-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pujas activas</h3>
                    <p className="text-gray-500">Este influencer no tiene campañas con pujas activas en este momento</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer con acciones */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center gap-2 text-lg">
                <Mail className="w-6 h-6" />
                Contactar Influencer
              </button>
              <button className="bg-gray-100 text-gray-700 px-6 py-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Guardar Perfil
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bid Modal */}
      {showBidModal && selectedBid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Realizar Puja</h3>
              <button
                onClick={() => setShowBidModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Campaña: <span className="font-semibold">{selectedBid.campaignTitle}</span></p>
              <p className="text-sm text-gray-600 mb-2">Puja actual: <span className="font-semibold">${selectedBid.currentBid.toFixed(2)}</span></p>
              <p className="text-sm text-gray-600 mb-4">Incremento mínimo: <span className="font-semibold">${selectedBid.bidIncrement.toFixed(2)}</span></p>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tu puja (por venta/cupón redimido)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">$</span>
                <input
                  type="number"
                  min={selectedBid.currentBid + selectedBid.bidIncrement}
                  step={selectedBid.bidIncrement}
                  defaultValue={selectedBid.currentBid + selectedBid.bidIncrement}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBidModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                Confirmar Puja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedBid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Historial de Pujas - {selectedBid.campaignTitle}</h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-3">
              {selectedBid.bidHistory.map((history: any, index: number) => (
                <div key={history.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      history.status === 'active' ? 'bg-green-500' : 
                      history.status === 'outbid' ? 'bg-red-500' : 'bg-gray-400'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">{history.bidderName}</p>
                      <p className="text-sm text-gray-500 capitalize">{history.bidderType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg text-green-600">${history.amount.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">{formatDate(history.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
