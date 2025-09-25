import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUserStore } from "@/store/userStore";
import DeliveryLayout from "@/components/delivery/DeliveryLayout";
import {
  Settings,
  Save,
  Truck,
  Clock,
  Bell,
  Shield,
  MapPin,
} from "lucide-react";

const DeliverySettings: React.FC = () => {
  const { user } = useUserStore();

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <DeliveryLayout
      title="Delivery Settings"
      description="Configure your delivery preferences and notifications for optimal performance"
    >
      <div className="space-y-8">
        {/* Delivery Preferences */}
        <Card
          className="group border-none theme-card-hover theme-animate-fade-in-up"
          style={{ background: "var(--bg-card)" }}
        >
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-xl theme-text-primary">
              <div className="theme-primary-gradient rounded-full p-2">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <span>Delivery Preferences</span>
            </CardTitle>
            <CardDescription className="text-base theme-text-secondary">
              Configure your delivery workflow and limits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                style={{ backgroundColor: "rgba(66, 165, 245, 0.1)" }}
                className="rounded-lg p-4"
              >
                <Label
                  htmlFor="max-deliveries"
                  className="text-sm font-semibold theme-text-primary"
                >
                  Maximum Concurrent Deliveries
                </Label>
                <Input
                  id="max-deliveries"
                  type="number"
                  defaultValue="3"
                  min="1"
                  max="5"
                  className="mt-2"
                />
                <p className="text-sm theme-text-secondary mt-2">
                  How many deliveries you can handle at once
                </p>
              </div>
              <div
                style={{ backgroundColor: "rgba(67, 160, 71, 0.1)" }}
                className="rounded-lg p-4"
              >
                <Label
                  htmlFor="delivery-radius"
                  className="text-sm font-semibold theme-text-primary"
                >
                  Delivery Radius (km)
                </Label>
                <Input
                  id="delivery-radius"
                  type="number"
                  defaultValue="10"
                  min="5"
                  max="25"
                  className="mt-2"
                />
                <p className="text-sm theme-text-secondary mt-2">
                  Maximum delivery distance in km
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-purple-50 rounded-lg p-4">
                <Label
                  htmlFor="break-duration"
                  className="text-sm font-semibold text-gray-900"
                >
                  Break Duration (minutes)
                </Label>
                <Input
                  id="break-duration"
                  type="number"
                  defaultValue="30"
                  min="15"
                  max="60"
                  className="mt-2"
                />
                <p className="text-sm text-gray-600 mt-2">
                  Time for lunch and rest breaks
                </p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <Label
                  htmlFor="shift-hours"
                  className="text-sm font-semibold text-gray-900"
                >
                  Shift Hours
                </Label>
                <Input
                  id="shift-hours"
                  type="number"
                  defaultValue="8"
                  min="4"
                  max="12"
                  className="mt-2"
                />
                <p className="text-sm text-gray-600 mt-2">
                  Total working hours per day
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Settings */}
        <Card className="group hover:shadow-card transition-all duration-300 border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-xl">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-full p-2">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <span>Vehicle Settings</span>
            </CardTitle>
            <CardDescription className="text-base">
              Configure your delivery vehicle information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-indigo-50 rounded-lg p-4">
                <Label
                  htmlFor="vehicle-type"
                  className="text-sm font-semibold text-gray-900"
                >
                  Vehicle Type
                </Label>
                <select
                  id="vehicle-type"
                  className="w-full mt-2 p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="car">🚗 Car</option>
                  <option value="motorcycle">🏍️ Motorcycle</option>
                  <option value="bicycle">🚲 Bicycle</option>
                  <option value="scooter">🛴 Scooter</option>
                </select>
              </div>
              <div className="bg-teal-50 rounded-lg p-4">
                <Label
                  htmlFor="vehicle-capacity"
                  className="text-sm font-semibold text-gray-900"
                >
                  Vehicle Capacity
                </Label>
                <Input
                  id="vehicle-capacity"
                  type="number"
                  defaultValue="5"
                  min="1"
                  max="10"
                  className="mt-2"
                />
                <p className="text-sm text-gray-600 mt-2">
                  Maximum orders per trip
                </p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <Label
                htmlFor="vehicle-description"
                className="text-sm font-semibold text-gray-900"
              >
                Vehicle Description
              </Label>
              <Input
                id="vehicle-description"
                placeholder="e.g., Red Honda Civic, License Plate ABC123"
                className="mt-2"
              />
              <p className="text-sm text-gray-600 mt-2">
                Help customers identify your vehicle
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notification Settings</span>
            </CardTitle>
            <CardDescription>
              Configure how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="new-deliveries">
                  New Delivery Notifications
                </Label>
                <p className="text-sm text-gray-500">
                  Get notified when new deliveries are assigned
                </p>
              </div>
              <Switch id="new-deliveries" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="delivery-updates">
                  Delivery Status Updates
                </Label>
                <p className="text-sm text-gray-500">
                  Notifications for delivery status changes
                </p>
              </div>
              <Switch id="delivery-updates" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="break-reminders">Break Reminders</Label>
                <p className="text-sm text-gray-500">
                  Remind you to take scheduled breaks
                </p>
              </div>
              <Switch id="break-reminders" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="shift-alerts">Shift Alerts</Label>
                <p className="text-sm text-gray-500">
                  Notifications for shift start/end
                </p>
              </div>
              <Switch id="shift-alerts" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Work Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Work Schedule</span>
            </CardTitle>
            <CardDescription>Set your preferred working hours</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-time">Preferred Start Time</Label>
                <Input id="start-time" type="time" defaultValue="09:00" />
              </div>
              <div>
                <Label htmlFor="end-time">Preferred End Time</Label>
                <Input id="end-time" type="time" defaultValue="17:00" />
              </div>
            </div>
            <div>
              <Label htmlFor="work-days">Working Days</Label>
              <div className="mt-2 space-y-2">
                {[
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ].map((day) => (
                  <div key={day} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={day.toLowerCase()}
                      className="rounded"
                      defaultChecked={day !== "Sunday"}
                    />
                    <Label htmlFor={day.toLowerCase()}>{day}</Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Location Settings</span>
            </CardTitle>
            <CardDescription>
              Configure your delivery area preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="preferred-areas">Preferred Delivery Areas</Label>
              <Input
                id="preferred-areas"
                placeholder="e.g., Downtown, West Side, University District"
                className="mt-2"
              />
              <p className="text-sm text-gray-500 mt-1">
                Areas you prefer to deliver to
              </p>
            </div>
            <div>
              <Label htmlFor="avoided-areas">Areas to Avoid</Label>
              <Input
                id="avoided-areas"
                placeholder="e.g., Industrial Zone, High Traffic Areas"
                className="mt-2"
              />
              <p className="text-sm text-gray-500 mt-1">
                Areas you prefer not to deliver to
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="auto-accept" className="rounded" />
              <Label htmlFor="auto-accept">
                Auto-accept deliveries in preferred areas
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Security Settings</span>
            </CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                <p className="text-sm text-gray-500">
                  Add an extra layer of security
                </p>
              </div>
              <Switch id="two-factor" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="session-timeout">Session Timeout</Label>
                <p className="text-sm text-gray-500">
                  Auto-logout after inactivity
                </p>
              </div>
              <Switch id="session-timeout" defaultChecked />
            </div>
            <div>
              <Label htmlFor="login-notifications">Login Notifications</Label>
              <p className="text-sm text-gray-500">
                Get notified of new login attempts
              </p>
              <Switch
                id="login-notifications"
                defaultChecked
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="group hover:shadow-card transition-all duration-300 border-none shadow-lg bg-gradient-to-r from-gray-50 to-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-xl">
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-full p-2">
                <Save className="h-5 w-5 text-white" />
              </div>
              <span>Save Settings</span>
            </CardTitle>
            <CardDescription className="text-base">
              Apply your configuration changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transform hover:scale-105 transition-all duration-300 shadow-lg px-8">
                <Save className="h-4 w-4 mr-2" />
                Save All Settings
              </Button>
              <Button
                variant="outline"
                className="hover:bg-red-50 hover:border-red-300 hover:text-red-700 transform hover:scale-105 transition-all duration-300"
              >
                Reset to Defaults
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DeliveryLayout>
  );
};

export default DeliverySettings;
