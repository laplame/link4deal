import React, { useMemo } from 'react';
import { Bell, Paperclip, ImageIcon, HelpCircle, Circle } from 'lucide-react';

export interface ThreadReply {
    id: string;
    authorName: string;
    body: string;
    /** ISO o texto ya relativo */
    createdAt: string;
    highlight?: boolean;
}

export interface ThreadItem {
    id: string;
    authorName: string;
    authorEmail?: string | null;
    body: string;
    createdAt: string;
    avatarUrl?: string | null;
    isUnread?: boolean;
    seenByCount?: number;
    replies?: ThreadReply[];
    /** Indicador tipo "X está escribiendo…" (solo UI) */
    typingName?: string | null;
}

export interface OnlineMember {
    id: string;
    name: string;
    avatarUrl?: string | null;
}

function formatRelativeTimeEs(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const diff = Date.now() - d.getTime();
    const sec = Math.floor(Math.max(0, diff) / 1000);
    if (sec < 45) return 'hace un momento';
    const min = Math.floor(sec / 60);
    if (min < 60) return `hace ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `hace ${h} h`;
    const days = Math.floor(h / 24);
    if (days < 7) return `hace ${days} d`;
    return d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

function Avatar({
    name,
    url,
    size = 'md',
    online
}: {
    name: string;
    url?: string | null;
    size?: 'sm' | 'md' | 'lg';
    online?: boolean;
}) {
    const initials = name
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    const sizeCls =
        size === 'lg' ? 'h-10 w-10 text-sm' : size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-xs';
    return (
        <span className="relative inline-flex shrink-0">
            {url ? (
                <img src={url} alt="" className={`${sizeCls} rounded-full object-cover bg-white/10`} />
            ) : (
                <span
                    className={`${sizeCls} rounded-full bg-gradient-to-br from-amber-500 to-violet-600 text-white font-semibold flex items-center justify-center`}
                >
                    {initials || '?'}
                </span>
            )}
            {online && (
                <Circle className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 fill-emerald-500 text-emerald-600 border border-white rounded-full" />
            )}
        </span>
    );
}

interface InfluencerThreadsViewProps {
    threads: ThreadItem[];
    loading?: boolean;
    /** Miembros “en línea” (demo o futura API) */
    onlineMembers?: OnlineMember[];
    channelTitle?: string;
    /** Número para badge del campanario */
    notificationCount?: number;
    /** Texto bajo el título del canal */
    channelSubtitle?: string;
}

export default function InfluencerThreadsView({
    threads,
    loading,
    onlineMembers = [],
    channelTitle = 'mensajes-personales',
    notificationCount = 0,
    channelSubtitle
}: InfluencerThreadsViewProps) {
    const showBadge = notificationCount > 0;

    const members = useMemo(() => onlineMembers.slice(0, 24), [onlineMembers]);

    return (
        <div className="flex flex-col lg:flex-row min-h-[min(720px,calc(100vh-10rem))] max-w-6xl rounded-2xl overflow-hidden border border-indigo-500/20 shadow-xl shadow-black/40">
            <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-gray-950/95 via-slate-900 to-gray-950 min-h-[480px]">
                <header className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-amber-500/15 bg-gradient-to-r from-amber-950/35 via-gray-900/85 to-rose-950/25 backdrop-blur-sm">
                    <div className="min-w-0">
                        <h2 className="text-base font-semibold text-white truncate flex items-center gap-2">
                            <span aria-hidden>🧵</span>
                            <span className="truncate">{channelTitle}</span>
                        </h2>
                        {channelSubtitle && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">{channelSubtitle}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        className="relative p-2 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                        aria-label="Notificaciones"
                    >
                        <Bell className="h-5 w-5" />
                        {showBadge && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
                                {notificationCount > 99 ? '99+' : notificationCount}
                            </span>
                        )}
                    </button>
                </header>

                <div className="p-4 shrink-0">
                    <div className="rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur-sm px-3 py-3 flex items-start gap-3">
                        <Avatar name="Tú" size="md" />
                        <input
                            type="text"
                            readOnly
                            placeholder="Iniciar un hilo…"
                            className="flex-1 min-w-0 bg-transparent text-gray-100 placeholder:text-gray-500 text-sm outline-none cursor-not-allowed"
                            aria-disabled
                        />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-2 px-1">
                        Próximamente podrás publicar hilos nuevos desde aquí.
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4 min-h-0">
                    {loading && (
                        <div className="flex justify-center py-16">
                            <div className="animate-spin rounded-full h-10 w-10 border-2 border-amber-400 border-t-transparent" />
                        </div>
                    )}
                    {!loading && threads.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-amber-500/25 bg-gray-900/40 px-6 py-14 text-center">
                            <p className="text-gray-200 text-sm font-medium">Aún no hay hilos</p>
                            <p className="text-gray-500 text-xs mt-2 max-w-sm mx-auto">
                                Cuando alguien te escriba desde tu perfil público, aparecerá aquí como una
                                conversación tipo hilo.
                            </p>
                        </div>
                    )}
                    {!loading &&
                        threads.map((thread) => (
                            <article
                                key={thread.id}
                                className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm text-gray-100 overflow-hidden shadow-lg shadow-black/20"
                            >
                                <div className="px-4 pt-4 pb-3 border-b border-white/10">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <Avatar name={thread.authorName} url={thread.avatarUrl} size="md" />
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                                                    <span className="font-semibold text-white">
                                                        {thread.authorName}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {formatRelativeTimeEs(thread.createdAt)}
                                                    </span>
                                                </div>
                                                {thread.authorEmail && (
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {thread.authorEmail}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {thread.isUnread && (
                                                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/25">
                                                    Nuevo
                                                </span>
                                            )}
                                            {typeof thread.seenByCount === 'number' && thread.seenByCount > 0 && (
                                                <span className="text-[11px] text-gray-500 whitespace-nowrap">
                                                    Visto por {thread.seenByCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-300 leading-relaxed mt-3 whitespace-pre-wrap">
                                        {thread.body}
                                    </p>
                                </div>

                                {thread.replies && thread.replies.length > 0 && (
                                    <div className="bg-gray-950/40 divide-y divide-white/5">
                                        {thread.replies.map((r) => (
                                            <div
                                                key={r.id}
                                                className={`px-4 py-3 ${r.highlight ? 'bg-violet-950/35' : ''}`}
                                            >
                                                <div className="flex gap-3">
                                                    <Avatar name={r.authorName} size="sm" />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-baseline gap-2 flex-wrap">
                                                            <span className="text-sm font-medium text-white">
                                                                {r.authorName}
                                                            </span>
                                                            <span className="text-[11px] text-gray-500">
                                                                {formatRelativeTimeEs(r.createdAt)}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-300 mt-1 whitespace-pre-wrap">
                                                            {r.body}
                                                        </p>
                                                        <div className="flex gap-4 mt-2">
                                                            <button
                                                                type="button"
                                                                className="text-[11px] font-medium text-violet-400 hover:text-violet-300"
                                                            >
                                                                Responder
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="text-[11px] font-medium text-gray-500 hover:text-gray-300"
                                                            >
                                                                Reaccionar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="px-4 py-3 bg-gray-950/30 border-t border-white/10">
                                    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-gray-900/70 px-3 py-2">
                                        <button
                                            type="button"
                                            className="p-1 text-gray-500 hover:text-gray-300 rounded"
                                            aria-label="Adjuntar"
                                        >
                                            <Paperclip className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            className="p-1 text-gray-500 hover:text-gray-300 rounded"
                                            aria-label="GIF"
                                        >
                                            <ImageIcon className="h-4 w-4" />
                                        </button>
                                        <input
                                            type="text"
                                            readOnly
                                            placeholder="Escribe una respuesta…"
                                            className="flex-1 min-w-0 bg-transparent text-sm text-gray-300 placeholder:text-gray-500 outline-none cursor-not-allowed"
                                        />
                                    </div>
                                    {thread.typingName ? (
                                        <p className="text-[11px] text-gray-500 mt-2 italic">
                                            {thread.typingName} está escribiendo…
                                        </p>
                                    ) : null}
                                </div>
                            </article>
                        ))}
                </div>
            </div>

            <aside className="w-full lg:w-56 shrink-0 flex flex-col bg-gray-900/80 border-t lg:border-t-0 lg:border-l border-white/10 backdrop-blur-sm">
                <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-xs font-semibold text-gray-300 flex items-center gap-2">
                        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow shadow-emerald-500/50" />
                        {members.length} en línea
                    </p>
                </div>
                <div className="flex-1 overflow-y-auto py-2 px-2 min-h-[120px] max-h-[280px] lg:max-h-none">
                    {members.length === 0 ? (
                        <p className="text-[11px] text-gray-500 px-2 py-4 text-center leading-relaxed">
                            Actividad en vivo cuando conectes con marcas y equipo.
                        </p>
                    ) : (
                        <ul className="space-y-1">
                            {members.map((m) => (
                                <li key={m.id}>
                                    <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5">
                                        <Avatar name={m.name} url={m.avatarUrl} size="sm" online />
                                        <span className="text-xs text-gray-200 truncate">{m.name}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="p-3 border-t border-white/10 flex justify-end">
                    <button
                        type="button"
                        className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-200"
                    >
                        <HelpCircle className="h-3.5 w-3.5" />
                        Ayuda
                    </button>
                </div>
            </aside>
        </div>
    );
}
