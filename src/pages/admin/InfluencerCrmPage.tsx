import React, { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Loader2,
  Lock,
  Smartphone,
  Store,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Save,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  clearAdminPinUnlockSession,
  getAdminAccessPin,
  isAdminPinUnlockSession,
  setAdminPinUnlockSession,
} from '../../config/adminAccess';
import { apiUrl, mediaUrl } from '../../utils/apiUrl';
import {
  fetchCrmStats,
  fetchCrmInfluencers,
  fetchCrmInfluencerDetail,
  patchCrmInfluencer,
  patchCrmOutreach,
  type CrmInfluencerRow,
  type CrmInfluencerDetail,
  type CrmStats,
} from '../../services/adminCrm';

const ACTIVATION_LABELS: Record<string, string> = {
  not_started: 'Sin iniciar',
  onboarding: 'Onboarding',
  pending_review: 'Revisión',
  active: 'Activo',
  verified: 'Verificado',
  suspended: 'Suspendido',
  inactive: 'Inactivo',
};

const DATA_LABELS: Record<string, string> = {
  not_started: 'Sin datos',
  incomplete: 'Incompleto',
  partial: 'Parcial',
  complete: 'Completo',
};

function AppBadges({ row }: { row: CrmInfluencerRow }) {
  const d = row.apps.damecodigoInfluencer.installCount;
  const b = row.apps.bizneaiMerchant.installCount;
  return (
    <div className="flex flex-wrap gap-1">
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
          d > 0 ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-500'
        }`}
        title={`DameCodigo influencer: ${d} instalación(es)`}
      >
        DC {d}
      </span>
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
          b > 0 ? 'bg-violet-100 text-violet-900' : 'bg-gray-100 text-gray-500'
        }`}
        title={`BizneAI negocios: ${b} instalación(es)`}
      >
        Biz {b}
      </span>
    </div>
  );
}

export default function InfluencerCrmPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const isSuperAdmin = user?.isSuperAdmin === true;
  const [unlocked, setUnlocked] = useState(() => isAdminPinUnlockSession());
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [stats, setStats] = useState<CrmStats | null>(null);
  const [rows, setRows] = useState<CrmInfluencerRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activationFilter, setActivationFilter] = useState('');
  const [dataFilter, setDataFilter] = useState('');
  const [termsFilter, setTermsFilter] = useState('');
  const [appFilter, setAppFilter] = useState('');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CrmInfluencerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [editActivation, setEditActivation] = useState('');
  const [editDataStatus, setEditDataStatus] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editTerms, setEditTerms] = useState(false);
  const [editContactEmail, setEditContactEmail] = useState('');
  const [editNextAction, setEditNextAction] = useState('');

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [st, list] = await Promise.all([
        fetchCrmStats(),
        fetchCrmInfluencers({
          page,
          limit: 25,
          search: search.trim() || undefined,
          status: statusFilter || undefined,
          activationStatus: activationFilter || undefined,
          dataSubmissionStatus: dataFilter || undefined,
          termsAccepted: termsFilter === 'yes' ? 'true' : termsFilter === 'no' ? 'false' : undefined,
          app: (appFilter || undefined) as 'damecodigo' | 'bizneai' | 'both' | 'none' | undefined,
        }),
      ]);
      setStats(st);
      setRows(list.docs);
      setTotalPages(list.totalPages);
      setTotalDocs(list.totalDocs);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error CRM');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, activationFilter, dataFilter, termsFilter, appFilter]);

  useEffect(() => {
    if (!isSuperAdmin || !unlocked) return;
    loadList();
  }, [isSuperAdmin, unlocked, loadList]);

  useEffect(() => {
    if (!selectedId || !unlocked) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    fetchCrmInfluencerDetail(selectedId)
      .then((d) => {
        if (cancelled) return;
        setDetail(d);
        setEditNotes(d.adminNotes || '');
        setEditActivation(d.activationStatus);
        setEditDataStatus(d.dataSubmissionStatus);
        setEditStatus(d.status);
        setEditTerms(d.terms.accepted);
        setEditContactEmail(d.outreach?.contactEmail || d.user?.email || '');
        setEditNextAction(d.outreach?.nextAction || '');
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, unlocked]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === getAdminAccessPin()) {
      setAdminPinUnlockSession();
      setUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleSaveDetail = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await patchCrmInfluencer(selectedId, {
        status: editStatus,
        activationStatus: editActivation,
        dataSubmissionStatus: editDataStatus,
        adminNotes: editNotes,
        terms: { accepted: editTerms },
        lastContactAt: new Date().toISOString(),
      });
      if (detail?.outreach || editContactEmail || editNextAction) {
        await patchCrmOutreach(selectedId, {
          contactEmail: editContactEmail,
          contactEmailStatus: editContactEmail ? 'received' : undefined,
          nextAction: editNextAction,
        });
      }
      await loadList();
      const d = await fetchCrmInfluencerDetail(selectedId);
      setDetail(d);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />;

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <form
          onSubmit={handlePinSubmit}
          className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-sm w-full shadow-xl"
        >
          <Lock className="w-10 h-10 text-purple-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white text-center mb-2">CRM Influencers</h1>
          <p className="text-sm text-slate-400 text-center mb-6">PIN de super admin</p>
          <input
            type="password"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 text-white mb-4"
            placeholder="PIN"
            autoFocus
          />
          {pinError && <p className="text-red-400 text-sm mb-3">PIN incorrecto</p>}
          <button
            type="submit"
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
          >
            Entrar
          </button>
          <Link to="/admin" className="block text-center text-sm text-slate-500 mt-4 hover:text-slate-300">
            Volver al admin
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white border-b border-slate-800">
        <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="p-2 rounded-lg hover:bg-slate-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">CRM Influencers</h1>
              <p className="text-xs text-slate-400">Activación, datos, términos y apps (DameCodigo + BizneAI)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              clearAdminPinUnlockSession();
              setUnlocked(false);
            }}
            className="text-xs text-slate-400 hover:text-white"
          >
            Cerrar sesión PIN
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500">Influencers</p>
              <p className="text-2xl font-bold">{stats.totalInfluencers}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500">Con cuenta</p>
              <p className="text-2xl font-bold text-blue-600">{stats.linkedToUser}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500">Términos OK</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.termsAccepted}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Smartphone className="w-3 h-3" /> App DC
              </p>
              <p className="text-2xl font-bold">{stats.withDamecodigoApp}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Store className="w-3 h-3" /> BizneAI
              </p>
              <p className="text-2xl font-bold">{stats.withBizneaiApp}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500">Ambas apps</p>
              <p className="text-2xl font-bold text-purple-600">{stats.withBothApps}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Nombre, usuario, código…"
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="py-2 px-3 border rounded-lg text-sm"
          >
            <option value="">Estado perfil</option>
            <option value="pending">Pendiente</option>
            <option value="active">Activo</option>
            <option value="verified">Verificado</option>
            <option value="suspended">Suspendido</option>
          </select>
          <select
            value={activationFilter}
            onChange={(e) => {
              setActivationFilter(e.target.value);
              setPage(1);
            }}
            className="py-2 px-3 border rounded-lg text-sm"
          >
            <option value="">Activación CRM</option>
            {Object.entries(ACTIVATION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select
            value={dataFilter}
            onChange={(e) => {
              setDataFilter(e.target.value);
              setPage(1);
            }}
            className="py-2 px-3 border rounded-lg text-sm"
          >
            <option value="">Envío datos</option>
            {Object.entries(DATA_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select
            value={termsFilter}
            onChange={(e) => {
              setTermsFilter(e.target.value);
              setPage(1);
            }}
            className="py-2 px-3 border rounded-lg text-sm"
          >
            <option value="">Términos</option>
            <option value="yes">Aceptados</option>
            <option value="no">Pendientes</option>
          </select>
          <select
            value={appFilter}
            onChange={(e) => {
              setAppFilter(e.target.value);
              setPage(1);
            }}
            className="py-2 px-3 border rounded-lg text-sm"
          >
            <option value="">Apps</option>
            <option value="damecodigo">Solo DameCodigo</option>
            <option value="bizneai">Solo BizneAI</option>
            <option value="both">Ambas</option>
            <option value="none">Ninguna</option>
          </select>
        </div>

        {error && (
          <p className="text-red-600 text-sm mb-4 bg-red-50 border border-red-100 rounded-lg px-4 py-2">{error}</p>
        )}

        <div className="flex gap-4">
          <div className={`flex-1 min-w-0 ${selectedId ? 'lg:max-w-[58%]' : ''}`}>
            {loading ? (
              <div className="py-16 text-center text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                Cargando CRM…
              </div>
            ) : (
              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs text-gray-600 uppercase">
                      <tr>
                        <th className="px-3 py-3">Influencer</th>
                        <th className="px-3 py-3">Activación</th>
                        <th className="px-3 py-3">Datos</th>
                        <th className="px-3 py-3">Outreach</th>
                        <th className="px-3 py-3">Términos</th>
                        <th className="px-3 py-3">Apps</th>
                        <th className="px-3 py-3">Perfil %</th>
                        <th className="px-3 py-3">Canjes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {rows.map((row) => (
                        <tr
                          key={row.id}
                          onClick={() => setSelectedId(row.id)}
                          className={`cursor-pointer hover:bg-purple-50/60 ${
                            selectedId === row.id ? 'bg-purple-50' : ''
                          }`}
                        >
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <img
                                src={mediaUrl(row.avatar, row.name)}
                                alt=""
                                className="w-9 h-9 rounded-full object-cover"
                              />
                              <div>
                                <p className="font-medium text-gray-900">{row.name}</p>
                                <p className="text-xs text-gray-500">{row.username}</p>
                                {row.user?.email && (
                                  <p className="text-[11px] text-gray-400 truncate max-w-[140px]">{row.user.email}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-xs font-medium">
                              {ACTIVATION_LABELS[row.activationStatus] || row.activationStatus}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-xs">{DATA_LABELS[row.dataSubmissionStatus] || row.dataSubmissionStatus}</span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-[11px] leading-tight block max-w-[120px]">
                              {row.outreachPipelineLabel || '—'}
                              {(row.outreachPendingCount ?? 0) > 0 && (
                                <span className="text-amber-700"> · {row.outreachPendingCount} pend.</span>
                              )}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            {row.terms.accepted ? (
                              <FileCheck className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <AppBadges row={row} />
                          </td>
                          <td className="px-3 py-3">{row.profileCompleteness}%</td>
                          <td className="px-3 py-3 font-medium">{row.redeemedCoupons}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rows.length === 0 && (
                  <p className="text-center py-10 text-gray-500">Sin resultados</p>
                )}
                <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
                  <span className="text-gray-500">
                    {totalDocs} registro(s) · página {page}/{totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="p-2 rounded border disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="p-2 rounded border disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {selectedId && (
            <aside className="w-full lg:w-[42%] bg-white rounded-xl border shadow-lg p-4 sticky top-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h2 className="font-semibold text-gray-900">Ficha CRM</h2>
                <button type="button" onClick={() => setSelectedId(null)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {detailLoading || !detail ? (
                <Loader2 className="w-6 h-6 animate-spin text-purple-500 mx-auto my-8" />
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={mediaUrl(detail.avatar, detail.name)}
                      alt=""
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-bold">{detail.name}</p>
                      <p className="text-sm text-gray-500">{detail.username}</p>
                      <Link
                        to={`/influencer/${detail.id}`}
                        className="text-xs text-purple-600 inline-flex items-center gap-1 mt-1"
                      >
                        Ver perfil <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm mb-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-50 rounded-lg p-2">
                        <p className="text-[10px] text-gray-500 uppercase">DameCodigo app</p>
                        <p className="font-bold">{detail.apps.damecodigoInfluencer.installCount} installs</p>
                        <p className="text-[11px] text-gray-500">
                          Últ. apertura:{' '}
                          {detail.apps.damecodigoInfluencer.lastOpenAt
                            ? new Date(detail.apps.damecodigoInfluencer.lastOpenAt).toLocaleString('es')
                            : '—'}
                        </p>
                      </div>
                      <div className="bg-violet-50 rounded-lg p-2">
                        <p className="text-[10px] text-violet-700 uppercase">BizneAI (shops)</p>
                        <p className="font-bold">{detail.apps.bizneaiMerchant.installCount} installs</p>
                        <p className="text-[11px] text-gray-500">
                          Últ. apertura:{' '}
                          {detail.apps.bizneaiMerchant.lastOpenAt
                            ? new Date(detail.apps.bizneaiMerchant.lastOpenAt).toLocaleString('es')
                            : '—'}
                        </p>
                      </div>
                    </div>
                    {detail.user && (
                      <p>
                        <span className="text-gray-500">Cuenta:</span> {detail.user.email || detail.user.phone || '—'}
                      </p>
                    )}
                    {detail.walletAddress && (
                      <p className="font-mono text-xs break-all">
                        <span className="text-gray-500">Wallet:</span> {detail.walletAddress}
                      </p>
                    )}
                    <p>
                      <span className="text-gray-500">Completitud perfil:</span> {detail.profileCompleteness}%
                    </p>
                    <p>
                      <span className="text-gray-500">Canjes / comisión:</span> {detail.redeemedCoupons} · $
                      {detail.totalEarnings?.toFixed?.(2) ?? detail.totalEarnings}
                    </p>
                  </div>

                  {detail.outreach && (
                    <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50/80 p-3 text-sm">
                      <p className="text-xs font-semibold text-amber-900 uppercase mb-1">Pipeline outreach</p>
                      <p className="font-medium text-amber-950">{detail.outreach.pipelineStageLabel}</p>
                      {detail.outreach.nextAction && (
                        <p className="text-xs text-amber-800 mt-2">
                          <span className="font-medium">Siguiente:</span> {detail.outreach.nextAction}
                        </p>
                      )}
                      {detail.outreach.profilePublicUrl && (
                        <a
                          href={detail.outreach.profilePublicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-purple-700 underline mt-1 inline-block"
                        >
                          {detail.outreach.profilePublicUrl}
                        </a>
                      )}
                      <ul className="mt-3 space-y-1.5 max-h-48 overflow-y-auto">
                        {detail.outreach.deliveries.map((d) => (
                          <li
                            key={d.deliveryKey}
                            className="flex justify-between gap-2 text-xs border-b border-amber-100/80 pb-1"
                          >
                            <span>
                              <span
                                className={
                                  d.status === 'pending'
                                    ? 'text-amber-800 font-medium'
                                    : 'text-gray-700'
                                }
                              >
                                {d.typeLabel || d.type}
                              </span>
                              {d.title ? ` — ${d.title}` : ''}
                            </span>
                            <span className="shrink-0 text-gray-500">{d.statusLabel || d.status}</span>
                          </li>
                        ))}
                      </ul>
                      {detail.outreach.conversationSummary && (
                        <p className="text-[11px] text-gray-600 mt-2 whitespace-pre-line border-t border-amber-100 pt-2">
                          {detail.outreach.conversationSummary}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-3 border-t pt-4">
                    <label className="block text-xs font-medium text-gray-600">Correo (Gmail / app)</label>
                    <input
                      type="email"
                      value={editContactEmail}
                      onChange={(e) => setEditContactEmail(e.target.value)}
                      placeholder="correo@gmail.com"
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                    <label className="block text-xs font-medium text-gray-600">Siguiente acción outreach</label>
                    <input
                      value={editNextAction}
                      onChange={(e) => setEditNextAction(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                    <label className="block text-xs font-medium text-gray-600">Estado perfil (Mongo)</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="active">Activo</option>
                      <option value="verified">Verificado</option>
                      <option value="suspended">Suspendido</option>
                    </select>
                    <label className="block text-xs font-medium text-gray-600">Activación CRM</label>
                    <select
                      value={editActivation}
                      onChange={(e) => setEditActivation(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    >
                      {Object.entries(ACTIVATION_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                    <label className="block text-xs font-medium text-gray-600">Envío de datos</label>
                    <select
                      value={editDataStatus}
                      onChange={(e) => setEditDataStatus(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    >
                      {Object.entries(DATA_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={editTerms} onChange={(e) => setEditTerms(e.target.checked)} />
                      Términos y condiciones aceptados
                    </label>
                    <label className="block text-xs font-medium text-gray-600">Notas internas</label>
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={4}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleSaveDetail}
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Guardar CRM
                    </button>
                  </div>

                  {detail.events.length > 0 && (
                    <div className="mt-4 border-t pt-4">
                      <p className="text-xs font-semibold text-gray-600 mb-2">Eventos recientes</p>
                      <ul className="space-y-1 max-h-40 overflow-y-auto text-xs">
                        {detail.events.map((ev) => (
                          <li key={ev.id} className="flex justify-between gap-2 text-gray-600">
                            <span>
                              {ev.eventType} · {ev.appKey}
                            </span>
                            <span>{ev.createdAt ? new Date(ev.createdAt).toLocaleString('es') : ''}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
