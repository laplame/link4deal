import { apiUrl } from '../utils/apiUrl';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export type InstagramLeadStage = 'new' | 'contacted' | 'qualified' | 'converted' | 'dismissed';
export type InstagramLeadEventType =
  | 'comment'
  | 'dm'
  | 'story_reply'
  | 'mention'
  | 'lead_ad'
  | 'engagement'
  | 'profile_interaction'
  | 'other';

export interface InstagramLeadRow {
  id: string;
  externalId: string | null;
  source: string;
  eventType: InstagramLeadEventType;
  instagramUserId: string | null;
  instagramUsername: string;
  displayName: string;
  message: string;
  mediaId: string | null;
  permalink: string;
  influencerId: string | null;
  influencerName?: string | null;
  influencerUsername?: string | null;
  promotionId: string | null;
  pipelineStage: InstagramLeadStage;
  status: 'open' | 'closed';
  adminNotes: string;
  receivedAt: string | null;
  lastActivityAt: string | null;
}

export interface InstagramIntegrationStatus {
  configured: boolean;
  graphApiVersion: string;
  appIdPresent: boolean;
  appSecretPresent: boolean;
  redirectUri: string;
  webhookVerifyTokenConfigured: boolean;
  oauthUrl: string | null;
  setupChecklist: string[];
  docsUrl: string;
}

export interface InstagramLeadStats {
  totalOpen: number;
  last24h: number;
  byStage: Record<string, number>;
}

export async function fetchInstagramIntegration(): Promise<{
  integration: InstagramIntegrationStatus;
  connection: { status: string; igUsername?: string } | null;
  oauthUrl: string | null;
}> {
  const res = await fetch(apiUrl('/api/admin/instagram/integration'), { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al cargar integración Instagram');
  return {
    integration: data.integration,
    connection: data.connection,
    oauthUrl: data.oauthUrl,
  };
}

export async function fetchInstagramLeadStats(): Promise<InstagramLeadStats> {
  const res = await fetch(apiUrl('/api/admin/instagram/leads/stats'), { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al cargar estadísticas');
  return data.data;
}

export async function fetchInstagramLeads(params?: {
  influencerId?: string;
  pipelineStage?: string;
  status?: string;
  username?: string;
  limit?: number;
}): Promise<InstagramLeadRow[]> {
  const q = new URLSearchParams();
  if (params?.influencerId) q.set('influencerId', params.influencerId);
  if (params?.pipelineStage) q.set('pipelineStage', params.pipelineStage);
  if (params?.status) q.set('status', params.status);
  if (params?.username) q.set('username', params.username);
  if (params?.limit) q.set('limit', String(params.limit));
  const res = await fetch(apiUrl(`/api/admin/instagram/leads?${q}`), { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al listar leads');
  return data.data;
}

export async function createInstagramLead(body: {
  instagramUsername: string;
  message?: string;
  eventType?: InstagramLeadEventType;
  influencerId?: string;
  adminNotes?: string;
}): Promise<InstagramLeadRow> {
  const res = await fetch(apiUrl('/api/admin/instagram/leads'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al crear lead');
  return data.data;
}

export async function patchInstagramLead(
  id: string,
  body: Partial<{
    pipelineStage: InstagramLeadStage;
    status: 'open' | 'closed';
    adminNotes: string;
    influencerId: string | null;
  }>,
): Promise<InstagramLeadRow> {
  const res = await fetch(apiUrl(`/api/admin/instagram/leads/${id}`), {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al actualizar lead');
  return data.data;
}

export async function syncInstagramLeads(): Promise<{
  mode: string;
  count: number;
  message?: string;
  data: InstagramLeadRow[];
}> {
  const res = await fetch(apiUrl('/api/admin/instagram/sync'), {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al sincronizar');
  return { mode: data.mode, count: data.count, message: data.message, data: data.data || [] };
}
