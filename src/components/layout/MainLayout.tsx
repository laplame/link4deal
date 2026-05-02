import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { NavigationHeader } from '../navigation/NavigationHeader';
import { useAuth } from '../../context/AuthContext';

const pathTitles: Record<string, string> = {
  '/': 'Inicio',
  '/brands': 'Marcas y Negocios',
  '/influencers': 'Influencers',
  '/marketplace': 'Ofertas',
  '/subastas': 'Subastas en vivo',
  '/redenciones-en-vivo': 'Cupones redimidos',
  '/about': 'Nosotros',
  '/signin': 'Iniciar sesión',
  '/signup': 'Registro',
  '/cart': 'Carrito',
  '/dashboard': 'Mi cuenta',
  '/brand-setup': 'Registrar marca',
  '/influencer-setup': 'Registrar influencer',
  '/categories': 'Categorías',
  '/tiendas': 'Tiendas BizneAI',
  '/referral-system': 'Referidos',
  '/quick-promotion': 'Crear oferta',
  '/create-promotion': 'Crear promoción',
  '/importar-sucursales': 'Importar sucursales',
  '/admin': 'Admin',
  '/dashboard/panel': 'Mi panel',
  '/admin/influencers': 'Panel creador',
  '/demo/influencer-dashboard': 'Demo panel influencer'
};

function getTitle(pathname: string): string | undefined {
  if (pathTitles[pathname]) return pathTitles[pathname];
  if (pathname.startsWith('/admin')) return 'Admin';
  if (pathname.startsWith('/promotion-details')) return 'Detalle oferta';
  if (pathname.startsWith('/promocion/') && pathname.endsWith('/smart-contract')) return 'Smart contract';
  if (pathname.startsWith('/influencer/')) return 'Perfil influencer';
  if (pathname.startsWith('/brand/')) return 'Marca o negocio';
  if (pathname.startsWith('/shop/bizne/')) return 'Tienda BizneAI';
  if (pathname.startsWith('/category/')) return 'Categoría';
  return undefined;
}

/** Rutas que tienen su propia barra de navegación; no mostrar navbar global para evitar duplicado. */
const ROUTES_WITH_OWN_NAV = ['/', '/landing', '/comisionista-digital'];

/** Panel hub sin navbar global solo para influencer en estas rutas. */
const INFLUENCER_HUB_PATHS_HIDE_NAV = ['/dashboard/panel', '/admin/influencers'];
const DEMO_INFLUENCER_HUB_PATH = '/demo/influencer-dashboard';

export function MainLayout() {
  const location = useLocation();
  const { primaryRole } = useAuth();
  const pathname = location.pathname;
  const hideGlobalNav =
    ROUTES_WITH_OWN_NAV.includes(pathname) ||
    pathname === DEMO_INFLUENCER_HUB_PATH ||
    (INFLUENCER_HUB_PATHS_HIDE_NAV.includes(pathname) && primaryRole === 'influencer');
  const title = getTitle(pathname);

  return (
    <div className="min-h-screen flex flex-col">
      {!hideGlobalNav && <NavigationHeader title={title} />}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
