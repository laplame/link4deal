import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Shield, Clock, ArrowRight, Home, User } from 'lucide-react';

export default function KYCSuccess() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            ¡Solicitud KYC Enviada!
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Tu solicitud de verificación de identidad ha sido enviada exitosamente. 
            Nuestro equipo la revisará en las próximas 24-48 horas.
          </p>

          {/* Status Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">
                Estado de Verificación
              </h3>
            </div>
            
            <div className="space-y-3 text-left max-w-md mx-auto">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-700">Información personal recibida</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-700">Documentos subidos</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-700">Wallet configurada</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-gray-700">Verificación en proceso</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Próximos Pasos
            </h3>
            
            <div className="space-y-4 text-left max-w-md mx-auto">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Revisión de Documentos</p>
                  <p className="text-xs text-gray-600">Nuestro equipo verificará la autenticidad de tus documentos</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Verificación de Wallet</p>
                  <p className="text-xs text-gray-600">Confirmaremos que tu wallet esté activa y funcional</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Aprobación Final</p>
                  <p className="text-xs text-gray-600">Recibirás notificación por email cuando tu KYC sea aprobado</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/admin"
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <User className="w-5 h-5" />
              Volver al Panel Admin
            </Link>
            
            <Link
              to="/"
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              <Home className="w-5 h-5" />
              Ir al Inicio
            </Link>
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-2">
              ¿Tienes preguntas sobre tu solicitud KYC?
            </p>
            <p className="text-sm text-gray-500">
              Contacta a nuestro equipo de soporte en{' '}
              <a href="mailto:support@link4deal.com" className="text-blue-600 hover:underline">
                support@link4deal.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
