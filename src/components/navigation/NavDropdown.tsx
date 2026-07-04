import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  onClose?: () => void;
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
  onClose,
  variant = 'default',
}: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const buttonClass =
    variant === 'account'
      ? 'flex items-center gap-1.5 text-white/90 hover:text-white px-2 2xl:px-3 py-1.5 rounded-lg bg-white/10 transition-colors text-xs 2xl:text-sm font-medium whitespace-nowrap shrink-0'
      : 'flex items-center gap-1 text-gray-100 hover:text-white px-2 2xl:px-3 py-2 rounded-lg hover:bg-white/15 transition-colors text-xs 2xl:text-sm font-medium whitespace-nowrap shrink-0';

  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const updatePosition = () => {
      const rect = buttonRef.current!.getBoundingClientRect();
      if (align === 'right') {
        setMenuStyle({
          position: 'fixed',
          top: rect.bottom + 4,
          right: Math.max(8, window.innerWidth - rect.right),
          zIndex: 1200,
        });
      } else {
        setMenuStyle({
          position: 'fixed',
          top: rect.bottom + 4,
          left: Math.max(8, rect.left),
          zIndex: 1200,
        });
      }
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, align]);

  useEffect(() => {
    if (!isOpen) return;

    const dismiss = () => {
      (onClose ?? onItemClick)?.();
    };

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      dismiss();
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [isOpen, onClose, onItemClick]);

  const menu =
    isOpen &&
    createPortal(
      <div
        ref={menuRef}
        style={menuStyle}
        className="min-w-[14rem] py-1 rounded-xl bg-gray-950 border border-gray-600 shadow-xl"
        role="menu"
      >
        {items.map((item) => (
          <Link
            key={`${item.to}-${item.label}`}
            to={item.to}
            role="menuitem"
            onClick={() => {
              onItemClick?.();
              onClose?.();
            }}
            className="block px-4 py-2.5 text-sm text-gray-100 hover:bg-white/15 hover:text-white transition-colors"
          >
            <span className="font-medium text-white">{item.label}</span>
            {item.hint ? (
              <span className="block text-xs text-gray-400 mt-0.5">{item.hint}</span>
            ) : null}
          </Link>
        ))}
      </div>,
      document.body,
    );

  return (
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={onToggle}
        className={buttonClass}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {label}
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {menu}
    </div>
  );
}
