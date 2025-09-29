import React, { useState, useCallback, memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Shield,
  ShoppingCart,
  ChefHat,
  BarChart3,
  MessageSquare,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  User,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Activity,
  FileText,
  Package,
  Utensils,
  TrendingUp,
  Calendar,
  Globe,
  Database,
  Zap,
  Target,
  Award,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: number;
  description?: string;
  children?: NavItem[];
}

const UltimateAdminLayout: React.FC<AdminLayoutProps> = memo(({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Enhanced navigation items with descriptions and badges
  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      description: 'Overview, AI summary, and activity feed',
    },
    {
      label: 'Users',
      href: '/admin/users',
      icon: Users,
      description: 'Manage chefs and customers',
      badge: 12, // Pending approvals
    },
    {
      label: 'Approvals',
      href: '/admin/approvals',
      icon: Shield,
      badge: 8,
      description: 'Review and approve applications',
      children: [
        {
          label: 'Cook Approvals',
          href: '/admin/approvals/cooks',
          icon: ChefHat,
          badge: 5,
          description: 'Review cook applications'
        },
        {
          label: 'Delivery Approvals',
          href: '/admin/approvals/delivery-agents',
          icon: Package,
          badge: 3,
          description: 'Review delivery agent applications'
        }
      ]
    },
    {
      label: 'Orders',
      href: '/admin/orders',
      icon: ShoppingCart,
      badge: 5,
      description: 'Live queue, assignments, and timeline',
    },
    {
      label: 'Menu & Inventory',
      href: '/admin/food',
      icon: ChefHat,
      description: 'Global menu, AI suggestions, stock alerts',
    },
    {
      label: 'Analytics & Reports',
      href: '/admin/analytics',
      icon: BarChart3,
      description: 'Visual reports, AI insights, exports',
    },
    {
      label: 'Communications',
      href: '/admin/communications',
      icon: MessageSquare,
      badge: 2,
      description: 'Unified communications management with notifications',
    },
    {
      label: 'Notifications',
      href: '/admin/notifications',
      icon: Bell,
      badge: 3,
      description: 'Broadcasts and prioritization',
    },
    {
      label: 'System & Settings',
      href: '/admin/settings',
      icon: Settings,
      description: 'Health dashboard and configuration',
    },
  ];

  // Check active route
  const isActiveRoute = useCallback((href: string) => {
    if (href === '/admin/dashboard') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  }, [location.pathname]);

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Toggle expanded items
  const toggleExpanded = (label: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(label)) {
      newExpanded.delete(label);
    } else {
      newExpanded.add(label);
    }
    setExpandedItems(newExpanded);
  };

  // Handle search
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    try {
      // Simulate search API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock search results
      const mockResults = [
        { type: 'user', title: 'John Doe', subtitle: 'Customer', href: '/admin/users' },
        { type: 'order', title: 'Order #1234', subtitle: 'Pending', href: '/admin/orders' },
        { type: 'food', title: 'Pizza Margherita', subtitle: 'Menu Item', href: '/admin/food' },
      ].filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(query.toLowerCase())
      );

      setSearchResults(mockResults);
    } catch (error) {
      setSearchError('Search failed');
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Get current page info
  const getCurrentPageInfo = () => {
    const currentItem = navItems.find(item => 
      item.href === location.pathname || 
      (item.children && item.children.some(child => child.href === location.pathname))
    );
    
    if (currentItem) {
      return {
        title: currentItem.label,
        description: currentItem.description || '',
        icon: currentItem.icon
      };
    }
    
    return {
      title: 'Admin Panel',
      description: 'Manage your platform',
      icon: Settings
    };
  };

  const currentPage = getCurrentPageInfo();

  // Render navigation item
  const renderNavItem = (item: NavItem, level = 0) => {
    const isActive = isActiveRoute(item.href);
    const isExpanded = expandedItems.has(item.label);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.label}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start h-12 px-3 ${
                    level > 0 ? 'ml-4' : ''
                  } ${sidebarCollapsed ? 'px-2' : ''}`}
                  onClick={() => {
                    if (hasChildren) {
                      toggleExpanded(item.label);
                    } else {
                      navigate(item.href);
                      setMobileMenuOpen(false);
                    }
                  }}
                >
                  <item.icon className={`h-5 w-5 ${sidebarCollapsed ? 'mx-auto' : 'mr-3'}`} />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                          {item.badge}
                        </Badge>
                      )}
                      {hasChildren && (
                        <div className="ml-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                      )}
                    </>
                  )}
                </Button>
              </motion.div>
            </TooltipTrigger>
            {sidebarCollapsed && (
              <TooltipContent side="right">
                <p>{item.label}</p>
                {item.description && (
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                )}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        {/* Render children */}
        {hasChildren && isExpanded && !sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-4 space-y-1"
          >
            {item.children!.map(child => renderNavItem(child, level + 1))}
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          width: sidebarCollapsed ? 80 : 280,
        }}
        className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col"
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <ChefHat className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">ChefSync</h1>
                  <p className="text-xs text-muted-foreground">Admin Panel</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="p-2"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="pl-10"
              />
            </div>
            
            {/* Search Results */}
            {searchQuery && (
              <Card className="mt-2 max-h-60 overflow-y-auto">
                <CardContent className="p-2">
                  {searchLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((result, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded cursor-pointer"
                        onClick={() => {
                          navigate(result.href);
                          setSearchQuery('');
                        }}
                      >
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">{result.title}</p>
                          <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">No results found</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map(item => renderNavItem(item))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start h-12 px-3">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback>
                    {user?.name?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                {!sidebarCollapsed && (
                  <>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">{user?.name || 'Admin'}</p>
                      <p className="text-xs text-muted-foreground">{user?.role || 'admin'}</p>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => navigate('/admin/profile')}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === 'dark' ? (
                  <Sun className="mr-2 h-4 w-4" />
                ) : (
                  <Moon className="mr-2 h-4 w-4" />
                )}
                Toggle Theme
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-3">
                <currentPage.icon className="h-6 w-6 text-blue-600" />
                <div>
                  <h1 className="text-xl font-semibold">{currentPage.title}</h1>
                  {currentPage.description && (
                    <p className="text-sm text-muted-foreground">{currentPage.description}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                  3
                </Badge>
              </Button>
              
              {/* Theme Toggle */}
              <Button variant="ghost" size="sm" onClick={toggleTheme}>
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="w-80 h-full bg-white dark:bg-gray-800 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <ChefHat className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h1 className="text-lg font-bold">ChefSync</h1>
                      <p className="text-xs text-muted-foreground">Admin Panel</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="p-4 space-y-2">
                {navItems.map(item => renderNavItem(item))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

UltimateAdminLayout.displayName = 'UltimateAdminLayout';

export default UltimateAdminLayout;
