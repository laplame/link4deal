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