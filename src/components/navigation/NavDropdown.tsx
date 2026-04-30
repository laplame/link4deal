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
}

export function NavDropdown({ label, isOpen, onToggle, items, align = 'left', onItemClick }: Props) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1 text-gray-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {label}
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div
          className={`absolute top-full ${align === 'right' ? 'right-0' : 'left-0'} mt-1 min-w-[14rem] py-1 rounded-xl bg-gray-800 border border-gray-600/80 shadow-xl z-[60]`}
          role="menu"
        >
          {items.map((item) => (
            <Link
              key={`${item.to}-${item.label}`}
              to={item.to}
              role="menuitem"
              onClick={onItemClick}
              className="block px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 hover:text-white transition-colors"
            >
              <span className="font-medium">{item.label}</span>
              {item.hint && <span className="block text-xs text-gray-500 mt-0.5">{item.hint}</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
