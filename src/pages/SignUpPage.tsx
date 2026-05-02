import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SITE_CONFIG } from '../config/site';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, CheckCircle, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PRIMARY_ROLE_LABELS } from '../types/auth';
import type { PrimaryRole } from '../types/auth';

const SIGNUP_ROLES: PrimaryRole[] = ['user', 'influencer', 'brand', 'agency'];

export default function SignUpPage() {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        primaryRole: 'user' as PrimaryRole,
        agreeToTerms: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }
        if (formData.password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres');
            return;
        }
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            setError('La contraseña debe contener al menos una mayúscula, una minúscula y un número');
            return;
        }
        const email = formData.email.trim();
        const phone = formData.phone.trim().replace(/\D/g, '');
        if (!email && !phone) {
            setError('Indica tu correo electrónico o tu teléfono/WhatsApp');
            return;
        }
        if (phone && phone.length < 10) {
            setError('El teléfono/WhatsApp debe tener al menos 10 dígitos');
            return;
        }
        const primaryRole = formData.primaryRole && ['user', 'influencer', 'brand', 'agency'].includes(formData.primaryRole)
            ? formData.primaryRole
            : 'user';
        setIsLoading(true);
        try {
            await register({
                ...(email ? { email } : {}),
                ...(phone ? { phone: formData.phone.trim() } : {}),
                password: formData.password,
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                primaryRole
            });
            navigate(primaryRole === 'influencer' ? '/admin/influencers' : '/dashboard', { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al crear la cuenta');
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
                        Crear tu cuenta
                    </h2>
                    <p className="text-gray-600">
                        Únete a la plataforma líder en promociones blockchain
                    </p>
                </div>

                {/* Sign Up Form */}
                <form className="space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    required
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="Tu nombre"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                                Apellido
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    required
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="Tu apellido"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="primaryRole" className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de cuenta
                        </label>
                        <select
                            id="primaryRole"
                            name="primaryRole"
                            value={formData.primaryRole}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                            {SIGNUP_ROLES.map(role => (
                                <option key={role} value={role}>{PRIMARY_ROLE_LABELS[role]}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                            WhatsApp o teléfono
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="5215512345678"
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Al menos 10 dígitos, con código de país</p>
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Correo electrónico <span className="text-gray-400">(opcional)</span>
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="tu@email.com"
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Indica email o teléfono/WhatsApp (al menos uno)</p>
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
                                placeholder="Mínimo 8 caracteres"
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

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                            Confirmar contraseña
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                required
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="Repite tu contraseña"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-start">
                        <div className="flex items-center h-5">
                            <input
                                id="agreeToTerms"
                                name="agreeToTerms"
                                type="checkbox"
                                required
                                checked={formData.agreeToTerms}
                                onChange={handleInputChange}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="agreeToTerms" className="text-gray-700">
                                Acepto los{' '}
                                <a href="#" className="text-blue-600 hover:text-blue-500 font-medium">
                                    Términos de Servicio
                                </a>{' '}
                                y la{' '}
                                <a href="#" className="text-blue-600 hover:text-blue-500 font-medium">
                                    Política de Privacidad
                                </a>
                            </label>
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
                                Creando cuenta...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5 mr-2" />
                                Crear cuenta
                            </>
                        )}
                    </button>
                </form>

                {/* Sign In Link */}
                <div className="text-center">
                    <p className="text-gray-600">
                        ¿Ya tienes una cuenta?{' '}
                        <Link to="/signin" className="text-blue-600 hover:text-blue-500 font-medium">
                            Inicia sesión
                        </Link>
                    </p>
                </div>

                {/* Features */}
                <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">¿Por qué {SITE_CONFIG.name}?</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            <span>Promociones verificadas con blockchain</span>
                        </div>
                        <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            <span>Conecta con marcas e influencers</span>
                        </div>
                        <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            <span>Ofertas exclusivas y descuentos reales</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
