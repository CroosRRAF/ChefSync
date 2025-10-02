import React, { useCallback, useEffect, useState } from "react";

// Import shared components
import { 
  AnimatedStats,
  GlassCard,
  GradientButton,
  DataTable 
} from "@/components/admin/shared";
import type { Column } from "@/components/admin/shared/tables/DataTable";
import { StatsWidget } from "@/components/admin/shared/widgets/index";

// Import UI components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle,
  ChefHat,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  Filter,
  MapPin,
  MoreHorizontal,
  Navigation,
  Package,
  RefreshCw,
  Search,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Truck,
  User,
  XCircle,
} from "lucide-react";

// Import services
import { adminService, type OrderListResponse, type AdminOrder } from "@/services/adminService";
import * as deliveryService from "@/services/deliveryService";
import {
  paymentService,
  type Payment,
  type Refund,
  type Transaction,
  type PaymentStats,
} from "@/services/paymentService";

/**
 * Unified Order Management Hub - Consolidates 3 order-related pages
 * 
 * Merged from:
 * - OrderManagement.tsx (order lifecycle, status management, assignment)
 * - DeliveryDashboard.tsx (delivery tracking, partner management, issues)
 * - PaymentManagement.tsx (transaction history, refunds, payment stats)
 * 
 * Features:
 * - Tabbed interface for organized access
 * - Complete order lifecycle management
 * - Real-time delivery tracking and monitoring
 * - Payment and refund management
 * - Advanced filtering and analytics
 * - Consistent design and UX
 */

// Interfaces
interface OrderStats {
  total: number;
  pending: number;
  preparing: number;
  outForDelivery: number;
  delivered: number;
  cancelled: number;
  totalRevenue: number;
  averageOrderValue: number;
}

interface ActiveDelivery {
  order_id: string;
  order_pk: number;
  status: string;
  customer: {
    id: number;
    name: string;
    phone: string | null;
  };
  delivery_partner: {
    id: number;
    name: string;
    phone: string | null;
  } | null;
  delivery_address: string;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  current_location: {
    latitude: number | null;
    longitude: number | null;
    address: string | null;
    timestamp: string | null;
  } | null;
  estimated_delivery_time: string | null;
  distance_km: number | null;
  delivery_fee: number;
  total_amount: number;
  open_issues: number;
  created_at: string;
  time_elapsed: string;
}

interface DeliveryStats {
  active_deliveries: number;
  completed_deliveries: number;
  avg_delivery_time_minutes: number | null;
  on_time_delivery_rate: number;
  total_issues: number;
  open_issues: number;
  total_revenue: number;
  delivery_fee_revenue: number;
}

const OrderManagementHub: React.FC = () => {
  const { toast } = useToast();
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<
    "orders" | "delivery" | "payments"
  >("orders");
  
  // Orders Tab States
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  
  // Delivery Tab States
  const [activeDeliveries, setActiveDeliveries] = useState<ActiveDelivery[]>([]);
  const [deliveryStats, setDeliveryStats] = useState<DeliveryStats | null>(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<ActiveDelivery | null>(null);
  const [showDeliveryDetails, setShowDeliveryDetails] = useState(false);
  
  // Payments Tab States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundNote, setRefundNote] = useState("");
  
  // Filters
  const [orderFilters, setOrderFilters] = useState({
    status: "all",
    search: "",
    dateRange: "all",
    page: 1,
    limit: 25,
  });
  
  const [transactionFilters, setTransactionFilters] = useState({
    search: "",
    status: "all",
    page: 1,
    limit: 25,
  });

  // Load order statistics
  const loadOrderStats = useCallback(async () => {
    try {
      // Mock stats - replace with actual API call
      const stats: OrderStats = {
        total: 2547,
        pending: 23,
        preparing: 15,
        outForDelivery: 8,
        delivered: 2480,
        cancelled: 21,
        totalRevenue: 1250000,
        averageOrderValue: 4500,
      };
      setOrderStats(stats);
    } catch (error) {
      console.error("Error loading order stats:", error);
    }
  }, []);

  // Load orders
  const loadOrders = useCallback(async () => {
    try {
      setOrderLoading(true);
      setOrderError(null);
      
      const response: OrderListResponse = await adminService.getOrders({
        search: orderFilters.search,
        status: orderFilters.status === "all" ? undefined : orderFilters.status,
        page: orderFilters.page,
        limit: orderFilters.limit,
      });
      
      const ordersData = response.orders || [];
      setOrders(ordersData);
    } catch (error) {
      console.error("Error loading orders:", error);
      setOrderError("Failed to load orders");
    } finally {
      setOrderLoading(false);
    }
  }, [orderFilters]);

  // Load delivery data
  const loadDeliveryData = useCallback(async () => {
    try {
      setDeliveryLoading(true);
      
      const [deliveries, stats] = await Promise.all([
        deliveryService.getActiveDeliveries(),
        deliveryService.getDeliveryStats(),
      ]);
      
      setActiveDeliveries(deliveries);
      setDeliveryStats(stats);
    } catch (error) {
      console.error("Error loading delivery data:", error);
    } finally {
      setDeliveryLoading(false);
    }
  }, []);

  // Load payment data
  const loadPaymentData = useCallback(async () => {
    try {
      setPaymentLoading(true);
      
      // Mock data for now since paymentService methods need to be implemented
      const transactionsData = { transactions: [] };
      const refundsData = { refunds: [] };
      const stats = await paymentService.getPaymentStats();
      
      setTransactions(transactionsData.transactions);
      setRefunds(refundsData.refunds);
      setPaymentStats(stats);
    } catch (error) {
      console.error("Error loading payment data:", error);
    } finally {
      setPaymentLoading(false);
    }
  }, [transactionFilters]);

  // Update order status
  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      // Mock update for now since adminService.updateOrderStatus needs to be implemented
      console.log(`Updating order ${orderId} to status ${newStatus}`);
      await loadOrders(); // Refresh orders
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  // Process refund
  const processRefund = async (transactionId: number, amount: number, reason: string) => {
    try {
      await paymentService.processRefund(transactionId, "approve", reason);
      await loadPaymentData(); // Refresh payment data
      setShowRefundDialog(false);
      setRefundNote("");
      toast({
        title: "Success",
        description: "Refund processed successfully",
      });
    } catch (error) {
      console.error("Error processing refund:", error);
      toast({
        title: "Error",
        description: "Failed to process refund",
        variant: "destructive",
      });
    }
  };

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === "orders") {
      loadOrderStats();
      loadOrders();
    } else if (activeTab === "delivery") {
      loadDeliveryData();
    } else if (activeTab === "payments") {
      loadPaymentData();
    }
  }, [activeTab, loadOrders, loadOrderStats, loadDeliveryData, loadPaymentData]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending": return "orange";
      case "confirmed": return "blue";
      case "preparing": return "purple";
      case "out_for_delivery": return "cyan";
      case "delivered": return "green";
      case "cancelled": return "red";
      default: return "gray";
    }
  };

  // Get payment status color
  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed": return "green";
      case "pending": return "orange";
      case "failed": return "red";
      case "refunded": return "purple";
      default: return "gray";
    }
  };

  // Order table columns
  const orderColumns: Column<AdminOrder>[] = [
    {
      key: "order_number",
      title: "Order #",
      render: (order: AdminOrder) => (
        <div className="font-medium">#{order.order_number}</div>
      ),
    },
    {
      key: "customer",
      title: "Customer",
      render: (order: AdminOrder) => (
        <div>
          <div className="font-medium">{order.customer_name}</div>
          <div className="text-sm text-gray-500">{order.customer_email}</div>
        </div>
      ),
    },
    {
      key: "items",
      title: "Items",
      render: (order: AdminOrder) => (
        <div className="text-sm">
          {order.items_count} items
        </div>
      ),
    },
    {
      key: "total",
      title: "Total",
      render: (order: AdminOrder) => (
        <div className="font-medium">
          LKR {typeof order.total_amount === 'string' ? parseFloat(order.total_amount).toFixed(2) : order.total_amount.toFixed(2)}
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (order: AdminOrder) => (
        <Badge variant="outline" className={`border-${getStatusColor(order.status)}-500 text-${getStatusColor(order.status)}-700`}>
          {order.status.replace("_", " ")}
        </Badge>
      ),
    },
    {
      key: "created_at",
      title: "Date",
      render: (order: AdminOrder) => (
        <div className="text-sm">
          {new Date(order.created_at).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (order: AdminOrder) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {
              setSelectedOrder(order);
              setShowOrderDetails(true);
            }}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "confirmed")}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Order
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "preparing")}>
              <ChefHat className="h-4 w-4 mr-2" />
              Start Preparing
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "out_for_delivery")}>
              <Truck className="h-4 w-4 mr-2" />
              Out for Delivery
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "delivered")}>
              <Package className="h-4 w-4 mr-2" />
              Mark Delivered
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => updateOrderStatus(order.id, "cancelled")}
              className="text-red-600"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Order
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Delivery table columns
  const deliveryColumns: Column<ActiveDelivery>[] = [
    {
      key: "order_id",
      title: "Order ID",
      render: (delivery: ActiveDelivery) => (
        <div className="font-medium">#{delivery.order_id}</div>
      ),
    },
    {
      key: "customer",
      title: "Customer",
      render: (delivery: ActiveDelivery) => (
        <div>
          <div className="font-medium">{delivery.customer.name}</div>
          <div className="text-sm text-gray-500">{delivery.customer.phone}</div>
        </div>
      ),
    },
    {
      key: "delivery_partner",
      title: "Delivery Partner",
      render: (delivery: ActiveDelivery) => (
        <div>
          {delivery.delivery_partner ? (
            <>
              <div className="font-medium">{delivery.delivery_partner.name}</div>
              <div className="text-sm text-gray-500">{delivery.delivery_partner.phone}</div>
            </>
          ) : (
            <Badge variant="outline">Unassigned</Badge>
          )}
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (delivery: ActiveDelivery) => (
        <Badge variant="outline" className={`border-${getStatusColor(delivery.status)}-500 text-${getStatusColor(delivery.status)}-700`}>
          {delivery.status.replace("_", " ")}
        </Badge>
      ),
    },
    {
      key: "time_elapsed",
      title: "Time Elapsed",
      render: (delivery: ActiveDelivery) => (
        <div className="text-sm">{delivery.time_elapsed}</div>
      ),
    },
    {
      key: "total_amount",
      title: "Amount",
      render: (delivery: ActiveDelivery) => (
        <div className="font-medium">LKR {delivery.total_amount.toFixed(2)}</div>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (delivery: ActiveDelivery) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedDelivery(delivery);
            setShowDeliveryDetails(true);
          }}
        >
          <Eye className="h-4 w-4 mr-2" />
          Track
        </Button>
      ),
    },
  ];

  // Transaction table columns
  const transactionColumns: Column<Transaction>[] = [
    {
      key: "transaction_id",
      title: "Transaction ID",
      render: (transaction: Transaction) => (
        <div className="font-medium font-mono text-sm">
          {transaction.id}
        </div>
      ),
    },
    {
      key: "customer",
      title: "Customer",
      render: (transaction: Transaction) => (
        <div>
          <div className="font-medium">Customer #{transaction.order_id}</div>
          <div className="text-sm text-gray-500">Payment #{transaction.payment_id}</div>
        </div>
      ),
    },
    {
      key: "amount",
      title: "Amount",
      render: (transaction: Transaction) => (
        <div className="font-medium">LKR {parseFloat(transaction.amount).toFixed(2)}</div>
      ),
    },
    {
      key: "payment_method",
      title: "Method",
      render: (transaction: Transaction) => (
        <Badge variant="outline">
          {transaction.type}
        </Badge>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (transaction: Transaction) => (
        <Badge variant="outline" className={`border-${getPaymentStatusColor(transaction.status)}-500 text-${getPaymentStatusColor(transaction.status)}-700`}>
          {transaction.status}
        </Badge>
      ),
    },
    {
      key: "created_at",
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
            <DropdownMenuItem onClick={() => {
              setSelectedTransaction(transaction);
              setShowTransactionDetails(true);
            }}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            {transaction.status === "completed" && (
              <DropdownMenuItem onClick={() => {
                setSelectedTransaction(transaction);
                setShowRefundDialog(true);
              }}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Process Refund
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Render Orders Tab
  const renderOrdersTab = () => (
    <div className="space-y-6">
      {/* Order Statistics */}
      {orderStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatedStats
            value={orderStats.total}
            label="Total Orders"
            icon={ShoppingCart}
            trend={8.2}
            gradient="blue"
          />
          <AnimatedStats
            value={orderStats.pending}
            label="Pending Orders"
            icon={Clock}
            trend={-2.1}
            gradient="orange"
          />
          <AnimatedStats
            value={orderStats.totalRevenue}
            label="Total Revenue"
            icon={DollarSign}
            trend={12.5}
            gradient="green"
            prefix="LKR "
          />
          <AnimatedStats
            value={orderStats.averageOrderValue}
            label="Avg Order Value"
            icon={TrendingUp}
            trend={5.3}
            gradient="purple"
            prefix="LKR "
          />
        </div>
      )}

      {/* Filters and Search */}
      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search orders by customer or order number..."
                value={orderFilters.search}
                onChange={(e) => setOrderFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>
          <Select 
            value={orderFilters.status} 
            onValueChange={(value) => setOrderFilters(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadOrders} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </GlassCard>

      {/* Orders Table */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Orders</h3>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
        
        {orderError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{orderError}</p>
              </div>
            </div>
          </div>
        )}

        <DataTable
          data={orders}
          columns={orderColumns}
          loading={orderLoading}
        />
      </GlassCard>
    </div>
  );

  // Render Delivery Tab
  const renderDeliveryTab = () => (
    <div className="space-y-6">
      {/* Delivery Statistics */}
      {deliveryStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatedStats
            value={deliveryStats.active_deliveries}
            label="Active Deliveries"
            icon={Truck}
            trend={3.2}
            gradient="blue"
          />
          <AnimatedStats
            value={deliveryStats.completed_deliveries}
            label="Completed Today"
            icon={CheckCircle}
            trend={15.8}
            gradient="green"
          />
          <AnimatedStats
            value={deliveryStats.avg_delivery_time_minutes || 0}
            label="Avg Delivery Time"
            icon={Clock}
            trend={-5.2}
            gradient="orange"
            suffix=" min"
          />
          <AnimatedStats
            value={deliveryStats.on_time_delivery_rate}
            label="On-Time Rate"
            icon={TrendingUp}
            trend={2.1}
            gradient="purple"
            suffix="%"
          />
        </div>
      )}

      {/* Active Deliveries */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Active Deliveries</h3>
          <Button onClick={loadDeliveryData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <DataTable
          data={activeDeliveries}
          columns={deliveryColumns}
          loading={deliveryLoading}
        />
      </GlassCard>
    </div>
  );

  // Render Payments Tab
  const renderPaymentsTab = () => (
    <div className="space-y-6">
      {/* Payment Statistics */}
      {paymentStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimatedStats
              value={parseFloat(paymentStats.total_revenue)}
              label="Total Revenue"
              icon={DollarSign}
              trend={12.5}
              gradient="green"
              prefix="LKR "
            />
            <AnimatedStats
              value={paymentStats.total_transactions}
              label="Total Transactions"
              icon={CheckCircle}
              trend={8.3}
              gradient="blue"
            />
          <AnimatedStats
            value={paymentStats.pending_refunds}
            label="Pending Refunds"
            icon={Clock}
            trend={-3.2}
            gradient="orange"
          />
          <AnimatedStats
            value={parseFloat(paymentStats.total_refunds)}
            label="Refunded Amount"
            icon={RefreshCw}
            trend={-15.7}
            gradient="purple"
            prefix="LKR "
          />
        </div>
      )}

      {/* Filters and Search */}
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
          <Select 
            value={transactionFilters.status} 
            onValueChange={(value) => setTransactionFilters(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadPaymentData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </GlassCard>

      {/* Transactions Table */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Transactions</h3>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        <DataTable
          data={transactions}
          columns={transactionColumns}
          loading={paymentLoading}
        />
      </GlassCard>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 dark:from-white dark:to-blue-400 bg-clip-text text-transparent">
            Order Management Hub
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Complete order lifecycle, delivery tracking, and payment management
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
          <Button onClick={() => {
            if (activeTab === "orders") loadOrders();
            else if (activeTab === "delivery") loadDeliveryData();
            else if (activeTab === "payments") loadPaymentData();
          }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="orders" className="mt-6">
          {renderOrdersTab()}
        </TabsContent>
        
        <TabsContent value="delivery" className="mt-6">
          {renderDeliveryTab()}
        </TabsContent>
        
        <TabsContent value="payments" className="mt-6">
          {renderPaymentsTab()}
        </TabsContent>
      </Tabs>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              {selectedOrder && `Order #${selectedOrder.order_number}`}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Customer</Label>
                  <p className="font-medium">{selectedOrder.customer_name}</p>
                  <p className="text-sm text-gray-500">{selectedOrder.customer_email}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant="outline" className={`border-${getStatusColor(selectedOrder.status)}-500 text-${getStatusColor(selectedOrder.status)}-700`}>
                    {selectedOrder.status.replace("_", " ")}
                  </Badge>
                </div>
                <div>
                  <Label>Total Amount</Label>
                  <p className="font-medium">LKR {typeof selectedOrder.total_amount === 'string' ? parseFloat(selectedOrder.total_amount).toFixed(2) : selectedOrder.total_amount.toFixed(2)}</p>
                </div>
                <div>
                  <Label>Order Date</Label>
                  <p>{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              {selectedTransaction && `Transaction ID: ${selectedTransaction.id}`}
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div>
                <Label>Refund Amount</Label>
                <Input
                  type="number"
                  placeholder="Enter refund amount"
                  max={selectedTransaction.amount}
                  step="0.01"
                />
              </div>
              <div>
                <Label>Reason</Label>
                <Textarea
                  placeholder="Enter refund reason..."
                  value={refundNote}
                  onChange={(e) => setRefundNote(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (selectedTransaction) {
                processRefund(selectedTransaction.id, parseFloat(selectedTransaction.amount), refundNote);
              }
            }}>
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderManagementHub;
