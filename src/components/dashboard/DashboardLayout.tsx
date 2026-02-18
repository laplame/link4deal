import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Tag,
  ShoppingCart,
  FolderTree,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Building2,
  Sparkles,
  Shield,
  Home,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SITE_CONFIG } from '../../config/site';
import { PRIMARY_ROLE_LABELS } from '../../types/auth';
import type { PrimaryRole } from '../../types/auth';

const SIDEBAR_COLLAPSED_KEY = 'dashboard_sidebar_collapsed';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles?: PrimaryRole[];
}

const commonNav: NavItem[] = [
  { to: '/dashboard', label: 'Inicio', icon: <LayoutDashboard className="h-5 w-5 shrink-0" /> },
  { to: '/marketplace', label: 'Ofertas', icon: <Tag className="h-5 w-5 shrink-0" /> },
  { to: '/cart', label: 'Carrito', icon: <ShoppingCart className="h-5 w-5 shrink-0" /> },
  { to: '/categories', label: 'Categorías', icon: <FolderTree className="h-5 w-5 shrink-0" /> },
];

const roleNav: NavItem[] = [
  { to: '/admin/influencers', label: 'Influencers', icon: <Sparkles className="h-5 w-5 shrink-0" />, roles: ['admin', 'moderator'] },
  { to: '/admin/brands', label: 'Marcas', icon: <ShoppingBag className="h-5 w-5 shrink-0" />, roles: ['admin', 'moderator'] },
  { to: '/admin/agencies', label: 'Agencias', icon: <Building2 className="h-5 w-5 shrink-0" />, roles: ['admin', 'moderator'] },
  { to: '/admin', label: 'Panel Admin', icon: <Shield className="h-5 w-5 shrink-0" />, roles: ['admin', 'moderator'] },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, primaryRole, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
    } catch {
      // ignore
    }
  }, [collapsed]);

  const handleLogout = async () => {
    await logout();
    navigate('/signin', { replace: true });
  };

  const roleLabel = primaryRole ? PRIMARY_ROLE_LABELS[primaryRole] : 'Usuario';
  const showRoleNav = (item: NavItem) =>
    !item.roles || (primaryRole && item.roles.includes(primaryRole));

  const navItems = [...commonNav, ...roleNav.filter(showRoleNav)];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-gray-200 bg-white transition-all duration-300 ${
          collapsed ? 'w-[72px]' : 'w-60'
        }`}
      >
        <div
          className={`flex h-14 items-center border-b border-gray-200 px-3 ${
            collapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2 font-semibold text-gray-900">
              <span className="text-lg">{SITE_CONFIG.name}</span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {collapsed ? (
              <PanelLeft className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    } ${collapsed ? 'justify-center px-2' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    {item.icon}
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-gray-200 p-2">
          {!collapsed && user && (
            <div className="mb-2 px-3 py-2 text-xs text-gray-500">
              <p className="truncate font-medium text-gray-700">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate">{user.email}</p>
              <p className="mt-0.5">{roleLabel}</p>
            </div>
          )}
          <Link
            to="/"
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 ${
              collapsed ? 'justify-center px-2' : ''
            }`}
            title={collapsed ? 'Ir al sitio' : undefined}
          >
            <Home className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Ir al sitio</span>}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 ${
              collapsed ? 'justify-center px-2' : ''
            }`}
            title={collapsed ? 'Cerrar sesión' : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
