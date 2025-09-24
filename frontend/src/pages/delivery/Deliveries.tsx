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
import type { Order } from "@/types/orderType";

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
        return "theme-status-warning-bg";
      case "out_for_delivery":
        return "theme-status-info-bg";
      case "in_transit":
        return "theme-status-info-bg";
      case "delivered":
        return "theme-status-success-bg";
      default:
        return "bg-gray-100 theme-text-secondary";
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
      <DeliveryLayout
        title="My Deliveries"
        description="Manage your assigned orders and delivery workflow"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="theme-bg-card rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center theme-shadow-card">
              <RefreshCw
                className="h-8 w-8 animate-spin"
                style={{ color: "var(--primary-emerald)" }}
              />
            </div>
            <p className="text-lg font-medium theme-text-primary">
              Loading deliveries...
            </p>
            <p className="theme-text-secondary">
              Please wait while we fetch your orders
            </p>
          </div>
        </div>
      </DeliveryLayout>
    );
  }

  return (
    <DeliveryLayout
      title="My Deliveries"
      description="Manage your assigned orders and delivery workflow"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            onClick={fetchDeliveries}
            variant="outline"
            className="theme-primary hover:theme-primary-gradient transition-colors duration-300 border-2"
            style={{
              borderColor: "var(--primary-emerald)",
              color: "var(--primary-emerald)",
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {orders.length === 0 ? (
          <Card className="border-none theme-shadow-card theme-bg-card">
            <CardContent className="p-12 text-center">
              <div
                className="rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center"
                style={{ background: "var(--status-info)", opacity: 0.1 }}
              >
                <Truck
                  className="h-10 w-10"
                  style={{ color: "var(--status-info)" }}
                />
              </div>
              <h3 className="text-xl font-semibold mb-3 theme-text-primary">
                No deliveries assigned
              </h3>
              <p className="theme-text-secondary max-w-md mx-auto">
                Check back later for new delivery assignments. New orders will
                appear here when they're ready for pickup.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {orders.map((order, index) => (
              <Card
                key={order.id}
                className="group border-none theme-card-hover theme-animate-fade-in-up"
                style={{
                  background: "var(--bg-card)",
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle
                        className="text-xl font-bold flex items-center space-x-2"
                        style={{ color: "var(--text-primary)" }}
                      >
                        <span>Order #{order.order_number}</span>
                      </CardTitle>
                      <CardDescription
                        className="mt-1 flex items-center"
                        style={{ color: "var(--text-cool-grey)" }}
                      >
                        <User className="h-4 w-4 mr-1" />
                        Customer: {order.customer?.name || "N/A"}
                      </CardDescription>
                    </div>
                    <div className="transform group-hover:scale-105 transition-transform duration-300">
                      <Badge
                        className={`${getStatusColor(
                          order.status
                        )} font-semibold px-3 py-1 text-xs`}
                      >
                        {order.status.replace("_", " ").toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Customer Info */}
                    <div
                      className="rounded-lg p-4"
                      style={{
                        background: "rgba(66, 165, 245, 0.1)",
                        border: "1px solid rgba(66, 165, 245, 0.2)",
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className="rounded-full p-2"
                          style={{ background: "var(--status-info)" }}
                        >
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {order.customer?.name || "N/A"}
                          </p>
                          <p className="text-sm text-gray-700 flex items-center mt-1">
                            <Phone className="h-3 w-3 mr-1" />
                            {order.customer?.phone || "No phone"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="bg-green-500 rounded-full p-2">
                          <MapPin className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 mb-2">
                            Delivery Address
                          </p>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {order.delivery_address}
                          </p>
                          {order.delivery_instructions && (
                            <div className="mt-3 p-3 bg-white rounded-md border-l-4 border-green-400">
                              <p className="text-sm text-gray-700">
                                <span className="font-semibold text-gray-900">
                                  Instructions:
                                </span>{" "}
                                {order.delivery_instructions}
                              </p>
                            </div>
                          )}
                        </div>
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
                    <div className="theme-bg-primary rounded-lg p-4">
                      <div className="flex flex-wrap gap-3">
                        {/* Status Update Button */}
                        {getNextStatus(order.status) && (
                          <Button
                            onClick={() =>
                              handleStatusUpdate(
                                order.id,
                                getNextStatus(order.status)!
                              )
                            }
                            className="theme-primary-gradient text-white hover:opacity-90 transform hover:scale-105 transition-all duration-300"
                            size="lg"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
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
                              `https://www.google.com/maps/dir/?api=1&destination=${address}`,
                              "_blank"
                            );
                          }}
                          className="border-2 transform hover:scale-105 transition-all duration-300"
                          style={{
                            borderColor: "var(--status-info)",
                            color: "var(--status-info)",
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
                              window.open(
                                `tel:${order.customer.phone}`,
                                "_self"
                              )
                            }
                            className="hover:bg-green-50 hover:border-green-300 hover:text-green-700 transform hover:scale-105 transition-all duration-300"
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Call
                          </Button>
                        )}

                        {/* Chat Button */}
                        <Button
                          variant="outline"
                          onClick={() => handleOpenChat(order)}
                          className="hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transform hover:scale-105 transition-all duration-300"
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
                          className="hover:bg-red-50 hover:border-red-300 hover:text-red-700 transform hover:scale-105 transition-all duration-300"
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Report Issue
                        </Button>
                      </div>
                    </div>

                    {/* Progress Timeline */}
                    <div className="pt-6 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-4">
                        Delivery Progress
                      </h4>
                      <div className="flex items-center justify-between text-xs">
                        <div
                          className={`flex flex-col items-center transition-colors duration-300 ${
                            [
                              "ready",
                              "out_for_delivery",
                              "in_transit",
                              "delivered",
                            ].includes(order.status)
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border-2 transition-colors duration-300 ${
                              [
                                "ready",
                                "out_for_delivery",
                                "in_transit",
                                "delivered",
                              ].includes(order.status)
                                ? "bg-green-500 border-green-500"
                                : "bg-gray-200 border-gray-300"
                            }`}
                          ></div>
                          <span className="mt-2 font-medium">Ready</span>
                        </div>

                        <div className="flex-1 h-0.5 mx-2 bg-gray-200">
                          <div
                            className={`h-full transition-all duration-500 ${
                              [
                                "out_for_delivery",
                                "in_transit",
                                "delivered",
                              ].includes(order.status)
                                ? "bg-green-500"
                                : "bg-gray-200"
                            }`}
                          ></div>
                        </div>

                        <div
                          className={`flex flex-col items-center transition-colors duration-300 ${
                            [
                              "out_for_delivery",
                              "in_transit",
                              "delivered",
                            ].includes(order.status)
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border-2 transition-colors duration-300 ${
                              [
                                "out_for_delivery",
                                "in_transit",
                                "delivered",
                              ].includes(order.status)
                                ? "bg-green-500 border-green-500"
                                : "bg-gray-200 border-gray-300"
                            }`}
                          ></div>
                          <span className="mt-2 font-medium">Picked Up</span>
                        </div>

                        <div className="flex-1 h-0.5 mx-2 bg-gray-200">
                          <div
                            className={`h-full transition-all duration-500 ${
                              ["in_transit", "delivered"].includes(order.status)
                                ? "bg-green-500"
                                : "bg-gray-200"
                            }`}
                          ></div>
                        </div>

                        <div
                          className={`flex flex-col items-center transition-colors duration-300 ${
                            ["in_transit", "delivered"].includes(order.status)
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border-2 transition-colors duration-300 ${
                              ["in_transit", "delivered"].includes(order.status)
                                ? "bg-green-500 border-green-500"
                                : "bg-gray-200 border-gray-300"
                            }`}
                          ></div>
                          <span className="mt-2 font-medium">In Transit</span>
                        </div>

                        <div className="flex-1 h-0.5 mx-2 bg-gray-200">
                          <div
                            className={`h-full transition-all duration-500 ${
                              order.status === "delivered"
                                ? "bg-green-500"
                                : "bg-gray-200"
                            }`}
                          ></div>
                        </div>

                        <div
                          className={`flex flex-col items-center transition-colors duration-300 ${
                            order.status === "delivered"
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border-2 transition-colors duration-300 ${
                              order.status === "delivered"
                                ? "bg-green-500 border-green-500"
                                : "bg-gray-200 border-gray-300"
                            }`}
                          ></div>
                          <span className="mt-2 font-medium">Delivered</span>
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
