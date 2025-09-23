import React, { useState } from "react";
import "../../styles/delivery-theme.css";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Truck,
  LayoutDashboard,
  Package,
  Map,
  Calendar,
  Settings,
  User,
  LogOut,
  Bell,
  ChefHat,
} from "lucide-react";

const DeliveryNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [notifications] = useState(3); // Mock notification count

  const navItems = [
    {
      title: "Dashboard",
      href: "/delivery/dashboard",
      icon: LayoutDashboard,
      description: "Overview and statistics",
    },
    {
      title: "Deliveries",
      href: "/delivery/deliveries",
      icon: Package,
      description: "Manage active deliveries",
    },
    {
      title: "Map",
      href: "/delivery/map",
      icon: Map,
      description: "Real-time GPS tracking",
    },
    {
      title: "Schedule",
      href: "/delivery/schedule",
      icon: Calendar,
      description: "Plan your routes",
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav
      className="sticky top-0 z-50 border-b backdrop-blur supports-[backdrop-filter]:bg-background/60"
      style={{
        background: "rgba(255, 255, 255, 0.95)",
        borderBottomColor: "rgba(26, 35, 126, 0.1)",
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <Link
            to="/delivery/dashboard"
            className="flex items-center space-x-2 group transition-all duration-300 hover:scale-105"
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300 group-hover:shadow-lg"
              style={{ background: "var(--primary-gradient)" }}
            >
              <ChefHat className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span
                className="text-sm font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                ChefSync
              </span>
              <span
                className="text-xs"
                style={{ color: "var(--text-cool-grey)" }}
              >
                Delivery
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {navItems.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink
                    asChild
                    className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                      isActive(item.href) ? "font-medium" : ""
                    }`}
                    style={{
                      color: isActive(item.href)
                        ? "var(--primary-emerald)"
                        : "var(--text-cool-grey)",
                      background: isActive(item.href)
                        ? "rgba(46, 204, 113, 0.1)"
                        : "transparent",
                    }}
                  >
                    <Link
                      to={item.href}
                      className="flex items-center space-x-2 hover:scale-105 transition-transform duration-300"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="relative hover:scale-110 transition-all duration-300 rounded-full"
              style={{
                color: "var(--text-cool-grey)",
              }}
            >
              <Bell className="h-4 w-4" />
              {notifications > 0 && (
                <Badge
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs text-white"
                  style={{ background: "var(--status-error)" }}
                >
                  {notifications}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full hover:scale-110 transition-all duration-300"
                >
                  <Avatar
                    className="h-8 w-8 border-2"
                    style={{ borderColor: "var(--primary-emerald)" }}
                  >
                    <AvatarImage
                      src={user?.avatar}
                      alt={user?.name || "User"}
                    />
                    <AvatarFallback>
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user?.name}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user?.email}
                    </p>
                    <Badge variant="secondary" className="w-fit text-xs">
                      <Truck className="h-3 w-3 mr-1" />
                      Delivery Agent
                    </Badge>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/delivery/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/delivery/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onSelect={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <div className="flex space-x-1 pb-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`flex flex-1 flex-col items-center justify-center space-y-1 rounded-md px-2 py-1 text-xs transition-colors ${
                  isActive(item.href)
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="text-[10px]">{item.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DeliveryNavbar;
