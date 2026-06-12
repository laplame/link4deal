/**
 * Navegación por rol: la tienda (/marketplace) es el hub compartido.
 * Los dashboards `/dashboard/*` (paneles completos) quedan solo para superusuario.
 */

import type { AuthUser } from '../types/auth';
import { DASHBOARD_ROUTES } from './dashboardContexts';
import { ROLE_ROUTES } from './roleRoutes';

export const SHARED_STORE_ROUTE = '/marketplace';

export function canAccessRoleDashboards(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  return user.isSuperAdmin === true || user.isPlatformSuperuser === true;
}

export function getAccountHref(user: AuthUser | null | undefined): string {
  if (!user) return '/signin';
  if (canAccessRoleDashboards(user)) return DASHBOARD_ROUTES.suite;
  if (user.primaryRole === 'admin' || user.primaryRole === 'moderator') {
    return DASHBOARD_ROUTES.admin.home;
  }
  return SHARED_STORE_ROUTE;
}

export function getAccountLabel(user: AuthUser | null | undefined): string {
  if (!user) return 'Mi cuenta';
  if (canAccessRoleDashboards(user)) return 'Suite';
  if (user.primaryRole === 'admin' || user.primaryRole === 'moderator') return 'Admin';
  return 'Mi espacio';
}

export function getInfluencerOwnerEditHref(user: AuthUser | null | undefined): string {
  if (canAccessRoleDashboards(user)) return `${ROLE_ROUTES.influencer.panel}?hub=ugc`;
  return ROLE_ROUTES.influencer.setup;
}

export interface NavMenuItem {
  to: string;
  label: string;
  hint?: string;
}

/** Menú «Mi espacio» según rol (sin paneles /dashboard para usuarios normales). */
export function getRoleWorkspaceItems(user: AuthUser): NavMenuItem[] {
  const store: NavMenuItem = {
    to: SHARED_STORE_ROUTE,
    label: 'Tienda',
    hint: 'Ofertas y cupones para todos',
  };

  if (canAccessRoleDashboards(user)) {
    return [
      store,
      {
        to: DASHBOARD_ROUTES.suite,
        label: 'Suite multi-panel',
        hint: 'Vistas creador, marca y agencia',
      },
      { to: DASHBOARD_ROUTES.admin.crm, label: 'CRM', hint: 'Pipeline e influencers' },
      { to: DASHBOARD_ROUTES.admin.home, label: 'Administración', hint: 'Listados globales' },
      {
        to: DASHBOARD_ROUTES.admin.superPromotions,
        label: 'Promociones admin',
        hint: 'Vista operativa',
      },
    ];
  }

  if (user.primaryRole === 'admin' || user.primaryRole === 'moderator') {
    return [
      store,
      { to: DASHBOARD_ROUTES.admin.home, label: 'Administración', hint: 'Staff' },
      { to: DASHBOARD_ROUTES.admin.crm, label: 'CRM', hint: 'Influencers y pipeline' },
    ];
  }

  switch (user.primaryRole) {
    case 'brand':
      return [
        store,
        { to: ROLE_ROUTES.brand.hub, label: 'Mis marcas', hint: 'Espacio de marca' },
        { to: ROLE_ROUTES.brand.panel, label: 'Panel marca', hint: 'Operación y métricas' },
        { to: '/create-promotion', label: 'Crear promoción', hint: 'Nueva oferta' },
        { to: '/quick-promotion', label: 'Oferta rápida', hint: 'Publicación exprés' },
        {
          to: ROLE_ROUTES.brand.applications,
          label: 'Mis aplicaciones',
          hint: 'Solicitudes y cupones con influencers',
        },
        { to: ROLE_ROUTES.brand.setup, label: 'Registrar marca', hint: 'Perfil del negocio' },
      ];
    case 'influencer':
      return [
        store,
        { to: ROLE_ROUTES.influencer.hub, label: 'Influencers', hint: 'Directorio y tu espacio' },
        { to: ROLE_ROUTES.influencer.panel, label: 'Mi panel', hint: 'Mensajes y campañas' },
        { to: ROLE_ROUTES.influencer.setup, label: 'Mi perfil creador', hint: 'Bio, redes y slug' },
        { to: '/subastas', label: 'Subastas', hint: 'En vivo' },
        { to: '/redenciones-en-vivo', label: 'Redenciones', hint: 'Cupones redimidos' },
      ];
    case 'agency':
      return [
        store,
        { to: ROLE_ROUTES.agency.hub, label: 'Mi agencia', hint: 'Panel y clientes' },
        { to: ROLE_ROUTES.agency.setup, label: 'Configurar agencia', hint: 'Perfil' },
        { to: ROLE_ROUTES.brand.hub, label: 'Marcas', hint: 'Directorio' },
        { to: ROLE_ROUTES.influencer.hub, label: 'Influencers', hint: 'Directorio' },
      ];
    default:
      return [
        store,
        { to: '/categories', label: 'Categorías', hint: 'Explorar por tema' },
        { to: '/cart', label: 'Carrito', hint: 'Cupones guardados' },
      ];
  }
}

/** Publicar ofertas: invitados, marca y superusuario. */
export function getPublishNavItems(
  user: AuthUser | null | undefined,
  isAuthenticated: boolean,
): NavMenuItem[] {
  if (!isAuthenticated) {
    return [
      { to: '/create-promotion', label: 'Crear promoción', hint: 'Asistente completo' },
      { to: '/quick-promotion', label: 'Oferta rápida', hint: 'Publicación exprés' },
    ];
  }
  if (!user) return [];
  if (canAccessRoleDashboards(user) || user.primaryRole === 'brand') {
    return [
      { to: '/create-promotion', label: 'Crear promoción', hint: 'Asistente completo' },
      { to: '/quick-promotion', label: 'Oferta rápida', hint: 'Publicación exprés' },
    ];
  }
  return [];
}

export function shouldShowJoinNav(isAuthenticated: boolean): boolean {
  return !isAuthenticated;
}
