import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CookSidebar } from "./CookSidebar";
import { User, Settings, LogOut, Sun, Moon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import api from "@/utils/fetcher";

export default function CookLayout() {
  const [chefStatus, setChefStatus] = useState<"free" | "busy">("free");
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoBusy, setIsAutoBusy] = useState(false); // Track if busy due to order load
  const [preparingOrderCount, setPreparingOrderCount] = useState(0);
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Fetch current chef availability status on component mount
  useEffect(() => {
    const fetchChefStatus = async () => {
      try {
        console.log('Fetching chef status for user:', user?.id);
        const response = await api.get('/users/chef-profiles/');
        console.log('Chef profiles response:', response);
        
        const chefProfiles = response.results || response;
        
        // Find the current user's chef profile
        let currentChef;
        if (Array.isArray(chefProfiles)) {
          currentChef = chefProfiles.find(profile => profile.user === user?.id);
          console.log('Found chef profile:', currentChef);
        } else {
          currentChef = chefProfiles.user === user?.id ? chefProfiles : null;
        }
        
        if (currentChef?.is_available !== undefined) {
          console.log('Setting status to:', currentChef.is_available ? "free" : "busy");
          setChefStatus(currentChef.is_available ? "free" : "busy");
        } else {
          console.warn('No chef profile found for this user:', user?.id);
        }
        
        // Check order count and auto-set busy status if needed
        await checkOrderLoadAndUpdateStatus(currentChef);
      } catch (error) {
        console.error('Failed to fetch chef status:', error);
      }
    };

    if (user) {
      fetchChefStatus();
      
      // Set up periodic check every 2 minutes
      const interval = setInterval(() => {
        checkOrderLoadAndUpdateStatus();
      }, 120000); // 2 minutes
      
      return () => clearInterval(interval);
    }
  }, [user]);

  // Function to check order load and automatically update status
  const checkOrderLoadAndUpdateStatus = async (chefProfile?: any) => {
    try {
      // Get orders in preparing status for current chef
      const ordersResponse = await api.get('/orders/orders/', {
        params: {
          status: 'preparing',
          chef: user?.id
        }
      });
      
      const orders = ordersResponse.results || ordersResponse;
      const preparingCount = Array.isArray(orders) ? orders.length : (orders ? 1 : 0);
      
      console.log(`Chef has ${preparingCount} orders in preparing state`);
      setPreparingOrderCount(preparingCount);
      
      // If more than 10 orders preparing, automatically set as busy
      if (preparingCount > 10) {
        console.log('Auto-setting chef as busy due to high order load');
        
        // Find chef profile if not provided
        let currentChef = chefProfile;
        if (!currentChef) {
          const profileResponse = await api.get('/users/chef-profiles/');
          const chefProfiles = profileResponse.results || profileResponse;
          if (Array.isArray(chefProfiles)) {
            currentChef = chefProfiles.find(profile => profile.user === user?.id);
          } else {
            currentChef = chefProfiles.user === user?.id ? chefProfiles : null;
          }
        }
        
        // Auto-set as busy if currently free
        if (currentChef?.id && currentChef.is_available) {
          const response = await api.patch(`/users/chef-profiles/${currentChef.id}/toggle-availability/`);
          if (response.success && !response.is_available) {
            setChefStatus('busy');
            setIsAutoBusy(true);
            console.log('✅ Automatically set chef as busy due to order overload');
            // You could add a toast notification here
          }
        }
      }
      // If less than 8 orders and chef was auto-set to busy, could auto-free them
      else if (preparingCount < 8 && chefStatus === 'busy' && isAutoBusy) {
        console.log('Order load decreased, auto-freeing chef from busy status');
        
        // Find chef profile if not provided
        let currentChef = chefProfile;
        if (!currentChef) {
          const profileResponse = await api.get('/users/chef-profiles/');
          const chefProfiles = profileResponse.results || profileResponse;
          if (Array.isArray(chefProfiles)) {
            currentChef = chefProfiles.find(profile => profile.user === user?.id);
          } else {
            currentChef = chefProfiles.user === user?.id ? chefProfiles : null;
          }
        }
        
        // Auto-free if was auto-busy
        if (currentChef?.id && !currentChef.is_available) {
          const response = await api.patch(`/users/chef-profiles/${currentChef.id}/toggle-availability/`);
          if (response.success && response.is_available) {
            setChefStatus('free');
            setIsAutoBusy(false);
            console.log('✅ Automatically freed chef due to reduced order load');
          }
        }
      }
      
    } catch (error) {
      console.error('Failed to check order load:', error);
    }
  };

  const toggleStatus = async () => {
    if (isLoading) return;
    
    console.log('Toggling status from:', chefStatus, 'User:', user?.id);
    
    setIsLoading(true);
    try {
      // Get chef profile ID first
      const profileResponse = await api.get('/users/chef-profiles/');
      console.log('Profile response:', profileResponse);
      
      const chefProfiles = profileResponse.results || profileResponse;
      
      // Find the current user's chef profile
      let currentChef;
      if (Array.isArray(chefProfiles)) {
        currentChef = chefProfiles.find(profile => profile.user === user?.id);
        console.log('Found chef profile:', currentChef);
      } else {
        currentChef = chefProfiles.user === user?.id ? chefProfiles : null;
      }
      
      if (currentChef?.id) {
        // ✅ safe to toggle
        console.log('Toggling availability for chef ID:', currentChef.id);
        // Toggle availability
        const response = await api.patch(`/users/chef-profiles/${currentChef.id}/toggle-availability/`);
        console.log('Toggle response:', response);
        
        if (response.success) {
          const newStatus = response.is_available ? "free" : "busy";
          console.log('Setting new status:', newStatus);
          setChefStatus(newStatus);
          
          // Reset auto-busy flag since this is manual toggle
          setIsAutoBusy(false);
          
          // Show warning if manually setting to free with high order load
          if (newStatus === 'free' && preparingOrderCount > 10) {
            console.warn(`⚠️ Chef manually set to FREE with ${preparingOrderCount} orders preparing - may get auto-busy again`);
          }
        } else {
          console.log('Toggle was not successful:', response);
        }
      } else {
        console.warn("No chef profile found for this user:", user?.id);
      }
    } catch (error: any) {
      console.error('Failed to toggle chef status:', error);
      console.log('Error response:', error.response?.data);
      // Could add a toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleProfile = () => {
    navigate('/cook/profile');
  };

  const handleSettings = () => {
    navigate('/cook/settings');
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
              <h2 className="text-lg font-semibold text-card-foreground">Chef Dashboard</h2>
            </div>

            <div className="flex items-center gap-4">
              {/* Chef Status Indicator */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleStatus}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-1"
                  title={
                    isAutoBusy && chefStatus === 'busy' 
                      ? `Auto-busy: ${preparingOrderCount} orders preparing (>10) - Click to override` 
                      : chefStatus === 'busy' 
                        ? 'Click to set as Free' 
                        : 'Click to set as Busy'
                  }
                >
                  <div className={`status-indicator ${chefStatus === "free" ? "status-free" : "status-busy"}`} />
                  <span className="capitalize font-medium">
                    {isLoading 
                      ? "Updating..." 
                      : chefStatus === 'busy' && isAutoBusy 
                        ? `Busy (${preparingOrderCount} orders)` 
                        : chefStatus
                    }
                  </span>
                  {isAutoBusy && chefStatus === 'busy' && (
                    <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 px-1 rounded">
                      AUTO
                    </span>
                  )}
                </Button>
                {preparingOrderCount > 0 && !isAutoBusy && (
                  <span className="text-xs text-muted-foreground">
                    ({preparingOrderCount} preparing)
                  </span>
                )}
              </div>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="p-2"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
              </Button>

              {/* Chef Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.avatar || "/chef-avatar.jpg"} alt="Chef Profile" />
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
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
