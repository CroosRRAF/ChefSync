import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChefHat, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  X, 
  ChevronUp,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrderTrackingData, orderTrackingService } from '@/services/orderTrackingService';

interface OrderStatusBarProps {
  orderId: number;
  trackingData: OrderTrackingData;
  onExpand: () => void;
  onDismiss?: () => void;
  position?: 'top' | 'bottom';
}

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-5 w-5" />,
  confirmed: <CheckCircle2 className="h-5 w-5" />,
  preparing: <ChefHat className="h-5 w-5" />,
  ready: <Package className="h-5 w-5" />,
  out_for_delivery: <Truck className="h-5 w-5" />,
  delivered: <CheckCircle2 className="h-5 w-5" />,
};

export const OrderStatusBar: React.FC<OrderStatusBarProps> = ({
  orderId,
  trackingData,
  onExpand,
  onDismiss,
  position = 'bottom',
}) => {
  const [visible, setVisible] = useState(true);
  const [isPulsing, setIsPulsing] = useState(false);

  // Pulse animation for active orders
  useEffect(() => {
    const activeStatuses = ['preparing', 'out_for_delivery'];
    setIsPulsing(activeStatuses.includes(trackingData.status));
  }, [trackingData.status]);

  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) {
      setTimeout(() => onDismiss(), 300);
    }
  };

  const getStatusMessage = () => {
    const messages: Record<string, string> = {
      pending: 'Waiting for chef confirmation',
      confirmed: 'Order confirmed!',
      preparing: 'Your food is being prepared',
      ready: 'Your order is ready!',
      out_for_delivery: 'Out for delivery',
      delivered: 'Order delivered!',
      cancelled: 'Order cancelled',
    };

    return messages[trackingData.status] || 'Processing order';
  };

  const getETA = () => {
    if (trackingData.estimated_time_remaining_minutes) {
      return `${trackingData.estimated_time_remaining_minutes} min`;
    }
    return null;
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: position === 'bottom' ? 100 : -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: position === 'bottom' ? 100 : -100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={cn(
          'fixed left-0 right-0 z-50 mx-auto max-w-5xl px-4',
          position === 'bottom' ? 'bottom-4' : 'top-4'
        )}
      >
        <div
          className={cn(
            'relative overflow-hidden rounded-lg shadow-2xl backdrop-blur-md',
            'bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-700',
            isPulsing && 'ring-2 ring-orange-500/50 animate-pulse'
          )}
        >
          {/* Status progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
            <motion.div
              className={cn(
                'h-full',
                orderTrackingService.getStatusColor(trackingData.status)
              )}
              initial={{ width: '0%' }}
              animate={{
                width: trackingData.status === 'delivered' 
                  ? '100%' 
                  : trackingData.status === 'out_for_delivery' 
                  ? '75%' 
                  : trackingData.status === 'preparing' 
                  ? '50%' 
                  : '25%',
              }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <div className="flex items-center gap-4 p-4">
            {/* Status Icon */}
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full',
                'bg-gradient-to-br from-orange-500 to-orange-600',
                'text-white shadow-lg',
                isPulsing && 'animate-pulse'
              )}
            >
              {statusIcons[trackingData.status] || <Package className="h-5 w-5" />}
            </div>

            {/* Order Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Order #{trackingData.order_number}
                </h3>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium text-white',
                    orderTrackingService.getStatusColor(trackingData.status)
                  )}
                >
                  {trackingData.status_display}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                {getStatusMessage()}
                {getETA() && (
                  <span className="ml-2 inline-flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {getETA()}
                  </span>
                )}
              </p>
            </div>

            {/* Delivery Location (if out for delivery) */}
            {trackingData.status === 'out_for_delivery' && trackingData.agent_location && (
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <MapPin className="h-4 w-4" />
                <span>Tracking live</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onExpand}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg',
                  'bg-orange-500 hover:bg-orange-600 text-white',
                  'transition-colors duration-200',
                  'text-sm font-medium shadow-sm'
                )}
              >
                <span>Track Order</span>
                <ChevronUp className="h-4 w-4" />
              </button>

              {onDismiss && (
                <button
                  onClick={handleDismiss}
                  className={cn(
                    'p-2 rounded-lg',
                    'hover:bg-gray-100 dark:hover:bg-gray-800',
                    'text-gray-500 dark:text-gray-400',
                    'transition-colors duration-200'
                  )}
                  aria-label="Dismiss"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Pulsing indicator for active orders */}
          {isPulsing && (
            <div className="absolute inset-0 pointer-events-none">
              <motion.div
                className="absolute inset-0 border-2 border-orange-500 rounded-lg"
                animate={{
                  opacity: [0, 0.5, 0],
                  scale: [1, 1.02, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OrderStatusBar;

