import React, { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Loader2,
  Lock,
  Save,
  Upload,
  User,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getAdminAccessPin,
  isAdminPinUnlockSession,
  setAdminPinUnlockSession,
} from '../../config/adminAccess';
import { mediaUrl } from '../../utils/apiUrl';
import { influencerProfilePath } from '../../utils/influencerPublicSlug';
import {
  fetchCrmInfluencers,
  fetchCrmInfluencerDetail,
  patchCrmInfluencer,
  uploadCrmInfluencerAvatar,
  type CrmInfluencerRow,
  type CrmInfluencerDetail,
} from '../../services/adminCrm';

export default function AdminInfluencerProfilesPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const isSuperAdmin = user?.isSuperAdmin === true;
  const [unlocked, setUnlocked] = useState(() => isAdminPinUnlockSession());
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<CrmInfluencerRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CrmInfluencerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editShortCode, setEditShortCode] = useState('');
  const [editStatus, setEditStatus] = useState('pending');
  const [editIdentity, setEditIdentity] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [editIg, setEditIg] = useState('');
  const [editTt, setEditTt] = useState('');
  const [editYt, setEditYt] = useState('');
  const [editTw, setEditTw] = useState('');
  const [editCategories, setEditCategories] = useState('');
  const [editFollowersIg, setEditFollowersIg] = useState('');
  const [editFollowersTt, setEditFollowersTt] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');

  const loadList = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const list = await fetchCrmInfluencers({
        page: 1,
        limit: 80,
        search: search.trim() || undefined,
      });
      setRows(list.docs);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar influencers');
      setRows([]);
    } finally {
      setLoadingList(false);
    }
  }, [search]);

  useEffect(() => {
    if (!unlocked || !isSuperAdmin) return;
    const t = window.setTimeout(() => void loadList(), 300);
    return () => window.clearTimeout(t);
  }, [unlocked, isSuperAdmin, loadList]);

  const applyDetailToForm = (d: CrmInfluencerDetail) => {
    setEditName(d.name || '');
    setEditUsername(d.username || '');
    setEditBio(d.bio || '');
    setEditShortCode(d.profileShortCode || '');
    setEditStatus(d.status || 'pending');
    setEditIdentity(d.identityVerificationStatus || 'pending');
    setEditIg(d.socialMedia?.instagram || '');
    setEditTt(d.socialMedia?.tiktok || '');
    setEditYt(d.socialMedia?.youtube || '');
    setEditTw(d.socialMedia?.twitter || '');
    setEditCategories((d.categories || []).join(', '));
    setEditFollowersIg(String(d.followers?.instagram ?? ''));
    setEditFollowersTt(String(d.followers?.tiktok ?? ''));
    setAvatarPreview(d.avatar || '');
  };

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
        applyDetailToForm(d);
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

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setSuccessMsg(null);
    setError(null);
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedId) return;
    setUploading(true);
    setError(null);
    try {
      const result = await uploadCrmInfluencerAvatar(selectedId, file);
      setAvatarPreview(result.avatarUrl);
      setSuccessMsg(
        result.savedToCloudinary
          ? 'Foto subida (Cloudinary + disco local)'
          : 'Foto guardada en disco — configura Cloudinary en producción',
      );
      const d = await fetchCrmInfluencerDetail(selectedId);
      setDetail(d);
      await loadList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir foto');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const categories = editCategories
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
      await patchCrmInfluencer(selectedId, {
        name: editName.trim(),
        username: editUsername.trim(),
        bio: editBio,
        profileShortCode: editShortCode.trim(),
        status: editStatus,
        identityVerificationStatus: editIdentity,
        socialMedia: {
          instagram: editIg,
          tiktok: editTt,
          youtube: editYt,
          twitter: editTw,
        },
        categories,
        followers: {
          instagram: editFollowersIg ? Number(editFollowersIg) : 0,
          tiktok: editFollowersTt ? Number(editFollowersTt) : 0,
        },
      });
      const d = await fetchCrmInfluencerDetail(selectedId);
      setDetail(d);
      applyDetailToForm(d);
      await loadList();
      setSuccessMsg('Perfil guardado correctamente');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
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
            } else setPinError(true);
          }}
        >
          <Lock className="w-10 h-10 text-violet-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white text-center mb-2">Perfiles influencers</h1>
          <input
            type="password"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white mb-2"
          />
          {pinError && <p className="text-red-400 text-sm text-center">PIN incorrecto</p>}
          <button type="submit" className="w-full py-2 rounded-lg bg-violet-600 text-white font-medium">
            Entrar
          </button>
          <Link to="/admin/crm" className="block text-center text-sm text-slate-500 mt-4 hover:text-slate-300">
            Volver al CRM
          </Link>
        </form>
      </div>
    );
  }

  const publicPath = detail
    ? influencerProfilePath({
        id: detail.id,
        username: detail.username,
        name: detail.name,
        socialMedia: detail.socialMedia,
      })
    : null;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-violet-900 text-white">
        <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Link to="/admin/crm" className="p-2 rounded-lg hover:bg-violet-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold">Perfiles y fotos · Influencers</h1>
              <p className="text-xs text-violet-200">Subir avatar y editar datos del perfil público</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</div>
        )}
        {successMsg && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
            {successMsg}
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar nombre o @usuario"
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
            <ul className="max-h-[70vh] overflow-y-auto divide-y">
              {loadingList ? (
                <li className="p-6 text-center text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </li>
              ) : rows.length === 0 ? (
                <li className="p-6 text-center text-sm text-gray-500">Sin resultados</li>
              ) : (
                rows.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(row.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-violet-50 ${
                        selectedId === row.id ? 'bg-violet-100' : ''
                      }`}
                    >
                      <img
                        src={mediaUrl(row.avatar, row.name)}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover bg-gray-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{row.name || row.username}</p>
                        <p className="text-xs text-gray-500 truncate">@{row.username}</p>
                      </div>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="lg:col-span-3 bg-white rounded-xl border shadow-sm p-5 min-h-[400px]">
            {!selectedId ? (
              <p className="text-gray-500 text-sm text-center py-16">Selecciona un influencer de la lista</p>
            ) : detailLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="relative">
                    <img
                      src={mediaUrl(avatarPreview, editName)}
                      alt=""
                      className="w-24 h-24 rounded-2xl object-cover border-2 border-violet-200 bg-gray-100"
                    />
                    <label
                      className={`absolute -bottom-2 -right-2 p-2 rounded-full bg-violet-600 text-white cursor-pointer shadow ${
                        uploading ? 'opacity-60 pointer-events-none' : ''
                      }`}
                    >
                      {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="sr-only"
                        onChange={(e) => void handleAvatarFile(e)}
                      />
                    </label>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-xs text-gray-500">ID: {selectedId}</p>
                    {publicPath && (
                      <a
                        href={publicPath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-violet-700 hover:underline inline-flex items-center gap-1 mt-1"
                      >
                        Ver perfil público <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {editShortCode && (
                      <p className="text-xs text-gray-600 mt-1">
                        Código: <code className="bg-gray-100 px-1 rounded">{editShortCode}</code>
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Completitud: {detail?.profileCompleteness ?? 0}%
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="text-sm block">
                    <span className="text-gray-600 text-xs">Nombre público</span>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="mt-1 w-full border rounded-lg px-3 py-2"
                    />
                  </label>
                  <label className="text-sm block">
                    <span className="text-gray-600 text-xs">@username</span>
                    <input
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="mt-1 w-full border rounded-lg px-3 py-2"
                    />
                  </label>
                  <label className="text-sm block sm:col-span-2">
                    <span className="text-gray-600 text-xs">Bio</span>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      rows={3}
                      className="mt-1 w-full border rounded-lg px-3 py-2"
                    />
                  </label>
                  <label className="text-sm block">
                    <span className="text-gray-600 text-xs">Código corto perfil</span>
                    <input
                      value={editShortCode}
                      onChange={(e) => setEditShortCode(e.target.value.toUpperCase())}
                      className="mt-1 w-full border rounded-lg px-3 py-2 font-mono"
                    />
                  </label>
                  <label className="text-sm block">
                    <span className="text-gray-600 text-xs">Estado cuenta</span>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="mt-1 w-full border rounded-lg px-3 py-2"
                    >
                      <option value="pending">pending</option>
                      <option value="active">active</option>
                      <option value="verified">verified</option>
                      <option value="suspended">suspended</option>
                    </select>
                  </label>
                  <label className="text-sm block">
                    <span className="text-gray-600 text-xs">Verificación identidad</span>
                    <select
                      value={editIdentity}
                      onChange={(e) =>
                        setEditIdentity(e.target.value as 'pending' | 'approved' | 'rejected')
                      }
                      className="mt-1 w-full border rounded-lg px-3 py-2"
                    >
                      <option value="pending">pending</option>
                      <option value="approved">approved</option>
                      <option value="rejected">rejected</option>
                    </select>
                  </label>
                  <label className="text-sm block sm:col-span-2">
                    <span className="text-gray-600 text-xs">Categorías (separadas por coma)</span>
                    <input
                      value={editCategories}
                      onChange={(e) => setEditCategories(e.target.value)}
                      className="mt-1 w-full border rounded-lg px-3 py-2"
                      placeholder="moda, belleza, lifestyle"
                    />
                  </label>
                </div>

                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs font-semibold text-gray-700 uppercase mb-2 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> Redes sociales
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <input
                      value={editIg}
                      onChange={(e) => setEditIg(e.target.value)}
                      placeholder="Instagram"
                      className="border rounded-lg px-3 py-2 text-sm"
                    />
                    <input
                      value={editTt}
                      onChange={(e) => setEditTt(e.target.value)}
                      placeholder="TikTok"
                      className="border rounded-lg px-3 py-2 text-sm"
                    />
                    <input
                      value={editYt}
                      onChange={(e) => setEditYt(e.target.value)}
                      placeholder="YouTube"
                      className="border rounded-lg px-3 py-2 text-sm"
                    />
                    <input
                      value={editTw}
                      onChange={(e) => setEditTw(e.target.value)}
                      placeholder="Twitter / X"
                      className="border rounded-lg px-3 py-2 text-sm"
                    />
                    <input
                      value={editFollowersIg}
                      onChange={(e) => setEditFollowersIg(e.target.value)}
                      placeholder="Seguidores IG"
                      type="number"
                      className="border rounded-lg px-3 py-2 text-sm"
                    />
                    <input
                      value={editFollowersTt}
                      onChange={(e) => setEditFollowersTt(e.target.value)}
                      placeholder="Seguidores TikTok"
                      type="number"
                      className="border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Guardar perfil
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
