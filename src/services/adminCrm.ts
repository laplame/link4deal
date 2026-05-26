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
  identityVerificationStatus?: 'pending' | 'approved' | 'rejected';
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

export interface CrmListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  activationStatus?: string;
  dataSubmissionStatus?: string;
  termsAccepted?: 'true' | 'false';
  app?: 'damecodigo' | 'bizneai' | 'both' | 'none';
  identityVerificationStatus?: 'pending' | 'approved' | 'rejected';
  hasVerificationScreenshot?: 'true';
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

export async function patchCrmInfluencer(
  id: string,
  body: Record<string, unknown>,
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
