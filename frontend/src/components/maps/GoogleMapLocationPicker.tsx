import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Search, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface GoogleMapLocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  initialLocation?: { lat: number; lng: number };
  isOpen: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

const GoogleMapLocationPicker: React.FC<GoogleMapLocationPickerProps> = ({
  onLocationSelect,
  initialLocation,
  isOpen,
  onClose
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const marker = useRef<any>(null);
  const geocoder = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAddress, setCurrentAddress] = useState('');

  // Initialize Google Maps
  useEffect(() => {
    if (isOpen && window.google) {
      initializeMap();
    } else if (isOpen && !window.google) {
      // Wait for Google Maps to load
      const checkGoogleMaps = setInterval(() => {
        if (window.google) {
          clearInterval(checkGoogleMaps);
          initializeMap();
        }
      }, 100);

      return () => clearInterval(checkGoogleMaps);
    }
  }, [isOpen]);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    const defaultLocation = initialLocation || { lat: 6.9271, lng: 79.8612 }; // Colombo, Sri Lanka

    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: defaultLocation,
      zoom: 15,
      mapTypeId: 'roadmap',
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    geocoder.current = new window.google.maps.Geocoder();

    // Add click listener to map
    mapInstance.current.addListener('click', (event: any) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      updateMarker(lat, lng);
    });

    // Add initial marker
    if (initialLocation) {
      updateMarker(initialLocation.lat, initialLocation.lng);
    }
  };

  const updateMarker = (lat: number, lng: number) => {
    if (!mapInstance.current) return;

    // Remove existing marker
    if (marker.current) {
      marker.current.setMap(null);
    }

    // Add new marker
    marker.current = new window.google.maps.Marker({
      position: { lat, lng },
      map: mapInstance.current,
      draggable: true,
      title: 'Selected Location'
    });

    // Update map center
    mapInstance.current.setCenter({ lat, lng });

    // Get address from coordinates
    getAddressFromCoordinates(lat, lng);

    // Add drag listener to marker
    marker.current.addListener('dragend', (event: any) => {
      const newLat = event.latLng.lat();
      const newLng = event.latLng.lng();
      getAddressFromCoordinates(newLat, newLng);
    });
  };

  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    if (!geocoder.current) return;

    try {
      setIsLoading(true);
      const result = await new Promise((resolve, reject) => {
        geocoder.current.geocode(
          { location: { lat, lng } },
          (results: any[], status: string) => {
            if (status === 'OK' && results[0]) {
              resolve(results[0]);
            } else {
              reject(new Error('Geocoding failed'));
            }
          }
        );
      });

      const address = (result as any).formatted_address;
      setCurrentAddress(address);
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setCurrentAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !geocoder.current) return;

    try {
      setIsLoading(true);
      const result = await new Promise((resolve, reject) => {
        geocoder.current.geocode(
          { address: searchQuery },
          (results: any[], status: string) => {
            if (status === 'OK' && results[0]) {
              resolve(results[0]);
            } else {
              reject(new Error('Geocoding failed'));
            }
          }
        );
      });

      const location = (result as any).geometry.location;
      const lat = location.lat();
      const lng = location.lng();
      
      updateMarker(lat, lng);
      setCurrentAddress((result as any).formatted_address);
      toast.success('Location found!');
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Could not find the address. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmLocation = () => {
    if (marker.current) {
      const position = marker.current.getPosition();
      const lat = position.lat();
      const lng = position.lng();
      
      onLocationSelect({
        lat,
        lng,
        address: currentAddress
      });
      onClose();
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser.');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        updateMarker(lat, lng);
        setIsLoading(false);
        toast.success('Current location set!');
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Could not get your current location.');
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Select Your Location</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for an address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading || !searchQuery.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </Button>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="w-full h-full" />
          
          {/* Current Location Button */}
          <div className="absolute top-4 right-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUseCurrentLocation}
              disabled={isLoading}
              className="bg-white shadow-md"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Use Current Location
            </Button>
          </div>

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Selected Address:</p>
              <p className="font-medium">{currentAddress || 'Click on the map to select a location'}</p>
            </div>
            <div className="flex gap-2 ml-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmLocation}
                disabled={!marker.current}
              >
                Confirm Location
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleMapLocationPicker;
