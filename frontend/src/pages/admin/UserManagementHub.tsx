import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

// Import shared components
import { 
  AnimatedStats,
  GlassCard,
  GradientButton,
  OptimisticButton,
  DataTable 
} from "@/components/admin/shared";
import type { Column } from "@/components/admin/shared/tables/DataTable";
import { useOptimisticUpdates } from "@/hooks";
import DynamicForm from "@/components/admin/shared/forms/DynamicForm";
import { BaseModal } from "@/components/admin/shared/modals";

// Import UI components
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Import icons
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Camera,
  CheckCircle,
  Clock,
  Download,
  Edit,
  Eye,
  EyeOff,
  Filter,
  Globe,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Monitor,
  Moon,
  MoreHorizontal,
  Phone,
  RefreshCw,
  Save,
  Search,
  Settings,
  Shield,
  Smartphone,
  Sun,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";

// Import services
import { adminService, type UserListResponse, type AdminUser } from "@/services/adminService";

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
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<
    "users" | "profile" | "security" | "activity"
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
  } = useOptimisticUpdates<User>(users);

  // Load user statistics
  const loadUserStats = useCallback(async () => {
    try {
      // Mock stats - replace with actual API call when available
      const stats: UserStats = {
        totalUsers: 1250,
        activeUsers: 1180,
        pendingApprovals: 15,
        newThisMonth: 87,
        customerCount: 980,
        cookCount: 45,
        deliveryAgentCount: 32,
        adminCount: 5,
      };
      setUserStats(stats);
    } catch (error) {
      console.error("Error loading user stats:", error);
    }
  }, []);

  // Load users
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response: UserListResponse = await adminService.getUsers({
        search: searchQuery,
        role: roleFilter === "all" ? undefined : roleFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
        page: 1,
        limit: 50,
      });
      
      const usersData = response.users || [];
      setUsers(usersData);
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
      
      // Mock profile data - replace with actual API call
      const profileData: AdminProfile = {
        id: user.id?.toString() || "1",
        firstName: user.name?.split(' ')[0] || "Admin",
        lastName: user.name?.split(' ')[1] || "User",
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
      
      setAdminProfile(profileData);
    } catch (error) {
      console.error("Error loading admin profile:", error);
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  // Load activity logs
  const loadActivityLogs = useCallback(async () => {
    try {
      // Mock activity logs - replace with actual API call
      const logs: ActivityLog[] = [
        {
          id: "1",
          action: "Login",
          description: "Successful admin login",
          timestamp: new Date().toISOString(),
          ipAddress: "192.168.1.1",
          device: "Chrome on Windows",
          location: "Colombo, Sri Lanka",
          status: "success",
        },
        {
          id: "2",
          action: "User Update",
          description: "Updated user permissions",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          ipAddress: "192.168.1.1",
          device: "Chrome on Windows",
          location: "Colombo, Sri Lanka",
          status: "success",
        },
      ];
      
      setActivityLogs(logs);
    } catch (error) {
      console.error("Error loading activity logs:", error);
    }
  }, []);

  // Load active sessions
  const loadSessions = useCallback(async () => {
    try {
      // Mock sessions - replace with actual API call
      const sessionsData: Session[] = [
        {
          id: "1",
          device: "Windows PC",
          browser: "Chrome 118",
          location: "Colombo, Sri Lanka",
          ipAddress: "192.168.1.1",
          lastActive: new Date().toISOString(),
          current: true,
        },
      ];
      
      setSessions(sessionsData);
    } catch (error) {
      console.error("Error loading sessions:", error);
    }
  }, []);

  // Toggle user status
  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const userToUpdate = users.find(u => u.id === userId);
      if (!userToUpdate) return;
      
      const updatedUser = { ...userToUpdate, is_active: !currentStatus };
      
      await optimisticUpdate(
        updatedUser,
        userToUpdate,
        async () => {
          await adminService.updateUser(userId, { is_active: !currentStatus });
          return updatedUser;
        }
      );
    } catch (error) {
      console.error("Error toggling user status:", error);
    }
  };

  // Delete user
  const handleDeleteUser = async (user: User) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      // For delete operations, we can use the optimisticDelete method
      await optimisticDelete(
        userToDelete,
        async () => {
          await adminService.deleteUser(userToDelete.id);
          return userToDelete;
        }
      );
      
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
      
      // Mock save - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAdminProfile({ ...adminProfile, ...updatedProfile });
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setSaving(false);
    }
  };

  // Load data on mount and tab changes
  useEffect(() => {
    loadUserStats();
    if (activeTab === "users") {
      loadUsers();
    } else if (activeTab === "profile") {
      loadAdminProfile();
    } else if (activeTab === "activity") {
      loadActivityLogs();
      loadSessions();
    }
  }, [activeTab, loadUsers, loadUserStats, loadAdminProfile, loadActivityLogs, loadSessions]);

  // User table columns
  const userColumns: Column<User>[] = [
    {
      key: "user",
      title: "User",
      render: (user: User) => (
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" />
            <AvatarFallback>
              {user.name.split(" ").map(n => n[0]).join("").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      title: "Role",
      render: (user: User) => (
        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
          {user.role.replace("_", " ")}
        </Badge>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (user: User) => (
        <div className="flex items-center space-x-2">
          <Badge variant={user.is_active ? "default" : "secondary"}>
            {user.is_active ? "Active" : "Inactive"}
          </Badge>
          {user.approval_status === 'pending' && (
            <Badge variant="outline">Pending Approval</Badge>
          )}
        </div>
      ),
    },
    {
      key: "stats",
      title: "Stats",
      render: (user: User) => (
        <div className="text-sm">
          <div>{user.total_orders} orders</div>
          <div className="text-gray-500">LKR {user.total_spent?.toLocaleString()}</div>
        </div>
      ),
    },
    {
      key: "joined",
      title: "Joined",
      render: (user: User) => (
        <div className="text-sm">
          {new Date(user.date_joined).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (user: User) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelectedUser(user)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleStatus(user.id, user.is_active)}>
              {user.is_active ? (
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
      </GlassCard>
    </div>
  );

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
                    {adminProfile.firstName[0]}{adminProfile.lastName[0]}
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
              <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={adminProfile.firstName}
                      onChange={(e) => setAdminProfile({
                        ...adminProfile,
                        firstName: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={adminProfile.lastName}
                      onChange={(e) => setAdminProfile({
                        ...adminProfile,
                        lastName: e.target.value
                      })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={adminProfile.email}
                    onChange={(e) => setAdminProfile({
                      ...adminProfile,
                      email: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={adminProfile.phone}
                    onChange={(e) => setAdminProfile({
                      ...adminProfile,
                      phone: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={adminProfile.bio}
                    onChange={(e) => setAdminProfile({
                      ...adminProfile,
                      bio: e.target.value
                    })}
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
                    onValueChange={(value) => setAdminProfile({
                      ...adminProfile,
                      timezone: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Colombo">Asia/Colombo</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={adminProfile.language}
                    onValueChange={(value) => setAdminProfile({
                      ...adminProfile,
                      language: value
                    })}
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
                    onValueChange={(value: "light" | "dark" | "system") => setAdminProfile({
                      ...adminProfile,
                      theme: value
                    })}
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
            <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
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
                  onCheckedChange={(checked) => setAdminProfile({
                    ...adminProfile,
                    emailNotifications: checked
                  })}
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
                  onCheckedChange={(checked) => setAdminProfile({
                    ...adminProfile,
                    pushNotifications: checked
                  })}
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
                  onCheckedChange={(checked) => setAdminProfile({
                    ...adminProfile,
                    smsNotifications: checked
                  })}
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
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
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
                        Last active: {new Date(session.lastActive).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {session.current && (
                      <Badge variant="default" className="text-xs">Current</Badge>
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
            <div key={log.id} className="flex items-center space-x-3 p-3 border rounded-lg">
              <div className={`h-3 w-3 rounded-full ${
                log.status === "success" ? "bg-green-500" :
                log.status === "warning" ? "bg-yellow-500" :
                "bg-red-500"
              }`} />
              <div className="flex-1">
                <div className="font-medium">{log.action}</div>
                <div className="text-sm text-gray-600">{log.description}</div>
                <div className="text-xs text-gray-400">
                  {new Date(log.timestamp).toLocaleString()} • {log.device} • {log.location}
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
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="mt-6">
          {renderUsersTab()}
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
              Are you sure you want to delete {userToDelete?.name}? This action cannot be undone.
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
    </div>
  );
};

export default UserManagementHub;
