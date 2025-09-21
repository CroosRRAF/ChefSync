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
  LayoutDashboard,
  Package,
  User,
  Settings,
  Home,
  ChefHat,
  Info,
  Phone,
  Bell,
  Moon,
  Sun,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface CustomerDashboardLayoutProps {
  children: React.ReactNode;
}

const CustomerDashboardLayout: React.FC<CustomerDashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [notifications] = useState(3);
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

  const topNavItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Menu', path: '/menu', icon: ChefHat },
    { name: 'About', path: '/about', icon: Info },
    { name: 'Contact', path: '/contact', icon: Phone },
  ];

  const sidebarItems = [
    { name: 'Dashboard', path: '/customer/dashboard', icon: LayoutDashboard },
    { name: 'Orders', path: '/customer/orders', icon: Package },
    { name: 'Profile', path: '/customer/profile', icon: User },
    { name: 'Settings', path: '/customer/settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Top Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg border-b border-gray-200/50 dark:border-gray-700/50' 
          : 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200/30 dark:border-gray-700/30'
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
                <Badge className="ml-2 bg-orange-100 text-orange-800 text-xs">
                  Dashboard
                </Badge>
              </div>
            </Link>

            {/* Desktop Top Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {topNavItems.map((item) => (
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
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold">
                        {user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                      <Badge className="bg-orange-100 text-orange-800 text-xs w-fit mt-1">
                        Customer
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
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

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-16 left-0 z-40 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 shadow-lg",
        isSidebarCollapsed ? "w-16" : "w-64",
        "hidden md:block"
      )}>
        <div className="flex flex-col h-full">
          {/* Sidebar Toggle */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            {!isSidebarCollapsed && (
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Navigation</h2>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {sidebarItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 group",
                  isActive(item.path)
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                    : "text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isSidebarCollapsed ? "mx-auto" : "mr-3"
                )} />
                {!isSidebarCollapsed && (
                  <span className="truncate">{item.name}</span>
                )}
                {isActive(item.path) && !isSidebarCollapsed && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </Link>
            ))}
          </nav>

          {/* User Info in Sidebar */}
          {!isSidebarCollapsed && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10 border-2 border-orange-200">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileSidebarOpen(false)}></div>
          <aside className="fixed top-16 left-0 z-50 w-64 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Navigation</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileSidebarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <nav className="flex-1 px-4 py-6 space-y-2">
                {sidebarItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className={cn(
                      "flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                      isActive(item.path)
                        ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                        : "text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600"
                    )}
                  >
                    <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className={cn(
        "pt-16 transition-all duration-300",
        isSidebarCollapsed ? "md:ml-16" : "md:ml-64"
      )}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default CustomerDashboardLayout;