import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

// Layout components
import Navbar from '@/components/layout/Navbar';

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

// Profile page
import Profile from '@/pages/Profile';

// Role-based pages
import CustomerDashboard from '@/pages/customer/Dashboard';
import CustomerOrders from '@/pages/customer/Orders';
import CustomerProfile from '@/pages/customer/Profile';
import CustomerSettings from '@/pages/customer/Settings';

import AdminDashboard from '@/pages/admin/Dashboard';
import AdminManageUsers from '@/pages/admin/ManageUsers';
import AdminOrders from '@/pages/admin/Orders';
import AdminAnalytics from '@/pages/admin/Analytics';
import AdminSettings from '@/pages/admin/Settings';
import AdminNotifications from '@/pages/admin/Notifications';
import AdminReports from '@/pages/admin/Reports';

import DeliveryDashboard from '@/pages/delivery/Dashboard';
import DeliveryDeliveries from '@/pages/delivery/Deliveries';
import DeliveryMap from '@/pages/delivery/Map';
import DeliverySchedule from '@/pages/delivery/Schedule';
import DeliverySettings from '@/pages/delivery/Settings';

import CookDashboard from '@/pages/cook/Dashboard';
import CookKitchen from '@/pages/cook/Kitchen';
import CookOrders from '@/pages/cook/Orders';
import CookSchedule from '@/pages/cook/Schedule';
import CookSettings from '@/pages/cook/Settings';

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
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'cook':
        return <Navigate to="/cook/dashboard" replace />;
      case 'delivery_agent':
        return <Navigate to="/delivery/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

// Main App Routes Component
const AppRoutes: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  // Get default route based on user role
  const getDefaultRoute = () => {
    if (!isAuthenticated || !user) return '/';
    
    switch (user.role) {
      case 'customer':
        return '/customer/dashboard';
      case 'admin':
        return '/admin/dashboard';
      case 'cook':
        return '/cook/dashboard';
      case 'delivery_agent':
        return '/delivery/dashboard';
      default:
        return '/';
    }
  };

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          isAuthenticated && user ? <Navigate to={getDefaultRoute()} replace /> : <Home />
        } />
        <Route path="/menu" element={<Menu />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        
        {/* Authentication Routes */}
        <Route path="/auth/login" element={
          <ProtectedRoute requireAuth={false}>
            {isAuthenticated ? <Navigate to={getDefaultRoute()} replace /> : <Login />}
          </ProtectedRoute>
        } />
        <Route path="/auth/register" element={
          <ProtectedRoute requireAuth={false}>
            {isAuthenticated ? <Navigate to={getDefaultRoute()} replace /> : <Register />}
          </ProtectedRoute>
        } />
        <Route path="/auth/forgot-password" element={
          <ProtectedRoute requireAuth={false}>
            <ForgotPassword />
          </ProtectedRoute>
        } />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Profile Route */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />

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
        <Route path="/customer/dashboard" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/customer/orders" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerOrders />
          </ProtectedRoute>
        } />
        <Route path="/customer/profile" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerProfile />
          </ProtectedRoute>
        } />
        <Route path="/customer/settings" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerSettings />
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
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/manage-users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminManageUsers />
          </ProtectedRoute>
        } />
        <Route path="/admin/orders" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminOrders />
          </ProtectedRoute>
        } />
        <Route path="/admin/analytics" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminAnalytics />
          </ProtectedRoute>
        } />
        <Route path="/admin/settings" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminSettings />
          </ProtectedRoute>
        } />
        <Route path="/admin/notifications" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminNotifications />
          </ProtectedRoute>
        } />
        <Route path="/admin/reports" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminReports />
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

        {/* Catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default AppRoutes;
