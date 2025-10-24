import React from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  ChefHat,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrderTimeline } from '@/services/orderTrackingService';

interface AnimatedTimelineProps {
  timeline: OrderTimeline[];
  orientation?: 'vertical' | 'horizontal';
  showTimestamps?: boolean;
}

const statusIcons: Record<string, React.ComponentType<any>> = {
  cart: ShoppingCart,
  pending: Clock,
  confirmed: CheckCircle,
  preparing: ChefHat,
  ready: Package,
  out_for_delivery: Truck,
  delivered: CheckCircle2,
  cancelled: XCircle,
  refunded: DollarSign,
};

const statusAnimations: Record<string, React.ReactNode> = {
  preparing: (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      animate={{
        rotate: [0, 10, -10, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <ChefHat className="h-6 w-6" />
    </motion.div>
  ),
  out_for_delivery: (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      animate={{
        x: [-2, 2, -2],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <Truck className="h-6 w-6" />
    </motion.div>
  ),
};

export const AnimatedTimeline: React.FC<AnimatedTimelineProps> = ({
  timeline,
  orientation = 'vertical',
  showTimestamps = true,
}) => {
  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return null;
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // If less than 1 hour, show minutes ago
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    }
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    }
    
    // Otherwise show date and time
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (orientation === 'horizontal') {
    return (
      <div className="relative">
        <div className="flex items-center justify-between">
          {timeline.filter(item => item.status !== 'cart' && item.status !== 'cancelled').map((item, index, arr) => {
            const Icon = statusIcons[item.status] || Package;
            const isLast = index === arr.length - 1;

            return (
              <React.Fragment key={item.status}>
                <div className="flex flex-col items-center gap-2 relative">
                  {/* Status Circle */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: item.completed ? 1 : item.current ? 1 : 0.8,
                      opacity: item.completed ? 1 : item.current ? 1 : 0.5,
                    }}
                    transition={{ delay: index * 0.1, type: 'spring' }}
                    className={cn(
                      'relative flex h-12 w-12 items-center justify-center rounded-full',
                      'border-2 transition-all duration-300',
                      item.completed
                        ? 'bg-green-500 border-green-600 text-white shadow-lg'
                        : item.current
                        ? 'bg-orange-500 border-orange-600 text-white shadow-lg animate-pulse'
                        : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400'
                    )}
                  >
                    {item.current && !item.completed ? (
                      statusAnimations[item.status] || (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        >
                          <Loader2 className="h-6 w-6" />
                        </motion.div>
                      )
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </motion.div>

                  {/* Status Label */}
                  <div className="text-center">
                    <p
                      className={cn(
                        'text-xs font-medium',
                        item.completed
                          ? 'text-gray-900 dark:text-white'
                          : item.current
                          ? 'text-orange-600 dark:text-orange-400 font-semibold'
                          : 'text-gray-500 dark:text-gray-400'
                      )}
                    >
                      {item.status_display}
                    </p>
                    {showTimestamps && item.timestamp && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatTimestamp(item.timestamp)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Connecting Line */}
                {!isLast && (
                  <div className="flex-1 h-0.5 mx-2 relative overflow-hidden bg-gray-200 dark:bg-gray-700">
                    <motion.div
                      className={cn(
                        'absolute inset-y-0 left-0 right-0',
                        item.completed ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                      )}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: item.completed ? 1 : 0 }}
                      transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                      style={{ transformOrigin: 'left' }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  // Vertical orientation
  return (
    <div className="relative space-y-6">
      {timeline.filter(item => item.status !== 'cart').map((item, index) => {
        const Icon = statusIcons[item.status] || Package;
        const isLast = index === timeline.length - 1;

        return (
          <div key={item.status} className="relative flex gap-4">
            {/* Timeline Line */}
            {!isLast && (
              <div className="absolute left-6 top-12 bottom-0 w-0.5 -translate-x-1/2 overflow-hidden bg-gray-200 dark:bg-gray-700">
                <motion.div
                  className={cn(
                    'absolute inset-x-0 top-0 bottom-0',
                    item.completed ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                  )}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: item.completed ? 1 : 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  style={{ transformOrigin: 'top' }}
                />
              </div>
            )}

            {/* Status Circle */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: item.completed ? 1 : item.current ? 1 : 0.8,
                opacity: item.completed ? 1 : item.current ? 1 : 0.5,
              }}
              transition={{ delay: index * 0.1, type: 'spring' }}
              className={cn(
                'relative flex h-12 w-12 items-center justify-center rounded-full flex-shrink-0',
                'border-2 transition-all duration-300 z-10',
                item.completed
                  ? 'bg-green-500 border-green-600 text-white shadow-lg'
                  : item.current
                  ? 'bg-orange-500 border-orange-600 text-white shadow-lg'
                  : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400'
              )}
            >
              {item.current && !item.completed ? (
                statusAnimations[item.status] || (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 className="h-6 w-6" />
                  </motion.div>
                )
              ) : (
                <Icon className="h-6 w-6" />
              )}

              {/* Pulsing ring for current status */}
              {item.current && !item.completed && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-orange-500"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}
            </motion.div>

            {/* Status Content */}
            <div className="flex-1 pb-6">
              <div className="flex items-center gap-2">
                <h4
                  className={cn(
                    'font-semibold text-lg',
                    item.completed
                      ? 'text-gray-900 dark:text-white'
                      : item.current
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-gray-500 dark:text-gray-400'
                  )}
                >
                  {item.status_display}
                </h4>
                {item.current && !item.completed && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-full">
                    In Progress
                  </span>
                )}
              </div>

              {showTimestamps && item.timestamp && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {formatTimestamp(item.timestamp)}
                </p>
              )}

              {item.current && !item.completed && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-2"
                >
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {item.status === 'pending' && 'Waiting for chef to confirm your order...'}
                    {item.status === 'confirmed' && 'Your order has been confirmed!'}
                    {item.status === 'preparing' && 'Our chef is preparing your delicious meal...'}
                    {item.status === 'ready' && 'Your food is ready for pickup!'}
                    {item.status === 'out_for_delivery' && 'Your order is on the way!'}
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AnimatedTimeline;

