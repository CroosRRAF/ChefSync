// src/pages/delivery/Dashboard.tsx
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import DeliveryLayout from "@/components/delivery/DeliveryLayout";
import {
  getAvailableOrders,
  getDashboardSummary,
  getDeliveryLogs,
  getDeliveryHistory,
  acceptOrder,
  type DeliveryLog,
} from "@/services/deliveryService";
import { Link, useNavigate } from "react-router-dom";
import type { Order } from "../../types/order";
import {
  Truck,
  CheckCircle,
  Package,
  DollarSign,
  Clock,
  MapPin,
  TrendingUp,
  Calendar,
  Activity,
  Timer,
} from "lucide-react";

const DeliveryDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [recentDeliveries, setRecentDeliveries] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [acceptingOrder, setAcceptingOrder] = useState<number | null>(null);
  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<DeliveryLog | null>(null);
  const [showLogDetail, setShowLogDetail] = useState(false);
  const [dashboard, setDashboard] = useState<{
    active_deliveries: number;
    completed_today: number;
    todays_earnings: number;
    avg_delivery_time_min: number;
  }>({
    active_deliveries: 0,
    completed_today: 0,
    todays_earnings: 0,
    avg_delivery_time_min: 0,
  });

  // Derived values for display
  const activeDeliveries = dashboard.active_deliveries;
  const completedToday = dashboard.completed_today;
  const totalEarnings = dashboard.todays_earnings;

  useEffect(() => {
    fetchDashboardData();
    fetchAvailableOrders();
    fetchRecentDeliveries();
    fetchDeliveryLogs();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const data = await getDashboardSummary();
      setDashboard(data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

 const fetchAvailableOrders = async () => {
  try {
    const ordersData = await getAvailableOrders();
    console.log("Fetched available orders:", ordersData);

    // Define statuses considered "available for delivery"
    const deliverableStatuses = ["pending", "confirmed", "preparing", "ready"];

    // Filter orders that are in deliverable statuses
    const availableOrdersData = ordersData.filter((order) =>
      deliverableStatuses.includes(order.status.toLowerCase())
    );

    setAvailableOrders(availableOrdersData);
    console.log("Available orders after filtering:", availableOrdersData);
  } catch (error) {
    console.error("Failed to fetch available orders:", error);
  }
};

  const pendingPickups = orders.filter((o) =>
    ["ready", "pending"].includes(o.status)
  ).length;
  const fetchRecentDeliveries = async () => {
    try {
      const deliveryHistory = await getDeliveryHistory();
      // Only show delivered orders for this delivery agent
      const recentDeliveriesData = deliveryHistory.filter(
        (order) => order.status === "delivered"
      );
      setRecentDeliveries(recentDeliveriesData);
    } catch (error) {
      console.error("Failed to fetch recent deliveries:", error);
    }
  };

  const fetchDeliveryLogs = async () => {
    try {
      const logs = await getDeliveryLogs();
      setDeliveryLogs(logs);
    } catch (error) {
      console.error("Failed to fetch delivery logs:", error);
    }
  };

  const handleAcceptOrder = async (orderId: number, order: Order) => {
    setAcceptingOrder(orderId);
    try {
      await acceptOrder(orderId);

      // Remove from available orders
      setAvailableOrders((prev) => prev.filter((o) => o.id !== orderId));

      // Refresh dashboard data
      fetchDashboardData();

      // Navigate to map with order details
      navigate("/delivery/map", {
        state: {
          selectedOrderId: orderId,
          orderDetails: order,
        },
      });
    } catch (error) {
      console.error("Failed to accept order:", error);
      // Could add toast notification here for error
    } finally {
      setAcceptingOrder(null);
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "assigned":
        return <Badge variant="default">Assigned</Badge>;
      case "picked_up":
        return <Badge variant="destructive">Picked Up</Badge>;
      case "in_transit":
        return <Badge variant="destructive">In Transit</Badge>;
      case "delivered":
        return <Badge variant="default">Delivered</Badge>;
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "text-green-600";
      case "cancelled":
        return "text-red-600";
      case "in_progress":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <DeliveryLayout
      title={`Hello, ${user?.name?.split(" ")[0] || "Delivery Agent"}! 🚚`}
      description="Your delivery dashboard and performance overview"
    >
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-none shadow-md bg-blue-500 text-white">
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-sm">Active Deliveries</p>
                <p className="text-3xl font-bold">{activeDeliveries}</p>
              </div>
              <Truck className="h-10 w-10 text-blue-200" />
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-green-500 text-white">
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-sm">Completed Today</p>
                <p className="text-3xl font-bold">{completedToday}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-200" />
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-purple-500 text-white">
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-sm">Earnings</p>
                <p className="text-3xl font-bold">
                  ${totalEarnings.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-10 w-10 text-purple-200" />
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-orange-500 text-white">
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-sm">Avg. Delivery Time</p>
                <p className="text-3xl font-bold">
                  {dashboard.avg_delivery_time_min}m
                </p>
              </div>
              <Timer className="h-10 w-10 text-orange-200" />
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="deliveries">Recent Deliveries</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="logs">Delivery Logs</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Available Orders</span>
                </CardTitle>
                <CardDescription>Orders ready for pickup</CardDescription>
              </CardHeader>
              <CardContent>
                {availableOrders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No orders available at the moment</p>
                    <Button asChild className="mt-4">
                      <Link to="/delivery/deliveries">View All Deliveries</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableOrders.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-gray-900">
                              Order #{order.id}
                            </p>
                            <p className="text-sm text-gray-600">
                              {order.customer?.name || "Unknown Customer"}
                            </p>
                          </div>
                          {getOrderStatusBadge(order.status)}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatTime(order.created_at)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span className="truncate max-w-[200px]">
                                {order.delivery_address ||
                                  "Address not specified"}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-4 w-4" />
                              <span>${order.total_amount}</span>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleAcceptOrder(order.id, order)}
                            disabled={acceptingOrder === order.id}
                            className="ml-4"
                          >
                            {acceptingOrder === order.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Accepting...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Accept Order
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                    {availableOrders.length > 5 && (
                      <div className="text-center">
                        <Button asChild variant="outline">
                          <Link to="/delivery/deliveries">
                            View All {availableOrders.length} Orders
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deliveries Tab */}
          <TabsContent value="deliveries" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Deliveries</CardTitle>
                <CardDescription>Your delivery history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentDeliveries.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No recent deliveries</p>
                    </div>
                  ) : (
                    recentDeliveries.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {order.customer?.name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {order.customer?.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              Order #{order.id}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {getOrderStatusBadge(order.status)}
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDate(order.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>This Week</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Deliveries Completed</span>
                      <span className="font-bold">47</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Rating</span>
                      <span className="font-bold">4.8 ⭐</span>
                    </div>
                    <div className="flex justify-between">
                      <span>On-time Rate</span>
                      <span className="font-bold">96%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Today's Goals</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Deliveries</span>
                        <span>{completedToday}/10</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(completedToday / 10) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Earnings</span>
                        <span>${totalEarnings.toFixed(2)}/$200</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              (totalEarnings / 200) * 100,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Delivery Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Delivery Logs</span>
                </CardTitle>
                <CardDescription>
                  Detailed history of your deliveries
                </CardDescription>
              </CardHeader>
              <CardContent>
                {deliveryLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No delivery logs available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {deliveryLogs.slice(0, 5).map((log) => (
                      <div
                        key={log.id}
                        className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => {
                          setSelectedLog(log);
                          setShowLogDetail(true);
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">
                              Delivery #{log.orderId}
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatDate(log.startTime)}
                            </p>
                          </div>
                          <Badge
                            variant={
                              log.status === "completed"
                                ? "default"
                                : log.status === "failed"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {log.status}
                          </Badge>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          <p>Duration: {log.totalTime} minutes</p>
                          {log.distance && <p>Distance: {log.distance} km</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delivery Log Detail Dialog */}
        <Dialog open={showLogDetail} onOpenChange={setShowLogDetail}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Delivery Log Details</DialogTitle>
              <DialogDescription>
                Complete information for delivery #{selectedLog?.orderId}
              </DialogDescription>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Status
                  </label>
                  <Badge
                    className={`ml-2 ${getStatusColor(selectedLog.status)}`}
                  >
                    {selectedLog.status}
                  </Badge>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Start Time
                  </label>
                  <p className="font-medium">
                    {new Date(selectedLog.startTime).toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Duration
                  </label>
                  <p className="font-medium">{selectedLog.totalTime} minutes</p>
                </div>

                {selectedLog.distance && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Distance
                    </label>
                    <p className="font-medium">{selectedLog.distance} km</p>
                  </div>
                )}

                {selectedLog.route && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Route
                    </label>
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="font-medium">From:</span>{" "}
                        {selectedLog.route.startAddress}
                      </p>
                      <p>
                        <span className="font-medium">To:</span>{" "}
                        {selectedLog.route.endAddress}
                      </p>
                      {selectedLog.route.waypoints &&
                        selectedLog.route.waypoints.length > 0 && (
                          <p>
                            <span className="font-medium">Via:</span>{" "}
                            {selectedLog.route.waypoints.join(", ")}
                          </p>
                        )}
                    </div>
                  </div>
                )}

                {selectedLog.endTime && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      End Time
                    </label>
                    <p className="font-medium">
                      {new Date(selectedLog.endTime).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DeliveryLayout>
  );
};

export default DeliveryDashboard;

