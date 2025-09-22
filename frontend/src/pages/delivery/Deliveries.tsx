import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import DeliveryLayout from "@/components/delivery/DeliveryLayout";
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  Phone,
  MessageSquare,
  AlertTriangle,
  Navigation,
  User,
  MessageCircle,
  RefreshCw,
} from "lucide-react";
import {
  getAvailableOrders,
  getMyAssignedOrders,
  updateOrderStatus,
  reportDeliveryIssue,
  sendCustomerMessage,
  getChatMessages,
  type DeliveryIssue,
  type ChatMessage as ServiceChatMessage,
} from "@/services/deliveryService";
import type { Order } from "@/types/order";

const DeliveryDeliveries: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [chatMessages, setChatMessages] = useState<ServiceChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [issueType, setIssueType] = useState<DeliveryIssue["type"]>("other");
  const [issueDescription, setIssueDescription] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [showIssueReport, setShowIssueReport] = useState(false);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const data = await getMyAssignedOrders();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch deliveries:", error);
      toast({
        title: "Error",
        description: "Failed to load deliveries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (
    orderId: number,
    status: "picked_up" | "out_for_delivery" | "in_transit" | "delivered"
  ) => {
    try {
      await updateOrderStatus(orderId, status);
      await fetchDeliveries();
      toast({
        title: "Success",
        description: `Order status updated to ${status.replace("_", " ")}`,
      });
    } catch (error) {
      console.error("Failed to update status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const handleOpenChat = async (order: Order) => {
    setSelectedOrder(order);
    setShowChat(true);

    try {
      const messages = await getChatMessages(order.id);
      setChatMessages(messages);
    } catch (error) {
      console.error("Failed to load chat messages:", error);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedOrder) return;

    try {
      await sendCustomerMessage(selectedOrder.id, newMessage);
      const updatedMessages = await getChatMessages(selectedOrder.id);
      setChatMessages(updatedMessages);
      setNewMessage("");
      toast({
        title: "Success",
        description: "Message sent to customer",
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleReportIssue = async () => {
    if (!selectedOrder || !issueDescription.trim()) return;

    try {
      await reportDeliveryIssue(selectedOrder.id, issueType, issueDescription);

      setShowIssueReport(false);
      setIssueDescription("");
      setIssueType("other");

      toast({
        title: "Success",
        description: "Issue reported successfully. Admin will be notified.",
      });
    } catch (error) {
      console.error("Failed to report issue:", error);
      toast({
        title: "Error",
        description: "Failed to report issue",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "ready":
        return "bg-yellow-100 text-yellow-800";
      case "out_for_delivery":
        return "bg-blue-100 text-blue-800";
      case "in_transit":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getNextStatus = (
    currentStatus: Order["status"]
  ): "picked_up" | "out_for_delivery" | "in_transit" | "delivered" | null => {
    switch (currentStatus) {
      case "ready":
        return "picked_up";
      case "out_for_delivery":
        return "in_transit";
      case "in_transit":
        return "delivered";
      default:
        return null;
    }
  };

  const getStatusAction = (status: Order["status"]) => {
    switch (status) {
      case "ready":
        return "Pick Up Order";
      case "out_for_delivery":
        return "Mark In Transit";
      case "in_transit":
        return "Mark Delivered";
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading deliveries...</span>
      </div>
    );
  }

  return (
    <DeliveryLayout
      title="My Deliveries"
      description="Manage your assigned orders and delivery workflow"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button onClick={fetchDeliveries} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Truck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">
                No deliveries assigned
              </h3>
              <p className="text-gray-500">
                Check back later for new delivery assignments.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <Card
                key={order.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Order #{order.order_number}
                      </CardTitle>
                      <CardDescription>
                        Customer: {order.customer?.name || "N/A"}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Customer Info */}
                    <div className="flex items-start space-x-3">
                      <User className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium">
                          {order.customer?.name || "N/A"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.customer?.phone || "No phone"}
                        </p>
                      </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium">Delivery Address</p>
                        <p className="text-sm text-gray-600">
                          {order.delivery_address}
                        </p>
                        {order.delivery_instructions && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Instructions:</span>{" "}
                            {order.delivery_instructions}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Order Time</p>
                        <p className="text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-4">
                      {/* Status Update Button */}
                      {getNextStatus(order.status) && (
                        <Button
                          onClick={() =>
                            handleStatusUpdate(
                              order.id,
                              getNextStatus(order.status)!
                            )
                          }
                          className="flex items-center space-x-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>{getStatusAction(order.status)}</span>
                        </Button>
                      )}

                      {/* Navigation Button */}
                      <Button
                        variant="outline"
                        onClick={() => {
                          const address = encodeURIComponent(
                            order.delivery_address
                          );
                          window.open(
                            `https://maps.apple.com/?q=${address}`,
                            "_blank"
                          );
                        }}
                      >
                        <Navigation className="h-4 w-4 mr-2" />
                        Navigate
                      </Button>

                      {/* Call Customer Button */}
                      {order.customer?.phone && (
                        <Button
                          variant="outline"
                          onClick={() =>
                            window.open(`tel:${order.customer.phone}`, "_self")
                          }
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Call
                        </Button>
                      )}

                      {/* Chat Button */}
                      <Button
                        variant="outline"
                        onClick={() => handleOpenChat(order)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat
                      </Button>

                      {/* Report Issue Button */}
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowIssueReport(true);
                        }}
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Report Issue
                      </Button>
                    </div>

                    {/* Progress Timeline */}
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div
                          className={`flex flex-col items-center ${
                            [
                              "ready",
                              "out_for_delivery",
                              "in_transit",
                              "delivered",
                            ].includes(order.status)
                              ? "text-green-600"
                              : ""
                          }`}
                        >
                          <div
                            className={`w-3 h-3 rounded-full ${
                              [
                                "ready",
                                "out_for_delivery",
                                "in_transit",
                                "delivered",
                              ].includes(order.status)
                                ? "bg-green-600"
                                : "bg-gray-300"
                            }`}
                          ></div>
                          <span className="mt-1">Ready</span>
                        </div>

                        <div
                          className={`flex flex-col items-center ${
                            [
                              "out_for_delivery",
                              "in_transit",
                              "delivered",
                            ].includes(order.status)
                              ? "text-green-600"
                              : ""
                          }`}
                        >
                          <div
                            className={`w-3 h-3 rounded-full ${
                              [
                                "out_for_delivery",
                                "in_transit",
                                "delivered",
                              ].includes(order.status)
                                ? "bg-green-600"
                                : "bg-gray-300"
                            }`}
                          ></div>
                          <span className="mt-1">Picked Up</span>
                        </div>

                        <div
                          className={`flex flex-col items-center ${
                            ["in_transit", "delivered"].includes(order.status)
                              ? "text-green-600"
                              : ""
                          }`}
                        >
                          <div
                            className={`w-3 h-3 rounded-full ${
                              ["in_transit", "delivered"].includes(order.status)
                                ? "bg-green-600"
                                : "bg-gray-300"
                            }`}
                          ></div>
                          <span className="mt-1">In Transit</span>
                        </div>

                        <div
                          className={`flex flex-col items-center ${
                            order.status === "delivered" ? "text-green-600" : ""
                          }`}
                        >
                          <div
                            className={`w-3 h-3 rounded-full ${
                              order.status === "delivered"
                                ? "bg-green-600"
                                : "bg-gray-300"
                            }`}
                          ></div>
                          <span className="mt-1">Delivered</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Chat Dialog */}
        <Dialog open={showChat} onOpenChange={setShowChat}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Chat with Customer</DialogTitle>
              <DialogDescription>
                Order #{selectedOrder?.order_number}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Chat Messages */}
              <div className="h-64 overflow-y-auto border rounded-lg p-3 space-y-2">
                {chatMessages.length === 0 ? (
                  <p className="text-gray-500 text-center">No messages yet</p>
                ) : (
                  chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.senderId === user?.id
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs p-2 rounded-lg ${
                          message.senderId === user?.id
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p className="text-xs opacity-75 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="flex space-x-2">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={2}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Issue Report Dialog */}
        <Dialog open={showIssueReport} onOpenChange={setShowIssueReport}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report Delivery Issue</DialogTitle>
              <DialogDescription>
                Order #{selectedOrder?.order_number}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Issue Type</label>
                <Select
                  value={issueType}
                  onValueChange={(value) =>
                    setIssueType(value as DeliveryIssue["type"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer_unavailable">
                      Customer Unavailable
                    </SelectItem>
                    <SelectItem value="wrong_address">Wrong Address</SelectItem>
                    <SelectItem value="traffic_delay">Traffic Delay</SelectItem>
                    <SelectItem value="vehicle_problem">
                      Vehicle Problem
                    </SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Describe the issue in detail..."
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowIssueReport(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReportIssue}
                  disabled={!issueDescription.trim()}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Report Issue
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DeliveryLayout>
  );
};

export default DeliveryDeliveries;
