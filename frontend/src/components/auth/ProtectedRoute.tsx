import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader } from '@/components/common/Loader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Loader />;
  }

  if (!isAuthenticated || !user) {
    // Redirect to login and save the attempted path
    localStorage.setItem('auth_redirect_after', location.pathname);
    return <Navigate to="/auth/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // If user's role doesn't match, redirect to their appropriate dashboard
    const rolePath = getRoleBasedPath(user.role);
    return <Navigate to={rolePath} replace />;
  }

  return <>{children}</>;
};

function getRoleBasedPath(role: string): string {
  switch (role) {
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
}

export default ProtectedRoute;
