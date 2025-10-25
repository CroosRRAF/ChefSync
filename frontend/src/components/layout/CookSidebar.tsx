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
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Home, 
  ChefHat, 
  ClipboardList, 
  Package, 
  Bell,
  UtensilsCrossed,
  Menu,
  Plus,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle2,
  Search
} from "lucide-react";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useState } from "react";

const items = [
  { 
    title: "Dashboard", 
    url: "/cook/dashboard", 
    icon: Home,
    description: "Overview & Analytics",
    badge: null,
    quickActions: [
      { label: "View Stats", icon: TrendingUp },
      { label: "Quick Search", icon: Search }
    ]
  },
  { 
    title: "Menu", 
    url: "/cook/menu", 
    icon: ChefHat,
    description: "Manage Your Dishes",
    badge: null,
    quickActions: [
      { label: "Add Item", icon: Plus },
      { label: "Featured Items", icon: TrendingUp }
    ]
  },
  { 
    title: "Bulk Menu", 
    url: "/cook/bulk-menu", 
    icon: Menu,
    description: "Bulk Operations",
    badge: null,
    quickActions: [
      { label: "Create Bulk", icon: Plus },
      { label: "Templates", icon: ClipboardList }
    ]
  },
  { 
    title: "Orders", 
    url: "/cook/orders", 
    icon: ClipboardList,
    description: "Active Orders",
    badge: null,
    quickActions: [
      { label: "Pending", icon: Clock },
      { label: "Completed", icon: CheckCircle2 }
    ]
  },
  { 
    title: "Notifications", 
    url: "/cook/notifications", 
    icon: Bell,
    description: "Updates & Alerts",
    badge: null,
    quickActions: [
      { label: "Mark All Read", icon: CheckCircle2 },
      { label: "Settings", icon: Settings }
    ]
  },
];

export function CookSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { unreadCount } = useUnreadNotifications();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showQuickActions, setShowQuickActions] = useState<string | null>(null);

  const isActive = (path: string) => currentPath === path;
  
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    `group relative flex items-center gap-3 w-full p-3 rounded-lg transition-all duration-200 ease-in-out transform
     ${isActive 
       ? "bg-gradient-to-r from-primary/20 to-primary/10 text-primary shadow-md border-l-4 border-primary scale-[1.02]" 
       : "hover:bg-gradient-to-r hover:from-sidebar-accent/80 hover:to-sidebar-accent/40 text-sidebar-foreground hover:text-sidebar-accent-foreground hover:scale-[1.01] hover:shadow-sm"
     }`;

  const handleQuickAction = (action: string, itemTitle: string) => {
    console.log(`Quick action: ${action} for ${itemTitle}`);
    // Add your quick action logic here
  };

  return (
    <Sidebar className={`transition-all duration-300 shadow-xl ${state === "collapsed" ? "w-16" : "w-64"}`} collapsible="icon">
      <SidebarContent className="bg-gradient-to-b from-sidebar to-sidebar/95 backdrop-blur-sm border-r-2 border-sidebar-border/30">
        {/* Logo Section */}
        <div className="p-4 border-b border-sidebar-border/50 bg-sidebar/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200">
              <UtensilsCrossed className="h-6 w-6 text-primary-foreground" />
            </div>
            {state !== "collapsed" && (
              <div className="flex-1">
                <h1 className="font-bold text-lg text-sidebar-foreground">ChefDash</h1>
                <p className="text-xs text-sidebar-foreground/70 font-medium">Kitchen Management</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup className="flex-1">
          <SidebarGroupLabel className="text-sidebar-foreground/60 font-semibold text-xs uppercase tracking-wider">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent className="space-y-1">
            <SidebarMenu>
              {items.map((item, index) => (
                <SidebarMenuItem key={item.title} className="sidebar-item">
                  <SidebarMenuButton asChild>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="relative sidebar-nav-item"
                            onMouseEnter={() => setHoveredItem(item.title)}
                            onMouseLeave={() => {
                              setHoveredItem(null);
                              setShowQuickActions(null);
                            }}
                          >
                            <NavLink 
                              to={item.url} 
                              end={item.url === "/cook/dashboard"}
                              className={getNavCls}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="relative">
                                  <item.icon className={`h-5 w-5 transition-all duration-200 ${
                                    isActive(item.url) ? 'text-primary' : 'text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground'
                                  }`} />
                                  {isActive(item.url) && (
                                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse" />
                                  )}
                                </div>
                                
                                {state !== "collapsed" && (
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <span className={`font-medium truncate ${
                                        isActive(item.url) ? 'text-primary' : 'text-sidebar-foreground'
                                      }`}>
                                        {item.title}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        {item.badge && (
                                          <Badge variant="secondary" className="text-xs px-2 py-0 bg-primary/10 text-primary border border-primary/20">
                                            {item.badge}
                                          </Badge>
                                        )}
                                        {item.title === "Notifications" && unreadCount > 0 && (
                                          <Badge 
                                            variant="destructive" 
                                            className="h-5 min-w-5 px-1.5 text-xs bg-red-500 hover:bg-red-500 text-white animate-pulse"
                                          >
                                            {unreadCount > 99 ? "99+" : unreadCount}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-xs text-sidebar-foreground/50 truncate">
                                      {item.description}
                                    </p>
                                  </div>
                                )}
                              </div>
                              
                              {/* Active indicator */}
                              {isActive(item.url) && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-l-full active-indicator" />
                              )}
                            </NavLink>

                            {/* Quick Actions Dropdown */}
                            {state !== "collapsed" && hoveredItem === item.title && (
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20">
                                <DropdownMenu open={showQuickActions === item.title} onOpenChange={(open) => setShowQuickActions(open ? item.title : null)}>
                                  <DropdownMenuTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-primary/20"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowQuickActions(showQuickActions === item.title ? null : item.title);
                                      }}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent side="right" align="start" className="w-48 quick-action">
                                    <DropdownMenuLabel className="text-xs">Quick Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {item.quickActions.map((action) => (
                                      <DropdownMenuItem 
                                        key={action.label}
                                        className="gap-2 cursor-pointer"
                                        onClick={() => handleQuickAction(action.label, item.title)}
                                      >
                                        <action.icon className="h-4 w-4" />
                                        {action.label}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        {state === "collapsed" && (
                          <TooltipContent side="right" className="bg-popover text-popover-foreground border tooltip-content">
                            <div className="font-medium">{item.title}</div>
                            <div className="text-xs text-muted-foreground">{item.description}</div>
                            {item.title === "Notifications" && unreadCount > 0 && (
                              <div className="text-sm text-red-500 font-medium">{unreadCount} unread</div>
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

        {/* Status Bar */}
        {state !== "collapsed" && (
          <div className="p-4 border-t border-sidebar-border/50 bg-sidebar/50">
            <div className="flex items-center justify-between text-xs text-sidebar-foreground/60">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full status-online" />
                <span>Kitchen Online</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Last sync: now</span>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
