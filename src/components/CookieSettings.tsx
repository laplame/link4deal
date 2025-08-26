import React from 'react';
import { MapPin, Shield, Info, Cookie, RefreshCw, Trash2 } from 'lucide-react';
import { useCookieConsent } from '../hooks/useCookieConsent';
import { SITE_CONFIG } from '../config/site';

const CookieSettings: React.FC = () => {
  const {
    preferences,
    hasConsented,
    updatePreferences,
    acceptAll,
    rejectAll,
    clearPreferences,
    getUserLocation
  } = useCookieConsent();

  const userLocation = getUserLocation();

  const handleTogglePreference = (key: keyof typeof preferences) => {
    if (key === 'necessary') return; // Las cookies necesarias no se pueden desactivar
    
    updatePreferences({ [key]: !preferences[key] });
  };

  const handleSavePreferences = () => {
    // Las preferencias se guardan automáticamente al cambiar
    // Este método se puede usar para mostrar confirmación
    console.log('Preferencias guardadas:', preferences);
  };

  if (!hasConsented) {
    return (
      <div className="text-center py-8">
        <Cookie className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No has configurado las cookies aún
        </h3>
        <p className="text-gray-600 mb-4">
          Configura tus preferencias de cookies para personalizar tu experiencia
        </p>
        <button
          onClick={acceptAll}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Configurar ahora
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Cookie className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            Configuración de Cookies
          </h2>
        </div>
        <p className="text-gray-600">
          Gestiona tus preferencias de cookies y privacidad en {SITE_CONFIG.name}. 
          Puedes cambiar estas configuraciones en cualquier momento.
        </p>
      </div>

      <div className="space-y-6">
        {/* Cookies Necesarias */}
        <div className="p-6 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Cookies Necesarias
                </h3>
                <p className="text-sm text-gray-600">
                  Funcionalidad básica del sitio (sesión, seguridad, carrito)
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.necessary}
                disabled
                className="h-5 w-5 text-green-600 rounded border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-500 font-medium">
                Siempre activas
              </span>
            </div>
          </div>
          <div className="text-sm text-gray-700">
            <strong>Incluye:</strong> Autenticación, carrito de compras, 
            preferencias de idioma, seguridad del sitio.
          </div>
        </div>

        {/* Geolocalización */}
        <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Geolocalización
                </h3>
                <p className="text-sm text-gray-600">
                  Para mostrar cupones y ofertas de tiendas cercanas
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.geolocation}
                onChange={() => handleTogglePreference('geolocation')}
                className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="mb-4 p-4 bg-blue-100 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <strong>¿Por qué usamos geolocalización?</strong>
                <ul className="mt-2 space-y-1">
                  <li>• Mostrar ofertas de tiendas físicas cercanas</li>
                  <li>• Cupones personalizados por ubicación</li>
                  <li>• Mejorar la relevancia de las promociones</li>
                  <li>• Optimizar tu experiencia de compra local</li>
                </ul>
              </div>
            </div>
          </div>

          {userLocation && preferences.geolocation && (
            <div className="p-3 bg-white rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  <strong>Ubicación actual:</strong> {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
                  <br />
                  <span className="text-gray-500">
                    Precisión: ±{Math.round(userLocation.accuracy)}m • 
                    Actualizada: {new Date(userLocation.timestamp).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Actualizar ubicación"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Analytics */}
        <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 bg-purple-600 rounded flex items-center justify-center">
                <span className="text-xs text-white font-bold">A</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Cookies Analíticas
                </h3>
                <p className="text-sm text-gray-600">
                  Para entender cómo usas el sitio y mejorarlo
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.analytics}
                onChange={() => handleTogglePreference('analytics')}
                className="h-5 w-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="text-sm text-gray-700">
            <strong>Incluye:</strong> Métricas de uso, páginas visitadas, 
            tiempo en el sitio, fuentes de tráfico.
          </div>
        </div>

        {/* Marketing */}
        <div className="p-6 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 bg-orange-600 rounded flex items-center justify-center">
                <span className="text-xs text-white font-bold">M</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Cookies de Marketing
                </h3>
                <p className="text-sm text-gray-600">
                  Para ofrecerte promociones personalizadas
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.marketing}
                onChange={() => handleTogglePreference('marketing')}
                className="h-5 w-5 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
              />
            </div>
          </div>
          <div className="text-sm text-gray-700">
            <strong>Incluye:</strong> Publicidad personalizada, 
            retargeting, cupones específicos, ofertas especiales.
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex gap-3">
            <button
              onClick={acceptAll}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Aceptar todas
            </button>
            
            <button
              onClick={rejectAll}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Rechazar todas
            </button>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleSavePreferences}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Guardar cambios
            </button>
            
            <button
              onClick={clearPreferences}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Limpiar todo
            </button>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600">
          <p className="mb-2">
            <strong>Nota:</strong> Las cookies necesarias siempre están activas para 
            garantizar el funcionamiento básico del sitio.
          </p>
          <p>
            Puedes cambiar estas configuraciones en cualquier momento. 
            Para más información, consulta nuestra{' '}
            <a href="/privacy" className="text-blue-600 hover:underline">
              Política de Privacidad
            </a>{' '}
            y{' '}
            <a href="/cookies" className="text-blue-600 hover:underline">
              Política de Cookies
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CookieSettings;
