import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X, User, LogOut } from 'lucide-react';
import { MobileMenuButton } from './MobileMenuButton';
import { useAuth } from '../../context/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
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
        className={`fixed inset-y-0 right-0 w-full max-w-xs bg-gray-800 shadow-xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">Menu</h2>
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-4">
            {isAuthenticated && user ? (
              <>
                <div className="text-gray-300 text-sm mb-2">Hola, {user.firstName}</div>
                <MobileMenuButton to="/dashboard" onClick={onClose}>
                  <span className="flex items-center gap-2"><User className="h-4 w-4" /> Mi cuenta</span>
                </MobileMenuButton>
                <button
                  type="button"
                  onClick={() => { onClose(); logout(); }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Salir
                </button>
              </>
            ) : (
              <>
                <Link to="/signin" onClick={onClose} className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg">Iniciar sesión</Link>
                <Link to="/signup" onClick={onClose} className="block px-4 py-3 text-green-400 hover:text-green-300 hover:bg-gray-700 rounded-lg font-medium">Registrarse</Link>
              </>
            )}
            <MobileMenuButton to="/" onClick={onClose}>
              Inicio
            </MobileMenuButton>
            <MobileMenuButton to="/brands" onClick={onClose}>
              Marcas y Negocios
            </MobileMenuButton>
            <MobileMenuButton to="/influencers" onClick={onClose}>
              Influencers
            </MobileMenuButton>
            <MobileMenuButton to="/marketplace" onClick={onClose}>
              Ofertas
            </MobileMenuButton>
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