import React, { useState, useEffect } from 'react';
import { X, MapPin, Shield, Info, Cookie, Settings, Clock } from 'lucide-react';
import { SITE_CONFIG } from '../config/site';
import { useCookieConsent } from '../hooks/useCookieConsent';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  geolocation: boolean;
}

const CookieBanner: React.FC = () => {
  const [showDetails, setShowDetails] = useState(false);
  const { 
    preferences, 
    hasConsented, 
    updatePreferences, 
    acceptAll, 
    rejectAll,
    getLastVisitInfo 
  } = useCookieConsent();

  const [isVisible, setIsVisible] = useState(!hasConsented);

  useEffect(() => {
    // El hook ya maneja la lógica de cuándo mostrar el banner
    setIsVisible(!hasConsented);
  }, [hasConsented]);

  const handleAcceptAll = () => {
    acceptAll();
  };

  const handleAcceptSelected = () => {
    updatePreferences(preferences);
  };

  const handleRejectAll = () => {
    rejectAll();
  };

  const enableGeolocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Geolocalización habilitada:', position.coords);
          // Aquí puedes guardar la ubicación o enviarla a tu backend
        },
        (error) => {
          console.log('Error al obtener ubicación:', error);
        }
      );
    }
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return; // Las cookies necesarias no se pueden desactivar
    
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key]
    };
    updatePreferences(newPreferences);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {!showDetails ? (
          // Vista principal del banner
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Cookie className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Utilizamos cookies para mejorar tu experiencia
                </h3>
              </div>
              
              <p className="text-gray-600 mb-4 max-w-3xl">
                {SITE_CONFIG.name} utiliza cookies y tecnologías de geolocalización para ofrecerte 
                cupones y ofertas personalizadas según tu ubicación. Esto nos permite mostrarte 
                promociones de tiendas cercanas y mejorar tu experiencia de compra.
              </p>
              
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <MapPin className="h-4 w-4" />
                <span>Geolocalización para cupones personalizados</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <button
                onClick={() => setShowDetails(true)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Personalizar
              </button>
              
              <button
                onClick={handleAcceptAll}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Aceptar todas
              </button>
            </div>
          </div>
        ) : (
          // Vista detallada de preferencias
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                Configuración de Cookies
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Cookies Necesarias */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-green-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">Cookies Necesarias</h4>
                    <p className="text-sm text-gray-600">
                      Funcionalidad básica del sitio (sesión, seguridad)
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.necessary}
                    disabled
                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-500">Siempre activas</span>
                </div>
              </div>

              {/* Geolocalización */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">Geolocalización</h4>
                    <p className="text-sm text-gray-600">
                      Para mostrar cupones y ofertas de tiendas cercanas
                    </p>
                    <div className="mt-2 p-3 bg-blue-100 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-blue-800">
                          <strong>¿Por qué usamos geolocalización?</strong><br />
                          • Mostrar ofertas de tiendas físicas cercanas<br />
                          • Cupones personalizados por ubicación<br />
                          • Mejorar la relevancia de las promociones<br />
                          • Optimizar tu experiencia de compra local
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.geolocation}
                    onChange={() => togglePreference('geolocation')}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 bg-purple-600 rounded flex items-center justify-center">
                    <span className="text-xs text-white font-bold">A</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Cookies Analíticas</h4>
                    <p className="text-sm text-gray-600">
                      Para entender cómo usas el sitio y mejorarlo
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={() => togglePreference('analytics')}
                    className="h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Marketing */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 bg-orange-600 rounded flex items-center justify-center">
                    <span className="text-xs text-white font-bold">M</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Cookies de Marketing</h4>
                    <p className="text-sm text-gray-600">
                      Para ofrecerte promociones personalizadas
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={() => togglePreference('marketing')}
                    className="h-4 w-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleRejectAll}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Rechazar todas
              </button>
              
              <button
                onClick={handleAcceptSelected}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex-1"
              >
                Guardar preferencias
              </button>
            </div>

            {/* Información sobre frecuencia del banner */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <Clock className="h-4 w-4" />
                <div>
                  <strong>Frecuencia del banner:</strong> Este banner aparecerá solo la primera vez 
                  que visites el sitio cada día, hasta que aceptes o rechaces las cookies.
                </div>
              </div>
            </div>

            {/* Enlaces de privacidad */}
            <div className="text-center text-sm text-gray-500">
              <p>
                Al continuar, aceptas nuestra{' '}
                <a href="/privacy" className="text-blue-600 hover:underline">
                  Política de Privacidad
                </a>{' '}
                y{' '}
                <a href="/cookies" className="text-blue-600 hover:underline">
                  Política de Cookies
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CookieBanner;
