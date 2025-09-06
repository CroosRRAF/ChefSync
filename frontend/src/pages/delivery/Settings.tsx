import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useUserStore } from '@/store/userStore';
import { Settings, Save, Truck, Clock, Bell, Shield, MapPin } from 'lucide-react';

const DeliverySettings: React.FC = () => {
  const { user } = useUserStore();

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Delivery Settings</h1>
          <p className="text-gray-600 mt-2">Configure your delivery preferences and notifications</p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Delivery Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Truck className="h-5 w-5" />
                <span>Delivery Preferences</span>
              </CardTitle>
              <CardDescription>Configure your delivery workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max-deliveries">Maximum Concurrent Deliveries</Label>
                  <Input id="max-deliveries" type="number" defaultValue="3" min="1" max="5" />
                  <p className="text-sm text-gray-500 mt-1">How many deliveries you can handle at once</p>
                </div>
                <div>
                  <Label htmlFor="delivery-radius">Delivery Radius</Label>
                  <Input id="delivery-radius" type="number" defaultValue="10" min="5" max="25" />
                  <p className="text-sm text-gray-500 mt-1">Maximum delivery distance in km</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="break-duration">Break Duration</Label>
                  <Input id="break-duration" type="number" defaultValue="30" min="15" max="60" />
                  <p className="text-sm text-gray-500 mt-1">Minutes for lunch break</p>
                </div>
                <div>
                  <Label htmlFor="shift-hours">Shift Hours</Label>
                  <Input id="shift-hours" type="number" defaultValue="8" min="4" max="12" />
                  <p className="text-sm text-gray-500 mt-1">Hours per shift</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Truck className="h-5 w-5" />
                <span>Vehicle Settings</span>
              </CardTitle>
              <CardDescription>Configure your delivery vehicle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicle-type">Vehicle Type</Label>
                  <select id="vehicle-type" className="w-full mt-2 p-2 border rounded-md">
                    <option value="car">Car</option>
                    <option value="motorcycle">Motorcycle</option>
                    <option value="bicycle">Bicycle</option>
                    <option value="scooter">Scooter</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="vehicle-capacity">Vehicle Capacity</Label>
                  <Input id="vehicle-capacity" type="number" defaultValue="5" min="1" max="10" />
                  <p className="text-sm text-gray-500 mt-1">Maximum orders per trip</p>
                </div>
              </div>
              <div>
                <Label htmlFor="vehicle-description">Vehicle Description</Label>
                <Input 
                  id="vehicle-description" 
                  placeholder="e.g., Red Honda Civic, License Plate ABC123"
                  className="mt-2"
                />
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
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="new-deliveries">New Delivery Notifications</Label>
                  <p className="text-sm text-gray-500">Get notified when new deliveries are assigned</p>
                </div>
                <Switch id="new-deliveries" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="delivery-updates">Delivery Status Updates</Label>
                  <p className="text-sm text-gray-500">Notifications for delivery status changes</p>
                </div>
                <Switch id="delivery-updates" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="break-reminders">Break Reminders</Label>
                  <p className="text-sm text-gray-500">Remind you to take scheduled breaks</p>
                </div>
                <Switch id="break-reminders" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="shift-alerts">Shift Alerts</Label>
                  <p className="text-sm text-gray-500">Notifications for shift start/end</p>
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
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id={day.toLowerCase()} 
                        className="rounded"
                        defaultChecked={day !== 'Sunday'}
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
              <CardDescription>Configure your delivery area preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="preferred-areas">Preferred Delivery Areas</Label>
                <Input 
                  id="preferred-areas" 
                  placeholder="e.g., Downtown, West Side, University District"
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-1">Areas you prefer to deliver to</p>
              </div>
              <div>
                <Label htmlFor="avoided-areas">Areas to Avoid</Label>
                <Input 
                  id="avoided-areas" 
                  placeholder="e.g., Industrial Zone, High Traffic Areas"
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-1">Areas you prefer not to deliver to</p>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="auto-accept" className="rounded" />
                <Label htmlFor="auto-accept">Auto-accept deliveries in preferred areas</Label>
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
                  <p className="text-sm text-gray-500">Add an extra layer of security</p>
                </div>
                <Switch id="two-factor" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="session-timeout">Session Timeout</Label>
                  <p className="text-sm text-gray-500">Auto-logout after inactivity</p>
                </div>
                <Switch id="session-timeout" defaultChecked />
              </div>
              <div>
                <Label htmlFor="login-notifications">Login Notifications</Label>
                <p className="text-sm text-gray-500">Get notified of new login attempts</p>
                <Switch id="login-notifications" defaultChecked className="mt-2" />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Save or reset your settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
                <Button variant="outline">
                  Reset to Defaults
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DeliverySettings;











