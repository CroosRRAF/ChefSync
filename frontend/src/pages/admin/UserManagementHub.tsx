import { useAuth } from "@/context/AuthContext";
import React, { useCallback, useEffect, useState } from "react";

// Import shared components
import { AnimatedStats, GlassCard } from "@/components/admin/shared";
import UserDetailsModal from "@/components/admin/shared/modals/UserDetailsModal";
import EnhancedUserTable from "@/components/admin/shared/tables/EnhancedUserTable";
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
  RefreshCw,
  Save,
  Search,
  User,
  UserCheck,
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
import authService from "@/services/authService";

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

const ADMIN_PREF_STORAGE_KEY = "chefsync_admin_profile_preferences";
const ADMIN_PREF_FIELDS: (keyof AdminProfile)[] = [
  "timezone",
  "language",
  "theme",
  "emailNotifications",
  "pushNotifications",
  "smsNotifications",
  "twoFactorEnabled",
];

const getStoredAdminPreferences = (): Partial<AdminProfile> => {
  try {
    const raw = localStorage.getItem(ADMIN_PREF_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const filtered: Partial<AdminProfile> = {};
    ADMIN_PREF_FIELDS.forEach((key) => {
      if (key in parsed) {
        const value = parsed[key];
        if (value !== undefined) {
          (filtered as any)[key] = value;
        }
      }
    });
    return filtered;
  } catch (error) {
    console.error("Failed to parse admin preferences:", error);
    return {};
  }
};

const persistAdminPreferences = (updates: Partial<AdminProfile>) => {
  try {
    const current = getStoredAdminPreferences();
    const trimmed: Partial<AdminProfile> = {};
    ADMIN_PREF_FIELDS.forEach((key) => {
      if (key in updates) {
        (trimmed as any)[key] = updates[key as keyof AdminProfile];
      }
    });

    if (Object.keys(trimmed).length === 0) {
      return;
    }

    const merged = { ...current, ...trimmed };
    localStorage.setItem(ADMIN_PREF_STORAGE_KEY, JSON.stringify(merged));
  } catch (error) {
    console.error("Failed to persist admin preferences:", error);
  }
};

const UserManagementHub: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Active tab state
  const [activeTab, setActiveTab] = useState<"users" | "pending" | "profile">(
    "users"
  );

  // User Management States
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [userToApprove, setUserToApprove] = useState<User | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [selectedUserDetails, setSelectedUserDetails] = useState<any>(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [pendingUsersLoading, setPendingUsersLoading] = useState(false);

  // Profile Management States
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setSaving] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const applyPreferenceUpdates = useCallback(
    (updates: Partial<AdminProfile>) => {
      setAdminProfile((prev) => {
        if (!prev) {
          return prev;
        }
        const nextProfile = { ...prev, ...updates };
        persistAdminPreferences(updates);
        return nextProfile;
      });
    },
    []
  );

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
      const token = localStorage.getItem("access_token");

      // Fetch real user stats from API
      const response = await fetch("/api/admin-management/users/stats/", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const statsData = await response.json();
        setUserStats(statsData);
      } else {
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
      setError("Failed to load users. Please try again.");
      toast({
        title: "Error",
        description:
          "Failed to load users. Please refresh or check your connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, roleFilter, statusFilter, updateData, toast]);

  // Export functionality
  const handleExportUsers = useCallback(() => {
    try {
      let csvContent = "";
      let filename = "";
      const timestamp = new Date().toISOString().split("T")[0];

      if (activeTab === "users") {
        // Export all users
        filename = `users-${timestamp}.csv`;
        csvContent = "ID,Name,Email,Role,Phone,Status,Approval Status,Date Joined,Last Login\n";
        optimisticUsers.forEach((user: any) => {
          const row = [
            user.id || "",
            `"${(user.name || "").replace(/"/g, '""')}"`,
            user.email || "",
            user.role || "",
            user.phone_no || "",
            user.is_active ? "Active" : "Inactive",
            user.approval_status || "",
            user.date_joined || "",
            user.last_login || "",
          ];
          csvContent += row.join(",") + "\n";
        });
      } else if (activeTab === "pending") {
        // Export pending approvals
        filename = `pending-approvals-${timestamp}.csv`;
        csvContent = "ID,Name,Email,Role,Phone,Status,Documents,Date Joined\n";
        pendingUsers.forEach((user: any) => {
          const row = [
            user.id || "",
            `"${(user.name || "").replace(/"/g, '""')}"`,
            user.email || "",
            user.role || "",
            user.phone_no || "",
            user.approval_status || "",
            user.documents?.length || "0",
            user.date_joined || "",
          ];
          csvContent += row.join(",") + "\n";
        });
      }

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: "Users exported successfully",
      });
    } catch (error) {
      console.error("Error exporting users:", error);
      toast({
        title: "Error",
        description: "Failed to export users",
        variant: "destructive",
      });
    }
  }, [activeTab, optimisticUsers, pendingUsers]);

  // Load admin profile
  const loadAdminProfile = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    setProfileLoading(true);
    try {
      const response = await fetch(
        `/api/admin-management/profile/${user.id}/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Profile request failed with status ${response.status}`
        );
      }

      const profileData = (await response.json()) as AdminProfile;
      const preferences = getStoredAdminPreferences();
      setAdminProfile({ ...profileData, ...preferences });
    } catch (error) {
      console.error("Error loading admin profile:", error);

      const nameParts = (user.name || "Admin").split(" ");
      const fallbackProfile: AdminProfile = {
        id: user.id?.toString() || "1",
        firstName: nameParts[0] || "Admin",
        lastName: nameParts.slice(1).join(" ") || "User",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "admin",
        avatar: "",
        bio: "System Administrator",
        location: user.address || "Sri Lanka",
        timezone: "Asia/Colombo",
        language: "en",
        theme: "system",
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        twoFactorEnabled: false,
        createdAt: user.createdAt || new Date().toISOString(),
        lastLogin: user.updatedAt || new Date().toISOString(),
        loginCount: 0,
      };

      const preferences = getStoredAdminPreferences();
      setAdminProfile({ ...fallbackProfile, ...preferences });

      toast({
        title: "Profile unavailable",
        description: "Showing cached administrator details.",
        variant: "destructive",
      });
    } finally {
      setProfileLoading(false);
    }
  }, [toast, user]);

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
      const response = await adminService.approveUser(
        userToApprove.id,
        approvalAction,
        approvalNotes
      );

      toast({
        title: "Success",
        description: response.message || `User ${approvalAction}d successfully`,
      });

      // Refresh both lists to ensure consistency
      loadUsers();
      if (activeTab === "pending") {
        loadPendingUsers();
      }

      setShowApprovalDialog(false);
      setUserToApprove(null);
      setApprovalAction(null);
      setApprovalNotes("");
    } catch (error: any) {
      console.error(`Error ${approvalAction}ing user:`, error);

      // Extract error message from response if available
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        `Failed to ${approvalAction} user`;

      toast({
        title: "Error",
        description: errorMessage,
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

  // Handle user row click for enhanced details modal
  const handleUserRowClick = (user: User) => {
    setSelectedUserId(user.id);
    setShowUserDetailsModal(true);
  };

  // Handle approval from modal
  const handleApproveFromModal = (userId: number) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setShowUserDetailsModal(false);
      handleApprove(user);
    }
  };

  // Handle rejection from modal
  const handleRejectFromModal = (userId: number) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setShowUserDetailsModal(false);
      handleReject(user);
    }
  };

  // Load pending users from API
  const loadPendingUsers = useCallback(async () => {
    setPendingUsersLoading(true);
    try {
      const response = await adminService.getPendingApprovalsEnhanced({
        page: 1,
        limit: 100,
      });

      const pendingList = response.users || [];

      const transformedUsers: AdminUser[] = pendingList.map((pending: any) => ({
        id: pending.id,
        email: pending.email,
        name: pending.name,
        role: pending.role,
        is_active: pending.is_active ?? true,
        approval_status: pending.approval_status,
        status: pending.approval_status,
        last_login: pending.last_login,
        date_joined: pending.date_joined,
        total_orders: 0,
        total_spent: 0,
        phone_no: pending.phone_no,
        address: pending.address,
        gender: pending.gender,
        approval_notes: pending.approval_notes,
        documents: pending.documents,
      }));

      setPendingUsers(transformedUsers);
    } catch (error) {
      console.error("Error loading pending users:", error);
      toast({
        title: "Error",
        description: "Failed to load pending approvals",
        variant: "destructive",
      });
    } finally {
      setPendingUsersLoading(false);
    }
  }, [toast]);

  // Handle approve from pending users table
  const handleApprovePending = async (user: User) => {
    try {
      const response = await adminService.approveUser(user.id, "approve", "");
      toast({
        title: "Success",
        description: response.message || `User ${user.name} has been approved`,
      });
      loadPendingUsers(); // Refresh pending users
      loadUsers(); // Refresh main users list
    } catch (error: any) {
      console.error("Error approving user:", error);

      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Failed to approve user";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Handle reject from pending users table
  const handleRejectPending = async (user: User) => {
    try {
      const response = await adminService.approveUser(
        user.id,
        "reject",
        "Application rejected by admin"
      );
      toast({
        title: "Success",
        description: response.message || `User ${user.name} has been rejected`,
      });
      loadPendingUsers(); // Refresh pending users
      loadUsers(); // Refresh main users list
    } catch (error: any) {
      console.error("Error rejecting user:", error);

      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Failed to reject user";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
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

      const payload = {
        firstName: updatedProfile.firstName ?? adminProfile.firstName,
        lastName: updatedProfile.lastName ?? adminProfile.lastName,
        phone: updatedProfile.phone ?? adminProfile.phone,
        location: updatedProfile.location ?? adminProfile.location,
        bio: updatedProfile.bio ?? adminProfile.bio,
      };

      // Save profile via API
      const response = await fetch(
        `/api/admin-management/profile/${adminProfile.id}/`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok || data?.error) {
        throw new Error(
          data?.error || data?.message || "Failed to save profile"
        );
      }

      const updatedName =
        (data?.user?.name as string | undefined) ||
        `${payload.firstName} ${payload.lastName}`.trim();
      const nameParts = updatedName.trim().split(" ");

      setAdminProfile((prev) => {
        if (!prev) {
          return prev;
        }

        const firstName = nameParts[0] || prev.firstName;
        const lastName = nameParts.slice(1).join(" ") || prev.lastName;

        return {
          ...prev,
          firstName,
          lastName,
          phone: payload.phone ?? prev.phone,
          location: payload.location ?? prev.location,
          bio: payload.bio ?? prev.bio,
        };
      });

      toast({
        title: "Profile updated",
        description: data?.message || "Profile updated successfully",
      });
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description:
          error?.message ||
          error?.response?.data?.error ||
          "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (
      !passwordForm.current ||
      !passwordForm.newPassword ||
      !passwordForm.confirmNewPassword
    ) {
      setPasswordError("All password fields are required");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return;
    }

    setPasswordError(null);
    setPasswordSaving(true);

    try {
      await authService.changePassword(
        passwordForm.current,
        passwordForm.newPassword,
        passwordForm.confirmNewPassword
      );

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });

      setPasswordForm({ current: "", newPassword: "", confirmNewPassword: "" });
    } catch (error: any) {
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to change password";

      setPasswordError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  // Load data on mount and tab changes
  useEffect(() => {
    if (activeTab === "users" || activeTab === "pending") {
      loadUserStats();
    }

    if (activeTab === "users") {
      loadUsers();
    } else if (activeTab === "pending") {
      loadPendingUsers();
    } else if (activeTab === "profile") {
      loadAdminProfile();
      loadActivityLogs();
      loadSessions();
    }
  }, [
    activeTab,
    loadActivityLogs,
    loadAdminProfile,
    loadSessions,
    loadPendingUsers,
    loadUserStats,
    loadUsers,
  ]);

  // Sync optimistic users with users state
  useEffect(() => {
    if (users.length > 0) {
      updateData(users);
    }
  }, [updateData, users]);

  // Auto-trigger search when filters change
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (activeTab === "users") {
        loadUsers();
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [activeTab, loadUsers, roleFilter, searchQuery, statusFilter]);

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
            icon={User}
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
          <div className="text-sm text-gray-500">
            Manage users and their activities
          </div>
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

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading users...</span>
          </div>
        ) : (
          <EnhancedUserTable
            data={optimisticUsers}
            title="Users"
            searchable={false}
            selectable={false}
            loading={loading}
            onRowClick={handleUserRowClick}
            onRefresh={loadUsers}
            onApprove={handleApprove}
            onReject={handleReject}
            pagination={{
              page: 1,
              pageSize: 25,
              total: optimisticUsers.length,
              onPageChange: () => {},
              onPageSizeChange: () => {},
            }}
          />
        )}
      </GlassCard>
    </div>
  );

  // Render Pending Approvals Tab
  const renderPendingApprovalsTab = () => {
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
            <Badge
              variant="outline"
              className="text-orange-600 border-orange-200"
            >
              {pendingUsers.length} Pending
            </Badge>
          </div>
        </GlassCard>

        {/* Pending Users Table */}
        <EnhancedUserTable
          data={pendingUsers}
          title="Users Awaiting Approval"
          searchable={false}
          selectable={false}
          loading={pendingUsersLoading}
          onRowClick={handleUserRowClick}
          onRefresh={loadPendingUsers}
          onApprove={handleApprovePending}
          onReject={handleRejectPending}
          pagination={{
            page: 1,
            pageSize: 25,
            total: pendingUsers.length,
            onPageChange: () => {},
            onPageSizeChange: () => {},
          }}
        />
      </div>
    );
  };

  // Render Profile Tab
  const renderProfileTab = () => (
    <div className="space-y-6">
      {profileLoading ? (
        <div className="flex items-center justify-center py-16 text-sm text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading profile details...
        </div>
      ) : adminProfile ? (
        <>
          <GlassCard className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-4 sm:space-y-0">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={adminProfile.avatar} />
                  <AvatarFallback>
                    {`${adminProfile.firstName?.[0]?.toUpperCase() || "A"}${
                      adminProfile.lastName?.[0]?.toUpperCase() || "D"
                    }`}
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
              <div className="flex-1 space-y-1">
                <h2 className="text-2xl font-bold">
                  {adminProfile.firstName} {adminProfile.lastName}
                </h2>
                <p className="text-gray-600">{adminProfile.role}</p>
                <p className="text-sm text-gray-500">{adminProfile.email}</p>
              </div>
              <div className="text-sm text-gray-500 text-right">
                <div>Last login</div>
                <div className="font-medium">
                  {adminProfile.lastLogin
                    ? new Date(adminProfile.lastLogin).toLocaleDateString()
                    : "N/A"}
                </div>
              </div>
            </div>
          </GlassCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Personal Information
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={adminProfile.firstName}
                      onChange={(e) =>
                        setAdminProfile((prev) =>
                          prev ? { ...prev, firstName: e.target.value } : prev
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={adminProfile.lastName}
                      onChange={(e) =>
                        setAdminProfile((prev) =>
                          prev ? { ...prev, lastName: e.target.value } : prev
                        )
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
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Contact support to update your email address.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={adminProfile.phone}
                      onChange={(e) =>
                        setAdminProfile((prev) =>
                          prev ? { ...prev, phone: e.target.value } : prev
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={adminProfile.location}
                      onChange={(e) =>
                        setAdminProfile((prev) =>
                          prev ? { ...prev, location: e.target.value } : prev
                        )
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={adminProfile.bio}
                    onChange={(e) =>
                      setAdminProfile((prev) =>
                        prev ? { ...prev, bio: e.target.value } : prev
                      )
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
                      applyPreferenceUpdates({ timezone: value })
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
                      applyPreferenceUpdates({ language: value })
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
                    onValueChange={(value) =>
                      applyPreferenceUpdates({
                        theme: value as AdminProfile["theme"],
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      applyPreferenceUpdates({ emailNotifications: checked })
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
                      applyPreferenceUpdates({ pushNotifications: checked })
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
                      applyPreferenceUpdates({ smsNotifications: checked })
                    }
                  />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Security</h3>
                <Badge variant="outline">
                  {adminProfile.twoFactorEnabled
                    ? "2FA Enabled"
                    : "2FA Disabled"}
                </Badge>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Two-Factor Authentication</div>
                    <div className="text-sm text-gray-500">
                      Add an extra layer of security to your account
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      applyPreferenceUpdates({
                        twoFactorEnabled: !adminProfile.twoFactorEnabled,
                      })
                    }
                  >
                    {adminProfile.twoFactorEnabled ? "Disable" : "Enable"}
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="font-medium">Change Password</div>
                  <div className="grid gap-3">
                    <div>
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={passwordForm.current}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            current: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            newPassword: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirm-password">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={passwordForm.confirmNewPassword}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            confirmNewPassword: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  {passwordError && (
                    <p className="text-sm text-red-500">{passwordError}</p>
                  )}
                  <Button
                    onClick={handlePasswordChange}
                    disabled={passwordSaving}
                  >
                    {passwordSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Lock className="h-4 w-4 mr-2" />
                    )}
                    Update Password
                  </Button>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Two-factor preferences are stored locally until backend support
                is enabled.
              </p>
            </GlassCard>
          </div>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Active Sessions</h3>
              <Button variant="ghost" size="sm" onClick={loadSessions}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            <div className="space-y-3">
              {sessions.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No additional active sessions detected.
                </p>
              ) : (
                sessions.map((session) => (
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
                ))
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              <Button variant="ghost" size="sm" onClick={loadActivityLogs}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            <div className="space-y-3">
              {activityLogs.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No recent administrator activity recorded.
                </p>
              ) : (
                activityLogs.map((log) => (
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
                      <div className="text-sm text-gray-600">
                        {log.description}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(log.timestamp).toLocaleString()} •{" "}
                        {log.device} • {log.location}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </>
      ) : (
        <GlassCard className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Profile unavailable</h3>
            <p className="text-gray-600">
              We could not load your administrator profile. Please try again.
            </p>
            <Button onClick={loadAdminProfile} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </GlassCard>
      )}
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
          <Button variant="outline" onClick={handleExportUsers}>
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="pending">
            Pending Approvals{" "}
            {userStats?.pendingApprovals
              ? `(${userStats.pendingApprovals})`
              : ""}
          </TabsTrigger>
          <TabsTrigger value="profile">Profile &amp; Security</TabsTrigger>
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
      <AlertDialog
        open={showApprovalDialog}
        onOpenChange={setShowApprovalDialog}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {approvalAction === "approve" ? "Approve User" : "Reject User"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {approvalAction === "approve"
                ? `Are you sure you want to approve ${userToApprove?.name}? This will activate their account and send them a notification email.`
                : `Are you sure you want to reject ${userToApprove?.name}? This will prevent them from using the platform and send them a notification email.`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="approval-notes">
                {approvalAction === "approve"
                  ? "Approval Notes (Optional)"
                  : "Rejection Reason (Required)"}
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
                <h3 className="text-lg font-semibold mb-3">
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Name
                    </Label>
                    <p className="text-sm">{selectedUserDetails.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Email
                    </Label>
                    <p className="text-sm">{selectedUserDetails.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Role
                    </Label>
                    <Badge variant="secondary">
                      {selectedUserDetails.role}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Status
                    </Label>
                    <Badge
                      variant={
                        selectedUserDetails.approval_status === "approved" ||
                        selectedUserDetails.is_active
                          ? "default"
                          : "outline"
                      }
                    >
                      {selectedUserDetails.approval_status_display ||
                        (selectedUserDetails.is_active ? "Active" : "Inactive")}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Phone
                    </Label>
                    <p className="text-sm">
                      {selectedUserDetails.phone_no || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Created
                    </Label>
                    <p className="text-sm">
                      {new Date(
                        selectedUserDetails.date_joined ||
                          selectedUserDetails.created_at
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedUserDetails.approved_at && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Approved
                      </Label>
                      <p className="text-sm">
                        {new Date(
                          selectedUserDetails.approved_at
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {selectedUserDetails.last_login && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Last Login
                      </Label>
                      <p className="text-sm">
                        {new Date(
                          selectedUserDetails.last_login
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
                {selectedUserDetails.address && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium text-gray-500">
                      Address
                    </Label>
                    <p className="text-sm">{selectedUserDetails.address}</p>
                  </div>
                )}
                {selectedUserDetails.approval_notes && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium text-gray-500">
                      Approval Notes
                    </Label>
                    <p className="text-sm bg-gray-50 p-2 rounded">
                      {selectedUserDetails.approval_notes}
                    </p>
                  </div>
                )}
              </GlassCard>

              {/* User Statistics (if available) */}
              {selectedUserDetails.statistics && (
                <GlassCard className="p-4">
                  <h3 className="text-lg font-semibold mb-3">
                    User Statistics
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Total Orders
                      </Label>
                      <p className="text-sm font-medium">
                        {selectedUserDetails.statistics.total_orders || 0}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Total Spent
                      </Label>
                      <p className="text-sm font-medium">
                        LKR{" "}
                        {selectedUserDetails.statistics.total_spent?.toLocaleString() ||
                          "0"}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              )}

              {/* Recent Orders (if available) */}
              {selectedUserDetails.recent_orders &&
                selectedUserDetails.recent_orders.length > 0 && (
                  <GlassCard className="p-4">
                    <h3 className="text-lg font-semibold mb-3">
                      Recent Orders
                    </h3>
                    <div className="space-y-2">
                      {selectedUserDetails.recent_orders.map((order: any) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <div>
                            <p className="font-medium">#{order.order_number}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              LKR {order.total_amount?.toLocaleString()}
                            </p>
                            <Badge variant="outline">{order.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}

              {/* Documents Section */}
              {selectedUserDetails.documents &&
                selectedUserDetails.documents.length > 0 && (
                  <GlassCard className="p-4">
                    <h3 className="text-lg font-semibold mb-3">
                      Submitted Documents
                    </h3>
                    <div className="space-y-3">
                      {selectedUserDetails.documents.map((doc: any) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Download className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{doc.file_name}</p>
                              <p className="text-sm text-gray-500">
                                {doc.document_type}
                              </p>
                              <p className="text-xs text-gray-400">
                                Uploaded:{" "}
                                {new Date(doc.uploaded_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => 
                                window.open(doc.file_url, "_blank", "noopener,noreferrer")
                              }
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const link = document.createElement("a");
                                link.href = doc.file_url;
                                link.download = doc.file_name;
                                link.target = "_blank";
                                link.rel = "noopener noreferrer";
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
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
                  <h3 className="text-lg font-semibold mb-3">
                    Approval Actions
                  </h3>
                  <div className="flex space-x-3">
                    <Button
                      onClick={() => {
                        setShowUserDetails(false);
                        const userId =
                          selectedUserDetails.user_id || selectedUserDetails.id;
                        handleApprove({
                          id: userId,
                          name: selectedUserDetails.name,
                        } as User);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Approve User
                    </Button>
                    <Button
                      onClick={() => {
                        setShowUserDetails(false);
                        const userId =
                          selectedUserDetails.user_id || selectedUserDetails.id;
                        handleReject({
                          id: userId,
                          name: selectedUserDetails.name,
                        } as User);
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

      {/* Enhanced User Details Modal */}
      <UserDetailsModal
        isOpen={showUserDetailsModal}
        onClose={() => setShowUserDetailsModal(false)}
        userId={selectedUserId}
        onApprove={handleApproveFromModal}
        onReject={handleRejectFromModal}
      />
    </div>
  );
};

export default UserManagementHub;
