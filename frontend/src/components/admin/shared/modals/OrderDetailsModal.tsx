import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCart,
  User,
  MapPin,
  Calendar,
  Clock,
  CreditCard,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminService } from "@/services/adminService";

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
}

interface OrderDetails {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  delivery_address: string;
  items_count: number;
  items?: Array<{
    id: number;
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  delivery_info?: {
    agent_name?: string;
    estimated_time?: string;
    tracking_code?: string;
  };
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  isOpen,
  onClose,
  orderId,
}) => {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && orderId) {
      loadOrderDetails();
    }
  }, [isOpen, orderId]);

  const loadOrderDetails = async () => {
    if (!orderId) return;

    setLoading(true);
    setError(null);

    try {
      const details = await adminService.getOrderDetails(orderId);
      setOrderDetails(details);
    } catch (err) {
      setError("Failed to load order details");
      console.error("Error loading order details:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "LKR",
    }).format(amount);
  };

  const getStatusBadge = (status: string, type: "order" | "payment" = "order") => {
    const statusConfig = {
      order: {
        pending: { color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock },
        confirmed: { color: "bg-blue-50 text-blue-700 border-blue-200", icon: CheckCircle },
        preparing: { color: "bg-orange-50 text-orange-700 border-orange-200", icon: Package },
        ready: { color: "bg-purple-50 text-purple-700 border-purple-200", icon: CheckCircle },
        delivered: { color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle },
        cancelled: { color: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
      },
      payment: {
        pending: { color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock },
        paid: { color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle },
        failed: { color: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
        refunded: { color: "bg-gray-50 text-gray-700 border-gray-200", icon: AlertCircle },
      },
    };

    const config = statusConfig[type][status as keyof typeof statusConfig[typeof type]] || 
                   statusConfig[type].pending;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Order Details</span>
            {orderDetails?.order_number && (
              <span className="text-sm font-normal text-gray-500">
                - {orderDetails.order_number}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            View comprehensive order information including items, customer details, and delivery status.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading order details...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
              <p className="text-red-600">{error}</p>
              <Button onClick={loadOrderDetails} className="mt-2">
                Retry
              </Button>
            </div>
          </div>
        )}

        {orderDetails && (
          <ScrollArea className="h-[70vh]">
            <div className="space-y-6">
              {/* Order Overview */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <ShoppingCart className="h-5 w-5" />
                      <span>Order Overview</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(orderDetails.status, "order")}
                      {getStatusBadge(orderDetails.payment_status, "payment")}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Order Number</span>
                      </div>
                      <p className="text-sm text-gray-600">{orderDetails.order_number}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Total Amount</span>
                      </div>
                      <p className="text-sm text-gray-600 font-semibold">
                        {formatCurrency(orderDetails.total_amount)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Items Count</span>
                      </div>
                      <p className="text-sm text-gray-600">{orderDetails.items_count} items</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Order Date</span>
                      </div>
                      <p className="text-sm text-gray-600">{formatDate(orderDetails.created_at)}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Last Updated</span>
                      </div>
                      <p className="text-sm text-gray-600">{formatDate(orderDetails.updated_at)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Customer Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Name</span>
                      </div>
                      <p className="text-sm text-gray-600">{orderDetails.customer_name}</p>
                    </div>
                    {orderDetails.customer_email && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Email</span>
                        </div>
                        <p className="text-sm text-gray-600">{orderDetails.customer_email}</p>
                      </div>
                    )}
                    {orderDetails.customer_phone && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Phone</span>
                        </div>
                        <p className="text-sm text-gray-600">{orderDetails.customer_phone}</p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Delivery Address</span>
                      </div>
                      <p className="text-sm text-gray-600">{orderDetails.delivery_address}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              {orderDetails.items && orderDetails.items.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Package className="h-5 w-5" />
                      <span>Order Items ({orderDetails.items.length})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {orderDetails.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{item.name}</h4>
                            <p className="text-sm text-gray-500">
                              Quantity: {item.quantity} × {formatCurrency(item.price)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(item.total)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Delivery Information */}
              {orderDetails.delivery_info && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Truck className="h-5 w-5" />
                      <span>Delivery Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {orderDetails.delivery_info.agent_name && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">Delivery Agent</span>
                          </div>
                          <p className="text-sm text-gray-600">{orderDetails.delivery_info.agent_name}</p>
                        </div>
                      )}
                      {orderDetails.delivery_info.tracking_code && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Package className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">Tracking Code</span>
                          </div>
                          <p className="text-sm text-gray-600 font-mono">
                            {orderDetails.delivery_info.tracking_code}
                          </p>
                        </div>
                      )}
                      {orderDetails.delivery_info.estimated_time && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">Estimated Delivery</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {formatDate(orderDetails.delivery_info.estimated_time)}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsModal;
