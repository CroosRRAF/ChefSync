import AdvancedDataTable from "@/components/admin/AdvancedDataTable";
import AdvancedStatsCard from "@/components/admin/AdvancedStatsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminService, type AdminUser } from "@/services/adminService";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Eye,
  FileText,
  Filter,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  Users,
  UserX,
  XCircle,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const EnhancedUserManagement: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0,
  });
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [previewUser, setPreviewUser] = useState<AdminUser | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [previewAbove, setPreviewAbove] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
  });

  // Approval state
  const [activeTab, setActiveTab] = useState("users");
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [selectedApprovalUser, setSelectedApprovalUser] = useState<any>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // Fetch users
  const fetchUsers = useCallback(
    async (page = 1, search = "", role = "", status = "") => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        const response = await adminService.getUsers({
          page,
          limit: pagination.limit,
          search,
          role,
          status,
          sort_by: "date_joined",
          sort_order: "desc",
        });

        setUsers(response.users);
        setPagination(response.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    },
    [user, pagination.limit]
  );

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Enhanced search with debouncing
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  const handleSearch = useCallback(
    (searchTerm: string) => {
      // Clear previous timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      // Debounce search
      const timeout = setTimeout(() => {
        setFilters((prev) => ({ ...prev, search: searchTerm }));
        fetchUsers(1, searchTerm, filters.role, filters.status);
      }, 300);

      setSearchTimeout(timeout);
    },
    [filters.role, filters.status, searchTimeout]
  );

  // Enhanced filter change with date range support
  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      const newFilters = { ...filters, [key]: value };
      setFilters(newFilters);

      // Handle date range filters
      if (key === "date_joined") {
        const now = new Date();
        let startDate = "";

        switch (value) {
          case "today":
            startDate = now.toISOString().split("T")[0];
            break;
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            startDate = weekAgo.toISOString().split("T")[0];
            break;
          case "month":
            const monthAgo = new Date(
              now.getFullYear(),
              now.getMonth() - 1,
              now.getDate()
            );
            startDate = monthAgo.toISOString().split("T")[0];
            break;
          case "quarter":
            const quarterAgo = new Date(
              now.getFullYear(),
              now.getMonth() - 3,
              now.getDate()
            );
            startDate = quarterAgo.toISOString().split("T")[0];
            break;
        }

        if (startDate) {
          // You would need to modify the backend to support date filtering
          console.log("Date filter:", startDate);
        }
      }

      fetchUsers(1, newFilters.search, newFilters.role, newFilters.status);
    },
    [filters]
  );

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({ search: "", role: "", status: "" });
    fetchUsers(1, "", "", "");
  };

  // Get active filter count
  const activeFilterCount = Object.values(filters).filter(
    (value) => value !== ""
  ).length;

  // Handle user preview on hover
  const handleUserPreview = (user: AdminUser, event: React.MouseEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft =
      window.pageXOffset || document.documentElement.scrollLeft;

    const previewWidth = 320; // w-80 = 320px
    const previewHeight = 200; // approximate height

    let x = rect.left + rect.width / 2 + scrollLeft;
    let y = rect.top + scrollTop - 10;
    let above = true;

    // Adjust if preview would go off-screen
    if (x + previewWidth / 2 > window.innerWidth + scrollLeft) {
      x = window.innerWidth + scrollLeft - previewWidth / 2 - 10;
    } else if (x - previewWidth / 2 < scrollLeft) {
      x = scrollLeft + previewWidth / 2 + 10;
    }

    if (y - previewHeight < scrollTop) {
      // Show below instead of above
      y = rect.bottom + scrollTop + 10;
      above = false;
    }

    setPreviewUser(user);
    setShowPreview(true);
    setPreviewPosition({ x, y });
    setPreviewAbove(above);
  };

  const handlePreviewClose = () => {
    // Add a small delay to prevent flickering
    setTimeout(() => {
      setShowPreview(false);
      setPreviewUser(null);
    }, 100);
  };

  // Handle user detail view
  const handleUserDetail = async (user: AdminUser) => {
    try {
      setSelectedUser(user);
      setUserDetailLoading(true);
      setShowUserDetail(true);
      setUserDetails(null); // Reset details while loading

      const details = await adminService.getUserDetails(user.id);
      setUserDetails(details);
    } catch (err) {
      console.error("Failed to fetch user details:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch user details"
      );
      setUserDetails(null); // Ensure userDetails is null on error
    } finally {
      setUserDetailLoading(false);
    }
  };

  // Handle user update
  const handleUserUpdate = async (userId: number, updates: any) => {
    try {
      await adminService.updateUser(userId, updates);
      // Refresh user details
      if (selectedUser) {
        const details = await adminService.getUserDetails(userId);
        setUserDetails(details);
      }
      // Refresh user list
      fetchUsers(pagination.page, filters.search, filters.role, filters.status);
    } catch (err) {
      console.error("Failed to update user:", err);
      setError(err instanceof Error ? err.message : "Failed to update user");
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (
    selectedUsers: AdminUser[],
    action: string
  ) => {
    try {
      const userIds = selectedUsers.map((user) => user.id);

      switch (action) {
        case "activate":
          await adminService.bulkActivateUsers(userIds);
          break;
        case "deactivate":
          await adminService.bulkDeactivateUsers(userIds);
          break;
        case "delete":
          await adminService.bulkDeleteUsers(userIds);
          break;
        default:
          console.log(`Bulk action: ${action}`, selectedUsers);
      }
      // Refresh the user list
      fetchUsers(pagination.page, filters.search, filters.role, filters.status);
    } catch (err) {
      console.error("Failed to perform bulk action:", err);
      setError(
        err instanceof Error ? err.message : "Failed to perform bulk action"
      );
    }
  };

  // Handle user approval/rejection
  const handleUserApproval = async (
    user: AdminUser,
    action: "approve" | "reject"
  ) => {
    try {
      // Use the correct adminService method
      await adminService.approveUser(user.id, action);

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
                ...u,
                is_active: action === "approve",
                approval_status: action === "approve" ? "approved" : "rejected",
              }
            : u
        )
      );

      // Show success message
      alert(`User ${action}d successfully!`);

      // Refresh the user list
      fetchUsers(pagination.page, filters.search, filters.role, filters.status);
    } catch (error: any) {
      console.error(`Error ${action}ing user:`, error);
      alert(
        `Failed to ${action} user: ${
          error.response?.data?.detail || error.message
        }`
      );
    }
  };

  // Handle export
  const handleExport = async (data: AdminUser[]) => {
    try {
      const blob = await adminService.exportUsers({
        role: filters.role,
        status: filters.status,
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "users_export.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to export users:", err);
      setError(err instanceof Error ? err.message : "Failed to export users");
    }
  };

  // Fetch pending approvals
  const fetchPendingApprovals = useCallback(async () => {
    try {
      console.log("🔄 Fetching pending approvals...");
      setApprovalLoading(true);
      const approvals = await adminService.getPendingApprovals();
      console.log("✅ Received approvals data:", approvals);
      console.log(
        "📊 Number of pending approvals:",
        Array.isArray(approvals) ? approvals.length : "Not an array"
      );
      setPendingApprovals(approvals);
    } catch (err) {
      console.error("❌ Failed to fetch pending approvals:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch pending approvals"
      );
    } finally {
      setApprovalLoading(false);
    }
  }, []);

  // Handle approval action
  const handleApprovalAction = async (
    userId: number,
    action: "approve" | "reject",
    notes?: string
  ) => {
    try {
      await adminService.approveUser(userId, action, notes);

      // Update local state
      setPendingApprovals((prev) =>
        prev.filter((user) => user.user_id !== userId)
      );

      // Refresh approvals
      fetchPendingApprovals();

      // Show success message
      alert(`User ${action}d successfully!`);
    } catch (err) {
      console.error(`Failed to ${action} user:`, err);
      alert(
        `Failed to ${action} user: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  // Handle approval user detail view
  const handleApprovalUserDetail = async (user: any) => {
    try {
      const userDetails = await adminService.getUserForApproval(user.user_id);
      setSelectedApprovalUser(userDetails);
      setShowApprovalModal(true);
    } catch (err) {
      console.error("Failed to fetch user details for approval:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch user details"
      );
    }
  };

  // Fetch approvals when tab changes
  useEffect(() => {
    if (activeTab === "approvals") {
      fetchPendingApprovals();
    }
  }, [activeTab, fetchPendingApprovals]);

  // Get user stats
  const userStats = {
    total: pagination.total,
    active: users.filter((u) => u.is_active).length,
    inactive: users.filter((u) => !u.is_active).length,
    newThisWeek: users.filter((u) => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(u.date_joined) > weekAgo;
    }).length,
    // Calculate role counts from all users (not filtered)
    adminCount: users.filter((u) => u.role === "admin").length,
    cookCount: users.filter((u) => u.role === "cook").length,
    customerCount: users.filter((u) => u.role === "customer").length,
    deliveryCount: users.filter((u) => u.role === "delivery_agent").length,
  };

  // Table columns
  const columns = [
    {
      key: "name",
      title: "Name",
      sortable: true,
      render: (value: string, row: AdminUser) => (
        <div
          className="flex items-center space-x-3 cursor-pointer p-2 rounded transition-all duration-200 relative group hover:bg-gray-50 dark:hover:bg-gray-800"
          onMouseEnter={(e) => handleUserPreview(row, e)}
          onMouseLeave={() => {
            // Delay hiding to allow mouse to move to preview
            setTimeout(() => {
              if (!showPreview) return; // Already hidden
              setShowPreview(false);
              setPreviewUser(null);
            }, 150);
          }}
          onClick={() => handleUserDetail(row)}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700">
            {value.charAt(0).toUpperCase()}
          </div>
          <div>
            <div
              className="font-medium transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400"
              style={{
                color: theme === "dark" ? "#F9FAFB" : "#111827",
              }}
            >
              {value}
            </div>
            <div
              className="text-sm"
              style={{
                color: theme === "dark" ? "#9CA3AF" : "#6B7280",
              }}
            >
              {row.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      title: "Role",
      sortable: true,
      render: (value: string) => (
        <Badge
          variant="secondary"
          className={`text-xs ${
            value === "admin"
              ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
              : value === "cook"
              ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800"
              : value === "delivery_agent"
              ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
              : "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
          }`}
        >
          {value === "delivery_agent"
            ? "Delivery"
            : value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      ),
    },
    {
      key: "is_active",
      title: "Status",
      sortable: true,
      render: (value: boolean) => (
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              value ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          <Badge
            variant="secondary"
            className={`text-xs ${
              value
                ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
            }`}
          >
            {value ? "Active" : "Inactive"}
          </Badge>
        </div>
      ),
    },
    {
      key: "total_orders",
      title: "Orders",
      sortable: true,
      align: "center" as const,
      render: (value: number) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {value}
        </span>
      ),
    },
    {
      key: "total_spent",
      title: "Total Spent",
      sortable: true,
      align: "right" as const,
      render: (value: number) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">
          ${value.toFixed(2)}
        </span>
      ),
    },
    {
      key: "last_login",
      title: "Last Login",
      sortable: true,
      render: (value: string | null) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {value ? new Date(value).toLocaleDateString() : "Never"}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (value: any, row: AdminUser) => (
        <div className="flex items-center space-x-1">
          {/* Approval actions for pending users */}
          {(row.role === "cook" || row.role === "delivery_agent") &&
            !row.is_active && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUserApproval(row, "approve");
                  }}
                  className="h-8 w-8 p-0 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                  title="Approve User"
                >
                  <UserCheck className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUserApproval(row, "reject");
                  }}
                  className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                  title="Reject User"
                >
                  <UserX className="h-4 w-4" />
                </Button>
              </>
            )}

          {/* Standard actions */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleUserUpdate(row.id, { is_active: !row.is_active });
            }}
            className={`h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 ${
              row.is_active
                ? "text-red-600 dark:text-red-400"
                : "text-green-600 dark:text-green-400"
            }`}
            title={row.is_active ? "Deactivate User" : "Activate User"}
          >
            {row.is_active ? (
              <UserX className="h-4 w-4" />
            ) : (
              <UserCheck className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleUserDetail(row);
            }}
            className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Filter options
  const filterOptions = [
    {
      key: "role",
      label: "Role",
      options: [
        { value: "admin", label: "Admin" },
        { value: "cook", label: "Cook" },
        { value: "customer", label: "Customer" },
        { value: "delivery_agent", label: "Delivery Agent" },
      ],
    },
    {
      key: "status",
      label: "Status",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
    {
      key: "date_joined",
      label: "Registration Date",
      type: "date_range" as const,
      options: [
        { value: "today", label: "Today" },
        { value: "week", label: "This Week" },
        { value: "month", label: "This Month" },
        { value: "quarter", label: "This Quarter" },
      ],
    },
  ];

  // Bulk actions
  const bulkActions = [
    {
      label: "Activate",
      icon: <UserCheck className="h-4 w-4" />,
      action: (selectedUsers: AdminUser[]) =>
        handleBulkAction(selectedUsers, "activate"),
      variant: "default" as const,
    },
    {
      label: "Deactivate",
      icon: <UserX className="h-4 w-4" />,
      action: (selectedUsers: AdminUser[]) =>
        handleBulkAction(selectedUsers, "deactivate"),
      variant: "destructive" as const,
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      action: (selectedUsers: AdminUser[]) =>
        handleBulkAction(selectedUsers, "delete"),
      variant: "destructive" as const,
      confirmMessage:
        "Are you sure you want to delete the selected users? This action cannot be undone.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            User Management
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Manage users, roles, and permissions across your platform.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => fetchUsers()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {activeTab === "users" && (
            <>
              {activeFilterCount > 0 && (
                <Button variant="outline" onClick={handleClearFilters}>
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters ({activeFilterCount})
                </Button>
              )}
              <Button variant="outline" onClick={() => handleExport(users)}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="approvals" className="relative">
            Approvals
            {pendingApprovals.length > 0 && (
              <Badge
                variant="destructive"
                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {pendingApprovals.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AdvancedStatsCard
              title="Total Users"
              value={userStats.total}
              subtitle={`${userStats.active} active`}
              icon={<Users className="h-6 w-6" />}
              color="blue"
              onRefresh={() => fetchUsers()}
            />

            <AdvancedStatsCard
              title="Active Users"
              value={userStats.active}
              subtitle={`${userStats.inactive} inactive`}
              icon={<UserCheck className="h-6 w-6" />}
              color="green"
              onRefresh={() => fetchUsers()}
            />

            <AdvancedStatsCard
              title="New This Week"
              value={userStats.newThisWeek}
              subtitle="Recent registrations"
              icon={<Calendar className="h-6 w-6" />}
              color="purple"
              onRefresh={() => fetchUsers()}
            />
          </div>

          {/* Search and Filters Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or phone..."
                      className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent w-80 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-blue-500 dark:focus:ring-blue-400"
                      value={filters.search}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {pagination.total} users found
                    {filters.search && ` for "${filters.search}"`}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary">
                      {activeFilterCount} filter
                      {activeFilterCount > 1 ? "s" : ""} active
                    </Badge>
                  )}
                </div>
              </div>

              {/* Quick Filter Buttons */}
              <div className="flex items-center space-x-2 flex-wrap gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quick Filters:
                </span>
                <Button
                  variant={filters.role === "" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange("role", "")}
                >
                  All Users ({userStats.total})
                </Button>
                <Button
                  variant={filters.role === "admin" ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    handleFilterChange(
                      "role",
                      filters.role === "admin" ? "" : "admin"
                    )
                  }
                >
                  Admins ({userStats.adminCount})
                </Button>
                <Button
                  variant={filters.role === "cook" ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    handleFilterChange(
                      "role",
                      filters.role === "cook" ? "" : "cook"
                    )
                  }
                >
                  Cooks ({userStats.cookCount})
                </Button>
                <Button
                  variant={filters.role === "customer" ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    handleFilterChange(
                      "role",
                      filters.role === "customer" ? "" : "customer"
                    )
                  }
                >
                  Customers ({userStats.customerCount})
                </Button>
                <Button
                  variant={
                    filters.role === "delivery_agent" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    handleFilterChange(
                      "role",
                      filters.role === "delivery_agent" ? "" : "delivery_agent"
                    )
                  }
                >
                  Delivery ({userStats.deliveryCount})
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <Card className="shadow-sm border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle
                    className="text-xl font-semibold flex items-center"
                    style={{
                      color: theme === "dark" ? "#F9FAFB" : "#111827",
                    }}
                  >
                    <Users className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                    All Users
                  </CardTitle>
                  <p
                    className="text-sm mt-1"
                    style={{
                      color: theme === "dark" ? "#9CA3AF" : "#6B7280",
                    }}
                  >
                    Manage all users across your platform • {pagination.total}{" "}
                    total users
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    Page {pagination.page} of {pagination.pages}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <AdvancedDataTable
                title=""
                data={users}
                columns={columns}
                searchable
                filterable
                sortable
                selectable
                bulkActions={bulkActions}
                filters={filterOptions}
                loading={loading}
                error={error}
                onExport={handleExport}
                currentPage={pagination.page}
                totalPages={pagination.pages}
                totalItems={pagination.total}
                pageSize={pagination.limit}
                showPagination
                onPageChange={(page) =>
                  fetchUsers(page, filters.search, filters.role, filters.status)
                }
                onRowClick={(row) => handleUserDetail(row)}
              />
            </CardContent>
          </Card>

          {/* User Preview Popup */}
          {showPreview && previewUser && (
            <div
              className="fixed z-[9999] pointer-events-auto animate-in fade-in-0 zoom-in-95 duration-200"
              style={{
                left: `${previewPosition.x}px`,
                top: `${previewPosition.y}px`,
                transform: previewAbove
                  ? "translate(-50%, -100%)"
                  : "translate(-50%, 0%)",
              }}
              onMouseEnter={() => setShowPreview(true)}
              onMouseLeave={handlePreviewClose}
            >
              <div className="border rounded-xl shadow-2xl p-4 w-80 backdrop-blur-sm bg-white/98 dark:bg-gray-800/98 border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700">
                    {previewUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-semibold truncate"
                      style={{
                        color: theme === "dark" ? "#F9FAFB" : "#111827",
                      }}
                    >
                      {previewUser.name}
                    </h3>
                    <p
                      className="text-sm truncate"
                      style={{
                        color: theme === "dark" ? "#9CA3AF" : "#6B7280",
                      }}
                    >
                      {previewUser.email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div className="flex items-center space-x-2">
                    <span
                      className="font-medium"
                      style={{
                        color: theme === "dark" ? "#D1D5DB" : "#374151",
                      }}
                    >
                      Role:
                    </span>
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor:
                          previewUser.role === "admin"
                            ? theme === "dark"
                              ? "#7F1D1D"
                              : "#FEF2F2"
                            : previewUser.role === "cook"
                            ? theme === "dark"
                              ? "#92400E"
                              : "#FFFBEB"
                            : previewUser.role === "delivery_agent"
                            ? theme === "dark"
                              ? "#1E3A8A"
                              : "#EFF6FF"
                            : theme === "dark"
                            ? "#14532D"
                            : "#F0FDF4",
                        color:
                          previewUser.role === "admin"
                            ? theme === "dark"
                              ? "#FCA5A5"
                              : "#DC2626"
                            : previewUser.role === "cook"
                            ? theme === "dark"
                              ? "#FBBF24"
                              : "#D97706"
                            : previewUser.role === "delivery_agent"
                            ? theme === "dark"
                              ? "#3B82F6"
                              : "#2563EB"
                            : theme === "dark"
                            ? "#22C55E"
                            : "#16A34A",
                      }}
                      className="text-xs"
                    >
                      {previewUser.role === "delivery_agent"
                        ? "Delivery"
                        : previewUser.role.charAt(0).toUpperCase() +
                          previewUser.role.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className="font-medium"
                      style={{
                        color: theme === "dark" ? "#D1D5DB" : "#374151",
                      }}
                    >
                      Status:
                    </span>
                    <div className="flex items-center space-x-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: previewUser.is_active
                            ? "#22C55E"
                            : "#EF4444",
                        }}
                      ></div>
                      <Badge
                        variant="secondary"
                        style={{
                          backgroundColor: previewUser.is_active
                            ? theme === "dark"
                              ? "#14532D"
                              : "#F0FDF4"
                            : theme === "dark"
                            ? "#7F1D1D"
                            : "#FEF2F2",
                          color: previewUser.is_active
                            ? theme === "dark"
                              ? "#22C55E"
                              : "#16A34A"
                            : theme === "dark"
                            ? "#FCA5A5"
                            : "#DC2626",
                        }}
                        className="text-xs"
                      >
                        {previewUser.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span
                      className="font-medium"
                      style={{
                        color: theme === "dark" ? "#D1D5DB" : "#374151",
                      }}
                    >
                      Orders:
                    </span>
                    <span
                      className="ml-2 font-semibold"
                      style={{
                        color: theme === "dark" ? "#F9FAFB" : "#111827",
                      }}
                    >
                      {previewUser.total_orders}
                    </span>
                  </div>
                  <div>
                    <span
                      className="font-medium"
                      style={{
                        color: theme === "dark" ? "#D1D5DB" : "#374151",
                      }}
                    >
                      Spent:
                    </span>
                    <span
                      className="ml-2 font-semibold"
                      style={{
                        color: theme === "dark" ? "#F9FAFB" : "#111827",
                      }}
                    >
                      ${previewUser.total_spent.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div
                  className="mt-4 pt-3 border-t"
                  style={{
                    borderColor: theme === "dark" ? "#374151" : "#E5E7EB",
                  }}
                >
                  <div
                    className="flex items-center justify-between text-xs"
                    style={{
                      color: theme === "dark" ? "#9CA3AF" : "#6B7280",
                    }}
                  >
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Joined:{" "}
                        {new Date(previewUser.date_joined).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>
                        Last Login:{" "}
                        {previewUser.last_login
                          ? new Date(
                              previewUser.last_login
                            ).toLocaleDateString()
                          : "Never"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Detail Modal */}
          {showUserDetail && selectedUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div
                className="rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
                style={{
                  backgroundColor: theme === "dark" ? "#1F2937" : "#FFFFFF",
                }}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2
                      className="text-2xl font-bold"
                      style={{
                        color: theme === "dark" ? "#F9FAFB" : "#111827",
                      }}
                    >
                      User Details
                    </h2>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          userDetails &&
                          handleUserUpdate(userDetails.id, {
                            is_active: !userDetails.is_active,
                          })
                        }
                        disabled={!userDetails || userDetailLoading}
                      >
                        {userDetails?.is_active ? (
                          <>
                            <UserX className="h-4 w-4 mr-1" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowUserDetail(false);
                          setSelectedUser(null);
                          setUserDetails(null);
                        }}
                      >
                        ✕
                      </Button>
                    </div>
                  </div>

                  {userDetailLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw
                        className="h-8 w-8 animate-spin"
                        style={{
                          color: theme === "dark" ? "#3B82F6" : "#2563EB",
                        }}
                      />
                      <span
                        className="ml-2"
                        style={{
                          color: theme === "dark" ? "#9CA3AF" : "#6B7280",
                        }}
                      >
                        Loading user details...
                      </span>
                    </div>
                  ) : userDetails ? (
                    <div className="space-y-6">
                      {/* User Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center">
                              <UserCheck className="h-5 w-5 mr-2" />
                              Basic Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <div
                                className="w-12 h-12 rounded-full flex items-center justify-center"
                                style={{
                                  backgroundColor:
                                    theme === "dark" ? "#374151" : "#E5E7EB",
                                }}
                              >
                                <Users
                                  className="h-6 w-6"
                                  style={{
                                    color:
                                      theme === "dark" ? "#9CA3AF" : "#6B7280",
                                  }}
                                />
                              </div>
                              <div>
                                <h3
                                  className="font-semibold text-lg"
                                  style={{
                                    color:
                                      theme === "dark" ? "#F9FAFB" : "#111827",
                                  }}
                                >
                                  {userDetails?.name || "Loading..."}
                                </h3>
                                <p
                                  style={{
                                    color:
                                      theme === "dark" ? "#9CA3AF" : "#6B7280",
                                  }}
                                >
                                  {userDetails?.email || "Loading..."}
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Role:</span>
                                <select
                                  value={userDetails?.role || ""}
                                  onChange={(e) =>
                                    userDetails &&
                                    handleUserUpdate(userDetails.id, {
                                      role: e.target.value,
                                    })
                                  }
                                  className="ml-2 px-2 py-1 border rounded text-sm"
                                  style={{
                                    backgroundColor:
                                      theme === "dark" ? "#1F2937" : "#FFFFFF",
                                    borderColor:
                                      theme === "dark" ? "#374151" : "#D1D5DB",
                                    color:
                                      theme === "dark" ? "#F9FAFB" : "#111827",
                                  }}
                                  disabled={!userDetails || userDetailLoading}
                                >
                                  <option value="customer">Customer</option>
                                  <option value="cook">Cook</option>
                                  <option value="delivery_agent">
                                    Delivery Agent
                                  </option>
                                  <option value="admin">Admin</option>
                                </select>
                              </div>
                              <div>
                                <span className="font-medium">Status:</span>
                                <Button
                                  variant={
                                    userDetails?.is_active
                                      ? "default"
                                      : "destructive"
                                  }
                                  size="sm"
                                  className="ml-2"
                                  onClick={() =>
                                    userDetails &&
                                    handleUserUpdate(userDetails.id, {
                                      is_active: !userDetails.is_active,
                                    })
                                  }
                                  disabled={!userDetails || userDetailLoading}
                                >
                                  {userDetails?.is_active ? (
                                    <>
                                      <UserX className="h-4 w-4 mr-1" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="h-4 w-4 mr-1" />
                                      Activate
                                    </>
                                  )}
                                </Button>
                              </div>
                              <div>
                                <span className="font-medium">Phone:</span>
                                <input
                                  type="text"
                                  value={userDetails?.phone_no || ""}
                                  onChange={(e) =>
                                    setUserDetails(
                                      userDetails
                                        ? {
                                            ...userDetails,
                                            phone_no: e.target.value,
                                          }
                                        : null
                                    )
                                  }
                                  onBlur={(e) =>
                                    userDetails &&
                                    handleUserUpdate(userDetails.id, {
                                      phone_no: e.target.value,
                                    })
                                  }
                                  className="ml-2 px-2 py-1 border rounded text-sm w-32"
                                  style={{
                                    backgroundColor:
                                      theme === "dark" ? "#1F2937" : "#FFFFFF",
                                    borderColor:
                                      theme === "dark" ? "#374151" : "#D1D5DB",
                                    color:
                                      theme === "dark" ? "#F9FAFB" : "#111827",
                                  }}
                                  placeholder="Phone number"
                                  disabled={!userDetails || userDetailLoading}
                                />
                              </div>
                              <div>
                                <span className="font-medium">Address:</span>
                                <input
                                  type="text"
                                  value={userDetails?.address || ""}
                                  onChange={(e) =>
                                    setUserDetails(
                                      userDetails
                                        ? {
                                            ...userDetails,
                                            address: e.target.value,
                                          }
                                        : null
                                    )
                                  }
                                  onBlur={(e) =>
                                    userDetails &&
                                    handleUserUpdate(userDetails.id, {
                                      address: e.target.value,
                                    })
                                  }
                                  className="ml-2 px-2 py-1 border rounded text-sm w-32"
                                  style={{
                                    backgroundColor:
                                      theme === "dark" ? "#1F2937" : "#FFFFFF",
                                    borderColor:
                                      theme === "dark" ? "#374151" : "#D1D5DB",
                                    color:
                                      theme === "dark" ? "#F9FAFB" : "#111827",
                                  }}
                                  placeholder="Address"
                                  disabled={!userDetails || userDetailLoading}
                                />
                              </div>
                              <div>
                                <span className="font-medium">Joined:</span>
                                <span className="ml-2 text-gray-600">
                                  {userDetails?.date_joined
                                    ? new Date(
                                        userDetails.date_joined
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium">Last Login:</span>
                                <span className="ml-2 text-gray-600">
                                  {userDetails?.last_login
                                    ? new Date(
                                        userDetails.last_login
                                      ).toLocaleDateString()
                                    : "Never"}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center">
                              <DollarSign className="h-5 w-5 mr-2" />
                              Statistics
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                              <div
                                className="text-center p-4 rounded-lg"
                                style={{
                                  backgroundColor:
                                    theme === "dark" ? "#1E3A8A" : "#EFF6FF",
                                }}
                              >
                                <div
                                  className="text-2xl font-bold"
                                  style={{
                                    color:
                                      theme === "dark" ? "#3B82F6" : "#2563EB",
                                  }}
                                >
                                  {userDetails?.statistics?.total_orders || 0}
                                </div>
                                <div
                                  className="text-sm"
                                  style={{
                                    color:
                                      theme === "dark" ? "#9CA3AF" : "#6B7280",
                                  }}
                                >
                                  Total Orders
                                </div>
                              </div>
                              <div
                                className="text-center p-4 rounded-lg"
                                style={{
                                  backgroundColor:
                                    theme === "dark" ? "#14532D" : "#F0FDF4",
                                }}
                              >
                                <div
                                  className="text-2xl font-bold"
                                  style={{
                                    color:
                                      theme === "dark" ? "#22C55E" : "#16A34A",
                                  }}
                                >
                                  $
                                  {userDetails?.statistics?.total_spent?.toFixed(
                                    2
                                  ) || "0.00"}
                                </div>
                                <div
                                  className="text-sm"
                                  style={{
                                    color:
                                      theme === "dark" ? "#9CA3AF" : "#6B7280",
                                  }}
                                >
                                  Total Spent
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Recent Orders */}
                      {userDetails?.recent_orders &&
                        userDetails.recent_orders.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle>Recent Orders</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                {userDetails.recent_orders.map((order: any) => (
                                  <div
                                    key={order.id}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                    style={{
                                      borderColor:
                                        theme === "dark"
                                          ? "#374151"
                                          : "#E5E7EB",
                                    }}
                                  >
                                    <div>
                                      <div
                                        className="font-medium"
                                        style={{
                                          color:
                                            theme === "dark"
                                              ? "#F9FAFB"
                                              : "#111827",
                                        }}
                                      >
                                        Order #{order.order_number}
                                      </div>
                                      <div
                                        className="text-sm"
                                        style={{
                                          color:
                                            theme === "dark"
                                              ? "#9CA3AF"
                                              : "#6B7280",
                                        }}
                                      >
                                        {new Date(
                                          order.created_at
                                        ).toLocaleDateString()}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div
                                        className="font-medium"
                                        style={{
                                          color:
                                            theme === "dark"
                                              ? "#F9FAFB"
                                              : "#111827",
                                        }}
                                      >
                                        ${order.total_amount}
                                      </div>
                                      <Badge
                                        variant="secondary"
                                        style={{
                                          backgroundColor:
                                            order.status === "delivered"
                                              ? theme === "dark"
                                                ? "#14532D"
                                                : "#F0FDF4"
                                              : order.status === "cancelled"
                                              ? theme === "dark"
                                                ? "#7F1D1D"
                                                : "#FEF2F2"
                                              : theme === "dark"
                                              ? "#1F2937"
                                              : "#F3F4F6",
                                          color:
                                            order.status === "delivered"
                                              ? theme === "dark"
                                                ? "#22C55E"
                                                : "#16A34A"
                                              : order.status === "cancelled"
                                              ? theme === "dark"
                                                ? "#FCA5A5"
                                                : "#DC2626"
                                              : theme === "dark"
                                              ? "#D1D5DB"
                                              : "#374151",
                                        }}
                                      >
                                        {order.status}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                      {/* Activity Logs */}
                      {userDetails?.activity_logs &&
                        userDetails.activity_logs.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle>Recent Activity</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                {userDetails.activity_logs.map((log: any) => (
                                  <div
                                    key={log.id}
                                    className="flex items-start space-x-3 p-3 border rounded-lg"
                                    style={{
                                      borderColor:
                                        theme === "dark"
                                          ? "#374151"
                                          : "#E5E7EB",
                                    }}
                                  >
                                    <div
                                      className="w-2 h-2 rounded-full mt-2"
                                      style={{
                                        backgroundColor:
                                          theme === "dark"
                                            ? "#3B82F6"
                                            : "#2563EB",
                                      }}
                                    ></div>
                                    <div className="flex-1">
                                      <div
                                        className="font-medium"
                                        style={{
                                          color:
                                            theme === "dark"
                                              ? "#F9FAFB"
                                              : "#111827",
                                        }}
                                      >
                                        {log.action}
                                      </div>
                                      <div
                                        className="text-sm"
                                        style={{
                                          color:
                                            theme === "dark"
                                              ? "#9CA3AF"
                                              : "#6B7280",
                                        }}
                                      >
                                        {log.description}
                                      </div>
                                      <div
                                        className="text-xs mt-1"
                                        style={{
                                          color:
                                            theme === "dark"
                                              ? "#6B7280"
                                              : "#9CA3AF",
                                        }}
                                      >
                                        {new Date(
                                          log.timestamp
                                        ).toLocaleString()}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                    </div>
                  ) : (
                    <div
                      className="text-center py-8"
                      style={{
                        color: theme === "dark" ? "#9CA3AF" : "#6B7280",
                      }}
                    >
                      Failed to load user details
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="approvals" className="space-y-6">
          {/* Approvals Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2
                className="text-xl font-semibold"
                style={{
                  color: theme === "dark" ? "#F9FAFB" : "#111827",
                }}
              >
                Pending Approvals
              </h2>
              <p
                className="mt-1"
                style={{
                  color: theme === "dark" ? "#9CA3AF" : "#6B7280",
                }}
              >
                Review and approve new cooks and delivery agents.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={fetchPendingApprovals}
              disabled={approvalLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${
                  approvalLoading ? "animate-spin" : ""
                }`}
              />
              Refresh
            </Button>
          </div>

          {/* Approvals Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AdvancedStatsCard
              title="Pending Cooks"
              value={
                pendingApprovals.filter((user) => user.role === "cook").length
              }
              subtitle="Awaiting approval"
              icon={<Users className="h-6 w-6" />}
              color="yellow"
              onRefresh={fetchPendingApprovals}
            />

            <AdvancedStatsCard
              title="Pending Delivery Agents"
              value={
                pendingApprovals.filter(
                  (user) => user.role === "delivery_agent"
                ).length
              }
              subtitle="Awaiting approval"
              icon={<Users className="h-6 w-6" />}
              color="blue"
              onRefresh={fetchPendingApprovals}
            />

            <AdvancedStatsCard
              title="Total Pending"
              value={pendingApprovals.length}
              subtitle="All roles"
              icon={<Clock className="h-6 w-6" />}
              color="purple"
              onRefresh={fetchPendingApprovals}
            />
          </div>

          {/* Approvals List */}
          <Card
            className="shadow-sm border-0"
            style={{
              background:
                theme === "dark"
                  ? "linear-gradient(135deg, #1F2937 0%, #111827 100%)"
                  : "linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)",
              borderColor: theme === "dark" ? "#374151" : "#E5E7EB",
            }}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold flex items-center text-gray-900 dark:text-gray-100">
                    <Clock
                      className="h-5 w-5 mr-2"
                      style={{
                        color: theme === "dark" ? "#F59E0B" : "#D97706",
                      }}
                    />
                    Pending Approvals
                  </CardTitle>
                  <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                    {pendingApprovals.length} users waiting for approval
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {approvalLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mr-2" />
                  <span>Loading pending approvals...</span>
                </div>
              ) : pendingApprovals.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-medium mb-2">
                    No pending approvals
                  </h3>
                  <p className="text-muted-foreground">
                    All user applications have been reviewed.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingApprovals.map((user) => (
                    <Card key={user.user_id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                            style={{
                              background:
                                user.role === "cook"
                                  ? "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
                                  : "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
                            }}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold">{user.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="secondary">
                                {user.role === "delivery_agent"
                                  ? "Delivery Agent"
                                  : user.role.charAt(0).toUpperCase() +
                                    user.role.slice(1)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Applied{" "}
                                {new Date(user.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprovalUserDetail(user)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() =>
                              handleApprovalAction(user.user_id, "approve")
                            }
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              handleApprovalAction(user.user_id, "reject")
                            }
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>

                      {/* Documents Preview */}
                      {user.documents && user.documents.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center space-x-2 mb-2">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              Submitted Documents ({user.documents.length})
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {user.documents
                              .slice(0, 4)
                              .map((doc: any, index: number) => (
                                <div
                                  key={index}
                                  className="flex items-center space-x-2 p-2 bg-muted rounded"
                                >
                                  <FileText className="h-4 w-4" />
                                  <span className="text-sm truncate">
                                    {doc.document_type.name}
                                  </span>
                                </div>
                              ))}
                            {user.documents.length > 4 && (
                              <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                                <span className="text-sm text-muted-foreground">
                                  +{user.documents.length - 4} more documents
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approval User Detail Modal */}
      {showApprovalModal && selectedApprovalUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: theme === "dark" ? "#1F2937" : "#FFFFFF",
            }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2
                  className="text-2xl font-bold"
                  style={{
                    color: theme === "dark" ? "#F9FAFB" : "#111827",
                  }}
                >
                  Review Application
                </h2>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="default"
                    onClick={() =>
                      handleApprovalAction(
                        selectedApprovalUser.user_id,
                        "approve"
                      )
                    }
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() =>
                      handleApprovalAction(
                        selectedApprovalUser.user_id,
                        "reject"
                      )
                    }
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowApprovalModal(false);
                      setSelectedApprovalUser(null);
                    }}
                  >
                    ✕
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                {/* User Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Applicant Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                        style={{
                          background:
                            selectedApprovalUser.role === "cook"
                              ? "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
                              : "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
                        }}
                      >
                        {selectedApprovalUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">
                          {selectedApprovalUser.name}
                        </h3>
                        <p className="text-muted-foreground">
                          {selectedApprovalUser.email}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="secondary">
                            {selectedApprovalUser.role === "delivery_agent"
                              ? "Delivery Agent"
                              : selectedApprovalUser.role
                                  .charAt(0)
                                  .toUpperCase() +
                                selectedApprovalUser.role.slice(1)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Applied{" "}
                            {new Date(
                              selectedApprovalUser.created_at
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Phone:</span>
                        <span className="ml-2">
                          {selectedApprovalUser.phone_no || "Not provided"}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Address:</span>
                        <span className="ml-2">
                          {selectedApprovalUser.address || "Not provided"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Documents */}
                {selectedApprovalUser.documents &&
                  selectedApprovalUser.documents.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <FileText className="h-5 w-5 mr-2" />
                          Submitted Documents (
                          {selectedApprovalUser.documents.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedApprovalUser.documents.map(
                            (doc: any, index: number) => (
                              <Card key={index} className="p-4">
                                <div className="flex items-center space-x-3">
                                  <FileText className="h-8 w-8 text-muted-foreground" />
                                  <div className="flex-1">
                                    <h4 className="font-medium">
                                      {doc.document_type.name}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                      {doc.document_type.description}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Uploaded{" "}
                                      {new Date(
                                        doc.uploaded_at
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      window.open(doc.file, "_blank")
                                    }
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                </div>
                              </Card>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Approval Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Review Decision
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="default"
                        onClick={() =>
                          handleApprovalAction(
                            selectedApprovalUser.user_id,
                            "approve"
                          )
                        }
                        className="bg-green-600 hover:bg-green-700 flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve Application
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() =>
                          handleApprovalAction(
                            selectedApprovalUser.user_id,
                            "reject"
                          )
                        }
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject Application
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      Approving this application will activate the user's
                      account and allow them to access the platform. Rejecting
                      will prevent them from logging in.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedUserManagement;
