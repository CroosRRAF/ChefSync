import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Navigation,
  Clock,
  Truck,
  CheckCircle,
  Camera,
  MessageSquare,
  Phone,
  AlertTriangle,
} from "lucide-react";
import {
  calculateDistanceHaversine,
  estimateTravelTime,
  formatLocation,
  isWithinDeliveryRadius,
} from "@/utils/mapUtils";
import {
  startDeliveryTracking,
  updateDeliveryProgress,
  completeDelivery,
} from "@/services/deliveryService";
import type { Order } from "../../types/orderType";

interface DeliveryTrackerProps {
  order: Order;
  currentLocation: { lat: number; lng: number } | null;
  destinationLocation: { lat: number; lng: number } | null;
  onDeliveryComplete: (orderId: number) => void;
}

const DeliveryTracker: React.FC<DeliveryTrackerProps> = ({
  order,
  currentLocation,
  destinationLocation,
  onDeliveryComplete,
}) => {
  const { toast } = useToast();
  const [trackingActive, setTrackingActive] = useState(false);
  const [deliveryStarted, setDeliveryStarted] = useState(false);
  const [atDestination, setAtDestination] = useState(false);
  const [deliveryProgress, setDeliveryProgress] = useState(0);
  const [estimatedArrival, setEstimatedArrival] = useState<string | null>(null);
  const [distanceRemaining, setDistanceRemaining] = useState<number | null>(
    null
  );

  // Calculate delivery metrics when location updates
  useEffect(() => {
    if (currentLocation && destinationLocation) {
      const distance = calculateDistanceHaversine(
        currentLocation,
        destinationLocation
      );
      const travelTime = estimateTravelTime(distance, "driving");
      const isNearby = isWithinDeliveryRadius(
        currentLocation,
        destinationLocation,
        0.1
      );

      setDistanceRemaining(distance);
      setAtDestination(isNearby);

      if (deliveryStarted && !isNearby) {
        // Calculate estimated arrival
        const arrivalTime = new Date(Date.now() + travelTime * 60000);
        setEstimatedArrival(arrivalTime.toLocaleTimeString());

        // Update progress based on distance (rough approximation)
        const maxDistance = 10; // Assume max 10km delivery distance
        const progress = Math.max(
          0,
          Math.min(100, ((maxDistance - distance) / maxDistance) * 100)
        );
        setDeliveryProgress(progress);
      }
    }
  }, [currentLocation, destinationLocation, deliveryStarted]);

  const handleStartDelivery = async () => {
    if (!currentLocation) {
      toast({
        variant: "destructive",
        title: "Location Required",
        description:
          "Please enable location access to start delivery tracking.",
      });
      return;
    }

    try {
      await startDeliveryTracking(order.id, currentLocation);
      setDeliveryStarted(true);
      setTrackingActive(true);

      toast({
        title: "Delivery Started",
        description: `Tracking started for Order #${order.id}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start delivery tracking.",
      });
    }
  };

  const handleUpdateProgress = async () => {
    if (!currentLocation) return;

    try {
      const status = atDestination
        ? "at_location"
        : distanceRemaining && distanceRemaining < 1
        ? "nearby"
        : "en_route";

      await updateDeliveryProgress(order.id, {
        currentLocation,
        estimatedArrival: estimatedArrival || undefined,
        distanceRemaining: distanceRemaining || undefined,
        status,
      });

      toast({
        title: "Progress Updated",
        description: "Customer has been notified of your location.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update delivery progress.",
      });
    }
  };

  const handleCompleteDelivery = async () => {
    if (!currentLocation) return;

    try {
      await completeDelivery(order.id, {
        location: currentLocation,
        completionTime: new Date().toISOString(),
        deliveryNotes: "Delivered successfully",
      });

      setTrackingActive(false);
      onDeliveryComplete(order.id);

      toast({
        title: "Delivery Completed",
        description: `Order #${order.id} has been marked as delivered.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to complete delivery.",
      });
    }
  };

  const getProgressColor = () => {
    if (atDestination) return "bg-green-500";
    if (deliveryProgress > 70) return "bg-blue-500";
    if (deliveryProgress > 30) return "bg-yellow-500";
    return "bg-gray-500";
  };

  const getStatusBadge = () => {
    if (atDestination) {
      return (
        <Badge className="bg-green-500">
          <MapPin className="h-3 w-3 mr-1" />
          At Destination
        </Badge>
      );
    }
    if (deliveryStarted) {
      return (
        <Badge className="bg-blue-500">
          <Truck className="h-3 w-3 mr-1" />
          En Route
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" />
        Ready to Start
      </Badge>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Delivery Tracking</span>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Order Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Order #{order.id}</h4>
          <p className="text-sm text-gray-600 mb-1">
            Customer: {order.customer?.name || "Unknown"}
          </p>
          <p className="text-sm text-gray-600">
            Address: {order.delivery_address || "Not specified"}
          </p>
        </div>

        {/* Location Status */}
        {currentLocation && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Your Location:</span>
              <span className="font-mono text-xs">
                {formatLocation(currentLocation, 4)}
              </span>
            </div>

            {distanceRemaining !== null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Distance to Customer:</span>
                <span className="font-semibold">
                  {distanceRemaining.toFixed(2)} km
                </span>
              </div>
            )}

            {estimatedArrival && !atDestination && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Estimated Arrival:</span>
                <span className="font-semibold text-blue-600">
                  {estimatedArrival}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Progress Bar */}
        {deliveryStarted && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Delivery Progress</span>
              <span>{Math.round(deliveryProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
                style={{ width: `${deliveryProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {!deliveryStarted ? (
            <Button
              onClick={handleStartDelivery}
              disabled={!currentLocation}
              className="w-full"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Start Delivery Tracking
            </Button>
          ) : (
            <>
              <Button
                onClick={handleUpdateProgress}
                variant="outline"
                className="w-full"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Update Customer on Progress
              </Button>

              {atDestination && (
                <Button
                  onClick={handleCompleteDelivery}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Delivered
                </Button>
              )}
            </>
          )}

          {/* Communication Buttons */}
          <div className="grid grid-cols-3 gap-2">
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
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Camera className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {atDestination && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-green-700 font-medium">
                You've arrived at the destination!
              </span>
            </div>
          </div>
        )}

        {currentLocation &&
          distanceRemaining &&
          distanceRemaining < 0.5 &&
          !atDestination && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                <span className="text-yellow-700 font-medium">
                  You're almost there! Less than 500m away.
                </span>
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  );
};

export default DeliveryTracker;
