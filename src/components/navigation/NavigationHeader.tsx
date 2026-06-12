import React, { useEffect, useRef, useState } from 'react';
import { Users, User, LogOut, Home, ShoppingCart, Info, Gavel, Ticket, Store } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { MobileMenu } from './MobileMenu';
import { NavDropdown } from './NavDropdown';
import { SITE_CONFIG } from '../../config/site';
import { useAuth } from '../../context/AuthContext';
import {
  getAccountHref,
  getAccountLabel,
  getPublishNavItems,
  getRoleWorkspaceItems,
  SHARED_STORE_ROUTE,
  shouldShowJoinNav,
} from '../../config/roleNavigation';

interface Props {
  title?: string;
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-xs 2xl:text-sm font-medium px-2 2xl:px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
    isActive ? 'text-white bg-white/20' : 'text-gray-100 hover:text-white hover:bg-white/15'
  }`;

export function NavigationHeader({ title }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<
    'explore' | 'directory' | 'publish' | 'join' | 'account' | null
  >(null);
  const { user, isAuthenticated, logout } = useAuth();

  const accountHref = getAccountHref(user);
  const accountLabel = getAccountLabel(user);
  const workspaceItems = user ? getRoleWorkspaceItems(user) : [];
  const publishItems = getPublishNavItems(user, isAuthenticated);
  const showJoin = shouldShowJoinNav(isAuthenticated);
  const location = useLocation();
  const desktopNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpenDropdown(null);
  }, [location.pathname]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (desktopNavRef.current && !desktopNavRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const closeDropdowns = () => setOpenDropdown(null);

  const pageTitle =
    title && title !== SITE_CONFIG.name && title !== 'Inicio' ? title : null;

  return (
    <header className="border-b border-gray-700 bg-gray-950 sticky top-0 z-50 shadow-md shadow-black/20">
      <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-3 min-w-0">
          <Link
            to="/"
            className="flex items-center gap-2 text-white hover:text-white/90 transition-colors min-w-0 shrink-0 max-w-[46%] sm:max-w-[38%] md:max-w-none"
          >
            <Users className="h-6 w-6 text-purple-400 shrink-0" />
            <span className="text-base sm:text-lg xl:text-xl font-bold truncate">{SITE_CONFIG.name}</span>
            {pageTitle ? (
              <span
                className="hidden 2xl:inline text-gray-400 text-sm font-normal truncate max-w-[11rem]"
                title={pageTitle}
              >
                · {pageTitle}
              </span>
            ) : null}
          </Link>

          <div
            ref={desktopNavRef}
            className="hidden xl:flex flex-1 justify-center items-center gap-0.5 min-w-0 mx-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            <NavLink to="/" end className={navLinkClass}>
              <span className="flex items-center gap-1.5">
                <Home className="h-4 w-4 shrink-0" />
                Inicio
              </span>
            </NavLink>

            <NavLink to={SHARED_STORE_ROUTE} className={navLinkClass}>
              <span className="flex items-center gap-1.5">
                <Store className="h-4 w-4 shrink-0" />
                Tienda
              </span>
            </NavLink>

            <NavDropdown
              label="Explorar"
              isOpen={openDropdown === 'explore'}
              onToggle={() => setOpenDropdown(openDropdown === 'explore' ? null : 'explore')}
              onItemClick={closeDropdowns}
              items={[
                { to: '/categories', label: 'Categorías', hint: 'Explora por categoría' },
                { to: '/marketplace', label: 'Todas las ofertas', hint: 'Promociones y cupones' },
              ]}
            />

            <NavLink to="/subastas" className={navLinkClass}>
              <span className="flex items-center gap-1.5">
                <Gavel className="h-4 w-4 shrink-0" />
                Subastas
              </span>
            </NavLink>

            <NavLink to="/redenciones-en-vivo" className={navLinkClass}>
              <span className="flex items-center gap-1.5">
                <Ticket className="h-4 w-4 shrink-0" />
                Redenciones
              </span>
            </NavLink>

            <NavDropdown
              label="Directorio"
              isOpen={openDropdown === 'directory'}
              onToggle={() => setOpenDropdown(openDropdown === 'directory' ? null : 'directory')}
              onItemClick={closeDropdowns}
              items={[
                { to: '/brands', label: 'Marcas y negocios', hint: 'Registradas en DameCodigo' },
                { to: '/tiendas', label: 'Tiendas BizneAI', hint: 'Red conectada' },
                { to: '/influencer', label: 'Influencers', hint: 'Perfiles y métricas' },
                { to: '/referral-system', label: 'Referidos', hint: 'Programa de referidos' },
              ]}
            />

            {publishItems.length > 0 ? (
              <NavDropdown
                label="Publicar"
                isOpen={openDropdown === 'publish'}
                onToggle={() => setOpenDropdown(openDropdown === 'publish' ? null : 'publish')}
                align="right"
                onItemClick={closeDropdowns}
                items={publishItems}
              />
            ) : null}

            {showJoin ? (
              <NavDropdown
                label="Únete"
                isOpen={openDropdown === 'join'}
                onToggle={() => setOpenDropdown(openDropdown === 'join' ? null : 'join')}
                align="right"
                onItemClick={closeDropdowns}
                items={[
                  { to: '/brands/setup', label: 'Registrar marca', hint: 'Negocios y marcas' },
                  { to: '/influencer/setup', label: 'Ser influencer', hint: 'Crear perfil' },
                ]}
              />
            ) : null}

            <NavLink to="/about" className={navLinkClass}>
              <span className="flex items-center gap-1.5">
                <Info className="h-4 w-4 shrink-0" />
                Nosotros
              </span>
            </NavLink>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Link
              to="/cart"
              className="inline-flex items-center justify-center p-2 sm:p-2.5 rounded-lg text-gray-100 hover:text-white hover:bg-white/15 transition-colors"
              title="Carrito"
            >
              <ShoppingCart className="h-5 w-5" />
            </Link>

            {isAuthenticated && user ? (
              <div className="hidden xl:flex xl:items-center xl:gap-2">
                <span className="text-gray-200 text-sm max-w-[10rem] truncate">Hola, {user.firstName}</span>
                {workspaceItems.length > 0 ? (
                  <NavDropdown
                    label={accountLabel}
                    isOpen={openDropdown === 'account'}
                    onToggle={() => setOpenDropdown(openDropdown === 'account' ? null : 'account')}
                    align="right"
                    onItemClick={closeDropdowns}
                    items={workspaceItems}
                    variant="account"
                  />
                ) : (
                  <Link
                    to={accountHref}
                    className="flex items-center gap-1.5 text-white/90 hover:text-white px-3 py-1.5 rounded-lg bg-white/10 transition-colors text-sm"
                  >
                    <User className="h-4 w-4" />
                    {accountLabel}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => logout()}
                  className="flex items-center gap-1.5 text-gray-200 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/15 transition-colors text-sm"
                >
                  <LogOut className="h-4 w-4" />
                  Salir
                </button>
              </div>
            ) : (
              <div className="hidden xl:flex xl:items-center xl:gap-1">
                <Link
                  to="/signin"
                  className="text-gray-100 hover:text-white px-2 2xl:px-3 py-2 rounded-lg hover:bg-white/15 transition-colors text-xs 2xl:text-sm whitespace-nowrap"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/signup"
                  className="bg-green-500 hover:bg-green-600 text-white px-2 2xl:px-3 py-2 rounded-lg font-medium transition-colors text-xs 2xl:text-sm whitespace-nowrap"
                >
                  Registrarse
                </Link>
              </div>
            )}

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="xl:hidden p-2 text-white hover:text-white transition-colors rounded-lg hover:bg-white/15 border border-white/10"
              aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={isMenuOpen}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </header>
  );
}
