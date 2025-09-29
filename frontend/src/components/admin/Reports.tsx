import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { apiClient } from '@/utils/fetcher';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Package,
  ChefHat,
  Truck,
  RefreshCw,
  Filter,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
} from 'lucide-react';

interface ReportData {
  id: string;
  name: string;
  type: string;
  description: string;
  generated_at: string;
  status: 'completed' | 'processing' | 'failed';
  download_url?: string;
  parameters: {
    date_range: string;
    filters: any;
  };
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'user' | 'order' | 'revenue' | 'performance' | 'custom';
  icon: React.ReactNode;
  parameters: {
    date_range: boolean;
    custom_filters: boolean;
    export_formats: string[];
  };
}

const Reports: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('30d');

  // Report templates
  const reportTemplates: ReportTemplate[] = [
    {
      id: 'user-activity',
      name: 'User Activity Report',
      description: 'Comprehensive analysis of user registrations, activity, and engagement metrics',
      type: 'user',
      icon: <Users className="h-5 w-5" />,
      parameters: {
        date_range: true,
        custom_filters: true,
        export_formats: ['pdf', 'csv', 'xlsx']
      }
    },
    {
      id: 'order-summary',
      name: 'Order Summary Report',
      description: 'Detailed breakdown of orders, revenue, and order patterns',
      type: 'order',
      icon: <Package className="h-5 w-5" />,
      parameters: {
        date_range: true,
        custom_filters: true,
        export_formats: ['pdf', 'csv', 'xlsx']
      }
    },
    {
      id: 'revenue-analysis',
      name: 'Revenue Analysis Report',
      description: 'Financial performance analysis with revenue trends and projections',
      type: 'revenue',
      icon: <DollarSign className="h-5 w-5" />,
      parameters: {
        date_range: true,
        custom_filters: true,
        export_formats: ['pdf', 'csv', 'xlsx']
      }
    },
    {
      id: 'chef-performance',
      name: 'Chef Performance Report',
      description: 'Analysis of chef activity, ratings, and order fulfillment metrics',
      type: 'performance',
      icon: <ChefHat className="h-5 w-5" />,
      parameters: {
        date_range: true,
        custom_filters: true,
        export_formats: ['pdf', 'csv', 'xlsx']
      }
    },
    {
      id: 'delivery-metrics',
      name: 'Delivery Performance Report',
      description: 'Delivery agent performance, timing, and customer satisfaction metrics',
      type: 'performance',
      icon: <Truck className="h-5 w-5" />,
      parameters: {
        date_range: true,
        custom_filters: true,
        export_formats: ['pdf', 'csv', 'xlsx']
      }
    },
    {
      id: 'platform-overview',
      name: 'Platform Overview Report',
      description: 'Executive summary of all platform metrics and KPIs',
      type: 'custom',
      icon: <BarChart3 className="h-5 w-5" />,
      parameters: {
        date_range: true,
        custom_filters: false,
        export_formats: ['pdf', 'xlsx']
      }
    }
  ];

  // Fetch existing reports
  const fetchReports = async () => {
    try {
      setLoading(true);
      // This would be replaced with actual API call
      // const response = await apiClient.get('/reports/');
      // setReports(response);

      // Mock data for now
      setReports([
        {
          id: '1',
          name: 'Monthly User Activity Report',
          type: 'user',
          description: 'User registration and activity analysis for October 2024',
          generated_at: '2024-10-01T10:00:00Z',
          status: 'completed',
          download_url: '#',
          parameters: {
            date_range: '30d',
            filters: {}
          }
        },
        {
          id: '2',
          name: 'Revenue Analysis Q4 2024',
          type: 'revenue',
          description: 'Quarterly revenue breakdown and trends',
          generated_at: '2024-10-15T14:30:00Z',
          status: 'completed',
          download_url: '#',
          parameters: {
            date_range: '90d',
            filters: {}
          }
        }
      ]);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate new report
  const generateReport = async (templateId: string) => {
    try {
      setGeneratingReport(templateId);
      const template = reportTemplates.find(t => t.id === templateId);

      if (!template) return;

      // This would be replaced with actual API call
      // const response = await apiClient.post('/reports/generate/', {
      //   template_id: templateId,
      //   date_range: dateRange,
      //   parameters: {}
      // });

      // Mock report generation
      const newReport: ReportData = {
        id: Date.now().toString(),
        name: `${template.name} - ${new Date().toLocaleDateString()}`,
        type: template.type,
        description: template.description,
        generated_at: new Date().toISOString(),
        status: 'processing',
        parameters: {
          date_range: dateRange,
          filters: {}
        }
      };

      setReports(prev => [newReport, ...prev]);

      // Simulate processing delay
      setTimeout(() => {
        setReports(prev =>
          prev.map(r =>
            r.id === newReport.id
              ? { ...r, status: 'completed' as const, download_url: '#' }
              : r
          )
        );
        setGeneratingReport(null);
      }, 3000);

    } catch (error) {
      console.error('Error generating report:', error);
      setGeneratingReport(null);
    }
  };

  // Download report
  const downloadReport = async (report: ReportData) => {
    try {
      if (report.download_url) {
        // This would be replaced with actual download logic
        // window.open(report.download_url, '_blank');
        console.log('Downloading report:', report.name);
      }
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return theme === 'dark' ? '#22C55E' : '#16A34A';
      case 'processing':
        return theme === 'dark' ? '#F59E0B' : '#D97706';
      case 'failed':
        return theme === 'dark' ? '#EF4444' : '#DC2626';
      default:
        return theme === 'dark' ? '#6B7280' : '#9CA3AF';
    }
  };

  const getStatusBadge = (status: string) => {
    const color = getStatusColor(status);
    return (
      <Badge
        variant="secondary"
        style={{
          backgroundColor: color + '20',
          color: color,
          borderColor: color + '40'
        }}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-2xl font-bold"
            style={{
              color: theme === 'dark' ? '#F9FAFB' : '#111827'
            }}
          >
            Reports & Analytics
          </h2>
          <p
            className="mt-1"
            style={{
              color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
            }}
          >
            Generate comprehensive reports and export business insights.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-48">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchReports}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Report Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Generate New Report
          </CardTitle>
          <CardDescription>
            Select a report template and generate comprehensive business insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTemplates.map((template) => (
              <Card
                key={template.id}
                className="cursor-pointer transition-all hover:shadow-md"
                onClick={() => setSelectedTemplate(template.id)}
                style={{
                  borderColor: selectedTemplate === template.id
                    ? (theme === 'dark' ? '#3B82F6' : '#2563EB')
                    : (theme === 'dark' ? '#374151' : '#E5E7EB'),
                  backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF'
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{
                        backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
                        color: theme === 'dark' ? '#F9FAFB' : '#111827'
                      }}
                    >
                      {template.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{template.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {template.description}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {template.type}
                        </Badge>
                        <div className="flex space-x-1">
                          {template.parameters.export_formats.map((format) => (
                            <Badge key={format} variant="secondary" className="text-xs">
                              {format.toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {selectedTemplate === template.id && (
                    <div className="mt-3 pt-3 border-t">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          generateReport(template.id);
                        }}
                        disabled={generatingReport === template.id}
                        className="w-full"
                      >
                        {generatingReport === template.id ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 mr-2" />
                            Generate Report
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generated Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Generated Reports
          </CardTitle>
          <CardDescription>
            View and download previously generated reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mr-2" />
              <span>Loading reports...</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No reports generated yet</h3>
              <p className="text-muted-foreground">
                Generate your first report using the templates above.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className="p-2 rounded-lg"
                        style={{
                          backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6'
                        }}
                      >
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{report.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {report.description}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          {getStatusBadge(report.status)}
                          <Badge variant="outline" className="text-xs">
                            {report.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Generated {new Date(report.generated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {report.status === 'completed' && report.download_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadReport(report)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                      {report.status === 'processing' && (
                        <div className="flex items-center space-x-2">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">Processing...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Reports</p>
                <p className="text-2xl font-bold">{reports.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold">
                  {reports.filter(r => r.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Processing</p>
                <p className="text-2xl font-bold">
                  {reports.filter(r => r.status === 'processing').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Templates</p>
                <p className="text-2xl font-bold">{reportTemplates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
