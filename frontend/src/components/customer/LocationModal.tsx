import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, LocateFixed, Search, Star } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: { address: string; latitude: number; longitude: number; }) => void;
}

const containerStyle = {
  width: '100%',
  height: '100%',
};

const center = {
  lat: 40.7128,
  lng: -74.0060
};

const savedAddresses = [
    { id: 'home', name: 'Home', address: '123 Main St, New York, NY', lat: 40.7128, lng: -74.0060 },
    { id: 'work', name: 'Work', address: '456 Market St, San Francisco, CA', lat: 37.7937, lng: -122.3965 },
];

const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose, onLocationSelect }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markerPosition, setMarkerPosition] = useState(center);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  const onLoad = useCallback(function callback(mapInstance: google.maps.Map) {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      // In a real app, you'd use a reverse geocoding service here.
      onLocationSelect({ address: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`, latitude: lat, longitude: lng });
    }
  };

  const handlePlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const newPos = { lat, lng };
        map?.panTo(newPos);
        setMarkerPosition(newPos);
        onLocationSelect({ address: place.formatted_address || 'Selected Location', latitude: lat, longitude: lng });
      }
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const newPos = { lat, lng };
        map?.panTo(newPos);
        setMarkerPosition(newPos);
        // In a real app, you'd use a reverse geocoding service here.
        onLocationSelect({ address: 'Current Location', latitude: lat, longitude: lng });
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold">Select Your Delivery Location</DialogTitle>
          <DialogDescription>
            Search for an address or pin your location on the map.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow flex flex-col md:flex-row gap-4 p-6">
          {/* Controls Area */}
          <div className="md:w-1/3 flex flex-col space-y-4">
            {isLoaded && (
              <Autocomplete
                onLoad={(ac) => setAutocomplete(ac)}
                onPlaceChanged={handlePlaceChanged}
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input placeholder="Search for an address..." className="pl-10" />
                </div>
              </Autocomplete>
            )}
            
            <Button variant="outline" className="w-full flex items-center justify-center" onClick={handleUseCurrentLocation}>
              <LocateFixed className="h-5 w-5 mr-2" />
              Use My Current Location
            </Button>

            <div className="flex-grow overflow-y-auto border border-border rounded-lg p-2 space-y-2">
              <h4 className="font-semibold mb-2 px-2">Saved Addresses</h4>
              {savedAddresses.map(addr => (
                <div 
                  key={addr.id} 
                  className="flex items-start p-2 rounded-md hover:bg-muted cursor-pointer"
                  onClick={() => onLocationSelect({ address: addr.address, latitude: addr.lat, longitude: addr.lng })}
                >
                  <Star className="h-5 w-5 text-yellow-400 mr-3 mt-1" />
                  <div>
                    <p className="font-semibold">{addr.name}</p>
                    <p className="text-sm text-muted-foreground">{addr.address}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Map Area */}
          <div className="flex-grow md:w-2/3 bg-muted rounded-lg overflow-hidden">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={12}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onClick={handleMapClick}
                options={{
                  disableDefaultUI: true,
                  zoomControl: true,
                }}
              >
                <Marker position={markerPosition} />
              </GoogleMap>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-muted-foreground">Loading map...</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationModal;
