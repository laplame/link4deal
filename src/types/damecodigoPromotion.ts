/** Documento promoción DameCodigo (docs[] en GET /api/promotions?shopId=). */
export interface DamecodigoPromotionDoc {
  _id?: string;
  id?: string;
  title?: string;
  productName?: string;
  description?: string;
  status?: string;
  offerType?: string;
  discountPercentage?: number;
  cashbackValue?: number | null;
  validFrom?: string;
  validUntil?: string;
  shopId?: string;
  allowedShopIds?: string[];
  allowedProductIds?: string[];
  images?: { cloudinaryUrl?: string; url?: string }[];
}

export function promotionPublicId(p: DamecodigoPromotionDoc): string {
  return String(p._id || p.id || '');
}

export function promotionDetailUrl(p: DamecodigoPromotionDoc): string {
  const id = promotionPublicId(p);
  return id ? `https://www.damecodigo.com/promotion-details/${id}` : '';
}
