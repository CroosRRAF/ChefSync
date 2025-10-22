import React, { useCallback, useEffect, useMemo, useState } from "react";

// Import shared components
import {
  AnimatedStats,
  DataTable,
  ErrorBoundary,
  GlassCard,
  useDebouncedSearch,
  usePerformanceMonitor,
} from "@/components/admin/shared";
import type { Column } from "@/components/admin/shared/tables/DataTable";

// Import UI components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  AlertTriangle,
  CheckCircle,
  ChefHat,
  Clock,
  DollarSign,
  Download,
  Eye,
  MoreHorizontal,
  Package,
  RefreshCw,
  Search,
  ShoppingCart,
  TrendingUp,
  Truck,
  XCircle,
} from "lucide-react";

// Import services
import {
  adminService,
  type AdminOrder,
  type OrderListResponse,
} from "@/services/adminService";
import * as deliveryService from "@/services/deliveryService";
import {
  paymentService,
  type PaymentStats,
  type Refund,
  type Transaction,
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
  const { measureApiCall } = usePerformanceMonitor();

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
  const [bulkAction, setBulkAction] = useState<string>("");
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  // Delivery Tab States
  const [activeDeliveries, setActiveDeliveries] = useState<ActiveDelivery[]>(
    []
  );
  const [deliveryStats, setDeliveryStats] = useState<DeliveryStats | null>(
    null
  );
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [selectedDelivery, setSelectedDelivery] =
    useState<ActiveDelivery | null>(null);
  const [showDeliveryDetails, setShowDeliveryDetails] = useState(false);

  // Payments Tab States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundNote, setRefundNote] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "checking"
  >("checking");
  const [retryCount, setRetryCount] = useState(0);

  // Filters
  const [orderFilters, setOrderFilters] = useState({
    status: "all",
    search: "",
    dateRange: "all",
    startDate: "",
    endDate: "",
    customer: "",
    paymentStatus: "all",
    sortBy: "created_at",
    sortOrder: "desc",
    page: 1,
    limit: 25,
  });

  // Debounced search for better performance
  const debouncedSearch = useDebouncedSearch(orderFilters.search, 300);

  const [transactionFilters, setTransactionFilters] = useState({
    search: "",
    status: "all",
    page: 1,
    limit: 25,
  });

  // Check API connectivity
  const checkConnection = useCallback(async () => {
    try {
      setConnectionStatus("checking");
      const response = await fetch("/api/admin-management/orders/stats/", {
        method: "HEAD",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      setConnectionStatus(response.ok ? "connected" : "disconnected");
      return response.ok;
    } catch (error) {
      console.error("Connection check failed:", error);
      setConnectionStatus("disconnected");
      return false;
    }
  }, []);

  // Retry mechanism for API calls
  const retryApiCall = useCallback(
    async (apiCall: () => Promise<any>, maxRetries = 3) => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          setRetryCount(attempt);
          const result = await apiCall();
          setRetryCount(0);
          return result;
        } catch (error) {
          console.error(`API call attempt ${attempt} failed:`, error);
          if (attempt === maxRetries) {
            setRetryCount(0);
            throw error;
          }
          // Wait before retry (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    },
    []
  );

  // Load order statistics
  const loadOrderStats = useCallback(async () => {
    try {
      // Fetch real order stats from API with retry mechanism
      const response = await retryApiCall(() =>
        measureApiCall(
          () =>
            fetch("/api/admin-management/orders/stats/", {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                "Content-Type": "application/json",
              },
            }),
          "order-stats"
        )
      );

      if (response.ok) {
        const statsData = await response.json();
        // Ensure we have a valid stats object
        if (
          statsData &&
          statsData.stats &&
          typeof statsData.stats === "object"
        ) {
          // Map API response fields to frontend interface
          const mappedStats: OrderStats = {
            total: statsData.stats.total_orders || 0,
            pending: statsData.stats.pending || 0,
            preparing: statsData.stats.preparing || 0,
            outForDelivery: statsData.stats.ready || 0, // API uses 'ready' for out for delivery
            delivered: statsData.stats.delivered || 0,
            cancelled: statsData.stats.cancelled || 0,
            totalRevenue: statsData.stats.total_revenue || 0,
            averageOrderValue: statsData.stats.average_order_value || 0,
          };
          setOrderStats(mappedStats);
        } else {
          console.warn("Invalid stats data received:", statsData);
          throw new Error("Invalid API response format");
        }
      } else {
        console.error(
          "Order stats API failed:",
          response.status,
          response.statusText
        );
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(
          `API returned ${response.status}: ${response.statusText}`
        );
      }
    } catch (error) {
      console.error("Error loading order stats:", error);

      // Set fallback data on error
      const fallbackStats: OrderStats = {
        total: 0,
        pending: 0,
        preparing: 0,
        outForDelivery: 0,
        delivered: 0,
        cancelled: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
      };
      setOrderStats(fallbackStats);
    }
  }, []);

  // Load orders
  const loadOrders = useCallback(async () => {
    try {
      setOrderLoading(true);
      setOrderError(null);

      const response: OrderListResponse = await measureApiCall(
        () =>
          adminService.getOrders({
            search: debouncedSearch,
            status:
              orderFilters.status === "all" ? undefined : orderFilters.status,
            payment_status:
              orderFilters.paymentStatus === "all"
                ? undefined
                : orderFilters.paymentStatus,
            sort_by: orderFilters.sortBy,
            sort_order: orderFilters.sortOrder,
            page: orderFilters.page,
            limit: orderFilters.limit,
          }),
        "orders-list"
      );

      // Safely handle the response and ensure we have an array
      const ordersData = Array.isArray(response?.orders) ? response.orders : [];
      console.log("Orders loaded:", ordersData.length, "orders");
      setOrders(ordersData);
    } catch (error) {
      console.error("Error loading orders:", error);
      setOrderError("Failed to load orders");
      // Set empty array on error to prevent undefined access
      setOrders([]);
    } finally {
      setOrderLoading(false);
    }
  }, [orderFilters, debouncedSearch, measureApiCall]);

  // Load delivery data
  const loadDeliveryData = useCallback(async () => {
    try {
      setDeliveryLoading(true);

      const [deliveries, stats] = await Promise.all([
        measureApiCall(
          () => deliveryService.getActiveDeliveries(),
          "active-deliveries"
        ).catch((error) => {
          console.error("Failed to load active deliveries:", error);
          return { success: false, count: 0, active_deliveries: [] };
        }),
        measureApiCall(
          () => deliveryService.getDeliveryStats(),
          "delivery-stats"
        ).catch((error) => {
          console.error("Failed to load delivery stats:", error);
          return {
            success: false,
            stats: {
              active_deliveries: 0,
              completed_deliveries: 0,
              avg_delivery_time_minutes: 0,
              on_time_delivery_rate: 0,
              total_issues: 0,
              open_issues: 0,
              total_revenue: 0,
              delivery_fee_revenue: 0,
            },
          };
        }),
      ]);

      // Handle delivery data
      if (deliveries?.active_deliveries) {
        setActiveDeliveries(deliveries.active_deliveries);
      } else {
        setActiveDeliveries([]);
      }

      // Handle stats data
      if (stats?.stats) {
        setDeliveryStats(stats.stats);
      } else {
        setDeliveryStats({
          active_deliveries: 0,
          completed_deliveries: 0,
          avg_delivery_time_minutes: 0,
          on_time_delivery_rate: 0,
          total_issues: 0,
          open_issues: 0,
          total_revenue: 0,
          delivery_fee_revenue: 0,
        });
      }
    } catch (error) {
      console.error("Error loading delivery data:", error);
      // Set fallback data
      setActiveDeliveries([]);
      setDeliveryStats({
        active_deliveries: 0,
        completed_deliveries: 0,
        avg_delivery_time_minutes: 0,
        on_time_delivery_rate: 0,
        total_issues: 0,
        open_issues: 0,
        total_revenue: 0,
        delivery_fee_revenue: 0,
      });
    } finally {
      setDeliveryLoading(false);
    }
  }, [measureApiCall]);

  // Load payment data
  const loadPaymentData = useCallback(async () => {
    try {
      setPaymentLoading(true);

      // Fetch payment data with enhanced error handling
      const [transactionsData, refundsData, stats] = await Promise.all([
        paymentService
          .getTransactionHistory({
            search: transactionFilters.search || undefined,
            status:
              transactionFilters.status === "all"
                ? undefined
                : transactionFilters.status,
            page: transactionFilters.page,
            limit: transactionFilters.limit,
          })
          .catch((error) => {
            console.error("Failed to load transactions:", error);
            return { results: [], count: 0 };
          }),
        paymentService
          .getRefunds({
            status:
              transactionFilters.status === "all"
                ? undefined
                : transactionFilters.status,
            page: transactionFilters.page,
            limit: transactionFilters.limit,
          })
          .catch((error) => {
            console.error("Failed to load refunds:", error);
            return { results: [], count: 0 };
          }),
        paymentService.getPaymentStats().catch((error) => {
          console.error("Failed to load payment stats:", error);
          return {
            total_transactions: 0,
            total_revenue: "0",
            total_refunds: "0",
            pending_refunds: 0,
            success_rate: 0,
            average_transaction_value: "0",
          };
        }),
      ]);

      setTransactions(transactionsData.results || []);
      setRefunds(refundsData.results || []);
      setPaymentStats(stats);
    } catch (error) {
      console.error("Error loading payment data:", error);
      // Set fallback data
      setTransactions([]);
      setRefunds([]);
      setPaymentStats({
        total_transactions: 0,
        total_revenue: "0",
        total_refunds: "0",
        pending_refunds: 0,
        success_rate: 0,
        average_transaction_value: "0",
      });
    } finally {
      setPaymentLoading(false);
    }
  }, [transactionFilters]);

  // Update order status
  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      // Update order status via API
      const response = await fetch(
        `/api/admin-management/orders/${orderId}/status/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        await loadOrders(); // Refresh orders
        toast({
          title: "Success",
          description: "Order status updated successfully",
        });
      } else {
        throw new Error("Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  // Bulk update order status
  const bulkUpdateOrderStatus = async (
    orderIds: number[],
    newStatus: string
  ) => {
    try {
      setBulkActionLoading(true);

      // Update each order status
      const updatePromises = orderIds.map((orderId) =>
        fetch(`/api/admin-management/orders/${orderId}/status/`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        })
      );

      await Promise.all(updatePromises);
      await loadOrders(); // Refresh orders
      setSelectedOrders([]);
      setShowBulkDialog(false);
      setBulkAction("");

      toast({
        title: "Success",
        description: `${orderIds.length} orders updated successfully`,
      });
    } catch (error) {
      console.error("Error bulk updating orders:", error);
      toast({
        title: "Error",
        description: "Failed to update orders",
        variant: "destructive",
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Handle bulk action
  const handleBulkAction = () => {
    if (selectedOrders.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select orders to perform bulk action",
        variant: "destructive",
      });
      return;
    }
    setShowBulkDialog(true);
  };

  // Process refund
  const processRefund = async (
    transactionId: number,
    amount: number,
    reason: string
  ) => {
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

  // Load data based on active tab with performance optimization
  useEffect(() => {
    // Only load data for the active tab to reduce API calls
    const loadTabData = async () => {
      if (activeTab === "orders") {
        await Promise.all([loadOrderStats(), loadOrders()]);
      } else if (activeTab === "delivery") {
        await loadDeliveryData();
      } else if (activeTab === "payments") {
        await loadPaymentData();
      }
    };

    loadTabData();
  }, [activeTab]); // Removed dependencies to prevent unnecessary re-renders

  // Separate effect for order filters to avoid loading all tabs
  useEffect(() => {
    if (activeTab === "orders") {
      loadOrders();
    }
  }, [orderFilters, debouncedSearch]);

  // Initial connection check
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "orange";
      case "confirmed":
        return "blue";
      case "preparing":
        return "purple";
      case "out_for_delivery":
        return "cyan";
      case "delivered":
        return "green";
      case "cancelled":
        return "red";
      default:
        return "gray";
    }
  };

  // Get payment status color
  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "green";
      case "pending":
        return "orange";
      case "failed":
        return "red";
      case "refunded":
        return "purple";
      default:
        return "gray";
    }
  };

  // Memoized order table columns for performance
  const orderColumns: Column<AdminOrder>[] = useMemo(
    () => [
      {
        key: "select",
        title: "Select",
        render: (order: AdminOrder) => (
          <input
            type="checkbox"
            checked={selectedOrders.includes(order.id)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedOrders((prev) => [...prev, order.id]);
              } else {
                setSelectedOrders((prev) =>
                  prev.filter((id) => id !== order.id)
                );
              }
            }}
            className="rounded border-gray-300"
          />
        ),
      },
      {
        key: "order_number",
        title: "Order #",
        render: (order: AdminOrder) => (
          <div className="font-medium">#{order?.order_number || "N/A"}</div>
        ),
      },
      {
        key: "customer",
        title: "Customer",
        render: (order: AdminOrder) => (
          <div>
            <div className="font-medium">
              {order?.customer_name || "Unknown Customer"}
            </div>
            <div className="text-sm text-gray-500">
              {order?.customer_email || "No email"}
            </div>
          </div>
        ),
      },
      {
        key: "items",
        title: "Items",
        render: (order: AdminOrder) => (
          <div className="text-sm">{order?.items_count || 0} items</div>
        ),
      },
      {
        key: "total",
        title: "Total",
        render: (order: AdminOrder) => (
          <div className="font-medium">
            LKR{" "}
            {order?.total_amount
              ? typeof order.total_amount === "string"
                ? parseFloat(order.total_amount).toFixed(2)
                : order.total_amount.toFixed(2)
              : "0.00"}
          </div>
        ),
      },
      {
        key: "status",
        title: "Status",
        render: (order: AdminOrder) => (
          <Badge
            variant="outline"
            className={`border-${getStatusColor(
              order?.status || "unknown"
            )}-500 text-${getStatusColor(order?.status || "unknown")}-700`}
          >
            {order?.status ? order.status.replace("_", " ") : "Unknown"}
          </Badge>
        ),
      },
      {
        key: "payment_status",
        title: "Payment",
        render: (order: AdminOrder) => (
          <Badge
            variant="outline"
            className={`border-${getPaymentStatusColor(
              order?.payment_status || "unknown"
            )}-500 text-${getPaymentStatusColor(
              order?.payment_status || "unknown"
            )}-700`}
          >
            {order?.payment_status || "Unknown"}
          </Badge>
        ),
      },
      {
        key: "created_at",
        title: "Date",
        render: (order: AdminOrder) => (
          <div className="text-sm">
            {order?.created_at
              ? new Date(order.created_at).toLocaleDateString()
              : "Unknown"}
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
              <DropdownMenuItem
                onClick={() => {
                  setSelectedOrder(order);
                  setShowOrderDetails(true);
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => updateOrderStatus(order.id, "confirmed")}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Order
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => updateOrderStatus(order.id, "preparing")}
              >
                <ChefHat className="h-4 w-4 mr-2" />
                Start Preparing
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => updateOrderStatus(order.id, "out_for_delivery")}
              >
                <Truck className="h-4 w-4 mr-2" />
                Out for Delivery
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => updateOrderStatus(order.id, "delivered")}
              >
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
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  // Navigate to payments tab and filter by this order
                  setActiveTab("payments");
                  setTransactionFilters((prev) => ({
                    ...prev,
                    search: order.order_number || order.id.toString(),
                  }));
                }}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                View Payment
              </DropdownMenuItem>
              {order?.payment_status === "completed" && (
                <DropdownMenuItem className="text-orange-600">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Process Refund
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [
      selectedOrders,
      orders,
      getStatusColor,
      getPaymentStatusColor,
      updateOrderStatus,
      setSelectedOrder,
      setShowOrderDetails,
      setActiveTab,
      setTransactionFilters,
      setSelectedOrders,
    ]
  );

  // Memoized delivery table columns for performance
  const deliveryColumns: Column<ActiveDelivery>[] = useMemo(
    () => [
      {
        key: "order_id",
        title: "Order ID",
        render: (delivery: ActiveDelivery) => (
          <div className="font-medium">#{delivery?.order_id || "N/A"}</div>
        ),
      },
      {
        key: "customer",
        title: "Customer",
        render: (delivery: ActiveDelivery) => (
          <div>
            <div className="font-medium">
              {delivery?.customer?.name || "Unknown Customer"}
            </div>
            <div className="text-sm text-gray-500">
              {delivery?.customer?.phone || "No phone"}
            </div>
          </div>
        ),
      },
      {
        key: "delivery_partner",
        title: "Delivery Partner",
        render: (delivery: ActiveDelivery) => (
          <div>
            {delivery?.delivery_partner ? (
              <>
                <div className="font-medium">
                  {delivery.delivery_partner.name}
                </div>
                <div className="text-sm text-gray-500">
                  {delivery.delivery_partner.phone}
                </div>
              </>
            ) : (
              <Badge
                variant="outline"
                className="text-orange-600 border-orange-300"
              >
                Unassigned
              </Badge>
            )}
          </div>
        ),
      },
      {
        key: "status",
        title: "Status",
        render: (delivery: ActiveDelivery) => (
          <Badge
            variant="outline"
            className={`border-${getStatusColor(
              delivery?.status || "unknown"
            )}-500 text-${getStatusColor(delivery?.status || "unknown")}-700`}
          >
            {delivery?.status ? delivery.status.replace("_", " ") : "Unknown"}
          </Badge>
        ),
      },
      {
        key: "location",
        title: "Location",
        render: (delivery: ActiveDelivery) => (
          <div className="text-sm">
            {delivery?.current_location?.address ? (
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span className="truncate max-w-32">
                  {delivery.current_location.address}
                </span>
              </div>
            ) : (
              <span className="text-gray-400">Location unavailable</span>
            )}
          </div>
        ),
      },
      {
        key: "time_elapsed",
        title: "Time Elapsed",
        render: (delivery: ActiveDelivery) => (
          <div className="text-sm font-mono">
            {delivery?.time_elapsed || "N/A"}
          </div>
        ),
      },
      {
        key: "total_amount",
        title: "Amount",
        render: (delivery: ActiveDelivery) => (
          <div className="font-medium">
            LKR{" "}
            {delivery?.total_amount ? delivery.total_amount.toFixed(2) : "0.00"}
          </div>
        ),
      },
      {
        key: "actions",
        title: "Actions",
        render: (delivery: ActiveDelivery) => (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedDelivery(delivery);
                setShowDeliveryDetails(true);
              }}
            >
              <Eye className="h-4 w-4 mr-1" />
              Track
            </Button>
            {!delivery.delivery_partner && (
              <Button
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-300"
              >
                Assign
              </Button>
            )}
          </div>
        ),
      },
    ],
    [getStatusColor, setSelectedDelivery, setShowDeliveryDetails]
  );

  // Memoized transaction table columns for performance
  const transactionColumns: Column<Transaction>[] = useMemo(
    () => [
      {
        key: "transaction_id",
        title: "Transaction ID",
        render: (transaction: Transaction) => (
          <div className="font-medium font-mono text-sm">
            {transaction?.id || "N/A"}
          </div>
        ),
      },
      {
        key: "customer",
        title: "Customer",
        render: (transaction: Transaction) => (
          <div>
            <div className="font-medium">
              <Button
                variant="link"
                className="p-0 h-auto font-medium text-blue-600 hover:text-blue-800"
                onClick={() => {
                  // Navigate to orders tab and search for this order
                  setActiveTab("orders");
                  setOrderFilters((prev) => ({
                    ...prev,
                    search: transaction?.order_id?.toString() || "",
                  }));
                }}
              >
                Order #{transaction?.order_id || "N/A"}
              </Button>
            </div>
            <div className="text-sm text-gray-500">
              Payment #{transaction?.payment_id || "N/A"}
            </div>
          </div>
        ),
      },
      {
        key: "amount",
        title: "Amount",
        render: (transaction: Transaction) => (
          <div className="font-medium">
            LKR{" "}
            {transaction?.amount
              ? parseFloat(transaction.amount).toFixed(2)
              : "0.00"}
          </div>
        ),
      },
      {
        key: "payment_method",
        title: "Method",
        render: (transaction: Transaction) => (
          <Badge variant="outline">{transaction?.type || "Unknown"}</Badge>
        ),
      },
      {
        key: "status",
        title: "Status",
        render: (transaction: Transaction) => (
          <Badge
            variant="outline"
            className={`border-${getPaymentStatusColor(
              transaction?.status || "unknown"
            )}-500 text-${getPaymentStatusColor(
              transaction?.status || "unknown"
            )}-700`}
          >
            {transaction?.status || "Unknown"}
          </Badge>
        ),
      },
      {
        key: "created_at",
        title: "Date",
        render: (transaction: Transaction) => (
          <div className="text-sm">
            {transaction?.transaction_date
              ? new Date(transaction.transaction_date).toLocaleDateString()
              : "Unknown"}
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
              <DropdownMenuItem
                onClick={() => {
                  setSelectedTransaction(transaction);
                  setShowTransactionDetails(true);
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              {transaction?.status === "completed" && (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedTransaction(transaction);
                    setShowRefundDialog(true);
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Process Refund
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [
      getPaymentStatusColor,
      setSelectedTransaction,
      setShowTransactionDetails,
      setShowRefundDialog,
      setActiveTab,
      setOrderFilters,
    ]
  );

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
        <div className="space-y-4">
          {/* First Row - Search and Primary Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search orders by customer or order number..."
                  value={orderFilters.search}
                  onChange={(e) =>
                    setOrderFilters((prev) => ({
                      ...prev,
                      search: e.target.value,
                    }))
                  }
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={orderFilters.status}
              onValueChange={(value) =>
                setOrderFilters((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="out_for_delivery">
                  Out for Delivery
                </SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={orderFilters.paymentStatus}
              onValueChange={(value) =>
                setOrderFilters((prev) => ({ ...prev, paymentStatus: value }))
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Second Row - Date Range and Actions */}
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex gap-2">
              <div>
                <Label className="text-sm font-medium">Start Date</Label>
                <Input
                  type="date"
                  value={orderFilters.startDate}
                  onChange={(e) =>
                    setOrderFilters((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="w-40"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">End Date</Label>
                <Input
                  type="date"
                  value={orderFilters.endDate}
                  onChange={(e) =>
                    setOrderFilters((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  className="w-40"
                />
              </div>
            </div>

            <div className="flex gap-2 ml-auto">
              {selectedOrders.length > 0 && (
                <>
                  <Select value={bulkAction} onValueChange={setBulkAction}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Bulk Actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirm">Confirm Orders</SelectItem>
                      <SelectItem value="preparing">Start Preparing</SelectItem>
                      <SelectItem value="out_for_delivery">
                        Out for Delivery
                      </SelectItem>
                      <SelectItem value="delivered">Mark Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancel Orders</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleBulkAction}
                    disabled={!bulkAction}
                    variant="outline"
                  >
                    Apply to {selectedOrders.length} orders
                  </Button>
                </>
              )}
              <Button onClick={loadOrders} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
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

        <ErrorBoundary>
          <DataTable
            data={orders}
            columns={orderColumns}
            loading={orderLoading}
          />
        </ErrorBoundary>
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

      {/* Delivery Filters */}
      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by order ID, customer, or delivery partner..."
                className="pl-10"
              />
            </div>
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Deliveries</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="picked_up">Picked Up</SelectItem>
              <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
              <SelectItem value="nearby">Nearby</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Delivery Partner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Partners</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadDeliveryData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </GlassCard>

      {/* Active Deliveries */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Active Deliveries</h3>
            <p className="text-sm text-gray-500 mt-1">
              Real-time tracking of ongoing deliveries
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={loadDeliveryData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Auto-refresh: ON
            </Button>
          </div>
        </div>

        <ErrorBoundary>
          <DataTable
            data={activeDeliveries}
            columns={deliveryColumns}
            loading={deliveryLoading}
          />
        </ErrorBoundary>
      </GlassCard>

      {/* Delivery Partner Management */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">
              Delivery Partner Management
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Manage delivery partners and their assignments
            </p>
          </div>
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            View All Partners
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-900">
                  Available Partners
                </h4>
                <p className="text-2xl font-bold text-blue-600 mt-1">12</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-green-900">
                  Active Deliveries
                </h4>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {deliveryStats?.active_deliveries || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-orange-900">Issues Reported</h4>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {deliveryStats?.open_issues || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
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

      {/* Payment Analytics */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Payment Analytics</h3>
            <p className="text-sm text-gray-500 mt-1">
              Payment performance and transaction insights
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-green-900">Success Rate</h4>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {paymentStats ? Math.round(paymentStats.success_rate) : 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-900">Avg Transaction</h4>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  LKR{" "}
                  {paymentStats
                    ? parseFloat(
                        paymentStats.average_transaction_value
                      ).toFixed(0)
                    : 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-orange-900">Failed Rate</h4>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {paymentStats
                    ? Math.round(100 - paymentStats.success_rate)
                    : 0}
                  %
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <XCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-purple-900">Refund Rate</h4>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {paymentStats
                    ? Math.round(
                        (paymentStats.pending_refunds /
                          paymentStats.total_transactions) *
                          100
                      )
                    : 0}
                  %
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Filters and Search */}
      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search transactions..."
                value={transactionFilters.search}
                onChange={(e) =>
                  setTransactionFilters((prev) => ({
                    ...prev,
                    search: e.target.value,
                  }))
                }
                className="pl-10"
              />
            </div>
          </div>
          <Select
            value={transactionFilters.status}
            onValueChange={(value) =>
              setTransactionFilters((prev) => ({ ...prev, status: value }))
            }
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

        <ErrorBoundary>
          <DataTable
            data={transactions}
            columns={transactionColumns}
            loading={paymentLoading}
          />
        </ErrorBoundary>
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
          {/* Connection Status Indicator */}
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                connectionStatus === "connected"
                  ? "bg-green-500"
                  : connectionStatus === "disconnected"
                  ? "bg-red-500"
                  : "bg-yellow-500 animate-pulse"
              }`}
            ></div>
            <span className="text-sm text-gray-600">
              {connectionStatus === "connected"
                ? "Connected"
                : connectionStatus === "disconnected"
                ? "Disconnected"
                : "Checking..."}
            </span>
            {retryCount > 0 && (
              <span className="text-xs text-orange-600">
                Retry {retryCount}/3
              </span>
            )}
          </div>

          {connectionStatus === "disconnected" && (
            <Button
              variant="outline"
              size="sm"
              onClick={checkConnection}
              className="text-orange-600 border-orange-300"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reconnect
            </Button>
          )}

          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
          <Button
            onClick={() => {
              if (activeTab === "orders") loadOrders();
              else if (activeTab === "delivery") loadDeliveryData();
              else if (activeTab === "payments") loadPaymentData();
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
                  <p className="text-sm text-gray-500">
                    {selectedOrder.customer_email}
                  </p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge
                    variant="outline"
                    className={`border-${getStatusColor(
                      selectedOrder.status
                    )}-500 text-${getStatusColor(selectedOrder.status)}-700`}
                  >
                    {selectedOrder.status.replace("_", " ")}
                  </Badge>
                </div>
                <div>
                  <Label>Total Amount</Label>
                  <p className="font-medium">
                    LKR{" "}
                    {typeof selectedOrder.total_amount === "string"
                      ? parseFloat(selectedOrder.total_amount).toFixed(2)
                      : selectedOrder.total_amount.toFixed(2)}
                  </p>
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

      {/* Delivery Tracking Dialog */}
      <Dialog open={showDeliveryDetails} onOpenChange={setShowDeliveryDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Delivery Tracking</DialogTitle>
            <DialogDescription>
              {selectedDelivery &&
                `Order #${selectedDelivery.order_id} - Real-time tracking`}
            </DialogDescription>
          </DialogHeader>
          {selectedDelivery && (
            <div className="space-y-6">
              {/* Delivery Status Timeline */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-3">Delivery Status</h4>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        [
                          "assigned",
                          "picked_up",
                          "out_for_delivery",
                          "delivered",
                        ].includes(selectedDelivery.status)
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    ></div>
                    <span className="ml-2 text-sm">Assigned</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-gray-300"></div>
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        ["picked_up", "out_for_delivery", "delivered"].includes(
                          selectedDelivery.status
                        )
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    ></div>
                    <span className="ml-2 text-sm">Picked Up</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-gray-300"></div>
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        ["out_for_delivery", "delivered"].includes(
                          selectedDelivery.status
                        )
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    ></div>
                    <span className="ml-2 text-sm">Out for Delivery</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-gray-300"></div>
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        selectedDelivery.status === "delivered"
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    ></div>
                    <span className="ml-2 text-sm">Delivered</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Order Information */}
                <div className="space-y-4">
                  <h4 className="font-medium">Order Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-medium">
                        #{selectedDelivery.order_id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Customer:</span>
                      <span className="font-medium">
                        {selectedDelivery.customer.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">
                        {selectedDelivery.customer.phone || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-medium">
                        LKR {selectedDelivery.total_amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Fee:</span>
                      <span className="font-medium">
                        LKR {selectedDelivery.delivery_fee.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delivery Partner Information */}
                <div className="space-y-4">
                  <h4 className="font-medium">Delivery Partner</h4>
                  {selectedDelivery.delivery_partner ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">
                          {selectedDelivery.delivery_partner.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">
                          {selectedDelivery.delivery_partner.phone || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time Elapsed:</span>
                        <span className="font-medium">
                          {selectedDelivery.time_elapsed}
                        </span>
                      </div>
                      {selectedDelivery.estimated_delivery_time && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">ETA:</span>
                          <span className="font-medium">
                            {new Date(
                              selectedDelivery.estimated_delivery_time
                            ).toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                      <p className="text-gray-600">
                        No delivery partner assigned
                      </p>
                      <Button className="mt-2" size="sm">
                        Assign Partner
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <h4 className="font-medium">Location & Tracking</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-blue-900">
                        Delivery Address
                      </Label>
                      <p className="text-sm text-blue-700 mt-1">
                        {selectedDelivery.delivery_address}
                      </p>
                    </div>
                    {selectedDelivery.current_location?.address && (
                      <div>
                        <Label className="text-sm font-medium text-blue-900">
                          Current Location
                        </Label>
                        <div className="flex items-center mt-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                          <p className="text-sm text-blue-700">
                            {selectedDelivery.current_location.address}
                          </p>
                        </div>
                        {selectedDelivery.current_location.timestamp && (
                          <p className="text-xs text-blue-600 mt-1">
                            Last updated:{" "}
                            {new Date(
                              selectedDelivery.current_location.timestamp
                            ).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  {selectedDelivery.distance_km && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-sm text-blue-700">
                        Distance remaining:{" "}
                        <span className="font-medium">
                          {selectedDelivery.distance_km.toFixed(1)} km
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Issues */}
              {selectedDelivery.open_issues > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                    <h4 className="font-medium text-red-900">Active Issues</h4>
                  </div>
                  <p className="text-sm text-red-700 mt-1">
                    {selectedDelivery.open_issues} issue(s) reported for this
                    delivery
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-red-600 border-red-300"
                  >
                    View Issues
                  </Button>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeliveryDetails(false)}
            >
              Close
            </Button>
            <Button>Contact Partner</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Action Confirmation</DialogTitle>
            <DialogDescription>
              Are you sure you want to {bulkAction} {selectedOrders.length}{" "}
              selected orders?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Warning
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    This action will be applied to all {selectedOrders.length}{" "}
                    selected orders and cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkDialog(false)}
              disabled={bulkActionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (bulkAction) {
                  bulkUpdateOrderStatus(selectedOrders, bulkAction);
                }
              }}
              disabled={bulkActionLoading}
            >
              {bulkActionLoading ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              {selectedTransaction &&
                `Transaction ID: ${selectedTransaction.id}`}
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
            <Button
              variant="outline"
              onClick={() => setShowRefundDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedTransaction) {
                  processRefund(
                    selectedTransaction.id,
                    parseFloat(selectedTransaction.amount),
                    refundNote
                  );
                }
              }}
            >
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderManagementHub;
