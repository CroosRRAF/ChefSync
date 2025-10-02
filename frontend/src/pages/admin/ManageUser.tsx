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
import {
  AlertTriangle,
  Clock,
  Download,
  Edit,
  Eye,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  Search,
  Filter,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Activity,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

// Import shared components
import { 
  AnimatedStats,
  GlassCard,
  GradientButton,
  OptimisticButton,
  DataTable 
} from "@/components/admin/shared";
import { useOptimisticUpdates } from "@/hooks";
import DynamicForm from "@/components/admin/shared/forms/DynamicForm";
import { BaseModal } from "@/components/admin/shared/modals";
import { adminService, type UserListResponse } from "@/services/adminService";

/**
 * User Management Page
 *
 * Features:
 * - User table with advanced filtering and search
 * - User CRUD operations (create, read, update, delete)
 * - Role and permission management
 * - Bulk actions (role changes, status updates)
 * - User profile management
 * - User statistics and analytics
 * - Activity logs and audit trails
 */

interface User {
  id: number;
  email: string;
  name: string;
  role: "admin" | "cook" | "customer" | "delivery_agent";
  is_active: boolean;
  last_login: string | null;
  date_joined: string;
  total_orders: number;
  total_spent: number;
  phone?: string;
  address?: string;
  avatar?: string;
  verification_status?: "verified" | "pending" | "rejected";
}

interface UserStats {
  total: number;
  active: number;
  newToday: number;
  adminCount: number;
  cookCount: number;
  customerCount: number;
  deliveryCount: number;
  pendingVerification: number;
}

const ManageUser: React.FC = () => {
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Optimistic updates
  const {
    data: optimisticUsers,
    optimisticUpdate,
    optimisticDelete,
    updateData,
    isPending,
  } = useOptimisticUpdates<User>(users, {
    onSuccess: (action) => {
      console.log(`✅ ${action.type} operation completed successfully`);
    },
    onError: (action, error) => {
      console.error(`❌ ${action.type} operation failed:`, error);
      setError(`Failed to ${action.type} user: ${error.message}`);
    },
    onRevert: (action) => {
      console.log(`🔄 Reverted ${action.type} operation`);
    },
  });
  // Selection is handled inside DataTable; we'll receive selected rows in bulk actions
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [selectedUsersForBulkDelete, setSelectedUsersForBulkDelete] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0,
  });

  // User statistics
  const [userStats, setUserStats] = useState<UserStats>({
    total: 0,
    active: 0,
    newToday: 0,
    adminCount: 0,
    cookCount: 0,
    customerCount: 0,
    deliveryCount: 0,
    pendingVerification: 0,
  });

  // Calculate statistics
  const calculateStats = useCallback((usersList: User[]) => {
    const now = new Date();
    const today = now.toDateString();

    return {
      total: usersList.length,
      active: usersList.filter((user) => user.is_active).length,
      newToday: usersList.filter(
        (user) => new Date(user.date_joined).toDateString() === today
      ).length,
      adminCount: usersList.filter((user) => user.role === "admin").length,
      cookCount: usersList.filter((user) => user.role === "cook").length,
      customerCount: usersList.filter((user) => user.role === "customer")
        .length,
      deliveryCount: usersList.filter((user) => user.role === "delivery_agent")
        .length,
      pendingVerification: usersList.filter(
        (user) => user.verification_status === "pending"
      ).length,
    };
  }, []);

  // Load users from API
  const fetchUsers = useCallback(
    async (page = 1, search = "", role = "", status = "") => {
      try {
        setLoading(true);
        setError(null);

        const response: UserListResponse = await adminService.getUsers({
          page,
          limit: itemsPerPage,
          search,
          role: role === "all" ? "" : role,
          status: status === "all" ? "" : status,
          sort_by: "date_joined",
          sort_order: "desc",
        });

        // Transform API data to match component interface
        const transformedUsers: User[] = response.users.map((user) => ({
          id: user.id,
          email: user.email,
          name: user.name,
          role:
            (user.role as "admin" | "cook" | "customer" | "delivery_agent") ||
            "customer",
          is_active: user.is_active,
          last_login: user.last_login,
          date_joined: user.date_joined,
          total_orders: user.total_orders,
          total_spent: user.total_spent,
          phone: (user as any).phone_no || (user as any).phone || undefined,
          verification_status: (user as any).verification_status || "verified",
        }));

        setUsers(transformedUsers);
        updateData(transformedUsers); // Update optimistic data
        setPagination(response.pagination);
        setUserStats(calculateStats(transformedUsers));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch users");
        console.error("Error fetching users:", err);

        // Fallback to empty state on error
        setUsers([]);
        setUserStats({
          total: 0,
          active: 0,
          newToday: 0,
          adminCount: 0,
          cookCount: 0,
          customerCount: 0,
          deliveryCount: 0,
          pendingVerification: 0,
        });
      } finally {
        setLoading(false);
      }
    },
    [itemsPerPage]
  );

  // Load users on component mount and when filters change
  useEffect(() => {
    fetchUsers(currentPage, searchTerm, roleFilter, statusFilter);
  }, [currentPage, searchTerm, roleFilter, statusFilter, fetchUsers]);

  // We rely on server-side filters; client filtering not needed

  // Table columns configuration
  const columns = [
    {
      key: "name",
      title: "User",
      render: (_: any, user: User) => (
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {user.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {user.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      title: "Role",
      render: (_: any, user: User) => (
        <Badge
          variant={
            user.role === "admin"
              ? "destructive"
              : user.role === "cook"
              ? "default"
              : user.role === "delivery_agent"
              ? "secondary"
              : "outline"
          }
        >
          {user.role.replace("_", " ").toUpperCase()}
        </Badge>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (_: any, user: User) => (
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Badge 
              variant={user.is_active ? "default" : "secondary"}
              className={isPending(user.id.toString()) ? "opacity-50" : ""}
            >
              {user.is_active ? "Active" : "Inactive"}
            </Badge>
            {isPending(user.id.toString()) && (
              <div className="absolute -top-1 -right-1">
                <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
              </div>
            )}
          </div>
          {user.verification_status === "pending" && (
            <Badge variant="outline" className="text-yellow-600">
              <Clock className="h-3 w-3 mr-1" />
              Pending
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "activity",
      title: "Activity",
      render: (_: any, user: User) => (
        <div className="text-sm">
          <div className="text-gray-900 dark:text-gray-100">
            {user.total_orders} orders
          </div>
          <div className="text-gray-500 dark:text-gray-400">
            {user.role === "customer" ? `$${user.total_spent}` : "N/A"}
          </div>
        </div>
      ),
    },
    {
      key: "joined",
      title: "Joined",
      render: (_: any, user: User) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(user.date_joined).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (_: any, user: User) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewUser(user)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditUser(user)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit User
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleToggleStatus(user)}
              className={user.is_active ? "text-red-600" : "text-green-600"}
            >
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
            <DropdownMenuItem
              onClick={() => handleDeleteUser(user)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // User form configuration
  const userFormFields = [
    {
      name: "name",
      label: "Full Name",
      type: "text",
      placeholder: "Enter full name",
      required: true,
    },
    {
      name: "email",
      label: "Email Address",
      type: "email",
      placeholder: "Enter email address",
      required: true,
    },
    {
      name: "phone",
      label: "Phone Number",
      type: "text",
      placeholder: "Enter phone number",
    },
    {
      name: "role",
      label: "Role",
      type: "select",
      options: [
        { label: "Customer", value: "customer" },
        { label: "Cook", value: "cook" },
        { label: "Delivery Agent", value: "delivery_agent" },
        { label: "Admin", value: "admin" },
      ],
      required: true,
    },
    {
      name: "is_active",
      label: "Active Status",
      type: "switch",
      defaultValue: true,
    },
  ];

  // Event handlers
  const handleCreateUser = () => {
    setSelectedUser(null);
    setShowCreateModal(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const handleToggleStatus = async (user: User) => {
    const updatedUser = { ...user, is_active: !user.is_active };
    const action = user.is_active ? "deactivate" : "activate";
    
    try {
      await optimisticUpdate(
        updatedUser,
        user,
        () => adminService.updateUserStatus(user.id, action)
      );
    } catch (err) {
      // Error handling is done in the optimistic updates hook
    }
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await adminService.deleteUser(userToDelete.id);
      setShowDeleteDialog(false);
      setUserToDelete(null);

      // Refresh users list
      await fetchUsers(currentPage, searchTerm, roleFilter, statusFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  const handleBulkAction = async (
    action: "activate" | "deactivate" | "delete",
    rows: User[]
  ) => {
    const userIds = rows.map((u) => u.id);
    if (userIds.length === 0) return;

    if (action === "delete") {
      setSelectedUsersForBulkDelete(rows);
      setShowBulkDeleteDialog(true);
      return;
    }

    try {
      switch (action) {
        case "activate":
          await adminService.bulkActivateUsers(userIds);
          break;
        case "deactivate":
          await adminService.bulkDeactivateUsers(userIds);
          break;
      }

      await fetchUsers(currentPage, searchTerm, roleFilter, statusFilter);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to ${action} users`
      );
    }
  };

  const confirmBulkDeleteUsers = async () => {
    const userIds = selectedUsersForBulkDelete.map((u) => u.id);
    if (userIds.length === 0) return;

    try {
      await adminService.bulkDeleteUsers(userIds);
      setShowBulkDeleteDialog(false);
      setSelectedUsersForBulkDelete([]);

      await fetchUsers(currentPage, searchTerm, roleFilter, statusFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete users");
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (selectedUser) {
        // Update existing user
        await adminService.updateUser(selectedUser.id, {
          name: data.name,
          phone_no: data.phone,
          role: data.role,
          is_active: data.is_active,
        });
      } else {
        // Create new user
        await adminService.createUser({
          name: data.name,
          email: data.email,
          phone_no: data.phone,
          role: data.role,
          is_active: data.is_active ?? true,
        });
      }

      setShowCreateModal(false);
      setShowEditModal(false);
      setSelectedUser(null);

      // Refresh users list
      await fetchUsers(currentPage, searchTerm, roleFilter, statusFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save user");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-8">
      {/* Error Display */}
      {error && (
        <GlassCard gradient="orange" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-900 dark:text-white font-medium">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 text-sm underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Modern Header */}
      <div className="mb-8">
        <GlassCard gradient="blue" className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 dark:from-white dark:to-blue-400 bg-clip-text text-transparent">
                  User Management
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Manage users, roles, and permissions across your platform
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Activity className="h-4 w-4" />
                    {userStats.total} total users
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs text-green-600 font-medium">Live data</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <GradientButton
                gradient="green"
                icon={UserPlus}
                onClick={handleCreateUser}
              >
                Add User
              </GradientButton>
              <GradientButton
                gradient="blue"
                variant="outline"
                icon={RefreshCw}
                onClick={() => window.location.reload()}
              >
                Refresh
              </GradientButton>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <AnimatedStats
          value={userStats.total}
          label="Total Users"
          icon={Users}
          gradient="blue"
          loading={loading}
          subtitle="All registered users"
        />
        <AnimatedStats
          value={userStats.newToday}
          label="New Today"
          icon={UserPlus}
          gradient="green"
          loading={loading}
          subtitle="Joined in last 24h"
        />
        <AnimatedStats
          value={userStats.pendingVerification}
          label="Pending Verification"
          icon={Clock}
          gradient="orange"
          loading={loading}
          subtitle="Awaiting approval"
        />
        <AnimatedStats
          value={userStats.adminCount}
          label="Admins"
          icon={Shield}
          gradient="purple"
          loading={loading}
          subtitle="System administrators"
        />
      </div>

      {/* Quick Filters */}
      <GlassCard gradient="cyan" className="p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600">
            <Filter className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Quick Filters
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Filter users by role and status
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button
            variant={roleFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setRoleFilter("all")}
            className="backdrop-blur-sm bg-white/20 border-white/30 hover:bg-white/30"
          >
            All Users ({userStats.total})
          </Button>
          <Button
            variant={roleFilter === "customer" ? "default" : "outline"}
            size="sm"
            onClick={() => setRoleFilter("customer")}
            className="backdrop-blur-sm bg-white/20 border-white/30 hover:bg-white/30"
          >
            Customers ({userStats.customerCount})
          </Button>
          <Button
            variant={roleFilter === "cook" ? "default" : "outline"}
            size="sm"
            onClick={() => setRoleFilter("cook")}
            className="backdrop-blur-sm bg-white/20 border-white/30 hover:bg-white/30"
          >
            Cooks ({userStats.cookCount})
          </Button>
          <Button
            variant={roleFilter === "delivery_agent" ? "default" : "outline"}
            size="sm"
            onClick={() => setRoleFilter("delivery_agent")}
            className="backdrop-blur-sm bg-white/20 border-white/30 hover:bg-white/30"
          >
            Delivery ({userStats.deliveryCount})
          </Button>
          <Button
            variant={roleFilter === "admin" ? "default" : "outline"}
            size="sm"
            onClick={() => setRoleFilter("admin")}
            className="backdrop-blur-sm bg-white/20 border-white/30 hover:bg-white/30"
          >
            Admins ({userStats.adminCount})
          </Button>
        </div>
      </GlassCard>

      {/* Search and Filters */}
      <GlassCard gradient="purple" className="p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600">
              <Search className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Search & Filter Users
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Find and manage users efficiently
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64 backdrop-blur-sm bg-white/20 border-white/30 focus:border-purple-400"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 backdrop-blur-sm bg-white/20 border-white/30">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
              </SelectContent>
            </Select>
            <GradientButton
              gradient="purple"
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => window.location.reload()}
            >
              Refresh
            </GradientButton>
            <GradientButton
              gradient="blue"
              variant="outline"
              size="sm"
              icon={Download}
              onClick={() => console.log("Exporting users...")}
            >
              Export
            </GradientButton>
          </div>
        </div>
      </GlassCard>

      {/* Main User Table */}
      <GlassCard gradient="none" className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-r from-gray-500 to-gray-600">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              All Users
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage user accounts and permissions
            </p>
          </div>
        </div>
          <DataTable
            data={optimisticUsers}
            columns={columns}
            loading={loading}
            selectable
            searchable={false}
            pagination={{
              page: currentPage,
              pageSize: itemsPerPage,
              total: pagination.total,
              onPageChange: setCurrentPage,
              onPageSizeChange: setItemsPerPage,
            }}
            bulkActions={[
              {
                label: "Activate Selected",
                action: (rows) => handleBulkAction("activate", rows as User[]),
                icon: <UserCheck className="h-4 w-4 mr-2" />,
              },
              {
                label: "Deactivate Selected",
                action: (rows) =>
                  handleBulkAction("deactivate", rows as User[]),
                icon: <UserX className="h-4 w-4 mr-2" />,
              },
              {
                label: "Delete Selected",
                action: (rows) => handleBulkAction("delete", rows as User[]),
                icon: <Trash2 className="h-4 w-4 mr-2" />,
                variant: "destructive",
              },
            ]}
          />
      </GlassCard>

      {/* Create User Modal */}
      <BaseModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        title="Create New User"
        description="Add a new user to your platform"
        size="lg"
      >
        <DynamicForm
          fields={userFormFields as any}
          onSubmit={handleFormSubmit}
          submitText="Create User"
          cancelText="Cancel"
          onCancel={() => setShowCreateModal(false)}
        />
      </BaseModal>

      {/* Edit User Modal */}
      <BaseModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        title="Edit User"
        description="Update user information and settings"
        size="lg"
      >
        {selectedUser && (
          <DynamicForm
            fields={userFormFields as any}
            initialValues={selectedUser}
            onSubmit={handleFormSubmit}
            submitText="Update User"
            cancelText="Cancel"
            onCancel={() => setShowEditModal(false)}
          />
        )}
      </BaseModal>

      {/* User Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* User Profile Header */}
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={selectedUser.avatar}
                    alt={selectedUser.name}
                  />
                  <AvatarFallback className="text-lg">
                    {selectedUser.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                  <p className="text-gray-500">{selectedUser.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge
                      variant={selectedUser.is_active ? "default" : "secondary"}
                    >
                      {selectedUser.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">
                      {selectedUser.role.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* User Details Tabs */}
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">Information</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm text-gray-600">
                        {selectedUser.email}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Phone</Label>
                      <p className="text-sm text-gray-600">
                        {selectedUser.phone || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Role</Label>
                      <p className="text-sm text-gray-600">
                        {selectedUser.role.replace("_", " ").toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Verification Status
                      </Label>
                      <p className="text-sm text-gray-600">
                        {selectedUser.verification_status.toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Joined Date</Label>
                      <p className="text-sm text-gray-600">
                        {formatDate(selectedUser.date_joined)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Last Login</Label>
                      <p className="text-sm text-gray-600">
                        {selectedUser.last_login
                          ? formatDate(selectedUser.last_login)
                          : "Never"}
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">
                        Total Orders
                      </Label>
                      <p className="text-2xl font-bold">
                        {selectedUser.total_orders}
                      </p>
                    </div>
                    {selectedUser.role === "customer" && (
                      <div>
                        <Label className="text-sm font-medium">
                          Total Spent
                        </Label>
                        <p className="text-2xl font-bold">
                          ${selectedUser.total_spent}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    Activity logs and detailed history would be displayed here.
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">
                        Account Status
                      </Label>
                      <p className="text-sm text-gray-600">
                        {selectedUser.is_active ? "Active" : "Inactive"}
                      </p>
                    </div>
                    <Switch checked={selectedUser.is_active} />
                  </div>
                  <div className="text-sm text-gray-500">
                    Advanced settings and permissions would be managed here.
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{userToDelete?.name}</strong>?
              This action cannot be undone and will permanently remove the user
              account and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setUserToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Users Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Users</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedUsersForBulkDelete.length} users</strong>?
              This action cannot be undone and will permanently remove all selected user
              accounts and their associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowBulkDeleteDialog(false);
              setSelectedUsersForBulkDelete([]);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDeleteUsers}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete {selectedUsersForBulkDelete.length} Users
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageUser;
