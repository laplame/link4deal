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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { PrimaryRole } from '../../types/auth';

const ALLOWED_ROLES: PrimaryRole[] = ['admin', 'moderator', 'agency'];

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
  createdAt?: string;
  images?: { url?: string; filename?: string; cloudinaryUrl?: string }[];
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

export default function PromotionsManagePage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, primaryRole } = useAuth();
  const [promotions, setPromotions] = useState<PromotionDoc[]>([]);
  const [pagination, setPagination] = useState<PaginatedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const limit = 20;

  useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    if (!primaryRole || !ALLOWED_ROLES.includes(primaryRole)) {
      navigate('/dashboard', { replace: true });
      return;
    }
    fetchPromotions();
  }, [isAuthenticated, authLoading, primaryRole, page, statusFilter]);

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

  if (authLoading || (!primaryRole && isAuthenticated)) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate('/signin', { replace: true });
    return null;
  }

  if (!primaryRole || !ALLOWED_ROLES.includes(primaryRole)) {
    return (
      <div className="p-6">
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0" />
          <p className="text-amber-800">No tienes permiso para gestionar promociones. Solo administrador, moderador y agencia pueden acceder.</p>
          <Link to="/dashboard" className="text-amber-700 hover:text-amber-900 font-medium">Volver al dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="h-7 w-7" />
          Gestionar promociones
        </h1>
        <p className="text-gray-600 mt-1">
          Lista de promociones. Puedes ver detalles o eliminar (admin, moderador, agencia).
        </p>
      </div>

      {/* Filtros y búsqueda */}
      <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título, producto..."
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los estados</option>
          <option value="active">Activas</option>
          <option value="draft">Borrador</option>
          <option value="paused">Pausadas</option>
          <option value="expired">Expiradas</option>
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
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : promotions.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-gray-600">
          No hay promociones que coincidan con los filtros.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
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
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{p.title || p.productName || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <Tag className="h-3.5 w-3.5" />
                        {p.category || '—'}
                      </span>
                    </td>
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
                          onClick={() => setDeleteId(p._id)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                          Quitar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
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
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((prev) => prev + 1)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal confirmar eliminar */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Eliminar promoción</h3>
            <p className="text-gray-600 mb-4">
              ¿Estás seguro de que quieres eliminar esta promoción? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
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
    </div>
  );
}
