import Footer from "@/components/layout/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { LogOut, Moon, Settings, Sun, User } from "lucide-react";
import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { CookSidebar } from "./CookSidebar";

export default function CookLayout() {
  const [chefStatus, setChefStatus] = useState<"free" | "busy">("free");
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useUnreadNotifications();
  const navigate = useNavigate();

  const toggleStatus = () => {
    setChefStatus((prev) => (prev === "free" ? "busy" : "free"));
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleProfile = () => {
    navigate("/cook/profile");
  };

  const handleSettings = () => {
    navigate("/cook/settings");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <CookSidebar />

        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <header className="h-16 border-b bg-card flex items-center justify-between px-6 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h2 className="text-lg font-semibold text-card-foreground">
                Chef Dashboard
              </h2>
            </div>

            <div className="flex items-center gap-4">
              {/* Chef Status Indicator */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleStatus}
                  className="flex items-center gap-2 px-3 py-1"
                >
                  <div
                    className={`status-indicator ${
                      chefStatus === "free" ? "status-free" : "status-busy"
                    }`}
                  />
                  <span className="capitalize font-medium">{chefStatus}</span>
                </Button>
              </div>

              {/* Notifications Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/cook/notifications')}
                className={`p-2 relative transition-all duration-200 ${
                  unreadCount > 0 ? 'hover:bg-red-50 dark:hover:bg-red-950' : ''
                }`}
                title={unreadCount > 0 ? `${unreadCount} unread notifications` : "View notifications"}
              >
                <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'animate-pulse text-red-600' : ''}`} />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 text-[10px] flex items-center justify-center bg-red-500 hover:bg-red-500 text-white border-2 border-white shadow-lg animate-bounce font-bold"
                  >
                    {unreadCount > 99 ? "!" : unreadCount}
                  </Badge>
                )}
              </Button>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="p-2"
                title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              >
                {theme === "light" ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
              </Button>

              {/* Chef Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={user?.avatar || "/chef-avatar.jpg"}
                        alt="Chef Profile"
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user?.name ? user.name.charAt(0).toUpperCase() : "CH"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="px-2 py-1.5 text-sm text-muted-foreground border-b">
                    {user?.name || "Chef"}
                  </div>
                  <DropdownMenuItem
                    className="flex items-center gap-2"
                    onClick={handleProfile}
                  >
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center gap-2"
                    onClick={handleSettings}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto flex flex-col">
            <div className="flex-1">
              <Outlet />
            </div>

            {/* Cook Dashboard Footer */}
            <Footer variant="dashboard" />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
