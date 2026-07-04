import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  ArrowLeft,
  Globe2,
  Loader2,
  Lock,
  Search,
  Tags,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  clearAdminPinUnlockSession,
  getAdminAccessPin,
  isAdminPinUnlockSession,
  setAdminPinUnlockSession,
} from '../../config/adminAccess';
import {
  fetchCrmAccessiblePromotions,
  fetchCrmInfluencerCategories,
  patchPromotionAccessibility,
  type CrmAccessiblePromotion,
} from '../../services/adminCrm';

interface RowEdit {
  all: boolean;
  themes: string[];
  dirty: boolean;
  saving: boolean;
  saved: boolean;
  error: string | null;
}

function buildEditFromRow(r: CrmAccessiblePromotion): RowEdit {
  return {
    all: r.openToAllInfluencers,
    themes: [...r.openToInfluencerCategories],
    dirty: false,
    saving: false,
    saved: false,
    error: null,
  };
}

function sameThemes(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sb = new Set(b);
  return a.every((x) => sb.has(x));
}

export default function AdminOpenPromotionsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const isSuperAdmin = user?.isSuperAdmin === true;
  const [unlocked, setUnlocked] = useState(() => isAdminPinUnlockSession());
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [rows, setRows] = useState<CrmAccessiblePromotion[]>([]);
  const [edits, setEdits] = useState<Record<string, RowEdit>>({});
  const [themesCatalog, setThemesCatalog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const limit = 25;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCrmAccessiblePromotions({ search, page, limit });
      setRows(data.rows);
      setTotalPages(data.pagination.totalPages || 1);
      setEdits(() => {
        const next: Record<string, RowEdit> = {};
        for (const r of data.rows) next[r.id] = buildEditFromRow(r);
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    if (!unlocked || !isSuperAdmin) return;
    void load();
  }, [unlocked, isSuperAdmin, load]);

  useEffect(() => {
    if (!unlocked || !isSuperAdmin) return;
    fetchCrmInfluencerCategories()
      .then(setThemesCatalog)
      .catch(() => setThemesCatalog([]));
  }, [unlocked, isSuperAdmin]);

  const updateEdit = (id: string, patch: Partial<RowEdit>) => {
    setEdits((prev) => {
      const row = rows.find((r) => r.id === id);
      const cur = prev[id];
      if (!cur || !row) return prev;
      const merged = { ...cur, ...patch, saved: false, error: null };
      const dirty =
        merged.all !== row.openToAllInfluencers ||
        !sameThemes(merged.themes, row.openToInfluencerCategories);
      return { ...prev, [id]: { ...merged, dirty } };
    });
  };

  const toggleTheme = (id: string, theme: string) => {
    const cur = edits[id];
    if (!cur) return;
    const has = cur.themes.includes(theme);
    updateEdit(id, {
      themes: has ? cur.themes.filter((t) => t !== theme) : [...cur.themes, theme],
    });
  };

  const save = async (id: string) => {
    const cur = edits[id];
    if (!cur) return;
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], saving: true, error: null } }));
    try {
      const result = await patchPromotionAccessibility(id, {
        openToAllInfluencers: cur.all,
        openToInfluencerCategories: cur.themes,
      });
      setRows((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                openToAllInfluencers: result.openToAllInfluencers,
                openToInfluencerCategories: result.openToInfluencerCategories,
              }
            : r,
        ),
      );
      setEdits((prev) => ({
        ...prev,
        [id]: {
          all: result.openToAllInfluencers,
          themes: [...result.openToInfluencerCategories],
          dirty: false,
          saving: false,
          saved: true,
          error: null,
        },
      }));
    } catch (e) {
      setEdits((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          saving: false,
          error: e instanceof Error ? e.message : 'Error al guardar',
        },
      }));
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
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
          <Lock className="w-10 h-10 text-violet-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white text-center mb-2">CRM Super Admin</h1>
          <p className="text-sm text-slate-400 text-center mb-4">Centro de administración — PIN requerido</p>
          <input
            type="password"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white mb-2"
            autoFocus
          />
          {pinError && <p className="text-red-400 text-sm text-center mb-2">PIN incorrecto</p>}
          <button type="submit" className="w-full py-2 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-500">
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
      <header className="bg-slate-900 text-white border-b border-slate-800">
        <div className="container mx-auto px-4 py-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/admin/crm" className="p-2 rounded-lg hover:bg-slate-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-violet-400" />
                Promociones accesibles
              </h1>
              <p className="text-xs text-slate-400">
                Abre una promoción a todos los influencers o por temas (categorías del influencer).
              </p>
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

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <form
          className="flex gap-2 mb-5"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(searchInput);
          }}
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por título, marca o producto…"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-700">
            Buscar
          </button>
        </form>

        {error ? (
          <div className="mb-4 rounded-lg bg-red-50 text-red-800 text-sm px-4 py-3">{error}</div>
        ) : null}

        {loading ? (
          <p className="text-sm text-gray-500 flex items-center gap-2 py-10 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando promociones…
          </p>
        ) : rows.length === 0 ? (
          <p className="text-center text-gray-500 py-10">No se encontraron promociones.</p>
        ) : (
          <div className="space-y-4">
            {rows.map((r) => {
              const ed = edits[r.id];
              if (!ed) return null;
              const isOpenNow = r.openToAllInfluencers || r.openToInfluencerCategories.length > 0;
              return (
                <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{r.title}</p>
                      <p className="text-xs text-gray-500">
                        {r.brand || 'Sin marca'} · {r.status}
                        {r.redirectInsteadOfQr ? ' · redirect/Amazon' : ' · cupón QR'}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-[11px] font-medium px-2 py-1 rounded-full ${
                        isOpenNow ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {r.openToAllInfluencers
                        ? 'Abierta a todos'
                        : r.openToInfluencerCategories.length
                          ? `Por temas (${r.openToInfluencerCategories.length})`
                          : 'Solo por solicitud'}
                    </span>
                  </div>

                  <label className="mt-3 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ed.all}
                      onChange={(e) => updateEdit(r.id, { all: e.target.checked })}
                      className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                    />
                    <span className="text-sm font-medium text-gray-800">Accesible a todos los influencers</span>
                  </label>

                  <div className={`mt-3 ${ed.all ? 'opacity-40 pointer-events-none' : ''}`}>
                    <p className="text-xs font-medium text-gray-600 flex items-center gap-1 mb-2">
                      <Tags className="w-3.5 h-3.5" /> Por temas (categorías del influencer)
                    </p>
                    {themesCatalog.length === 0 ? (
                      <p className="text-xs text-gray-400">No hay temas/categorías de influencers registrados.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {themesCatalog.map((theme) => {
                          const active = ed.themes.includes(theme);
                          return (
                            <button
                              key={theme}
                              type="button"
                              onClick={() => toggleTheme(r.id, theme)}
                              className={`text-xs px-2.5 py-1 rounded-full border transition ${
                                active
                                  ? 'bg-violet-600 border-violet-600 text-white'
                                  : 'bg-white border-gray-300 text-gray-700 hover:border-violet-400'
                              }`}
                            >
                              {theme}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-3">
                    {ed.error ? <span className="text-xs text-red-600 mr-auto">{ed.error}</span> : null}
                    {ed.saved ? (
                      <span className="text-xs text-emerald-600 mr-auto flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Guardado
                      </span>
                    ) : null}
                    <button
                      type="button"
                      disabled={!ed.dirty || ed.saving}
                      onClick={() => save(r.id)}
                      className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {ed.saving ? 'Guardando…' : 'Guardar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 ? (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600">
              Página {page} de {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
