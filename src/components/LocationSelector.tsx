import React, { useState } from 'react';
import { MapPin, Globe, RefreshCw, Check } from 'lucide-react';
import { useGeolocation } from '../context/GeolocationContext';

const LocationSelector: React.FC = () => {
    const { location, isLoading, error, updateLocation, refreshLocation } = useGeolocation();
    const [showSelector, setShowSelector] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState(location?.currency || 'MXN');

    const currencies = [
        { code: 'MXN', name: 'Peso Mexicano', symbol: '$', country: 'México' },
        { code: 'USD', name: 'Dólar Estadounidense', symbol: '$', country: 'Estados Unidos' },
        { code: 'EUR', name: 'Euro', symbol: '€', country: 'Unión Europea' },
        { code: 'GBP', name: 'Libra Esterlina', symbol: '£', country: 'Reino Unido' },
        { code: 'CAD', name: 'Dólar Canadiense', symbol: 'C$', country: 'Canadá' },
        { code: 'AUD', name: 'Dólar Australiano', symbol: 'A$', country: 'Australia' },
        { code: 'JPY', name: 'Yen Japonés', symbol: '¥', country: 'Japón' },
        { code: 'CHF', name: 'Franco Suizo', symbol: 'CHF', country: 'Suiza' },
        { code: 'CNY', name: 'Yuan Chino', symbol: '¥', country: 'China' },
        { code: 'INR', name: 'Rupia India', symbol: '₹', country: 'India' }
    ];

    const handleCurrencyChange = (currencyCode: string) => {
        const currency = currencies.find(c => c.code === currencyCode);
        if (currency && location) {
            updateLocation({
                currency: currencyCode,
                currencySymbol: currency.symbol
            });
            setSelectedCurrency(currencyCode);
            setShowSelector(false);
        }
    };

    const handleRefreshLocation = async () => {
        await refreshLocation();
        setSelectedCurrency(location?.currency || 'MXN');
    };

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Detectando ubicación...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center gap-2 text-sm text-red-600">
                <MapPin className="h-4 w-4" />
                <span>Error: {error}</span>
                <button
                    onClick={handleRefreshLocation}
                    className="text-blue-600 hover:text-blue-800"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    if (!location) {
        return null;
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowSelector(!showSelector)}
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
            >
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">
                    {location.city}, {location.countryCode}
                </span>
                <span className="font-medium">
                    {location.currencySymbol} {location.currency}
                </span>
                <Globe className="h-3 w-3" />
            </button>

            {showSelector && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900">Ubicación y Moneda</h3>
                            <button
                                onClick={() => setShowSelector(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ×
                            </button>
                        </div>
                        
                        {/* Ubicación actual */}
                        <div className="bg-blue-50 rounded-lg p-3 mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <MapPin className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-900">Ubicación Detectada</span>
                            </div>
                            <p className="text-sm text-blue-800">
                                {location.city}, {location.region}, {location.country}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                                IP: {location.ip} • Zona horaria: {location.timezone}
                            </p>
                        </div>

                        {/* Selector de moneda */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Seleccionar Moneda
                            </label>
                            <div className="max-h-48 overflow-y-auto space-y-1">
                                {currencies.map((currency) => (
                                    <button
                                        key={currency.code}
                                        onClick={() => handleCurrencyChange(currency.code)}
                                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                                            selectedCurrency === currency.code
                                                ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                                : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-medium">
                                                {currency.symbol}
                                            </span>
                                            <div>
                                                <div className="font-medium text-sm">
                                                    {currency.code}
                                                </div>
                                                <div className="text-xs text-gray-600">
                                                    {currency.name}
                                                </div>
                                            </div>
                                        </div>
                                        {selectedCurrency === currency.code && (
                                            <Check className="h-4 w-4 text-blue-600" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Botón de refrescar */}
                        <div className="mt-4 pt-3 border-t border-gray-200">
                            <button
                                onClick={handleRefreshLocation}
                                className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Refrescar Ubicación
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationSelector;
