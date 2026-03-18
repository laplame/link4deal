import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { SITE_CONFIG } from '../config/site';

export default function PrivacyPage() {
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
          <Shield className="w-10 h-10 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Política de Privacidad</h1>
        </div>
        <p className="text-gray-500 text-sm mb-10">
          Última actualización: febrero 2025
        </p>

        <article className="prose prose-gray max-w-none space-y-8 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Responsable del tratamiento</h2>
            <p>
              {SITE_CONFIG.name} ({SITE_CONFIG.website}) es el responsable del tratamiento de tus datos personales
              cuando utilizas nuestra plataforma web y aplicación móvil de cupones y ofertas personalizadas por ubicación.
            </p>
            <p className="mt-2">
              Contacto: <a href={`mailto:${SITE_CONFIG.email}`} className="text-blue-600 hover:underline">{SITE_CONFIG.email}</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Datos que recogemos</h2>
            <p>Podemos recoger y tratar, entre otros:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Datos de identificación (nombre, correo electrónico, teléfono) cuando te registras o contactas con nosotros.</li>
              <li>Ubicación aproximada para mostrarte ofertas y cupones relevantes según tu zona.</li>
              <li>Datos de uso de la app y la web (páginas visitadas, cupones utilizados, preferencias).</li>
              <li>Datos técnicos (dirección IP, tipo de dispositivo, navegador) para el correcto funcionamiento y seguridad.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Finalidad del tratamiento</h2>
            <p>Utilizamos tus datos para:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Gestionar tu cuenta y el acceso a cupones y promociones.</li>
              <li>Personalizar ofertas según tu ubicación e intereses.</li>
              <li>Enviar comunicaciones sobre promociones (si lo autorizas) y soporte.</li>
              <li>Mejorar nuestros servicios, seguridad y cumplimiento legal.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Base legal y conservación</h2>
            <p>
              El tratamiento se basa en tu consentimiento, la ejecución del contrato contigo o nuestro interés legítimo,
              según el caso. Conservamos los datos el tiempo necesario para las finalidades indicadas y para cumplir
              obligaciones legales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Tus derechos</h2>
            <p>
              Puedes ejercer los derechos de acceso, rectificación, supresión, limitación del tratamiento, portabilidad
              y oposición, así como retirar tu consentimiento, contactando en <a href={`mailto:${SITE_CONFIG.email}`} className="text-blue-600 hover:underline">{SITE_CONFIG.email}</a>.
              Tienes derecho a presentar una reclamación ante la autoridad de protección de datos competente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Cookies y tecnologías similares</h2>
            <p>
              Utilizamos cookies y tecnologías similares según se describe en nuestra{' '}
              <Link to="/cookies" className="text-blue-600 hover:underline">Política de Cookies</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Cambios</h2>
            <p>
              Podemos actualizar esta política. Los cambios relevantes se comunicarán en la web o por correo cuando
              así lo exija la normativa aplicable.
            </p>
          </section>
        </article>
      </main>

      <footer className="border-t border-gray-200 mt-16 py-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-wrap gap-4 justify-center text-sm text-gray-500">
          <Link to="/" className="hover:text-gray-900">Inicio</Link>
          <Link to="/cookies" className="hover:text-gray-900">Política de Cookies</Link>
          <Link to="/about" className="hover:text-gray-900">Nosotros</Link>
          <span>{SITE_CONFIG.copyright}</span>
        </div>
      </footer>
    </div>
  );
}
