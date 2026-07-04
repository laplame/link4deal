import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Star, Users, Shield } from 'lucide-react';
import QRCode from 'qrcode';
import { SITE_CONFIG } from '../config/site';
import { getApkDownloadUrl, openApkDownload } from '../utils/appDownload';
import {
  SITE_SHELL_CARD,
  SITE_SHELL_SECTION,
  SITE_SHELL_TEXT_HIGHLIGHT,
  SITE_SHELL_TEXT_HIGHLIGHT_PANEL,
} from '../config/siteShell';

const DownloadApp: React.FC = () => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    const url = getApkDownloadUrl();
    QRCode.toDataURL(url, { width: 256, margin: 1 }).then(setQrDataUrl).catch(() => {});
  }, []);

  const handleDownloadAndroid = () => {
    openApkDownload();
  };

  return (
    <section className={SITE_SHELL_SECTION}>
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className={`max-w-3xl mx-auto ${SITE_SHELL_TEXT_HIGHLIGHT_PANEL} px-6 py-6 sm:px-8`}>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className={SITE_SHELL_TEXT_HIGHLIGHT}>📱 Descarga Nuestra App</span>
            </h2>
            <p className="text-xl leading-relaxed">
              <span className={SITE_SHELL_TEXT_HIGHLIGHT}>
                Accede a ofertas exclusivas, cupones digitales y promociones especiales directamente desde tu
                smartphone. ¡La experiencia completa de {SITE_CONFIG.name}!
              </span>
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="relative inline-block mb-8">
              <div className="relative w-80 h-96 mx-auto lg:mx-0">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-purple-800 rounded-[3rem] shadow-2xl transform rotate-6" />
                <div className="absolute inset-2 bg-gray-950 rounded-[2.5rem] shadow-inner border border-white/10">
                  <div className="absolute inset-4 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-[2rem] flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl font-bold">L</span>
                      </div>
                      <p className="text-sm font-medium">{SITE_CONFIG.name}</p>
                      <p className="text-xs opacity-80">Ofertas Exclusivas</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center animate-bounce">
                <Star className="w-4 h-4 text-amber-950" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center animate-pulse">
                <Shield className="w-3 h-3 text-white" />
              </div>
            </div>

            <div className={`${SITE_SHELL_CARD} p-6 inline-block`}>
              <div className="text-center">
                {qrDataUrl ? (
                  <a
                    href={getApkDownloadUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <img src={qrDataUrl} alt="QR para descargar la app" className="w-32 h-32 rounded-lg mx-auto mb-4 bg-white p-1" />
                  </a>
                ) : (
                  <div className="w-32 h-32 bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse" />
                )}
                <p className="text-sm text-gray-300 font-medium">Escanea para descargar</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white mb-6">¿Por qué descargar nuestra app?</h3>

              <div className="space-y-4">
                {[
                  {
                    icon: Smartphone,
                    gradient: 'from-violet-500 to-violet-600',
                    title: 'Acceso Móvil Completo',
                    text: 'Navega por todas las ofertas, gestiona tu carrito y reclama cupones desde cualquier lugar.',
                  },
                  {
                    icon: Shield,
                    gradient: 'from-purple-500 to-purple-600',
                    title: 'Wallet Seguro',
                    text: 'Almacena tus cupones digitales de forma segura con tecnología blockchain.',
                  },
                  {
                    icon: Users,
                    gradient: 'from-emerald-500 to-emerald-600',
                    title: 'Comunidad Activa',
                    text: 'Conecta con otros usuarios, comparte ofertas y gana recompensas.',
                  },
                ].map(({ icon: Icon, gradient, title, text }) => (
                  <div key={title} className={`flex items-start gap-4 ${SITE_SHELL_CARD} p-4`}>
                    <div className={`w-12 h-12 bg-gradient-to-r ${gradient} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">{title}</h4>
                      <p className="text-gray-400">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Descarga ahora:</h4>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  disabled
                  className="flex-1 bg-gray-800 text-gray-500 px-6 py-4 rounded-xl font-semibold cursor-not-allowed border border-white/10 flex items-center justify-center gap-3"
                >
                  <svg className="w-6 h-6 opacity-70" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  App Store
                  <span className="text-xs font-normal opacity-90">(Próximamente)</span>
                </button>

                <button
                  onClick={handleDownloadAndroid}
                  className="flex-1 bg-green-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-green-500 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-green-900/30 flex items-center justify-center gap-3"
                >
                  <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold">L</span>
                  </div>
                  <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4486.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4486.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.5036c-1.4497-.6582-3.1078-1.0536-4.8709-1.0536-1.7631 0-3.4212.3954-4.8709 1.0536L9.036 5.8541a.416.416 0 00-.5676-.1521.416.416 0 00-.1521.5676L10.313 9.3214C7.4007 10.1866 5.2 12.5686 5.2 15.4184v.1619c0 .5511.4482.9993.9993.9993h15.6014c.5511 0 .9993-.4482.9993-.9993v-.1619c0-2.8498-2.2007-5.2318-5.113-6.097" />
                  </svg>
                  <span className="text-left">
                    <span className="block text-xs font-normal opacity-90 leading-tight">{SITE_CONFIG.name}</span>
                    <span className="block text-sm font-semibold leading-tight">Google Play</span>
                  </span>
                </button>
              </div>
            </div>

            <div className={`${SITE_SHELL_CARD} p-6 border-violet-500/20`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                  <Download className="w-4 h-4 text-white" />
                </div>
                <h5 className="font-semibold text-white">Descarga Gratuita</h5>
              </div>
              <p className="text-gray-400 text-sm">
                La app es completamente gratuita. Sin costos ocultos, sin suscripciones. ¡Solo descarga y comienza a
                ahorrar!
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DownloadApp;
