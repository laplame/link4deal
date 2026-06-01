import type { ApplicationData } from '../components/PromotionApplicationModal';
import { apiUrl } from '../utils/apiUrl';

export async function submitPromotionApplication(data: ApplicationData): Promise<void> {
  const fd = new FormData();
  const { portfolio, ...rest } = data;
  fd.append('application', JSON.stringify(rest));
  for (const file of portfolio) {
    fd.append('portfolio', file);
  }
  // Si hay sesión, el backend vincula el perfil de influencer automáticamente.
  const token = localStorage.getItem('auth_token');
  const res = await fetch(apiUrl('/api/promotion-applications'), {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: fd,
  });
  const text = await res.text();
  let json: { message?: string } = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      res.ok
        ? 'Respuesta inválida del servidor.'
        : 'El servidor no devolvió JSON (¿/api apunta al backend? Revisa VITE_API_URL o el proxy en Nginx).'
    );
  }
  if (!res.ok) {
    throw new Error(typeof json.message === 'string' ? json.message : 'No se pudo enviar la aplicación.');
  }
}
