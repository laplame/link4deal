import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { canAccessRolePanel } from '../config/dashboardContexts';
import AgencyDashboard from './dashboards/AgencyDashboard';

/** Panel de la agencia (rol). No es el listado admin de todas las agencias. */
export default function AgencyDashboardPage() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: '/dashboard/agency' }} />;
  }

  if (!canAccessRolePanel(user, 'agency')) {
    return <Navigate to="/dashboard" replace />;
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
