import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import UserDashboard from './dashboards/UserDashboard';
import BrandDashboard from './dashboards/BrandDashboard';
import AgencyDashboard from './dashboards/AgencyDashboard';
import AdminPage from './AdminPage';
import type { PrimaryRole } from '../types/auth';

/**
 * Dashboard de inicio: menú colapsable + contenido según primaryRole.
 *
 * Tipos de panel:
 * - user → UserDashboard (cuenta estándar).
 * - influencer → redirige al hub `/admin/influencers`.
 * - brand → BrandDashboard.
 * - agency → AgencyDashboard.
 * - admin | moderator → AdminPage.
 *
 * Superusuario de plataforma: además puede abrir `/dashboard/suite` (creador + marca + agencia).
 */
export default function DashboardPage() {
  const { isAuthenticated, isLoading, primaryRole, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  if (primaryRole === 'influencer') {
    if (user?.isPlatformSuperuser) {
      return <Navigate to="/dashboard/suite" replace />;
    }
    return <Navigate to="/admin/influencers" replace />;
  }

  let content: React.ReactNode;
  switch (primaryRole as PrimaryRole) {
    case 'user':
      content = <UserDashboard />;
      break;
    case 'brand':
      content = <BrandDashboard />;
      break;
    case 'agency':
      content = <AgencyDashboard />;
      break;
    case 'admin':
    case 'moderator':
      content = <AdminPage />;
      break;
    default:
      content = <UserDashboard />;
  }

  return (
    <DashboardLayout>
      {user?.isPlatformSuperuser ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-950 flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 shrink-0 text-amber-700" aria-hidden />
            Tienes acceso multi-panel (creador, marca y agencia).
          </span>
          <Link
            to="/dashboard/suite"
            className="font-medium text-amber-900 underline-offset-2 hover:underline"
          >
            Abrir suite
          </Link>
        </div>
      ) : null}
      {content}
    </DashboardLayout>
  );
}
