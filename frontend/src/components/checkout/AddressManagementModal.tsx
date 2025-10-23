import React, { useState, useEffect, useRef } from 'react';
import { DeliveryAddress, addressService } from '@/services/addressService';
import { X, MapPin, Trash2, Save, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AddressManagementModalProps {
  address: DeliveryAddress | null;
  onClose: () => void;
  onSave: (address: DeliveryAddress) => void;
  onDelete: (id: number) => void;
}

// Google Maps types
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export const AddressManagementModal: React.FC<AddressManagementModalProps> = ({
  address,
  onClose,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState({
    label: address?.label || 'Home',
    address_line1: address?.address_line1 || '',
    address_line2: address?.address_line2 || '',
    city: address?.city || '',
    pincode: address?.pincode || '',
    latitude: address?.latitude || 0,
    longitude: address?.longitude || 0,
    is_default: address?.is_default || false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load Google Maps script
  useEffect(() => {
    const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!googleMapsApiKey) {
      console.warn('Google Maps API key not found. Map features will be limited.');
      setMapLoaded(false);
      return;
    }

    // Check if script already loaded
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setMapLoaded(true);
      initializeMap();
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps');
      toast.error('Failed to load map. You can still enter address manually.');
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const initializeMap = () => {
    if (!window.google || !mapRef.current) return;

    const initialPosition = {
      lat: formData.latitude || 28.6139, // Default to Delhi if no coords
      lng: formData.longitude || 77.2090,
    };

    // Create map
    const map = new window.google.maps.Map(mapRef.current, {
      center: initialPosition,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    mapInstanceRef.current = map;

    // Create marker
    const marker = new window.google.maps.Marker({
      map: map,
      position: initialPosition,
      draggable: true,
      animation: window.google.maps.Animation.DROP,
    });

    markerRef.current = marker;

    // Handle marker drag
    marker.addListener('dragend', () => {
      const position = marker.getPosition();
      reverseGeocode(position.lat(), position.lng());
    });

    // Handle map click
    map.addListener('click', (e: any) => {
      marker.setPosition(e.latLng);
      reverseGeocode(e.latLng.lat(), e.latLng.lng());
    });

    // Initialize autocomplete
    if (searchInputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(
        searchInputRef.current,
        {
          componentRestrictions: { country: 'in' },
          fields: ['address_components', 'geometry', 'name'],
        }
      );

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
          const location = place.geometry.location;
          marker.setPosition(location);
          map.setCenter(location);
          map.setZoom(16);
          parseAddressComponents(place.address_components, location.lat(), location.lng());
        }
      });

      autocompleteRef.current = autocomplete;
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    if (!window.google) return;

    const geocoder = new window.google.maps.Geocoder();
    const latlng = { lat, lng };

    geocoder.geocode({ location: latlng }, (results: any[], status: string) => {
      if (status === 'OK' && results[0]) {
        parseAddressComponents(results[0].address_components, lat, lng);
        setSearchQuery(results[0].formatted_address);
      }
    });
  };

  const parseAddressComponents = (components: any[], lat: number, lng: number) => {
    let addressLine1 = '';
    let city = '';
    let pincode = '';

    components.forEach((component: any) => {
      const types = component.types;
      
      if (types.includes('street_number') || types.includes('route')) {
        addressLine1 += component.long_name + ' ';
      }
      if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
        addressLine1 += component.long_name + ' ';
      }
      if (types.includes('locality')) {
        city = component.long_name;
      }
      if (types.includes('postal_code')) {
        pincode = component.long_name;
      }
    });

    setFormData(prev => ({
      ...prev,
      address_line1: addressLine1.trim() || prev.address_line1,
      city: city || prev.city,
      pincode: pincode || prev.pincode,
      latitude: lat,
      longitude: lng,
    }));
  };

  const handleSave = async () => {
    // Validation
    if (!formData.address_line1.trim()) {
      toast.error('Please enter address line 1');
      return;
    }
    if (!formData.city.trim()) {
      toast.error('Please enter city');
      return;
    }
    if (!formData.pincode.trim()) {
      toast.error('Please enter pincode');
      return;
    }
    if (formData.latitude === 0 || formData.longitude === 0) {
      toast.error('Please select location on map or enter coordinates');
      return;
    }

    try {
      setIsSaving(true);

      let savedAddress: DeliveryAddress;

      if (address?.id) {
        // Update existing address
        savedAddress = await addressService.updateAddress(address.id, formData);
        toast.success('Address updated successfully');
      } else {
        // Create new address
        savedAddress = await addressService.createAddress(formData);
        toast.success('Address added successfully');
      }

      onSave(savedAddress);
    } catch (error: any) {
      console.error('Error saving address:', error);
      toast.error(error.message || 'Failed to save address');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!address?.id) return;

    if (!confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      setIsDeleting(true);
      await addressService.deleteAddress(address.id);
      toast.success('Address deleted successfully');
      onDelete(address.id);
      onClose();
    } catch (error: any) {
      console.error('Error deleting address:', error);
      toast.error(error.message || 'Failed to delete address');
    } finally {
      setIsDeleting(false);
    }
  };

  const labelOptions = ['Home', 'Work', 'Hotel', 'Other'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {address ? 'Edit Address' : 'Add New Address'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Map */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for your address..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Map Container */}
              <div className="relative">
                <div
                  ref={mapRef}
                  className="w-full h-80 bg-gray-200 rounded-lg"
                >
                  {!mapLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Loader className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Loading map...</p>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Click on the map or drag the marker to set your exact location
                </p>
              </div>

              {/* Coordinates Display */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Form */}
            <div className="space-y-4">
              {/* Label Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Save As
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {labelOptions.map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setFormData({ ...formData, label })}
                      className={`py-2 px-4 rounded-lg font-medium transition-all ${
                        formData.label === label
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Address Line 1 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  value={formData.address_line1}
                  onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                  placeholder="Street address, house/flat number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Address Line 2 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={formData.address_line2}
                  onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                  placeholder="Apartment, suite, landmark (optional)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* City and Pincode */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="Pincode"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Default Address Toggle */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="is_default" className="text-sm font-medium text-gray-700">
                  Set as default address
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div>
            {address?.id && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Address
                  </>
                )}
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Address
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


