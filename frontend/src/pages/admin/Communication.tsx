import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Activity,
  AlertTriangle,
  Archive,
  Bell,
  Copy,
  Download,
  Edit,
  Eye,
  FileText,
  Mail,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Zap,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

// Import shared components
import DataTable from "@/components/admin/shared/tables/DataTable";
import { StatsCard } from "@/components/dashboard/StatsCard";

// Import communication service and types
import type {
  CommunicationCategory,
  CommunicationTag,
  EmailTemplate,
  SystemAlert,
} from "@/services/communicationService";
import { communicationService } from "@/services/communicationService";

// Define missing types locally
interface CampaignStats {
  total_campaigns: number;
  active_campaigns: number;
  total_sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  conversion_rate: number;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  read: boolean;
  created_at: string;
}

/**
 * Communication Management Page - Phase 4.2 Implementation
 *
 * Features:
 * - Email template management and campaign system
 * - System alerts and notifications center
 * - Broadcast messaging with targeting options
 * - Push notifications and mobile messaging
 * - Communication analytics and delivery tracking
 * - Template editor with rich formatting
 * - Scheduled messaging and automation
 * - User segmentation and targeting
 */

interface CommunicationFilters {
  search: string;
  status: string;
  type: string;
  dateRange: string;
  category: string;
  tag: string;
}

interface NewCommunication {
  type: "email" | "notification" | "alert" | "push";
  title: string;
  content: string;
  target: "all" | "customers" | "admins" | "cooks" | "delivery" | "custom";
  customTargets?: string[];
  scheduleType: "immediate" | "scheduled";
  scheduledDate?: string;
  priority: "low" | "medium" | "high" | "urgent";
  template?: string;
}

const Communication: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<
    "overview" | "templates" | "campaigns" | "notifications" | "alerts"
  >("overview");
  const [communications, setCommunications] = useState<any[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [categories, setCategories] = useState<CommunicationCategory[]>([]);
  const [tags, setTags] = useState<CommunicationTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter and pagination
  const [filters, setFilters] = useState<CommunicationFilters>({
    search: "",
    status: "all",
    type: "all",
    dateRange: "all",
    category: "all",
    tag: "all",
  });
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(20);

  // Modal states
  const [showNewCommunicationModal, setShowNewCommunicationModal] =
    useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [newCommunication, setNewCommunication] = useState<NewCommunication>({
    type: "email",
    title: "",
    content: "",
    target: "all",
    scheduleType: "immediate",
    priority: "medium",
  });

  // Statistics
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [deliveryStats, setDeliveryStats] = useState<{
    total_sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
    pending: number;
  } | null>(null);

  // Load data functions
  const loadCommunications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (filters.search) params.search = filters.search;
      if (filters.status !== "all") params.status = filters.status;
      if (filters.type !== "all") params.type = filters.type;
      if (filters.category !== "all") params.category = filters.category;
      if (filters.tag !== "all") params.tag = filters.tag;

      const response = await communicationService.getCommunications(params);
      setCommunications(response.results || []);
      setTotalPages(Math.ceil(response.count / itemsPerPage));
      setTotalItems(response.count);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load communications"
      );
      console.error("Error loading communications:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, filters]);

  const loadTemplates = useCallback(async () => {
    try {
      const templatesData = await communicationService.getEmailTemplates();
      setTemplates(templatesData.results || []);
    } catch (err) {
      console.error("Error loading templates:", err);
    }
  }, []);

  const loadCategoriesAndTags = useCallback(async () => {
    try {
      const [categoriesData, tagsData] = await Promise.all([
        communicationService.getCategories(),
        communicationService.getTags(),
      ]);
      setCategories(categoriesData);
      setTags(tagsData);
    } catch (err) {
      console.error("Error loading categories and tags:", err);
    }
  }, []);

  const loadAlerts = useCallback(async () => {
    try {
      const alertsData = await communicationService.getSystemAlerts();
      setAlerts(alertsData.results || []);
    } catch (err) {
      console.error("Error loading alerts:", err);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const notificationsData = await communicationService.getNotifications();
      setNotifications(notificationsData || []);
    } catch (err) {
      console.error("Error loading notifications:", err);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const [campaignStats, deliveryData] = await Promise.all([
        communicationService.getCampaignStats(),
        communicationService.getDeliveryStats("30d"),
      ]);

      setStats(campaignStats);
      setDeliveryStats(deliveryData);
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  }, []);

  // Load data on component mount and when dependencies change
  useEffect(() => {
    loadCommunications();
  }, [loadCommunications]);

  useEffect(() => {
    loadTemplates();
    loadAlerts();
    loadNotifications();
    loadStats();
    loadCategoriesAndTags();
  }, [
    loadTemplates,
    loadAlerts,
    loadNotifications,
    loadStats,
    loadCategoriesAndTags,
  ]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, activeTab]);

  // Table columns configuration for different tabs
  const communicationColumns = [
    {
      key: "title",
      title: "Title",
      render: (item: any) => (
        <div className="space-y-1">
          <div className="font-medium text-sm">{item.title}</div>
          <div className="text-xs text-gray-500">
            {new Date(item.created_at).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      key: "type",
      title: "Type",
      render: (item: any) => (
        <Badge
          variant={
            item.type === "email"
              ? "default"
              : item.type === "notification"
              ? "secondary"
              : item.type === "alert"
              ? "destructive"
              : "outline"
          }
        >
          {item.type.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: "target",
      title: "Target",
      render: (item: any) => (
        <div className="space-y-1">
          <div className="font-medium text-sm">{item.target_audience}</div>
          <div className="text-xs text-gray-500">
            {item.recipient_count} recipients
          </div>
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (item: any) => {
        const statusColors = {
          draft: "bg-gray-100 text-gray-800",
          scheduled: "bg-blue-100 text-blue-800",
          sending: "bg-yellow-100 text-yellow-800",
          sent: "bg-green-100 text-green-800",
          failed: "bg-red-100 text-red-800",
        };

        return (
          <Badge
            className={statusColors[item.status] || "bg-gray-100 text-gray-800"}
          >
            {item.status.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      key: "metrics",
      title: "Delivery",
      render: (item: any) => (
        <div className="text-sm">
          <div>Sent: {item.sent_count || 0}</div>
          <div className="text-xs text-gray-500">
            Opened: {item.opened_count || 0} (
            {(
              ((item.opened_count || 0) / (item.sent_count || 1)) *
              100
            ).toFixed(1)}
            %)
          </div>
        </div>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (item: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewItem(item)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditItem(item)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDuplicateItem(item)}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDeleteItem(item)}
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

  // Event handlers
  const handleViewItem = (item: any) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const handleEditItem = (item: any) => {
    setSelectedItem(item);
    setNewCommunication({
      type: item.type,
      title: item.title,
      content: item.content,
      target: item.target_audience,
      scheduleType: item.scheduled_date ? "scheduled" : "immediate",
      scheduledDate: item.scheduled_date,
      priority: item.priority || "medium",
    });
    setShowNewCommunicationModal(true);
  };

  const handleDuplicateItem = async (item: any) => {
    try {
      await communicationService.duplicateCommunication(item.id);
      await loadCommunications();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to duplicate communication"
      );
    }
  };

  const handleDeleteItem = async (item: any) => {
    if (
      !confirm(
        `Are you sure you want to delete "${item.title}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await communicationService.deleteCommunication(item.id);
      await loadCommunications();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete communication"
      );
    }
  };

  const handleSendCommunication = async () => {
    try {
      const payload = {
        ...newCommunication,
        scheduled_date:
          newCommunication.scheduleType === "scheduled"
            ? newCommunication.scheduledDate
            : null,
      };

      await communicationService.sendCommunication(payload);

      setShowNewCommunicationModal(false);
      setNewCommunication({
        type: "email",
        title: "",
        content: "",
        target: "all",
        scheduleType: "immediate",
        priority: "medium",
      });

      await loadCommunications();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send communication"
      );
    }
  };

  const handleFilterChange = (
    key: keyof CommunicationFilters,
    value: string
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && deliveryStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Sent"
            value={deliveryStats.total_sent.toString()}
            subtitle="this month"
            icon="bx-send"
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
            trend={{ value: 15, isPositive: true }}
          />
          <StatsCard
            title="Delivery Rate"
            value={`${(
              (deliveryStats.delivered / deliveryStats.total_sent) *
              100
            ).toFixed(1)}%`}
            subtitle="successful delivery"
            icon="bx-check-circle"
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
            trend={{ value: 2.3, isPositive: true }}
          />
          <StatsCard
            title="Open Rate"
            value={`${(
              (deliveryStats.opened / deliveryStats.delivered) *
              100
            ).toFixed(1)}%`}
            subtitle="engagement rate"
            icon="bx-show"
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
            trend={{ value: 5.1, isPositive: true }}
          />
          <StatsCard
            title="Active Templates"
            value={templates.filter((t) => t.name).length.toString()}
            subtitle="ready to use"
            icon="bx-file"
            iconColor="text-orange-600"
            iconBgColor="bg-orange-100"
            trend={{ value: 0, isPositive: true }}
          />
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => {
                setNewCommunication({ ...newCommunication, type: "email" });
                setShowNewCommunicationModal(true);
              }}
              className="h-20 flex flex-col"
            >
              <Mail className="h-6 w-6 mb-2" />
              Send Email
            </Button>
            <Button
              onClick={() => {
                setNewCommunication({
                  ...newCommunication,
                  type: "notification",
                });
                setShowNewCommunicationModal(true);
              }}
              variant="outline"
              className="h-20 flex flex-col"
            >
              <Bell className="h-6 w-6 mb-2" />
              Push Notification
            </Button>
            <Button
              onClick={() => {
                setNewCommunication({ ...newCommunication, type: "alert" });
                setShowNewCommunicationModal(true);
              }}
              variant="outline"
              className="h-20 flex flex-col"
            >
              <AlertTriangle className="h-6 w-6 mb-2" />
              System Alert
            </Button>
            <Button
              onClick={() => setShowTemplateModal(true)}
              variant="outline"
              className="h-20 flex flex-col"
            >
              <FileText className="h-6 w-6 mb-2" />
              New Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Recent Communications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={communications.slice(0, 5)}
            columns={communicationColumns}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );

  const renderCampaignsTab = () => (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Input
            placeholder="Search campaigns..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-64"
          />
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange("status", value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="sending">Sending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.type}
            onValueChange={(value) => handleFilterChange("type", value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="notification">Notification</SelectItem>
              <SelectItem value="alert">Alert</SelectItem>
              <SelectItem value="push">Push</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.category}
            onValueChange={(value) => handleFilterChange("category", value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.tag}
            onValueChange={(value) => handleFilterChange("tag", value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {tags.map((tag) => (
                <SelectItem key={tag.id} value={tag.id.toString()}>
                  {tag.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadCommunications}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowNewCommunicationModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={communications}
            columns={communicationColumns}
            loading={loading}
            selectable
            pagination={{
              page: currentPage,
              pageSize: itemsPerPage,
              total: totalItems,
              onPageChange: setCurrentPage,
              onPageSizeChange: () => {},
            }}
            bulkActions={[
              {
                label: "Send Selected",
                action: (rows) => console.log("Send selected", rows),
                icon: <Send className="h-4 w-4 mr-2" />,
              },
              {
                label: "Archive Selected",
                action: (rows) => console.log("Archive selected", rows),
                icon: <Archive className="h-4 w-4 mr-2" />,
              },
              {
                label: "Delete Selected",
                action: (rows) => console.log("Delete selected", rows),
                icon: <Trash2 className="h-4 w-4 mr-2" />,
                variant: "destructive",
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
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
            Communication Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage emails, notifications, alerts, and communication campaigns
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={() => setShowNewCommunicationModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Communication
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardContent className="p-0">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as any)}
          >
            <div className="border-b px-6 pt-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="campaigns">
                  Campaigns ({communications.length})
                </TabsTrigger>
                <TabsTrigger value="templates">
                  Templates ({templates.length})
                </TabsTrigger>
                <TabsTrigger value="notifications">
                  Notifications ({notifications.length})
                </TabsTrigger>
                <TabsTrigger value="alerts">
                  Alerts ({alerts.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="overview">{renderOverviewTab()}</TabsContent>

              <TabsContent value="campaigns">
                {renderCampaignsTab()}
              </TabsContent>

              <TabsContent value="templates">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Email Templates
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Create and manage reusable email templates
                  </p>
                  <Button onClick={() => setShowTemplateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="notifications">
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Push Notifications
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Manage mobile and web push notifications
                  </p>
                  <Button
                    onClick={() => {
                      setNewCommunication({
                        ...newCommunication,
                        type: "notification",
                      });
                      setShowNewCommunicationModal(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Send Notification
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="alerts">
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    System Alerts
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Manage system-wide alerts and announcements
                  </p>
                  <Button
                    onClick={() => {
                      setNewCommunication({
                        ...newCommunication,
                        type: "alert",
                      });
                      setShowNewCommunicationModal(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Alert
                  </Button>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* New Communication Modal */}
      <Dialog
        open={showNewCommunicationModal}
        onOpenChange={setShowNewCommunicationModal}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Create New{" "}
              {newCommunication.type.charAt(0).toUpperCase() +
                newCommunication.type.slice(1)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Communication Type</Label>
                <Select
                  value={newCommunication.type}
                  onValueChange={(value: any) =>
                    setNewCommunication({ ...newCommunication, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email Campaign</SelectItem>
                    <SelectItem value="notification">
                      Push Notification
                    </SelectItem>
                    <SelectItem value="alert">System Alert</SelectItem>
                    <SelectItem value="push">Mobile Push</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newCommunication.priority}
                  onValueChange={(value: any) =>
                    setNewCommunication({
                      ...newCommunication,
                      priority: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newCommunication.title}
                onChange={(e) =>
                  setNewCommunication({
                    ...newCommunication,
                    title: e.target.value,
                  })
                }
                placeholder="Enter communication title..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={newCommunication.content}
                onChange={(e) =>
                  setNewCommunication({
                    ...newCommunication,
                    content: e.target.value,
                  })
                }
                placeholder="Enter your message content..."
                rows={6}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="target">Target Audience</Label>
                <Select
                  value={newCommunication.target}
                  onValueChange={(value: any) =>
                    setNewCommunication({ ...newCommunication, target: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="customers">Customers Only</SelectItem>
                    <SelectItem value="admins">Admins Only</SelectItem>
                    <SelectItem value="cooks">Cooks Only</SelectItem>
                    <SelectItem value="delivery">Delivery Staff</SelectItem>
                    <SelectItem value="custom">Custom Selection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="schedule">Schedule</Label>
                <Select
                  value={newCommunication.scheduleType}
                  onValueChange={(value: any) =>
                    setNewCommunication({
                      ...newCommunication,
                      scheduleType: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Send Immediately</SelectItem>
                    <SelectItem value="scheduled">
                      Schedule for Later
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {newCommunication.scheduleType === "scheduled" && (
              <div>
                <Label htmlFor="scheduledDate">Scheduled Date & Time</Label>
                <Input
                  id="scheduledDate"
                  type="datetime-local"
                  value={newCommunication.scheduledDate}
                  onChange={(e) =>
                    setNewCommunication({
                      ...newCommunication,
                      scheduledDate: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewCommunicationModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendCommunication}
              disabled={!newCommunication.title || !newCommunication.content}
            >
              <Send className="h-4 w-4 mr-2" />
              {newCommunication.scheduleType === "scheduled"
                ? "Schedule"
                : "Send"}{" "}
              Communication
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Modal */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Email Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Template Name" />
            <Input placeholder="Subject Line" />
            <Textarea placeholder="Template Content..." rows={8} />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTemplateModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => setShowTemplateModal(false)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Communication Details</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Title</Label>
                  <p className="text-sm text-gray-600">{selectedItem.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <Badge>{selectedItem.type?.toUpperCase()}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge>{selectedItem.status?.toUpperCase()}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm text-gray-600">
                    {formatDate(selectedItem.created_at)}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Content</Label>
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                  {selectedItem.content}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Communication;
