import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, LayoutGrid, Sparkles, X } from 'lucide-react';
import { SITE_CONFIG } from '../config/site';
import { MARKETPLACE_CATEGORIES } from '../data/productCategories';
import { SITE_SHELL_CARD, SITE_SHELL_SUBHEADER } from '../config/siteShell';

const BROWSE_CATEGORIES = MARKETPLACE_CATEGORIES.filter((c) => c.id !== 'other');

function subcategoryHref(categorySlug: string, sub: string) {
  return `/category/${categorySlug}?sub=${encodeURIComponent(sub)}`;
}

export default function CategoriesPage() {
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeCategory = useMemo(
    () => (activeId ? MARKETPLACE_CATEGORIES.find((c) => c.id === activeId) : null),
    [activeId],
  );

  const visibleCategories = useMemo(() => {
    if (!activeId) return BROWSE_CATEGORIES;
    return BROWSE_CATEGORIES.filter((c) => c.id === activeId);
  }, [activeId]);

  return (
    <>
      <div className={SITE_SHELL_SUBHEADER}>
        <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-violet-600/30 border border-violet-500/30 shrink-0">
              <LayoutGrid className="h-6 w-6 text-violet-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-violet-400 mb-1">Explorar por tema</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Categorías</h1>
              <p className="text-gray-400 max-w-2xl text-sm sm:text-base">
                Encuentra promociones y cupones en {SITE_CONFIG.name} según lo que buscas.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 pb-16">
        {/* Selector tipo Amazon: departamentos + subcategorías */}
        <section className={`${SITE_SHELL_CARD} p-4 sm:p-6 mb-8`}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
              Comprar por departamento
            </h2>
            {activeId ? (
              <button
                type="button"
                onClick={() => setActiveId(null)}
                className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Ver todas
              </button>
            ) : null}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin scrollbar-thumb-white/10">
            <button
              type="button"
              onClick={() => setActiveId(null)}
              className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                activeId === null
                  ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-900/30'
                  : 'bg-gray-800/60 border-white/10 text-gray-300 hover:border-white/20 hover:text-white'
              }`}
            >
              Todas
            </button>
            {BROWSE_CATEGORIES.map((category) => {
              const selected = activeId === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveId(selected ? null : category.id)}
                  className={`shrink-0 flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-xl border transition-all ${
                    selected
                      ? 'bg-violet-600/90 border-violet-400/50 text-white ring-2 ring-violet-400/30'
                      : 'bg-gray-800/60 border-white/10 text-gray-200 hover:border-white/20 hover:bg-gray-800'
                  }`}
                >
                  <span className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/10">
                    <img
                      src={category.image}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </span>
                  <span className="text-sm font-medium whitespace-nowrap">{category.name}</span>
                </button>
              );
            })}
          </div>

          {activeCategory ? (
            <div className="mt-5 pt-5 border-t border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Subcategorías en {activeCategory.name}
                </p>
                <Link
                  to={`/category/${activeCategory.slug}`}
                  className="text-xs text-violet-300 hover:text-violet-200 inline-flex items-center gap-0.5 ml-auto"
                >
                  Ver todo
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeCategory.subcategories.map((sub) => (
                  <Link
                    key={sub}
                    to={subcategoryHref(activeCategory.slug, sub)}
                    className="inline-flex items-center px-3.5 py-2 rounded-lg text-sm font-medium bg-white/5 text-gray-200 border border-white/10 hover:bg-violet-600/20 hover:border-violet-500/40 hover:text-white transition-colors"
                  >
                    {sub}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-xs text-gray-500">
              Elige un departamento para ver sus subcategorías, o explora el catálogo completo abajo.
            </p>
          )}
        </section>

        {/* Grid de categorías */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {visibleCategories.map((category) => (
            <article
              key={category.slug}
              className={`${SITE_SHELL_CARD} group overflow-hidden transition-all hover:scale-[1.02] hover:border-violet-500/30 hover:shadow-xl hover:shadow-violet-950/20`}
            >
              <Link to={`/category/${category.slug}`} className="block">
                <div className="relative h-44 sm:h-48 overflow-hidden bg-gray-800">
                  <img
                    src={category.image}
                    alt={category.imageAlt}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {category.productCount != null && category.productCount > 0 ? (
                    <div className="absolute top-3 right-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wide bg-black/55 backdrop-blur-sm text-white px-2.5 py-1 rounded-full border border-white/15">
                        {category.productCount} ofertas
                      </span>
                    </div>
                  ) : null}
                </div>
              </Link>

              <div className="p-4 sm:p-5">
                <Link to={`/category/${category.slug}`}>
                  <h2 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-violet-200 transition-colors">
                    {category.name}
                  </h2>
                </Link>
                <p className="text-sm text-gray-400 leading-relaxed mb-4 line-clamp-2">
                  {category.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {category.subcategories.slice(0, 4).map((sub) => (
                    <Link
                      key={sub}
                      to={subcategoryHref(category.slug, sub)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-800/80 text-gray-300 border border-white/10 hover:border-violet-500/40 hover:text-violet-200 transition-colors"
                    >
                      {sub}
                    </Link>
                  ))}
                  {category.subcategories.length > 4 ? (
                    <span className="text-[11px] px-2.5 py-1 rounded-lg text-gray-500">
                      +{category.subcategories.length - 4}
                    </span>
                  ) : null}
                </div>
                <Link
                  to={`/category/${category.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-300 hover:text-violet-200 transition-colors"
                >
                  Ver ofertas
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className={`${SITE_SHELL_CARD} mt-12 p-6 sm:p-10 text-center border-violet-500/20`}>
          <Sparkles className="h-8 w-8 text-violet-400 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            ¿Quieres publicar en una categoría?
          </h2>
          <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto mb-6">
            Crea tu promoción en minutos y llega a creadores e influencers en tu zona.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/quick-promotion"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors shadow-lg shadow-violet-900/30"
            >
              Crear promoción
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/marketplace"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-white/15 text-gray-200 hover:bg-white/5 font-medium transition-colors"
            >
              Ver todas las ofertas
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
