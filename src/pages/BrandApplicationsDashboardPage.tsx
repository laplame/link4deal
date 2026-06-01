import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  Filter,
  Lock,
  LogOut,
  Send,
  Copy,
  Target,
  Users,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { canAccessAdminCrm } from '../config/adminAccess';
import {
  BRAND_APPLICATIONS_PASSWORD_STORAGE_KEY,
  getBrandApplicationsMasterPassword,
} from '../config/brandApplicationsDashboard';
import { apiUrl } from '../utils/apiUrl';

function brandApplicationsAuthHeaders(masterPassword?: string): HeadersInit {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = localStorage.getItem('auth_token');
  if (masterPassword) {
    headers['X-Brand-Dashboard-Password'] = masterPassword;
  } else if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

type AppStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

interface PortfolioFile {
  originalName?: string;
  urlPath?: string;
  mimeType?: string;
}

interface BrandApplicationRow {
  id: string;
  status: AppStatus;
  createdAt: string;
  updatedAt: string;
  influencerApplicant: null | {
    id: string;
    name?: string;
    username?: string;
    avatar?: string;
    totalFollowers?: number;
  };
  platforms: string[];
  estimatedReach: number;
  portfolio: PortfolioFile[];
  pricing: { type?: string; amount?: number; currency?: string };
  timeline: { startDate?: string; endDate?: string; deliverables?: string[] };
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
  };
}

function statusLabel(s: AppStatus): string {
  switch (s) {
    case 'pending':
      return 'Pendiente';
    case 'approved':
      return 'Aprobada';
    case 'rejected':
      return 'Rechazada';
    case 'withdrawn':
      return 'Retirada';
    default:
      return s;
  }
}

function statusClass(s: AppStatus): string {
  switch (s) {
    case 'pending':
      return 'bg-amber-100 text-amber-900';
    case 'approved':
      return 'bg-emerald-100 text-emerald-900';
    case 'rejected':
      return 'bg-red-100 text-red-900';
    case 'withdrawn':
      return 'bg-gray-200 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default function BrandApplicationsDashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const staffJwtAccess = isAuthenticated && canAccessAdminCrm(user);

  const [passwordInput, setPasswordInput] = useState('');
  const [storedPw, setStoredPw] = useState(() => {
    try {
      return sessionStorage.getItem(BRAND_APPLICATIONS_PASSWORD_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<BrandApplicationRow[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [copiedApplicantObjectId, setCopiedApplicantObjectId] = useState<string | null>(null);

  const hasAccess = Boolean(staffJwtAccess || storedPw);

  const loadList = useCallback(async (opts: { password?: string; jwt?: boolean } = {}) => {
    const res = await fetch(apiUrl('/api/promotion-applications/brand'), {
      headers: brandApplicationsAuthHeaders(opts.jwt ? undefined : opts.password || storedPw),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = json?.message || 'No se pudieron cargar las aplicaciones.';
      throw new Error(msg);
    }
    setRows(Array.isArray(json.data) ? json.data : []);
  }, [storedPw]);

  const copyApplicantObjectId = useCallback(async (mongoId: string) => {
    try {
      await navigator.clipboard.writeText(mongoId);
      setCopiedApplicantObjectId(mongoId);
      window.setTimeout(() => {
        setCopiedApplicantObjectId((cur) => (cur === mongoId ? null : cur));
      }, 2000);
    } catch {
      setLoginError('No se pudo copiar al portapapeles.');
    }
  }, []);

  const filteredRows = useMemo(() => {
    if (filterStatus === 'all') return rows;
    return rows.filter((r) => r.status === filterStatus);
  }, [rows, filterStatus]);

  useEffect(() => {
    if (!hasAccess) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      setLoginError('');
      try {
        await loadList(staffJwtAccess ? { jwt: true } : { password: storedPw });
      } catch (e) {
        if (!cancel) {
          const message = e instanceof Error ? e.message : 'Error de red';
          setLoginError(message);
          if (!staffJwtAccess) {
            try {
              sessionStorage.removeItem(BRAND_APPLICATIONS_PASSWORD_STORAGE_KEY);
            } catch {
              /* ignore */
            }
            setStoredPw('');
          }
          setRows([]);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [hasAccess, staffJwtAccess, storedPw, loadList]);

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0, withdrawn: 0 };
    for (const r of rows) {
      if (c[r.status as keyof typeof c] !== undefined) {
        c[r.status as keyof typeof c] += 1;
      }
    }
    return c;
  }, [rows]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const pw = passwordInput.trim();
    if (!pw) {
      setLoginError('Ingresa la contraseña de acceso.');
      return;
    }
    setLoading(true);
    try {
      await loadList({ password: pw });
      try {
        sessionStorage.setItem(BRAND_APPLICATIONS_PASSWORD_STORAGE_KEY, pw);
      } catch {
        /* ignore */
      }
      setStoredPw(pw);
      setPasswordInput('');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Contraseña incorrecta.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem(BRAND_APPLICATIONS_PASSWORD_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setStoredPw('');
    setRows([]);
    setExpandedId(null);
  };

  const patchStatus = async (id: string, status: AppStatus) => {
    if (!hasAccess) return;
    setActionId(id);
    try {
      const res = await fetch(apiUrl(`/api/promotion-applications/${id}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...brandApplicationsAuthHeaders(staffJwtAccess ? undefined : storedPw),
        },
        body: JSON.stringify({ status }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || 'No se pudo actualizar');
      }
      await loadList(staffJwtAccess ? { jwt: true } : { password: storedPw });
    } catch (e) {
      setLoginError(e instanceof Error ? e.message : 'Error al actualizar');
    } finally {
      setActionId(null);
    }
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-2 text-slate-900">
            <div className="rounded-full bg-emerald-100 p-3">
              <Lock className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Panel de marcas</h1>
              <p className="text-sm text-slate-600">Aplicaciones de influencers</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-6">
            Usa el mismo PIN de super admin (CRM / landing) o inicia sesión como super admin para entrar sin
            contraseña.
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="brand-dash-pw" className="block text-sm font-medium text-slate-700 mb-1">
                Contraseña
              </label>
              <input
                id="brand-dash-pw"
                type="password"
                autoComplete="current-password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder={`PIN super admin (${getBrandApplicationsMasterPassword().length} caracteres)`}
              />
            </div>
            {loginError ? (
              <p className="text-sm text-red-600" role="alert">
                {loginError}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 text-white font-medium py-2.5 hover:bg-emerald-700 disabled:opacity-60 transition-colors"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Verificando…' : 'Entrar'}
            </button>
          </form>
          <Link
            to="/marketplace"
            className="mt-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-7 h-7 text-emerald-600" />
              Aplicaciones de influencers
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Revisa plataformas, alcance, entregables y notas; aprueba o rechaza cada solicitud.
            </p>
            <p className="text-xs text-amber-950 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-2 max-w-3xl leading-relaxed">
              <strong className="font-semibold">Cupón QR versus solicitud:</strong> aprobar aquí registra la
              colaboración. El payload del cupón (por ejemplo influencerId literal «guest») lo fija únicamente
              el momento en que se crea el QR. Si ese cupón muestra «guest», se emitió sin ObjectId público del
              perfil influencer (sin sesión de influencer enlazada o cliente que mandó ese valor). En el detalle
              de cada ficha aparece ese ObjectId para atribución y verificación del perfil.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              Marketplace
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="rounded-xl bg-white border border-gray-200 p-4">
            <div className="text-xs font-medium text-amber-700 uppercase">Pendientes</div>
            <div className="text-2xl font-bold text-gray-900">{counts.pending}</div>
          </div>
          <div className="rounded-xl bg-white border border-gray-200 p-4">
            <div className="text-xs font-medium text-emerald-700 uppercase">Aprobadas</div>
            <div className="text-2xl font-bold text-gray-900">{counts.approved}</div>
          </div>
          <div className="rounded-xl bg-white border border-gray-200 p-4">
            <div className="text-xs font-medium text-red-700 uppercase">Rechazadas</div>
            <div className="text-2xl font-bold text-gray-900">{counts.rejected}</div>
          </div>
          <div className="rounded-xl bg-white border border-gray-200 p-4">
            <div className="text-xs font-medium text-gray-600 uppercase">Retiradas</div>
            <div className="text-2xl font-bold text-gray-900">{counts.withdrawn}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">Filtrar:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
          >
            <option value="all">Todas (vista actual)</option>
            <option value="pending">Solo pendientes</option>
            <option value="approved">Solo aprobadas</option>
            <option value="rejected">Solo rechazadas</option>
            <option value="withdrawn">Solo retiradas</option>
          </select>
          {loading ? <span className="text-sm text-gray-500">Cargando…</span> : null}
        </div>

        {loginError ? (
          <div className="mb-4 rounded-lg bg-red-50 text-red-800 text-sm px-4 py-3">{loginError}</div>
        ) : null}

        {rows.length === 0 && !loading ? (
          <div className="text-center py-16 text-gray-600 bg-white rounded-xl border border-dashed border-gray-300">
            No hay aplicaciones registradas todavía.
          </div>
        ) : filteredRows.length === 0 && !loading ? (
          <div className="text-center py-16 text-gray-600 bg-white rounded-xl border border-dashed border-gray-300">
            Ninguna aplicación coincide con este filtro.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRows.map((r) => {
              const open = expandedId === r.id;
              const promo = r.promotion;
              return (
                <div
                  key={r.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                >
                  <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusClass(r.status)}`}>
                          {statusLabel(r.status)}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(r.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900 truncate">
                        {promo?.title || 'Promoción'}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {promo?.brand ? (
                          <span className="font-medium text-gray-800">{promo.brand}</span>
                        ) : (
                          'Marca no disponible'
                        )}
                        {promo?.category ? (
                          <span className="text-gray-500"> · {promo.category}</span>
                        ) : null}
                      </p>
                      {r.influencerApplicant ? (
                        <p className="text-sm text-slate-700 mt-1">
                          Influencer:{' '}
                          <span className="font-medium">
                            {r.influencerApplicant.name || r.influencerApplicant.username || r.influencerApplicant.id}
                          </span>
                          {r.influencerApplicant.username && r.influencerApplicant.name ? (
                            <span className="text-slate-500"> (@{r.influencerApplicant.username})</span>
                          ) : null}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-3 text-sm">
                        <span className="inline-flex items-center gap-1 text-violet-700">
                          <Target className="w-4 h-4" />
                          {r.platforms?.length ? r.platforms.join(', ') : '—'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-blue-700">
                          <Users className="w-4 h-4" />
                          {r.estimatedReach != null ? `${r.estimatedReach.toLocaleString()} seguidores` : '—'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-gray-600">
                          <Clock className="w-4 h-4" />
                          {r.portfolio?.length || 0} archivo(s) portfolio
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 md:flex-col md:items-stretch shrink-0">
                      <button
                        type="button"
                        onClick={() => setExpandedId(open ? null : r.id)}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <Eye className="w-4 h-4" />
                        {open ? 'Ocultar' : 'Detalle'}
                      </button>
                      {r.status === 'pending' ? (
                        <>
                          <button
                            type="button"
                            disabled={actionId === r.id}
                            onClick={() => patchStatus(r.id, 'approved')}
                            className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Aprobar
                          </button>
                          <button
                            type="button"
                            disabled={actionId === r.id}
                            onClick={() => patchStatus(r.id, 'rejected')}
                            className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            Rechazar
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                  {open ? (
                    <div className="border-t border-gray-100 bg-slate-50/80 px-4 py-4 md:px-6 space-y-4 text-sm">
                      {promo ? (
                        <div className="rounded-lg bg-gray-100 p-3">
                          <div className="font-medium text-gray-900 mb-2">Resumen de promoción</div>
                          <div className="grid sm:grid-cols-2 gap-2 text-gray-700">
                            <div>
                              Precio:{' '}
                              <strong>
                                {promo.currentPrice != null
                                  ? `$${Number(promo.currentPrice).toLocaleString()} ${promo.currency || ''}`
                                  : '—'}
                              </strong>
                            </div>
                            <div>
                              Descuento:{' '}
                              <strong>
                                {promo.discountPercentage != null
                                  ? `${promo.discountPercentage}%`
                                  : '—'}
                              </strong>
                            </div>
                          </div>
                        </div>
                      ) : null}
                      <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                        <div className="font-medium text-blue-900 mb-2">Propuesta y entregables</div>
                        {r.contentProposal ? (
                          <p className="text-blue-950 whitespace-pre-wrap mb-2">{r.contentProposal}</p>
                        ) : null}
                        <div className="text-blue-900">
                          <span className="text-blue-700">Entregables:</span>{' '}
                          {r.timeline?.deliverables?.length
                            ? r.timeline.deliverables.join(', ')
                            : '—'}
                        </div>
                        {r.timeline?.startDate || r.timeline?.endDate ? (
                          <div className="mt-2 text-blue-800">
                            Fechas: {r.timeline?.startDate || '—'} → {r.timeline?.endDate || '—'}
                          </div>
                        ) : null}
                      </div>
                      {r.influencerApplicant?.id ? (
                        <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 space-y-2">
                          <div className="font-medium text-amber-950">
                            ObjectId del influencer (atribución de cupón QR en Link4Deal)
                          </div>
                          <p className="text-xs text-amber-900 leading-relaxed">
                            Este es el documento público influencer en la base de datos (24 caracteres
                            hexadecimales). El formulario que emite cupones debe enviarlo como{' '}
                            <code className="rounded bg-white/70 px-1 py-px border border-amber-200/80 text-[11px]">
                              influencerId
                            </code>{' '}
                            o estar logueado con una cuenta influencer vinculada a este perfil. No se actualiza al
                            aprobar la solicitud.
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <code className="text-xs bg-white/80 px-2 py-1 rounded border border-amber-200 break-all max-w-full flex-1 min-w-[12rem]">
                              {r.influencerApplicant.id}
                            </code>
                            <button
                              type="button"
                              onClick={() => copyApplicantObjectId(r.influencerApplicant!.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-800 text-white text-xs font-medium hover:bg-amber-900"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              {copiedApplicantObjectId === r.influencerApplicant.id ? 'Copiado' : 'Copiar'}
                            </button>
                            <Link
                              to={`/influencer/${encodeURIComponent(r.influencerApplicant.id)}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-300 text-amber-950 text-xs font-medium hover:bg-amber-100/80"
                            >
                              Ver perfil
                            </Link>
                          </div>
                        </div>
                      ) : null}
                      {r.pricing ? (
                        <div className="text-gray-700">
                          <span className="font-medium">Propuesta económica:</span>{' '}
                          {r.pricing.type} · {r.pricing.amount} {r.pricing.currency}
                        </div>
                      ) : null}
                      {r.additionalNotes ? (
                        <div className="rounded-lg border border-gray-200 bg-white p-3">
                          <div className="font-medium text-gray-900 mb-1">Notas adicionales</div>
                          <p className="text-gray-700 whitespace-pre-wrap">{r.additionalNotes}</p>
                        </div>
                      ) : null}
                      {r.portfolio?.length ? (
                        <div>
                          <div className="font-medium text-gray-900 mb-2">Portfolio</div>
                          <ul className="list-disc list-inside space-y-1 text-gray-700">
                            {r.portfolio.map((f, i) => (
                              <li key={`${r.id}-f-${i}`}>
                                {f.urlPath ? (
                                  <a
                                    href={f.urlPath}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-emerald-700 underline"
                                  >
                                    {f.originalName || f.urlPath}
                                  </a>
                                ) : (
                                  f.originalName || 'Archivo'
                                )}
                                {f.mimeType ? (
                                  <span className="text-gray-500 text-xs ml-1">({f.mimeType})</span>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
