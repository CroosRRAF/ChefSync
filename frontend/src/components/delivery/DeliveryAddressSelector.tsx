import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Search, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
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

interface DeliveryAddressSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressSelect: (address: DeliveryAddress) => void;
  selectedAddress?: DeliveryAddress | null;
  showHeader?: boolean;
}

interface LocationState {
  lat: number;
  lng: number;
  address: string;
  formatted_address: string;
}

// Mock API functions - replace with actual API calls
const mockDeliveryAddresses: DeliveryAddress[] = [
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

const DeliveryAddressSelector: React.FC<DeliveryAddressSelectorProps> = ({
  isOpen,
  onClose,
  onAddressSelect,
  selectedAddress,
  showHeader = true
}) => {
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState<LocationState | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<DeliveryAddress | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  
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

  const mapRef = useRef<google.maps.Map | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAddresses();
      loadGoogleMaps();
    }
  }, [isOpen]);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      // Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setAddresses(mockDeliveryAddresses);
    } catch (error) {
      console.error('Error loading addresses:', error);
      toast.error('Failed to load saved addresses');
    } finally {
      setLoading(false);
    }
  };

  const loadGoogleMaps = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.error('Google Maps API key not found');
      toast.error('Google Maps API key is not configured');
      return;
    }

    if (window.google && window.google.maps) {
      setMapsLoaded(true);
      initializeMap();
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps&loading=async`;
    script.async = true;
    script.defer = true;
    
    (window as any).initGoogleMaps = () => {
      setMapsLoaded(true);
      initializeMap();
    };
    
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete (window as any).initGoogleMaps;
    };
  };

  const initializeMap = () => {
    // Default to Colombo, Sri Lanka
    const defaultCenter = { lat: 6.9271, lng: 79.8612 };
    
    const mapElement = document.getElementById('delivery-map');
    if (!mapElement || !window.google) return;

    mapRef.current = new google.maps.Map(mapElement, {
      zoom: 13,
      center: defaultCenter,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    // Add click listener to map
    mapRef.current.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        updateLocation(lat, lng);
        reverseGeocode(lat, lng);
      }
    });

    // Initialize autocomplete
    initAutocomplete();
  };

  const initAutocomplete = () => {
    if (!searchInputRef.current || !window.google) return;

    autocompleteRef.current = new google.maps.places.Autocomplete(searchInputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'lk' } // Restrict to Sri Lanka
    });

    autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
  };

  const handlePlaceSelect = () => {
    if (!autocompleteRef.current) return;

    const place = autocompleteRef.current.getPlace();
    if (place.geometry && place.geometry.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      
      updateLocation(lat, lng);
      
      setCurrentLocation({
        lat,
        lng,
        address: place.name || '',
        formatted_address: place.formatted_address || ''
      });

      // Update form data
      setFormData(prev => ({
        ...prev,
        address_line1: place.formatted_address || '',
        latitude: lat,
        longitude: lng
      }));

      // Parse address components
      parseAddressComponents(place.address_components || []);
    }
  };

  const parseAddressComponents = (components: google.maps.GeocoderAddressComponent[]) => {
    let city = '';
    let pincode = '';

    components.forEach(component => {
      const types = component.types;
      
      if (types.includes('locality') || types.includes('administrative_area_level_2')) {
        city = component.long_name;
      }
      
      if (types.includes('postal_code')) {
        pincode = component.long_name;
      }
    });

    setFormData(prev => ({
      ...prev,
      city: city || prev.city,
      pincode: pincode || prev.pincode
    }));
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    if (!window.google) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode(
      { location: { lat, lng } },
      (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const result = results[0];
          
          setCurrentLocation({
            lat,
            lng,
            address: result.address_components?.[0]?.long_name || '',
            formatted_address: result.formatted_address
          });

          setFormData(prev => ({
            ...prev,
            address_line1: result.formatted_address,
            latitude: lat,
            longitude: lng
          }));

          // Parse address components
          parseAddressComponents(result.address_components || []);
        }
      }
    );
  };

  const updateLocation = (lat: number, lng: number) => {
    if (!mapRef.current) return;

    // Center map
    mapRef.current.setCenter({ lat, lng });
    mapRef.current.setZoom(16);
    
    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    // Add new marker
    markerRef.current = new google.maps.Marker({
      position: { lat, lng },
      map: mapRef.current,
      title: 'Selected Location',
      animation: google.maps.Animation.DROP
    });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateLocation(latitude, longitude);
        reverseGeocode(latitude, longitude);
        setGettingLocation(false);
        toast.success('Current location detected');
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = 'Failed to get current location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please allow location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        toast.error(errorMessage);
        setGettingLocation(false);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 60000 
      }
    );
  };

  const handleAddressSelect = (address: DeliveryAddress) => {
    onAddressSelect(address);
    toast.success(`Selected ${address.label} address`);
    if (!showHeader) {
      onClose();
    }
  };

  const handleSaveAddress = async () => {
    if (!formData.label || !formData.address_line1) {
      toast.error('Please fill in required fields (Label and Address)');
      return;
    }

    if (formData.latitude === 0 || formData.longitude === 0) {
      toast.error('Please select a location on the map');
      return;
    }

    try {
      // Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (editingAddress) {
        const updatedAddress = { ...editingAddress, ...formData };
        setAddresses(prev => prev.map(addr => addr.id === editingAddress.id ? updatedAddress : addr));
        toast.success('Address updated successfully');
      } else {
        const newAddress: DeliveryAddress = {
          id: Date.now(),
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setAddresses(prev => [...prev, newAddress]);
        toast.success('Address added successfully');
      }
      
      resetForm();
      setShowAddForm(false);
      setEditingAddress(null);
    } catch (error) {
      toast.error('Failed to save address');
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    try {
      // Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setAddresses(prev => prev.filter(addr => addr.id !== addressId));
      toast.success('Address deleted');
    } catch (error) {
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (addressId: number) => {
    try {
      // Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setAddresses(prev => prev.map(addr => ({ 
        ...addr, 
        is_default: addr.id === addressId 
      })));
      toast.success('Default address updated');
    } catch (error) {
      toast.error('Failed to update default address');
    }
  };

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
    setCurrentLocation(null);
    setSearchQuery('');
  };

  const openAddForm = () => {
    resetForm();
    setEditingAddress(null);
    setShowAddForm(true);
  };

  const openEditForm = (address: DeliveryAddress) => {
    setFormData({
      label: address.label,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || '',
      city: address.city,
      pincode: address.pincode,
      latitude: Number(address.latitude) || 0,
      longitude: Number(address.longitude) || 0,
      is_default: address.is_default
    });
    setEditingAddress(address);
    setShowAddForm(true);
    
    // Update map location if coordinates exist
    if (address.latitude && address.longitude) {
      updateLocation(Number(address.latitude), Number(address.longitude));
    }
  };

  if (!isOpen) return null;

  const content = (
    <div className="space-y-6">
      {/* Saved Addresses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Saved Addresses</h3>
          <Button
            size="sm"
            onClick={openAddForm}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add New
          </Button>
        </div>

        <ScrollArea className="h-64">
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent mx-auto" />
                <p className="text-sm text-gray-500 mt-2">Loading addresses...</p>
              </div>
            ) : addresses.length === 0 ? (
              <Card className="p-6 text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">No saved addresses</p>
                <p className="text-sm text-gray-400">Add your first delivery address</p>
              </Card>
            ) : (
              addresses.map((address) => (
                <Card 
                  key={address.id} 
                  className={`cursor-pointer transition-colors ${
                    selectedAddress?.id === address.id 
                      ? 'ring-2 ring-orange-500 bg-orange-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleAddressSelect(address)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{address.label}</h4>
                          {address.is_default && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {address.address_line1}
                        </p>
                        {address.address_line2 && (
                          <p className="text-sm text-gray-500 mb-2">
                            {address.address_line2}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {address.city}, {address.pincode}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {!address.is_default && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetDefault(address.id);
                            }}
                            title="Set as default"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditForm(address);
                          }}
                          title="Edit address"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAddress(address.id);
                          }}
                          title="Delete address"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Map Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Add New Address</h3>
        
        {/* Search and Current Location */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              ref={searchInputRef}
              placeholder="Search for location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={getCurrentLocation}
              disabled={gettingLocation}
              className="flex-shrink-0"
              title="Get current location"
            >
              {gettingLocation ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent" />
              ) : (
                <Navigation className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {currentLocation && (
            <Card className="p-3 bg-blue-50 border-blue-200">
              <p className="text-sm font-medium text-blue-900">
                Selected Location
              </p>
              <p className="text-xs text-blue-700">
                {currentLocation.formatted_address}
              </p>
            </Card>
          )}
        </div>

        {/* Google Map */}
        <div className="relative">
          <div 
            id="delivery-map" 
            className="w-full h-64 bg-gray-200 rounded-lg"
          />
          {!mapsLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent mx-auto mb-2" />
                <p className="text-sm text-gray-600">Loading map...</p>
              </div>
            </div>
          )}
        </div>

        {/* Use Selected Location Button */}
        {currentLocation && (
          <Button
            onClick={() => {
              setFormData(prev => ({
                ...prev,
                address_line1: currentLocation.formatted_address,
                latitude: currentLocation.lat,
                longitude: currentLocation.lng
              }));
              setShowAddForm(true);
            }}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add This Location
          </Button>
        )}
      </div>

      {/* Add/Edit Address Form */}
      {showAddForm && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="label">Address Label *</Label>
              <Input
                id="label"
                placeholder="e.g. Home, Work, Office"
                value={formData.label}
                onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="address_line1">Address Line 1 *</Label>
              <Textarea
                id="address_line1"
                placeholder="Street address, building name, etc."
                value={formData.address_line1}
                onChange={(e) => setFormData(prev => ({ ...prev, address_line1: e.target.value }))}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="address_line2">Address Line 2 (Optional)</Label>
              <Input
                id="address_line2"
                placeholder="Apartment, suite, floor, etc."
                value={formData.address_line2}
                onChange={(e) => setFormData(prev => ({ ...prev, address_line2: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="pincode">Postal Code</Label>
                <Input
                  id="pincode"
                  placeholder="Postal code"
                  value={formData.pincode}
                  onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                />
              </div>
            </div>

            {formData.latitude !== 0 && formData.longitude !== 0 && (
              <div className="text-sm text-gray-600">
                <strong>Coordinates:</strong> {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingAddress(null);
                  resetForm();
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                onClick={handleSaveAddress}
                className="bg-orange-500 hover:bg-orange-600"
                disabled={!formData.label || !formData.address_line1 || formData.latitude === 0}
              >
                <Check className="h-4 w-4 mr-1" />
                {editingAddress ? 'Update' : 'Save'} Address
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  if (showHeader) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-500" />
              Choose Delivery Address
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[75vh] pr-4">
            {content}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="p-4">
      {content}
    </div>
  );
};

export default DeliveryAddressSelector;