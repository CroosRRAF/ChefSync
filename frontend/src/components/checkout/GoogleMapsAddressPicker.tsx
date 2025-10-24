import React, { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, Search, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { addressService, DeliveryAddress } from "@/services/addressService";

interface GoogleMapsAddressPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressSaved: (address: DeliveryAddress) => void;
  editingAddress?: DeliveryAddress | null;
  existingAddresses: DeliveryAddress[];
}

const GoogleMapsAddressPicker: React.FC<GoogleMapsAddressPickerProps> = ({
  isOpen,
  onClose,
  onAddressSaved,
  editingAddress,
  existingAddresses,
}) => {
  const [loading, setLoading] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    label: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
    latitude: 0,
    longitude: 0,
    is_default: false,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Load editing address data
  useEffect(() => {
    if (editingAddress && isOpen) {
      setFormData({
        label: editingAddress.label,
        address_line1: editingAddress.address_line1,
        address_line2: editingAddress.address_line2 || "",
        city: editingAddress.city,
        state: editingAddress.state || editingAddress.city || "",
        pincode: editingAddress.pincode,
        latitude: Number(editingAddress.latitude) || 0,
        longitude: Number(editingAddress.longitude) || 0,
        is_default: editingAddress.is_default,
      });
    } else if (!editingAddress && isOpen) {
      resetForm();
    }
  }, [editingAddress, isOpen]);

  // Load Google Maps script and initialize
  useEffect(() => {
    if (isOpen) {
      loadGoogleMapsScript();
    }
  }, [isOpen]);

  // Initialize map after dialog is rendered
  useEffect(() => {
    if (isOpen && mapsLoaded && !mapRef.current) {
      const timer = setTimeout(() => {
        initializeMap();
        // Auto-detect location for new addresses
        if (
          !editingAddress &&
          formData.latitude === 0 &&
          formData.longitude === 0
        ) {
          getCurrentLocation();
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, mapsLoaded]);

  const loadGoogleMapsScript = () => {
    if (window.google && window.google.maps) {
      setMapsLoaded(true);
      return;
    }

    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          setMapsLoaded(true);
          clearInterval(checkInterval);
        }
      }, 100);
      return;
    }

    let apiKey: string;
    try {
      const { getGoogleMapsKey } = require("@/config/apiKeys");
      apiKey = getGoogleMapsKey();
    } catch (error: any) {
      toast.error("Google Maps API key not configured", {
        description: "Please set VITE_GOOGLE_MAPS_API_KEY in your .env file",
      });
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setMapsLoaded(true);
    };

    script.onerror = () => {
      toast.error("Failed to load Google Maps");
    };

    document.head.appendChild(script);
  };

  const initializeMap = () => {
    if (!mapContainerRef.current || !window.google || !window.google.maps) {
      return;
    }

    if (mapRef.current) {
      return;
    }

    const defaultCenter =
      formData.latitude !== 0 && formData.longitude !== 0
        ? { lat: formData.latitude, lng: formData.longitude }
        : { lat: 7.8731, lng: 80.7718 };

    try {
      mapRef.current = new google.maps.Map(mapContainerRef.current, {
        zoom: formData.latitude !== 0 ? 15 : 8,
        center: defaultCenter,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
      });

      mapRef.current.addListener(
        "click",
        (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            updateMarker(lat, lng);
            reverseGeocode(lat, lng);
          }
        }
      );

      if (searchInputRef.current) {
        initAutocomplete();
      }

      if (formData.latitude !== 0 && formData.longitude !== 0) {
        updateMarker(formData.latitude, formData.longitude);
      }
    } catch (error) {
      console.error("Error initializing map:", error);
      toast.error("Failed to initialize map");
    }
  };

  const initAutocomplete = () => {
    if (!searchInputRef.current || !window.google) return;

    autocompleteRef.current = new google.maps.places.Autocomplete(
      searchInputRef.current,
      {
        types: ["address"],
        componentRestrictions: { country: "lk" },
      }
    );

    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current?.getPlace();
      if (place?.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        updateMarker(lat, lng);
        parseAddressComponents(place, lat, lng);
      }
    });
  };

  const updateMarker = (lat: number, lng: number) => {
    if (!mapRef.current) return;

    mapRef.current.setCenter({ lat, lng });
    mapRef.current.setZoom(16);

    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    markerRef.current = new google.maps.Marker({
      position: { lat, lng },
      map: mapRef.current,
      title: "Selected Location",
      animation: google.maps.Animation.DROP,
    });
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    if (!window.google) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        parseAddressComponents(results[0], lat, lng);
      }
    });
  };

  const parseAddressComponents = (
    place: google.maps.places.PlaceResult | google.maps.GeocoderResult,
    lat: number,
    lng: number
  ) => {
    const components = place.address_components || [];

    let streetNumber = "";
    let route = "";
    let sublocality = "";
    let city = "";
    let state = "";
    let pincode = "";

    components.forEach((component) => {
      const types = component.types;

      if (types.includes("street_number")) streetNumber = component.long_name;
      if (types.includes("route")) route = component.long_name;
      if (
        types.includes("sublocality_level_1") ||
        types.includes("sublocality")
      )
        sublocality = component.long_name;
      if (types.includes("locality")) city = component.long_name;
      else if (types.includes("administrative_area_level_2") && !city)
        city = component.long_name;
      if (types.includes("administrative_area_level_1"))
        state = component.long_name;
      if (types.includes("postal_code")) pincode = component.long_name;
    });

    let addressLine1Parts = [];
    if (streetNumber) addressLine1Parts.push(streetNumber);
    if (route) addressLine1Parts.push(route);
    if (sublocality && !route) addressLine1Parts.push(sublocality);

    const addressLine1 =
      addressLine1Parts.join(", ") ||
      ("formatted_address" in place ? place.formatted_address : "") ||
      `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

    const formattedLat = parseFloat(lat.toFixed(6));
    const formattedLng = parseFloat(lng.toFixed(6));

    let suggestedLabel = "";
    if (!formData.label || !editingAddress) {
      const baseLabel = city || sublocality || "My Location";
      suggestedLabel = baseLabel;

      let counter = 1;
      while (
        existingAddresses.some(
          (addr) =>
            addr.label.toLowerCase() === suggestedLabel.toLowerCase() &&
            (!editingAddress || addr.id !== editingAddress.id)
        )
      ) {
        counter++;
        suggestedLabel = `${baseLabel} ${counter}`;
      }
    }

    setFormData((prev) => ({
      ...prev,
      label: suggestedLabel || prev.label,
      address_line1: addressLine1,
      city: city || sublocality || prev.city,
      state: state || city || sublocality || prev.state,
      pincode: pincode || prev.pincode,
      latitude: formattedLat,
      longitude: formattedLng,
    }));

    toast.success("Location selected! Address details auto-filled", {
      description: `${city || sublocality || "Location"} selected`,
    });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setGettingLocation(true);
    toast.info("Detecting your location...", { duration: 2000 });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateMarker(latitude, longitude);
        reverseGeocode(latitude, longitude);
        setGettingLocation(false);
        toast.success("Current location detected!", {
          description: `Latitude: ${latitude.toFixed(
            6
          )}, Longitude: ${longitude.toFixed(6)}`,
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMessage = "Failed to get current location";
        let description = "";

        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "Location access denied";
          description =
            "Please enable location access in your browser settings or search for your location instead.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = "Location unavailable";
          description =
            "Your location could not be determined. Try searching for your address instead.";
        } else if (error.code === error.TIMEOUT) {
          errorMessage = "Location request timed out";
          description =
            "Please try again or search for your location manually.";
        }

        toast.error(errorMessage, { description });
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const handleSaveAddress = async () => {
    if (!formData.label || !formData.address_line1) {
      toast.error("Please fill in required fields (Label and Address)");
      return;
    }

    if (formData.latitude === 0 || formData.longitude === 0) {
      toast.error("Please select a location on the map");
      return;
    }

    // Check for duplicate label
    if (
      !editingAddress ||
      editingAddress.label.toLowerCase() !== formData.label.toLowerCase()
    ) {
      const duplicateLabel = existingAddresses.find(
        (addr) => addr.label.toLowerCase() === formData.label.toLowerCase()
      );
      if (duplicateLabel) {
        toast.error("Duplicate Label", {
          description: `You already have an address labeled "${duplicateLabel.label}". Please use a different label.`,
        });
        return;
      }
    }

    try {
      setLoading(true);

      let savedAddress: DeliveryAddress;

      if (editingAddress) {
        savedAddress = await addressService.updateAddress({
          id: editingAddress.id,
          ...formData,
        });
      } else {
        savedAddress = await addressService.createAddress(formData);
      }

      onAddressSaved(savedAddress);
    } catch (error: any) {
      console.error("Error saving address:", error);
      const errorMessage =
        error.message || "Failed to save address. Please try again.";
      toast.error("Failed to Save Address", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      label: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      pincode: "",
      latitude: 0,
      longitude: 0,
      is_default: false,
    });

    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }

    // Reset map when closing
    if (mapRef.current) {
      mapRef.current = null;
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex flex-col h-full max-h-[90vh]">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <MapPin className="h-5 w-5 text-orange-500" />
              {editingAddress ? "Edit Address" : "Add New Address"}
            </DialogTitle>
            <DialogDescription>
              {gettingLocation
                ? "Detecting your location..."
                : "Click the map, search for an address, or use your current location"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Left: Map Section */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Select Location
                  </h3>

                  {/* Quick Actions */}
                  <div className="flex gap-2 mb-4">
                    <Button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={gettingLocation || !mapsLoaded}
                      variant="outline"
                      className="flex-1"
                    >
                      {gettingLocation ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Getting...
                        </>
                      ) : (
                        <>
                          <Navigation className="h-4 w-4 mr-2" />
                          Use Current Location
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Search Input */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      ref={searchInputRef}
                      placeholder="Search: Jaffna, Colombo, or any location in Sri Lanka..."
                      className="pl-10"
                      disabled={!mapsLoaded}
                    />
                  </div>

                  {/* Location Helper Card */}
                  <Card className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800 mb-4">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      <strong>💡 Quick Tip:</strong> Type your city name (e.g.,
                      "Jaffna", "Kandy", "Galle") or click "Use Current
                      Location" for automatic detection
                    </p>
                  </Card>

                  {/* Map Container */}
                  <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
                    <div
                      ref={mapContainerRef}
                      className="w-full h-96 bg-gray-100"
                    />
                    {!mapsLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
                        <div className="text-center">
                          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">
                            Loading map...
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    💡 Click on the map or search for a location to auto-fill
                    address details
                  </p>
                </div>
              </div>

              {/* Right: Form Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-3">Address Details</h3>

                {formData.latitude !== 0 && formData.longitude !== 0 && (
                  <Card className="p-3 bg-green-50 border-green-200">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <p className="text-sm font-medium text-green-900">
                        Location selected: {formData.latitude.toFixed(6)},{" "}
                        {formData.longitude.toFixed(6)}
                      </p>
                    </div>
                  </Card>
                )}

                <div>
                  <Label htmlFor="label">Address Label *</Label>
                  <Input
                    id="label"
                    placeholder="e.g., Home, Work, Office, Jaffna Home"
                    value={formData.label}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        label: e.target.value,
                      }))
                    }
                  />
                  {existingAddresses.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Existing labels:{" "}
                      {existingAddresses.map((a) => a.label).join(", ")}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="address_line1">Address Line 1 *</Label>
                  <Textarea
                    id="address_line1"
                    placeholder="Street address, building name, etc."
                    value={formData.address_line1}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address_line1: e.target.value,
                      }))
                    }
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="address_line2">
                    Address Line 2 (Optional)
                  </Label>
                  <Input
                    id="address_line2"
                    placeholder="Apartment, suite, floor, etc."
                    value={formData.address_line2}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address_line2: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="City"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          city: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode">Postal Code</Label>
                    <Input
                      id="pincode"
                      placeholder="Postal code"
                      value={formData.pincode}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          pincode: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={handleClose}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveAddress}
                    disabled={
                      loading ||
                      !formData.label ||
                      !formData.address_line1 ||
                      formData.latitude === 0
                    }
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        {editingAddress ? "Update" : "Save"} Address
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GoogleMapsAddressPicker;
