import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Sparkles } from 'lucide-react';

/** Entrada simple (nivel raíz o hoja). */
export interface InfluencerHubNavLeaf {
    type: 'item';
    id: string;
    label: string;
    icon: React.ReactNode;
}

/** Grupo plegable (p. ej. Canales → Hilos). */
export interface InfluencerHubNavGroup {
    type: 'group';
    id: string;
    label: string;
    icon: React.ReactNode;
    /** Abierto por defecto al cargar */
    defaultOpen?: boolean;
    children: { id: string; label: string; icon: React.ReactNode }[];
}

export type InfluencerHubNavEntry = InfluencerHubNavLeaf | InfluencerHubNavGroup;

export interface InfluencerHubSidebarLink {
    to: string;
    label: string;
    icon: React.ReactNode;
}

interface InfluencerHubLayoutProps {
    brandTitle: string;
    brandSubtitle: string;
    avatarUrl?: string | null;
    navTree: InfluencerHubNavEntry[];
    activeNavId: string;
    onNavChange: (id: string) => void;
    mainTitle: string;
    tabs?: { id: string; label: string }[];
    activeTabId?: string;
    onTabChange?: (id: string) => void;
    children: React.ReactNode;
    topRight?: React.ReactNode;
    /** Enlaces rápidos bajo el menú (p. ej. ofertas, carrito) — mismo bloque que el dashboard anterior */
    sidebarQuickLinks?: InfluencerHubSidebarLink[];
}

export default function InfluencerHubLayout({
    brandTitle,
    brandSubtitle,
    avatarUrl,
    navTree,
    activeNavId,
    onNavChange,
    mainTitle,
    tabs,
    activeTabId,
    onTabChange,
    children,
    topRight,
    sidebarQuickLinks
}: InfluencerHubLayoutProps) {
    const location = useLocation();
    const groupIdsWithActiveChild = useMemo(() => {
        const set = new Set<string>();
        for (const entry of navTree) {
            if (entry.type === 'group' && entry.children.some((c) => c.id === activeNavId)) {
                set.add(entry.id);
            }
        }
        return set;
    }, [navTree, activeNavId]);

    /** Solo guarda anulaciones del usuario; si falta, se usan reglas por defecto. */
    const [groupOpenOverride, setGroupOpenOverride] = useState<Record<string, boolean>>({});

    const isGroupOpen = (entry: InfluencerHubNavGroup) => {
        if (groupOpenOverride[entry.id] !== undefined) return groupOpenOverride[entry.id];
        if (groupIdsWithActiveChild.has(entry.id)) return true;
        return entry.defaultOpen === true;
    };

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-gray-100">
            <aside
                className="shrink-0 w-[260px] lg:w-[280px] min-h-screen flex flex-col bg-gradient-to-b from-slate-900 via-gray-900 to-slate-950 text-gray-100 rounded-r-[2rem] border-r border-amber-500/15 shadow-xl shadow-black/40 py-8 px-5"
                aria-label="Menú del panel"
            >
                <div className="flex flex-col items-center text-center mb-10 px-1">
                    <div className="h-16 w-16 rounded-full bg-white/10 ring-2 ring-amber-500/35 flex items-center justify-center overflow-hidden mb-3">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <Sparkles className="h-8 w-8 text-amber-200/90" strokeWidth={1.75} />
                        )}
                    </div>
                    <p className="font-bold text-lg leading-tight tracking-tight text-white">{brandTitle}</p>
                    <p className="text-gray-400 text-sm mt-1 italic">{brandSubtitle}</p>
                </div>

                <nav className="flex flex-col gap-0.5">
                    {navTree.map((entry) => {
                        if (entry.type === 'item') {
                            const active = entry.id === activeNavId;
                            return (
                                <button
                                    key={entry.id}
                                    type="button"
                                    onClick={() => onNavChange(entry.id)}
                                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-sm font-medium transition-colors ${
                                        active
                                            ? 'bg-amber-500/15 text-amber-100 ring-1 ring-amber-500/30 shadow-sm'
                                            : 'text-gray-300 hover:bg-white/5'
                                    }`}
                                >
                                    <span className="shrink-0 opacity-95 [&_svg]:h-4 [&_svg]:w-4">
                                        {entry.icon}
                                    </span>
                                    <span>{entry.label}</span>
                                </button>
                            );
                        }

                        const open = isGroupOpen(entry);
                        return (
                            <div key={entry.id} className="rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const open = isGroupOpen(entry);
                                        setGroupOpenOverride((o) => ({ ...o, [entry.id]: !open }));
                                    }}
                                    className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-left text-sm font-semibold text-gray-200 hover:bg-white/5 transition-colors"
                                    aria-expanded={open}
                                >
                                    <ChevronDown
                                        className={`h-4 w-4 shrink-0 transition-transform ${open ? '' : '-rotate-90'}`}
                                    />
                                    <span className="shrink-0 opacity-95 [&_svg]:h-4 [&_svg]:w-4">
                                        {entry.icon}
                                    </span>
                                    <span>{entry.label}</span>
                                </button>
                                {open && (
                                    <div className="mt-0.5 ml-2 pl-3 border-l border-amber-500/25 space-y-0.5">
                                        {entry.children.map((child) => {
                                            const active = child.id === activeNavId;
                                            return (
                                                <button
                                                    key={child.id}
                                                    type="button"
                                                    onClick={() => onNavChange(child.id)}
                                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs font-medium transition-colors ${
                                                        active
                                                            ? 'bg-amber-500/15 text-amber-100 ring-1 ring-amber-500/20'
                                                            : 'text-gray-400 hover:bg-white/5'
                                                    }`}
                                                >
                                                    <span className="shrink-0 opacity-95 [&_svg]:h-3.5 [&_svg]:w-3.5">
                                                        {child.icon}
                                                    </span>
                                                    <span className="leading-snug">{child.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {sidebarQuickLinks && sidebarQuickLinks.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-white/10 space-y-1">
                        <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
                            Tienda y cupones
                        </p>
                        {sidebarQuickLinks.map((item) => {
                            const on = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
                            return (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                        on
                                            ? 'bg-violet-500/15 text-violet-100 ring-1 ring-violet-500/25'
                                            : 'text-gray-300 hover:bg-white/5'
                                    }`}
                                >
                                    <span className="shrink-0 opacity-95 [&_svg]:h-4 [&_svg]:w-4">{item.icon}</span>
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                )}

                <div className="mt-auto pt-8">
                    <Link
                        to="/"
                        className="block text-center text-xs text-gray-400 hover:text-amber-200 transition-colors"
                    >
                        ← Volver al inicio
                    </Link>
                </div>
            </aside>

            <div className="flex-1 min-w-0 flex flex-col">
                <header className="px-6 lg:px-10 pt-8 pb-4 flex flex-wrap items-start justify-between gap-4 border-b border-white/10 bg-gray-900/50 backdrop-blur-sm">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">{mainTitle}</h1>
                        {tabs && tabs.length > 0 && onTabChange && activeTabId && (
                            <div className="flex flex-wrap gap-6 mt-5 border-b border-white/10 -mb-px">
                                {tabs.map((t) => {
                                    const on = t.id === activeTabId;
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => onTabChange(t.id)}
                                            className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                                                on
                                                    ? 'text-amber-400 border-amber-400'
                                                    : 'text-gray-400 border-transparent hover:text-gray-200'
                                            }`}
                                        >
                                            {t.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    {topRight}
                </header>

                <main className="flex-1 px-6 lg:px-10 py-8">{children}</main>
            </div>
        </div>
    );
}
