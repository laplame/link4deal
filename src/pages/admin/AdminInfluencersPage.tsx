import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Users, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { canAccessAdminRoute, DASHBOARD_ROUTES } from '../../config/dashboardContexts';

/**
 * Administración Link4Deal — influencers (staff).
 * No confundir con el hub del creador (/influencer).
 */
export default function AdminInfluencersPage() {
  const { isAuthenticated, isLoading, user, primaryRole } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: DASHBOARD_ROUTES.admin.influencers }} />;
  }

  if (primaryRole === 'influencer' && !user?.isSuperAdmin && !user?.isPlatformSuperuser) {
    return <Navigate to={DASHBOARD_ROUTES.role.influencer} replace />;
  }

  if (!canAccessAdminRoute(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Link to={DASHBOARD_ROUTES.admin.home} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-5 h-5" />
            Panel Admin
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-purple-600" />
            Admin — Influencers
          </h1>
          <p className="text-gray-600 mt-2 text-sm">
            Gestión interna Link4Deal. El panel del creador (cupones, UGC, mensajes) vive en{' '}
            <Link to={DASHBOARD_ROUTES.role.influencer} className="text-purple-700 font-medium underline">
              /influencer/panel
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 grid gap-4 sm:grid-cols-2">
        <Link
          to={DASHBOARD_ROUTES.admin.crm}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:border-purple-300 hover:shadow-md transition-all"
        >
          <Users className="w-8 h-8 text-purple-600 mb-3" />
          <h2 className="font-semibold text-gray-900">CRM Influencers</h2>
          <p className="text-sm text-gray-600 mt-1">Activación, outreach, apps, instalaciones.</p>
        </Link>
        <a
          href="/influencer"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:border-purple-300 hover:shadow-md transition-all"
        >
          <ExternalLink className="w-8 h-8 text-gray-500 mb-3" />
          <h2 className="font-semibold text-gray-900">Marketplace público</h2>
          <p className="text-sm text-gray-600 mt-1">Listado /influencer en el sitio.</p>
        </a>
        <Link
          to={DASHBOARD_ROUTES.role.influencer}
          className="rounded-xl border border-dashed border-purple-200 bg-purple-50/50 p-6 hover:bg-purple-50 transition-all sm:col-span-2"
        >
          <h2 className="font-semibold text-purple-900">Vista previa: panel creador</h2>
          <p className="text-sm text-purple-800 mt-1">Abrir el dashboard como lo ve un influencer (no es admin).</p>
        </Link>
      </div>
    </div>
  );
}
