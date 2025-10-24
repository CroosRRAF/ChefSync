import { useState, useEffect, useCallback, useRef } from 'react';
import { orderTrackingService, OrderTrackingData } from '@/services/orderTrackingService';

interface UseOrderTrackingOptions {
  orderId: number | null;
  enabled?: boolean;
  pollingInterval?: number; // in milliseconds
  onStatusChange?: (newStatus: string, oldStatus: string) => void;
}

interface UseOrderTrackingReturn {
  trackingData: OrderTrackingData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  startTracking: () => void;
  stopTracking: () => void;
  isTracking: boolean;
}

/**
 * Hook for real-time order tracking with automatic polling
 */
export function useOrderTracking({
  orderId,
  enabled = true,
  pollingInterval = 10000, // Default 10 seconds
  onStatusChange,
}: UseOrderTrackingOptions): UseOrderTrackingReturn {
  const [trackingData, setTrackingData] = useState<OrderTrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  
  const stopPollingRef = useRef<(() => void) | null>(null);
  const previousStatusRef = useRef<string | null>(null);

  // Load tracking data
  const loadTrackingData = useCallback(async () => {
    if (!orderId) {
      setError('No order ID provided');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await orderTrackingService.getOrderTracking(orderId);
      
      // Check for status change
      if (previousStatusRef.current && previousStatusRef.current !== data.status && onStatusChange) {
        onStatusChange(data.status, previousStatusRef.current);
      }
      
      previousStatusRef.current = data.status;
      setTrackingData(data);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load tracking data';
      setError(errorMessage);
      console.error('Error loading tracking data:', err);
    } finally {
      setLoading(false);
    }
  }, [orderId, onStatusChange]);

  // Start real-time tracking
  const startTracking = useCallback(async () => {
    if (!orderId || isTracking) return;

    setIsTracking(true);
    
    // Initial load
    await loadTrackingData();

    // Start polling - await the promise to get the cleanup function
    const stopPolling = await orderTrackingService.pollOrderTracking(
      orderId,
      (data) => {
        // Check for status change
        if (previousStatusRef.current && previousStatusRef.current !== data.status && onStatusChange) {
          onStatusChange(data.status, previousStatusRef.current);
        }
        
        previousStatusRef.current = data.status;
        setTrackingData(data);
        setError(null);
      },
      pollingInterval
    );

    stopPollingRef.current = stopPolling;
  }, [orderId, isTracking, pollingInterval, loadTrackingData, onStatusChange]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (stopPollingRef.current) {
      stopPollingRef.current();
      stopPollingRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Manual refresh
  const refresh = useCallback(async () => {
    await loadTrackingData();
  }, [loadTrackingData]);

  // Auto-start tracking when enabled
  useEffect(() => {
    if (enabled && orderId && !isTracking) {
      startTracking();
    }

    return () => {
      stopTracking();
    };
  }, [enabled, orderId]); // Only depend on enabled and orderId

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  return {
    trackingData,
    loading,
    error,
    refresh,
    startTracking,
    stopTracking,
    isTracking,
  };
}

/**
 * Hook for tracking multiple orders
 */
export function useMultipleOrderTracking(orderIds: number[], enabled = true) {
  const [trackingDataMap, setTrackingDataMap] = useState<Map<number, OrderTrackingData>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAllTracking = useCallback(async () => {
    if (orderIds.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const promises = orderIds.map(id => orderTrackingService.getOrderTracking(id));
      const results = await Promise.allSettled(promises);

      const newMap = new Map<number, OrderTrackingData>();
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          newMap.set(orderIds[index], result.value);
        }
      });

      setTrackingDataMap(newMap);
    } catch (err: any) {
      setError('Failed to load tracking data for some orders');
      console.error('Error loading multiple tracking data:', err);
    } finally {
      setLoading(false);
    }
  }, [orderIds]);

  useEffect(() => {
    if (enabled && orderIds.length > 0) {
      loadAllTracking();

      // Poll for updates every 15 seconds
      const interval = setInterval(loadAllTracking, 15000);

      return () => clearInterval(interval);
    }
  }, [enabled, orderIds, loadAllTracking]);

  return {
    trackingDataMap,
    loading,
    error,
    refresh: loadAllTracking,
  };
}

export default useOrderTracking;

