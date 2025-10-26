/**
 * Kitchen Location Picker Component
 * Allows chefs to set their kitchen location using Google Maps
 */

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  MapPin,
  Search,
  LocateFixed,
  Navigation,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Location coordinates interface (local definition to avoid import issues)
interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

interface KitchenLocationPickerProps {
  /** Current location coordinates */
  currentLocation?: LocationCoordinates;
  /** Current address string */
  currentAddress?: string;
  /** Called when location is selected */
  onLocationSelect: (location: LocationCoordinates, address: string) => void;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Custom placeholder text */
  placeholder?: string;
}

export const KitchenLocationPicker: React.FC<KitchenLocationPickerProps> = ({
  currentLocation,
  currentAddress = "",
  onLocationSelect,
  disabled = false,
  placeholder = "Click to set kitchen location",
}) => {
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] =
    useState<LocationCoordinates | null>(currentLocation || null);
  const [selectedAddress, setSelectedAddress] = useState(currentAddress);

  // Refs
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  /**
   * Load Google Maps API
   */
  const loadGoogleMaps = () => {
    if (window.google?.maps) {
      initializeMap();
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "Google Maps API key not found",
      });
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;

    (window as any).initGoogleMaps = () => {
      initializeMap();
    };

    script.onerror = () => {
      toast({
        variant: "destructive",
        title: "Map Loading Error",
        description: "Failed to load Google Maps",
      });
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete (window as any).initGoogleMaps;
    };
  };

  /**
   * Initialize the map
   */
  const initializeMap = () => {
    if (!mapRef.current || !window.google?.maps) return;

    try {
      // Default center (Colombo, Sri Lanka)
      const defaultCenter = { lat: 6.9271, lng: 79.8612 };
      const center = selectedLocation
        ? { lat: selectedLocation.latitude, lng: selectedLocation.longitude }
        : defaultCenter;

      googleMapRef.current = new google.maps.Map(mapRef.current, {
        center,
        zoom: selectedLocation ? 16 : 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });

      // Add click listener
      googleMapRef.current.addListener("click", handleMapClick);

      // Initialize autocomplete
      initializeAutocomplete();

      // Add existing marker if location exists
      if (selectedLocation) {
        addMarker(selectedLocation);
      }

      setIsMapLoaded(true);
    } catch (error) {
      console.error("Failed to initialize map:", error);
      toast({
        variant: "destructive",
        title: "Map Error",
        description: "Failed to initialize Google Maps",
      });
    }
  };

  /**
   * Initialize autocomplete for search
   */
  const initializeAutocomplete = () => {
    if (!searchInputRef.current || !window.google?.maps?.places) return;

    autocompleteRef.current = new google.maps.places.Autocomplete(
      searchInputRef.current,
      {
        types: ["establishment", "geocode"],
        componentRestrictions: { country: "lk" }, // Restrict to Sri Lanka
      }
    );

    autocompleteRef.current.addListener("place_changed", handlePlaceSelect);
  };

  /**
   * Handle place selection from autocomplete
   */
  const handlePlaceSelect = () => {
    if (!autocompleteRef.current) return;

    const place = autocompleteRef.current.getPlace();
    if (!place.geometry?.location) return;

    const location: LocationCoordinates = {
      latitude: place.geometry.location.lat(),
      longitude: place.geometry.location.lng(),
    };

    const address = place.formatted_address || place.name || "";

    updateLocation(location, address);
  };

  /**
   * Handle map click
   */
  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return;

    const location: LocationCoordinates = {
      latitude: event.latLng.lat(),
      longitude: event.latLng.lng(),
    };

    // Reverse geocode to get address
    reverseGeocode(location);
  };

  /**
   * Reverse geocode coordinates to address
   */
  const reverseGeocode = async (location: LocationCoordinates) => {
    if (!window.google?.maps) return;

    setIsLoading(true);

    const geocoder = new google.maps.Geocoder();

    try {
      const response = await new Promise<google.maps.GeocoderResponse>(
        (resolve, reject) => {
          geocoder.geocode(
            { location: { lat: location.latitude, lng: location.longitude } },
            (results, status) => {
              if (status === google.maps.GeocoderStatus.OK && results) {
                resolve({ results } as google.maps.GeocoderResponse);
              } else {
                reject(new Error(`Geocoding failed: ${status}`));
              }
            }
          );
        }
      );

      const address =
        response.results[0]?.formatted_address || "Unknown location";
      console.log("Reverse geocoded address:", address);
      updateLocation(location, address);
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      const fallbackAddress = `Location: ${location.latitude.toFixed(
        6
      )}, ${location.longitude.toFixed(6)}`;
      updateLocation(location, fallbackAddress);

      toast({
        variant: "destructive",
        title: "Address Lookup Failed",
        description:
          "Could not get address for location, but coordinates have been saved.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update location and marker
   */
  const updateLocation = (location: LocationCoordinates, address: string) => {
    setSelectedLocation(location);
    setSelectedAddress(address);
    setSearchQuery(address);

    // Update map center and marker
    if (googleMapRef.current) {
      googleMapRef.current.setCenter({
        lat: location.latitude,
        lng: location.longitude,
      });
      googleMapRef.current.setZoom(16);
    }

    addMarker(location);

    toast({
      title: "Location Selected",
      description: address,
    });
  };

  /**
   * Add marker to map
   */
  const addMarker = (location: LocationCoordinates) => {
    if (!googleMapRef.current) return;

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    // Add new marker
    markerRef.current = new google.maps.Marker({
      position: { lat: location.latitude, lng: location.longitude },
      map: googleMapRef.current,
      title: "Kitchen Location",
      animation: google.maps.Animation.DROP,
      icon: {
        url:
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="12" fill="#EF4444" stroke="#FFFFFF" stroke-width="2"/>
            <path d="M16 8c-1.1 0-2 .9-2 2v6h4v-6c0-1.1-.9-2-2-2zm-4 8v4c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-4h-8z" fill="#FFFFFF"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(32, 32),
        anchor: new google.maps.Point(16, 16),
      },
    });
  };

  /**
   * Check geolocation permission status and provide guidance
   */
  const checkGeolocationPermission = async (): Promise<boolean> => {
    if (!navigator.permissions) {
      return true; // Proceed with geolocation request if permissions API not available
    }

    try {
      const permission = await navigator.permissions.query({
        name: "geolocation",
      });

      if (permission.state === "denied") {
        toast({
          variant: "destructive",
          title: "Location Permission Required",
          description:
            "Please enable location permission in your browser settings. Click the location icon in the address bar to allow access.",
        });
        return false;
      }

      if (permission.state === "prompt") {
        toast({
          title: "Location Permission Needed",
          description:
            "We'll ask for your location permission to find your current position.",
        });
      }

      return true;
    } catch (error) {
      console.error("Permission check failed:", error);
      return true; // Proceed with geolocation request if permission check fails
    }
  };

  /**
   * Get current location from browser with improved error handling
   */
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Geolocation Error",
        description: "Geolocation is not supported by this browser",
      });
      return;
    }

    // Check permission status first
    const hasPermission = await checkGeolocationPermission();
    if (!hasPermission) {
      return;
    }

    setIsLoading(true);

    toast({
      title: "Getting Your Location",
      description: "Please wait while we find your current position...",
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: LocationCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        console.log("Current location found:", location);
        console.log("Accuracy:", position.coords.accuracy, "meters");

        reverseGeocode(location);

        toast({
          title: "Location Found",
          description: `Successfully got your current location! (Accuracy: ${Math.round(
            position.coords.accuracy
          )}m)`,
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsLoading(false);

        let title = "Location Error";
        let description = "Could not get your current location";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            title = "Location Permission Denied";
            description =
              "To use your current location: 1) Click the location icon in your browser's address bar, 2) Select 'Allow', 3) Try again. Or search for your address manually below.";
            break;
          case error.POSITION_UNAVAILABLE:
            title = "Location Unavailable";
            description =
              "Your location is currently unavailable. Please try searching for your address manually.";
            break;
          case error.TIMEOUT:
            title = "Location Timeout";
            description =
              "Location request timed out. Please try again or search for your address manually.";
            break;
          default:
            description =
              "Unable to get your location. Please search for your address manually.";
        }

        toast({
          variant: "destructive",
          title,
          description,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 20000, // Increased timeout
        maximumAge: 60000, // Reduced cache age for fresher location
      }
    );
  };

  /**
   * Save selected location
   */
  const handleSave = () => {
    if (!selectedLocation) {
      toast({
        variant: "destructive",
        title: "No Location Selected",
        description: "Please select a location on the map",
      });
      return;
    }

    onLocationSelect(selectedLocation, selectedAddress);
    setIsOpen(false);

    toast({
      title: "Kitchen Location Saved",
      description: "Your kitchen location has been updated",
    });
  };

  // Load map when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadGoogleMaps();
    }
  }, [isOpen]);

  // Update internal state when props change
  useEffect(() => {
    if (currentLocation) {
      setSelectedLocation(currentLocation);
    }
    if (currentAddress) {
      setSelectedAddress(currentAddress);
      setSearchQuery(currentAddress);
    }
  }, [currentLocation, currentAddress]);

  return (
    <div className="space-y-2">
      <Label>Kitchen Location 📍</Label>

      {/* Current Location Display */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 text-sm">
            {currentAddress || "No location set"}
          </span>
          {currentLocation && (
            <Badge variant="outline" className="text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Set
            </Badge>
          )}
        </div>

        {/* Set Location Button */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" disabled={disabled} className="w-full">
              <MapPin className="h-4 w-4 mr-2" />
              {currentLocation
                ? "Update Kitchen Location"
                : "Set Kitchen Location"}
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Set Kitchen Location
              </DialogTitle>
              <DialogDescription>
                Choose your kitchen location so customers can find you easily.
                Click on the map or search for your address.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 flex flex-col space-y-4">
              {/* Search Bar */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    placeholder="Search for your kitchen address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  onClick={getCurrentLocation}
                  disabled={isLoading}
                  variant="outline"
                  title="Use my current location (requires browser permission)"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LocateFixed className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Instructions for location permission */}
              <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded border-l-4 border-blue-500">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>To use your current location:</strong> Click the
                    location button above. If blocked, enable location
                    permission by clicking the location icon in your browser's
                    address bar, or search manually.
                  </div>
                </div>
              </div>

              {/* Debug Panel - Show current coordinates */}
              {selectedLocation && (
                <div className="text-xs text-muted-foreground bg-green-50 p-2 rounded border-l-4 border-green-500">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Selected:</strong>{" "}
                      {selectedLocation.latitude.toFixed(6)},{" "}
                      {selectedLocation.longitude.toFixed(6)}
                      <br />
                      <strong>Address:</strong> {selectedAddress}
                    </div>
                  </div>
                </div>
              )}

              {/* Map Container */}
              <div className="flex-1 relative">
                <div
                  ref={mapRef}
                  className="w-full h-full rounded-lg border bg-muted"
                />

                {/* Loading Overlay */}
                {!isMapLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Loading map...
                      </p>
                    </div>
                  </div>
                )}

                {/* Instructions Overlay */}
                {isMapLoaded && !selectedLocation && (
                  <div className="absolute top-4 left-4 right-4">
                    <div className="bg-background/90 border rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-blue-500" />
                        <span>
                          Click on the map to select your kitchen location
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Location Info */}
              {selectedLocation && (
                <div className="p-3 border rounded-lg bg-muted/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">Selected Location:</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedAddress}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Coordinates: {selectedLocation.latitude.toFixed(6)},{" "}
                        {selectedLocation.longitude.toFixed(6)}
                      </p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!selectedLocation}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Location
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Actions */}
      {currentLocation && (
        <div className="flex gap-2 text-xs">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const url = `https://www.google.com/maps/search/?api=1&query=${currentLocation.latitude},${currentLocation.longitude}`;
              window.open(url, "_blank");
            }}
            className="flex-1 h-8"
          >
            <Navigation className="h-3 w-3 mr-1" />
            View on Maps
          </Button>
        </div>
      )}
    </div>
  );
};

export default KitchenLocationPicker;
