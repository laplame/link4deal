import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Building2, Users, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RegisteredBrandCard, type RegisteredBrand } from '../components/RegisteredBrandCard';
import { BizneShopCard, type BizneShop } from '../components/BizneShopCard';

const titles = {
  en: 'Brand or Business',
  es: 'Marca o Negocio'
};

export function BrandPage() {
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [brands, setBrands] = useState<RegisteredBrand[]>([]);
  const [bizneShops, setBizneShops] = useState<BizneShop[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingBizne, setLoadingBizne] = useState(true);
  const [bizneError, setBizneError] = useState(false);
  /** Detalle del backend (p. ej. mensaje del 502) para diagnosticar. */
  const [bizneErrorDetail, setBizneErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/brands')
      .then(res => res.json())
      .then(data => {
        if (!cancelled && data?.success && Array.isArray(data.data)) {
          setBrands(data.data);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingBrands(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    /** Desactivar con VITE_ENABLE_BIZNE_SHOPS=false en build si el backend aún no expone /api/bizne-shops. */
    if (import.meta.env.VITE_ENABLE_BIZNE_SHOPS === 'false') {
      setLoadingBizne(false);
      return;
    }

    let cancelled = false;
    fetch('/api/bizne-shops?all=1')
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        /** 404 = ruta no desplegada en el servidor Node; no mostrar error (solo marcas locales). */
        if (res.status === 404) {
          setBizneShops([]);
          setBizneError(false);
          setBizneErrorDetail(null);
          return;
        }
        if (data?.success && Array.isArray(data.data?.shops)) {
          setBizneShops(data.data.shops);
          setBizneError(false);
          setBizneErrorDetail(null);
        } else {
          setBizneShops([]);
          setBizneError(true);
          setBizneErrorDetail(
            typeof data?.message === 'string'
              ? data.message
              : res.status >= 400
                ? `HTTP ${res.status}`
                : 'Respuesta inválida (sin success ni shops)'
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBizneShops([]);
          setBizneError(true);
          setBizneErrorDetail('Red o respuesta no JSON (revisa consola / red)');
        }
      })
      .finally(() => { if (!cancelled) setLoadingBizne(false); });
    return () => { cancelled = true; };
  }, []);

  const categories = useMemo(() => {
    const fromBrands = brands.flatMap(b => b.categories || []);
    const fromBizne = bizneShops.map(s => s.storeType).filter(Boolean) as string[];
    return Array.from(new Set([...fromBrands, ...fromBizne])).filter(Boolean).sort();
  }, [brands, bizneShops]);

  const filteredBrands = useMemo(() => brands.filter(b => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      (b.companyName || '').toLowerCase().includes(term) ||
      (b.industry || '').toLowerCase().includes(term) ||
      (b.description || '').toLowerCase().includes(term);
    const catMatch = selectedCategory === 'all' ||
      (Array.isArray(b.categories) && b.categories.some((c: string) => c.toLowerCase() === selectedCategory.toLowerCase()));
    return matchesSearch && catMatch;
  }), [brands, searchTerm, selectedCategory]);

  const filteredBizneShops = useMemo(() => bizneShops.filter(s => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      (s.storeName || '').toLowerCase().includes(term) ||
      (s.storeType || '').toLowerCase().includes(term) ||
      (s.fullAddress || '').toLowerCase().includes(term) ||
      (s.storeLocation || '').toLowerCase().includes(term);
    const catMatch = selectedCategory === 'all' ||
      (s.storeType && s.storeType.toLowerCase() === selectedCategory.toLowerCase());
    return matchesSearch && catMatch;
  }), [bizneShops, searchTerm, selectedCategory]);

  /** Spinner inicial hasta que al menos una fuente responda con datos o ambas terminen vacías. */
  const waitingForAnyData =
    !brands.length && !bizneShops.length && (loadingBrands || loadingBizne);
  const hasAny = filteredBrands.length > 0 || filteredBizneShops.length > 0;
  const isEmpty = !loadingBrands && !loadingBizne && !hasAny;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Building2 className="h-6 w-6 text-blue-400" />
              <h1 className="text-xl font-bold text-white">{titles[language]}</h1>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'es')}
                className="bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
              <Link 
                to="/influencers"
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Users className="h-4 w-4" />
                <span>View Influencers</span>
              </Link>
              <Link 
                to="/brand-setup"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {language === 'es' ? 'Registra tu marca o negocio' : 'List Your Brand or Business'}
              </Link>
              <Link 
                to="/add-offer"
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Create Offer</span>
              </Link>
            </div>
          </div>

          <div className="mt-4 flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={language === 'es' ? 'Buscar marcas, negocios o categorías...' : 'Search brands, businesses, or categories...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="all">{language === 'es' ? 'Todas las categorías' : 'All Categories'}</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {waitingForAnyData && (
          <div className="text-center py-6 text-gray-400">
            {language === 'es' ? 'Cargando marcas y negocios...' : 'Loading brands and businesses...'}
          </div>
        )}

        {bizneError && !loadingBizne && (
          <div className="text-center text-amber-500/90 text-sm mb-6 space-y-1">
            <p>
              {language === 'es'
                ? 'No se pudieron cargar las tiendas BizneAI. Las marcas registradas en DameCodigo siguen visibles.'
                : 'Could not load BizneAI shops. DameCodigo-registered brands are still shown.'}
            </p>
            {bizneErrorDetail && (
              <p className="text-xs text-gray-500 max-w-xl mx-auto break-words" title={bizneErrorDetail}>
                {bizneErrorDetail}
              </p>
            )}
          </div>
        )}

        {!waitingForAnyData && hasAny && (
          <div className="space-y-10">
            {filteredBrands.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-400" />
                  {language === 'es' ? 'Marcas en DameCodigo' : 'Brands on DameCodigo'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredBrands.map(brand => (
                    <RegisteredBrandCard key={`brand-${brand._id}`} brand={brand} />
                  ))}
                </div>
              </section>
            )}

            {(loadingBizne || bizneShops.length > 0) && (
              <section>
                <h2 className="text-lg font-semibold text-gray-200 mb-1 flex items-center gap-2">
                  <span className="text-violet-400">●</span>
                  {language === 'es' ? 'Tiendas BizneAI' : 'BizneAI stores'}
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  {language === 'es'
                    ? 'Negocios conectados a la red BizneAI (activos; sin tiendas modelo).'
                    : 'Businesses on the BizneAI network (active; model shops excluded).'}
                </p>
                {loadingBizne && filteredBizneShops.length === 0 && !bizneError && (
                  <p className="text-sm text-gray-500 py-4">
                    {language === 'es' ? 'Cargando tiendas BizneAI...' : 'Loading BizneAI stores...'}
                  </p>
                )}
                {filteredBizneShops.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredBizneShops.map(shop => (
                      <BizneShopCard
                        key={`bizne-${shop.id || shop._id}`}
                        shop={shop}
                      />
                    ))}
                  </div>
                )}
                {!loadingBizne && bizneShops.length > 0 && filteredBizneShops.length === 0 && (
                  <p className="text-sm text-gray-500 py-2">
                    {language === 'es'
                      ? 'Ninguna tienda coincide con la búsqueda o el filtro.'
                      : 'No stores match your search or filter.'}
                  </p>
                )}
              </section>
            )}
          </div>
        )}

        {isEmpty && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400">
              {language === 'es' ? 'No hay marcas o negocios' : 'No brands or businesses found'}
            </h3>
            <p className="text-gray-500 mt-2">
              {language === 'es' ? 'Ajusta búsqueda o filtros, o registra tu marca o negocio.' : 'Try adjusting your search or filters, or list your brand or business.'}
            </p>
            <Link
              to="/brand-setup"
              className="inline-block mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
            >
              {language === 'es' ? 'Registra tu marca o negocio' : 'List your brand or business'}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
