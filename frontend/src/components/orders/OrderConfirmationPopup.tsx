import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Clock, 
  ChefHat, 
  Package, 
  MapPin,
  Eye,
  Download,
  Mail,
  AlertCircle,
  XCircle,
  Truck,
  Navigation,
  X
} from 'lucide-react';
import { orderService } from '@/services/orderService';
import { openOrderTracking } from '@/components/tracking/OrderTrackingWrapper';
import { toast } from 'sonner';

interface OrderConfirmationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  orderNumber: string;
  orderType: 'regular' | 'bulk';
}

interface OrderDetails {
  id: number;
  order_number: string;
  status: string;
  payment_status?: string;
  total_amount: number;
  created_at: string;
  order_type?: string;
  chef?: {
    name: string;
    phone_no?: string;
  };
  delivery_partner?: {
    id: number;
    name: string;
    phone_no?: string;
  };
  delivery_address?: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  estimated_delivery_time?: string;
  items?: Array<{
    food_name: string;
    quantity: number;
  }>;
  can_be_cancelled?: boolean;
  cancellation_time_remaining?: number;
  status_timestamps?: Record<string, string>;
  location_updates?: Array<{
    latitude: number;
    longitude: number;
    timestamp: string;
  }>;
}

const OrderConfirmationPopup: React.FC<OrderConfirmationPopupProps> = ({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  orderType = 'regular'
}) => {
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [autoRefreshCount, setAutoRefreshCount] = useState(0);
  const [trackingInfo, setTrackingInfo] = useState<any>(null);
  const [previousStatus, setPreviousStatus] = useState<string | null>(null);

  // Fetch order details and tracking info
  const fetchOrderDetails = async () => {
    try {
      const orderDetails = await orderService.getOrder(orderId);
      
      // Check if order status changed to delivered
      if (orderDetails.status === 'delivered' && previousStatus !== 'delivered' && previousStatus !== null) {
        // Order just got delivered, show success message and redirect to review
        toast.success('🎉 Your order has been delivered successfully!', {
          duration: 3000,
        });
        
        // Auto-redirect to review page after 2 seconds
        setTimeout(() => {
          onClose();
          navigate(`/customer/orders/${orderId}/review`);
        }, 2000);
      }
      
      setPreviousStatus(orderDetails.status);
      setOrder(orderDetails as any);
      
      // Fetch tracking information (location updates, delivery log, etc.)
      try {
        const trackingResponse = await fetch(`/api/orders/orders/${orderId}/tracking_info/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        
        if (trackingResponse.ok) {
          const trackingData = await trackingResponse.json();
          setTrackingInfo(trackingData);
        }
      } catch (error) {
        console.log('Tracking info not available:', error);
      }
      
      // Check if order can be cancelled
      try {
        const cancelStatus = await orderService.canCancelOrder(orderId);
        if (cancelStatus.can_cancel) {
          setTimeRemaining(cancelStatus.time_remaining_seconds || 600);
        }
      } catch (error) {
        console.log('Cancel check not available:', error);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    }
  }, [isOpen, orderId]);

  // Auto-refresh order status every 10 seconds (up to 30 times = 5 minutes)
  useEffect(() => {
    if (!isOpen || !orderId || autoRefreshCount >= 30) return;

    const interval = setInterval(() => {
      fetchOrderDetails();
      setAutoRefreshCount(prev => prev + 1);
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [isOpen, orderId, autoRefreshCount]);

  // Countdown timer for cancellation window
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'preparing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'delivered':
      case 'completed':
        return <CheckCircle className="h-5 w-5" />;
      case 'pending':
        return <Clock className="h-5 w-5" />;
      case 'preparing':
        return <ChefHat className="h-5 w-5" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleViewOrder = () => {
    onClose();
    if (orderType === 'bulk') {
      navigate('/customer/orders', { state: { tab: 'bulk' } });
    } else {
      navigate('/customer/orders');
    }
  };

  const handleTrackOrder = () => {
    onClose();
    // Use the existing order tracking system
    openOrderTracking(orderId);
  };

  const handleDownloadInvoice = async () => {
    try {
      toast.info('Generating invoice...');
      const response = await fetch(`/api/orders/orders/${orderId}/generate_invoice/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${orderNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Invoice downloaded successfully');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate invoice');
      }
    } catch (error: any) {
      console.error('Error downloading invoice:', error);
      if (error.message?.includes('not available for orders with status') || 
          error.message?.includes('not available for unpaid orders')) {
        toast.error(error.message);
      } else {
        toast.error('Failed to download invoice. Please try again later.');
      }
    }
  };

  const handleEmailInvoice = async () => {
    try {
      toast.info('Sending invoice to your email...');
      const response = await fetch(`/api/orders/orders/${orderId}/email_invoice/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        toast.success('Invoice sent to your email!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invoice');
      }
    } catch (error: any) {
      console.error('Error emailing invoice:', error);
      if (error.message?.includes('not available for orders with status') || 
          error.message?.includes('not available for unpaid orders')) {
        toast.error(error.message);
      } else {
        toast.error('Failed to send invoice. Please try again later.');
      }
    }
  };

  const handleCancelOrder = async () => {
    if (!order || !timeRemaining || timeRemaining <= 0) {
      toast.error('Order cannot be cancelled at this time');
      return;
    }

    if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }

    try {
      toast.info('Cancelling your order...');
      const response = await fetch(`/api/orders/orders/${orderId}/cancel_order/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: 'Customer requested cancellation'
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Order cancelled successfully! You will receive a refund shortly.');
        
        // Refresh order details to show updated status
        await fetchOrderDetails();
        
        // Close the modal after a brief delay
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel order');
      }
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      toast.error(error.message || 'Failed to cancel order. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CheckCircle className="h-6 w-6 text-green-500" />
            Order Placed Successfully!
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" />
          </div>
        ) : order ? (
          <div className="space-y-4">
            {/* Order Info */}
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Order Number</span>
                <span className="font-bold text-lg">{order.order_number}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Amount</span>
                <span className="font-bold text-lg text-green-600">LKR {Math.round(order.total_amount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                <Badge className={getStatusColor(order.status)}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(order.status)}
                    {order.status}
                  </span>
                </Badge>
              </div>
            </div>

            {/* Cancellation Timer */}
            {timeRemaining !== null && timeRemaining > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                    Cancellation Window
                  </span>
                </div>
                <Progress value={(timeRemaining / 600) * 100} className="h-2 mb-2" />
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  You can cancel within {formatTime(timeRemaining)}. After that, the chef will be preparing your order.
                </p>
              </div>
            )}

            {/* Auto-cancel warning */}
            {order.status === 'pending' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    Waiting for Chef Confirmation
                  </span>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  If the chef doesn't confirm within 10 minutes, your order will be automatically cancelled and you'll be notified.
                </p>
              </div>
            )}

            {/* Order Tracking Status */}
            {order.status_timestamps && Object.keys(order.status_timestamps).length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">Order Timeline</span>
                </div>
                <div className="space-y-2">
                  {Object.entries(order.status_timestamps).map(([status, timestamp]) => (
                    <div key={status} className="flex items-center justify-between text-xs">
                      <span className="capitalize">{status.replace('_', ' ')}</span>
                      <span className="text-gray-500">
                        {new Date(timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order Details */}
            {order.chef && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <ChefHat className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="font-medium">{order.chef.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Your Chef</p>
                </div>
              </div>
            )}

            {order.delivery_address && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Delivery Address</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{order.delivery_address}</p>
                  {order.estimated_delivery_time && (
                    <p className="text-xs text-gray-500 mt-1">
                      ETA: {new Date(order.estimated_delivery_time).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Delivery Partner Info (if assigned and order is being delivered) */}
            {order.delivery_partner && ['out_for_delivery', 'ready'].includes(order.status) && (
              <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <Truck className="h-8 w-8 text-indigo-500" />
                <div>
                  <p className="font-medium">{order.delivery_partner.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Delivery Partner</p>
                  {order.delivery_partner.phone_no && (
                    <p className="text-xs text-gray-500">{order.delivery_partner.phone_no}</p>
                  )}
                </div>
              </div>
            )}

            {/* Real-time tracking info */}
            {trackingInfo && trackingInfo.latest_location && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <Navigation className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-300">
                    Live Tracking Available
                  </span>
                </div>
                <p className="text-xs text-green-700 dark:text-green-400">
                  Last updated: {new Date(trackingInfo.latest_location.timestamp).toLocaleTimeString()}
                </p>
                <Button
                  onClick={handleTrackOrder}
                  size="sm"
                  className="mt-2 w-full bg-green-600 hover:bg-green-700"
                >
                  <Navigation className="h-3 w-3 mr-2" />
                  Track Live Location
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              {/* Cancel Order button - SHOW FIRST AND PROMINENTLY for pending/confirmed orders within cancellation window */}
              {order && ['pending', 'confirmed'].includes(order.status) && timeRemaining !== null && timeRemaining > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800 dark:text-red-300">
                      You can cancel this order
                    </span>
                  </div>
                  <Button
                    onClick={handleCancelOrder}
                    variant="destructive"
                    className="w-full font-semibold"
                    size="lg"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel Order Now
                  </Button>
                  <p className="text-xs text-center text-red-600 dark:text-red-400 mt-2">
                    Time remaining: {formatTime(timeRemaining)}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleViewOrder}
                  variant="outline"
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Order
                </Button>
                {['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(order.status) && (
                  <Button
                    onClick={handleTrackOrder}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Track Order
                  </Button>
                )}
              </div>
              
              {/* Invoice buttons - only show for confirmed, paid orders */}
              {order && !['cart', 'pending'].includes(order.status) && order.payment_status === 'paid' && (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleDownloadInvoice}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Download className="h-3 w-3 mr-2" />
                    Download Invoice
                  </Button>
                  <Button
                    onClick={handleEmailInvoice}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Mail className="h-3 w-3 mr-2" />
                    Email Invoice
                  </Button>
                </div>
              )}
            </div>

            {/* Status Update Info */}
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              ✨ Status updates automatically every 10 seconds
            </p>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            Order not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrderConfirmationPopup;

