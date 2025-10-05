import { useAuth } from "@/context/AuthContext";
import React, { useCallback, useEffect, useState } from "react";

// Import shared components
import { AnimatedStats, DataTable, GlassCard } from "@/components/admin/shared";
import type { Column } from "@/components/admin/shared/tables/DataTable";
import { useOptimisticUpdates } from "@/hooks";

// Import UI components
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

// Import icons
import {
  AlertTriangle,
  Camera,
  Clock,
  Download,
  Eye,
  Loader2,
  Lock,
  Monitor,
  MoreHorizontal,
  RefreshCw,
  Save,
  Search,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";

// Import services
import { useToast } from "@/hooks/use-toast";
import {
  adminService,
  type AdminUser,
  type UserListResponse,
} from "@/services/adminService";

/**
 * Unified User Management Hub - Consolidates 2 user-related pages
 *
 * Merged from:
 * - ManageUser.tsx (user management, CRUD operations, role management)
 * - Profile.tsx (admin profile management, settings, security)
 *
 * Features:
 * - Tabbed interface for organized access
 * - User management with advanced filtering and search
 * - User CRUD operations and bulk actions
 * - Admin profile management and settings
 * - Security settings and session management
 * - Activity logs and audit trails
 * - Consistent design and UX
 */

// Use AdminUser from service instead of local User interface
type User = AdminUser;

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  pendingApprovals: number;
  newThisMonth: number;
  customerCount: number;
  cookCount: number;
  deliveryAgentCount: number;
  adminCount: number;
}

interface AdminProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  avatar: string;
  bio: string;
  location: string;
  timezone: string;
  language: string;
  theme: "light" | "dark" | "system";
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  lastLogin: string;
  loginCount: number;
}

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  ipAddress: string;
  device: string;
  location: string;
  status: "success" | "warning" | "error";
}

interface Session {
  id: string;
  device: string;
  browser: string;
  location: string;
  ipAddress: string;
  lastActive: string;
  current: boolean;
}

const UserManagementHub: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Active tab state
  const [activeTab, setActiveTab] = useState<
    "users" | "pending" | "profile" | "security" | "activity"
  >("users");

  // User Management States
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject" | null>(null);
  const [userToApprove, setUserToApprove] = useState<User | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [selectedUserDetails, setSelectedUserDetails] = useState<any>(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);

  // Profile Management States
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setSaving] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  // Optimistic updates hook
  const {
    data: optimisticUsers,
    updateData,
    optimisticUpdate,
    optimisticDelete,
    isPending,
  } = useOptimisticUpdates<User>([]);

  // Load user statistics
  const loadUserStats = useCallback(async () => {
    try {
      console.log("Loading user stats...");
      const token = localStorage.getItem("access_token");
      console.log("Auth token:", token ? "Present" : "Missing");

      // Fetch real user stats from API
      const response = await fetch("/api/admin-management/users/stats/", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("User stats response status:", response.status);

      if (response.ok) {
        const statsData = await response.json();
        console.log("User stats data:", statsData);
        setUserStats(statsData);
      } else {
        console.error(
          "User stats API failed:",
          response.status,
          response.statusText
        );
        const errorText = await response.text();
        console.error("Error response:", errorText);

        // Fallback stats if API fails
        const fallbackStats: UserStats = {
          totalUsers: 0,
          activeUsers: 0,
          pendingApprovals: 0,
          newThisMonth: 0,
          customerCount: 0,
          cookCount: 0,
          deliveryAgentCount: 0,
          adminCount: 0,
        };
        setUserStats(fallbackStats);
      }
    } catch (error) {
      console.error("Error loading user stats:", error);

      // Set fallback data on error
      const fallbackStats: UserStats = {
        totalUsers: 0,
        activeUsers: 0,
        pendingApprovals: 0,
        newThisMonth: 0,
        customerCount: 0,
        cookCount: 0,
        deliveryAgentCount: 0,
        adminCount: 0,
      };
      setUserStats(fallbackStats);
    }
  }, []);

  // Load users
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Loading users with filters:", {
        search: searchQuery,
        role: roleFilter === "all" ? undefined : roleFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
      });

      const response: UserListResponse = await adminService.getUsers({
        search: searchQuery,
        role: roleFilter === "all" ? undefined : roleFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
        page: 1,
        limit: 50,
      });

      console.log("Users API response:", response);

      const usersData = response.users || [];
      console.log("Processed users data:", usersData);

      console.log("Setting users state:", usersData.length);
      setUsers(usersData);
      console.log("Calling updateData with:", usersData.length);
      updateData(usersData);
    } catch (error) {
      console.error("Error loading users:", error);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, roleFilter, statusFilter, updateData]);

  // Load admin profile
  const loadAdminProfile = useCallback(async () => {
    if (!user) return;

    try {
      setProfileLoading(true);

      // Fetch real profile data from API
      const response = await fetch(
        `/api/admin-management/profile/${user.id}/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const profileData = await response.json();
        setAdminProfile(profileData);
      } else {
        // Fallback profile data if API fails
        const fallbackProfile: AdminProfile = {
          id: user.id?.toString() || "1",
          firstName: user.name?.split(" ")[0] || "Admin",
          lastName: user.name?.split(" ")[1] || "User",
          email: user.email || "",
          phone: user.phone || "",
          role: user.role || "admin",
          avatar: "",
          bio: "System Administrator",
          location: "Sri Lanka",
          timezone: "Asia/Colombo",
          language: "en",
          theme: "system",
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
          twoFactorEnabled: false,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          loginCount: 0,
        };
        setAdminProfile(fallbackProfile);
      }
    } catch (error) {
      console.error("Error loading admin profile:", error);
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  // Load activity logs
  const loadActivityLogs = useCallback(async () => {
    try {
      // Fetch real activity logs from API
      const response = await fetch("/api/admin-management/activity-logs/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const logsData = await response.json();
        setActivityLogs(logsData.results || logsData);
      } else {
        // Fallback empty logs if API fails
        setActivityLogs([]);
      }
    } catch (error) {
      console.error("Error loading activity logs:", error);
    }
  }, []);

  // Load active sessions
  const loadSessions = useCallback(async () => {
    try {
      // Fetch real sessions from API
      const response = await fetch("/api/admin-management/sessions/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const sessionsData = await response.json();
        setSessions(sessionsData.results || sessionsData);
      } else {
        // Fallback empty sessions if API fails
        setSessions([]);
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
      setSessions([]);
    }
  }, []);

  // Toggle user status
  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const userToUpdate = users.find((u) => u.id === userId);
      if (!userToUpdate) return;

      const updatedUser = { ...userToUpdate, is_active: !currentStatus };

      await optimisticUpdate(updatedUser, userToUpdate, async () => {
        await adminService.updateUser(userId, { is_active: !currentStatus });
        return updatedUser;
      });
    } catch (error) {
      console.error("Error toggling user status:", error);
    }
  };

  // Delete user
  const handleDeleteUser = async (user: User) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  // Handle user approval with notes
  const handleApprove = (user: User) => {
    setUserToApprove(user);
    setApprovalAction("approve");
    setApprovalNotes("");
    setShowApprovalDialog(true);
  };

  // Handle user rejection with notes
  const handleReject = (user: User) => {
    setUserToApprove(user);
    setApprovalAction("reject");
    setApprovalNotes("");
    setShowApprovalDialog(true);
  };

  // Confirm approval/rejection with notes
  const confirmApprovalAction = async () => {
    if (!userToApprove || !approvalAction) return;

    try {
      await adminService.approveUser(userToApprove.id, approvalAction, approvalNotes);
      toast({
        title: "Success",
        description: `User ${approvalAction}d successfully`,
      });
      loadUsers(); // Refresh the list
      setShowApprovalDialog(false);
      setUserToApprove(null);
      setApprovalAction(null);
      setApprovalNotes("");
    } catch (error) {
      console.error(`Error ${approvalAction}ing user:`, error);
      toast({
        title: "Error",
        description: `Failed to ${approvalAction} user`,
        variant: "destructive",
      });
    }
  };

  // Load user details for view details
  const loadUserDetails = async (userId: number) => {
    try {
      setLoadingUserDetails(true);
      
      // First, try to get user details from admin management (works for all user types)
      try {
        const userDetails = await adminService.getUserDetails(userId);
        setSelectedUserDetails(userDetails);
        setShowUserDetails(true);
        return;
      } catch (adminError) {
        console.log("Admin service failed, trying auth endpoint:", adminError);
      }

      // If admin service fails, try the auth endpoint (only works for cook/delivery_agent)
      const response = await fetch(`/api/auth/admin/user/${userId}/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const userDetails = await response.json();
        setSelectedUserDetails(userDetails);
        setShowUserDetails(true);
      } else {
        throw new Error("Failed to fetch user details from both endpoints");
      }
    } catch (error) {
      console.error("Error loading user details:", error);
      toast({
        title: "Error",
        description: "Failed to load user details",
        variant: "destructive",
      });
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      // For delete operations, we can use the optimisticDelete method
      await optimisticDelete(userToDelete, async () => {
        await adminService.deleteUser(userToDelete.id);
        return userToDelete;
      });

      setShowDeleteDialog(false);
      setUserToDelete(null);
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  // Save admin profile
  const handleSaveProfile = async (updatedProfile: Partial<AdminProfile>) => {
    if (!adminProfile) return;

    try {
      setSaving(true);

      // Save profile via API
      const response = await fetch(
        `/api/admin-management/profile/${adminProfile.id}/`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedProfile),
        }
      );

      if (response.ok) {
        const savedProfile = await response.json();
        setAdminProfile(savedProfile);
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      } else {
        throw new Error("Failed to save profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Load data on mount and tab changes
  useEffect(() => {
    loadUserStats();
    if (activeTab === "users" || activeTab === "pending") {
      loadUsers();
    } else if (activeTab === "profile") {
      loadAdminProfile();
    } else if (activeTab === "activity") {
      loadActivityLogs();
      loadSessions();
    }
  }, [
    activeTab,
    loadUsers,
    loadUserStats,
    loadAdminProfile,
    loadActivityLogs,
    loadSessions,
  ]);

  // Sync optimistic users with users state
  useEffect(() => {
    console.log(
      "Users state changed:",
      users.length,
      "Optimistic users:",
      optimisticUsers.length
    );
    if (users.length > 0) {
      console.log("Syncing users to optimistic users:", users.length);
      updateData(users);
    }
  }, [users, updateData]);

  // User table columns
  const userColumns: Column<AdminUser>[] = [
    {
      key: "name", // Changed from "user" to "name" to match the data structure
      title: "User",
      render: (value: any, user: AdminUser) => (
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" />
            <AvatarFallback>
              {user?.name
                ? user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                : "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user?.name || "Unknown User"}</div>
            <div className="text-sm text-gray-500">
              {user?.email || "No email"}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      title: "Role",
      render: (value: any, user: AdminUser) => (
        <Badge variant={user?.role === "admin" ? "default" : "secondary"}>
          {user?.role?.replace("_", " ") || "Unknown"}
        </Badge>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (value: any, user: AdminUser) => (
        <div className="flex items-center space-x-2">
          <Badge variant={user?.is_active ? "default" : "secondary"}>
            {user?.is_active ? "Active" : "Inactive"}
          </Badge>
          {user?.approval_status === "pending" && (
            <Badge variant="outline">Pending Approval</Badge>
          )}
        </div>
      ),
    },
    {
      key: "stats",
      title: "Stats",
      render: (value: any, user: AdminUser) => (
        <div className="text-sm">
          <div>{user?.total_orders || 0} orders</div>
          <div className="text-gray-500">
            LKR {user?.total_spent?.toLocaleString() || "0"}
          </div>
        </div>
      ),
    },
    {
      key: "joined",
      title: "Joined",
      render: (value: any, user: AdminUser) => (
        <div className="text-sm">
          {user?.date_joined
            ? new Date(user.date_joined).toLocaleDateString()
            : "Unknown"}
        </div>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (value: any, user: AdminUser) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => loadUserDetails(user.id)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleToggleStatus(user?.id, user?.is_active)}
            >
              {user?.is_active ? (
                <>
                  <UserX className="h-4 w-4 mr-2" />
                  Deactivate
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Activate
                </>
              )}
            </DropdownMenuItem>
            {user?.approval_status === "pending" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleApprove(user)}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Approve User
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleReject(user)}>
                  <UserX className="h-4 w-4 mr-2" />
                  Reject User
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDeleteUser(user)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Render Users Tab
  const renderUsersTab = () => (
    <div className="space-y-6">
      {/* User Statistics */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatedStats
            value={userStats.totalUsers}
            label="Total Users"
            icon={Users}
            trend={5.2}
            gradient="blue"
          />
          <AnimatedStats
            value={userStats.activeUsers}
            label="Active Users"
            icon={UserCheck}
            trend={3.1}
            gradient="green"
          />
          <AnimatedStats
            value={userStats.pendingApprovals}
            label="Pending Approvals"
            icon={Clock}
            trend={-2.5}
            gradient="orange"
          />
          <AnimatedStats
            value={userStats.newThisMonth}
            label="New This Month"
            icon={UserPlus}
            trend={8.7}
            gradient="purple"
          />
        </div>
      )}

      {/* Filters and Search */}
      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="customer">Customers</SelectItem>
              <SelectItem value="cook">Cooks</SelectItem>
              <SelectItem value="delivery_agent">Delivery Agents</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadUsers} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </GlassCard>

      {/* Users Table */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Users</h3>
          <Button onClick={() => setShowUserModal(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <DataTable
          data={optimisticUsers}
          columns={userColumns}
          loading={loading}
        />

        {/* Debug info - remove this after fixing */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <div className="font-semibold text-blue-800 mb-2">🔍 Debug Info:</div>
          <div className="space-y-1 text-blue-700">
            <div>
              Users state length:{" "}
              <span className="font-mono bg-blue-100 px-1 rounded">
                {users.length}
              </span>
            </div>
            <div>
              Optimistic users length:{" "}
              <span className="font-mono bg-blue-100 px-1 rounded">
                {optimisticUsers.length}
              </span>
            </div>
            <div>
              Loading:{" "}
              <span className="font-mono bg-blue-100 px-1 rounded">
                {loading.toString()}
              </span>
            </div>
            <div>
              Error:{" "}
              <span className="font-mono bg-blue-100 px-1 rounded">
                {error || "None"}
              </span>
            </div>
            {optimisticUsers.length > 0 && (
              <div className="mt-2">
                <div className="font-semibold">First user data:</div>
                <pre className="bg-blue-100 p-2 rounded text-xs overflow-auto max-h-32">
                  {JSON.stringify(optimisticUsers[0], null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );

  // Render Pending Approvals Tab
  const renderPendingApprovalsTab = () => {
    const pendingUsers = users.filter(user => user.approval_status === "pending");
    
    return (
      <div className="space-y-6">
        {/* Pending Approvals Header */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Pending User Approvals</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Review and approve cook and delivery agent applications
              </p>
            </div>
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              {pendingUsers.length} Pending
            </Badge>
          </div>
        </GlassCard>

        {/* Pending Users List */}
        {pendingUsers.length > 0 ? (
          <div className="space-y-4">
            {pendingUsers.map((user) => (
              <GlassCard key={user.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src="" />
                      <AvatarFallback>
                        {user?.name
                          ? user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                          : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user?.name || "Unknown User"}</div>
                      <div className="text-sm text-gray-500">{user?.email || "No email"}</div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary">{user?.role?.replace("_", " ") || "Unknown"}</Badge>
                        <Badge variant="outline" className="text-orange-600 border-orange-200">
                          Pending Approval
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => handleApprove(user)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleReject(user)}
                      size="sm"
                      variant="destructive"
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => loadUserDetails(user.id)}
                      size="sm"
                      variant="outline"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <GlassCard className="p-6">
            <div className="text-center py-8">
              <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No Pending Approvals
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                All user applications have been reviewed and processed.
              </p>
            </div>
          </GlassCard>
        )}
      </div>
    );
  };

  // Render Profile Tab
  const renderProfileTab = () => (
    <div className="space-y-6">
      {adminProfile && (
        <>
          {/* Profile Header */}
          <GlassCard className="p-6">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={adminProfile.avatar} />
                  <AvatarFallback>
                    {adminProfile.firstName[0]}
                    {adminProfile.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">
                  {adminProfile.firstName} {adminProfile.lastName}
                </h2>
                <p className="text-gray-600">{adminProfile.role}</p>
                <p className="text-sm text-gray-500">{adminProfile.email}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Last login</div>
                <div className="font-medium">
                  {new Date(adminProfile.lastLogin).toLocaleDateString()}
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Profile Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Personal Information
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={adminProfile.firstName}
                      onChange={(e) =>
                        setAdminProfile({
                          ...adminProfile,
                          firstName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={adminProfile.lastName}
                      onChange={(e) =>
                        setAdminProfile({
                          ...adminProfile,
                          lastName: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={adminProfile.email}
                    onChange={(e) =>
                      setAdminProfile({
                        ...adminProfile,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={adminProfile.phone}
                    onChange={(e) =>
                      setAdminProfile({
                        ...adminProfile,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={adminProfile.bio}
                    onChange={(e) =>
                      setAdminProfile({
                        ...adminProfile,
                        bio: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold mb-4">Preferences</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={adminProfile.timezone}
                    onValueChange={(value) =>
                      setAdminProfile({
                        ...adminProfile,
                        timezone: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Colombo">Asia/Colombo</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">
                        America/New_York
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={adminProfile.language}
                    onValueChange={(value) =>
                      setAdminProfile({
                        ...adminProfile,
                        language: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="si">Sinhala</SelectItem>
                      <SelectItem value="ta">Tamil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <Select
                    value={adminProfile.theme}
                    onValueChange={(value: "light" | "dark" | "system") =>
                      setAdminProfile({
                        ...adminProfile,
                        theme: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={() => handleSaveProfile(adminProfile)}
              disabled={profileSaving}
            >
              {profileSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </>
      )}
    </div>
  );

  // Render Security Tab
  const renderSecurityTab = () => (
    <div className="space-y-6">
      {adminProfile && (
        <>
          {/* Notification Settings */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Notification Preferences
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Email Notifications</div>
                  <div className="text-sm text-gray-500">
                    Receive notifications via email
                  </div>
                </div>
                <Switch
                  checked={adminProfile.emailNotifications}
                  onCheckedChange={(checked) =>
                    setAdminProfile({
                      ...adminProfile,
                      emailNotifications: checked,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Push Notifications</div>
                  <div className="text-sm text-gray-500">
                    Receive push notifications in browser
                  </div>
                </div>
                <Switch
                  checked={adminProfile.pushNotifications}
                  onCheckedChange={(checked) =>
                    setAdminProfile({
                      ...adminProfile,
                      pushNotifications: checked,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">SMS Notifications</div>
                  <div className="text-sm text-gray-500">
                    Receive notifications via SMS
                  </div>
                </div>
                <Switch
                  checked={adminProfile.smsNotifications}
                  onCheckedChange={(checked) =>
                    setAdminProfile({
                      ...adminProfile,
                      smsNotifications: checked,
                    })
                  }
                />
              </div>
            </div>
          </GlassCard>

          {/* Security Settings */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">Security</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Two-Factor Authentication</div>
                  <div className="text-sm text-gray-500">
                    Add an extra layer of security to your account
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  {adminProfile.twoFactorEnabled ? "Disable" : "Enable"}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Change Password</div>
                  <div className="text-sm text-gray-500">
                    Update your account password
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Lock className="h-4 w-4 mr-2" />
                  Change
                </Button>
              </div>
            </div>
          </GlassCard>

          {/* Active Sessions */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">Active Sessions</h3>
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Monitor className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="font-medium">
                        {session.device} - {session.browser}
                      </div>
                      <div className="text-sm text-gray-500">
                        {session.location} • {session.ipAddress}
                      </div>
                      <div className="text-xs text-gray-400">
                        Last active:{" "}
                        {new Date(session.lastActive).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {session.current && (
                      <Badge variant="default" className="text-xs">
                        Current
                      </Badge>
                    )}
                    {!session.current && (
                      <Button variant="outline" size="sm">
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );

  // Render Activity Tab
  const renderActivityTab = () => (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {activityLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center space-x-3 p-3 border rounded-lg"
            >
              <div
                className={`h-3 w-3 rounded-full ${
                  log.status === "success"
                    ? "bg-green-500"
                    : log.status === "warning"
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
              />
              <div className="flex-1">
                <div className="font-medium">{log.action}</div>
                <div className="text-sm text-gray-600">{log.description}</div>
                <div className="text-xs text-gray-400">
                  {new Date(log.timestamp).toLocaleString()} • {log.device} •{" "}
                  {log.location}
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 dark:from-white dark:to-blue-400 bg-clip-text text-transparent">
            User Management Hub
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Comprehensive user management and admin profile settings
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Users
          </Button>
          <Button onClick={loadUsers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabbed Interface */}
      <Tabs
        value={activeTab}
        onValueChange={(value: any) => setActiveTab(value)}
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="pending">
            Pending Approvals {userStats?.pendingApprovals ? `(${userStats.pendingApprovals})` : ''}
          </TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          {renderUsersTab()}
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          {renderPendingApprovalsTab()}
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          {renderProfileTab()}
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          {renderSecurityTab()}
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          {renderActivityTab()}
        </TabsContent>
      </Tabs>

      {/* Delete User Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.name}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approval Dialog */}
      <AlertDialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {approvalAction === "approve" ? "Approve User" : "Reject User"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {approvalAction === "approve" 
                ? `Are you sure you want to approve ${userToApprove?.name}? This will activate their account and send them a notification email.`
                : `Are you sure you want to reject ${userToApprove?.name}? This will prevent them from using the platform and send them a notification email.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="approval-notes">
                {approvalAction === "approve" ? "Approval Notes (Optional)" : "Rejection Reason (Required)"}
              </Label>
              <Textarea
                id="approval-notes"
                placeholder={
                  approvalAction === "approve" 
                    ? "Add any notes about the approval..."
                    : "Please provide a reason for rejection..."
                }
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmApprovalAction}
              className={
                approvalAction === "approve" 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "bg-red-600 hover:bg-red-700"
              }
              disabled={approvalAction === "reject" && !approvalNotes.trim()}
            >
              {approvalAction === "approve" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Details Modal */}
      <AlertDialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <AlertDialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>User Details</AlertDialogTitle>
            <AlertDialogDescription>
              Complete information about {selectedUserDetails?.name}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {loadingUserDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading user details...</span>
            </div>
          ) : selectedUserDetails ? (
            <div className="space-y-6">
              {/* User Basic Info */}
              <GlassCard className="p-4">
                <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Name</Label>
                    <p className="text-sm">{selectedUserDetails.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Email</Label>
                    <p className="text-sm">{selectedUserDetails.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Role</Label>
                    <Badge variant="secondary">{selectedUserDetails.role}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    <Badge variant={
                      selectedUserDetails.approval_status === "approved" || selectedUserDetails.is_active 
                        ? "default" : "outline"
                    }>
                      {selectedUserDetails.approval_status_display || 
                       (selectedUserDetails.is_active ? "Active" : "Inactive")}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Phone</Label>
                    <p className="text-sm">{selectedUserDetails.phone_no || "Not provided"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Created</Label>
                    <p className="text-sm">{new Date(selectedUserDetails.date_joined || selectedUserDetails.created_at).toLocaleDateString()}</p>
                  </div>
                  {selectedUserDetails.approved_at && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Approved</Label>
                      <p className="text-sm">{new Date(selectedUserDetails.approved_at).toLocaleDateString()}</p>
                    </div>
                  )}
                  {selectedUserDetails.last_login && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Last Login</Label>
                      <p className="text-sm">{new Date(selectedUserDetails.last_login).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
                {selectedUserDetails.address && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium text-gray-500">Address</Label>
                    <p className="text-sm">{selectedUserDetails.address}</p>
                  </div>
                )}
                {selectedUserDetails.approval_notes && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium text-gray-500">Approval Notes</Label>
                    <p className="text-sm bg-gray-50 p-2 rounded">{selectedUserDetails.approval_notes}</p>
                  </div>
                )}
              </GlassCard>

              {/* User Statistics (if available) */}
              {selectedUserDetails.statistics && (
                <GlassCard className="p-4">
                  <h3 className="text-lg font-semibold mb-3">User Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Total Orders</Label>
                      <p className="text-sm font-medium">{selectedUserDetails.statistics.total_orders || 0}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Total Spent</Label>
                      <p className="text-sm font-medium">LKR {selectedUserDetails.statistics.total_spent?.toLocaleString() || "0"}</p>
                    </div>
                  </div>
                </GlassCard>
              )}

              {/* Recent Orders (if available) */}
              {selectedUserDetails.recent_orders && selectedUserDetails.recent_orders.length > 0 && (
                <GlassCard className="p-4">
                  <h3 className="text-lg font-semibold mb-3">Recent Orders</h3>
                  <div className="space-y-2">
                    {selectedUserDetails.recent_orders.map((order: any) => (
                      <div key={order.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">#{order.order_number}</p>
                          <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">LKR {order.total_amount?.toLocaleString()}</p>
                          <Badge variant="outline">{order.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}

              {/* Documents Section */}
              {selectedUserDetails.documents && selectedUserDetails.documents.length > 0 && (
                <GlassCard className="p-4">
                  <h3 className="text-lg font-semibold mb-3">Submitted Documents</h3>
                  <div className="space-y-3">
                    {selectedUserDetails.documents.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Download className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{doc.file_name}</p>
                            <p className="text-sm text-gray-500">{doc.document_type}</p>
                            <p className="text-xs text-gray-400">
                              Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(doc.file_url, '_blank')}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = doc.file_url;
                              link.download = doc.file_name;
                              link.click();
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}

              {/* Approval Actions */}
              {selectedUserDetails.approval_status === "pending" && (
                <GlassCard className="p-4">
                  <h3 className="text-lg font-semibold mb-3">Approval Actions</h3>
                  <div className="flex space-x-3">
                    <Button
                      onClick={() => {
                        setShowUserDetails(false);
                        const userId = selectedUserDetails.user_id || selectedUserDetails.id;
                        handleApprove({ id: userId, name: selectedUserDetails.name } as User);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Approve User
                    </Button>
                    <Button
                      onClick={() => {
                        setShowUserDetails(false);
                        const userId = selectedUserDetails.user_id || selectedUserDetails.id;
                        handleReject({ id: userId, name: selectedUserDetails.name } as User);
                      }}
                      variant="destructive"
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Reject User
                    </Button>
                  </div>
                </GlassCard>
              )}
            </div>
          ) : null}
          
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagementHub;
