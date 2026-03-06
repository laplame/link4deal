import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { NavigationHeader } from '../navigation/NavigationHeader';

const pathTitles: Record<string, string> = {
  '/': 'Inicio',
  '/brands': 'Marcas y Negocios',
  '/influencers': 'Influencers',
  '/marketplace': 'Ofertas',
  '/about': 'Nosotros',
  '/signin': 'Iniciar sesión',
  '/signup': 'Registro',
  '/cart': 'Carrito',
  '/dashboard': 'Mi cuenta',
  '/brand-setup': 'Registrar marca',
  '/influencer-setup': 'Registrar influencer',
  '/categories': 'Categorías',
  '/referral-system': 'Referidos',
  '/quick-promotion': 'Crear oferta',
  '/create-promotion': 'Crear promoción',
  '/admin': 'Admin'
};

function getTitle(pathname: string): string | undefined {
  if (pathTitles[pathname]) return pathTitles[pathname];
  if (pathname.startsWith('/admin')) return 'Admin';
  if (pathname.startsWith('/promotion-details')) return 'Detalle oferta';
  if (pathname.startsWith('/promocion/') && pathname.endsWith('/smart-contract')) return 'Smart contract';
  if (pathname.startsWith('/influencer/')) return 'Perfil influencer';
  if (pathname.startsWith('/category/')) return 'Categoría';
  return undefined;
}

/** Rutas que tienen su propia barra de navegación; no mostrar navbar global para evitar duplicado. */
const ROUTES_WITH_OWN_NAV = ['/', '/landing', '/comisionista-digital'];

export function MainLayout() {
  const location = useLocation();
  const pathname = location.pathname;
  const hideGlobalNav = ROUTES_WITH_OWN_NAV.includes(pathname);
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
