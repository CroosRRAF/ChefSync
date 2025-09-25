// Global type declarations for Google Maps

declare global {
  interface Window {
    google: typeof google;
  }
}

// Re-export common Google Maps types for convenience
export type GoogleLatLng = google.maps.LatLng;
export type GoogleMap = google.maps.Map;
export type GoogleMarker = google.maps.Marker;
export type GoogleDirectionsResult = google.maps.DirectionsResult;
export type GoogleGeocoder = google.maps.Geocoder;
export type GoogleDistanceMatrixService = google.maps.DistanceMatrixService;

export interface MapLocation {
  lat: number;
  lng: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapOptions extends Omit<google.maps.MapOptions, 'center' | 'zoom'> {
  center?: MapLocation;
  zoom?: number;
}
