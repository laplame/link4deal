/**
 * Tipos de usuario y auth alineados con la API /api/auth
 *
 * Paneles de producto (según primaryRole o suite multi-rol):
 * - user: Mi cuenta / marketplace (usuario final).
 * - influencer: panel creador (`/dashboard/influencer`).
 * - brand: panel marca (`/dashboard/brand`).
 * - agency: panel agencia (`/dashboard/agency`).
 * - admin | moderator: `AdminPage` / rutas `/admin/*`.
 *
 * Superusuario de plataforma (`isPlatformSuperuser`, email en lista servidor):
 * acceso al suite `/dashboard/suite` con las tres vistas creador + marca + agencia.
 */

export type PrimaryRole = 'user' | 'influencer' | 'brand' | 'agency' | 'admin' | 'moderator' | 'support' | 'analyst';

/** Vistas del suite multi-panel (superusuario). */
export type DashboardPersona = 'influencer' | 'brand' | 'agency';

export const DASHBOARD_PERSONA_LABELS: Record<DashboardPersona, string> = {
  influencer: 'Creador',
  brand: 'Marca',
  agency: 'Agencia',
};

export type ProfileType = 'influencer' | 'brand' | 'agency';

export interface ApiRole {
  id: string;
  name: string;
  displayName: string;
  level: number;
}

export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  firstName: string;
  lastName: string;
  primaryRole: PrimaryRole;
  isSuperAdmin?: boolean;
  /** Lista fija influencer|brand|agency cuando el email está en PLATFORM_SUPERUSER_EMAILS (servidor). */
  isPlatformSuperuser?: boolean;
  dashboardAccess?: DashboardPersona[];
  profileTypes: ProfileType[];
  roles?: ApiRole[];
  isVerified?: boolean;
  lastLogin?: string;
  userProfile?: unknown;
  settings?: unknown;
  stats?: unknown;
  createdAt?: string;
}

/** Inicio de sesión con email o teléfono/WhatsApp + contraseña */
export interface LoginCredentials {
  login: string;
  password: string;
}

export interface RegisterData {
  email?: string;
  phone?: string;
  password: string;
  firstName: string;
  lastName: string;
  primaryRole: PrimaryRole;
}

export interface AuthResponse {
  message: string;
  user: AuthUser;
  token: string;
  refreshToken: string;
}

export const PRIMARY_ROLE_LABELS: Record<PrimaryRole, string> = {
  user: 'Usuario',
  influencer: 'Creador de contenido',
  brand: 'Marca / Marketing',
  agency: 'Agencia de marketing',
  admin: 'Administrador',
  moderator: 'Moderador',
  support: 'Soporte',
  analyst: 'Analista',
};
