import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import UserDashboard from './dashboards/UserDashboard';
import { defaultRouteAfterLogin } from '../config/dashboardContexts';

/**
 * /dashboard — entrada según rol.
 * Influencer / brand / agency / staff tienen rutas dedicadas (ver dashboardContexts.ts).
 */
export default function DashboardPage() {
  const { isAuthenticated, isLoading, user, primaryRole } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/signin" replace />;
  }

  if (primaryRole === 'user') {
    return (
      <DashboardLayout>
        <UserDashboard />
      </DashboardLayout>
    );
  }

  const dest = defaultRouteAfterLogin(user);
  if (dest !== '/dashboard') {
    return <Navigate to={dest} replace />;
  }

  return (
    <DashboardLayout>
      <UserDashboard />
    </DashboardLayout>
  );
}
