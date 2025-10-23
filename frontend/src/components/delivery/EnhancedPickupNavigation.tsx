import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  User,
  ExternalLink,
  Map,
  Smartphone,
  Route,
  Phone,
  ChefHat,
} from "lucide-react";
import { Order } from "@/types/orderType";
import { generateNavigationUrl } from "@/utils/mapUtils";
import IntegratedMapView from "@/components/maps/IntegratedMapView";

interface EnhancedPickupNavigationProps {
  orders: Order[];
}

interface IntegratedMapProps {
  location: string;
  coordinates?: { lat: number; lng: number };
  title: string;
}

const EnhancedPickupNavigation: React.FC<EnhancedPickupNavigationProps> = ({
  orders,
}) => {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Get user location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Could not get user location:", error);
        }
      );
    }
  }, []);

  // Filter orders that are ready for pickup/delivery
  const deliveryOrders = orders.filter((order) =>
    ["ready", "out_for_delivery", "in_transit"].includes(order.status)
  );

  const handleGoogleNavigation = (
    order: Order,
    destination: "pickup" | "delivery"
  ) => {
    let location: string;
    let title: string;

    if (destination === "pickup") {
      location = order.pickup_location || order.chef?.kitchen_location || "";
      title = `Chef ${order.chef?.name || "Kitchen"}`;
    } else {
      location = order.delivery_address || "";
      title = `Customer ${order.customer?.name || "Location"}`;
    }

    if (location) {
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

  const handleQuickNavigation = (
    order: Order,
    destination: "pickup" | "delivery"
  ) => {
    setSelectedOrder(order);
  };

  const getPickupLocation = (order: Order) => {
    return (
      order.pickup_location ||
      order.chef?.kitchen_location ||
      "Location not available"
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">
          🚚 Enhanced Pickup Navigation
        </h2>
        <p className="text-muted-foreground">
          Choose between Google Maps navigation or integrated quick navigation
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        {deliveryOrders.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center p-8">
              <div className="text-center">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No delivery orders available
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          deliveryOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Order #{order.order_number}
                  </CardTitle>
                  <Badge
                    variant={
                      order.status === "ready"
                        ? "default"
                        : order.status === "out_for_delivery"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {order.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Chef & Pickup Information */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <ChefHat className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">
                      Chef: {order.chef?.name || "Unknown"}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-sm font-medium block">
                        Pickup Location:
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {getPickupLocation(order)}
                      </span>
                    </div>
                  </div>

                  {/* Navigation Options */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGoogleNavigation(order, "pickup")}
                      disabled={
                        !getPickupLocation(order) ||
                        getPickupLocation(order) === "Location not available"
                      }
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span className="text-xs">Navigate (Google)</span>
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="default"
                          size="sm"
                          disabled={
                            !getPickupLocation(order) ||
                            getPickupLocation(order) ===
                              "Location not available"
                          }
                          className="flex items-center gap-2"
                          onClick={() => handleQuickNavigation(order, "pickup")}
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
                          userLocation={userLocation}
                          onNavigate={() =>
                            handleGoogleNavigation(order, "pickup")
                          }
                        />
                        <div className="flex gap-2 mt-4">
                          <Button
                            onClick={() =>
                              handleGoogleNavigation(order, "pickup")
                            }
                            className="flex-1"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open in Google Maps
                          </Button>
                          {order.chef?.phone_no && (
                            <Button variant="outline">
                              <Phone className="h-4 w-4 mr-2" />
                              Call Chef
                            </Button>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Customer & Delivery Information */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-green-600" />
                    <span className="font-medium">
                      Customer: {order.customer?.name || "Customer"}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-sm font-medium block">
                        Delivery Address:
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {order.delivery_address}
                      </span>
                    </div>
                  </div>

                  {order.delivery_instructions && (
                    <div className="text-sm">
                      <span className="font-medium">Instructions:</span>{" "}
                      <span className="text-muted-foreground">
                        {order.delivery_instructions}
                      </span>
                    </div>
                  )}

                  {/* Delivery Navigation Options */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGoogleNavigation(order, "delivery")}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span className="text-xs">Navigate (Google)</span>
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="default"
                          size="sm"
                          className="flex items-center gap-2"
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
                          userLocation={userLocation}
                          onNavigate={() =>
                            handleGoogleNavigation(order, "delivery")
                          }
                        />
                        <div className="flex gap-2 mt-4">
                          <Button
                            onClick={() =>
                              handleGoogleNavigation(order, "delivery")
                            }
                            className="flex-1"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open in Google Maps
                          </Button>
                          {order.customer?.phone_no && (
                            <Button variant="outline">
                              <Phone className="h-4 w-4 mr-2" />
                              Call Customer
                            </Button>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Order Details */}
                <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>${order.total_amount}</span>
                  </div>
                  <span>{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Feature Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">
              ✨ Enhanced Navigation Features
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Two navigation options for optimal delivery experience
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ExternalLink className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-600">
                    Google Navigation
                  </span>
                </div>
                <p className="text-muted-foreground">
                  Opens Google Maps in a new tab with turn-by-turn directions
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-600">
                    Quick Navigate
                  </span>
                </div>
                <p className="text-muted-foreground">
                  Integrated map view with quick access to directions and
                  contact options
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedPickupNavigation;
