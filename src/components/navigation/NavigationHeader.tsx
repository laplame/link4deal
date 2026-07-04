import { useEffect, useState } from 'react';
import { User, LogOut, Home, ShoppingCart, Download } from 'lucide-react';
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
  shouldShowJoinNav,
} from '../../config/roleNavigation';
import {
  NAV_DIRECTORY_ITEMS,
  NAV_JOIN_ITEMS,
  NAV_SHOP_ITEMS,
} from '../../config/mainNavigation';
import { SITE_SHELL_NAV } from '../../config/siteShell';
import { apkDownloadAnchorProps } from '../../utils/appDownload';

interface Props {
  title?: string;
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium px-2.5 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
    isActive ? 'text-white bg-white/20' : 'text-gray-100 hover:text-white hover:bg-white/15'
  }`;

export function NavigationHeader({ title: _title }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<
    'shop' | 'directory' | 'publish' | 'join' | 'account' | null
  >(null);
  const { user, isAuthenticated, logout } = useAuth();

  const accountHref = getAccountHref(user);
  const accountLabel = getAccountLabel(user);
  const workspaceItems = user ? getRoleWorkspaceItems(user) : [];
  const publishItems = getPublishNavItems(user, isAuthenticated);
  const showJoin = shouldShowJoinNav(isAuthenticated);
  const location = useLocation();

  useEffect(() => {
    setOpenDropdown(null);
  }, [location.pathname]);

  const closeDropdowns = () => setOpenDropdown(null);

  return (
    <header className={`${SITE_SHELL_NAV} shadow-md shadow-black/20`}>
      <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2">
          <Link
            to="/"
            className="flex items-center gap-2 text-white hover:text-white/90 transition-colors min-w-0 max-w-[11rem] sm:max-w-none"
          >
            <img
              src="/logo.png"
              alt=""
              className="h-7 w-7 object-contain shrink-0"
              aria-hidden
            />
            <span className="text-base sm:text-lg font-bold truncate">{SITE_CONFIG.name}</span>
          </Link>

          <nav
            className="hidden 2xl:flex justify-center items-center gap-1 min-w-0"
            aria-label="Principal"
          >
            <NavLink to="/" end className={navLinkClass}>
              <span className="flex items-center gap-1.5">
                <Home className="h-4 w-4 shrink-0" />
                Inicio
              </span>
            </NavLink>

            <NavDropdown
              label="Tienda"
              isOpen={openDropdown === 'shop'}
              onToggle={() => setOpenDropdown(openDropdown === 'shop' ? null : 'shop')}
              onItemClick={closeDropdowns}
              onClose={closeDropdowns}
              items={NAV_SHOP_ITEMS}
            />

            <NavDropdown
              label="Directorio"
              isOpen={openDropdown === 'directory'}
              onToggle={() => setOpenDropdown(openDropdown === 'directory' ? null : 'directory')}
              onItemClick={closeDropdowns}
              onClose={closeDropdowns}
              items={NAV_DIRECTORY_ITEMS}
            />

            {publishItems.length > 0 ? (
              <NavDropdown
                label="Publicar"
                isOpen={openDropdown === 'publish'}
                onToggle={() => setOpenDropdown(openDropdown === 'publish' ? null : 'publish')}
                align="right"
                onItemClick={closeDropdowns}
                onClose={closeDropdowns}
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
                onClose={closeDropdowns}
                items={NAV_JOIN_ITEMS}
              />
            ) : null}
          </nav>

          <div className="flex items-center justify-end gap-1 sm:gap-2 shrink-0 col-start-3">
            <Link
              to="/cart"
              className="inline-flex items-center justify-center p-2 sm:p-2.5 rounded-lg text-gray-100 hover:text-white hover:bg-white/15 transition-colors"
              title="Carrito"
            >
              <ShoppingCart className="h-5 w-5" />
            </Link>

            {isAuthenticated && user ? (
              <div className="hidden 2xl:flex 2xl:items-center 2xl:gap-2">
                <span className="text-gray-200 text-sm max-w-[8rem] truncate">
                  Hola, {user.firstName}
                </span>
                {workspaceItems.length > 0 ? (
                  <NavDropdown
                    label={accountLabel}
                    isOpen={openDropdown === 'account'}
                    onToggle={() => setOpenDropdown(openDropdown === 'account' ? null : 'account')}
                    align="right"
                    onItemClick={closeDropdowns}
                    onClose={closeDropdowns}
                    items={workspaceItems}
                    variant="account"
                  />
                ) : (
                  <Link
                    to={accountHref}
                    className="flex items-center gap-1.5 text-white/90 hover:text-white px-3 py-1.5 rounded-lg bg-white/10 transition-colors text-sm whitespace-nowrap"
                  >
                    <User className="h-4 w-4 shrink-0" />
                    {accountLabel}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => logout()}
                  className="flex items-center gap-1.5 text-gray-200 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/15 transition-colors text-sm whitespace-nowrap"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  Salir
                </button>
              </div>
            ) : (
              <div className="hidden 2xl:flex 2xl:items-center 2xl:gap-1.5">
                <a
                  {...apkDownloadAnchorProps()}
                  className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white px-2.5 py-2 rounded-lg font-medium transition-colors text-sm whitespace-nowrap"
                >
                  <Download className="h-4 w-4 shrink-0" />
                  Descargar app
                </a>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="2xl:hidden p-2 text-white hover:text-white transition-colors rounded-lg hover:bg-white/15 border border-white/10"
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
