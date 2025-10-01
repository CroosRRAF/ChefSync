import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  ChefHat,
  Clock,
  DollarSign,
  Download,
  Eye,
  Filter,
  MapPin,
  MoreHorizontal,
  Package,
  RefreshCw,
  Search,
  ShoppingCart,
  Truck,
  User,
  XCircle,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

// Import shared components
import DataTable from "@/components/admin/shared/tables/DataTable";
import { StatsWidget as StatsCard } from "@/components/admin/shared/widgets/index";

// Import admin service and types
import { adminService, type OrderListResponse, type AdminOrder } from "@/services/adminService";

/**
 * Order Management Page
 *
 * Features:
 * - Complete order lifecycle management
 * - Order statistics and analytics
 * - Chef and delivery partner assignment
 * - Advanced filtering and search
 * - Order status management
 * - Order details view
 */

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

interface OrderFilters {
  status: string;
  paymentStatus: string;
  search: string;
  dateRange: string;
  chefId: string;
  deliveryPartnerId: string;
}

const OrderManagement: React.FC = () => {
  // State management
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);

  // Modal states
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(25);

  // Filters
  const [filters, setFilters] = useState<OrderFilters>({
    status: "all",
    paymentStatus: "all",
    search: "",
    dateRange: "all",
    chefId: "",
    deliveryPartnerId: "",
  });

  // Statistics
  const [orderStats, setOrderStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    preparing: 0,
    outForDelivery: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
  });

  // Calculate statistics
  const calculateStats = useCallback((ordersList: AdminOrder[]) => {
    const stats = ordersList.reduce(
      (acc, order) => {
        acc.total++;
        acc.totalRevenue += typeof order.total_amount === "string"
          ? parseFloat(order.total_amount)
          : order.total_amount;

        switch (order.status.toLowerCase()) {
          case "pending":
            acc.pending++;
            break;
          case "preparing":
            acc.preparing++;
            break;
          case "out_for_delivery":
          case "out for delivery":
            acc.outForDelivery++;
            break;
          case "delivered":
            acc.delivered++;
            break;
          case "cancelled":
            acc.cancelled++;
            break;
        }
        return acc;
      },
      {
        total: 0,
        pending: 0,
        preparing: 0,
        outForDelivery: 0,
        delivered: 0,
        cancelled: 0,
        totalRevenue: 0,
      }
    );

    return {
      ...stats,
      averageOrderValue: stats.total > 0 ? stats.totalRevenue / stats.total : 0,
    };
  }, []);

  // Load orders from API
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
        search: filters.search || undefined,
        status: filters.status !== "all" ? filters.status : undefined,
        payment_status: filters.paymentStatus !== "all" ? filters.paymentStatus : undefined,
        sort_by: "created_at",
        sort_order: "desc",
      };

      const response: OrderListResponse = await adminService.getOrders(params);

      // Transform data to ensure type safety
      const transformedOrders: AdminOrder[] = response.orders.map((order) => ({
        ...order,
        total_amount: typeof order.total_amount === "string"
          ? parseFloat(order.total_amount)
          : order.total_amount,
        items_count: typeof order.items_count === "string"
          ? parseInt(order.items_count)
          : order.items_count,
      }));

      setOrders(transformedOrders);
      setTotalPages(Math.ceil(response.pagination.total / itemsPerPage));
      setTotalItems(response.pagination.total);
      setOrderStats(calculateStats(transformedOrders));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch orders");
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, filters, calculateStats]);

  // Load orders on component mount and when filters change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Get status color for orders
  const getOrderStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "preparing":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "ready":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "out_for_delivery":
      case "out for delivery":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300";
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Handle view order details
  const handleViewOrderDetails = async (order: AdminOrder) => {
    try {
      const details = await adminService.getOrderDetails(order.id);
      setOrderDetails(details);
      setSelectedOrder(order);
      setShowOrderDetails(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch order details");
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedOrders.length === 0) return;

    try {
      // For now, show a message - implement actual bulk actions as needed
      console.log(`Bulk ${action} for orders:`, selectedOrders);
      // TODO: Implement bulk status updates
      await fetchOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} orders`);
    }
  };

  // Order table columns
  const orderColumns = [
    {
      key: "order_number",
      title: "Order ID",
      render: (_: any, order: AdminOrder) => (
        <div className="font-medium text-blue-600 dark:text-blue-400">
          #{order.order_number}
        </div>
      ),
    },
    {
      key: "customer_name",
      title: "Customer",
      render: (_: any, order: AdminOrder) => (
        <div className="flex items-center space-x-2">
          <User size={16} className="text-gray-400" />
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {order.customer_name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {order.customer_email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (_: any, order: AdminOrder) => (
        <Badge className={`${getOrderStatusColor(order.status)} border-0`}>
          {order.status.replace("_", " ").toUpperCase()}
        </Badge>
      ),
    },
    {
      key: "payment_status",
      title: "Payment",
      render: (_: any, order: AdminOrder) => (
        <Badge className={`${getPaymentStatusColor(order.payment_status)} border-0`}>
          {order.payment_status.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: "total_amount",
      title: "Total",
      render: (_: any, order: AdminOrder) => (
        <div className="font-semibold text-gray-900 dark:text-white">
          {formatCurrency(typeof order.total_amount === "string"
            ? parseFloat(order.total_amount)
            : order.total_amount)}
        </div>
      ),
    },
    {
      key: "created_at",
      title: "Date",
      render: (_: any, order: AdminOrder) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(order.created_at).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (_: any, order: AdminOrder) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewOrderDetails(order)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* Add more actions as needed */}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 text-sm underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Order Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage orders, track deliveries, and oversee the complete order lifecycle
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchOrders}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Orders"
          value={orderStats.total}
          subtitle="All time orders"
          icon={<ShoppingCart className="h-5 w-5" />}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Pending Orders"
          value={orderStats.pending}
          subtitle="Awaiting processing"
          icon={<Clock className="h-5 w-5" />}
          trend={{ value: -5, isPositive: false }}
        />
        <StatsCard
          title="Out for Delivery"
          value={orderStats.outForDelivery}
          subtitle="Currently delivering"
          icon={<Truck className="h-5 w-5" />}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Delivered"
          value={orderStats.delivered}
          subtitle="Successfully completed"
          icon={<CheckCircle className="h-5 w-5" />}
          trend={{ value: 15, isPositive: true }}
        />
      </div>

      {/* Revenue Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(orderStats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">From all orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(orderStats.averageOrderValue)}</div>
            <p className="text-xs text-muted-foreground">Per order average</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orderStats.total > 0 ? Math.round((orderStats.delivered / orderStats.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Success rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Order Management Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>All Orders</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search orders..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10 w-64"
                />
              </div>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.paymentStatus}
                onValueChange={(value) => setFilters(prev => ({ ...prev, paymentStatus: value }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={orders}
            columns={orderColumns}
            loading={loading}
            selectable
            selectedRows={selectedOrders}
            onSelectionChange={setSelectedOrders}
            pagination={{
              currentPage,
              totalPages,
              onPageChange: setCurrentPage,
            }}
            bulkActions={[
              {
                label: "Mark as Delivered",
                action: () => handleBulkAction("mark_delivered"),
                icon: <CheckCircle className="h-4 w-4 mr-2" />,
              },
              {
                label: "Cancel Orders",
                action: () => handleBulkAction("cancel"),
                icon: <XCircle className="h-4 w-4 mr-2" />,
                variant: "destructive",
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Order Details #{selectedOrder?.order_number}</span>
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && orderDetails && (
            <div className="space-y-6">
              {/* Order Header */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium">Order Status</Label>
                  <div className="mt-1">
                    <Badge className={`${getOrderStatusColor(selectedOrder.status)} border-0`}>
                      {selectedOrder.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Payment Status</Label>
                  <div className="mt-1">
                    <Badge className={`${getPaymentStatusColor(selectedOrder.payment_status)} border-0`}>
                      {selectedOrder.payment_status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Name</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedOrder.customer_name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedOrder.customer_email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chef Information */}
              {orderDetails.chef && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <ChefHat className="h-5 w-5 mr-2" />
                    Assigned Chef
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Name</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {orderDetails.chef.name}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {orderDetails.chef.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Partner Information */}
              {orderDetails.delivery_partner && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Truck className="h-5 w-5 mr-2" />
                    Assigned Delivery Partner
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Name</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {orderDetails.delivery_partner.name}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {orderDetails.delivery_partner.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Items */}
              {orderDetails.items && orderDetails.items.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Order Items</h3>
                  <div className="space-y-3">
                    {orderDetails.items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatCurrency(item.price)} each
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Amount</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(typeof selectedOrder.total_amount === "string"
                      ? parseFloat(selectedOrder.total_amount)
                      : selectedOrder.total_amount)}
                  </span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Ordered on {formatDate(selectedOrder.created_at)}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderManagement;

