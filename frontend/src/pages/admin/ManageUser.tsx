import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
  AlertTriangle,
  Clock,
  Download,
  Edit,
  Eye,
  MoreHorizontal,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

// Import shared components
import DynamicForm from "@/components/admin/shared/forms/DynamicForm";
import { ActionModal } from "@/components/admin/shared/modals";
import DataTable from "@/components/admin/shared/tables/DataTable";
import { StatsWidget as StatsCard } from "@/components/admin/shared/widgets/index";
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
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
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

  // Mock data for demonstration
  const mockUsers: User[] = [
    {
      id: 1,
      email: "admin@foodie.com",
      name: "Admin User",
      role: "admin",
      is_active: true,
      last_login: "2024-01-15T10:30:00Z",
      date_joined: "2023-01-01T00:00:00Z",
      total_orders: 0,
      total_spent: 0,
      phone: "+1234567890",
      verification_status: "verified",
    },
    {
      id: 2,
      email: "chef.mario@foodie.com",
      name: "Mario Giuseppe",
      role: "cook",
      is_active: true,
      last_login: "2024-01-15T14:20:00Z",
      date_joined: "2023-02-15T00:00:00Z",
      total_orders: 156,
      total_spent: 0,
      phone: "+1234567891",
      verification_status: "verified",
    },
    {
      id: 3,
      email: "john.doe@email.com",
      name: "John Doe",
      role: "customer",
      is_active: true,
      last_login: "2024-01-15T09:15:00Z",
      date_joined: "2024-01-10T00:00:00Z",
      total_orders: 23,
      total_spent: 289.5,
      phone: "+1234567892",
      verification_status: "verified",
    },
    {
      id: 4,
      email: "delivery@foodie.com",
      name: "Speed Walker",
      role: "delivery_agent",
      is_active: true,
      last_login: "2024-01-15T16:45:00Z",
      date_joined: "2023-06-01T00:00:00Z",
      total_orders: 432,
      total_spent: 0,
      phone: "+1234567893",
      verification_status: "verified",
    },
    {
      id: 5,
      email: "jane.smith@email.com",
      name: "Jane Smith",
      role: "customer",
      is_active: false,
      last_login: "2024-01-10T12:30:00Z",
      date_joined: "2024-01-05T00:00:00Z",
      total_orders: 5,
      total_spent: 67.25,
      phone: "+1234567894",
      verification_status: "pending",
    },
  ];

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
          ...user,
          verification_status: (user as any).verification_status || "verified",
        }));

        setUsers(transformedUsers);
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

  // Filter users based on search and filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.is_active) ||
      (statusFilter === "inactive" && !user.is_active) ||
      statusFilter === user.verification_status;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Table columns configuration
  const columns = [
    {
      key: "name",
      label: "User",
      render: (user: User) => (
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
      label: "Role",
      render: (user: User) => (
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
      label: "Status",
      render: (user: User) => (
        <div className="flex items-center space-x-2">
          <Badge variant={user.is_active ? "default" : "secondary"}>
            {user.is_active ? "Active" : "Inactive"}
          </Badge>
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
      label: "Activity",
      render: (user: User) => (
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
      label: "Joined",
      render: (user: User) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(user.date_joined).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (user: User) => (
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
      type: "tel",
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
    try {
      const action = user.is_active ? "deactivate" : "activate";
      await adminService.updateUserStatus(user.id, action);

      // Refresh users list
      await fetchUsers(currentPage, searchTerm, roleFilter, statusFilter);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update user status"
      );
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (
      !confirm(
        `Are you sure you want to delete ${user.name}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await adminService.deleteUser(user.id);

      // Refresh users list
      await fetchUsers(currentPage, searchTerm, roleFilter, statusFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return;

    try {
      switch (action) {
        case "activate":
          await adminService.bulkActivateUsers(selectedUsers);
          break;
        case "deactivate":
          await adminService.bulkDeactivateUsers(selectedUsers);
          break;
        case "delete":
          if (
            !confirm(
              `Are you sure you want to delete ${selectedUsers.length} users? This action cannot be undone.`
            )
          ) {
            return;
          }
          await adminService.bulkDeleteUsers(selectedUsers);
          break;
      }

      setSelectedUsers([]);
      await fetchUsers(currentPage, searchTerm, roleFilter, statusFilter);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to ${action} users`
      );
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
          phone: data.phone,
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
    <div className="p-6 space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 text-sm underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage users, roles, and permissions across your platform
          </p>
        </div>
        <Button
          onClick={handleCreateUser}
          className="flex items-center space-x-2"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add User</span>
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={userStats.total}
          subtitle={`${userStats.active} active`}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="New Today"
          value={userStats.newToday}
          subtitle="joined today"
          icon={UserPlus}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Pending Verification"
          value={userStats.pendingVerification}
          subtitle="need approval"
          icon={Clock}
          trend={{ value: 2, isPositive: false }}
        />
        <StatsCard
          title="Admins"
          value={userStats.adminCount}
          subtitle="total admins"
          icon={Shield}
        />
      </div>

      {/* Quick Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={roleFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter("all")}
            >
              All Users ({userStats.total})
            </Button>
            <Button
              variant={roleFilter === "customer" ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter("customer")}
            >
              Customers ({userStats.customerCount})
            </Button>
            <Button
              variant={roleFilter === "cook" ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter("cook")}
            >
              Cooks ({userStats.cookCount})
            </Button>
            <Button
              variant={roleFilter === "delivery_agent" ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter("delivery_agent")}
            >
              Delivery ({userStats.deliveryCount})
            </Button>
            <Button
              variant={roleFilter === "admin" ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter("admin")}
            >
              Admins ({userStats.adminCount})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main User Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>All Users</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
                startIcon={Search}
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
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
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredUsers}
            columns={columns}
            loading={loading}
            selectable
            selectedRows={selectedUsers}
            onSelectionChange={setSelectedUsers}
            pagination={{
              currentPage,
              totalPages: Math.ceil(filteredUsers.length / itemsPerPage),
              onPageChange: setCurrentPage,
            }}
            bulkActions={[
              {
                label: "Activate Selected",
                action: () => handleBulkAction("activate"),
                icon: UserCheck,
              },
              {
                label: "Deactivate Selected",
                action: () => handleBulkAction("deactivate"),
                icon: UserX,
              },
              {
                label: "Delete Selected",
                action: () => handleBulkAction("delete"),
                icon: Trash2,
                variant: "destructive",
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* Create User Modal */}
      <ActionModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        title="Create New User"
        description="Add a new user to your platform"
      >
        <DynamicForm
          fields={userFormFields}
          onSubmit={handleFormSubmit}
          submitLabel="Create User"
          cancelLabel="Cancel"
          onCancel={() => setShowCreateModal(false)}
        />
      </ActionModal>

      {/* Edit User Modal */}
      <ActionModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        title="Edit User"
        description="Update user information and settings"
      >
        {selectedUser && (
          <DynamicForm
            fields={userFormFields}
            initialValues={selectedUser}
            onSubmit={handleFormSubmit}
            submitLabel="Update User"
            cancelLabel="Cancel"
            onCancel={() => setShowEditModal(false)}
          />
        )}
      </ActionModal>

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
    </div>
  );
};

export default ManageUser;
