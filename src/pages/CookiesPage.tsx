import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Cookie } from 'lucide-react';
import { SITE_CONFIG } from '../config/site';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al inicio
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Cookie className="w-10 h-10 text-amber-600" />
          <h1 className="text-3xl font-bold text-gray-900">Política de Cookies</h1>
        </div>
        <p className="text-gray-500 text-sm mb-10">
          Última actualización: febrero 2025
        </p>

        <article className="prose prose-gray max-w-none space-y-8 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. ¿Qué son las cookies?</h2>
            <p>
              Las cookies son pequeños archivos de texto que los sitios web y las aplicaciones pueden almacenar en tu
              dispositivo. Nos permiten recordar preferencias, mejorar la experiencia y analizar el uso del servicio
              de {SITE_CONFIG.name} (cupones y ofertas personalizadas por ubicación).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Tipos de cookies que utilizamos</h2>
            <ul className="space-y-4">
              <li>
                <strong className="text-gray-900">Necesarias:</strong> esenciales para el funcionamiento del sitio
                (sesión, seguridad, recordar tu aceptación de cookies). No requieren consentimiento.
              </li>
              <li>
                <strong className="text-gray-900">Analíticas:</strong> nos ayudan a entender cómo se usa la plataforma
                (páginas visitadas, origen del tráfico). Puedes aceptarlas o rechazarlas desde el banner o la
                configuración de cookies.
              </li>
              <li>
                <strong className="text-gray-900">De marketing:</strong> se usan para mostrar ofertas y mensajes
                relevantes (por ejemplo, recordatorios de cupones). Son opcionales y puedes desactivarlas.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Geolocalización</h2>
            <p>
              Para ofrecerte cupones y ofertas por ubicación, podemos usar la ubicación de tu dispositivo cuando
              nos des tu permiso. Esta información se trata según nuestra{' '}
              <Link to="/privacy" className="text-blue-600 hover:underline">Política de Privacidad</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Cómo gestionar las cookies</h2>
            <p>
              Puedes aceptar o rechazar las cookies no necesarias desde el banner que aparece al visitar el sitio,
              o desde la opción de &quot;Configuración de Cookies&quot; cuando esté disponible. También puedes
              configurar tu navegador para bloquear o eliminar cookies (esto puede afectar algunas funciones del sitio).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Más información</h2>
            <p>
              Para cualquier duda sobre el uso de cookies o el tratamiento de tus datos, contacta en{' '}
              <a href={`mailto:${SITE_CONFIG.email}`} className="text-blue-600 hover:underline">{SITE_CONFIG.email}</a>.
            </p>
          </section>
        </article>
      </main>

      <footer className="border-t border-gray-200 mt-16 py-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-wrap gap-4 justify-center text-sm text-gray-500">
          <Link to="/" className="hover:text-gray-900">Inicio</Link>
          <Link to="/privacy" className="hover:text-gray-900">Política de Privacidad</Link>
          <Link to="/about" className="hover:text-gray-900">Nosotros</Link>
          <span>{SITE_CONFIG.copyright}</span>
        </div>
      </footer>
    </div>
  );
}
