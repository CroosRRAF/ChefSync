import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MapPin,
  Navigation,
  CheckCircle,
  AlertTriangle,
  Smartphone,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

// Import the components we've been working on
import GoogleMapComponent from "@/components/delivery/GoogleMapComponent";
import IntegratedMapView from "@/components/maps/IntegratedMapView";
import EnhancedPickupNavigation from "@/components/delivery/EnhancedPickupNavigation";
import PickupDeliveryFlow from "@/components/delivery/PickupDeliveryFlow";
import { Order } from "@/types/orderType";

// Mock order data for testing
const mockOrders: Order[] = [
  {
    id: 1,
    order_number: "ORD-001",
    customer: {
      id: 1,
      name: "John Doe",
      phone: "+1234567890",
      email: "john@example.com",
    },
    chef: {
      id: 1,
      name: "Chef Maria Rodriguez",
      email: "maria@chefsync.com",
      phone_no: "+1234567891",
      specialty: "Italian Cuisine",
      kitchen_location: "123 Chef Street, Downtown, City",
      availability_hours: "9:00 AM - 10:00 PM",
      rating_avg: 4.8,
    },
    delivery_partner: {
      id: 1,
      name: "Mike Delivery",
      phone: "+1234567892",
    },
    status: "ready",
    delivery_fee: 4.99,
    delivery_instructions: "Ring doorbell twice",
    delivery_address: "456 Customer Avenue, Residential Area, City",
    pickup_location: "123 Chef Street, Downtown, City",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_amount: 24.99,
  },
  {
    id: 2,
    order_number: "ORD-002",
    customer: {
      id: 2,
      name: "Sarah Johnson",
      phone: "+1234567893",
      email: "sarah@example.com",
    },
    chef: {
      id: 2,
      name: "Chef David Kim",
      email: "david@chefsync.com",
      phone_no: "+1234567894",
      specialty: "Asian Fusion",
      kitchen_location: "789 Spice Lane, Culinary Quarter, City",
      availability_hours: "11:00 AM - 11:00 PM",
      rating_avg: 4.6,
    },
    delivery_partner: null,
    status: "out_for_delivery",
    delivery_fee: 3.99,
    delivery_instructions: "Apartment 4B, use side entrance",
    delivery_address: "321 Oak Street, Apartment Complex, City",
    pickup_location: "789 Spice Lane, Culinary Quarter, City",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_amount: 18.75,
  },
];

const PickupNavigationTestPage: React.FC = () => {
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState(mockOrders[0]);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

  // Check if Google Maps is loaded
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setGoogleMapsLoaded(true);
      } else {
        setTimeout(checkGoogleMaps, 1000);
      }
    };
    checkGoogleMaps();
  }, []);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Location error:", error);
          setLocationError(error.message);
          // Use default location (San Francisco)
          setCurrentLocation({
            lat: 37.7749,
            lng: -122.4194,
          });
        }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser");
      setCurrentLocation({
        lat: 37.7749,
        lng: -122.4194,
      });
    }
  }, []);

  const handleOrderSelect = (order: any) => {
    setSelectedOrder(order);
  };

  const handleGetDirections = (order: any) => {
    console.log("Getting directions for order:", order.id);
  };

  const refreshLocation = () => {
    setLocationError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          setLocationError(error.message);
        }
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🗺️ Pickup Navigation Test Suite
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Test and verify the internal maps integration and pickup navigation
            flow. This page tests the fixed Google Maps integration, direction
            rendering, and navigation components.
          </p>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span className="font-medium">Google Maps API</span>
                </div>
                {googleMapsLoaded ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Loaded
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Loading...
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Navigation className="h-5 w-5" />
                  <span className="font-medium">User Location</span>
                </div>
                {currentLocation && !locationError ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Available
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {locationError ? "Error" : "Loading..."}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Smartphone className="h-5 w-5" />
                  <span className="font-medium">Navigation Ready</span>
                </div>
                {googleMapsLoaded && currentLocation ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Ready
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Waiting...
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Location Error Alert */}
        {locationError && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Location Error: {locationError}</span>
              <Button onClick={refreshLocation} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Current Location Display */}
        {currentLocation && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium mb-1">Current Location</h3>
                  <p className="text-sm text-gray-600">
                    Lat: {currentLocation.lat.toFixed(6)}, Lng:{" "}
                    {currentLocation.lng.toFixed(6)}
                  </p>
                </div>
                <Button onClick={refreshLocation} size="sm" variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Components */}
        <Tabs defaultValue="integrated-map" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="integrated-map">Integrated Map</TabsTrigger>
            <TabsTrigger value="full-map">Full Google Map</TabsTrigger>
            <TabsTrigger value="pickup-navigation">
              Pickup Navigation
            </TabsTrigger>
            <TabsTrigger value="delivery-flow">Delivery Flow</TabsTrigger>
          </TabsList>

          <TabsContent value="integrated-map" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Integrated Map View Test
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4 mb-4">
                    {mockOrders.map((order) => (
                      <Button
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        variant={
                          selectedOrder.id === order.id ? "default" : "outline"
                        }
                        size="sm"
                      >
                        Order #{order.id}
                      </Button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Pickup Location</h4>
                      <IntegratedMapView
                        location={
                          selectedOrder.pickup_location ||
                          selectedOrder.chef.kitchen_location
                        }
                        title={`Chef ${selectedOrder.chef.name}`}
                        userLocation={currentLocation}
                      />
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Delivery Location</h4>
                      <IntegratedMapView
                        location={selectedOrder.delivery_address}
                        title={`Customer ${selectedOrder.customer.name}`}
                        userLocation={currentLocation}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="full-map" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Full Google Map Component Test
                </CardTitle>
              </CardHeader>
              <CardContent>
                {googleMapsLoaded ? (
                  <GoogleMapComponent
                    currentLocation={currentLocation}
                    orders={mockOrders}
                    onOrderSelect={handleOrderSelect}
                    onGetDirections={handleGetDirections}
                  />
                ) : (
                  <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p>Loading Google Maps...</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pickup-navigation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  Enhanced Pickup Navigation Test
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedPickupNavigation orders={mockOrders} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="delivery-flow" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  Pickup & Delivery Flow Test
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4 mb-4">
                    {mockOrders.map((order) => (
                      <Button
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        variant={
                          selectedOrder.id === order.id ? "default" : "outline"
                        }
                        size="sm"
                      >
                        Order #{order.id}
                      </Button>
                    ))}
                  </div>

                  <PickupDeliveryFlow
                    order={selectedOrder}
                    currentLocation={currentLocation}
                    onStatusUpdate={(status) =>
                      console.log("Status updated:", status)
                    }
                    onOrderComplete={() => console.log("Order completed")}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Debug Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Google Maps Loaded:</strong>{" "}
                {googleMapsLoaded ? "Yes" : "No"}
              </p>
              <p>
                <strong>Current Location:</strong>{" "}
                {currentLocation
                  ? `${currentLocation.lat.toFixed(
                      6
                    )}, ${currentLocation.lng.toFixed(6)}`
                  : "Not available"}
              </p>
              <p>
                <strong>Location Error:</strong> {locationError || "None"}
              </p>
              <p>
                <strong>Selected Order:</strong> #{selectedOrder.id} -{" "}
                {selectedOrder.customer.name}
              </p>
              <p>
                <strong>Pickup Location:</strong>{" "}
                {selectedOrder.pickup_location ||
                  selectedOrder.chef.kitchen_location}
              </p>
              <p>
                <strong>Delivery Address:</strong>{" "}
                {selectedOrder.delivery_address}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PickupNavigationTestPage;
