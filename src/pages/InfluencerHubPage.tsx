import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import InfluencerDashboard from './dashboards/InfluencerDashboard';

/**
 * Panel tipo hub (InfluencerHubLayout): accesible para creadores y para moderación.
 */
export default function InfluencerHubPage() {
  const { isAuthenticated, isLoading, primaryRole } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: '/admin/influencers' }} />;
  }

  const allowed =
    primaryRole === 'influencer' ||
    primaryRole === 'admin' ||
    primaryRole === 'moderator';

  if (!allowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return <InfluencerDashboard />;
}
