import React, { useEffect, useRef, useState } from 'react';
import { Users, User, LogOut, Home, ShoppingCart, Info, Gavel, Ticket } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { MobileMenu } from './MobileMenu';
import { NavDropdown } from './NavDropdown';
import { SITE_CONFIG } from '../../config/site';
import { useAuth } from '../../context/AuthContext';

interface Props {
  title?: string;
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
    isActive ? 'text-white bg-white/15' : 'text-gray-300 hover:text-white hover:bg-white/10'
  }`;

export function NavigationHeader({ title }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'explore' | 'directory' | 'publish' | 'join' | null>(null);
  const { user, isAuthenticated, logout, primaryRole } = useAuth();
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

  return (
    <header className="border-b border-gray-700 bg-gray-900/90 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="flex items-center gap-2 text-white hover:text-white/90 transition-colors shrink-0">
              <Users className="h-6 w-6 text-purple-400 shrink-0" />
              <span className="text-lg sm:text-xl font-bold truncate">{title || SITE_CONFIG.name}</span>
            </Link>
          </div>

          <div ref={desktopNavRef} className="hidden lg:flex flex-1 justify-center items-center gap-1 min-w-0">
            <NavLink to="/" end className={navLinkClass}>
              <span className="flex items-center gap-1.5">
                <Home className="h-4 w-4 shrink-0" />
                Inicio
              </span>
            </NavLink>

            <NavDropdown
              label="Explorar"
              isOpen={openDropdown === 'explore'}
              onToggle={() => setOpenDropdown(openDropdown === 'explore' ? null : 'explore')}
              onItemClick={closeDropdowns}
              items={[
                { to: '/marketplace', label: 'Ofertas', hint: 'Promociones y cupones' },
                { to: '/categories', label: 'Categorías', hint: 'Explora por categoría' },
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
                { to: '/influencers', label: 'Influencers', hint: 'Perfiles y métricas' },
                { to: '/referral-system', label: 'Referidos', hint: 'Programa de referidos' },
              ]}
            />

            <NavDropdown
              label="Publicar"
              isOpen={openDropdown === 'publish'}
              onToggle={() => setOpenDropdown(openDropdown === 'publish' ? null : 'publish')}
              align="right"
              onItemClick={closeDropdowns}
              items={[
                { to: '/create-promotion', label: 'Crear promoción', hint: 'Asistente completo' },
                { to: '/quick-promotion', label: 'Oferta rápida', hint: 'Publicación exprés' },
              ]}
            />

            <NavDropdown
              label="Únete"
              isOpen={openDropdown === 'join'}
              onToggle={() => setOpenDropdown(openDropdown === 'join' ? null : 'join')}
              align="right"
              onItemClick={closeDropdowns}
              items={[
                { to: '/brand-setup', label: 'Registrar marca', hint: 'Negocios y marcas' },
                { to: '/influencer-setup', label: 'Ser influencer', hint: 'Crear perfil' },
              ]}
            />

            <NavLink to="/about" className={navLinkClass}>
              <span className="flex items-center gap-1.5">
                <Info className="h-4 w-4 shrink-0" />
                Nosotros
              </span>
            </NavLink>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/cart"
              className="hidden sm:inline-flex items-center justify-center p-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Carrito"
            >
              <ShoppingCart className="h-5 w-5" />
            </Link>

            {isAuthenticated && user ? (
              <div className="hidden lg:flex lg:items-center lg:gap-2">
                <span className="text-gray-400 text-sm max-w-[10rem] truncate">Hola, {user.firstName}</span>
                <Link
                  to={primaryRole === 'influencer' ? '/admin/influencers' : '/dashboard'}
                  className="flex items-center gap-1.5 text-white/90 hover:text-white px-3 py-1.5 rounded-lg bg-white/10 transition-colors text-sm"
                >
                  <User className="h-4 w-4" />
                  Mi cuenta
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="flex items-center gap-1.5 text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors text-sm"
                >
                  <LogOut className="h-4 w-4" />
                  Salir
                </button>
              </div>
            ) : (
              <div className="hidden lg:flex lg:items-center lg:gap-1">
                <Link
                  to="/signin"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/signup"
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  Registrarse
                </Link>
              </div>
            )}

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
              aria-label="Abrir menú"
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
