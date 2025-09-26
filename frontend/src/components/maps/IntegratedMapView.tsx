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

  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    try {
      // Initialize map
      const mapInstance = new google.maps.Map(mapRef.current, {
        zoom: 13,
        center: { lat: 6.9271, lng: 79.8612 }, // Default to Colombo
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      });

      setMap(mapInstance);

      // Initialize directions renderer
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

      // Geocode the destination
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: location }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const destinationLocation = results[0].geometry.location;
          mapInstance.setCenter(destinationLocation);

          // Create destination marker using AdvancedMarkerElement if available
          if (window.google.maps.marker?.AdvancedMarkerElement) {
            const markerElement = document.createElement("div");
            markerElement.innerHTML = `
              <div style="
                width: 32px; 
                height: 32px; 
                background: #EF4444; 
                border-radius: 50% 50% 50% 0; 
                border: 3px solid white; 
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                transform: rotate(-45deg);
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <div style="color: white; transform: rotate(45deg); font-size: 16px;">📍</div>
              </div>
            `;

            new google.maps.marker.AdvancedMarkerElement({
              map: mapInstance,
              position: destinationLocation,
              title: title,
              content: markerElement,
            });
          } else {
            // Fallback to regular marker
            new google.maps.Marker({
              position: destinationLocation,
              map: mapInstance,
              title: title,
              icon: {
                url:
                  "data:image/svg+xml;charset=UTF-8," +
                  encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#EF4444" stroke="white" stroke-width="2">
                      <circle cx="12" cy="10" r="3"/>
                      <path d="m12 21.7-4-7.2c-.7-1.5-1-3.2-1-4.8a5 5 0 0 1 10 0c0 1.6-.3 3.3-1 4.8l-4 7.2z"/>
                    </svg>
                  `),
                scaledSize: new google.maps.Size(32, 32),
                anchor: new google.maps.Point(16, 32),
              },
            });
          }

          // If user location is available, show directions
          if (userLocation && directionsRenderer) {
            const directionsService = new google.maps.DirectionsService();
            directionsService.route(
              {
                origin: userLocation,
                destination: destinationLocation,
                travelMode: google.maps.TravelMode.DRIVING,
              },
              (result, status) => {
                if (status === google.maps.DirectionsStatus.OK && result) {
                  directionsRenderer.setDirections(result);

                  // Add user location marker
                  if (window.google.maps.marker?.AdvancedMarkerElement) {
                    const userMarkerElement = document.createElement("div");
                    userMarkerElement.innerHTML = `
                    <div style="
                      width: 24px; 
                      height: 24px; 
                      background: #059669; 
                      border-radius: 50%; 
                      border: 3px solid white; 
                      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    ">
                      <div style="color: white; font-size: 12px;">📍</div>
                    </div>
                  `;

                    new google.maps.marker.AdvancedMarkerElement({
                      map: mapInstance,
                      position: userLocation,
                      title: "Your Location",
                      content: userMarkerElement,
                    });
                  } else {
                    new google.maps.Marker({
                      position: userLocation,
                      map: mapInstance,
                      title: "Your Location",
                      icon: {
                        url:
                          "data:image/svg+xml;charset=UTF-8," +
                          encodeURIComponent(`
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#059669" stroke="white" stroke-width="2">
                            <circle cx="12" cy="10" r="3"/>
                            <path d="m12 21.7-4-7.2c-.7-1.5-1-3.2-1-4.8a5 5 0 0 1 10 0c0 1.6-.3 3.3-1 4.8l-4 7.2z"/>
                          </svg>
                        `),
                        scaledSize: new google.maps.Size(24, 24),
                        anchor: new google.maps.Point(12, 24),
                      },
                    });
                  }
                }
              }
            );
          }

          setIsLoading(false);
        } else {
          setError("Unable to find location");
          setIsLoading(false);
        }
      });
    } catch (err) {
      console.error("Error initializing map:", err);
      setError("Failed to initialize map");
      setIsLoading(false);
    }
  }, [location, title, userLocation, directionsRenderer]);

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
