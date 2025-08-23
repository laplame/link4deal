import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Clock, 
  Users, 
  DollarSign, 
  Target, 
  BarChart3,
  ArrowUp,
  ArrowDown,
  Flame,
  Star,
  Eye,
  Heart,
  Share2,
  Calendar,
  MapPin,
  Tag,
  Zap,
  Award,
  TrendingDown,
  TrendingUp as TrendingUpIcon
} from 'lucide-react';
import { NavigationHeader } from '../components/navigation/NavigationHeader';
import PromotionApplicationModal from '../components/PromotionApplicationModal';

interface Promotion {
  id: string;
  title: string;
  brand: string;
  category: string;
  subcategory: string;
  description: string;
  originalPrice: number;
  currentPrice: number;
  currency: string;
  discountPercentage: number;
  image: string;
  location: string;
  validUntil: string;
  totalApplications: number;
  maxApplications: number;
  status: 'active' | 'ending' | 'closed';
  auctionType: 'dutch' | 'english';
  timeLeft: string;
  influencerRequirements: string[];
  commission: number;
  engagement: number;
  views: number;
  hot: boolean;
  featured: boolean;
}

interface FilterState {
  category: string;
  location: string;
  priceRange: string;
  auctionType: string;
  status: string;
  sortBy: string;
}

export default function PromotionsMarketplace() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [filteredPromotions, setFilteredPromotions] = useState<Promotion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    location: 'all',
    priceRange: 'all',
    auctionType: 'all',
    status: 'all',
    sortBy: 'trending'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock data - en producción esto vendría de una API
  useEffect(() => {
    const mockPromotions: Promotion[] = [
      {
        id: '1',
        title: 'Lanzamiento Nueva Colección Primavera 2024',
        brand: 'Zara',
        category: 'Moda',
        subcategory: 'Ropa Femenina',
        description: 'Promoción exclusiva para influencers de moda y lifestyle. Contenido creativo para redes sociales.',
        originalPrice: 299.99,
        currentPrice: 199.99,
        currency: 'MXN',
        discountPercentage: 33,
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
        location: 'Ciudad de México',
        validUntil: '2024-04-15',
        totalApplications: 45,
        maxApplications: 100,
        status: 'active',
        auctionType: 'dutch',
        timeLeft: '2d 14h 32m',
        influencerRequirements: ['Moda', 'Lifestyle', 'Min. 10K seguidores'],
        commission: 15,
        engagement: 4.8,
        views: 12500,
        hot: true,
        featured: true
      },
      {
        id: '2',
        title: 'Review Producto Tecnológico Galaxy S24',
        brand: 'Samsung',
        category: 'Tecnología',
        subcategory: 'Smartphones',
        description: 'Review honesto del nuevo Galaxy S24. Contenido para YouTube, Instagram y TikTok.',
        originalPrice: 15999.99,
        currentPrice: 12999.99,
        currency: 'MXN',
        discountPercentage: 19,
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop',
        location: 'Monterrey',
        validUntil: '2024-04-20',
        totalApplications: 78,
        maxApplications: 50,
        status: 'ending',
        auctionType: 'dutch',
        timeLeft: '1d 8h 15m',
        influencerRequirements: ['Tecnología', 'Reviews', 'Min. 25K seguidores'],
        commission: 20,
        engagement: 4.6,
        views: 8900,
        hot: true,
        featured: false
      },
      {
        id: '3',
        title: 'Campaña Fitness & Wellness',
        brand: 'Nike',
        category: 'Deportes',
        subcategory: 'Ropa Deportiva',
        description: 'Promoción de la nueva línea de ropa deportiva. Contenido motivacional y de entrenamiento.',
        originalPrice: 899.99,
        currentPrice: 899.99,
        currency: 'MXN',
        discountPercentage: 0,
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d6b?w=400&h=300&fit=crop',
        location: 'Guadalajara',
        validUntil: '2024-05-01',
        totalApplications: 23,
        maxApplications: 75,
        status: 'active',
        auctionType: 'english',
        timeLeft: '5d 12h 45m',
        influencerRequirements: ['Fitness', 'Deportes', 'Min. 15K seguidores'],
        commission: 12,
        engagement: 4.9,
        views: 15600,
        hot: false,
        featured: true
      },
      {
        id: '4',
        title: 'Beauty Box Premium',
        brand: 'Sephora',
        category: 'Belleza',
        subcategory: 'Cosméticos',
        description: 'Kit completo de productos de belleza para review y tutoriales.',
        originalPrice: 2499.99,
        currentPrice: 1899.99,
        currency: 'MXN',
        discountPercentage: 24,
        image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=300&fit=crop',
        location: 'Puebla',
        validUntil: '2024-04-25',
        totalApplications: 67,
        maxApplications: 60,
        status: 'active',
        auctionType: 'dutch',
        timeLeft: '3d 6h 20m',
        influencerRequirements: ['Belleza', 'Makeup', 'Min. 20K seguidores'],
        commission: 18,
        engagement: 4.7,
        views: 11200,
        hot: true,
        featured: false
      }
    ];

    setPromotions(mockPromotions);
    setFilteredPromotions(mockPromotions);
  }, []);

  // Filtrar promociones
  useEffect(() => {
    let filtered = promotions;

    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(promo => 
        promo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promo.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promo.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtros
    if (filters.category !== 'all') {
      filtered = filtered.filter(promo => promo.category === filters.category);
    }
    if (filters.location !== 'all') {
      filtered = filtered.filter(promo => promo.location === filters.location);
    }
    if (filters.auctionType !== 'all') {
      filtered = filtered.filter(promo => promo.auctionType === filters.auctionType);
    }
    if (filters.status !== 'all') {
      filtered = filtered.filter(promo => promo.status === filters.status);
    }

    // Ordenamiento
    switch (filters.sortBy) {
      case 'trending':
        filtered = [...filtered].sort((a, b) => b.views - a.views);
        break;
      case 'price-low':
        filtered = [...filtered].sort((a, b) => a.currentPrice - b.currentPrice);
        break;
      case 'price-high':
        filtered = [...filtered].sort((a, b) => b.currentPrice - a.currentPrice);
        break;
      case 'ending':
        filtered = [...filtered].sort((a, b) => {
          if (a.status === 'ending') return -1;
          if (b.status === 'ending') return 1;
          return 0;
        });
        break;
      case 'commission':
        filtered = [...filtered].sort((a, b) => b.commission - a.commission);
        break;
    }

    setFilteredPromotions(filtered);
  }, [promotions, searchTerm, filters]);

  const categories = ['Moda', 'Tecnología', 'Deportes', 'Belleza', 'Comida', 'Viajes', 'Automotriz'];
  const locations = ['Ciudad de México', 'Monterrey', 'Guadalajara', 'Puebla', 'Querétaro', 'Tijuana'];
  const priceRanges = ['0-500', '500-1000', '1000-5000', '5000+'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500 bg-green-100';
      case 'ending': return 'text-orange-500 bg-orange-100';
      case 'closed': return 'text-red-500 bg-red-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const getAuctionIcon = (type: string) => {
    return type === 'dutch' ? <TrendingDown className="w-4 h-4" /> : <TrendingUpIcon className="w-4 h-4" />;
  };

  const handleApply = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setIsModalOpen(true);
  };

  const handleApplicationSubmit = (applicationData: any) => {
    console.log('Aplicación enviada:', applicationData);
    // Aquí se enviaría la aplicación a la API
    // Por ahora solo mostramos en consola
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPromotion(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationHeader />
      
      {/* Header del Marketplace */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Marketplace de Promociones</h1>
            <p className="text-xl text-purple-100 mb-6">
              Descubre las mejores promociones de marcas y aplica para colaboraciones exclusivas
            </p>
            <div className="flex justify-center space-x-4">
              <div className="bg-white/20 rounded-lg p-3">
                <TrendingDown className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm">Subastas Holandesas</p>
                <p className="text-xs text-purple-200">Precios descienden</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <TrendingUpIcon className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm">Subastas Inglesas</p>
                <p className="text-xs text-purple-200">Pujas ascienden</p>
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
                  placeholder="Buscar promociones, marcas o categorías..."
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
              <option value="trending">Más Populares</option>
              <option value="ending">Terminando Pronto</option>
              <option value="price-low">Precio: Menor a Mayor</option>
              <option value="price-high">Precio: Mayor a Menor</option>
              <option value="commission">Mayor Comisión</option>
            </select>
          </div>

          {/* Filtros expandibles */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  value={filters.auctionType}
                  onChange={(e) => setFilters({ ...filters, auctionType: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">Todos los Tipos</option>
                  <option value="dutch">Subasta Holandesa</option>
                  <option value="english">Subasta Inglesa</option>
                </select>

                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">Todos los Estados</option>
                  <option value="active">Activas</option>
                  <option value="ending">Terminando</option>
                  <option value="closed">Cerradas</option>
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
                <p className="text-sm text-gray-600">Promociones Activas</p>
                <p className="text-2xl font-bold text-gray-900">{filteredPromotions.filter(p => p.status === 'active').length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Terminando Pronto</p>
                <p className="text-2xl font-bold text-orange-600">{filteredPromotions.filter(p => p.status === 'ending').length}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Aplicaciones</p>
                <p className="text-2xl font-bold text-blue-600">{filteredPromotions.reduce((sum, p) => sum + p.totalApplications, 0)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Comisión Promedio</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(filteredPromotions.reduce((sum, p) => sum + p.commission, 0) / filteredPromotions.length)}%
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Grid de promociones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPromotions.map((promotion) => (
            <div key={promotion.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Imagen y badges */}
              <div className="relative">
                <img 
                  src={promotion.image} 
                  alt={promotion.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {promotion.hot && (
                    <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      HOT
                    </div>
                  )}
                  {promotion.featured && (
                    <div className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      FEATURED
                    </div>
                  )}
                </div>
                <div className="absolute top-3 right-3">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(promotion.status)}`}>
                    {promotion.status === 'active' ? 'Activa' : promotion.status === 'ending' ? 'Terminando' : 'Cerrada'}
                  </div>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2">{promotion.title}</h3>
                    <p className="text-sm text-gray-600">{promotion.brand}</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    {getAuctionIcon(promotion.auctionType)}
                    <span>{promotion.auctionType === 'dutch' ? 'Holandesa' : 'Inglesa'}</span>
                  </div>
                </div>

                {/* Categoría y ubicación */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    {promotion.category} - {promotion.subcategory}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {promotion.location}
                  </div>
                </div>

                {/* Precios */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-2xl font-bold text-green-600">
                    ${promotion.currentPrice.toLocaleString()}
                  </div>
                  {promotion.discountPercentage > 0 && (
                    <div className="text-sm text-gray-500 line-through">
                      ${promotion.originalPrice.toLocaleString()}
                    </div>
                  )}
                  {promotion.discountPercentage > 0 && (
                    <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                      -{promotion.discountPercentage}%
                    </div>
                  )}
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                  <div>
                    <p className="text-xs text-gray-500">Comisión</p>
                    <p className="font-semibold text-purple-600">{promotion.commission}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Engagement</p>
                    <p className="font-semibold text-blue-600">{promotion.engagement}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Vistas</p>
                    <p className="font-semibold text-gray-600">{promotion.views.toLocaleString()}</p>
                  </div>
                </div>

                {/* Tiempo restante y aplicaciones */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    {promotion.timeLeft}
                  </div>
                  <div className="text-sm text-gray-600">
                    {promotion.totalApplications}/{promotion.maxApplications} aplicaciones
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(promotion.totalApplications / promotion.maxApplications) * 100}%` }}
                  ></div>
                </div>

                {/* Requisitos */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Requisitos:</p>
                  <div className="flex flex-wrap gap-1">
                    {promotion.influencerRequirements.map((req, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                        {req}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Botón de aplicación */}
                <button
                  onClick={() => handleApply(promotion)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Target className="w-5 h-5" />
                  Aplicar Ahora
                </button>

                {/* Acciones adicionales */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <button className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">Ver Detalles</span>
                  </button>
                  <button className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors">
                    <Heart className="w-4 h-4" />
                    <span className="text-sm">Guardar</span>
                  </button>
                  <button className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors">
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm">Compartir</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mensaje si no hay resultados */}
        {filteredPromotions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron promociones</h3>
            <p className="text-gray-500">Intenta ajustar los filtros o la búsqueda</p>
          </div>
        )}
      </div>

      {/* Modal de Aplicación */}
      <PromotionApplicationModal
        promotion={selectedPromotion}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleApplicationSubmit}
      />
    </div>
  );
}
