import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import LocationModal from '@/components/customer/LocationModal';
import { useLocation as useLocationContext } from '@/context/LocationContext';
import navbarLogo from '@/assets/images/hero/navbarlogo.png';
import { 
  ShoppingCart, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Home,
  Package,
  Bell,
  Search,
  LayoutDashboard,
  MapPin
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const CustomerNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { location: locationContext, setLocation: setLocationContext } = useLocationContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleLocationSelect = (newLocation: { address: string; latitude: number; longitude: number; }) => {
    setLocationContext(newLocation);
    setIsLocationModalOpen(false);
  };

  const menuItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'My Dashboard', path: '/customer/dashboard', icon: LayoutDashboard },
    { name: 'My Orders', path: '/customer/orders', icon: Package },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-background/90 backdrop-blur-lg border-b border-border' : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div 
              className="flex items-center cursor-pointer group"
              onClick={() => navigate('/')}
            >
              <img 
                src={navbarLogo} 
                alt="ChefSync" 
                className="h-20 w-auto object-contain transform group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-6">
              {menuItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center space-x-2 text-sm font-medium transition-colors duration-300 hover:text-primary relative group ${
                    isActive(item.path)
                      ? 'text-primary'
                      : 'text-foreground/70'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                  <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 h-0.5 w-0 bg-primary transition-all duration-300 group-hover:w-full ${isActive(item.path) ? 'w-full' : ''}`}></span>
                </button>
              ))}
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-2">
              {/* Location Selector */}
              <Button
                variant="ghost"
                className="hidden sm:flex items-center space-x-2"
                onClick={() => setIsLocationModalOpen(true)}
              >
                <MapPin className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground/80 truncate max-w-[150px]">{locationContext.address || 'Select Location'}</span>
              </Button>

              {/* Search */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/menu')}
                className="hover:bg-primary/10"
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-primary/10"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  3
                </span>
              </Button>

              {/* Cart */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/customer/cart')}
                className="relative hover:bg-primary/10"
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  2
                </span>
              </Button>

              <div className="w-px h-6 bg-border mx-2"></div>

              {/* User Menu */}
              {user ? (
                <div className="flex items-center space-x-3">
                  <Avatar className="h-9 w-9 cursor-pointer" onClick={() => navigate('/customer/profile')}>
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:block text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {user?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Customer
                    </p>
                  </div>
                   <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLogout}
                      className="hidden sm:flex hover:bg-destructive/10 text-destructive"
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>
                </div>
              ) : (
                <Button onClick={() => navigate('/auth/login')}>Login</Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="hover:bg-primary/10"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-background border-t border-border shadow-lg">
            <div className="px-4 pt-2 pb-4 space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.path);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 p-3 text-base font-medium rounded-lg transition-colors duration-300 ${
                    isActive(item.path)
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/70 hover:bg-muted'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </button>
              ))}
              <div className="pt-2">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-2"
                  onClick={() => {
                    setIsLocationModalOpen(true);
                    setIsMenuOpen(false);
                  }}
                >
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-foreground/80 truncate">{locationContext.address || 'Select Location'}</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <LocationModal 
        isOpen={isLocationModalOpen} 
        onClose={() => setIsLocationModalOpen(false)} 
        onLocationSelect={handleLocationSelect} 
      />
    </>
  );
};

export default CustomerNavbar;
