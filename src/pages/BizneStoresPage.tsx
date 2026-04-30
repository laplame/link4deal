import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Store, Building2, ArrowLeft } from 'lucide-react';
import { BizneShopCard } from '../components/BizneShopCard';
import { useBizneShops } from '../hooks/useBizneShops';

export default function BizneStoresPage() {
  const { shops, loading, error, errorDetail } = useBizneShops();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = useMemo(() => {
    const types = shops.map((s) => s.storeType).filter(Boolean) as string[];
    return Array.from(new Set(types)).filter(Boolean).sort();
  }, [shops]);

  const filtered = useMemo(
    () =>
      shops.filter((s) => {
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
    [shops, searchTerm, selectedCategory]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
      <div className="relative overflow-hidden border-b border-gray-700/80 bg-gradient-to-br from-violet-950/40 via-gray-900 to-gray-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-600/15 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 py-10 md:py-12 relative">
          <Link
            to="/brands"
            className="inline-flex items-center gap-2 text-sm text-violet-300 hover:text-violet-200 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a marcas y negocios
          </Link>
          <div className="flex items-center gap-3 text-violet-400 mb-2">
            <Store className="h-8 w-8" />
            <span className="text-sm font-semibold uppercase tracking-wide">Red BizneAI</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Tiendas BizneAI</h1>
          <p className="text-gray-400 max-w-2xl text-lg">
            Negocios conectados a la red BizneAI que puedes explorar y visitar. Las marcas registradas
            directamente en DameCodigo están en el{' '}
            <Link to="/brands" className="text-violet-400 hover:text-violet-300 underline underline-offset-2">
              directorio de marcas
            </Link>
            .
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar tienda, tipo o dirección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800/80 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="relative sm:w-56">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-gray-800/80 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && filtered.length === 0 && !error && (
          <p className="text-center text-gray-400 py-12">Cargando tiendas BizneAI…</p>
        )}

        {error && !loading && (
          <div className="text-center text-amber-500/90 text-sm mb-6 space-y-1">
            <p>No se pudieron cargar las tiendas BizneAI.</p>
            {errorDetail && (
              <p className="text-xs text-gray-500 max-w-xl mx-auto break-words" title={errorDetail}>
                {errorDetail}
              </p>
            )}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((shop) => (
              <BizneShopCard key={`bizne-${shop.id || shop._id}`} shop={shop} />
            ))}
          </div>
        )}

        {!loading && shops.length > 0 && filtered.length === 0 && (
          <p className="text-center text-gray-500 py-12">Ninguna tienda coincide con la búsqueda o el filtro.</p>
        )}

        {!loading && shops.length === 0 && !error && (
          <div className="text-center py-16">
            <Building2 className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-400">No hay tiendas BizneAI disponibles</h2>
            <p className="text-gray-500 mt-2">Vuelve más tarde o consulta las marcas en DameCodigo.</p>
            <Link
              to="/brands"
              className="inline-block mt-6 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition-colors"
            >
              Ver marcas y negocios
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
