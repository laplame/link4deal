/**
 * Contextos de dashboards DameCodigo.
 *
 * - **admin**: operación interna Link4Deal (listados, CRM, promociones globales).
 * - **role**: panel del usuario según su primaryRole / profileTypes.
 * - **suite**: vista previa multi-panel (superusuario / superadmin).
 */

import type { AuthUser, PrimaryRole } from '../types/auth';

export type DashboardContext = 'admin' | 'role' | 'suite';

export const DASHBOARD_ROUTES = {
  home: '/dashboard',
  suite: '/dashboard/suite',
  panelByRole: '/dashboard/panel',
  role: {
    user: '/dashboard',
    influencer: '/dashboard/influencer',
    brand: '/dashboard/brand',
    agency: '/dashboard/agency',
  },
  admin: {
    home: '/admin',
    superPromotions: '/admin/dashboard',
    crm: '/admin/crm',
    influencers: '/admin/influencers',
    brands: '/admin/brands',
    agencies: '/admin/agencies',
    promotions: '/admin/promotions',
    apiDocs: '/admin/api-docs',
    ocr: '/admin/ocr-profile',
  },
} as const;

export function isStaffUser(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  return (
    user.isSuperAdmin === true ||
    user.isPlatformSuperuser === true ||
    user.primaryRole === 'admin' ||
    user.primaryRole === 'moderator'
  );
}

/** Hub compartido por marca, influencer, agencia y usuario final. */
export const SHARED_STORE_ROUTE = '/marketplace';

export function defaultRouteAfterLogin(user: AuthUser): string {
  if (user.isSuperAdmin || user.isPlatformSuperuser) {
    return DASHBOARD_ROUTES.suite;
  }
  if (user.primaryRole === 'admin' || user.primaryRole === 'moderator') {
    return DASHBOARD_ROUTES.admin.home;
  }
  return SHARED_STORE_ROUTE;
}

export function canAccessAdminRoute(
  user: AuthUser | null | undefined,
  allowedRoles: PrimaryRole[] = ['admin', 'moderator'],
): boolean {
  if (!user) return false;
  if (user.isSuperAdmin || user.isPlatformSuperuser) return true;
  return Boolean(user.primaryRole && allowedRoles.includes(user.primaryRole));
}

export function canAccessRolePanel(
  user: AuthUser | null | undefined,
  role: 'influencer' | 'brand' | 'agency',
): boolean {
  if (!user) return false;
  if (user.isPlatformSuperuser || user.isSuperAdmin) return true;
  if (user.primaryRole === role) return true;
  return Boolean(user.profileTypes?.includes(role));
}
