import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Building2, Users, Plus, Store, LayoutList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RegisteredBrandCard, type RegisteredBrand } from '../components/RegisteredBrandCard';
import { BizneShopCard, type BizneShop } from '../components/BizneShopCard';
import { ChainPresetBrandCard, type ChainPresetDirectoryItem } from '../components/ChainPresetBrandCard';
import { useBizneShops } from '../hooks/useBizneShops';
import { BizneAiAuctionBusinessCta } from '../components/BizneAiAuctionBusinessCta';

/** Valor interno del filtro de categoría: solo cadenas del catálogo GPS */
const CHAIN_GPS_FILTER = '__chain_gps__';

const titles = {
  en: 'Brands & businesses',
  es: 'Marcas y negocios',
};

type DirectoryTab = 'all' | 'brands' | 'shops';

export function BrandPage() {
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [directoryTab, setDirectoryTab] = useState<DirectoryTab>('all');
  const [brands, setBrands] = useState<RegisteredBrand[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [chainPresets, setChainPresets] = useState<ChainPresetDirectoryItem[]>([]);
  const [loadingChains, setLoadingChains] = useState(true);
  const { shops: bizneShops, loading: loadingBizne, error: bizneError, errorDetail: bizneErrorDetail } = useBizneShops();

  useEffect(() => {
    let cancelled = false;
    fetch('/api/brands')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.success && Array.isArray(data.data)) {
          setBrands(data.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingBrands(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/geo/chain-presets')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.success && Array.isArray(data.presets)) {
          setChainPresets(data.presets as ChainPresetDirectoryItem[]);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingChains(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const chainGpsCategoryLabel = language === 'es' ? 'Cadena GPS' : 'GPS chain';

  const categories = useMemo(() => {
    const fromBrands = brands.flatMap((b) => b.categories || []);
    const fromBizne = bizneShops.map((s) => s.storeType).filter(Boolean) as string[];
    const base = Array.from(new Set([...fromBrands, ...fromBizne])).filter(Boolean).sort();
    if (chainPresets.length > 0) {
      return [...base, CHAIN_GPS_FILTER];
    }
    return base;
  }, [brands, bizneShops, chainPresets.length]);

  const filteredChainPresets = useMemo(() => {
    if (!chainPresets.length) return [];
    if (selectedCategory !== 'all' && selectedCategory !== CHAIN_GPS_FILTER) {
      return [];
    }
    const term = searchTerm.toLowerCase();
    return chainPresets.filter((p) => {
      const matchesSearch =
        !term ||
        (p.label || '').toLowerCase().includes(term) ||
        (p.chainBrandName || '').toLowerCase().includes(term) ||
        (p.id || '').toLowerCase().includes(term);
      return matchesSearch;
    });
  }, [chainPresets, searchTerm, selectedCategory]);

  const filteredBrands = useMemo(
    () =>
      brands.filter((b) => {
        if (selectedCategory === CHAIN_GPS_FILTER) return false;
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          !term ||
          (b.companyName || '').toLowerCase().includes(term) ||
          (b.industry || '').toLowerCase().includes(term) ||
          (b.description || '').toLowerCase().includes(term);
        const catMatch =
          selectedCategory === 'all' ||
          (Array.isArray(b.categories) &&
            b.categories.some((c: string) => c.toLowerCase() === selectedCategory.toLowerCase()));
        return matchesSearch && catMatch;
      }),
    [brands, searchTerm, selectedCategory],
  );

  const filteredBizneShops = useMemo(
    () =>
      bizneShops.filter((s) => {
        if (selectedCategory === CHAIN_GPS_FILTER) return false;
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          !term ||
          (s.storeName || '').toLowerCase().includes(term) ||
          (s.storeType || '').toLowerCase().includes(term) ||
          (s.fullAddress || '').toLowerCase().includes(term) ||
          (s.storeLocation || '').toLowerCase().includes(term);
        const catMatch =
          selectedCategory === 'all' ||
          (s.storeType && s.storeType.toLowerCase() === selectedCategory.toLowerCase());
        return matchesSearch && catMatch;
      }),
    [bizneShops, searchTerm, selectedCategory],
  );

  const waitingForAnyData =
    !brands.length &&
    !bizneShops.length &&
    !chainPresets.length &&
    (loadingBrands || loadingBizne || loadingChains);
  const showBrandsBlock = directoryTab === 'all' || directoryTab === 'brands';
  const showShopsBlock = directoryTab === 'all' || directoryTab === 'shops';
  const hasVisibleChains = showBrandsBlock && filteredChainPresets.length > 0;
  const hasVisibleBrands = showBrandsBlock && filteredBrands.length > 0;
  const hasVisibleShops = showShopsBlock && (loadingBizne || filteredBizneShops.length > 0);
  const hasAny = hasVisibleChains || hasVisibleBrands || hasVisibleShops;
  const isEmpty = !loadingBrands && !loadingBizne && !loadingChains && !hasAny;

  const tabBtn = (tab: DirectoryTab, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      key={tab}
      onClick={() => setDirectoryTab(tab)}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
        directoryTab === tab
          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
          : 'bg-gray-800/80 text-gray-300 border border-gray-700 hover:border-gray-600 hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
      <div className="relative overflow-hidden border-b border-gray-700/80 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 py-10 md:py-12 relative">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <p className="text-sm font-medium text-blue-400 mb-1">
                {language === 'es' ? 'Directorio' : 'Directory'}
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Building2 className="h-9 w-9 text-blue-400 shrink-0 hidden sm:block" />
                {titles[language]}
              </h1>
              <p className="text-gray-400 max-w-2xl">
                {language === 'es'
                  ? 'Marcas registradas en DameCodigo, cadenas con catálogo de sucursales (GPS) para promociones por ubicación, y tiendas BizneAI. Para subastas y POS enlazado, alta en BizneAI (bizneai.com).'
                  : 'DameCodigo-registered brands, multi-branch GPS catalog chains for location promos, and BizneAI stores. For auctions and POS, onboard via BizneAI (bizneai.com).'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'es')}
                className="bg-gray-800 border border-gray-700 rounded-xl py-2 px-3 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {tabBtn('all', language === 'es' ? 'Todo' : 'All', <LayoutList className="h-4 w-4" />)}
            {tabBtn('brands', language === 'es' ? 'Solo marcas' : 'Brands only', <Building2 className="h-4 w-4" />)}
            {tabBtn('shops', language === 'es' ? 'Solo tiendas Bizne' : 'Bizne stores', <Store className="h-4 w-4" />)}
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <Link
              to="/influencers"
              className="inline-flex items-center gap-2 bg-purple-500/90 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Users className="h-4 w-4" />
              {language === 'es' ? 'Ver influencers' : 'View influencers'}
            </Link>
            <Link
              to="/tiendas"
              className="inline-flex items-center gap-2 bg-violet-600/90 hover:bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Store className="h-4 w-4" />
              {language === 'es' ? 'Página solo tiendas' : 'Stores-only page'}
            </Link>
            <Link
              to="/brand-setup"
              className="inline-flex items-center gap-2 bg-blue-600/90 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              {language === 'es' ? 'Registrar marca' : 'List your brand'}
            </Link>
            <Link
              to="/quick-promotion"
              className="inline-flex items-center gap-2 bg-emerald-600/90 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="h-4 w-4" />
              {language === 'es' ? 'Oferta rápida' : 'Quick offer'}
            </Link>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={
                  language === 'es'
                    ? 'Buscar marcas, tiendas o categorías...'
                    : 'Search brands, stores, or categories...'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800/80 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative md:w-64">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-gray-800/80 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="all">{language === 'es' ? 'Todas las categorías' : 'All categories'}</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === CHAIN_GPS_FILTER ? chainGpsCategoryLabel : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {waitingForAnyData && (
          <div className="text-center py-6 text-gray-400">
            {language === 'es' ? 'Cargando marcas y negocios...' : 'Loading brands and businesses...'}
          </div>
        )}

        {bizneError && !loadingBizne && showShopsBlock && (
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
          <div className="space-y-12">
            {(hasVisibleChains || hasVisibleBrands) && (
              <section id="marcas" className="scroll-mt-24 space-y-10">
                {hasVisibleChains && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-100 mb-2 flex items-center gap-2">
                      <Building2 className="h-6 w-6 text-amber-400" />
                      {language === 'es' ? 'Cadenas en catálogo (GPS)' : 'Catalog chains (GPS)'}
                    </h2>
                    <p className="text-sm text-gray-500 mb-6">
                      {language === 'es'
                        ? 'Marcas con sucursales geocodificadas: promociones por ubicación y cupones cerca de tienda. Las añades desde Importar sucursales o el servidor.'
                        : 'Brands with geocoded branches: location promos and in-store coupons. Add them via bulk import or server catalog.'}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredChainPresets.map((preset) => (
                        <ChainPresetBrandCard key={`chain-preset-${preset.id}`} preset={preset} language={language} />
                      ))}
                    </div>
                  </div>
                )}

                {hasVisibleBrands && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-100 mb-2 flex items-center gap-2">
                      <Building2 className="h-6 w-6 text-blue-400" />
                      {language === 'es' ? 'Marcas registradas' : 'Registered brands'}
                    </h2>
                    <p className="text-sm text-gray-500 mb-6">
                      {language === 'es'
                        ? 'Negocios que crearon perfil y promociones en la plataforma.'
                        : 'Businesses with a profile and promotions on the platform.'}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredBrands.map((brand) => (
                        <RegisteredBrandCard key={`brand-${brand._id}`} brand={brand} />
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {showShopsBlock && (loadingBizne || bizneShops.length > 0) && (
              <section id="tiendas" className="scroll-mt-24">
                <h2 className="text-xl font-semibold text-gray-100 mb-1 flex items-center gap-2">
                  <Store className="h-6 w-6 text-violet-400" />
                  {language === 'es' ? 'Tiendas BizneAI' : 'BizneAI stores'}
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  {language === 'es'
                    ? 'Negocios conectados a la red BizneAI (activos; sin tiendas modelo).'
                    : 'Businesses on the BizneAI network (active; model shops excluded).'}
                </p>
                <div className="mb-6">
                  <BizneAiAuctionBusinessCta locale={language} />
                </div>
                {loadingBizne && filteredBizneShops.length === 0 && !bizneError && (
                  <p className="text-sm text-gray-500 py-4">
                    {language === 'es' ? 'Cargando tiendas BizneAI...' : 'Loading BizneAI stores...'}
                  </p>
                )}
                {filteredBizneShops.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredBizneShops.map((shop: BizneShop) => (
                      <BizneShopCard key={`bizne-${shop.id || shop._id}`} shop={shop} />
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
              {language === 'es'
                ? 'Ajusta búsqueda o filtros, o registra tu marca o negocio.'
                : 'Try adjusting your search or filters, or list your brand or business.'}
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
