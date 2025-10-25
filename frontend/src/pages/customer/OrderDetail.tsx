import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { customerService, Order } from '@/services/customerService';
import { openOrderTracking } from '@/components/tracking/OrderTrackingWrapper';
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  ChefHat,
  Phone,
  Package,
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
  XCircle,
  Star,
  Navigation,
  RotateCcw,
  FileText,
  Truck
} from 'lucide-react';
import { toast } from 'sonner';

const OrderDetail: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { user, isAuthenticated } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'customer') {
      navigate('/auth/login');
      return;
    }

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId, isAuthenticated, user, navigate]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const data = await customerService.getOrder(parseInt(orderId!));
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to load order details');
      navigate('/customer/orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300';
      case 'cancelled':
      case 'refunded':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300';
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300';
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300';
      case 'ready':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300';
      case 'pending':
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
      case 'refunded':
        return <XCircle className="h-4 w-4" />;
      case 'preparing':
        return <ChefHat className="h-4 w-4" />;
      case 'out_for_delivery':
        return <Truck className="h-4 w-4" />;
      case 'pending':
      case 'confirmed':
        return <Clock className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const handleDownloadInvoice = async () => {
    if (!orderId) return;
    
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
        a.download = `invoice-${order?.order_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Invoice downloaded!');
      } else {
        throw new Error('Failed to generate invoice');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Invoice generation is not available at the moment');
    }
  };

  const handleReorder = async () => {
    if (!order) return;
    
    try {
      toast.info('Adding items to cart...');
      
      for (const item of order.items || []) {
        await fetch('/api/orders/cart/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            price_id: (item as any).price_id,
            quantity: item.quantity,
            special_instructions: item.special_instructions || ''
          })
        });
      }
      
      toast.success('Items added to cart!');
      navigate('/customer/cart');
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Failed to reorder. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Order Not Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The order you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate('/customer/orders')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Orders
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/customer/orders')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Order #{order.order_number}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            
            <div className="flex gap-3">
              <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                {getStatusIcon(order.status)}
                <span className="capitalize">{order.status.replace('_', ' ')}</span>
              </Badge>
              <Badge variant="outline" className="capitalize">
                {order.payment_status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-orange-600" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items && order.items.map((item, index) => (
                    <div key={index} className="flex items-start gap-4">
                      {item.food_image && (
                        <img
                          src={item.food_image}
                          alt={item.food_name}
                          className="w-16 h-16 rounded-lg object-cover"
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.food_name)}&background=f97316&color=fff`;
                          }}
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.food_name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.size} • Qty: {item.quantity}
                        </p>
                        {item.cook_name && (
                          <p className="text-xs text-gray-500 mt-1">by {item.cook_name}</p>
                        )}
                        {item.special_instructions && (
                          <p className="text-xs text-gray-500 mt-1 italic">
                            Note: {item.special_instructions}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">LKR {(item.unit_price * item.quantity).toFixed(2)}</p>
                        <p className="text-xs text-gray-500">LKR {item.unit_price.toFixed(2)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-orange-600" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Delivery Address</p>
                    <p className="font-medium">{order.delivery_address}</p>
                  </div>
                  {order.delivery_instructions && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Delivery Instructions</p>
                      <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mt-1">
                        {order.delivery_instructions}
                      </p>
                    </div>
                  )}
                  {order.customer_notes && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Order Notes</p>
                      <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mt-1">
                        {order.customer_notes}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Chef Information */}
            {order.chef && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ChefHat className="h-5 w-5 text-orange-600" />
                    Chef Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    {order.chef.profile_image ? (
                      <img
                        src={order.chef.profile_image}
                        alt={order.chef.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <ChefHat className="h-6 w-6 text-orange-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{order.chef.name}</p>
                      {order.chef.phone_no && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {order.chef.phone_no}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="h-5 w-5 text-orange-600" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>LKR {order.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                {order.delivery_fee !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span>Delivery Fee</span>
                    <span>LKR {order.delivery_fee.toFixed(2)}</span>
                  </div>
                )}
                {order.tax_amount !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>LKR {order.tax_amount.toFixed(2)}</span>
                  </div>
                )}
                {order.discount_amount !== undefined && order.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-LKR {order.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-orange-600">LKR {order.total_amount.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!['delivered', 'completed', 'cancelled', 'refunded'].includes(order.status) && (
                  <Button
                    onClick={() => openOrderTracking(order.id)}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Track Order
                  </Button>
                )}
                
                {['delivered', 'completed'].includes(order.status) && (
                  <>
                    <Button
                      onClick={() => navigate(`/customer/orders/${order.id}/review`)}
                      className="w-full bg-yellow-500 hover:bg-yellow-600"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Write Review
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={handleReorder}
                      className="w-full"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reorder
                    </Button>
                  </>
                )}
                
                {order.payment_status === 'paid' && !['cart', 'pending'].includes(order.status) && (
                  <Button
                    variant="outline"
                    onClick={handleDownloadInvoice}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Invoice
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => navigate('/customer/orders')}
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View All Orders
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;

