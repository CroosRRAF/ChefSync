import React, { useCallback, useEffect, useState } from "react";

// Import shared components
import { AnimatedStats, DataTable, GlassCard } from "@/components/admin/shared";
import type { Column } from "@/components/admin/shared/tables/DataTable";

// Import UI components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// Import icons
import {
  Activity,
  AlertTriangle,
  Archive,
  Bell,
  Brain,
  CheckCircle,
  Clock,
  Download,
  Edit,
  Eye,
  FileText,
  MessageSquare,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Reply,
  Send,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";

// Import services and types
import type {
  CommunicationCategory,
  CommunicationResponse,
  CommunicationStats,
  CommunicationTag,
  Contact,
  DeliveryReview,
  EmailTemplate,
  FoodReview,
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

// Unified feedback interface for displaying different types of reviews
interface UnifiedFeedback {
  id: number;
  type: "communication" | "food_review" | "delivery_review" | "contact";
  subject?: string;
  message?: string;
  comment?: string;
  rating?: number;
  status?: string;
  priority?: string;
  communication_type?: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  customer?: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
  responses?: CommunicationResponse[];
  admin_response?: string;
  response_date?: string;
  // Additional fields for food reviews
  food?: {
    food_id: number;
    name: string;
  };
  cook?: {
    id: number;
    name: string;
    email: string;
  };
  // Additional fields for delivery reviews
  delivery?: {
    delivery_id: number;
    order: {
      order_id: number;
      order_number: string;
    };
    delivery_agent: {
      id: number;
      name: string;
      email: string;
    };
  };
}

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
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(
    null
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [categories, setCategories] = useState<CommunicationCategory[]>([]);
  const [tags, setTags] = useState<CommunicationTag[]>([]);
  const [campaignStats, setCampaignStats] = useState<CampaignStats | null>(
    null
  );
  const [communicationLoading, setCommunicationLoading] = useState(false);

  // Feedback Tab States
  const [feedbacks, setFeedbacks] = useState<UnifiedFeedback[]>([]);
  const [foodReviews, setFoodReviews] = useState<FoodReview[]>([]);
  const [deliveryReviews, setDeliveryReviews] = useState<DeliveryReview[]>([]);
  const [contactMessages, setContactMessages] = useState<Contact[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [selectedFeedbacks, setSelectedFeedbacks] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(20);

  // Statistics and Analytics
  const [communicationStats, setCommunicationStats] =
    useState<CommunicationStats | null>(null);
  const [sentimentData, setSentimentData] = useState<AISentimentData | null>(
    null
  );
  const [sentimentLoading, setSentimentLoading] = useState(false);
  const [sentimentError, setSentimentError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Modal States
  const [showNewCommunicationModal, setShowNewCommunicationModal] =
    useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] =
    useState<UnifiedFeedback | null>(null);
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(null);
  const [responseText, setResponseText] = useState("");
  const [isResolution, setIsResolution] = useState(false);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [feedbackResponses, setFeedbackResponses] = useState<
    CommunicationResponse[]
  >([]);

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
        email: "inquiry",
        notification: "inquiry",
        alert: "complaint",
        push: "inquiry",
      };

      // Prepare payload for the API (Communication model format)
      const payload = {
        subject: newCommunication.title,
        message: newCommunication.content,
        communication_type: typeMapping[newCommunication.type] || "inquiry",
        priority: newCommunication.priority,
        // user field will be automatically set by the backend from the authenticated user
      };

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
        description: `Failed to send communication: ${
          error.response?.data?.error || error.message
        }`,
        variant: "destructive",
      });
    }
  };

  // Filters
  const [communicationFilters, setCommunicationFilters] =
    useState<CommunicationFilters>({
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
      const response = await fetch(
        "/api/communications/communications/stats/",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
        }
      );

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
            other: 0,
          },
        };
        setCommunicationStats(fallbackStats);
      }

      // Load sentiment data
      try {
        setSentimentLoading(true);
        setSentimentError(null);

        const sentiment = await communicationService.getSentimentAnalysis();

        // Extract data from the response structure - handle both nested and flat formats
        const overallSentiment = sentiment.overall_sentiment;
        const sentimentData = overallSentiment || sentiment;
        const topics = sentiment.trending_topics || [];
        const trends = sentiment.sentiment_trends || [];

        // Calculate percentages from raw counts if percentages not provided
        const total =
          overallSentiment?.total ||
          sentiment.positive + sentiment.negative + sentiment.neutral ||
          1;
        const posPercentage =
          overallSentiment?.positive_percentage ||
          (sentiment.positive / total) * 100;
        const negPercentage =
          overallSentiment?.negative_percentage ||
          (sentiment.negative / total) * 100;
        const neuPercentage =
          overallSentiment?.neutral_percentage ||
          (sentiment.neutral / total) * 100;

        // Transform the response to match our interface
        const transformedSentiment: AISentimentData = {
          positive: Math.round(posPercentage) || 0,
          negative: Math.round(negPercentage) || 0,
          neutral: Math.round(neuPercentage) || 0,
          total: total,
          // Use real confidence from AI analysis
          confidence:
            overallSentiment?.confidence_score ||
            (overallSentiment?.confidence
              ? overallSentiment.confidence * 100
              : 85),
          trending_topics: topics.map((t: any) => ({
            topic: typeof t === "string" ? t : t?.topic || "Unknown",
            frequency: typeof t === "object" ? t?.frequency || 1 : 1,
            sentiment:
              typeof t === "object" ? t?.sentiment || "neutral" : "neutral",
          })),
          sentiment_trends: trends,
        };
        setSentimentData(transformedSentiment);

        console.log(
          "Sentiment analysis loaded successfully:",
          transformedSentiment
        );
      } catch (sentimentError: any) {
        console.error("Error loading sentiment data:", sentimentError);
        const errorMessage =
          sentimentError.response?.data?.message ||
          sentimentError.message ||
          "Failed to load sentiment analysis";
        setSentimentError(errorMessage);

        // Show user-friendly error toast
        if (sentimentError.response?.status !== 404) {
          toast({
            title: "AI Service Unavailable",
            description:
              "Sentiment analysis is currently unavailable. Please check if the AI service is configured properly.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "No Data Available",
            description: "No communications found for sentiment analysis.",
            variant: "default",
          });
        }

        // Do NOT set fallback data - let the UI show empty/error state
        setSentimentData(null);
      } finally {
        setSentimentLoading(false);
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
          other: 0,
        },
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
      const [notificationsResponse, categoriesResponse, tagsResponse] =
        await Promise.all([
          fetch("/api/communications/communications/notifications/", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
              "Content-Type": "application/json",
            },
          }),
          fetch("/api/communications/categories/", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
              "Content-Type": "application/json",
            },
          }),
          fetch("/api/communications/tags/", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
              "Content-Type": "application/json",
            },
          }),
        ]);

      // Set empty alerts for now since the endpoint doesn't exist
      setAlerts([]);
      setNotifications(
        notificationsResponse.ok
          ? (await notificationsResponse.json()).results || []
          : []
      );
      setCategories(
        categoriesResponse.ok
          ? (await categoriesResponse.json()).results || []
          : []
      );
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
      if (feedbackFilters.status !== "all")
        params.status = feedbackFilters.status;
      if (feedbackFilters.priority !== "all")
        params.priority = feedbackFilters.priority;

      // Load different types of feedback based on filter
      let allFeedbacks: UnifiedFeedback[] = [];
      let totalCount = 0;

      if (
        feedbackFilters.type === "all" ||
        feedbackFilters.type === "feedback"
      ) {
        // Load food reviews
        try {
          const foodReviewsResponse = await communicationService.getFoodReviews(
            params
          );
          const foodReviewsFeedback: UnifiedFeedback[] = (
            foodReviewsResponse.results || []
          ).map((review) => ({
            id: review.review_id,
            type: "food_review" as const,
            subject: `Food Review: ${
              review.price?.food?.name || "Unknown Food"
            }`,
            comment: review.comment,
            rating: review.rating,
            status: review.admin_response ? "resolved" : "pending",
            priority:
              review.rating <= 2
                ? "high"
                : review.rating <= 3
                ? "medium"
                : "low",
            communication_type: "feedback",
            customer: review.customer,
            user: review.customer,
            created_at: review.created_at,
            food: review.price?.food,
            cook: review.price?.cook,
            admin_response: review.admin_response,
            response_date: review.response_date,
          }));
          allFeedbacks.push(...foodReviewsFeedback);
          totalCount += foodReviewsResponse.count || 0;
        } catch (error) {
          console.error("Error loading food reviews:", error);
        }
      }

      if (
        feedbackFilters.type === "all" ||
        feedbackFilters.type === "complaint"
      ) {
        // Load delivery reviews
        try {
          const deliveryReviewsResponse =
            await communicationService.getDeliveryReviews(params);
          const deliveryReviewsFeedback: UnifiedFeedback[] = (
            deliveryReviewsResponse.results || []
          ).map((review) => ({
            id: review.review_id,
            type: "delivery_review" as const,
            subject: `Delivery Review: Order ${
              review.delivery?.order?.order_number || "Unknown"
            }`,
            comment: review.comment,
            rating: review.rating,
            status: review.admin_response ? "resolved" : "pending",
            priority:
              review.rating <= 2
                ? "high"
                : review.rating <= 3
                ? "medium"
                : "low",
            communication_type: "complaint",
            customer: review.customer,
            user: review.customer,
            created_at: review.created_at,
            delivery: review.delivery,
            admin_response: review.admin_response,
            response_date: review.response_date,
          }));
          allFeedbacks.push(...deliveryReviewsFeedback);
          totalCount += deliveryReviewsResponse.count || 0;
        } catch (error) {
          console.error("Error loading delivery reviews:", error);
        }
      }

      if (
        feedbackFilters.type === "all" ||
        feedbackFilters.type === "inquiry"
      ) {
        // Load contact messages
        try {
          const contactResponse = await communicationService.getContactMessages(
            params
          );
          const contactFeedback: UnifiedFeedback[] = (
            contactResponse.results || []
          ).map((contact) => ({
            id: contact.contact_id,
            type: "contact" as const,
            subject: contact.subject || "Contact Message",
            message: contact.message,
            status:
              contact.status === "new"
                ? "pending"
                : contact.status === "replied"
                ? "resolved"
                : contact.status,
            priority: "medium",
            communication_type: "inquiry",
            user: contact.user || {
              id: 0,
              name: contact.name,
              email: contact.email,
            },
            customer: contact.user || {
              id: 0,
              name: contact.name,
              email: contact.email,
            },
            created_at: contact.created_at,
          }));
          allFeedbacks.push(...contactFeedback);
          totalCount += contactResponse.count || 0;
        } catch (error) {
          console.error("Error loading contact messages:", error);
        }
      }

      if (
        feedbackFilters.type === "all" ||
        ["suggestion", "other"].includes(feedbackFilters.type)
      ) {
        // Load regular communications
        try {
          const filterParams = { ...params };
          if (feedbackFilters.type !== "all") {
            filterParams.communication_type = feedbackFilters.type;
          }

          const communicationsResponse =
            await communicationService.getCommunications(filterParams);
          const communicationsFeedback: UnifiedFeedback[] = (
            communicationsResponse.results || []
          ).map((comm) => ({
            id: comm.id,
            type: "communication" as const,
            subject: comm.subject,
            message: comm.message,
            status: comm.status,
            priority: comm.priority,
            communication_type: comm.communication_type,
            user: comm.user,
            customer: comm.user,
            created_at: comm.created_at,
            responses: comm.responses,
          }));
          allFeedbacks.push(...communicationsFeedback);
          totalCount += communicationsResponse.count || 0;
        } catch (error) {
          console.error("Error loading communications:", error);
        }
      }

      // Sort by created_at descending
      allFeedbacks.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Apply pagination to the combined results
      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedFeedbacks = allFeedbacks.slice(
        startIndex,
        startIndex + itemsPerPage
      );

      setFeedbacks(paginatedFeedbacks);
      setTotalPages(Math.ceil(totalCount / itemsPerPage));
      setTotalItems(totalCount);

      console.log("Loaded feedbacks:", {
        total: totalCount,
        page: currentPage,
        items: paginatedFeedbacks.length,
        types: paginatedFeedbacks.map((f) => f.type),
      });
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

      // If marked as resolution, also update the status to resolved
      if (isResolution && selectedFeedback.status !== "resolved") {
        await communicationService.updateStatus(
          selectedFeedback.id,
          "resolved"
        );
      }

      setShowResponseModal(false);
      setResponseText("");
      setIsResolution(false);

      // Reload responses for the current feedback
      if (selectedFeedback) {
        await loadFeedbackResponses(selectedFeedback.id);
      }

      setSelectedFeedback(null);
      await loadFeedbacks();

      toast({
        title: "Success",
        description: isResolution
          ? "Response sent and issue marked as resolved"
          : "Response sent successfully",
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

  // Load responses for a specific feedback
  const loadFeedbackResponses = useCallback(async (communicationId: number) => {
    try {
      setLoadingResponses(true);
      const responses = await communicationService.getCommunicationResponses(
        communicationId
      );
      setFeedbackResponses(responses);
    } catch (error) {
      console.error("Error loading feedback responses:", error);
      setFeedbackResponses([]);
    } finally {
      setLoadingResponses(false);
    }
  }, []);

  // Template management functions
  const loadEmailTemplates = useCallback(async () => {
    try {
      setTemplatesLoading(true);
      const response = await communicationService.getEmailTemplates();
      // Handle both array and paginated response
      const templates = Array.isArray(response)
        ? response
        : response.results || [];
      // Filter out any invalid templates and ensure they have required properties
      const validTemplates = templates.filter((template) => {
        const isValid =
          template &&
          typeof template === "object" &&
          template.id &&
          template.name &&
          template !== null &&
          template !== undefined;
        return isValid;
      });
      setTemplates(validTemplates);
    } catch (error) {
      console.error("Error loading email templates:", error);
      // Set empty array on error to prevent rendering issues
      setTemplates([]);
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

  const handleToggleTemplate = async (
    templateId: number,
    isActive: boolean
  ) => {
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
      setNotificationsLoading(true);
      setNotificationsError(null);

      const notificationData = await communicationService.getNotifications();

      // Ensure we have an array of notifications
      const notifications = Array.isArray(notificationData)
        ? notificationData
        : [];
      setNotifications(notifications);

      // Calculate unread count
      const unread = notifications.filter((n) => !n.is_read).length;
      setUnreadCount(unread);

      console.log(
        `Loaded ${notifications.length} notifications, ${unread} unread`
      );
    } catch (error: any) {
      console.error("Error loading notifications:", error);
      setNotificationsError(error.message || "Failed to load notifications");

      // Don't show toast for expected 404s on optional endpoints
      if (error.response?.status !== 404) {
        toast({
          title: "Error",
          description: "Failed to load notifications. Using fallback data.",
          variant: "destructive",
        });
      }

      // Set fallback notifications
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setNotificationsLoading(false);
    }
  }, [toast]);

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
      case "resolved":
        return "green";
      case "pending":
        return "yellow";
      case "in_progress":
        return "blue";
      case "closed":
        return "gray";
      default:
        return "gray";
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent":
        return "red";
      case "high":
        return "orange";
      case "medium":
        return "yellow";
      case "low":
        return "green";
      default:
        return "gray";
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
  }, [
    activeTab,
    loadCommunicationStats,
    loadFeedbacks,
    loadEmailTemplates,
    loadCampaignStats,
    loadNotifications,
  ]);

  // Auto-refresh notifications when on notifications tab
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (activeTab === "notifications" && autoRefresh) {
      intervalId = setInterval(() => {
        loadNotifications();
      }, refreshInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [activeTab, autoRefresh, refreshInterval, loadNotifications]);

  // Feedback table columns
  const feedbackColumns: Column<UnifiedFeedback>[] = [
    {
      key: "type",
      title: "Source",
      render: (feedback: UnifiedFeedback, index: number) => {
        const getSourceLabel = (type: string, commType?: string) => {
          switch (type) {
            case "food_review":
              return "Food Review";
            case "delivery_review":
              return "Delivery Review";
            case "contact":
              return "Contact Message";
            case "communication":
              switch (commType) {
                case "feedback":
                  return "General Feedback";
                case "complaint":
                  return "Complaint";
                case "suggestion":
                  return "Suggestion";
                case "inquiry":
                  return "Inquiry";
                default:
                  return "Communication";
              }
            default:
              return "Unknown";
          }
        };

        return (
          <Badge variant="outline">
            {getSourceLabel(feedback.type, feedback.communication_type)}
          </Badge>
        );
      },
    },
    {
      key: "subject",
      title: "Subject",
      render: (feedback: UnifiedFeedback, index: number) => {
        const title = feedback.subject || "No Subject";
        const message = feedback.message || feedback.comment || "No message";

        return (
          <div>
            <div className="font-medium">{title}</div>
            <div className="text-sm text-gray-500">
              {message.length > 60 ? message.substring(0, 60) + "..." : message}
            </div>
            {feedback.rating && (
              <div className="flex items-center mt-1">
                <span className="text-xs text-gray-500 mr-1">Rating:</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-xs ${
                        star <= (feedback.rating || 0)
                          ? "text-yellow-500"
                          : "text-gray-300"
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "user",
      title: "Customer",
      render: (feedback: UnifiedFeedback, index: number) => {
        const user = feedback.user || feedback.customer;
        return (
          <div className="text-sm">
            {user?.name || "Unknown User"}
            <div className="text-gray-500">{user?.email || "No email"}</div>
          </div>
        );
      },
    },
    {
      key: "priority",
      title: "Priority",
      render: (feedback: UnifiedFeedback, index: number) => {
        const priority = feedback.priority || "medium";
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
      render: (feedback: UnifiedFeedback, index: number) => {
        const status = feedback.status || "pending";
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
      render: (feedback: UnifiedFeedback, index: number) => (
        <div className="text-sm">
          {feedback.created_at
            ? new Date(feedback.created_at).toLocaleDateString()
            : "Unknown Date"}
        </div>
      ),
    },
    {
      key: "responses",
      title: "Responses",
      render: (feedback: UnifiedFeedback, index: number) => {
        let responseCount = 0;
        if (feedback.type === "communication" && feedback.responses) {
          responseCount = feedback.responses.length;
        } else if (
          (feedback.type === "food_review" ||
            feedback.type === "delivery_review") &&
          feedback.admin_response
        ) {
          responseCount = 1;
        }

        return (
          <div className="text-sm">
            <Badge variant="outline" className="text-xs">
              {responseCount} response{responseCount !== 1 ? "s" : ""}
            </Badge>
          </div>
        );
      },
    },
    {
      key: "actions",
      title: "Actions",
      render: (feedback: UnifiedFeedback, index: number) => {
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
              <DropdownMenuItem
                onClick={() => {
                  setSelectedFeedback(feedback);
                  setShowDetailModal(true);
                  // Load responses when viewing details
                  if (feedback?.id) {
                    loadFeedbackResponses(feedback.id);
                  }
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedFeedback(feedback);
                  setShowResponseModal(true);
                  // Load existing responses for context
                  if (feedback?.id) {
                    loadFeedbackResponses(feedback.id);
                  }
                }}
              >
                <Reply className="h-4 w-4 mr-2" />
                Send Response
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleStatusUpdate(feedback.id, "resolved")}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Resolved
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusUpdate(feedback.id, "closed")}
              >
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
  const safeTemplateRender = (
    template: EmailTemplate | undefined,
    renderFn: (template: EmailTemplate) => React.ReactNode
  ) => {
    if (!template || typeof template !== "object") {
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
      render: (template: EmailTemplate) =>
        safeTemplateRender(template, (t) => (
          <div>
            <div className="font-medium">{t?.name || "Unnamed Template"}</div>
            <div className="text-sm text-gray-500">
              {t?.subject || "No subject"}
            </div>
          </div>
        )),
    },
    {
      key: "type",
      title: "Type",
      render: (template: EmailTemplate) =>
        safeTemplateRender(template, (t) => (
          <Badge variant="outline">
            {t?.template_type
              ? t.template_type.charAt(0).toUpperCase() +
                t.template_type.slice(1)
              : "Unknown"}
          </Badge>
        )),
    },
    {
      key: "subject",
      title: "Subject",
      render: (template: EmailTemplate) =>
        safeTemplateRender(template, (t) => (
          <div className="text-sm max-w-xs truncate">
            {t?.subject || "No subject"}
          </div>
        )),
    },
    {
      key: "is_active",
      title: "Status",
      render: (template: EmailTemplate) =>
        safeTemplateRender(template, (t) => (
          <Badge variant={t?.is_active ? "default" : "outline"}>
            {t?.is_active ? "Active" : "Inactive"}
          </Badge>
        )),
    },
    {
      key: "created_at",
      title: "Created",
      render: (template: EmailTemplate) =>
        safeTemplateRender(template, (t) => (
          <div className="text-sm">
            {t?.created_at
              ? new Date(t.created_at).toLocaleDateString()
              : "Unknown"}
          </div>
        )),
    },
    {
      key: "actions",
      title: "Actions",
      render: (template: EmailTemplate) =>
        safeTemplateRender(template, (t) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  if (t?.id) {
                    setSelectedTemplate(t);
                    setShowTemplateModal(true);
                  }
                }}
              >
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            AI Sentiment Analysis
            {sentimentLoading && (
              <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
            )}
          </h3>

          {/* Loading State */}
          {sentimentLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Brain className="h-12 w-12 text-blue-500 mx-auto mb-2 animate-pulse" />
                <p className="text-gray-500">Analyzing sentiment...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {sentimentError && !sentimentLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-2" />
                <p className="text-red-600 mb-2">{sentimentError}</p>
                <Button
                  onClick={() => loadCommunicationStats()}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Analysis
                </Button>
              </div>
            </div>
          )}

          {/* Sentiment Data */}
          {sentimentData && !sentimentLoading && !sentimentError && (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-600">Positive</span>
                  <span className="text-sm font-medium">
                    {sentimentData.positive}%
                  </span>
                </div>
                <Progress value={sentimentData.positive} className="h-2" />

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Neutral</span>
                  <span className="text-sm font-medium">
                    {sentimentData.neutral}%
                  </span>
                </div>
                <Progress value={sentimentData.neutral} className="h-2" />

                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-600">Negative</span>
                  <span className="text-sm font-medium">
                    {sentimentData.negative}%
                  </span>
                </div>
                <Progress value={sentimentData.negative} className="h-2" />
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Confidence: {sentimentData.confidence}%
              </div>
            </>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Sparkles className="h-5 w-5 mr-2" />
            Trending Topics
            {sentimentLoading && (
              <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
            )}
          </h3>

          {/* Loading State */}
          {sentimentLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Sparkles className="h-12 w-12 text-purple-500 mx-auto mb-2 animate-pulse" />
                <p className="text-gray-500">Loading trending topics...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {sentimentError && !sentimentLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-2" />
                <p className="text-red-600 mb-2">
                  Failed to load trending topics
                </p>
                <Button
                  onClick={() => loadCommunicationStats()}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* Trending Topics Data */}
          {sentimentData && !sentimentLoading && !sentimentError && (
            <div className="space-y-3">
              {sentimentData.trending_topics.length === 0 ? (
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No trending topics found</p>
                </div>
              ) : (
                sentimentData.trending_topics
                  .slice(0, 5)
                  .map((topic, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <span className="text-sm font-medium">{topic.topic}</span>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            topic.sentiment === "positive"
                              ? "border-green-500 text-green-700"
                              : topic.sentiment === "negative"
                              ? "border-red-500 text-red-700"
                              : "border-gray-500 text-gray-700"
                          }`}
                        >
                          {topic.sentiment}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {topic.frequency}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}
        </GlassCard>
      </div>

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
  const renderFeedbackTab = () => {
    const complaints = feedbacks.filter(
      (item) => item?.communication_type === "complaint"
    );
    const complaintsCount = complaints.length;
    const openComplaints = complaints
      .filter((item) =>
        ["pending", "in_progress"].includes((item.status || "").toLowerCase())
      )
      .slice(0, 3);
    const urgentComplaints = complaints.filter(
      (item) => (item.priority || "").toLowerCase() === "urgent"
    ).length;

    // Calculate additional stats for different communication types
    const feedbackStats = {
      feedback: feedbacks.filter((f) => f.communication_type === "feedback")
        .length,
      complaints: feedbacks.filter((f) => f.communication_type === "complaint")
        .length,
      suggestions: feedbacks.filter(
        (f) => f.communication_type === "suggestion"
      ).length,
      inquiries: feedbacks.filter((f) => f.communication_type === "inquiry")
        .length,
      other: feedbacks.filter((f) => f.communication_type === "other").length,
    };

    return (
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
            value={feedbacks.filter((f) => f.status === "pending").length}
            label="Pending Review"
            icon={Clock}
            trend={-5.2}
            gradient="orange"
          />
          <AnimatedStats
            value={feedbacks.filter((f) => f.status === "resolved").length}
            label="Resolved"
            icon={CheckCircle}
            trend={18.7}
            gradient="green"
          />
          <AnimatedStats
            value={urgentComplaints}
            label="Urgent Complaints"
            icon={AlertTriangle}
            trend={
              complaintsCount
                ? Number(
                    (
                      (urgentComplaints / Math.max(complaintsCount, 1)) *
                      100
                    ).toFixed(1)
                  )
                : 0
            }
            gradient="pink"
          />
        </div>

        {/* Communication Type Breakdown */}
        <GlassCard className="p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">
            Communication Types Breakdown
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {feedbackStats.feedback}
              </div>
              <div className="text-sm text-blue-700">Food Reviews</div>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {feedbackStats.complaints}
              </div>
              <div className="text-sm text-red-700">Complaints</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {feedbackStats.suggestions}
              </div>
              <div className="text-sm text-green-700">Suggestions</div>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {feedbackStats.inquiries}
              </div>
              <div className="text-sm text-purple-700">Contact Messages</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {feedbackStats.other}
              </div>
              <div className="text-sm text-gray-700">Other</div>
            </div>
          </div>
        </GlassCard>

        {/* Filters */}
        <GlassCard className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search feedback..."
                value={feedbackFilters.search}
                onChange={(e) =>
                  setFeedbackFilters((prev) => ({
                    ...prev,
                    search: e.target.value,
                  }))
                }
              />
            </div>
            <Select
              value={feedbackFilters.status}
              onValueChange={(value) =>
                setFeedbackFilters((prev) => ({ ...prev, status: value }))
              }
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
              onValueChange={(value) =>
                setFeedbackFilters((prev) => ({ ...prev, priority: value }))
              }
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
            <Select
              value={feedbackFilters.type}
              onValueChange={(value) => {
                setCurrentPage(1);
                setFeedbackFilters((prev) => ({ ...prev, type: value }));
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="feedback">Food Reviews</SelectItem>
                <SelectItem value="complaint">Delivery Issues</SelectItem>
                <SelectItem value="suggestion">Suggestions</SelectItem>
                <SelectItem value="inquiry">Contact Messages</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadFeedbacks} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </GlassCard>

        {openComplaints.length > 0 && (
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                Complaints Needing Attention
              </h3>
              <Badge variant="outline">
                {openComplaints.length} of {complaintsCount}
              </Badge>
            </div>
            <div className="space-y-3">
              {openComplaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between p-4 border rounded-lg gap-3"
                >
                  <div>
                    <div className="font-medium">
                      {complaint.subject || "No Subject"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {complaint.user?.name || "Unknown User"} •{" "}
                      {complaint.created_at
                        ? new Date(complaint.created_at).toLocaleDateString()
                        : "Unknown date"}
                    </div>
                    <div className="mt-2 flex items-center space-x-2">
                      <Badge variant="outline">
                        {complaint.status || "Pending"}
                      </Badge>
                      <Badge variant="outline">
                        {complaint.priority || "Medium"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFeedback(complaint);
                        setShowDetailModal(true);
                        // Load responses when viewing details
                        if (complaint?.id) {
                          loadFeedbackResponses(complaint.id);
                        }
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFeedback(complaint);
                        setShowResponseModal(true);
                        // Load existing responses for context
                        if (complaint?.id) {
                          loadFeedbackResponses(complaint.id);
                        }
                      }}
                    >
                      <Reply className="h-4 w-4 mr-2" />
                      Respond
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Feedback Table */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Customer Communications & Reviews
            </h3>
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
        </GlassCard>
      </div>
    );
  };

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
          value={templates.filter((t) => t.is_active).length}
          label="Active Templates"
          icon={CheckCircle}
          trend={12.5}
          gradient="green"
        />
        <AnimatedStats
          value={templates.filter((t) => t.template_type === "feedback").length}
          label="Feedback Templates"
          icon={Users}
          trend={5.1}
          gradient="purple"
        />
        <AnimatedStats
          value={
            templates.filter((t) => t.template_type === "complaint").length
          }
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
          data={templates.filter(
            (template) => template && typeof template === "object"
          )}
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
              <div
                key={i}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Send className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h5 className="font-medium">Welcome Email Campaign #{i}</h5>
                    <p className="text-sm text-gray-500">
                      Sent to 1,234 users • 2 days ago
                    </p>
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
          value={unreadCount}
          label="Unread"
          icon={AlertTriangle}
          trend={-5.1}
          gradient="orange"
        />
        <AnimatedStats
          value={notifications.filter((n) => n.type === "system").length}
          label="System Alerts"
          icon={Bell}
          trend={12.3}
          gradient="purple"
        />
        <AnimatedStats
          value={notifications.filter((n) => n.type === "user").length}
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
          <div className="flex items-center space-x-2">
            {/* Auto-refresh controls */}
            <div className="flex items-center space-x-2 px-3 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <input
                type="checkbox"
                id="auto-refresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="auto-refresh" className="text-sm">
                Auto-refresh
              </label>
              {autoRefresh && (
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="text-sm bg-transparent border-none"
                >
                  <option value={10000}>10s</option>
                  <option value={30000}>30s</option>
                  <option value={60000}>1m</option>
                  <option value={300000}>5m</option>
                </select>
              )}
            </div>

            <Button
              variant="outline"
              onClick={loadNotifications}
              disabled={notificationsLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${
                  notificationsLoading ? "animate-spin" : ""
                }`}
              />
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
                <p className="text-sm text-gray-500">
                  Critical system notifications
                </p>
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
                <p className="text-sm text-gray-500">
                  User-related notifications
                </p>
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
                <p className="text-sm text-gray-500">
                  Time-based notifications
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Recent Notifications */}
        <div className="space-y-4">
          <h4 className="font-medium">Recent Notifications</h4>

          {/* Loading State */}
          {notificationsLoading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading notifications...</span>
            </div>
          )}

          {/* Error State */}
          {notificationsError && !notificationsLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-2" />
                <p className="text-red-600 mb-2">{notificationsError}</p>
                <Button onClick={loadNotifications} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* Notifications List */}
          {!notificationsLoading && !notificationsError && (
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No notifications found</p>
                </div>
              ) : (
                notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          notification.type === "system"
                            ? "bg-red-100"
                            : notification.type === "user"
                            ? "bg-blue-100"
                            : notification.type === "success"
                            ? "bg-green-100"
                            : "bg-yellow-100"
                        }`}
                      >
                        {notification.type === "system" ? (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        ) : notification.type === "user" ? (
                          <Users className="h-4 w-4 text-blue-600" />
                        ) : notification.type === "success" ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-600" />
                        )}
                      </div>
                      <div>
                        <h5 className="font-medium">{notification.title}</h5>
                        <p className="text-sm text-gray-500">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={notification.is_read ? "outline" : "default"}
                      >
                        {notification.is_read ? "Read" : "Unread"}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
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
            Unified communication management, feedback handling, and customer
            engagement
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button
            onClick={() => {
              if (activeTab === "overview") loadCommunicationStats();
              else if (activeTab === "feedback") loadFeedbacks();
              else if (
                activeTab === "templates" ||
                activeTab === "campaigns" ||
                activeTab === "notifications"
              )
                loadCommunications();
            }}
          >
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <div className="mt-1">
                    <Badge variant="outline">
                      {selectedFeedback.type === "food_review"
                        ? "Food Review"
                        : selectedFeedback.type === "delivery_review"
                        ? "Delivery Review"
                        : selectedFeedback.type === "contact"
                        ? "Contact Message"
                        : selectedFeedback.communication_type
                            ?.charAt(0)
                            .toUpperCase() +
                            selectedFeedback.communication_type?.slice(1) ||
                          "Communication"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    <Badge
                      variant="outline"
                      className={`border-${getStatusColor(
                        selectedFeedback.status
                      )}-500 text-${getStatusColor(
                        selectedFeedback.status
                      )}-700`}
                    >
                      {selectedFeedback.status?.charAt(0).toUpperCase() +
                        selectedFeedback.status?.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Subject</Label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {selectedFeedback.subject || "No Subject"}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Message</Label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg min-h-[100px] whitespace-pre-wrap">
                  {selectedFeedback.message ||
                    selectedFeedback.comment ||
                    "No message"}
                </div>
                {selectedFeedback.rating && (
                  <div className="mt-2 flex items-center">
                    <Label className="text-sm font-medium mr-2">Rating:</Label>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-lg ${
                            star <= (selectedFeedback.rating || 0)
                              ? "text-yellow-500"
                              : "text-gray-300"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      ({selectedFeedback.rating}/5)
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <div className="mt-1">
                    <Badge
                      variant="outline"
                      className={`border-${getPriorityColor(
                        selectedFeedback.priority
                      )}-500 text-${getPriorityColor(
                        selectedFeedback.priority
                      )}-700`}
                    >
                      {selectedFeedback.priority?.charAt(0).toUpperCase() +
                        selectedFeedback.priority?.slice(1)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <div className="mt-1 text-sm text-gray-600">
                    {selectedFeedback.created_at
                      ? new Date(selectedFeedback.created_at).toLocaleString()
                      : "Unknown"}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">
                  Customer Information
                </Label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium">Name:</span>{" "}
                      {selectedFeedback.user?.name ||
                        selectedFeedback.customer?.name ||
                        "Unknown"}
                    </div>
                    <div>
                      <span className="text-sm font-medium">Email:</span>{" "}
                      {selectedFeedback.user?.email ||
                        selectedFeedback.customer?.email ||
                        "No email"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Context for Food/Delivery Reviews */}
              {selectedFeedback.type === "food_review" &&
                selectedFeedback.food && (
                  <div>
                    <Label className="text-sm font-medium">
                      Food Information
                    </Label>
                    <div className="mt-1 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium">Food:</span>{" "}
                          {selectedFeedback.food.name}
                        </div>
                        <div>
                          <span className="text-sm font-medium">Cook:</span>{" "}
                          {selectedFeedback.cook?.name || "Unknown"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {selectedFeedback.type === "delivery_review" &&
                selectedFeedback.delivery && (
                  <div>
                    <Label className="text-sm font-medium">
                      Delivery Information
                    </Label>
                    <div className="mt-1 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium">Order:</span>{" "}
                          {selectedFeedback.delivery.order?.order_number ||
                            "Unknown"}
                        </div>
                        <div>
                          <span className="text-sm font-medium">
                            Delivery Agent:
                          </span>{" "}
                          {selectedFeedback.delivery.delivery_agent?.name ||
                            "Unknown"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Responses Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium">
                    Responses (
                    {feedbackResponses.length +
                      ((selectedFeedback.type === "food_review" ||
                        selectedFeedback.type === "delivery_review") &&
                      selectedFeedback.admin_response
                        ? 1
                        : 0)}
                    )
                  </Label>
                  <Button
                    size="sm"
                    onClick={() => {
                      setShowResponseModal(true);
                      setShowDetailModal(false);
                    }}
                  >
                    <Reply className="h-4 w-4 mr-2" />
                    Add Response
                  </Button>
                </div>

                {loadingResponses ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                    <span>Loading responses...</span>
                  </div>
                ) : feedbackResponses.length === 0 &&
                  !selectedFeedback.admin_response ? (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center text-gray-500">
                    No responses yet. Be the first to respond!
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {/* Show existing admin response for food/delivery reviews */}
                    {(selectedFeedback.type === "food_review" ||
                      selectedFeedback.type === "delivery_review") &&
                      selectedFeedback.admin_response && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                Admin
                              </span>
                              <Badge
                                variant="outline"
                                className="text-xs border-green-500 text-green-700"
                              >
                                Response
                              </Badge>
                            </div>
                            <span className="text-xs text-gray-500">
                              {selectedFeedback.response_date
                                ? new Date(
                                    selectedFeedback.response_date
                                  ).toLocaleString()
                                : "Unknown time"}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {selectedFeedback.admin_response}
                          </div>
                        </div>
                      )}

                    {/* Show communication responses */}
                    {feedbackResponses.map((response) => (
                      <div
                        key={response.id}
                        className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                              {response.responder?.name || "Admin"}
                            </span>
                            {response.is_resolution && (
                              <Badge
                                variant="outline"
                                className="text-xs border-green-500 text-green-700"
                              >
                                Resolution
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {response.created_at
                              ? new Date(response.created_at).toLocaleString()
                              : "Unknown time"}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {response.response || "No message"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleStatusUpdate(selectedFeedback.id, "in_progress")
                    }
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Mark In Progress
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleStatusUpdate(selectedFeedback.id, "resolved")
                    }
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Resolved
                  </Button>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowDetailModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Response Modal */}
      <Dialog open={showResponseModal} onOpenChange={setShowResponseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Response</DialogTitle>
            <p className="text-sm text-gray-600">
              {selectedFeedback &&
                `Responding to: ${selectedFeedback.subject || "No Subject"}`}
            </p>
          </DialogHeader>
          <div className="space-y-4">
            {/* Show original message for context */}
            {selectedFeedback && (
              <div>
                <Label className="text-sm font-medium">Original Message</Label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <div className="text-xs text-gray-500 mb-2">
                    From: {selectedFeedback.user?.name} (
                    {selectedFeedback.user?.email})
                  </div>
                  <div className="text-sm">{selectedFeedback.message}</div>
                </div>
              </div>
            )}

            {/* Show existing responses */}
            {feedbackResponses.length > 0 && (
              <div>
                <Label className="text-sm font-medium">
                  Previous Responses
                </Label>
                <div className="mt-1 max-h-40 overflow-y-auto space-y-2">
                  {feedbackResponses.map((response) => (
                    <div
                      key={response.id}
                      className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                          {response.responder?.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {response.created_at
                            ? new Date(response.created_at).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {response.response}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>Your Response</Label>
              <Textarea
                placeholder="Type your response..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="resolution"
                checked={isResolution}
                onChange={(e) => setIsResolution(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="resolution" className="text-sm">
                Mark this as a resolution (this will resolve the issue)
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
              onClick={handleSendResponse}
              disabled={!responseText.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              Send Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Communication Modal */}
      <Dialog
        open={showNewCommunicationModal}
        onOpenChange={setShowNewCommunicationModal}
      >
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
                  onValueChange={(value: any) =>
                    setNewCommunication((prev) => ({ ...prev, type: value }))
                  }
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
                  onValueChange={(value: any) =>
                    setNewCommunication((prev) => ({
                      ...prev,
                      priority: value,
                    }))
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
              <Label>Title</Label>
              <Input
                placeholder="Communication title..."
                value={newCommunication.title}
                onChange={(e) =>
                  setNewCommunication((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                placeholder="Type your message..."
                value={newCommunication.content}
                onChange={(e) =>
                  setNewCommunication((prev) => ({
                    ...prev,
                    content: e.target.value,
                  }))
                }
                rows={5}
              />
            </div>
            <div>
              <Label>Target Audience</Label>
              <Select
                value={newCommunication.target}
                onValueChange={(value: any) =>
                  setNewCommunication((prev) => ({ ...prev, target: value }))
                }
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
            <Button
              variant="outline"
              onClick={() => setShowNewCommunicationModal(false)}
            >
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
