import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users2, MessageCircle } from "lucide-react";
import ContactCard from "./ContactCard";
import type { Order } from "@/types/orderType";

interface DeliveryContactsProps {
  order: Order;
  currentPhase?: "pickup" | "delivery" | "both";
  showTitle?: boolean;
  className?: string;
}

const DeliveryContacts: React.FC<DeliveryContactsProps> = ({
  order,
  currentPhase = "both",
  showTitle = true,
  className = "",
}) => {
  const showChef = currentPhase === "pickup" || currentPhase === "both";
  const showCustomer = currentPhase === "delivery" || currentPhase === "both";

  return (
    <Card className={`border-none bg-gray-50/50 ${className}`}>
      {showTitle && (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-base">
            <Users2 className="h-4 w-4 text-gray-600" />
            <span className="text-gray-800">Contact Information</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Reach out to coordinate pickup and delivery
          </p>
        </CardHeader>
      )}

      <CardContent className="space-y-3">
        <div
          className={`grid gap-3 ${
            showChef && showCustomer ? "md:grid-cols-2" : "grid-cols-1"
          }`}
        >
          {/* Chef Contact */}
          {showChef && order.chef && (
            <ContactCard
              type="chef"
              contact={order.chef}
              showLocation={true}
              className={
                currentPhase === "pickup"
                  ? "ring-2 ring-orange-300 shadow-md"
                  : ""
              }
            />
          )}

          {/* Customer Contact */}
          {showCustomer && order.customer && (
            <ContactCard
              type="customer"
              contact={order.customer}
              className={
                currentPhase === "delivery"
                  ? "ring-2 ring-blue-300 shadow-md"
                  : ""
              }
            />
          )}
        </div>

        {/* Phase-specific guidance */}
        {currentPhase === "pickup" && (
          <div className="text-xs text-orange-700 bg-orange-50 p-2 rounded border border-orange-200 text-center">
            <span className="font-medium">Pickup Phase:</span> Contact chef for
            order collection and coordination
          </div>
        )}

        {currentPhase === "delivery" && (
          <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-200 text-center">
            <span className="font-medium">Delivery Phase:</span> Contact
            customer for delivery coordination and timing
          </div>
        )}

        {/* Communication Tips */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
          <div className="flex items-start space-x-2">
            <MessageCircle className="h-4 w-4 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Communication Tips
              </p>
              <ul className="text-xs text-amber-700 mt-1 space-y-1">
                <li>• Call ahead to confirm pickup/delivery times</li>
                <li>• Be polite and professional in all interactions</li>
                <li>• Update on any delays or issues immediately</li>
                {order.delivery_instructions && (
                  <li>• Note special delivery instructions below</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Special Instructions */}
        {order.delivery_instructions && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-800 mb-1">
              Delivery Instructions
            </p>
            <p className="text-sm text-blue-700">
              {order.delivery_instructions}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DeliveryContacts;
