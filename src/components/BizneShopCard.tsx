import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, Store } from 'lucide-react';

/** Tienda devuelta por el proxy /api/bizne-shops (BizneAI). */
export interface BizneShop {
  _id?: string;
  id?: string;
  storeName: string;
  storeType?: string;
  storeLocation?: string;
  fullAddress?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  latitude?: number | string;
  longitude?: number | string;
  gpsLocation?: {
    type?: string;
    coordinates?: [number, number] | number[];
  };
  status?: string;
  ecommerceEnabled?: boolean;
  isModelShop?: boolean;
}

export function getBizneShopCoordinates(shop?: BizneShop | null): { latitude: number; longitude: number } | null {
  if (!shop) return null;
  const directLat = typeof shop.latitude === 'number' ? shop.latitude : Number.parseFloat(String(shop.latitude ?? ''));
  const directLng = typeof shop.longitude === 'number' ? shop.longitude : Number.parseFloat(String(shop.longitude ?? ''));
  if (Number.isFinite(directLat) && Number.isFinite(directLng)) {
    return { latitude: directLat, longitude: directLng };
  }

  const coords = shop.gpsLocation?.coordinates;
  if (Array.isArray(coords) && coords.length >= 2) {
    const [lng, lat] = coords;
    const gpsLat = Number(lat);
    const gpsLng = Number(lng);
    if (Number.isFinite(gpsLat) && Number.isFinite(gpsLng)) {
      return { latitude: gpsLat, longitude: gpsLng };
    }
  }

  return null;
}

function humanizeStoreType(type?: string): string {
  if (!type) return '';
  return type
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

interface Props {
  shop: BizneShop;
}

export function BizneShopCard({ shop }: Props) {
  const navigate = useNavigate();
  const shopId = shop.id || shop._id || '';
  const typeLabel = humanizeStoreType(shop.storeType);
  const coords = getBizneShopCoordinates(shop);

  const goToProfile = () => {
    if (!shopId) return;
    navigate(`/shop/bizne/${shopId}`, { state: { shop } });
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goToProfile}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goToProfile();
        }
      }}
      className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-violet-500/50 hover:ring-1 hover:ring-violet-500/30 transition-all p-4 cursor-pointer text-left"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-violet-900/40 flex items-center justify-center">
          <Store className="h-6 w-6 text-violet-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-semibold text-white truncate">{shop.storeName}</h3>
            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 shrink-0">
              BizneAI
            </span>
          </div>
          {typeLabel && (
            <p className="text-sm text-gray-400 mt-0.5">{typeLabel}</p>
          )}
          {shop.storeLocation && (
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <Building2 className="h-3 w-3 shrink-0" />
              {shop.storeLocation}
            </p>
          )}
          {shop.fullAddress && (
            <p className="text-sm text-gray-500 mt-2 line-clamp-2 flex items-start gap-1">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-gray-600" />
              <span>{shop.fullAddress}</span>
            </p>
          )}
          {shop.ecommerceEnabled && (
            <p className="text-xs text-green-400/90 mt-2">E-commerce habilitado</p>
          )}
          {coords && (
            <p
              className="text-xs text-violet-300/90 mt-2"
              title={`${coords.latitude}, ${coords.longitude}`}
            >
              GPS disponible para promociones
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
