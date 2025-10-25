import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft,
  Users,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  ChefHat,
  Phone,
  Package,
  FileText,
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
  XCircle,
  Star
} from 'lucide-react';
import { toast } from 'sonner';

interface BulkOrder {
  bulk_order_id: number;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  delivery_address: string;
  created_at: string;
  updated_at: string;
  event_date?: string;
  event_time?: string;
  num_persons?: number;
  special_instructions?: string;
  delivery_fee?: number;
  chef?: {
    id: number;
    name: string;
    profile_image: string | null;
    phone_no?: string;
  };
  menu?: {
    id: number;
    name: string;
    description?: string;
    price_per_person: number;
  };
  menu_name?: string;
}

const BulkOrderDetail: React.FC = () => {
  const navigate = useNavigate();
  const { bulkOrderId } = useParams<{ bulkOrderId: string }>();
  const { user, isAuthenticated } = useAuth();
  const [order, setOrder] = useState<BulkOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'customer') {
      navigate('/auth/login');
      return;
    }

    if (bulkOrderId) {
      fetchBulkOrderDetails();
    }
  }, [bulkOrderId, isAuthenticated, user, navigate]);

  const fetchBulkOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/customer-bulk-orders/${bulkOrderId}/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bulk order details');
      }

      const data = await response.json();
      setOrder(data);
    } catch (error) {
      console.error('Error fetching bulk order details:', error);
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
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300';
      case 'preparing':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300';
      case 'pending':
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
        return <XCircle className="h-4 w-4" />;
      case 'confirmed':
      case 'preparing':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      toast.info('Generating invoice...');
      const response = await fetch(`/api/orders/customer-bulk-orders/${bulkOrderId}/generate_invoice/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bulk-order-${order?.order_number || bulkOrderId}.pdf`;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
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
                The bulk order you're looking for doesn't exist or has been removed.
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
            onClick={() => navigate('/customer/orders', { state: { tab: 'bulk' } })}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Bulk Order #{order.order_number || `BULK-${order.bulk_order_id}`}
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
                <span className="capitalize">{order.status}</span>
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
            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  Event Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Event Date</p>
                    <p className="font-semibold">
                      {order.event_date 
                        ? new Date(order.event_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Event Time</p>
                    <p className="font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {order.event_time || 'Not specified'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Number of Persons</p>
                  <p className="font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    {order.num_persons || 'Not specified'} persons
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Menu Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-purple-600" />
                  Menu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ChefHat className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{order.menu_name || order.menu?.name || 'Custom Menu'}</h4>
                    {order.menu?.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {order.menu.description}
                      </p>
                    )}
                    {order.menu?.price_per_person && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        <span className="font-medium">Price per person:</span> LKR {order.menu.price_per_person.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
                
                {order.special_instructions && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Special Instructions:</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        {order.special_instructions}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Delivery Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-purple-600" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Delivery Address</p>
                    <p className="font-medium">{order.delivery_address}</p>
                  </div>
                  {order.delivery_fee !== undefined && order.delivery_fee > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Delivery Fee</p>
                      <p className="font-medium">LKR {order.delivery_fee.toFixed(2)}</p>
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
                    <ChefHat className="h-5 w-5 text-purple-600" />
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
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <ChefHat className="h-6 w-6 text-purple-600" />
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
                  <DollarSign className="h-5 w-5 text-purple-600" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Total Amount</span>
                  <span className="font-bold text-purple-600">LKR {order.total_amount.toFixed(2)}</span>
                </div>
                
                <Separator />
                
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>Payment Status: <span className="font-medium capitalize">{order.payment_status}</span></p>
                  {order.updated_at && (
                    <p className="mt-1">
                      Last Updated: {new Date(order.updated_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {['delivered', 'completed'].includes(order.status?.toLowerCase()) && (
                  <Button
                    onClick={() => toast.info('Bulk order reviews coming soon!')}
                    className="w-full bg-yellow-500 hover:bg-yellow-600"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Write Review
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={handleDownloadInvoice}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Invoice
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => navigate('/customer/orders', { state: { tab: 'bulk' } })}
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

export default BulkOrderDetail;

