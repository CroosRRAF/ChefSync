import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Phone,
  MessageCircle,
  Package,
  Clock,
  MapPin,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChefHat,
  Bike,
  Navigation2,
  Sparkles,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OrderTrackingData } from '@/services/orderTrackingService';
import AnimatedTimeline from './AnimatedTimeline';
import LiveKitchenMap from './LiveKitchenMap';
import { orderService } from '@/services/orderService';
import { useToast } from '@/hooks/use-toast';
import { useUserLocation } from '@/hooks/useUserLocation';
import { aiKitchenService } from '@/services/aiKitchenService';
import DeliveryChatBox from './DeliveryChatBox';

interface OrderTrackingPanelProps {
  trackingData: OrderTrackingData;
  onClose: () => void;
  onRefresh?: () => void;
  loading?: boolean;
  onMinimize?: () => void;
}

export const OrderTrackingPanel: React.FC<OrderTrackingPanelProps> = ({
  trackingData,
  onClose,
  onRefresh,
  loading = false,
  onMinimize,
}) => {
  const [cancelling, setCancelling] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [aiKitchenStatus, setAiKitchenStatus] = useState<string>('');
  const [aiPickupInstructions, setAiPickupInstructions] = useState<string>('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const { toast } = useToast();
  const userLocation = useUserLocation();

  // Check if this is a pickup order based on order_type
  const isPickupOrder = trackingData.order_type === 'pickup';

  // Fallback kitchen location if not provided (Colombo center)
  const effectiveChefLocation = trackingData.chef_location || {
    latitude: 6.9271,
    longitude: 79.8612,
    address: trackingData.chef?.name ? `${trackingData.chef.name}'s Kitchen` : 'Kitchen Location',
  };

  // Load AI-generated kitchen status
  useEffect(() => {
    const loadAIStatus = async () => {
      if (trackingData.items && trackingData.items.length > 0) {
        const foodNames = trackingData.items.map(item => item.food_name);
        const status = await aiKitchenService.getPreparationStatus(
          foodNames,
          trackingData.status,
          trackingData.estimated_time_remaining_minutes
        );
        setAiKitchenStatus(status);
      }
    };

    loadAIStatus();
  }, [trackingData.status, trackingData.items]);

  // Load AI pickup instructions for pickup orders
  useEffect(() => {
    const loadPickupInstructions = async () => {
      if (isPickupOrder && trackingData.chef && trackingData.chef_location) {
        const instructions = await aiKitchenService.getPickupInstructions(
          trackingData.chef.name,
          trackingData.chef_location.address || 'Kitchen Location'
        );
        setAiPickupInstructions(instructions);
      }
    };

    if (isPickupOrder) {
      loadPickupInstructions();
    }
  }, [isPickupOrder, trackingData.chef, trackingData.chef_location]);

  const handleCancelOrder = async () => {
    if (!trackingData.can_cancel) {
      toast({
        title: 'Cannot cancel order',
        description: 'This order can no longer be cancelled',
        variant: 'destructive',
      });
      return;
    }

    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    setCancelling(true);
    try {
      await orderService.cancelOrder(
        trackingData.order_number as any,
        'Customer requested cancellation'
      );
      
      toast({
        title: 'Order Cancelled',
        description: 'Your order has been cancelled successfully',
        variant: 'default',
      });
      
      if (onRefresh) onRefresh();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Cancellation Failed',
        description: error.message || 'Failed to cancel order',
        variant: 'destructive',
      });
    } finally {
      setCancelling(false);
    }
  };

  const handleNavigateToKitchen = () => {
    if (effectiveChefLocation && userLocation.latitude && userLocation.longitude) {
      // Open Google Maps navigation
      const url = `https://www.google.com/maps/dir/${userLocation.latitude},${userLocation.longitude}/${effectiveChefLocation.latitude},${effectiveChefLocation.longitude}`;
      window.open(url, '_blank');
    } else {
      toast({
        title: 'Location Required',
        description: 'Please enable location services to get directions',
        variant: 'destructive',
      });
    }
  };

  const formatPrice = (price: number) => `LKR ${price.toFixed(2)}`;
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ 
            y: 0,
            maxHeight: isMinimized ? '60px' : '80vh'
          }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 overflow-hidden rounded-t-3xl bg-white dark:bg-gray-900 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Compact Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                <div>
                  <p className="text-sm font-bold">#{trackingData.order_number}</p>
                  <p className="text-xs opacity-90">{trackingData.total_items} items • {formatPrice(trackingData.total_amount)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {onRefresh && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onRefresh}
                    disabled={loading}
                    className="h-8 w-8 text-white hover:bg-white/20"
                    aria-label="Refresh"
                  >
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-8 w-8 text-white hover:bg-white/20"
                  aria-label={isMinimized ? "Maximize" : "Minimize"}
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 text-white hover:bg-white/20"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Pull indicator - only show when not minimized */}
            {!isMinimized && (
              <div className="flex justify-center pb-2">
                <div className="w-10 h-1 bg-white/40 rounded-full" />
              </div>
            )}
          </div>

          {/* Scrollable Content - Only show when not minimized */}
          {!isMinimized && (
          <div className="overflow-y-auto max-h-[calc(80vh-60px)]">
            {/* Compact Map Section */}
            <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 relative">
              <LiveKitchenMap
                chefLocation={effectiveChefLocation}
                deliveryLocation={isPickupOrder ? null : trackingData.delivery_location}
                agentLocation={trackingData.agent_location}
                orderStatus={trackingData.status}
                distance={trackingData.distance_km}
              />
              
              {/* Kitchen Location Notice (if using fallback) */}
              {!trackingData.chef_location && (
                <div className="absolute bottom-2 left-2 bg-yellow-500/90 text-white text-xs px-2 py-1 rounded-md shadow-lg">
                  📍 Approximate location
                </div>
              )}
              
              {/* ETA Badge */}
              {trackingData.estimated_time_remaining_minutes !== null && 
               !['delivered', 'cancelled'].includes(trackingData.status) && (
                <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-full px-3 py-1.5 shadow-lg flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-bold">{trackingData.estimated_time_remaining_minutes} min</span>
                </div>
              )}

              {/* Pickup Navigation Button */}
              {isPickupOrder && userLocation.latitude && effectiveChefLocation && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  onClick={handleNavigateToKitchen}
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2 font-medium text-sm"
                >
                  <Navigation2 className="h-4 w-4" />
                  Navigate to Kitchen
                </motion.button>
              )}
            </div>

            {/* Content Section */}
            <div className="px-4 py-3 space-y-3">
              {/* AI Kitchen Status Card */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                    <ChefHat className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Kitchen Status</p>
                      {aiKitchenStatus && <Sparkles className="h-3 w-3 text-orange-500" />}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {aiKitchenStatus || 'Preparing your order...'}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      "text-xs font-bold",
                      trackingData.status === 'preparing' && "bg-orange-500 text-white animate-pulse"
                    )}
                  >
                    {trackingData.status_display}
                  </Badge>
                </div>
              </motion.div>

              {/* Pickup Instructions (for pickup orders) */}
              {isPickupOrder && aiPickupInstructions && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {aiPickupInstructions}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Horizontal Timeline */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <AnimatedTimeline
                  timeline={trackingData.timeline}
                  orientation="horizontal"
                  showTimestamps={false}
                />
              </div>

              {/* Chef Contact (Compact) */}
              {trackingData.chef && (
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                      <ChefHat className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Chef</p>
                      <p className="text-sm font-semibold">{trackingData.chef.name}</p>
                    </div>
                  </div>
                  {trackingData.chef.phone && (
                    <Button size="sm" variant="outline" className="h-8">
                      <Phone className="h-3 w-3 mr-1" />
                      Call
                    </Button>
                  )}
                </div>
              )}

              {/* Delivery Partner Section (only for delivery orders) */}
              {!isPickupOrder && (
                <div className="space-y-2">
                  {trackingData.delivery_partner ? (
                    <>
                      {/* Delivery Partner Assigned */}
                      <div className="flex items-center justify-between bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl p-3 shadow-md">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                            <Bike className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs opacity-90">Delivery Partner</p>
                            <p className="text-sm font-semibold">{trackingData.delivery_partner.name}</p>
                            {trackingData.delivery_partner.phone && (
                              <p className="text-xs opacity-75">{trackingData.delivery_partner.phone}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {trackingData.delivery_partner.phone && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 text-white hover:bg-white/20"
                              onClick={() => window.location.href = `tel:${trackingData.delivery_partner?.phone}`}
                            >
                              <Phone className="h-3 w-3 mr-1" />
                              Call
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 text-white hover:bg-white/20"
                            onClick={() => setShowChat(!showChat)}
                          >
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Chat
                          </Button>
                        </div>
                      </div>
                      
                      {/* Chat Box */}
                      {showChat && trackingData.id && (
                        <DeliveryChatBox
                          orderId={trackingData.id}
                          deliveryPartnerName={trackingData.delivery_partner.name}
                          deliveryPartnerPhone={trackingData.delivery_partner.phone}
                          isOpen={showChat}
                          onClose={() => setShowChat(false)}
                        />
                      )}
                    </>
                  ) : (
                    /* Waiting for Delivery Partner */
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 flex items-center gap-3"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="flex-shrink-0"
                      >
                        <Bike className="h-5 w-5 text-gray-400" />
                      </motion.div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          Finding Delivery Partner
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          A delivery agent will be assigned shortly...
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Address */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isPickupOrder ? 'Pickup Location' : 'Delivery Address'}
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {isPickupOrder 
                        ? effectiveChefLocation.address
                        : trackingData.delivery_location?.address || 'Delivery Address'}
                    </p>
                    {isPickupOrder && !trackingData.chef_location && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                        ⚠️ Approximate location - contact chef for exact address
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items - Collapsible */}
              <div>
                <button
                  onClick={() => setShowOrderDetails(!showOrderDetails)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="text-sm font-semibold">Order Items ({trackingData.total_items})</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-gray-500 transition-transform",
                      showOrderDetails && "rotate-180"
                    )}
                  />
                </button>

                <AnimatePresence>
                  {showOrderDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2 mt-2">
                        {trackingData.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-xs font-bold text-orange-600">
                                {item.quantity}
                              </span>
                              <span className="font-medium">{item.food_name}</span>
                            </div>
                            <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}

                        {/* Total */}
                        <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700 text-sm font-bold">
                          <span>Total</span>
                          <span className="text-orange-600">{formatPrice(trackingData.total_amount)}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Cancellation */}
              {trackingData.can_cancel && trackingData.cancellation_time_remaining_seconds > 0 && (
                <Alert className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 py-2">
                  <AlertDescription className="flex items-center justify-between text-sm">
                    <span className="text-orange-800 dark:text-orange-200">
                      Cancel within {formatTime(trackingData.cancellation_time_remaining_seconds)}
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleCancelOrder}
                      disabled={cancelling}
                      className="h-7 text-xs"
                    >
                      {cancelling ? 'Cancelling...' : 'Cancel'}
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OrderTrackingPanel;
