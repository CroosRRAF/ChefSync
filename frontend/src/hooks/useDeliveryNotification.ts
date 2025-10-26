import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { customerService } from '@/services/customerService';

/**
 * Custom hook to monitor order delivery status and automatically prompt for reviews
 * when an order is delivered
 */
export const useDeliveryNotification = (orderId?: number | null, enabled: boolean = true) => {
  const navigate = useNavigate();
  const [previousStatus, setPreviousStatus] = useState<string | null>(null);
  const [hasPrompted, setHasPrompted] = useState(false);

  useEffect(() => {
    if (!enabled || !orderId) return;

    const checkOrderStatus = async () => {
      try {
        const order = await customerService.getOrder(orderId);
        
        // Check if order was just delivered (status changed to delivered/completed)
        if (
          (order.status === 'delivered' || order.status === 'completed') &&
          previousStatus !== null &&
          previousStatus !== 'delivered' &&
          previousStatus !== 'completed' &&
          !hasPrompted
        ) {
          // Show success notification
          toast.success('🎉 Your order has been delivered!', {
            description: 'Share your experience to help others',
            duration: 5000,
            action: {
              label: 'Write Review',
              onClick: () => navigate(`/customer/orders/${orderId}/review`)
            }
          });
          
          setHasPrompted(true);
        }
        
        setPreviousStatus(order.status);
      } catch (error) {
        console.error('Error checking order status:', error);
      }
    };

    // Check immediately
    checkOrderStatus();

    // Set up polling interval (check every 30 seconds)
    const interval = setInterval(checkOrderStatus, 30000);

    return () => clearInterval(interval);
  }, [orderId, enabled, previousStatus, hasPrompted, navigate]);

  return { hasPrompted };
};

/**
 * Hook to check for unreviewed delivered orders and prompt user
 */
export const useUnreviewedOrders = () => {
  const navigate = useNavigate();
  const [unreviewedOrders, setUnreviewedOrders] = useState<number[]>([]);
  const [checkedOrders, setCheckedOrders] = useState<Set<number>>(new Set());

  useEffect(() => {
    const checkUnreviewedOrders = async () => {
      try {
        const response = await customerService.getOrders({
          status: 'delivered',
          page_size: 10
        });
        
        const orders = Array.isArray(response) ? response : response.results || [];
        
        // Find orders that haven't been checked yet
        const newUnreviewed = orders
          .filter(order => !checkedOrders.has(order.id))
          .map(order => order.id);
        
        if (newUnreviewed.length > 0) {
          setUnreviewedOrders(newUnreviewed);
          
          // Show notification for the first unreviewed order
          const firstOrderId = newUnreviewed[0];
          
          toast.info('You have unreviewed orders', {
            description: 'Help others by sharing your experience',
            duration: 7000,
            action: {
              label: 'Review Now',
              onClick: () => navigate(`/customer/orders/${firstOrderId}/review`)
            }
          });
          
          // Mark as checked
          setCheckedOrders(prev => new Set([...prev, firstOrderId]));
        }
      } catch (error) {
        console.error('Error checking unreviewed orders:', error);
      }
    };

    // Check on mount and every 5 minutes
    checkUnreviewedOrders();
    const interval = setInterval(checkUnreviewedOrders, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [checkedOrders, navigate]);

  return { unreviewedOrders };
};

/**
 * Hook to automatically redirect to review page after delivery
 */
export const useAutoRedirectToReview = (
  orderId?: number | null,
  enabled: boolean = true,
  delayMs: number = 3000
) => {
  const navigate = useNavigate();
  const [previousStatus, setPreviousStatus] = useState<string | null>(null);
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (!enabled || !orderId || hasRedirected) return;

    const checkAndRedirect = async () => {
      try {
        const order = await customerService.getOrder(orderId);
        
        // Check if order was just delivered
        if (
          (order.status === 'delivered' || order.status === 'completed') &&
          previousStatus !== null &&
          previousStatus !== 'delivered' &&
          previousStatus !== 'completed'
        ) {
          // Show success message
          toast.success('🎉 Order delivered successfully!', {
            description: 'Redirecting to review page...',
            duration: delayMs
          });
          
          // Auto-redirect after delay
          setTimeout(() => {
            setHasRedirected(true);
            navigate(`/customer/orders/${orderId}/review`);
          }, delayMs);
        }
        
        setPreviousStatus(order.status);
      } catch (error) {
        console.error('Error checking order for redirect:', error);
      }
    };

    // Check immediately
    checkAndRedirect();

    // Poll every 20 seconds
    const interval = setInterval(checkAndRedirect, 20000);

    return () => clearInterval(interval);
  }, [orderId, enabled, previousStatus, hasRedirected, delayMs, navigate]);

  return { hasRedirected };
};

