import React from 'react';
import { Download, Smartphone, QrCode, Star, Users, Shield } from 'lucide-react';

const DownloadApp: React.FC = () => {
  const handleDownload = (platform: 'ios' | 'android') => {
    // Placeholder for actual download logic
    if (platform === 'ios') {
      window.open('https://apps.apple.com/app/link4deal', '_blank');
    } else {
      window.open('https://play.google.com/store/apps/details?id=com.link4deal.app', '_blank');
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full translate-x-48 -translate-y-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600 rounded-full -translate-x-32 translate-y-32"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            📱 Descarga Nuestra App
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Accede a ofertas exclusivas, cupones digitales y promociones especiales 
            directamente desde tu smartphone. ¡La experiencia completa de Link4Deal!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - App mockup and QR code */}
          <div className="text-center lg:text-left">
            <div className="relative inline-block mb-8">
              {/* Phone mockup */}
              <div className="relative w-80 h-96 mx-auto lg:mx-0">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-[3rem] shadow-2xl transform rotate-6"></div>
                <div className="absolute inset-2 bg-gray-900 rounded-[2.5rem] shadow-inner">
                  {/* Screen content */}
                  <div className="absolute inset-4 bg-gradient-to-br from-blue-400 to-purple-500 rounded-[2rem] flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl font-bold">L</span>
                      </div>
                      <p className="text-sm font-medium">Link4Deal</p>
                      <p className="text-xs opacity-80">Ofertas Exclusivas</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                <Star className="w-4 h-4 text-yellow-800" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center animate-pulse">
                <Shield className="w-3 h-3 text-green-800" />
              </div>
            </div>

            {/* QR Code section */}
            <div className="bg-white rounded-2xl p-6 shadow-lg inline-block">
              <div className="text-center">
                <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-20 h-20 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 font-medium">Escanea para descargar</p>
              </div>
            </div>
          </div>

          {/* Right side - Features and download buttons */}
          <div className="space-y-8">
            {/* App features */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                ¿Por qué descargar nuestra app?
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Acceso Móvil Completo
                    </h4>
                    <p className="text-gray-600">
                      Navega por todas las ofertas, gestiona tu carrito y reclama cupones 
                      desde cualquier lugar.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Wallet Seguro
                    </h4>
                    <p className="text-gray-600">
                      Almacena tus cupones digitales de forma segura con tecnología blockchain.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Comunidad Activa
                    </h4>
                    <p className="text-gray-600">
                      Conecta con otros usuarios, comparte ofertas y gana recompensas.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Download buttons */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900">
                Descarga ahora:
              </h4>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => handleDownload('ios')}
                  className="flex-1 bg-black text-white px-6 py-4 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-3"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  App Store
                </button>
                
                <button
                  onClick={() => handleDownload('android')}
                  className="flex-1 bg-green-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-3"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4486.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4486.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.5036c-1.4497-.6582-3.1078-1.0536-4.8709-1.0536-1.7631 0-3.4212.3954-4.8709 1.0536L9.036 5.8541a.416.416 0 00-.5676-.1521.416.416 0 00-.1521.5676L10.313 9.3214C7.4007 10.1866 5.2 12.5686 5.2 15.4184v.1619c0 .5511.4482.9993.9993.9993h15.6014c.5511 0 .9993-.4482.9993-.9993v-.1619c0-2.8498-2.2007-5.2318-5.113-6.097"/>
                  </svg>
                  Google Play
                </button>
              </div>
            </div>

            {/* Additional info */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Download className="w-4 h-4 text-white" />
                </div>
                <h5 className="font-semibold text-blue-900">Descarga Gratuita</h5>
              </div>
              <p className="text-blue-700 text-sm">
                La app es completamente gratuita. Sin costos ocultos, sin suscripciones. 
                ¡Solo descarga y comienza a ahorrar!
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DownloadApp;
