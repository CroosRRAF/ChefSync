import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
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
  ChevronRight
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
import { cn } from '@/lib/utils';
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
      icon: Users,
      children: [
        { label: 'All Users', href: '/admin/users', icon: Users },
        { label: 'Manage Users', href: '/admin/manage-users', icon: Users },
        { label: 'Admins', href: '/admin/users/admins', icon: Shield },
        { label: 'Chefs', href: '/admin/users/chefs', icon: ChefHat },
        { label: 'Customers', href: '/admin/users/customers', icon: User },
        { label: 'Delivery Agents', href: '/admin/users/delivery', icon: Truck }
      ]
    },
    {
      label: 'Orders',
      href: '/admin/orders',
      icon: ShoppingCart,
      badge: 5,
      children: [
        { label: 'All Orders', href: '/admin/orders', icon: ShoppingCart },
        { label: 'Pending Orders', href: '/admin/orders/pending', icon: Package },
        { label: 'In Progress', href: '/admin/orders/in-progress', icon: Activity },
        { label: 'Completed', href: '/admin/orders/completed', icon: Package },
        { label: 'Cancelled', href: '/admin/orders/cancelled', icon: Package }
      ]
    },
    {
      label: 'Food Management',
      href: '/admin/food',
      icon: ChefHat,
      children: [
        { label: 'All Foods', href: '/admin/food', icon: ChefHat },
        { label: 'Categories', href: '/admin/food/categories', icon: Package },
        { label: 'Ingredients', href: '/admin/food/ingredients', icon: Package }
      ]
    },
    {
      label: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
      children: [
        { label: 'Overview', href: '/admin/analytics', icon: BarChart3 },
        { label: 'Revenue Reports', href: '/admin/analytics/revenue', icon: CreditCard },
        { label: 'User Analytics', href: '/admin/analytics/users', icon: Users },
        { label: 'Performance', href: '/admin/analytics/performance', icon: Activity }
      ]
    },
    {
      label: 'Communications',
      href: '/admin/communications',
      icon: MessageSquare,
      badge: 3,
      children: [
        { label: 'Notifications', href: '/admin/notifications', icon: Bell },
        { label: 'Messages', href: '/admin/communications/messages', icon: MessageSquare },
        { label: 'Announcements', href: '/admin/communications/announcements', icon: FileText }
      ]
    },
    {
      label: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      children: [
        { label: 'General Settings', href: '/admin/settings', icon: Settings },
        { label: 'Database', href: '/admin/system/database', icon: Database },
        { label: 'Activity Logs', href: '/admin/system/logs', icon: FileText },
        { label: 'System Health', href: '/admin/system/health', icon: Activity }
      ]
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
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.href) || isActive;

    return (
      <div key={item.href} className="space-y-1">
        <Button
          variant={isActive ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start gap-3 text-left font-normal",
            level > 0 && "ml-6 w-[calc(100%-1.5rem)]",
            sidebarCollapsed && !level && "justify-center px-2",
            isActive && "bg-primary/10 text-primary border-r-2 border-primary"
          )}
          onClick={() => {
            if (hasChildren && !sidebarCollapsed) {
              toggleExpanded(item.href);
            } else {
              navigate(item.href);
              setMobileMenuOpen(false);
            }
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
              {hasChildren && !sidebarCollapsed && (
                <ChevronRight className={cn(
                  "h-4 w-4 shrink-0 transition-transform",
                  isExpanded && "transform rotate-90"
                )} />
              )}
            </>
          )}
        </Button>
        
        {hasChildren && isExpanded && (!sidebarCollapsed || level > 0) && (
          <div className="space-y-1 pl-6">
            {item.children?.map(child => renderNavItem(child, level + 1))}
          </div>
        )}
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
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col border-r bg-white dark:bg-gray-800 transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        {/* Sidebar Header */}
        <div className="p-4 border-b flex items-center justify-between">
          {!sidebarCollapsed && (
            <Link to="/admin/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
                C
              </div>
              <span className="font-bold text-lg">ChefSync Admin</span>
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
            <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profile_image} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
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
              <Link to="/admin/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
                  C
                </div>
                <span className="font-bold text-lg">ChefSync Admin</span>
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
              <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profile_image} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
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
        <header className="h-16 border-b bg-white dark:bg-gray-800 flex items-center justify-between px-4 lg:px-6">
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
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Home className="h-4 w-4" />
              <span>/</span>
              {pageInfo.parent && (
                <>
                  <span>{pageInfo.parent.label}</span>
                  <span>/</span>
                </>
              )}
              <span className="text-gray-900 dark:text-white font-medium">
                {pageInfo.current.label}
              </span>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <Button variant="ghost" size="sm" className="hidden md:flex">
              <Search className="h-4 w-4" />
            </Button>

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
                    <AvatarImage src={user?.profile_image} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
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
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
