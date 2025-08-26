import React from 'react';
import { useCookieConsent } from '../hooks/useCookieConsent';

const CookieDebug: React.FC = () => {
  const { 
    preferences, 
    hasConsented, 
    getLastVisitInfo, 
    resetDailyBanner,
    clearPreferences 
  } = useCookieConsent();

  const visitInfo = getLastVisitInfo();

  if (process.env.NODE_ENV !== 'development') {
    return null; // Solo mostrar en desarrollo
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-yellow-100 border border-yellow-400 rounded-lg p-4 max-w-sm">
      <h3 className="font-bold text-yellow-800 mb-2">🍪 Debug Cookies (Dev)</h3>
      
      <div className="text-xs text-yellow-700 space-y-1">
        <div><strong>Estado:</strong> {hasConsented ? '✅ Aceptado' : '❌ Pendiente'}</div>
        <div><strong>Hoy:</strong> {visitInfo.today}</div>
        <div><strong>Última visita:</strong> {visitInfo.lastVisitDate || 'Nunca'}</div>
        <div><strong>Debería mostrar:</strong> {visitInfo.shouldShowBanner ? 'Sí' : 'No'}</div>
        
        <div className="mt-2">
          <strong>Preferencias:</strong>
          <div className="ml-2">
            <div>🍪 Necesarias: {preferences.necessary ? '✅' : '❌'}</div>
            <div>📍 Geolocalización: {preferences.geolocation ? '✅' : '❌'}</div>
            <div>📊 Analytics: {preferences.analytics ? '✅' : '❌'}</div>
            <div>🎯 Marketing: {preferences.marketing ? '✅' : '❌'}</div>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <button
          onClick={resetDailyBanner}
          className="w-full px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
        >
          🔄 Reset Banner Diario
        </button>
        
        <button
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          className="w-full px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
        >
          🧹 Limpiar localStorage
        </button>
        
        <button
          onClick={clearPreferences}
          className="w-full px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
        >
          🗑️ Limpiar Todo
        </button>
      </div>
    </div>
  );
};

export default CookieDebug;
