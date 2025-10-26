import React, { useCallback, useState, useEffect } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  DirectionsRenderer,
  InfoWindow,
} from "@react-google-maps/api";
import { MapPin, Navigation, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { geocodeAddress } from "@/utils/mapUtils";
import type { Order } from "../../types/orderType";

interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
}

interface GoogleMapComponentProps {
  currentLocation: Location | null;
  orders: Order[];
  onOrderSelect: (order: Order) => void;
  onGetDirections: (order: Order) => void;
  className?: string;
}

const containerStyle = {
  width: "100%",
  height: "500px",
  borderRadius: "8px",
};

const defaultCenter = {
  lat: 37.7749, // San Francisco default
  lng: -122.4194,
};

const libraries: ("places" | "geometry" | "marker")[] = [
  "places",
  "geometry",
  "marker",
];

// Custom marker component that uses AdvancedMarkerElement when available
const CustomMarker: React.FC<{
  position: { lat: number; lng: number };
  title: string;
  icon?: string;
  onClick?: () => void;
  map?: google.maps.Map | null;
}> = ({ position, title, icon, onClick, map }) => {
  const [marker, setMarker] = useState<
    google.maps.Marker | google.maps.marker.AdvancedMarkerElement | null
  >(null);

  useEffect(() => {
    if (!map) return;

    // Clean up previous marker
    if (marker) {
      if ("setMap" in marker) {
        marker.setMap(null);
      }
    }

    // Create new marker using AdvancedMarkerElement if available, otherwise fallback to regular Marker
    let newMarker:
      | google.maps.Marker
      | google.maps.marker.AdvancedMarkerElement;

    if (window.google?.maps?.marker?.AdvancedMarkerElement) {
      // Use new AdvancedMarkerElement
      const markerElement = document.createElement("div");
      markerElement.innerHTML =
        icon ||
        `
        <div style="width: 24px; height: 24px; background: #3B82F6; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>
      `;

      newMarker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position,
        title,
        content: markerElement,
      });

      if (onClick) {
        newMarker.addListener("click", onClick);
      }
    } else {
      // Fallback to regular Marker
      newMarker = new google.maps.Marker({
        position,
        map,
        title,
        icon: icon
          ? {
              url: icon,
              scaledSize: new google.maps.Size(28, 28),
              anchor: new google.maps.Point(14, 28),
            }
          : undefined,
      });

      if (onClick) {
        newMarker.addListener("click", onClick);
      }
    }

    setMarker(newMarker);

    return () => {
      if (newMarker && "setMap" in newMarker) {
        newMarker.setMap(null);
      }
    };
  }, [map, position, title, icon, onClick]);

  return null;
};

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({
  currentLocation,
  orders,
  onOrderSelect,
  onGetDirections,
  className = "",
}) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [directionsResponse, setDirectionsResponse] =
    useState<google.maps.DirectionsResult | null>(null);
  const [orderPositions, setOrderPositions] = useState<
    Record<number, { lat: number; lng: number }>
  >({});

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries,
    version: "weekly",
    preventGoogleFontsLoading: true,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Geocode order addresses when orders change
  useEffect(() => {
    const geocodeOrders = async () => {
      const positions: Record<number, { lat: number; lng: number }> = {};

      for (const order of orders) {
        if (order.delivery_address && !orderPositions[order.id]) {
          try {
            const result = await geocodeAddress(order.delivery_address);
            if (result) {
              positions[order.id] = { lat: result.lat, lng: result.lng };
            } else {
              // Fallback to mock position if geocoding fails
              const mockPositions = [
                { lat: 37.7849, lng: -122.4094 },
                { lat: 37.7649, lng: -122.4294 },
                { lat: 37.7949, lng: -122.3994 },
                { lat: 37.7549, lng: -122.4394 },
              ];
              positions[order.id] =
                mockPositions[order.id % mockPositions.length] ||
                mockPositions[0];
            }
          } catch (error) {
            console.error(
              `Failed to geocode address for order ${order.id}:`,
              error
            );
            // Use fallback position
            const mockPositions = [
              { lat: 37.7849, lng: -122.4094 },
              { lat: 37.7649, lng: -122.4294 },
              { lat: 37.7949, lng: -122.3994 },
              { lat: 37.7549, lng: -122.4394 },
            ];
            positions[order.id] =
              mockPositions[order.id % mockPositions.length] ||
              mockPositions[0];
          }
        }
      }

      if (Object.keys(positions).length > 0) {
        setOrderPositions((prev) => ({ ...prev, ...positions }));
      }
    };

    if (isLoaded && orders.length > 0) {
      geocodeOrders();
    }
  }, [orders, isLoaded, orderPositions]);

  // Calculate directions when a specific order is selected for navigation
  const calculateDirections = useCallback(
    async (order: Order) => {
      if (!map || !currentLocation) return;

      const orderPosition = orderPositions[order.id];
      if (!orderPosition) return;

      const directionsService = new google.maps.DirectionsService();

      try {
        const result = await directionsService.route({
          origin: { lat: currentLocation.lat, lng: currentLocation.lng },
          destination: orderPosition,
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
          avoidHighways: false,
          avoidTolls: false,
          optimizeWaypoints: true,
        });

        setDirectionsResponse(result);

        // Calculate estimated time and distance
        const route = result.routes[0];
        if (route) {
          const leg = route.legs[0];
          const distance = leg.distance?.text || "Unknown";
          const duration = leg.duration?.text || "Unknown";

          console.log(`Route calculated: ${distance}, ${duration}`);
        }

        onGetDirections(order);
      } catch (error) {
        console.error("Error calculating directions:", error);
        setDirectionsResponse(null);
      }
    },
    [map, currentLocation, orderPositions, onGetDirections]
  );

  // Get order marker position
  const getOrderPosition = (
    order: Order
  ): { lat: number; lng: number } | null => {
    return orderPositions[order.id] || null;
  };

  const getOrderStatusColor = (status: string): string => {
    switch (status) {
      case "assigned":
        return "#6B7280"; // gray
      case "picked_up":
        return "#3B82F6"; // blue
      case "in_transit":
        return "#EAB308"; // yellow
      case "delivered":
        return "#10B981"; // green
      default:
        return "#6B7280";
    }
  };

  if (loadError) {
    return (
      <div
        className={`bg-red-50 border border-red-200 rounded-lg p-8 text-center min-h-[500px] flex flex-col items-center justify-center ${className}`}
      >
        <MapPin className="h-16 w-16 text-red-400 mb-4" />
        <p className="text-red-600 mb-2">Failed to load Google Maps</p>
        <p className="text-sm text-red-400">
          Please check your Google Maps API key configuration
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={`bg-gray-100 rounded-lg p-8 text-center min-h-[500px] flex flex-col items-center justify-center ${className}`}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-500">Loading Google Maps...</p>
      </div>
    );
  }

  const center = currentLocation || defaultCenter;

  return (
    <div className={className}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={currentLocation ? 14 : 10}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          zoomControl: true,
          streetViewControl: true,
          mapTypeControl: true,
          fullscreenControl: true,
          mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
        }}
      >
        {/* Current Location Marker */}
        {currentLocation && (
          <CustomMarker
            position={{ lat: currentLocation.lat, lng: currentLocation.lng }}
            icon={
              "data:image/svg+xml;charset=UTF-8," +
              encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="10" r="3"/>
                  <path d="m12 21.7-4-7.2c-.7-1.5-1-3.2-1-4.8a5 5 0 0 1 10 0c0 1.6-.3 3.3-1 4.8l-4 7.2z"/>
                </svg>
              `)
            }
            title="Your Location"
            map={map}
          />
        )}

        {/* Order Markers */}
        {orders.map((order) => {
          const position = getOrderPosition(order);
          if (!position) return null;

          return (
            <CustomMarker
              key={order.id}
              position={position}
              icon={
                "data:image/svg+xml;charset=UTF-8," +
                encodeURIComponent(`
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="${getOrderStatusColor(
                    order.status
                  )}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="10" r="3"/>
                    <path d="m12 21.7-4-7.2c-.7-1.5-1-3.2-1-4.8a5 5 0 0 1 10 0c0 1.6-.3 3.3-1 4.8l-4 7.2z"/>
                  </svg>
                `)
              }
              title={`Order #${order.id}`}
              onClick={() => setSelectedOrder(order)}
              map={map}
            />
          );
        })}

        {/* Info Window for Selected Order */}
        {selectedOrder && getOrderPosition(selectedOrder) && (
          <InfoWindow
            position={getOrderPosition(selectedOrder)!}
            onCloseClick={() => setSelectedOrder(null)}
          >
            <div className="p-2 max-w-xs">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">
                  Order #{selectedOrder.id}
                </h3>
                <span
                  className="px-2 py-1 text-xs rounded-full text-white"
                  style={{
                    backgroundColor: getOrderStatusColor(selectedOrder.status),
                  }}
                >
                  {selectedOrder.status}
                </span>
              </div>

              <div className="space-y-1 text-xs text-gray-600 mb-3">
                <div className="flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  <span>
                    {selectedOrder.customer?.name || "Unknown Customer"}
                  </span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span className="truncate">
                    {selectedOrder.delivery_address || "Address not specified"}
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>
                    {new Date(selectedOrder.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      onOrderSelect(selectedOrder);
                      setSelectedOrder(null);
                    }}
                    className="text-xs py-1 px-2 h-auto flex-1"
                  >
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => calculateDirections(selectedOrder)}
                    className="text-xs py-1 px-2 h-auto flex-1"
                  >
                    <Navigation className="h-3 w-3 mr-1" />
                    Map Route
                  </Button>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    const destination =
                      selectedOrder.delivery_address ||
                      `${selectedOrder.customer?.name || "Customer"} Location`;
                    const encodedDestination = encodeURIComponent(destination);
                    const googleMapsUrl = currentLocation
                      ? `https://www.google.com/maps/dir/${currentLocation.lat},${currentLocation.lng}/${encodedDestination}`
                      : `https://www.google.com/maps/search/${encodedDestination}`;
                    window.open(googleMapsUrl, "_blank");
                    setSelectedOrder(null);
                  }}
                  className="text-xs py-1 px-2 h-auto w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Navigation className="h-3 w-3 mr-1" />
                  Open in Google Maps
                </Button>
              </div>
            </div>
          </InfoWindow>
        )}

        {/* Directions Renderer */}
        {directionsResponse && (
          <DirectionsRenderer
            directions={directionsResponse}
            options={{
              suppressMarkers: false,
              polylineOptions: {
                strokeColor: "#059669",
                strokeWeight: 5,
                strokeOpacity: 0.8,
              },
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
};

export default GoogleMapComponent;
