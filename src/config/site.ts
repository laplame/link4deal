/** Nombre de la marca en español (DameCodigo) e inglés (Link4Deal). */
export const BRAND_NAMES = {
  es: 'DameCodigo',
  en: 'Link4Deal'
} as const;

/** Devuelve el nombre de la marca según el idioma del navegador (es → DameCodigo, resto → Link4Deal). */
export function getSiteName(lang?: string): string {
  const locale = (lang ?? (typeof navigator !== 'undefined' ? navigator.language : 'en')).toLowerCase();
  return locale.startsWith('es') ? BRAND_NAMES.es : BRAND_NAMES.en;
}

export const SITE_CONFIG = {
  get name() {
    return getSiteName();
  },
  nameEs: BRAND_NAMES.es,
  nameEn: BRAND_NAMES.en,
  description: 'Plataforma líder que revoluciona la forma en que las marcas se conectan con influencers',
  email: 'contacto@damecodigo.com',
  supportEmail: 'soporte@damecodigo.com',
  website: 'https://damecodigo.com',
  appStoreUrl: 'https://apps.apple.com/app/damecodigo',
  playStoreUrl: 'https://play.google.com/store/apps/details?id=com.damecodigo.app',
  linkedinUrl: 'https://www.linkedin.com/company/damecodigo',
  githubUrl: 'https://github.com/damecodigo',
  get copyright() {
    return getSiteName().startsWith('Dame') ? '© 2024 DameCodigo. Todos los derechos reservados.' : '© 2024 Link4Deal. All rights reserved.';
  },
  version: '1.0.0'
};

export default SITE_CONFIG;
