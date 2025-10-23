import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Search, Plus, Check, X, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { addressService, DeliveryAddress } from '@/services/addressService';

interface GoogleMapsAddressPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressSelect: (address: DeliveryAddress) => void;
  selectedAddress?: DeliveryAddress | null;
}

interface LocationState {
  lat: number;
  lng: number;
  address: string;
  formatted_address: string;
}

const GoogleMapsAddressPicker: React.FC<GoogleMapsAddressPickerProps> = ({
  isOpen,
  onClose,
  onAddressSelect,
  selectedAddress
}) => {
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState<LocationState | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<DeliveryAddress | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'saved' | 'map' | 'current'>('saved');
  
  // Form state
  const [formData, setFormData] = useState({
    label: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
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
      // Delay map loading to ensure DOM is ready
      setTimeout(() => {
        loadGoogleMaps();
      }, 100);
    }
  }, [isOpen]);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const addresses = await addressService.getAddresses();
      console.log('Loaded addresses:', addresses);
      setAddresses(Array.isArray(addresses) ? addresses : []);
    } catch (error) {
      console.error('Error loading addresses:', error);
      // Fallback to mock data if API is not available
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
      setAddresses(mockAddresses);
      toast.warning('Using offline mode - addresses will not be saved');
    } finally {
      setLoading(false);
    }
  };

  const loadGoogleMaps = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    console.log('Loading Google Maps with API key:', apiKey ? 'Present' : 'Missing');
    
    if (!apiKey) {
      console.error('Google Maps API key not found');
      toast.error('Google Maps API key is not configured');
      return;
    }

    if (window.google && window.google.maps) {
      console.log('Google Maps already loaded');
      setMapsLoaded(true);
      initializeMap();
      return;
    }

    // Check if script is already loading
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      console.log('Google Maps script already exists, waiting for load...');
      // Script is already loading, wait for it
      const checkLoaded = () => {
        if (window.google && window.google.maps) {
          console.log('Google Maps loaded successfully');
          setMapsLoaded(true);
          initializeMap();
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
      return;
    }

    console.log('Loading Google Maps script...');
    // Load Google Maps script with proper async loading
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps&loading=async`;
    script.async = true;
    script.defer = true;
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('loading', 'async');
    
    (window as any).initGoogleMaps = () => {
      console.log('Google Maps callback triggered');
      setMapsLoaded(true);
      initializeMap();
    };
    
    script.onerror = () => {
      console.error('Failed to load Google Maps script');
      toast.error('Failed to load Google Maps');
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
    console.log('Initializing Google Map...');
    
    // Default to Colombo, Sri Lanka
    const defaultCenter = { lat: 6.9271, lng: 79.8612 };
    
    const mapElement = document.getElementById('address-picker-map');
    if (!mapElement) {
      console.error('Map element not found');
      return;
    }
    
    if (!window.google || !window.google.maps) {
      console.error('Google Maps not loaded');
      return;
    }

    try {
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

      console.log('Google Map initialized successfully');

      // Add click listener to map
      mapRef.current.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          console.log('Map clicked at:', lat, lng);
          updateLocation(lat, lng);
          reverseGeocode(lat, lng);
        }
      });

      // Initialize autocomplete
      initAutocomplete();
    } catch (error) {
      console.error('Error initializing map:', error);
      toast.error('Failed to initialize map');
    }
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
    let state = '';
    let pincode = '';

    components.forEach(component => {
      const types = component.types;
      
      if (types.includes('locality') || types.includes('administrative_area_level_2')) {
        city = component.long_name;
      }
      
      if (types.includes('administrative_area_level_1')) {
        state = component.long_name;
      }
      
      if (types.includes('postal_code')) {
        pincode = component.long_name;
      }
    });

    setFormData(prev => ({
      ...prev,
      city: city || prev.city,
      state: state || prev.state || city, // Fallback to city if state not found
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
          
          // Auto-open the form when location is selected from map
          if (!showAddForm) {
            setShowAddForm(true);
            toast.success('Location selected! Fill in the remaining details.');
          }
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
        setActiveTab('current');
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
    onClose();
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
      if (editingAddress) {
        const updatedAddress = await addressService.updateAddress({
          id: editingAddress.id,
          ...formData
        });
        setAddresses(prev => prev.map(addr => addr.id === editingAddress.id ? updatedAddress : addr));
        toast.success('Address updated successfully');
      } else {
        const newAddress = await addressService.createAddress(formData);
        setAddresses(prev => [...prev, newAddress]);
        toast.success('Address added successfully');
      }
      
      resetForm();
      setShowAddForm(false);
      setEditingAddress(null);
    } catch (error) {
      console.error('Error saving address:', error);
      // Fallback to local storage for offline mode
      const newAddress: DeliveryAddress = {
        id: editingAddress?.id || Date.now(),
        ...formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      if (editingAddress) {
        setAddresses(prev => prev.map(addr => addr.id === editingAddress.id ? newAddress : addr));
        toast.success('Address updated locally');
      } else {
        setAddresses(prev => [...prev, newAddress]);
        toast.success('Address added locally');
      }
      
      resetForm();
      setShowAddForm(false);
      setEditingAddress(null);
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    try {
      await addressService.deleteAddress(addressId);
      setAddresses(prev => prev.filter(addr => addr.id !== addressId));
      toast.success('Address deleted');
    } catch (error) {
      console.error('Error deleting address:', error);
      // Fallback to local deletion
      setAddresses(prev => prev.filter(addr => addr.id !== addressId));
      toast.success('Address deleted locally');
    }
  };

  const handleSetDefault = async (addressId: number) => {
    try {
      await addressService.setDefaultAddress(addressId);
      setAddresses(prev => prev.map(addr => ({ 
        ...addr, 
        is_default: addr.id === addressId 
      })));
      toast.success('Default address updated');
    } catch (error) {
      console.error('Error setting default address:', error);
      // Fallback to local update
      setAddresses(prev => prev.map(addr => ({ 
        ...addr, 
        is_default: addr.id === addressId 
      })));
      toast.success('Default address updated locally');
    }
  };

  const resetForm = () => {
    setFormData({
      label: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
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
      state: address.state || address.city || '',
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

  const useCurrentLocation = () => {
    if (currentLocation) {
      // Auto-fill the form with current location
      setFormData(prev => ({
        ...prev,
        address_line1: currentLocation.formatted_address,
        latitude: currentLocation.lat,
        longitude: currentLocation.lng
      }));
      
      // Open the form to let user complete the details
      if (!showAddForm) {
        setShowAddForm(true);
        toast.success('Current location set! Please complete the address details.');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-orange-500" />
            Choose Delivery Address
          </DialogTitle>
          <DialogDescription>
            Select your delivery address using current location, map search, or saved addresses.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Panel - Address Options */}
          <div className="lg:w-1/2 space-y-4">
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('saved')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'saved'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Saved Addresses
              </button>
              <button
                onClick={() => setActiveTab('map')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'map'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Map Search
              </button>
              <button
                onClick={() => setActiveTab('current')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'current'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Current Location
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'saved' && (
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
                      (addresses || []).map((address) => (
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
            )}

            {activeTab === 'map' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Search on Map</h3>
                  {showAddForm && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                      <MapPin className="h-3 w-3 mr-1" />
                      Click map to auto-fill form
                    </Badge>
                  )}
                </div>
                
                {/* Instructions */}
                <Card className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                    📍 How to select your location:
                  </p>
                  <ul className="text-xs text-blue-700 dark:text-blue-200 space-y-1 list-disc list-inside">
                    <li>Search for an address in the box below</li>
                    <li>Click anywhere on the map to select a location</li>
                    {showAddForm && <li className="font-semibold">Selected location will auto-fill your form →</li>}
                  </ul>
                </Card>
                
                {/* Search Input */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      ref={searchInputRef}
                      placeholder="Search for location..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10"
                    />
                  </div>
                  
                  {currentLocation && (
                    <Card className="p-3 bg-green-50 border-green-200">
                      <div className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-900">
                            Location Selected
                          </p>
                          <p className="text-xs text-green-700 mt-1">
                            {currentLocation.formatted_address}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>

        {/* Google Map */}
        <div className="relative">
          <div 
            id="address-picker-map" 
            className="w-full h-64 bg-gray-200 rounded-lg"
          />
          {!mapsLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent mx-auto mb-2" />
                <p className="text-sm text-gray-600">Loading map...</p>
                <p className="text-xs text-gray-500 mt-1">If map doesn't load, check your Google Maps API key</p>
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
            )}

            {activeTab === 'current' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Current Location</h3>
                
                <Button
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  {gettingLocation ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Getting Location...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4" />
                      Use Current Location
                    </div>
                  )}
                </Button>
                
                {currentLocation && (
                  <Card className="p-4 bg-green-50 border-green-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-900 mb-1">
                          Current Location Detected
                        </p>
                        <p className="text-xs text-green-700 mb-3">
                          {currentLocation.formatted_address}
                        </p>
                        <Button
                          onClick={useCurrentLocation}
                          size="sm"
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Use This Location
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Right Panel - Add/Edit Form */}
          {showAddForm && (
            <div className="lg:w-1/2">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingAddress ? 'Edit Address' : 'Add New Address'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Quick Action Buttons */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActiveTab('map');
                        setShowAddForm(true);
                      }}
                      className="bg-white hover:bg-blue-50 border-blue-300 text-blue-700 hover:text-blue-800"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Choose on Map
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        getCurrentLocation();
                        setActiveTab('current');
                      }}
                      disabled={gettingLocation}
                      className="bg-white hover:bg-green-50 border-green-300 text-green-700 hover:text-green-800"
                    >
                      {gettingLocation ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-green-600 border-t-transparent mr-2" />
                          Getting...
                        </>
                      ) : (
                        <>
                          <Navigation className="h-4 w-4 mr-2" />
                          Current Location
                        </>
                      )}
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor="label">Address Label *</Label>
                    <Input
                      id="label"
                      placeholder="e.g. Home, Work, Office"
                      value={formData.label}
                      onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="address_line1">Address Line 1 *</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveTab('map')}
                        className="text-xs h-7 border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        Choose on Map
                      </Button>
                    </div>
                    <Textarea
                      id="address_line1"
                      placeholder="Street address, building name, etc."
                      value={formData.address_line1}
                      onChange={(e) => setFormData(prev => ({ ...prev, address_line1: e.target.value }))}
                      rows={2}
                    />
                    <p className="text-xs text-gray-500">
                      Tip: Click "Choose on Map" to select your location visually
                    </p>
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
                    <Card className="p-3 bg-green-50 border-green-200">
                      <div className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-green-900">
                            Location Set Successfully
                          </p>
                          <p className="text-xs text-green-700 mt-1">
                            <strong>Coordinates:</strong> {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            Your delivery address is pinpointed for accurate delivery
                          </p>
                        </div>
                      </div>
                    </Card>
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
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GoogleMapsAddressPicker;
