import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { GeolocationProvider } from './context/GeolocationContext';
import ErrorBoundary from './components/ErrorBoundary';
import { routerConfig } from './config/router';
import CookieBanner from './components/CookieBanner';
import GtmRouteTracker from './components/analytics/GtmRouteTracker';
import InfluencerAttributionTracker from './components/analytics/InfluencerAttributionTracker';
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
import ChainLocationsBulkPage from './pages/ChainLocationsBulkPage';
import QuickPromotionPage from './pages/QuickPromotionPage';
import PromotionsMarketplace from './pages/PromotionsMarketplace';
import PromotionsZonePage from './pages/PromotionsZonePage';
import { BrandPage } from './pages/BrandPage';
import BrandProfilePage from './pages/BrandProfilePage';
import BizneShopProfilePage from './pages/BizneShopProfilePage';
import BizneStoresPage from './pages/BizneStoresPage';
import InfluencersMarketplace from './pages/InfluencersMarketplace';
import InfluencerWaitlistLandingPage from './pages/InfluencerWaitlistLandingPage';
import InfluencerProfilePage from './pages/InfluencerProfilePage';
import InfluencerProfileEditPage from './pages/InfluencerProfileEditPage';
import InfluencerAuthPage from './pages/InfluencerAuthPage';
import FaqPage from './pages/FaqPage';
import TermsPage from './pages/TermsPage';
import InfluencerStorePage from './pages/InfluencerStorePage';
import InfluencerPromoPage from './pages/InfluencerPromoPage';
import InfluencerAuctionsLivePage from './pages/InfluencerAuctionsLivePage';
import RedemptionsLivePage from './pages/RedemptionsLivePage';
import InfluencerOCRProfile from './pages/InfluencerOCRProfile';
import KYCForm from './pages/KYCForm';
import KYCSuccess from './pages/KYCSuccess';
import CreateCoupon from './pages/CreateCoupon';
import AdminPage from './pages/AdminPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import PlatformSuperuserSuitePage from './pages/PlatformSuperuserSuitePage';
import { SuperuserOnlyRoute } from './components/auth/SuperuserOnlyRoute';
import CartPage from './pages/CartPage';
import BusinessLanding from './pages/BusinessLanding';
import DigitalCommissionerLanding from './pages/DigitalCommissionerLanding';
import Link4DealEconomyLanding from './pages/Link4DealEconomyLanding';
import CheckoutPage from './pages/CheckoutPage';
import CheckoutSuccess from './pages/CheckoutSuccess';
import InfluencerHubDemoPage from './pages/demo/InfluencerHubDemoPage';
import InfluencerDashboardPage from './pages/InfluencerDashboardPage';
import BrandDashboardPage from './pages/BrandDashboardPage';
import AgencyDashboardPage from './pages/AgencyDashboardPage';
import AdminInfluencersPage from './pages/admin/AdminInfluencersPage';
import AdminBrandsPage from './pages/admin/AdminBrandsPage';
import AdminAgenciesPage from './pages/admin/AdminAgenciesPage';
import BrandApplicationsDashboardPage from './pages/BrandApplicationsDashboardPage';
import ProfileDashboardByRole from './pages/dashboards/ProfileDashboardByRole';
import PromotionsManagePage from './pages/dashboards/PromotionsManagePage';
import SuperAdminDashboardPage from './pages/dashboards/SuperAdminDashboardPage';
import AdminCrmHubPage from './pages/admin/AdminCrmHubPage';
import AdminPromotionApplicationsPage from './pages/admin/AdminPromotionApplicationsPage';
import InfluencerCrmPage from './pages/admin/InfluencerCrmPage';
import AdminInfluencerProfilesPage from './pages/admin/AdminInfluencerProfilesPage';
import InstagramLeadsCrmPage from './pages/admin/InstagramLeadsCrmPage';
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
              <GtmRouteTracker />
              <InfluencerAttributionTracker />
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
                  <Route path="/demo/influencer-dashboard" element={<InfluencerHubDemoPage />} />
                  <Route path="/user-type-selector" element={<UserTypeSelector />} />
                  <Route path="/influencer-setup" element={<Navigate to="/influencer/setup" replace />} />
                  <Route path="/brand-setup" element={<Navigate to="/brands/setup" replace />} />
                  <Route path="/agency-setup" element={<Navigate to="/agency/setup" replace />} />
                  <Route path="/promotion-details/:id" element={<PromotionDetailsPage />} />
                  <Route path="/promo/:id" element={<PromotionDetailsPage />} />
                  <Route path="/promocion/:id/smart-contract" element={<PromotionSmartContractPage />} />
                  <Route path="/coupon/:couponId" element={<CouponPage />} />
                  <Route path="/categories" element={<CategoriesPage />} />
                  <Route path="/category/:categorySlug" element={<CategoryPage />} />
                  <Route path="/referral-system" element={<ReferralSystemPage />} />
                  <Route path="/create-promotion" element={<CreatePromotionWizard />} />
                  <Route path="/importar-sucursales" element={<ChainLocationsBulkPage />} />
                  <Route path="/quick-promotion" element={<QuickPromotionPage />} />
                  <Route path="/add-promotion" element={<QuickPromotionPage />} />
                  <Route path="/marketplace" element={<PromotionsMarketplace />} />
                  <Route path="/promociones/:zoneSlug" element={<PromotionsZonePage />} />
                  <Route path="/brand/aplicaciones" element={<Navigate to="/brands/aplicaciones" replace />} />
                  <Route path="/brands" element={<BrandPage />} />
                  <Route path="/brands/setup" element={<BrandSetup />} />
                  <Route path="/brands/aplicaciones" element={<BrandApplicationsDashboardPage />} />
                  <Route path="/brands/panel" element={<BrandDashboardPage />} />
                  <Route path="/tiendas" element={<BizneStoresPage />} />
                  <Route path="/brand/:brandId" element={<BrandProfilePage />} />
                  <Route path="/shop/bizne/:shopId" element={<BizneShopProfilePage />} />
                  <Route path="/influencers" element={<Navigate to="/influencer" replace />} />
                  <Route path="/influencer" element={<InfluencersMarketplace />} />
                  <Route path="/influencer/waitlist" element={<InfluencerWaitlistLandingPage />} />
                  <Route path="/influencer/setup" element={<InfluencerSetup />} />
                  <Route path="/influencer/panel" element={<InfluencerDashboardPage />} />
                  <Route path="/faq" element={<FaqPage />} />
                  <Route path="/terminos" element={<TermsPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/terminos-y-condiciones" element={<TermsPage />} />
                  <Route path="/influencer/auth" element={<InfluencerAuthPage />} />
                  <Route path="/app/influencer/auth" element={<InfluencerAuthPage />} />
                  <Route path="/subastas" element={<InfluencerAuctionsLivePage />} />
                  <Route path="/redenciones-en-vivo" element={<RedemptionsLivePage />} />
                  <Route path="/influencer/:influencerSlug" element={<InfluencerProfilePage />} />
                  <Route path="/influencer/:influencerSlug/edit" element={<InfluencerProfileEditPage />} />
                  <Route path="/influencer/:influencerSlug/faq" element={<FaqPage />} />
                  <Route path="/influencer/:influencerSlug/tienda" element={<InfluencerStorePage />} />
                  <Route
                    path="/influencer/:influencerSlug/promo/:promotionId"
                    element={<InfluencerPromoPage />}
                  />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/admin/dashboard" element={<SuperAdminDashboardPage />} />
                  <Route path="/admin/crm" element={<AdminCrmHubPage />} />
                  <Route path="/admin/crm/pipeline" element={<InfluencerCrmPage />} />
                  <Route path="/admin/crm/applications" element={<AdminPromotionApplicationsPage />} />
                  <Route path="/admin/crm/influencers" element={<AdminInfluencerProfilesPage />} />
                  <Route path="/admin/crm/instagram-leads" element={<InstagramLeadsCrmPage />} />
                  <Route path="/dashboard/crm" element={<Navigate to="/admin/crm" replace />} />
                  <Route path="/dashboard/influencer" element={<Navigate to="/influencer/panel" replace />} />
                  <Route path="/dashboard/brand" element={<Navigate to="/brands/panel" replace />} />
                  <Route path="/dashboard/agency" element={<Navigate to="/agency" replace />} />
                  <Route path="/agency" element={<AgencyDashboardPage />} />
                  <Route path="/agency/setup" element={<AgencySetup />} />
                  <Route path="/admin/influencers" element={<AdminInfluencersPage />} />
                  <Route path="/admin/brands" element={<AdminBrandsPage />} />
                  <Route path="/admin/agencies" element={<AdminAgenciesPage />} />
                  <Route path="/admin/api-docs" element={<ApiDocsPage />} />
                  <Route path="/api-docs" element={<ApiDocsPage />} />
                  <Route path="/admin/ocr-profile" element={<InfluencerOCRProfile />} />
                  <Route path="/admin/promotions" element={<DashboardLayout><PromotionsManagePage /></DashboardLayout>} />
                  <Route path="/kyc-form" element={<KYCForm />} />
                  <Route path="/kyc-success" element={<KYCSuccess />} />
                  <Route path="/create-coupon" element={<CreateCoupon />} />
                  <Route path="/signin" element={<SignInPage />} />
                  <Route path="/login" element={<SignInPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/signup" element={<SignUpPage />} />
                  <Route
                    path="/dashboard"
                    element={
                      <SuperuserOnlyRoute>
                        <DashboardPage />
                      </SuperuserOnlyRoute>
                    }
                  />
                  <Route path="/dashboard/suite" element={<PlatformSuperuserSuitePage />} />
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