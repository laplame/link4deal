import { apiUrl } from '../utils/apiUrl';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface CrmAppsSlot {
  installCount: number;
  firstInstallAt: string | null;
  lastOpenAt: string | null;
  lastVersion: string;
  lastPlatform: string;
}

export interface CrmOutreachDelivery {
  id?: string;
  deliveryKey: string;
  type: string;
  typeLabel?: string;
  status: string;
  statusLabel?: string;
  channel: string;
  title: string;
  url: string;
  sentAt: string | null;
  notes: string;
}

export interface CrmOutreach {
  id: string;
  influencerId: string;
  publicSlug: string;
  pipelineStage: string;
  pipelineStageLabel: string;
  contactEmail: string;
  contactEmailStatus: string;
  profilePublicUrl: string;
  profileConfirmedAt: string | null;
  profileInDbAt: string | null;
  nextAction: string;
  conversationSummary: string;
  deliveries: CrmOutreachDelivery[];
}

export interface CrmInfluencerRow {
  id: string;
  name: string;
  username: string;
  avatar: string;
  status: string;
  identityVerificationStatus: 'pending' | 'approved' | 'rejected';
  hasVerificationScreenshot?: boolean;
  joinDate: string | null;
  profileShortCode: string;
  profileCompleteness: number;
  activationStatus: string;
  dataSubmissionStatus: string;
  terms: { accepted: boolean; acceptedAt: string | null; version: string };
  apps: {
    damecodigoInfluencer: CrmAppsSlot;
    bizneaiMerchant: CrmAppsSlot;
  };
  appsInstalledSummary: {
    damecodigoInfluencer: boolean;
    bizneaiMerchant: boolean;
    both: boolean;
    none: boolean;
  };
  onboardingStep: string;
  adminNotes: string;
  lastContactAt: string | null;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    isVerified: boolean;
    isActive: boolean;
  } | null;
  walletAddress: string | null;
  couponStats: Record<string, number>;
  activePromotions: number;
  completedPromotions: number;
  totalEarnings: number;
  redeemedCoupons: number;
  outreach?: CrmOutreach | null;
  outreachPipeline?: string | null;
  outreachPipelineLabel?: string | null;
  outreachPendingCount?: number;
}

export interface CrmInfluencerDetail extends CrmInfluencerRow {
  outreach?: CrmOutreach | null;
  bio: string;
  categories: string[];
  socialMedia: Record<string, string | undefined>;
  followers: Record<string, number>;
  ugcEnabled: boolean;
  verification?: {
    screenshotUrl?: string;
    screenshotUploadedAt?: string | null;
    note?: string;
    reviewedAt?: string | null;
    reviewedByAdminId?: string | null;
    adminDecisionNote?: string;
  } | null;
  recentPromotions: unknown[];
  events: {
    id: string;
    appKey: string;
    eventType: string;
    platform?: string;
    appVersion?: string;
    createdAt: string | null;
  }[];
}

export interface CrmStats {
  totalInfluencers: number;
  linkedToUser: number;
  termsAccepted: number;
  byInfluencerStatus: Record<string, number>;
  installsByApp: Record<string, number>;
  withDamecodigoApp: number;
  withBizneaiApp: number;
  withBothApps: number;
  pendingIdentityVerification: number;
}

/** Columnas del tablero pipeline (orden fijo en servidor). */
export const CRM_PIPELINE_STAGES: { id: string; label: string }[] = [
  { id: 'lead', label: 'Lead' },
  { id: 'contacted', label: 'Contactado' },
  { id: 'awaiting_contact_email', label: 'Esperando correo Gmail' },
  { id: 'profile_link_sent', label: 'Enlace perfil enviado' },
  { id: 'profile_confirmed', label: 'Perfil confirmado' },
  { id: 'in_database', label: 'En base de datos' },
  { id: 'app_link_sent', label: 'App enviada' },
  { id: 'terms_sent', label: 'Términos enviados' },
  { id: 'materials_complete', label: 'Materiales completos' },
  { id: 'onboarded', label: 'Onboarded' },
  { id: 'stalled', label: 'Estancado' },
  { id: 'inactive', label: 'Inactivo' },
];

export interface CrmPendingPromotionApplication {
  id: string;
  promotionTitle: string;
  redirectInsteadOfQr?: boolean;
  createdAt?: string | null;
}

export interface CrmPipelineCard {
  influencerId: string;
  name: string;
  username: string;
  avatar: string;
  profileShortCode: string;
  identityVerificationStatus: string;
  activationStatus: string;
  dataSubmissionStatus: string;
  profileCompleteness: number;
  redeemedCoupons: number;
  termsAccepted: boolean;
  damecodigoInstalls: number;
  bizneaiInstalls: number;
  pipelineStage: string;
  pipelineStageLabel: string;
  contactEmail: string;
  contactPhone: string;
  nextAction: string;
  outreachPendingCount: number;
  profilePublicUrl: string;
  publicSlug: string;
  updatedAt: string | null;
  pendingApplications?: CrmPendingPromotionApplication[];
  pendingApplicationCount?: number;
}

export interface CrmPipelineColumn {
  stage: string;
  label: string;
  cards: CrmPipelineCard[];
  /** Total en esta columna (todos los resultados filtrados, no solo la página). */
  totalInStage?: number;
}

export interface CrmPaginationMeta {
  page: number;
  limit: number;
  totalDocs: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CrmPipelineBoardData {
  columns: CrmPipelineColumn[];
  stages: { id: string; label: string }[];
  totalCards: number;
  pagination: CrmPaginationMeta;
  eligibilityNote?: string;
}

/** Columnas del tablero monetización (post-onboarding). */
export const CRM_MONETIZATION_STAGES: { id: string; label: string }[] = [
  { id: 'ready', label: 'Listo para monetizar' },
  { id: 'wallet_setup', label: 'Wallet / cuenta' },
  { id: 'seeking_campaigns', label: 'Buscando campañas' },
  { id: 'coupons_live', label: 'Cupones activos' },
  { id: 'first_redemption', label: 'Primer canje' },
  { id: 'payout_pending', label: 'Abono pendiente' },
  { id: 'payout_active', label: 'Abonos realizados' },
  { id: 'scaling', label: 'Escalando ingresos' },
  { id: 'stalled', label: 'Estancado' },
  { id: 'inactive', label: 'Inactivo monetización' },
];

export interface CrmLiveRedemption {
  couponId: string;
  promotionId: string | null;
  shopId: string | null;
  redeemedAt: string | null;
  shortCode: string | null;
}

export interface CrmInfluencerLiveActivity {
  redeemedCount: number;
  openCouponsCount: number;
  settlementPendingCount: number;
  settlementPendingUsd: number;
  settlementPaidCount: number;
  settlementPaidUsd: number;
  lastRedeemedAt: string | null;
  hasRecentActivity: boolean;
  recentRedemptions: CrmLiveRedemption[];
  suggestedMonetizationStage: string;
  suggestedMonetizationStageLabel: string;
  stageMismatch?: boolean;
  hasWallet?: boolean;
  activePromotions?: number;
  totalEarningsUsd?: number;
  fetchedAt: string;
}

export interface CrmMonetizationCard {
  influencerId: string;
  name: string;
  username: string;
  avatar: string;
  profileShortCode: string;
  identityVerificationStatus: string;
  activationStatus: string;
  profileCompleteness: number;
  totalEarnings: number;
  redeemedCoupons: number;
  activePromotions: number;
  hasWallet: boolean;
  openCouponsCount?: number;
  settlementPendingCount: number;
  settlementPendingUsd: number;
  settlementPaidCount: number;
  settlementPaidUsd: number;
  lastRedeemedAt?: string | null;
  hasRecentActivity?: boolean;
  suggestedMonetizationStage?: string;
  suggestedMonetizationStageLabel?: string;
  stageMismatch?: boolean;
  liveFetchedAt?: string;
  outreachStage: string;
  outreachStageLabel: string;
  monetizationStage: string;
  monetizationStageLabel: string;
  nextAction: string;
  publicSlug: string;
  profilePublicUrl: string;
  updatedAt: string | null;
  pendingApplications?: CrmPendingPromotionApplication[];
  pendingApplicationCount?: number;
}

export interface CrmMonetization {
  id: string;
  influencerId: string;
  monetizationStage: string;
  monetizationStageLabel: string;
  nextAction: string;
  notes: string;
  updatedAt: string | null;
}

export interface CrmListParams {
  page?: number;
  limit?: number;
  /** Alias explícito para tableros (misma semántica que page/limit). */
  boardPage?: number;
  boardLimit?: number;
  search?: string;
  status?: string;
  activationStatus?: string;
  dataSubmissionStatus?: string;
  termsAccepted?: 'true' | 'false';
  app?: 'damecodigo' | 'bizneai' | 'both' | 'none';
  identityVerificationStatus?: 'pending' | 'approved' | 'rejected';
  hasVerificationScreenshot?: 'true';
}

function appendCrmBoardQuery(q: URLSearchParams, params: CrmListParams) {
  const page = params.page ?? params.boardPage;
  const limit = params.limit ?? params.boardLimit;
  if (page) q.set('page', String(page));
  if (limit) q.set('limit', String(limit));
  if (params.search?.trim()) q.set('search', params.search.trim());
  if (params.status) q.set('status', params.status);
  if (params.activationStatus) q.set('activationStatus', params.activationStatus);
  if (params.dataSubmissionStatus) q.set('dataSubmissionStatus', params.dataSubmissionStatus);
  if (params.termsAccepted) q.set('termsAccepted', params.termsAccepted);
  if (params.app) q.set('app', params.app);
  if (params.identityVerificationStatus) {
    q.set('identityVerificationStatus', params.identityVerificationStatus);
  }
}

export async function fetchCrmPipelineBoard(params: CrmListParams = {}): Promise<CrmPipelineBoardData> {
  const q = new URLSearchParams();
  appendCrmBoardQuery(q, params);
  const res = await fetch(apiUrl(`/api/admin/crm/pipeline/board?${q}`), { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al cargar tablero pipeline');
  return data.data;
}

export async function moveCrmLeadStage(
  influencerId: string,
  pipelineStage: string,
): Promise<CrmOutreach> {
  return patchCrmOutreach(influencerId, { pipelineStage });
}

export async function fetchCrmMonetizationBoard(params: CrmListParams = {}): Promise<CrmPipelineBoardData> {
  const q = new URLSearchParams();
  appendCrmBoardQuery(q, params);
  const res = await fetch(apiUrl(`/api/admin/crm/monetization/board?${q}`), {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al cargar tablero monetización');
  return data.data;
}

export async function moveCrmMonetizationStage(
  influencerId: string,
  monetizationStage: string,
): Promise<CrmMonetization> {
  return patchCrmMonetization(influencerId, { monetizationStage });
}

export async function fetchCrmInfluencerLiveActivity(id: string): Promise<CrmInfluencerLiveActivity> {
  const res = await fetch(apiUrl(`/api/admin/crm/influencers/${id}/live-activity`), {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al cargar actividad en vivo');
  return data.data;
}

export async function fetchCrmMonetization(id: string): Promise<CrmMonetization> {
  const res = await fetch(apiUrl(`/api/admin/crm/influencers/${id}/monetization`), {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al cargar monetización');
  return data.data;
}

export async function patchCrmMonetization(
  id: string,
  body: Record<string, unknown>,
): Promise<CrmMonetization> {
  const res = await fetch(apiUrl(`/api/admin/crm/influencers/${id}/monetization`), {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al guardar monetización');
  return data.data;
}

export async function fetchCrmStats(): Promise<CrmStats> {
  const res = await fetch(apiUrl('/api/admin/crm/stats'), { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al cargar estadísticas CRM');
  return data.data;
}

export async function fetchCrmInfluencers(params: CrmListParams = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  if (params.search) q.set('search', params.search);
  if (params.status) q.set('status', params.status);
  if (params.activationStatus) q.set('activationStatus', params.activationStatus);
  if (params.dataSubmissionStatus) q.set('dataSubmissionStatus', params.dataSubmissionStatus);
  if (params.termsAccepted) q.set('termsAccepted', params.termsAccepted);
  if (params.app) q.set('app', params.app);
  if (params.identityVerificationStatus) {
    q.set('identityVerificationStatus', params.identityVerificationStatus);
  }
  if (params.hasVerificationScreenshot === 'true') {
    q.set('hasVerificationScreenshot', 'true');
  }

  const res = await fetch(apiUrl(`/api/admin/crm/influencers?${q}`), { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al cargar influencers CRM');
  return data.data as {
    docs: CrmInfluencerRow[];
    totalDocs: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export async function fetchCrmInfluencerDetail(id: string): Promise<CrmInfluencerDetail> {
  const res = await fetch(apiUrl(`/api/admin/crm/influencers/${id}`), { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al cargar detalle');
  return data.data;
}

export type CrmRedirectPromotionApplication = {
  id: string;
  status: string;
  createdAt: string | null;
  promotion: {
    id: string;
    title: string;
    brand: string;
    status: string;
    validFrom: string | null;
    validUntil: string | null;
    redirectInsteadOfQr: boolean;
    redirectToUrl: string;
  } | null;
};

export type CrmRedirectPromotionBrief = CrmRedirectPromotionApplication['promotion'];

export type CrmRedirectApplicationsPack = {
  pending: CrmRedirectPromotionApplication[];
  approved: CrmRedirectPromotionApplication[];
  assignable: NonNullable<CrmRedirectPromotionBrief>[];
  /** @deprecated compat — igual que pending */
  data: CrmRedirectPromotionApplication[];
  count: number;
};

export async function fetchCrmRedirectApplications(influencerId: string): Promise<CrmRedirectApplicationsPack> {
  const res = await fetch(apiUrl(`/api/admin/crm/influencers/${influencerId}/redirect-applications`), {
    headers: authHeaders(),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || 'Error al cargar solicitudes de redirección');
  const pending = (body.pending ?? body.data ?? []) as CrmRedirectPromotionApplication[];
  const approved = (body.approved ?? []) as CrmRedirectPromotionApplication[];
  const assignable = (body.assignable ?? []) as NonNullable<CrmRedirectPromotionBrief>[];
  return {
    pending,
    approved,
    assignable,
    data: pending,
    count: Number(body.count) || pending.length,
  };
}

export async function assignCrmRedirectPromotion(
  influencerId: string,
  promotionId: string,
): Promise<CrmRedirectPromotionApplication> {
  const res = await fetch(apiUrl(`/api/admin/crm/influencers/${influencerId}/redirect-promotions/assign`), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ promotionId }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || 'No se pudo asignar la promoción');
  return body.data as CrmRedirectPromotionApplication;
}

export type CrmPromotionApplicationRow = {
  id: string;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
  influencerApplicant: null | {
    id: string;
    name?: string;
    username?: string;
    avatar?: string;
    totalFollowers?: number;
  };
  platforms: string[];
  estimatedReach: number;
  portfolio: { originalName?: string; urlPath?: string; mimeType?: string }[];
  pricing?: { type?: string; amount?: number; currency?: string };
  timeline?: { startDate?: string; endDate?: string; deliverables?: string[] };
  additionalNotes?: string;
  contentProposal?: string;
  promotion: null | {
    id: string;
    title?: string;
    brand?: string;
    category?: string;
    currentPrice?: number;
    currency?: string;
    discountPercentage?: number;
    redirectInsteadOfQr?: boolean;
    redirectToUrl?: string;
  };
};

export type CrmApplicationsPagination = {
  page: number;
  limit: number;
  totalDocs: number;
  totalPages: number;
};

export async function fetchCrmPromotionApplications(params?: {
  status?: string;
  influencerId?: string;
  search?: string;
  unlinkedOnly?: boolean;
  page?: number;
  limit?: number;
}): Promise<{
  rows: CrmPromotionApplicationRow[];
  pendingCount: number;
  unlinkedCount: number;
  pagination: CrmApplicationsPagination;
}> {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.influencerId?.trim()) q.set('influencerId', params.influencerId.trim());
  if (params?.search?.trim()) q.set('search', params.search.trim());
  if (params?.unlinkedOnly) q.set('unlinkedOnly', '1');
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const res = await fetch(apiUrl(`/api/admin/crm/promotion-applications?${q}`), {
    headers: authHeaders(),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || 'Error al cargar solicitudes');
  return {
    rows: (body.data || []) as CrmPromotionApplicationRow[],
    pendingCount: Number(body.pendingCount) || 0,
    unlinkedCount: Number(body.unlinkedCount) || 0,
    pagination: (body.pagination as CrmApplicationsPagination) || {
      page: 1,
      limit: Number(params?.limit) || 25,
      totalDocs: (body.data || []).length,
      totalPages: 1,
    },
  };
}

export async function fetchCrmInfluencerCategories(): Promise<string[]> {
  const res = await fetch(apiUrl('/api/admin/crm/promotion-applications/categories'), {
    headers: authHeaders(),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || 'Error al cargar categorías');
  return (body.data || []) as string[];
}

export type BulkApplyResult = {
  created: number;
  skipped: number;
  matched: number;
  status: string;
};

export async function bulkApplyCrmPromotion(params: {
  promotionId: string;
  scope: 'all' | 'category';
  category?: string;
  approve?: boolean;
}): Promise<BulkApplyResult> {
  const res = await fetch(apiUrl('/api/admin/crm/promotion-applications/bulk-apply'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(params),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || 'No se pudo aplicar la promoción');
  return body.data as BulkApplyResult;
}

export type PromotionPickItem = { id: string; title: string; brand?: string; category?: string };

export async function searchPromotionsForBulk(search: string): Promise<PromotionPickItem[]> {
  const q = new URLSearchParams({ status: 'all', page: '1', limit: '20' });
  if (search.trim()) q.set('search', search.trim());
  const res = await fetch(apiUrl(`/api/promotions?${q}`), { headers: authHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || 'Error al buscar promociones');
  const docs = (body.data?.docs || []) as Array<Record<string, unknown>>;
  return docs.map((d) => ({
    id: String(d._id || d.id || ''),
    title: String(d.title || 'Promoción'),
    brand: d.brand ? String(d.brand) : undefined,
    category: d.category ? String(d.category) : undefined,
  }));
}

export async function approveCrmPromotionApplication(
  applicationId: string,
  opts?: { influencerProfileId?: string },
): Promise<{ id: string; status: string }> {
  const res = await fetch(apiUrl(`/api/admin/crm/promotion-applications/${applicationId}/approve`), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(opts?.influencerProfileId ? { influencerProfileId: opts.influencerProfileId } : {}),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || 'No se pudo aprobar la solicitud');
  return body.data as { id: string; status: string };
}

export async function rejectCrmPromotionApplication(applicationId: string): Promise<{ id: string; status: string }> {
  const res = await fetch(apiUrl(`/api/admin/crm/promotion-applications/${applicationId}/reject`), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({}),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || 'No se pudo rechazar la solicitud');
  return body.data as { id: string; status: string };
}

export async function patchCrmOutreach(
  id: string,
  body: Record<string, unknown>,
): Promise<CrmOutreach> {
  const res = await fetch(apiUrl(`/api/admin/crm/influencers/${id}/outreach`), {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al guardar outreach');
  return data.data;
}

export async function reviewCrmIdentityVerification(
  id: string,
  body: { decision: 'approved' | 'rejected'; adminNote?: string },
): Promise<CrmInfluencerDetail> {
  const res = await fetch(apiUrl(`/api/admin/crm/influencers/${id}/identity-verification`), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al revisar identidad');
  return data.data;
}

export type CrmInfluencerProfilePatch = {
  name?: string;
  username?: string;
  bio?: string;
  avatar?: string;
  profileShortCode?: string;
  location?: string;
  status?: string;
  identityVerificationStatus?: 'pending' | 'approved' | 'rejected';
  socialMedia?: Partial<Record<'instagram' | 'tiktok' | 'youtube' | 'twitter', string>>;
  categories?: string[];
  followers?: Partial<Record<'instagram' | 'tiktok' | 'youtube' | 'twitter', number>>;
  activationStatus?: string;
  dataSubmissionStatus?: string;
  adminNotes?: string;
  terms?: { accepted?: boolean };
  lastContactAt?: string;
};

export async function uploadCrmInfluencerAvatar(influencerId: string, file: File): Promise<{
  avatarUrl: string;
  cloudinaryUrl?: string | null;
  savedToCloudinary?: boolean;
}> {
  const token = localStorage.getItem('auth_token');
  const fd = new FormData();
  fd.append('avatar', file);
  const res = await fetch(apiUrl(`/api/admin/crm/influencers/${influencerId}/avatar`), {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Error al subir foto');
  return data.data;
}

export async function patchCrmInfluencer(
  id: string,
  body: CrmInfluencerProfilePatch | Record<string, unknown>,
): Promise<CrmInfluencerRow> {
  const res = await fetch(apiUrl(`/api/admin/crm/influencers/${id}`), {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al guardar');
  return data.data;
}
