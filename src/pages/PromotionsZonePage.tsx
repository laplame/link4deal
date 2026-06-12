import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapPin, ArrowLeft, Loader2, AlertCircle, Tag } from 'lucide-react';
import PageSeo from '../components/seo/PageSeo';
import { getPromotionImageUrl } from '../utils/promotionImage';
import { promotionDetailPath } from '../utils/promotionPublicUrl';
import { formatPrice } from '../utils/formatters';

interface AggregationPageMeta {
  slug: string;
  title: string;
  heading: string;
  metaDescription: string;
  keyword: string;
  type: string;
}

interface AggregationPromo {
  id?: string;
  _id?: string;
  title?: string;
  brand?: string;
  description?: string;
  currentPrice?: number;
  originalPrice?: number;
  currency?: string;
  discountPercentage?: number;
  publicSlug?: string;
  images?: Parameters<typeof getPromotionImageUrl>[0];
  storeLocation?: { city?: string; address?: string };
}

const IMAGE_PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240"%3E%3Crect fill="%23e5e7eb" width="400" height="240"/%3E%3Ctext fill="%239ca3af" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16"%3EOferta%3C/text%3E%3C/svg%3E';

export default function PromotionsZonePage() {
  const { zoneSlug } = useParams<{ zoneSlug: string }>();
  const [page, setPage] = useState<AggregationPageMeta | null>(null);
  const [promos, setPromos] = useState<AggregationPromo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!zoneSlug) {
      setError('Zona no especificada');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(`/api/seo/aggregations/${encodeURIComponent(zoneSlug)}`);
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json.success) {
          setError(json.message || 'Página no encontrada');
          return;
        }
        setPage(json.data.page);
        setPromos(Array.isArray(json.data.docs) ? json.data.docs : []);
      } catch {
        if (!cancelled) setError('No se pudo cargar las promociones');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [zoneSlug]);

  const canonicalUrl =
    typeof window !== 'undefined' && zoneSlug
      ? `${window.location.origin}/promociones/${encodeURIComponent(zoneSlug)}`
      : undefined;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" aria-hidden />
        <span className="sr-only">Cargando promociones…</span>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Página no disponible</h1>
          <p className="text-gray-600 mb-4">{error || 'No encontramos esta agregación'}</p>
          <Link to="/marketplace" className="text-indigo-600 font-medium hover:underline">
            Ir al marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageSeo
        title={page.title}
        description={page.metaDescription}
        canonicalUrl={canonicalUrl}
      />

      <div className="bg-gradient-to-r from-indigo-700 via-violet-700 to-purple-800 text-white">
        <div className="container mx-auto px-4 py-10">
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 text-indigo-100 hover:text-white text-sm mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Marketplace
          </Link>
          <h1 className="text-3xl font-bold mb-2">{page.heading}</h1>
          <p className="text-indigo-100 max-w-2xl">{page.metaDescription}</p>
          <p className="text-sm text-indigo-200/90 mt-3">
            {promos.length} promoción{promos.length === 1 ? '' : 'es'} activa
            {promos.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {promos.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-600">
            No hay promociones activas para este criterio.{' '}
            <Link to="/marketplace" className="text-indigo-600 font-medium hover:underline">
              Explorar todo el marketplace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {promos.map((promo) => {
              const id = String(promo._id || promo.id || '');
              const path = promotionDetailPath({ id, publicSlug: promo.publicSlug });
              const image = getPromotionImageUrl(promo.images);
              const discount = promo.discountPercentage || 0;
              const city = promo.storeLocation?.city || promo.storeLocation?.address || '';

              return (
                <article
                  key={id || promo.title}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <Link to={path} className="block">
                    <img
                      src={image}
                      alt={promo.title || 'Promoción'}
                      className="w-full h-44 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = IMAGE_PLACEHOLDER;
                      }}
                    />
                  </Link>
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <Tag className="h-3.5 w-3.5" />
                      {promo.brand || 'Marca'}
                      {city && (
                        <>
                          <span aria-hidden>·</span>
                          <MapPin className="h-3.5 w-3.5" />
                          {city}
                        </>
                      )}
                    </div>
                    <h2 className="font-semibold text-gray-900 line-clamp-2 mb-2">
                      <Link to={path} className="hover:text-indigo-700">
                        {promo.title || 'Promoción'}
                      </Link>
                    </h2>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg font-bold text-green-700">
                        {formatPrice(promo.currentPrice || 0, promo.currency || 'MXN')}
                      </span>
                      {discount > 0 && (
                        <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          -{discount}%
                        </span>
                      )}
                    </div>
                    <Link
                      to={path}
                      className="inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      Ver promoción →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-10 rounded-xl border border-indigo-100 bg-indigo-50/60 p-5">
          <p className="text-sm text-indigo-950 font-medium mb-2">Más zonas y categorías</p>
          <div className="flex flex-wrap gap-2">
            {[
              { slug: 'roma-norte', label: 'Roma Norte' },
              { slug: 'restaurantes-cdmx', label: 'Restaurantes CDMX' },
              { slug: 'belleza-cdmx', label: 'Belleza CDMX' },
            ]
              .filter((z) => z.slug !== zoneSlug)
              .map((z) => (
                <Link
                  key={z.slug}
                  to={`/promociones/${z.slug}`}
                  className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-sm text-indigo-800 hover:bg-indigo-100"
                >
                  {z.label}
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
