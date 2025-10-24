import React from "react";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, ChefHat, User } from "lucide-react";
import type { Chef, Customer } from "@/types/orderType";

interface ContactCardProps {
  type: "chef" | "customer";
  contact: Chef | Customer;
  showLocation?: boolean;
  className?: string;
}

const ContactCard: React.FC<ContactCardProps> = ({
  type,
  contact,
  showLocation = false,
  className = "",
}) => {
  const isChef = type === "chef";

  const phone =
    "phone_no" in contact
      ? contact.phone_no
      : "phone" in contact
      ? (contact as any).phone
      : undefined;
  const email = contact.email;

  // For chef, show kitchen_location, for customer we might need delivery address from parent
  const location =
    isChef && "kitchen_location" in contact ? contact.kitchen_location : null;

  const colorClasses = isChef
    ? {
        bg: "bg-orange-50",
        border: "border-orange-200",
        iconColor: "text-orange-600",
        textPrimary: "text-orange-800",
        textSecondary: "text-orange-700",
        textLight: "text-orange-600",
        buttonClass: "border-orange-300 text-orange-700 hover:bg-orange-100",
      }
    : {
        bg: "bg-blue-50",
        border: "border-blue-200",
        iconColor: "text-blue-600",
        textPrimary: "text-blue-800",
        textSecondary: "text-blue-700",
        textLight: "text-blue-600",
        buttonClass: "border-blue-300 text-blue-700 hover:bg-blue-100",
      };

  const Icon = isChef ? ChefHat : User;

  return (
    <div
      className={`${colorClasses.bg} ${colorClasses.border} border rounded-lg p-4 transition-all duration-200 hover:shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className={`p-2 rounded-full ${colorClasses.bg} ${colorClasses.border} border`}
          >
            <Icon className={`h-4 w-4 ${colorClasses.iconColor}`} />
          </div>
          <div>
            <p className={`text-sm font-semibold ${colorClasses.textPrimary}`}>
              {contact.name}
            </p>
            <p
              className={`text-xs font-medium ${colorClasses.textLight} uppercase tracking-wide`}
            >
              {isChef ? "Chef" : "Customer"}
            </p>
          </div>
        </div>
      </div>

      {/* Contact Methods */}
      <div className="space-y-3">
        {/* Phone */}
        {phone ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <Phone
                className={`h-4 w-4 ${colorClasses.iconColor} flex-shrink-0`}
              />
              <span
                className={`text-sm font-medium ${colorClasses.textSecondary} truncate`}
              >
                {phone}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className={`ml-3 h-8 px-3 text-xs font-medium ${colorClasses.buttonClass} flex-shrink-0`}
              onClick={() => window.open(`tel:${phone}`)}
            >
              <Phone className="h-3 w-3 mr-1" />
              Call
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-3 text-red-600">
            <Phone className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">No phone available</span>
          </div>
        )}

        {/* Email */}
        {email ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <Mail
                className={`h-4 w-4 ${colorClasses.iconColor} flex-shrink-0`}
              />
              <span
                className={`text-sm ${colorClasses.textSecondary} truncate`}
                title={email}
              >
                {email}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className={`ml-3 h-8 px-3 text-xs font-medium ${colorClasses.buttonClass} flex-shrink-0`}
              onClick={() => window.open(`mailto:${email}`)}
            >
              <Mail className="h-3 w-3 mr-1" />
              Email
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-3 text-gray-500">
            <Mail className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">No email available</span>
          </div>
        )}

        {/* Location */}
        {showLocation && location && (
          <div className="flex items-start space-x-3 pt-3 border-t border-current/10">
            <MapPin
              className={`h-4 w-4 ${colorClasses.iconColor} flex-shrink-0 mt-0.5`}
            />
            <div className="flex-1 min-w-0">
              <p
                className={`text-xs font-medium ${colorClasses.textLight} uppercase tracking-wide mb-1`}
              >
                Location
              </p>
              <p
                className={`text-sm ${colorClasses.textSecondary} leading-relaxed`}
              >
                {location}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactCard;
