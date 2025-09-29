import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Bell,
  Bot,
  Clock,
  Copy,
  Download,
  Edit,
  Eye,
  FileText,
  Mail,
  MessageSquare,
  Mic,
  MonitorSpeaker,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Target,
  Timer,
  Trash2,
  TrendingUp,
  Upload,
  Workflow,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Import services

/**
 * AI-Enhanced Reports & Automation - Phase 5.2 Implementation
 *
 * Features:
 * - Automated report generation with AI insights
 * - Natural language query interface with voice support
 * - Smart alerts and intelligent notifications
 * - Custom dashboard builder with drag-and-drop
 * - Advanced export capabilities with branded templates
 * - Scheduled reporting with automated delivery
 * - Conversational analytics with AI explanations
 * - Workflow automation for business processes
 */

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: "financial" | "operational" | "customer" | "marketing" | "custom";
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "on-demand";
  format: "pdf" | "excel" | "powerpoint" | "html" | "csv";
  sections: ReportSection[];
  aiInsights: boolean;
  automatedDelivery: boolean;
  recipients: string[];
  schedule?: {
    time: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
  };
  lastGenerated?: string;
  status: "active" | "paused" | "draft";
}

interface ReportSection {
  id: string;
  type: "chart" | "table" | "kpi" | "text" | "ai-insight";
  title: string;
  dataSource: string;
  config: any;
  aiEnhanced: boolean;
}

interface SmartAlert {
  id: string;
  name: string;
  description: string;
  type: "threshold" | "anomaly" | "trend" | "pattern";
  metric: string;
  condition: {
    operator: "greater_than" | "less_than" | "equals" | "change_by";
    value: number;
    timeframe: string;
  };
  aiAnalysis: boolean;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    webhook?: string;
  };
  status: "active" | "paused";
  triggers: number;
  lastTriggered?: string;
}

interface NLQuery {
  id: string;
  query: string;
  timestamp: string;
  result: any;
  confidence: number;
  suggestedFollowUps: string[];
  aiExplanation: string;
}

interface DashboardWidget {
  id: string;
  type: "chart" | "kpi" | "table" | "text" | "alert" | "ai-insight";
  title: string;
  position: { x: number; y: number; w: number; h: number };
  config: any;
  dataSource: string;
  refreshInterval: number;
}

interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: "schedule" | "event" | "threshold" | "manual";
    config: any;
  };
  actions: WorkflowAction[];
  status: "active" | "paused" | "error";
  executions: number;
  lastRun?: string;
  nextRun?: string;
}

interface WorkflowAction {
  id: string;
  type:
    | "generate_report"
    | "send_email"
    | "update_data"
    | "call_api"
    | "ai_analysis";
  config: any;
  order: number;
}

const AIReportsAutomation: React.FC = () => {
  // Core state
  const [activeTab, setActiveTab] = useState<
    "reports" | "nlq" | "alerts" | "automation"
  >("reports");
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [smartAlerts, setSmartAlerts] = useState<SmartAlert[]>([]);
  const [nlQueries, setNlQueries] = useState<NLQuery[]>([]);
  const [automationWorkflows, setAutomationWorkflows] = useState<
    AutomationWorkflow[]
  >([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportTemplate | null>(
    null
  );
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);

  // Natural Language Query state
  const [nlQueryText, setNlQueryText] = useState("");
  const [isProcessingQuery, setIsProcessingQuery] = useState(false);
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [aiExplanation, setAiExplanation] = useState("");

  // Report generation state
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportProgress, setReportProgress] = useState(0);

  // Load data on component mount
  useEffect(() => {
    loadReportTemplates();
    loadSmartAlerts();
    loadNLQueries();
    loadAutomationWorkflows();
  }, []);

  const loadReportTemplates = useCallback(async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      setReportTemplates([
        {
          id: "1",
          name: "Daily Operations Report",
          description:
            "Comprehensive daily performance overview with AI insights",
          type: "operational",
          frequency: "daily",
          format: "pdf",
          sections: [
            {
              id: "1",
              type: "kpi",
              title: "Key Metrics",
              dataSource: "dashboard",
              config: {},
              aiEnhanced: true,
            },
            {
              id: "2",
              type: "chart",
              title: "Order Trends",
              dataSource: "orders",
              config: {},
              aiEnhanced: true,
            },
            {
              id: "3",
              type: "ai-insight",
              title: "AI Recommendations",
              dataSource: "ai",
              config: {},
              aiEnhanced: true,
            },
          ],
          aiInsights: true,
          automatedDelivery: true,
          recipients: ["admin@fooddelivery.com", "manager@fooddelivery.com"],
          schedule: {
            time: "09:00",
            dayOfWeek: undefined,
            dayOfMonth: undefined,
          },
          lastGenerated: new Date().toISOString(),
          status: "active",
        },
        {
          id: "2",
          name: "Weekly Financial Summary",
          description:
            "Financial performance analysis with predictive insights",
          type: "financial",
          frequency: "weekly",
          format: "excel",
          sections: [
            {
              id: "1",
              type: "chart",
              title: "Revenue Analysis",
              dataSource: "revenue",
              config: {},
              aiEnhanced: true,
            },
            {
              id: "2",
              type: "table",
              title: "Cost Breakdown",
              dataSource: "costs",
              config: {},
              aiEnhanced: false,
            },
            {
              id: "3",
              type: "ai-insight",
              title: "Financial Recommendations",
              dataSource: "ai",
              config: {},
              aiEnhanced: true,
            },
          ],
          aiInsights: true,
          automatedDelivery: true,
          recipients: ["finance@fooddelivery.com"],
          schedule: { time: "10:00", dayOfWeek: 1, dayOfMonth: undefined },
          lastGenerated: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          status: "active",
        },
        {
          id: "3",
          name: "Customer Behavior Analysis",
          description: "Deep dive into customer patterns and segmentation",
          type: "customer",
          frequency: "monthly",
          format: "powerpoint",
          sections: [
            {
              id: "1",
              type: "chart",
              title: "Customer Segmentation",
              dataSource: "customers",
              config: {},
              aiEnhanced: true,
            },
            {
              id: "2",
              type: "chart",
              title: "Behavior Patterns",
              dataSource: "behavior",
              config: {},
              aiEnhanced: true,
            },
            {
              id: "3",
              type: "ai-insight",
              title: "Retention Strategies",
              dataSource: "ai",
              config: {},
              aiEnhanced: true,
            },
          ],
          aiInsights: true,
          automatedDelivery: false,
          recipients: [
            "marketing@fooddelivery.com",
            "analytics@fooddelivery.com",
          ],
          schedule: { time: "14:00", dayOfWeek: undefined, dayOfMonth: 1 },
          status: "draft",
        },
      ]);
    } catch (error) {
      setError("Failed to load report templates");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSmartAlerts = useCallback(async () => {
    try {
      // Mock data - replace with actual API call
      setSmartAlerts([
        {
          id: "1",
          name: "Revenue Drop Alert",
          description:
            "Alert when daily revenue drops below expected threshold",
          type: "threshold",
          metric: "daily_revenue",
          condition: { operator: "less_than", value: 5000, timeframe: "1d" },
          aiAnalysis: true,
          notifications: { email: true, sms: true, push: true },
          status: "active",
          triggers: 3,
          lastTriggered: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        {
          id: "2",
          name: "Order Spike Detection",
          description: "Detect unusual order volume increases",
          type: "anomaly",
          metric: "order_volume",
          condition: { operator: "change_by", value: 50, timeframe: "1h" },
          aiAnalysis: true,
          notifications: { email: true, sms: false, push: true },
          status: "active",
          triggers: 12,
          lastTriggered: new Date(
            Date.now() - 3 * 60 * 60 * 1000
          ).toISOString(),
        },
        {
          id: "3",
          name: "Customer Satisfaction Trend",
          description: "Monitor declining customer satisfaction scores",
          type: "trend",
          metric: "satisfaction_score",
          condition: { operator: "less_than", value: 4.5, timeframe: "7d" },
          aiAnalysis: true,
          notifications: {
            email: true,
            sms: false,
            push: false,
            webhook: "https://api.example.com/webhook",
          },
          status: "paused",
          triggers: 1,
          lastTriggered: new Date(
            Date.now() - 5 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Failed to load smart alerts:", error);
    }
  }, []);

  const loadNLQueries = useCallback(async () => {
    try {
      // Mock data - replace with actual API call
      setNlQueries([
        {
          id: "1",
          query: "What was our best performing day last week?",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          result: { day: "Friday", revenue: 8750, orders: 142 },
          confidence: 0.95,
          suggestedFollowUps: [
            "Why did Friday perform so well?",
            "How can we replicate Friday's success?",
            "What were the top items on Friday?",
          ],
          aiExplanation:
            "Friday generated the highest revenue ($8,750) with 142 orders. This was likely due to the weekend dinner rush and a promotional campaign that launched that day.",
        },
        {
          id: "2",
          query: "Show me customer segments with highest growth potential",
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          result: {
            segments: [
              { name: "Young Professionals", growth: 34, value: 245 },
              { name: "Family Diners", growth: 28, value: 389 },
            ],
          },
          confidence: 0.87,
          suggestedFollowUps: [
            "What attracts young professionals to our service?",
            "How can we increase family diner engagement?",
            "What are the common characteristics of high-growth segments?",
          ],
          aiExplanation:
            "Young Professionals show 34% growth potential with an average order value of $245, while Family Diners have 28% growth potential with higher individual transaction values.",
        },
      ]);
    } catch (error) {
      console.error("Failed to load NL queries:", error);
    }
  }, []);

  const loadAutomationWorkflows = useCallback(async () => {
    try {
      // Mock data - replace with actual API call
      setAutomationWorkflows([
        {
          id: "1",
          name: "Daily Performance Workflow",
          description: "Generate and distribute daily performance reports",
          trigger: { type: "schedule", config: { time: "09:00", daily: true } },
          actions: [
            {
              id: "1",
              type: "generate_report",
              config: { templateId: "1" },
              order: 1,
            },
            {
              id: "2",
              type: "ai_analysis",
              config: { analysisType: "performance" },
              order: 2,
            },
            {
              id: "3",
              type: "send_email",
              config: { recipients: ["team@company.com"] },
              order: 3,
            },
          ],
          status: "active",
          executions: 45,
          lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          nextRun: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        },
        {
          id: "2",
          name: "Alert Response Automation",
          description: "Automatically respond to critical business alerts",
          trigger: { type: "event", config: { eventType: "critical_alert" } },
          actions: [
            {
              id: "1",
              type: "ai_analysis",
              config: { analysisType: "root_cause" },
              order: 1,
            },
            {
              id: "2",
              type: "generate_report",
              config: { templateId: "incident" },
              order: 2,
            },
            {
              id: "3",
              type: "call_api",
              config: { endpoint: "/notify-managers" },
              order: 3,
            },
          ],
          status: "active",
          executions: 8,
          lastRun: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Failed to load automation workflows:", error);
    }
  }, []);

  // Natural Language Query Processing
  const processNLQuery = useCallback(async (query: string) => {
    setIsProcessingQuery(true);
    setQueryResult(null);
    setAiExplanation("");

    try {
      // Simulate AI processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock AI response - replace with actual AI service call
      const mockResponse = {
        result: {
          type: "chart_data",
          data: [
            { name: "Mon", value: 4200 },
            { name: "Tue", value: 3800 },
            { name: "Wed", value: 4600 },
            { name: "Thu", value: 4100 },
            { name: "Fri", value: 5200 },
            { name: "Sat", value: 6100 },
            { name: "Sun", value: 5800 },
          ],
          chartType: "bar",
        },
        confidence: 0.92,
        explanation: `Based on your query "${query}", I found that revenue patterns show strong weekend performance with Friday-Sunday generating 65% higher revenue than weekdays. This suggests opportunity for weekday promotions.`,
        suggestedFollowUps: [
          "What caused the Friday spike?",
          "How can we improve weekday performance?",
          "Show me hourly patterns for weekends",
        ],
      };

      setQueryResult(mockResponse.result);
      setAiExplanation(mockResponse.explanation);

      // Add to query history
      const newQuery: NLQuery = {
        id: Date.now().toString(),
        query,
        timestamp: new Date().toISOString(),
        result: mockResponse.result,
        confidence: mockResponse.confidence,
        suggestedFollowUps: mockResponse.suggestedFollowUps,
        aiExplanation: mockResponse.explanation,
      };

      setNlQueries((prev) => [newQuery, ...prev]);
    } catch (error) {
      setError("Failed to process natural language query");
    } finally {
      setIsProcessingQuery(false);
    }
  }, []);

  // Voice Recording
  const toggleVoiceRecording = useCallback(() => {
    if (voiceRecording) {
      setVoiceRecording(false);
      // Mock voice to text conversion
      setNlQueryText("What was our revenue trend last month?");
    } else {
      setVoiceRecording(true);
      // Start voice recording
    }
  }, [voiceRecording]);

  // Report Generation
  const generateReport = useCallback(async (template: ReportTemplate) => {
    setGeneratingReport(true);
    setReportProgress(0);

    try {
      // Simulate report generation progress
      for (let i = 0; i <= 100; i += 10) {
        setReportProgress(i);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      // Mock successful generation
      alert(`Report "${template.name}" generated successfully!`);
    } catch (error) {
      setError("Failed to generate report");
    } finally {
      setGeneratingReport(false);
      setReportProgress(0);
    }
  }, []);

  // Report Template Modal
  const renderReportModal = () => (
    <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            {selectedReport ? "Edit Report Template" : "Create Report Template"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Report Name</Label>
              <Input placeholder="Enter report name" />
            </div>
            <div>
              <Label>Report Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea placeholder="Describe what this report includes..." />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Frequency</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="on-demand">On Demand</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Format</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="powerpoint">PowerPoint</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Report Sections</Label>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Section
              </Button>
            </div>

            <div className="space-y-2">
              {[1, 2, 3].map((section) => (
                <div
                  key={section}
                  className="flex items-center space-x-2 p-3 border rounded"
                >
                  <Select>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chart">Chart</SelectItem>
                      <SelectItem value="table">Table</SelectItem>
                      <SelectItem value="kpi">KPI</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="ai-insight">AI Insight</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Section title" className="flex-1" />
                  <Switch />
                  <Label className="text-xs">AI Enhanced</Label>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch />
              <Label>Enable AI Insights</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch />
              <Label>Automated Delivery</Label>
            </div>
          </div>

          <div>
            <Label>Recipients (comma separated emails)</Label>
            <Input placeholder="admin@company.com, manager@company.com" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowReportModal(false)}>
            Cancel
          </Button>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Save Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Main render function
  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 underline hover:no-underline"
            >
              Dismiss
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            AI-Enhanced Reports & Automation
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Intelligent reporting, natural language queries, and automated
            workflows
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import Template
          </Button>
          <Button onClick={() => setShowReportModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Report
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
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="reports">Intelligent Reports</TabsTrigger>
                <TabsTrigger value="nlq">Natural Language Queries</TabsTrigger>
                <TabsTrigger value="alerts">Smart Alerts</TabsTrigger>
                <TabsTrigger value="automation">
                  Workflow Automation
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="reports">
                <div className="space-y-6">
                  {/* Report Generation Progress */}
                  {generatingReport && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Sparkles className="h-5 w-5 mr-2 animate-pulse" />
                          Generating AI-Enhanced Report
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{reportProgress}%</span>
                          </div>
                          <Progress value={reportProgress} className="h-2" />
                          <p className="text-sm text-gray-600">
                            {reportProgress < 30
                              ? "Collecting data..."
                              : reportProgress < 60
                              ? "Analyzing patterns..."
                              : reportProgress < 90
                              ? "Generating AI insights..."
                              : "Finalizing report..."}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Report Templates Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reportTemplates.map((template) => (
                      <Card
                        key={template.id}
                        className="hover:shadow-lg transition-shadow"
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              {template.name}
                            </CardTitle>
                            <Badge
                              variant={
                                template.status === "active"
                                  ? "default"
                                  : template.status === "paused"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {template.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {template.description}
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="font-medium">Type:</span>{" "}
                              {template.type}
                            </div>
                            <div>
                              <span className="font-medium">Frequency:</span>{" "}
                              {template.frequency}
                            </div>
                            <div>
                              <span className="font-medium">Format:</span>{" "}
                              {template.format.toUpperCase()}
                            </div>
                            <div>
                              <span className="font-medium">AI Insights:</span>{" "}
                              {template.aiInsights ? "Yes" : "No"}
                            </div>
                          </div>

                          {template.lastGenerated && (
                            <div className="text-xs text-gray-500">
                              Last generated:{" "}
                              {new Date(
                                template.lastGenerated
                              ).toLocaleDateString()}
                            </div>
                          )}

                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              onClick={() => generateReport(template)}
                              disabled={generatingReport}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Generate
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="nlq">
                <div className="space-y-6">
                  {/* Natural Language Query Interface */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <MessageSquare className="h-5 w-5 mr-2" />
                        Ask Questions About Your Data
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 relative">
                          <Input
                            placeholder="Ask anything about your business data..."
                            value={nlQueryText}
                            onChange={(e) => setNlQueryText(e.target.value)}
                            onKeyPress={(e) =>
                              e.key === "Enter" && processNLQuery(nlQueryText)
                            }
                            className="pr-12"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`absolute right-1 top-1 h-8 w-8 ${
                              voiceRecording ? "text-red-500" : "text-gray-400"
                            }`}
                            onClick={toggleVoiceRecording}
                          >
                            <Mic className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          onClick={() => processNLQuery(nlQueryText)}
                          disabled={isProcessingQuery || !nlQueryText.trim()}
                        >
                          {isProcessingQuery ? (
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Search className="h-4 w-4 mr-2" />
                          )}
                          {isProcessingQuery ? "Processing..." : "Ask AI"}
                        </Button>
                      </div>

                      {/* Query Result */}
                      {queryResult && (
                        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center">
                            <Bot className="h-5 w-5 text-blue-500 mr-2" />
                            <span className="font-medium">
                              AI Analysis Result
                            </span>
                          </div>

                          {queryResult.type === "chart_data" && (
                            <ResponsiveContainer width="100%" height={200}>
                              <BarChart data={queryResult.data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#3b82f6" />
                              </BarChart>
                            </ResponsiveContainer>
                          )}

                          {aiExplanation && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                              <p className="text-sm">{aiExplanation}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Quick Query Suggestions */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Quick Questions:
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            "What was our revenue last month?",
                            "Show me top performing menu items",
                            "Which customer segment is growing fastest?",
                            "What are our peak order hours?",
                            "How is customer satisfaction trending?",
                          ].map((suggestion) => (
                            <Button
                              key={suggestion}
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setNlQueryText(suggestion);
                                processNLQuery(suggestion);
                              }}
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Query History */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Clock className="h-5 w-5 mr-2" />
                        Recent Queries
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {nlQueries.map((query) => (
                          <div key={query.id} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium">{query.query}</p>
                              <Badge variant="outline">
                                {(query.confidence * 100).toFixed(0)}%
                                confidence
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">
                              {query.aiExplanation}
                            </p>
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                              <Button variant="outline" size="sm">
                                <Copy className="h-4 w-4 mr-1" />
                                Rerun Query
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="alerts">
                <div className="space-y-6">
                  {/* Smart Alerts Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {smartAlerts.map((alert) => (
                      <Card key={alert.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center">
                              {alert.type === "threshold" && (
                                <Target className="h-5 w-5 mr-2 text-orange-500" />
                              )}
                              {alert.type === "anomaly" && (
                                <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                              )}
                              {alert.type === "trend" && (
                                <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                              )}
                              {alert.name}
                            </CardTitle>
                            <Badge
                              variant={
                                alert.status === "active"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {alert.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {alert.description}
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Metric:</span>{" "}
                              {alert.metric}
                            </div>
                            <div>
                              <span className="font-medium">Triggers:</span>{" "}
                              {alert.triggers}
                            </div>
                            <div>
                              <span className="font-medium">AI Analysis:</span>{" "}
                              {alert.aiAnalysis ? "Enabled" : "Disabled"}
                            </div>
                            <div>
                              <span className="font-medium">
                                Last Triggered:
                              </span>{" "}
                              {alert.lastTriggered
                                ? new Date(
                                    alert.lastTriggered
                                  ).toLocaleDateString()
                                : "Never"}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm">
                              Notification Channels:
                            </Label>
                            <div className="flex space-x-4">
                              <div className="flex items-center space-x-1">
                                <Mail className="h-4 w-4" />
                                <span className="text-sm">
                                  {alert.notifications.email
                                    ? "Email"
                                    : "No Email"}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MonitorSpeaker className="h-4 w-4" />
                                <span className="text-sm">
                                  {alert.notifications.sms ? "SMS" : "No SMS"}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Bell className="h-4 w-4" />
                                <span className="text-sm">
                                  {alert.notifications.push
                                    ? "Push"
                                    : "No Push"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button size="sm">
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Toggle alert status
                                setSmartAlerts((prev) =>
                                  prev.map((a) =>
                                    a.id === alert.id
                                      ? {
                                          ...a,
                                          status:
                                            a.status === "active"
                                              ? "paused"
                                              : "active",
                                        }
                                      : a
                                  )
                                );
                              }}
                            >
                              {alert.status === "active" ? (
                                <Pause className="h-4 w-4 mr-1" />
                              ) : (
                                <Play className="h-4 w-4 mr-1" />
                              )}
                              {alert.status === "active" ? "Pause" : "Activate"}
                            </Button>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Test
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Create New Alert Button */}
                  <Card>
                    <CardContent className="flex items-center justify-center py-8">
                      <Button onClick={() => setShowAlertModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Smart Alert
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="automation">
                <div className="space-y-6">
                  {/* Automation Workflows */}
                  <div className="space-y-4">
                    {automationWorkflows.map((workflow) => (
                      <Card key={workflow.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center">
                              <Workflow className="h-5 w-5 mr-2" />
                              {workflow.name}
                            </CardTitle>
                            <Badge
                              variant={
                                workflow.status === "active"
                                  ? "default"
                                  : workflow.status === "error"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {workflow.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {workflow.description}
                          </p>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Trigger:</span>{" "}
                                {workflow.trigger.type}
                              </div>
                              <div>
                                <span className="font-medium">Actions:</span>{" "}
                                {workflow.actions.length}
                              </div>
                              <div>
                                <span className="font-medium">Executions:</span>{" "}
                                {workflow.executions}
                              </div>
                              <div>
                                <span className="font-medium">Last Run:</span>{" "}
                                {workflow.lastRun
                                  ? new Date(
                                      workflow.lastRun
                                    ).toLocaleDateString()
                                  : "Never"}
                              </div>
                            </div>

                            {workflow.nextRun && (
                              <div className="flex items-center text-sm text-blue-600">
                                <Timer className="h-4 w-4 mr-1" />
                                Next run:{" "}
                                {new Date(workflow.nextRun).toLocaleString()}
                              </div>
                            )}

                            <div className="flex items-center space-x-2">
                              <Button size="sm">
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button variant="outline" size="sm">
                                <Play className="h-4 w-4 mr-1" />
                                Run Now
                              </Button>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View Logs
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Create New Workflow */}
                  <Card>
                    <CardContent className="flex items-center justify-center py-8">
                      <Button onClick={() => setShowWorkflowModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Automation Workflow
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modals */}
      {renderReportModal()}
    </div>
  );
};

export default AIReportsAutomation;
