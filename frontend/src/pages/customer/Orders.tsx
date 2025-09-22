import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useOrderStore } from '@/store/orderStore';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle,
  Home,
  LayoutDashboard,
  MapPin,
  Calendar,
  DollarSign,
  Truck,
  Plus,
  Check,
  Eye,
  RotateCcw
} from 'lucide-react';

const Orders: React.FC = () => {
  const { user } = useAuth();
  const { orders, getOrdersByCustomer, setOrders } = useOrderStore();
  const navigate = useNavigate();

  // Get customer's orders
  const customerOrders = user ? getOrdersByCustomer(user.id) : [];

  // Add demo orders for testing
  useEffect(() => {
    if (user && orders.length === 0) {
      const demoOrders = [
        {
          id: '1',
          customer_id: user.id,
          customer_name: user.name || 'Customer',
          items: [
            { id: '1', name: 'Chicken Biryani', quantity: 2, price: 15.99 },
            { id: '2', name: 'Garlic Naan', quantity: 3, price: 3.99 }
          ],
          total_amount: 47.95,
          status: 'delivered' as const,
          delivery_address: '123 Main St, City, State 12345',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          estimated_delivery_time: '30-45 mins'
        },
        {
          id: '2',
          customer_id: user.id,
          customer_name: user.name || 'Customer',
          items: [
            { id: '3', name: 'Mutton Curry', quantity: 1, price: 18.99 },
            { id: '4', name: 'Rice', quantity: 2, price: 4.99 }
          ],
          total_amount: 28.97,
          status: 'preparing' as const,
          delivery_address: '123 Main St, City, State 12345',
          created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          estimated_delivery_time: '45-60 mins'
        }
      ];
      setOrders(demoOrders);
    }
  }, [user, orders.length, setOrders]);
  
  const totalOrders = customerOrders.length;
  const pendingOrders = customerOrders.filter(order => 
    ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(order.status)
  ).length;
  const completedOrders = customerOrders.filter(order => order.status === 'delivered').length;
  const totalSpent = customerOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

  const recentOrders = customerOrders
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  // Generate demo orders data for display
  const demoOrders = [
    {
      id: '1',
      orderNumber: 'ORD-001',
      date: '2024-01-15',
      status: 'delivered',
      total: 45.99,
      items: [
        { name: 'Margherita Pizza', quantity: 1, price: 22.99 },
        { name: 'Caesar Salad', quantity: 1, price: 12.99 },
        { name: 'Garlic Bread', quantity: 1, price: 6.99 },
        { name: 'Soft Drink', quantity: 1, price: 3.02 }
      ]
    },
    {
      id: '2',
      orderNumber: 'ORD-002',
      date: '2024-01-20',
      status: 'preparing',
      total: 32.50,
      items: [
        { name: 'Chicken Curry', quantity: 1, price: 18.99 },
        { name: 'Basmati Rice', quantity: 2, price: 6.50 },
        { name: 'Naan Bread', quantity: 1, price: 4.99 },
        { name: 'Mango Lassi', quantity: 1, price: 4.52 }
      ]
    },
    {
      id: '3',
      orderNumber: 'ORD-003',
      date: '2024-01-22',
      status: 'out_for_delivery',
      total: 28.75,
      items: [
        { name: 'Beef Burger', quantity: 1, price: 15.99 },
        { name: 'French Fries', quantity: 1, price: 7.99 },
        { name: 'Milkshake', quantity: 1, price: 4.77 }
      ]
    }
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your orders...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
      case 'out_for_delivery': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800';
      case 'ready': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm dark:bg-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                My Orders
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Track and manage your food orders
              </p>
            </div>
            <Button 
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              onClick={() => navigate('/menu')}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-lg bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Delivered Orders</p>
                <p className="text-3xl font-bold">{demoOrders.filter(o => o.status === 'delivered').length}</p>
              </div>
              <Check className="h-10 w-10 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Active Orders</p>
                <p className="text-3xl font-bold">{demoOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length}</p>
              </div>
              <Clock className="h-10 w-10 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total Spent</p>
                <p className="text-3xl font-bold">${demoOrders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}</p>
              </div>
              <DollarSign className="h-10 w-10 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
            <Package className="h-5 w-5 text-orange-500" />
            <span>Order History</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {demoOrders.length > 0 ? (
            demoOrders.map((order) => (
              <Card key={order.id} className="border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                          Order #{order.orderNumber}
                        </h3>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        {new Date(order.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        ${order.total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Order Items:</h4>
                    <div className="space-y-1">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 dark:text-gray-300">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                      onClick={() => navigate(`/customer/orders/${order.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    
                    {order.status === 'delivered' && (
                      <Button 
                        size="sm"
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Reorder
                      </Button>
                    )}

                    {(order.status === 'preparing' || order.status === 'out_for_delivery') && (
                      <Button 
                        size="sm"
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                      >
                        <MapPin className="h-4 w-4 mr-1" />
                        Track Order
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Orders Yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Start exploring our delicious menu and place your first order!
              </p>
              <Button 
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                onClick={() => navigate('/menu')}
              >
                Browse Menu
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Orders;