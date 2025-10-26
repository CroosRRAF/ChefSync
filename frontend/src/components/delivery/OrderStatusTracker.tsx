import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  Package,
  Truck,
  MapPin,
  Clock,
  Navigation,
  Phone,
  MessageSquare,
  Camera,
} from "lucide-react";
import { updateOrderStatus } from "@/services/service";
import type { Order } from "../../types/orderType";

interface OrderStatusTrackerProps {
  order: Order;
  currentLocation?: { lat: number; lng: number } | null;
  onStatusUpdate: (orderId: number, newStatus: string) => void;
  onNavigate: (order: Order) => void;
}

const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({
  order,
  currentLocation,
  onStatusUpdate,
  onNavigate,
}) => {
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [nextStatus, setNextStatus] = useState<string>("");

  const getStatusSteps = (currentStatus: string) => {
    const steps = [
      { status: "ready", label: "Order Ready", icon: Package, completed: true },
      {
        status: "out_for_delivery",
        label: "Picked Up",
        icon: CheckCircle,
        completed: false,
      },
      {
        status: "in_transit",
        label: "In Transit",
        icon: Truck,
        completed: false,
      },
      {
        status: "delivered",
        label: "Delivered",
        icon: MapPin,
        completed: false,
      },
    ];

    const statusOrder = [
      "ready",
      "out_for_delivery",
      "in_transit",
      "delivered",
    ];
    const currentIndex = statusOrder.indexOf(currentStatus);

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex,
    }));
  };

  const getNextAction = (status: string) => {
    switch (status) {
      case "ready":
        return {
          action: "out_for_delivery",
          label: "Mark as Picked Up",
          icon: Package,
        };
      case "out_for_delivery":
        return { action: "in_transit", label: "Start Delivery", icon: Truck };
      case "in_transit":
        return {
          action: "delivered",
          label: "Mark as Delivered",
          icon: CheckCircle,
        };
      default:
        return null;
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    try {
      await updateOrderStatus(
        order.id,
        newStatus as any,
        currentLocation || undefined
      );
      onStatusUpdate(order.id, newStatus);

      const statusLabels = {
        out_for_delivery: "Picked Up",
        in_transit: "In Transit",
        delivered: "Delivered",
      };

      toast({
        title: "Status Updated",
        description: `Order #${order.id} marked as ${
          statusLabels[newStatus as keyof typeof statusLabels] || newStatus
        }`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update order status. Please try again.",
      });
    } finally {
      setUpdating(false);
      setShowConfirmDialog(false);
    }
  };

  const confirmStatusUpdate = (status: string) => {
    setNextStatus(status);
    setShowConfirmDialog(true);
  };

  const steps = getStatusSteps(order.status);
  const nextAction = getNextAction(order.status);

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        {/* Order Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Order #{order.id}</h3>
            <p className="text-sm text-gray-600">
              {order.customer?.name || "Unknown Customer"}
            </p>
          </div>
          <Badge
            variant={order.status === "delivered" ? "default" : "secondary"}
          >
            {order.status.replace("_", " ").toUpperCase()}
          </Badge>
        </div>

        {/* Status Steps */}
        <div className="space-y-4 mb-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.status} className="flex items-center space-x-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.completed
                      ? "bg-green-500 text-white"
                      : step.current
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      step.completed
                        ? "text-green-600"
                        : step.current
                        ? "text-blue-600"
                        : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </p>
                  {step.current && (
                    <p className="text-xs text-gray-500">Current status</p>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-px h-8 ${
                      step.completed ? "bg-green-300" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Navigation Button */}
          <Button
            onClick={() => onNavigate(order)}
            variant="outline"
            className="w-full"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Navigate to Customer
          </Button>

          {/* Next Status Button */}
          {nextAction && order.status !== "delivered" && (
            <Button
              onClick={() => confirmStatusUpdate(nextAction.action)}
              disabled={updating}
              className="w-full"
            >
              {updating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <nextAction.icon className="h-4 w-4 mr-2" />
                  {nextAction.label}
                </>
              )}
            </Button>
          )}

          {/* Communication Buttons */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                if (order.customer?.phone) {
                  window.open(`tel:${order.customer.phone}`, "_self");
                }
              }}
            >
              <Phone className="h-4 w-4 mr-1" />
              Call
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <MessageSquare className="h-4 w-4 mr-1" />
              Message
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Camera className="h-4 w-4 mr-1" />
              Photo
            </Button>
          </div>
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Status Update</DialogTitle>
              <DialogDescription>
                Are you sure you want to update the order status to{" "}
                {nextStatus?.replace("_", " ")}?
                {nextStatus === "delivered" && " This action cannot be undone."}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleStatusUpdate(nextStatus)}
                disabled={updating}
              >
                {updating ? "Updating..." : "Confirm"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default OrderStatusTracker;
