import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight,
    CheckCircle,
    Mail,
    Smartphone,
    Sparkles,
    Users,
    DollarSign,
    Shield,
    ExternalLink,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import PageSeo from '../components/seo/PageSeo';
import { SITE_CONFIG } from '../config/site';
import {
    submitInfluencerWaitlist,
    fetchInfluencerWaitlistStats,
} from '../services/influencerWaitlist';
import { pushDataLayer } from '../utils/googleTagManager';
import {
    WAITLIST_SOCIAL_PLATFORMS,
    type WaitlistSocialPlatformId,
} from '../config/waitlistSocialPlatforms';

const PLAY_TESTING_URL = SITE_CONFIG.playStoreTestingUrl;

const TESTER_STEPS = [
    {
        title: 'Deja tu correo',
        body: 'Usa el mismo Gmail que tienes en tu teléfono Android (cuenta de Google Play).',
    },
    {
        title: 'Te invitamos como tester',
        body: 'Agregamos tu correo al programa de prueba cerrada en Google Play Console.',
    },
    {
        title: 'Abre el enlace de testing',
        body: 'Entra con esa cuenta y acepta ser tester de la app DameCodigo.',
    },
    {
        title: 'Instala desde Google Play',
        body: 'Descarga la app oficial desde Play Store (versión de prueba para influencers).',
    },
];

export default function InfluencerWaitlistLandingPage() {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [primarySocialPlatform, setPrimarySocialPlatform] =
        useState<WaitlistSocialPlatformId>('instagram');
    const [primarySocialHandle, setPrimarySocialHandle] = useState('');
    const [city, setCity] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<{
        email: string;
        position: number;
        alreadyRegistered: boolean;
        message: string;
    } | null>(null);
    const [waitlistTotal, setWaitlistTotal] = useState<number | null>(null);

    useEffect(() => {
        fetchInfluencerWaitlistStats().then((n) => {
            if (n != null) setWaitlistTotal(n);
        });
    }, [success]);

    const selectedPlatform =
        WAITLIST_SOCIAL_PLATFORMS.find((p) => p.id === primarySocialPlatform) ??
        WAITLIST_SOCIAL_PLATFORMS[0];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const handleTrimmed = primarySocialHandle.trim();
        if (!handleTrimmed) {
            setError('Indica tu usuario en la red social que elijas.');
            return;
        }
        setSubmitting(true);
        try {
            const params = new URLSearchParams(window.location.search);
            const result = await submitInfluencerWaitlist({
                email,
                name: name.trim() || undefined,
                primarySocialPlatform,
                primarySocialHandle: handleTrimmed,
                city: city.trim() || undefined,
                landingPath: '/influencer/waitlist',
                utmSource: params.get('utm_source') || undefined,
                utmMedium: params.get('utm_medium') || undefined,
                utmCampaign: params.get('utm_campaign') || undefined,
                referrer: document.referrer || undefined,
            });
            if (!result.ok) {
                setError(result.message);
                return;
            }
            setSuccess({
                email: result.data.email,
                position: result.data.position,
                alreadyRegistered: !!result.alreadyRegistered,
                message: result.message,
            });
            pushDataLayer({
                event: 'influencer_waitlist_signup',
                waitlist_email_domain: result.data.email.split('@')[1] || '',
                waitlist_position: result.data.position,
                waitlist_already_registered: !!result.alreadyRegistered,
                waitlist_social_platform: primarySocialPlatform,
            });
        } finally {
            setSubmitting(false);
        }
    };

    const pageTitle = `Acceso anticipado influencers — ${SITE_CONFIG.name}`;
    const pageDescription =
        'Únete a la lista de espera, recibe invitación como tester en Google Play y descarga la app para monetizar con promociones locales.';

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <PageSeo title={pageTitle} description={pageDescription} ogType="website" />

            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-32 right-0 w-[28rem] h-[28rem] rounded-full bg-violet-600/20 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-emerald-600/10 blur-3xl" />
            </div>

            <header className="relative border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
                    <Link to="/" className="font-semibold text-white/90 hover:text-white">
                        {SITE_CONFIG.name}
                    </Link>
                    <div className="flex items-center gap-3 text-sm">
                        <Link to="/influencer" className="text-white/70 hover:text-white hidden sm:inline">
                            Directorio
                        </Link>
                        <Link
                            to="/marketplace"
                            className="text-white/70 hover:text-white hidden sm:inline"
                        >
                            Promociones
                        </Link>
                    </div>
                </div>
            </header>

            <main className="relative max-w-5xl mx-auto px-4 py-12 md:py-16">
                <div className="grid lg:grid-cols-2 gap-12 items-start">
                    <div>
                        <p className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200 mb-5">
                            <Sparkles className="h-3.5 w-3.5" />
                            Acceso anticipado · Google Play testers
                        </p>
                        <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
                            Monetiza tu audiencia antes del lanzamiento público
                        </h1>
                        <p className="text-lg text-slate-300 mb-6 leading-relaxed">
                            Estamos abriendo cupos limitados para creadores en México. Déjanos tu{' '}
                            <strong className="text-white">correo de Google Play</strong> y te
                            invitamos como <strong className="text-white">tester</strong> para bajar
                            la app desde Google Play.
                        </p>

                        {waitlistTotal != null && waitlistTotal > 0 && (
                            <p className="text-sm text-emerald-300/90 mb-6 flex items-center gap-2">
                                <Users className="h-4 w-4 shrink-0" />
                                {waitlistTotal}+ creadores ya en la lista
                            </p>
                        )}

                        <ul className="space-y-4 mb-8">
                            {[
                                {
                                    icon: DollarSign,
                                    text: 'Comisiones por promociones reales de comercios locales',
                                },
                                {
                                    icon: Smartphone,
                                    text: 'App Android en prueba cerrada (testers en Play Store)',
                                },
                                {
                                    icon: Shield,
                                    text: 'Sin alta inmediata: primero waitlist, luego invitación',
                                },
                            ].map(({ icon: Icon, text }) => (
                                <li key={text} className="flex items-start gap-3 text-slate-300">
                                    <span className="mt-0.5 rounded-lg bg-white/5 p-2">
                                        <Icon className="h-4 w-4 text-emerald-400" />
                                    </span>
                                    <span>{text}</span>
                                </li>
                            ))}
                        </ul>

                        <p className="text-sm text-slate-500">
                            ¿Ya tienes acceso?{' '}
                            <Link to="/influencer/setup" className="text-violet-300 hover:underline">
                                Completar perfil
                            </Link>{' '}
                            ·{' '}
                            <Link to="/comisionista-digital" className="text-violet-300 hover:underline">
                                Más información
                            </Link>
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 md:p-8 shadow-2xl shadow-black/30">
                        {success ? (
                            <div className="text-center">
                                <CheckCircle className="h-14 w-14 text-emerald-400 mx-auto mb-4" />
                                <h2 className="text-xl font-bold mb-2">
                                    {success.alreadyRegistered
                                        ? 'Ya estabas en la lista'
                                        : '¡Estás en la lista!'}
                                </h2>
                                <p className="text-slate-300 text-sm mb-4">{success.message}</p>
                                <p className="text-2xl font-bold text-white mb-1">
                                    #{success.position}
                                </p>
                                <p className="text-xs text-slate-400 mb-6">tu lugar en la fila</p>
                                <div className="text-left rounded-xl border border-amber-500/30 bg-amber-950/40 p-4 mb-6">
                                    <p className="text-sm text-amber-100 font-medium mb-2">
                                        Correo registrado
                                    </p>
                                    <p className="text-amber-50 font-mono text-sm break-all">
                                        {success.email}
                                    </p>
                                    <p className="text-xs text-amber-200/80 mt-2">
                                        Debe coincidir con la cuenta de Google en tu Android para
                                        aceptar la invitación de tester.
                                    </p>
                                </div>

                                <div className="text-left space-y-3 mb-6">
                                    <p className="text-sm font-semibold text-white">
                                        Cuando te invitemos
                                    </p>
                                    <ol className="list-decimal list-inside text-sm text-slate-300 space-y-2">
                                        <li>Revisa el correo (y spam) de Google Play.</li>
                                        <li>Acepta ser tester del programa cerrado.</li>
                                        <li>Abre el enlace de testing e instala la app.</li>
                                    </ol>
                                </div>

                                <a
                                    href={PLAY_TESTING_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 transition-colors"
                                >
                                    Enlace Google Play (testing)
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                                <p className="text-xs text-slate-500 mt-3">
                                    Este enlace solo funciona después de que agreguemos tu correo como
                                    tester en Play Console.
                                </p>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-xl font-bold mb-1">Lista de espera</h2>
                                <p className="text-sm text-slate-400 mb-6">
                                    Correo de tu cuenta Google (Play Store en el teléfono).
                                </p>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label
                                            htmlFor="waitlist-email"
                                            className="block text-sm font-medium text-slate-300 mb-1"
                                        >
                                            Correo Gmail / Google Play *
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                            <input
                                                id="waitlist-email"
                                                type="email"
                                                required
                                                autoComplete="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="tu@gmail.com"
                                                className="w-full rounded-xl border border-white/15 bg-slate-900/80 py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label
                                            htmlFor="waitlist-name"
                                            className="block text-sm font-medium text-slate-300 mb-1"
                                        >
                                            Nombre (opcional)
                                        </label>
                                        <input
                                            id="waitlist-name"
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full rounded-xl border border-white/15 bg-slate-900/80 py-3 px-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        />
                                    </div>

                                    <fieldset className="space-y-3">
                                        <legend className="block text-sm font-medium text-slate-300">
                                            Red social principal *
                                        </legend>
                                        <p className="text-xs text-slate-500 -mt-1">
                                            Elige la que más seguidores tengas o la que prefieras
                                            compartir.
                                        </p>
                                        <div
                                            className="flex flex-wrap gap-2"
                                            role="radiogroup"
                                            aria-label="Plataforma de red social"
                                        >
                                            {WAITLIST_SOCIAL_PLATFORMS.map((platform) => {
                                                const Icon = platform.icon;
                                                const selected = primarySocialPlatform === platform.id;
                                                return (
                                                    <label
                                                        key={platform.id}
                                                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                                                            selected
                                                                ? 'border-violet-400 bg-violet-600/30 text-white'
                                                                : 'border-white/15 bg-slate-900/50 text-slate-400 hover:border-white/25 hover:text-slate-200'
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="primarySocialPlatform"
                                                            value={platform.id}
                                                            checked={selected}
                                                            onChange={() =>
                                                                setPrimarySocialPlatform(platform.id)
                                                            }
                                                            className="sr-only"
                                                        />
                                                        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                                        {platform.label}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        <div>
                                            <label
                                                htmlFor="waitlist-social-handle"
                                                className="block text-sm font-medium text-slate-300 mb-1"
                                            >
                                                Usuario en {selectedPlatform.label}
                                            </label>
                                            <input
                                                id="waitlist-social-handle"
                                                type="text"
                                                required
                                                value={primarySocialHandle}
                                                onChange={(e) => setPrimarySocialHandle(e.target.value)}
                                                placeholder={selectedPlatform.handlePlaceholder}
                                                className="w-full rounded-xl border border-white/15 bg-slate-900/80 py-3 px-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                            />
                                            <p className="text-xs text-slate-500 mt-1">
                                                {selectedPlatform.handleHint}
                                            </p>
                                        </div>
                                    </fieldset>

                                    <div>
                                        <label
                                            htmlFor="waitlist-city"
                                            className="block text-sm font-medium text-slate-300 mb-1"
                                        >
                                            Ciudad
                                        </label>
                                        <input
                                            id="waitlist-city"
                                            type="text"
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            placeholder="CDMX"
                                            className="w-full rounded-xl border border-white/15 bg-slate-900/80 py-3 px-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        />
                                    </div>

                                    {error && (
                                        <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-950/50 px-3 py-2 text-sm text-red-200">
                                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-60 text-white font-semibold py-3.5 px-4 transition-all"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Enviando…
                                            </>
                                        ) : (
                                            <>
                                                Unirme a la lista
                                                <ArrowRight className="h-5 w-5" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>

                <section className="mt-16 md:mt-20" aria-labelledby="tester-steps-title">
                    <h2 id="tester-steps-title" className="text-2xl font-bold mb-2">
                        Cómo bajar la app como tester en Google Play
                    </h2>
                    <p className="text-slate-400 mb-8 max-w-2xl">
                        No publicamos el acceso completo aún. El flujo oficial es invitación por correo
                        al programa de prueba cerrada de Google Play.
                    </p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {TESTER_STEPS.map((step, i) => (
                            <div
                                key={step.title}
                                className="rounded-xl border border-white/10 bg-white/5 p-5"
                            >
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-600/30 text-sm font-bold text-violet-200 mb-3">
                                    {i + 1}
                                </span>
                                <h3 className="font-semibold mb-2">{step.title}</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">{step.body}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 flex flex-wrap gap-4">
                        <a
                            href={PLAY_TESTING_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-5 py-3 text-sm font-medium text-emerald-200 hover:bg-emerald-900/40"
                        >
                            <Smartphone className="h-4 w-4" />
                            Página de testing en Google Play
                            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                        </a>
                        <Link
                            to="/influencer"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm text-slate-300 hover:bg-white/5"
                        >
                            Ver directorio de influencers
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
}
