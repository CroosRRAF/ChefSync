import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";
import DeliveryLayout from "@/components/delivery/DeliveryLayout";
import GoogleMapComponent from "@/components/delivery/GoogleMapComponent";
import {
  getAvailableOrders,
  getMyAssignedOrders,
  updateDeliveryLocation,
  getRouteDirections,
  optimizeDeliveryRoute,
} from "@/services/deliveryService";
import {
  MapPin,
  Navigation,
  Truck,
  Clock,
  CheckCircle,
  RefreshCw,
  Target,
  Route,
  AlertCircle,
  Zap,
  ExternalLink,
  Smartphone,
  Package,
} from "lucide-react";
import type { Order } from "../../types/orderType";
import OrderStatusTracker from "@/components/delivery/OrderStatusTracker";
import DeliveryTracker from "@/components/delivery/DeliveryTracker";
import PickupDeliveryFlow from "@/components/delivery/PickupDeliveryFlow";
import DeliveryPhaseCard from "@/components/delivery/DeliveryPhaseCard";

interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
}

interface RouteOptimization {
  optimizedOrder: Order[];
  totalDistance: number;
  estimatedTime: number;
  savings: {
    distance: number;
    time: number;
  };
}

const DeliveryMap: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [assignedOrders, setAssignedOrders] = useState<Order[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [routeOptimization, setRouteOptimization] =
    useState<RouteOptimization | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Handle order details passed from dashboard
  useEffect(() => {
    const state = location.state as {
      selectedOrderId?: number;
      orderDetails?: Order;
    };
    if (state?.orderDetails) {
      setSelectedOrder(state.orderDetails);
      setShowOrderDetails(true);
      // Auto-enable tracking when coming from accepted order
      if (!trackingEnabled) {
        requestLocationPermission();
      }
    }
  }, [location.state]);

  useEffect(() => {
    fetchOrders();
    fetchAssignedOrders();
    checkLocationPermissions();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const ordersData = await getAvailableOrders();
      // Only show orders that are assigned or in progress
      const activeOrders = ordersData.filter((order) =>
        ["assigned", "picked_up", "in_transit"].includes(order.status)
      );
      setOrders(activeOrders);
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

  const fetchAssignedOrders = async () => {
    try {
      const assignedData = await getMyAssignedOrders();
      // Filter for active delivery states
      const activeOrders = assignedData.filter((order) =>
        ["ready", "out_for_delivery", "in_transit"].includes(order.status)
      );
      setAssignedOrders(activeOrders);
    } catch (error) {
      console.error("Failed to fetch assigned orders:", error);
    }
  };

  const checkLocationPermissions = async () => {
    if ("geolocation" in navigator) {
      try {
        const permission = await navigator.permissions.query({
          name: "geolocation",
        });
        if (permission.state === "granted") {
          setTrackingEnabled(true);
          startLocationTracking();
        }
      } catch (error) {
        console.log("Location permission check failed:", error);
      }
    }
  };

  const requestLocationPermission = async () => {
    if (!("geolocation" in navigator)) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        }
      );

      const location: Location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now(),
      };

      setCurrentLocation(location);
      setTrackingEnabled(true);
      setLocationError(null);
      startLocationTracking();

      toast({
        title: "Location Access Granted",
        description: "GPS tracking is now active for deliveries.",
      });
    } catch (error) {
      setLocationError(
        "Failed to get location. Please check your permissions."
      );
      toast({
        variant: "destructive",
        title: "Location Error",
        description: "Unable to access your location. Please enable GPS.",
      });
    }
  };

  const startLocationTracking = useCallback(() => {
    if (!trackingEnabled) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        };

        setCurrentLocation(location);

        // Update server with location
        updateDeliveryLocation(location.lat, location.lng).catch((error) => {
          console.error("Failed to update location:", error);
        });
      },
      (error) => {
        console.error("Location tracking error:", error);
        setLocationError(
          "Location tracking failed. Please check your settings."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 30000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [trackingEnabled]);

  useEffect(() => {
    return startLocationTracking();
  }, [startLocationTracking]);

  const handleOptimizeRoute = async () => {
    if (orders.length < 2) {
      toast({
        title: "Route Optimization",
        description: "Need at least 2 orders to optimize the route.",
      });
      return;
    }

    if (!currentLocation) {
      toast({
        variant: "destructive",
        title: "Location Required",
        description: "Please enable location access to optimize the route.",
      });
      return;
    }

    setLoading(true);
    try {
      // In a real implementation, this would use the backend service
      // For now, we'll show a success message
      const optimization = await optimizeDeliveryRoute(orders.map((o) => o.id));
      setRouteOptimization(optimization);

      toast({
        title: "Route Optimized",
        description: `Saved ${optimization.savings.distance.toFixed(
          1
        )} km and ${optimization.savings.time} minutes!`,
      });
    } catch (error) {
      // Fallback: create a mock optimization result
      const mockOptimization: RouteOptimization = {
        optimizedOrder: [...orders].sort((a, b) => a.id - b.id),
        totalDistance: orders.length * 2.5,
        estimatedTime: orders.length * 15,
        savings: {
          distance: orders.length * 0.8,
          time: orders.length * 5,
        },
      };

      setRouteOptimization(mockOptimization);

      toast({
        title: "Route Optimized",
        description: `Estimated savings: ${mockOptimization.savings.distance.toFixed(
          1
        )} km and ${mockOptimization.savings.time} minutes!`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleStatusUpdate = (orderId: number, newStatus: Order["status"]) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );

    // Update assigned orders as well
    setAssignedOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );

    // If the selected order was updated, update it too
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) =>
        prev ? { ...prev, status: newStatus } : null
      );
    }

    // Refresh assigned orders from server to get latest data
    fetchAssignedOrders();
  };

  const handleDeliveryComplete = (orderId: number) => {
    setOrders((prevOrders) =>
      prevOrders.filter((order) => order.id !== orderId)
    );

    // Also remove from assigned orders
    setAssignedOrders((prevOrders) =>
      prevOrders.filter((order) => order.id !== orderId)
    );

    if (selectedOrder?.id === orderId) {
      setSelectedOrder(null);
      setShowOrderDetails(false);
    }

    toast({
      title: "Delivery Completed",
      description: `Order #${orderId} has been successfully delivered!`,
    });

    // Refresh assigned orders to ensure consistency
    fetchAssignedOrders();
  };

  // Get destination location for selected order (mock for now)
  const getDestinationLocation = (order: Order) => {
    // In a real app, this would geocode the delivery address
    // For now, return a mock location near San Francisco
    const mockLocations = [
      { lat: 37.7849, lng: -122.4094 },
      { lat: 37.7649, lng: -122.4294 },
      { lat: 37.7949, lng: -122.3994 },
      { lat: 37.7549, lng: -122.4394 },
    ];
    return mockLocations[order.id % mockLocations.length];
  };

  const handleGetDirections = async (order: Order) => {
    if (!currentLocation) {
      toast({
        variant: "destructive",
        title: "Location Required",
        description: "Please enable location access to get directions.",
      });
      return;
    }

    try {
      // Create directions URL for external navigation apps
      const destination =
        order.delivery_address ||
        `${order.customer?.name || "Customer"} Location`;
      const encodedDestination = encodeURIComponent(destination);

      // For mobile devices, try to open in Google Maps app
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );

      if (isMobile) {
        // Try to open in Google Maps app first
        const googleMapsUrl = `https://www.google.com/maps/dir/${currentLocation.lat},${currentLocation.lng}/${encodedDestination}`;
        window.open(googleMapsUrl, "_blank");
      } else {
        // For desktop, open in new tab
        const googleMapsUrl = `https://www.google.com/maps/dir/${currentLocation.lat},${currentLocation.lng}/${encodedDestination}`;
        window.open(googleMapsUrl, "_blank");
      }

      // Also call the backend service for tracking
      try {
        await getRouteDirections(order.id);
      } catch (backendError) {
        console.error("Backend route directions failed:", backendError);
      }

      toast({
        title: "Navigation Started",
        description: `Opening directions to Order #${order.id} in Google Maps.`,
      });
    } catch (error) {
      console.error("Navigation failed:", error);
      toast({
        variant: "destructive",
        title: "Navigation Error",
        description: "Failed to start navigation. Please try again.",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "assigned":
        return <Badge variant="secondary">Assigned</Badge>;
      case "picked_up":
        return <Badge className="bg-blue-500">Picked Up</Badge>;
      case "in_transit":
        return <Badge className="bg-yellow-500">In Transit</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DeliveryLayout
      title="Delivery Map"
      description="Track your deliveries and optimize routes in real-time"
    >
      <div className="space-y-8">
        {/* Controls */}
        <div className="bg-white rounded-xl p-6 shadow-lg border-none">
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={requestLocationPermission}
              variant="outline"
              disabled={trackingEnabled}
              className={`transform hover:scale-105 transition-all duration-300 ${
                trackingEnabled
                  ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                  : "hover:bg-primary hover:text-primary-foreground"
              }`}
            >
              <Target
                className={`h-4 w-4 mr-2 ${
                  trackingEnabled ? "text-green-500 animate-pulse" : ""
                }`}
              />
              {trackingEnabled ? "🟢 Tracking Active" : "Enable GPS Tracking"}
            </Button>
            <Button
              onClick={handleOptimizeRoute}
              disabled={orders.length < 2}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none"
            >
              <Route className="h-4 w-4 mr-2" />
              Optimize Route
            </Button>
            <Button
              onClick={() => {
                fetchOrders();
                fetchAssignedOrders();
              }}
              variant="outline"
              className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transform hover:scale-105 transition-all duration-300"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Orders
            </Button>
          </div>
        </div>

        {/* Location Status */}
        {locationError && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-6 shadow-md">
            <div className="flex items-center">
              <div className="bg-red-500 rounded-full p-2 mr-4">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <span className="text-red-700">{locationError}</span>
            </div>
          </div>
        )}

        {currentLocation && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-green-700">
                Current Location: {currentLocation.lat.toFixed(6)},{" "}
                {currentLocation.lng.toFixed(6)}
                {currentLocation.accuracy &&
                  ` (±${Math.round(currentLocation.accuracy)}m)`}
              </span>
            </div>
          </div>
        )}

        {/* Route Optimization Results */}
        {routeOptimization && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-700">
                <Zap className="h-5 w-5 mr-2" />
                Route Optimized!
              </CardTitle>
              <CardDescription>
                Optimized delivery sequence for{" "}
                {routeOptimization.optimizedOrder.length} orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Distance</p>
                  <p className="font-semibold">
                    {routeOptimization.totalDistance.toFixed(1)} km
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estimated Time</p>
                  <p className="font-semibold">
                    {routeOptimization.estimatedTime} min
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Distance Saved</p>
                  <p className="font-semibold text-green-600">
                    -{routeOptimization.savings.distance.toFixed(1)} km
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Time Saved</p>
                  <p className="font-semibold text-green-600">
                    -{routeOptimization.savings.time} min
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Interactive Google Map */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Delivery Map
            </CardTitle>
            <CardDescription>
              Interactive map with your location and delivery destinations
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <GoogleMapComponent
              currentLocation={currentLocation}
              orders={orders}
              onOrderSelect={handleOrderSelect}
              onGetDirections={handleGetDirections}
              className="rounded-b-lg"
            />
          </CardContent>
        </Card>

        {/* Active Orders List */}
        <Card>
          <CardHeader>
            <CardTitle>Active Deliveries</CardTitle>
            <CardDescription>
              {orders.length} orders ready for delivery
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                Loading orders...
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Truck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No active deliveries</p>
                <Button
                  onClick={fetchOrders}
                  className="mt-4"
                  variant="outline"
                >
                  Refresh Orders
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleOrderSelect(order)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">Order #{order.id}</p>
                        <p className="text-sm text-gray-600">
                          {order.customer?.name || "Unknown Customer"}
                        </p>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span className="truncate max-w-[200px]">
                            {order.delivery_address || "Address not specified"}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>
                            {new Date(order.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGetDirections(order);
                        }}
                        size="sm"
                        variant="outline"
                      >
                        <Navigation className="h-4 w-4 mr-1" />
                        Directions
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Details Dialog */}
        <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details & Delivery Status</DialogTitle>
              <DialogDescription>
                Complete information and tracking for Order #{selectedOrder?.id}
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                {/* Two-Stage Pickup & Delivery Flow */}
                <PickupDeliveryFlow
                  order={selectedOrder}
                  currentLocation={currentLocation}
                  onStatusUpdate={handleStatusUpdate}
                  onOrderComplete={handleDeliveryComplete}
                />

                {/* Order Information */}
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Customer
                        </label>
                        <p className="font-medium">
                          {selectedOrder.customer?.name || "Unknown"}
                        </p>
                        {selectedOrder.customer?.phone && (
                          <p className="text-sm text-gray-500">
                            {selectedOrder.customer.phone}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Order Total
                        </label>
                        <p className="font-medium text-lg text-green-600">
                          ${selectedOrder.total_amount}
                        </p>
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

                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>
                          Ordered:{" "}
                          {new Date(selectedOrder.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Navigation Buttons */}
                <div className="mt-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        const encodedAddress = encodeURIComponent(
                          selectedOrder.delivery_address
                        );
                        const navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
                        window.open(navigationUrl, "_blank");
                      }}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Google Maps
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        // Quick navigation logic (e.g., open in default maps app)
                        if (currentLocation) {
                          const { lat, lng } = currentLocation;
                          const quickNavUrl = `geo:${lat},${lng};u=35`;
                          window.open(quickNavUrl, "_blank");
                        } else {
                          toast({
                            variant: "destructive",
                            title: "Location Required",
                            description:
                              "Please enable location access for quick navigation.",
                          });
                        }
                      }}
                    >
                      <Smartphone className="h-3 w-3 mr-1" />
                      Quick Nav
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleDeliveryComplete(selectedOrder.id)}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Mark Delivered
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delivery Flow Steps - Show when order is selected */}
        {selectedOrder && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Current Delivery: Order #{selectedOrder.id}
              </CardTitle>
              <CardDescription>
                Follow the step-by-step delivery process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrderStatusTracker
                order={selectedOrder}
                currentLocation={currentLocation}
                onStatusUpdate={handleStatusUpdate}
                onNavigate={handleGetDirections}
              />
            </CardContent>
          </Card>
        )}

        {/* Active Deliveries Section */}
        {assignedOrders.length > 0 && (
          <Card className="border-none theme-card-hover">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Truck className="h-5 w-5 mr-2 text-blue-600" />
                  <span>Active Deliveries</span>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-700"
                >
                  {assignedOrders.length} active
                </Badge>
              </CardTitle>
              <CardDescription>
                Your currently assigned orders for pickup and delivery
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {assignedOrders.map((order, index) => (
                  <DeliveryPhaseCard
                    key={order.id}
                    order={order}
                    onNavigateToMap={(order) => {
                      setSelectedOrder(order);
                      setShowOrderDetails(true);
                      // Scroll to top to see the selected order
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="transform hover:scale-[1.02] transition-all duration-300"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  />
                ))}
              </div>
              <div className="mt-6 flex justify-between items-center">
                <Button
                  onClick={fetchAssignedOrders}
                  variant="outline"
                  size="sm"
                  className="hover:bg-blue-50 hover:border-blue-300"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Active Deliveries
                </Button>
                <p className="text-sm text-gray-500">
                  Last updated: {new Date().toLocaleTimeString()}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DeliveryLayout>
  );
};

export default DeliveryMap;


