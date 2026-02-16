import React from 'react';
import { Link } from 'react-router-dom';
import { User, Tag, ShoppingBag, Gift, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PRIMARY_ROLE_LABELS } from '../../types/auth';

/**
 * Dashboard para rol "user" (solo usuario).
 * Acceso a ofertas, cupones y perfil.
 */
export default function UserDashboard() {
  const { user } = useAuth();
  const roleLabel = user?.primaryRole ? PRIMARY_ROLE_LABELS[user.primaryRole] : 'Usuario';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Hola, {user?.firstName ?? 'Usuario'}
          </h1>
          <p className="text-gray-600 mt-1">{roleLabel}</p>
        </header>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/marketplace"
            className="flex items-center gap-4 p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <Tag className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">Ofertas y promociones</h2>
              <p className="text-sm text-gray-500">Ver ofertas vigentes y pedir cupones</p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </Link>

          <Link
            to="/cart"
            className="flex items-center gap-4 p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">Carrito</h2>
              <p className="text-sm text-gray-500">Tus cupones y ofertas solicitadas</p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </Link>

          <Link
            to="/categories"
            className="flex items-center gap-4 p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <Gift className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">Categorías</h2>
              <p className="text-sm text-gray-500">Explorar por categoría</p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </Link>
        </div>

        <div className="mt-8 p-6 bg-white rounded-xl border border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            Tu cuenta
          </h2>
          <p className="text-gray-600 text-sm">
            {user?.email} · Rol: {roleLabel}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Volver al inicio
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
