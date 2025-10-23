import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Clock, User } from "lucide-react";
import { Order } from "@/types/orderType";

interface PickupLocationDemoProps {
  orders: Order[];
}

const PickupLocationDemo: React.FC<PickupLocationDemoProps> = ({ orders }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Filter orders that are ready for pickup/delivery
  const deliveryOrders = orders.filter((order) =>
    ["ready", "out_for_delivery", "in_transit"].includes(order.status)
  );

  const handleNavigateToPickup = (order: Order) => {
    const pickupLocation =
      order.pickup_location || order.chef?.kitchen_location;
    if (pickupLocation) {
      // Open navigation to pickup location
      const encodedLocation = encodeURIComponent(pickupLocation);
      const navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedLocation}`;
      window.open(navigationUrl, "_blank");
    }
  };

  const handleNavigateToDelivery = (order: Order) => {
    if (order.delivery_address) {
      // Open navigation to delivery address
      const encodedAddress = encodeURIComponent(order.delivery_address);
      const navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
      window.open(navigationUrl, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">
          🚚 Pickup & Delivery Navigator
        </h2>
        <p className="text-muted-foreground">
          Now delivery partners can easily find chef locations for pickup!
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
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">
                      Chef: {order.chef?.name || "Unknown"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">
                      <strong>Pickup Location:</strong>{" "}
                      {order.pickup_location ||
                        order.chef?.kitchen_location ||
                        "Location not available"}
                    </span>
                  </div>
                  {order.chef?.specialty && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Specialty: {order.chef.specialty}
                      </span>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => handleNavigateToPickup(order)}
                    disabled={
                      !order.pickup_location && !order.chef?.kitchen_location
                    }
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Navigate to Pickup
                  </Button>
                </div>

                {/* Customer & Delivery Information */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-green-600" />
                    <span className="font-medium">
                      Customer: {order.customer?.name || "Customer"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span className="text-sm">
                      <strong>Delivery Address:</strong>{" "}
                      {order.delivery_address}
                    </span>
                  </div>
                  {order.delivery_instructions && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Instructions:</strong>{" "}
                      {order.delivery_instructions}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => handleNavigateToDelivery(order)}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Navigate to Customer
                  </Button>
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

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">
              ✅ Feature Successfully Implemented!
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Delivery partners can now access chef kitchen locations for easy
              pickup navigation.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                <div className="font-medium text-blue-600">
                  📍 Pickup Location
                </div>
                <div>Available via order.pickup_location</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                <div className="font-medium text-green-600">
                  🏠 Chef Kitchen
                </div>
                <div>Available via order.chef.kitchen_location</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                <div className="font-medium text-purple-600">🧭 Navigation</div>
                <div>One-click Google Maps integration</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PickupLocationDemo;
