import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, Lock } from 'lucide-react';

const REDOC_SCRIPT_URL = 'https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js';

/**
 * Página de documentación API con Redoc.
 * Solo accesible para rol agency (agencias) y superadmin.
 */
export default function ApiDocsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();

  const canAccess =
    isAuthenticated &&
    user &&
    (user.primaryRole === 'agency' || user?.isSuperAdmin === true);

  useEffect(() => {
    if (isLoading || !canAccess) return;

    const container = containerRef.current;
    if (!container) return;

    const script = document.createElement('script');
    script.src = REDOC_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      const redocEl = document.createElement('redoc');
      const baseUrl = import.meta.env.DEV ? '' : (import.meta.env.BASE_URL || '');
      const specUrl = `${baseUrl}/api/openapi.json`;
      redocEl.setAttribute('spec-url', specUrl);
      container.innerHTML = '';
      container.appendChild(redocEl);
    };
    document.body.appendChild(script);
    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
      container.innerHTML = '';
    };
  }, [canAccess, isLoading]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !canAccess) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoading, isAuthenticated, canAccess, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="h-10 w-10 animate-spin text-white" />
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate('/signin', { replace: true });
    return null;
  }

  if (!canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
        <div className="text-center text-white max-w-md">
          <Lock className="h-16 w-16 mx-auto mb-4 text-amber-500" />
          <h1 className="text-2xl font-bold mb-2">Acceso restringido</h1>
          <p className="text-slate-300 mb-6">
            La documentación API está disponible solo para cuentas de agencias y superadmin.
          </p>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors"
          >
            Ir al panel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div ref={containerRef} className="redoc-container" style={{ minHeight: '100vh' }} />
    </div>
  );
}
