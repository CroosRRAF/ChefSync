import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Home, 
  ChefHat, 
  ClipboardList, 
  Package, 
  Bell,
  UtensilsCrossed,
  Menu
} from "lucide-react";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";

const items = [
  { title: "Dashboard", url: "/cook/dashboard", icon: Home },
  { title: "Menu", url: "/cook/menu", icon: ChefHat },
  { title: "Orders", url: "/cook/orders", icon: ClipboardList },
  { title: "Bulk Orders", url: "/cook/bulk-orders", icon: Package },
  { title: "Bulk Menu", url: "/cook/bulk-menu", icon: Menu },
  { title: "Notifications", url: "/cook/notifications", icon: Bell },
];

export function CookSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { unreadCount } = useUnreadNotifications();

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-sidebar-accent text-sidebar-primary font-medium" 
      : "hover:bg-sidebar-accent/50 text-sidebar-foreground hover:text-sidebar-accent-foreground";

  return (
    <Sidebar className={state === "collapsed" ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-sidebar">
        {/* Logo Section */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
            </div>
            {state !== "collapsed" && (
              <div>
                <h1 className="font-bold text-sidebar-foreground">ChefDash</h1>
                <p className="text-xs text-sidebar-foreground/60">Kitchen Management</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <NavLink 
                            to={item.url} 
                            end={item.url === "/cook/dashboard"}
                            className={getNavCls}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-3">
                                <item.icon className="h-4 w-4" />
                                {state !== "collapsed" && <span>{item.title}</span>}
                              </div>
                              
                              {/* Unread notification badge */}
                              {item.title === "Notifications" && unreadCount > 0 && (
                                <Badge 
                                  variant="destructive" 
                                  className={`
                                    ${state === "collapsed" 
                                      ? "absolute -top-1 -right-1 h-5 w-5 p-0 text-[10px] flex items-center justify-center" 
                                      : "h-5 min-w-5 px-1.5 text-xs flex items-center justify-center"
                                    }
                                    bg-red-500 hover:bg-red-500 text-white border-2 border-white shadow-lg
                                    animate-bounce
                                    font-bold
                                    z-10
                                  `}
                                >
                                  {state === "collapsed" 
                                    ? (unreadCount > 9 ? "!" : unreadCount) 
                                    : (unreadCount > 99 ? "99+" : unreadCount)
                                  }
                                </Badge>
                              )}
                            </div>
                          </NavLink>
                        </TooltipTrigger>
                        {(state === "collapsed" || (item.title === "Notifications" && unreadCount > 0)) && (
                          <TooltipContent side="right" className="bg-popover text-popover-foreground border">
                            <p className="font-medium">{item.title}</p>
                            {item.title === "Notifications" && unreadCount > 0 && (
                              <p className="text-sm text-red-500">{unreadCount} unread notifications</p>
                            )}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
