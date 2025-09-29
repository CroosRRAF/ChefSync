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
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  MoreHorizontal,
  RefreshCw,
  Reply,
  Send,
  Star,
  Trash2,
  TrendingUp,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

// Import shared components
import DataTable from "@/components/admin/shared/tables/DataTable";
import { StatsCard } from "@/components/dashboard/StatsCard";

// Import communication service and types
import type {
  Communication,
  CommunicationStats,
  PaginatedResponse,
} from "@/services/communicationService";
import { communicationService } from "@/services/communicationService";

/**
 * Feedback Management Page - Phase 4.1 Implementation
 *
 * Features:
 * - Comprehensive feedback/complaint management with real API integration
 * - Advanced filtering and categorization system
 * - Response management with resolution tracking
 * - Sentiment analysis and analytics dashboard
 * - Bulk operations for efficiency
 * - Priority and status management
 * - Customer communication tools
 * - Performance metrics and insights
 */

interface FeedbackFilters {
  search: string;
  status: string;
  priority: string;
  type: string;
  dateRange: string;
}

const FeedbackManagement: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<
    "all" | "feedback" | "complaints" | "suggestions"
  >("all");
  const [feedbacks, setFeedbacks] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter and pagination
  const [filters, setFilters] = useState<FeedbackFilters>({
    search: "",
    status: "all",
    priority: "all",
    type: "all",
    dateRange: "all",
  });
  const [selectedFeedbacks, setSelectedFeedbacks] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(20);

  // Handle row selection for DataTable
  const handleRowSelection = (rows: Communication[]) => {
    setSelectedFeedbacks(rows.map((row) => row.id));
  };

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] =
    useState<Communication | null>(null);
  const [responseText, setResponseText] = useState("");
  const [isResolution, setIsResolution] = useState(false);

  // Statistics
  const [stats, setStats] = useState<CommunicationStats | null>(null);
  const [sentimentData, setSentimentData] = useState<{
    positive: number;
    negative: number;
    neutral: number;
    trending_topics: string[];
  } | null>(null);

  // Load data function
  const loadFeedbacks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };

      // Apply filters
      if (filters.search) params.search = filters.search;
      if (filters.status !== "all") params.status = filters.status;
      if (filters.priority !== "all") params.priority = filters.priority;
      if (filters.type !== "all") params.type = filters.type;

      // Apply tab-specific filtering
      if (activeTab !== "all") {
        params.type =
          activeTab === "complaints" ? "complaint" : activeTab.slice(0, -1); // Remove 's' for API
      }

      const response: PaginatedResponse<Communication> =
        await communicationService.getFeedbacks(params);

      setFeedbacks(response.results || []);
      setTotalPages(Math.ceil(response.count / itemsPerPage));
      setTotalItems(response.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feedbacks");
      console.error("Error loading feedbacks:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, filters, activeTab]);

  // Load statistics
  const loadStats = useCallback(async () => {
    try {
      const [statsData, sentimentAnalysis] = await Promise.all([
        communicationService.getCommunicationStats(),
        communicationService.getSentimentAnalysis("30d"),
      ]);

      setStats(statsData);
      setSentimentData(sentimentAnalysis);
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  }, []);

  // Load data on component mount and when dependencies change
  useEffect(() => {
    loadFeedbacks();
  }, [loadFeedbacks]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, activeTab]);

  // Table columns configuration
  const columns = [
    {
      key: "reference",
      title: "Reference",
      render: (feedback: Communication) => (
        <div className="space-y-1">
          <div className="font-medium text-sm">{feedback.reference_number}</div>
          <div className="text-xs text-gray-500">
            {new Date(feedback.created_at).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      key: "customer",
      title: "Customer",
      render: (feedback: Communication) => (
        <div className="space-y-1">
          <div className="font-medium text-sm">{feedback.user.name}</div>
          <div className="text-xs text-gray-500">{feedback.user.email}</div>
        </div>
      ),
    },
    {
      key: "type",
      title: "Type",
      render: (feedback: Communication) => (
        <Badge
          variant={
            feedback.communication_type === "complaint"
              ? "destructive"
              : feedback.communication_type === "feedback"
              ? "default"
              : feedback.communication_type === "suggestion"
              ? "secondary"
              : "outline"
          }
        >
          {feedback.communication_type.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: "subject",
      title: "Subject",
      render: (feedback: Communication) => (
        <div className="space-y-1">
          <div className="font-medium text-sm truncate max-w-xs">
            {feedback.subject}
          </div>
          {feedback.rating && (
            <div className="flex items-center">
              <Star className="h-3 w-3 text-yellow-500 mr-1" />
              <span className="text-xs">{feedback.rating}/5</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "priority",
      title: "Priority",
      render: (feedback: Communication) => (
        <Badge
          variant={
            feedback.priority === "urgent"
              ? "destructive"
              : feedback.priority === "high"
              ? "default"
              : feedback.priority === "medium"
              ? "secondary"
              : "outline"
          }
        >
          {feedback.priority.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (feedback: Communication) => {
        const statusColors = {
          pending: "bg-yellow-100 text-yellow-800",
          in_progress: "bg-blue-100 text-blue-800",
          resolved: "bg-green-100 text-green-800",
          closed: "bg-gray-100 text-gray-800",
        };

        return (
          <Badge
            className={
              statusColors[feedback.status] || "bg-gray-100 text-gray-800"
            }
          >
            {feedback.status.replace("_", " ").toUpperCase()}
          </Badge>
        );
      },
    },
    {
      key: "responses",
      title: "Responses",
      render: (feedback: Communication) => (
        <div className="text-sm text-gray-600">
          {feedback.responses?.length || 0} responses
        </div>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (feedback: Communication) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewFeedback(feedback)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleRespondToFeedback(feedback)}>
              <Reply className="h-4 w-4 mr-2" />
              Respond
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleUpdateStatus(feedback, "in_progress")}
            >
              <Clock className="h-4 w-4 mr-2" />
              Mark In Progress
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleUpdateStatus(feedback, "resolved")}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Resolved
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDeleteFeedback(feedback)}
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
  const handleViewFeedback = (feedback: Communication) => {
    setSelectedFeedback(feedback);
    setShowDetailModal(true);
  };

  const handleRespondToFeedback = (feedback: Communication) => {
    setSelectedFeedback(feedback);
    setResponseText("");
    setIsResolution(false);
    setShowResponseModal(true);
  };

  const handleUpdateStatus = async (
    feedback: Communication,
    status: string
  ) => {
    try {
      await communicationService.updateFeedbackStatus(feedback.id, status);
      await loadFeedbacks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleUpdatePriority = async (
    feedback: Communication,
    priority: string
  ) => {
    try {
      await communicationService.updateFeedbackPriority(feedback.id, priority);
      await loadFeedbacks();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update priority"
      );
    }
  };

  const handleDeleteFeedback = async (feedback: Communication) => {
    if (
      !confirm(
        `Are you sure you want to delete this ${feedback.communication_type}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await communicationService.deleteFeedback(feedback.id);
      await loadFeedbacks();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete feedback"
      );
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedFeedbacks.length === 0) return;

    try {
      switch (action) {
        case "mark_resolved":
          await communicationService.bulkUpdateStatus(
            selectedFeedbacks,
            "resolved"
          );
          break;
        case "mark_in_progress":
          await communicationService.bulkUpdateStatus(
            selectedFeedbacks,
            "in_progress"
          );
          break;
        case "delete":
          if (
            !confirm(
              `Are you sure you want to delete ${selectedFeedbacks.length} items? This action cannot be undone.`
            )
          ) {
            return;
          }
          // Note: Implement bulk delete in service if needed
          break;
      }

      setSelectedFeedbacks([]);
      await loadFeedbacks();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to ${action} feedbacks`
      );
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedFeedback || !responseText.trim()) return;

    try {
      await communicationService.addResponse(selectedFeedback.id, {
        response: responseText,
        is_resolution: isResolution,
      });

      setShowResponseModal(false);
      setResponseText("");
      setIsResolution(false);
      setSelectedFeedback(null);

      await loadFeedbacks();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit response"
      );
    }
  };

  const handleFilterChange = (key: keyof FeedbackFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
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
            Feedback Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage customer complaints, feedback, suggestions, and inquiries
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadFeedbacks}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Communications"
            value={stats.total.toString()}
            subtitle={`${stats.pending} pending`}
            icon="bx-message-square"
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="In Progress"
            value={stats.in_progress.toString()}
            subtitle="being handled"
            icon="bx-time"
            iconColor="text-orange-600"
            iconBgColor="bg-orange-100"
            trend={{ value: 8, isPositive: true }}
          />
          <StatsCard
            title="Resolved"
            value={stats.resolved.toString()}
            subtitle="this month"
            icon="bx-check-circle"
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
            trend={{ value: 15, isPositive: true }}
          />
          <StatsCard
            title="Average Rating"
            value={stats.average_rating?.toFixed(1) || "N/A"}
            subtitle="customer satisfaction"
            icon="bx-star"
            iconColor="text-yellow-600"
            iconBgColor="bg-yellow-100"
            trend={{ value: 0.3, isPositive: true }}
          />
        </div>
      )}

      {/* Sentiment Analysis */}
      {sentimentData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Sentiment Analysis (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {sentimentData.positive}%
                </div>
                <div className="text-sm text-gray-600">Positive</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {sentimentData.neutral}%
                </div>
                <div className="text-sm text-gray-600">Neutral</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {sentimentData.negative}%
                </div>
                <div className="text-sm text-gray-600">Negative</div>
              </div>
            </div>
            {sentimentData.trending_topics.length > 0 && (
              <div className="mt-4">
                <Label className="text-sm font-medium">Trending Topics:</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {sentimentData.trending_topics.map((topic, index) => (
                    <Badge key={index} variant="outline">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Communications Management</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as any)}
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({stats?.total || 0})</TabsTrigger>
              <TabsTrigger value="feedback">
                Feedback ({stats?.by_type.feedback || 0})
              </TabsTrigger>
              <TabsTrigger value="complaints">
                Complaints ({stats?.by_type.complaint || 0})
              </TabsTrigger>
              <TabsTrigger value="suggestions">
                Suggestions ({stats?.by_type.suggestion || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {/* Filters */}
              <div className="flex items-center space-x-4">
                <Input
                  placeholder="Search feedback..."
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
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.priority}
                  onValueChange={(value) =>
                    handleFilterChange("priority", value)
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DataTable
                data={feedbacks}
                columns={columns}
                loading={loading}
                selectable
                pagination={{
                  page: currentPage,
                  pageSize: itemsPerPage,
                  total: totalItems,
                  onPageChange: setCurrentPage,
                  onPageSizeChange: () => {}, // Add this if needed
                }}
                bulkActions={[
                  {
                    label: "Mark In Progress",
                    action: (selectedRows: Communication[]) => {
                      const ids = selectedRows.map((row) => row.id);
                      setSelectedFeedbacks(ids);
                      handleBulkAction("mark_in_progress");
                    },
                    icon: <Clock className="h-4 w-4 mr-2" />,
                  },
                  {
                    label: "Mark Resolved",
                    action: (selectedRows: Communication[]) => {
                      const ids = selectedRows.map((row) => row.id);
                      setSelectedFeedbacks(ids);
                      handleBulkAction("mark_resolved");
                    },
                    icon: <CheckCircle className="h-4 w-4 mr-2" />,
                  },
                  {
                    label: "Delete Selected",
                    action: (selectedRows: Communication[]) => {
                      const ids = selectedRows.map((row) => row.id);
                      setSelectedFeedbacks(ids);
                      handleBulkAction("delete");
                    },
                    icon: <Trash2 className="h-4 w-4 mr-2" />,
                    variant: "destructive",
                  },
                ]}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedFeedback?.communication_type.toUpperCase()} Details
            </DialogTitle>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-6">
              {/* Feedback Header */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">
                    Reference Number
                  </Label>
                  <p className="text-sm text-gray-600">
                    {selectedFeedback.reference_number}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Customer</Label>
                  <p className="text-sm text-gray-600">
                    {selectedFeedback.user.name} ({selectedFeedback.user.email})
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <Badge>
                    {selectedFeedback.communication_type.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <Badge>{selectedFeedback.priority.toUpperCase()}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge>
                    {selectedFeedback.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm text-gray-600">
                    {formatDate(selectedFeedback.created_at)}
                  </p>
                </div>
              </div>

              {/* Subject and Message */}
              <div>
                <Label className="text-sm font-medium">Subject</Label>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedFeedback.subject}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Message</Label>
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                  {selectedFeedback.message}
                </p>
              </div>

              {/* Rating (if feedback) */}
              {selectedFeedback.rating && (
                <div>
                  <Label className="text-sm font-medium">Rating</Label>
                  <div className="flex items-center mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < selectedFeedback.rating!
                            ? "text-yellow-500"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {selectedFeedback.rating}/5
                    </span>
                  </div>
                </div>
              )}

              {/* Responses */}
              {selectedFeedback.responses &&
                selectedFeedback.responses.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Responses</Label>
                    <div className="space-y-3 mt-2">
                      {selectedFeedback.responses.map((response) => (
                        <div
                          key={response.id}
                          className="border rounded-lg p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium">
                              {response.responder.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(response.created_at)}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">
                            {response.response}
                          </p>
                          {response.is_resolution && (
                            <Badge
                              variant="outline"
                              className="text-green-600 mt-2"
                            >
                              Resolution
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Quick Actions */}
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handleRespondToFeedback(selectedFeedback)}
                  size="sm"
                >
                  <Reply className="h-4 w-4 mr-2" />
                  Respond
                </Button>
                <Select
                  value={selectedFeedback.status}
                  onValueChange={(value) =>
                    handleUpdateStatus(selectedFeedback, value)
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={selectedFeedback.priority}
                  onValueChange={(value) =>
                    handleUpdatePriority(selectedFeedback, value)
                  }
                >
                  <SelectTrigger className="w-40">
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
          )}
        </DialogContent>
      </Dialog>

      {/* Response Modal */}
      <Dialog open={showResponseModal} onOpenChange={setShowResponseModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Respond to {selectedFeedback?.communication_type.toUpperCase()}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="response">Response</Label>
              <Textarea
                id="response"
                placeholder="Type your response here..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={6}
                className="mt-1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_resolution"
                checked={isResolution}
                onChange={(e) => setIsResolution(e.target.checked)}
              />
              <Label htmlFor="is_resolution" className="text-sm">
                Mark as resolution (closes the feedback)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResponseModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitResponse}
              disabled={!responseText.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              Send Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeedbackManagement;
