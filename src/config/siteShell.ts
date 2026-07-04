/**
 * Shell visual y reglas de navbar global del sitio.
 * Referencia de estilo: /quick-promotion
 */

export const SITE_SHELL_PAGE =
  'min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-gray-100';

export const SITE_SHELL_NAV =
  'border-b border-white/10 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50';

export const SITE_SHELL_SUBHEADER = 'border-b border-white/10 bg-gray-900/50 backdrop-blur-sm';

export const SITE_SHELL_CARD =
  'rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm shadow-lg shadow-black/20';

/** Sección de landing sin fondo claro propio (hereda shell oscuro). */
export const SITE_SHELL_SECTION = 'py-20 relative overflow-hidden border-t border-white/10';

/** Resaltador claro sobre fondo oscuro (títulos legibles). */
export const SITE_SHELL_TEXT_HIGHLIGHT =
  'box-decoration-clone bg-amber-100/95 text-gray-900 px-2 py-0.5 rounded-sm shadow-sm';

export const SITE_SHELL_TEXT_HIGHLIGHT_PANEL =
  'rounded-xl bg-amber-50/95 backdrop-blur-sm border border-amber-200/70 shadow-md';

/** Cuponeras / tienda del influencer: sin navbar global (no sacar tráfico a otras áreas). */
export function isInfluencerWalledGardenPath(pathname: string): boolean {
  return (
    /^\/influencer\/[^/]+\/(?:deals|tienda)\/?$/.test(pathname) ||
    /^\/influencer\/[^/]+\/promo\/[^/]+\/?$/.test(pathname)
  );
}

const ROUTES_WITHOUT_GLOBAL_NAV = ['/dashboard/suite', '/demo/influencer-dashboard'] as const;

const INFLUENCER_HUB_PATHS_HIDE_NAV = [
  '/dashboard/panel',
  '/influencer/panel',
  '/admin/influencers',
] as const;

export type GlobalNavHideContext = {
  primaryRole?: string | null;
  isPlatformSuperuser?: boolean;
};

/** Única fuente de verdad: cuándo ocultar NavigationHeader en MainLayout. */
export function shouldHideGlobalNav(
  pathname: string,
  ctx: GlobalNavHideContext = {},
): boolean {
  if (isInfluencerWalledGardenPath(pathname)) return true;
  if (ROUTES_WITHOUT_GLOBAL_NAV.includes(pathname as (typeof ROUTES_WITHOUT_GLOBAL_NAV)[number])) {
    return true;
  }
  const { primaryRole, isPlatformSuperuser } = ctx;
  if (
    INFLUENCER_HUB_PATHS_HIDE_NAV.includes(
      pathname as (typeof INFLUENCER_HUB_PATHS_HIDE_NAV)[number],
    ) &&
    (primaryRole === 'influencer' || isPlatformSuperuser)
  ) {
    return true;
  }
  return false;
}
