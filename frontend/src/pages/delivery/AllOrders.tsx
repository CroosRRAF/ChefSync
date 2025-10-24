import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import DeliveryLayout from "@/components/delivery/DeliveryLayout";
import OrderStatusTracker from "@/components/delivery/OrderStatusTracker";
import PickupDeliveryFlow from "@/components/delivery/PickupDeliveryFlow";
import {
  getAvailableOrders,
  getMyAssignedOrders,
  getDeliveryHistory,
  acceptOrder,
  updateOrderStatus,
} from "@/services/service";
import {
  Package,
  MapPin,
  Clock,
  DollarSign,
  User,
  Navigation,
  CheckCircle,
  RefreshCw,
  Search,
  Filter,
  Truck,
  Calendar,
  Eye,
  Phone,
  MessageSquare,
  Star,
} from "lucide-react";
import type { Order } from "../../types/orderType";

interface Location {
  lat: number;
  lng: number;
}

const AllOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // State management
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [assignedOrders, setAssignedOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingOrder, setAcceptingOrder] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");

  useEffect(() => {
    fetchAllOrders();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  const fetchAllOrders = async () => {
    setLoading(true);
    try {
      const [available, assigned, completed] = await Promise.all([
        getAvailableOrders(),
        getMyAssignedOrders(),
        getDeliveryHistory(),
      ]);

      // Filter available orders (not yet assigned to anyone)
      const actuallyAvailable = available.filter(
        (order) =>
          !["assigned", "picked_up", "in_transit", "delivered"].includes(
            order.status
          )
      );

      setAvailableOrders(actuallyAvailable);
      setAssignedOrders(assigned);
      setCompletedOrders(completed);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch orders. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId: number, order: Order) => {
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

      // Try to get current location
      try {
        const position = await getCurrentPosition();
        agentLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
      } catch (locationError) {
        console.warn("Could not get current location:", locationError);
      }

      const acceptResult = await acceptOrder(
        orderId,
        agentLocation || undefined
      );

      // Check if there's a distance warning
      if (
        "warning" in acceptResult &&
        acceptResult.warning &&
        acceptResult.distance
      ) {
        const confirmAccept = window.confirm(
          `${acceptResult.message}\n\nDo you still want to accept this order?`
        );

        if (!confirmAccept) {
          setAcceptingOrder(null);
          return;
        }

        // If user confirms, accept again
        await acceptOrder(orderId, agentLocation || undefined);
      }

      // Move order from available to assigned
      setAvailableOrders((prev) => prev.filter((o) => o.id !== orderId));
      setAssignedOrders((prev) => [
        ...prev,
        { ...order, status: "out_for_delivery" as Order["status"] },
      ]);

      toast({
        title: "Order Accepted",
        description: `Order #${orderId} has been assigned to you.`,
      });

      // Navigate to map with order details
      navigate("/delivery/map", {
        state: {
          selectedOrderId: orderId,
          orderDetails: {
            ...order,
            status: "out_for_delivery" as Order["status"],
          },
        },
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to accept order. Please try again.",
      });
    } finally {
      setAcceptingOrder(null);
    }
  };

  const handleStatusUpdate = (orderId: number, newStatus: Order["status"]) => {
    setAssignedOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );

    // If order is completed, move to completed orders
    if (newStatus === "delivered") {
      const completedOrder = assignedOrders.find((o) => o.id === orderId);
      if (completedOrder) {
        setCompletedOrders((prev) => [
          { ...completedOrder, status: newStatus },
          ...prev,
        ]);
        setAssignedOrders((prev) => prev.filter((o) => o.id !== orderId));
      }
    }

    // Update selected order if it's the same
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) =>
        prev ? { ...prev, status: newStatus } : null
      );
    }
  };

  const handleNavigateToOrder = (order: Order) => {
    navigate("/delivery/map", {
      state: {
        selectedOrderId: order.id,
        orderDetails: order,
      },
    });
  };

  const filterOrders = (orders: Order[]) => {
    return orders
      .filter((order) => {
        const matchesSearch =
          order.id.toString().includes(searchTerm) ||
          order.customer?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          order.delivery_address
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase());

        const matchesStatus =
          statusFilter === "all" || order.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "created_at":
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
          case "total_amount":
            return b.total_amount - a.total_amount;
          case "distance":
            // Mock distance sorting - in real app, calculate based on location
            return a.id - b.id;
          default:
            return 0;
        }
      });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, label: "Pending" },
      ready: { variant: "default" as const, label: "Ready" },
      assigned: { variant: "secondary" as const, label: "Assigned" },
      picked_up: { variant: "default" as const, label: "Picked Up" },
      in_transit: { variant: "default" as const, label: "In Transit" },
      delivered: { variant: "default" as const, label: "Delivered" },
      cancelled: { variant: "destructive" as const, label: "Cancelled" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      variant: "outline" as const,
      label: status,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const OrderCard: React.FC<{
    order: Order;
    showActions: boolean;
    isAssigned?: boolean;
  }> = ({ order, showActions, isAssigned = false }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-lg">Order #{order.id}</h3>
            <div className="flex items-center mt-1 text-sm text-gray-600">
              <User className="h-4 w-4 mr-1" />
              <span>{order.customer?.name || "Unknown Customer"}</span>
            </div>
          </div>
          {getStatusBadge(order.status)}
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            <span className="truncate">
              {order.delivery_address || "Address not specified"}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-gray-600">
              <Clock className="h-4 w-4 mr-1" />
              <span>{new Date(order.created_at).toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center font-semibold text-green-600">
              <DollarSign className="h-4 w-4 mr-1" />
              <span>${order.total_amount}</span>
            </div>
          </div>
        </div>

        {showActions && (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedOrder(order);
                setShowOrderDetails(true);
              }}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-1" />
              View Details
            </Button>

            {!isAssigned ? (
              <Button
                onClick={() => handleAcceptOrder(order.id, order)}
                disabled={acceptingOrder === order.id}
                size="sm"
                className="flex-1"
              >
                {acceptingOrder === order.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Accepting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Accept
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={() => handleNavigateToOrder(order)}
                size="sm"
                className="flex-1"
              >
                <Navigation className="h-4 w-4 mr-1" />
                Navigate
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <DeliveryLayout
      title="All Orders"
      description="Manage and track all your delivery orders"
    >
      <div className="space-y-6">
        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="Search orders, customers, addresses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="picked_up">Picked Up</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Latest First</SelectItem>
                  <SelectItem value="total_amount">Highest Value</SelectItem>
                  <SelectItem value="distance">Nearest First</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={fetchAllOrders} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Order Tabs */}
        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="available" className="flex items-center">
              <Package className="h-4 w-4 mr-2" />
              Available ({availableOrders.length})
            </TabsTrigger>
            <TabsTrigger value="assigned" className="flex items-center">
              <Truck className="h-4 w-4 mr-2" />
              My Orders ({assignedOrders.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Completed ({completedOrders.length})
            </TabsTrigger>
          </TabsList>

          {/* Available Orders */}
          <TabsContent value="available" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                Loading orders...
              </div>
            ) : filterOrders(availableOrders).length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">
                    No available orders
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Check back later for new delivery opportunities
                  </p>
                  <Button onClick={fetchAllOrders}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Orders
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterOrders(availableOrders).map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    showActions={true}
                    isAssigned={false}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Assigned Orders */}
          <TabsContent value="assigned" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                Loading orders...
              </div>
            ) : filterOrders(assignedOrders).length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Truck className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">
                    No assigned orders
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Accept orders from the available tab to start delivering
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filterOrders(assignedOrders).map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    showActions={true}
                    isAssigned={true}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Completed Orders */}
          <TabsContent value="completed" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                Loading orders...
              </div>
            ) : filterOrders(completedOrders).length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">
                    No completed deliveries
                  </h3>
                  <p className="text-gray-500">
                    Your completed deliveries will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterOrders(completedOrders).map((order) => (
                  <Card key={order.id} className="relative">
                    <CardContent className="p-6">
                      <div className="absolute top-4 right-4">
                        <Badge variant="default">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Delivered
                        </Badge>
                      </div>

                      <div className="pr-20">
                        <h3 className="font-semibold text-lg">
                          Order #{order.id}
                        </h3>
                        <div className="flex items-center mt-1 text-sm text-gray-600">
                          <User className="h-4 w-4 mr-1" />
                          <span>
                            {order.customer?.name || "Unknown Customer"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>
                            Delivered:{" "}
                            {order.actual_delivery_time
                              ? new Date(
                                  order.actual_delivery_time
                                ).toLocaleString()
                              : new Date(order.updated_at).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center font-semibold text-green-600">
                            <DollarSign className="h-4 w-4 mr-1" />
                            <span>${order.total_amount}</span>
                          </div>
                          <div className="flex items-center text-yellow-600">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="ml-1 text-sm">4.8</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Order Details Dialog */}
        <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
              <DialogDescription>
                Complete information for Order #{selectedOrder?.id}
              </DialogDescription>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-6">
                {/* If order is assigned to user, show pickup & delivery flow */}
                {assignedOrders.some((o) => o.id === selectedOrder.id) && (
                  <PickupDeliveryFlow
                    order={selectedOrder}
                    currentLocation={currentLocation}
                    onStatusUpdate={handleStatusUpdate}
                    onOrderComplete={(orderId) => {
                      handleStatusUpdate(orderId, "delivered");
                      setShowOrderDetails(false);
                    }}
                  />
                )}

                {/* Order Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Customer
                        </label>
                        <p className="font-medium">
                          {selectedOrder.customer?.name || "Unknown"}
                        </p>
                        {selectedOrder.customer?.phone && (
                          <div className="flex items-center mt-1">
                            <Phone className="h-3 w-3 mr-1 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {selectedOrder.customer.phone}
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Order Value
                        </label>
                        <p className="font-medium text-lg text-green-600">
                          ${selectedOrder.total_amount}
                        </p>
                        {selectedOrder.delivery_fee && (
                          <p className="text-sm text-gray-500">
                            Delivery: ${selectedOrder.delivery_fee}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Delivery Address
                      </label>
                      <p className="font-medium">
                        {selectedOrder.delivery_address || "Not specified"}
                      </p>
                    </div>

                    {selectedOrder.delivery_instructions && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Delivery Instructions
                        </label>
                        <p className="font-medium bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                          {selectedOrder.delivery_instructions}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <label className="font-medium">Order Time</label>
                        <p>
                          {new Date(selectedOrder.created_at).toLocaleString()}
                        </p>
                      </div>
                      {selectedOrder.actual_delivery_time && (
                        <div>
                          <label className="font-medium">Delivered Time</label>
                          <p>
                            {new Date(
                              selectedOrder.actual_delivery_time
                            ).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DeliveryLayout>
  );
};

export default AllOrdersPage;
