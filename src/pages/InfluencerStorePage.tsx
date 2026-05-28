import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, LayoutGrid, Loader2, User } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { apiUrl } from '../utils/apiUrl';
import { fetchInfluencerByPublicSlug } from '../utils/fetchInfluencerByPublicSlug';
import {
  mapInfluencerAvailableRowToProductCard,
  type InfluencerAvailableProductApiRow,
} from '../utils/mapPromotionToProductCard';
import { masonryTierFromId } from '../utils/masonryVariant';

type InfluencerLite = {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  profileShortCode?: string;
};

export default function InfluencerStorePage() {
  const { influencerSlug } = useParams();
  const [influencer, setInfluencer] = useState<InfluencerLite | null>(null);
  const [loadingInfluencer, setLoadingInfluencer] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rows, setRows] = useState<InfluencerAvailableProductApiRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);

  const products = useMemo(() => rows.map(mapInfluencerAvailableRowToProductCard), [rows]);

  useEffect(() => {
    if (!influencerSlug) {
      setError('Influencer no encontrado');
      setInfluencer(null);
      setLoadingInfluencer(false);
      return;
    }

    let cancelled = false;
    setLoadingInfluencer(true);
    setError(null);
    setInfluencer(null);

    (async () => {
      try {
        const result = await fetchInfluencerByPublicSlug(influencerSlug);
        if (cancelled) return;
        if (!result.ok) {
          setError(result.message);
          setInfluencer(null);
          return;
        }
        const d = result.data;
        setInfluencer({
          id: String(d.id || ''),
          name: String(d.name || ''),
          username: typeof d.username === 'string' ? d.username : undefined,
          avatar: typeof d.avatar === 'string' ? d.avatar : undefined,
          profileShortCode: typeof d.profileShortCode === 'string' ? d.profileShortCode : undefined,
        });
      } catch {
        if (!cancelled) setError('No se pudo conectar con el API.');
      } finally {
        if (!cancelled) setLoadingInfluencer(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [influencerSlug]);

  useEffect(() => {
    if (!influencer?.id) {
      setRows([]);
      return;
    }
    let cancelled = false;
    setLoadingRows(true);
    fetch(apiUrl(`/api/influencers/${influencer.id}/available-products`))
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.success && Array.isArray(data.data)) {
          setRows(data.data as InfluencerAvailableProductApiRow[]);
        } else {
          setRows([]);
        }
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingRows(false);
      });

    return () => {
      cancelled = true;
    };
  }, [influencer?.id]);

  if (loadingInfluencer) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-center gap-2 text-gray-700">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          Cargando tienda del influencer…
        </div>
      </div>
    );
  }

  if (error || !influencer?.id) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-red-800">
          {error || 'Influencer no encontrado'}
        </div>
        <div className="mt-4">
          <Link
            to="/influencers"
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Volver a influencers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to={`/influencer/${encodeURIComponent(influencerSlug || '')}`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Volver al perfil
          </Link>
          <div className="flex items-center gap-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
              <User className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 leading-tight">
                Tienda de {influencer.name || influencer.username || 'influencer'}
              </h1>
              <p className="text-xs text-gray-500">
                Cupones disponibles (aprobados por la marca) para este influencer
                {influencer.profileShortCode ? (
                  <>
                    {' '}
                    · Código: <code className="rounded bg-gray-100 px-1 font-mono">{influencer.profileShortCode}</code>
                  </>
                ) : null}
              </p>
            </div>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-800">
          <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
          {loadingRows ? 'Cargando…' : `${products.length} oferta(s)`}
        </div>
      </div>

      {loadingRows ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50/80 py-12 text-gray-700">
          <Loader2 className="h-5 w-5 animate-spin text-purple-600" aria-hidden />
          Cargando ofertas…
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/80 py-12 px-4 text-center">
          <p className="mb-1 text-gray-700">Aún no hay cupones disponibles en esta tienda.</p>
          <p className="text-sm text-gray-500">
            Cuando una marca apruebe una campaña y esté activa/vigente, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 xl:columns-3 gap-6 [column-fill:_balance]">
          {rows.map((row, index) => {
            const product = products[index];
            if (!product) return null;
            return (
              <div key={row.cardKey} className="break-inside-avoid mb-6">
                <ProductCard product={product} masonryTier={masonryTierFromId(product.id, index)} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

