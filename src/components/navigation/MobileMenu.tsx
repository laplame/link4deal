import React, { useEffect, useRef } from 'react';
import {
  X,
  User,
  LogOut,
  Home,
  ShoppingCart,
  Download,
} from 'lucide-react';
import { MobileMenuButton } from './MobileMenuButton';
import { useAuth } from '../../context/AuthContext';
import { apkDownloadAnchorProps } from '../../utils/appDownload';
import {
  NAV_DIRECTORY_ITEMS,
  NAV_JOIN_ITEMS,
  NAV_SHOP_ITEMS,
} from '../../config/mainNavigation';
import {
  getAccountHref,
  getAccountLabel,
  getPublishNavItems,
  getRoleWorkspaceItems,
  shouldShowJoinNav,
} from '../../config/roleNavigation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 px-1 mt-4 first:mt-0 mb-2">{children}</p>;
}

export function MobileMenu({ isOpen, onClose }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, logout } = useAuth();

  const accountHref = getAccountHref(user);
  const accountLabel = getAccountLabel(user);
  const workspaceItems = user ? getRoleWorkspaceItems(user) : [];
  const publishItems = getPublishNavItems(user, isAuthenticated);
  const showJoin = shouldShowJoinNav(isAuthenticated);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <div
      className={`fixed inset-0 bg-black/70 transition-opacity duration-300 2xl:hidden ${
        isOpen ? 'opacity-100 z-[100]' : 'opacity-0 pointer-events-none invisible'
      }`}
      aria-hidden={!isOpen}
    >
      <div
        ref={menuRef}
        className={`fixed inset-y-0 right-0 w-full max-w-sm bg-gray-950 shadow-2xl transition-transform duration-300 ease-in-out border-l border-gray-600 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-gray-700 shrink-0 bg-gray-900">
            <h2 className="text-xl font-bold text-white">Menú</h2>
            <button
              onClick={onClose}
              aria-label="Cerrar menú"
              className="p-2 text-gray-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1 pb-8">
            {isAuthenticated && user ? (
              <>
                <div className="text-gray-100 text-sm mb-3 px-1">Hola, {user.firstName}</div>
                <SectionLabel>{accountLabel}</SectionLabel>
                {workspaceItems.map((item) => (
                  <MobileMenuButton key={`${item.to}-${item.label}`} to={item.to} onClick={onClose}>
                    {item.label}
                  </MobileMenuButton>
                ))}
                {workspaceItems.length === 0 ? (
                  <MobileMenuButton to={accountHref} onClick={onClose}>
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4" /> {accountLabel}
                    </span>
                  </MobileMenuButton>
                ) : null}
                <MobileMenuButton to="/cart" onClick={onClose}>
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" /> Carrito
                  </span>
                </MobileMenuButton>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left text-gray-100 hover:text-white hover:bg-gray-800 rounded-lg border border-gray-700 transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Salir
                </button>
              </>
            ) : (
              <>
                <a
                  {...apkDownloadAnchorProps()}
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 w-full min-h-[44px] px-4 py-3 text-center text-white font-semibold bg-green-600 hover:bg-green-500 rounded-lg transition-colors shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  Descargar app
                </a>
                <MobileMenuButton to="/cart" onClick={onClose}>
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" /> Carrito
                  </span>
                </MobileMenuButton>
              </>
            )}

            <SectionLabel>Principal</SectionLabel>
            <MobileMenuButton to="/" onClick={onClose}>
              <span className="flex items-center gap-2">
                <Home className="h-4 w-4" /> Inicio
              </span>
            </MobileMenuButton>

            <SectionLabel>Tienda y explorar</SectionLabel>
            {NAV_SHOP_ITEMS.map((item) => (
              <MobileMenuButton key={item.to} to={item.to} onClick={onClose}>
                {item.label}
              </MobileMenuButton>
            ))}

            <SectionLabel>Directorio</SectionLabel>
            {NAV_DIRECTORY_ITEMS.map((item) => (
              <MobileMenuButton key={item.to} to={item.to} onClick={onClose}>
                {item.label}
              </MobileMenuButton>
            ))}

            {publishItems.length > 0 ? (
              <>
                <SectionLabel>Publicar</SectionLabel>
                {publishItems.map((item) => (
                  <MobileMenuButton key={item.to} to={item.to} onClick={onClose}>
                    {item.label}
                  </MobileMenuButton>
                ))}
              </>
            ) : null}

            {showJoin ? (
              <>
                <SectionLabel>Únete</SectionLabel>
                {NAV_JOIN_ITEMS.map((item) => (
                  <MobileMenuButton key={item.to} to={item.to} onClick={onClose}>
                    {item.label}
                  </MobileMenuButton>
                ))}
              </>
            ) : null}
          </nav>
        </div>
      </div>
    </div>
  );
}
