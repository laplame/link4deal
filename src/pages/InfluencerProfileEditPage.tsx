import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  Save,
  Upload,
  Instagram,
  Youtube,
  Twitter,
  Music2,
  ImagePlus,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { canAccessAdminCrm } from '../config/adminAccess';
import { apiUrl, mediaUrl } from '../utils/apiUrl';
import { fetchInfluencerByPublicSlug } from '../utils/fetchInfluencerByPublicSlug';

type EditAccessMode = 'me' | 'admin' | 'claim' | 'denied';

type FollowerKey = 'instagram' | 'tiktok' | 'youtube' | 'twitter';

type FormState = {
  name: string;
  bio: string;
  location: string;
  avatar: string;
  categories: string;
  languages: string;
  socialMedia: Record<FollowerKey, string>;
  followers: Record<FollowerKey, string>;
};

function asString(v: unknown): string {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function buildFormFromData(d: Record<string, unknown>): FormState {
  const sm = (d.socialMedia || {}) as Record<string, unknown>;
  const fo = (d.followers || {}) as Record<string, unknown>;
  const categories = Array.isArray(d.categories) ? (d.categories as unknown[]).map(String) : [];
  const languages = Array.isArray(d.languages) ? (d.languages as unknown[]).map(String) : [];
  return {
    name: asString(d.name),
    bio: asString(d.bio),
    location: asString(d.location),
    avatar: asString(d.avatar),
    categories: categories.join(', '),
    languages: languages.join(', '),
    socialMedia: {
      instagram: asString(sm.instagram),
      tiktok: asString(sm.tiktok),
      youtube: asString(sm.youtube),
      twitter: asString(sm.twitter),
    },
    followers: {
      instagram: String(Number(fo.instagram) || 0),
      tiktok: String(Number(fo.tiktok) || 0),
      youtube: String(Number(fo.youtube) || 0),
      twitter: String(Number(fo.twitter) || 0),
    },
  };
}

function csvToArray(v: string): string[] {
  return v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function InfluencerProfileEditPage() {
  const { influencerSlug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, token, user } = useAuth();
  const isAdminEditor = canAccessAdminCrm(user);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notAllowed, setNotAllowed] = useState(false);
  const [accessMessage, setAccessMessage] = useState<string | null>(null);
  const [canClaim, setCanClaim] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [linkedProfileSlug, setLinkedProfileSlug] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string>('');
  const [editMode, setEditMode] = useState<'me' | 'admin' | null>(null);
  const [form, setForm] = useState<FormState | null>(null);

  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      const redirect = encodeURIComponent(`/influencer/${influencerSlug || ''}/edit`);
      navigate(`/signin?redirect=${redirect}`, { replace: true });
    }
  }, [authLoading, isAuthenticated, influencerSlug, navigate]);

  useEffect(() => {
    if (!influencerSlug || !isAuthenticated || authLoading || !token) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNotAllowed(false);
    setCanClaim(false);
    setAccessMessage(null);
    setLinkedProfileSlug(null);

    (async () => {
      try {
        const result = await fetchInfluencerByPublicSlug(influencerSlug);
        if (cancelled) return;
        if (!result.ok) {
          setError(result.message);
          return;
        }
        const target = result.data;
        const tId = asString(target.id);
        setTargetId(tId);

        // Superuser / super admin: edita cualquier perfil vía CRM (sin vincular cuenta influencer).
        if (isAdminEditor) {
          setEditMode('admin');
          setForm(buildFormFromData(target));
          return;
        }

        const accessRes = await fetch(
          apiUrl(`/api/influencers/me/edit-access?slug=${encodeURIComponent(influencerSlug)}`),
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const accessData = await accessRes.json().catch(() => ({}));
        if (cancelled) return;

        if (!accessRes.ok || !accessData?.success) {
          setError(accessData?.message || 'No se pudo verificar el acceso al editor.');
          return;
        }

        const access = accessData.data as {
          allowed?: boolean;
          mode?: EditAccessMode;
          canClaim?: boolean;
          message?: string;
          linkedProfileSlug?: string;
        };

        if (access.allowed && access.mode === 'me') {
          setEditMode('me');
        } else if (access.allowed && access.mode === 'admin') {
          setEditMode('admin');
        } else if (access.mode === 'claim' && access.canClaim) {
          setNotAllowed(true);
          setCanClaim(true);
          setAccessMessage(
            access.message ||
              'Este perfil aún no está vinculado a ninguna cuenta. Vincúlalo a la tuya para editarlo.',
          );
          return;
        } else {
          setNotAllowed(true);
          setAccessMessage(
            access.message ||
              'No tienes permiso para editar este perfil. Solo el dueño del perfil o un administrador pueden hacerlo.',
          );
          if (access.linkedProfileSlug) setLinkedProfileSlug(String(access.linkedProfileSlug));
          return;
        }

        setForm(buildFormFromData(target));
      } catch {
        if (!cancelled) setError('No se pudo conectar con el servidor.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [influencerSlug, isAuthenticated, authLoading, token, isAdminEditor]);

  const handleClaimProfile = async () => {
    if (!influencerSlug || !token) return;
    setClaiming(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/influencers/me/claim'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug: influencerSlug }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'No se pudo vincular el perfil');
      }
      setCanClaim(false);
      setNotAllowed(false);
      setEditMode('me');
      setForm(buildFormFromData(data.data || {}));
      setSavedMsg('Perfil vinculado a tu cuenta. Ya puedes editarlo.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo vincular el perfil');
    } finally {
      setClaiming(false);
    }
  };

  const updateField = (key: keyof FormState, value: string) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };
  const updateSocial = (key: FollowerKey, value: string) => {
    setForm((prev) => (prev ? { ...prev, socialMedia: { ...prev.socialMedia, [key]: value } } : prev));
  };
  const updateFollowers = (key: FollowerKey, value: string) => {
    setForm((prev) => (prev ? { ...prev, followers: { ...prev.followers, [key]: value } } : prev));
  };

  const handleAvatarFile = async (file: File | null) => {
    if (!file || !editMode) return;
    setUploadingAvatar(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const url =
        editMode === 'admin'
          ? apiUrl(`/api/admin/crm/influencers/${targetId}/avatar`)
          : apiUrl('/api/influencers/avatar');
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'No se pudo subir la imagen');
      }
      const newUrl =
        asString(data?.data?.avatarUrl) ||
        asString(data?.data?.cloudinaryUrl) ||
        asString(data?.data?.avatar);
      if (newUrl) updateField('avatar', newUrl);
      setSavedMsg('Foto actualizada. No olvides Guardar para confirmar el resto de cambios.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo subir la imagen');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!form || !editMode) return;
    setSaving(true);
    setError(null);
    setSavedMsg(null);
    try {
      const payload = {
        name: form.name,
        bio: form.bio,
        location: form.location,
        avatar: form.avatar,
        categories: csvToArray(form.categories),
        languages: csvToArray(form.languages),
        socialMedia: form.socialMedia,
        followers: {
          instagram: Number(form.followers.instagram) || 0,
          tiktok: Number(form.followers.tiktok) || 0,
          youtube: Number(form.followers.youtube) || 0,
          twitter: Number(form.followers.twitter) || 0,
        },
      };
      const url =
        editMode === 'admin'
          ? apiUrl(`/api/admin/crm/influencers/${targetId}`)
          : apiUrl('/api/influencers/me');
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'No se pudo guardar el perfil');
      }
      setSavedMsg('Perfil guardado correctamente.');
      window.setTimeout(() => {
        navigate(`/influencer/${encodeURIComponent(influencerSlug || '')}`);
      }, 900);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center px-4">
        <div className="flex items-center gap-2 text-gray-700">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          Cargando editor…
        </div>
      </div>
    );
  }

  if (notAllowed) {
    return (
      <div className="container mx-auto max-w-md px-4 py-12 text-center">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-900 text-sm leading-relaxed">
          {accessMessage ||
            'No tienes permiso para editar este perfil. Solo el dueño del perfil o un administrador pueden hacerlo.'}
        </div>
        {canClaim && (
          <button
            type="button"
            onClick={() => void handleClaimProfile()}
            disabled={claiming}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-3 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
          >
            {claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Vincular este perfil a mi cuenta
          </button>
        )}
        {linkedProfileSlug && (
          <Link
            to={`/influencer/${encodeURIComponent(linkedProfileSlug)}/edit`}
            className="mt-3 block text-sm text-purple-700 underline"
          >
            Ir al perfil vinculado a tu cuenta
          </Link>
        )}
        {!canClaim && (
          <p className="mt-3 text-xs text-gray-600">
            ¿Creaste el perfil antes de registrarte? Cierra sesión e inicia con la misma cuenta, o usa{' '}
            <Link to="/influencer/auth" className="text-purple-700 underline">
              acceso de influencer
            </Link>
            .
          </p>
        )}
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        <Link
          to={`/influencer/${encodeURIComponent(influencerSlug || '')}`}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-white px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-50"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver al perfil
        </Link>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="container mx-auto max-w-md px-4 py-12 text-center">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-red-800">{error}</div>
        <Link
          to={`/influencer/${encodeURIComponent(influencerSlug || '')}`}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver al perfil
        </Link>
      </div>
    );
  }

  if (!form) return null;

  const socialFields: Array<{ key: FollowerKey; label: string; icon: React.ReactNode; placeholder: string }> = [
    { key: 'instagram', label: 'Instagram', icon: <Instagram className="h-4 w-4" />, placeholder: '@usuario' },
    { key: 'tiktok', label: 'TikTok', icon: <Music2 className="h-4 w-4" />, placeholder: '@usuario' },
    { key: 'youtube', label: 'YouTube', icon: <Youtube className="h-4 w-4" />, placeholder: 'canal o @usuario' },
    { key: 'twitter', label: 'X / Twitter', icon: <Twitter className="h-4 w-4" />, placeholder: '@usuario' },
  ];

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link
          to={`/influencer/${encodeURIComponent(influencerSlug || '')}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver al perfil
        </Link>
        {editMode === 'admin' ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-800">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            Modo administrador
          </span>
        ) : null}
      </div>

      <h1 className="text-2xl font-bold text-gray-900">Editar perfil</h1>
      <p className="mt-1 text-sm text-gray-500">
        Actualiza tu foto, textos, redes y métricas. Los cambios se reflejan en tu perfil público.
      </p>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {savedMsg ? (
        <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          {savedMsg}
        </p>
      ) : null}

      <div className="mt-6 space-y-6">
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Foto de perfil</h2>
          <div className="flex items-center gap-4">
            <img
              src={form.avatar ? mediaUrl(form.avatar, form.name) : mediaUrl('', form.name || 'IN')}
              alt="Avatar"
              className="h-20 w-20 rounded-full border object-cover"
            />
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void handleAvatarFile(e.target.files?.[0] || null)}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingAvatar}
                className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60"
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <ImagePlus className="h-4 w-4" aria-hidden />
                )}
                Subir nueva foto
              </button>
              <p className="mt-1.5 text-xs text-gray-400">JPG, PNG o WebP. Se sube al guardar la foto.</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Información</h2>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nombre público</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              placeholder="Tu nombre o marca"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Bio / descripción</label>
            <textarea
              value={form.bio}
              onChange={(e) => updateField('bio', e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              placeholder="Cuéntale a las marcas y a tu audiencia quién eres…"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Ubicación</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => updateField('location', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              placeholder="Ciudad, País"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Categorías</label>
              <input
                type="text"
                value={form.categories}
                onChange={(e) => updateField('categories', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                placeholder="moda, belleza, tecnología"
              />
              <p className="mt-1 text-xs text-gray-400">Separa con comas.</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Idiomas</label>
              <input
                type="text"
                value={form.languages}
                onChange={(e) => updateField('languages', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                placeholder="español, inglés"
              />
              <p className="mt-1 text-xs text-gray-400">Separa con comas.</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Redes y seguidores</h2>
          {socialFields.map((f) => (
            <div key={f.key} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                  {f.icon}
                  {f.label}
                </label>
                <input
                  type="text"
                  value={form.socialMedia[f.key]}
                  onChange={(e) => updateSocial(f.key, e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  placeholder={f.placeholder}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Seguidores {f.label}</label>
                <input
                  type="number"
                  min={0}
                  value={form.followers[f.key]}
                  onChange={(e) => updateFollowers(f.key, e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  placeholder="0"
                />
              </div>
            </div>
          ))}
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
            Guardar cambios
          </button>
          <Link
            to={`/influencer/${encodeURIComponent(influencerSlug || '')}`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <Link
            to={`/influencer/${encodeURIComponent(influencerSlug || '')}/tienda`}
            className="ml-auto inline-flex items-center gap-1.5 text-sm text-purple-700 hover:underline"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            Ver tienda
          </Link>
        </div>
      </div>
    </div>
  );
}
