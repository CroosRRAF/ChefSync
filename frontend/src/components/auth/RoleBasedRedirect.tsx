import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ChefHat, Truck, User, Shield } from 'lucide-react';

interface RoleBasedRedirectProps {
  children?: React.ReactNode;
}

const RoleBasedRedirect: React.FC<RoleBasedRedirectProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated && user) {
      const storedRedirect = localStorage.getItem('auth_redirect');
      const afterLoginRedirect = localStorage.getItem('auth_redirect_after');
      const roleRoute = storedRedirect || getRoleRoute(user.role);
      const currentPath = location.pathname;
      
      // First check for post-login redirect
      if (afterLoginRedirect && isAllowedPath(afterLoginRedirect, user.role)) {
        localStorage.removeItem('auth_redirect_after');
        navigate(afterLoginRedirect, { replace: true });
        return;
      }

      // Check if user is trying to access wrong role's routes
      if (!isAllowedPath(currentPath, user.role)) {
        navigate(roleRoute, { replace: true });
        return;
      }
      
      // Redirect from auth pages or root to dashboard
      if (roleRoute && (
          currentPath === '/' || 
          currentPath === '/login' || 
          currentPath === '/register' || 
          currentPath === '/auth/login' || 
          currentPath === '/auth/register'
        )) {
        localStorage.removeItem('auth_redirect');
        navigate(roleRoute, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location]);

  const isAllowedPath = (path: string, role: string): boolean => {
    const rolePrefix = `/${role}`;
    
    // Public paths are always allowed
    if (['/login', '/register', '/auth/login', '/auth/register', '/', '/about', '/contact', '/menu'].includes(path)) {
      return true;
    }

    // Check if path matches user's role
    if (path.startsWith(rolePrefix)) {
      return true;
    }

    return false;
  };

  const getRoleRoute = (role: string) => {
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
        return null;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'customer':
        return <User className="h-8 w-8" />;
      case 'cook':
        return <ChefHat className="h-8 w-8" />;
      case 'delivery_agent':
        return <Truck className="h-8 w-8" />;
      case 'admin':
        return <Shield className="h-8 w-8" />;
      default:
        return <User className="h-8 w-8" />;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'customer':
        return 'Access your orders, profile, and food preferences';
      case 'cook':
        return 'Manage kitchen operations and food preparation';
      case 'delivery_agent':
        return 'Track deliveries and manage your schedule';
      case 'admin':
        return 'Manage system operations and user accounts';
      default:
        return 'Access your personalized dashboard';
    }
  };

  if (!isAuthenticated || !user) {
    return <>{children}</>;
  }

  // If user is on home page, show role-based redirect
  if (window.location.pathname === '/') {
    const roleRoute = getRoleRoute(user.role);
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full text-primary">
                {getRoleIcon(user.role)}
              </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-2">
              Welcome back, {user.name}!
            </h2>
            
            <p className="text-muted-foreground mb-6">
              {getRoleDescription(user.role)}
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => navigate(roleRoute!)}
                className="w-full"
                size="lg"
              >
                Go to Dashboard
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
                className="w-full"
              >
                Stay on Home Page
              </Button>
            </div>
            
            <div className="mt-6 pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                You'll be automatically redirected to your dashboard in 5 seconds...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleBasedRedirect;
