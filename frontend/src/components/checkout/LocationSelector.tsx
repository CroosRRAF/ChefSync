import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MapPin, Navigation, Search, Plus, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCartService, UserAddress } from '@/services/cartService';
import { toast } from 'sonner';

interface LocationSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (address: UserAddress) => void;
  selectedAddress?: UserAddress | null;
}

interface LocationState {
  lat: number;
  lng: number;
  address: string;
  formatted_address: string;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  isOpen,
  onClose,
  onLocationSelect,
  selectedAddress
}) => {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState<LocationState | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  
  // Form state for adding/editing addresses
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
  const { loadAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useCartService();

  useEffect(() => {
    if (isOpen) {
      loadUserAddresses();
      initializeGoogleMaps();
    }
  }, [isOpen]);

  const loadUserAddresses = async () => {
    setLoading(true);
    try {
      const userAddresses = await loadAddresses();
      setAddresses(userAddresses);
    } catch (error) {
      console.error('Error loading addresses:', error);
      toast.error('Failed to load saved addresses');
    } finally {
      setLoading(false);
    }
  };

  const initializeGoogleMaps = () => {
    if (!window.google) {
      // Load Google Maps script if not already loaded
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap&loading=async`;
  script.async = true;
  script.defer = true;
      
      (window as any).initMap = () => {
        initMap();
        initAutocomplete();
      };
      
      document.head.appendChild(script);
    } else {
      initMap();
      initAutocomplete();
    }
  };

  const initMap = () => {
    // Default to Colombo, Sri Lanka
    const defaultCenter = { lat: 6.9271, lng: 79.8612 };
    
    const mapElement = document.getElementById('google-map');
    if (!mapElement) return;

    mapRef.current = new google.maps.Map(mapElement, {
      zoom: 13,
      center: defaultCenter,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    // Add click listener to map
    mapRef.current.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        reverseGeocode(lat, lng);
      }
    });
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
      
      setCurrentLocation({
        lat,
        lng,
        address: place.name || '',
        formatted_address: place.formatted_address || ''
      });

      // Update map
      if (mapRef.current) {
        mapRef.current.setCenter({ lat, lng });
        mapRef.current.setZoom(16);
        
        // Add marker
        new google.maps.Marker({
          position: { lat, lng },
          map: mapRef.current,
          title: 'Selected Location'
        });
      }

      // Update form data
      setFormData(prev => ({
        ...prev,
        address_line1: place.formatted_address || '',
        latitude: lat,
        longitude: lng
      }));
    }
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

          // Add marker
          if (mapRef.current) {
            new google.maps.Marker({
              position: { lat, lng },
              map: mapRef.current,
              title: 'Selected Location'
            });
          }
        }
      }
    );
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
        reverseGeocode(latitude, longitude);
        
        if (mapRef.current) {
          mapRef.current.setCenter({ lat: latitude, lng: longitude });
          mapRef.current.setZoom(16);
        }
        
        setGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Failed to get current location');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleAddressSelect = (address: UserAddress) => {
    onLocationSelect(address);
    onClose();
  };

  const handleSaveAddress = async () => {
    if (!formData.label || !formData.address_line1) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, formData);
        toast.success('Address updated successfully');
      } else {
        await addAddress(formData);
        toast.success('Address added successfully');
      }
      
      await loadUserAddresses();
      setShowAddForm(false);
      setEditingAddress(null);
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
    } catch (error) {
      toast.error('Failed to save address');
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    try {
      await deleteAddress(addressId);
      toast.success('Address deleted');
      await loadUserAddresses();
    } catch (error) {
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (addressId: number) => {
    try {
      await setDefaultAddress(addressId);
      toast.success('Default address updated');
      await loadUserAddresses();
    } catch (error) {
      toast.error('Failed to update default address');
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-orange-500" />
            Select Delivery Location
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[70vh]">
          {/* Saved Addresses */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Saved Addresses</h3>
              <Button
                size="sm"
                onClick={() => {
                  setShowAddForm(true);
                  setEditingAddress(null);
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
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add New
              </Button>
            </div>

            <ScrollArea className="h-[500px]">
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
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingAddress(address);
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
                                setShowAddForm(true);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAddress(address.id);
                              }}
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

          {/* Map and Search */}
          <div className="space-y-4">
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
            <div 
              id="google-map" 
              className="w-full h-[400px] bg-gray-200 rounded-lg"
            />

            {/* Use Current Location Button */}
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
                Save This Location
              </Button>
            )}
          </div>
        </div>

        {/* Add/Edit Address Form */}
        {showAddForm && (
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="label">Label *</Label>
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
                    placeholder="Street address"
                    value={formData.address_line1}
                    onChange={(e) => setFormData(prev => ({ ...prev, address_line1: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="address_line2">Address Line 2</Label>
                  <Input
                    id="address_line2"
                    placeholder="Apartment, suite, etc. (optional)"
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

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveAddress}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    {editingAddress ? 'Update' : 'Save'} Address
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LocationSelector;