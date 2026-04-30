import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  User,
  LogOut,
  Home,
  Tag,
  LayoutGrid,
  Building2,
  Store,
  Share2,
  Sparkles,
  Info,
  ShoppingCart,
  Gavel,
  Ticket,
} from 'lucide-react';
import { MobileMenuButton } from './MobileMenuButton';
import { useAuth } from '../../context/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 px-1 mt-4 first:mt-0 mb-2">{children}</p>;
}

export function MobileMenu({ isOpen, onClose }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, logout } = useAuth();

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
      className={`fixed inset-0 bg-gray-900/80 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
        isOpen ? 'opacity-100 z-50' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div
        ref={menuRef}
        className={`fixed inset-y-0 right-0 w-full max-w-sm bg-gray-800 shadow-xl transition-transform duration-300 ease-in-out border-l border-gray-700 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-gray-700 shrink-0">
            <h2 className="text-xl font-bold text-white">Menú</h2>
            <button
              onClick={onClose}
              aria-label="Cerrar menú"
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1 pb-8">
            {isAuthenticated && user ? (
              <>
                <div className="text-gray-300 text-sm mb-3 px-1">Hola, {user.firstName}</div>
                <MobileMenuButton to="/dashboard" onClick={onClose}>
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4" /> Mi cuenta
                  </span>
                </MobileMenuButton>
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
                  className="w-full flex items-center gap-2 px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Salir
                </button>
              </>
            ) : (
              <>
                <MobileMenuButton to="/signin" onClick={onClose}>
                  Iniciar sesión
                </MobileMenuButton>
                <Link
                  to="/signup"
                  onClick={onClose}
                  className="block w-full min-h-[44px] px-4 py-3 text-center text-green-400 font-medium bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Registrarse
                </Link>
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
            <MobileMenuButton to="/about" onClick={onClose}>
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4" /> Nosotros
              </span>
            </MobileMenuButton>

            <SectionLabel>Explorar</SectionLabel>
            <MobileMenuButton to="/marketplace" onClick={onClose}>
              <span className="flex items-center gap-2">
                <Tag className="h-4 w-4" /> Ofertas
              </span>
            </MobileMenuButton>
            <MobileMenuButton to="/categories" onClick={onClose}>
              <span className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" /> Categorías
              </span>
            </MobileMenuButton>
            <MobileMenuButton to="/subastas" onClick={onClose}>
              <span className="flex items-center gap-2">
                <Gavel className="h-4 w-4" /> Subastas en vivo
              </span>
            </MobileMenuButton>
            <MobileMenuButton to="/redenciones-en-vivo" onClick={onClose}>
              <span className="flex items-center gap-2">
                <Ticket className="h-4 w-4" /> Cupones redimidos
              </span>
            </MobileMenuButton>

            <SectionLabel>Directorio</SectionLabel>
            <MobileMenuButton to="/brands" onClick={onClose}>
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Marcas y negocios
              </span>
            </MobileMenuButton>
            <MobileMenuButton to="/tiendas" onClick={onClose}>
              <span className="flex items-center gap-2">
                <Store className="h-4 w-4" /> Tiendas BizneAI
              </span>
            </MobileMenuButton>
            <MobileMenuButton to="/influencers" onClick={onClose}>
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Influencers
              </span>
            </MobileMenuButton>
            <MobileMenuButton to="/referral-system" onClick={onClose}>
              <span className="flex items-center gap-2">
                <Share2 className="h-4 w-4" /> Referidos
              </span>
            </MobileMenuButton>

            <SectionLabel>Publicar</SectionLabel>
            <MobileMenuButton to="/create-promotion" onClick={onClose}>
              Crear promoción
            </MobileMenuButton>
            <MobileMenuButton to="/quick-promotion" onClick={onClose}>
              Oferta rápida
            </MobileMenuButton>

            <SectionLabel>Únete</SectionLabel>
            <MobileMenuButton to="/brand-setup" onClick={onClose}>
              Registrar marca
            </MobileMenuButton>
            <MobileMenuButton to="/influencer-setup" onClick={onClose}>
              Ser influencer
            </MobileMenuButton>
          </nav>
        </div>
      </div>
    </div>
  );
}
