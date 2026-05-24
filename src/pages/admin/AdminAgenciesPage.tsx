import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { canAccessAdminRoute, DASHBOARD_ROUTES } from '../../config/dashboardContexts';
import AgencyDashboard from '../dashboards/AgencyDashboard';

/** Admin Link4Deal: directorio / métricas de agencias (demo). */
export default function AdminAgenciesPage() {
  const { isAuthenticated, isLoading, primaryRole, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: DASHBOARD_ROUTES.admin.agencies }} />;
  }

  if (primaryRole === 'agency' && !user?.isSuperAdmin && !user?.isPlatformSuperuser) {
    return <Navigate to={DASHBOARD_ROUTES.role.agency} replace />;
  }

  if (!canAccessAdminRoute(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <div className="bg-slate-800 text-slate-100 text-center text-xs py-1.5 px-4">
        Administración Link4Deal — agencias · El panel de una agencia usa{' '}
        <a href={DASHBOARD_ROUTES.role.agency} className="underline font-medium">
          /dashboard/agency
        </a>
      </div>
      <AgencyDashboard />
    </>
  );
}
