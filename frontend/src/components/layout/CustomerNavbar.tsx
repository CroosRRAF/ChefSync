import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import logoImage from '@/assets/2.png';
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
  LayoutDashboard
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const CustomerNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
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

  const menuItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Dashboard', path: '/customer/dashboard', icon: LayoutDashboard },
    { name: 'Orders', path: '/customer/orders', icon: Package },
    { name: 'Profile', path: '/customer/profile', icon: User },
    { name: 'Settings', path: '/customer/settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer group"
            onClick={() => navigate('/customer/dashboard')}
          >
            <img 
              src={navbarLogo} 
              alt="ChefSync" 
              className="h-16 w-auto object-contain transform group-hover:scale-105 transition-all duration-300"
            />
            <Badge className="ml-2 bg-orange-100 text-orange-800 text-xs">
              Customer
            </Badge>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`flex items-center space-x-2 text-sm font-medium transition-all duration-200 hover:text-orange-500 relative cursor-pointer ${
                  isActive(item.path)
                    ? 'text-orange-500'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
                {isActive(item.path) && (
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-orange-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/menu')}
              className="hidden sm:flex hover:bg-orange-50 dark:hover:bg-orange-900/20"
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="relative hover:bg-orange-50 dark:hover:bg-orange-900/20"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                3
              </span>
            </Button>

            {/* Cart */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/customer/cart')}
              className="relative hover:bg-orange-50 dark:hover:bg-orange-900/20"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                2
              </span>
            </Button>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Customer
                </p>
              </div>
              <Avatar className="h-8 w-8 cursor-pointer" onClick={() => navigate('/customer/profile')}>
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="bg-orange-500 text-white text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="hidden sm:flex hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
            >
              <LogOut className="h-4 w-4" />
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 absolute left-0 right-0 top-16 shadow-lg">
            <div className="px-4 py-6 space-y-4">
              {menuItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.path);
                    setIsMenuOpen(false);
                  }}
                  className={`flex items-center space-x-3 w-full text-left text-base font-medium transition-colors duration-200 py-2 cursor-pointer ${
                    isActive(item.path)
                      ? 'text-orange-500'
                      : 'text-gray-700 dark:text-gray-300 hover:text-orange-500'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </button>
              ))}
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <button
                  onClick={() => {
                    navigate('/menu');
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 w-full text-left text-base font-medium text-gray-700 dark:text-gray-300 hover:text-orange-500 py-2"
                >
                  <Search className="h-5 w-5" />
                  <span>Browse Menu</span>
                </button>
                
                <button
                  onClick={() => {
                    navigate('/customer/cart');
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 w-full text-left text-base font-medium text-gray-700 dark:text-gray-300 hover:text-orange-500 py-2"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>Cart</span>
                </button>
                
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 w-full text-left text-base font-medium text-red-600 dark:text-red-400 hover:text-red-700 py-2"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default CustomerNavbar;
