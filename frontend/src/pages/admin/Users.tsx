import { AdvancedStatsCard } from "@/components/admin/UnifiedStatsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminService, type AdminUser } from "@/services/adminService";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  ChefHat,
  Download,
  Eye,
  FileText,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldX,
  Star,
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
  const [chefs, setChefs] = useState<AdminUser[]>([]);
  const [customers, setCustomers] = useState<AdminUser[]>([]);
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

  // Bulk selection state
  const [selectedChefs, setSelectedChefs] = useState<number[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Approval state
  const [activeTab, setActiveTab] = useState("pending");
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [selectedApprovalUser, setSelectedApprovalUser] = useState<any>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // Fetch users by role
  const fetchUsersByRole = useCallback(
    async (role: string, page = 1, search = "", status = "") => {
      if (!user) return;

      try {
        const response = await adminService.getUsers({
          page,
          limit: pagination.limit,
          search,
          role,
          status,
          sort_by: "date_joined",
          sort_order: "desc",
        });

        if (role === "cook") {
          setChefs(response.users);
        } else if (role === "customer") {
          setCustomers(response.users);
        }

        return response;
      } catch (err) {
        console.error(`Error fetching ${role}s:`, err);
        throw err;
      }
    },
    [user, pagination.limit]
  );

  // Fetch all users (for stats)
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
    const loadData = async () => {
      try {
        setLoading(true);
        // Load chefs and customers separately
        await Promise.all([
          fetchUsersByRole("cook"),
          fetchUsersByRole("customer"),
          fetchPendingApprovals(),
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fetchUsersByRole]);

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

  // Handle bulk actions with confirmation
  const handleBulkAction = async (
    selectedUsers: AdminUser[],
    action: string
  ) => {
    if (selectedUsers.length === 0) return;

    const actionText =
      action === "activate"
        ? "activate"
        : action === "deactivate"
        ? "deactivate"
        : "delete";

    if (
      !window.confirm(
        `Are you sure you want to ${actionText} ${selectedUsers.length} user${
          selectedUsers.length > 1 ? "s" : ""
        }?`
      )
    ) {
      return;
    }

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

  // Handle approval action with confirmation
  const handleApprovalAction = async (
    userId: number,
    action: "approve" | "reject",
    notes?: string
  ) => {
    const user = safePendingApprovals.find((u) => u.user_id === userId);
    const actionText = action === "approve" ? "approve" : "reject";

    if (
      !window.confirm(
        `Are you sure you want to ${actionText} ${user?.name || "this user"}?`
      )
    ) {
      return;
    }

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

  // Bulk action handlers
  const handleBulkChefAction = async (action: string) => {
    if (selectedChefs.length === 0) return;

    try {
      setBulkActionLoading(true);

      switch (action) {
        case "activate":
          await adminService.bulkActivateUsers(selectedChefs);
          break;
        case "deactivate":
          await adminService.bulkDeactivateUsers(selectedChefs);
          break;
        case "delete":
          await adminService.bulkDeleteUsers(selectedChefs);
          break;
        case "approve":
          // Bulk approve pending chefs
          for (const chefId of selectedChefs) {
            await adminService.approveUser(chefId, "approve");
          }
          break;
      }

      // Refresh data
      await fetchUsersByRole("cook");
      setSelectedChefs([]);
      alert(`${action} completed for ${selectedChefs.length} chef(s)`);
    } catch (err) {
      console.error("Bulk action failed:", err);
      alert(`Failed to ${action} chefs`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkCustomerAction = async (action: string) => {
    if (selectedCustomers.length === 0) return;

    try {
      setBulkActionLoading(true);

      switch (action) {
        case "activate":
          await adminService.bulkActivateUsers(selectedCustomers);
          break;
        case "deactivate":
          await adminService.bulkDeactivateUsers(selectedCustomers);
          break;
        case "delete":
          await adminService.bulkDeleteUsers(selectedCustomers);
          break;
      }

      // Refresh data
      await fetchUsersByRole("customer");
      setSelectedCustomers([]);
      alert(`${action} completed for ${selectedCustomers.length} customer(s)`);
    } catch (err) {
      console.error("Bulk action failed:", err);
      alert(`Failed to ${action} customers`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Keyboard shortcuts for admin efficiency
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Ctrl/Cmd + R: Refresh data
      if ((event.ctrlKey || event.metaKey) && event.key === "r") {
        event.preventDefault();
        if (activeTab === "pending") {
          fetchPendingApprovals();
        } else if (activeTab === "chefs") {
          fetchUsersByRole("cook");
        } else if (activeTab === "customers") {
          fetchUsersByRole("customer");
        }
      }

      // Ctrl/Cmd + A: Select all (in current tab)
      if ((event.ctrlKey || event.metaKey) && event.key === "a") {
        event.preventDefault();
        if (activeTab === "chefs") {
          setSelectedChefs(chefs.map((c) => c.id));
        } else if (activeTab === "customers") {
          setSelectedCustomers(customers.map((c) => c.id));
        }
      }

      // Escape: Clear selections
      if (event.key === "Escape") {
        setSelectedChefs([]);
        setSelectedCustomers([]);
      }

      // Number keys: Switch tabs (1=pending, 2=chefs, 3=customers)
      if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        if (event.key === "1") {
          setActiveTab("pending");
        } else if (event.key === "2") {
          setActiveTab("chefs");
        } else if (event.key === "3") {
          setActiveTab("customers");
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, chefs, customers, fetchPendingApprovals, fetchUsersByRole]);

  // Ensure pendingApprovals is always an array
  const safePendingApprovals = Array.isArray(pendingApprovals) ? pendingApprovals : [];

  // Get user stats
  const userStats = {
    totalChefs: chefs.length,
    activeChefs: chefs.filter((c) => c.is_active).length,
    pendingChefs: safePendingApprovals.filter((u) => u.role === "cook").length,
    totalCustomers: customers.length,
    activeCustomers: customers.filter((c) => c.is_active).length,
    newChefsThisWeek: chefs.filter((c) => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(c.date_joined) > weekAgo;
    }).length,
    newCustomersThisWeek: customers.filter((c) => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(c.date_joined) > weekAgo;
    }).length,
  };

  // Table columns
  const columns = [
    { key: "name", title: "Name", sortable: true },
    { key: "role", title: "Role", sortable: true },
    { key: "is_active", title: "Status", sortable: true },
    { key: "total_orders", title: "Orders", sortable: true },
    { key: "total_spent", title: "Total Spent", sortable: true },
    { key: "last_login", title: "Last Login", sortable: true },
    { key: "actions", title: "Actions" },
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
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
            <span className="font-medium">Keyboard shortcuts:</span> 1-3: Switch
            tabs • Ctrl+R: Refresh • Ctrl+A: Select all • Esc: Clear selection
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => fetchUsers()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {activeTab === "customers" && (
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="relative">
            <ShieldCheck className="h-4 w-4 mr-2" />
            Pending Approvals
            {safePendingApprovals.length > 0 && (
              <Badge
                variant="destructive"
                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {safePendingApprovals.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="chefs" className="relative">
            <ChefHat className="h-4 w-4 mr-2" />
            Chefs
            {userStats.pendingChefs > 0 && (
              <Badge
                variant="destructive"
                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {userStats.pendingChefs}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="customers">
            <Users className="h-4 w-4 mr-2" />
            Customers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6">
          {/* Pending Approvals Header */}
          <Card className="shadow-sm border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold flex items-center">
                    <ShieldCheck className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" />
                    Pending Approvals
                  </CardTitle>
                  <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                    Review and approve new user applications •{" "}
                    {safePendingApprovals.length} pending
                  </p>
                </div>
                <div className="flex items-center space-x-2">
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
                  {safePendingApprovals.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Approve all ${safePendingApprovals.length} pending applications?`
                            )
                          ) {
                            safePendingApprovals.forEach((user) =>
                              handleApprovalAction(user.user_id, "approve")
                            );
                          }
                        }}
                        className="border-green-500 text-green-600 hover:bg-green-50"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Reject all ${safePendingApprovals.length} pending applications?`
                            )
                          ) {
                            safePendingApprovals.forEach((user) =>
                              handleApprovalAction(user.user_id, "reject")
                            );
                          }
                        }}
                        className="border-red-500 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject All
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {approvalLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mr-2" />
                  <span>Loading pending approvals...</span>
                </div>
              ) : safePendingApprovals.length === 0 ? (
                <div className="text-center py-12">
                  <ShieldCheck className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No Pending Approvals
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    All user applications have been reviewed.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {safePendingApprovals.map((user) => (
                    <Card
                      key={user.user_id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg bg-gradient-to-br from-orange-500 to-red-600">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                              {user.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {user.email}
                            </p>
                            <Badge variant="secondary" className="mt-1">
                              {user.role === "cook"
                                ? "Chef"
                                : user.role === "customer"
                                ? "Customer"
                                : "Delivery Agent"}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div className="text-sm">
                            <span className="font-medium">Applied:</span>{" "}
                            {new Date(user.created_at).toLocaleDateString()}
                          </div>
                          {user.phone_no && (
                            <div className="text-sm">
                              <span className="font-medium">Phone:</span>{" "}
                              {user.phone_no}
                            </div>
                          )}
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                handleApprovalAction(user.user_id, "approve")
                              }
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                handleApprovalAction(user.user_id, "reject")
                              }
                              className="flex-1"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprovalUserDetail(user)}
                            className="w-full"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="chefs" className="space-y-6">
          {/* Bulk Actions Bar */}
          {selectedChefs.length > 0 && (
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium">
                      {selectedChefs.length} chef
                      {selectedChefs.length > 1 ? "s" : ""} selected
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedChefs([])}
                    >
                      Clear Selection
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleBulkChefAction("activate")}
                      disabled={bulkActionLoading}
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Activate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkChefAction("deactivate")}
                      disabled={bulkActionLoading}
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Deactivate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkChefAction("approve")}
                      disabled={bulkActionLoading}
                      className="border-green-500 text-green-600 hover:bg-green-50"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve All
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chefs Table */}
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
                    <ChefHat className="h-5 w-5 mr-2 text-yellow-600 dark:text-yellow-400" />
                    All Chefs
                  </CardTitle>
                  <p
                    className="text-sm mt-1"
                    style={{
                      color: theme === "dark" ? "#9CA3AF" : "#6B7280",
                    }}
                  >
                    Manage chefs, approve applications, and monitor performance
                    • {chefs.length} total chefs
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
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mr-2" />
                  <span>Loading chefs...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          <Checkbox
                            checked={
                              selectedChefs.length === chefs.length &&
                              chefs.length > 0
                            }
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedChefs(chefs.map((c) => c.id));
                              } else {
                                setSelectedChefs([]);
                              }
                            }}
                          />
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Chef
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Rating
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Orders
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Revenue
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {chefs.map((chef) => (
                        <tr
                          key={chef.id}
                          className="border-b hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                          onClick={() => handleUserDetail(chef)}
                        >
                          <td className="py-3 px-4">
                            <Checkbox
                              checked={selectedChefs.includes(chef.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedChefs((prev) => [
                                    ...prev,
                                    chef.id,
                                  ]);
                                } else {
                                  setSelectedChefs((prev) =>
                                    prev.filter((id) => id !== chef.id)
                                  );
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm bg-gradient-to-br from-yellow-500 to-orange-600">
                                {chef.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium">{chef.name}</div>
                                <div className="text-sm text-gray-500">
                                  {chef.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  chef.is_active
                                    ? "bg-green-500"
                                    : "bg-yellow-500"
                                }`}
                              ></div>
                              <Badge variant="secondary">
                                {chef.is_active ? "Active" : "Pending"}
                              </Badge>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="font-medium">4.5</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium">
                              {chef.total_orders}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium">
                              ${chef.total_spent.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-1">
                              {!chef.is_active && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUserApproval(chef, "approve");
                                    }}
                                    className="h-8 w-8 p-0 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                                    title="Approve Chef"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUserApproval(chef, "reject");
                                    }}
                                    className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                                    title="Reject Chef"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUserDetail(chef);
                                }}
                                className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {chefs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No chefs found
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="customers" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AdvancedStatsCard
              title="Total Chefs"
              value={userStats.totalChefs}
              subtitle={`${userStats.activeChefs} active`}
              icon={<ChefHat className="h-6 w-6" />}
              color="yellow"
              onRefresh={() => fetchUsersByRole("cook")}
            />

            <AdvancedStatsCard
              title="Active Chefs"
              value={userStats.activeChefs}
              subtitle={`${userStats.pendingChefs} pending approval`}
              icon={<UserCheck className="h-6 w-6" />}
              color="green"
              onRefresh={() => fetchUsersByRole("cook")}
            />

            <AdvancedStatsCard
              title="Total Customers"
              value={userStats.totalCustomers}
              subtitle={`${userStats.activeCustomers} active`}
              icon={<Users className="h-6 w-6" />}
              color="blue"
              onRefresh={() => fetchUsersByRole("customer")}
            />

            <AdvancedStatsCard
              title="New This Week"
              value={
                userStats.newChefsThisWeek + userStats.newCustomersThisWeek
              }
              subtitle={`${userStats.newChefsThisWeek} chefs, ${userStats.newCustomersThisWeek} customers`}
              icon={<Calendar className="h-6 w-6" />}
              color="purple"
              onRefresh={() => {
                fetchUsersByRole("cook");
                fetchUsersByRole("customer");
              }}
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
                {activeTab === "chefs" ? (
                  <>
                    <Button
                      variant={filters.status === "" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange("status", "")}
                    >
                      All Chefs ({userStats.totalChefs})
                    </Button>
                    <Button
                      variant={
                        filters.status === "active" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => handleFilterChange("status", "active")}
                    >
                      Active ({userStats.activeChefs})
                    </Button>
                    <Button
                      variant={
                        filters.status === "inactive" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => handleFilterChange("status", "inactive")}
                    >
                      Pending Approval ({userStats.pendingChefs})
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant={filters.status === "" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange("status", "")}
                    >
                      All Customers ({userStats.totalCustomers})
                    </Button>
                    <Button
                      variant={
                        filters.status === "active" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => handleFilterChange("status", "active")}
                    >
                      Active ({userStats.activeCustomers})
                    </Button>
                    <Button
                      variant={
                        filters.status === "inactive" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => handleFilterChange("status", "inactive")}
                    >
                      Inactive (
                      {userStats.totalCustomers - userStats.activeCustomers})
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          {/* Bulk Actions Bar */}
          {selectedCustomers.length > 0 && (
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium">
                      {selectedCustomers.length} customer
                      {selectedCustomers.length > 1 ? "s" : ""} selected
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCustomers([])}
                    >
                      Clear Selection
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleBulkCustomerAction("activate")}
                      disabled={bulkActionLoading}
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Activate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkCustomerAction("deactivate")}
                      disabled={bulkActionLoading}
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Deactivate
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleBulkCustomerAction("block")}
                      disabled={bulkActionLoading}
                      className="border-red-500 text-red-600 hover:bg-red-50"
                    >
                      <ShieldX className="h-4 w-4 mr-1" />
                      Block
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Customers Table */}
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
                    All Customers
                  </CardTitle>
                  <p
                    className="text-sm mt-1"
                    style={{
                      color: theme === "dark" ? "#9CA3AF" : "#6B7280",
                    }}
                  >
                    Manage customers, view order history, and monitor activity •{" "}
                    {customers.length} total customers
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
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mr-2" />
                  <span>Loading customers...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          <Checkbox
                            checked={
                              selectedCustomers.length === customers.length &&
                              customers.length > 0
                            }
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCustomers(
                                  customers.map((c) => c.id)
                                );
                              } else {
                                setSelectedCustomers([]);
                              }
                            }}
                          />
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Customer
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Orders
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Total Spent
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Last Order
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((customer) => (
                        <tr
                          key={customer.id}
                          className="border-b hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                          onClick={() => handleUserDetail(customer)}
                        >
                          <td className="py-3 px-4">
                            <Checkbox
                              checked={selectedCustomers.includes(customer.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedCustomers((prev) => [
                                    ...prev,
                                    customer.id,
                                  ]);
                                } else {
                                  setSelectedCustomers((prev) =>
                                    prev.filter((id) => id !== customer.id)
                                  );
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm bg-gradient-to-br from-blue-500 to-purple-600">
                                {customer.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {customer.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {customer.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  customer.is_active
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                }`}
                              ></div>
                              <Badge variant="secondary">
                                {customer.is_active ? "Active" : "Blocked"}
                              </Badge>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium">
                              {customer.total_orders}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium">
                              ${customer.total_spent.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-500">
                              {customer.last_login
                                ? new Date(
                                    customer.last_login
                                  ).toLocaleDateString()
                                : "Never"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-1">
                              {!customer.is_active && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUserUpdate(customer.id, {
                                      is_active: true,
                                    });
                                  }}
                                  className="h-8 w-8 p-0 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                                  title="Unblock Customer"
                                >
                                  <ShieldCheck className="h-4 w-4" />
                                </Button>
                              )}
                              {customer.is_active && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUserUpdate(customer.id, {
                                      is_active: false,
                                    });
                                  }}
                                  className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                                  title="Block Customer"
                                >
                                  <ShieldX className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUserDetail(customer);
                                }}
                                className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {customers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No customers found
                    </div>
                  )}
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
