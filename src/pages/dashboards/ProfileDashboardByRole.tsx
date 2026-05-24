import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
/**
 * Redirige al panel según el rol del usuario.
 * - brand → /dashboard/brand
 * - influencer → /dashboard/influencer
 * - admin/moderator pueden ver ambos desde el menú; aquí se muestra según primaryRole
 * - Otros roles → redirige a /dashboard
 */
export default function ProfileDashboardByRole() {
    const { primaryRole, isAuthenticated, isLoading, user } = useAuth();

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

    if (user?.isSuperAdmin || user?.isPlatformSuperuser) {
        return <Navigate to="/dashboard/suite" replace />;
    }

    switch (primaryRole) {
        case 'brand':
            return <Navigate to="/dashboard/brand" replace />;
        case 'influencer':
            return <Navigate to="/dashboard/influencer" replace />;
        case 'agency':
            return <Navigate to="/dashboard/agency" replace />;
        case 'admin':
        case 'moderator':
            return <Navigate to="/admin" replace />;
        default:
            return <Navigate to="/dashboard" replace />;
    }
}
