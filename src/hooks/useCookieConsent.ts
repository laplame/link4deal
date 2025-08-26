import { useState, useEffect } from 'react';

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  geolocation: boolean;
}

export const useCookieConsent = () => {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    geolocation: false
  });

  const [hasConsented, setHasConsented] = useState(false);

  useEffect(() => {
    // Verificar si es la primera visita del día
    const today = new Date().toDateString();
    const lastVisitDate = localStorage.getItem('damecodigo_last_visit_date');
    const cookiesAccepted = localStorage.getItem('damecodigo_cookies_accepted');
    
    // Si es la primera visita del día, mostrar el banner
    if (lastVisitDate !== today) {
      localStorage.setItem('damecodigo_last_visit_date', today);
      
      // Solo mostrar si no se han aceptado las cookies
      if (!cookiesAccepted) {
        setHasConsented(false);
        return;
      }
    }
    
    // Cargar preferencias guardadas si ya se aceptaron cookies
    if (cookiesAccepted) {
      try {
        const savedPreferences = localStorage.getItem('damecodigo_cookie_preferences');
        if (savedPreferences) {
          const parsed = JSON.parse(savedPreferences);
          setPreferences(parsed);
        }
        setHasConsented(true);
      } catch (error) {
        console.error('Error parsing saved cookie preferences:', error);
      }
    } else {
      setHasConsented(false);
    }
  }, []);

  const updatePreferences = (newPreferences: Partial<CookiePreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);
    
    // Guardar en localStorage
    localStorage.setItem('damecodigo_cookie_preferences', JSON.stringify(updated));
    localStorage.setItem('damecodigo_cookies_accepted', JSON.stringify(updated));
    
    // Habilitar geolocalización si se acepta
    if (updated.geolocation && !preferences.geolocation) {
      enableGeolocation();
    }
    
    setHasConsented(true);
  };

  const acceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      geolocation: true
    };
    
    updatePreferences(allAccepted);
  };

  const rejectAll = () => {
    const allRejected: CookiePreferences = {
      necessary: true, // Las cookies necesarias siempre están activas
      analytics: false,
      marketing: false,
      geolocation: false
    };
    
    updatePreferences(allRejected);
  };

  const enableGeolocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Geolocalización habilitada:', position.coords);
          
          // Guardar ubicación en localStorage
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          };
          
          localStorage.setItem('damecodigo_user_location', JSON.stringify(location));
          
          // Aquí puedes enviar la ubicación a tu backend
          // sendLocationToBackend(location);
        },
        (error) => {
          console.log('Error al obtener ubicación:', error);
          
          // Si el usuario rechaza la geolocalización, desactivar la preferencia
          if (error.code === error.PERMISSION_DENIED) {
            updatePreferences({ geolocation: false });
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutos
        }
      );
    }
  };

  const getUserLocation = () => {
    const savedLocation = localStorage.getItem('damecodigo_user_location');
    if (savedLocation) {
      try {
        return JSON.parse(savedLocation);
      } catch (error) {
        console.error('Error parsing saved location:', error);
        return null;
      }
    }
    return null;
  };

  const clearPreferences = () => {
    localStorage.removeItem('damecodigo_cookie_preferences');
    localStorage.removeItem('damecodigo_cookies_accepted');
    localStorage.removeItem('damecodigo_user_location');
    
    setPreferences({
      necessary: true,
      analytics: false,
      marketing: false,
      geolocation: false
    });
    
    setHasConsented(false);
  };

  const resetDailyBanner = () => {
    // Remover la fecha de última visita para mostrar el banner nuevamente
    localStorage.removeItem('damecodigo_last_visit_date');
    setHasConsented(false);
  };

  const getLastVisitInfo = () => {
    const lastVisitDate = localStorage.getItem('damecodigo_last_visit_date');
    const cookiesAccepted = localStorage.getItem('damecodigo_cookies_accepted');
    
    return {
      lastVisitDate,
      cookiesAccepted: !!cookiesAccepted,
      today: new Date().toDateString(),
      shouldShowBanner: lastVisitDate !== new Date().toDateString() && !cookiesAccepted
    };
  };

  return {
    preferences,
    hasConsented,
    updatePreferences,
    acceptAll,
    rejectAll,
    enableGeolocation,
    getUserLocation,
    clearPreferences,
    resetDailyBanner,
    getLastVisitInfo
  };
};
