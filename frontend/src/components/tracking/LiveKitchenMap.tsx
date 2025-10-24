import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Navigation,
  Home,
  Package,
  Truck,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Location } from "@/services/orderTrackingService";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  Polyline,
  InfoWindow,
} from "@react-google-maps/api";
import { Button } from "@/components/ui/button";

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

interface LiveKitchenMapProps {
  chefLocation: Location | null;
  deliveryLocation: Location | null;
  agentLocation: Location | null;
  orderStatus: string;
  distance?: number | null;
  className?: string;
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 9.6615,
  lng: 80.0255,
}; // Sri Lanka center

export const LiveKitchenMap: React.FC<LiveKitchenMapProps> = ({
  chefLocation,
  deliveryLocation,
  agentLocation,
  orderStatus,
  distance,
  className,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<
    "chef" | "delivery" | "agent" | null
  >(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Get Google Maps API key from environment
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  // Use useLoadScript hook - singleton pattern prevents multiple loads
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey,
    libraries,
    preventGoogleFontsLoading: true,
  });

  // Calculate center and bounds
  useEffect(() => {
    if (!map || typeof google === "undefined") return;

    try {
      const bounds = new google.maps.LatLngBounds();
      let hasLocations = false;

      // Add chef location
      if (chefLocation?.latitude && chefLocation?.longitude) {
        bounds.extend(
          new google.maps.LatLng(chefLocation.latitude, chefLocation.longitude)
        );
        hasLocations = true;
      }

      // Add delivery location
      if (deliveryLocation?.latitude && deliveryLocation?.longitude) {
        bounds.extend(
          new google.maps.LatLng(
            deliveryLocation.latitude,
            deliveryLocation.longitude
          )
        );
        hasLocations = true;
      }

      // Add agent location
      if (agentLocation?.latitude && agentLocation?.longitude) {
        bounds.extend(
          new google.maps.LatLng(
            agentLocation.latitude,
            agentLocation.longitude
          )
        );
        hasLocations = true;
      }

      // Fit map to show all markers
      if (hasLocations) {
        map.fitBounds(bounds);

        // Add padding for better visibility
        const padding = { top: 40, right: 40, bottom: 40, left: 40 };
        map.fitBounds(bounds, padding);

        // Limit zoom for single location
        const listener = google.maps.event.addListenerOnce(map, "idle", () => {
          if (map.getZoom()! > 16) map.setZoom(16);
        });
      }
    } catch (error) {
      console.warn("Error fitting map bounds:", error);
    }
  }, [map, chefLocation, deliveryLocation, agentLocation]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && mapRef.current) {
      mapRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getMapCenter = () => {
    // Priority: agent > chef > delivery > default
    if (agentLocation && agentLocation.latitude && agentLocation.longitude) {
      return { lat: agentLocation.latitude, lng: agentLocation.longitude };
    }
    if (chefLocation && chefLocation.latitude && chefLocation.longitude) {
      return { lat: chefLocation.latitude, lng: chefLocation.longitude };
    }
    if (
      deliveryLocation &&
      deliveryLocation.latitude &&
      deliveryLocation.longitude
    ) {
      return {
        lat: deliveryLocation.latitude,
        lng: deliveryLocation.longitude,
      };
    }
    return defaultCenter; // Colombo, Sri Lanka
  };

  const getPolylinePath = () => {
    const path: google.maps.LatLngLiteral[] = [];

    if (chefLocation) {
      path.push({ lat: chefLocation.latitude, lng: chefLocation.longitude });
    }

    if (agentLocation && orderStatus === "out_for_delivery") {
      path.push({ lat: agentLocation.latitude, lng: agentLocation.longitude });
    }

    if (deliveryLocation) {
      path.push({
        lat: deliveryLocation.latitude,
        lng: deliveryLocation.longitude,
      });
    }

    return path;
  };

  // Loading state
  if (!isLoaded && !loadError) {
    return (
      <div
        className={cn(
          "w-full h-full bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 flex items-center justify-center rounded-lg",
          className
        )}
      >
        <div className="text-center">
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <MapPin className="h-10 w-10 mx-auto mb-3 text-orange-500" />
          </motion.div>
          <p className="text-gray-700 dark:text-gray-300 font-semibold text-sm">
            Loading map...
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
            Please wait
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div
        className={cn(
          "rounded-lg bg-gray-100 dark:bg-gray-800 p-8 text-center",
          className
        )}
      >
        <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600 dark:text-gray-300">Failed to load map</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Please check your internet connection
        </p>
      </div>
    );
  }

  if (!googleMapsApiKey) {
    return (
      <div
        className={cn(
          "rounded-lg bg-gray-100 dark:bg-gray-800 p-8 text-center",
          className
        )}
      >
        <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600 dark:text-gray-300">
          Map functionality requires Google Maps API key
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Configure VITE_GOOGLE_MAPS_API_KEY in your environment
        </p>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className={cn(
        "relative w-full h-full overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-lg",
        className
      )}
    >
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={getMapCenter()}
        zoom={14}
        onLoad={setMap}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          disableDefaultUI: false,
          gestureHandling: "cooperative",
          mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        }}
      >
        {/* Kitchen/Chef Marker - Prominent and Always Visible with Permanent Label */}
        {chefLocation && chefLocation.latitude && chefLocation.longitude && (
          <>
            <Marker
              position={{
                lat: chefLocation.latitude,
                lng: chefLocation.longitude,
              }}
              icon={{
                url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
                      <defs>
                        <filter id="shadow">
                          <feDropShadow dx="0" dy="3" stdDeviation="4" flood-opacity="0.5"/>
                        </filter>
                      </defs>
                      <circle cx="25" cy="25" r="22" fill="#f97316" stroke="#ffffff" stroke-width="4" filter="url(#shadow)"/>
                      <path d="M25 15 L19 23 L25 21 L31 23 Z" fill="#ffffff"/>
                      <rect x="23" y="23" width="4" height="9" fill="#ffffff" rx="1"/>
                      <circle cx="25" cy="25" r="18" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.3"/>
                    </svg>
                  `)}`,
              }}
              title="🍳 Kitchen Location"
              animation={
                typeof google !== "undefined"
                  ? google.maps.Animation.DROP
                  : undefined
              }
              onClick={() => setSelectedMarker("chef")}
            />

            {/* Permanent Kitchen Label */}
            <InfoWindow
              position={{
                lat: chefLocation.latitude,
                lng: chefLocation.longitude + 0.0015,
              }}
              options={{
                pixelOffset: new (window.google?.maps?.Size || class {})(
                  0,
                  -50
                ),
                disableAutoPan: true,
                closeBoxURL: "",
              }}
            >
              <div className="bg-white dark:bg-gray-800 px-2 py-1 rounded-md shadow-lg border-2 border-orange-500">
                <p className="text-xs font-bold text-orange-600 dark:text-orange-400">
                  🍳 Kitchen
                </p>
              </div>
            </InfoWindow>

            {selectedMarker === "chef" && (
              <InfoWindow
                position={{
                  lat: chefLocation.latitude,
                  lng: chefLocation.longitude,
                }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Home className="h-4 w-4 text-orange-600" />
                    <span className="font-semibold">Kitchen Location</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {chefLocation.address}
                  </p>
                </div>
              </InfoWindow>
            )}
          </>
        )}

        {/* Delivery Location Marker */}
        {deliveryLocation && (
          <>
            <Marker
              position={{
                lat: deliveryLocation.latitude,
                lng: deliveryLocation.longitude,
              }}
              icon={{
                url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
                  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#10b981" stroke="#ffffff" stroke-width="2"/></svg>'
                )}`,
              }}
              onClick={() => setSelectedMarker("delivery")}
            />
            {selectedMarker === "delivery" && (
              <InfoWindow
                position={{
                  lat: deliveryLocation.latitude,
                  lng: deliveryLocation.longitude,
                }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span className="font-semibold">Delivery Location</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {deliveryLocation.address}
                  </p>
                </div>
              </InfoWindow>
            )}
          </>
        )}

        {/* Delivery Agent Marker (Moving) */}
        {agentLocation && orderStatus === "out_for_delivery" && (
          <>
            <Marker
              position={{
                lat: agentLocation.latitude,
                lng: agentLocation.longitude,
              }}
              icon={{
                url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
                  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="#ffffff" stroke-width="2"/><path d="M8 12 L12 8 L16 12 L12 10 Z" fill="#ffffff"/></svg>'
                )}`,
              }}
              onClick={() => setSelectedMarker("agent")}
            />
            {selectedMarker === "agent" && (
              <InfoWindow
                position={{
                  lat: agentLocation.latitude,
                  lng: agentLocation.longitude,
                }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Truck className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold">Delivery Partner</span>
                  </div>
                  <p className="text-sm text-gray-600">On the way to you!</p>
                  {agentLocation.timestamp && (
                    <p className="text-xs text-gray-500 mt-1">
                      Updated:{" "}
                      {new Date(agentLocation.timestamp).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </InfoWindow>
            )}
          </>
        )}

        {/* Route Polyline */}
        {getPolylinePath().length >= 2 && (
          <Polyline
            path={getPolylinePath()}
            options={{
              strokeColor: "#f97316",
              strokeOpacity: 0.8,
              strokeWeight: 4,
              geodesic: true,
            }}
          />
        )}
      </GoogleMap>

      {/* Map Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-none">
        {/* Distance Info */}
        {distance && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-lg p-3 pointer-events-auto"
          >
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {distance.toFixed(1)} km
              </span>
            </div>
          </motion.div>
        )}

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-lg p-2 pointer-events-auto hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          ) : (
            <Maximize2 className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          )}
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-lg p-3 pointer-events-none">
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-orange-500 border-2 border-white" />
            <span className="text-gray-700 dark:text-gray-300">Kitchen</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
            <span className="text-gray-700 dark:text-gray-300">Delivery</span>
          </div>
          {orderStatus === "out_for_delivery" && (
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500 border-2 border-white" />
              <span className="text-gray-700 dark:text-gray-300">Live</span>
            </div>
          )}
        </div>
      </div>

      {/* Live Indicator */}
      {orderStatus === "out_for_delivery" && agentLocation && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 right-16 bg-red-500 text-white rounded-full px-3 py-1 shadow-lg flex items-center gap-2 text-sm font-medium pointer-events-none"
        >
          <motion.div
            className="h-2 w-2 rounded-full bg-white"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          LIVE
        </motion.div>
      )}
    </div>
  );
};

export default LiveKitchenMap;
