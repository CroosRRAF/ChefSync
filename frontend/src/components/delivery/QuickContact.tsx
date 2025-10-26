import React from "react";
import { Button } from "@/components/ui/button";
import { Phone, ChefHat, User } from "lucide-react";
import type { Order } from "@/types/orderType";

interface QuickContactProps {
  order: Order;
  compact?: boolean;
}

const QuickContact: React.FC<QuickContactProps> = ({
  order,
  compact = false,
}) => {
  const getRelevantContact = () => {
    // During pickup phase, prioritize chef contact
    if (["ready", "preparing"].includes(order.status)) {
      return {
        primary: order.chef?.phone_no
          ? { type: "chef", phone: order.chef.phone_no, name: order.chef.name }
          : null,
        secondary:
          order.customer?.phone || order.customer?.phone_no
            ? {
                type: "customer",
                phone: order.customer.phone || order.customer.phone_no,
                name: order.customer.name,
              }
            : null,
      };
    }

    // During delivery phase, prioritize customer contact
    if (["out_for_delivery", "in_transit"].includes(order.status)) {
      return {
        primary:
          order.customer?.phone || order.customer?.phone_no
            ? {
                type: "customer",
                phone: order.customer.phone || order.customer.phone_no,
                name: order.customer.name,
              }
            : null,
        secondary: order.chef?.phone_no
          ? { type: "chef", phone: order.chef.phone_no, name: order.chef.name }
          : null,
      };
    }

    // For other statuses, show both equally
    return {
      primary: order.chef?.phone_no
        ? { type: "chef", phone: order.chef.phone_no, name: order.chef.name }
        : null,
      secondary:
        order.customer?.phone || order.customer?.phone_no
          ? {
              type: "customer",
              phone: order.customer.phone || order.customer.phone_no,
              name: order.customer.name,
            }
          : null,
    };
  };

  const { primary, secondary } = getRelevantContact();

  if (compact) {
    return (
      <div className="flex items-center space-x-1">
        {primary && (
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 px-2 text-xs ${
              primary.type === "chef"
                ? "text-orange-700 hover:bg-orange-50"
                : "text-blue-700 hover:bg-blue-50"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              window.open(`tel:${primary.phone}`);
            }}
          >
            <Phone className="h-3 w-3 mr-1" />
            {primary.type === "chef" ? "Chef" : "Customer"}
          </Button>
        )}
        {secondary && (
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 px-2 text-xs ${
              secondary.type === "chef"
                ? "text-orange-600 hover:bg-orange-50"
                : "text-blue-600 hover:bg-blue-50"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              window.open(`tel:${secondary.phone}`);
            }}
          >
            <Phone className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      {primary && (
        <div className="flex items-center space-x-2">
          {primary.type === "chef" ? (
            <ChefHat className="h-4 w-4 text-orange-600" />
          ) : (
            <User className="h-4 w-4 text-blue-600" />
          )}
          <div>
            <p className="text-sm font-medium">{primary.name}</p>
            <Button
              variant="outline"
              size="sm"
              className={`h-7 px-2 text-xs ${
                primary.type === "chef"
                  ? "border-orange-300 text-orange-700 hover:bg-orange-100"
                  : "border-blue-300 text-blue-700 hover:bg-blue-100"
              }`}
              onClick={() => window.open(`tel:${primary.phone}`)}
            >
              <Phone className="h-3 w-3 mr-1" />
              {primary.phone}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickContact;
