import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Search,
  Settings,
  Sun,
  User,
  Users,
  Utensils,
  X,
} from "lucide-react";
import React, { memo, useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AdminBreadcrumb from "./AdminBreadcrumb";

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

const AdminLayout: React.FC<AdminLayoutProps> = memo(({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation items for the new admin structure
  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      description: "Overview, KPIs, and insights",
    },
    {
      label: "Analytics",
      href: "/admin/analytics",
      icon: BarChart3,
      description: "Business analytics and reports",
    },
    {
      label: "Feedback Management",
      href: "/admin/feedback-management",
      icon: MessageSquare,
      description: "Handle complaints and suggestions",
      badge: 5, // Pending feedback items
    },
    {
      label: "Communication",
      href: "/admin/communication",
      icon: MessageSquare,
      description: "Notifications and messaging",
      badge: 3, // Unread notifications
    },
    {
      label: "Food & Menu",
      href: "/admin/food-menu-management",
      icon: Utensils,
      description: "Manage food items and menus",
    },
    {
      label: "User Management",
      href: "/admin/manage-user",
      icon: Users,
      description: "Manage users and permissions",
      badge: 2, // Pending approvals
    },
    {
      label: "Reports",
      href: "/admin/reports",
      icon: FileText,
      description: "Generate and export reports",
    },
    {
      label: "Settings",
      href: "/admin/settings",
      icon: Settings,
      description: "System configuration",
    },
    {
      label: "Profile",
      href: "/admin/profile",
      icon: User,
      description: "Admin profile settings",
    },
  ];

  // Check if route is active
  const isActiveRoute = useCallback(
    (href: string) => {
      if (href === "/admin/dashboard") {
        return location.pathname === href;
      }
      return location.pathname.startsWith(href);
    },
    [location.pathname]
  );

  // Toggle sidebar collapse
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(!sidebarCollapsed);
  }, [sidebarCollapsed]);

  // Toggle mobile menu
  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(!mobileMenuOpen);
  }, [mobileMenuOpen]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [logout, navigate]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    // TODO: Implement search functionality
    console.log("Searching for:", query);
  }, []);

  // Get current page info
  const getCurrentPageInfo = useCallback(() => {
    const currentItem = navItems.find((item) => isActiveRoute(item.href));
    return {
      title: currentItem?.label || "Admin Panel",
      description: currentItem?.description || "Manage your platform",
    };
  }, [location.pathname, navItems]);

  const pageInfo = getCurrentPageInfo();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarCollapsed ? "4rem" : "16rem",
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "hidden md:flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm",
          "relative z-30"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                Admin Panel
              </span>
            </motion.div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="p-1.5"
          >
            {sidebarCollapsed ? (
              <ChevronRight size={16} />
            ) : (
              <ChevronLeft size={16} />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <TooltipProvider>
                  <Tooltip delayDuration={sidebarCollapsed ? 0 : 10000}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => navigate(item.href)}
                        className={cn(
                          "w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                          "hover:bg-gray-100 dark:hover:bg-gray-700",
                          isActiveRoute(item.href)
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-700 dark:border-blue-300"
                            : "text-gray-700 dark:text-gray-300"
                        )}
                      >
                        <item.icon size={20} className="shrink-0" />
                        {!sidebarCollapsed && (
                          <>
                            <span className="ml-3 flex-1 text-left">
                              {item.label}
                            </span>
                            {item.badge && (
                              <Badge
                                variant="secondary"
                                className="ml-2 px-1.5 py-0.5 text-xs"
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </button>
                    </TooltipTrigger>
                    {sidebarCollapsed && (
                      <TooltipContent side="right" className="ml-2">
                        <div>
                          <div className="font-medium">{item.label}</div>
                          {item.description && (
                            <div className="text-xs text-gray-500 mt-1">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="p-4 border-t border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={toggleMobileMenu}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-800 z-50 md:hidden shadow-xl"
            >
              {/* Mobile Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">A</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Admin Panel
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={toggleMobileMenu}>
                  <X size={20} />
                </Button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1 px-2">
                  {navItems.map((item) => (
                    <li key={item.href}>
                      <button
                        onClick={() => {
                          navigate(item.href);
                          setMobileMenuOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                          "hover:bg-gray-100 dark:hover:bg-gray-700",
                          isActiveRoute(item.href)
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                            : "text-gray-700 dark:text-gray-300"
                        )}
                      >
                        <item.icon size={20} className="shrink-0" />
                        <span className="ml-3 flex-1 text-left">
                          {item.label}
                        </span>
                        {item.badge && (
                          <Badge
                            variant="secondary"
                            className="ml-2 px-1.5 py-0.5 text-xs"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Left Section */}
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={toggleMobileMenu}
              >
                <Menu size={20} />
              </Button>

              {/* Page Info */}
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {pageInfo.title}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {pageInfo.description}
                </p>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-2">
              {/* Search */}
              <div className="relative hidden sm:block">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              {/* Theme Toggle */}
              <Button variant="ghost" size="sm" onClick={toggleTheme}>
                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              </Button>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user?.avatar} alt={user?.firstName} />
                      <AvatarFallback>
                        {user?.firstName?.[0]}
                        {user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/admin/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/admin/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Help
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="p-6">
            <AdminBreadcrumb />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
});

AdminLayout.displayName = "AdminLayout";

export default AdminLayout;
