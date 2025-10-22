import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useGoogleMaps } from '@/utils/googleMapsLoader';
import { 
  MapPin, 
  Navigation, 
  Search, 
  Loader2, 
  CheckCircle,
  X,
  LocateIcon,
  Target
} from 'lucide-react';

interface LocationSelectorProps {
  currentLocation?: { lat: number; lng: number; address?: string } | null;
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  className?: string;
}

interface GoogleMapsPlace {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  currentLocation,
  onLocationSelect,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GoogleMapsPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number; lng: number; address: string} | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(false);
  
  const { loadGoogleMaps, isLoaded, whenReady } = useGoogleMaps();

  // Load Google Maps when dialog opens
  useEffect(() => {
    if (isOpen && !isLoaded) {
      setIsMapLoading(true);
      loadGoogleMaps()
        .then(() => {
          setIsMapLoading(false);
          initializeMap();
        })
        .catch((error) => {
          setIsMapLoading(false);
          toast.error('Failed to load Google Maps. Please check your internet connection.');
          console.error('Google Maps loading error:', error);
        });
    } else if (isOpen && isLoaded) {
      initializeMap();
    }
  }, [isOpen, isLoaded]);

  // Initialize Google Maps
  const initializeMap = useCallback(() => {
    if (!isLoaded) return;

    const mapElement = document.getElementById('location-selector-map');
    if (!mapElement) return;

    try {
      const initialCenter = currentLocation || { lat: 6.9271, lng: 79.8612 }; // Default to Colombo

      const mapInstance = new window.google.maps.Map(mapElement, {
        zoom: 15,
        center: initialCenter,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          }
        ]
      });

      // Use standard Marker for better compatibility
      const markerInstance = new window.google.maps.Marker({
        position: initialCenter,
        map: mapInstance,
        draggable: true,
        title: 'Selected Location',
        animation: window.google.maps.Animation.DROP
      });

      // Add click listener to map
      mapInstance.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          updateMarkerPosition(lat, lng, mapInstance, markerInstance);
        }
      });

      // Add drag listener to marker
      markerInstance.addListener('dragend', (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          reverseGeocode(lat, lng);
        }
      });

      setMap(mapInstance);
      setMarker(markerInstance);

      // Set initial selected location: use currentLocation or default to Colombo
      const initialLat = initialCenter.lat;
      const initialLng = initialCenter.lng;
      reverseGeocode(initialLat, initialLng);
    } catch (error) {
      console.error('Map initialization error:', error);
      toast.error('Failed to initialize map');
    }
  }, [isLoaded, currentLocation]);

  const updateMarkerPosition = useCallback((lat: number, lng: number, mapInstance?: google.maps.Map, markerInstance?: google.maps.Marker) => {
    const mapToUse = mapInstance || map;
    const markerToUse = markerInstance || marker;

    if (mapToUse && markerToUse) {
      const position = new google.maps.LatLng(lat, lng);
      markerToUse.setPosition(position);
      mapToUse.panTo(position);
      reverseGeocode(lat, lng);
    }
  }, [map, marker]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ location: { lat, lng } });
      
      if (result.results && result.results.length > 0) {
        const address = result.results[0].formatted_address;
        setSelectedLocation({ lat, lng, address });
      } else {
        setSelectedLocation({ lat, lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setSelectedLocation({ lat, lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
    }
  };

  const searchPlaces = useCallback(async (query: string) => {
    if (!query.trim() || !window.google?.maps) return;

    setIsSearching(true);
    try {
      const service = new google.maps.places.PlacesService(document.createElement('div'));
      
      const request = {
        query: `${query} Sri Lanka`,
        fields: ['place_id', 'formatted_address', 'geometry'],
      };

      service.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const places: GoogleMapsPlace[] = results.map(place => ({
            place_id: place.place_id!,
            formatted_address: place.formatted_address!,
            geometry: {
              location: {
                lat: place.geometry!.location!.lat(),
                lng: place.geometry!.location!.lng()
              }
            }
          }));
          setSearchResults(places.slice(0, 5)); // Limit to 5 results
        } else {
          setSearchResults([]);
        }
        setIsSearching(false);
      });
    } catch (error) {
      console.error('Places search error:', error);
      setSearchResults([]);
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.length > 2) {
      searchPlaces(value);
    } else {
      setSearchResults([]);
    }
  };

  const selectSearchResult = (place: GoogleMapsPlace) => {
    const { lat, lng } = place.geometry.location;
    updateMarkerPosition(lat, lng);
    setSearchQuery('');
    setSearchResults([]);
    
    if (map) {
      map.setCenter({ lat, lng });
      map.setZoom(16);
    }
    
    toast.success('Location selected from search!');
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        updateMarkerPosition(lat, lng);
        setIsGettingLocation(false);
        toast.success('Current location detected!');
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Could not get your current location');
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const confirmLocation = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
      setIsOpen(false);
      toast.success('Location updated successfully!');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`flex items-center gap-2 text-sm ${className}`}
        >
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="truncate max-w-[200px] sm:max-w-[250px]">
            {currentLocation?.address 
              ? currentLocation.address.split(',').slice(0, 2).join(',')
              : 'Set Delivery Location'}
          </span>
          <Target className="h-3 w-3 ml-auto flex-shrink-0 opacity-70" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0" aria-describedby="location-dialog-description">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
              <Target className="h-6 w-6 text-white" />
            </div>
            Select Your Delivery Location
          </DialogTitle>
          <p id="location-dialog-description" className="text-sm text-gray-600 mt-2">
            📍 Set your location to find the nearest chefs and get accurate delivery estimates
          </p>
        </DialogHeader>

        <div className="flex-1 flex gap-6 p-6 overflow-hidden">
          {/* Left Panel - Search and Options */}
          <div className="w-96 flex flex-col gap-4 overflow-y-auto">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search Location
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search places in Sri Lanka..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 h-11 border-2 focus:border-orange-500"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <Card className="max-h-64 overflow-y-auto border-2 shadow-lg">
                  <CardContent className="p-2">
                    <div className="text-xs font-semibold text-gray-500 mb-2 px-2">
                      Search Results ({searchResults.length})
                    </div>
                    {searchResults.map((place, index) => (
                      <Button
                        key={place.place_id}
                        variant="ghost"
                        className="w-full justify-start text-left p-3 h-auto hover:bg-orange-50 rounded-lg mb-1 border border-transparent hover:border-orange-200 transition-all"
                        onClick={() => selectSearchResult(place)}
                      >
                        <div className="flex items-start gap-3 w-full">
                          <div className="p-1.5 bg-orange-100 rounded-lg flex-shrink-0 mt-0.5">
                            <MapPin className="h-4 w-4 text-orange-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-gray-900 font-medium block">{place.formatted_address}</span>
                            <span className="text-xs text-gray-500 mt-0.5 block">Click to select this location</span>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Navigation className="h-4 w-4" />
                Quick Location
              </label>
              <Button
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                variant="outline"
                className="w-full h-11 border-2 hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                {isGettingLocation ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Getting Location...
                  </>
                ) : (
                  <>
                    <Navigation className="h-4 w-4 mr-2" />
                    Use My Current Location
                  </>
                )}
              </Button>
            </div>

            {/* Selected Location Info */}
            {selectedLocation && (
              <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-md">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-green-900 mb-1">Selected Location</p>
                    <p className="text-xs text-green-700 leading-relaxed">{selectedLocation.address}</p>
                    <p className="text-xs text-green-600 mt-2 font-mono bg-white/60 px-2 py-1 rounded">
                      {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Info Box */}
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-blue-900 mb-2">💡 Quick Tips</p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Click on the map to set your location</li>
                    <li>• Drag the marker to adjust position</li>
                    <li>• Search for landmarks or addresses</li>
                    <li>• Use GPS for instant location detection</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Confirm Button */}
            <Button
              onClick={confirmLocation}
              disabled={!selectedLocation}
              className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Confirm & Save Location
            </Button>
          </div>

          {/* Right Panel - Map */}
          <div className="flex-1 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Interactive Map
              </label>
              {selectedLocation && (
                <Badge className="bg-green-100 text-green-700 border-green-300">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></div>
                  Location Set
                </Badge>
              )}
            </div>
            {isMapLoading ? (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center border-2 border-gray-300">
                <div className="text-center p-8">
                  <div className="relative inline-block mb-4">
                    <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
                    <MapPin className="h-6 w-6 text-orange-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-lg font-semibold text-gray-700">Loading Google Maps...</p>
                  <p className="text-sm text-gray-500 mt-1">Please wait a moment</p>
                </div>
              </div>
            ) : (
              <div 
                id="location-selector-map" 
                className="w-full h-full bg-gray-200 rounded-xl min-h-[500px] border-2 border-gray-300 shadow-inner"
              />
            )}
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="border-t bg-gray-50 p-6 flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span className="font-medium">
              {selectedLocation?.address || 'No location selected'}
            </span>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmLocation}
              disabled={!selectedLocation}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Location
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationSelector;