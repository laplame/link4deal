import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ScrollText, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { safeInternalRedirectPath } from '../config/adminAccess';
import TermsContentBody from '../components/legal/TermsContentBody';
import { LAST_UPDATED } from '../data/termsContent';
import { acceptTerms } from '../utils/termsAcceptance';

export default function TermsPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const nextPath = safeInternalRedirectPath(searchParams.get('next'));
    const requireAccept =
        searchParams.get('accept') === '1' || searchParams.get('app') === '1' || Boolean(nextPath);

    const [checked, setChecked] = useState(false);
    const [accepted, setAccepted] = useState(false);

    useEffect(() => {
        document.title = 'Términos y Condiciones · DameCódigo';
    }, []);

    const handleAccept = () => {
        if (!checked) return;
        acceptTerms();
        setAccepted(true);
        if (nextPath) {
            window.setTimeout(() => navigate(nextPath), 500);
        }
    };

    return (
        <div
            className={`min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-gray-100 ${
                requireAccept ? 'pb-40' : ''
            }`}
        >
            <div className="border-b border-white/10 bg-gray-900/50 backdrop-blur-sm">
                <div className="max-w-3xl mx-auto px-4 py-4">
                    <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-fuchsia-200 transition-colors text-sm">
                        <ArrowLeft className="h-5 w-5" />
                        Volver al inicio
                    </Link>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-fuchsia-500/15 ring-1 ring-fuchsia-500/30 mb-4">
                        <ScrollText className="h-6 w-6 text-fuchsia-300" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Términos y Condiciones Generales</h1>
                    <p className="text-sm text-fuchsia-200 mt-2 font-medium">DameCodigo • Link4Deal • BizneAI</p>
                    <p className="text-xs text-gray-500 mt-1">Última actualización: {LAST_UPDATED}</p>
                </div>

                <TermsContentBody showHeader={false} />

                {!requireAccept && (
                    <div className="mt-8 rounded-2xl border border-fuchsia-500/30 bg-fuchsia-950/20 p-5 flex items-center gap-3">
                        <ShieldCheck className="h-6 w-6 text-fuchsia-300 shrink-0" />
                        <p className="text-sm text-gray-300">
                            ¿Listo para empezar?{' '}
                            <Link to="/influencer/auth" className="text-fuchsia-300 hover:text-fuchsia-200 font-medium">
                                Crea tu cuenta de influencer
                            </Link>{' '}
                            o revisa las{' '}
                            <Link to="/faq" className="text-fuchsia-300 hover:text-fuchsia-200 font-medium">
                                preguntas frecuentes
                            </Link>
                            .
                        </p>
                    </div>
                )}
            </div>

            {requireAccept && (
                <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-gray-950/95 backdrop-blur-sm">
                    <div className="max-w-3xl mx-auto px-4 py-4">
                        {accepted ? (
                            <div className="flex items-center justify-center gap-2 text-emerald-300 font-medium py-2">
                                <CheckCircle2 className="h-5 w-5" />
                                Has aceptado los Términos y Condiciones.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <label className="flex items-start gap-3 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(e) => setChecked(e.target.checked)}
                                        className="mt-0.5 h-5 w-5 rounded border-white/20 bg-gray-900 text-fuchsia-600 focus:ring-fuchsia-500"
                                    />
                                    <span className="text-sm text-gray-200">
                                        He leído y acepto los <strong>Términos y Condiciones</strong> de DameCodigo,
                                        Link4Deal y BizneAI.
                                    </span>
                                </label>
                                <button
                                    type="button"
                                    onClick={handleAccept}
                                    disabled={!checked}
                                    className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                                        checked
                                            ? 'bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white hover:from-fuchsia-500 hover:to-purple-600 shadow-lg shadow-fuchsia-900/30'
                                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    <ShieldCheck className="h-5 w-5" />
                                    Aceptar y continuar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
