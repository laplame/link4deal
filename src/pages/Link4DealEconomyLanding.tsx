import React from 'react';
import { Link } from 'react-router-dom';
import {
  Megaphone,
  Share2,
  ShoppingBag,
  FileCheck,
  User,
  Users,
  Building2,
  CheckCircle2,
  Store,
  UtensilsCrossed,
  Wrench,
  ShoppingCart,
  ArrowRight,
  Rocket,
  MessageCircle,
} from 'lucide-react';
import { SITE_CONFIG } from '../config/site';

// Imágenes Unsplash (auto=format, fit=crop, q=80)
const UNSPLASH = {
  hero: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80', // handshake / business
  howItWorks: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80', // analytics / dashboard
  witnessCustomer: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
  witnessPromoter: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80', // team
  witnessBrand: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=400&q=80', // office
  benefits: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=800&q=80', // business success
  ecosystem: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80', // tech / digital
  useCaseRetail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80',
  useCaseRestaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80',
  useCaseLocal: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=400&q=80',
  useCaseEcommerce: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=400&q=80',
  cta: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80', // team / collaboration
};

const steps = [
  {
    number: 1,
    title: 'La marca publica una promoción',
    description: 'Las empresas publican promociones limitadas en Link4Deal.',
    icon: Megaphone,
  },
  {
    number: 2,
    title: 'Los promotores comparten el deal',
    description:
      'Clientes, influencers o incluso agentes de IA pueden distribuir la promoción.',
    icon: Share2,
  },
  {
    number: 3,
    title: 'El cliente compra en la tienda',
    description: 'La promoción se redime en el punto de venta usando BizneAI POS.',
    icon: ShoppingBag,
  },
  {
    number: 4,
    title: 'La venta queda registrada',
    description:
      'La compra genera una transacción verificable que produce: recompensa para el comprador, recompensa para el promotor, comisión para Link4Deal.',
    icon: FileCheck,
  },
];

const witnesses = [
  {
    title: 'El cliente',
    description: 'recibe evidencia de la compra.',
    icon: User,
    image: UNSPLASH.witnessCustomer,
  },
  {
    title: 'El promotor',
    description: 'recibe su recompensa por generar la venta.',
    icon: Users,
    image: UNSPLASH.witnessPromoter,
  },
  {
    title: 'La marca',
    description: 'paga únicamente por una venta real.',
    icon: Building2,
    image: UNSPLASH.witnessBrand,
  },
];

const benefits = [
  'Solo pagas cuando vendes — elimina el riesgo del marketing tradicional.',
  'Atribución real en tiendas físicas — sabes exactamente quién generó cada venta.',
  'Distribución descentralizada — clientes, influencers y agentes pueden promover tus productos.',
  'Escalabilidad global — las promociones pueden circular en cualquier lugar.',
];

const ecosystem = [
  {
    name: 'Link4Deal',
    description:
      'Marketplace donde las marcas publican promociones y ventas verificables.',
  },
  {
    name: 'BizneAI',
    description:
      'Infraestructura POS que conecta las compras físicas con el sistema de atribución.',
  },
  {
    name: 'Crypto Settlement',
    description:
      'Cada venta genera una transacción verificable y transparente entre las partes.',
  },
];

const useCases = [
  { label: 'Retail', description: 'promociones en tiendas físicas con atribución real.', icon: Store, image: UNSPLASH.useCaseRetail },
  { label: 'Restaurantes', description: 'ofertas distribuidas por promotores o clientes.', icon: UtensilsCrossed, image: UNSPLASH.useCaseRestaurant },
  { label: 'Servicios locales', description: 'ventas generadas por comunidades o influencers.', icon: Wrench, image: UNSPLASH.useCaseLocal },
  { label: 'Ecommerce + físico', description: 'atribución unificada para todos los canales.', icon: ShoppingCart, image: UNSPLASH.useCaseEcommerce },
];

export default function Link4DealEconomyLanding() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero con imagen Unsplash */}
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
        <img
          src={UNSPLASH.hero}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
        <div className="relative z-10 text-center text-white px-4 py-20">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Pagas solo por ventas reales
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
            Promociones verificables. Atribución real. Tres testigos por transacción.
          </p>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl overflow-hidden shadow-lg mb-12 aspect-video max-w-3xl mx-auto">
            <img
              src={UNSPLASH.howItWorks}
              alt="Cómo funciona Link4Deal"
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Cómo funciona
          </h2>
          <div className="space-y-10">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className="flex gap-6 items-start p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                    {step.number}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Icon className="w-5 h-5 text-indigo-600" />
                      {step.title}
                    </h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tres testigos */}
      <section className="py-16 md:py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Tres testigos de cada compra
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Cada venta queda verificada entre tres partes:
          </p>
          <div className="grid md:grid-cols-3 gap-8 mb-10">
            {witnesses.map((w) => {
              const Icon = w.icon;
              return (
                <div
                  key={w.title}
                  className="text-center rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden shadow-sm"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={w.image}
                      alt={w.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{w.title}</h3>
                    <p className="text-gray-600 text-sm">{w.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-center text-gray-700 font-medium">
            Esto crea una prueba verificable de la transacción.
          </p>
        </div>
      </section>

      {/* Beneficios para las empresas */}
      <section className="py-16 md:py-24 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Beneficios para las empresas
          </h2>
          <p className="text-center text-gray-600 mb-8 text-lg">
            Marketing basado en resultados reales
          </p>
          <div className="rounded-2xl overflow-hidden shadow-lg mb-12 aspect-[21/9] max-w-3xl mx-auto">
            <img
              src={UNSPLASH.benefits}
              alt="Beneficios para empresas"
              className="w-full h-full object-cover"
            />
          </div>
          <ul className="space-y-4">
            {benefits.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm"
              >
                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* El ecosistema */}
      <section className="py-16 md:py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            El ecosistema
          </h2>
          <div className="rounded-2xl overflow-hidden shadow-lg mb-12 aspect-video max-w-3xl mx-auto">
            <img
              src={UNSPLASH.ecosystem}
              alt="Ecosistema Link4Deal"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {ecosystem.map((item) => (
              <div
                key={item.name}
                className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100"
              >
                <h3 className="text-xl font-bold text-indigo-900 mb-2">{item.name}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Casos de uso */}
      <section className="py-16 md:py-24 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Casos de uso
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {useCases.map((uc) => {
              const Icon = uc.icon;
              return (
                <div
                  key={uc.label}
                  className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden"
                >
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={uc.image}
                      alt={uc.label}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-4 p-6">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{uc.label}</h3>
                      <p className="text-gray-600 text-sm">{uc.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* La nueva economía */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            La nueva economía de ventas
          </h2>
          <p className="text-lg text-indigo-100 mb-6">
            Durante décadas las empresas pagaron por atención.
          </p>
          <p className="text-lg text-white mb-6">
            {SITE_CONFIG.name} crea un mercado donde las empresas pagan solo por ventas reales.
          </p>
          <p className="text-xl font-semibold text-white">
            Esto convierte el marketing en algo nuevo: un mercado global de ventas verificadas.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 md:py-28 px-4 overflow-hidden">
        <img
          src={UNSPLASH.cta}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-indigo-900/80" />
        <div className="relative z-10 max-w-2xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Empieza a pagar solo por resultados
          </h2>
          <p className="text-white/90 mb-10">
            Publica promociones verificables y convierte tu marketing en ventas reales.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/quick-promotion"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors shadow-lg"
            >
              <Rocket className="w-5 h-5" />
              Publicar una promoción
            </Link>
            <a
              href="https://wa.me/525527947775"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-white text-white font-semibold hover:bg-white/10 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Contactar con Founders
            </a>
          </div>
        </div>
      </section>

      {/* Footer minimal */}
      <footer className="py-8 px-4 border-t border-slate-200 text-center text-gray-500 text-sm">
        <Link to="/" className="text-indigo-600 hover:underline inline-flex items-center gap-1">
          <ArrowRight className="w-4 h-4 rotate-180" />
          Volver al inicio
        </Link>
        <p className="mt-2">{SITE_CONFIG.copyright}</p>
      </footer>
    </div>
  );
}
