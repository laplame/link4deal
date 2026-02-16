import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import UserDashboard from './dashboards/UserDashboard';
import InfluencerDashboard from './dashboards/InfluencerDashboard';
import BrandDashboard from './dashboards/BrandDashboard';
import AgencyDashboard from './dashboards/AgencyDashboard';
import AdminPage from './AdminPage';
import type { PrimaryRole } from '../types/auth';

/**
 * Dashboard de inicio: menú colapsable + contenido según primaryRole.
 * user → UserDashboard
 * influencer → InfluencerDashboard
 * brand → BrandDashboard
 * agency → AgencyDashboard
 * admin | moderator → AdminPage
 */
export default function DashboardPage() {
  const { isAuthenticated, isLoading, primaryRole } = useAuth();

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

  let content: React.ReactNode;
  switch (primaryRole as PrimaryRole) {
    case 'user':
      content = <UserDashboard />;
      break;
    case 'influencer':
      content = <InfluencerDashboard />;
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

  return <DashboardLayout>{content}</DashboardLayout>;
}
