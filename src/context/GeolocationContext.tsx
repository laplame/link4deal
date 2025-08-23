import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface LocationData {
    country: string;
    countryCode: string;
    region: string;
    city: string;
    currency: string;
    currencySymbol: string;
    timezone: string;
    ip: string;
}

interface GeolocationContextType {
    location: LocationData | null;
    isLoading: boolean;
    error: string | null;
    updateLocation: (newLocation: Partial<LocationData>) => void;
    refreshLocation: () => Promise<void>;
}

const defaultLocation: LocationData = {
    country: 'México',
    countryCode: 'MX',
    region: 'CDMX',
    city: 'Ciudad de México',
    currency: 'MXN',
    currencySymbol: '$',
    timezone: 'America/Mexico_City',
    ip: ''
};

const GeolocationContext = createContext<GeolocationContextType | undefined>(undefined);

export const useGeolocation = () => {
    const context = useContext(GeolocationContext);
    if (context === undefined) {
        throw new Error('useGeolocation must be used within a GeolocationProvider');
    }
    return context;
};

interface GeolocationProviderProps {
    children: ReactNode;
}

export const GeolocationProvider: React.FC<GeolocationProviderProps> = ({ children }) => {
    const [location, setLocation] = useState<LocationData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Función para obtener la ubicación por IP
    const getLocationByIP = async (): Promise<LocationData> => {
        try {
            // Usar ipapi.co para obtener información de ubicación
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            
            return {
                country: data.country_name || 'Unknown',
                countryCode: data.country_code || 'XX',
                region: data.region || 'Unknown',
                city: data.city || 'Unknown',
                currency: data.currency || 'USD',
                currencySymbol: getCurrencySymbol(data.currency),
                timezone: data.timezone || 'UTC',
                ip: data.ip || ''
            };
        } catch (error) {
            console.error('Error getting location by IP:', error);
            throw new Error('No se pudo determinar la ubicación');
        }
    };

    // Función para obtener el símbolo de moneda
    const getCurrencySymbol = (currencyCode: string): string => {
        const symbols: Record<string, string> = {
            'MXN': '$',
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'JPY': '¥',
            'CAD': 'C$',
            'AUD': 'A$',
            'CHF': 'CHF',
            'CNY': '¥',
            'INR': '₹'
        };
        return symbols[currencyCode] || currencyCode;
    };

    // Función para refrescar la ubicación
    const refreshLocation = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const newLocation = await getLocationByIP();
            setLocation(newLocation);
            
            // Guardar en localStorage
            localStorage.setItem('link4deal_location', JSON.stringify(newLocation));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
            // Usar ubicación por defecto si falla
            setLocation(defaultLocation);
        } finally {
            setIsLoading(false);
        }
    };

    // Función para actualizar la ubicación manualmente
    const updateLocation = (newLocation: Partial<LocationData>) => {
        if (location) {
            const updatedLocation = { ...location, ...newLocation };
            setLocation(updatedLocation);
            localStorage.setItem('link4deal_location', JSON.stringify(updatedLocation));
        }
    };

    // Cargar ubicación al inicializar
    useEffect(() => {
        const loadLocation = async () => {
            // Intentar cargar desde localStorage primero
            const savedLocation = localStorage.getItem('link4deal_location');
            if (savedLocation) {
                try {
                    const parsed = JSON.parse(savedLocation);
                    setLocation(parsed);
                    setIsLoading(false);
                } catch {
                    // Si hay error en localStorage, obtener nueva ubicación
                    await refreshLocation();
                }
            } else {
                // Si no hay ubicación guardada, obtener nueva
                await refreshLocation();
            }
        };

        loadLocation();
    }, []);

    return (
        <GeolocationContext.Provider value={{
            location,
            isLoading,
            error,
            updateLocation,
            refreshLocation,
        }}>
            {children}
        </GeolocationContext.Provider>
    );
};
