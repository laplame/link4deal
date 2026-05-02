import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BrandDashboard from './BrandDashboard';

/**
 * Un solo archivo que renderiza el dashboard según el rol del usuario.
 * - brand → BrandDashboard
 * - influencer → /admin/influencers
 * - admin/moderator pueden ver ambos desde el menú; aquí se muestra según primaryRole
 * - Otros roles → redirige a /dashboard
 */
export default function ProfileDashboardByRole() {
    const { primaryRole, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/signin" replace />;
    }

    switch (primaryRole) {
        case 'brand':
            return <BrandDashboard />;
        case 'influencer':
            return <Navigate to="/admin/influencers" replace />;
        default:
            return <Navigate to="/dashboard" replace />;
    }
}
