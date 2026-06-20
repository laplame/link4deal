/** Métricas de influencer tal como las devuelve GET /api/influencers (con enrich). */

export interface CouponStats {
  totalCoupons: number;
  activeCoupons: number;
  /** En la API enriquecida: cantidad de cupones redimidos (canjes). */
  totalSales: number;
  /** Comisión acumulada estimada en USD. */
  totalCommission: number;
  averageConversion: number;
}

export interface MarketplacePromotionRow {
  id: string;
  brand: string;
  title: string;
  date: string;
  status: 'completed' | 'active' | 'pending' | string;
  earnings: number;
  couponCode: string;
  couponUsage: number;
  totalSales: number;
}

export interface MarketplaceInfluencer {
  id: string;
  name: string;
  username: string;
  avatar: string;
  followers: {
    instagram: number;
    tiktok: number;
    youtube: number;
    twitter: number;
  };
  totalFollowers: number;
  engagement: number;
  categories: string[];
  status: string;
  joinDate: string;
  totalEarnings: number;
  monthlyEarnings: number;
  completedPromotions: number;
  activePromotions: number;
  rating: number;
  location: string;
  bio: string;
  socialMedia: Record<string, string | undefined>;
  recentPromotions: MarketplacePromotionRow[];
  couponStats: CouponStats;
  hot?: boolean;
  featured?: boolean;
  redeemedCoupons?: number;
  publicSlug?: string;
}

function safeNum(n: unknown, fallback = 0): number {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

/** Normaliza un documento de la API para las cards del marketplace. */
export function normalizeMarketplaceInfluencer(raw: Record<string, unknown>): MarketplaceInfluencer {
  const followers = {
    instagram: safeNum((raw.followers as { instagram?: number })?.instagram),
    tiktok: safeNum((raw.followers as { tiktok?: number })?.tiktok),
    youtube: safeNum((raw.followers as { youtube?: number })?.youtube),
    twitter: safeNum((raw.followers as { twitter?: number })?.twitter),
  };
  const followersSum = Object.values(followers).reduce((a, b) => a + b, 0);
  const cs = (raw.couponStats as Partial<CouponStats>) || {};
  const couponStats: CouponStats = {
    totalCoupons: safeNum(cs.totalCoupons),
    activeCoupons: safeNum(cs.activeCoupons),
    totalSales: safeNum(cs.totalSales),
    totalCommission: safeNum(cs.totalCommission),
    averageConversion: safeNum(cs.averageConversion),
  };

  const recentRaw = Array.isArray(raw.recentPromotions) ? raw.recentPromotions : [];
  const recentPromotions: MarketplacePromotionRow[] = recentRaw.map((p, i) => {
    const row = p as Record<string, unknown>;
    return {
      id: String(row.id || i),
      brand: String(row.brand || ''),
      title: String(row.title || 'Promoción'),
      date: String(row.date || ''),
      status: String(row.status || 'pending'),
      earnings: safeNum(row.earnings),
      couponCode: String(row.couponCode || ''),
      couponUsage: safeNum(row.couponUsage),
      totalSales: safeNum(row.totalSales),
    };
  });

  return {
    id: String(raw.id || ''),
    name: String(raw.name || 'Influencer'),
    username: String(raw.username || '').trim() || `@${String(raw.name || 'user').toLowerCase().replace(/\s+/g, '')}`,
    avatar: String(raw.avatar || ''),
    followers,
    totalFollowers: safeNum(raw.totalFollowers) > 0 ? safeNum(raw.totalFollowers) : followersSum,
    engagement: safeNum(raw.engagement),
    categories: Array.isArray(raw.categories) ? (raw.categories as string[]) : [],
    status: String(raw.status || 'pending'),
    joinDate: String(raw.joinDate || ''),
    totalEarnings: safeNum(raw.totalEarnings),
    monthlyEarnings: safeNum(raw.monthlyEarnings),
    completedPromotions: safeNum(raw.completedPromotions),
    activePromotions: safeNum(raw.activePromotions),
    rating: safeNum(raw.rating),
    location: String(raw.location || ''),
    bio: String(raw.bio || ''),
    socialMedia: (raw.socialMedia as Record<string, string | undefined>) || {},
    recentPromotions,
    couponStats,
    hot: Boolean(raw.hot),
    featured: Boolean(raw.featured),
    redeemedCoupons: safeNum(raw.redeemedCoupons, couponStats.totalSales),
    publicSlug: String(raw.publicSlug || ''),
  };
}

export function formatFollowersCount(n: number): string {
  const v = safeNum(n);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}

export function formatUsdAmount(n: number): string {
  const v = safeNum(n);
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 10_000) return `$${(v / 1_000).toFixed(1)}K`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(2)}K`;
  return `$${v.toLocaleString('es', { maximumFractionDigits: 2 })}`;
}

/** Canjes / redenciones QR (no confundir con ventas en pesos). */
export function formatRedemptionCount(n: number): string {
  const v = Math.round(safeNum(n));
  return v === 1 ? '1 canje' : `${v.toLocaleString('es')} canjes`;
}

export function socialPlatformsWithFollowers(
  followers: MarketplaceInfluencer['followers'],
): { platform: string; count: number }[] {
  return (Object.entries(followers) as [string, number][])
    .filter(([, count]) => safeNum(count) > 0)
    .map(([platform, count]) => ({ platform, count: safeNum(count) }));
}
