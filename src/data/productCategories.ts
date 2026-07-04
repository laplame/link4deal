import catalog from './productCategories.json';

export interface MarketplaceCategory {
  id: string;
  slug: string;
  slugAliases?: string[];
  name: string;
  subcategories: string[];
  description: string;
  image: string;
  imageAlt: string;
  accent: string;
  /** Contador opcional para badges en la UI */
  productCount?: number;
}

export const MARKETPLACE_CATEGORIES: MarketplaceCategory[] = catalog.categories;

export function resolveCategoryBySlug(slug: string): MarketplaceCategory | undefined {
  const key = String(slug || '').trim().toLowerCase();
  if (!key) return undefined;
  return MARKETPLACE_CATEGORIES.find(
    (c) => c.id === key || c.slug === key || (c.slugAliases || []).includes(key),
  );
}

export const MARKETPLACE_CATEGORIES_BY_SLUG: Record<string, MarketplaceCategory> = Object.fromEntries(
  MARKETPLACE_CATEGORIES.flatMap((c) => [
    [c.id, c],
    [c.slug, c],
    ...(c.slugAliases || []).map((alias) => [alias, c] as const),
  ]),
);

/** Opciones para selects de formularios (id + etiqueta ES). */
export const PRODUCT_CATEGORY_OPTIONS = MARKETPLACE_CATEGORIES.filter((c) => c.id !== 'other').map(
  (c) => ({ value: c.id, label: c.name }),
);

export const PRODUCT_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  MARKETPLACE_CATEGORIES.map((c) => [c.id, c.name]),
);

export function getProductCategoryLabel(id: string): string {
  return PRODUCT_CATEGORY_LABELS[id] || resolveCategoryBySlug(id)?.name || id;
}

/** Slug de URL preferido (inglés canónico). */
export function getCategoryUrlSlug(id: string): string {
  return resolveCategoryBySlug(id)?.slug || id;
}
