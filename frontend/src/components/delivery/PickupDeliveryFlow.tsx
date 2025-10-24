import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Navigation,
  Clock,
  Truck,
  CheckCircle,
  Package,
  ChefHat,
  Phone,
  User,
  Home,
  ArrowRight,
  Timer,
  Route,
  ExternalLink,
  Smartphone,
} from "lucide-react";
import {
  getCookDetails,
  updateOrderStatus,
  startDeliveryTracking,
  getPickupLocation,
  navigateToPickupLocation,
  navigateToDeliveryLocation,
  updateDeliveryProgress,
  markOrderPickedUp,
  getChefLocation,
} from "@/services/service";
import {
  calculateDistanceHaversine,
  estimateTravelTime,
  formatLocation,
  generateNavigationUrl,
} from "@/utils/mapUtils";
import type { Order } from "../../types/orderType";
import IntegratedMapView from "@/components/maps/IntegratedMapView";

interface CookDetails {
  id: number;
  user: {
    name: string;
    email: string;
    phone?: string;
  };
  address: string;
  location?: {
    lat: number;
    lng: number;
  };
  restaurant_name?: string;
  cuisine_type?: string;
}

interface PickupDeliveryFlowProps {
  order: Order;
  currentLocation: { lat: number; lng: number } | null;
  onStatusUpdate: (orderId: number, newStatus: Order["status"]) => void;
  onOrderComplete: (orderId: number) => void;
}

const PickupDeliveryFlow: React.FC<PickupDeliveryFlowProps> = ({
  order,
  currentLocation,
  onStatusUpdate,
  onOrderComplete,
}) => {
  const { toast } = useToast();
  const [cookDetails, setCookDetails] = useState<CookDetails | null>(null);
  const [loadingCook, setLoadingCook] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<"pickup" | "delivery">(
    "pickup"
  );
  const [pickupLocation, setPickupLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [tracking, setTracking] = useState({
    pickup: { started: false, completed: false },
    delivery: { started: false, completed: false },
  });
  const [showNavigationDialog, setShowNavigationDialog] = useState(false);

  // Mock locations for demonstration (in real app, these would come from geocoding)
  const mockPickupLocations = [
    { lat: 37.7849, lng: -122.4194 },
    { lat: 37.7649, lng: -122.4294 },
    { lat: 37.7949, lng: -122.3994 },
  ];

  const mockDeliveryLocations = [
    { lat: 37.7749, lng: -122.4094 },
    { lat: 37.7549, lng: -122.4394 },
    { lat: 37.7849, lng: -122.3894 },
  ];

  // Fetch cook details when component mounts
  useEffect(() => {
    const fetchCookDetails = async () => {
      if (!order.chef?.id) return;

      setLoadingCook(true);
      try {
        const details = await getCookDetails(order.chef.id);
        console.log("Fetched cook details:", details);
        setCookDetails(details);

        // Set pickup location (cook's location)
        setPickupLocation(
          mockPickupLocations[order.chef.id % mockPickupLocations.length]
        );

        // Set delivery location (customer's location)
        setDeliveryLocation(
          mockDeliveryLocations[order.id % mockDeliveryLocations.length]
        );
      } catch (error) {
        console.error("Failed to fetch cook details:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description:
            "Failed to load cook details. Using default information.",
        });

        // Set fallback data
        setCookDetails({
          id: order.chef.id,
          user: {
            name: order.chef.name || "Chef",
            email: "chef@example.com",
            phone: "+1234567890",
          },
          address: "123 Chef Street, City",
          restaurant_name: "Chef's Kitchen",
        });
        setPickupLocation(mockPickupLocations[0]);
        setDeliveryLocation(mockDeliveryLocations[0]);
      } finally {
        setLoadingCook(false);
      }
    };

    fetchCookDetails();
  }, [order.chef?.id, order.id]);

  // Determine current phase based on order status
  useEffect(() => {
    if (order.status === "ready") {
      setCurrentPhase("pickup");
    } else if (["out_for_delivery", "in_transit"].includes(order.status)) {
      setCurrentPhase("delivery");
      setTracking((prev) => ({
        ...prev,
        pickup: { started: true, completed: true },
      }));
    }
  }, [order.status]);

  const calculateTripMetrics = (
    destination: { lat: number; lng: number } | null
  ) => {
    if (!currentLocation || !destination) return null;

    const distance = calculateDistanceHaversine(currentLocation, destination);
    const estimatedTime = estimateTravelTime(distance, "driving");

    return { distance, estimatedTime };
  };

  const handleStartPickup = async () => {
    if (!currentLocation) {
      toast({
        variant: "destructive",
        title: "Location Required",
        description: "Please enable location access to start pickup.",
      });
      return;
    }

    try {
      await startDeliveryTracking(order.id, currentLocation);
      setTracking((prev) => ({
        ...prev,
        pickup: { ...prev.pickup, started: true },
      }));

      // Automatically start navigation to chef's kitchen location
      const pickupLocationValue = getPickupLocation(order);
      if (
        pickupLocationValue &&
        pickupLocationValue !== "Location not available"
      ) {
        // Start external navigation to pickup location
        handleGoogleNavigation("pickup");

        // Also show integrated navigation dialog for quick reference
        setTimeout(() => {
          setShowNavigationDialog(true);
        }, 1000); // Small delay to allow external navigation to open first

        toast({
          title: "Pickup Navigation Started",
          description: `External navigation opened to ${
            cookDetails?.restaurant_name || order.chef?.name || "chef's kitchen"
          }. An integrated map view is also available for quick reference.`,
        });
      } else {
        toast({
          title: "Pickup Started",
          description: `Pickup tracking started but location is not available. Please contact the chef.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start pickup tracking.",
      });
    }
  };

  const handleCompletePickup = async () => {
    try {
      // Use the new mark picked up service
      await markOrderPickedUp(
        order.id,
        "Order picked up from chef",
        currentLocation
          ? {
              lat: currentLocation.lat,
              lng: currentLocation.lng,
              address: cookDetails?.address,
            }
          : undefined
      );

      setTracking((prev) => ({
        ...prev,
        pickup: { started: true, completed: true },
      }));
      setCurrentPhase("delivery");
      onStatusUpdate(order.id, "in_transit");

      toast({
        title: "Order Picked Up",
        description: "Order has been collected. Now proceed to delivery.",
      });
    } catch (error) {
      console.error("Pickup completion error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update pickup status. Please try again.",
      });
    }
  };

  const handleStartDelivery = async () => {
    if (!currentLocation) {
      toast({
        variant: "destructive",
        title: "Location Required",
        description: "Please enable location access to start delivery.",
      });
      return;
    }

    try {
      await updateOrderStatus(
        order.id,
        "in_transit",
        currentLocation || undefined
      );

      setTracking((prev) => ({
        ...prev,
        delivery: { ...prev.delivery, started: true },
      }));
      onStatusUpdate(order.id, "in_transit");

      toast({
        title: "Delivery Started",
        description: "Navigation to customer has begun.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start delivery tracking.",
      });
    }
  };

  const handleCompleteDelivery = async () => {
    try {
      await updateOrderStatus(
        order.id,
        "delivered",
        currentLocation || undefined
      );

      setTracking((prev) => ({
        ...prev,
        delivery: { started: true, completed: true },
      }));
      onStatusUpdate(order.id, "delivered");
      onOrderComplete(order.id);

      toast({
        title: "Delivery Completed",
        description: "Order has been successfully delivered!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to complete delivery.",
      });
    }
  };

  const handleNavigate = async (destination: "pickup" | "delivery") => {
    if (!currentLocation) {
      toast({
        variant: "destructive",
        title: "Location Required",
        description: "Please enable location access for navigation.",
      });
      return;
    }

    try {
      let targetAddress = "";
      let targetLocation = null;

      if (destination === "pickup") {
        // NEW: Use pickup location from order data (kitchen_location)
        targetAddress =
          order.pickup_location ||
          order.chef?.kitchen_location ||
          cookDetails?.address ||
          "Chef location not available";
        targetLocation = pickupLocation;
      } else {
        // Use customer delivery address
        targetAddress =
          order.delivery_address || "Customer address not available";
        targetLocation = deliveryLocation;
      }

      // If we have coordinates, use them, otherwise use address
      if (targetLocation) {
        const navigationUrl = generateNavigationUrl(
          targetLocation,
          currentLocation
        );
        window.open(navigationUrl, "_blank");
      } else if (targetAddress) {
        // Use address-based navigation
        const encodedAddress = encodeURIComponent(targetAddress);
        const navigationUrl = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${encodedAddress}`;
        window.open(navigationUrl, "_blank");
      }

      toast({
        title: `Navigation Started`,
        description: `Opening directions to ${
          destination === "pickup" ? "chef location" : "customer location"
        }`,
      });
    } catch (error) {
      console.error("Navigation error:", error);
      toast({
        variant: "destructive",
        title: "Navigation Error",
        description: "Could not start navigation. Please try again.",
      });
    }
  };

  // Enhanced navigation functions
  const getPickupLocation = (order: Order) => {
    return (
      order.pickup_location ||
      order.chef?.kitchen_location ||
      "Location not available"
    );
  };

  const handleGoogleNavigation = (destination: "pickup" | "delivery") => {
    let location: string;
    let title: string;

    if (destination === "pickup") {
      location = getPickupLocation(order);
      title = `Chef ${order.chef?.name || "Kitchen"}`;
    } else {
      location = order.delivery_address || "";
      title = `Customer ${order.customer?.name || "Location"}`;
    }

    if (location && location !== "Location not available") {
      const encodedLocation = encodeURIComponent(location);
      const navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedLocation}`;
      window.open(navigationUrl, "_blank");

      toast({
        title: "Navigation Started",
        description: `Opening Google Maps for ${destination} location`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Location not available",
        description: `${destination} location is not set for this order`,
      });
    }
  };

  const pickupMetrics = calculateTripMetrics(pickupLocation);
  const deliveryMetrics = calculateTripMetrics(deliveryLocation);

  if (loadingCook) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
            <span>Loading cook details...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Order Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Order #{order.id} - Two-Stage Delivery</span>
            <Badge
              variant={currentPhase === "pickup" ? "default" : "secondary"}
            >
              {currentPhase === "pickup" ? "Pickup Phase" : "Delivery Phase"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className={`flex items-center space-x-2 p-2 rounded-lg ${
                  currentPhase === "pickup"
                    ? "bg-blue-50 border border-blue-200"
                    : "bg-green-50 border border-green-200"
                }`}
              >
                <Package
                  className={`h-4 w-4 ${
                    currentPhase === "pickup"
                      ? "text-blue-600"
                      : "text-green-600"
                  }`}
                />
                <span className="text-sm font-medium">Pickup</span>
                {tracking.pickup.completed && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>

              <ArrowRight className="h-4 w-4 text-gray-400" />

              <div
                className={`flex items-center space-x-2 p-2 rounded-lg ${
                  currentPhase === "delivery"
                    ? "bg-blue-50 border border-blue-200"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                <Truck
                  className={`h-4 w-4 ${
                    currentPhase === "delivery"
                      ? "text-blue-600"
                      : "text-gray-400"
                  }`}
                />
                <span className="text-sm font-medium">Delivery</span>
                {tracking.delivery.completed && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-lg font-semibold text-green-600">
                ${order.total_amount}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pickup Phase */}
      {currentPhase === "pickup" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ChefHat className="h-5 w-5 mr-2" />
              Pickup from Chef
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cook Details */}
            {cookDetails && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">
                      {cookDetails.restaurant_name || cookDetails.user.name}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {cookDetails.cuisine_type || "Restaurant"}
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">{cookDetails.user.name}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">
                          {cookDetails.user.phone || "No phone available"}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Home className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">{cookDetails.address}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (cookDetails.user.phone) {
                        window.open(`tel:${cookDetails.user.phone}`, "_self");
                      }
                    }}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Pickup Metrics */}
            {pickupMetrics && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <Route className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="text-sm text-gray-600">Distance</span>
                  </div>
                  <p className="font-semibold">
                    {pickupMetrics.distance.toFixed(1)} km
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <Timer className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="text-sm text-gray-600">Est. Time</span>
                  </div>
                  <p className="font-semibold">
                    {pickupMetrics.estimatedTime} min
                  </p>
                </div>
              </div>
            )}

            {/* Pickup Actions */}
            <div className="space-y-3">
              {!tracking.pickup.started ? (
                <div className="space-y-2">
                  {/* Enhanced Navigation Options */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleGoogleNavigation("pickup")}
                      variant="outline"
                      className="w-full flex items-center gap-2"
                      disabled={
                        !getPickupLocation(order) ||
                        getPickupLocation(order) === "Location not available"
                      }
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span className="text-xs">Navigate (Google)</span>
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="default"
                          className="w-full flex items-center gap-2"
                          disabled={
                            !getPickupLocation(order) ||
                            getPickupLocation(order) ===
                              "Location not available"
                          }
                        >
                          <Smartphone className="h-3 w-3" />
                          <span className="text-xs">Quick Navigate</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Navigate to Pickup Location
                          </DialogTitle>
                        </DialogHeader>
                        <IntegratedMapView
                          location={getPickupLocation(order)}
                          title={`Chef ${order.chef?.name || "Kitchen"}`}
                          userLocation={currentLocation}
                          onNavigate={() => handleGoogleNavigation("pickup")}
                        />
                        <div className="flex gap-2 mt-4">
                          <Button
                            onClick={() => handleGoogleNavigation("pickup")}
                            className="flex-1"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open in Google Maps
                          </Button>
                          {cookDetails?.user?.phone && (
                            <Button variant="outline">
                              <Phone className="h-4 w-4 mr-2" />
                              Call Chef
                            </Button>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {getPickupLocation(order) &&
                    getPickupLocation(order) !== "Location not available" && (
                      <div className="text-xs text-center text-muted-foreground bg-green-50 dark:bg-green-900/20 p-2 rounded">
                        📍 Pickup: {getPickupLocation(order)}
                      </div>
                    )}

                  <Button onClick={handleStartPickup} className="w-full">
                    <Package className="h-4 w-4 mr-2" />
                    Start Pickup Tracking
                  </Button>
                </div>
              ) : !tracking.pickup.completed ? (
                <div className="space-y-2">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-blue-500 mr-2" />
                        <span className="text-blue-700 font-medium">
                          En route to pickup location...
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setShowNavigationDialog(true)}
                          size="sm"
                          variant="outline"
                          className="text-xs"
                        >
                          <Smartphone className="h-3 w-3 mr-1" />
                          View Map
                        </Button>
                        <Button
                          onClick={() => handleGoogleNavigation("pickup")}
                          size="sm"
                          variant="outline"
                          className="text-xs"
                        >
                          <Navigation className="h-3 w-3 mr-1" />
                          Navigate
                        </Button>
                      </div>
                    </div>
                    {getPickupLocation(order) && (
                      <div className="text-xs text-blue-600 mt-2">
                        📍 {getPickupLocation(order)}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleCompletePickup}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Picked Up
                  </Button>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-green-700 font-medium">
                      Order successfully picked up! Ready for delivery.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delivery Phase */}
      {currentPhase === "delivery" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Truck className="h-5 w-5 mr-2" />
              Delivery to Customer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Customer Details */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">
                    {order.customer?.name || "Customer"}
                  </h4>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">
                        {order.customer?.phone || "No phone available"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">{order.delivery_address}</span>
                    </div>
                  </div>

                  {order.delivery_instructions && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-sm text-yellow-800">
                        <strong>Delivery Instructions:</strong>{" "}
                        {order.delivery_instructions}
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (order.customer?.phone) {
                      window.open(`tel:${order.customer.phone}`, "_self");
                    }
                  }}
                >
                  <Phone className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Delivery Metrics */}
            {deliveryMetrics && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <Route className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="text-sm text-gray-600">Distance</span>
                  </div>
                  <p className="font-semibold">
                    {deliveryMetrics.distance.toFixed(1)} km
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <Timer className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="text-sm text-gray-600">Est. Time</span>
                  </div>
                  <p className="font-semibold">
                    {deliveryMetrics.estimatedTime} min
                  </p>
                </div>
              </div>
            )}

            {/* Delivery Actions */}
            <div className="space-y-3">
              {!tracking.delivery.started ? (
                <div className="space-y-2">
                  {/* Enhanced Delivery Navigation Options */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleGoogleNavigation("delivery")}
                      variant="outline"
                      className="w-full flex items-center gap-2"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span className="text-xs">Navigate (Google)</span>
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="default"
                          className="w-full flex items-center gap-2"
                        >
                          <Smartphone className="h-3 w-3" />
                          <span className="text-xs">Quick Navigate</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Navigate to Customer
                          </DialogTitle>
                        </DialogHeader>
                        <IntegratedMapView
                          location={order.delivery_address}
                          title={`Customer ${
                            order.customer?.name || "Location"
                          }`}
                          userLocation={currentLocation}
                          onNavigate={() => handleGoogleNavigation("delivery")}
                        />
                        <div className="flex gap-2 mt-4">
                          <Button
                            onClick={() => handleGoogleNavigation("delivery")}
                            className="flex-1"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open in Google Maps
                          </Button>
                          {order.customer?.phone && (
                            <Button variant="outline">
                              <Phone className="h-4 w-4 mr-2" />
                              Call Customer
                            </Button>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <Button onClick={handleStartDelivery} className="w-full">
                    <Truck className="h-4 w-4 mr-2" />
                    Start Delivery
                  </Button>
                </div>
              ) : !tracking.delivery.completed ? (
                <div className="space-y-2">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-blue-500 mr-2" />
                      <span className="text-blue-700 font-medium">
                        En route to customer...
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={handleCompleteDelivery}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Delivered
                  </Button>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-green-700 font-medium">
                      Order successfully delivered!
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Location Display */}
      {currentLocation && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-green-500" />
                <span className="text-sm text-gray-600">Your Location:</span>
              </div>
              <span className="text-sm font-mono">
                {formatLocation(currentLocation, 4)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Auto-opened Navigation Dialog after pickup tracking starts */}
      <Dialog
        open={showNavigationDialog}
        onOpenChange={setShowNavigationDialog}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-blue-600" />
              Pickup Navigation Active
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                External navigation to{" "}
                <strong>{order.chef?.name || "Chef"}'s kitchen</strong> has been
                opened. Use the integrated map below for quick reference or to
                re-open navigation.
              </p>
            </div>

            <IntegratedMapView
              location={getPickupLocation(order)}
              title={`Chef ${order.chef?.name || "Kitchen"}`}
              userLocation={currentLocation}
              onNavigate={() => handleGoogleNavigation("pickup")}
            />

            <div className="flex gap-2">
              <Button
                onClick={() => handleGoogleNavigation("pickup")}
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Re-open in Google Maps
              </Button>
              {cookDetails?.user?.phone && (
                <Button variant="outline" className="flex-1">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Chef
                </Button>
              )}
            </div>

            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNavigationDialog(false)}
              >
                Close & Continue to Pickup Location
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PickupDeliveryFlow;
