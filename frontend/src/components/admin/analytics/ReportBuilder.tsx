import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, Calendar, BarChart3 } from "lucide-react";

interface ReportBuilderProps {
  onGenerateReport: (config: ReportConfig) => void;
  loading?: boolean;
}

export interface ReportConfig {
  type: "financial" | "operational" | "customer" | "marketing" | "custom";
  format: "pdf" | "excel" | "powerpoint" | "html" | "csv";
  timeRange: "7d" | "30d" | "90d";
  includeCharts: boolean;
  includeDetails: boolean;
  includeRecommendations: boolean;
  customFilters?: any;
  schedule?: {
    frequency: "daily" | "weekly" | "monthly";
    recipients?: string[];
  };
}

const ReportBuilder: React.FC<ReportBuilderProps> = ({
  onGenerateReport,
  loading = false,
}) => {
  const { toast } = useToast();

  const [config, setConfig] = useState<ReportConfig>({
    type: "financial",
    format: "pdf",
    timeRange: "30d",
    includeCharts: true,
    includeDetails: true,
    includeRecommendations: false,
  });

  const [scheduleReport, setScheduleReport] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState({
    frequency: "weekly" as "daily" | "weekly" | "monthly",
    recipients: "",
  });

  const handleGenerateReport = () => {
    const finalConfig = {
      ...config,
      ...(scheduleReport && {
        schedule: {
          frequency: scheduleConfig.frequency,
          recipients: scheduleConfig.recipients.split(',').map(email => email.trim()),
        },
      }),
    };

    onGenerateReport(finalConfig);

    toast({
      title: "Report Generation Started",
      description: `${scheduleReport ? "Scheduled" : "Generating"} ${config.type} report in ${config.format.toUpperCase()} format.`,
    });
  };

  const getReportTypeDescription = (type: string) => {
    const descriptions = {
      financial: "Revenue, expenses, profits, and financial KPIs",
      operational: "Order fulfillment, delivery times, and operational metrics",
      customer: "User behavior, retention, and customer analytics",
      marketing: "Campaign performance, conversions, and marketing ROI",
      custom: "Custom combination of metrics and timeframes",
    };
    return descriptions[type as keyof typeof descriptions] || "";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Custom Report Builder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Type Selection */}
        <div className="space-y-2">
          <Label htmlFor="report-type">Report Type</Label>
          <Select
            value={config.type}
            onValueChange={(value: ReportConfig["type"]) =>
              setConfig(prev => ({ ...prev, type: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="financial">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <div>
                    <div className="font-medium">Financial Report</div>
                    <div className="text-xs text-gray-500">
                      Revenue, expenses, and financial KPIs
                    </div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="operational">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <div>
                    <div className="font-medium">Operational Report</div>
                    <div className="text-xs text-gray-500">
                      Order fulfillment and operational metrics
                    </div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="customer">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <div>
                    <div className="font-medium">Customer Analytics</div>
                    <div className="text-xs text-gray-500">
                      User behavior and retention insights
                    </div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="marketing">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <div>
                    <div className="font-medium">Marketing Report</div>
                    <div className="text-xs text-gray-500">
                      Campaign performance and conversions
                    </div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="custom">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <div>
                    <div className="font-medium">Custom Report</div>
                    <div className="text-xs text-gray-500">
                      Custom combination of metrics
                    </div>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-600">
            {getReportTypeDescription(config.type)}
          </p>
        </div>

        {/* Time Range */}
        <div className="space-y-2">
          <Label htmlFor="time-range">Time Range</Label>
          <Select
            value={config.timeRange}
            onValueChange={(value: ReportConfig["timeRange"]) =>
              setConfig(prev => ({ ...prev, timeRange: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Format Selection */}
        <div className="space-y-2">
          <Label htmlFor="format">Export Format</Label>
          <Select
            value={config.format}
            onValueChange={(value: ReportConfig["format"]) =>
              setConfig(prev => ({ ...prev, format: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  PDF Document
                </div>
              </SelectItem>
              <SelectItem value="excel">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Excel Spreadsheet
                </div>
              </SelectItem>
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  CSV Data
                </div>
              </SelectItem>
              <SelectItem value="html">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  HTML Web Page
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content Options */}
        <div className="space-y-4">
          <Label>Content Options</Label>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="include-charts" className="text-sm font-medium">
                  Include Charts & Visualizations
                </Label>
                <p className="text-xs text-gray-500">
                  Add graphs and charts to the report
                </p>
              </div>
              <Switch
                id="include-charts"
                checked={config.includeCharts}
                onCheckedChange={(checked) =>
                  setConfig(prev => ({ ...prev, includeCharts: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="include-details" className="text-sm font-medium">
                  Include Detailed Data
                </Label>
                <p className="text-xs text-gray-500">
                  Add raw data tables and detailed metrics
                </p>
              </div>
              <Switch
                id="include-details"
                checked={config.includeDetails}
                onCheckedChange={(checked) =>
                  setConfig(prev => ({ ...prev, includeDetails: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="include-recommendations" className="text-sm font-medium">
                  Include AI Recommendations
                </Label>
                <p className="text-xs text-gray-500">
                  Add AI-powered insights and suggestions
                </p>
              </div>
              <Switch
                id="include-recommendations"
                checked={config.includeRecommendations}
                onCheckedChange={(checked) =>
                  setConfig(prev => ({ ...prev, includeRecommendations: checked }))
                }
              />
            </div>
          </div>
        </div>

        {/* Scheduling Options */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Schedule Report</Label>
              <p className="text-xs text-gray-500">
                Automatically generate and email this report
              </p>
            </div>
            <Switch
              checked={scheduleReport}
              onCheckedChange={setScheduleReport}
            />
          </div>

          {scheduleReport && (
            <div className="space-y-3 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={scheduleConfig.frequency}
                  onValueChange={(value: "daily" | "weekly" | "monthly") =>
                    setScheduleConfig(prev => ({ ...prev, frequency: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipients">Email Recipients</Label>
                <Textarea
                  id="recipients"
                  placeholder="Enter email addresses separated by commas"
                  value={scheduleConfig.recipients}
                  onChange={(e) =>
                    setScheduleConfig(prev => ({ ...prev, recipients: e.target.value }))
                  }
                />
                <p className="text-xs text-gray-500">
                  Multiple emails should be separated by commas
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Generate Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleGenerateReport}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {loading ? "Generating..." : scheduleReport ? "Schedule Report" : "Generate Report"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportBuilder;
