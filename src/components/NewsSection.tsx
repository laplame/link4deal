import React, { useState, useEffect } from 'react';
import { ExternalLink, Calendar, User, TrendingUp, Share2, Heart, MessageCircle } from 'lucide-react';
import { SITE_CONFIG } from '../config/site';

interface NewsPost {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  authorAvatar: string;
  company: string;
  publishDate: string;
  linkedinUrl: string;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  category: string;
  image?: string;
  isTrending?: boolean;
}

const NewsSection: React.FC = () => {
  const [newsPosts, setNewsPosts] = useState<NewsPost[]>([
    {
      id: "1",
      title: "Link4Deal revoluciona el marketing de influencers con blockchain",
      excerpt: "La plataforma mexicana está transformando cómo las marcas se conectan con influencers, utilizando smart contracts para garantizar transparencia y autenticidad en cada promoción...",
      author: "María González",
      authorAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&w=150&q=80",
      company: "TechCrunch México",
      publishDate: "2024-01-15",
      linkedinUrl: "https://www.linkedin.com/posts/link4deal_blockchain-influencers-marketing-activity-123456789",
      engagement: {
        likes: 1247,
        comments: 89,
        shares: 156
      },
      category: "Tecnología",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=400&q=80",
      isTrending: true
    },
    {
      id: "2",
      title: "Cómo los smart contracts están cambiando el e-commerce en Latinoamérica",
      excerpt: "Link4Deal lidera la adopción de blockchain en el comercio electrónico, creando un ecosistema más seguro y transparente para marcas, influencers y consumidores...",
      author: "Carlos Mendoza",
      authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      company: "Forbes Latinoamérica",
      publishDate: "2024-01-12",
      linkedinUrl: "https://www.linkedin.com/posts/link4deal_smart-contracts-ecommerce-blockchain-activity-123456788",
      engagement: {
        likes: 892,
        comments: 67,
        shares: 98
      },
      category: "Blockchain",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80"
    },
    {
      id: "3",
      title: "Influencers mexicanos adoptan Link4Deal para promociones auténticas",
      excerpt: "Más de 500 influencers ya están utilizando la plataforma para conectar con marcas de manera transparente, generando confianza y resultados medibles...",
      author: "Ana Rodríguez",
      authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
      company: "Marketing Digital MX",
      publishDate: "2024-01-10",
      linkedinUrl: "https://www.linkedin.com/posts/link4deal_influencers-mexico-marketing-activity-123456787",
      engagement: {
        likes: 1567,
        comments: 123,
        shares: 234
      },
      category: "Marketing",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80",
      isTrending: true
    },
    {
      id: "4",
      title: "Link4Deal recibe inversión de $2M para expandirse en LATAM",
      excerpt: "La startup mexicana de marketing blockchain anuncia nueva ronda de inversión para expandir sus operaciones en Brasil, Colombia y Argentina...",
      author: "Roberto Silva",
      authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
      company: "StartupLatam",
      publishDate: "2024-01-08",
      linkedinUrl: "https://www.linkedin.com/posts/link4deal_investment-startup-latam-activity-123456786",
      engagement: {
        likes: 2341,
        comments: 189,
        shares: 345
      },
      category: "Startups",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80"
    },
    {
      id: "5",
      title: "El futuro del marketing digital: Blockchain + Influencers",
      excerpt: "Link4Deal está definiendo el estándar para el marketing del futuro, combinando la credibilidad de los influencers con la transparencia de la blockchain...",
      author: "Laura Fernández",
      authorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
      company: "Digital Marketing Today",
      publishDate: "2024-01-05",
      linkedinUrl: "https://www.linkedin.com/posts/link4deal_future-marketing-blockchain-activity-123456785",
      engagement: {
        likes: 1789,
        comments: 145,
        shares: 267
      },
      category: "Tendencias",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80"
    },
    {
      id: "6",
      title: "Cómo Link4Deal está democratizando el marketing para pequeñas empresas",
      excerpt: "La plataforma permite que empresas de todos los tamaños accedan a marketing de influencers de alta calidad, democratizando el acceso a audiencias relevantes...",
      author: "Diego Morales",
      authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      company: "PYME Digital",
      publishDate: "2024-01-03",
      linkedinUrl: "https://www.linkedin.com/posts/link4deal_small-business-marketing-democratization-activity-123456784",
      engagement: {
        likes: 945,
        comments: 78,
        shares: 112
      },
      category: "PYMEs",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=400&q=80"
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'engagement'>('date');

  const categories = [
    { id: 'all', name: 'Todas', icon: '📰' },
    { id: 'tecnologia', name: 'Tecnología', icon: '🚀' },
    { id: 'blockchain', name: 'Blockchain', icon: '⛓️' },
    { id: 'marketing', name: 'Marketing', icon: '📈' },
    { id: 'startups', name: 'Startups', icon: '💡' },
    { id: 'tendencias', name: 'Tendencias', icon: '🔥' },
    { id: 'pymes', name: 'PYMEs', icon: '🏢' }
  ];

  const filteredAndSortedPosts = newsPosts
    .filter(post => selectedCategory === 'all' || post.category.toLowerCase() === selectedCategory)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
      } else {
        const engagementA = a.engagement.likes + a.engagement.comments + a.engagement.shares;
        const engagementB = b.engagement.likes + b.engagement.comments + b.engagement.shares;
        return engagementB - engagementA;
      }
    });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hoy';
    if (diffDays === 2) return 'Ayer';
    if (diffDays <= 7) return `Hace ${diffDays - 1} días`;
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const handlePostClick = (linkedinUrl: string) => {
    window.open(linkedinUrl, '_blank');
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600 rounded-full -translate-x-48 -translate-y-48"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-600 rounded-full translate-x-32 translate-y-32"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full text-lg font-semibold mb-6">
            <span className="text-2xl">📰</span>
            Noticias y Actualizaciones
          </div>
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Mantente Informado
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Las últimas noticias sobre Link4Deal, blockchain, marketing digital y el ecosistema 
            de influencers. Conecta con nuestra comunidad en LinkedIn.
          </p>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-12">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-3">
            <span className="text-gray-600 font-medium">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'engagement')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date">Fecha</option>
              <option value="engagement">Engagement</option>
            </select>
          </div>
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredAndSortedPosts.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden group cursor-pointer"
              onClick={() => handlePostClick(post.linkedinUrl)}
            >
              {/* Image */}
              {post.image && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {post.isTrending && (
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Trending
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ExternalLink className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                {/* Category */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    {post.category}
                  </span>
                  {post.isTrending && (
                    <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                      🔥 Trending
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
                  {post.title}
                </h3>

                {/* Excerpt */}
                <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                  {post.excerpt}
                </p>

                {/* Author and Date */}
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={post.authorAvatar}
                    alt={post.author}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{post.author}</p>
                    <p className="text-gray-500 text-xs">{post.company}</p>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400 text-xs">
                    <Calendar className="w-3 h-3" />
                    {formatDate(post.publishDate)}
                  </div>
                </div>

                {/* Engagement Stats */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>{formatNumber(post.engagement.likes)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{formatNumber(post.engagement.comments)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Share2 className="w-4 h-4" />
                      <span>{formatNumber(post.engagement.shares)}</span>
                    </div>
                  </div>
                  
                  {/* LinkedIn Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePostClick(post.linkedinUrl);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-300 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.047-1.032-3.047-1.032 0-1.26 1.317-1.26 3.047v5.569H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    Ver en LinkedIn
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              ¿Te gusta lo que ves?
            </h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Síguenos en LinkedIn para recibir las últimas noticias, actualizaciones y insights 
              sobre el futuro del marketing digital y blockchain.
            </p>
            <button
              onClick={() => window.open(SITE_CONFIG.linkedinUrl, '_blank')}
              className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-3 mx-auto"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.047-1.032-3.047-1.032 0-1.26 1.317-1.26 3.047v5.569H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              Síguenos en LinkedIn
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
