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
import { Progress } from "@/components/ui/progress";
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
  MessageSquare,
  Brain,
  Sparkles,
  TrendingUp,
  Users,
  Calendar,
  Filter,
  Search,
  Bot,
  Lightbulb,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

// Import shared components
import { 
  AnimatedStats,
  GlassCard,
  GradientButton,
  DataTable 
} from "@/components/admin/shared";

// Import communication service and types
import type {
  CommunicationCategory,
  CommunicationTag,
  EmailTemplate,
  SystemAlert,
} from "@/services/communicationService";
import type {
  CampaignStats,
  Notification,
} from "@/types/communication";
import { communicationService } from "@/services/communicationService";

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

interface AISentimentData {
  positive: number;
  negative: number;
  neutral: number;
  total: number;
  confidence: number;
  trending_topics: Array<{
    topic: string;
    frequency: number;
    sentiment: string;
  }>;
  sentiment_trends: Array<{
    date: string;
    positive: number;
    negative: number;
    neutral: number;
  }>;
}

interface AIInsights {
  positive: number;
  negative: number;
  neutral: number;
  trending_topics: string[];
}

const Communication: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<
    "overview" | "templates" | "campaigns" | "notifications" | "alerts" | "ai-insights"
  >("overview");
  const [communications, setCommunications] = useState<any[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [categories, setCategories] = useState<CommunicationCategory[]>([]);
  const [tags, setTags] = useState<CommunicationTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI-related state
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedCommunicationType, setSelectedCommunicationType] = useState<string>("all");
  const [sentimentPeriod, setSentimentPeriod] = useState<string>("30d");

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

  // AI Functions
  const loadAIInsights = useCallback(async () => {
    try {
      setAiLoading(true);
      setError(null);

      const data = await communicationService.getSentimentAnalysis(sentimentPeriod);
      setAiInsights(data);
    } catch (error) {
      console.error('Error loading AI insights:', error);
      setError('Failed to load AI insights');
    } finally {
      setAiLoading(false);
    }
  }, [sentimentPeriod, selectedCommunicationType]);

  const updateCommunicationStatus = async (communicationId: number, newStatus: string, notes?: string) => {
    try {
      const result = await communicationService.updateStatus(communicationId, newStatus);
      console.log('Status updated:', result);
      
      // Reload communications and AI insights
      loadCommunications();
      if (activeTab === 'ai-insights') {
        loadAIInsights();
      }
      
      return result;
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update communication status');
      throw error;
    }
  };

  const bulkUpdateStatus = async (communicationIds: number[], newStatus: string, notes?: string) => {
    try {
      await communicationService.bulkUpdateStatus(communicationIds, newStatus);
      console.log('Bulk status updated:', communicationIds.length, 'items');
      
      // Reload communications and AI insights
      loadCommunications();
      if (activeTab === 'ai-insights') {
        loadAIInsights();
      }
      
      return { updated_count: communicationIds.length, failed_count: 0 };
    } catch (error) {
      console.error('Error bulk updating status:', error);
      setError('Failed to bulk update communication status');
      throw error;
    }
  };

  // Load AI insights when tab changes or dependencies change
  useEffect(() => {
    if (activeTab === 'ai-insights') {
      loadAIInsights();
    }
  }, [activeTab, loadAIInsights]);

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
          <AnimatedStats
            value={deliveryStats.total_sent}
            label="Total Sent"
            icon={Send}
            gradient="blue"
            loading={loading}
            subtitle="this month"
            trend={15}
          />
          <AnimatedStats
            value={Math.round((deliveryStats.delivered / deliveryStats.total_sent) * 100)}
            label="Delivery Rate"
            icon={TrendingUp}
            gradient="green"
            loading={loading}
            subtitle="successful delivery"
            suffix="%"
            trend={2.3}
          />
          <AnimatedStats
            value={Math.round((deliveryStats.opened / deliveryStats.delivered) * 100)}
            label="Open Rate"
            icon={Eye}
            gradient="purple"
            loading={loading}
            subtitle="engagement rate"
            suffix="%"
            trend={5.1}
          />
          <AnimatedStats
            value={templates.filter((t) => t.name).length}
            label="Active Templates"
            icon={FileText}
            gradient="orange"
            loading={loading}
            subtitle="ready to use"
            trend={0}
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

  // Render AI Insights Tab
  const renderAIInsightsTab = () => {
    if (aiLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-4" />
            <p className="text-gray-600">Loading AI insights...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading AI Insights</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={loadAIInsights}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      );
    }

    if (!aiInsights) {
      return (
        <div className="text-center py-12">
          <Zap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">AI Insights</h3>
          <p className="text-gray-500 mb-4">No AI insights available</p>
          <Button onClick={loadAIInsights}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Load Insights
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <Label htmlFor="period">Time Period</Label>
              <Select value={sentimentPeriod} onValueChange={setSentimentPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 days</SelectItem>
                  <SelectItem value="30d">30 days</SelectItem>
                  <SelectItem value="90d">90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type">Communication Type</Label>
              <Select value={selectedCommunicationType} onValueChange={setSelectedCommunicationType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="feedback">Feedback</SelectItem>
                  <SelectItem value="complaint">Complaints</SelectItem>
                  <SelectItem value="suggestion">Suggestions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={loadAIInsights} disabled={aiLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${aiLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Sentiment Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Positive</p>
                  <p className="text-2xl font-bold text-green-600">
                    {aiInsights.positive}
                  </p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm">😊</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Negative</p>
                  <p className="text-2xl font-bold text-red-600">
                    {aiInsights.negative}
                  </p>
                </div>
                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-sm">😞</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Neutral</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {aiInsights.neutral}
                  </p>
                </div>
                <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-sm">😐</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Confidence</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round(((aiInsights.positive + aiInsights.negative + aiInsights.neutral) / 3) * 100)}%
                  </p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Zap className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trending Topics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Trending Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiInsights.trending_topics.map((topic, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">
                      #{index + 1}
                    </Badge>
                    <span className="font-medium">{topic}</span>
                  </div>
                  <span className="text-sm text-gray-500">trending</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Trending Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {aiInsights.trending_topics.map((topic, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">{topic}</span>
                  <Badge variant="outline">#{index + 1}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Insights Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              AI Insights Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              <p>Based on the sentiment analysis, here are the key insights:</p>
              <ul className="mt-2 space-y-1">
                <li>• Total communications analyzed: {aiInsights.positive + aiInsights.negative + aiInsights.neutral}</li>
                <li>• Positive sentiment: {aiInsights.positive} ({Math.round((aiInsights.positive / (aiInsights.positive + aiInsights.negative + aiInsights.neutral)) * 100)}%)</li>
                <li>• Negative sentiment: {aiInsights.negative} ({Math.round((aiInsights.negative / (aiInsights.positive + aiInsights.negative + aiInsights.neutral)) * 100)}%)</li>
                <li>• Neutral sentiment: {aiInsights.neutral} ({Math.round((aiInsights.neutral / (aiInsights.positive + aiInsights.negative + aiInsights.neutral)) * 100)}%)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
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
        <GlassCard gradient="green" className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-green-600 dark:from-white dark:to-green-400 bg-clip-text text-transparent">
                  Communication Center
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Manage emails, notifications, alerts, and communication campaigns with AI insights
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Activity className="h-4 w-4" />
                    {communications.length} active communications
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs text-green-600 font-medium">AI-powered</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <GradientButton
                gradient="blue"
                variant="outline"
                icon={Download}
                onClick={() => console.log("Exporting report...")}
              >
                Export Report
              </GradientButton>
              <GradientButton
                gradient="green"
                icon={Plus}
                onClick={() => setShowNewCommunicationModal(true)}
              >
                New Communication
              </GradientButton>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Main Content */}
      <GlassCard gradient="none" className="p-0">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
        >
          <div className="border-b border-white/10 px-6 pt-6">
            <TabsList className="grid w-full grid-cols-6 backdrop-blur-sm bg-white/20 border border-white/30">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white/30">
                <Eye className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="campaigns" className="data-[state=active]:bg-white/30">
                <Send className="h-4 w-4 mr-2" />
                Campaigns ({communications.length})
              </TabsTrigger>
              <TabsTrigger value="templates" className="data-[state=active]:bg-white/30">
                <FileText className="h-4 w-4 mr-2" />
                Templates ({templates.length})
              </TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-white/30">
                <Bell className="h-4 w-4 mr-2" />
                Notifications ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="alerts" className="data-[state=active]:bg-white/30">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Alerts ({alerts.length})
              </TabsTrigger>
              <TabsTrigger value="ai-insights" className="data-[state=active]:bg-white/30">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI Insights
                </div>
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

              <TabsContent value="ai-insights">
                {renderAIInsightsTab()}
              </TabsContent>
            </div>
          </Tabs>
        </GlassCard>

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
