import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canAccessRolePanel } from '../config/dashboardContexts';
import InfluencerDashboard from './dashboards/InfluencerDashboard';

/** Panel del creador / influencer (rol). No es administración Link4Deal. */
export default function InfluencerDashboardPage() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: '/dashboard/influencer' }} />;
  }

  if (!canAccessRolePanel(user, 'influencer')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <InfluencerDashboard />;
}
