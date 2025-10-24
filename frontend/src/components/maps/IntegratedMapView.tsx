import React, { useEffect, useRef, useState } from "react";
import { MapPin, Route, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateNavigationUrl } from "@/utils/mapUtils";

interface IntegratedMapViewProps {
  location: string;
  title: string;
  userLocation?: { lat: number; lng: number } | null;
  onNavigate?: () => void;
}

const IntegratedMapView: React.FC<IntegratedMapViewProps> = ({
  location,
  title,
  userLocation,
  onNavigate,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsRenderer, setDirectionsRenderer] =
    useState<google.maps.DirectionsRenderer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ First useEffect: Map initialization
  useEffect(() => {
    if (!mapRef.current || !window.google || map) return;

    try {
      const mapInstance = new google.maps.Map(mapRef.current, {
        zoom: 13,
        center: { lat: 6.9271, lng: 79.8612 },
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
      });

      setMap(mapInstance);

      const renderer = new google.maps.DirectionsRenderer({
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: "#3B82F6",
          strokeWeight: 4,
          strokeOpacity: 0.8,
        },
      });

      renderer.setMap(mapInstance);
      setDirectionsRenderer(renderer);
    } catch (err) {
      console.error("Error initializing map:", err);
      setError("Failed to initialize map");
      setIsLoading(false);
    }
  }, []); // ✅ Runs only once at mount

  // ✅ Second useEffect: Handle location, markers, directions
  useEffect(() => {
    if (!map || !window.google || !location) return;

    setIsLoading(true);
    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ address: location }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
        const destinationLocation = results[0].geometry.location;
        map.setCenter(destinationLocation);

        // Your existing marker/directions logic here...
        // ✅ Use directionsRenderer safely since map is already initialized
      } else {
        setError("Unable to find location");
      }
      setIsLoading(false);
    });
  }, [location, map]); // ✅ Only re-runs when location or map changes

  // ✅ Third useEffect: Draw directions when user location appears
  useEffect(() => {
    if (!map || !directionsRenderer || !userLocation) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: location }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
        const destinationLocation = results[0].geometry.location;
        const directionsService = new google.maps.DirectionsService();

        directionsService.route(
          {
            origin: userLocation,
            destination: destinationLocation,
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
              directionsRenderer.setDirections(result);
            }
          }
        );
      }
    });
  }, [userLocation, map, directionsRenderer, location]);
  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate();
    } else {
      // Default navigation behavior
      const encodedLocation = encodeURIComponent(location);
      const navigationUrl = userLocation
        ? generateNavigationUrl(location, userLocation)
        : `https://www.google.com/maps/dir/?api=1&destination=${encodedLocation}`;
      window.open(navigationUrl, "_blank");
    }
  };

  if (error) {
    return (
      <div className="w-full h-80 bg-gray-100 rounded-lg flex flex-col items-center justify-center">
        <MapPin className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={handleNavigate} variant="outline">
          <Navigation className="h-4 w-4 mr-2" />
          Open in Maps
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full h-80 bg-gray-100 rounded-lg overflow-hidden relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
          <p className="text-sm text-gray-600">Loading map...</p>
        </div>
      )}

      <div ref={mapRef} className="w-full h-full" />

      {/* Overlay controls */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-4 w-4 text-red-500" />
          <span className="font-medium text-sm">{title}</span>
        </div>
        <p className="text-xs text-gray-600 mb-3">{location}</p>
        <Button onClick={handleNavigate} size="sm" className="w-full">
          <Route className="h-4 w-4 mr-2" />
          Navigate
        </Button>
      </div>

      {userLocation && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium">Your Location</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegratedMapView;
