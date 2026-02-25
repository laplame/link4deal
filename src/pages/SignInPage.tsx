import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SITE_CONFIG } from '../config/site';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, LogIn, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SignInPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        login: '',
        password: '',
        rememberMe: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            await login({ login: formData.login, password: formData.password });
            navigate('/dashboard', { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <Link 
                        to="/" 
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Volver al inicio
                    </Link>
                    
                    <Link to="/" className="flex items-center justify-center mb-6">
                        <img 
                            src="/logo.png" 
                            alt="DameCódigo" 
                            className="w-12 h-12 object-contain"
                        />
                        <span className="text-3xl font-bold text-gray-900 ml-3">{SITE_CONFIG.name}</span>
                    </Link>
                    
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        Bienvenido de vuelta
                    </h2>
                    <p className="text-gray-600">
                        Accede con tu email o WhatsApp/teléfono
                    </p>
                </div>

                {/* Sign In Form */}
                <form className="space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}
                    <div>
                        <label htmlFor="login" className="block text-sm font-medium text-gray-700 mb-2">
                            Email o WhatsApp / teléfono
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                id="login"
                                name="login"
                                type="text"
                                required
                                autoComplete="username"
                                value={formData.login}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="tu@email.com o 5215512345678"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            Contraseña
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                value={formData.password}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="Tu contraseña"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="rememberMe"
                                name="rememberMe"
                                type="checkbox"
                                checked={formData.rememberMe}
                                onChange={handleInputChange}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                            <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                                Recordarme
                            </label>
                        </div>
                        <div className="text-sm">
                            <a href="#" className="text-blue-600 hover:text-blue-500 font-medium">
                                ¿Olvidaste tu contraseña?
                            </a>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Iniciando sesión...
                            </>
                        ) : (
                            <>
                                <LogIn className="w-5 h-5 mr-2" />
                                Iniciar Sesión
                            </>
                        )}
                    </button>
                </form>

                {/* Sign Up Link */}
                <div className="text-center">
                    <p className="text-gray-600">
                        ¿No tienes una cuenta?{' '}
                        <Link to="/signup" className="text-blue-600 hover:text-blue-500 font-medium">
                            Regístrate aquí
                        </Link>
                    </p>
                </div>

                {/* Quick Access */}
                <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Acceso Rápido</h3>
                    <div className="space-y-3">
                        <Link
                            to="/create-promotion"
                            className="flex items-center justify-center w-full px-4 py-2 border border-purple-300 rounded-lg text-purple-700 hover:bg-purple-100 transition-colors"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Crear Promoción
                        </Link>
                    </div>
                </div>

                {/* Features */}
                <div className="bg-green-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Beneficios de tu cuenta</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            <span>Acceso a ofertas exclusivas</span>
                        </div>
                        <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            <span>Gestión de promociones</span>
                        </div>
                        <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            <span>Historial de transacciones</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
