import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { performAdminSearch } from '@/utils/adminSearch';
import { SearchResults } from '@/components/admin/SearchResults';
import { useTheme } from '@/context/ThemeContext';
import logoImage from '@/assets/2.png';
import navbarLogo from '@/assets/images/hero/navbarlogo.png';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  ChefHat,
  BarChart3,
  Settings,
  Bell,
  Search,
  Menu,
  LogOut,
  User,
  Moon,
  Sun,
  Shield,
  Package,
  Truck,
  CreditCard,
  MessageSquare,
  FileText,
  Activity,
  Database,
  HelpCircle,
  Home,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/libs/utils';
import NotificationCenter from '@/components/admin/NotificationCenter';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: string | number;
  children?: NavItem[];
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
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

  // Navigation items
  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard
    },
    {
      label: 'User Management',
      href: '/admin/users',
      icon: Users
    },
    {
      label: 'Approvals',
      href: '/admin/approvals',
      icon: Shield,
      badge: 0 // Will be updated with actual count
    },
    {
      label: 'Orders',
      href: '/admin/orders',
      icon: ShoppingCart,
      badge: 5
    },
    {
      label: 'Food Management',
      href: '/admin/food',
      icon: ChefHat
    },
    {
      label: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3
    },
    {
      label: 'Communications',
      href: '/admin/communications',
      icon: MessageSquare,
      badge: 3
    },
    {
      label: 'Settings',
      href: '/admin/settings',
      icon: Settings
    }
  ];

  // Check if current path matches nav item
  const isActiveRoute = (href: string) => {
    if (href === '/admin/dashboard') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  // Get current page info
  const getCurrentPageInfo = () => {
    for (const item of navItems) {
      if (item.children) {
        for (const child of item.children) {
          if (location.pathname === child.href || location.pathname.startsWith(child.href)) {
            return { parent: item, current: child };
          }
        }
      }
      if (location.pathname === item.href || location.pathname.startsWith(item.href)) {
        return { current: item };
      }
    }
    return { current: { label: 'Admin', href: '/admin', icon: Shield } };
  };

  const pageInfo = getCurrentPageInfo();

  // Auto-expand active navigation items
  useEffect(() => {
    const activeItems = new Set<string>();
    navItems.forEach(item => {
      if (isActiveRoute(item.href)) {
        activeItems.add(item.href);
      }
      if (item.children) {
        item.children.forEach(child => {
          if (isActiveRoute(child.href)) {
            activeItems.add(item.href); // Expand parent
          }
        });
      }
    });
    setExpandedItems(activeItems);
  }, [location.pathname]);

  // Handle expanding/collapsing navigation items
  const toggleExpanded = (href: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(href)) {
        newSet.delete(href);
      } else {
        newSet.add(href);
      }
      return newSet;
    });
  };

  // Render navigation item
  const renderNavItem = (item: NavItem, level = 0) => {
    const isActive = isActiveRoute(item.href);

    return (
      <div key={item.href} className="space-y-1">
        <Button
          variant={isActive ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start gap-3 text-left font-normal",
            level > 0 && "ml-6 w-[calc(100%-1.5rem)]",
            sidebarCollapsed && !level && "justify-center px-2",
            isActive && "border-r-2"
          )} style={isActive ? {
            backgroundColor: theme === 'light' ? '#EBF4FF' : '#1E3A8A20',
            color: theme === 'light' ? '#2563EB' : '#3B82F6',
            borderRightColor: theme === 'light' ? '#2563EB' : '#3B82F6'
          } : {}}
          onClick={() => {
            navigate(item.href);
            setMobileMenuOpen(false);
          }}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {(!sidebarCollapsed || level > 0) && (
            <>
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">
                  {item.badge}
                </Badge>
              )}
            </>
          )}
        </Button>
      </div>
    );
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900" style={{
      backgroundColor: theme === 'light' ? '#F9FAFB' : '#111827'
    }}>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col border-r transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64"
      )} style={{
        backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
        borderColor: theme === 'light' ? '#E5E7EB' : '#374151'
      }}>
        {/* Sidebar Header */}
        <div className="p-4 border-b flex items-center justify-between">
          {!sidebarCollapsed && (
            <Link to="/admin/dashboard" className="flex items-center gap-3">
              <img 
                src={navbarLogo} 
                alt="ChefSync" 
                className="h-14 w-auto object-contain"
              />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</p>
              </div>
            </Link>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(sidebarCollapsed && "w-full justify-center")}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map(item => renderNavItem(item))}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3 p-2 rounded-lg" style={{
              backgroundColor: theme === 'light' ? '#F9FAFB' : '#374151'
            }}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="text-sm" style={{
                  backgroundColor: theme === 'light' ? '#2563EB' : '#3B82F6',
                  color: '#FFFFFF'
                }}>
                  {user?.name ? getInitials(user.name) : 'AD'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex flex-col h-full">
            {/* Mobile Header */}
            <div className="p-4 border-b">
              <Link to="/admin/dashboard" className="flex items-center gap-3">
                <img 
                  src={navbarLogo} 
                  alt="ChefSync" 
                  className="h-14 w-auto object-contain"
                />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</p>
                </div>
              </Link>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
              <div className="space-y-1">
                {navItems.map(item => renderNavItem(item))}
              </div>
            </nav>

            {/* Mobile Footer */}
            <div className="p-4 border-t">
              <div className="flex items-center gap-3 p-2 rounded-lg" style={{
                backgroundColor: theme === 'light' ? '#F9FAFB' : '#374151'
              }}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="text-sm" style={{
                    backgroundColor: theme === 'light' ? '#2563EB' : '#3B82F6',
                    color: '#FFFFFF'
                  }}>
                    {user?.name ? getInitials(user.name) : 'AD'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top Header */}
        <header className="h-16 border-b flex items-center justify-between px-4 lg:px-6" style={{
          backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
          borderBottomColor: theme === 'light' ? '#E5E7EB' : '#374151'
        }}>
          {/* Left Side */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm" style={{
              color: theme === 'light' ? '#6B7280' : '#9CA3AF'
            }}>
              <Home className="h-4 w-4" />
              <span>/</span>
              {pageInfo.parent && (
                <>
                  <span>{pageInfo.parent.label}</span>
                  <span>/</span>
                </>
              )}
              <span className="font-medium" style={{
                color: theme === 'light' ? '#111827' : '#F9FAFB'
              }}>
                {pageInfo.current.label}
              </span>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center">
              {/* Search Bar */}
              {searchOpen && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 rounded-lg shadow-lg border px-3 py-2 w-80 animate-in slide-in-from-top-2" style={{
                  backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
                  borderColor: theme === 'light' ? '#E5E7EB' : '#374151'
                }}>
                  <Search className="h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search for anything..."
                    className="flex-1 bg-transparent border-none outline-none text-sm"
                    value={searchQuery}
                    onChange={async (e) => {
                      const query = e.target.value;
                      setSearchQuery(query);
                      
                      if (query.length >= 2) {
                        setSearchLoading(true);
                        setSearchError(null);
                        try {
                          const results = await performAdminSearch(query);
                          setSearchResults(results);
                        } catch (err) {
                          setSearchError('Failed to perform search');
                          setSearchResults([]);
                        } finally {
                          setSearchLoading(false);
                        }
                      } else {
                        setSearchResults([]);
                      }
                    }}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setSearchOpen(false);
                        setSearchQuery('');
                        setSearchResults([]);
                      }
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  
                  {/* Search Results */}
                  {(searchResults.length > 0 || searchLoading || searchError) && (
                    <SearchResults
                      results={searchResults}
                      loading={searchLoading}
                      error={searchError}
                      onSelect={() => {
                        setSearchOpen(false);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                    />
                  )}
                </div>
              )}
              {/* Search Button */}
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:flex"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Theme Toggle */}
            <Button variant="ghost" size="sm" onClick={toggleTheme}>
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>

            {/* Notifications */}
            <NotificationCenter />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback style={{
                      backgroundColor: theme === 'light' ? '#2563EB' : '#3B82F6',
                      color: '#FFFFFF'
                    }}>
                      {user?.name ? getInitials(user.name) : 'AD'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/admin/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/help')}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Help</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto" style={{
          backgroundColor: theme === 'light' ? '#F9FAFB' : '#111827'
        }}>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
