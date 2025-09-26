import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import GoogleMapsAddressPicker from './GoogleMapsAddressPicker';
import { DeliveryAddress } from '@/services/addressService';

const GoogleMapsTest: React.FC = () => {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<DeliveryAddress | null>(null);

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Google Maps Address Picker Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Test the Google Maps address picker functionality
            </p>
            <Button onClick={() => setShowPicker(true)}>
              Open Address Picker
            </Button>
          </div>

          {selectedAddress && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900">Selected Address:</h4>
              <p className="text-sm text-green-700">{selectedAddress.label}</p>
              <p className="text-sm text-green-600">{selectedAddress.address_line1}</p>
              <p className="text-xs text-green-500">
                {selectedAddress.city}, {selectedAddress.pincode}
              </p>
              <p className="text-xs text-green-500">
                Coordinates: {selectedAddress.latitude}, {selectedAddress.longitude}
              </p>
            </div>
          )}

          <div className="text-xs text-gray-500">
            <p><strong>Environment Check:</strong></p>
            <p>Google Maps API Key: {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? '✅ Present' : '❌ Missing'}</p>
            <p>API Base URL: {import.meta.env.VITE_API_BASE_URL || 'Not set'}</p>
          </div>
        </CardContent>
      </Card>

      <GoogleMapsAddressPicker
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onAddressSelect={(address) => {
          setSelectedAddress(address);
          setShowPicker(false);
        }}
        selectedAddress={selectedAddress}
      />
    </div>
  );
};

export default GoogleMapsTest;
