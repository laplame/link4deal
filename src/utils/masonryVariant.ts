export type MasonryTier = 0 | 1 | 2 | 3;

/**
 * Deterministic tier from id (+ optional index) for varied card heights in masonry layouts.
 */
export function masonryTierFromId(id: string, index = 0): MasonryTier {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  const n = ((h ^ index * 17) % 4 + 4) % 4;
  return n as MasonryTier;
}

/** ProductCard hero image heights */
export const PRODUCT_CARD_IMAGE_BY_TIER: Record<MasonryTier, string> = {
  0: 'h-48 min-h-[12rem]',
  1: 'h-60 min-h-[15rem]',
  2: 'h-72 min-h-[18rem]',
  3: 'h-80 min-h-[20rem]',
};

/** Marketplace promo image heights */
export const MARKETPLACE_IMAGE_BY_TIER: Record<MasonryTier, string> = {
  0: 'h-40 min-h-[10rem]',
  1: 'h-48 min-h-[12rem]',
  2: 'h-56 min-h-[14rem]',
  3: 'h-64 min-h-[16rem]',
};

export const CARD_ROUNDED_BY_TIER: Record<MasonryTier, string> = {
  0: 'rounded-xl',
  1: 'rounded-xl',
  2: 'rounded-2xl',
  3: 'rounded-2xl',
};

export function contentPaddingByTier(tier: MasonryTier): string {
  if (tier === 0) return 'p-4';
  if (tier === 1) return 'p-5';
  return 'p-6';
}

/** Slightly taller visuals for highlighted promos (capped). */
export function marketplaceMasonryTier(p: { id: string; hot?: boolean; featured?: boolean }, index: number): MasonryTier {
  const base = masonryTierFromId(p.id, index);
  if (p.featured || p.hot) {
    const bumped = Math.min(3, base + 1) as MasonryTier;
    return bumped;
  }
  return base;
}
