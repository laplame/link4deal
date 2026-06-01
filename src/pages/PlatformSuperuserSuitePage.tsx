import React from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  Building2,
  Briefcase,
  Home,
  LogOut,
  LayoutGrid,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import InfluencerDashboard from './dashboards/InfluencerDashboard';
import BrandOwnerDashboard from './dashboards/BrandOwnerDashboard';
import AgencyDashboard from './dashboards/AgencyDashboard';
import { DASHBOARD_ROUTES } from '../config/dashboardContexts';
import type { DashboardPersona } from '../types/auth';
import { DASHBOARD_PERSONA_LABELS } from '../types/auth';

const PANELS: DashboardPersona[] = ['influencer', 'brand', 'agency'];

function isDashboardPersona(s: string | null): s is DashboardPersona {
  return s === 'influencer' || s === 'brand' || s === 'agency';
}

/**
 * Suite multi-panel: mismo usuario puede revisar las tres experiencias de dashboard
 * (creador, marca, agencia). Reservado a `isPlatformSuperuser` (lista de emails en servidor).
 */
export default function PlatformSuperuserSuitePage() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get('panel');
  const panel: DashboardPersona = isDashboardPersona(raw) ? raw : 'influencer';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: '/dashboard/suite' }} />;
  }

  if (!user?.isPlatformSuperuser && !user?.isSuperAdmin) {
    return <Navigate to="/marketplace" replace />;
  }

  const setPanel = (p: DashboardPersona) => {
    setSearchParams(p === 'influencer' ? {} : { panel: p }, { replace: true });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/signin', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-gray-100">
      <header className="border-b border-white/10 bg-gray-900/95 shrink-0 z-10">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <LayoutGrid className="h-6 w-6 text-amber-400 shrink-0" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">Multi-panel (superusuario)</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2" aria-label="Tipo de dashboard">
            {PANELS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPanel(p)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  panel === p
                    ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {p === 'influencer' && <Sparkles className="h-4 w-4 shrink-0" aria-hidden />}
                {p === 'brand' && <Building2 className="h-4 w-4 shrink-0" aria-hidden />}
                {p === 'agency' && <Briefcase className="h-4 w-4 shrink-0" aria-hidden />}
                {DASHBOARD_PERSONA_LABELS[p]}
              </button>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-white/10"
            >
              <User className="h-4 w-4 shrink-0" aria-hidden />
              Vista según rol
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-white/10"
            >
              <Home className="h-4 w-4 shrink-0" aria-hidden />
              Sitio
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden />
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <p className="text-center text-xs text-amber-200/90 bg-amber-950/40 py-1 border-b border-amber-500/20">
          Vista previa por rol (no es panel admin). Admin:{' '}
          <a href={DASHBOARD_ROUTES.admin.home} className="underline">
            /admin
          </a>
        </p>
        {panel === 'influencer' && <InfluencerDashboard />}
        {panel === 'brand' && <BrandOwnerDashboard />}
        {panel === 'agency' && <AgencyDashboard />}
      </div>
    </div>
  );
}
