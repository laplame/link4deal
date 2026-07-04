import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { canAccessRolePanel } from '../config/dashboardContexts';
import AgencyDashboard from './dashboards/AgencyDashboard';
import { apiUrl } from '../utils/apiUrl';

/** Panel de la agencia (rol). No es el listado admin de todas las agencias. */
export default function AgencyDashboardPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [agencyCheck, setAgencyCheck] = useState<'loading' | 'missing' | 'ready'>('loading');

  useEffect(() => {
    if (!isAuthenticated || isLoading) return;
    let cancelled = false;
    const token = localStorage.getItem('auth_token');
    fetch(apiUrl('/api/agencies/mine'), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setAgencyCheck(data?.agency ? 'ready' : 'missing');
      })
      .catch(() => {
        if (!cancelled) setAgencyCheck('missing');
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading]);

  if (isLoading || agencyCheck === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: '/agency' }} />;
  }

  if (!canAccessRolePanel(user, 'agency')) {
    return <Navigate to="/marketplace" replace />;
  }

  if (agencyCheck === 'missing') {
    return <Navigate to="/agency/setup" replace />;
  }

  return (
    <DashboardLayout>
      <div className="border-b border-indigo-200 bg-indigo-50 px-4 py-2 text-sm text-indigo-950">
        Panel de <strong>tu agencia</strong> (rol). El listado global de agencias está en{' '}
        <Link to="/admin/agencies" className="font-medium underline">
          Admin → Agencias
        </Link>{' '}
        (solo staff).
      </div>
      <AgencyDashboard />
    </DashboardLayout>
  );
}
