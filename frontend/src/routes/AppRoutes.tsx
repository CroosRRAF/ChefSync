import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { useApprovalStatus } from "@/hooks/useApprovalStatus";
import { GoogleOAuthProvider } from "@react-oauth/google";
import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

// Layout components
import CustomerDashboardLayout from "@/components/layout/CustomerDashboardLayout";
import CustomerHomeNavbar from "@/components/layout/CustomerHomeNavbar";
import Navbar from "@/components/layout/Navbar";
// New unified admin layout
import AdminLayout from "@/components/admin/layout/AdminLayout";

// Public pages
import About from "@/pages/About";
import Checkout from "@/pages/Checkout";
import Contact from "@/pages/Contact";
import DeliveryAddressTest from "@/pages/DeliveryAddressTest";
import Home from "@/pages/Home";
import Menu from "@/pages/Menu";
import NotFound from "@/pages/NotFound";

// Authentication pages
import ApprovalStatusPage from "@/pages/auth/ApprovalStatus";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ResetPassword from "@/pages/auth/ResetPassword";
import VerifyEmail from "@/pages/auth/VerifyEmail";

// Profile page - removed old generic profile, now using role-specific profiles

// Role-based pages
import CustomerCart from "@/pages/customer/Cart";
import CustomerDashboard from "@/pages/customer/Dashboard";
import CustomerOrders from "@/pages/customer/Orders";
import CustomerProfile from "@/pages/customer/Profile";
import CustomerSettings from "@/pages/customer/Settings";

import AllOrders from "@/pages/delivery/AllOrders";
import DeliveryDashboard from "@/pages/delivery/Dashboard";
import DeliveryMap from "@/pages/delivery/Map";
import DeliveryProfile from "@/pages/delivery/Profile";
import DeliverySchedule from "@/pages/delivery/Schedule";
import DeliverySettings from "@/pages/delivery/Settings";
import PickupNavigationDemo from "@/pages/demo/PickupNavigationDemo";

import CookLayout from "@/components/layout/CookLayout";
import CookBulkOrders from "@/pages/cook/BulkOrders";
import CookDashboard from "@/pages/cook/Dashboard";
import CookHome from "@/pages/cook/Home";
import CookMenu from "@/pages/cook/MenuNew";
import CookNotifications from "@/pages/cook/Notifications";
import CookOrders from "@/pages/cook/Order";
import CookProfile from "@/pages/cook/Profile";
import CookSettings from "@/pages/cook/Settings";

// New unified admin pages
import AdvancedAnalytics from "@/pages/admin/AdvancedAnalytics";
import AIReportsAutomation from "@/pages/admin/AIReportsAutomation";
import AdminAnalytics from "@/pages/admin/Analytics";
import AdminBackendIntegration from "@/pages/admin/BackendIntegration";
import AdminCommunication from "@/pages/admin/Communication";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminFeedbackManagement from "@/pages/admin/FeedbackManagement";
import AdminFoodMenuManagement from "@/pages/admin/FoodMenuManagement";
import MachineLearningIntegration from "@/pages/admin/MachineLearningIntegration";
import AdminManageUser from "@/pages/admin/ManageUser";
import AdminProfile from "@/pages/admin/Profile";
import AdminReports from "@/pages/admin/Reports";
import AdminSettings from "@/pages/admin/Settings";

// Check if we have a valid Google OAuth client ID
const hasValidGoogleClientId = () => {
  const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
  return (
    clientId &&
    clientId.trim() !== "" &&
    clientId !== "your-google-client-id" &&
    clientId !== "YOUR_NEW_GOOGLE_CLIENT_ID_HERE" &&
    clientId !==
      "123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com" &&
    clientId.includes(".apps.googleusercontent.com")
  );
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
  requireAuth = true,
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const {
    approvalStatus,
    isLoading: isCheckingApproval,
    canAccessDashboard,
  } = useApprovalStatus();

  // Show loading while checking authentication or approval status
  if (
    isLoading ||
    (user &&
      (user.role === "cook" || user.role === "delivery_agent") &&
      isCheckingApproval)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  // Check approval status for cooks and delivery agents
  if (
    user &&
    (user.role.toLowerCase() === "cook" ||
      user.role.toLowerCase() === "delivery_agent" ||
      user.role.toLowerCase() === "deliveryagent")
  ) {
    // Check if user has approval status in localStorage (from login attempt)
    const pendingUserData = localStorage.getItem("pending_user_data");
    if (pendingUserData) {
      try {
        const data = JSON.parse(pendingUserData);
        if (
          data.approval_status === "pending" ||
          data.approval_status === "rejected"
        ) {
          return <Navigate to="/approval-status" replace />;
        }
      } catch (error) {
        console.error("Error parsing pending user data:", error);
      }
    }

    // Check approval status from API
    if (approvalStatus && !canAccessDashboard) {
      return <Navigate to="/approval-status" replace />;
    }
  }

  if (
    allowedRoles.length > 0 &&
    user &&
    !allowedRoles
      .map((role) => role.toLowerCase())
      .includes(user.role.toLowerCase())
  ) {
    // Debug: Log role mismatch
    console.log(
      "Role mismatch - User role:",
      user.role,
      "Allowed roles:",
      allowedRoles
    );

    // Redirect based on user role
    switch (user.role.toLowerCase()) {
      case "customer":
        return <Navigate to="/customer/dashboard" replace />;
      case "cook":
        return <Navigate to="/cook/dashboard" replace />;
      case "delivery_agent":
      case "deliveryagent":
        return <Navigate to="/delivery/dashboard" replace />;
      case "admin":
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
    if (!isAuthenticated || !user) return "/";

    switch (user.role.toLowerCase()) {
      case "customer":
        return "/"; // Customers go to home page after login
      case "cook":
        return "/cook/dashboard";
      case "delivery_agent":
      case "deliveryagent":
        return "/delivery/dashboard";
      case "admin":
        return "/admin/dashboard";
      default:
        return "/";
    }
  };

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            isAuthenticated &&
            user &&
            user.role.toLowerCase() !== "customer" ? (
              <Navigate to={getDefaultRoute()} replace />
            ) : (
              <>
                {isAuthenticated &&
                user &&
                user.role.toLowerCase() === "customer" ? (
                  <CustomerHomeNavbar />
                ) : (
                  <Navbar />
                )}
                <Home />
              </>
            )
          }
        />
        <Route
          path="/menu"
          element={
            <>
              {isAuthenticated && user && user.role === "customer" ? (
                <CustomerHomeNavbar />
              ) : (
                <Navbar />
              )}
              <Menu />
            </>
          }
        />
        <Route
          path="/about"
          element={
            <>
              {isAuthenticated && user && user.role === "customer" ? (
                <CustomerHomeNavbar />
              ) : (
                <Navbar />
              )}
              <About />
            </>
          }
        />
        <Route
          path="/contact"
          element={
            <>
              {isAuthenticated && user && user.role === "customer" ? (
                <CustomerHomeNavbar />
              ) : (
                <Navbar />
              )}
              <Contact />
            </>
          }
        />
        <Route
          path="/checkout"
          element={
            <>
              {isAuthenticated && user && user.role === "customer" ? (
                <CustomerHomeNavbar />
              ) : (
                <Navbar />
              )}
              <Checkout />
            </>
          }
        />
        <Route
          path="/delivery-address-test"
          element={
            <>
              <Navbar />
              <DeliveryAddressTest />
            </>
          }
        />

        {/* Authentication Routes */}
        <Route
          path="/auth/login"
          element={
            <ProtectedRoute requireAuth={false}>
              {isAuthenticated ? (
                <Navigate to={getDefaultRoute()} replace />
              ) : (
                <>
                  <Navbar />
                  <Login />
                </>
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/auth/register"
          element={
            <ProtectedRoute requireAuth={false}>
              {isAuthenticated ? (
                <Navigate to={getDefaultRoute()} replace />
              ) : (
                <>
                  <Navbar />
                  <Register />
                </>
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/auth/forgot-password"
          element={
            <ProtectedRoute requireAuth={false}>
              <>
                <Navbar />
                <ForgotPassword />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/verify-email"
          element={
            <>
              <Navbar />
              <VerifyEmail />
            </>
          }
        />
        <Route
          path="/reset-password"
          element={
            <>
              <Navbar />
              <ResetPassword />
            </>
          }
        />
        <Route
          path="/approval-status"
          element={
            <ProtectedRoute requireAuth={false}>
              <ApprovalStatusPage />
            </ProtectedRoute>
          }
        />

        {/* Profile Route - removed old generic profile route, now using role-specific profiles */}

        {/* General Dashboard Route - Redirects to role-specific dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Navigate to={getDefaultRoute()} replace />
            </ProtectedRoute>
          }
        />

        {/* Customer Routes */}
        <Route
          path="/customer"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <Navigate to="/customer/dashboard" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/home"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <CustomerDashboardLayout>
                <CustomerDashboard />
              </CustomerDashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/dashboard"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <CustomerDashboardLayout>
                <CustomerDashboard />
              </CustomerDashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/orders"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <CustomerDashboardLayout>
                <CustomerOrders />
              </CustomerDashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/profile"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <CustomerDashboardLayout>
                <CustomerProfile />
              </CustomerDashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/settings"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <CustomerDashboardLayout>
                <CustomerSettings />
              </CustomerDashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/cart"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <CustomerDashboardLayout>
                <CustomerCart />
              </CustomerDashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Cook Routes */}
        <Route
          path="/cook"
          element={
            <ProtectedRoute allowedRoles={["cook"]}>
              <CookLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<CookDashboard />} />
          <Route path="bulk-orders" element={<CookBulkOrders />} />
          <Route path="home" element={<CookHome />} />
          <Route path="menu" element={<CookMenu />} />
          <Route path="orders" element={<CookOrders />} />
          <Route path="notifications" element={<CookNotifications />} />
          <Route path="profile" element={<CookProfile />} />
          <Route path="settings" element={<CookSettings />} />
        </Route>

        {/* Delivery Agent Routes */}
        <Route
          path="/delivery"
          element={
            <ProtectedRoute allowedRoles={["delivery_agent"]}>
              <Navigate to="/delivery/dashboard" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/delivery/dashboard"
          element={
            <ProtectedRoute allowedRoles={["delivery_agent"]}>
              <DeliveryDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/delivery/orders"
          element={
            <ProtectedRoute allowedRoles={["delivery_agent"]}>
              <AllOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/delivery/map"
          element={
            <ProtectedRoute allowedRoles={["delivery_agent"]}>
              <DeliveryMap />
            </ProtectedRoute>
          }
        />
        <Route
          path="/delivery/schedule"
          element={
            <ProtectedRoute allowedRoles={["delivery_agent"]}>
              <DeliverySchedule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/delivery/settings"
          element={
            <ProtectedRoute allowedRoles={["delivery_agent"]}>
              <DeliverySettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/delivery/profile"
          element={
            <ProtectedRoute allowedRoles={["delivery_agent"]}>
              <DeliveryProfile />
            </ProtectedRoute>
          }
        />

        {/* Demo Routes */}
        <Route
          path="/demo/pickup-navigation"
          element={<PickupNavigationDemo />}
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Navigate to="/admin/dashboard" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout>
                <AdminManageUser />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/manage-user"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout>
                <AdminManageUser />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        {/* TODO: Create AdminOrders page
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout>
                <AdminOrders />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        */}
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout>
                <AdminAnalytics />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout>
                <AdminSettings />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout>
                <AdminProfile />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout>
                <AdminReports />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/food"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout>
                <AdminFoodMenuManagement />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/food-menu-management"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout>
                <AdminFoodMenuManagement />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/communications"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout>
                <AdminCommunication />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/communication"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout>
                <AdminCommunication />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/feedback-management"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout>
                <AdminFeedbackManagement />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/backend-integration"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout>
                <AdminBackendIntegration />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics-backend"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout>
                <AdminBackendIntegration />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/advanced-analytics"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout>
                <AdvancedAnalytics />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/ai-analytics"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout>
                <AdvancedAnalytics />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/ai-reports"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout>
                <AIReportsAutomation />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports-automation"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout>
                <AIReportsAutomation />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/ml-integration"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout>
                <MachineLearningIntegration />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/machine-learning"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout>
                <MachineLearningIntegration />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

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
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <CartProvider>
          {isValidClientId ? (
            <GoogleOAuthProvider clientId={googleClientId}>
              <InnerRoutes />
            </GoogleOAuthProvider>
          ) : (
            <InnerRoutes />
          )}
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRoutes;
