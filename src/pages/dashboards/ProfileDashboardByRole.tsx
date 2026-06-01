import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { canAccessRoleDashboards, SHARED_STORE_ROUTE } from '../../config/roleNavigation';
import { DASHBOARD_ROUTES } from '../../config/dashboardContexts';

/**
 * Entrada legacy `/dashboard/panel`: superusuario → suite; staff → admin; resto → tienda.
 */
export default function ProfileDashboardByRole() {
    const { isAuthenticated, isLoading, user } = useAuth();

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

    if (canAccessRoleDashboards(user)) {
        return <Navigate to="/dashboard/suite" replace />;
    }

    if (user?.primaryRole === 'admin' || user?.primaryRole === 'moderator') {
        return <Navigate to={DASHBOARD_ROUTES.admin.home} replace />;
    }

    return <Navigate to={SHARED_STORE_ROUTE} replace />;
}
