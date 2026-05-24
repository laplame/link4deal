import type { BizneShop } from '../components/BizneShopCard';

const STORAGE_KEY = 'damecodigo.brandSetupBizneShop';

export type BrandSetupBiznePayload = {
  shopId: string;
  shop: BizneShop;
  savedAt: number;
};

export function persistBrandSetupBizneShop(shopId: string, shop: BizneShop): void {
  try {
    const payload: BrandSetupBiznePayload = { shopId, shop, savedAt: Date.now() };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota */
  }
}

export function readBrandSetupBizneShop(): BrandSetupBiznePayload | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BrandSetupBiznePayload;
    if (!parsed?.shopId || !parsed?.shop?.storeName) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearBrandSetupBizneShop(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function humanizeBizneStoreType(type?: string): string {
  if (!type) return '';
  return type
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

/** Rellena campos vacíos del formulario de marca con datos de BizneAI. */
export function prefillBrandFormFromBizneShop<T extends {
  companyName: string;
  industry: string;
  headquarters: string;
  description: string;
}>(prev: T, shop: BizneShop): T {
  const address =
    shop.fullAddress ||
    shop.storeLocation ||
    [shop.streetAddress, shop.city, shop.state].filter(Boolean).join(', ');
  const industry = humanizeBizneStoreType(shop.storeType);
  const name = String(shop.storeName || '').trim();

  return {
    ...prev,
    companyName: prev.companyName.trim() || name,
    industry: prev.industry.trim() || industry,
    headquarters: prev.headquarters.trim() || address,
    description:
      prev.description.trim() ||
      (name ? `${name} — tienda vinculada desde BizneAI en DameCodigo.` : prev.description),
  };
}
