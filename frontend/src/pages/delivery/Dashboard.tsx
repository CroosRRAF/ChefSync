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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import DeliveryLayout from "@/components/delivery/DeliveryLayout";
import { DistanceWarningDialog } from "@/components/delivery/DistanceWarningDialog";
import ContactCard from "@/components/delivery/ContactCard";
import {
  getAvailableOrders,
  getMyAssignedOrders,
  getDashboardSummary,
  getDeliveryLogs,
  getDeliveryHistory,
  acceptOrder,
  type DeliveryLog,
} from "@/services/service";
import { Link, useNavigate } from "react-router-dom";
import type { Order } from "../../types/orderType";
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
  Users,
} from "lucide-react";
import SimplifiedDeliveryFlow from "@/components/delivery/SimplifiedDeliveryFlow";

const DeliveryDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [assignedOrders, setAssignedOrders] = useState<Order[]>([]);
  const [recentDeliveries, setRecentDeliveries] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [acceptingOrder, setAcceptingOrder] = useState<number | null>(null);
  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<DeliveryLog | null>(null);
  const [showLogDetail, setShowLogDetail] = useState(false);
  // Distance warning dialog state
  const [distanceWarning, setDistanceWarning] = useState<{
    isOpen: boolean;
    orderId: number | null;
    distance: number;
    message: string;
    agentLocation: { lat: number; lng: number } | null;
  }>({
    isOpen: false,
    orderId: null,
    distance: 0,
    message: "",
    agentLocation: null,
  });
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
  const pendingPickups = availableOrders.filter((o) =>
    ["ready", "pending"].includes(o.status)
  ).length;

  useEffect(() => {
    fetchDashboardData();
    fetchAvailableOrders();
    fetchRecentDeliveries();
    fetchDeliveryLogs();
    fetchAssignedOrders();
    checkLocationPermission();
  }, []);

  // Check location permission on component mount
  const checkLocationPermission = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description:
          "Your browser doesn't support location services. Some features may not work properly.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if permission is already granted
      const permission = await navigator.permissions.query({
        name: "geolocation",
      });

      if (permission.state === "denied") {
        toast({
          title: "Location Permission Denied",
          description:
            "Location access is blocked. Please enable it in your browser settings to accept orders.",
          variant: "destructive",
        });
      } else if (permission.state === "prompt") {
        // Show a friendly message about why we need location
        toast({
          title: "Location Access Needed",
          description:
            "We'll need your location to assign orders and track deliveries. Please allow access when prompted.",
          variant: "default",
        });
      }
    } catch (error) {
      // Fallback for browsers that don't support permissions API
      console.warn("Could not check location permission:", error);
    }
  };

  // Manual location permission request
  const requestLocationPermission = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Try to get position which will prompt for permission
      await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      toast({
        title: "Location Access Granted",
        description: "Great! You can now accept orders with location tracking.",
        variant: "default",
      });
    } catch (error: any) {
      if (error.code === 1) {
        toast({
          title: "Permission Denied",
          description:
            "Please enable location access in your browser settings to accept orders.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Location Error",
          description:
            "Could not access your location. Please check your settings.",
          variant: "destructive",
        });
      }
    }
  };

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
      // Including confirmed, preparing and ready orders
      const deliverableStatuses = ["confirmed", "preparing", "ready"];

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

  const fetchAssignedOrders = async () => {
    try {
      console.log("Fetching assigned orders...");
      const assignedData = await getMyAssignedOrders();
      console.log("Fetched assigned orders:", assignedData);

      // Filter for active delivery states
      const activeOrders = assignedData.filter((order) =>
        ["ready", "out_for_delivery", "in_transit"].includes(order.status)
      );

      setAssignedOrders(activeOrders);
    } catch (error) {
      console.error("Failed to fetch assigned orders:", error);
    }
  };

  const handleAcceptOrder = async (orderId: number, order: Order) => {
    console.log("handleAcceptOrder called with:", {
      orderId,
      orderIdType: typeof orderId,
      order,
    });

    // Validate orderId
    if (typeof orderId !== "number" || isNaN(orderId)) {
      console.error("Invalid order ID:", orderId);
      toast({
        title: "Error",
        description: "Invalid order ID. Please refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }

    setAcceptingOrder(orderId);

    // Get current location for distance checking
    const getCurrentPosition = (): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation not supported"));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        });
      });
    };

    try {
      let agentLocation = null;
      let chefLocation = null;

      // Try to get current location
      try {
        const position = await getCurrentPosition();
        agentLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
      } catch (locationError: any) {
        console.warn("Could not get current location:", locationError);

        // Handle location permission errors
        if (locationError.code === 1) {
          // PERMISSION_DENIED
          toast({
            title: "Location Permission Required",
            description:
              "Please allow location access to accept orders. This helps us track deliveries and provide better service.",
            variant: "destructive",
          });
          setAcceptingOrder(null);
          return;
        } else if (locationError.code === 2) {
          // POSITION_UNAVAILABLE
          toast({
            title: "Location Unavailable",
            description:
              "Unable to determine your location. Please check your GPS settings and try again.",
            variant: "destructive",
          });
          setAcceptingOrder(null);
          return;
        } else if (locationError.code === 3) {
          // TIMEOUT
          toast({
            title: "Location Timeout",
            description:
              "Location request timed out. Please try again or check your GPS settings.",
            variant: "destructive",
          });
          setAcceptingOrder(null);
          return;
        } else {
          // Show a warning but continue without location
          toast({
            title: "Location Warning",
            description:
              "Could not get your location, but proceeding with order acceptance.",
            variant: "default",
          });
        }
      }

      // For now, we'll accept without chef location, but the backend will handle it
      const acceptResult = await acceptOrder(
        orderId,
        agentLocation || undefined,
        chefLocation
      );

      // Check if there's a distance warning
      if (
        "warning" in acceptResult &&
        acceptResult.warning &&
        acceptResult.distance
      ) {
        setDistanceWarning({
          isOpen: true,
          orderId: orderId,
          distance: acceptResult.distance,
          message: acceptResult.message,
          agentLocation: agentLocation,
        });
        setAcceptingOrder(null);
        return;
      }

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

  const handleDistanceWarningConfirm = async () => {
    if (!distanceWarning.orderId) return;

    setAcceptingOrder(distanceWarning.orderId);

    try {
      // Accept the order despite the distance warning
      await acceptOrder(
        distanceWarning.orderId,
        distanceWarning.agentLocation || undefined
      );

      // Remove from available orders
      setAvailableOrders((prev) =>
        prev.filter((o) => o.id !== distanceWarning.orderId)
      );

      // Refresh dashboard data
      fetchDashboardData();

      // Navigate to map
      const order = availableOrders.find(
        (o) => o.id === distanceWarning.orderId
      );
      if (order) {
        navigate("/delivery/map", {
          state: {
            selectedOrderId: distanceWarning.orderId,
            orderDetails: order,
          },
        });
      }

      toast({
        title: "Order Accepted",
        description: `Order #${distanceWarning.orderId} accepted despite distance warning.`,
      });
    } catch (error) {
      console.error("Failed to accept order:", error);
      toast({
        title: "Error",
        description: "Failed to accept order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAcceptingOrder(null);
      setDistanceWarning({
        isOpen: false,
        orderId: null,
        distance: 0,
        message: "",
        agentLocation: null,
      });
    }
  };

  const handleDistanceWarningCancel = () => {
    setDistanceWarning({
      isOpen: false,
      orderId: null,
      distance: 0,
      message: "",
      agentLocation: null,
    });
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
          <Card className="group hover:shadow-card transition-all duration-300 border-none theme-shadow-card theme-status-info text-white transform hover:-translate-y-1">
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-blue-100 text-sm">Active Deliveries</p>
                <p className="text-3xl font-bold theme-text-primary text-white">
                  {activeDeliveries}
                </p>
              </div>
              <Truck className="h-10 w-10 text-blue-200 group-hover:scale-110 transition-transform duration-300" />
            </CardContent>
          </Card>

          <Card className="group hover:shadow-card transition-all duration-300 border-none theme-shadow-card theme-status-success text-white transform hover:-translate-y-1">
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-green-100 text-sm">Completed Today</p>
                <p className="text-3xl font-bold text-white">
                  {completedToday}
                </p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-200 group-hover:scale-110 transition-transform duration-300" />
            </CardContent>
          </Card>

          <Card className="group hover:shadow-card transition-all duration-300 border-none theme-shadow-card theme-primary-gradient text-white transform hover:-translate-y-1">
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-green-100 text-sm">Today's Earnings</p>
                <p className="text-3xl font-bold text-white">
                  LKR ${totalEarnings.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-10 w-10 text-green-200 group-hover:scale-110 transition-transform duration-300" />
            </CardContent>
          </Card>

          <Card className="group hover:shadow-card transition-all duration-300 border-none theme-shadow-card theme-navy-gradient text-white transform hover:-translate-y-1">
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-indigo-100 text-sm">Avg. Delivery Time</p>
                <p className="text-3xl font-bold text-white">
                  {dashboard.avg_delivery_time_min}min
                </p>
              </div>
              <Timer className="h-10 w-10 text-indigo-200 group-hover:scale-110 transition-transform duration-300" />
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList
            className="grid w-full grid-cols-4 rounded-lg p-1 transition-all duration-300"
            style={{
              background: "var(--bg-card)",
              boxShadow: "0 4px 20px var(--shadow-light)",
            }}
          >
            <TabsTrigger
              value="overview"
              className="rounded-md transition-all duration-300 data-[state=active]:text-white data-[state=active]:shadow-sm theme-tab-trigger"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="deliveries"
              className="rounded-md transition-all duration-300 data-[state=active]:text-white data-[state=active]:shadow-sm theme-tab-trigger"
            >
              Recent Deliveries
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="rounded-md transition-all duration-300 data-[state=active]:text-white data-[state=active]:shadow-sm theme-tab-trigger"
            >
              Performance
            </TabsTrigger>
            <TabsTrigger
              value="logs"
              className="rounded-md transition-all duration-300 data-[state=active]:text-white data-[state=active]:shadow-sm theme-tab-trigger"
            >
              Delivery Logs
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card
              className="group border-none theme-card-hover theme-animate-fade-in-up"
              style={{ background: "var(--bg-card)" }}
            >
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package
                    className="h-5 w-5 group-hover:scale-110 transition-transform duration-300"
                    style={{ color: "var(--primary-emerald)" }}
                  />
                  <span style={{ color: "var(--text-primary)" }}>
                    Available Orders
                  </span>
                </CardTitle>
                <CardDescription style={{ color: "var(--text-cool-grey)" }}>
                  Orders ready for pickup and delivery
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Location Permission Status */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-medium text-orange-800">
                          Location Access
                        </p>
                        <p className="text-sm text-orange-600">
                          Required to accept orders and track deliveries
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={requestLocationPermission}
                      variant="outline"
                      size="sm"
                      className="border-orange-300 text-orange-700 hover:bg-orange-100"
                    >
                      Enable Location
                    </Button>
                  </div>
                </div>

                {availableOrders.length === 0 ? (
                  <div className="text-center py-12 theme-animate-scale-in">
                    <div
                      className="rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center"
                      style={{
                        background: "rgba(66, 165, 245, 0.1)",
                        border: "2px solid rgba(66, 165, 245, 0.2)",
                      }}
                    >
                      <Package
                        className="h-10 w-10"
                        style={{ color: "var(--status-info)" }}
                      />
                    </div>
                    <h3
                      className="text-lg font-medium mb-2"
                      style={{ color: "var(--text-primary)" }}
                    >
                      No orders available
                    </h3>
                    <p
                      className="mb-6"
                      style={{ color: "var(--text-cool-grey)" }}
                    >
                      Check back later for new delivery opportunities
                    </p>
                    <Button asChild className="theme-button-primary">
                      <Link to="/delivery/orders">View All Orders</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableOrders.slice(0, 5).map((order, index) => (
                      <div
                        key={order.id}
                        className="group p-6 rounded-xl theme-card-hover theme-animate-fade-in-up border-none"
                        style={{
                          background: "var(--bg-card)",
                          animationDelay: `${index * 0.1}s`,
                        }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p
                              className="font-semibold text-lg"
                              style={{ color: "var(--text-primary)" }}
                            >
                              Order #{order.id}
                            </p>
                            <p
                              className="text-sm flex items-center mt-1"
                              style={{ color: "var(--text-cool-grey)" }}
                            >
                              <Users className="h-4 w-4 mr-1" />
                              {order.customer?.name || "Unknown Customer"}
                            </p>
                          </div>
                          <div className="transform group-hover:scale-105 transition-transform duration-300">
                            {getOrderStatusBadge(order.status)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-6 text-sm">
                            <div
                              className="flex items-center space-x-2 px-3 py-1 rounded-full"
                              style={{
                                background: "rgba(66, 165, 245, 0.1)",
                                border: "1px solid rgba(66, 165, 245, 0.2)",
                              }}
                            >
                              <Clock
                                className="h-4 w-4"
                                style={{ color: "var(--status-info)" }}
                              />
                              <span
                                className="font-medium"
                                style={{ color: "var(--status-info)" }}
                              >
                                {formatTime(order.created_at)}
                              </span>
                            </div>
                            <div
                              className="flex items-center space-x-2 px-3 py-1 rounded-full"
                              style={{
                                background: "rgba(67, 160, 71, 0.1)",
                                border: "1px solid rgba(67, 160, 71, 0.2)",
                              }}
                            >
                              <MapPin
                                className="h-4 w-4"
                                style={{ color: "var(--status-success)" }}
                              />
                              <span
                                className="truncate max-w-[200px] font-medium"
                                style={{ color: "var(--status-success)" }}
                              >
                                {order.delivery_address ||
                                  "Address not specified"}
                              </span>
                            </div>
                            <div
                              className="flex items-center space-x-2 px-3 py-1 rounded-full"
                              style={{
                                background: "rgba(156, 39, 176, 0.1)",
                                border: "1px solid rgba(156, 39, 176, 0.2)",
                              }}
                            >
                              <DollarSign
                                className="h-4 w-4"
                                style={{ color: "#9C27B0" }}
                              />
                              <span
                                className="font-semibold"
                                style={{ color: "#9C27B0" }}
                              >
                                ${order.total_amount}
                              </span>
                            </div>
                          </div>
                          <Button
                            onClick={() => {
                              console.log("Accept button clicked for order:", {
                                id: order.id,
                                idType: typeof order.id,
                                order,
                              });
                              handleAcceptOrder(order.id, order);
                            }}
                            disabled={acceptingOrder === order.id}
                            className="ml-4 theme-button-primary"
                            size="lg"
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

                        {/* Contact Information - Show contextually based on order status */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                            Contact Details
                          </div>

                          {/* Before pickup - Show only chef contact */}
                          {[
                            "pending",
                            "confirmed",
                            "preparing",
                            "ready",
                          ].includes(order.status) && (
                            <div className="space-y-2">
                              {order.chef && (
                                <ContactCard
                                  type="chef"
                                  contact={order.chef}
                                  showLocation={true}
                                  className="ring-2 ring-orange-300 shadow-md"
                                />
                              )}
                              <div className="text-xs text-orange-700 bg-orange-50 p-2 rounded border border-orange-200 text-center">
                                <span className="font-medium">
                                  Pickup Phase:
                                </span>{" "}
                                Contact chef for order collection
                              </div>
                            </div>
                          )}

                          {/* After pickup - Show only customer contact */}
                          {[
                            "out_for_delivery",
                            "in_transit",
                            "picked_up",
                          ].includes(order.status) && (
                            <div className="space-y-2">
                              {order.customer && (
                                <ContactCard
                                  type="customer"
                                  contact={order.customer}
                                  className="ring-2 ring-blue-300 shadow-md"
                                />
                              )}
                              <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-200 text-center">
                                <span className="font-medium">
                                  Delivery Phase:
                                </span>{" "}
                                Contact customer for delivery coordination
                              </div>
                            </div>
                          )}

                          {/* For other statuses or fallback - Show both */}
                          {![
                            "pending",
                            "confirmed",
                            "preparing",
                            "ready",
                            "out_for_delivery",
                            "in_transit",
                            "picked_up",
                          ].includes(order.status) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {order.chef && (
                                <ContactCard
                                  type="chef"
                                  contact={order.chef}
                                  showLocation={true}
                                />
                              )}
                              {order.customer && (
                                <ContactCard
                                  type="customer"
                                  contact={order.customer}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {availableOrders.length > 5 && (
                      <div className="text-center">
                        <Button asChild variant="outline">
                          <Link to="/delivery/orders">
                            View All {availableOrders.length} Orders
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Deliveries Section */}
            {assignedOrders.length > 0 && (
              <Card
                className="group border-none theme-card-hover theme-animate-fade-in-up"
                style={{ background: "var(--bg-card)" }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Truck
                      className="h-5 w-5 group-hover:scale-110 transition-transform duration-300"
                      style={{ color: "var(--primary-emerald)" }}
                    />
                    <span style={{ color: "var(--text-primary)" }}>
                      Active Deliveries
                    </span>
                    <Badge variant="secondary" className="ml-2">
                      {assignedOrders.length}
                    </Badge>
                  </CardTitle>
                  <CardDescription style={{ color: "var(--text-cool-grey)" }}>
                    Your currently assigned orders for pickup and delivery
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {assignedOrders.map((order, index) => (
                      <SimplifiedDeliveryFlow
                        key={order.id}
                        order={order}
                        onStatusUpdate={(orderId, newStatus) => {
                          // Refresh assigned orders after status update
                          fetchAssignedOrders();
                          fetchDashboardData();
                        }}
                        className="theme-animate-fade-in-up"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      />
                    ))}
                  </div>
                  <div className="mt-6 text-center">
                    <Button asChild variant="outline" size="lg">
                      <Link to="/delivery/map">
                        <MapPin className="h-4 w-4 mr-2" />
                        Open Map View
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Deliveries Tab */}
          <TabsContent value="deliveries" className="space-y-6">
            <Card
              className="group border-none theme-card-hover theme-animate-fade-in-up"
              style={{ background: "var(--bg-card)" }}
            >
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle
                    className="h-5 w-5 group-hover:scale-110 transition-transform duration-300"
                    style={{ color: "var(--status-success)" }}
                  />
                  <span style={{ color: "var(--text-primary)" }}>
                    Recent Deliveries
                  </span>
                </CardTitle>
                <CardDescription style={{ color: "var(--text-cool-grey)" }}>
                  Your completed delivery history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentDeliveries.length === 0 ? (
                    <div className="text-center py-12 theme-animate-scale-in">
                      <div
                        className="rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center"
                        style={{
                          background: "rgba(67, 160, 71, 0.1)",
                          border: "2px solid rgba(67, 160, 71, 0.2)",
                        }}
                      >
                        <CheckCircle
                          className="h-10 w-10"
                          style={{ color: "var(--status-success)" }}
                        />
                      </div>
                      <h3
                        className="text-lg font-medium mb-2"
                        style={{ color: "var(--text-primary)" }}
                      >
                        No recent deliveries
                      </h3>
                      <p style={{ color: "var(--text-cool-grey)" }}>
                        Your completed deliveries will appear here
                      </p>
                    </div>
                  ) : (
                    recentDeliveries.slice(0, 5).map((order, index) => (
                      <div
                        key={order.id}
                        className="group flex items-center justify-between p-6 rounded-xl theme-card-hover theme-animate-fade-in-up"
                        style={{
                          background: "var(--bg-card)",
                          animationDelay: `${index * 0.1}s`,
                        }}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <Avatar className="h-12 w-12 border-2 border-white shadow-md group-hover:scale-110 transition-transform duration-300">
                              <AvatarFallback
                                className="font-semibold text-white"
                                style={{
                                  background: "var(--primary-gradient)",
                                }}
                              >
                                {order.customer?.name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div
                              className="absolute -bottom-1 -right-1 rounded-full w-4 h-4 flex items-center justify-center"
                              style={{ background: "var(--status-success)" }}
                            >
                              <CheckCircle className="h-3 w-3 text-white" />
                            </div>
                          </div>
                          <div>
                            <p
                              className="font-semibold"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {order.customer?.name}
                            </p>
                            <p
                              className="text-sm flex items-center mt-1"
                              style={{ color: "var(--text-cool-grey)" }}
                            >
                              <Package className="h-3 w-3 mr-1" />
                              Order #{order.id}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="transform group-hover:scale-105 transition-transform duration-300">
                            {getOrderStatusBadge(order.status)}
                          </div>
                          <p
                            className="text-sm mt-2 font-medium"
                            style={{ color: "var(--text-cool-grey)" }}
                          >
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
                        <span>LKR ${totalEarnings.toFixed(2)}/LKR 200</span>
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

        {/* Distance Warning Dialog */}
        <DistanceWarningDialog
          isOpen={distanceWarning.isOpen}
          onClose={handleDistanceWarningCancel}
          onConfirm={handleDistanceWarningConfirm}
          distance={distanceWarning.distance}
          message={distanceWarning.message}
        />
      </div>
    </DeliveryLayout>
  );
};

export default DeliveryDashboard;
