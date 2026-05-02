import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import InfluencerHubLayout, { type InfluencerHubNavEntry } from '../../components/dashboard/InfluencerHubLayout';
import InfluencerThreadsView, { type ThreadItem } from '../../components/dashboard/InfluencerThreadsView';
import {
    Calendar,
    Users,
    Library,
    TrendingUp,
    Target,
    Zap,
    Star,
    CheckCircle,
    Clock,
    AlertCircle,
    Eye,
    Edit,
    Search,
    Plus,
    Camera,
    BarChart3,
    ArrowLeft,
    Radio,
    MessageSquare,
    GraduationCap,
    CreditCard,
    Wallet,
    Tag,
    ShoppingBag,
    Gift
} from 'lucide-react';

type HubSection =
    | 'channels-threads'
    | 'eventos'
    | 'cursos'
    | 'recursos'
    | 'pagos'
    | 'directorio';

interface Influencer {
    id: string;
    name: string;
    username: string;
    avatar: string;
    followers: number;
    engagement: number;
    categories: string[];
    status: 'active' | 'pending' | 'verified' | 'suspended';
    joinDate: string;
    totalEarnings: number;
    monthlyEarnings: number;
    completedCampaigns: number;
    activeCampaigns: number;
    rating: number;
    location: string;
    socialMedia: {
        instagram?: string;
        tiktok?: string;
        youtube?: string;
        twitter?: string;
    };
}

interface Campaign {
    id: string;
    title: string;
    brand: string;
    status: 'active' | 'completed' | 'pending' | 'cancelled';
    startDate: string;
    endDate: string;
    budget: number;
    earnings: number;
    progress: number;
    type: 'post' | 'story' | 'video' | 'live';
    category: string;
    requirements: string[];
}

interface Earning {
    id: string;
    campaign: string;
    brand: string;
    amount: number;
    date: string;
    status: 'paid' | 'pending' | 'processing';
    type: 'commission' | 'bonus' | 'referral';
}

interface InboxMessage {
    id: string;
    senderName: string;
    senderEmail: string | null;
    message: string;
    read: boolean;
    createdAt: string;
}

export default function InfluencerDashboard() {
    const { hasRole } = useAuth();
    const isInfluencerRole = hasRole('influencer');
    const [influencers, setInfluencers] = useState<Influencer[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [earnings, setEarnings] = useState<Earning[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [inboxMessages, setInboxMessages] = useState<InboxMessage[]>([]);
    const [inboxLoading, setInboxLoading] = useState(false);
    const [section, setSection] = useState<HubSection>('eventos');
    const [campaignTab, setCampaignTab] = useState<'proximas' | 'activas' | 'pasadas'>('activas');

    useEffect(() => {
        if (!isInfluencerRole) return;
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        setInboxLoading(true);
        fetch('/api/influencers/messages/inbox', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.data?.messages) {
                    setInboxMessages(data.data.messages);
                }
            })
            .catch(() => {})
            .finally(() => setInboxLoading(false));
    }, [isInfluencerRole]);

    // Datos desde la API (BD); con populate en backend
    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

        if (isInfluencerRole && token) {
            fetch('/api/influencers/me', { headers })
                .then((res) => res.json())
                .then((data) => {
                    if (data.success && data.data) {
                        const inf = data.data;
                        const asDashboardInfluencer: Influencer = {
                            id: inf.id,
                            name: inf.name || '',
                            username: inf.username || '',
                            avatar: inf.avatar || '',
                            followers: inf.totalFollowers ?? 0,
                            engagement: inf.engagement ?? 0,
                            categories: Array.isArray(inf.categories) ? inf.categories : [],
                            status: inf.status || 'pending',
                            joinDate: inf.joinDate || '',
                            totalEarnings: inf.totalEarnings ?? 0,
                            monthlyEarnings: inf.monthlyEarnings ?? 0,
                            completedCampaigns: inf.completedPromotions ?? 0,
                            activeCampaigns: inf.activePromotions ?? 0,
                            rating: inf.rating ?? 0,
                            location: inf.location || '',
                            socialMedia: inf.socialMedia || {},
                        };
                        setInfluencers([asDashboardInfluencer]);
                        const promos = Array.isArray(inf.recentPromotions) ? inf.recentPromotions : [];
                        setCampaigns(promos.map((p: any) => ({
                            id: p.id || '',
                            title: p.title || '',
                            brand: p.brand || '',
                            status: (p.status || 'pending') as Campaign['status'],
                            startDate: p.date || '',
                            endDate: p.date || '',
                            budget: p.earnings ?? 0,
                            earnings: p.earnings ?? 0,
                            progress: p.status === 'completed' ? 100 : p.status === 'active' ? 50 : 0,
                            type: 'post',
                            category: '',
                            requirements: [],
                        })));
                        const pays = Array.isArray(inf.recentPayments) ? inf.recentPayments : [];
                        setEarnings(pays.map((p: any) => ({
                            id: p.id || '',
                            campaign: p.description || '',
                            brand: '',
                            amount: p.amount ?? 0,
                            date: p.date || '',
                            status: (p.status || 'pending') as Earning['status'],
                            type: (p.type || 'commission') as Earning['type'],
                        })));
                    } else {
                        setInfluencers([]);
                        setCampaigns([]);
                        setEarnings([]);
                    }
                })
                .catch(() => {
                    setInfluencers([]);
                    setCampaigns([]);
                    setEarnings([]);
                });
        } else {
            fetch('/api/influencers?limit=50&page=1')
                .then((res) => res.json())
                .then((data) => {
                    if (data.success && data.data?.docs) {
                        const list = (data.data.docs as any[]).map((inf) => ({
                            id: inf.id,
                            name: inf.name || '',
                            username: inf.username || '',
                            avatar: inf.avatar || '',
                            followers: inf.totalFollowers ?? 0,
                            engagement: inf.engagement ?? 0,
                            categories: Array.isArray(inf.categories) ? inf.categories : [],
                            status: inf.status || 'pending',
                            joinDate: inf.joinDate || '',
                            totalEarnings: inf.totalEarnings ?? 0,
                            monthlyEarnings: inf.monthlyEarnings ?? 0,
                            completedCampaigns: inf.completedPromotions ?? 0,
                            activeCampaigns: inf.activePromotions ?? 0,
                            rating: inf.rating ?? 0,
                            location: inf.location || '',
                            socialMedia: inf.socialMedia || {},
                        })) as Influencer[];
                        setInfluencers(list);
                    } else {
                        setInfluencers([]);
                    }
                    setCampaigns([]);
                    setEarnings([]);
                })
                .catch(() => {
                    setInfluencers([]);
                    setCampaigns([]);
                    setEarnings([]);
                });
        }
    }, [isInfluencerRole]);

    const totalInfluencers = influencers.length;
    const activeInfluencers = influencers.filter(i => i.status === 'active' || i.status === 'verified').length;
    const totalMonthlyEarnings = influencers.reduce((sum, i) => sum + i.monthlyEarnings, 0);
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

    const filteredInfluencers = influencers.filter(influencer => {
        const matchesSearch = influencer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            influencer.username.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || influencer.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const navTree = useMemo((): InfluencerHubNavEntry[] => {
        const tree: InfluencerHubNavEntry[] = [];
        if (isInfluencerRole) {
            tree.push({
                type: 'group',
                id: 'channels',
                label: 'Canales',
                icon: <Radio className="h-4 w-4" />,
                defaultOpen: true,
                children: [
                    {
                        id: 'channels-threads',
                        label: 'Hilos · mensajes personales',
                        icon: <MessageSquare className="h-3.5 w-3.5" />
                    }
                ]
            });
        }
        if (!isInfluencerRole) {
            tree.push({
                type: 'item',
                id: 'directorio',
                label: 'Directorio',
                icon: <Users className="h-4 w-4" />
            });
        }
        tree.push(
            {
                type: 'item',
                id: 'eventos',
                label: 'Eventos',
                icon: <Calendar className="h-4 w-4" />
            },
            {
                type: 'item',
                id: 'cursos',
                label: 'Cursos online',
                icon: <GraduationCap className="h-4 w-4" />
            },
            {
                type: 'item',
                id: 'recursos',
                label: 'Recursos',
                icon: <Library className="h-4 w-4" />
            },
            {
                type: 'item',
                id: 'pagos',
                label: 'Pagos',
                icon: <CreditCard className="h-4 w-4" />
            }
        );
        return tree;
    }, [isInfluencerRole]);

    const sidebarQuickLinks = (isInfluencerRole
        ? [
              { to: '/marketplace', label: 'Ofertas y cupones', icon: <Tag className="h-4 w-4" /> },
              { to: '/cart', label: 'Carrito', icon: <ShoppingBag className="h-4 w-4" /> },
              { to: '/categories', label: 'Categorías', icon: <Gift className="h-4 w-4" /> }
          ]
        : undefined);

    const mainTitle = useMemo(() => {
        switch (section) {
            case 'channels-threads':
                return 'Hilos · mensajes personales';
            case 'eventos':
                return 'Eventos';
            case 'cursos':
                return 'Cursos online';
            case 'recursos':
                return 'Recursos';
            case 'pagos':
                return 'Pagos';
            case 'directorio':
                return 'Directorio';
            default:
                return 'Panel';
        }
    }, [section]);

    const brandTitle =
        isInfluencerRole && influencers[0]?.name ? influencers[0].name : 'Link4Deal';
    const brandSubtitle = isInfluencerRole
        ? 'Canales, eventos, cursos y pagos'
        : 'Herramientas de comunidad';
    const avatarUrl = isInfluencerRole && influencers[0]?.avatar ? influencers[0].avatar : null;

    const tabCampaigns = useMemo(() => {
        if (campaignTab === 'activas') return campaigns.filter((c) => c.status === 'active');
        if (campaignTab === 'pasadas')
            return campaigns.filter((c) => c.status === 'completed' || c.status === 'cancelled');
        return campaigns.filter((c) => c.status === 'pending');
    }, [campaigns, campaignTab]);

    function fmtCampaignDate(s: string) {
        if (!s) return '—';
        const d = new Date(s);
        if (Number.isNaN(d.getTime())) return s;
        return d.toLocaleDateString('es', { weekday: 'short', month: 'short', day: 'numeric' });
    }

    const threadItems = useMemo(
        (): ThreadItem[] =>
            inboxMessages.map((msg) => ({
                id: msg.id,
                authorName: msg.senderName,
                authorEmail: msg.senderEmail,
                body: msg.message,
                createdAt: msg.createdAt,
                isUnread: !msg.read,
                replies: []
            })),
        [inboxMessages]
    );

    const inboxUnreadCount = useMemo(() => inboxMessages.filter((m) => !m.read).length, [inboxMessages]);

    const threadsOnlineMembers = useMemo(() => {
        if (!isInfluencerRole || !influencers[0]) return [];
        const me = influencers[0];
        return [
            { id: 'self', name: me.name || 'Tú', avatarUrl: me.avatar || undefined },
            { id: 'ld-team', name: 'Equipo Link4Deal' }
        ];
    }, [isInfluencerRole, influencers]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'verified':
                return 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20';
            case 'active':
                return 'bg-violet-500/15 text-violet-200 ring-1 ring-violet-500/25';
            case 'pending':
                return 'bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/25';
            case 'suspended':
                return 'bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/20';
            default:
                return 'bg-white/10 text-gray-300';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'verified': return <CheckCircle className="w-4 h-4" />;
            case 'active': return <Zap className="w-4 h-4" />;
            case 'pending': return <Clock className="w-4 h-4" />;
            case 'suspended': return <AlertCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    const campaignTabs = [
        { id: 'proximas' as const, label: 'Próximas' },
        { id: 'activas' as const, label: 'Activas' },
        { id: 'pasadas' as const, label: 'Pasadas' }
    ];

    return (
        <InfluencerHubLayout
            brandTitle={brandTitle}
            brandSubtitle={brandSubtitle}
            avatarUrl={avatarUrl}
            navTree={navTree}
            activeNavId={section}
            onNavChange={(id) => setSection(id as HubSection)}
            mainTitle={mainTitle}
            tabs={section === 'eventos' ? campaignTabs : undefined}
            activeTabId={section === 'eventos' ? campaignTab : undefined}
            onTabChange={
                section === 'eventos'
                    ? (id) => setCampaignTab(id as 'proximas' | 'activas' | 'pasadas')
                    : undefined
            }
            topRight={
                !isInfluencerRole ? (
                    <Link
                        to="/admin"
                        className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-gray-900/60 px-4 py-2 text-sm font-medium text-gray-200 shadow-sm hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Panel admin
                    </Link>
                ) : undefined
            }
            sidebarQuickLinks={sidebarQuickLinks}
        >
            {section === 'eventos' && (
                <div className="space-y-8 max-w-4xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm shadow-sm p-5 border-l-4 border-l-amber-500/70">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                {isInfluencerRole ? 'Ganancias totales' : 'Influencers'}
                            </p>
                            <p className="text-2xl font-bold text-white mt-1">
                                {isInfluencerRole
                                    ? `$${(influencers[0]?.totalEarnings ?? 0).toLocaleString()}`
                                    : totalInfluencers}
                            </p>
                            <div className="mt-2 flex items-center text-xs text-emerald-400">
                                <TrendingUp className="w-3.5 h-3.5 mr-1" />
                                {isInfluencerRole ? 'Historial acumulado' : 'Registrados'}
                            </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm shadow-sm p-5 border-l-4 border-l-orange-400">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                Este mes
                            </p>
                            <p className="text-2xl font-bold text-white mt-1">
                                $
                                {(isInfluencerRole
                                    ? influencers[0]?.monthlyEarnings
                                    : totalMonthlyEarnings) ?? 0}
                            </p>
                            <div className="mt-2 flex items-center text-xs text-emerald-400">
                                <TrendingUp className="w-3.5 h-3.5 mr-1" />
                                Estimado
                            </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm shadow-sm p-5 border-l-4 border-l-pink-400">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                Campañas activas
                            </p>
                            <p className="text-2xl font-bold text-white mt-1">{activeCampaigns}</p>
                            <div className="mt-2 flex items-center text-xs text-gray-400">
                                <Target className="w-3.5 h-3.5 mr-1" />
                                {totalCampaigns} en total
                            </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm shadow-sm p-5 border-l-4 border-l-violet-400">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                {isInfluencerRole ? 'Completadas' : 'Activos / verif.'}
                            </p>
                            <p className="text-2xl font-bold text-white mt-1">
                                {isInfluencerRole
                                    ? influencers[0]?.completedCampaigns ?? 0
                                    : activeInfluencers}
                            </p>
                            <div className="mt-2 flex items-center text-xs text-gray-400">
                                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                Rendimiento
                            </div>
                        </div>
                    </div>

                    <div className="max-w-3xl space-y-4">
                        {tabCampaigns.length === 0 ? (
                            <p className="text-gray-400 text-sm py-12 text-center rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm">
                                No hay eventos en esta vista. Prueba otra pestaña o sincroniza campañas desde tu
                                perfil.
                            </p>
                        ) : (
                            tabCampaigns.map((campaign) => (
                                <div key={campaign.id} className="flex gap-4 items-stretch">
                                    <div className="w-28 shrink-0 text-sm text-gray-400 pt-3 font-medium leading-snug">
                                        {fmtCampaignDate(campaign.startDate)}
                                    </div>
                                    <div className="flex-1 rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm shadow-sm border-l-[3px] border-l-amber-500/70 px-5 py-4">
                                        <p className="font-semibold text-white text-base">{campaign.title}</p>
                                        <p className="text-sm text-gray-400 mt-0.5">
                                            {campaign.startDate && campaign.endDate !== campaign.startDate
                                                ? `${campaign.startDate} — ${campaign.endDate}`
                                                : campaign.brand}
                                        </p>
                                        <p className="text-sm text-gray-300 mt-3 line-clamp-2">
                                            {campaign.brand} · ${campaign.earnings.toLocaleString()} · Progreso{' '}
                                            {campaign.progress}%
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {section === 'channels-threads' && isInfluencerRole && (
                <InfluencerThreadsView
                    threads={threadItems}
                    loading={inboxLoading}
                    onlineMembers={threadsOnlineMembers}
                    channelTitle="mensajes-personales"
                    channelSubtitle="Hilos desde tu perfil público (sesión iniciada)"
                    notificationCount={inboxUnreadCount}
                />
            )}

            {section === 'channels-threads' && !isInfluencerRole && (
                <p className="text-gray-400">
                    Los hilos y mensajes personales del creador están disponibles con cuenta influencer.
                </p>
            )}

            {section === 'cursos' && (
                <div className="max-w-2xl rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm shadow-sm p-10 text-center">
                    <GraduationCap className="h-14 w-14 text-amber-400 mx-auto mb-4" strokeWidth={1.25} />
                    <h2 className="text-lg font-semibold text-white">Cursos online</h2>
                    <p className="text-sm text-gray-400 mt-3 leading-relaxed">
                        Próximamente: módulos en video, materiales descargables y certificados para la comunidad de
                        creadores.
                    </p>
                </div>
            )}

            {section === 'pagos' && (
                <div className="space-y-6 max-w-4xl">
                    {isInfluencerRole && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm shadow-sm p-5 border-l-4 border-l-emerald-500">
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                        Total estimado
                                    </p>
                                    <p className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
                                        <Wallet className="h-6 w-6 text-emerald-400" />
                                        ${(influencers[0]?.totalEarnings ?? 0).toLocaleString()}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm shadow-sm p-5 border-l-4 border-l-amber-400">
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                        Este mes
                                    </p>
                                    <p className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
                                        <CreditCard className="h-6 w-6 text-amber-400" />
                                        ${(influencers[0]?.monthlyEarnings ?? 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-400">
                                Actualiza tus datos fiscales y método de cobro cuando activemos la configuración
                                completa en esta sección.
                            </p>
                            {earnings.length === 0 ? (
                                <p className="text-gray-400 py-10 text-center rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm text-sm">
                                    Aún no hay movimientos de pago registrados.
                                </p>
                            ) : (
                                <div className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm shadow-sm divide-y divide-white/10">
                                    {earnings.map((earning) => (
                                        <div
                                            key={earning.id}
                                            className="flex items-center justify-between gap-4 px-5 py-4 text-sm"
                                        >
                                            <div className="min-w-0">
                                                <p className="font-medium text-white truncate">
                                                    {earning.campaign}
                                                </p>
                                                <p className="text-gray-400">{earning.date}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="font-semibold text-emerald-400">
                                                    ${earning.amount.toLocaleString()}
                                                </p>
                                                <p className="text-xs text-gray-400 capitalize">{earning.status}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                    {!isInfluencerRole && (
                        <p className="text-gray-300 text-sm leading-relaxed">
                            El detalle de pagos a influencers se coordina con marcas y operaciones. Usa el panel
                            admin para reportes globales.
                        </p>
                    )}
                </div>
            )}

            {section === 'directorio' && !isInfluencerRole && (
                <div className="space-y-6 max-w-6xl">
                    <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Buscar influencers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/15 bg-gray-900/60 text-gray-100 text-sm placeholder:text-gray-500 focus:ring-2 focus:ring-amber-500/25 focus:border-amber-400/50"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="rounded-xl border border-white/15 bg-gray-900/60 text-gray-100 px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/25"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="verified">Verificados</option>
                            <option value="active">Activos</option>
                            <option value="pending">Pendientes</option>
                            <option value="suspended">Suspendidos</option>
                        </select>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-950/60 text-gray-400 text-xs uppercase tracking-wide">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Influencer</th>
                                        <th className="px-4 py-3 text-left">Seguidores</th>
                                        <th className="px-4 py-3 text-left">Engagement</th>
                                        <th className="px-4 py-3 text-left">Ganancias</th>
                                        <th className="px-4 py-3 text-left">Estado</th>
                                        <th className="px-4 py-3 text-left">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {filteredInfluencers.map((influencer) => (
                                        <tr key={influencer.id} className="hover:bg-white/5">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        className="w-10 h-10 rounded-full object-cover bg-white/10"
                                                        src={influencer.avatar || '/placeholder-avatar.png'}
                                                        alt=""
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src =
                                                                'data:image/svg+xml,' +
                                                                encodeURIComponent(
                                                                    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect fill="#e4e4e7" width="40" height="40"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#71717a" font-size="14">?</text></svg>`
                                                                );
                                                        }}
                                                    />
                                                    <div>
                                                        <div className="font-medium text-white">
                                                            {influencer.name}
                                                        </div>
                                                        <div className="text-gray-400 text-xs">
                                                            {influencer.username}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-200">
                                                {influencer.followers.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1 text-gray-200">
                                                    {influencer.engagement}%
                                                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-200">
                                                ${influencer.totalEarnings.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(influencer.status)}`}
                                                >
                                                    {getStatusIcon(influencer.status)}
                                                    {influencer.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2 text-gray-400">
                                                    <button type="button" aria-label="Ver">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button type="button" aria-label="Editar">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {section === 'directorio' && isInfluencerRole && (
                <p className="text-gray-400">El directorio completo está disponible para el equipo moderador.</p>
            )}

            {section === 'recursos' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
                    <Link
                        to="/marketplace"
                        className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm p-6 shadow-sm hover:border-violet-500/40 hover:shadow-md transition-all group"
                    >
                        <Target className="w-8 h-8 text-violet-400 mb-3" />
                        <p className="font-semibold text-white">Marketplace</p>
                        <p className="text-sm text-gray-400 mt-1">Ofertas y promociones</p>
                    </Link>
                    <Link
                        to="/subastas"
                        className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm p-6 shadow-sm hover:border-violet-500/40 hover:shadow-md transition-all"
                    >
                        <Zap className="w-8 h-8 text-orange-500 mb-3" />
                        <p className="font-semibold text-white">Subastas</p>
                        <p className="text-sm text-gray-400 mt-1">En vivo y pujas</p>
                    </Link>
                    <Link
                        to="/influencers"
                        className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm p-6 shadow-sm hover:border-violet-500/40 hover:shadow-md transition-all"
                    >
                        <Users className="w-8 h-8 text-pink-500 mb-3" />
                        <p className="font-semibold text-white">Comunidad</p>
                        <p className="text-sm text-gray-400 mt-1">Perfiles públicos</p>
                    </Link>
                    {!isInfluencerRole && (
                        <>
                            <Link
                                to="/admin/ocr-profile"
                                className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm p-6 shadow-sm hover:border-violet-500/40 hover:shadow-md transition-all"
                            >
                                <Camera className="w-8 h-8 text-rose-500 mb-3" />
                                <p className="font-semibold text-white">OCR perfiles</p>
                                <p className="text-sm text-gray-400 mt-1">Digitalizar datos</p>
                            </Link>
                            <button
                                type="button"
                                className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm p-6 shadow-sm text-left opacity-80 cursor-not-allowed"
                            >
                                <Plus className="w-8 h-8 text-gray-500 mb-3" />
                                <p className="font-semibold text-gray-200">Nuevo influencer</p>
                                <p className="text-sm text-gray-400 mt-1">Próximamente</p>
                            </button>
                            <Link
                                to="/dashboard"
                                className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm p-6 shadow-sm hover:border-violet-500/40 hover:shadow-md transition-all"
                            >
                                <BarChart3 className="w-8 h-8 text-violet-500 mb-3" />
                                <p className="font-semibold text-white">Mi panel rol</p>
                                <p className="text-sm text-gray-400 mt-1">Vista según cuenta</p>
                            </Link>
                        </>
                    )}
                    {isInfluencerRole && influencers[0]?.username && (
                        <Link
                            to={`/influencer/${encodeURIComponent(influencers[0].username.replace(/^@/, ''))}`}
                            className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm p-6 shadow-sm hover:border-violet-500/40 hover:shadow-md transition-all"
                        >
                            <Eye className="w-8 h-8 text-cyan-400 mb-3" />
                            <p className="font-semibold text-white">Ver mi perfil público</p>
                            <p className="text-sm text-gray-400 mt-1">Cómo te ven las marcas</p>
                        </Link>
                    )}
                </div>
            )}
        </InfluencerHubLayout>
    );
}
