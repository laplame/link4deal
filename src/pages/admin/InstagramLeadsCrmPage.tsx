import React, { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Instagram,
  Loader2,
  Lock,
  RefreshCw,
  ExternalLink,
  Plus,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  clearAdminPinUnlockSession,
  getAdminAccessPin,
  isAdminPinUnlockSession,
  setAdminPinUnlockSession,
} from '../../config/adminAccess';
import {
  fetchInstagramIntegration,
  fetchInstagramLeadStats,
  fetchInstagramLeads,
  createInstagramLead,
  patchInstagramLead,
  syncInstagramLeads,
  type InstagramLeadRow,
  type InstagramLeadStage,
  type InstagramIntegrationStatus,
} from '../../services/adminInstagramLeads';

const STAGE_LABELS: Record<InstagramLeadStage, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  qualified: 'Calificado',
  converted: 'Convertido',
  dismissed: 'Descartado',
};

const EVENT_LABELS: Record<string, string> = {
  comment: 'Comentario',
  dm: 'DM',
  story_reply: 'Respuesta story',
  mention: 'Mención',
  lead_ad: 'Lead Ad',
  engagement: 'Engagement',
  other: 'Otro',
};

export default function InstagramLeadsCrmPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const isSuperAdmin = user?.isSuperAdmin === true;
  const [searchParams, setSearchParams] = useSearchParams();
  const [unlocked, setUnlocked] = useState(() => isAdminPinUnlockSession());
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [integration, setIntegration] = useState<InstagramIntegrationStatus | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [oauthUrl, setOauthUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<{ totalOpen: number; last24h: number; byStage: Record<string, number> } | null>(
    null,
  );
  const [leads, setLeads] = useState<InstagramLeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState('');
  const [usernameFilter, setUsernameFilter] = useState('');

  const [manualUsername, setManualUsername] = useState('');
  const [manualMessage, setManualMessage] = useState('');
  const [creating, setCreating] = useState(false);

  const oauthNotice = searchParams.get('oauth');
  const oauthMessage = searchParams.get('message');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [integ, st, list] = await Promise.all([
        fetchInstagramIntegration(),
        fetchInstagramLeadStats(),
        fetchInstagramLeads({
          pipelineStage: stageFilter || undefined,
          username: usernameFilter.trim() || undefined,
          limit: 100,
        }),
      ]);
      setIntegration(integ.integration);
      setConnectionStatus(integ.connection?.status || 'disconnected');
      setOauthUrl(integ.oauthUrl);
      setStats(st);
      setLeads(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar leads Instagram');
    } finally {
      setLoading(false);
    }
  }, [stageFilter, usernameFilter]);

  useEffect(() => {
    if (!unlocked || !isSuperAdmin) return;
    load();
  }, [unlocked, isSuperAdmin, load]);

  useEffect(() => {
    if (oauthNotice) {
      const next = new URLSearchParams(searchParams);
      next.delete('oauth');
      next.delete('message');
      setSearchParams(next, { replace: true });
    }
  }, [oauthNotice, searchParams, setSearchParams]);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const result = await syncInstagramLeads();
      if (result.message) {
        setError(null);
      }
      await load();
      if (result.mode === 'stub' && result.message) {
        setError(result.message);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al sincronizar');
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUsername.trim()) return;
    setCreating(true);
    try {
      await createInstagramLead({
        instagramUsername: manualUsername.trim(),
        message: manualMessage.trim() || 'Lead manual',
        eventType: 'other',
      });
      setManualUsername('');
      setManualMessage('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear lead');
    } finally {
      setCreating(false);
    }
  };

  const handleStageChange = async (id: string, pipelineStage: InstagramLeadStage) => {
    try {
      await patchInstagramLead(id, { pipelineStage });
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, pipelineStage } : l)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
      </div>
    );
  }

  if (!isAuthenticated || !isSuperAdmin) {
    return <Navigate to="/signin" replace />;
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <form
          className="bg-slate-800 rounded-2xl p-8 max-w-sm w-full border border-slate-700"
          onSubmit={(e) => {
            e.preventDefault();
            if (pinInput === getAdminAccessPin()) {
              setAdminPinUnlockSession();
              setUnlocked(true);
              setPinError(false);
            } else {
              setPinError(true);
            }
          }}
        >
          <Lock className="w-10 h-10 text-pink-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white text-center mb-2">Leads Instagram</h1>
          <p className="text-sm text-slate-400 text-center mb-4">PIN de administración</p>
          <input
            type="password"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white mb-2"
            autoFocus
          />
          {pinError && <p className="text-red-400 text-sm text-center mb-2">PIN incorrecto</p>}
          <button type="submit" className="w-full py-2 rounded-lg bg-pink-600 text-white font-medium hover:bg-pink-500">
            Entrar
          </button>
          <Link to="/admin/crm" className="block text-center text-sm text-slate-500 mt-4 hover:text-slate-300">
            Volver al CRM
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-purple-900 via-pink-900 to-orange-900 text-white border-b border-pink-800/50">
        <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/admin/crm" className="p-2 rounded-lg hover:bg-white/10" title="Hub CRM">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Instagram className="w-5 h-5" />
                Leads Instagram
              </h1>
              <p className="text-xs text-pink-100/80">Webhooks, sync Graph API y seguimiento de pipeline</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {oauthUrl && (
              <a
                href={oauthUrl}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 flex items-center gap-1"
              >
                Conectar Meta <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="text-xs px-3 py-1.5 rounded-lg bg-white text-pink-900 font-medium hover:bg-pink-50 flex items-center gap-1 disabled:opacity-60"
            >
              {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Sincronizar
            </button>
            <button
              type="button"
              onClick={() => {
                clearAdminPinUnlockSession();
                setUnlocked(false);
              }}
              className="text-xs text-pink-100/70 hover:text-white"
            >
              Cerrar PIN
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {oauthNotice === 'success' && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Cuenta Instagram vinculada correctamente.
          </div>
        )}
        {oauthNotice === 'error' && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            OAuth: {oauthMessage || 'Error desconocido'}
          </div>
        )}

        {integration && (
          <div className="mb-6 bg-white rounded-xl border p-4">
            <h2 className="font-semibold text-gray-900 mb-2">Estado de integración Meta</h2>
            <div className="flex flex-wrap gap-2 text-xs mb-3">
              <span
                className={`px-2 py-0.5 rounded-full ${integration.configured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}
              >
                App {integration.configured ? 'configurada' : 'pendiente (META_APP_ID / SECRET)'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Conexión: {connectionStatus}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Graph {integration.graphApiVersion}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-2">
              Webhook: <code className="bg-gray-100 px-1 rounded">/api/instagram/webhook</code> · Redirect:{' '}
              <code className="bg-gray-100 px-1 rounded break-all">{integration.redirectUri}</code>
            </p>
            <details className="text-sm text-gray-600">
              <summary className="cursor-pointer font-medium text-gray-800">Checklist de configuración</summary>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-xs">
                {integration.setupChecklist.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <a
                href={integration.docsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-pink-600 hover:underline text-xs"
              >
                Documentación Meta <ExternalLink className="w-3 h-3" />
              </a>
            </details>
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500">Abiertos</p>
              <p className="text-2xl font-bold text-pink-600">{stats.totalOpen}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500">Últimas 24 h</p>
              <p className="text-2xl font-bold">{stats.last24h}</p>
            </div>
            <div className="bg-white rounded-xl border p-4 col-span-2">
              <p className="text-xs text-gray-500 mb-1">Por etapa</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {Object.entries(stats.byStage).map(([k, v]) => (
                  <span key={k} className="bg-slate-100 px-2 py-0.5 rounded">
                    {STAGE_LABELS[k as InstagramLeadStage] || k}: {v}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <form onSubmit={handleCreateManual} className="md:col-span-1 bg-white rounded-xl border p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-1">
              <Plus className="w-4 h-4" /> Lead manual
            </h3>
            <label className="block text-xs text-gray-500 mb-1">@usuario Instagram</label>
            <input
              value={manualUsername}
              onChange={(e) => setManualUsername(e.target.value)}
              placeholder="usuario_ig"
              className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
            />
            <label className="block text-xs text-gray-500 mb-1">Mensaje</label>
            <textarea
              value={manualMessage}
              onChange={(e) => setManualMessage(e.target.value)}
              rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
              placeholder="Interés en cupón..."
            />
            <button
              type="submit"
              disabled={creating || !manualUsername.trim()}
              className="w-full py-2 rounded-lg bg-pink-600 text-white text-sm font-medium hover:bg-pink-500 disabled:opacity-50"
            >
              {creating ? 'Guardando…' : 'Registrar lead'}
            </button>
          </form>

          <div className="md:col-span-2 bg-white rounded-xl border p-4">
            <h3 className="font-medium text-gray-900 mb-3">Filtros</h3>
            <div className="flex flex-wrap gap-3">
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Todas las etapas</option>
                {(Object.keys(STAGE_LABELS) as InstagramLeadStage[]).map((s) => (
                  <option key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </option>
                ))}
              </select>
              <input
                value={usernameFilter}
                onChange={(e) => setUsernameFilter(e.target.value)}
                placeholder="Filtrar @usuario"
                className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[140px]"
              />
              <button
                type="button"
                onClick={() => load()}
                className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Mensaje</th>
                  <th className="px-4 py-3">Influencer</th>
                  <th className="px-4 py-3">Etapa</th>
                  <th className="px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {leads.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Sin leads. Usa «Sincronizar» (modo demo sin credenciales) o conecta Meta.
                    </td>
                  </tr>
                )}
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-medium">
                      @{lead.instagramUsername || '—'}
                      <span className="block text-xs text-gray-400 font-normal">{lead.source}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{EVENT_LABELS[lead.eventType] || lead.eventType}</td>
                    <td className="px-4 py-3 max-w-xs truncate text-gray-700" title={lead.message}>
                      {lead.message || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {lead.influencerName || lead.influencerUsername ? (
                        <span>
                          {lead.influencerName}
                          {lead.influencerUsername ? ` (@${lead.influencerUsername})` : ''}
                        </span>
                      ) : (
                        <span className="text-gray-400">Sin vincular</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={lead.pipelineStage}
                        onChange={(e) => handleStageChange(lead.id, e.target.value as InstagramLeadStage)}
                        className="border rounded px-2 py-1 text-xs"
                      >
                        {(Object.keys(STAGE_LABELS) as InstagramLeadStage[]).map((s) => (
                          <option key={s} value={s}>
                            {STAGE_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {lead.receivedAt ? new Date(lead.receivedAt).toLocaleString('es-MX') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
