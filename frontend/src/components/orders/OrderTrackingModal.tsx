import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Clock, 
  ChefHat, 
  Package, 
  Truck, 
  MapPin, 
  Phone, 
  Star,
  RotateCcw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface OrderItem {
  id: number;
  food_name: string;
  quantity: number;
  unit_price: number;
  size: string;
  special_instructions?: string;
}

interface Order {
  id: number;
  order_number: string;
  status: 'PLACED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
  total_amount: number;
  delivery_fee: number;
  estimated_delivery_time: string;
  created_at: string;
  chef: {
    id: number;
    name: string;
    phone?: string;
    profile_image?: string;
    rating?: number;
  };
  delivery_address: {
    label: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    pincode: string;
  };
  items: OrderItem[];
  delivery_notes?: string;
}

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
}

const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  orderId
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const orderStages = [
    {
      key: 'PLACED',
      title: 'Order Placed',
      description: 'Your order has been received',
      icon: <Check className="h-4 w-4" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      key: 'CONFIRMED',
      title: 'Order Confirmed',
      description: 'Chef has accepted your order',
      icon: <Check className="h-4 w-4" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      key: 'PREPARING',
      title: 'Preparing',
      description: 'Your food is being prepared',
      icon: <ChefHat className="h-4 w-4" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      key: 'READY',
      title: 'Ready for Pickup',
      description: 'Food is ready, waiting for delivery',
      icon: <Package className="h-4 w-4" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      key: 'OUT_FOR_DELIVERY',
      title: 'Out for Delivery',
      description: 'Your order is on the way',
      icon: <Truck className="h-4 w-4" />,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    },
    {
      key: 'DELIVERED',
      title: 'Delivered',
      description: 'Order has been delivered',
      icon: <Check className="h-4 w-4" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    }
  ];

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    if (!orderId) return;

    setLoading(true);
    try {
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      const mockOrder: Order = {
        id: orderId,
        order_number: `ORD-${Date.now().toString().slice(-6)}`,
        status: 'PREPARING', // Current status
        total_amount: 2150,
        delivery_fee: 200,
        estimated_delivery_time: '25-35 min',
        created_at: new Date().toISOString(),
        chef: {
          id: 1,
          name: 'Chef Priya',
          phone: '+94 77 123 4567',
          rating: 4.8
        },
        delivery_address: {
          label: 'Home',
          address_line1: '123 Main Street, Apartment 4B',
          city: 'Colombo',
          pincode: '00100'
        },
        items: [
          {
            id: 1,
            food_name: 'Spicy Chicken Kottu',
            quantity: 1,
            unit_price: 850,
            size: 'Regular'
          },
          {
            id: 2,
            food_name: 'Margherita Pizza',
            quantity: 1,
            unit_price: 1200,
            size: 'Medium',
            special_instructions: 'Extra cheese please'
          }
        ],
        delivery_notes: 'Please call when you arrive'
      };

      setOrder(mockOrder);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const refreshOrder = async () => {
    setRefreshing(true);
    try {
      await fetchOrderDetails();
      toast.success('Order status updated');
    } catch (error) {
      toast.error('Failed to refresh order status');
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusIndex = (status: Order['status']) => {
    return orderStages.findIndex(stage => stage.key === status);
  };

  const getProgress = () => {
    if (!order) return 0;
    const currentIndex = getStatusIndex(order.status);
    return ((currentIndex + 1) / orderStages.length) * 100;
  };

  const formatPrice = (price: number) => {
    return `Rs. ${price.toFixed(2)}`;
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              Track Order
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshOrder}
              disabled={refreshing}
              className="h-8"
            >
              <RotateCcw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" />
          </div>
        ) : !order ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">Order not found</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Order Header */}
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Order #{order.order_number}</h3>
                <Badge 
                  className={`${
                    order.status === 'DELIVERED' ? 'bg-green-500' :
                    order.status === 'OUT_FOR_DELIVERY' ? 'bg-indigo-500' :
                    order.status === 'PREPARING' ? 'bg-orange-500' :
                    'bg-blue-500'
                  }`}
                >
                  {orderStages.find(stage => stage.key === order.status)?.title}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Placed on {formatTime(order.created_at)}
              </p>
              
              {/* Progress Bar */}
              <div className="mb-2">
                <Progress value={getProgress()} className="h-2" />
              </div>
              <p className="text-xs text-gray-500 text-center">
                {Math.round(getProgress())}% Complete
              </p>
            </div>

            {/* Order Stages */}
            <div className="px-6 pb-4">
              <div className="space-y-4">
                {orderStages.map((stage, index) => {
                  const currentIndex = getStatusIndex(order.status);
                  const isCompleted = index <= currentIndex;
                  const isCurrent = index === currentIndex;
                  const isPending = index > currentIndex;

                  return (
                    <div key={stage.key} className="flex items-start gap-3">
                      <div className={`
                        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2
                        ${isCompleted ? 
                          `${stage.bgColor} ${stage.color} border-current` : 
                          isPending ? 
                            'bg-gray-100 text-gray-400 border-gray-300' :
                            'bg-gray-100 text-gray-400 border-gray-300'
                        }
                        ${isCurrent ? 'ring-2 ring-offset-2 ring-current ring-opacity-20' : ''}
                      `}>
                        {isCompleted ? stage.icon : <Clock className="h-4 w-4" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${
                          isCompleted ? 'text-gray-900' : 
                          isPending ? 'text-gray-400' : 'text-gray-900'
                        }`}>
                          {stage.title}
                        </p>
                        <p className={`text-sm ${
                          isCompleted ? 'text-gray-600' : 
                          isPending ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {stage.description}
                        </p>
                        {isCurrent && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            In Progress
                          </Badge>
                        )}
                      </div>
                      
                      {isCurrent && (
                        <div className="text-xs text-gray-500">
                          ETA: {order.estimated_delivery_time}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chef Information */}
            <Card className="mx-6 mb-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <ChefHat className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{order.chef.name}</p>
                    {order.chef.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-gray-600">{order.chef.rating}</span>
                      </div>
                    )}
                  </div>
                  {order.chef.phone && (
                    <Button variant="outline" size="sm">
                      <Phone className="h-3 w-3 mr-1" />
                      Call
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card className="mx-6 mb-4">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-gray-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{order.delivery_address.label}</p>
                    <p className="text-sm text-gray-600">
                      {order.delivery_address.address_line1}
                    </p>
                    {order.delivery_address.address_line2 && (
                      <p className="text-sm text-gray-600">
                        {order.delivery_address.address_line2}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      {order.delivery_address.city}, {order.delivery_address.pincode}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card className="mx-6 mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Order Items</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{item.food_name}</p>
                        <p className="text-sm text-gray-600">
                          Size: {item.size} • Qty: {item.quantity}
                        </p>
                        {item.special_instructions && (
                          <p className="text-xs text-gray-500 mt-1">
                            Note: {item.special_instructions}
                          </p>
                        )}
                      </div>
                      <p className="font-medium text-gray-900">
                        {formatPrice(item.unit_price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card className="mx-6 mb-6">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.total_amount - order.delivery_fee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Delivery Fee</span>
                  <span>{formatPrice(order.delivery_fee)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(order.total_amount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrderTrackingModal;