import React, { useCallback, useEffect, useState } from "react";

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
  const [transactionFilters, setTransactionFilters] = useState({
    status: "all",
    dateRange: "30d",
    search: "",
  });

  // Refunds
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [refundsLoading, setRefundsLoading] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);

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
        limit: 50,
      });
      setTransactions(response.results);
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
  }, [transactionFilters.status, toast]);

  // Load refunds
  const loadRefunds = useCallback(async () => {
    try {
      setRefundsLoading(true);
      const response = await paymentService.getRefunds({
        limit: 50,
      });
      setRefunds(response.results);
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
  }, [toast]);

  // Process refund
  const handleProcessRefund = async (refundId: number, action: "approve" | "reject", note?: string) => {
    try {
      await paymentService.processRefund(refundId, action, note);
      toast({
        title: "Success",
        description: `Refund ${action}d successfully`,
      });
      loadRefunds();
      setShowRefundDialog(false);
      setSelectedRefund(null);
    } catch (error) {
      console.error(`Error ${action}ing refund:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} refund`,
        variant: "destructive",
      });
    }
  };

  // Load data on mount and tab changes
  useEffect(() => {
    loadPaymentStats();
    if (activeTab === "transactions") {
      loadTransactions();
    } else if (activeTab === "refunds") {
      loadRefunds();
    }
  }, [activeTab, loadPaymentStats, loadTransactions, loadRefunds]);

  // Transaction table columns
  const transactionColumns: Column<Transaction>[] = [
    {
      key: "id",
      title: "Transaction ID",
      render: (value: any, transaction: Transaction) => (
        <div className="font-mono text-sm">#{transaction.id}</div>
      ),
    },
    {
      key: "amount",
      title: "Amount",
      render: (value: any, transaction: Transaction) => (
        <div className="font-medium">LKR {parseFloat(transaction.amount).toLocaleString()}</div>
      ),
    },
    {
      key: "type",
      title: "Type",
      render: (value: any, transaction: Transaction) => (
        <Badge variant={transaction.type === "payment" ? "default" : "secondary"}>
          {transaction.type}
        </Badge>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (value: any, transaction: Transaction) => {
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
      render: (value: any, transaction: Transaction) => (
        <div className="text-sm">
          {new Date(transaction.transaction_date).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (value: any, transaction: Transaction) => (
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
      render: (value: any, refund: Refund) => (
        <div className="font-mono text-sm">#{refund.id}</div>
      ),
    },
    {
      key: "amount",
      title: "Amount",
      render: (value: any, refund: Refund) => (
        <div className="font-medium">LKR {parseFloat(refund.amount).toLocaleString()}</div>
      ),
    },
    {
      key: "reason",
      title: "Reason",
      render: (value: any, refund: Refund) => (
        <div className="text-sm max-w-xs truncate">{refund.reason}</div>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (value: any, refund: Refund) => {
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
      render: (value: any, refund: Refund) => (
        <div className="text-sm">
          {new Date(refund.created_at).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (value: any, refund: Refund) => (
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
                <DropdownMenuItem onClick={() => handleProcessRefund(refund.id, "approve")}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleProcessRefund(refund.id, "reject")}>
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
      {paymentStats && (
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
            trend={8.2}
            gradient="blue"
          />
          <AnimatedStats
            value={analytics?.successRate || 0}
            label="Success Rate"
            icon={CheckCircle}
            trend={2.1}
            gradient="purple"
            suffix="%"
            decimals={1}
          />
          <AnimatedStats
            value={analytics?.refundRate || 0}
            label="Refund Rate"
            icon={TrendingDown}
            trend={-1.5}
            gradient="orange"
            suffix="%"
            decimals={1}
          />
        </div>
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
          data={transactions.slice(0, 10)}
          columns={transactionColumns}
          loading={transactionsLoading}
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
          data={refunds.filter(r => r.status === "pending").slice(0, 10)}
          columns={refundColumns}
          loading={refundsLoading}
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
                onChange={(e) => setTransactionFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={transactionFilters.status} onValueChange={(value) => setTransactionFilters(prev => ({ ...prev, status: value }))}>
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
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
        <DataTable
          data={transactions}
          columns={transactionColumns}
          loading={transactionsLoading}
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
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
        <DataTable
          data={refunds}
          columns={refundColumns}
          loading={refundsLoading}
        />
      </GlassCard>
    </div>
  );

  // Render Analytics Tab
  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">Payment Analytics</h3>
        <div className="text-center py-8">
          <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Analytics Coming Soon
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Advanced payment analytics and reporting features will be available soon.
          </p>
        </div>
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
          <Button variant="outline">
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
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedRefund && handleProcessRefund(selectedRefund.id, "reject")}
            >
              Reject
            </Button>
            <Button
              onClick={() => selectedRefund && handleProcessRefund(selectedRefund.id, "approve")}
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentManagementHub;
