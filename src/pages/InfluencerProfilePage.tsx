import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SalesAndBidsRealtimeChart, buildSalesAndBidsChartData } from '../components/SalesAndBidsRealtimeChart';
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

const SAVED_INFLUENCERS_KEY = 'link4deal_saved_influencers';

function getSavedIds(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_INFLUENCERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function InfluencerProfilePage() {
  const { influencerSlug } = useParams();
  const { hasRole, isAuthenticated } = useAuth();
  const isInfluencer = hasRole('influencer');
  const [influencer, setInfluencer] = useState<Influencer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>(() => getSavedIds());

  // Estado para el módulo de pujas
  const [showBidModal, setShowBidModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedBid, setSelectedBid] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);

  const isSaved = influencer ? savedIds.includes(influencer.id) : false;

  const toggleSaveProfile = () => {
    if (!influencer) return;
    const next = isSaved ? savedIds.filter((id) => id !== influencer.id) : [...savedIds, influencer.id];
    setSavedIds(next);
    try {
      localStorage.setItem(SAVED_INFLUENCERS_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('localStorage setItem failed', e);
    }
  };

  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [contactSenderName, setContactSenderName] = useState('');
  const [contactSenderEmail, setContactSenderEmail] = useState('');
  const [contactSending, setContactSending] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  const handleOpenContact = () => {
    setShowContactModal(true);
    setContactMessage('');
    setContactSenderName('');
    setContactSenderEmail('');
    setContactSuccess(false);
    setContactError(null);
  };

  const handleContactInfluencer = async () => {
    if (!influencer) return;
    const msg = contactMessage.trim();
    if (!msg) {
      setContactError('Escribe un mensaje.');
      return;
    }
    if (!isAuthenticated && !contactSenderEmail.trim()) {
      setContactError('Indica tu email para que el influencer pueda responderte.');
      return;
    }
    setContactSending(true);
    setContactError(null);
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
      const res = await fetch(`/api/influencers/${influencer.id}/contact`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: msg,
          ...(isAuthenticated ? {} : { senderName: contactSenderName.trim() || undefined, senderEmail: contactSenderEmail.trim() || undefined }),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setContactError(data.message || 'No se pudo enviar el mensaje.');
        return;
      }
      setContactSuccess(true);
      setContactMessage('');
      setTimeout(() => {
        setShowContactModal(false);
        setContactSuccess(false);
      }, 1800);
    } catch {
      setContactError('Error de conexión. Intenta de nuevo.');
    } finally {
      setContactSending(false);
    }
  };

  // Cargar influencer desde API por id (ObjectId) o por slug (ej. damecodigo)
  useEffect(() => {
    if (!influencerSlug) {
      setError('Influencer no encontrado');
      setLoading(false);
      return;
    }
    const slug = influencerSlug.trim();
    const isMongoId = /^[a-f0-9]{24}$/i.test(slug);
    const url = isMongoId
      ? `/api/influencers/${slug}`
      : `/api/influencers/by-slug/${encodeURIComponent(slug)}`;
    setLoading(true);
    setError(null);
    setInfluencer(null);
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setInfluencer(data.data as Influencer);
        } else {
          setError(data.message || 'Influencer no encontrado');
        }
      })
      .catch(() => setError('Influencer no encontrado'))
      .finally(() => setLoading(false));
  }, [influencerSlug]);

  // Pujas desde la API (datos de la BD; por ahora el endpoint devuelve [] hasta que exista colección de pujas)
  useEffect(() => {
    if (!influencer?.id) {
      setBids([]);
      return;
    }
    fetch(`/api/influencers/${influencer.id}/bids`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setBids(data.data);
        } else {
          setBids([]);
        }
      })
      .catch(() => setBids([]));
  }, [influencer?.id]);

  const chartData = useMemo(
    () => buildSalesAndBidsChartData(influencer, bids),
    [influencer, bids]
  );

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header del Perfil */}
      <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/influencers"
              className="flex items-center gap-2 text-pink-100 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver al Marketplace
            </Link>
            <button
              type="button"
              onClick={toggleSaveProfile}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isSaved
                  ? 'bg-white/25 text-white'
                  : 'bg-white/15 text-pink-100 hover:bg-white/25 hover:text-white'
              }`}
              title={isSaved ? 'Quitar de guardados' : 'Guardar perfil'}
            >
              <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
              Guardar perfil
            </button>
          </div>

          <div className="flex flex-col lg:flex-row items-start gap-8">
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

            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{influencer.name}</h1>
              <p className="text-2xl text-pink-100 mb-4">{influencer.username}</p>
              <p className="text-lg text-pink-100 leading-relaxed max-w-3xl">{influencer.bio}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {influencer.categories.map((category, index) => (
                  <span key={index} className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {category}
                  </span>
                ))}
              </div>
            </div>

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

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Resumen */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <EyeIcon className="w-5 h-5 text-purple-500" />
            Resumen del Perfil
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Promociones completadas</p>
              <p className="text-2xl font-bold text-gray-900">{influencer.completedPromotions}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Promociones activas</p>
              <p className="text-2xl font-bold text-gray-900">{influencer.activePromotions}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Ingresos totales</p>
              <p className="text-2xl font-bold text-gray-900">${influencer.totalEarnings.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Valoración</p>
              <p className="text-2xl font-bold text-gray-900 flex items-center gap-1">
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                {influencer.rating}
              </p>
            </div>
          </div>
          {influencer.location && (
            <p className="mt-4 text-gray-600 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {influencer.location}
            </p>
          )}
        </section>

        {/* Pujas - justo después del resumen */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-purple-500" />
            Sistema de Pujas
          </h2>
          <p className="text-gray-600 mb-6">
            Las pujas definen la comisión en USD que recibirá el influencer por cada venta (cupón redimido). Es una comisión por venta: en dólares estadounidenses (USD), con mínimo de $1 USD por venta. Participa en las subastas para contratar a este influencer.
          </p>

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
                  <p className="text-2xl font-bold text-gray-900">{bids.reduce((sum, bid) => sum + (Number(bid.totalBids) || 0), 0)}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Comisión por venta promedio (USD)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${bids.length > 0 ? (bids.reduce((sum, bid) => sum + (Number(bid.currentBid) || 0), 0) / bids.length).toFixed(2) : '0.00'} USD
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
                      return diff > 0 && diff <= 24 * 60 * 60 * 1000;
                    }).length}
                  </p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

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
                      <span className="text-xs text-gray-500">Comisión por venta actual (USD):</span>
                      <div className="text-2xl font-bold text-green-600">${(Number(bid.currentBid) || 0).toFixed(2)} USD</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Requisitos</p>
                    <div className="space-y-1">
                      {(Array.isArray(bid.requirements) ? bid.requirements : []).slice(0, 3).map((req: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          {req}
                        </div>
                      ))}
                      {Array.isArray(bid.requirements) && bid.requirements.length > 3 && (
                        <p className="text-sm text-gray-500">+{bid.requirements.length - 3} más</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Métricas Objetivo</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Alcance:</span>
                        <span className="font-medium">{((bid.targetMetrics?.reach ?? 0) / 1000).toFixed(1)}K</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Engagement:</span>
                        <span className="font-medium">{bid.targetMetrics?.engagement ?? 0}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Conversiones:</span>
                        <span className="font-medium">{bid.targetMetrics?.conversions ?? 0}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Comisión por venta (USD)</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Comisión inicial por venta:</span>
                        <span className="font-medium">${(Number(bid.initialBid) || 0).toFixed(2)} USD</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Incremento:</span>
                        <span className="font-medium">${(Number(bid.bidIncrement) || 0).toFixed(2)} USD</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total pujas:</span>
                        <span className="font-medium">{bid.totalBids ?? 0}</span>
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

          {bids.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <DollarSign className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pujas activas</h3>
              <p className="text-gray-500">Este influencer no tiene campañas con pujas activas en este momento</p>
            </div>
          )}
        </section>

        {/* Promociones */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-500" />
            Promociones
          </h2>
          {influencer.recentPromotions?.length > 0 ? (
            <div className="space-y-3">
              {influencer.recentPromotions.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{p.title}</p>
                    <p className="text-sm text-gray-500">{p.brand} · {p.date}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-sm ${p.status === 'completed' ? 'bg-green-100 text-green-800' : p.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
                      {p.status}
                    </span>
                    <p className="text-sm font-medium text-gray-900 mt-1">${p.earnings?.toLocaleString() ?? 0}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 py-4">No hay promociones recientes.</p>
          )}
        </section>

        {isInfluencer && (
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-500" />
            Pagos
          </h2>
          {influencer.recentPayments?.length > 0 ? (
            <div className="space-y-3">
              {influencer.recentPayments.map((pay) => (
                <div key={pay.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{pay.description || pay.type}</p>
                    <p className="text-sm text-gray-500">{pay.date}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-sm ${pay.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {pay.status}
                    </span>
                    <p className="text-sm font-medium text-gray-900 mt-1">${pay.amount?.toLocaleString() ?? 0}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 py-4">No hay pagos recientes.</p>
          )}
        </section>
        )}

        {/* Analytics */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            Analytics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Cupones totales</p>
              <p className="text-xl font-bold text-gray-900">{influencer.couponStats?.totalCoupons ?? 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Cupones activos</p>
              <p className="text-xl font-bold text-gray-900">{influencer.couponStats?.activeCoupons ?? 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Ventas totales</p>
              <p className="text-xl font-bold text-gray-900">${(influencer.couponStats?.totalSales ?? 0).toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Comisión total</p>
              <p className="text-xl font-bold text-gray-900">${(influencer.couponStats?.totalCommission ?? 0).toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Conversión media</p>
              <p className="text-xl font-bold text-gray-900">{(influencer.couponStats?.averageConversion ?? 0)}%</p>
            </div>
          </div>

          {/* Vista en tiempo real: ventas y pujas en la misma gráfica */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Vista en tiempo real</h3>
            <p className="text-sm text-gray-500 mb-4">
              Ventas (cupones redimidos) y comisión por venta (pujas en USD) en la misma gráfica.
            </p>
            <SalesAndBidsRealtimeChart data={chartData} />
          </div>
        </section>

        {/* Footer con acciones */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleOpenContact}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center gap-2 text-lg"
              >
                <Mail className="w-6 h-6" />
                Contactar Influencer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Contactar Influencer - mensaje para que lo lea al iniciar sesión */}
      {showContactModal && influencer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Dejar mensaje a {influencer.name}</h3>
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Cerrar"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              El influencer verá tu mensaje cuando inicie sesión en su cuenta.
            </p>
            {!isAuthenticated && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tu nombre</label>
                  <input
                    type="text"
                    value={contactSenderName}
                    onChange={(e) => setContactSenderName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Nombre o marca"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tu email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    value={contactSenderEmail}
                    onChange={(e) => setContactSenderEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="email@ejemplo.com"
                  />
                </div>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje <span className="text-red-500">*</span></label>
              <textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Escribe tu mensaje. El influencer lo leerá al iniciar sesión."
                disabled={contactSending}
              />
            </div>
            {contactError && (
              <p className="text-sm text-red-600 mb-3">{contactError}</p>
            )}
            {contactSuccess && (
              <p className="text-sm text-green-600 mb-3">Mensaje enviado. El influencer lo verá al iniciar sesión.</p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={contactSending}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleContactInfluencer}
                disabled={contactSending}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {contactSending ? 'Enviando…' : 'Enviar mensaje'}
              </button>
            </div>
          </div>
        </div>
      )}

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
              <p className="text-sm text-gray-600 mb-2">Comisión por venta actual: <span className="font-semibold">${selectedBid.currentBid.toFixed(2)} USD</span></p>
              <p className="text-sm text-gray-600 mb-4">Incremento mínimo: <span className="font-semibold">${selectedBid.bidIncrement.toFixed(2)} USD</span></p>
              <p className="text-xs text-gray-500 mb-2">La puja es la comisión por venta (por cada cupón redimido), en USD. Mínimo $1 USD por venta.</p>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tu comisión por venta (USD)
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
                    <p className="font-semibold text-lg text-green-600">${history.amount.toFixed(2)} USD</p>
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
