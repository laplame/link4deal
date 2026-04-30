/** Clave sessionStorage cuando el PIN de admin es correcto (acceso al panel sin login). */
export const ADMIN_PIN_STORAGE_KEY = 'super_admin_unlock';

/** PIN de 4 dígitos: configurable con VITE_ADMIN_ACCESS_PIN (por defecto coincide con el modal de la landing). */
export function getAdminAccessPin(): string {
  const fromEnv = import.meta.env.VITE_ADMIN_ACCESS_PIN;
  if (typeof fromEnv === 'string' && /^\d{4}$/.test(fromEnv)) return fromEnv;
  return '6192';
}

export function isAdminPinUnlockSession(): boolean {
  try {
    return sessionStorage.getItem(ADMIN_PIN_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setAdminPinUnlockSession(): void {
  try {
    sessionStorage.setItem(ADMIN_PIN_STORAGE_KEY, '1');
  } catch {
    // ignore
  }
}

export function clearAdminPinUnlockSession(): void {
  try {
    sessionStorage.removeItem(ADMIN_PIN_STORAGE_KEY);
  } catch {
    // ignore
  }
}
