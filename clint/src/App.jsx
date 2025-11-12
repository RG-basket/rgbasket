import React, { useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { useappcontext } from "./context/appcontext.jsx";
import { serviceablePincodes } from "./assets/assets.js";
import { z } from "zod";

import { Toaster } from "react-hot-toast";

// Core Pages
import Home from "./pages/Home.jsx";
import CategoryPage from "./pages/CategoryPage.jsx";
import AllProducts from "./pages/Products.jsx";
import ProductsCategory from "./pages/ProductsCategory.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import Cart from "./pages/Cart.jsx";
import AddAddress from "./pages/AddAdress.jsx";
import MyOrders from "./pages/MyOrders.jsx";
import Orderdone from "./pages/OrderSuccess.jsx";
import ContactUs from "./pages/Contactus.jsx";
import NotFound from "./components/Fallbacks/NotFound.jsx";
import FAQs from "./pages/FAQs.jsx";
import ShippingReturns from "./pages/ShippingReturns.jsx";

import TermsOfService from "./pages/TermsOfService.jsx";
// Admin Pages
import AdminLogin from "./components/Admin/AdminLogin.jsx";
import AdminDashboard from "./components/Admin/AdminDashboard.jsx";
import AdminOrders from "./components/Admin/AdminOrders.jsx";
import AdminUsers from "./components/Admin/AdminUsers.jsx";
import AdminProducts from "./components/Admin/AdminProducts.jsx";
import ProductForm from "./components/Products/ProductForm.jsx";
import CategoryForm from "./components/Products/CategoryForm.jsx";
import AnalyticsDashboard from "./components/Admin/AnalyticsDashboard.jsx";

// Shared Components
import Navbar from "./components/Layout/navbar.jsx";
import Footer from "./components/Layout/Footer.jsx";
import Login from "./components/Auth/Login.jsx";
import Profile from "./components/User/Profile.jsx";
import CategoryStrip from "./components/Dashboard/CategoryStrip.jsx";
import ServiceabilityModal from "./components/Servicibility/servic.jsx";

const PincodeSchema = z.string().regex(/^\d{6}$/);

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
  const { showUserLogin, setShowUserLogin } = useappcontext();
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

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setShowUserLogin(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [setShowUserLogin]);

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <ScrollToTop />

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

      {/* Main content offset for fixed navbar + category strip */}
      <main className="flex-grow px-4 md:px-4 lg:px-16">
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

          {/* Admin Routes */}
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/products/new" element={<ProductForm />} />
          <Route path="/admin/products/edit/:id" element={<ProductForm />} />
          <Route path="/admin/categories/new" element={<CategoryForm />} />
        </Routes>
      </main>

      {!isAdminPath && <Footer />}
    </div>
  );
};

export default App;
