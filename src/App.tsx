import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { GeolocationProvider } from './context/GeolocationContext';
import ErrorBoundary from './components/ErrorBoundary';
import { routerConfig } from './config/router';
import CookieBanner from './components/CookieBanner';
import LandingPage from './pages/landing';
import AboutPage from './pages/AboutPage';
import PrivacyPage from './pages/PrivacyPage';
import CookiesPage from './pages/CookiesPage';
import UserTypeSelector from './pages/UserTypeSelector';
import InfluencerSetup from './pages/InfluencerSetup';
import BrandSetup from './pages/BrandSetup';
import AgencySetup from './pages/AgencySetup';
import PromotionDetailsPage from './pages/PromotionDetailsPage';
import PromotionSmartContractPage from './pages/PromotionSmartContractPage';
import CouponPage from './pages/CouponPage';
import CategoryPage from './pages/CategoryPage';
import CategoriesPage from './pages/CategoriesPage';
import ReferralSystemPage from './pages/ReferralSystemPage';
import CreatePromotionWizard from './pages/CreatePromotionWizard';
import QuickPromotionPage from './pages/QuickPromotionPage';
import PromotionsMarketplace from './pages/PromotionsMarketplace';
import { BrandPage } from './pages/BrandPage';
import InfluencersMarketplace from './pages/InfluencersMarketplace';
import InfluencerProfilePage from './pages/InfluencerProfilePage';
import InfluencerOCRProfile from './pages/InfluencerOCRProfile';
import KYCForm from './pages/KYCForm';
import KYCSuccess from './pages/KYCSuccess';
import CreateCoupon from './pages/CreateCoupon';
import AdminPage from './pages/AdminPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import DashboardPage from './pages/DashboardPage';
import CartPage from './pages/CartPage';
import BusinessLanding from './pages/BusinessLanding';
import DigitalCommissionerLanding from './pages/DigitalCommissionerLanding';
import Link4DealEconomyLanding from './pages/Link4DealEconomyLanding';
import CheckoutPage from './pages/CheckoutPage';
import CheckoutSuccess from './pages/CheckoutSuccess';
import InfluencerDashboard from './pages/dashboards/InfluencerDashboard';
import BrandDashboard from './pages/dashboards/BrandDashboard';
import ProfileDashboardByRole from './pages/dashboards/ProfileDashboardByRole';
import AgencyDashboard from './pages/dashboards/AgencyDashboard';
import PromotionsManagePage from './pages/dashboards/PromotionsManagePage';
import SuperAdminDashboardPage from './pages/dashboards/SuperAdminDashboardPage';
import ApiDocsPage from './pages/ApiDocsPage';
import DashboardLayout from './components/dashboard/DashboardLayout';
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
      <AuthProvider>
        <GeolocationProvider>
          <CartProvider>
            <Router {...routerConfig}>
              <Routes>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/landing" element={<BusinessLanding />} />
                  <Route path="/comisionista-digital" element={<DigitalCommissionerLanding />} />
                  <Route path="/economia" element={<Link4DealEconomyLanding />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/checkout/success" element={<CheckoutSuccess />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/cookies" element={<CookiesPage />} />
                  <Route path="/user-type-selector" element={<UserTypeSelector />} />
                  <Route path="/influencer-setup" element={<InfluencerSetup />} />
                  <Route path="/brand-setup" element={<BrandSetup />} />
                  <Route path="/agency-setup" element={<AgencySetup />} />
                  <Route path="/promotion-details/:id" element={<PromotionDetailsPage />} />
                  <Route path="/promocion/:id/smart-contract" element={<PromotionSmartContractPage />} />
                  <Route path="/coupon/:couponId" element={<CouponPage />} />
                  <Route path="/categories" element={<CategoriesPage />} />
                  <Route path="/category/:categorySlug" element={<CategoryPage />} />
                  <Route path="/referral-system" element={<ReferralSystemPage />} />
                  <Route path="/create-promotion" element={<CreatePromotionWizard />} />
                  <Route path="/quick-promotion" element={<QuickPromotionPage />} />
                  <Route path="/add-promotion" element={<QuickPromotionPage />} />
                  <Route path="/marketplace" element={<PromotionsMarketplace />} />
                  <Route path="/brands" element={<BrandPage />} />
                  <Route path="/influencers" element={<InfluencersMarketplace />} />
                  <Route path="/influencer/:influencerSlug" element={<InfluencerProfilePage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/admin/dashboard" element={<SuperAdminDashboardPage />} />
                  <Route path="/admin/influencers" element={<InfluencerDashboard />} />
                  <Route path="/admin/brands" element={<BrandDashboard />} />
                  <Route path="/admin/agencies" element={<AgencyDashboard />} />
                  <Route path="/admin/api-docs" element={<ApiDocsPage />} />
                  <Route path="/api-docs" element={<ApiDocsPage />} />
                  <Route path="/admin/ocr-profile" element={<InfluencerOCRProfile />} />
                  <Route path="/admin/promotions" element={<DashboardLayout><PromotionsManagePage /></DashboardLayout>} />
                  <Route path="/kyc-form" element={<KYCForm />} />
                  <Route path="/kyc-success" element={<KYCSuccess />} />
                  <Route path="/create-coupon" element={<CreateCoupon />} />
                  <Route path="/signin" element={<SignInPage />} />
                  <Route path="/login" element={<SignInPage />} />
                  <Route path="/signup" element={<SignUpPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/dashboard/panel" element={<ProfileDashboardByRole />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            
            {/* Banner de Cookies - Aparece en todas las páginas */}
            <CookieBanner />
          </Router>
        </CartProvider>
      </GeolocationProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;