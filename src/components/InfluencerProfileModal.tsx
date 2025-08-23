import React, { useState } from 'react';
import { X, Instagram, Youtube, Twitter, Globe, MapPin, Calendar, DollarSign, Users, TrendingUp, Award, Clock, CheckCircle, AlertCircle, ExternalLink, Download, Mail, Phone, Heart, Share2, Eye, BarChart3, Target, CreditCard, Wallet, Gift, Trophy, Flame, Star } from 'lucide-react';

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

interface InfluencerProfileModalProps {
  influencer: Influencer | null;
  isOpen: boolean;
  onClose: () => void;
  onContact: (influencer: Influencer) => void;
}

export default function InfluencerProfileModal({ 
  influencer, 
  isOpen, 
  onClose, 
  onContact 
}: InfluencerProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'promotions' | 'payments' | 'analytics'>('overview');

  if (!isOpen || !influencer) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500 bg-green-100';
      case 'pending': return 'text-yellow-500 bg-yellow-100';
      case 'verified': return 'text-blue-500 bg-blue-100';
      case 'suspended': return 'text-red-500 bg-red-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPaymentTypeIcon = (type: string) => {
    switch (type) {
      case 'commission': return <DollarSign className="w-4 h-4" />;
      case 'bonus': return <Gift className="w-4 h-4" />;
      case 'referral': return <Users className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: <Eye className="w-4 h-4" /> },
    { id: 'promotions', label: 'Promociones', icon: <Target className="w-4 h-4" /> },
    { id: 'payments', label: 'Pagos', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <img 
              src={influencer.avatar} 
              alt={influencer.name}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{influencer.name}</h2>
              <p className="text-gray-600">{influencer.username}</p>
              <div className="flex items-center gap-2 mt-2">
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
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
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
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Bio y ubicación */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Biografía</h3>
                  <p className="text-gray-600 leading-relaxed">{influencer.bio}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Información</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-600">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <span>{influencer.location}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <span>Miembro desde {formatDate(influencer.joinDate)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Award className="w-5 h-5 text-gray-400" />
                      <span>Rating: {influencer.rating}/5</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Categorías */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Categorías</h3>
                <div className="flex flex-wrap gap-2">
                  {influencer.categories.map((category, index) => (
                    <span key={index} className="bg-purple-100 text-purple-700 px-3 py-2 rounded-lg text-sm font-medium">
                      {category}
                    </span>
                  ))}
                </div>
              </div>

              {/* Estadísticas principales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {(influencer.totalFollowers / 1000).toFixed(1)}K
                  </div>
                  <div className="text-sm text-blue-600">Total Seguidores</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {influencer.engagement}%
                  </div>
                  <div className="text-sm text-green-600">Engagement</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    ${(influencer.totalEarnings / 1000).toFixed(1)}K
                  </div>
                  <div className="text-sm text-purple-600">Ganancias Totales</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {influencer.completedPromotions}
                  </div>
                  <div className="text-sm text-orange-600">Promociones</div>
                </div>
              </div>

              {/* Redes sociales */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Redes Sociales</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(influencer.followers).map(([platform, count]) => (
                    <div key={platform} className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        {platform === 'instagram' && <Instagram className="w-6 h-6 text-pink-500" />}
                        {platform === 'tiktok' && <Globe className="w-6 h-6 text-black" />}
                        {platform === 'youtube' && <Youtube className="w-6 h-6 text-red-500" />}
                        {platform === 'twitter' && <Twitter className="w-6 h-6 text-blue-500" />}
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {(count / 1000).toFixed(1)}K
                      </div>
                      <div className="text-sm text-gray-600 capitalize">{platform}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Estadísticas de cupones */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Estadísticas de Cupones</h3>
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{influencer.couponStats.totalCoupons}</div>
                      <div className="text-sm text-blue-600">Total Cupones</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{influencer.couponStats.activeCoupons}</div>
                      <div className="text-sm text-blue-600">Cupones Activos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">${(influencer.couponStats.totalSales / 1000).toFixed(1)}K</div>
                      <div className="text-sm text-blue-600">Ventas Totales</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{influencer.couponStats.averageConversion}%</div>
                      <div className="text-sm text-blue-600">Conversión Promedio</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Promotions Tab */}
          {activeTab === 'promotions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Historial de Promociones</h3>
                <div className="text-sm text-gray-500">
                  {influencer.completedPromotions} completadas • {influencer.activePromotions} activas
                </div>
              </div>

              <div className="space-y-4">
                {influencer.recentPromotions.map((promo) => (
                  <div key={promo.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{promo.brand}</h4>
                        <p className="text-gray-600">{promo.title}</p>
                        <p className="text-sm text-gray-500">{formatDate(promo.date)}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          promo.status === 'completed' ? 'bg-green-100 text-green-700' :
                          promo.status === 'active' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {promo.status === 'completed' ? 'Completada' : promo.status === 'active' ? 'Activa' : 'Pendiente'}
                        </span>
                        <div className="text-lg font-bold text-green-600 mt-1">${promo.earnings}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Cupón:</span>
                        <span className="ml-2 font-mono font-medium text-purple-600">{promo.couponCode}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Usos:</span>
                        <span className="ml-2 font-medium">{promo.couponUsage}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Ventas:</span>
                        <span className="ml-2 font-medium">${promo.totalSales.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Historial de Pagos</h3>
                <div className="text-sm text-gray-500">
                  Total: ${influencer.totalEarnings.toLocaleString()}
                </div>
              </div>

              <div className="space-y-4">
                {influencer.recentPayments.map((payment) => (
                  <div key={payment.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-200 rounded-lg">
                          {getPaymentTypeIcon(payment.type)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{payment.description}</h4>
                          <p className="text-sm text-gray-500">{formatDate(payment.date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(payment.status)}`}>
                          {payment.status === 'paid' ? 'Pagado' : payment.status === 'pending' ? 'Pendiente' : 'Procesando'}
                        </span>
                        <div className="text-lg font-bold text-green-600 mt-1">${payment.amount.toLocaleString()}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="capitalize">{payment.type}</span>
                      <span>•</span>
                      <span>{formatDate(payment.date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Analytics y Métricas</h3>
              
              {/* Gráficos de rendimiento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Rendimiento Mensual</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Ganancias</span>
                      <span className="font-semibold text-green-600">${influencer.monthlyEarnings.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Promociones Activas</span>
                      <span className="font-semibold text-blue-600">{influencer.activePromotions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Engagement Promedio</span>
                      <span className="font-semibold text-purple-600">{influencer.engagement}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Métricas de Cupones</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Conversión Promedio</span>
                      <span className="font-semibold text-green-600">{influencer.couponStats.averageConversion}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Ventas por Cupón</span>
                      <span className="font-semibold text-blue-600">${(influencer.couponStats.totalSales / influencer.couponStats.totalCoupons).toFixed(0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Comisión Promedio</span>
                      <span className="font-semibold text-purple-600">${(influencer.couponStats.totalCommission / influencer.couponStats.totalCoupons).toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparativas */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Comparativa de Redes</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(influencer.followers).map(([platform, count]) => (
                    <div key={platform} className="text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {((count / influencer.totalFollowers) * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600 capitalize">{platform}</div>
                      <div className="text-xs text-gray-500">{(count / 1000).toFixed(1)}K</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer con acciones */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => onContact(influencer)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center gap-2"
              >
                <Mail className="w-5 h-5" />
                Contactar Influencer
              </button>
              <button className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Guardar
              </button>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-gray-500 hover:text-gray-700 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="text-gray-500 hover:text-gray-700 transition-colors">
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
