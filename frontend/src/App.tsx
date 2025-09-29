import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { CartProvider } from "@/context/CartContext";
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from "@/components/layout/Navbar";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Checkout from "./pages/Checkout";
import Login from "./pages/auth/Login";
import NotFound from "./pages/NotFound";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ResetPassword from "./pages/auth/ResetPassword";
import ModernDashboard from "./pages/admin/ModernDashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import AdminAnalytics from "./pages/admin/Analytics";
import CustomerDashboard from "./pages/customer/Dashboard";
import CustomerProfile from "./pages/customer/Profile";
import CustomerCart from "./pages/customer/Cart";
import CustomerOrders from "./pages/customer/Orders";
// import FloatingCart from "./components/cart/FloatingCart";

const queryClient = new QueryClient();

// Component to conditionally render navbar
const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdminRoute && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin/dashboard" element={<ModernDashboard />} />
        <Route path="/admin/enhanced-dashboard" element={<ModernDashboard />} />
        <Route path="/admin/manage-users" element={<ManageUsers />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/customer/dashboard" element={<CustomerDashboard />} />
        <Route path="/customer/profile" element={<CustomerProfile />} />
        <Route path="/customer/cart" element={<CustomerCart />} />
        <Route path="/customer/orders" element={<CustomerOrders />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* Global Floating Cart - appears on all pages except admin */}
      {/* {!isAdminRoute && <FloatingCart />} */}
    </>
  );
};

// Check if we have a valid Google OAuth client ID
const hasValidGoogleClientId = () => {
  const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
  return clientId && 
         clientId.trim() !== '' &&
         clientId !== 'your-google-client-id' && 
         clientId !== 'YOUR_NEW_GOOGLE_CLIENT_ID_HERE' &&
         clientId !== '123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com' &&
         clientId.includes('.apps.googleusercontent.com');
};

const App = () => {
  const googleClientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
  const isValidClientId = hasValidGoogleClientId();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <AuthProvider>
            <CartProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                {isValidClientId ? (
                  <GoogleOAuthProvider clientId={googleClientId}>
                    <AppContent />
                  </GoogleOAuthProvider>
                ) : (
                  <AppContent />
                )}
              </TooltipProvider>
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;