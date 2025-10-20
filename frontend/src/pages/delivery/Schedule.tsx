import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import DeliveryLayout from "@/components/delivery/DeliveryLayout";
import {
  getAvailableOrders,
  optimizeDeliveryRoute,
  type DeliveryLog,
} from "@/services/deliveryService";
import {
  Calendar,
  Clock,
  Truck,
  CheckCircle,
  MapPin,
  Route,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import type { Order } from "@/types/orderType";

interface ScheduleItem {
  id: string;
  time: string;
  type: "delivery" | "break" | "shift_start" | "shift_end";
  title: string;
  description: string;
  status: "completed" | "in_progress" | "pending" | "upcoming";
  orderId?: number;
}

const DeliverySchedule: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [optimizedRoute, setOptimizedRoute] = useState<any>(null);
  const [showOptimizeDialog, setShowOptimizeDialog] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (orders.length > 0) {
      generateSchedule();
    }
  }, [orders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getAvailableOrders();
      const assignedOrders = data.filter(
        (order: Order) => order.delivery_partner?.id === user?.id
      );
      setOrders(assignedOrders);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSchedule = () => {
    const scheduleItems: ScheduleItem[] = [
      {
        id: "1",
        time: "08:00",
        type: "shift_start",
        title: "Shift Start",
        description: "Begin daily delivery operations",
        status: "completed",
      },
      ...orders.map((order, index) => ({
        id: `order-${order.id}`,
        time: `${String(9 + index).padStart(2, "0")}:${String(
          (index * 30) % 60
        ).padStart(2, "0")}`,
        type: "delivery" as const,
        title: `Delivery #${order.order_number}`,
        description: `${order.customer?.name || "Customer"} - ${
          order.delivery_address
        }`,
        status: getDeliveryStatus(order.status),
        orderId: order.id,
      })),
      {
        id: "break",
        time: "12:00",
        type: "break",
        title: "Lunch Break",
        description: "30-minute break",
        status: "upcoming",
      },
      {
        id: "shift-end",
        time: "17:00",
        type: "shift_end",
        title: "Shift End",
        description: "End of delivery shift",
        status: "upcoming",
      },
    ];
    setSchedule(scheduleItems.sort((a, b) => a.time.localeCompare(b.time)));
  };

  const getDeliveryStatus = (
    orderStatus: Order["status"]
  ): ScheduleItem["status"] => {
    switch (orderStatus) {
      case "delivered":
        return "completed";
      case "out_for_delivery":
      case "in_transit":
        return "in_progress";
      case "ready":
        return "pending";
      default:
        return "upcoming";
    }
  };

  const handleOptimizeRoute = async () => {
    try {
      const pendingOrderIds = orders
        .filter((order) => ["ready", "out_for_delivery"].includes(order.status))
        .map((order) => order.id);

      if (pendingOrderIds.length === 0) {
        toast({
          title: "No orders to optimize",
          description:
            "All orders are already completed or not ready for delivery.",
        });
        return;
      }

      const optimizedData = await optimizeDeliveryRoute(pendingOrderIds);
      setOptimizedRoute(optimizedData);
      setShowOptimizeDialog(true);

      toast({
        title: "Route Optimized",
        description: `Optimized route for ${pendingOrderIds.length} deliveries`,
      });
    } catch (error) {
      console.error("Failed to optimize route:", error);
      toast({
        title: "Error",
        description: "Failed to optimize delivery route",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: ScheduleItem["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "upcoming":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: ScheduleItem["type"]) => {
    switch (type) {
      case "delivery":
        return <Truck className="h-4 w-4" />;
      case "break":
        return <Clock className="h-4 w-4" />;
      case "shift_start":
      case "shift_end":
        return <Calendar className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (!user) {
    return (
      <DeliveryLayout
        title="Delivery Schedule"
        description="Manage your delivery schedule and optimize routes"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="bg-gradient-to-br from-primary/10 to-primary/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <p className="text-lg font-medium text-gray-900">
              Loading schedule...
            </p>
            <p className="text-gray-600">
              Please wait while we fetch your data
            </p>
          </div>
        </div>
      </DeliveryLayout>
    );
  }

  return (
    <DeliveryLayout
      title="Delivery Schedule"
      description="Manage your delivery schedule and optimize routes"
    >
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex space-x-4">
            <Button
              onClick={fetchOrders}
              variant="outline"
              className="hover:bg-primary hover:text-primary-foreground transform hover:scale-105 transition-all duration-300"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={handleOptimizeRoute}
              disabled={orders.length === 0}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none"
            >
              <Route className="h-4 w-4 mr-2" />
              Optimize Route
            </Button>
          </div>
        </div>

        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-12 bg-gray-100">
            <TabsTrigger
              value="today"
              className="data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
            >
              Today
            </TabsTrigger>
            <TabsTrigger
              value="week"
              className="data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
            >
              This Week
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              className="data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300"
            >
              Calendar View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-6">
            <Card className="group hover:shadow-card transition-all duration-300 border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3 text-2xl">
                  <div className="bg-gradient-to-r from-primary to-primary/80 rounded-full p-2">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <span>Today's Schedule - {new Date().toDateString()}</span>
                </CardTitle>
                <CardDescription className="text-base">
                  {orders.length} deliveries scheduled for today
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading schedule...</span>
                  </div>
                ) : schedule.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2">
                      No items scheduled
                    </h3>
                    <p className="text-gray-500">
                      Your schedule will appear here once orders are assigned.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {schedule.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex-shrink-0">
                          <div
                            className={`p-2 rounded-full ${getStatusColor(
                              item.status
                            )}`}
                          >
                            {getTypeIcon(item.type)}
                          </div>
                        </div>

                        <div className="flex-grow">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{item.title}</h4>
                              <p className="text-sm text-gray-600">
                                {item.description}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                {item.time}
                              </div>
                              <Badge className={getStatusColor(item.status)}>
                                {item.status}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {item.orderId && (
                          <div className="flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const order = orders.find(
                                  (o) => o.id === item.orderId
                                );
                                if (order) {
                                  const address = encodeURIComponent(
                                    order.delivery_address
                                  );
                                  window.open(
                                    `https://maps.apple.com/?q=${address}`,
                                    "_blank"
                                  );
                                }
                              }}
                            >
                              <MapPin className="h-4 w-4 mr-1" />
                              Navigate
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="week" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Overview</CardTitle>
                <CardDescription>
                  Your delivery schedule for this week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-4">
                  {Array.from({ length: 7 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - date.getDay() + i);
                    const isToday =
                      date.toDateString() === new Date().toDateString();

                    return (
                      <div
                        key={i}
                        className={`p-3 border rounded-lg text-center ${
                          isToday ? "bg-blue-50 border-blue-200" : ""
                        }`}
                      >
                        <div className="font-medium text-sm">
                          {date.toLocaleDateString("en-US", {
                            weekday: "short",
                          })}
                        </div>
                        <div className="text-lg font-bold">
                          {date.getDate()}
                        </div>
                        <div className="text-xs text-gray-600">
                          {i === new Date().getDay()
                            ? `${orders.length} orders`
                            : "No orders"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Calendar View</CardTitle>
                <CardDescription>
                  Monthly view of your delivery schedule
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">
                    Calendar Integration
                  </h3>
                  <p className="text-gray-500">
                    Full calendar view will be available in future updates.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Route Optimization Dialog */}
        <Dialog open={showOptimizeDialog} onOpenChange={setShowOptimizeDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Optimized Delivery Route</DialogTitle>
              <DialogDescription>
                Recommended route for maximum efficiency
              </DialogDescription>
            </DialogHeader>

            {optimizedRoute && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Total Distance
                    </label>
                    <p className="font-medium">
                      {optimizedRoute.total_distance || "N/A"} km
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Estimated Time
                    </label>
                    <p className="font-medium">
                      {optimizedRoute.estimated_time || "N/A"} min
                    </p>
                  </div>
                </div>

                {optimizedRoute.optimized_order && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">
                      Delivery Order
                    </label>
                    <div className="space-y-2">
                      {optimizedRoute.optimized_order.map(
                        (orderId: number, index: number) => {
                          const order = orders.find((o) => o.id === orderId);
                          return (
                            <div
                              key={orderId}
                              className="flex items-center space-x-2 text-sm"
                            >
                              <Badge variant="outline">{index + 1}</Badge>
                              <span>
                                {order?.order_number || `Order ${orderId}`}
                              </span>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowOptimizeDialog(false)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      toast({
                        title: "Route Applied",
                        description:
                          "Optimized route has been applied to your schedule",
                      });
                      setShowOptimizeDialog(false);
                    }}
                  >
                    Apply Route
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DeliveryLayout>
  );
};

export default DeliverySchedule;

