import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { canAccessAdminRoute, DASHBOARD_ROUTES } from '../../config/dashboardContexts';
import BrandDashboard from '../dashboards/BrandDashboard';

/** Admin Link4Deal: listado de todas las marcas registradas. */
export default function AdminBrandsPage() {
  const { isAuthenticated, isLoading, primaryRole, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: DASHBOARD_ROUTES.admin.brands }} />;
  }

  if (primaryRole === 'brand' && !user?.isSuperAdmin && !user?.isPlatformSuperuser) {
    return <Navigate to={DASHBOARD_ROUTES.role.brand} replace />;
  }

  if (!canAccessAdminRoute(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <div className="bg-slate-800 text-slate-100 text-center text-xs py-1.5 px-4">
        Administración Link4Deal — todas las marcas · El dueño de marca usa{' '}
        <a href={DASHBOARD_ROUTES.role.brand} className="underline font-medium">
          /brands/panel
        </a>
      </div>
      <BrandDashboard />
    </>
  );
}
