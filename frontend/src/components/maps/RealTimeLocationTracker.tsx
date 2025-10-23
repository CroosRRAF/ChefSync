/**
 * Real-Time Location Tracker Component
 * Continuously tracks and updates cook's current location during work hours
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import {
  MapPin,
  Navigation,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';

// Location coordinates interface
interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

interface LocationUpdate {
  coordinates: LocationCoordinates;
  timestamp: Date;
  accuracy: number;
  speed?: number;
}

interface RealTimeLocationTrackerProps {
  /** Whether the cook is currently active/working */
  isActive?: boolean;
  /** Called when location is updated */
  onLocationUpdate?: (location: LocationUpdate) => void;
  /** Called when tracking status changes */
  onTrackingStatusChange?: (isTracking: boolean) => void;
  /** Update interval in milliseconds (default: 30 seconds) */
  updateInterval?: number;
}

export const RealTimeLocationTracker: React.FC<RealTimeLocationTrackerProps> = ({
  isActive = false,
  onLocationUpdate,
  onTrackingStatusChange,
  updateInterval = 30000 // 30 seconds
}) => {
  // State
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationUpdate | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [error, setError] = useState<string | null>(null);

  // Refs
  const watchIdRef = useRef<number | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Check geolocation permission status
   */
  const checkPermissionStatus = async () => {
    if (!navigator.permissions) {
      setPermissionStatus('unknown');
      return;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setPermissionStatus(permission.state);
      
      // Listen for permission changes
      permission.onchange = () => {
        setPermissionStatus(permission.state);
        if (permission.state === 'denied' && isTracking) {
          stopTracking();
        }
      };
    } catch (error) {
      console.error('Permission check failed:', error);
      setPermissionStatus('unknown');
    }
  };

  /**
   * Handle successful location update
   */
  const handleLocationUpdate = (position: GeolocationPosition) => {
    const locationUpdate: LocationUpdate = {
      coordinates: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      },
      timestamp: new Date(),
      accuracy: position.coords.accuracy,
      speed: position.coords.speed || undefined
    };

    setCurrentLocation(locationUpdate);
    setLastUpdateTime(new Date());
    setError(null);

    // Call parent callback
    onLocationUpdate?.(locationUpdate);
  };

  /**
   * Handle geolocation error
   */
  const handleLocationError = (error: GeolocationPositionError) => {
    console.error('Location tracking error:', error);
    
    let errorMessage = 'Unknown location error';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location permission denied. Please enable location access.';
        setPermissionStatus('denied');
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location unavailable. Check your GPS settings.';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timeout. Will retry...';
        break;
    }
    
    setError(errorMessage);
    
    // Don't stop tracking for timeout errors - just retry
    if (error.code !== error.TIMEOUT) {
      stopTracking();
    }
  };

  /**
   * Start real-time location tracking
   */
  const startTracking = async () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support location tracking",
      });
      return;
    }

    // Check permission first
    await checkPermissionStatus();
    
    if (permissionStatus === 'denied') {
      toast({
        variant: "destructive",
        title: "Location Permission Denied",
        description: "Please enable location permission in your browser settings",
      });
      return;
    }

    setIsTracking(true);
    setError(null);
    onTrackingStatusChange?.(true);

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      handleLocationUpdate,
      handleLocationError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    // Start continuous tracking
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleLocationUpdate,
      handleLocationError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000 // 30 seconds
      }
    );

    toast({
      title: "Location Tracking Started",
      description: "Your location will be updated automatically",
    });
  };

  /**
   * Stop location tracking
   */
  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    setIsTracking(false);
    setError(null);
    onTrackingStatusChange?.(false);

    toast({
      title: "Location Tracking Stopped",
      description: "Location updates have been disabled",
    });
  };

  /**
   * Toggle tracking
   */
  const toggleTracking = () => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  /**
   * Format time since last update
   */
  const getTimeSinceLastUpdate = () => {
    if (!lastUpdateTime) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - lastUpdateTime.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    } else if (diffSeconds < 3600) {
      return `${Math.floor(diffSeconds / 60)}m ago`;
    } else {
      return `${Math.floor(diffSeconds / 3600)}h ago`;
    }
  };

  /**
   * Check online status
   */
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Check permission status on mount
   */
  useEffect(() => {
    checkPermissionStatus();
  }, []);

  /**
   * Auto-start tracking if cook is active
   */
  useEffect(() => {
    if (isActive && !isTracking && permissionStatus === 'granted') {
      startTracking();
    } else if (!isActive && isTracking) {
      stopTracking();
    }
  }, [isActive]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, []);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Real-Time Location
          </CardTitle>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Tracking Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id="location-tracking"
              checked={isTracking}
              onCheckedChange={toggleTracking}
              disabled={!isOnline || permissionStatus === 'denied'}
            />
            <Label htmlFor="location-tracking">
              Location Tracking
            </Label>
          </div>
          <Badge variant={isTracking ? "default" : "secondary"}>
            {isTracking ? "Active" : "Inactive"}
          </Badge>
        </div>

        {/* Status Information */}
        <div className="space-y-2">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {permissionStatus === 'denied' && (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
              <AlertTriangle className="h-4 w-4" />
              <span>Location permission is required. Please enable it in your browser settings.</span>
            </div>
          )}

          {currentLocation && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Last Update</Label>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{getTimeSinceLastUpdate()}</span>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Accuracy</Label>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>±{Math.round(currentLocation.accuracy)}m</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Location Details */}
        {currentLocation && (
          <div className="border rounded-lg p-3 bg-gray-50">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <Label className="text-muted-foreground">Latitude</Label>
                <p className="font-mono">{currentLocation.coordinates.latitude.toFixed(6)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Longitude</Label>
                <p className="font-mono">{currentLocation.coordinates.longitude.toFixed(6)}</p>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={() => {
                const url = `https://www.google.com/maps/search/?api=1&query=${currentLocation.coordinates.latitude},${currentLocation.coordinates.longitude}`;
                window.open(url, '_blank');
              }}
            >
              <MapPin className="h-3 w-3 mr-2" />
              View on Maps
            </Button>
          </div>
        )}

        {/* Instructions */}
        {!isTracking && (
          <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded border-l-4 border-blue-500">
            <CheckCircle className="h-3 w-3 inline mr-1" />
            Enable location tracking to automatically share your position with customers during deliveries.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RealTimeLocationTracker;