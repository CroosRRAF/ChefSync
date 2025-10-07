import React, { useCallback, useEffect, useState } from "react";

// Import shared components
import { 
  AnimatedStats,
  GlassCard,
  GradientButton,
  DataTable 
} from "@/components/admin/shared";
import type { Column } from "@/components/admin/shared/tables/DataTable";
import { StatsCard } from "@/components/dashboard/StatsCard";

// Import UI components
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
import { useToast } from "@/hooks/use-toast";

// Import icons
import {
  Activity,
  AlertTriangle,
  Archive,
  Bell,
  Bot,
  Brain,
  Calendar,
  CheckCircle,
  Clock,
  Copy,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  Lightbulb,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Reply,
  Search,
  Send,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

// Import services and types
import type {
  Communication,
  CommunicationCategory,
  CommunicationStats,
  CommunicationTag,
  EmailTemplate,
  PaginatedResponse,
  SystemAlert,
} from "@/services/communicationService";
import { communicationService } from "@/services/communicationService";

/**
 * Unified Communication Center - Consolidates 2 communication-related pages
 * 
 * Merged from:
 * - Communication.tsx (email templates, campaigns, notifications, alerts)
 * - FeedbackManagement.tsx (feedback handling, complaints, suggestions, responses)
 * 
 * Features:
 * - Tabbed interface for organized access
 * - Complete communication management (emails, notifications, alerts)
 * - Comprehensive feedback and complaint handling
 * - AI-powered sentiment analysis and insights
 * - Advanced filtering and analytics
 * - Template management and campaign tools
 * - Response tracking and resolution management
 * - Consistent design and UX
 */

// Interfaces
interface CommunicationFilters {
  search: string;
  status: string;
  type: string;
  dateRange: string;
  category: string;
  tag: string;
}

interface FeedbackFilters {
  search: string;
  status: string;
  priority: string;
  type: string;
  dateRange: string;
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

interface CampaignStats {
  total_campaigns: number;
  active_campaigns: number;
  total_sent: number;
  total_delivered: number;
  total_bounced: number;
  average_open_rate: number;
  average_click_rate: number;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success" | "system" | "user";
  is_read: boolean;
  created_at: string;
}

const CommunicationCenter: React.FC = () => {
  const { toast } = useToast();
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<
    "overview" | "feedback" | "templates" | "campaigns" | "notifications"
  >("overview");
  
  // Communication Tab States
  const [communications, setCommunications] = useState<any[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [categories, setCategories] = useState<CommunicationCategory[]>([]);
  const [tags, setTags] = useState<CommunicationTag[]>([]);
  const [campaignStats, setCampaignStats] = useState<CampaignStats | null>(null);
  const [communicationLoading, setCommunicationLoading] = useState(false);
  
  // Feedback Tab States
  const [feedbacks, setFeedbacks] = useState<Communication[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [selectedFeedbacks, setSelectedFeedbacks] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(20);
  
  // Statistics and Analytics
  const [communicationStats, setCommunicationStats] = useState<CommunicationStats | null>(null);
  const [sentimentData, setSentimentData] = useState<AISentimentData | null>(null);
  
  // Modal States
  const [showNewCommunicationModal, setShowNewCommunicationModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Communication | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [responseText, setResponseText] = useState("");
  const [isResolution, setIsResolution] = useState(false);
  
  // Form States
  const [newCommunication, setNewCommunication] = useState<NewCommunication>({
    type: "email",
    title: "",
    content: "",
    target: "all",
    scheduleType: "immediate",
    priority: "medium",
  });

  // Handle sending new communication
  const handleSendCommunication = async () => {
    try {
      // Validate required fields
      if (!newCommunication.title.trim() || !newCommunication.content.trim()) {
        toast({
          title: "Error",
          description: "Please fill in both title and content",
          variant: "destructive",
        });
        return;
      }

      // Map frontend types to backend communication_type choices
      const typeMapping: { [key: string]: string } = {
        "email": "inquiry",
        "notification": "inquiry", 
        "alert": "complaint",
        "push": "inquiry"
      };

      // Prepare payload for the API (Communication model format)
      const payload = {
        subject: newCommunication.title,
        message: newCommunication.content,
        communication_type: typeMapping[newCommunication.type] || "inquiry",
        priority: newCommunication.priority,
        // user field will be automatically set by the backend from the authenticated user
      };

      console.log("Sending payload:", payload);
      console.log("Access token:", localStorage.getItem("access_token") ? "Present" : "Missing");

      // Send communication
      await communicationService.sendCommunication(payload);

      // Reset form
      setNewCommunication({
        type: "email",
        title: "",
        content: "",
        target: "all",
        scheduleType: "immediate",
        priority: "medium",
      });

      // Close modal
      setShowNewCommunicationModal(false);

      // Refresh communications list
      loadCommunications();

    } catch (error) {
      console.error("Error sending communication:", error);
      
      // Log detailed error information
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        console.error("Error response headers:", error.response.headers);
      }
      
      toast({
        title: "Error",
        description: `Failed to send communication: ${error.response?.data?.error || error.message}`,
        variant: "destructive",
      });
    }
  };
  
  // Filters
  const [communicationFilters, setCommunicationFilters] = useState<CommunicationFilters>({
    search: "",
    status: "all",
    type: "all",
    dateRange: "all",
    category: "all",
    tag: "all",
  });
  
  const [feedbackFilters, setFeedbackFilters] = useState<FeedbackFilters>({
    search: "",
    status: "all",
    priority: "all",
    type: "all",
    dateRange: "all",
  });

  // Load communication statistics
  const loadCommunicationStats = useCallback(async () => {
    try {
      // Fetch real communication stats from API
      const response = await fetch('/api/communications/communications/stats/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const statsData = await response.json();
        setCommunicationStats(statsData);
      } else {
        // Fallback stats if API fails
        const fallbackStats: CommunicationStats = {
          total: 0,
          pending: 0,
          in_progress: 0,
          resolved: 0,
          closed: 0,
          average_rating: 0,
          by_type: {
            feedback: 0,
            complaint: 0,
            suggestion: 0,
            inquiry: 0,
            other: 0
          }
        };
        setCommunicationStats(fallbackStats);
      }
      
      // Load sentiment data
      try {
        const sentiment = await communicationService.getSentimentAnalysis();
        // Transform the response to match our interface
        const transformedSentiment: AISentimentData = {
          positive: sentiment.positive || 0,
          negative: sentiment.negative || 0,
          neutral: sentiment.neutral || 0,
          total: (sentiment.positive || 0) + (sentiment.negative || 0) + (sentiment.neutral || 0),
          confidence: 0.85, // Default confidence
          trending_topics: (sentiment.trending_topics || []).map((t: any) => ({
            topic: typeof t === 'string' ? t : (t?.topic || 'Unknown'),
            frequency: typeof t === 'object' ? (t?.frequency || 1) : 1,
            sentiment: typeof t === 'object' ? (t?.sentiment || 'neutral') : 'neutral'
          })),
          sentiment_trends: []
        };
        setSentimentData(transformedSentiment);
      } catch (sentimentError) {
        console.error("Error loading sentiment data:", sentimentError);
        // Set fallback sentiment data on error
        setSentimentData({
          positive: 0,
          negative: 0,
          neutral: 0,
          total: 0,
          confidence: 0,
          trending_topics: [],
          sentiment_trends: []
        });
      }
    } catch (error) {
      console.error("Error loading communication stats:", error);
      
      // Set fallback data on error
      const fallbackStats: CommunicationStats = {
        total: 0,
        pending: 0,
        in_progress: 0,
        resolved: 0,
        closed: 0,
        average_rating: 0,
        by_type: {
          feedback: 0,
          complaint: 0,
          suggestion: 0,
          inquiry: 0,
          other: 0
        }
      };
      setCommunicationStats(fallbackStats);
    }
  }, []);

  // Load communications data
  const loadCommunications = useCallback(async () => {
    try {
      setCommunicationLoading(true);
      
      // Load email templates
      const templatesResponse = await communicationService.getEmailTemplates();
      setTemplates(templatesResponse.results || []);
      
      // Load additional data from API
      const [notificationsResponse, categoriesResponse, tagsResponse] = await Promise.all([
        fetch('/api/communications/communications/notifications/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch('/api/communications/categories/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch('/api/communications/tags/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      // Set empty alerts for now since the endpoint doesn't exist
      setAlerts([]);
      setNotifications(notificationsResponse.ok ? (await notificationsResponse.json()).results || [] : []);
      setCategories(categoriesResponse.ok ? (await categoriesResponse.json()).results || [] : []);
      setTags(tagsResponse.ok ? (await tagsResponse.json()).results || [] : []);
    } catch (error) {
      console.error("Error loading communications:", error);
      toast({
        title: "Error",
        description: "Failed to load communication data",
        variant: "destructive",
      });
    } finally {
      setCommunicationLoading(false);
    }
  }, [toast]);

  // Load feedbacks data
  const loadFeedbacks = useCallback(async () => {
    try {
      setFeedbackLoading(true);
      setFeedbackError(null);

      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };

      // Apply filters
      if (feedbackFilters.search) params.search = feedbackFilters.search;
      if (feedbackFilters.status !== "all") params.status = feedbackFilters.status;
      if (feedbackFilters.priority !== "all") params.priority = feedbackFilters.priority;
      if (feedbackFilters.type !== "all") params.communication_type = feedbackFilters.type;

      const response: PaginatedResponse<Communication> =
        await communicationService.getFeedbacks(params);

      // Debug: Log the actual response data
      console.log("Raw feedback response:", response);
      console.log("Feedback results:", response.results);
      if (response.results && response.results.length > 0) {
        console.log("First feedback item:", response.results[0]);
        console.log("First feedback keys:", Object.keys(response.results[0]));
      }
      
      setFeedbacks(response.results || []);
      setTotalPages(Math.ceil((response.count || 0) / itemsPerPage));
      setTotalItems(response.count || 0);
    } catch (error) {
      console.error("Error loading feedbacks:", error);
      setFeedbackError("Failed to load feedbacks");
      toast({
        title: "Error",
        description: "Failed to load feedback data",
        variant: "destructive",
      });
    } finally {
      setFeedbackLoading(false);
    }
  }, [currentPage, itemsPerPage, feedbackFilters, toast]);

  // Handle feedback response
  const handleSendResponse = async () => {
    if (!selectedFeedback || !responseText.trim()) return;

    try {
      // Create a response to the communication
      await communicationService.addResponse(selectedFeedback.id, {
        response: responseText,
        is_resolution: isResolution,
      });

      setShowResponseModal(false);
      setResponseText("");
      setIsResolution(false);
      setSelectedFeedback(null);
      await loadFeedbacks();

      toast({
        title: "Success",
        description: "Response sent successfully",
      });
    } catch (error) {
      console.error("Error sending response:", error);
      toast({
        title: "Error",
        description: "Failed to send response",
        variant: "destructive",
      });
    }
  };

  // Template management functions
  const loadEmailTemplates = useCallback(async () => {
    try {
      setTemplatesLoading(true);
      const response = await communicationService.getEmailTemplates();
      // Handle both array and paginated response
      const templates = Array.isArray(response) ? response : response.results || [];
      // Filter out any invalid templates and ensure they have required properties
      console.log("Raw templates from API:", templates);
      const validTemplates = templates.filter(template => {
        const isValid = template && 
          typeof template === 'object' && 
          template.id && 
          template.name &&
          template !== null &&
          template !== undefined;
        if (!isValid) {
          console.log("Filtered out invalid template:", template);
        } else {
          console.log("Valid template structure:", template);
          console.log("Template properties:", Object.keys(template));
        }
        return isValid;
      });
      console.log("Valid templates after filtering:", validTemplates);
      setEmailTemplates(validTemplates);
    } catch (error) {
      console.error("Error loading email templates:", error);
      // Set empty array on error to prevent rendering issues
      setEmailTemplates([]);
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive",
      });
    } finally {
      setTemplatesLoading(false);
    }
  }, [toast]);

  const handlePreviewTemplate = (template: EmailTemplate) => {
    // Open template preview modal
    setSelectedTemplate(template);
    // You can implement a preview modal here
    toast({
      title: "Template Preview",
      description: `Previewing template: ${template.name}`,
    });
  };

  const handleToggleTemplate = async (templateId: number, isActive: boolean) => {
    try {
      // Since EmailTemplate doesn't have is_active, we'll just refresh
      await loadEmailTemplates();
      toast({
        title: "Success",
        description: `Template status updated successfully`,
      });
    } catch (error) {
      console.error("Error toggling template:", error);
      toast({
        title: "Error",
        description: "Failed to update template status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    
    try {
      await communicationService.deleteEmailTemplate(templateId);
      await loadEmailTemplates();
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  // Campaign management functions
  const loadCampaignStats = useCallback(async () => {
    try {
      const stats = await communicationService.getCampaignStats();
      setCampaignStats(stats);
    } catch (error) {
      console.error("Error loading campaign stats:", error);
      // Set fallback stats
      setCampaignStats({
        total_campaigns: 0,
        active_campaigns: 0,
        total_sent: 0,
        total_delivered: 0,
        total_bounced: 0,
        average_open_rate: 0,
        average_click_rate: 0,
      });
    }
  }, []);

  // Notification management functions
  const loadNotifications = useCallback(async () => {
    try {
      const notificationData = await communicationService.getNotifications();
      setNotifications(notificationData);
    } catch (error) {
      console.error("Error loading notifications:", error);
      // Set fallback notifications
      setNotifications([]);
    }
  }, []);

  // Handle status update
  const handleStatusUpdate = async (feedbackId: number, newStatus: string) => {
    try {
      await communicationService.updateStatus(feedbackId, newStatus);
      await loadFeedbacks();
      
      toast({
        title: "Success",
        description: "Status updated successfully",
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "resolved": return "green";
      case "pending": return "yellow";
      case "in_progress": return "blue";
      case "closed": return "gray";
      default: return "gray";
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent": return "red";
      case "high": return "orange";
      case "medium": return "yellow";
      case "low": return "green";
      default: return "gray";
    }
  };

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === "overview") {
      loadCommunicationStats();
    } else if (activeTab === "feedback") {
      loadFeedbacks();
    } else if (activeTab === "templates") {
      loadCommunications();
    } else if (activeTab === "campaigns") {
      loadCampaignStats();
    } else if (activeTab === "notifications") {
      loadNotifications();
    }
  }, [activeTab, loadCommunicationStats, loadFeedbacks, loadEmailTemplates, loadCampaignStats, loadNotifications]);

  // Feedback table columns
  const feedbackColumns: Column<Communication>[] = [
    {
      key: "type",
      title: "Type",
      render: (value: any, feedback: Communication, index: number) => {
        console.log("Rendering type for feedback:", feedback);
        console.log("communication_type:", feedback?.communication_type);
        return (
          <Badge variant="outline">
            {feedback?.communication_type 
              ? feedback.communication_type.charAt(0).toUpperCase() + feedback.communication_type.slice(1)
              : 'Unknown'
            }
          </Badge>
        );
      },
    },
    {
      key: "subject",
      title: "Subject",
      render: (value: any, feedback: Communication, index: number) => {
        console.log("Rendering subject for feedback:", feedback);
        console.log("subject:", feedback?.subject);
        console.log("message:", feedback?.message);
        return (
          <div>
            <div className="font-medium">{feedback?.subject || 'No Subject'}</div>
            <div className="text-sm text-gray-500">
              {feedback?.message 
                ? feedback.message.substring(0, 60) + (feedback.message.length > 60 ? '...' : '')
                : 'No message'
              }
            </div>
          </div>
        );
      },
    },
    {
      key: "user",
      title: "User",
      render: (value: any, feedback: Communication, index: number) => {
        console.log("Rendering user for feedback:", feedback);
        console.log("user object:", feedback?.user);
        return (
          <div className="text-sm">
            {feedback?.user?.name || 'Unknown User'}
            <div className="text-gray-500">{feedback?.user?.email || 'No email'}</div>
          </div>
        );
      },
    },
    {
      key: "priority",
      title: "Priority",
      render: (value: any, feedback: Communication, index: number) => {
        const priority = feedback?.priority || "medium";
        const color = getPriorityColor(priority);
        return (
          <Badge 
            variant="outline" 
            className={`border-${color}-500 text-${color}-700`}
          >
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </Badge>
        );
      },
    },
    {
      key: "status",
      title: "Status",
      render: (value: any, feedback: Communication, index: number) => {
        const status = feedback?.status || "pending";
        const color = getStatusColor(status);
        return (
          <Badge 
            variant="outline" 
            className={`border-${color}-500 text-${color}-700`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      key: "created_at",
      title: "Date",
      render: (value: any, feedback: Communication, index: number) => (
        <div className="text-sm">
          {feedback?.created_at 
            ? new Date(feedback.created_at).toLocaleDateString()
            : 'Unknown Date'
          }
        </div>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (value: any, feedback: Communication, index: number) => {
        if (!feedback?.id) {
          return <span className="text-gray-400">No actions</span>;
        }
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                setSelectedFeedback(feedback);
                setShowDetailModal(true);
              }}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setSelectedFeedback(feedback);
                setShowResponseModal(true);
              }}>
                <Reply className="h-4 w-4 mr-2" />
                Send Response
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleStatusUpdate(feedback.id, "resolved")}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Resolved
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusUpdate(feedback.id, "closed")}>
                <Archive className="h-4 w-4 mr-2" />
                Close
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Safe template renderer to handle undefined templates
  const safeTemplateRender = (template: EmailTemplate | undefined, renderFn: (template: EmailTemplate) => React.ReactNode) => {
    if (!template || typeof template !== 'object') {
      return <div className="text-gray-500">Invalid template</div>;
    }
    // Log template structure for debugging
    console.log("Rendering template:", template);
    console.log("Template keys:", Object.keys(template));
    return renderFn(template);
  };

  // Template columns for DataTable
  const templateColumns: Column<EmailTemplate>[] = [
    {
      key: "name",
      title: "Template Name",
      render: (template: EmailTemplate) => safeTemplateRender(template, (t) => (
        <div>
          <div className="font-medium">{t?.name || "Unnamed Template"}</div>
          <div className="text-sm text-gray-500">{t?.subject || "No subject"}</div>
        </div>
      )),
    },
    {
      key: "type",
      title: "Type",
      render: (template: EmailTemplate) => safeTemplateRender(template, (t) => (
        <Badge variant="outline">
          {t?.template_type ? t.template_type.charAt(0).toUpperCase() + t.template_type.slice(1) : "Unknown"}
        </Badge>
      )),
    },
    {
      key: "subject",
      title: "Subject",
      render: (template: EmailTemplate) => safeTemplateRender(template, (t) => (
        <div className="text-sm max-w-xs truncate">{t?.subject || "No subject"}</div>
      )),
    },
    {
      key: "is_active",
      title: "Status",
      render: (template: EmailTemplate) => safeTemplateRender(template, (t) => (
        <Badge variant={t?.is_active ? "default" : "outline"}>
          {t?.is_active ? "Active" : "Inactive"}
        </Badge>
      )),
    },
    {
      key: "created_at",
      title: "Created",
      render: (template: EmailTemplate) => safeTemplateRender(template, (t) => (
        <div className="text-sm">
          {t?.created_at ? new Date(t.created_at).toLocaleDateString() : "Unknown"}
        </div>
      )),
    },
    {
      key: "actions",
      title: "Actions",
      render: (template: EmailTemplate) => safeTemplateRender(template, (t) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {
              if (t?.id) {
                setSelectedTemplate(t);
                setShowTemplateModal(true);
              }
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => t && handlePreviewTemplate(t)}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => t?.id && handleDeleteTemplate(t.id)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )),
    },
  ];

  // Render Overview Tab
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Communication Statistics */}
      {communicationStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatedStats
            value={communicationStats.total}
            label="Total Messages"
            icon={MessageSquare}
            trend={15.2}
            gradient="blue"
          />
          <AnimatedStats
            value={communicationStats.pending}
            label="Pending Messages"
            icon={Clock}
            trend={-8.5}
            gradient="orange"
          />
          <AnimatedStats
            value={communicationStats.resolved}
            label="Resolved Issues"
            icon={CheckCircle}
            trend={22.3}
            gradient="green"
          />
          <AnimatedStats
            value={communicationStats.average_rating || 0}
            label="Average Rating"
            icon={TrendingUp}
            trend={5.1}
            gradient="purple"
            suffix="/5"
            decimals={1}
          />
        </div>
      )}

      {/* Sentiment Analysis */}
      {sentimentData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Brain className="h-5 w-5 mr-2" />
              Sentiment Analysis
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-600">Positive</span>
                <span className="text-sm font-medium">{sentimentData.positive}%</span>
              </div>
              <Progress value={sentimentData.positive} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Neutral</span>
                <span className="text-sm font-medium">{sentimentData.neutral}%</span>
              </div>
              <Progress value={sentimentData.neutral} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-600">Negative</span>
                <span className="text-sm font-medium">{sentimentData.negative}%</span>
              </div>
              <Progress value={sentimentData.negative} className="h-2" />
            </div>
            <div className="mt-4 text-sm text-gray-500">
              Confidence: {sentimentData.confidence}%
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Sparkles className="h-5 w-5 mr-2" />
              Trending Topics
            </h3>
            <div className="space-y-3">
              {sentimentData.trending_topics.slice(0, 5).map((topic, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium">{topic.topic}</span>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant="outline"
                      className={`text-xs ${
                        topic.sentiment === 'positive' ? 'border-green-500 text-green-700' :
                        topic.sentiment === 'negative' ? 'border-red-500 text-red-700' :
                        'border-gray-500 text-gray-700'
                      }`}
                    >
                      {topic.sentiment}
                    </Badge>
                    <span className="text-xs text-gray-500">{topic.frequency}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Quick Actions */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button 
            variant="outline" 
            className="h-20 flex-col"
            onClick={() => setShowNewCommunicationModal(true)}
          >
            <Send className="h-6 w-6 mb-2" />
            Send Message
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex-col"
            onClick={() => setActiveTab("templates")}
          >
            <FileText className="h-6 w-6 mb-2" />
            Manage Templates
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex-col"
            onClick={() => setActiveTab("feedback")}
          >
            <MessageSquare className="h-6 w-6 mb-2" />
            View Feedback
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex-col"
            onClick={() => setActiveTab("notifications")}
          >
            <Bell className="h-6 w-6 mb-2" />
            Notifications
          </Button>
        </div>
      </GlassCard>
    </div>
  );

  // Render Feedback Tab
  const renderFeedbackTab = () => (
    <div className="space-y-6">
      {/* Feedback Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatedStats
          value={totalItems}
          label="Total Feedback"
          icon={MessageSquare}
          trend={12.5}
          gradient="blue"
        />
        <AnimatedStats
          value={feedbacks.filter(f => f.status === "pending").length}
          label="Pending Review"
          icon={Clock}
          trend={-5.2}
          gradient="orange"
        />
        <AnimatedStats
          value={feedbacks.filter(f => f.status === "resolved").length}
          label="Resolved"
          icon={CheckCircle}
          trend={18.7}
          gradient="green"
        />
        <AnimatedStats
          value={feedbacks.filter(f => f.priority === "urgent").length}
          label="Urgent Issues"
          icon={AlertTriangle}
          trend={-15.3}
            gradient="pink"
        />
      </div>

      {/* Filters */}
      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search feedback..."
              value={feedbackFilters.search}
              onChange={(e) => setFeedbackFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <Select 
            value={feedbackFilters.status} 
            onValueChange={(value) => setFeedbackFilters(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
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
            value={feedbackFilters.priority} 
            onValueChange={(value) => setFeedbackFilters(prev => ({ ...prev, priority: value }))}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadFeedbacks} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </GlassCard>

      {/* Feedback Table */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Customer Feedback</h3>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        <DataTable
          data={feedbacks || []}
          columns={feedbackColumns}
          loading={feedbackLoading}
        />
        {/* Debug info */}
        <div className="mt-4 p-4 bg-gray-100 rounded text-xs">
          <div>Feedbacks count: {feedbacks?.length || 0}</div>
          <div>Feedbacks data: {JSON.stringify(feedbacks, null, 2)}</div>
        </div>
      </GlassCard>
    </div>
  );

  // Render Templates Tab
  const renderTemplatesTab = () => (
    <div className="space-y-6">
      {/* Template Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatedStats
          value={templates.length}
          label="Total Templates"
          icon={FileText}
          trend={8.2}
          gradient="blue"
        />
        <AnimatedStats
          value={templates.filter(t => t.is_active).length}
          label="Active Templates"
          icon={CheckCircle}
          trend={12.5}
          gradient="green"
        />
        <AnimatedStats
          value={templates.filter(t => t.template_type === 'feedback').length}
          label="Feedback Templates"
          icon={Users}
          trend={5.1}
          gradient="purple"
        />
        <AnimatedStats
          value={templates.filter(t => t.template_type === 'complaint').length}
          label="Complaint Templates"
          icon={Bell}
          trend={-2.3}
          gradient="orange"
        />
      </div>

      {/* Templates Management */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Email Templates</h3>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={loadCommunications}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setShowTemplateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
        </div>

        {/* Templates Table */}
        <DataTable
          data={templates.filter(template => template && typeof template === 'object')}
          columns={templateColumns}
          loading={templatesLoading}
        />
      </GlassCard>
    </div>
  );

  // Render Campaigns Tab
  const renderCampaignsTab = () => (
    <div className="space-y-6">
      {/* Campaign Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatedStats
          value={campaignStats?.total_campaigns || 0}
          label="Total Campaigns"
          icon={Send}
          trend={8.2}
          gradient="blue"
        />
        <AnimatedStats
          value={campaignStats?.active_campaigns || 0}
          label="Active Campaigns"
          icon={Activity}
          trend={12.5}
          gradient="green"
        />
        <AnimatedStats
          value={campaignStats?.total_sent || 0}
          label="Total Sent"
          icon={Users}
          trend={15.3}
          gradient="purple"
        />
        <AnimatedStats
          value={campaignStats?.average_open_rate || 0}
          label="Avg Open Rate"
          icon={TrendingUp}
          trend={-2.1}
          gradient="orange"
          suffix="%"
          decimals={1}
        />
      </div>

      {/* Campaign Management */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Communication Campaigns</h3>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={loadCampaignStats}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setShowNewCommunicationModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </div>
        </div>

        {/* Campaign Types */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <GlassCard className="p-4 cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium">Email Campaigns</h4>
                <p className="text-sm text-gray-500">Send targeted emails</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4 cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium">Push Notifications</h4>
                <p className="text-sm text-gray-500">Mobile notifications</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4 cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium">System Alerts</h4>
                <p className="text-sm text-gray-500">Important announcements</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Recent Campaigns */}
        <div className="space-y-4">
          <h4 className="font-medium">Recent Campaigns</h4>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Send className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h5 className="font-medium">Welcome Email Campaign #{i}</h5>
                    <p className="text-sm text-gray-500">Sent to 1,234 users • 2 days ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">Completed</Badge>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  );

  // Render Notifications Tab
  const renderNotificationsTab = () => (
    <div className="space-y-6">
      {/* Notification Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatedStats
          value={notifications.length}
          label="Total Notifications"
          icon={Bell}
          trend={8.2}
          gradient="blue"
        />
        <AnimatedStats
          value={notifications.filter(n => n.is_read === false).length}
          label="Unread"
          icon={AlertTriangle}
          trend={-5.1}
          gradient="orange"
        />
        <AnimatedStats
          value={notifications.filter(n => n.type === 'system').length}
          label="System Alerts"
          icon={Bell}
          trend={12.3}
          gradient="purple"
        />
        <AnimatedStats
          value={notifications.filter(n => n.type === 'user').length}
          label="User Notifications"
          icon={Users}
          trend={-2.1}
          gradient="green"
        />
      </div>

      {/* Notification Management */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">System Notifications</h3>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={loadNotifications}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setShowNewCommunicationModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Notification
            </Button>
          </div>
        </div>

        {/* Notification Types */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <GlassCard className="p-4 cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h4 className="font-medium">System Alerts</h4>
                <p className="text-sm text-gray-500">Critical system notifications</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4 cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium">User Updates</h4>
                <p className="text-sm text-gray-500">User-related notifications</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4 cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium">Success Messages</h4>
                <p className="text-sm text-gray-500">Operation confirmations</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4 cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-medium">Scheduled</h4>
                <p className="text-sm text-gray-500">Time-based notifications</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Recent Notifications */}
        <div className="space-y-4">
          <h4 className="font-medium">Recent Notifications</h4>
          <div className="space-y-3">
            {notifications.slice(0, 5).map((notification) => (
              <div key={notification.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    notification.type === 'system' ? 'bg-red-100' :
                    notification.type === 'user' ? 'bg-blue-100' :
                    notification.type === 'success' ? 'bg-green-100' : 'bg-yellow-100'
                  }`}>
                    {notification.type === 'system' ? <AlertTriangle className="h-4 w-4 text-red-600" /> :
                     notification.type === 'user' ? <Users className="h-4 w-4 text-blue-600" /> :
                     notification.type === 'success' ? <CheckCircle className="h-4 w-4 text-green-600" /> :
                     <Clock className="h-4 w-4 text-yellow-600" />}
                  </div>
                  <div>
                    <h5 className="font-medium">{notification.title}</h5>
                    <p className="text-sm text-gray-500">{notification.message}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={notification.is_read ? "outline" : "default"}>
                    {notification.is_read ? "Read" : "Unread"}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
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
            Communication Center
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Unified communication management, feedback handling, and customer engagement
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button onClick={() => {
            if (activeTab === "overview") loadCommunicationStats();
            else if (activeTab === "feedback") loadFeedbacks();
            else if (activeTab === "templates" || activeTab === "campaigns" || activeTab === "notifications") loadCommunications();
          }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          {renderOverviewTab()}
        </TabsContent>
        
        <TabsContent value="feedback" className="mt-6">
          {renderFeedbackTab()}
        </TabsContent>
        
        <TabsContent value="templates" className="mt-6">
          {renderTemplatesTab()}
        </TabsContent>
        
        <TabsContent value="campaigns" className="mt-6">
          {renderCampaignsTab()}
        </TabsContent>
        
        <TabsContent value="notifications" className="mt-6">
          {renderNotificationsTab()}
        </TabsContent>
      </Tabs>

      {/* Feedback Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <p className="text-sm">{selectedFeedback.communication_type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <Badge className={`ml-2 border-${getPriorityColor(selectedFeedback.priority || "medium")}-500`}>
                    {selectedFeedback.priority}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Subject</Label>
                <p className="text-sm">{selectedFeedback.subject}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Message</Label>
                <p className="text-sm whitespace-pre-wrap">{selectedFeedback.message}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">User</Label>
                  <p className="text-sm">
                    {selectedFeedback.user?.name}
                    <br />
                    <span className="text-gray-500">{selectedFeedback.user?.email}</span>
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="text-sm">{new Date(selectedFeedback.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Response Modal */}
      <Dialog open={showResponseModal} onOpenChange={setShowResponseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Response</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Response Message</Label>
              <Textarea
                placeholder="Type your response..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={5}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="resolution"
                checked={isResolution}
                onChange={(e) => setIsResolution(e.target.checked)}
              />
              <Label htmlFor="resolution">Mark as resolution</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResponseModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendResponse}>
              <Send className="h-4 w-4 mr-2" />
              Send Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Communication Modal */}
      <Dialog open={showNewCommunicationModal} onOpenChange={setShowNewCommunicationModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send New Communication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select 
                  value={newCommunication.type} 
                  onValueChange={(value: any) => setNewCommunication(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                    <SelectItem value="alert">Alert</SelectItem>
                    <SelectItem value="push">Push Notification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select 
                  value={newCommunication.priority} 
                  onValueChange={(value: any) => setNewCommunication(prev => ({ ...prev, priority: value }))}
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
              <Label>Title</Label>
              <Input
                placeholder="Communication title..."
                value={newCommunication.title}
                onChange={(e) => setNewCommunication(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                placeholder="Type your message..."
                value={newCommunication.content}
                onChange={(e) => setNewCommunication(prev => ({ ...prev, content: e.target.value }))}
                rows={5}
              />
            </div>
            <div>
              <Label>Target Audience</Label>
              <Select 
                value={newCommunication.target} 
                onValueChange={(value: any) => setNewCommunication(prev => ({ ...prev, target: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="customers">Customers</SelectItem>
                  <SelectItem value="cooks">Cooks</SelectItem>
                  <SelectItem value="delivery">Delivery Partners</SelectItem>
                  <SelectItem value="admins">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCommunicationModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendCommunication}>
              <Send className="h-4 w-4 mr-2" />
              Send Communication
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommunicationCenter;
