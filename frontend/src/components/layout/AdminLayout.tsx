import NotificationCenter from "@/components/admin/NotificationCenter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { performAdminSearch } from "@/utils/adminSearch";
import {
  BarChart3,
  Bell,
  ChefHat,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Moon,
  Search,
  Settings,
  Shield,
  ShoppingCart,
  Sun,
  User,
  Users,
  X,
} from "lucide-react";
import React, { memo, useCallback, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  description?: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = memo(({ children }) => {
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation items organized by groups
  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      description: "Overview, AI summary, and activity feed",
    },
    {
      label: "Users",
      href: "/admin/users",
      icon: Users,
      description: "Manage chefs and customers",
    },
    {
      label: "Orders",
      href: "/admin/orders",
      icon: ShoppingCart,
      badge: 5,
      description: "Live queue, assignments, and timeline",
    },
    {
      label: "Menu & Inventory",
      href: "/admin/foods",
      icon: ChefHat,
      description: "Global menu, AI suggestions, stock alerts",
    },
    {
      label: "Analytics & Reports",
      href: "/admin/analytics",
      icon: BarChart3,
      description: "Visual reports, AI insights, exports",
    },
    {
      label: "Complaints & Support",
      href: "/admin/complaints",
      icon: MessageSquare,
      badge: 2,
      description: "Ticketing system with AI categorization",
    },
    {
      label: "Notifications",
      href: "/admin/notifications",
      icon: Bell,
      badge: 3,
      description: "Broadcasts and prioritization",
    },
    {
      label: "System & Settings",
      href: "/admin/settings",
      icon: Settings,
      description: "Health dashboard and configuration",
    },
  ];

  // Check active route
  const isActiveRoute = useCallback(
    (href: string) => {
      if (href === "/admin/dashboard") {
        return location.pathname === href;
      }
      return location.pathname.startsWith(href);
    },
    [location.pathname]
  );

  // Get current page info
  const getCurrentPageInfo = useCallback(() => {
    for (const item of navItems) {
      if (
        location.pathname === item.href ||
        location.pathname.startsWith(item.href)
      ) {
        return item;
      }
    }
    return {
      label: "Admin",
      href: "/admin",
      icon: Shield,
      description: "Admin Panel",
    };
  }, [location.pathname, navItems]);

  const currentPage = getCurrentPageInfo();

  // Handle search
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      setSearchLoading(true);
      setSearchError(null);
      try {
        const results = await performAdminSearch(query);
        setSearchResults(results);
      } catch (err) {
        setSearchError("Failed to perform search");
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    } else {
      setSearchResults([]);
    }
  }, []);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate("/auth/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }, [logout, navigate]);

  // Get user initials
  const getInitials = useCallback((name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar variant="inset" collapsible="icon">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <Link
                    to="/admin/dashboard"
                    className="flex items-center gap-2"
                  >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Shield className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">ChefSync</span>
                      <span className="truncate text-xs text-muted-foreground">
                        Admin Panel
                      </span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActiveRoute(item.href)}
                        tooltip={item.description}
                        className="transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-sm data-[active=true]:border-l-2 data-[active=true]:border-primary"
                      >
                        <Link
                          to={item.href}
                          className="flex items-center gap-2"
                        >
                          <item.icon className="size-4 transition-colors duration-200" />
                          <span>{item.label}</span>
                          {item.badge && (
                            <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    >
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage
                          src="/admin-avatar.png"
                          alt={`${user?.name || "Admin"} avatar`}
                        />
                        <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                          {user?.name ? getInitials(user.name) : "AD"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {user?.name || "Admin"}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {user?.email || "admin@chefsync.com"}
                        </span>
                      </div>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                    side="bottom"
                    align="end"
                    sideOffset={4}
                  >
                    <DropdownMenuLabel className="p-0 font-normal">
                      <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <Avatar className="h-8 w-8 rounded-lg">
                          <AvatarImage
                            src="/admin-avatar.png"
                            alt={`${user?.name || "Admin"} avatar`}
                          />
                          <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                            {user?.name ? getInitials(user.name) : "AD"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-semibold">
                            {user?.name || "Admin"}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {user?.email || "admin@chefsync.com"}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            Last login:{" "}
                            {user?.last_login
                              ? new Date(user.last_login).toLocaleString()
                              : "Never"}
                          </span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin/settings" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          {/* Modern Header */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link
                to="/admin/dashboard"
                className="hover:text-foreground transition-colors"
              >
                Admin
              </Link>
              <span>/</span>
              <span className="text-foreground font-medium">
                {currentPage.label}
              </span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                {searchOpen ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      placeholder="Search anything..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-64"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setSearchOpen(false);
                          setSearchQuery("");
                          setSearchResults([]);
                        }
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>

                    {(searchResults.length > 0 ||
                      searchLoading ||
                      searchError) && (
                      <div className="absolute top-full mt-2 w-96 z-50">
                        <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                          {searchLoading && (
                            <div className="text-sm text-gray-500">
                              Searching...
                            </div>
                          )}
                          {searchError && (
                            <div className="text-sm text-red-500">
                              {searchError}
                            </div>
                          )}
                          {searchResults.length > 0 && (
                            <div className="space-y-2">
                              {searchResults
                                .slice(0, 5)
                                .map((result, index) => (
                                  <div
                                    key={index}
                                    className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                                  >
                                    <div className="text-sm font-medium">
                                      {result.title || result.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {result.type || "Result"}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchOpen(true)}
                  >
                    <Search className="h-4 w-4" />
                    <span className="sr-only">Search</span>
                  </Button>
                )}
              </div>

              {/* Theme Toggle */}
              <Button variant="ghost" size="sm" onClick={toggleTheme}>
                {theme === "light" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>

              {/* Notifications */}
              <NotificationCenter />
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-6">{children}</div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
});

export default AdminLayout;
