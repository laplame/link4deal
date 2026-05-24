import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  LayoutGrid,
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
  FileCode,
  Users,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SITE_CONFIG } from '../../config/site';
import { PRIMARY_ROLE_LABELS } from '../../types/auth';
import type { PrimaryRole } from '../../types/auth';
import { DASHBOARD_ROUTES, isStaffUser } from '../../config/dashboardContexts';

const SIDEBAR_COLLAPSED_KEY = 'dashboard_sidebar_collapsed';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles?: PrimaryRole[];
  staffOnly?: boolean;
  rolePanelOnly?: boolean;
}

const commonNav: NavItem[] = [
  { to: '/dashboard', label: 'Inicio', icon: <LayoutDashboard className="h-5 w-5 shrink-0" /> },
  { to: '/marketplace', label: 'Ofertas', icon: <Tag className="h-5 w-5 shrink-0" /> },
  { to: '/cart', label: 'Carrito', icon: <ShoppingCart className="h-5 w-5 shrink-0" /> },
  { to: '/categories', label: 'Categorías', icon: <FolderTree className="h-5 w-5 shrink-0" /> },
];

const rolePanelNav: NavItem[] = [
  { to: DASHBOARD_ROUTES.role.influencer, label: 'Mi panel creador', icon: <Sparkles className="h-5 w-5 shrink-0" />, roles: ['influencer'], rolePanelOnly: true },
  { to: DASHBOARD_ROUTES.role.brand, label: 'Mi marca', icon: <Building2 className="h-5 w-5 shrink-0" />, roles: ['brand'], rolePanelOnly: true },
  { to: DASHBOARD_ROUTES.role.agency, label: 'Mi agencia', icon: <Briefcase className="h-5 w-5 shrink-0" />, roles: ['agency'], rolePanelOnly: true },
];

const adminNav: NavItem[] = [
  { to: DASHBOARD_ROUTES.suite, label: 'Multi-panel (suite)', icon: <LayoutGrid className="h-5 w-5 shrink-0" />, staffOnly: true },
  { to: DASHBOARD_ROUTES.admin.home, label: 'Admin Link4Deal', icon: <Shield className="h-5 w-5 shrink-0" />, staffOnly: true },
  { to: DASHBOARD_ROUTES.admin.crm, label: 'CRM influencers', icon: <Users className="h-5 w-5 shrink-0" />, staffOnly: true },
  { to: DASHBOARD_ROUTES.admin.influencers, label: 'Admin influencers', icon: <Sparkles className="h-5 w-5 shrink-0" />, staffOnly: true },
  { to: DASHBOARD_ROUTES.admin.brands, label: 'Admin marcas', icon: <ShoppingBag className="h-5 w-5 shrink-0" />, staffOnly: true },
  { to: DASHBOARD_ROUTES.admin.agencies, label: 'Admin agencias', icon: <Building2 className="h-5 w-5 shrink-0" />, staffOnly: true },
  { to: DASHBOARD_ROUTES.admin.promotions, label: 'Gestionar promociones', icon: <Tag className="h-5 w-5 shrink-0" />, staffOnly: true },
  { to: DASHBOARD_ROUTES.admin.apiDocs, label: 'API Docs', icon: <FileCode className="h-5 w-5 shrink-0" />, roles: ['agency'], staffOnly: true },
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

  const staff = isStaffUser(user);
  const roleLabel = staff
    ? 'Staff Link4Deal'
    : primaryRole
      ? PRIMARY_ROLE_LABELS[primaryRole]
      : 'Usuario';

  const showNavItem = (item: NavItem) => {
    if (item.staffOnly && !staff) return false;
    if (item.to === DASHBOARD_ROUTES.admin.apiDocs) {
      return staff || primaryRole === 'agency';
    }
    if (item.rolePanelOnly) {
      if (staff) return true;
      return Boolean(primaryRole && item.roles?.includes(primaryRole));
    }
    if (item.roles && primaryRole) {
      return item.roles.includes(primaryRole) || staff;
    }
    return true;
  };

  const navItems = [...commonNav, ...rolePanelNav.filter(showNavItem), ...adminNav.filter(showNavItem)];

  return (
    <div className="flex min-h-screen bg-gray-50">
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
            {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.to || location.pathname.startsWith(item.to + '/');
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
              <p className="truncate">{user.email || user.phone || '—'}</p>
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

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
