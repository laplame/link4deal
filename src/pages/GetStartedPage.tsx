import { Link, useNavigate } from 'react-router-dom';
import { Building2, Sparkles, ArrowRight } from 'lucide-react';
import { SITE_CONFIG } from '../config/site';
import { SITE_SHELL_CARD } from '../config/siteShell';

const OPTIONS = [
  {
    id: 'brand',
    title: 'Soy marca o negocio',
    description: 'Publica cupones y promociones en minutos. Ideal si quieres activar creadores en tu zona.',
    icon: Building2,
    accent: 'from-blue-600 to-cyan-600',
    border: 'border-cyan-500/30 hover:border-cyan-400/50',
    cta: 'Crear promoción',
    to: '/quick-promotion',
  },
  {
    id: 'influencer',
    title: 'Soy influencer',
    description: 'Date de alta como creador, comparte deals con tu audiencia y gana por ventas verificadas.',
    icon: Sparkles,
    accent: 'from-fuchsia-600 to-violet-600',
    border: 'border-fuchsia-500/30 hover:border-fuchsia-400/50',
    cta: 'Darme de alta',
    to: '/influencer/setup',
  },
] as const;

export default function GetStartedPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:py-14">
      <div className="text-center mb-10">
        <p className="text-sm font-medium text-violet-400 mb-2">Empezar en {SITE_CONFIG.name}</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">¿Cómo quieres participar?</h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          Elige una opción. Si eres negocio irás a crear tu promoción; si eres creador, al registro de influencer.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => navigate(opt.to)}
              className={`${SITE_SHELL_CARD} ${opt.border} text-left p-6 sm:p-8 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-black/30 group`}
            >
              <div
                className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${opt.accent} text-white mb-4 shadow-lg`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">{opt.title}</h2>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">{opt.description}</p>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-violet-300 group-hover:text-violet-200">
                {opt.cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-center text-sm text-gray-500 mt-10">
        ¿Ya tienes cuenta?{' '}
        <Link to="/signin" className="text-violet-400 hover:text-violet-300 font-medium">
          Inicia sesión
        </Link>
        {' · '}
        <Link to="/" className="text-gray-400 hover:text-gray-300">
          Volver al inicio
        </Link>
      </p>
    </div>
  );
}
