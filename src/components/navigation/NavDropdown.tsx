import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

export interface NavDropdownItem {
  to: string;
  label: string;
  hint?: string;
}

interface Props {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  items: NavDropdownItem[];
  align?: 'left' | 'right';
  onItemClick?: () => void;
  /** Estilo del botón en barra de cuenta autenticada. */
  variant?: 'default' | 'account';
}

export function NavDropdown({
  label,
  isOpen,
  onToggle,
  items,
  align = 'left',
  onItemClick,
  variant = 'default',
}: Props) {
  const buttonClass =
    variant === 'account'
      ? 'flex items-center gap-1.5 text-white/90 hover:text-white px-2 2xl:px-3 py-1.5 rounded-lg bg-white/10 transition-colors text-xs 2xl:text-sm font-medium whitespace-nowrap shrink-0'
      : 'flex items-center gap-1 text-gray-100 hover:text-white px-2 2xl:px-3 py-2 rounded-lg hover:bg-white/15 transition-colors text-xs 2xl:text-sm font-medium whitespace-nowrap shrink-0';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={buttonClass}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {label}
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div
          className={`absolute top-full ${align === 'right' ? 'right-0' : 'left-0'} mt-1 min-w-[14rem] py-1 rounded-xl bg-gray-950 border border-gray-600 shadow-xl z-[60]`}
          role="menu"
        >
          {items.map((item) => (
            <Link
              key={`${item.to}-${item.label}`}
              to={item.to}
              role="menuitem"
              onClick={onItemClick}
              className="block px-4 py-2.5 text-sm text-gray-100 hover:bg-white/15 hover:text-white transition-colors"
            >
              <span className="font-medium text-white">{item.label}</span>
              {item.hint && <span className="block text-xs text-gray-400 mt-0.5">{item.hint}</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
