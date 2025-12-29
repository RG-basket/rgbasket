import React, { useEffect, useState, Suspense, lazy } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { useAppContext } from "./context/AppContext.jsx";
import { serviceablePincodes } from "./assets/assets.js";
import { z } from "zod";

import { Toaster } from "react-hot-toast";

// Core Pages - Lazy Loaded
const Home = lazy(() => import("./pages/Home.jsx"));
const CategoryPage = lazy(() => import("./pages/CategoryPage.jsx"));
const AllProducts = lazy(() => import("./pages/Products.jsx"));
const ProductsCategory = lazy(() => import("./pages/ProductsCategory.jsx"));
const ProductDetails = lazy(() => import("./pages/ProductDetails.jsx"));
const Cart = lazy(() => import("./pages/Cart.jsx"));
const AddAddress = lazy(() => import("./pages/AddAdress.jsx"));
const MyOrders = lazy(() => import("./pages/MyOrders.jsx"));
const Orderdone = lazy(() => import("./pages/OrderSuccess.jsx"));
const ContactUs = lazy(() => import("./pages/Contactus.jsx"));
const NotFound = lazy(() => import("./components/Fallbacks/NotFound.jsx"));
const FAQs = lazy(() => import("./pages/FAQs.jsx"));
const ShippingReturns = lazy(() => import("./pages/ShippingReturns.jsx"));
const ProductSlotManager = lazy(() => import('./components/Admin/ProductSlotManagerDark.jsx'));

const TermsOfService = lazy(() => import("./pages/TermsOfService.jsx"));

// Admin Pages - Lazy Loaded
const AdminLogin = lazy(() => import("./components/Admin/AdminLogin.jsx"));
const AdminDashboard = lazy(() => import("./components/Admin/AdminDashboardDark.jsx"));
const AdminOrders = lazy(() => import("./components/Admin/AdminOrdersDark.jsx"));
const AdminUsers = lazy(() => import("./components/Admin/AdminUsersDark.jsx"));
const AdminProducts = lazy(() => import("./components/Admin/AdminProductsDark.jsx"));
const BulkPriceStockEditor = lazy(() => import("./components/Admin/BulkPriceStockEditorFixed.jsx"));
const ProductForm = lazy(() => import("./components/Admin/ProductFormDark.jsx"));
const CategoryForm = lazy(() => import("./components/Products/CategoryForm.jsx"));
const AnalyticsDashboard = lazy(() => import("./components/Admin/AnalyticsDashboard.jsx"));
const AdminCategories = lazy(() => import("./components/Admin/AdminCategoriesDark.jsx"));
const AdminPromoCodes = lazy(() => import("./components/Admin/AdminPromoCodesDark.jsx"));
const AdminBanners = lazy(() => import("./components/Admin/AdminBanners.jsx"));
const AdminOffers = lazy(() => import("./components/Admin/AdminOffersDark.jsx"));


const InfluencerDashboard = lazy(() => import("./pages/InfluencerDashboard.jsx"));

// Shared Components
import Navbar from "./components/Navbar/Navbar.jsx";
import Footer from "./components/Layout/Footer.jsx";
import Login from "./components/Auth/Login.jsx";
import Profile from "./components/User/Profile.jsx";
import CategoryStrip from "./components/Dashboard/CategoryStrip.jsx";
import ServiceabilityModal from "./components/Servicibility/servic.jsx";
import SlotManager from "./components/Admin/SlotManagerDark.jsx";
import ProtectedRoute from "./components/Auth/ProtectedRoute.jsx";
import LoginGuard from "./components/Auth/LoginGuard.jsx";
import InstallPopup from "./components/Install/InstallPopup.jsx";
import PhoneCollectionPopup from "./components/User/PhoneCollectionPopup.jsx";

const PincodeSchema = z.string().regex(/^\d{6}$/);

// Loading Fallback
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
  </div>
);

// ScrollToTop Component - Add this
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top on every route change
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });

    // Additional scroll reset for mobile devices
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
};

const App = () => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith("/admin");
  const { showUserLogin, setShowUserLogin } = useAppContext();
  const [showServiceabilityModal, setShowServiceabilityModal] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("userPincode");
    const isValid = PincodeSchema.safeParse(saved).success;
    const isServiced = serviceablePincodes.some(
      (entry) => entry.pincode === saved
    );
    if (!isValid || !isServiced) {
      setShowServiceabilityModal(true);
    }
  }, []);
  // Removed Escape key listener to strictly enforce "dismissible only via X button"
  // as per requirements.

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <ScrollToTop />
      {!isAdminPath && <LoginGuard />}
      {!isAdminPath && <InstallPopup />}
      {!isAdminPath && <PhoneCollectionPopup />}

      {!isAdminPath && (
        <>
          <Navbar onLocationClick={() => setShowServiceabilityModal(true)} />
          <CategoryStrip />
        </>
      )}

      {showUserLogin && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 sm:px-0 bg-white/60">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 relative border border-gray-200">
            <Login />
            <button
              onClick={() => setShowUserLogin(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
              aria-label="Close login"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {showServiceabilityModal && (
        <ServiceabilityModal
          onClose={() => setShowServiceabilityModal(false)}
        />
      )}

      <Toaster />

      {/* Main content - Remove padding for admin routes */}
      <main className={`flex-grow ${isAdminPath ? 'p-0' : 'px-4 md:px-4 lg:px-16'}`}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/category" element={<CategoryPage />} />
            <Route path="/products/all" element={<AllProducts />} />
            <Route path="/products/:category" element={<ProductsCategory />} />
            <Route path="/products/:category/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/add-address" element={<AddAddress />} />
            <Route path="/orders" element={<MyOrders />} />
            <Route path="/order-success" element={<Orderdone />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="*" element={<NotFound />} />
            <Route path="/faq" element={<FAQs />} />
            <Route path="/order" element={<ShippingReturns />} />

            <Route path="/terms" element={<TermsOfService />} />

            {/* Admin Routes - Note: AdminLayout is integrated within each admin component */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/orders" element={
              <ProtectedRoute>
                <AdminOrders />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute>
                <AdminUsers />
              </ProtectedRoute>
            } />
            <Route path="/admin/analytics" element={
              <ProtectedRoute>
                <AnalyticsDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/products" element={
              <ProtectedRoute>
                <AdminProducts />
              </ProtectedRoute>
            } />
            <Route path="/admin/products/bulk-edit" element={
              <ProtectedRoute>
                <BulkPriceStockEditor />
              </ProtectedRoute>
            } />
            <Route path="/admin/products/new" element={
              <ProtectedRoute>
                <ProductForm />
              </ProtectedRoute>
            } />
            <Route path="/admin/products/edit/:id" element={
              <ProtectedRoute>
                <ProductForm />
              </ProtectedRoute>
            } />
            <Route path="/admin/categories/new" element={
              <ProtectedRoute>
                <CategoryForm />
              </ProtectedRoute>
            } />
            <Route path="/admin/categories" element={
              <ProtectedRoute>
                <AdminCategories />
              </ProtectedRoute>
            } />
            <Route path="/admin/product-slots" element={
              <ProtectedRoute>
                <ProductSlotManager />
              </ProtectedRoute>
            } />
            <Route path="/admin/slots" element={
              <ProtectedRoute>
                <SlotManager />
              </ProtectedRoute>
            } />
            <Route path="/admin/promocodes" element={
              <ProtectedRoute>
                <AdminPromoCodes />
              </ProtectedRoute>
            } />
            <Route path="/admin/banners" element={
              <ProtectedRoute>
                <AdminBanners />
              </ProtectedRoute>
            } />
            <Route path="/admin/offers" element={
              <ProtectedRoute>
                <AdminOffers />
              </ProtectedRoute>
            } />


            {/* Influencer Route */}
            <Route path="/influencer/:routeName" element={<InfluencerDashboard />} />

            <Route path="/admin/servicibility" element={
              <ProtectedRoute>
                <ServiceabilityModal />
              </ProtectedRoute>
            } />
          </Routes>
        </Suspense>
      </main>

      {!isAdminPath && <Footer />}
    </div>
  );
};

export default App;