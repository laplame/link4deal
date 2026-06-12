import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  CheckCircle,
  ExternalLink,
  Loader2,
  MapPin,
  Settings,
  Store,
  Target,
  Tag,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../utils/apiUrl';
import { BizneAiBrandOnboardingCard } from '../../components/brand/BizneAiBrandOnboardingCard';
import { BizneShopIdLinker } from '../../components/brand/BizneShopIdLinker';
import type { BizneShop } from '../../components/BizneShopCard';
import { SITE_CONFIG } from '../../config/site';
import type { RegisteredBrand } from '../../components/RegisteredBrandCard';
import { isValidBizneShopObjectId, normalizeBizneShopId } from '../../utils/bizneShopId';
import { persistBrandSetupBizneShop } from '../../utils/brandSetupBizneShop';
import type { DamecodigoPromotionDoc } from '../../types/damecodigoPromotion';
import { promotionPublicId } from '../../types/damecodigoPromotion';

type BrandMePayload = {
  brand: RegisteredBrand & { bizneShopId?: string; bizneShopName?: string; bizneLinkedAt?: string };
  bizneShop: BizneShop | null;
};

export default function BrandOwnerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missingProfile, setMissingProfile] = useState(false);
  const [payload, setPayload] = useState<BrandMePayload | null>(null);
  const [shopIdInput, setShopIdInput] = useState('');
  const [pendingShopId, setPendingShopId] = useState('');
  const [validatedShop, setValidatedShop] = useState<BizneShop | null>(null);
  const [registerHint, setRegisterHint] = useState<string | null>(null);
  const [promos, setPromos] = useState<DamecodigoPromotionDoc[]>([]);
  const [promosLoading, setPromosLoading] = useState(false);
  const [promosError, setPromosError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Inicia sesión para ver tu panel de marca.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setMissingProfile(false);
    try {
      const res = await fetch(apiUrl('/api/brands/me'), {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 404 && data?.code === 'BRAND_PROFILE_MISSING') {
        setMissingProfile(true);
        setPayload(null);
        return;
      }
      if (!res.ok || !data?.success) {
        setError(typeof data?.message === 'string' ? data.message : 'No se pudo cargar tu marca');
        return;
      }
      setPayload(data.data as BrandMePayload);
      setShopIdInput(String(data.data?.brand?.bizneShopId || ''));
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadPromotions = useCallback(async (shopId: string) => {
    const token = localStorage.getItem('auth_token');
    if (!token || !shopId) return;
    setPromosLoading(true);
    setPromosError(null);
    try {
      const q = new URLSearchParams({
        status: 'all',
        limit: '30',
        page: '1',
      });
      const res = await fetch(apiUrl(`/api/brands/me/promotions?${q}`), {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setPromos([]);
        setPromosError(typeof data?.message === 'string' ? data.message : 'No se pudieron cargar cupones');
        return;
      }
      const docs = Array.isArray(data.data?.docs) ? data.data.docs : [];
      setPromos(docs as DamecodigoPromotionDoc[]);
    } catch {
      setPromos([]);
      setPromosError('Error de conexión al listar promociones');
    } finally {
      setPromosLoading(false);
    }
  }, []);

  useEffect(() => {
    const sid = payload?.brand?.bizneShopId?.trim();
    if (sid && isValidBizneShopObjectId(sid)) {
      loadPromotions(sid);
    } else {
      setPromos([]);
    }
  }, [payload?.brand?.bizneShopId, loadPromotions]);

  const brand = payload?.brand;
  const shop = payload?.bizneShop;
  const shopPublicId = shop?._id || shop?.id || brand?.bizneShopId;

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-violet-600" aria-hidden />
      </div>
    );
  }

  if (missingProfile) {
    const shopIdForSetup = normalizeBizneShopId(pendingShopId) || pendingShopId.trim();
    const setupHref = shopIdForSetup
      ? `/brands/setup?bizneShopId=${encodeURIComponent(shopIdForSetup)}`
      : '/brands/setup';
    const canGoToSetup = Boolean(validatedShop && shopIdForSetup);
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <BizneAiBrandOnboardingCard className="mb-6" />
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Obtén tu shopId desde BizneAI</h2>
          <p className="text-sm text-gray-600 mb-4">
            Pega la URL de tu negocio en bizneai.com; extraemos el ID automáticamente para el registro.
          </p>
          <BizneShopIdLinker
            shopId={pendingShopId}
            onShopIdChange={(id) => {
              setPendingShopId(id);
              setValidatedShop(null);
              setRegisterHint(null);
            }}
            persistToAccount={false}
            onLinked={({ shopId, shop }) => {
              if (shop) {
                setValidatedShop(shop);
                persistBrandSetupBizneShop(shopId, shop);
                setRegisterHint(null);
              }
            }}
          />
        </section>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <Building2 className="h-10 w-10 text-amber-600 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Completa tu registro de marca</h1>
          <p className="text-gray-600 mb-4 text-sm">
            Aún no tienes ficha de marca en DameCodigo. Regístrate y vincula tu tienda BizneAI.
          </p>
          {registerHint && <p className="text-sm text-amber-800 mb-3">{registerHint}</p>}
          {canGoToSetup ? (
            <Link
              to={setupHref}
              state={{ bizneShop: validatedShop, bizneShopId: shopIdForSetup }}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 text-white px-5 py-2.5 font-medium hover:bg-violet-700"
            >
              Registrar mi marca
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (!shopIdForSetup) {
                  setRegisterHint('Primero extrae o indica el shopId de tu tienda BizneAI.');
                  return;
                }
                setRegisterHint('Pulsa «Validar tienda» arriba para cargar los datos antes de continuar.');
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 text-white px-5 py-2.5 font-medium hover:bg-violet-700 opacity-90"
            >
              Registrar mi marca
            </button>
          )}
        </div>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-red-600 mb-4">{error || 'Sin datos de marca'}</p>
        <button type="button" onClick={load} className="text-violet-700 font-medium underline">
          Reintentar
        </button>
      </div>
    );
  }

  const shopIdLinked = Boolean(brand.bizneShopId?.trim() && isValidBizneShopObjectId(brand.bizneShopId));
  const shopResolved = Boolean(shop);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/dashboard" className="text-gray-500 hover:text-gray-800 shrink-0">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 truncate">{brand.companyName}</h1>
              <p className="text-sm text-gray-600">
                Panel de marca · {user?.firstName} {user?.lastName}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              shopIdLinked ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
            }`}
          >
            {shopIdLinked ? <CheckCircle className="h-3.5 w-3.5" /> : <Store className="h-3.5 w-3.5" />}
            {shopIdLinked ? 'shopId BizneAI vinculado' : 'Pendiente shopId BizneAI'}
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {!shopIdLinked && <BizneAiBrandOnboardingCard />}

        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Vincular tienda BizneAI</h2>
          <p className="text-sm text-gray-600 mb-4">
            Pega la <strong>URL</strong> de tu negocio en bizneai.com o el shopId (24 hex). Mismo id que en{' '}
            <code className="text-xs bg-gray-100 px-1 rounded">POST /api/promotions</code> y verify/redeem.
          </p>
          <BizneShopIdLinker
            shopId={shopIdInput}
            onShopIdChange={setShopIdInput}
            persistToAccount
            onLinked={() => {
              void load();
            }}
          />
        </section>

        {shopIdLinked && (
          <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Tu tienda en BizneAI</h2>
            {shopResolved && shop ? (
              <>
            <p className="text-xl font-medium text-gray-900">{shop.storeName}</p>
            {shop.storeType && <p className="text-sm text-gray-500 capitalize">{shop.storeType}</p>}
            {(shop.fullAddress || shop.storeLocation) && (
              <p className="text-sm text-gray-600 mt-2 flex items-start gap-1">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                {shop.fullAddress || shop.storeLocation}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-2 font-mono">shopId: {brand.bizneShopId}</p>
            <div className="flex flex-wrap gap-3 mt-4">
              {shopPublicId && (
                <Link
                  to={`/shop/bizne/${encodeURIComponent(String(shopPublicId))}`}
                  className="text-sm font-medium text-violet-700 hover:underline"
                >
                  Ver perfil público en DameCodigo
                </Link>
              )}
              <a
                href={SITE_CONFIG.bizneAiWebsiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 inline-flex items-center gap-1"
              >
                Abrir BizneAI
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
              </>
            ) : (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
                shopId guardado (<span className="font-mono">{brand.bizneShopId}</span>). No se pudo refrescar la
                ficha desde BizneAI; los cupones de DameCodigo siguen listándose por ese id.
              </p>
            )}
          </section>
        )}

        {shopIdLinked && (
          <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Tag className="h-5 w-5 text-violet-600" />
                Cupones DameCodigo (shopId)
              </h2>
              <Link
                to={`/quick-promotion?shopId=${encodeURIComponent(brand.bizneShopId || '')}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 text-white text-sm font-medium px-3 py-2 hover:bg-violet-700"
              >
                <Plus className="h-4 w-4" />
                Nueva promoción
              </Link>
            </div>
            <p className="text-xs text-gray-500 mb-4 font-mono">
              GET /api/promotions?shopId={brand.bizneShopId} — mismo criterio que la app BizneAI
            </p>
            {promosLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
              </div>
            )}
            {promosError && !promosLoading && (
              <p className="text-sm text-red-600">{promosError}</p>
            )}
            {!promosLoading && !promosError && promos.length === 0 && (
              <p className="text-sm text-gray-600">
                Aún no hay promociones con este shopId. Publícalas desde la app BizneAI o desde «Nueva promoción».
              </p>
            )}
            {!promosLoading && promos.length > 0 && (
              <ul className="divide-y divide-gray-100">
                {promos.map((p) => {
                  const pid = promotionPublicId(p);
                  return (
                    <li key={pid} className="py-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{p.title || p.productName || 'Sin título'}</p>
                        <p className="text-xs text-gray-500">
                          {p.status || '—'}
                          {p.discountPercentage != null ? ` · ${p.discountPercentage}%` : ''}
                          {p.validUntil ? ` · hasta ${String(p.validUntil).slice(0, 10)}` : ''}
                        </p>
                      </div>
                      {pid && (
                        <Link
                          to={`/promotion-details/${pid}`}
                          className="text-sm font-medium text-violet-700 hover:underline shrink-0"
                        >
                          Ver detalle
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            to="/brands/aplicaciones"
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-violet-300 hover:shadow-md transition-all"
          >
            <Target className="h-8 w-8 text-violet-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Postulaciones de influencers</h3>
            <p className="text-sm text-gray-600 mt-1">Revisa candidatos a tus campañas</p>
          </Link>
          <Link
            to="/admin/promotions"
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-violet-300 hover:shadow-md transition-all"
          >
            <Settings className="h-8 w-8 text-violet-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Promociones</h3>
            <p className="text-sm text-gray-600 mt-1">Gestiona ofertas y cupones</p>
          </Link>
        </div>

        <section className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-600">
          <h3 className="font-semibold text-gray-900 mb-2">Datos de tu marca</h3>
          <ul className="space-y-1">
            <li>
              <span className="text-gray-500">Industria:</span> {brand.industry || '—'}
            </li>
            <li>
              <span className="text-gray-500">Sede:</span> {brand.headquarters || '—'}
            </li>
            <li>
              <span className="text-gray-500">Estado:</span> {brand.status || 'pending'}
            </li>
          </ul>
          <Link to={`/brand/${brand._id}`} className="inline-block mt-3 text-violet-700 font-medium hover:underline">
            Ver ficha pública
          </Link>
        </section>
      </div>
    </div>
  );
}
