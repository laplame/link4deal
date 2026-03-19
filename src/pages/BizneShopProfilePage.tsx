import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Store, Phone } from 'lucide-react';
import type { BizneShop } from '../components/BizneShopCard';

function humanizeStoreType(type?: string): string {
  if (!type) return '';
  return type
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

export default function BizneShopProfilePage() {
  const { shopId } = useParams<{ shopId: string }>();
  const location = useLocation();
  const fromState = (location.state as { shop?: BizneShop } | null)?.shop;

  const [shop, setShop] = useState<BizneShop | null>(fromState || null);
  const [loading, setLoading] = useState(!fromState);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fromState && (fromState.id === shopId || fromState._id === shopId)) {
      setShop(fromState);
      setLoading(false);
      return;
    }
    if (!shopId) {
      setError('ID no válido');
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetch(`/api/bizne-shops/${shopId}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Tienda no encontrada' : 'Error al cargar');
        return res.json();
      })
      .then((data) => {
        if (!cancelled && data?.success && data.data) {
          setShop(data.data);
        } else if (!cancelled) {
          setError('No se pudo cargar la tienda');
        }
      })
      .catch(() => {
        if (!cancelled) setError('No se pudo cargar la tienda');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [shopId, fromState]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Cargando...</p>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-12">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-gray-400 mb-6">{error || 'Tienda no encontrada'}</p>
          <Link to="/brands" className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300">
            <ArrowLeft className="h-4 w-4" />
            Volver a marcas y negocios
          </Link>
        </div>
      </div>
    );
  }

  const typeLabel = humanizeStoreType(shop.storeType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link
          to="/brands"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a marcas y negocios
        </Link>

        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-violet-900/40 flex items-center justify-center">
                <Store className="h-8 w-8 text-violet-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-white">{shop.storeName}</h1>
                  <span className="text-xs uppercase tracking-wide px-2.5 py-1 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    BizneAI
                  </span>
                </div>
                {typeLabel && <p className="text-lg text-gray-400 mt-1">{typeLabel}</p>}
                {shop.status && (
                  <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                    {shop.status}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4 text-sm text-gray-300">
              {(shop.fullAddress || shop.streetAddress) && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />
                  <span>
                    {shop.fullAddress ||
                      [shop.streetAddress, shop.city, shop.state].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              {(shop as { phone?: string; whatsapp?: string }).phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400 shrink-0" />
                  <span>{(shop as { phone: string }).phone}</span>
                </div>
              )}
              {(shop as { whatsapp?: string }).whatsapp && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400 shrink-0" />
                  <span>WhatsApp: {(shop as { whatsapp: string }).whatsapp}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-8">
              Datos proporcionados por{' '}
              <a
                href="https://bizneai.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:text-violet-300"
              >
                BizneAI
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
