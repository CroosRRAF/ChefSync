/**
 * Payment Management Page
 * Admin interface for managing payments, refunds, and transaction history
 */

import React, { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  paymentService,
  type Payment,
  type Refund,
  type Transaction,
  type PaymentStats,
} from "@/services/paymentService";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  Filter,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";

/**
 * Payment Management Component
 */
const PaymentManagement: React.FC = () => {
  const { toast } = useToast();

  // State
  const [activeTab, setActiveTab] = useState("transactions");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [transactionFilters, setTransactionFilters] = useState({
    search: "",
    status: "all",
    page: 1,
    limit: 25,
  });

  const [refundFilters, setRefundFilters] = useState({
    status: "all",
    page: 1,
    limit: 25,
  });

  // Dialog states
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [refundNote, setRefundNote] = useState("");

  /**
   * Load payment statistics
   */
  const loadStats = useCallback(async () => {
    try {
      const statsData = await paymentService.getPaymentStats();
      setStats(statsData);
    } catch (error) {
      console.error("Error loading payment stats:", error);
    }
  }, []);

  /**
   * Load transaction history
   */
  const loadTransactions = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params: any = {
        page: transactionFilters.page,
        limit: transactionFilters.limit,
      };

      if (transactionFilters.status !== "all") {
        params.status = transactionFilters.status;
      }

      const { results } = await paymentService.getTransactionHistory(params);
      setTransactions(results);
    } catch (error) {
      console.error("Error loading transactions:", error);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [transactionFilters, toast]);

  /**
   * Load refunds
   */
  const loadRefunds = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params: any = {
        page: refundFilters.page,
        limit: refundFilters.limit,
      };

      if (refundFilters.status !== "all") {
        params.status = refundFilters.status;
      }

      const { results } = await paymentService.getRefunds(params);
      setRefunds(results);
    } catch (error) {
      console.error("Error loading refunds:", error);
      toast({
        title: "Error",
        description: "Failed to load refunds",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [refundFilters, toast]);

  /**
   * Handle refund action (approve/reject)
   */
  const handleRefundAction = async (action: "approve" | "reject") => {
    if (!selectedRefund) return;

    try {
      await paymentService.processRefund(selectedRefund.id, action, refundNote);

      toast({
        title: "Success",
        description: `Refund ${action}d successfully`,
      });

      setIsRefundDialogOpen(false);
      setSelectedRefund(null);
      setRefundNote("");
      loadRefunds(true);
      loadStats();
    } catch (error) {
      console.error(`Error ${action}ing refund:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} refund`,
        variant: "destructive",
      });
    }
  };

  /**
   * Refresh all data
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadStats(), loadTransactions(true), loadRefunds(true)]);
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Payment data updated successfully",
    });
  };

  /**
   * View transaction details
   */
  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsTransactionDialogOpen(true);
  };

  /**
   * View refund details
   */
  const handleViewRefund = (refund: Refund) => {
    setSelectedRefund(refund);
    setIsRefundDialogOpen(true);
  };

  /**
   * Get status badge variant
   */
  const getStatusVariant = (
    status: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
      case "completed":
      case "approved":
      case "processed":
        return "default";
      case "pending":
      case "processing":
        return "secondary";
      case "failed":
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount: string | number): string => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num);
  };

  /**
   * Format date
   */
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Load data on mount
  useEffect(() => {
    loadStats();
    loadTransactions();
    loadRefunds();
  }, [loadStats, loadTransactions, loadRefunds]);

  // Reload when filters change
  useEffect(() => {
    if (activeTab === "transactions") {
      loadTransactions();
    } else if (activeTab === "refunds") {
      loadRefunds();
    }
  }, [activeTab, transactionFilters, refundFilters, loadTransactions, loadRefunds]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Management</h1>
          <p className="text-muted-foreground">
            Manage transactions, refunds, and payment methods
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.total_revenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.total_transactions} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.success_rate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Payment success rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.total_refunds)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.pending_refunds} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.average_transaction_value)}
              </div>
              <p className="text-xs text-muted-foreground">Average order value</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="refunds">
            Refunds
            {stats && stats.pending_refunds > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.pending_refunds}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by order ID or transaction ID..."
                      value={transactionFilters.search}
                      onChange={(e) =>
                        setTransactionFilters((prev) => ({
                          ...prev,
                          search: e.target.value,
                        }))
                      }
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select
                  value={transactionFilters.status}
                  onValueChange={(value) =>
                    setTransactionFilters((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  More Filters
                </Button>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No transactions found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium">Transaction ID</th>
                        <th className="text-left p-4 font-medium">Order ID</th>
                        <th className="text-left p-4 font-medium">Amount</th>
                        <th className="text-left p-4 font-medium">Type</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-left p-4 font-medium">Date</th>
                        <th className="text-left p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b hover:bg-muted/50">
                          <td className="p-4 font-mono text-sm">
                            #{transaction.id}
                          </td>
                          <td className="p-4">#{transaction.order_id}</td>
                          <td className="p-4 font-semibold">
                            {formatCurrency(transaction.amount)}
                          </td>
                          <td className="p-4 capitalize">{transaction.type}</td>
                          <td className="p-4">
                            <Badge variant={getStatusVariant(transaction.status)}>
                              {transaction.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {formatDate(transaction.transaction_date)}
                          </td>
                          <td className="p-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewTransaction(transaction)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Refunds Tab */}
        <TabsContent value="refunds" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Select
                  value={refundFilters.status}
                  onValueChange={(value) =>
                    setRefundFilters((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="processed">Processed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Refunds Table */}
          <Card>
            <CardHeader>
              <CardTitle>Refund Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : refunds.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No refund requests found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium">Refund ID</th>
                        <th className="text-left p-4 font-medium">Payment ID</th>
                        <th className="text-left p-4 font-medium">Amount</th>
                        <th className="text-left p-4 font-medium">Reason</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-left p-4 font-medium">Date</th>
                        <th className="text-left p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {refunds.map((refund) => (
                        <tr key={refund.id} className="border-b hover:bg-muted/50">
                          <td className="p-4 font-mono text-sm">#{refund.id}</td>
                          <td className="p-4">#{refund.payment_id}</td>
                          <td className="p-4 font-semibold">
                            {formatCurrency(refund.amount)}
                          </td>
                          <td className="p-4 text-sm max-w-xs truncate">
                            {refund.reason}
                          </td>
                          <td className="p-4">
                            <Badge variant={getStatusVariant(refund.status)}>
                              {refund.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {formatDate(refund.created_at)}
                          </td>
                          <td className="p-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewRefund(refund)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transaction Details Dialog */}
      <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Detailed information about this transaction
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Transaction ID</Label>
                  <p className="font-mono">#{selectedTransaction.id}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Order ID</Label>
                  <p>#{selectedTransaction.order_id}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Amount</Label>
                  <p className="text-lg font-bold">
                    {formatCurrency(selectedTransaction.amount)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <Badge variant={getStatusVariant(selectedTransaction.status)}>
                    {selectedTransaction.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Type</Label>
                  <p className="capitalize">{selectedTransaction.type}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Date</Label>
                  <p>{formatDate(selectedTransaction.transaction_date)}</p>
                </div>
              </div>
              {selectedTransaction.description && (
                <div>
                  <Label className="text-sm text-muted-foreground">Description</Label>
                  <p>{selectedTransaction.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund Details Dialog */}
      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Refund Request</DialogTitle>
            <DialogDescription>
              Review and process this refund request
            </DialogDescription>
          </DialogHeader>
          {selectedRefund && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Refund ID</Label>
                  <p className="font-mono">#{selectedRefund.id}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Payment ID</Label>
                  <p>#{selectedRefund.payment_id}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Amount</Label>
                  <p className="text-lg font-bold">
                    {formatCurrency(selectedRefund.amount)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <Badge variant={getStatusVariant(selectedRefund.status)}>
                    {selectedRefund.status}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm text-muted-foreground">Reason</Label>
                  <p>{selectedRefund.reason}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Requested Date</Label>
                  <p>{formatDate(selectedRefund.created_at)}</p>
                </div>
                {selectedRefund.processed_at && (
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Processed Date
                    </Label>
                    <p>{formatDate(selectedRefund.processed_at)}</p>
                  </div>
                )}
              </div>

              {selectedRefund.status === "pending" && (
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <Label htmlFor="refund-note">Processing Note (Optional)</Label>
                    <Textarea
                      id="refund-note"
                      placeholder="Add a note about this refund..."
                      value={refundNote}
                      onChange={(e) => setRefundNote(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      onClick={() => handleRefundAction("approve")}
                      className="flex-1"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve Refund
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleRefundAction("reject")}
                      className="flex-1"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject Refund
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentManagement;

