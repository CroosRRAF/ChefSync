import { StatsWidget } from "@/components/admin/shared/widgets/index";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as deliveryService from "@/services/deliveryService";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  Navigation,
  Package,
  RefreshCw,
  TrendingUp,
  Truck,
  User,
} from "lucide-react";
import React, { useEffect, useState } from "react";

/**
 * Delivery Dashboard - Admin View
 *
 * Features:
 * - Real-time active deliveries monitoring
 * - Delivery performance statistics
 * - Issue reporting and management
 * - Delivery partner performance tracking
 * - Quick actions for delivery management
 */

interface ActiveDelivery {
  order_id: string;
  order_pk: number;
  status: string;
  customer: {
    id: number;
    name: string;
    phone: string | null;
  };
  delivery_partner: {
    id: number;
    name: string;
    phone: string | null;
  } | null;
  delivery_address: string;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  current_location: {
    latitude: number | null;
    longitude: number | null;
    address: string | null;
    timestamp: string | null;
  } | null;
  estimated_delivery_time: string | null;
  distance_km: number | null;
  delivery_fee: number;
  total_amount: number;
  open_issues: number;
  created_at: string;
  time_elapsed: string;
}

interface DeliveryStats {
  active_deliveries: number;
  completed_deliveries: number;
  avg_delivery_time_minutes: number | null;
  on_time_delivery_rate: number;
  total_issues: number;
  open_issues: number;
  total_revenue: number;
  delivery_fee_revenue: number;
}

interface TopPartner {
  id: number;
  name: string;
  deliveries: number;
  total_earned: number;
}

const DeliveryDashboard: React.FC = () => {
  // State management
  const [activeDeliveries, setActiveDeliveries] = useState<ActiveDelivery[]>(
    []
  );
  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [topPartners, setTopPartners] = useState<TopPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDelivery, setSelectedDelivery] =
    useState<ActiveDelivery | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(7);

  // Load delivery data
  const loadDeliveryData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    else setLoading(true);

    try {
      // Fetch active deliveries
      const activeData = await deliveryService.getActiveDeliveries();
      if (activeData.success) {
        setActiveDeliveries(activeData.active_deliveries || []);
      }

      // Fetch delivery statistics
      const statsData = await deliveryService.getDeliveryStats(timeRange);
      if (statsData.success) {
        setStats(statsData.stats);
        setTopPartners(statsData.top_delivery_partners || []);
      }
    } catch (error) {
      console.error("Failed to load delivery data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDeliveryData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => loadDeliveryData(true), 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  // Helper functions
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      preparing: "bg-yellow-500",
      ready: "bg-blue-500",
      out_for_delivery: "bg-purple-500",
      delivered: "bg-green-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      preparing: "Preparing",
      ready: "Ready for Pickup",
      out_for_delivery: "Out for Delivery",
      delivered: "Delivered",
    };
    return labels[status] || status;
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleViewDetails = (delivery: ActiveDelivery) => {
    setSelectedDelivery(delivery);
    setShowDetailsDialog(true);
  };

  const handleNavigate = (delivery: ActiveDelivery) => {
    if (delivery.delivery_latitude && delivery.delivery_longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${delivery.delivery_latitude},${delivery.delivery_longitude}`;
      window.open(url, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading delivery data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Delivery Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage active deliveries in real-time
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={timeRange.toString()}
            onValueChange={(value) =>
              setTimeRange(Number(value) as 7 | 30 | 90)
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => loadDeliveryData(true)}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsWidget
          title="Active Deliveries"
          value={stats?.active_deliveries || 0}
          icon={<Truck className="h-4 w-4" />}
          color="blue"
        />
        <StatsWidget
          title="Completed"
          value={stats?.completed_deliveries || 0}
          icon={<CheckCircle className="h-4 w-4" />}
          color="green"
          change={
            stats?.on_time_delivery_rate
              ? {
                  value: stats.on_time_delivery_rate,
                  type: "increase",
                  period: "on-time rate",
                }
              : undefined
          }
        />
        <StatsWidget
          title="Avg Delivery Time"
          value={
            stats?.avg_delivery_time_minutes
              ? `${Math.round(stats.avg_delivery_time_minutes)} min`
              : "N/A"
          }
          icon={<Clock className="h-4 w-4" />}
          color="purple"
        />
        <StatsWidget
          title="Open Issues"
          value={stats?.open_issues || 0}
          icon={<AlertCircle className="h-4 w-4" />}
          color={stats?.open_issues && stats.open_issues > 0 ? "red" : "green"}
        />
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(stats?.total_revenue || 0)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Last {timeRange} days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Delivery Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(stats?.delivery_fee_revenue || 0)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {stats?.completed_deliveries || 0} deliveries completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Deliveries List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Active Deliveries ({activeDeliveries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeDeliveries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active deliveries at the moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeDeliveries.map((delivery) => (
                <Card
                  key={delivery.order_pk}
                  className="border-l-4"
                  style={{
                    borderLeftColor: getStatusColor(delivery.status).replace(
                      "bg-",
                      "#"
                    ),
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">
                            Order #{delivery.order_id}
                          </h3>
                          <Badge className={getStatusColor(delivery.status)}>
                            {getStatusLabel(delivery.status)}
                          </Badge>
                          {delivery.open_issues > 0 && (
                            <Badge variant="destructive">
                              {delivery.open_issues} Issue
                              {delivery.open_issues > 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {delivery.customer.name}
                              {delivery.customer.phone && (
                                <span className="text-muted-foreground ml-1">
                                  • {delivery.customer.phone}
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {delivery.delivery_partner?.name || "Unassigned"}
                              {delivery.delivery_partner?.phone && (
                                <span className="text-muted-foreground ml-1">
                                  • {delivery.delivery_partner.phone}
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">
                              {delivery.delivery_address}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {delivery.estimated_delivery_time
                                ? `ETA: ${formatTime(
                                    delivery.estimated_delivery_time
                                  )}`
                                : "No ETA"}
                            </span>
                          </div>
                        </div>

                        {delivery.current_location && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Navigation className="h-4 w-4" />
                            <span>
                              Last updated:{" "}
                              {delivery.current_location.address ||
                                "Location tracked"}{" "}
                              •{" "}
                              {delivery.current_location.timestamp
                                ? formatTime(
                                    delivery.current_location.timestamp
                                  )
                                : "Unknown"}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-semibold">
                            {formatCurrency(delivery.total_amount)}
                          </span>
                          {delivery.distance_km && (
                            <span className="text-muted-foreground">
                              {delivery.distance_km.toFixed(1)} km
                            </span>
                          )}
                          <span className="text-muted-foreground">
                            Time elapsed: {delivery.time_elapsed}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(delivery)}
                        >
                          Details
                        </Button>
                        {delivery.delivery_latitude &&
                          delivery.delivery_longitude && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleNavigate(delivery)}
                            >
                              <Navigation className="h-4 w-4 mr-1" />
                              Navigate
                            </Button>
                          )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Delivery Partners */}
      {topPartners.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Delivery Partners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPartners.map((partner, index) => (
                <div
                  key={partner.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{partner.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {partner.deliveries} deliveries
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      {formatCurrency(partner.total_earned)}
                    </p>
                    <p className="text-sm text-muted-foreground">earned</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delivery Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Delivery Details</DialogTitle>
            <DialogDescription>
              Complete information for Order #{selectedDelivery?.order_id}
            </DialogDescription>
          </DialogHeader>
          {selectedDelivery && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(selectedDelivery.status)}>
                      {getStatusLabel(selectedDelivery.status)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Amount</Label>
                  <p className="font-semibold text-lg">
                    {formatCurrency(selectedDelivery.total_amount)}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Customer</Label>
                <p className="font-medium">{selectedDelivery.customer.name}</p>
                {selectedDelivery.customer.phone && (
                  <p className="text-sm text-muted-foreground">
                    {selectedDelivery.customer.phone}
                  </p>
                )}
              </div>

              {selectedDelivery.delivery_partner && (
                <div>
                  <Label className="text-muted-foreground">
                    Delivery Partner
                  </Label>
                  <p className="font-medium">
                    {selectedDelivery.delivery_partner.name}
                  </p>
                  {selectedDelivery.delivery_partner.phone && (
                    <p className="text-sm text-muted-foreground">
                      {selectedDelivery.delivery_partner.phone}
                    </p>
                  )}
                </div>
              )}

              <div>
                <Label className="text-muted-foreground">
                  Delivery Address
                </Label>
                <p>{selectedDelivery.delivery_address}</p>
              </div>

              {selectedDelivery.current_location && (
                <div>
                  <Label className="text-muted-foreground">
                    Current Location
                  </Label>
                  <p className="text-sm">
                    {selectedDelivery.current_location.address ||
                      "GPS location tracked"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last updated:{" "}
                    {selectedDelivery.current_location.timestamp
                      ? new Date(
                          selectedDelivery.current_location.timestamp
                        ).toLocaleString()
                      : "Unknown"}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedDelivery.estimated_delivery_time && (
                  <div>
                    <Label className="text-muted-foreground">
                      Estimated Delivery
                    </Label>
                    <p className="text-sm">
                      {new Date(
                        selectedDelivery.estimated_delivery_time
                      ).toLocaleString()}
                    </p>
                  </div>
                )}
                {selectedDelivery.distance_km && (
                  <div>
                    <Label className="text-muted-foreground">Distance</Label>
                    <p className="text-sm">
                      {selectedDelivery.distance_km.toFixed(1)} km
                    </p>
                  </div>
                )}
              </div>

              {selectedDelivery.open_issues > 0 && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-semibold">
                      {selectedDelivery.open_issues} Active Issue
                      {selectedDelivery.open_issues > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDetailsDialog(false)}
            >
              Close
            </Button>
            {selectedDelivery?.delivery_latitude &&
              selectedDelivery?.delivery_longitude && (
                <Button onClick={() => handleNavigate(selectedDelivery)}>
                  <Navigation className="h-4 w-4 mr-2" />
                  Open in Maps
                </Button>
              )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeliveryDashboard;
