import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { 
  Menu, 
  User, 
  ShoppingCart, 
  Sun, 
  Moon, 
  LogOut,
  Settings,
  Heart,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.svg';

interface NavbarProps {
  className?: string;
}

const Navbar: React.FC<NavbarProps> = ({ className }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartItems, setCartItems] = useState(0); // TODO: Connect to cart context
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAuthAction = () => {
    if (isAuthenticated) {
      logout();
    } else {
      navigate('/auth/login');
    }
  };

  const getRoleBasedDashboard = () => {
    if (!user) return '/';
    
    switch (user.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'cook':
        return '/cook/dashboard';
      case 'delivery_agent':
        return '/delivery/dashboard';
      default:
        return '/customer/dashboard';
    }
  };

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Menu', href: '/menu' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <header 
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'navbar-blur'
          : 'bg-background/95 border-b shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80',
        className
      )}
    >
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 group"
          >
            <img 
              src={logo} 
              alt="ChefSync Logo" 
              className="w-8 h-8 rounded-lg"
            />
            <span className="text-xl font-bold text-gradient-primary">
              ChefSync
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  location.pathname === link.href
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Search Button */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex"
              onClick={() => navigate('/menu')}
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="hidden sm:flex"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>

            {/* Cart Button */}
            {isAuthenticated && user?.role === 'customer' && (
              <Button
                variant="ghost"
                size="sm"
                className="relative"
                onClick={() => navigate('/customer/cart')}
              >
                <ShoppingCart className="h-4 w-4" />
                {cartItems > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {cartItems}
                  </Badge>
                )}
              </Button>
            )}

            {/* Desktop Auth Actions */}
            <div className="hidden md:flex items-center space-x-2">
              {isAuthenticated ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-1"
                    onClick={() => {
                      if (user?.role === 'customer') {
                        navigate('/customer/dashboard');
                      }
                    }}
                  >
                    <User className="h-4 w-4" />
                    <span className="text-sm">{user?.name}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/auth/login')}
                  >
                    Sign In
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => navigate('/auth/register')}
                    className="button-gradient-primary"
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <h2 className="sr-only">Mobile menu</h2>
                <p className="sr-only">Navigation drawer with links and actions</p>
                <div className="flex flex-col h-full">
                  {/* Mobile Logo */}
                  <div className="flex items-center space-x-2 pb-6 border-b">
                    <img 
                      src={logo} 
                      alt="ChefSync Logo" 
                      className="w-8 h-8 rounded-lg"
                    />
                    <span className="text-xl font-bold text-gradient-primary">
                      ChefSync
                    </span>
                  </div>

                  {/* Mobile Navigation Links */}
                  <div className="flex flex-col space-y-4 py-6">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        className={cn(
                          'text-base font-medium transition-colors hover:text-primary px-2 py-1',
                          location.pathname === link.href
                            ? 'text-primary'
                            : 'text-muted-foreground'
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>

                  {/* Mobile Auth Section */}
                  <div className="mt-auto space-y-4 pt-6 border-t">
                    {isAuthenticated ? (
                      <>
                        <div 
                          className="flex items-center space-x-3 p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                          onClick={() => {
                            if (user?.role === 'customer') {
                              navigate('/customer/dashboard');
                            }
                          }}
                        >
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
                            {user?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{user?.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{user?.role?.replace('_', ' ')}</p>
                          </div>
                        </div>
                        
                        
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-destructive hover:text-destructive"
                          onClick={logout}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => navigate('/auth/login')}
                        >
                          Sign In
                        </Button>
                        <Button
                          className="w-full button-gradient-primary"
                          onClick={() => navigate('/auth/register')}
                        >
                          Get Started
                        </Button>
                      </>
                    )}
                    
                    {/* Theme Toggle in Mobile */}
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={toggleTheme}
                    >
                      {theme === 'light' ? (
                        <>
                          <Moon className="h-4 w-4 mr-2" />
                          Dark Mode
                        </>
                      ) : (
                        <>
                          <Sun className="h-4 w-4 mr-2" />
                          Light Mode
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;