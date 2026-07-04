import { Download } from 'lucide-react';
import { apkDownloadAnchorProps } from '../../utils/appDownload';
import { trackDownload } from '../../services/appDownloads';

/** Botón flotante de descarga APK — visible en todo el sitio (incl. cuponeras). */
export function FloatingDownloadAppButton() {
  const anchor = apkDownloadAnchorProps();

  return (
    <div
      className="fixed bottom-5 left-4 sm:bottom-6 sm:left-6 z-[85] pb-[env(safe-area-inset-bottom,0px)] pl-[env(safe-area-inset-left,0px)]"
    >
      <a
        {...anchor}
        onClick={() => {
          void trackDownload();
        }}
        className="group bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 sm:px-4 sm:py-4 rounded-full shadow-2xl shadow-green-950/40 hover:from-green-600 hover:to-green-700 transition-all duration-300 hover:scale-105 flex items-center gap-2 border border-green-400/30"
        title="Descargar app Android"
        aria-label="Descargar app Android"
      >
        <Download className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
        <span className="font-medium text-sm sm:text-base pr-0.5">App</span>
      </a>
      <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs sm:text-sm rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap border border-white/10 shadow-lg">
        Descarga la app DameCodigo
      </div>
    </div>
  );
}
