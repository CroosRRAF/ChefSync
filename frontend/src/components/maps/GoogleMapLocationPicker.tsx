import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Search, Loader2, X, Check } from "lucide-react";
import { toast } from "sonner";

interface GoogleMapLocationPickerProps {
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    address: string;
    city?: string;
    pincode?: string;
  }) => void;
  initialLocation?: { lat: number; lng: number };
  isOpen: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
    gm_authFailure: () => void;
  }
}

const GoogleMapLocationPicker: React.FC<GoogleMapLocationPickerProps> = ({
  onLocationSelect,
  initialLocation,
  isOpen,
  onClose,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const marker = useRef<any>(null);
  const geocoder = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentAddress, setCurrentAddress] = useState("");
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Load Google Maps Script
  useEffect(() => {
    let apiKey: string;
    
    try {
      const { getGoogleMapsKey } = require('@/config/apiKeys');
      apiKey = getGoogleMapsKey();
      console.log("🗺️ Google Maps API Key check: ✓ Present");
    } catch (error: any) {
      console.error("❌ Google Maps API key not found:", error.message);
      toast.error("Google Maps API key is missing", {
        description: "Please add VITE_GOOGLE_MAPS_API_KEY to your .env file"
      });
      setHasError(true);
      setErrorMessage(error.message || "Google Maps API key not configured");
      return;
    }

    // Check if script is already loaded
    if (window.google?.maps?.Map) {
      console.log("✓ Google Maps already loaded");
      setIsScriptLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector(
      `script[src*="maps.googleapis.com"]`
    );
    
    if (existingScript) {
      console.log("⏳ Google Maps script already loading, waiting...");
      // Script is loading, wait for it
      const checkInterval = setInterval(() => {
        if (window.google?.maps?.Map) {
          console.log("✓ Google Maps loaded successfully");
          setIsScriptLoaded(true);
          clearInterval(checkInterval);
        }
      }, 100);
      
      return () => clearInterval(checkInterval);
    }

    // Load the script - simplified without marker library to avoid issues
    console.log("🔄 Loading Google Maps script...");
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log("📦 Google Maps script loaded, initializing...");
      // Wait a bit for Google Maps to fully initialize
      setTimeout(() => {
        if (window.google?.maps?.Map) {
          console.log("✅ Google Maps initialized successfully");
          setIsScriptLoaded(true);
        } else {
          console.error("❌ Google Maps failed to initialize after loading");
          setHasError(true);
          setErrorMessage("Google Maps script loaded but failed to initialize.");
        }
      }, 100);
    };
    
    script.onerror = (error) => {
      console.error("❌ Failed to load Google Maps script:", error);
      setHasError(true);
      setErrorMessage("Failed to load Google Maps script. Please check your internet connection.");
      toast.error("Failed to load Google Maps. Please check your internet connection and API key.");
    };

    document.head.appendChild(script);

    // Listen for Google Maps errors
    window.gm_authFailure = () => {
      console.error("❌ Google Maps Authentication Failed - Check your API key and billing");
      setHasError(true);
      setErrorMessage("Google Maps authentication failed. This usually means billing is not enabled on your Google Cloud account.");
      toast.error("Google Maps API Error: Please enable billing in Google Cloud Console");
    };

    return () => {
      // Don't remove script on unmount as it might be used by other components
    };
  }, []);

  // Initialize Google Maps when opened and script is loaded
  useEffect(() => {
    if (isOpen && isScriptLoaded && window.google?.maps?.Map) {
      initializeMap();
    }
  }, [isOpen, isScriptLoaded]);

  const initializeMap = () => {
    if (!mapRef.current || !window.google?.maps?.Map) {
      console.error("Map initialization failed: missing requirements");
      return;
    }

    try {

    const defaultLocation = initialLocation || { lat: 6.9271, lng: 79.8612 }; // Colombo, Sri Lanka

    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: defaultLocation,
      zoom: 15,
      mapTypeId: "roadmap",
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
    });

    geocoder.current = new window.google.maps.Geocoder();

    // Add click listener to map
    mapInstance.current.addListener("click", (event: any) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      updateMarker(lat, lng);
    });

    // Add initial marker
    if (initialLocation) {
      updateMarker(initialLocation.lat, initialLocation.lng);
    }
    } catch (error) {
      console.error("Error initializing map:", error);
      toast.error("Failed to initialize map. Please try again.");
    }
  };

  const updateMarker = (lat: number, lng: number) => {
    if (!mapInstance.current) return;

    try {
      // Remove existing marker
      if (marker.current) {
        marker.current.setMap(null);
      }

      // Use standard Marker (more reliable and doesn't require marker library)
      marker.current = new window.google.maps.Marker({
        position: { lat, lng },
        map: mapInstance.current,
        draggable: true,
        title: "Selected Location",
        animation: window.google.maps.Animation.DROP,
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
          scaledSize: new window.google.maps.Size(40, 40),
        },
      });

      // Add drag listener to marker
      marker.current.addListener("dragend", (event: any) => {
        const newLat = event.latLng.lat();
        const newLng = event.latLng.lng();
        getAddressFromCoordinates(newLat, newLng);
      });
    } catch (error) {
      console.error("Error creating marker:", error);
      toast.error("Failed to place marker on map");
    }

    // Update map center
    mapInstance.current.setCenter({ lat, lng });

    // Get address from coordinates
    getAddressFromCoordinates(lat, lng);
  };

  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    if (!geocoder.current) return;

    try {
      setIsLoading(true);
      const result = await new Promise((resolve, reject) => {
        geocoder.current.geocode(
          { location: { lat, lng } },
          (results: any[], status: string) => {
            if (status === "OK" && results[0]) {
              resolve(results[0]);
            } else {
              reject(new Error("Geocoding failed"));
            }
          }
        );
      });

      const res = result as any;
      const address = res.formatted_address;
      setCurrentAddress(address);
      // Try to extract city and postal code from address components
      try {
        const components = res.address_components || [];
        let city = '';
        let postalCode = '';
        for (const comp of components) {
          const types: string[] = comp.types || [];
          if (types.includes('locality') || types.includes('administrative_area_level_2') || types.includes('postal_town')) {
            city = city || comp.long_name;
          }
          if (types.includes('postal_code')) {
            postalCode = comp.long_name;
          }
        }

        // Save extracted pieces to state so they can be used when confirming
        if (city) {
          setCurrentAddress(prev => prev); // keep address string
          // attach to marker via dataset or rely on caller to reverse geocode again
          (marker.current as any).__extracted = { city, pincode: postalCode };
        }
      } catch (err) {
        // non-fatal
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
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
            if (status === "OK" && results[0]) {
              resolve(results[0]);
            } else {
              reject(new Error("Geocoding failed"));
            }
          }
        );
      });

      const location = (result as any).geometry.location;
      const lat = location.lat();
      const lng = location.lng();

      updateMarker(lat, lng);
      setCurrentAddress((result as any).formatted_address);
      toast.success("Location found!");
    } catch (error) {
      console.error("Geocoding error:", error);
      toast.error("Could not find the address. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmLocation = () => {
    if (marker.current) {
      const position = marker.current.getPosition();
      const lat = position.lat();
      const lng = position.lng();

      // Attempt to include extracted city/pincode
      const meta = (marker.current as any).__extracted || {};

      onLocationSelect({
        lat,
        lng,
        address: currentAddress,
        city: meta.city,
        pincode: meta.pincode
      });
      onClose();
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser.");
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        updateMarker(lat, lng);
        setIsLoading(false);
        toast.success("Current location set!");
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Could not get your current location.");
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  if (!isOpen) return null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-orange-500 to-red-500">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Select Your Location
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-white/20 text-white">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Loading State for Script */}
        {!isScriptLoaded && !hasError && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-orange-500" />
              <div>
                <p className="font-semibold text-lg">Loading Google Maps...</p>
                <p className="text-sm text-muted-foreground">Please wait a moment</p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-2xl space-y-6">
              <div className="text-center space-y-3">
                <div className="text-6xl">❌</div>
                <h3 className="text-xl font-bold text-red-600 dark:text-red-400">
                  Google Maps Error
                </h3>
                <p className="text-muted-foreground">
                  {errorMessage || "Failed to load Google Maps"}
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-950 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg p-6 space-y-4">
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 flex items-center gap-2">
                  <span>⚠️</span> Common Solutions:
                </h4>
                <ol className="space-y-3 text-sm text-yellow-900 dark:text-yellow-100 list-decimal list-inside">
                  <li className="leading-relaxed">
                    <strong>Enable Billing:</strong> Go to{" "}
                    <a 
                      href="https://console.cloud.google.com/billing" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800"
                    >
                      Google Cloud Billing
                    </a>{" "}
                    and enable billing on your project
                  </li>
                  <li className="leading-relaxed">
                    <strong>Enable APIs:</strong> Enable Maps JavaScript API, Places API, and Geocoding API in{" "}
                    <a 
                      href="https://console.cloud.google.com/apis/library" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800"
                    >
                      API Library
                    </a>
                  </li>
                  <li className="leading-relaxed">
                    <strong>Check API Key:</strong> Verify your API key in <code className="bg-yellow-200 dark:bg-yellow-900 px-1 rounded">.env</code> file has no restrictions blocking localhost
                  </li>
                  <li className="leading-relaxed">
                    <strong>Check Browser Console:</strong> Open DevTools (F12) to see detailed error messages
                  </li>
                </ol>
              </div>

              <div className="flex gap-3 justify-center">
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setHasError(false);
                    setErrorMessage("");
                    window.location.reload();
                  }}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600"
                >
                  <Loader2 className="h-4 w-4" />
                  Retry
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        {isScriptLoaded && (
          <div className="p-4 border-b bg-gray-50">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search for an address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-gray-300 text-gray-900"
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isLoading || !searchQuery.trim()}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Search"
              )}
            </Button>
          </div>
        </div>
        )}

        {/* Map Container */}
        {isScriptLoaded && (
        <div className="flex-1 relative bg-gray-200">
          <div ref={mapRef} className="w-full h-full rounded-lg" style={{ minHeight: '400px' }} />

          {/* Current Location Button */}
          <div className="absolute top-4 right-4 z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUseCurrentLocation}
              disabled={isLoading}
              className="bg-white shadow-lg hover:bg-gray-50 border-2 border-gray-300 text-gray-900 font-medium"
            >
              <MapPin className="h-4 w-4 mr-2 text-blue-600" />
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
        )}

        {/* Footer */}
        {isScriptLoaded && (
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 font-medium">Selected Address:</p>
              <p className="font-semibold text-gray-900 mt-1">
                {currentAddress || "Click on the map to select a location"}
              </p>
            </div>
            <div className="flex gap-3 ml-4">
              <Button variant="outline" onClick={onClose} className="border-gray-300 text-gray-700 hover:bg-gray-100">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleConfirmLocation}
                disabled={!marker.current}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg"
              >
                <Check className="h-4 w-4 mr-2" />
                Confirm Location
              </Button>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default GoogleMapLocationPicker;
