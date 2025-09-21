import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  ShoppingCart, 
  User, 
  LogOut, 
  Menu, 
  X,
  Home,
  Bell,
  Moon,
  Sun,
  ChefHat,
  Phone,
  Info,
  Settings,
  LayoutDashboard
} from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const CustomerHomeNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [notifications] = useState(3); // Mock notification count
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

  const handleProfileClick = () => {
    navigate('/customer/dashboard');
  };

  const menuItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Menu', path: '/menu', icon: ChefHat },
    { name: 'About', path: '/about', icon: Info },
    { name: 'Contact', path: '/contact', icon: Phone },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg border-b border-gray-200/50 dark:border-gray-700/50' 
        : 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm'
    }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 cursor-pointer group">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-all duration-300 shadow-lg">
                <ChefHat className="text-white w-6 h-6" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-300 animate-pulse"></div>
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent group-hover:from-orange-500 group-hover:to-red-500 transition-all duration-300">
                ChefSync
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">Delicious Delivered</p>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-2 text-sm font-medium transition-all duration-200 hover:text-orange-500 relative group ${
                  isActive(item.path)
                    ? 'text-orange-500'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
                {isActive(item.path) && (
                  <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
                )}
                <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Notifications */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200"
                >
                  <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                      {notifications}
                    </span>
                  )}
                </Button>

                {/* Dark Mode Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200"
                >
                  {theme === 'dark' ? (
                    <Sun className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <Moon className="h-5 w-5 text-gray-600" />
                  )}
                </Button>

                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-orange-200 transition-all duration-200">
                      <Avatar className="h-10 w-10 border-2 border-orange-200">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold">
                          {user.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        <Badge className="bg-orange-100 text-orange-800 text-xs w-fit mt-1">
                          Customer
                        </Badge>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/customer/profile')} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/customer/settings')} className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 dark:text-red-400">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                {/* Dark Mode Toggle for non-logged in users */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="hover:bg-orange-50 dark:hover:bg-orange-900/20"
                >
                  {theme === 'dark' ? (
                    <Sun className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <Moon className="h-5 w-5 text-gray-600" />
                  )}
                </Button>

                {/* Login Button */}
                <Button 
                  onClick={() => navigate('/auth/login')}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium px-6 py-2 rounded-full transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Login
                </Button>
              </>
            )}

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
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center space-x-3 w-full text-left text-base font-medium transition-colors duration-200 py-2 px-2 rounded-lg ${
                    isActive(item.path)
                      ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
              
              {user && (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                    <button
                      onClick={() => {
                        handleProfileClick();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center space-x-3 w-full text-left text-base font-medium text-gray-700 dark:text-gray-300 hover:text-orange-500 py-2 px-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors duration-200"
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      <span>Dashboard</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 w-full text-left text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 py-2 px-2 rounded-lg transition-colors duration-200"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default CustomerHomeNavbar;