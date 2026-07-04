import type { NavDropdownItem } from '../components/navigation/NavDropdown';
import { SHARED_STORE_ROUTE } from './roleNavigation';

/** Enlaces del menú «Tienda / explorar» (desktop). */
export const NAV_SHOP_ITEMS: NavDropdownItem[] = [
  { to: SHARED_STORE_ROUTE, label: 'Ofertas y cupones', hint: 'Marketplace' },
  { to: '/tienda', label: 'Productos', hint: 'Catálogo shop' },
  { to: '/categories', label: 'Categorías', hint: 'Explorar por tema' },
  { to: '/subastas', label: 'Subastas en vivo', hint: 'Pujas activas' },
  { to: '/redenciones-en-vivo', label: 'Cupones redimidos', hint: 'Actividad en vivo' },
];

/** Enlaces del menú «Directorio» (desktop). */
export const NAV_DIRECTORY_ITEMS: NavDropdownItem[] = [
  { to: '/brands', label: 'Marcas y negocios', hint: 'Registradas en DameCodigo' },
  { to: '/tiendas', label: 'Tiendas BizneAI', hint: 'Red conectada' },
  { to: '/influencer', label: 'Influencers', hint: 'Perfiles y métricas' },
  { to: '/referral-system', label: 'Referidos', hint: 'Programa de referidos' },
  { to: '/about', label: 'Nosotros', hint: 'Qué es DameCodigo' },
];

/** Enlaces del menú «Únete» (invitados). */
export const NAV_JOIN_ITEMS: NavDropdownItem[] = [
  { to: '/empezar', label: 'Empezar', hint: 'Marca o influencer' },
  { to: '/brands/setup', label: 'Registrar marca', hint: 'Negocios y marcas' },
  { to: '/influencer/setup', label: 'Ser influencer', hint: 'Crear perfil' },
];
