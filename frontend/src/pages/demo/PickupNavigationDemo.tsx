import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserStore } from "@/store/userStore";
import { useOrderStore } from "@/store/orderStore";
import EnhancedPickupNavigation from "@/components/delivery/EnhancedPickupNavigation";
import PickupLocationDemo from "@/components/demo/PickupLocationDemo";
import { Order } from "@/types/orderType";
import {
  MapPin,
  Navigation,
  ExternalLink,
  Smartphone,
  Truck,
  Clock,
  CheckCircle,
} from "lucide-react";

const PickupNavigationDemo: React.FC = () => {
  const { user } = useUserStore();
  const { orders } = useOrderStore();

  // Mock orders with enhanced pickup location data
  const mockOrders: Order[] = [
    {
      id: 1,
      order_number: "ORD-001",
      customer: {
        id: 1,
        name: "John Customer",
        phone: "+1234567890",
      },
      chef: {
        id: 1,
        name: "Chef Maria Rodriguez",
        email: "maria@chefsync.com",
        phone_no: "+1234567891",
        specialty: "Italian Cuisine",
        kitchen_location:
          "123 Culinary Street, Downtown Kitchen District, City",
        availability_hours: "9:00 AM - 10:00 PM",
        rating_avg: 4.8,
      },
      delivery_partner: null,
      status: "ready",
      delivery_fee: 2.99,
      delivery_instructions: "Please call when you arrive at the gate",
      delivery_address: "456 Customer Avenue, Residential Area, City",
      pickup_location: "123 Culinary Street, Downtown Kitchen District, City",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      total_amount: 25.99,
    },
    {
      id: 2,
      order_number: "ORD-002",
      customer: {
        id: 2,
        name: "Sarah Johnson",
        phone: "+1234567892",
      },
      chef: {
        id: 2,
        name: "Chef David Kim",
        email: "david@chefsync.com",
        phone_no: "+1234567893",
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
      total_amount: 32.5,
    },
    {
      id: 3,
      order_number: "ORD-003",
      customer: {
        id: 3,
        name: "Mike Thompson",
        phone: "+1234567894",
      },
      chef: {
        id: 3,
        name: "Chef Elena Martinez",
        email: "elena@chefsync.com",
        phone_no: "+1234567895",
        specialty: "Mediterranean",
        kitchen_location: "555 Olive Grove Way, Chef's District, City",
        availability_hours: "10:00 AM - 9:00 PM",
        rating_avg: 4.9,
      },
      delivery_partner: null,
      status: "in_transit",
      delivery_fee: 2.49,
      delivery_instructions: "Ring doorbell twice",
      delivery_address: "987 Pine Road, Suburban Area, City",
      pickup_location: "555 Olive Grove Way, Chef's District, City",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      total_amount: 18.75,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🧭 Enhanced Pickup Navigation Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Experience the new dual navigation system for pickup locations.
            Choose between Google Maps navigation or integrated quick navigation
            for optimal delivery efficiency.
          </p>
        </div>

        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-blue-600" />
                Google Maps Navigation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Opens in new tab with full Google Maps features
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Turn-by-turn navigation with voice guidance
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Real-time traffic updates and route optimization
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Works offline with downloaded maps
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-green-600" />
                Quick Navigate (Integrated)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Stays within the ChefSync app
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Quick map overview with location reference
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Direct access to chef/customer contact info
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Fast loading and minimal data usage
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Demo Tabs */}
        <Tabs defaultValue="enhanced" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="enhanced" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Enhanced Navigation
            </TabsTrigger>
            <TabsTrigger value="original" className="flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              Original Demo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="enhanced" className="mt-6">
            <EnhancedPickupNavigation orders={mockOrders} />
          </TabsContent>

          <TabsContent value="original" className="mt-6">
            <PickupLocationDemo orders={mockOrders} />
          </TabsContent>
        </Tabs>

        {/* Implementation Notes */}
        <Card className="mt-8 bg-gray-50 border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Implementation Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-2 text-blue-600">
                  📍 Location Sources
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>
                    • <code>order.pickup_location</code>
                  </li>
                  <li>
                    • <code>order.chef.kitchen_location</code>
                  </li>
                  <li>• Fallback to cook profile address</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-green-600">
                  🧭 Navigation Methods
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Google Maps external navigation</li>
                  <li>• Integrated map modal dialog</li>
                  <li>• Quick contact options</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-purple-600">
                  ⚡ Performance
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Fast loading map previews</li>
                  <li>• Optimized for mobile devices</li>
                  <li>• Minimal API calls</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PickupNavigationDemo;
