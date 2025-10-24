import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  MapPin,
  ChefHat,
  User,
  AlertTriangle,
  Navigation,
  Clock,
  Package,
} from "lucide-react";
import type { Order } from "../../types/orderType";

interface TwoPhaseDeliveryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onStartPickup: (order: Order) => void;
  onStartDelivery: (order: Order) => void;
}

const TwoPhaseDeliveryDialog: React.FC<TwoPhaseDeliveryDialogProps> = ({
  isOpen,
  onClose,
  order,
  onStartPickup,
  onStartDelivery,
}) => {
  // Determine if order is already picked up
  const isPickedUp =
    order?.status === "out_for_delivery" || order?.status === "in_transit";

  const [currentPhase, setCurrentPhase] = useState<"pickup" | "delivery">(
    isPickedUp ? "delivery" : "pickup"
  );

  if (!order) return null;

  const hasKitchenLocation =
    order.chef?.kitchen_location || order.pickup_location;
  const hasDeliveryLocation = order.delivery_address;
  const chefPhone = order.chef?.phone_no;
  const customerPhone = order.customer?.phone_no || order.customer?.phone;

  const handlePhaseStart = () => {
    if (currentPhase === "pickup") {
      if (!hasKitchenLocation) {
        // Show chef calling prompt instead of starting pickup
        return;
      }
      onStartPickup(order);
      onClose();
    } else {
      if (!hasDeliveryLocation) {
        // Show customer calling prompt instead of starting delivery
        return;
      }
      onStartDelivery(order);
      onClose();
    }
  };

  const handleCallChef = () => {
    if (chefPhone) {
      window.open(`tel:${chefPhone}`, "_self");
    }
  };

  const handleCallCustomer = () => {
    if (customerPhone) {
      window.open(`tel:${customerPhone}`, "_self");
    }
  };

  const getPhaseContent = () => {
    if (currentPhase === "pickup") {
      return {
        title: "Phase 1: Pickup from Kitchen",
        description: "Collect the order from the chef's kitchen",
        icon: ChefHat,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        location: hasKitchenLocation
          ? order.chef?.kitchen_location || order.pickup_location
          : "Kitchen location not available",
        contactPerson: order.chef?.name || "Chef",
        contactPhone: chefPhone,
        hasLocation: hasKitchenLocation,
        actionText: "Start Pickup",
        chefDetails: {
          name: order.chef?.name,
          specialty: order.chef?.specialty,
          email: order.chef?.email,
          rating: order.chef?.rating_avg,
        },
      };
    } else {
      return {
        title: "Phase 2: Delivery to Customer",
        description: "Deliver the order to the customer's address",
        icon: Package,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        location: hasDeliveryLocation
          ? order.delivery_address
          : "Delivery address not available",
        contactPerson: order.customer?.name || "Customer",
        contactPhone: customerPhone,
        hasLocation: hasDeliveryLocation,
        actionText: "Start Delivery",
      };
    }
  };

  const phaseContent = getPhaseContent();
  const Icon = phaseContent.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Icon className={`h-5 w-5 ${phaseContent.color}`} />
            <span>Order #{order.id}</span>
          </DialogTitle>
          <DialogDescription>
            {isPickedUp
              ? "Ready for delivery to customer"
              : "Two-phase delivery process"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Phase Selector - Only show if order is not picked up */}
          {!isPickedUp && (
            <div className="flex space-x-2">
              <Button
                variant={currentPhase === "pickup" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPhase("pickup")}
                className="flex-1"
              >
                <ChefHat className="h-4 w-4 mr-2" />
                Pickup
              </Button>
              <Button
                variant={currentPhase === "delivery" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPhase("delivery")}
                className="flex-1"
              >
                <Package className="h-4 w-4 mr-2" />
                Delivery
              </Button>
            </div>
          )}

          {/* Order Status Banner for Picked Up Orders */}
          {isPickedUp && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Order Already Picked Up
                </span>
              </div>
              <p className="text-xs text-green-700 mt-1">
                Ready for delivery to customer
              </p>
            </div>
          )}

          {/* Phase Content */}
          <div
            className={`p-4 rounded-lg ${phaseContent.bgColor} ${phaseContent.borderColor} border`}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div
                className={`p-2 rounded-full bg-white ${phaseContent.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {phaseContent.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {phaseContent.description}
                </p>
              </div>
            </div>

            {/* Location Info */}
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Location:</p>
                  <p className="text-sm text-gray-600">
                    {phaseContent.location}
                  </p>
                  {!phaseContent.hasLocation && (
                    <div className="flex items-center space-x-1 mt-1">
                      <AlertTriangle className="h-3 w-3 text-amber-500" />
                      <span className="text-xs text-amber-600">
                        Location missing
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Chef Details (only show in pickup phase) */}
              {currentPhase === "pickup" && phaseContent.chefDetails && (
                <div className="flex items-start space-x-3">
                  <ChefHat className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">
                      Chef Details:
                    </p>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600 font-medium">
                        {phaseContent.chefDetails.name}
                      </p>
                      {phaseContent.chefDetails.specialty && (
                        <p className="text-xs text-gray-500">
                          Specialty: {phaseContent.chefDetails.specialty}
                        </p>
                      )}
                      {phaseContent.chefDetails.rating && (
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-yellow-600">⭐</span>
                          <span className="text-xs text-gray-600">
                            {phaseContent.chefDetails.rating.toFixed(1)} rating
                          </span>
                        </div>
                      )}
                      {phaseContent.chefDetails.email && (
                        <p className="text-xs text-gray-500">
                          {phaseContent.chefDetails.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Info */}
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Contact:</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-600">
                      {phaseContent.contactPerson}
                    </p>
                    {phaseContent.contactPhone && (
                      <Badge variant="outline" className="text-xs">
                        {phaseContent.contactPhone}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">
                    Order Time:
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {phaseContent.hasLocation ? (
              <Button onClick={handlePhaseStart} className="w-full" size="lg">
                <Navigation className="h-4 w-4 mr-2" />
                {phaseContent.actionText}
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">
                      Location Not Available
                    </span>
                  </div>
                  <p className="text-xs text-amber-700">
                    {currentPhase === "pickup"
                      ? "Kitchen location is missing. Please call the chef to get directions."
                      : "Delivery address is missing. Please call the customer to confirm the address."}
                  </p>
                </div>

                {phaseContent.contactPhone ? (
                  <Button
                    onClick={
                      currentPhase === "pickup"
                        ? handleCallChef
                        : handleCallCustomer
                    }
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call {phaseContent.contactPerson}
                  </Button>
                ) : (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800">
                        No Contact Information
                      </span>
                    </div>
                    <p className="text-xs text-red-700 mt-1">
                      {currentPhase === "pickup"
                        ? "Chef's phone number is not available. Please contact support."
                        : "Customer's phone number is not available. Please contact support."}
                    </p>
                  </div>
                )}
              </div>
            )}

            <Button onClick={onClose} variant="ghost" className="w-full">
              Cancel
            </Button>
          </div>

          {/* Order Summary */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Order Total:</span>
              <span className="font-semibold text-green-600">
                LKR {order.total_amount}
              </span>
            </div>
            {order.delivery_instructions && (
              <div className="mt-2">
                <span className="text-xs text-gray-500">Instructions:</span>
                <p className="text-xs text-gray-600 mt-1">
                  {order.delivery_instructions}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TwoPhaseDeliveryDialog;
