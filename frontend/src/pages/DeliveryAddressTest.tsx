import React, { useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SimpleDeliveryAddressSelector from '@/components/delivery/SimpleDeliveryAddressSelector';
import { DeliveryAddress, useSimpleDeliveryAddress } from '@/hooks/useSimpleDeliveryAddress';
import { toast } from 'sonner';

const DeliveryAddressTest: React.FC = () => {
  const [showSelector, setShowSelector] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<DeliveryAddress | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const { getCurrentLocation, reverseGeocode, calculateDistance, calculateDeliveryFee } = useSimpleDeliveryAddress();

  const handleTestCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const coords = await getCurrentLocation();
      setCurrentLocation(coords);
      
      const geocoded = await reverseGeocode(coords.latitude, coords.longitude);
      toast.success(`Location detected: ${geocoded.city}`);
      
      console.log('Current Location:', coords);
      console.log('Reverse Geocoded:', geocoded);
    } catch (error) {
      console.error('Location error:', error);
      toast.error((error as Error).message);
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleAddressSelect = (address: DeliveryAddress) => {
    setSelectedAddress(address);
    setShowSelector(false);
    
    // Calculate distance if we have current location
    if (currentLocation) {
      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        address.latitude,
        address.longitude
      );
      
      const deliveryFee = calculateDeliveryFee(distance);
      
      toast.success(`Address selected! Distance: ${distance}km, Delivery Fee: Rs. ${deliveryFee}`);
    } else {
      toast.success('Address selected successfully!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Delivery Address Test</h1>
          <p className="text-gray-600">Test the simplified delivery address selector without Google Maps API</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Current Location Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5 text-blue-500" />
                Current Location Test
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleTestCurrentLocation}
                disabled={loadingLocation}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white mb-4"
              >
                {loadingLocation ? 'Getting Location...' : 'Test Current Location'}
              </Button>
              
              {currentLocation && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-700">
                    <strong>Location Detected:</strong><br />
                    Lat: {currentLocation.latitude.toFixed(6)}<br />
                    Lng: {currentLocation.longitude.toFixed(6)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Address Selector Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-500" />
                Address Selector Test
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setShowSelector(true)}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white mb-4"
              >
                Open Address Selector
              </Button>

              {selectedAddress && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                  <p className="text-sm text-orange-700">
                    <strong>Selected Address:</strong><br />
                    {selectedAddress.label}<br />
                    {selectedAddress.address_line1}<br />
                    {selectedAddress.city}, {selectedAddress.pincode}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Features List */}
        <Card>
          <CardHeader>
            <CardTitle>Features Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-green-600 mb-2">✅ Working Features:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Current location detection (GPS)</li>
                  <li>• Address management (Add/Edit/Delete)</li>
                  <li>• Sri Lankan cities database</li>
                  <li>• Distance calculation</li>
                  <li>• Delivery fee calculation</li>
                  <li>• Local storage persistence</li>
                  <li>• Default address selection</li>
                  <li>• Manual address entry</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-600 mb-2">🔧 Technical Details:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• No Google Maps API required</li>
                  <li>• Improved GPS accuracy settings</li>
                  <li>• Fallback for location failures</li>
                  <li>• Sri Lankan postal codes</li>
                  <li>• Haversine distance formula</li>
                  <li>• Responsive mobile design</li>
                  <li>• Error handling & user feedback</li>
                  <li>• TypeScript type safety</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium">1. Test Current Location:</h4>
                <p className="text-gray-600">Click "Test Current Location" and allow location access when prompted. The system will detect your GPS coordinates and find the nearest Sri Lankan city.</p>
              </div>
              <div>
                <h4 className="font-medium">2. Test Address Selector:</h4>
                <p className="text-gray-600">Click "Open Address Selector" to see the full address management interface. You can use current location, add new addresses, or select from saved addresses.</p>
              </div>
              <div>
                <h4 className="font-medium">3. Address Features:</h4>
                <p className="text-gray-600">Try adding a new address, setting defaults, editing existing addresses, and using the current location button within the selector.</p>
              </div>
              <div>
                <h4 className="font-medium">4. Location Permissions:</h4>
                <p className="text-gray-600">If location detection fails, check your browser settings to ensure location access is allowed for this site.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Address Selector Modal */}
      <SimpleDeliveryAddressSelector
        isOpen={showSelector}
        onClose={() => setShowSelector(false)}
        onAddressSelect={handleAddressSelect}
        selectedAddress={selectedAddress}
      />
    </div>
  );
};

export default DeliveryAddressTest;