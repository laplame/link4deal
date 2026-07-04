import { useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { NavigationHeader } from '../navigation/NavigationHeader';
import { SiteFooter } from './SiteFooter';
import { FloatingDownloadAppButton } from './FloatingDownloadAppButton';
import { useAuth } from '../../context/AuthContext';
import { SITE_SHELL_PAGE, shouldHideGlobalNav } from '../../config/siteShell';

const pathTitles: Record<string, string> = {
  '/': 'Inicio',
  '/brands': 'Marcas y Negocios',
  '/influencer': 'Influencers',
  '/influencer/setup': 'Registrar influencer',
  '/influencer/panel': 'Panel creador',
  '/brands/setup': 'Registrar marca',
  '/brands/panel': 'Panel marca',
  '/brands/aplicaciones': 'Aplicaciones marca',
  '/agency': 'Agencia',
  '/agency/setup': 'Registrar agencia',
  '/marketplace': 'Ofertas',
  '/subastas': 'Subastas en vivo',
  '/redenciones-en-vivo': 'Cupones redimidos',
  '/about': 'Nosotros',
  '/signin': 'Iniciar sesión',
  '/signup': 'Registro',
  '/cart': 'Carrito',
  '/dashboard': 'Mi cuenta',
  '/categories': 'Categorías',
  '/tiendas': 'Tiendas BizneAI',
  '/referral-system': 'Referidos',
  '/quick-promotion': 'Crear oferta',
  '/empezar': 'Empezar',
  '/user-type-selector': 'Empezar',
  '/create-promotion': 'Crear promoción',
  '/importar-sucursales': 'Importar sucursales',
  '/admin': 'Admin',
  '/dashboard/panel': 'Mi panel',
  '/admin/influencers': 'Admin influencers',
  '/admin/brands': 'Panel marcas',
  '/admin/agencies': 'Panel agencias',
  '/dashboard/suite': 'Multi-panel (superusuario)',
  '/demo/influencer-dashboard': 'Demo panel influencer',
  '/landing': 'Para negocios',
  '/landing-a': 'Creadores',
  '/landing-b': 'Negocios',
  '/landing-c': 'Agencias',
};

function getTitle(pathname: string): string | undefined {
  if (pathTitles[pathname]) return pathTitles[pathname];
  if (pathname.startsWith('/admin')) return 'Admin';
  if (pathname.startsWith('/promotion-details')) return 'Detalle oferta';
  if (pathname.startsWith('/promo/')) return 'Detalle oferta';
  if (pathname.startsWith('/promociones/')) return 'Promociones por zona';
  if (pathname === '/influencer/waitlist') return 'Lista de espera influencers';
  if (pathname.startsWith('/promocion/') && pathname.endsWith('/smart-contract')) return 'Smart contract';
  if (pathname === '/influencer') return 'Influencers';
  if (pathname.startsWith('/influencer/')) return 'Perfil influencer';
  if (pathname === '/brands') return 'Marcas y Negocios';
  if (pathname.startsWith('/brand/')) return 'Marca o negocio';
  if (pathname.startsWith('/shop/bizne/')) return 'Tienda BizneAI';
  if (pathname.startsWith('/category/')) return 'Categoría';
  return undefined;
}

export function MainLayout() {
  const location = useLocation();
  const { primaryRole, user } = useAuth();
  const pathname = location.pathname;
  const hideGlobalNav = useMemo(
    () =>
      shouldHideGlobalNav(pathname, {
        primaryRole,
        isPlatformSuperuser: Boolean(user?.isPlatformSuperuser),
      }),
    [pathname, primaryRole, user?.isPlatformSuperuser],
  );
  const title = getTitle(pathname);

  return (
    <div className={`${SITE_SHELL_PAGE} flex flex-col`}>
      {!hideGlobalNav && <NavigationHeader title={title} />}
      <main className="flex-1">
        <Outlet />
      </main>
      {!hideGlobalNav && <SiteFooter />}
      <FloatingDownloadAppButton />
    </div>
  );
}
