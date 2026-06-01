import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft,
    Mail,
    Lock,
    Phone,
    User as UserIcon,
    Eye,
    EyeOff,
    Sparkles,
    LogIn,
    UserPlus,
    Loader2,
    ScrollText,
} from 'lucide-react';
import TermsAcceptModal, { TermsAcceptedBadge } from '../components/legal/TermsAcceptModal';
import { safeInternalRedirectPath } from '../config/adminAccess';
import { hasAcceptedTerms } from '../utils/termsAcceptance';

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_REFRESH_KEY = 'auth_refresh_token';
const AUTH_USER_KEY = 'auth_user';

type Mode = 'login' | 'register';

interface AuthApiResponse {
    success?: boolean;
    message?: string;
    code?: string;
    token?: string;
    refreshToken?: string;
    user?: Record<string, unknown>;
    influencer?: {
        influencer?: { username?: string | null; name?: string | null } | null;
    } | null;
}

/**
 * Página de acceso para influencers (web / webview de la app).
 * El usuario elige explícitamente "Acceder" (login) o "Dar de alta" (registro).
 */
export default function InfluencerAuthPage() {
    const [searchParams] = useSearchParams();
    const nextPath = safeInternalRedirectPath(searchParams.get('next'));

    const [mode, setMode] = useState<Mode>(() =>
        searchParams.get('mode') === 'register' ? 'register' : 'login',
    );
    const [identifierType, setIdentifierType] = useState<'email' | 'phone'>('email');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [termsAccepted, setTermsAccepted] = useState(() => hasAcceptedTerms());
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [pendingSubmitAfterTerms, setPendingSubmitAfterTerms] = useState(false);

    const [form, setForm] = useState({
        login: '',
        email: '',
        phone: '',
        password: '',
        firstName: '',
        lastName: '',
        username: '',
        instagram: '',
    });

    const update = (field: keyof typeof form, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setError(null);
    };

    const persistAndRedirect = (data: AuthApiResponse) => {
        if (data.token) localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        if (data.refreshToken) localStorage.setItem(AUTH_REFRESH_KEY, data.refreshToken);
        if (data.user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));

        const username = data.influencer?.influencer?.username;
        const dest = nextPath || (username ? `/influencer/${encodeURIComponent(username)}` : '/marketplace');
        // Navegación dura para que AuthContext re-lea la sesión desde localStorage.
        window.location.assign(dest);
    };

    const submitRegistration = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const url = '/api/influencers/app/auth/register';
            const body: Record<string, unknown> = {
                password: form.password,
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                username: form.username.trim() || undefined,
                socialMedia: form.instagram.trim() ? { instagram: form.instagram.trim() } : undefined,
            };
            if (identifierType === 'email') body.email = form.email.trim();
            else body.phone = form.phone.trim();

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = (await res.json().catch(() => ({}))) as AuthApiResponse;
            if (!res.ok || data.success === false) {
                throw new Error(data.message || `Error ${res.status}`);
            }
            persistAndRedirect(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error de autenticación');
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (mode === 'register') {
            if (!termsAccepted) {
                setPendingSubmitAfterTerms(true);
                setShowTermsModal(true);
                return;
            }
            await submitRegistration();
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/influencers/app/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login: form.login.trim(), password: form.password }),
            });
            const data = (await res.json().catch(() => ({}))) as AuthApiResponse;
            if (!res.ok || data.success === false) {
                throw new Error(data.message || `Error ${res.status}`);
            }
            persistAndRedirect(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error de autenticación');
            setIsLoading(false);
        }
    };

    const inputBase =
        'w-full pl-10 pr-3 py-3 rounded-xl bg-gray-950/60 border border-white/10 text-gray-100 placeholder-gray-500 focus:border-fuchsia-400/60 focus:outline-none';

    const isRegister = mode === 'register';

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-gray-100 flex flex-col">
            <div className="border-b border-white/10 bg-gray-900/50 backdrop-blur-sm">
                <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
                    <Link to="/" className="text-gray-400 hover:text-fuchsia-200 transition-colors">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-fuchsia-400" />
                        <span className="font-semibold text-white">Influencers · DameCódigo</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center px-4 py-8">
                <div className="w-full max-w-md">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-white">
                            {isRegister ? 'Crea tu cuenta' : 'Inicia sesión'}
                        </h1>
                        <p className="text-sm text-gray-400 mt-1">
                            Acceso para creadores: campañas, códigos y cashback en tokens.
                        </p>
                    </div>

                    {/* Selector: Acceder o Dar de alta */}
                    <div className="grid grid-cols-2 gap-2 mb-6 p-1 rounded-xl bg-gray-900/60 border border-white/10">
                        <button
                            type="button"
                            onClick={() => { setMode('login'); setError(null); }}
                            className={`py-2 rounded-lg text-sm font-medium transition-all inline-flex items-center justify-center gap-1.5 ${
                                mode === 'login' ? 'bg-fuchsia-600 text-white' : 'text-gray-300 hover:bg-gray-800/60'
                            }`}
                        >
                            <LogIn className="h-4 w-4" /> Acceder
                        </button>
                        <button
                            type="button"
                            onClick={() => { setMode('register'); setError(null); }}
                            className={`py-2 rounded-lg text-sm font-medium transition-all inline-flex items-center justify-center gap-1.5 ${
                                mode === 'register' ? 'bg-fuchsia-600 text-white' : 'text-gray-300 hover:bg-gray-800/60'
                            }`}
                        >
                            <UserPlus className="h-4 w-4" /> Dar de alta
                        </button>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm p-6 shadow-lg shadow-black/20 space-y-4"
                    >
                        {error && (
                            <div className="bg-rose-950/40 border border-rose-500/35 rounded-xl p-3 text-sm text-rose-100">
                                {error}
                            </div>
                        )}

                        {isRegister && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <input
                                        type="text"
                                        value={form.firstName}
                                        onChange={(e) => update('firstName', e.target.value)}
                                        placeholder="Nombre"
                                        className={inputBase}
                                        required
                                    />
                                </div>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <input
                                        type="text"
                                        value={form.lastName}
                                        onChange={(e) => update('lastName', e.target.value)}
                                        placeholder="Apellido"
                                        className={inputBase}
                                    />
                                </div>
                            </div>
                        )}

                        {!isRegister ? (
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <input
                                    type="text"
                                    value={form.login}
                                    onChange={(e) => update('login', e.target.value)}
                                    placeholder="Email o teléfono/WhatsApp"
                                    className={inputBase}
                                    autoCapitalize="none"
                                    autoComplete="username"
                                    required
                                />
                            </div>
                        ) : (
                            <>
                                <div className="flex gap-2 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setIdentifierType('email')}
                                        className={`px-3 py-1 rounded-full border ${
                                            identifierType === 'email'
                                                ? 'bg-fuchsia-600 text-white border-fuchsia-400/40'
                                                : 'text-gray-400 border-white/10'
                                        }`}
                                    >
                                        Email
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIdentifierType('phone')}
                                        className={`px-3 py-1 rounded-full border ${
                                            identifierType === 'phone'
                                                ? 'bg-fuchsia-600 text-white border-fuchsia-400/40'
                                                : 'text-gray-400 border-white/10'
                                        }`}
                                    >
                                        Teléfono
                                    </button>
                                </div>
                                {identifierType === 'email' ? (
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => update('email', e.target.value)}
                                            placeholder="tu@correo.com"
                                            className={inputBase}
                                            autoCapitalize="none"
                                            required
                                        />
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                        <input
                                            type="tel"
                                            value={form.phone}
                                            onChange={(e) => update('phone', e.target.value)}
                                            placeholder="+52 55 1234 5678"
                                            className={inputBase}
                                            required
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={form.password}
                                onChange={(e) => update('password', e.target.value)}
                                placeholder="Contraseña"
                                className={`${inputBase} pr-10`}
                                autoComplete={isRegister ? 'new-password' : 'current-password'}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>

                        {isRegister && (
                            <>
                                {termsAccepted ? (
                                    <TermsAcceptedBadge onReview={() => setShowTermsModal(true)} />
                                ) : (
                                    <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 space-y-2">
                                        <p className="text-xs text-amber-100/90">
                                            Para crear tu cuenta debes leer y aceptar los Términos y Condiciones.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setShowTermsModal(true)}
                                            className="w-full py-2.5 rounded-lg text-sm font-medium bg-fuchsia-600/90 text-white hover:bg-fuchsia-500 inline-flex items-center justify-center gap-2"
                                        >
                                            <ScrollText className="h-4 w-4" />
                                            Leer y aceptar términos
                                        </button>
                                    </div>
                                )}
                                <p className="text-xs text-gray-500 -mt-2">
                                    Mín. 8 caracteres, con mayúscula, minúscula y número.
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
                                        <input
                                            type="text"
                                            value={form.username}
                                            onChange={(e) => update('username', e.target.value)}
                                            placeholder="usuario (opcional)"
                                            className="w-full pl-8 pr-3 py-3 rounded-xl bg-gray-950/60 border border-white/10 text-gray-100 placeholder-gray-500 focus:border-fuchsia-400/60 focus:outline-none"
                                            autoCapitalize="none"
                                        />
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">IG</span>
                                        <input
                                            type="text"
                                            value={form.instagram}
                                            onChange={(e) => update('instagram', e.target.value)}
                                            placeholder="instagram (opcional)"
                                            className="w-full pl-9 pr-3 py-3 rounded-xl bg-gray-950/60 border border-white/10 text-gray-100 placeholder-gray-500 focus:border-fuchsia-400/60 focus:outline-none"
                                            autoCapitalize="none"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || (isRegister && !termsAccepted)}
                            className={`w-full py-3 rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2 ${
                                isLoading || (isRegister && !termsAccepted)
                                    ? 'bg-fuchsia-700/60 text-white cursor-not-allowed opacity-70'
                                    : 'bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white hover:from-fuchsia-500 hover:to-purple-600 shadow-fuchsia-900/30'
                            }`}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {isRegister ? 'Creando…' : 'Entrando…'}
                                </>
                            ) : isRegister ? (
                                <>
                                    <UserPlus className="h-5 w-5" /> Crear cuenta de influencer
                                </>
                            ) : (
                                <>
                                    <LogIn className="h-5 w-5" /> Acceder
                                </>
                            )}
                        </button>

                        {!isRegister && (
                            <div className="text-center">
                                <Link to="/forgot-password" className="text-xs text-fuchsia-300 hover:text-fuchsia-200">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                        )}
                    </form>

                    <p className="text-center text-[11px] text-gray-600 mt-4">
                        {isRegister ? (
                            <>
                                También puedes consultar los{' '}
                                <Link to="/terminos" target="_blank" rel="noopener noreferrer" className="text-fuchsia-400 hover:text-fuchsia-300 underline">
                                    Términos y Condiciones
                                </Link>{' '}
                                en pantalla completa. Tu identidad se confirma después con un super admin.
                            </>
                        ) : (
                            <>
                                Al acceder aceptas los{' '}
                                <Link to="/terminos" className="text-fuchsia-400 hover:text-fuchsia-300 underline">
                                    Términos y Condiciones
                                </Link>{' '}
                                de DameCódigo.
                            </>
                        )}
                    </p>
                </div>
            </div>

            <TermsAcceptModal
                open={showTermsModal}
                onClose={() => {
                    setShowTermsModal(false);
                    setPendingSubmitAfterTerms(false);
                }}
                onAccept={() => {
                    setTermsAccepted(true);
                    setShowTermsModal(false);
                    if (pendingSubmitAfterTerms) {
                        setPendingSubmitAfterTerms(false);
                        void submitRegistration();
                    }
                }}
            />
        </div>
    );
}
