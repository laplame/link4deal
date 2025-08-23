import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { MobileMenuButton } from './MobileMenuButton';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

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
            <MobileMenuButton to="/brands" onClick={onClose}>
              View Brand Opportunities
            </MobileMenuButton>
            
            <MobileMenuButton to="/add-influencer" onClick={onClose}>
              Become an Influencer
            </MobileMenuButton>
            
            <MobileMenuButton to="/add-influencer-quick" onClick={onClose}>
              Add Influencer
            </MobileMenuButton>
          </nav>
        </div>
      </div>
    </div>
  );
}