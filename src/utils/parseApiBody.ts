/**
 * Lee el cuerpo de una Response y lo parsea como JSON.
 * Si el servidor devolvió HTML (p. ej. 404 de Nginx o página SPA), mensaje claro.
 */
export async function parseJsonBody(res: Response): Promise<unknown> {
  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error(`Respuesta vacía (HTTP ${res.status}).`);
  }
  const looksLikeHtml = /^<!DOCTYPE/i.test(trimmed) || trimmed.startsWith('<html');
  if (looksLikeHtml) {
    const hint =
      res.status === 404
        ? 'Ruta no encontrada: suele significar que Nginx no enruta /api/ al backend o el proceso Node no tiene esa ruta (git pull + pm2 restart).'
        : 'Se recibió HTML en lugar de JSON: revisa el proxy /api en Nginx y que VITE_API_URL no termine en /api.';
    throw new Error(`El servidor devolvió una página HTML (HTTP ${res.status}), no JSON. ${hint}`);
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`Respuesta no es JSON válido (HTTP ${res.status}).`);
  }
}
