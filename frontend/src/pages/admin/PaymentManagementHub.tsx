import React, { useCallback, useEffect, useMemo, useState } from "react";

// Import shared components
import { AnimatedStats, DataTable, GlassCard } from "@/components/admin/shared";
import type { Column } from "@/components/admin/shared/tables/DataTable";

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
import { Progress } from "@/components/ui/progress";
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
import { useToast } from "@/hooks/use-toast";

// Import icons
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  Eye,
  Filter,
  MoreHorizontal,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";

// Import services
import {
  paymentService,
  type Payment,
  type PaymentStats,
  type Refund,
  type Transaction,
} from "@/services/paymentService";

/**
 * Payment Management Hub
 * 
 * Features:
 * - Payment statistics and analytics
 * - Transaction history and management
 * - Refund processing and management
 * - Payment method administration
 * - Revenue tracking and reporting
 */

// Interfaces
interface PaymentAnalytics {
  totalRevenue: number;
  totalTransactions: number;
  successRate: number;
  averageTransactionValue: number;
  refundRate: number;
  monthlyGrowth: number;
}

type AnalyticsCard = {
  title: string;
  value: string;
  sublabel: string;
  trend: number;
  trendLabel: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  positive: boolean;
};

const PaymentManagementHub: React.FC = () => {
  const { toast } = useToast();

  // Active tab state
  const [activeTab, setActiveTab] = useState<
    "overview" | "transactions" | "refunds" | "analytics"
  >("overview");

  // Payment Statistics
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsTotal, setTransactionsTotal] = useState(0);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsPageSize, setTransactionsPageSize] = useState(10);
  const [transactionFilters, setTransactionFilters] = useState({
    status: "all",
    dateRange: "30d",
    search: "",
  });

  // Refunds
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [refundsLoading, setRefundsLoading] = useState(false);
  const [refundsTotal, setRefundsTotal] = useState(0);
  const [refundsPage, setRefundsPage] = useState(1);
  const [refundsPageSize, setRefundsPageSize] = useState(10);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [refundActionLoading, setRefundActionLoading] = useState(false);
  const [refundActionNote, setRefundActionNote] = useState("");

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 2,
    }).format(value || 0);
  }, []);

  const totalRefundAmount = useMemo(
    () => parseFloat(paymentStats?.total_refunds ?? "0"),
    [paymentStats]
  );

  const analyticsSummary = useMemo<AnalyticsCard[]>(() => {
    if (!analytics) return [];

    return [
      {
        title: "Total Revenue",
        value: formatCurrency(analytics.totalRevenue),
        sublabel: "Cumulative revenue processed",
        trend: analytics.monthlyGrowth,
        trendLabel: `${analytics.monthlyGrowth >= 0 ? "+" : ""}${analytics.monthlyGrowth.toFixed(1)}% vs previous month`,
        icon: TrendingUp,
        positive: analytics.monthlyGrowth >= 0,
      },
      {
        title: "Total Transactions",
        value: analytics.totalTransactions.toLocaleString(),
        sublabel: "Completed payment attempts",
        trend: analytics.monthlyGrowth,
        trendLabel: `${analytics.monthlyGrowth >= 0 ? "+" : ""}${analytics.monthlyGrowth.toFixed(1)}% change`,
        icon: CreditCard,
        positive: analytics.monthlyGrowth >= 0,
      },
      {
        title: "Refund Volume",
        value: formatCurrency(totalRefundAmount),
        sublabel: "Processed refunds to date",
        trend: -(analytics.refundRate || 0),
        trendLabel: `${(analytics.refundRate || 0).toFixed(1)}% refund rate`,
        icon: TrendingDown,
        positive: (analytics.refundRate || 0) < 5,
      },
    ];
  }, [analytics, formatCurrency, totalRefundAmount]);

  const performanceMetrics = useMemo(
    () => ({
      successRate: analytics?.successRate ?? 0,
      refundRate: analytics?.refundRate ?? 0,
      averageTransactionValue: analytics?.averageTransactionValue ?? 0,
      totalTransactions: analytics?.totalTransactions ?? 0,
      pendingRefunds: paymentStats?.pending_refunds ?? 0,
      totalRefundAmount,
    }),
    [analytics, paymentStats, totalRefundAmount]
  );

  // Load payment statistics
  const loadPaymentStats = useCallback(async () => {
    try {
      setLoading(true);
      const stats = await paymentService.getPaymentStats();
      setPaymentStats(stats);

      // Calculate analytics from stats
      const analyticsData: PaymentAnalytics = {
        totalRevenue: parseFloat(stats.total_revenue) || 0,
        totalTransactions: stats.total_transactions || 0,
        successRate: stats.success_rate || 0,
        averageTransactionValue: parseFloat(stats.average_transaction_value) || 0,
        refundRate: (stats.pending_refunds / Math.max(stats.total_transactions, 1)) * 100,
        monthlyGrowth: 12.5, // This would come from backend in real implementation
      };
      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Error loading payment stats:", error);
      toast({
        title: "Error",
        description: "Failed to load payment statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load transactions
  const loadTransactions = useCallback(async () => {
    try {
      setTransactionsLoading(true);
      const response = await paymentService.getTransactionHistory({
        status: transactionFilters.status === "all" ? undefined : transactionFilters.status,
        page: transactionsPage,
        limit: transactionsPageSize,
        search: transactionFilters.search ? transactionFilters.search.trim() : undefined,
      });
      setTransactions(Array.isArray(response.results) ? response.results : []);
      setTransactionsTotal(response.count || 0);
    } catch (error) {
      console.error("Error loading transactions:", error);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      });
    } finally {
      setTransactionsLoading(false);
    }
  }, [transactionFilters.status, transactionFilters.search, transactionsPage, transactionsPageSize, toast]);

  // Load refunds
  const loadRefunds = useCallback(async () => {
    try {
      setRefundsLoading(true);
      const response = await paymentService.getRefunds({
        page: refundsPage,
        limit: refundsPageSize,
      });
      setRefunds(Array.isArray(response.results) ? response.results : []);
      setRefundsTotal(response.count || 0);
    } catch (error) {
      console.error("Error loading refunds:", error);
      toast({
        title: "Error",
        description: "Failed to load refunds",
        variant: "destructive",
      });
    } finally {
      setRefundsLoading(false);
    }
  }, [refundsPage, refundsPageSize, toast]);

  // Process refund
  const handleProcessRefund = async (refundId: number, action: "approve" | "reject", note?: string) => {
    try {
      setRefundActionLoading(true);
      await paymentService.processRefund(refundId, action, note);
      toast({
        title: "Success",
        description: `Refund ${action}d successfully`,
      });
      loadRefunds();
      setShowRefundDialog(false);
      setSelectedRefund(null);
      setRefundActionNote("");
    } catch (error) {
      console.error(`Error ${action}ing refund:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} refund`,
        variant: "destructive",
      });
    } finally {
      setRefundActionLoading(false);
    }
  };

  // Export functionality
  const handleExportData = useCallback(() => {
    try {
      let csvContent = "";
      let filename = "";
      const timestamp = new Date().toISOString().split("T")[0];

      if (activeTab === "transactions") {
        // Export transactions
        filename = `transactions-${timestamp}.csv`;
        csvContent = "ID,Amount,Type,Status,Date\n";
        transactions.forEach((transaction: any) => {
          const row = [
            transaction.id || "",
            transaction.amount || "",
            transaction.type || "",
            transaction.status || "",
            transaction.transaction_date || "",
          ];
          csvContent += row.join(",") + "\n";
        });
      } else if (activeTab === "refunds") {
        // Export refunds
        filename = `refunds-${timestamp}.csv`;
        csvContent = "ID,Amount,Reason,Status,Created At\n";
        refunds.forEach((refund: any) => {
          const row = [
            refund.id || "",
            refund.amount || "",
            `"${(refund.reason || "").replace(/"/g, '""')}"`,
            refund.status || "",
            refund.created_at || "",
          ];
          csvContent += row.join(",") + "\n";
        });
      } else if (activeTab === "overview" || activeTab === "analytics") {
        // Export payment stats
        filename = `payment-stats-${timestamp}.csv`;
        csvContent = "Metric,Value\n";
        if (paymentStats) {
          csvContent += `Total Revenue,${paymentStats.total_revenue}\n`;
          csvContent += `Total Transactions,${paymentStats.total_transactions}\n`;
          csvContent += `Total Refunds,${paymentStats.total_refunds}\n`;
          csvContent += `Pending Refunds,${paymentStats.pending_refunds}\n`;
          csvContent += `Success Rate,${paymentStats.success_rate}%\n`;
          csvContent += `Average Transaction Value,${paymentStats.average_transaction_value}\n`;
        }
      }

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: "Data exported successfully",
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  }, [activeTab, transactions, refunds, paymentStats]);

  // Load data on mount and tab changes
  useEffect(() => {
    loadPaymentStats();
  }, [loadPaymentStats]);

  useEffect(() => {
    if (activeTab === "transactions") {
      const handler = setTimeout(() => {
        loadTransactions();
      }, 300);
      return () => clearTimeout(handler);
    }
  }, [activeTab, loadTransactions]);

  useEffect(() => {
    if (activeTab === "refunds") {
      loadRefunds();
    }
  }, [activeTab, loadRefunds]);

  useEffect(() => {
    if (!showRefundDialog) {
      setRefundActionNote("");
      setRefundActionLoading(false);
    }
  }, [showRefundDialog]);

  // Transaction table columns
  const transactionColumns: Column<Transaction>[] = [
    {
      key: "id",
      title: "Transaction ID",
      render: (transaction: Transaction) => (
        <div className="font-mono text-sm">#{transaction.id}</div>
      ),
    },
    {
      key: "amount",
      title: "Amount",
      render: (transaction: Transaction) => (
        <div className="font-medium">LKR {parseFloat(transaction.amount).toLocaleString()}</div>
      ),
    },
    {
      key: "type",
      title: "Type",
      render: (transaction: Transaction) => (
        <Badge variant={transaction.type === "payment" ? "default" : "secondary"}>
          {transaction.type}
        </Badge>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (transaction: Transaction) => {
        const statusColors = {
          completed: "bg-green-100 text-green-800",
          pending: "bg-yellow-100 text-yellow-800",
          failed: "bg-red-100 text-red-800",
          processing: "bg-blue-100 text-blue-800",
        };
        return (
          <Badge className={statusColors[transaction.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
            {transaction.status}
          </Badge>
        );
      },
    },
    {
      key: "transaction_date",
      title: "Date",
      render: (transaction: Transaction) => (
        <div className="text-sm">
          {new Date(transaction.transaction_date).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (transaction: Transaction) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="h-4 w-4 mr-2" />
              Download Receipt
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Refund table columns
  const refundColumns: Column<Refund>[] = [
    {
      key: "id",
      title: "Refund ID",
      render: (refund: Refund) => (
        <div className="font-mono text-sm">#{refund.id}</div>
      ),
    },
    {
      key: "amount",
      title: "Amount",
      render: (refund: Refund) => (
        <div className="font-medium">LKR {parseFloat(refund.amount).toLocaleString()}</div>
      ),
    },
    {
      key: "reason",
      title: "Reason",
      render: (refund: Refund) => (
        <div className="text-sm max-w-xs truncate">{refund.reason}</div>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (refund: Refund) => {
        const statusColors = {
          pending: "bg-yellow-100 text-yellow-800",
          approved: "bg-green-100 text-green-800",
          rejected: "bg-red-100 text-red-800",
          processed: "bg-blue-100 text-blue-800",
        };
        return (
          <Badge className={statusColors[refund.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
            {refund.status}
          </Badge>
        );
      },
    },
    {
      key: "created_at",
      title: "Requested",
      render: (refund: Refund) => (
        <div className="text-sm">
          {new Date(refund.created_at).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (refund: Refund) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {
              setSelectedRefund(refund);
              setShowRefundDialog(true);
            }}>
              <Eye className="h-4 w-4 mr-2" />
              Review
            </DropdownMenuItem>
            {refund.status === "pending" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={refundActionLoading}
                  onClick={() => handleProcessRefund(refund.id, "approve")}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={refundActionLoading}
                  onClick={() => handleProcessRefund(refund.id, "reject")}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Render Overview Tab
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Payment Statistics */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
            />
          ))}
        </div>
      ) : paymentStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatedStats
            value={analytics?.totalRevenue || 0}
            label="Total Revenue"
            icon={TrendingUp}
            trend={analytics?.monthlyGrowth || 0}
            gradient="green"
            prefix="LKR "
            decimals={2}
          />
          <AnimatedStats
            value={analytics?.totalTransactions || 0}
            label="Total Transactions"
            icon={CreditCard}
            trend={analytics?.monthlyGrowth || 0}
            gradient="blue"
          />
          <AnimatedStats
            value={analytics?.successRate || 0}
            label="Success Rate"
            icon={CheckCircle}
            trend={performanceMetrics.successRate - 80}
            gradient="purple"
            suffix="%"
            decimals={1}
          />
          <AnimatedStats
            value={analytics?.refundRate || 0}
            label="Refund Rate"
            icon={TrendingDown}
            trend={-performanceMetrics.refundRate}
            gradient="orange"
            suffix="%"
            decimals={1}
          />
        </div>
      ) : (
        <GlassCard className="p-6 text-center text-gray-500 dark:text-gray-400">
          Payment statistics are currently unavailable. Try refreshing to reload the latest metrics.
        </GlassCard>
      )}

      {/* Recent Transactions */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Transactions</h3>
          <Button variant="outline" size="sm" onClick={loadTransactions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <DataTable
          data={transactions}
          columns={transactionColumns}
          loading={transactionsLoading}
          pagination={{
            page: transactionsPage,
            pageSize: transactionsPageSize,
            total: transactionsTotal,
            onPageChange: setTransactionsPage,
            onPageSizeChange: (size) => {
              setTransactionsPageSize(size);
              setTransactionsPage(1);
            },
          }}
        />
      </GlassCard>

      {/* Pending Refunds */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Pending Refunds</h3>
          <Button variant="outline" size="sm" onClick={loadRefunds}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <DataTable
          data={refunds.filter(r => r.status === "pending")}
          columns={refundColumns}
          loading={refundsLoading}
          pagination={{
            page: refundsPage,
            pageSize: refundsPageSize,
            total: refundsTotal,
            onPageChange: setRefundsPage,
            onPageSizeChange: (size) => {
              setRefundsPageSize(size);
              setRefundsPage(1);
            },
          }}
        />
      </GlassCard>
    </div>
  );

  // Render Transactions Tab
  const renderTransactionsTab = () => (
    <div className="space-y-6">
      {/* Filters */}
      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search transactions..."
                value={transactionFilters.search}
                onChange={(e) => {
                  const value = e.target.value;
                  setTransactionFilters(prev => ({ ...prev, search: value }));
                  setTransactionsPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>
          <Select
            value={transactionFilters.status}
            onValueChange={(value) => {
              setTransactionFilters(prev => ({ ...prev, status: value }));
              setTransactionsPage(1);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadTransactions} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </GlassCard>

      {/* Transactions Table */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">All Transactions</h3>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
        <DataTable
          data={transactions}
          columns={transactionColumns}
          loading={transactionsLoading}
          pagination={{
            page: transactionsPage,
            pageSize: transactionsPageSize,
            total: transactionsTotal,
            onPageChange: setTransactionsPage,
            onPageSizeChange: (size) => {
              setTransactionsPageSize(size);
              setTransactionsPage(1);
            },
          }}
        />
      </GlassCard>
    </div>
  );

  // Render Refunds Tab
  const renderRefundsTab = () => (
    <div className="space-y-6">
      {/* Refunds Table */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Refund Management</h3>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
        <DataTable
          data={refunds}
          columns={refundColumns}
          loading={refundsLoading}
          pagination={{
            page: refundsPage,
            pageSize: refundsPageSize,
            total: refundsTotal,
            onPageChange: setRefundsPage,
            onPageSizeChange: (size) => {
              setRefundsPageSize(size);
              setRefundsPage(1);
            },
          }}
        />
      </GlassCard>
    </div>
  );

  // Render Analytics Tab
  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Revenue & Volume</h3>
          <Button variant="outline" size="sm" onClick={loadPaymentStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-32 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : analyticsSummary.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analyticsSummary.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">{card.title}</span>
                    <Icon className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{card.value}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{card.sublabel}</div>
                  </div>
                  <div className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: card.positive ? "rgba(34,197,94,0.12)" : "rgba(248,113,113,0.12)",
                      color: card.positive ? "#15803d" : "#b91c1c",
                    }}
                  >
                    {card.trend >= 0 ? "▲" : "▼"} {card.trendLabel}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
            Payment analytics data is not available yet. Refresh or check backend analytics endpoints.
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">Conversion & Risk Metrics</h3>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="h-32 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : analytics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-medium text-gray-600 dark:text-gray-300">
                  <span>Success Rate</span>
                  <span>{performanceMetrics.successRate.toFixed(1)}%</span>
                </div>
                <Progress value={Math.min(performanceMetrics.successRate, 100)} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-medium text-gray-600 dark:text-gray-300">
                  <span>Refund Rate</span>
                  <span>{performanceMetrics.refundRate.toFixed(1)}%</span>
                </div>
                <Progress value={Math.min(performanceMetrics.refundRate, 100)} className="h-2" />
              </div>
            </div>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center justify-between">
                <span>Average Transaction Value</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(performanceMetrics.averageTransactionValue)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Pending Refunds</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {performanceMetrics.pendingRefunds.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total Refund Volume</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(performanceMetrics.totalRefundAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total Transactions</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {performanceMetrics.totalTransactions.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
            Conversion metrics require payment statistics. Refresh to attempt loading again.
          </div>
        )}
      </GlassCard>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-green-600 dark:from-white dark:to-green-400 bg-clip-text text-transparent">
            Payment Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Manage payments, transactions, and refunds
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={loadPaymentStats}>
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderOverviewTab()}
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          {renderTransactionsTab()}
        </TabsContent>

        <TabsContent value="refunds" className="mt-6">
          {renderRefundsTab()}
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          {renderAnalyticsTab()}
        </TabsContent>
      </Tabs>

      {/* Refund Review Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Refund Request</DialogTitle>
          </DialogHeader>
          
          {selectedRefund && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Refund ID</Label>
                <p className="text-sm">#{selectedRefund.id}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Amount</Label>
                <p className="text-sm font-medium">LKR {parseFloat(selectedRefund.amount).toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Reason</Label>
                <p className="text-sm">{selectedRefund.reason}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Requested</Label>
                <p className="text-sm">{new Date(selectedRefund.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Action Note</Label>
                <Textarea
                  placeholder="Add a note for this decision (optional)"
                  value={refundActionNote}
                  onChange={(event) => setRefundActionNote(event.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">Notes help provide context for the refund decision.</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRefundDialog(false)}
              disabled={refundActionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={refundActionLoading || !selectedRefund}
              onClick={() => selectedRefund && handleProcessRefund(selectedRefund.id, "reject", refundActionNote)}
            >
              {refundActionLoading ? "Processing..." : "Reject"}
            </Button>
            <Button
              disabled={refundActionLoading || !selectedRefund}
              onClick={() => selectedRefund && handleProcessRefund(selectedRefund.id, "approve", refundActionNote)}
            >
              {refundActionLoading ? "Processing..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentManagementHub;
