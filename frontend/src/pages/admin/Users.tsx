import AdvancedDataTable from "@/components/admin/AdvancedDataTable";
import AdvancedStatsCard from "@/components/admin/AdvancedStatsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  adminService,
  type AdminUser,
  type ApprovalDocument,
  type PendingApprovalUser,
} from "@/services/adminService";
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Clock3,
  DollarSign,
  Download,
  Eye,
  FileText,
  Filter,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  UserX,
  XCircle,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

type DocumentPreviewState = {
  doc: ApprovalDocument;
  url: string;
  type: "image" | "pdf" | "other";
  displayName: string;
};

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
    approval_status: "",
  });

  // Approval state
  const [activeTab, setActiveTab] = useState("users");
  const [pendingApprovals, setPendingApprovals] = useState<
    PendingApprovalUser[]
  >([]);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [selectedApprovalUser, setSelectedApprovalUser] =
    useState<PendingApprovalUser | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [documentPreview, setDocumentPreview] =
    useState<DocumentPreviewState | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewUrlRef = useRef<string | null>(null);
  const [documentReviewLoading, setDocumentReviewLoading] = useState<
    number | null
  >(null);

  const guessMimeType = useCallback((extension: string): string => {
    switch (extension) {
      case "jpg":
      case "jpeg":
      case "jfif":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "gif":
        return "image/gif";
      case "bmp":
        return "image/bmp";
      case "webp":
        return "image/webp";
      case "svg":
        return "image/svg+xml";
      case "heic":
      case "heif":
        return "image/heic";
      case "avif":
        return "image/avif";
      case "pdf":
        return "application/pdf";
      default:
        return "application/octet-stream";
    }
  }, []);

  const resolveDocumentUrl = useCallback((filePath: string): string => {
    if (!filePath) return "";
    if (/^https?:\/\//i.test(filePath)) {
      return filePath;
    }

    const baseUrl =
      import.meta.env.VITE_MEDIA_BASE_URL ||
      import.meta.env.VITE_BACKEND_URL ||
      (typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:8000");

    try {
      return new URL(filePath, baseUrl).toString();
    } catch (error) {
      console.warn("Failed to resolve document URL", {
        filePath,
        baseUrl,
        error,
      });
      return filePath;
    }
  }, []);

  const handleDocumentPreview = useCallback(
    async (doc: ApprovalDocument) => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }

      const sanitizedPath = (doc.file || "").split("?")[0];
      const extension = sanitizedPath.split(".").pop()?.toLowerCase() ?? "";
      const imageExtensions = [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "bmp",
        "webp",
        "svg",
        "heic",
        "heif",
        "jfif",
        "avif",
      ];

      let type: DocumentPreviewState["type"] = "other";
      if (imageExtensions.includes(extension)) {
        type = "image";
      } else if (extension === "pdf") {
        type = "pdf";
      }

      const displayName =
        doc.file_name ||
        doc.document_type?.name ||
        doc.file?.split("/").pop() ||
        "Document";

      setPreviewLoading(true);
      setDocumentPreview({
        doc,
        url: "",
        type,
        displayName,
      });

      try {
        const blob = await adminService.fetchDocumentBlob(doc.id, {
          preview: true,
          fileUrl: doc.file,
        });

        const blobType =
          blob.type && blob.type !== "application/octet-stream"
            ? blob.type
            : guessMimeType(extension);
        const typedBlob =
          blobType === blob.type ? blob : new Blob([blob], { type: blobType });

        const objectUrl = URL.createObjectURL(typedBlob);

        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
        }
        previewUrlRef.current = objectUrl;

        setDocumentPreview((current) =>
          current && current.doc.id === doc.id
            ? { ...current, url: objectUrl }
            : {
                doc,
                url: objectUrl,
                type,
                displayName,
              }
        );
      } catch (error) {
        console.error("Failed to load document preview via proxy:", error);
        const fallbackUrl = resolveDocumentUrl(doc.file);

        if (fallbackUrl) {
          setDocumentPreview({
            doc,
            url: fallbackUrl,
            type,
            displayName,
          });
        } else {
          setDocumentPreview(null);
          alert(
            "Unable to preview this document. Please try downloading it instead."
          );
        }

        previewUrlRef.current = null;
      } finally {
        setPreviewLoading(false);
      }
    },
    [guessMimeType, resolveDocumentUrl]
  );

  const handleDocumentDownload = useCallback(
    async (doc: ApprovalDocument) => {
      try {
        const blob = await adminService.fetchDocumentBlob(doc.id, {
          preview: false,
          fileUrl: doc.file,
        });
        const sanitizedPath = (doc.file || "").split("?")[0];
        const extension = sanitizedPath.split(".").pop()?.toLowerCase() ?? "";
        const blobType =
          blob.type && blob.type !== "application/octet-stream"
            ? blob.type
            : guessMimeType(extension);
        const typedBlob =
          blobType === blob.type ? blob : new Blob([blob], { type: blobType });

        const downloadUrl = URL.createObjectURL(typedBlob);

        if (typeof document !== "undefined") {
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.download =
            doc.file_name ||
            doc.document_type?.name ||
            doc.file?.split("/").pop() ||
            "document";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        URL.revokeObjectURL(downloadUrl);
      } catch (error) {
        console.error("Failed to download document via proxy:", error);
        const fallbackUrl = resolveDocumentUrl(doc.file);

        if (fallbackUrl && typeof window !== "undefined") {
          window.open(fallbackUrl, "_blank", "noopener,noreferrer");
        } else {
          alert("Unable to download document. Please try again later.");
        }
      }
    },
    [guessMimeType, resolveDocumentUrl]
  );

  const handleDocumentReview = useCallback(
    async (
      doc: ApprovalDocument,
      status: ApprovalDocument["status"],
      requireNotes: boolean = false
    ) => {
      let notes = doc.admin_notes ?? "";

      if (status !== "approved") {
        const promptMessage =
          status === "rejected"
            ? "Please provide a reason for rejecting this document"
            : "Optional notes for the applicant (leave blank to skip)";
        const result = window.prompt(promptMessage, notes);
        if (result === null) {
          return;
        }
        notes = result.trim();

        if (requireNotes && !notes) {
          alert("Notes are required for this action.");
          return;
        }
      }

      setDocumentReviewLoading(doc.id);

      try {
        const updatedDoc = await adminService.reviewDocument(doc.id, {
          status,
          notes,
        });

        setSelectedApprovalUser((prev) =>
          prev
            ? {
                ...prev,
                documents: prev.documents.map((item) =>
                  item.id === updatedDoc.id ? { ...item, ...updatedDoc } : item
                ),
              }
            : prev
        );

        setPendingApprovals((prev) =>
          prev.map((user) => {
            if (!user.documents?.length) {
              return user;
            }

            if (!user.documents.some((item) => item.id === updatedDoc.id)) {
              return user;
            }

            return {
              ...user,
              documents: user.documents.map((item) =>
                item.id === updatedDoc.id ? { ...item, ...updatedDoc } : item
              ),
            };
          })
        );

        setDocumentPreview((prev) =>
          prev && prev.doc.id === updatedDoc.id
            ? { ...prev, doc: { ...prev.doc, ...updatedDoc } }
            : prev
        );
      } catch (error) {
        console.error("Failed to update document status:", error);
        alert(
          error instanceof Error
            ? error.message
            : "Failed to update document status"
        );
      } finally {
        setDocumentReviewLoading(null);
      }
    },
    []
  );

  const closeDocumentPreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewLoading(false);
    setDocumentPreview(null);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (
      showApprovalModal &&
      selectedApprovalUser?.documents?.length &&
      !documentPreview &&
      !previewLoading
    ) {
      void handleDocumentPreview(selectedApprovalUser.documents[0]);
    }
  }, [
    showApprovalModal,
    selectedApprovalUser,
    documentPreview,
    previewLoading,
    handleDocumentPreview,
  ]);

  // Fetch users
  const fetchUsers = useCallback(
    async (
      page = 1,
      search = "",
      role = "",
      status = "",
      approval_status = ""
    ) => {
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
          approval_status,
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
        fetchUsers(
          1,
          searchTerm,
          filters.role,
          filters.status,
          filters.approval_status
        );
      }, 300);

      setSearchTimeout(timeout);
    },
    [filters.role, filters.status, filters.approval_status, searchTimeout]
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

      fetchUsers(
        1,
        newFilters.search,
        newFilters.role,
        newFilters.status,
        newFilters.approval_status
      );
    },
    [filters]
  );

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({ search: "", role: "", status: "", approval_status: "" });
    fetchUsers(1, "", "", "", "");
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

    const previewWidth = 384; // w-96 = 384px
    const previewHeight = 250; // approximate height

    let x = rect.left + rect.width / 2 + scrollLeft;
    let y = rect.top + scrollTop - 10;
    let above = true;

    // Adjust if preview would go off-screen horizontally
    if (x + previewWidth / 2 > window.innerWidth + scrollLeft) {
      x = window.innerWidth + scrollLeft - previewWidth / 2 - 20;
    } else if (x - previewWidth / 2 < scrollLeft) {
      x = scrollLeft + previewWidth / 2 + 20;
    }

    // Adjust if preview would go off-screen vertically
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
    // Add a small delay to prevent flickering when moving between elements
    setTimeout(() => {
      setShowPreview(false);
      setPreviewUser(null);
    }, 150);
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
      fetchUsers(
        pagination.page,
        filters.search,
        filters.role,
        filters.status,
        filters.approval_status
      );
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
      fetchUsers(
        pagination.page,
        filters.search,
        filters.role,
        filters.status,
        filters.approval_status
      );
    } catch (err) {
      console.error("Failed to perform bulk action:", err);
      setError(
        err instanceof Error ? err.message : "Failed to perform bulk action"
      );
    }
  };

  // Handle user approval/rejection (only for cooks and delivery agents)
  const handleUserApproval = async (
    user: AdminUser,
    action: "approve" | "reject"
  ) => {
    try {
      // Use the correct adminService method for approval
      await adminService.approveUser(user.id, action);

      // Update local state - approval only changes approval_status, not is_active
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
                ...u,
                approval_status: action === "approve" ? "approved" : "rejected",
              }
            : u
        )
      );

      // Show success message
      alert(`User ${action}d successfully!`);

      // Refresh the user list
      fetchUsers(
        pagination.page,
        filters.search,
        filters.role,
        filters.status,
        filters.approval_status
      );
    } catch (error: any) {
      console.error(`Error ${action}ing user:`, error);
      alert(
        `Failed to ${action} user: ${
          error.response?.data?.detail || error.message
        }`
      );
    }
  };

  // Handle user activation/deactivation (for all users)
  const handleUserActivation = async (user: AdminUser) => {
    try {
      const action = user.is_active ? "deactivate" : "activate";

      // Use the correct adminService methods for activation
      if (user.is_active) {
        await adminService.deactivateUser(user.id);
      } else {
        await adminService.activateUser(user.id);
      }

      // Update local state - only change is_active status
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
                ...u,
                is_active: !user.is_active,
              }
            : u
        )
      );

      // Show success message
      alert(`User ${action}d successfully!`);

      // Refresh the user list
      fetchUsers(
        pagination.page,
        filters.search,
        filters.role,
        filters.status,
        filters.approval_status
      );
    } catch (error: any) {
      console.error(
        `Error ${user.is_active ? "deactivate" : "activate"}ing user:`,
        error
      );
      alert(
        `Failed to ${user.is_active ? "deactivate" : "activate"} user: ${
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

      if (selectedApprovalUser?.user_id === userId) {
        setShowApprovalModal(false);
        setSelectedApprovalUser(null);
        closeDocumentPreview();
      }

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
  const handleApprovalUserDetail = async (user: PendingApprovalUser) => {
    try {
      const userDetails = await adminService.getUserForApproval(user.user_id);
      setSelectedApprovalUser(userDetails);
      setShowApprovalModal(true);
      setDocumentPreview(null);
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
          onMouseEnter={(e) => {
            e.stopPropagation();
            handleUserPreview(row, e);
          }}
          onMouseLeave={(e) => {
            e.stopPropagation();
            // Delay hiding to allow mouse to move to preview
            setTimeout(() => {
              if (!showPreview) return; // Already hidden
              setShowPreview(false);
              setPreviewUser(null);
            }, 200);
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
      key: "approval_status",
      title: "Approval",
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              value === "approved"
                ? "bg-green-500"
                : value === "pending"
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
          ></div>
          <Badge
            variant="secondary"
            className={`text-xs ${
              value === "approved"
                ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                : value === "pending"
                ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800"
                : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
            }`}
          >
            {value === "approved"
              ? "Approved"
              : value === "pending"
              ? "Pending"
              : "Rejected"}
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
          {/* Approval actions for cooks and delivery agents who are pending or rejected */}
          {(row.role === "cook" || row.role === "delivery_agent") &&
            (row.approval_status === "pending" ||
              row.approval_status === "rejected") && (
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

          {/* Activation/Deactivation actions for all users */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleUserActivation(row);
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
      key: "approval_status",
      label: "Approval Status",
      options: [
        { value: "pending", label: "Pending" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
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
          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AdvancedStatsCard
              title="Total Users"
              value={userStats.total}
              subtitle={`${userStats.active} active, ${userStats.inactive} inactive`}
              icon={<Users className="h-6 w-6" />}
              color="blue"
              onRefresh={() => fetchUsers()}
              variant="advanced"
            />

            <AdvancedStatsCard
              title="Active Users"
              value={userStats.active}
              subtitle={`${Math.round(
                (userStats.active / userStats.total) * 100
              )}% of total`}
              icon={<UserCheck className="h-6 w-6" />}
              color="green"
              onRefresh={() => fetchUsers()}
              variant="advanced"
            />

            <AdvancedStatsCard
              title="New This Week"
              value={userStats.newThisWeek}
              subtitle="Recent registrations"
              icon={<TrendingUp className="h-6 w-6" />}
              color="purple"
              onRefresh={() => fetchUsers()}
              variant="advanced"
            />

            <AdvancedStatsCard
              title="Pending Approvals"
              value={pendingApprovals.length}
              subtitle="Awaiting review"
              icon={<Clock3 className="h-6 w-6" />}
              color="yellow"
              onRefresh={() => fetchPendingApprovals()}
              variant="advanced"
            />
          </div>

          {/* Enhanced Search and Filters Bar */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-6">
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or phone..."
                      className="pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:border-transparent w-96 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                      value={filters.search}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {pagination.total} users found
                      {filters.search && ` for "${filters.search}"`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {activeFilterCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                    >
                      <Filter className="h-3 w-3 mr-1" />
                      {activeFilterCount} filter
                      {activeFilterCount > 1 ? "s" : ""} active
                    </Badge>
                  )}
                </div>
              </div>

              {/* Enhanced Quick Filter Buttons */}
              <div className="flex items-center space-x-3 flex-wrap gap-3">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Quick Filters:
                  </span>
                </div>
                <div className="flex items-center space-x-2 flex-wrap gap-2">
                  <Button
                    variant={filters.role === "" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFilterChange("role", "")}
                    className={`transition-all duration-200 ${
                      filters.role === ""
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                        : "hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300"
                    }`}
                  >
                    <Users className="h-3 w-3 mr-1" />
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
                    className={`transition-all duration-200 ${
                      filters.role === "admin"
                        ? "bg-red-600 hover:bg-red-700 text-white shadow-lg"
                        : "hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300"
                    }`}
                  >
                    <Shield className="h-3 w-3 mr-1" />
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
                    className={`transition-all duration-200 ${
                      filters.role === "cook"
                        ? "bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg"
                        : "hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:border-yellow-300"
                    }`}
                  >
                    <UserCheck className="h-3 w-3 mr-1" />
                    Cooks ({userStats.cookCount})
                  </Button>
                  <Button
                    variant={
                      filters.role === "customer" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      handleFilterChange(
                        "role",
                        filters.role === "customer" ? "" : "customer"
                      )
                    }
                    className={`transition-all duration-200 ${
                      filters.role === "customer"
                        ? "bg-green-600 hover:bg-green-700 text-white shadow-lg"
                        : "hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300"
                    }`}
                  >
                    <Users className="h-3 w-3 mr-1" />
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
                        filters.role === "delivery_agent"
                          ? ""
                          : "delivery_agent"
                      )
                    }
                    className={`transition-all duration-200 ${
                      filters.role === "delivery_agent"
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                        : "hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300"
                    }`}
                  >
                    <Activity className="h-3 w-3 mr-1" />
                    Delivery ({userStats.deliveryCount})
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Main Content */}
          <Card className="shadow-xl border-0 bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 border-gray-200 dark:border-gray-700 overflow-hidden">
            <CardHeader className="pb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle
                      className="text-2xl font-bold flex items-center"
                      style={{
                        color: theme === "dark" ? "#F9FAFB" : "#111827",
                      }}
                    >
                      User Management
                    </CardTitle>
                    <p
                      className="text-sm mt-1 font-medium"
                      style={{
                        color: theme === "dark" ? "#9CA3AF" : "#6B7280",
                      }}
                    >
                      Manage all users across your platform • {pagination.total}{" "}
                      total users
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Page {pagination.page} of {pagination.pages}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {pagination.limit} per page
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {pagination.total}
                    </span>
                  </div>
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
                  fetchUsers(
                    page,
                    filters.search,
                    filters.role,
                    filters.status,
                    filters.approval_status
                  )
                }
                onRowClick={(row) => handleUserDetail(row)}
              />
            </CardContent>
          </Card>

          {/* Enhanced User Preview Popup */}
          {showPreview && previewUser && (
            <div
              className="fixed z-[9999] pointer-events-auto animate-in fade-in-0 zoom-in-95 duration-300"
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
              <div className="border-2 rounded-2xl shadow-2xl p-6 w-96 backdrop-blur-sm bg-white/98 dark:bg-gray-800/98 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
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

                {/* Document Preview for Cooks and Delivery Agents */}
                {(previewUser.role === "cook" ||
                  previewUser.role === "delivery_agent") && (
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Documents
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Click "View Details" to see submitted documents
                    </div>
                  </div>
                )}

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

          {/* Enhanced User Detail Modal */}
          {showUserDetail && selectedUser && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in-0 duration-300">
              <div className="rounded-2xl max-w-5xl w-full mx-4 max-h-[95vh] overflow-y-auto shadow-2xl border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 animate-in zoom-in-95 duration-300">
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

          {/* Enhanced Approvals Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AdvancedStatsCard
              title="Pending Cooks"
              value={
                pendingApprovals.filter((user) => user.role === "cook").length
              }
              subtitle="Awaiting approval"
              icon={<UserCheck className="h-6 w-6" />}
              color="yellow"
              onRefresh={fetchPendingApprovals}
              variant="advanced"
            />

            <AdvancedStatsCard
              title="Pending Delivery Agents"
              value={
                pendingApprovals.filter(
                  (user) => user.role === "delivery_agent"
                ).length
              }
              subtitle="Awaiting approval"
              icon={<Activity className="h-6 w-6" />}
              color="blue"
              onRefresh={fetchPendingApprovals}
              variant="advanced"
            />

            <AdvancedStatsCard
              title="Total Pending"
              value={pendingApprovals.length}
              subtitle="All roles"
              icon={<Clock3 className="h-6 w-6" />}
              color="purple"
              onRefresh={fetchPendingApprovals}
              variant="advanced"
            />
          </div>

          {/* Enhanced Approvals List */}
          <Card className="shadow-xl border-0 bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 border-gray-200 dark:border-gray-700 overflow-hidden">
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
                            {(user.documents ?? [])
                              .slice(0, 4)
                              .map((doc, index) => (
                                <div
                                  key={`${doc.id}-${index}`}
                                  className="flex items-center space-x-2 p-2 bg-muted rounded"
                                >
                                  <FileText className="h-4 w-4" />
                                  <span className="text-sm truncate">
                                    {doc.document_type?.name || doc.file_name}
                                  </span>
                                </div>
                              ))}
                            {(user.documents?.length ?? 0) > 4 && (
                              <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                                <span className="text-sm text-muted-foreground">
                                  +{(user.documents?.length ?? 0) - 4} more
                                  documents
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

      {/* Enhanced Approval User Detail Modal */}
      {showApprovalModal && selectedApprovalUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in-0 duration-300">
          <div className="rounded-2xl max-w-5xl w-full mx-4 max-h-[95vh] overflow-y-auto shadow-2xl border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 animate-in zoom-in-95 duration-300">
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
                      closeDocumentPreview();
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
                {(selectedApprovalUser.documents?.length ?? 0) > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Submitted Documents (
                        {selectedApprovalUser.documents?.length ?? 0})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(selectedApprovalUser.documents ?? []).map((doc) => {
                          const statusStyles: Record<string, string> = {
                            pending:
                              "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-200",
                            approved:
                              "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200",
                            rejected:
                              "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200",
                            needs_resubmission:
                              "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-200",
                          };

                          const statusLabel =
                            doc.status_display ||
                            doc.status
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (c) => c.toUpperCase());

                          return (
                            <Card key={doc.id} className="p-4 space-y-4">
                              <div className="flex items-start space-x-3">
                                <FileText className="h-8 w-8 text-muted-foreground mt-1" />
                                <div className="flex-1 space-y-2">
                                  <div>
                                    <h4 className="font-medium">
                                      {doc.document_type?.name || doc.file_name}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                      {doc.document_type?.description ||
                                        doc.file_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Uploaded{" "}
                                      {new Date(
                                        doc.uploaded_at
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                        statusStyles[doc.status]
                                      }`}
                                    >
                                      {statusLabel}
                                    </span>
                                    {doc.reviewed_by_name && (
                                      <span className="text-xs text-muted-foreground">
                                        Reviewed by {doc.reviewed_by_name}
                                        {doc.reviewed_at
                                          ? ` on ${new Date(
                                              doc.reviewed_at
                                            ).toLocaleDateString()}`
                                          : ""}
                                      </span>
                                    )}
                                  </div>

                                  {doc.admin_notes && (
                                    <p className="text-xs italic text-muted-foreground">
                                      Notes: {doc.admin_notes}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDocumentPreview(doc)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Preview
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDocumentDownload(doc)}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  disabled={documentReviewLoading === doc.id}
                                  onClick={() =>
                                    handleDocumentReview(doc, "approved")
                                  }
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Mark Approved
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={documentReviewLoading === doc.id}
                                  onClick={() =>
                                    handleDocumentReview(doc, "rejected", true)
                                  }
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject Document
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={documentReviewLoading === doc.id}
                                  onClick={() =>
                                    handleDocumentReview(
                                      doc,
                                      "needs_resubmission"
                                    )
                                  }
                                >
                                  <RefreshCw className="h-4 w-4 mr-1" />
                                  Needs Resubmission
                                </Button>
                              </div>
                            </Card>
                          );
                        })}
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

      {documentPreview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] animate-in fade-in-0 duration-200 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {documentPreview.displayName}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {documentPreview.doc.document_type?.name || "Document"}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={previewLoading}
                  onClick={() => handleDocumentDownload(documentPreview.doc)}
                >
                  {previewLoading ? (
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-1" />
                  )}
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeDocumentPreview}
                >
                  ✕
                </Button>
              </div>
            </div>
            <div
              className="bg-gray-50 dark:bg-gray-950 p-4 flex items-center justify-center overflow-auto"
              style={{ maxHeight: "calc(90vh - 100px)" }}
            >
              {previewLoading || !documentPreview.url ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400 space-y-3">
                  <RefreshCw className="h-8 w-8 animate-spin" />
                  <p className="text-sm">Loading document preview...</p>
                </div>
              ) : (
                <>
                  {documentPreview.type === "image" && (
                    <img
                      src={documentPreview.url}
                      alt={documentPreview.displayName}
                      className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
                    />
                  )}
                  {documentPreview.type === "pdf" && (
                    <iframe
                      src={documentPreview.url}
                      title={documentPreview.displayName}
                      className="w-full h-[70vh] rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                  )}
                  {documentPreview.type === "other" && (
                    <div className="text-center space-y-4 text-gray-700 dark:text-gray-300">
                      <FileText className="h-12 w-12 mx-auto text-gray-400" />
                      <p>
                        Preview not available for this file type. You can
                        download the file using the button above.
                      </p>
                      <Button
                        onClick={() =>
                          handleDocumentDownload(documentPreview.doc)
                        }
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Document
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedUserManagement;
