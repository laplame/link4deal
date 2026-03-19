import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Globe, DollarSign, MapPin, Tag } from 'lucide-react';
import type { RegisteredBrand } from '../components/RegisteredBrandCard';

export default function BrandProfilePage() {
  const { brandId } = useParams<{ brandId: string }>();
  const [brand, setBrand] = useState<RegisteredBrand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!brandId) {
      setError('ID no válido');
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetch(`/api/brands/${brandId}`)
      .then(res => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Marca no encontrada' : 'Error al cargar');
        return res.json();
      })
      .then(data => {
        if (!cancelled && data?.success && data.data) {
          setBrand(data.data);
        } else if (!cancelled) {
          setError('No se pudo cargar la marca');
        }
      })
      .catch(() => {
        if (!cancelled) setError('No se pudo cargar la marca');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [brandId]);

  const budget = brand?.marketingBudget;
  const hasBudget = budget && (Number(budget.min) > 0 || Number(budget.max) > 0);
  const budgetLabel = hasBudget
    ? `$${Number(budget?.min || 0)} - $${Number(budget?.max || 0)} ${budget?.currency || 'USD'}`
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Cargando...</p>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-12">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-gray-400 mb-6">{error || 'Marca no encontrada'}</p>
          <Link
            to="/brands"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a marcas y negocios
          </Link>
        </div>
      </div>
    );
  }

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
              <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gray-700 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-white">{brand.companyName}</h1>
                {brand.industry && (
                  <p className="text-lg text-gray-400 mt-1">{brand.industry}</p>
                )}
                {brand.status && (
                  <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                    {brand.status}
                  </span>
                )}
              </div>
            </div>

            {brand.description && (
              <p className="text-gray-300 leading-relaxed mb-6">{brand.description}</p>
            )}

            <div className="space-y-4 text-sm">
              {brand.website && (
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                  <a
                    href={brand.website.startsWith('http') ? brand.website : `https://${brand.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 break-all"
                  >
                    {brand.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {brand.headquarters && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                  <span className="text-gray-300">{brand.headquarters}</span>
                </div>
              )}
              {Array.isArray(brand.categories) && brand.categories.length > 0 && (
                <div className="flex items-start gap-3">
                  <Tag className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                  <div className="flex flex-wrap gap-2">
                    {brand.categories.map((c) => (
                      <span
                        key={c}
                        className="px-2.5 py-1 rounded-lg bg-gray-700 text-gray-200 text-xs"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {hasBudget && budgetLabel && (
                <div className="flex items-center gap-3 text-green-400">
                  <DollarSign className="h-5 w-5 shrink-0" />
                  <span>{budgetLabel}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
