/** ObjectId Mongo / BizneAI (24 hex), ej. 691a59f9529b1c88366b342c */
export function isValidBizneShopObjectId(id: string): boolean {
  return /^[a-f0-9]{24}$/i.test(String(id || '').trim());
}

export function normalizeBizneShopId(id: string): string {
  const s = String(id || '').trim();
  return isValidBizneShopObjectId(s) ? s.toLowerCase() : '';
}
