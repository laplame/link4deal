import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  Tag,
  AlertTriangle,
  Loader2,
  Package,
  Lock,
  Edit3,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  clearAdminPinUnlockSession,
  getAdminAccessPin,
  isAdminPinUnlockSession,
  setAdminPinUnlockSession,
} from '../../config/adminAccess';
import { getPromotionImageUrl } from '../../utils/promotionImage';

interface PromotionDoc {
  _id: string;
  title: string;
  productName?: string;
  description?: string;
  category?: string;
  status?: string;
  originalPrice?: number;
  currentPrice?: number;
  currency?: string;
  validUntil?: string;
  validFrom?: string;
  createdAt?: string;
  storeName?: string;
  brand?: string;
  images?: { url?: string; filename?: string; cloudinaryUrl?: string }[];
  redirectInsteadOfQr?: boolean;
  redirectToUrl?: string;
}

interface PaginatedData {
  docs: PromotionDoc[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const CATEGORIES = ['electronics', 'fashion', 'home', 'beauty', 'sports', 'books', 'food', 'other'];
const STATUSES = ['draft', 'active', 'paused', 'expired', 'deleted'];

export default function SuperAdminDashboardPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const isSuperAdmin = user?.isSuperAdmin === true;
  const [unlocked, setUnlocked] = useState(() => isAdminPinUnlockSession());
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [promotions, setPromotions] = useState<PromotionDoc[]>([]);
  const [pagination, setPagination] = useState<PaginatedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editPromo, setEditPromo] = useState<PromotionDoc | null>(null);
  const [editForm, setEditForm] = useState<Partial<PromotionDoc>>({});
  const [saving, setSaving] = useState(false);
  const [editNewFiles, setEditNewFiles] = useState<File[]>([]);

  const limit = 50;

  // Redirects: only inside useEffect to avoid "setState during render" / navigate during render
  useEffect(() => {
    if (authLoading && !isAdminPinUnlockSession()) return;
    if (isAdminPinUnlockSession()) {
      setUnlocked(true);
      return;
    }
    if (!isAuthenticated) {
      navigate('/signin', { replace: true });
      return;
    }
    if (!isSuperAdmin) {
      navigate('/dashboard', { replace: true });
      return;
    }
  }, [isAuthenticated, authLoading, isSuperAdmin, navigate]);

  useEffect(() => {
    if (!unlocked) return;
    fetchPromotions();
  }, [unlocked, page, statusFilter]);

  const fetchPromotions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (statusFilter) params.set('status', statusFilter); else params.set('status', 'all');
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/promotions?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al cargar promociones');
      if (data.data?.docs) {
        setPromotions(data.data.docs);
        setPagination({
          docs: data.data.docs,
          totalDocs: data.data.totalDocs ?? 0,
          limit: data.data.limit ?? limit,
          page: data.data.page ?? 1,
          totalPages: data.data.totalPages ?? 1,
          hasNextPage: data.data.hasNextPage ?? false,
          hasPrevPage: data.data.hasPrevPage ?? false,
        });
      } else {
        setPromotions([]);
        setPagination(null);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar promociones');
      setPromotions([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(false);
    if (pinInput === getAdminAccessPin()) {
      setAdminPinUnlockSession();
      setUnlocked(true);
      setPinInput('');
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleLock = () => {
    clearAdminPinUnlockSession();
    setUnlocked(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPromotions();
  };

  const handleDelete = async (id: string) => {
    if (!deleteId || deleteId !== id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/promotions/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al eliminar');
      setDeleteId(null);
      fetchPromotions();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al eliminar');
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (p: PromotionDoc) => {
    setEditPromo(p);
    setEditNewFiles([]);
    setEditForm({
      title: p.title,
      productName: p.productName,
      description: p.description,
      brand: p.brand,
      category: p.category,
      status: p.status,
      originalPrice: p.originalPrice,
      currentPrice: p.currentPrice,
      currency: p.currency,
      storeName: p.storeName,
      validFrom: p.validFrom ? (typeof p.validFrom === 'string' ? p.validFrom : new Date(p.validFrom).toISOString().slice(0, 10)) : undefined,
      validUntil: p.validUntil ? (typeof p.validUntil === 'string' ? p.validUntil : new Date(p.validUntil).toISOString().slice(0, 10)) : undefined,
      redirectInsteadOfQr: p.redirectInsteadOfQr ?? false,
      redirectToUrl: p.redirectToUrl ?? '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editPromo) return;
    setSaving(true);
    try {
      const hasFiles = editNewFiles.length > 0;
      if (hasFiles) {
        const fd = new FormData();
        const body = { ...editForm } as Record<string, unknown>;
        for (const [k, v] of Object.entries(body)) {
          if (v === undefined || v === null) continue;
          if (typeof v === 'boolean') {
            fd.append(k, v ? 'true' : 'false');
          } else {
            fd.append(k, String(v));
          }
        }
        editNewFiles.forEach((file) => fd.append('images', file));
        const res = await fetch(`/api/promotions/${editPromo._id}`, {
          method: 'PUT',
          body: fd,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error al guardar');
      } else {
        const body: Record<string, unknown> = { ...editForm };
        const res = await fetch(`/api/promotions/${editPromo._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error al guardar');
      }
      setEditPromo(null);
      setEditNewFiles([]);
      fetchPromotions();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading && !isAdminPinUnlockSession()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAdminPinUnlockSession()) {
    if (!isAuthenticated) {
      return null;
    }
    if (!isSuperAdmin) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-6 max-w-md text-center">
            <AlertTriangle className="h-12 w-12 text-amber-600 mx-auto mb-3" />
            <p className="text-amber-800 font-medium">Solo super administrador puede acceder a esta página.</p>
            <Link to="/dashboard" className="mt-4 inline-block text-amber-700 hover:text-amber-900 font-medium">
              Volver al dashboard
            </Link>
          </div>
        </div>
      );
    }
  }

  // Page lock: PIN
  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-4">
        <div className="w-full max-w-xs bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
              <Lock className="h-8 w-8 text-slate-600" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-900 text-center mb-1">Super Admin</h1>
          <p className="text-sm text-gray-500 text-center mb-6">Introduce el PIN de 4 dígitos</p>
          <form onSubmit={handlePinSubmit}>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pinInput}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                setPinInput(v);
                setPinError(false);
              }}
              placeholder="••••"
              className="w-full text-center text-2xl tracking-[0.5em] px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            {pinError && (
              <p className="mt-2 text-sm text-red-600 text-center">PIN incorrecto</p>
            )}
            <button
              type="submit"
              className="w-full mt-4 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700"
            >
              Desbloquear
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main content: all promotions
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-6 w-6" />
            Super Admin – Todas las promociones
          </h1>
          <div className="flex items-center gap-3">
            <Link to="/admin/api-docs" className="text-sm text-gray-600 hover:text-gray-900">API Docs</Link>
            <Link to="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">Dashboard</Link>
            <button
              type="button"
              onClick={handleLock}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
            >
              <Lock className="h-4 w-4" />
              Bloquear
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3 mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, producto..."
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-64"
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Search className="h-4 w-4" />
            Buscar
          </button>
        </form>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-red-800 text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : promotions.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-600">
            No hay promociones que coincidan con los filtros.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tienda / Marca</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vigencia</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {promotions.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{p.title || p.productName || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{p.storeName || p.brand || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{p.category || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          p.status === 'active' ? 'bg-green-100 text-green-800' :
                          p.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                          p.status === 'expired' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {p.status || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {p.currentPrice != null && p.currency
                          ? `${p.currency} ${Number(p.currentPrice).toLocaleString()}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {p.validUntil ? new Date(p.validUntil).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/promotion-details/${p._id}`}
                            className="inline-flex items-center gap-1 px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Eye className="h-4 w-4" />
                            Ver
                          </Link>
                          <button
                            type="button"
                            onClick={() => openEdit(p)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-sm text-amber-600 hover:bg-amber-50 rounded"
                          >
                            <Edit3 className="h-4 w-4" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(p._id)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                            Borrar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Página {pagination.page} de {pagination.totalPages} ({pagination.totalDocs} en total)
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!pagination.hasPrevPage}
                    onClick={() => setPage((prev) => prev - 1)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={!pagination.hasNextPage}
                    onClick={() => setPage((prev) => prev + 1)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal eliminar */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Eliminar promoción</h3>
            <p className="text-gray-600 mb-4">¿Estás seguro? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteId(null)} disabled={deleting} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar */}
      {editPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full my-8 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Editar promoción</h3>
              <button type="button" onClick={() => setEditPromo(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Imágenes</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {!editPromo.images?.length ? (
                    <p className="text-sm text-gray-500">Sin imágenes en esta promoción</p>
                  ) : (
                    editPromo.images.map((im, idx) => (
                      <img
                        key={idx}
                        src={getPromotionImageUrl([im])}
                        alt=""
                        className="h-20 w-20 object-cover rounded-lg border border-gray-200 bg-white"
                      />
                    ))
                  )}
                </div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Añadir más fotos</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={(e) => setEditNewFiles(Array.from(e.target.files || []))}
                  className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-slate-200 file:text-slate-900"
                />
                {editNewFiles.length > 0 && (
                  <p className="text-xs text-amber-700 mt-1 font-medium">
                    {editNewFiles.length} archivo(s) nuevos (se suben al guardar; no reemplazan las actuales)
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  type="text"
                  value={editForm.title ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={editForm.description ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                  <input
                    type="text"
                    value={editForm.brand ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, brand: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select
                    value={editForm.category ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    value={editForm.status ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tienda</label>
                  <input
                    type="text"
                    value={editForm.storeName ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, storeName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio original</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.originalPrice ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, originalPrice: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio actual</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.currentPrice ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, currentPrice: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Válida desde</label>
                  <input
                    type="date"
                    value={editForm.validFrom ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, validFrom: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Válida hasta</label>
                  <input
                    type="date"
                    value={editForm.validUntil ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, validUntil: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4 mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Tipo de promoción</p>
                <div className="flex flex-wrap gap-4 mb-3">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="editRedirectType"
                      checked={!editForm.redirectInsteadOfQr}
                      onChange={() => setEditForm((f) => ({ ...f, redirectInsteadOfQr: false, redirectToUrl: '' }))}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Cupón con QR</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="editRedirectType"
                      checked={!!editForm.redirectInsteadOfQr}
                      onChange={() => setEditForm((f) => ({ ...f, redirectInsteadOfQr: true }))}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Quick promotion (redirección)</span>
                  </label>
                </div>
                {editForm.redirectInsteadOfQr && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL de redirección (vacío = Amazon por defecto)</label>
                    <input
                      type="url"
                      value={editForm.redirectToUrl ?? ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, redirectToUrl: e.target.value }))}
                      placeholder="https://amzn.to/... o https://www.adidas.mx/..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditPromo(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
