import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Camera,
  Instagram,
  LayoutGrid,
  Lock,
  Loader2,
  Radio,
  FileCheck,
  Globe2,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  clearAdminPinUnlockSession,
  getAdminAccessPin,
  isAdminPinUnlockSession,
  setAdminPinUnlockSession,
} from '../../config/adminAccess';
import { fetchCrmStats, type CrmStats } from '../../services/adminCrm';

const tiles = [
  {
    title: 'Pipeline de influencers',
    description: 'Activación, outreach, monetización, identidad y promos redirect.',
    to: '/admin/crm/pipeline',
    icon: LayoutGrid,
    color: 'from-slate-800 to-slate-900',
  },
  {
    title: 'Solicitudes de promoción',
    description: 'Ver y aceptar aplicaciones del marketplace (cupón o URL).',
    to: '/admin/crm/applications',
    icon: FileCheck,
    color: 'from-emerald-600 to-teal-800',
  },
  {
    title: 'Promociones accesibles',
    description: 'Abrir una promoción a todos los influencers o por temas (categorías).',
    to: '/admin/crm/open-promotions',
    icon: Globe2,
    color: 'from-sky-600 to-indigo-800',
  },
  {
    title: 'Perfiles y fotos',
    description: 'Subir avatar, editar bio, redes, categorías y estado del perfil.',
    to: '/admin/crm/influencers',
    icon: Camera,
    color: 'from-violet-600 to-purple-800',
  },
  {
    title: 'Leads Instagram',
    description: 'Webhooks, sync y asignación de leads desde Meta.',
    to: '/admin/crm/instagram-leads',
    icon: Instagram,
    color: 'from-pink-600 to-orange-700',
  },
  {
    title: 'Todas las promociones',
    description: 'Dashboard super admin: editar y borrar promociones de cualquier shop.',
    to: '/admin/dashboard',
    icon: FileCheck,
    color: 'from-emerald-700 to-teal-900',
  },
  {
    title: 'Redenciones en vivo',
    description: 'Monitor de canjes y actividad POS.',
    to: '/redenciones-en-vivo',
    icon: Radio,
    color: 'from-amber-600 to-orange-800',
    external: false,
  },
];

export default function AdminCrmHubPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const isSuperAdmin = user?.isSuperAdmin === true;
  const [unlocked, setUnlocked] = useState(() => isAdminPinUnlockSession());
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [stats, setStats] = useState<CrmStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (!unlocked || !isSuperAdmin) return;
    setLoadingStats(true);
    fetchCrmStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoadingStats(false));
  }, [unlocked, isSuperAdmin]);

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
        <div className="container mx-auto px-4 py-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="p-2 rounded-lg hover:bg-slate-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-violet-400" />
                CRM · Super Admin
              </h1>
              <p className="text-xs text-slate-400">Dashboard de administración central</p>
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

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {loadingStats ? (
          <p className="text-sm text-gray-500 mb-6 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando resumen…
          </p>
        ) : stats ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500">Influencers</p>
              <p className="text-2xl font-bold">{stats.totalInfluencers}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500">Términos OK</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.termsAccepted}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500">Identidad pendiente</p>
              <p className="text-2xl font-bold text-amber-600">{stats.pendingIdentityVerification}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500">Con app DC</p>
              <p className="text-2xl font-bold">{stats.withDamecodigoApp}</p>
            </div>
          </div>
        ) : null}

        <div className="grid sm:grid-cols-2 gap-4">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            const inner = (
              <div
                className={`rounded-2xl bg-gradient-to-br ${tile.color} p-5 text-white h-full flex flex-col shadow-lg hover:shadow-xl transition-shadow`}
              >
                <Icon className="w-8 h-8 mb-3 opacity-90" />
                <h2 className="text-lg font-semibold">{tile.title}</h2>
                <p className="text-sm text-white/80 mt-1 flex-1">{tile.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-white/90">
                  Abrir <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            );
            return tile.external === false ? (
              <Link key={tile.to} to={tile.to} className="block">
                {inner}
              </Link>
            ) : (
              <Link key={tile.to} to={tile.to} className="block">
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
