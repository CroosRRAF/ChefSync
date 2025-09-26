import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Search, Plus, Trash2, Edit2, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface DeliveryAddress {
  id: number;
  label: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  pincode: string;
  latitude: number;
  longitude: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface SimpleDeliveryAddressSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressSelect: (address: DeliveryAddress) => void;
  selectedAddress?: DeliveryAddress | null;
}

interface LocationCoords {
  latitude: number;
  longitude: number;
}

// Mock saved addresses
const mockAddresses: DeliveryAddress[] = [
  {
    id: 1,
    label: "Home",
    address_line1: "123 Main Street, Apartment 4B",
    address_line2: "Near Central Park",
    city: "Colombo",
    pincode: "00100",
    latitude: 6.9271,
    longitude: 79.8612,
    is_default: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    label: "Work",
    address_line1: "456 Business Avenue, Floor 12",
    city: "Colombo",
    pincode: "00200",
    latitude: 6.9344,
    longitude: 79.8428,
    is_default: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Sri Lankan cities and postal codes
const sriLankanCities = [
  { city: "Colombo", pincode: "00100" },
  { city: "Kandy", pincode: "20000" },
  { city: "Galle", pincode: "80000" },
  { city: "Jaffna", pincode: "40000" },
  { city: "Negombo", pincode: "11500" },
  { city: "Anuradhapura", pincode: "50000" },
  { city: "Trincomalee", pincode: "31000" },
  { city: "Batticaloa", pincode: "30000" },
  { city: "Kurunegala", pincode: "60000" },
  { city: "Ratnapura", pincode: "70000" },
  { city: "Matara", pincode: "81000" },
  { city: "Badulla", pincode: "90000" },
  { city: "Kalmunai", pincode: "32300" },
  { city: "Vavuniya", pincode: "43000" },
  { city: "Chilaw", pincode: "61000" }
];

const SimpleDeliveryAddressSelector: React.FC<SimpleDeliveryAddressSelectorProps> = ({
  isOpen,
  onClose,
  onAddressSelect,
  selectedAddress
}) => {
  const [addresses, setAddresses] = useState<DeliveryAddress[]>(mockAddresses);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<DeliveryAddress | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    label: '',
    address_line1: '',
    address_line2: '',
    city: '',
    pincode: '',
    latitude: 0,
    longitude: 0,
    is_default: false
  });

  const resetForm = () => {
    setFormData({
      label: '',
      address_line1: '',
      address_line2: '',
      city: '',
      pincode: '',
      latitude: 0,
      longitude: 0,
      is_default: false
    });
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCityChange = (cityName: string) => {
    const cityData = sriLankanCities.find(c => c.city === cityName);
    setFormData(prev => ({
      ...prev,
      city: cityName,
      pincode: cityData?.pincode || '',
      // Set approximate coordinates for major Sri Lankan cities
      latitude: getCityCoordinates(cityName).lat,
      longitude: getCityCoordinates(cityName).lng
    }));
  };

  const getCityCoordinates = (city: string): { lat: number; lng: number } => {
    const coordinates: { [key: string]: { lat: number; lng: number } } = {
      'Colombo': { lat: 6.9271, lng: 79.8612 },
      'Kandy': { lat: 7.2906, lng: 80.6337 },
      'Galle': { lat: 6.0535, lng: 80.2210 },
      'Jaffna': { lat: 9.6615, lng: 80.0255 },
      'Negombo': { lat: 7.2084, lng: 79.8358 },
      'Anuradhapura': { lat: 8.3114, lng: 80.4037 },
      'Trincomalee': { lat: 8.5874, lng: 81.2152 },
      'Batticaloa': { lat: 7.7210, lng: 81.6853 },
      'Kurunegala': { lat: 7.4818, lng: 80.3609 },
      'Ratnapura': { lat: 6.6828, lng: 80.4034 },
      'Matara': { lat: 5.9549, lng: 80.5550 },
      'Badulla': { lat: 6.9934, lng: 81.0550 },
      'Kalmunai': { lat: 7.4098, lng: 81.8346 },
      'Vavuniya': { lat: 8.7514, lng: 80.4971 },
      'Chilaw': { lat: 7.5759, lng: 79.7956 }
    };
    return coordinates[city] || { lat: 6.9271, lng: 79.8612 }; // Default to Colombo
  };

  const getCurrentLocation = (): Promise<LocationCoords> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout
        maximumAge: 30000 // Cache for 30 seconds
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          resolve(coords);
        },
        (error) => {
          let errorMessage = 'Failed to get current location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please allow location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable. Please enter address manually.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again or enter address manually.';
              break;
            default:
              errorMessage = 'An unknown error occurred while retrieving location.';
              break;
          }
          
          reject(new Error(errorMessage));
        },
        options
      );
    });
  };

  const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
    // Simple reverse geocoding without external API
    // Find the nearest city based on coordinates
    let nearestCity = 'Colombo';
    let minDistance = Infinity;

    sriLankanCities.forEach(cityData => {
      const cityCoords = getCityCoordinates(cityData.city);
      const distance = Math.sqrt(
        Math.pow(latitude - cityCoords.lat, 2) + Math.pow(longitude - cityCoords.lng, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = cityData.city;
      }
    });

    return `Current Location near ${nearestCity}`;
  };

  const handleUseCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const coords = await getCurrentLocation();
      setCurrentLocation(coords);
      
      // Reverse geocode to get approximate address
      const approximateAddress = await reverseGeocode(coords.latitude, coords.longitude);
      
      // Find nearest city
      let nearestCity = 'Colombo';
      let minDistance = Infinity;

      sriLankanCities.forEach(cityData => {
        const cityCoords = getCityCoordinates(cityData.city);
        const distance = Math.sqrt(
          Math.pow(coords.latitude - cityCoords.lat, 2) + 
          Math.pow(coords.longitude - cityCoords.lng, 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestCity = cityData.city;
        }
      });

      const cityData = sriLankanCities.find(c => c.city === nearestCity);

      setFormData({
        label: 'Current Location',
        address_line1: approximateAddress,
        address_line2: `Lat: ${coords.latitude.toFixed(6)}, Lng: ${coords.longitude.toFixed(6)}`,
        city: nearestCity,
        pincode: cityData?.pincode || '00100',
        latitude: coords.latitude,
        longitude: coords.longitude,
        is_default: false
      });

      setShowAddForm(true);
      toast.success('Current location detected successfully!');
    } catch (error) {
      console.error('Error getting current location:', error);
      toast.error((error as Error).message);
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleSaveAddress = () => {
    if (!formData.label || !formData.address_line1 || !formData.city) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newAddress: DeliveryAddress = {
      id: editingAddress ? editingAddress.id : Date.now(),
      ...formData,
      created_at: editingAddress ? editingAddress.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (editingAddress) {
      setAddresses(prev => prev.map(addr => 
        addr.id === editingAddress.id ? newAddress : addr
      ));
      toast.success('Address updated successfully!');
    } else {
      setAddresses(prev => [...prev, newAddress]);
      toast.success('Address added successfully!');
    }

    resetForm();
    setShowAddForm(false);
    setEditingAddress(null);
  };

  const handleEditAddress = (address: DeliveryAddress) => {
    setFormData({
      label: address.label,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || '',
      city: address.city,
      pincode: address.pincode,
      latitude: address.latitude,
      longitude: address.longitude,
      is_default: address.is_default
    });
    setEditingAddress(address);
    setShowAddForm(true);
  };

  const handleDeleteAddress = (addressId: number) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      setAddresses(prev => prev.filter(addr => addr.id !== addressId));
      toast.success('Address deleted successfully!');
    }
  };

  const handleSetDefault = (addressId: number) => {
    setAddresses(prev => prev.map(addr => ({
      ...addr,
      is_default: addr.id === addressId
    })));
    toast.success('Default address updated!');
  };

  const handleSelectAddress = (address: DeliveryAddress) => {
    onAddressSelect(address);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-orange-500" />
            Select Delivery Address
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {!showAddForm ? (
            <ScrollArea className="h-[500px]">
              <div className="p-6 space-y-4">
                {/* Current Location Button */}
                <Card>
                  <CardContent className="p-4">
                    <Button
                      onClick={handleUseCurrentLocation}
                      disabled={loadingLocation}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2"
                    >
                      {loadingLocation ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Detecting Location...
                        </>
                      ) : (
                        <>
                          <Navigation className="h-4 w-4" />
                          Use Current Location
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Allow location access for accurate delivery
                    </p>
                  </CardContent>
                </Card>

                {/* Add New Address Button */}
                <Button
                  onClick={() => {
                    resetForm();
                    setShowAddForm(true);
                  }}
                  className="w-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add New Address
                </Button>

                {/* Saved Addresses */}
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Saved Addresses</h3>
                  {addresses.map((address) => (
                    <Card 
                      key={address.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedAddress?.id === address.id ? 'ring-2 ring-orange-500' : ''
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div 
                            className="flex-1 min-w-0"
                            onClick={() => handleSelectAddress(address)}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-gray-900">{address.label}</h4>
                              {address.is_default && (
                                <Badge variant="secondary" className="text-xs">
                                  Default
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              {address.address_line1}
                            </p>
                            {address.address_line2 && (
                              <p className="text-sm text-gray-600 mb-1">
                                {address.address_line2}
                              </p>
                            )}
                            <p className="text-sm text-gray-500">
                              {address.city}, {address.pincode}
                            </p>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditAddress(address)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAddress(address.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-3">
                          <Button
                            onClick={() => handleSelectAddress(address)}
                            size="sm"
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Select
                          </Button>
                          {!address.is_default && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetDefault(address.id)}
                            >
                              Set Default
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </ScrollArea>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">
                    {editingAddress ? 'Edit Address' : 'Add New Address'}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingAddress(null);
                      resetForm();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="label">Address Label *</Label>
                    <Input
                      id="label"
                      placeholder="e.g., Home, Work, etc."
                      value={formData.label}
                      onChange={(e) => handleInputChange('label', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="address_line1">Address Line 1 *</Label>
                    <Input
                      id="address_line1"
                      placeholder="Street address, building name"
                      value={formData.address_line1}
                      onChange={(e) => handleInputChange('address_line1', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="address_line2">Address Line 2 (Optional)</Label>
                    <Input
                      id="address_line2"
                      placeholder="Apartment, suite, unit, etc."
                      value={formData.address_line2}
                      onChange={(e) => handleInputChange('address_line2', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <select
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleCityChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="">Select City</option>
                        {sriLankanCities.map((cityData) => (
                          <option key={cityData.city} value={cityData.city}>
                            {cityData.city}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="pincode">Postal Code</Label>
                      <Input
                        id="pincode"
                        placeholder="Postal code"
                        value={formData.pincode}
                        onChange={(e) => handleInputChange('pincode', e.target.value)}
                      />
                    </div>
                  </div>

                  {currentLocation && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-700">
                        <strong>Current Location Detected:</strong><br />
                        Lat: {currentLocation.latitude.toFixed(6)}, 
                        Lng: {currentLocation.longitude.toFixed(6)}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_default"
                      checked={formData.is_default}
                      onChange={(e) => handleInputChange('is_default', e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="is_default">Set as default address</Label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleSaveAddress}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {editingAddress ? 'Update Address' : 'Save Address'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingAddress(null);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimpleDeliveryAddressSelector;