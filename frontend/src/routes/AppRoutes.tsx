import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthProvider } from '@/context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Layout components
import Navbar from '@/components/layout/Navbar';
import AdminLayout from '@/components/layout/AdminLayout';

// Public pages
import Home from '@/pages/Home';
import Menu from '@/pages/Menu';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import NotFound from '@/pages/NotFound';

// Authentication pages
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import VerifyEmail from '@/pages/auth/VerifyEmail';
import ResetPassword from '@/pages/auth/ResetPassword';

// Profile page - removed old generic profile, now using role-specific profiles

// Role-based pages
import CustomerDashboard from '@/pages/customer/Dashboard';
import CustomerOrders from '@/pages/customer/Orders';
import CustomerProfile from '@/pages/customer/Profile';
import CustomerSettings from '@/pages/customer/Settings';

import DeliveryDashboard from '@/pages/delivery/Dashboard';
import DeliveryDeliveries from '@/pages/delivery/Deliveries';
import DeliveryMap from '@/pages/delivery/Map';
import DeliverySchedule from '@/pages/delivery/Schedule';
import DeliverySettings from '@/pages/delivery/Settings';
import DeliveryProfile from '@/pages/delivery/Profile';

import CookDashboard from '@/pages/cook/Dashboard';
import CookKitchen from '@/pages/cook/Kitchen';
import CookOrders from '@/pages/cook/Orders';
import CookSchedule from '@/pages/cook/Schedule';
import CookSettings from '@/pages/cook/Settings';
import CookProfile from '@/pages/cook/Profile';

// Admin pages
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminManageUsers from '@/pages/admin/ManageUsers';
import AdminOrders from '@/pages/admin/Orders';
import AdminAnalytics from '@/pages/admin/Analytics';
import AdminSettings from '@/pages/admin/Settings';
import AdminProfile from '@/pages/admin/Profile';
import AdminReports from '@/pages/admin/Reports';

// Check if we have a valid Google OAuth client ID
const hasValidGoogleClientId = () => {
  const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
  return clientId && 
         clientId !== 'your-google-client-id' && 
         clientId !== 'YOUR_NEW_GOOGLE_CLIENT_ID_HERE' &&
         clientId !== '123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com' &&
         clientId.includes('.apps.googleusercontent.com');
};

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [], 
  requireAuth = true 
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    // Redirect based on user role
    switch (user.role) {
      case 'customer':
        return <Navigate to="/customer/dashboard" replace />;
      case 'cook':
        return <Navigate to="/cook/dashboard" replace />;
      case 'delivery_agent':
        return <Navigate to="/delivery/dashboard" replace />;
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

// Inner Routes Component that uses useAuth
const InnerRoutes: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  // Get default route based on user role
  const getDefaultRoute = () => {
    if (!isAuthenticated || !user) return '/';
    
    switch (user.role) {
      case 'customer':
        return '/customer/dashboard';
      case 'cook':
        return '/cook/dashboard';
      case 'delivery_agent':
        return '/delivery/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/';
    }
  };

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          isAuthenticated && user && user.role !== 'customer' ? 
            <Navigate to={getDefaultRoute()} replace /> : 
            <>
              <Navbar />
              <Home />
            </>
        } />
        <Route path="/menu" element={
          <>
            <Navbar />
            <Menu />
          </>
        } />
        <Route path="/about" element={
          <>
            <Navbar />
            <About />
          </>
        } />
        <Route path="/contact" element={
          <>
            <Navbar />
            <Contact />
          </>
        } />
        
        {/* Authentication Routes */}
        <Route path="/auth/login" element={
          <ProtectedRoute requireAuth={false}>
            {isAuthenticated ? <Navigate to={getDefaultRoute()} replace /> : 
              <>
                <Navbar />
                <Login />
              </>
            }
          </ProtectedRoute>
        } />
        <Route path="/auth/register" element={
          <ProtectedRoute requireAuth={false}>
            {isAuthenticated ? <Navigate to={getDefaultRoute()} replace /> : 
              <>
                <Navbar />
                <Register />
              </>
            }
          </ProtectedRoute>
        } />
        <Route path="/auth/forgot-password" element={
          <ProtectedRoute requireAuth={false}>
            <>
              <Navbar />
              <ForgotPassword />
            </>
          </ProtectedRoute>
        } />
        <Route path="/verify-email" element={
          <>
            <Navbar />
            <VerifyEmail />
          </>
        } />
        <Route path="/reset-password" element={
          <>
            <Navbar />
            <ResetPassword />
          </>
        } />
        
        {/* Profile Route - removed old generic profile route, now using role-specific profiles */}

        {/* General Dashboard Route - Redirects to role-specific dashboard */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Navigate to={getDefaultRoute()} replace />
          </ProtectedRoute>
        } />

        {/* Customer Routes */}
        <Route path="/customer" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <Navigate to="/customer/dashboard" replace />
          </ProtectedRoute>
        } />
        <Route path="/customer/home" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <>
              <Navbar />
              <CustomerDashboard />
            </>
          </ProtectedRoute>
        } />
        <Route path="/customer/dashboard" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <>
              <Navbar />
              <CustomerDashboard />
            </>
          </ProtectedRoute>
        } />
        <Route path="/customer/orders" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <>
              <Navbar />
              <CustomerOrders />
            </>
          </ProtectedRoute>
        } />
        <Route path="/customer/profile" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <>
              <Navbar />
              <CustomerProfile />
            </>
          </ProtectedRoute>
        } />
        <Route path="/customer/settings" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <>
              <Navbar />
              <CustomerSettings />
            </>
          </ProtectedRoute>
        } />

        {/* Cook Routes */}
        <Route path="/cook" element={
          <ProtectedRoute allowedRoles={['cook']}>
            <Navigate to="/cook/dashboard" replace />
          </ProtectedRoute>
        } />
        <Route path="/cook/dashboard" element={
          <ProtectedRoute allowedRoles={['cook']}>
            <CookDashboard />
          </ProtectedRoute>
        } />
        <Route path="/cook/kitchen" element={
          <ProtectedRoute allowedRoles={['cook']}>
            <CookKitchen />
          </ProtectedRoute>
        } />
        <Route path="/cook/orders" element={
          <ProtectedRoute allowedRoles={['cook']}>
            <CookOrders />
          </ProtectedRoute>
        } />
        <Route path="/cook/schedule" element={
          <ProtectedRoute allowedRoles={['cook']}>
            <CookSchedule />
          </ProtectedRoute>
        } />
        <Route path="/cook/settings" element={
          <ProtectedRoute allowedRoles={['cook']}>
            <CookSettings />
          </ProtectedRoute>
        } />
        <Route path="/cook/profile" element={
          <ProtectedRoute allowedRoles={['cook']}>
            <CookProfile />
          </ProtectedRoute>
        } />

        {/* Delivery Agent Routes */}
        <Route path="/delivery" element={
          <ProtectedRoute allowedRoles={['delivery_agent']}>
            <Navigate to="/delivery/dashboard" replace />
          </ProtectedRoute>
        } />
        <Route path="/delivery/dashboard" element={
          <ProtectedRoute allowedRoles={['delivery_agent']}>
            <DeliveryDashboard />
          </ProtectedRoute>
        } />
        <Route path="/delivery/deliveries" element={
          <ProtectedRoute allowedRoles={['delivery_agent']}>
            <DeliveryDeliveries />
          </ProtectedRoute>
        } />
        <Route path="/delivery/map" element={
          <ProtectedRoute allowedRoles={['delivery_agent']}>
            <DeliveryMap />
          </ProtectedRoute>
        } />
        <Route path="/delivery/schedule" element={
          <ProtectedRoute allowedRoles={['delivery_agent']}>
            <DeliverySchedule />
          </ProtectedRoute>
        } />
        <Route path="/delivery/settings" element={
          <ProtectedRoute allowedRoles={['delivery_agent']}>
            <DeliverySettings />
          </ProtectedRoute>
        } />
        <Route path="/delivery/profile" element={
          <ProtectedRoute allowedRoles={['delivery_agent']}>
            <DeliveryProfile />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Navigate to="/admin/dashboard" replace />
          </ProtectedRoute>
        } />
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout>
              <AdminManageUsers />
            </AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/orders" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout>
              <AdminOrders />
            </AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/analytics" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout>
              <AdminAnalytics />
            </AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/settings" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout>
              <AdminSettings />
            </AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/profile" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout>
              <AdminProfile />
            </AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/reports" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout>
              <AdminReports />
            </AdminLayout>
          </ProtectedRoute>
        } />

        {/* Catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

// Main App Routes Component
const AppRoutes: React.FC = () => {
  const googleClientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
  const isValidClientId = hasValidGoogleClientId();

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AuthProvider>
        {isValidClientId ? (
          <GoogleOAuthProvider clientId={googleClientId}>
            <InnerRoutes />
          </GoogleOAuthProvider>
        ) : (
          <InnerRoutes />
        )}
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRoutes;
