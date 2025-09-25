import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useUserStore } from "@/store/userStore";
import { Button } from "@/components/ui/button";
import {
  Home,
  Menu,
  User,
  ShoppingCart,
  ChefHat,
  Truck,
  Shield,
  Settings,
  BarChart3,
  FileText,
  Bell,
  MapPin,
  Calendar,
  Package,
} from "lucide-react";
import { cn } from "@/libs/utils";

const RoleBasedNavigation: React.FC = () => {
  const { user } = useUserStore();
  const location = useLocation();

  if (!user) return null;

  const getRoleNavigation = () => {
    switch (user.role) {
      case "customer":
        return [
          { label: "Dashboard", href: "/customer/dashboard", icon: Home },
          { label: "Orders", href: "/customer/orders", icon: ShoppingCart },
          { label: "Profile", href: "/customer/profile", icon: User },
          { label: "Settings", href: "/customer/settings", icon: Settings },
        ];

      case "cook":
        return [
          { label: "Dashboard", href: "/cook/dashboard", icon: Home },
          { label: "Kitchen", href: "/cook/kitchen", icon: ChefHat },
          { label: "Orders", href: "/cook/orders", icon: Package },
          { label: "Schedule", href: "/cook/schedule", icon: Calendar },
          { label: "Profile", href: "/cook/profile", icon: User },
          { label: "Settings", href: "/cook/settings", icon: Settings },
        ];

      case "delivery_agent":
        return [
          { label: "Dashboard", href: "/delivery/dashboard", icon: Home },
          { label: "Orders", href: "/delivery/orders", icon: Package },
          { label: "Map", href: "/delivery/map", icon: MapPin },
          { label: "Schedule", href: "/delivery/schedule", icon: Calendar },
          { label: "Profile", href: "/delivery/profile", icon: User },
          { label: "Settings", href: "/delivery/settings", icon: Settings },
        ];

      case "admin":
        return [
          { label: "Dashboard", href: "/admin/dashboard", icon: Home },
          { label: "Users", href: "/admin/manage-users", icon: User },
          { label: "Orders", href: "/admin/orders", icon: Package },
          { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
          { label: "Reports", href: "/admin/reports", icon: FileText },
          { label: "Notifications", href: "/admin/notifications", icon: Bell },
          { label: "Profile", href: "/admin/profile", icon: User },
          { label: "Settings", href: "/admin/settings", icon: Settings },
        ];

      default:
        return [];
    }
  };

  const navigationItems = getRoleNavigation();

  return (
    <nav className="flex flex-col space-y-2">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;

        return (
          <Link key={item.href} to={item.href}>
            <Button
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4 mr-2" />
              {item.label}
            </Button>
          </Link>
        );
      })}
    </nav>
  );
};

export default RoleBasedNavigation;
