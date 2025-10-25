import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  ChefHat,
  Truck,
  MapPin,
  CheckCircle,
  Clock,
  Navigation,
  Package,
  Phone,
  User,
} from "lucide-react";
import type { Order } from "../../types/orderType";
import { updateOrderStatus } from "@/services/service";
import ContactCard from "./ContactCard";

interface SimplifiedDeliveryFlowProps {
  order: Order;
  onStatusUpdate?: (orderId: number, newStatus: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

const SimplifiedDeliveryFlow: React.FC<SimplifiedDeliveryFlowProps> = ({
  order,
  onStatusUpdate,
  className,
  style,
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Get current location helper
  const getCurrentLocation = (): Promise<GeolocationPosition> => {
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

  // Get the current phase and next action based on order status
  const getDeliveryPhase = (status: Order["status"]) => {
    switch (status) {
      case "ready":
        return {
          phase: "accept",
          title: "Ready for Pickup",
          nextAction: "Navigate to Chef",
          nextStatus: "out_for_delivery" as const,
          description: "Click to start pickup and get directions to chef",
          icon: Package,
          color: "bg-blue-500",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          textColor: "text-blue-700",
          showContact: "chef",
          location:
            order.chef?.kitchen_location ||
            order.pickup_location ||
            "Kitchen location",
        };
      case "out_for_delivery":
        return {
          phase: "pickup",
          title: "Navigate to Chef",
          nextAction: "Mark as Picked Up",
          nextStatus: "in_transit" as const,
          description: "Mark as picked up to navigate to customer",
          icon: ChefHat,
          color: "bg-orange-500",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          textColor: "text-orange-700",
          showContact: "chef",
          location:
            order.chef?.kitchen_location ||
            order.pickup_location ||
            "Kitchen location",
        };
      case "in_transit":
        return {
          phase: "delivery",
          title: "Navigate to Customer",
          nextAction: "Mark as Delivered",
          nextStatus: "delivered" as const,
          description: "Mark as delivered to complete the order",
          icon: Truck,
          color: "bg-green-500",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          textColor: "text-green-700",
          showContact: "customer",
          location: order.delivery_address || "Customer address",
        };
      default:
        return {
          phase: "completed",
          title: "Order Completed",
          nextAction: "Completed",
          nextStatus: "delivered" as const,
          description: "This order has been completed",
          icon: CheckCircle,
          color: "bg-gray-500",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          textColor: "text-gray-700",
          showContact: "none",
          location: "Order completed",
        };
    }
  };

  const phaseInfo = getDeliveryPhase(order.status);
  const Icon = phaseInfo.icon;

  // Handle the main action button click
  const handleMainAction = async () => {
    if (phaseInfo.phase === "completed") return;

    setLoading(true);
    try {
      let location;

      // Try to get current location for tracking
      try {
        const position = await getCurrentLocation();
        location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
      } catch (locationError) {
        console.warn("Could not get current location:", locationError);
      }

      // Handle accept phase - navigate to pickup immediately
      if (phaseInfo.phase === "accept") {
        // Update status to out_for_delivery and navigate to pickup
        await updateOrderStatus(order.id, phaseInfo.nextStatus, location);

        // Navigate to pickup location
        const pickupLocation =
          order.chef?.kitchen_location || order.pickup_location;
        if (pickupLocation) {
          const encodedLocation = encodeURIComponent(pickupLocation);
          const navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedLocation}`;
          window.open(navigationUrl, "_blank");
        }

        toast({
          title: "Navigating to Chef!",
          description: "Opening directions to pickup location.",
        });
      }

      // Handle pickup complete - navigate to delivery
      else if (phaseInfo.phase === "pickup") {
        await updateOrderStatus(order.id, phaseInfo.nextStatus, location);

        // Automatically navigate to delivery location
        if (order.delivery_address) {
          const encodedAddress = encodeURIComponent(order.delivery_address);
          const navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
          window.open(navigationUrl, "_blank");
        }

        toast({
          title: "Pickup Complete!",
          description:
            "Order picked up successfully. Now navigate to customer.",
        });
      }

      // Handle delivery complete
      else if (phaseInfo.phase === "delivery") {
        await updateOrderStatus(order.id, phaseInfo.nextStatus, location);

        toast({
          title: "Delivery Complete!",
          description: "Order has been successfully delivered.",
        });
      }

      // Notify parent component of status change
      if (onStatusUpdate) {
        onStatusUpdate(order.id, phaseInfo.nextStatus);
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      className={`${phaseInfo.bgColor} ${
        phaseInfo.borderColor
      } hover:shadow-md transition-all duration-300 ${className || ""}`}
      style={style}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center">
            <div className={`${phaseInfo.color} rounded-full p-2 mr-3`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            Order #{order.id}
          </CardTitle>
          <Badge
            variant="outline"
            className={`${phaseInfo.textColor} border-current`}
          >
            {phaseInfo.title}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                ["out_for_delivery", "in_transit", "delivered"].includes(
                  order.status
                )
                  ? "bg-green-100 text-green-700"
                  : "bg-orange-100 text-orange-700"
              }`}
            >
              <ChefHat className="h-3 w-3" />
              <span>Pickup</span>
              {["out_for_delivery", "in_transit", "delivered"].includes(
                order.status
              ) && <CheckCircle className="h-3 w-3" />}
            </div>

            <div className="h-px bg-gray-300 w-4"></div>

            <div
              className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                ["in_transit", "delivered"].includes(order.status)
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              <Truck className="h-3 w-3" />
              <span>Delivery</span>
              {order.status === "delivered" && (
                <CheckCircle className="h-3 w-3" />
              )}
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold text-green-600">
              LKR {order.total_amount}
            </p>
          </div>
        </div>

        {/* Current Location Info */}
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <MapPin className="h-3 w-3 mr-2 text-gray-500" />
            <span className="text-gray-600 truncate">{phaseInfo.location}</span>
          </div>

          <div className="flex items-center text-sm">
            <Clock className="h-3 w-3 mr-2 text-gray-500" />
            <span className="text-gray-600">
              {new Date(order.created_at).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Contact Information */}
        {phaseInfo.showContact !== "none" && (
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Contact Details
            </div>

            {phaseInfo.showContact === "chef" && order.chef && (
              <div className="space-y-2">
                <ContactCard
                  type="chef"
                  contact={order.chef}
                  showLocation={true}
                  className="ring-2 ring-orange-300 shadow-md"
                />
                <div className="text-xs text-orange-700 bg-orange-50 p-2 rounded border border-orange-200 text-center">
                  <span className="font-medium">Pickup Phase:</span> Contact
                  chef for order collection
                </div>
              </div>
            )}

            {phaseInfo.showContact === "customer" && order.customer && (
              <div className="space-y-2">
                <ContactCard
                  type="customer"
                  contact={order.customer}
                  className="ring-2 ring-blue-300 shadow-md"
                />
                <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-200 text-center">
                  <span className="font-medium">Delivery Phase:</span> Contact
                  customer for delivery coordination
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {phaseInfo.phase !== "completed" && (
          <div className="space-y-2">
            <Button
              onClick={handleMainAction}
              disabled={loading}
              className={`w-full ${
                phaseInfo.phase === "accept"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : ""
              }`}
              size="sm"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4 mr-2" />
                  {phaseInfo.nextAction}
                </>
              )}
            </Button>

            {/* Show navigate button for pickup phase */}
            {phaseInfo.phase === "pickup" && (
              <Button
                onClick={() => {
                  const pickupLocation =
                    order.chef?.kitchen_location || order.pickup_location;
                  if (pickupLocation) {
                    const encodedLocation = encodeURIComponent(pickupLocation);
                    const navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedLocation}`;
                    window.open(navigationUrl, "_blank");
                  }
                }}
                variant="outline"
                className="w-full"
                size="sm"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Get Directions to Chef
              </Button>
            )}

            {/* Show navigate button for delivery phase */}
            {phaseInfo.phase === "delivery" && (
              <Button
                onClick={() => {
                  if (order.delivery_address) {
                    const encodedAddress = encodeURIComponent(
                      order.delivery_address
                    );
                    const navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
                    window.open(navigationUrl, "_blank");
                  }
                }}
                variant="outline"
                className="w-full"
                size="sm"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Get Directions to Customer
              </Button>
            )}
          </div>
        )}

        {/* Status Description */}
        <p className={`text-xs ${phaseInfo.textColor} text-center`}>
          {phaseInfo.description}
        </p>
      </CardContent>
    </Card>
  );
};

export default SimplifiedDeliveryFlow;
