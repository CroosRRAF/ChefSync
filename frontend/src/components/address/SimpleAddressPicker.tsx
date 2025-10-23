import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Navigation, Search, Plus, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { addressService, DeliveryAddress } from '@/services/addressService';

interface SimpleAddressPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress: (address: DeliveryAddress) => void;
  selectedAddress?: DeliveryAddress | null;
}

const SimpleAddressPicker: React.FC<SimpleAddressPickerProps> = ({
  isOpen,
  onClose,
  onSelectAddress,
  selectedAddress
}) => {
  const [showNewForm, setShowNewForm] = useState(false);
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  
  const [formData, setFormData] = useState({
    label: 'Home',
    address_line1: '',
    city: '',
    pincode: '',
    latitude: 0,
    longitude: 0,
  });

  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAddresses();
      setTimeout(() => initializeMap(), 300);
    }
  }, [isOpen]);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const data = await addressService.getAddresses();
      setAddresses(data);
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = () => {
    if (!window.google || !mapRef.current) {
      // Fallback: Load Google Maps if not already loaded
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn('Google Maps API key not configured');
        return;
      }
      
      if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMapsCallback`;
        script.async = true;
        (window as any).initGoogleMapsCallback = () => {
          setTimeout(() => initializeMap(), 100);
        };
        document.head.appendChild(script);
      }
      return;
    }

    const defaultCenter = { lat: 6.9271, lng: 79.8612 }; // Colombo

    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      zoom: 13,
      center: defaultCenter,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    // Add click listener
    mapInstanceRef.current.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        updateMapLocation(e.latLng.lat(), e.latLng.lng());
        reverseGeocode(e.latLng.lat(), e.latLng.lng());
      }
    });

    // Initialize autocomplete
    if (searchInputRef.current) {
      autocompleteRef.current = new google.maps.places.Autocomplete(searchInputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'lk' }
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place?.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          updateMapLocation(lat, lng);
          parsePlace(place);
        }
      });
    }
  };

  const updateMapLocation = (lat: number, lng: number) => {
    if (!mapInstanceRef.current) return;

    mapInstanceRef.current.setCenter({ lat, lng });
    mapInstanceRef.current.setZoom(16);

    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    markerRef.current = new google.maps.Marker({
      position: { lat, lng },
      map: mapInstanceRef.current,
      animation: google.maps.Animation.DROP,
    });

    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    if (!window.google) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        parsePlace(results[0]);
      }
    });
  };

  const parsePlace = (place: any) => {
    let address = '';
    let city = '';
    let state = '';
    let pincode = '';

    const components = place.address_components || [];
    components.forEach((comp: any) => {
      const types = comp.types;
      if (types.includes('street_number') || types.includes('route')) {
        address += comp.long_name + ' ';
      }
      if (types.includes('sublocality') || types.includes('locality')) {
        city = comp.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        state = comp.long_name;
      }
      if (types.includes('postal_code')) {
        pincode = comp.long_name;
      }
    });

    setFormData(prev => ({
      ...prev,
      address_line1: place.formatted_address || address.trim(),
      city: city || prev.city,
      state: state || city,
      pincode: pincode || prev.pincode,
    }));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateMapLocation(latitude, longitude);
        reverseGeocode(latitude, longitude);
        setGettingLocation(false);
        toast.success('Location detected');
      },
      (error) => {
        setGettingLocation(false);
        toast.error('Failed to get location. Please allow location access.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveAddress = async () => {
    if (!formData.label || !formData.address_line1) {
      toast.error('Please fill in address details');
      return;
    }

    if (formData.latitude === 0 || formData.longitude === 0) {
      toast.error('Please select location on map');
      return;
    }

    try {
      const newAddress = await addressService.createAddress({
        ...formData,
        state: formData.city, // Use city as state fallback
      });
      
      toast.success('Address saved successfully!');
      await loadAddresses();
      setShowNewForm(false);
      onSelectAddress(newAddress);
      
      // Reset form
      setFormData({
        label: 'Home',
        address_line1: '',
        city: '',
        pincode: '',
        latitude: 0,
        longitude: 0,
      });
      setSearchQuery('');
    } catch (error: any) {
      console.error('Error saving address:', error);
      toast.error(error.message || 'Failed to save address');
    }
  };

  const handleSelectAddress = (address: DeliveryAddress) => {
    onSelectAddress(address);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
        {!showNewForm ? (
          // Address List View
          <>
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <MapPin className="h-6 w-6 text-orange-500" />
                Select Delivery Address
              </DialogTitle>
            </DialogHeader>
            
            <div className="px-6 pb-6 max-h-[calc(90vh-8rem)] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" />
                </div>
              ) : addresses.length > 0 ? (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => handleSelectAddress(addr)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                        selectedAddress?.id === addr.id
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {addr.label}
                            </span>
                            {addr.is_default && (
                              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {addr.address_line1}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {addr.city}, {addr.pincode}
                          </p>
                        </div>
                        {selectedAddress?.id === addr.id && (
                          <Check className="h-5 w-5 text-orange-500 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No saved addresses</p>
                  <p className="text-sm text-gray-400">Add your first delivery address</p>
                </div>
              )}
              
              <Button
                onClick={() => setShowNewForm(true)}
                className="w-full mt-6 h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add New Address
              </Button>
            </div>
          </>
        ) : (
          // New Address Form
          <>
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl font-bold">Add New Address</DialogTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewForm(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </DialogHeader>

            <div className="px-6 pb-6 max-h-[calc(90vh-8rem)] overflow-y-auto space-y-4">
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="h-12"
                >
                  {gettingLocation ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent mr-2" />
                      Getting...
                    </>
                  ) : (
                    <>
                      <Navigation className="h-4 w-4 mr-2" />
                      Use Current Location
                    </>
                  )}
                </Button>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    ref={searchInputRef}
                    placeholder="Search address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              {/* Map */}
              <div className="relative">
                <div ref={mapRef} className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                <div className="absolute bottom-2 left-2 right-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg text-xs text-gray-600 dark:text-gray-400">
                  💡 Click anywhere on the map to set your delivery location
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Save As</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Home', 'Work', 'Other'].map((label) => (
                      <Button
                        key={label}
                        type="button"
                        variant={formData.label === label ? 'default' : 'outline'}
                        onClick={() => setFormData(prev => ({ ...prev, label }))}
                        className={formData.label === label ? 'bg-orange-500 hover:bg-orange-600' : ''}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="address" className="text-sm font-medium mb-2 block">
                    Address *
                  </Label>
                  <Input
                    id="address"
                    placeholder="Street address, building name"
                    value={formData.address_line1}
                    onChange={(e) => setFormData(prev => ({ ...prev, address_line1: e.target.value }))}
                    className="h-12"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="city" className="text-sm font-medium mb-2 block">City</Label>
                    <Input
                      id="city"
                      placeholder="City"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode" className="text-sm font-medium mb-2 block">Postal Code</Label>
                    <Input
                      id="pincode"
                      placeholder="Postal code"
                      value={formData.pincode}
                      onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                    />
                  </div>
                </div>

                {formData.latitude !== 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-green-800 dark:text-green-200">
                        <p className="font-semibold">Location Set</p>
                        <p className="mt-1">Coordinates: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}</p>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleSaveAddress}
                  disabled={!formData.address_line1 || formData.latitude === 0}
                  className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold"
                >
                  <Check className="h-5 w-5 mr-2" />
                  Save Address
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SimpleAddressPicker;

