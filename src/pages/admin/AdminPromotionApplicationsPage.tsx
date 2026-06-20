import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  FileCheck,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { canAccessAdminCrm } from '../../config/adminAccess';
import { mediaUrl } from '../../utils/apiUrl';
import {
  approveCrmPromotionApplication,
  fetchCrmPromotionApplications,
  rejectCrmPromotionApplication,
  type CrmPromotionApplicationRow,
} from '../../services/adminCrm';

function statusLabel(s: string): string {
  switch (s) {
    case 'pending':
      return 'Pendiente';
    case 'approved':
      return 'Aceptada';
    case 'rejected':
      return 'Rechazada';
    case 'withdrawn':
      return 'Retirada';
    default:
      return s;
  }
}

function statusClass(s: string): string {
  switch (s) {
    case 'pending':
      return 'bg-amber-100 text-amber-900';
    case 'approved':
      return 'bg-emerald-100 text-emerald-900';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default function AdminPromotionApplicationsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const canAccess = canAccessAdminCrm(user);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const statusFilter = searchParams.get('status') ?? 'pending';
  const influencerFilter = searchParams.get('influencerId') || '';

  const [rows, setRows] = useState<CrmPromotionApplicationRow[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [assignInfluencerId, setAssignInfluencerId] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { rows: data, pendingCount: pc } = await fetchCrmPromotionApplications({
        status: statusFilter,
        influencerId: influencerFilter || undefined,
      });
      setRows(data);
      setPendingCount(pc);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al cargar';
      setError(
        msg.includes('Token') || msg.includes('401') || msg.includes('acceso')
          ? `${msg} — vuelve a iniciar sesión como super admin.`
          : msg,
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, influencerFilter]);

  useEffect(() => {
    if (!canAccess) return;
    void load();
  }, [canAccess, load]);

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0 };
    for (const r of rows) {
      if (r.status === 'pending') c.pending += 1;
      if (r.status === 'approved') c.approved += 1;
      if (r.status === 'rejected') c.rejected += 1;
    }
    return c;
  }, [rows]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const returnPath = `${location.pathname}${location.search || '?status=pending'}`;

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/signin?redirect=${encodeURIComponent(returnPath)}`}
        replace
      />
    );
  }

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border shadow-sm p-8 max-w-md text-center">
          <p className="text-gray-800 font-medium mb-2">Acceso restringido</p>
          <p className="text-sm text-gray-600 mb-4">
            Solo super administrador. Inicia sesión con la cuenta correcta.
          </p>
          <Link to="/marketplace" className="text-purple-700 underline text-sm">
            Ir al marketplace
          </Link>
        </div>
      </div>
    );
  }

  const handleApprove = async (row: CrmPromotionApplicationRow) => {
    const extraId = (assignInfluencerId[row.id] || '').trim();
    if (!row.influencerApplicant && !/^[a-f0-9]{24}$/i.test(extraId)) {
      setError('Indica el ID del influencer (24 caracteres) antes de aceptar.');
      return;
    }
    if (!window.confirm(`¿Aceptar solicitud para «${row.promotion?.title || 'promoción'}»?`)) return;
    setActionId(row.id);
    setError(null);
    try {
      await approveCrmPromotionApplication(
        row.id,
        extraId ? { influencerProfileId: extraId } : undefined,
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo aceptar');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (row: CrmPromotionApplicationRow) => {
    if (!window.confirm('¿Rechazar esta solicitud?')) return;
    setActionId(row.id);
    setError(null);
    try {
      await rejectCrmPromotionApplication(row.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo rechazar');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white border-b border-slate-700">
        <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/admin/crm" className="text-slate-300 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                Solicitudes de promoción
              </h1>
              <p className="text-xs text-slate-400">
                Aplicaciones del marketplace · {pendingCount} pendiente(s) en total
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            <Link
              to="/admin/crm/pipeline"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500"
            >
              Pipeline CRM
            </Link>
            <span className="text-xs text-slate-400 truncate max-w-[12rem]">{user?.email}</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="flex flex-wrap gap-2 mb-4">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                if (s === 'pending') next.delete('status');
                else next.set('status', s);
                setSearchParams(next, { replace: true });
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                statusFilter === s || (s === 'pending' && !searchParams.get('status'))
                  ? 'bg-purple-600 text-white'
                  : 'bg-white border text-gray-700'
              }`}
            >
              {s === 'all' ? 'Todas' : statusLabel(s)}
            </button>
          ))}
        </div>

        {influencerFilter ? (
          <p className="text-sm text-gray-600 mb-3">
            Filtro influencer:{' '}
            <code className="bg-gray-200 px-1 rounded">{influencerFilter}</code>
            <button
              type="button"
              className="ml-2 text-purple-700 underline text-sm"
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.delete('influencerId');
                setSearchParams(next, { replace: true });
              }}
            >
              Quitar filtro
            </button>
          </p>
        ) : null}

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-3 py-2">
            {error}
          </div>
        )}

        {loading && rows.length === 0 ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : rows.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-600">
            <p>No hay solicitudes con este filtro.</p>
            <p className="text-sm mt-2 text-gray-500">
              Si el influencer aplicó sin vincular su ID, aparecerán aquí como «Sin influencer».
            </p>
            <Link
              to="/brands/aplicaciones"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 text-sm text-purple-700 underline"
            >
              Panel de marcas (contraseña)
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {rows.map((row) => (
              <li key={row.id} className="bg-white rounded-xl border shadow-sm p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${statusClass(row.status)}`}>
                        {statusLabel(row.status)}
                      </span>
                      {row.promotion?.redirectInsteadOfQr ? (
                        <span className="text-[10px] bg-indigo-100 text-indigo-900 px-1.5 py-0.5 rounded">
                          Redirect URL
                        </span>
                      ) : null}
                      <span className="text-[11px] text-gray-500">
                        {row.createdAt
                          ? new Date(row.createdAt).toLocaleString('es-MX')
                          : '—'}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-gray-900">
                      {row.promotion?.title || 'Promoción'}
                      {row.promotion?.brand ? (
                        <span className="font-normal text-gray-600"> · {row.promotion.brand}</span>
                      ) : null}
                    </h2>
                    {row.influencerApplicant ? (
                      <div className="flex items-center gap-2 mt-2">
                        <img
                          src={mediaUrl(row.influencerApplicant.avatar, row.influencerApplicant.name)}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-sm font-medium">{row.influencerApplicant.name}</p>
                          <p className="text-xs text-gray-500">@{row.influencerApplicant.username}</p>
                        </div>
                        <Link
                          to={`/admin/crm/pipeline`}
                          className="text-xs text-purple-700 underline ml-2"
                          onClick={() => {
                            try {
                              sessionStorage.setItem('crm-open-influencer-id', row.influencerApplicant!.id);
                            } catch {
                              /* ignore */
                            }
                          }}
                        >
                          Ver en pipeline
                        </Link>
                      </div>
                    ) : (
                      <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2">
                        <p className="text-xs text-amber-950 font-medium">Sin influencer vinculado</p>
                        <label className="block text-[11px] text-gray-600 mt-1">
                          ID influencer (24 hex) para vincular al aceptar:
                        </label>
                        <input
                          value={assignInfluencerId[row.id] || ''}
                          onChange={(e) =>
                            setAssignInfluencerId((prev) => ({ ...prev, [row.id]: e.target.value }))
                          }
                          placeholder="507f1f77bcf86cd799439011"
                          className="mt-1 w-full font-mono text-xs border rounded px-2 py-1"
                        />
                      </div>
                    )}
                    {row.contentProposal ? (
                      <p className="text-sm text-gray-700 mt-2 line-clamp-3">{row.contentProposal}</p>
                    ) : null}
                  </div>
                  {row.status === 'pending' ? (
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={actionId === row.id}
                        onClick={() => void handleApprove(row)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {actionId === row.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        Aceptar
                      </button>
                      <button
                        type="button"
                        disabled={actionId === row.id}
                        onClick={() => void handleReject(row)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                      >
                        <XCircle className="w-4 h-4" />
                        Rechazar
                      </button>
                    </div>
                  ) : null}
                </div>
                {row.promotion?.id ? (
                  <Link
                    to={`/promotion-details/${row.promotion.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-purple-700 mt-3 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Ver promoción
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {statusFilter === 'pending' && rows.length > 0 && (
          <p className="text-xs text-gray-500 mt-4">
            Mostrando {rows.length} en esta vista · {pendingCount} pendientes en la plataforma
            {counts.approved > 0 || counts.rejected > 0
              ? ` (${counts.approved} aceptadas / ${counts.rejected} rechazadas en página)`
              : ''}
          </p>
        )}
      </div>
    </div>
  );
}
