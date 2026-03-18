/**
 * Servicio para el contador de descargas de la app.
 * - trackDownload: registra una descarga (POST, público)
 * - getDownloadCount: obtiene el total (GET, requiere super admin)
 */

const API_BASE = '/api/app-downloads';

export async function trackDownload(): Promise<void> {
  try {
    await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
  } catch {
    // Silenciar errores para no afectar la UX de la descarga
  }
}

export async function getDownloadCount(): Promise<{ count: number; lastUpdated: string | null }> {
  const token = localStorage.getItem('auth_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(API_BASE, { headers, credentials: 'include' });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Error al obtener el contador');
  }
  return {
    count: data.count ?? 0,
    lastUpdated: data.lastUpdated ?? null,
  };
}
