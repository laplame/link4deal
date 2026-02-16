/**
 * Cliente de la API de autenticación (/api/auth)
 * Usa rutas relativas para que el proxy de Vite (dev) o el mismo origen (prod) funcionen.
 */

import type { AuthResponse, AuthUser, LoginCredentials, RegisterData } from '../types/auth';

const API_AUTH = '/api/auth';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const res = await fetch(`${API_AUTH}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Credenciales inválidas');
  }
  return data;
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  const res = await fetch(`${API_AUTH}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok) {
    const firstError = Array.isArray(json.errors) && json.errors[0]?.msg ? json.errors[0].msg : null;
    throw new Error(firstError || json.message || 'Error al registrarse');
  }
  return json;
}

export async function logout(): Promise<void> {
  const res = await fetch(`${API_AUTH}/logout`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (res.status === 401) return; // ya sin token
  const data = await res.json().catch(() => ({}));
  if (!res.ok && res.status !== 401) {
    console.warn('Logout API error:', data.message);
  }
}

export async function me(): Promise<{ user: AuthUser }> {
  const res = await fetch(`${API_AUTH}/me`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Sesión inválida');
  }
  return data;
}

export async function refreshToken(refreshTokenValue: string): Promise<{ token: string; refreshToken: string }> {
  const res = await fetch(`${API_AUTH}/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: refreshTokenValue }),
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al renovar sesión');
  return data;
}
