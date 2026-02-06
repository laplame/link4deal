import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { GeolocationProvider } from './context/GeolocationContext';
import ErrorBoundary from './components/ErrorBoundary';
import { routerConfig } from './config/router';
import CookieBanner from './components/CookieBanner';
import LandingPage from './pages/landing';
import AboutPage from './pages/AboutPage';
import UserTypeSelector from './pages/UserTypeSelector';
import InfluencerSetup from './pages/InfluencerSetup';
import BrandSetup from './pages/BrandSetup';
import AgencySetup from './pages/AgencySetup';
import PromotionDetailsPage from './pages/PromotionDetailsPage';
import CouponPage from './pages/CouponPage';
import CategoryPage from './pages/CategoryPage';
import CategoriesPage from './pages/CategoriesPage';
import ReferralSystemPage from './pages/ReferralSystemPage';
import CreatePromotionWizard from './pages/CreatePromotionWizard';
import QuickPromotionPage from './pages/QuickPromotionPage';
import PromotionsMarketplace from './pages/PromotionsMarketplace';
import InfluencersMarketplace from './pages/InfluencersMarketplace';
import InfluencerProfilePage from './pages/InfluencerProfilePage';
import InfluencerOCRProfile from './pages/InfluencerOCRProfile';
import KYCForm from './pages/KYCForm';
import KYCSuccess from './pages/KYCSuccess';
import CreateCoupon from './pages/CreateCoupon';
import AdminPage from './pages/AdminPage';
import SignInPage from './pages/SignUpPage';
import SignUpPage from './pages/SignUpPage';
import CartPage from './pages/CartPage';
import BusinessLanding from './pages/BusinessLanding';
import DigitalCommissionerLanding from './pages/DigitalCommissionerLanding';
import CheckoutPage from './pages/CheckoutPage';
import CheckoutSuccess from './pages/CheckoutSuccess';
import InfluencerDashboard from './pages/dashboards/InfluencerDashboard';
import BrandDashboard from './pages/dashboards/BrandDashboard';
import AgencyDashboard from './pages/dashboards/AgencyDashboard';
import { useLocation, Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

// Componente para página 404
function NotFoundPage() {
  const location = useLocation();
  const isApiRoute = location.pathname.startsWith('/api/');
  
  if (isApiRoute) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">API Route</h1>
          <p className="text-gray-600 mb-4">
            Esta es una ruta de API del backend, no una página del frontend.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Ruta: {location.pathname}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            Ir al Inicio
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Página no encontrada</h2>
        <p className="text-gray-600 mb-6">
          La página que buscas no existe o ha sido movida.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Home className="w-4 h-4" />
          Ir al Inicio
        </Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <GeolocationProvider>
        <CartProvider>
          <Router {...routerConfig}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/landing" element={<BusinessLanding />} />
              <Route path="/comisionista-digital" element={<DigitalCommissionerLanding />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/checkout/success" element={<CheckoutSuccess />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/user-type-selector" element={<UserTypeSelector />} />
              <Route path="/influencer-setup" element={<InfluencerSetup />} />
              <Route path="/brand-setup" element={<BrandSetup />} />
              <Route path="/agency-setup" element={<AgencySetup />} />
              <Route path="/promotion-details/:id" element={<PromotionDetailsPage />} />
              <Route path="/coupon/:couponId" element={<CouponPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/category/:categorySlug" element={<CategoryPage />} />
              <Route path="/referral-system" element={<ReferralSystemPage />} />
              <Route path="/create-promotion" element={<CreatePromotionWizard />} />
              <Route path="/quick-promotion" element={<QuickPromotionPage />} />
              <Route path="/add-promotion" element={<QuickPromotionPage />} />
              <Route path="/marketplace" element={<PromotionsMarketplace />} />
              <Route path="/influencers" element={<InfluencersMarketplace />} />
              <Route path="/influencer/:influencerSlug" element={<InfluencerProfilePage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/influencers" element={<InfluencerDashboard />} />
              <Route path="/admin/brands" element={<BrandDashboard />} />
              <Route path="/admin/agencies" element={<AgencyDashboard />} />
              <Route path="/admin/ocr-profile" element={<InfluencerOCRProfile />} />
              <Route path="/kyc-form" element={<KYCForm />} />
              <Route path="/kyc-success" element={<KYCSuccess />} />
              <Route path="/create-coupon" element={<CreateCoupon />} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/cart" element={<CartPage />} />
              {/* Ruta catch-all para rutas no encontradas */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            
            {/* Banner de Cookies - Aparece en todas las páginas */}
            <CookieBanner />
          </Router>
        </CartProvider>
      </GeolocationProvider>
    </ErrorBoundary>
  );
}

export default App;