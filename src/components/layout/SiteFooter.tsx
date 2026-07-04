import { Link } from 'react-router-dom';
import { Download, LogIn, UserPlus } from 'lucide-react';
import { SITE_CONFIG } from '../../config/site';
import { apkDownloadAnchorProps } from '../../utils/appDownload';

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-gray-950/90 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-2xl mx-auto text-center mb-8">
          <h2 className="text-lg font-semibold text-white mb-2">Cuenta y acceso</h2>
          <p className="text-sm text-gray-400 mb-5">
            El registro está aquí abajo. Arriba puedes descargar la app o iniciar sesión si ya tienes cuenta.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3">
            <Link
              to="/signin"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/15 bg-gray-900/60 text-gray-100 hover:bg-gray-800/80 hover:text-white transition-colors text-sm font-medium"
            >
              <LogIn className="h-4 w-4" />
              Iniciar sesión
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-colors text-sm font-medium shadow-lg shadow-violet-900/30"
            >
              <UserPlus className="h-4 w-4" />
              Crear cuenta
            </Link>
            <Link
              to="/empezar"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-violet-500/35 text-violet-300 hover:bg-violet-950/40 transition-colors text-sm font-medium"
            >
              Soy marca o influencer
            </Link>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <img src="/logo.png" alt="" className="w-7 h-7 object-contain opacity-90" aria-hidden />
            <span>{SITE_CONFIG.copyright}</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              {...apkDownloadAnchorProps()}
              className="inline-flex items-center gap-1.5 text-green-400 hover:text-green-300 font-medium transition-colors"
            >
              <Download className="h-4 w-4" />
              Descargar app
            </a>
            <Link to="/privacy" className="text-gray-400 hover:text-gray-200 transition-colors">
              Privacidad
            </Link>
            <Link to="/cookies" className="text-gray-400 hover:text-gray-200 transition-colors">
              Cookies
            </Link>
            <Link to="/about" className="text-gray-400 hover:text-gray-200 transition-colors">
              Nosotros
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
