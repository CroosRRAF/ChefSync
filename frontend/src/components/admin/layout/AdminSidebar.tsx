import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Feedback,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Settings,
  User,
  Users,
  Utensils,
} from "lucide-react";
import React, { memo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface AdminSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: number;
  description?: string;
}

const AdminSidebar: React.FC<AdminSidebarProps> = memo(
  ({ collapsed, onToggleCollapse }) => {
    const { user } = useAuth();
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
        icon: Feedback,
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
    const isActiveRoute = (href: string) => {
      if (href === "/admin/dashboard") {
        return location.pathname === href;
      }
      return location.pathname.startsWith(href);
    };

    return (
      <motion.aside
        initial={false}
        animate={{
          width: collapsed ? "4rem" : "16rem",
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm",
          "relative z-30"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {!collapsed && (
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
            onClick={onToggleCollapse}
            className="p-1.5"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <TooltipProvider>
                  <Tooltip delayDuration={collapsed ? 0 : 10000}>
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
                        {!collapsed && (
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
                    {collapsed && (
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
        {!collapsed && (
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
    );
  }
);

AdminSidebar.displayName = "AdminSidebar";

export default AdminSidebar;
