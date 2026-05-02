import React, { useMemo, useState } from 'react';
import InfluencerHubLayout, { type InfluencerHubNavEntry } from '../../components/dashboard/InfluencerHubLayout';
import InfluencerThreadsView, { type ThreadItem } from '../../components/dashboard/InfluencerThreadsView';
import {
    Calendar,
    Library,
    TrendingUp,
    Target,
    CheckCircle,
    Radio,
    MessageCircle,
    BookOpen,
    CreditCard,
    MessageSquare,
    GraduationCap,
    Wallet
} from 'lucide-react';

const MOCK_EVENTS = [
    {
        id: '1',
        dateKey: '2026-03-17',
        title: 'Lanzamiento campaña primavera',
        timeLabel: '11:00 – 11:30',
        subtitle: 'Café digital con la marca · seguimiento de métricas'
    },
    {
        id: '2',
        dateKey: '2026-03-20',
        title: 'Office hour: monetización',
        timeLabel: '16:00 – 17:00',
        subtitle: 'Preguntas en vivo con el equipo Link4Deal'
    },
    {
        id: '3',
        dateKey: '2026-03-24',
        title: 'Deadline entregables marzo',
        timeLabel: 'Todo el día',
        subtitle: 'Stories + enlace en bio acordado en el brief'
    }
];

function fmtDemoDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('es', { weekday: 'short', month: 'short', day: 'numeric' });
}

const DEMO_THREADS: ThreadItem[] = [
    {
        id: 'demo-1',
        authorName: 'Marca Demo MX',
        authorEmail: 'hola@marca.demo',
        body:
            '¿Podemos adelantar la entrega del reel al jueves? Te dejamos el brief v2 en el drive compartido.',
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        isUnread: false,
        seenByCount: 10,
        replies: [
            {
                id: 'dr1',
                authorName: 'Tú (demo)',
                body: 'Sí, lo tengo. ¿Les parece entrega miércoles antes de las 18 h?',
                createdAt: new Date(Date.now() - 1.4 * 86400000).toISOString()
            },
            {
                id: 'dr2',
                authorName: 'Marca Demo MX',
                body: 'Perfecto, cerramos así. ¡Gracias!',
                createdAt: new Date(Date.now() - 1.2 * 86400000).toISOString(),
                highlight: true
            }
        ],
        typingName: null
    },
    {
        id: 'demo-2',
        authorName: 'Link4Deal',
        authorEmail: null,
        body: 'Tienes un pago programado el 28. Revisa tus datos fiscales en la sección Pagos.',
        createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
        isUnread: true,
        seenByCount: 3,
        replies: [],
        typingName: 'Equipo Link4Deal'
    }
];

const DEMO_THREAD_ONLINE = [
    { id: 'u1', name: 'Mayhul Arora' },
    { id: 'u2', name: 'Ben Weiss' },
    { id: 'u3', name: 'Equipo Link4Deal' }
];

type DemoSection = 'channels-threads' | 'eventos' | 'cursos' | 'recursos' | 'pagos';

/**
 * Vista estática de ejemplo del hub influencer (sin API).
 * Abre: /demo/influencer-dashboard
 */
export default function InfluencerHubDemoPage() {
    const [section, setSection] = useState<DemoSection>('eventos');
    const [campaignTab, setCampaignTab] = useState<'proximas' | 'activas' | 'pasadas'>('proximas');

    const navTree = useMemo((): InfluencerHubNavEntry[] => {
        return [
            {
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
            },
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
        ];
    }, []);

    const mainTitle =
        section === 'channels-threads'
            ? 'Hilos · mensajes personales'
            : section === 'eventos'
              ? 'Eventos'
              : section === 'cursos'
                ? 'Cursos online'
                : section === 'pagos'
                  ? 'Pagos'
                  : 'Recursos';

    const campaignTabs = [
        { id: 'proximas', label: 'Próximas' },
        { id: 'activas', label: 'Activas' },
        { id: 'pasadas', label: 'Pasadas' }
    ];

    const tabEvents =
        campaignTab === 'pasadas'
            ? [MOCK_EVENTS[2]]
            : campaignTab === 'activas'
              ? [MOCK_EVENTS[1]]
              : MOCK_EVENTS;

    return (
        <InfluencerHubLayout
            brandTitle="Tu marca creator"
            brandSubtitle="Canales, eventos, cursos y pagos"
            avatarUrl={null}
            navTree={navTree}
            activeNavId={section}
            onNavChange={(id) => setSection(id as DemoSection)}
            mainTitle={mainTitle}
            tabs={section === 'eventos' ? campaignTabs : undefined}
            activeTabId={section === 'eventos' ? campaignTab : undefined}
            onTabChange={
                section === 'eventos'
                    ? (id) => setCampaignTab(id as 'proximas' | 'activas' | 'pasadas')
                    : undefined
            }
            topRight={
                <span className="rounded-full bg-amber-500/20 text-amber-200 text-xs font-semibold px-3 py-1 ring-1 ring-amber-500/25">
                    Demo · datos de ejemplo
                </span>
            }
        >
            {section === 'eventos' && (
                <div className="space-y-8 max-w-4xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm shadow-sm p-5 border-l-4 border-l-amber-500/70">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                Ingresos estimados
                            </p>
                            <p className="text-2xl font-bold text-white mt-1">$12,400</p>
                            <div className="mt-2 flex items-center text-xs text-emerald-400">
                                <TrendingUp className="w-3.5 h-3.5 mr-1" />
                                +18% vs. mes anterior
                            </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm shadow-sm p-5 border-l-4 border-l-orange-400">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                Eventos activos
                            </p>
                            <p className="text-2xl font-bold text-white mt-1">3</p>
                            <div className="mt-2 flex items-center text-xs text-gray-400">
                                <Target className="w-3.5 h-3.5 mr-1" />
                                2 con entrega esta semana
                            </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm shadow-sm p-5 border-l-4 border-l-pink-400">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                Alcance 30 días
                            </p>
                            <p className="text-2xl font-bold text-white mt-1">842 K</p>
                            <div className="mt-2 flex items-center text-xs text-emerald-400">
                                <Radio className="w-3.5 h-3.5 mr-1" />
                                Estimado demo
                            </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm shadow-sm p-5 border-l-4 border-l-violet-400">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                Tareas completadas
                            </p>
                            <p className="text-2xl font-bold text-white mt-1">94%</p>
                            <div className="mt-2 flex items-center text-xs text-gray-400">
                                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                Briefs al día
                            </div>
                        </div>
                    </div>

                    <div className="max-w-3xl space-y-4">
                        {tabEvents.map((ev) => (
                            <div key={ev.id} className="flex gap-4 items-stretch">
                                <div className="w-28 shrink-0 text-sm text-gray-400 pt-3 font-medium">
                                    {fmtDemoDate(ev.dateKey)}
                                </div>
                                <div className="flex-1 rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm shadow-sm border-l-[3px] border-l-amber-500/70 px-5 py-4">
                                    <p className="font-semibold text-white">{ev.title}</p>
                                    <p className="text-sm text-gray-400 mt-0.5">{ev.timeLabel}</p>
                                    <p className="text-sm text-gray-300 mt-3">{ev.subtitle}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {section === 'channels-threads' && (
                <InfluencerThreadsView
                    threads={DEMO_THREADS}
                    loading={false}
                    onlineMembers={DEMO_THREAD_ONLINE}
                    channelTitle="no-preguntas-tontas"
                    channelSubtitle="Demo · estilo comunidad tipo Slack"
                    notificationCount={14}
                />
            )}

            {section === 'cursos' && (
                <div className="max-w-2xl rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm shadow-sm p-10 text-center">
                    <GraduationCap className="h-14 w-14 text-amber-400 mx-auto mb-4" strokeWidth={1.25} />
                    <h2 className="text-lg font-semibold text-white">Cursos online</h2>
                    <p className="text-sm text-gray-400 mt-3 leading-relaxed">
                        Próximamente: módulos en video y certificados para creadores (demo).
                    </p>
                </div>
            )}

            {section === 'pagos' && (
                <div className="space-y-6 max-w-3xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm p-5 border-l-4 border-l-emerald-500 shadow-sm">
                            <p className="text-xs font-medium text-gray-400 uppercase">Balance demo</p>
                            <p className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
                                <Wallet className="h-6 w-6 text-emerald-400" />
                                $8,200
                            </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm p-5 border-l-4 border-l-amber-400 shadow-sm">
                            <p className="text-xs font-medium text-gray-400 uppercase">Pendiente</p>
                            <p className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
                                <CreditCard className="h-6 w-6 text-amber-400" />
                                $1,150
                            </p>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm divide-y divide-white/10 text-sm">
                        <div className="flex justify-between px-5 py-4">
                            <span className="text-gray-300">Pago campaña marzo</span>
                            <span className="font-semibold text-emerald-400">+$4,200</span>
                        </div>
                        <div className="flex justify-between px-5 py-4">
                            <span className="text-gray-300">Bonus engagement</span>
                            <span className="font-semibold text-emerald-400">+$800</span>
                        </div>
                    </div>
                </div>
            )}

            {section === 'recursos' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm p-6 shadow-sm">
                        <BookOpen className="w-8 h-8 text-violet-400 mb-3" />
                        <p className="font-semibold text-white">Guía de briefs</p>
                        <p className="text-sm text-gray-400 mt-1">Plantilla y buenas prácticas (demo).</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm p-6 shadow-sm">
                        <CreditCard className="w-8 h-8 text-orange-500 mb-3" />
                        <p className="font-semibold text-white">Plantillas de facturación</p>
                        <p className="text-sm text-gray-400 mt-1">Descargables (demo).</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm p-6 shadow-sm">
                        <MessageCircle className="w-8 h-8 text-pink-500 mb-3" />
                        <p className="font-semibold text-white">Normas de comunidad</p>
                        <p className="text-sm text-gray-400 mt-1">Lineamientos para canales (demo).</p>
                    </div>
                </div>
            )}
        </InfluencerHubLayout>
    );
}
