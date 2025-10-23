import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

interface RealTimeDataOptions {
  enabled?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface RealTimeDataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  connected: boolean;
  lastUpdate: Date | null;
}

export function useRealTimeData<T>(
  endpoint: string,
  options: RealTimeDataOptions = {}
) {
  const { user } = useAuth();
  const {
    enabled = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5
  } = options;

  const [state, setState] = useState<RealTimeDataState<T>>({
    data: null,
    loading: false,
    error: null,
    connected: false,
    lastUpdate: null
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!user || !enabled) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // In a real implementation, you would connect to your WebSocket server
      // For now, we'll simulate with polling
      const ws = new WebSocket(`ws://localhost:8000/ws/${endpoint}/`);
      
      ws.onopen = () => {
        console.log(`Connected to ${endpoint}`);
        setState(prev => ({
          ...prev,
          connected: true,
          loading: false,
          error: null
        }));
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setState(prev => ({
            ...prev,
            data,
            lastUpdate: new Date()
          }));
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        console.log(`Disconnected from ${endpoint}`);
        setState(prev => ({
          ...prev,
          connected: false,
          loading: false
        }));

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else {
          setState(prev => ({
            ...prev,
            error: 'Connection lost. Please refresh the page.'
          }));
        }
      };

      ws.onerror = (error) => {
        console.error(`WebSocket error for ${endpoint}:`, error);
        setState(prev => ({
          ...prev,
          error: 'Connection error occurred'
        }));
      };

      wsRef.current = ws;
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to connect'
      }));
    }
  }, [user, enabled, endpoint, reconnectInterval, maxReconnectAttempts]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setState(prev => ({
      ...prev,
      connected: false,
      loading: false
    }));
  }, []);

  // Send message through WebSocket
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  // Manual refresh
  const refresh = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      sendMessage({ type: 'refresh' });
    } else {
      connect();
    }
  }, [connect, sendMessage]);

  // Effect to handle connection
  useEffect(() => {
    if (enabled && user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, user, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    sendMessage,
    refresh
  };
}

// Specific hooks for different data types
export function useRealTimeStats() {
  return useRealTimeData<{
    total_users: number;
    active_users: number;
    total_orders: number;
    total_revenue: number;
  }>('stats');
}

export function useRealTimeNotifications() {
  return useRealTimeData<{
    unread_count: number;
    notifications: Array<{
      id: number;
      title: string;
      message: string;
      type: string;
      priority: string;
      created_at: string;
    }>;
  }>('notifications');
}

export function useRealTimeOrders() {
  return useRealTimeData<{
    recent_orders: Array<{
      id: number;
      order_number: string;
      customer_name: string;
      total_amount: number;
      status: string;
      created_at: string;
    }>;
  }>('orders');
}

export function useRealTimeSystemHealth() {
  return useRealTimeData<{
    health_score: number;
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    alerts: Array<{
      type: string;
      message: string;
    }>;
  }>('system-health');
}
