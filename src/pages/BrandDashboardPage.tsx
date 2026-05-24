import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import BrandOwnerDashboard from './dashboards/BrandOwnerDashboard';

/** Panel de la marca dueña (no listado admin). Ruta: /dashboard/brand */
export default function BrandDashboardPage() {
  const { isAuthenticated, isLoading, primaryRole, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: '/dashboard/brand' }} />;
  }

  const allowed =
    primaryRole === 'brand' ||
    user?.isPlatformSuperuser === true ||
    (user?.profileTypes && user.profileTypes.includes('brand'));

  if (!allowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DashboardLayout>
      <div className="border-b border-violet-200 bg-violet-50 px-4 py-2 text-sm text-violet-950">
        Panel de <strong>tu marca</strong> (rol). Administración de todas las marcas:{' '}
        <Link to="/admin/brands" className="font-medium underline">
          /admin/brands
        </Link>{' '}
        (solo staff).
      </div>
      <BrandOwnerDashboard />
    </DashboardLayout>
  );
}
