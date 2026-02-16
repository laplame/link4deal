/**
 * Tipos de usuario y auth alineados con la API /api/auth
 * primaryRole: user (solo usuario), influencer (content creator), brand (marketing/marca), agency (agencia de mkt), admin (owner)
 */

export type PrimaryRole = 'user' | 'influencer' | 'brand' | 'agency' | 'admin' | 'moderator' | 'support' | 'analyst';

export type ProfileType = 'influencer' | 'brand' | 'agency';

export interface ApiRole {
  id: string;
  name: string;
  displayName: string;
  level: number;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  primaryRole: PrimaryRole;
  profileTypes: ProfileType[];
  roles?: ApiRole[];
  isVerified?: boolean;
  lastLogin?: string;
  userProfile?: unknown;
  settings?: unknown;
  stats?: unknown;
  createdAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
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
