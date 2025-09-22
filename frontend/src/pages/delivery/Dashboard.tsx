// src/pages/delivery/Dashboard.tsx
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import {
  getAvailableOrders,
  getDashboardSummary,
} from "@/services/deliveryService";
import { Link } from "react-router-dom";
import type { Order } from "../../types/order";
import {
  Truck,
  CheckCircle,
  LogOut,
  Package,
  DollarSign,
} from "lucide-react";

const DeliveryDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState<{
    active_deliveries: number;
    completed_today: number;
    todays_earnings: number;
    avg_delivery_time_min: number;
  }>({
    active_deliveries: 0,
    completed_today: 0,
    todays_earnings: 0,
    avg_delivery_time_min: 0,
  });

  // Fetch orders and dashboard summary
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const allOrders = await getAvailableOrders(); // returns Order[]
        console.log("All orders:", allOrders);
        const assignedOrders = allOrders.filter(
          (order) => order.delivery_partner?.id === user.id
        );
        setOrders(assignedOrders);

        const summary = await getDashboardSummary();
        setDashboard(summary);
      } catch (error) {
        console.error("Failed to fetch delivery data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (!user) return <p>Loading...</p>;

  // Derived stats
  const activeDeliveries = orders.filter(
    (o) => o.status === "out_for_delivery"
  ).length;

  const pendingPickups = orders.filter(
    (o) => ["ready", "pending"].includes(o.status)
  ).length;

  const completedToday = orders.filter(
    (o) =>
      o.status === "delivered" &&
      new Date(o.created_at).toDateString() === new Date().toDateString()
  ).length;

  const totalEarnings = orders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + Number(o.delivery_fee || 5), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "out_for_delivery":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "ready":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 pt-24">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12 ring-2 ring-blue-500/20">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Hello, {user.name.split(" ")[0]}! 🚚
            </h1>
            <p className="text-gray-600">
              Delivery Expert since {new Date(user.createdAt).getFullYear()}
            </p>
          </div>
        </div>
        <Button onClick={handleLogout} variant="outline" size="sm">
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-none shadow-md bg-blue-500 text-white">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm">Active Deliveries</p>
              <p className="text-3xl font-bold">{activeDeliveries}</p>
            </div>
            <Truck className="h-10 w-10 text-blue-200" />
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-green-500 text-white">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm">Completed Today</p>
              <p className="text-3xl font-bold">{completedToday}</p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-200" />
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-purple-500 text-white">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm">Earnings</p>
              <p className="text-3xl font-bold">${totalEarnings.toFixed(2)}</p>
            </div>
            <DollarSign className="h-10 w-10 text-purple-200" />
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-orange-500 text-white">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm">Pending Pickups</p>
              <p className="text-3xl font-bold">{pendingPickups}</p>
            </div>
            <Package className="h-10 w-10 text-orange-200" />
          </CardContent>
        </Card>
      </div>

      {/* Recent Deliveries */}
      <Card className="mb-8 border-none shadow-md">
        <CardHeader>
          <CardTitle>Recent Deliveries</CardTitle>
          <CardDescription>Your latest delivery assignments</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-center py-6">No deliveries assigned yet.</p>
          ) : (
            orders
              .sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime()
              )
              .slice(0, 5)
              .map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-lg p-4 mb-3 flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold">
                      {order.order_number} - {order.status}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.delivery_address}
                    </p>
                  </div>
                  <Badge className={`${getStatusColor(order.status)}`}>
                    {order.status}
                  </Badge>
                </div>
              ))
          )}
          {orders.length > 5 && (
            <Button asChild variant="outline" className="w-full mt-2">
              <Link to="/delivery/deliveries">View All</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button asChild className="bg-blue-500 text-white">
          <Link to="/delivery/map">Live Map</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/delivery/deliveries">Deliveries</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/delivery/schedule">Schedule</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/delivery/profile">Profile</Link>
        </Button>
      </div>
    </div>
  );
};

export default DeliveryDashboard;