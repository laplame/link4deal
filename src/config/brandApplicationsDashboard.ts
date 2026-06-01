import { getAdminAccessPin } from './adminAccess';

/** sessionStorage: contraseña maestra del panel de aplicaciones (solo envío en header a la API). */
export const BRAND_APPLICATIONS_PASSWORD_STORAGE_KEY = 'link4deal_brand_applications_master_pw';

/** Misma contraseña que CRM / modal super admin (VITE_ADMIN_ACCESS_PIN, por defecto 6192). */
export function getBrandApplicationsMasterPassword(): string {
  return getAdminAccessPin();
}
