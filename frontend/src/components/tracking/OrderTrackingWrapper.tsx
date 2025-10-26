import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { OrderStatusBar, OrderTrackingPanel } from './index';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { orderService } from '@/services/orderService';
import { useToast } from '@/hooks/use-toast';

interface ActiveOrder {
  id: number;
  order_number: string;
  status: string;
}

// Create a global event for opening tracking panel
export const openOrderTracking = (orderId: number) => {
  const event = new CustomEvent('open-order-tracking', { detail: { orderId } });
  window.dispatchEvent(event);
};

/**
 * Wrapper component that shows persistent order tracking for active orders
 * Place this at the root of your customer pages layout
 */
export const OrderTrackingWrapper: React.FC = () => {
  const { user } = useAuth();
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [showTrackingPanel, setShowTrackingPanel] = useState(false);
  const [dismissedOrders, setDismissedOrders] = useState<Set<number>>(new Set());
  const [forceShowBar, setForceShowBar] = useState(false);
  const { toast } = useToast();

  // Track the selected order
  const { trackingData, loading, refresh } = useOrderTracking({
    orderId: selectedOrderId,
    enabled: selectedOrderId !== null,
    pollingInterval: 10000, // Poll every 10 seconds
    onStatusChange: (newStatus, oldStatus) => {
      // Show toast notification on status change
      const statusMessages: Record<string, string> = {
        confirmed: 'Your order has been confirmed!',
        preparing: 'Chef is preparing your food',
        ready: 'Your order is ready!',
        out_for_delivery: 'Your order is out for delivery',
        delivered: 'Order delivered! Enjoy your meal!',
      };

      if (statusMessages[newStatus]) {
        toast({
          title: 'Order Update',
          description: statusMessages[newStatus],
          duration: 5000,
        });
      }

      // Refresh active orders list
      loadActiveOrders();
    },
  });

  // Load active orders on mount and periodically
  useEffect(() => {
    if (!user) return;

    // Load immediately
    loadActiveOrders();

    // Poll for new active orders every 15 seconds (faster for new orders)
    const interval = setInterval(loadActiveOrders, 15000);

    return () => clearInterval(interval);
  }, [user]);

  // Listen for global events to open tracking panel
  useEffect(() => {
    const handleOpenTracking = (event: any) => {
      const { orderId } = event.detail;
      if (orderId) {
        setSelectedOrderId(orderId);
        setShowTrackingPanel(true);
        setForceShowBar(true);
        // Remove from dismissed list
        setDismissedOrders((prev) => {
          const newSet = new Set(prev);
          newSet.delete(orderId);
          return newSet;
        });
      }
    };

    window.addEventListener('open-order-tracking', handleOpenTracking);
    return () => window.removeEventListener('open-order-tracking', handleOpenTracking);
  }, []);

  const loadActiveOrders = useCallback(async () => {
    try {
      const orders = await orderService.getUserOrders();
      
      // Filter for active orders (not delivered, cancelled, or refunded)
      const active = orders.filter(
        (order: any) =>
          !['delivered', 'cancelled', 'refunded', 'cart'].includes(order.status)
      );

      setActiveOrders(
        active.map((order: any) => ({
          id: order.id,
          order_number: order.order_number,
          status: order.status,
        }))
      );

      // Auto-select first active order if none selected
      if (active.length > 0 && !selectedOrderId) {
        setSelectedOrderId(active[0].id);
        setForceShowBar(true); // Show bar for new orders
      }
    } catch (error) {
      console.error('Error loading active orders:', error);
    }
  }, [selectedOrderId]);

  const handleDismiss = (orderId: number) => {
    setDismissedOrders((prev) => new Set(prev).add(orderId));
    setForceShowBar(false);
    
    // If dismissing the selected order, select next one
    if (orderId === selectedOrderId) {
      const remaining = activeOrders.filter((o) => o.id !== orderId);
      if (remaining.length > 0) {
        setSelectedOrderId(remaining[0].id);
        setForceShowBar(true);
      } else {
        setSelectedOrderId(null);
      }
    }
  };

  const handleExpand = () => {
    setShowTrackingPanel(true);
  };

  const handleClose = () => {
    setShowTrackingPanel(false);
  };

  // Get the current order to display
  const currentOrder = activeOrders.find((o) => o.id === selectedOrderId);

  // Don't show anything if no active orders
  if (!user || activeOrders.length === 0 || !currentOrder) {
    return null;
  }

  // Show bar if not dismissed or force show
  const shouldShowBar = forceShowBar || !dismissedOrders.has(currentOrder.id);

  // Don't show if tracking data not loaded yet
  if (!trackingData) {
    return null;
  }

  return (
    <>
      {/* Persistent Status Bar - Only show if not dismissed */}
      {shouldShowBar && (
        <OrderStatusBar
          orderId={currentOrder.id}
          trackingData={trackingData}
          onExpand={handleExpand}
          onDismiss={() => handleDismiss(currentOrder.id)}
          position="bottom"
        />
      )}

      {/* Expanded Tracking Panel */}
      {showTrackingPanel && trackingData && (
        <OrderTrackingPanel
          trackingData={trackingData}
          onClose={handleClose}
          onRefresh={refresh}
          loading={loading}
        />
      )}
    </>
  );
};

export default OrderTrackingWrapper;

