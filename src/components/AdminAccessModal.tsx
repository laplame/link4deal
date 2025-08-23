import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Lock, Shield, AlertCircle, CheckCircle } from 'lucide-react';

interface AdminAccessModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AdminAccessModal({ isOpen, onClose }: AdminAccessModalProps) {
    const navigate = useNavigate();
    const [code, setCode] = useState<string[]>(['', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState(false);
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [lockoutTime, setLockoutTime] = useState(0);
    
    const CORRECT_CODE = '6192';
    const MAX_ATTEMPTS = 3;
    const LOCKOUT_DURATION = 30; // segundos

    useEffect(() => {
        if (isOpen) {
            setCode(['', '', '', '']);
            setError('');
            setSuccess(false);
        }
    }, [isOpen]);

    const handleCodeChange = (index: number, value: string) => {
        if (value.length > 1) return; // Solo un dígito por campo
        
        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);
        
        // Auto-focus al siguiente campo
        if (value && index < 3) {
            const nextInput = document.getElementById(`code-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
        
        // Limpiar error cuando el usuario empiece a escribir
        if (error) setError('');
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            // Retroceder al campo anterior si está vacío
            const prevInput = document.getElementById(`code-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    const handleSubmit = async () => {
        const enteredCode = code.join('');
        
        if (enteredCode.length !== 4) {
            setError('Por favor, ingresa los 4 dígitos');
            return;
        }

        if (isLocked) {
            setError(`Acceso bloqueado. Intenta de nuevo en ${lockoutTime} segundos.`);
            return;
        }

        setIsLoading(true);
        setError('');

        // Simular verificación
        setTimeout(() => {
            if (enteredCode === CORRECT_CODE) {
                setSuccess(true);
                setFailedAttempts(0);
                setTimeout(() => {
                    navigate('/admin');
                    onClose();
                }, 1000);
            } else {
                const newFailedAttempts = failedAttempts + 1;
                setFailedAttempts(newFailedAttempts);
                
                if (newFailedAttempts >= MAX_ATTEMPTS) {
                    setIsLocked(true);
                    setLockoutTime(LOCKOUT_DURATION);
                    setError(`Demasiados intentos fallidos. Acceso bloqueado por ${LOCKOUT_DURATION} segundos.`);
                    
                    // Iniciar cuenta regresiva
                    const interval = setInterval(() => {
                        setLockoutTime(prev => {
                            if (prev <= 1) {
                                setIsLocked(false);
                                setFailedAttempts(0);
                                clearInterval(interval);
                                return 0;
                            }
                            return prev - 1;
                        });
                    }, 1000);
                } else {
                    setError(`Código incorrecto. ${MAX_ATTEMPTS - newFailedAttempts} intentos restantes.`);
                }
                
                setCode(['', '', '', '']);
                // Focus en el primer campo
                const firstInput = document.getElementById('code-0');
                if (firstInput) firstInput.focus();
            }
            setIsLoading(false);
        }, 1000);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Acceso Restringido
                    </h2>
                    <p className="text-gray-600">
                        Ingresa el código de 4 dígitos para acceder al panel de administración
                    </p>
                </div>

                {/* Code Input */}
                <div className="mb-8">
                    <div className="flex justify-center space-x-3 mb-6">
                        {code.map((digit, index) => (
                            <input
                                key={index}
                                id={`code-${index}`}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleCodeChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onKeyPress={handleKeyPress}
                                disabled={isLocked}
                                className="w-16 h-16 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder="•"
                            />
                        ))}
                    </div>

                    {/* Attempts Counter */}
                    <div className="text-center mb-4">
                        <div className="flex items-center justify-center space-x-2">
                            <div className="flex space-x-1">
                                {[...Array(MAX_ATTEMPTS)].map((_, index) => (
                                    <div
                                        key={index}
                                        className={`w-3 h-3 rounded-full ${
                                            index < failedAttempts 
                                                ? 'bg-red-500' 
                                                : 'bg-gray-300'
                                        }`}
                                    />
                                ))}
                            </div>
                            <span className="text-sm text-gray-500">
                                {failedAttempts}/{MAX_ATTEMPTS} intentos
                            </span>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center justify-center text-red-600 mb-4">
                            <AlertCircle className="w-5 h-5 mr-2" />
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="flex items-center justify-center text-green-600 mb-4">
                            <CheckCircle className="w-5 h-5 mr-2" />
                            <span className="text-sm font-medium">¡Código correcto! Redirigiendo...</span>
                        </div>
                    )}

                    {/* Lockout Timer */}
                    {isLocked && lockoutTime > 0 && (
                        <div className="text-center mb-4">
                            <div className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-lg">
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                                </svg>
                                <span className="font-medium">
                                    Acceso bloqueado: {lockoutTime}s
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={isLoading || code.join('').length !== 4 || isLocked}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-4 focus:ring-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                >
                    {isLoading ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 inline-block"></div>
                            Verificando...
                        </>
                    ) : isLocked ? (
                        <>
                            <svg className="w-5 h-5 mr-2 inline-block" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                            </svg>
                            Acceso Bloqueado
                        </>
                    ) : (
                        <>
                            <Lock className="w-5 h-5 mr-2 inline-block" />
                            Acceder
                        </>
                    )}
                </button>

                {/* Security Notice */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        🔒 Acceso restringido solo para administradores autorizados
                    </p>
                </div>

                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl -z-10 opacity-30"></div>
            </div>
        </div>
    );
}
