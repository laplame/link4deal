import { Link } from 'react-router-dom';
import { Building2, CheckCircle, MapPin, Store } from 'lucide-react';
import type { BizneShop } from '../BizneShopCard';
import { getBizneShopCoordinates } from '../BizneShopCard';

function humanizeStoreType(type?: string): string {
  if (!type) return '';
  return type
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

interface Props {
  shop: BizneShop;
  shopId: string;
  className?: string;
}

/** Ficha de tienda BizneAI tras validar shopId (registro de marca, panel, etc.). */
export function BizneShopValidatedPanel({ shop, shopId, className = '' }: Props) {
  const publicId = shop.id || shop._id || shopId;
  const typeLabel = humanizeStoreType(shop.storeType);
  const coords = getBizneShopCoordinates(shop);
  const address = shop.fullAddress || shop.storeLocation || [shop.streetAddress, shop.city, shop.state].filter(Boolean).join(', ');

  return (
    <section
      className={`rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 ${className}`}
      aria-label="Tienda BizneAI validada"
    >
      <div className="flex items-start gap-2 mb-4">
        <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
        <div>
          <h3 className="text-base font-semibold text-emerald-900">Tienda verificada en BizneAI</h3>
          <p className="text-xs text-emerald-800 mt-0.5">
            Estos datos se vincularán a tu registro de marca en DameCodigo.
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="shrink-0 w-12 h-12 rounded-lg bg-violet-100 flex items-center justify-center">
          <Store className="h-6 w-6 text-violet-700" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-lg font-semibold text-gray-900">{shop.storeName}</p>
          {typeLabel && (
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <Building2 className="h-4 w-4 shrink-0 text-gray-400" />
              {typeLabel}
            </p>
          )}
          {shop.storeLocation && shop.storeLocation !== address && (
            <p className="text-sm text-gray-600">{shop.storeLocation}</p>
          )}
          {address && (
            <p className="text-sm text-gray-700 flex items-start gap-1.5">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-gray-500" />
              <span>{address}</span>
            </p>
          )}
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs pt-2 border-t border-emerald-100">
            <div>
              <dt className="text-gray-500">shopId</dt>
              <dd className="font-mono text-gray-800 break-all">{shopId}</dd>
            </div>
            {shop.status && (
              <div>
                <dt className="text-gray-500">Estado</dt>
                <dd className="text-gray-800 capitalize">{shop.status}</dd>
              </div>
            )}
            {shop.ecommerceEnabled != null && (
              <div>
                <dt className="text-gray-500">E-commerce</dt>
                <dd className="text-gray-800">{shop.ecommerceEnabled ? 'Sí' : 'No'}</dd>
              </div>
            )}
            {coords && (
              <div className="sm:col-span-2">
                <dt className="text-gray-500">Ubicación GPS</dt>
                <dd className="font-mono text-gray-700">
                  {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
                </dd>
              </div>
            )}
          </dl>
          {publicId && (
            <Link
              to={`/shop/bizne/${encodeURIComponent(String(publicId))}`}
              className="inline-block text-sm font-medium text-violet-700 hover:underline mt-2"
            >
              Ver perfil público en DameCodigo
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
