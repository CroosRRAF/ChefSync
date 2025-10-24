import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChefHat,
  Truck,
  MapPin,
  ArrowRight,
  Clock,
  Navigation,
  CheckCircle,
  Package,
} from "lucide-react";
import type { Order } from "../../types/orderType";
import TwoPhaseDeliveryDialog from "./TwoPhaseDeliveryDialog";

interface DeliveryPhaseCardProps {
  order: Order;
  onNavigateToMap?: (order: Order) => void;
  className?: string;
  style?: React.CSSProperties;
}

const DeliveryPhaseCard: React.FC<DeliveryPhaseCardProps> = ({
  order,
  onNavigateToMap,
  className,
  style,
}) => {
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);

  const getPhaseInfo = (status: Order["status"]) => {
    switch (status) {
      case "ready":
        return {
          phase: "pickup",
          title: "Ready for Pickup",
          description: "Go to chef to collect the order",
          icon: ChefHat,
          color: "bg-orange-500",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          textColor: "text-orange-700",
        };
      case "out_for_delivery":
        return {
          phase: "transit",
          title: "Picked Up - Ready for Delivery",
          description: "Order collected, now deliver to customer",
          icon: Package,
          color: "bg-blue-500",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          textColor: "text-blue-700",
        };
      case "in_transit":
        return {
          phase: "delivery",
          title: "Out for Delivery",
          description: "En route to customer location",
          icon: Truck,
          color: "bg-purple-500",
          bgColor: "bg-purple-50",
          borderColor: "border-purple-200",
          textColor: "text-purple-700",
        };
      default:
        return {
          phase: "unknown",
          title: "Order Status",
          description: "Check order details",
          icon: MapPin,
          color: "bg-gray-500",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          textColor: "text-gray-700",
        };
    }
  };

  const phaseInfo = getPhaseInfo(order.status);
  const Icon = phaseInfo.icon;

  const handleStartDelivery = () => {
    setShowDeliveryDialog(true);
  };

  const handleStartPickup = (order: Order) => {
    // Navigate to map for pickup
    if (onNavigateToMap) {
      onNavigateToMap(order);
    }
  };

  const handleStartDeliveryPhase = (order: Order) => {
    // Navigate to map for delivery
    if (onNavigateToMap) {
      onNavigateToMap(order);
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
        {/* Phase Flow */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                order.status === "ready"
                  ? "bg-orange-100 text-orange-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              <ChefHat className="h-3 w-3" />
              <span>Pickup</span>
              {order.status !== "ready" && <CheckCircle className="h-3 w-3" />}
            </div>

            <ArrowRight className="h-3 w-3 text-gray-400" />

            <div
              className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                ["out_for_delivery", "in_transit"].includes(order.status)
                  ? "bg-blue-100 text-blue-700"
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
              ${order.total_amount}
            </p>
          </div>
        </div>

        {/* Order Info */}
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <MapPin className="h-3 w-3 mr-2 text-gray-500" />
            <span className="text-gray-600 truncate">
              {phaseInfo.phase === "pickup"
                ? `${order.chef?.name || "Chef"}'s Kitchen`
                : order.delivery_address || "Customer Address"}
            </span>
          </div>

          <div className="flex items-center text-sm">
            <Clock className="h-3 w-3 mr-2 text-gray-500" />
            <span className="text-gray-600">
              {new Date(order.created_at).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Action Button */}
        {onNavigateToMap && (
          <Button onClick={handleStartDelivery} className="w-full" size="sm">
            <Navigation className="h-4 w-4 mr-2" />
            {phaseInfo.phase === "pickup"
              ? "Start Delivery Process"
              : phaseInfo.phase === "transit"
              ? "Start Delivery"
              : "Continue Delivery"}
          </Button>
        )}

        {/* Status Description */}
        <p className={`text-xs ${phaseInfo.textColor} text-center`}>
          {phaseInfo.description}
        </p>
      </CardContent>

      {/* Two Phase Delivery Dialog */}
      <TwoPhaseDeliveryDialog
        isOpen={showDeliveryDialog}
        onClose={() => setShowDeliveryDialog(false)}
        order={order}
        onStartPickup={handleStartPickup}
        onStartDelivery={handleStartDeliveryPhase}
      />
    </Card>
  );
};

export default DeliveryPhaseCard;
