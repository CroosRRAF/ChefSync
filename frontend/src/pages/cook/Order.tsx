/**
 * SAMPLE DATA MODE - ORDER MANAGEMENT SYSTEM
 * 
 * Features:
 * - Sample order data for demonstration
 * - Accept/Reject orders with local state management
 * - Filtering by status, search terms, and dates
 * - Sample dashboard statistics
 * - Customer communication system
 * - Professional UI with shadcn/ui components
 * 
 * Using sample data instead of API calls for development/testing
 */

import React, { useState, useEffect, useMemo } from 'react';
// import axios from 'axios'; // Disabled for sample data mode
import { 
  Search, Filter, RefreshCw, MoreVertical, Eye, Edit, Trash2, 
  Users, Clock, CheckCircle, AlertCircle, Package, TrendingUp,
  Calendar, DollarSign, User, MapPin, Phone, Mail, Bell,
  Check, X, MessageSquare
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
// Temporarily disabled to fix infinite loop
// import { OrderNotifications, useOrderNotifications } from '@/hooks/useOrderNotifications';

/**
 * SAMPLE DATA MODE: This component uses sample data for demonstration.
 * Real API integration has been disabled for development/testing.
 */

// Sample Data
const SAMPLE_ORDERS: Order[] = [
  {
    id: 1,
    order_number: "ORD-2024-001",
    status: "pending",
    status_display: "Pending",
    total_amount: "45.50",
    customer_name: "John Smith",
    chef_name: "Chef Mario",
    total_items: 3,
    created_at: "2024-09-24T10:30:00Z",
    time_since_order: "15 minutes ago",
    delivery_address: "123 Main St, Downtown, NY 10001",
    order_type: "delivery",
    customer: {
      id: 1,
      username: "john_smith",
      email: "john@example.com",
      first_name: "John",
      last_name: "Smith",
      full_name: "John Smith",
      phone: "+1-555-0123"
    },
    items: [
      {
        id: 1,
        quantity: 2,
        special_instructions: "Extra spicy please",
        price_details: {
          id: 1,
          price: "18.99",
          size: "Large",
          food_name: "Margherita Pizza",
          food_description: "Fresh tomato sauce, mozzarella, basil",
          food_category: "Pizza",
          food_image: "/images/margherita-pizza.jpg"
        },
        item_total: "37.98"
      },
      {
        id: 2,
        quantity: 1,
        special_instructions: "",
        price_details: {
          id: 2,
          price: "7.52",
          size: "Regular",
          food_name: "Caesar Salad",
          food_description: "Romaine lettuce, parmesan, croutons",
          food_category: "Salad",
          food_image: "/images/caesar-salad.jpg"
        },
        item_total: "7.52"
      }
    ],
    special_instructions: "Please ring doorbell twice",
    payment_method: "Credit Card",
    payment_status: "Paid",
    estimated_delivery_time: "35-45 minutes",
    time_in_current_status: "15 minutes"
  },
  {
    id: 2,
    order_number: "ORD-2024-002",
    status: "confirmed",
    status_display: "Confirmed",
    total_amount: "32.75",
    customer_name: "Sarah Wilson",
    chef_name: "Chef Mario",
    total_items: 2,
    created_at: "2024-09-24T09:45:00Z",
    time_since_order: "1 hour ago",
    delivery_address: "456 Oak Ave, Midtown, NY 10002",
    order_type: "delivery",
    customer: {
      id: 2,
      username: "sarah_wilson",
      email: "sarah@example.com",
      first_name: "Sarah",
      last_name: "Wilson",
      full_name: "Sarah Wilson",
      phone: "+1-555-0456"
    },
    items: [
      {
        id: 3,
        quantity: 1,
        special_instructions: "Well done",
        price_details: {
          id: 3,
          price: "24.99",
          size: "Medium",
          food_name: "Grilled Salmon",
          food_description: "Fresh Atlantic salmon with herbs",
          food_category: "Seafood",
          food_image: "/images/grilled-salmon.jpg"
        },
        item_total: "24.99"
      },
      {
        id: 4,
        quantity: 1,
        special_instructions: "",
        price_details: {
          id: 4,
          price: "7.76",
          size: "Regular",
          food_name: "Garlic Bread",
          food_description: "Fresh baked bread with garlic butter",
          food_category: "Appetizer",
          food_image: "/images/garlic-bread.jpg"
        },
        item_total: "7.76"
      }
    ],
    special_instructions: "",
    payment_method: "PayPal",
    payment_status: "Paid",
    estimated_delivery_time: "25-35 minutes",
    time_in_current_status: "10 minutes"
  },
  {
    id: 3,
    order_number: "ORD-2024-003",
    status: "preparing",
    status_display: "Preparing",
    total_amount: "58.25",
    customer_name: "Mike Johnson",
    chef_name: "Chef Mario",
    total_items: 4,
    created_at: "2024-09-24T09:15:00Z",
    time_since_order: "1.5 hours ago",
    delivery_address: "789 Pine St, Uptown, NY 10003",
    order_type: "pickup",
    customer: {
      id: 3,
      username: "mike_johnson",
      email: "mike@example.com",
      first_name: "Mike",
      last_name: "Johnson",
      full_name: "Mike Johnson",
      phone: "+1-555-0789"
    },
    items: [
      {
        id: 5,
        quantity: 2,
        special_instructions: "Medium rare",
        price_details: {
          id: 5,
          price: "22.50",
          size: "Regular",
          food_name: "Beef Burger",
          food_description: "Premium beef patty with cheese and bacon",
          food_category: "Burger",
          food_image: "/images/beef-burger.jpg"
        },
        item_total: "45.00"
      },
      {
        id: 6,
        quantity: 2,
        special_instructions: "",
        price_details: {
          id: 6,
          price: "6.25",
          size: "Large",
          food_name: "French Fries",
          food_description: "Crispy golden fries",
          food_category: "Side",
          food_image: "/images/french-fries.jpg"
        },
        item_total: "12.50"
      }
    ],
    special_instructions: "Ready for pickup at 11:00 AM",
    payment_method: "Cash",
    payment_status: "Pending",
    estimated_delivery_time: "Ready for pickup",
    time_in_current_status: "20 minutes"
  },
  {
    id: 4,
    order_number: "ORD-2024-004",
    status: "ready",
    status_display: "Ready",
    total_amount: "41.99",
    customer_name: "Lisa Brown",
    chef_name: "Chef Mario",
    total_items: 3,
    created_at: "2024-09-24T08:30:00Z",
    time_since_order: "2 hours ago",
    delivery_address: "321 Elm St, Downtown, NY 10004",
    order_type: "delivery",
    customer: {
      id: 4,
      username: "lisa_brown",
      email: "lisa@example.com",
      first_name: "Lisa",
      last_name: "Brown",
      full_name: "Lisa Brown",
      phone: "+1-555-0321"
    },
    items: [
      {
        id: 7,
        quantity: 1,
        special_instructions: "Extra cheese",
        price_details: {
          id: 7,
          price: "16.99",
          size: "Large",
          food_name: "Chicken Alfredo",
          food_description: "Creamy pasta with grilled chicken",
          food_category: "Pasta",
          food_image: "/images/chicken-alfredo.jpg"
        },
        item_total: "16.99"
      },
      {
        id: 8,
        quantity: 2,
        special_instructions: "",
        price_details: {
          id: 8,
          price: "12.50",
          size: "Regular",
          food_name: "Chocolate Cake",
          food_description: "Rich chocolate layer cake",
          food_category: "Dessert",
          food_image: "/images/chocolate-cake.jpg"
        },
        item_total: "25.00"
      }
    ],
    special_instructions: "Call when arriving",
    payment_method: "Credit Card",
    payment_status: "Paid",
    estimated_delivery_time: "Out for delivery",
    time_in_current_status: "5 minutes"
  },
  {
    id: 5,
    order_number: "ORD-2024-005",
    status: "delivered",
    status_display: "Delivered",
    total_amount: "28.75",
    customer_name: "David Lee",
    chef_name: "Chef Mario",
    total_items: 2,
    created_at: "2024-09-24T07:45:00Z",
    time_since_order: "3 hours ago",
    delivery_address: "654 Maple Ave, Midtown, NY 10005",
    order_type: "delivery",
    customer: {
      id: 5,
      username: "david_lee",
      email: "david@example.com",
      first_name: "David",
      last_name: "Lee",
      full_name: "David Lee",
      phone: "+1-555-0654"
    },
    items: [
      {
        id: 9,
        quantity: 1,
        special_instructions: "",
        price_details: {
          id: 9,
          price: "19.99",
          size: "Medium",
          food_name: "Sushi Roll Set",
          food_description: "Assorted fresh sushi rolls",
          food_category: "Japanese",
          food_image: "/images/sushi-rolls.jpg"
        },
        item_total: "19.99"
      },
      {
        id: 10,
        quantity: 1,
        special_instructions: "",
        price_details: {
          id: 10,
          price: "8.76",
          size: "Regular",
          food_name: "Miso Soup",
          food_description: "Traditional Japanese miso soup",
          food_category: "Soup",
          food_image: "/images/miso-soup.jpg"
        },
        item_total: "8.76"
      }
    ],
    special_instructions: "",
    payment_method: "Digital Wallet",
    payment_status: "Paid",
    estimated_delivery_time: "Delivered",
    time_in_current_status: "Completed"
  }
];

const SAMPLE_STATS: DashboardStats = {
  total_orders: 25,
  pending_orders: 3,
  preparing_orders: 5,
  ready_orders: 2,
  completed_orders: 15,
  today_revenue: 1250.75,
  average_prep_time: 28,
  total_customers: 18,
  status_distribution: [
    { status: 'pending', count: 3 },
    { status: 'confirmed', count: 4 },
    { status: 'preparing', count: 5 },
    { status: 'ready', count: 2 },
    { status: 'delivered', count: 15 }
  ],
  recent_orders: SAMPLE_ORDERS.slice(0, 5),
  monthly_revenue: [
    { month: 'Jan', revenue: 8500 },
    { month: 'Feb', revenue: 9200 },
    { month: 'Mar', revenue: 7800 },
    { month: 'Apr', revenue: 10500 },
    { month: 'May', revenue: 11200 },
    { month: 'Jun', revenue: 9800 }
  ]
};

// Types
interface OrderItem {
  id: number;
  quantity: number;
  special_instructions: string;
  price_details: {
    id: number;
    price: string;
    size: string;
    food_name: string;
    food_description: string;
    food_category: string;
    food_image: string;
  };
  item_total: string;
}

interface Customer {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  status_display: string;
  total_amount: string;
  customer_name: string;
  chef_name: string;
  total_items: number;
  created_at: string;
  time_since_order: string;
  delivery_address: string;
  order_type: string;
  customer?: Customer;
  items?: OrderItem[];
  special_instructions?: string;
  payment_method?: string;
  payment_status?: string;
  estimated_delivery_time?: string;
  time_in_current_status?: string;
}

interface DashboardStats {
  total_orders: number;
  pending_orders: number;
  preparing_orders: number;
  ready_orders: number;
  completed_orders: number;
  today_revenue: number;
  average_prep_time: number;
  total_customers: number;
  status_distribution: Array<{ status: string; count: number }>;
  recent_orders: Order[];
  monthly_revenue: Array<{ month: string; revenue: number }>;
}

interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

// Custom Notification Component
const Notification: React.FC<NotificationState & { onClose: () => void }> = ({
  show,
  message,
  type,
  onClose
}) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  }[type];

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in`}>
      <div className="flex items-center justify-between">
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">
          ×
        </button>
      </div>
    </div>
  );
};

// Status Badge Component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700';
      case 'confirmed': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700';
      case 'preparing': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-700';
      case 'ready': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700';
      case 'out_for_delivery': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-700';
      case 'delivered': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700';
      case 'cancelled': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700';
      case 'rejected': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
      {status.replace('_', ' ').toUpperCase()}
    </span>
  );
};

// Rejection Modal Component
const RejectionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  order: Order | null;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
  isSubmitting: boolean;
}> = ({ isOpen, onClose, onSubmit, order, rejectionReason, setRejectionReason, isSubmitting }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <X className="h-5 w-5" />
            Reject Order
          </DialogTitle>
          <DialogDescription>
            Please provide a reason for rejecting order {order?.order_number}. 
            This message will be sent to the customer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rejectionReason" className="text-sm font-medium">
              Reason for Rejection <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="rejectionReason"
              placeholder="Please explain why you cannot fulfill this order..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right">
              {rejectionReason.length}/500 characters
            </div>
            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border">
              💬 <strong>Customer Message:</strong> This reason will be sent to the customer via email, SMS, and app notification along with refund information.
            </div>
          </div>
          
          {order && (
            <div className="rounded-lg bg-muted p-3 space-y-2">
              <div className="text-sm font-medium">Order Details:</div>
              <div className="text-sm text-muted-foreground">
                <div>Customer: {order.customer_name}</div>
                <div>Items: {order.total_items} items</div>
                <div>Total: ${order.total_amount}</div>
              </div>
            </div>
          )}

          {rejectionReason.trim() && order && (
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 space-y-2">
              <div className="text-sm font-medium text-yellow-800">📨 Message Preview:</div>
              <div className="text-xs text-yellow-700 italic">
                "Dear {order.customer_name}, we apologize but your order #{order.order_number} has been rejected. Reason: {rejectionReason.trim()}. A full refund will be processed within 2-3 business days."
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onSubmit}
            disabled={!rejectionReason.trim() || isSubmitting}
            className="min-w-[100px]"
          >
            {isSubmitting ? 'Rejecting...' : 'Reject Order'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Status Counts Summary Component
const StatusCounts: React.FC<{ statusCounts: any; onStatusClick?: (status: string) => void }> = ({ 
  statusCounts, 
  onStatusClick 
}) => {
  const statusCards = [
    {
      title: 'Pending',
      status: 'pending',
      value: statusCounts.pending,
      icon: Clock,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      textColor: 'text-yellow-900 dark:text-yellow-100',
      hoverColor: 'hover:bg-yellow-100 dark:hover:bg-yellow-800/30'
    },
    {
      title: 'Confirmed',
      status: 'confirmed', 
      value: statusCounts.confirmed,
      icon: CheckCircle,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-900 dark:text-blue-100',
      hoverColor: 'hover:bg-blue-100 dark:hover:bg-blue-800/30'
    },
    {
      title: 'Preparing',
      status: 'preparing',
      value: statusCounts.preparing,
      icon: Package,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-900 dark:text-orange-100', 
      hoverColor: 'hover:bg-orange-100 dark:hover:bg-orange-800/30'
    },
    {
      title: 'Ready',
      status: 'ready',
      value: statusCounts.ready,
      icon: CheckCircle,
      color: 'bg-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-900 dark:text-green-100',
      hoverColor: 'hover:bg-green-100 dark:hover:bg-green-800/30'
    },
    {
      title: 'Out for Delivery',
      status: 'out_for_delivery',
      value: statusCounts.out_for_delivery,
      icon: TrendingUp,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-900 dark:text-purple-100',
      hoverColor: 'hover:bg-purple-100 dark:hover:bg-purple-800/30'
    },
    {
      title: 'Delivered',
      status: 'delivered',
      value: statusCounts.delivered,
      icon: CheckCircle,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      textColor: 'text-emerald-900 dark:text-emerald-100',
      hoverColor: 'hover:bg-emerald-100 dark:hover:bg-emerald-800/30'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {statusCards.map((card, index) => {
        const IconComponent = card.icon;
        const isClickable = onStatusClick && card.value > 0;
        
        return (
          <div 
            key={index} 
            className={`${card.bgColor} rounded-lg border dark:border-gray-600 p-4 transition-all duration-200 ${
              isClickable ? `${card.hoverColor} cursor-pointer transform hover:scale-105 shadow-sm hover:shadow-md` : ''
            }`}
            onClick={() => isClickable && onStatusClick(card.status)}
            title={isClickable ? `Click to filter ${card.title.toLowerCase()} orders` : ''}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className={`text-sm font-medium ${card.textColor} opacity-75`}>{card.title}</p>
                <p className={`text-2xl font-bold ${card.textColor} mt-1`}>{card.value}</p>
                {card.value > 0 && isClickable && (
                  <p className={`text-xs ${card.textColor} opacity-60 mt-1`}>Click to filter</p>
                )}
              </div>
              <div className={`${card.color} p-2 rounded-lg opacity-80`}>
                <IconComponent className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Dashboard Stats Cards Component
const DashboardStats: React.FC<{ stats: DashboardStats | null }> = ({ stats }) => {
  if (!stats) return null;

  const statCards = [
    {
      title: 'Total Orders',
      value: stats.total_orders,
      icon: Package,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Pending Orders',
      value: stats.pending_orders,
      icon: Clock,
      color: 'bg-yellow-500',
      change: '+3%'
    },
    {
      title: 'Ready Orders',
      value: stats.ready_orders,
      icon: CheckCircle,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'Today Revenue',
      value: `$${stats.today_revenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      change: '+15%'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{card.title}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{card.value}</p>
                <p className="text-sm text-green-600 dark:text-green-400 flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {card.change}
                </p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <IconComponent className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Order Detail Modal Component
const OrderDetailModal: React.FC<{
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (orderId: number, newStatus: string, notes?: string) => void;
}> = ({ order, isOpen, onClose, onStatusUpdate }) => {
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (order) {
      setNewStatus(order.status);
      setNotes('');
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const statusOptions = [
    'pending', 'confirmed', 'preparing', 'ready', 
    'out_for_delivery', 'delivered', 'cancelled'
  ];

  const handleStatusUpdate = () => {
    if (newStatus !== order.status) {
      onStatusUpdate(order.id, newStatus, notes);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Order Details - #{order.order_number}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Order Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <StatusBadge status={order.status} />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-medium">${order.total_amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Type:</span>
                  <span>{order.order_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span>{new Date(order.created_at).toLocaleString()}</span>
                </div>
                {order.time_in_current_status && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time in Status:</span>
                    <span>{order.time_in_current_status}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Info */}
            {order.customer && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Customer Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{order.customer.full_name}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{order.customer.email}</span>
                  </div>
                  {order.customer.phone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-500" />
                      <span>{order.customer.phone}</span>
                    </div>
                  )}
                  {order.delivery_address && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                      <span>{order.delivery_address}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Order Items */}
          {order.items && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Order Items</h3>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.price_details.food_name}</h4>
                        <p className="text-sm text-gray-600">{item.price_details.food_description}</p>
                        <p className="text-sm text-gray-500">Size: {item.price_details.size}</p>
                        {item.special_instructions && (
                          <p className="text-sm text-blue-600 mt-1">
                            Special: {item.special_instructions}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Qty: {item.quantity}</p>
                        <p className="text-lg font-semibold">${item.item_total}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          {order.special_instructions && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Special Instructions</h3>
              <p className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                {order.special_instructions}
              </p>
            </div>
          )}

          {/* Status Update Section */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-medium">Update Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add status update notes..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={newStatus === order.status}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Order Component
const Order: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: '',
    type: 'info'
  });

  // Rejection modal state
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [orderToReject, setOrderToReject] = useState<Order | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingRejection, setIsSubmittingRejection] = useState(false);

  // Real-time notifications - temporarily disabled
  // const { notifications, unreadCount } = useOrderNotifications();
  const unreadCount = 0; // Placeholder

  const ordersPerPage = 10;

  // Show notification
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ show: true, message, type });
  };

  // Hide notification
  const hideNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  // Fetch dashboard stats - Using sample data
  const fetchDashboardStats = async () => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setStats(SAMPLE_STATS);
      showNotification('Dashboard stats loaded successfully', 'success');
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      showNotification('Failed to load dashboard stats', 'error');
      // Set default empty stats on error
      setStats({
        total_orders: 0,
        pending_orders: 0,
        preparing_orders: 0,
        ready_orders: 0,
        completed_orders: 0,
        today_revenue: 0,
        average_prep_time: 0,
        total_customers: 0,
        status_distribution: [],
        recent_orders: [],
        monthly_revenue: []
      });
    }
  };

  // Fetch orders - Using sample data with filtering
  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Filter sample data based on search and status filters
      let filteredOrders = [...SAMPLE_ORDERS];
      
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredOrders = filteredOrders.filter(order =>
          order.customer_name.toLowerCase().includes(term) ||
          order.order_number.toLowerCase().includes(term) ||
          order.delivery_address.toLowerCase().includes(term)
        );
      }
      
      if (statusFilter) {
        filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
      }
      
      if (dateFilter) {
        const filterDate = new Date(dateFilter);
        filteredOrders = filteredOrders.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= filterDate;
        });
      }
      
      setOrders(filteredOrders);
      showNotification(`Loaded ${filteredOrders.length} orders`, 'success');
    } catch (error) {
      console.error('Error fetching orders:', error);
      showNotification('Failed to load orders', 'error');
      setOrders([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch order details - Using sample data
  const fetchOrderDetails = async (orderId: number) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const order = SAMPLE_ORDERS.find(o => o.id === orderId);
      if (order) {
        setSelectedOrder(order);
        setIsDetailModalOpen(true);
      } else {
        showNotification('Order not found', 'error');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      showNotification('Failed to load order details', 'error');
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId: number, newStatus: string, notes?: string) => {
    try {
      // For sample data mode, update the local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus, status_display: newStatus.charAt(0).toUpperCase() + newStatus.slice(1) }
            : order
        )
      );
      
      showNotification('Order status updated successfully', 'success');
      fetchDashboardStats();
      
      // Uncomment below to use real API when ready
      // await axios.post(`/api/orders/orders/${orderId}/update_status/`, {
      //   status: newStatus,
      //   notes: notes || ''
      // });
      // fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      showNotification('Failed to update order status', 'error');
    }
  };

  // Accept order function
  const handleAcceptOrder = async (orderId: number) => {
    try {
      await updateOrderStatus(orderId, 'confirmed', 'Order accepted by chef');
      
      // In SAMPLE DATA mode - just show notifications
      showNotification('✅ Order accepted! Customer will receive confirmation message.', 'success');
      
      // Uncomment below to send real customer notifications when API is ready
      // await axios.post('/api/notifications/send-order-update/', {
      //   order_id: orderId,
      //   status: 'accepted',
      //   message: 'Great news! Your order has been accepted by the chef and is being prepared.',
      //   notification_types: ['email', 'sms', 'push'] // Multiple notification channels
      // });
      
    } catch (error) {
      console.error('Error accepting order:', error);
      showNotification('Failed to accept order', 'error');
    }
  };

  // Reject order function
  const handleRejectOrder = (order: Order) => {
    setOrderToReject(order);
    setRejectionReason('');
    setIsRejectionModalOpen(true);
  };

  // Submit rejection with reason
  const submitRejection = async () => {
    if (!orderToReject || !rejectionReason.trim()) {
      showNotification('Please provide a reason for rejection', 'error');
      return;
    }

    try {
      setIsSubmittingRejection(true);
      await updateOrderStatus(orderToReject.id, 'rejected', rejectionReason.trim());
      
      // Close modal and reset state
      setIsRejectionModalOpen(false);
      setOrderToReject(null);
      setRejectionReason('');
      
      // In SAMPLE DATA mode - show what would happen
      showNotification(`❌ Order rejected! Customer "${orderToReject.customer_name}" will receive: "${rejectionReason.trim()}"`, 'success');
      
      // Uncomment below to send real customer notifications when API is ready
      // await axios.post('/api/notifications/send-order-update/', {
      //   order_id: orderToReject.id,
      //   status: 'rejected',
      //   message: `Unfortunately, your order has been rejected. Reason: ${rejectionReason.trim()}`,
      //   customer_message: rejectionReason.trim(),
      //   notification_types: ['email', 'sms', 'push'],
      //   refund_initiated: true // Trigger refund process
      // });
      
    } catch (error) {
      console.error('Error rejecting order:', error);
      showNotification('Failed to reject order', 'error');
    } finally {
      setIsSubmittingRejection(false);
    }
  };

  // Cancel rejection modal
  const cancelRejection = () => {
    setIsRejectionModalOpen(false);
    setOrderToReject(null);
    setRejectionReason('');
  };

  // Demo function to show customer message examples
  const showCustomerMessagePreview = (action: 'accept' | 'reject', order: Order, reason?: string) => {
    const customerMessage = action === 'accept' 
      ? `Dear ${order.customer_name}, great news! Your order #${order.order_number} has been accepted by the chef and is being prepared. You'll receive updates as your order progresses.`
      : `Dear ${order.customer_name}, we apologize but your order #${order.order_number} has been rejected. Reason: ${reason}. A full refund will be processed within 2-3 business days.`;
    
    console.log('📱 Customer would receive:', customerMessage);
    return customerMessage;
  };

  // Handle bulk actions - Using sample data simulation
  const handleBulkAction = async (action: string, additionalData?: any) => {
    if (selectedOrders.length === 0) {
      showNotification('Please select orders first', 'error');
      return;
    }

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // For sample data, simulate bulk actions locally
      if (action === 'update_status' && additionalData?.new_status) {
        setOrders(prevOrders => 
          prevOrders.map(order => {
            if (selectedOrders.includes(order.id)) {
              const newStatus = additionalData.new_status;
              return { 
                ...order, 
                status: newStatus, 
                status_display: newStatus.charAt(0).toUpperCase() + newStatus.slice(1) 
              };
            }
            return order;
          })
        );
      }

      showNotification(`Bulk ${action} completed for ${selectedOrders.length} orders`, 'success');
      setSelectedOrders([]);
      fetchDashboardStats();
      
      // Uncomment below to use real API when ready
      // const payload = {
      //   order_ids: selectedOrders,
      //   action,
      //   ...additionalData
      // };
      // await axios.post('/api/orders/orders/bulk_action/', payload);
      // fetchOrders();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      showNotification(`Failed to perform bulk ${action}`, 'error');
    }
  };

  // Accept order
  const acceptOrder = async (orderId: number) => {
    await handleAcceptOrder(orderId);
  };

  // Handle status filter from status counts
  const handleStatusFilter = (status: string) => {
    setStatusFilter(status === statusFilter ? '' : status); // Toggle filter
    setCurrentPage(1); // Reset to first page
  };

  // Filter orders based on search and filters
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = !searchTerm || 
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.delivery_address?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !statusFilter || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  // Calculate status counts from actual orders data
  const statusCounts = useMemo(() => {
    const counts = {
      pending: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0,
      total: orders.length
    };

    orders.forEach(order => {
      if (counts.hasOwnProperty(order.status)) {
        counts[order.status as keyof typeof counts]++;
      }
    });

    return counts;
  }, [orders]);

  // Paginate orders
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ordersPerPage;
    return filteredOrders.slice(startIndex, startIndex + ordersPerPage);
  }, [filteredOrders, currentPage, ordersPerPage]);

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  // Load data on component mount
  useEffect(() => {
    fetchOrders();
    fetchDashboardStats();
  }, []);

  // Auto-refresh when there are new notifications - temporarily disabled
  // useEffect(() => {
  //   if (unreadCount > 0) {
  //     fetchOrders();
  //     fetchDashboardStats();
  //   }
  // }, [unreadCount]);

  // Refresh data when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFilter]);

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Chef Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your orders and track performance</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Real-time notifications - temporarily disabled */}
            {/* <OrderNotifications className="mr-4" /> */}
          </div>
        </div>

        {/* Status Counts Summary */}
        <StatusCounts 
          statusCounts={statusCounts} 
          onStatusClick={handleStatusFilter}
        />

        {/* Dashboard Stats */}
        <DashboardStats stats={stats} />

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  statusFilter ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">All Status ({statusCounts.total})</option>
                <option value="pending">Pending ({statusCounts.pending})</option>
                <option value="confirmed">Confirmed ({statusCounts.confirmed})</option>
                <option value="preparing">Preparing ({statusCounts.preparing})</option>
                <option value="ready">Ready ({statusCounts.ready})</option>
                <option value="out_for_delivery">Out for Delivery ({statusCounts.out_for_delivery})</option>
                <option value="delivered">Delivered ({statusCounts.delivered})</option>
                <option value="cancelled">Cancelled ({statusCounts.cancelled})</option>
              </select>

              {/* Date Filter */}
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={fetchOrders}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              
              {/* Clear Filters Button */}
              {(statusFilter || searchTerm || dateFilter) && (
                <button
                  onClick={() => {
                    setStatusFilter('');
                    setSearchTerm('');
                    setDateFilter('');
                  }}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Clear Filters
                </button>
              )}
              
              {/* Bulk Actions */}
              {selectedOrders.length > 0 && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleBulkAction('update_status', { new_status: 'preparing' })}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    Mark Preparing
                  </button>
                  <button
                    onClick={() => handleBulkAction('update_status', { new_status: 'ready' })}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Mark Ready
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {(statusFilter || searchTerm || dateFilter) && (
            <div className="mt-4 flex items-center space-x-2 text-sm text-gray-600">
              <Filter className="w-4 h-4" />
              <span>Active filters:</span>
              {statusFilter && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Status: {statusFilter.replace('_', ' ')}
                </span>
              )}
              {searchTerm && (
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                  Search: "{searchTerm}"
                </span>
              )}
              {dateFilter && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                  Date: {dateFilter}
                </span>
              )}
              <span className="text-gray-500">({filteredOrders.length} results)</span>
            </div>
          )}
        </div>

        {/* Orders Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOrders(paginatedOrders.map(order => order.id));
                        } else {
                          setSelectedOrders([]);
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrders([...selectedOrders, order.id]);
                          } else {
                            setSelectedOrders(selectedOrders.filter(id => id !== order.id));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">#{order.order_number}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{order.order_type}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">{order.customer_name}</div>
                      {order.delivery_address && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-32" title={order.delivery_address}>
                          {order.delivery_address}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {order.total_items}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      ${order.total_amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {order.time_since_order}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => fetchOrderDetails(order.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {order.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => acceptOrder(order.id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 h-8"
                              title="Accept Order"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectOrder(order)}
                              className="px-3 py-1.5 h-8"
                              title="Reject Order"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                        
                        {order.status === 'confirmed' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'preparing')}
                            className="text-orange-600 hover:text-orange-900"
                            title="Start Preparing"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        )}
                        
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'ready')}
                            className="text-green-600 hover:text-green-900"
                            title="Mark Ready"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((currentPage - 1) * ordersPerPage) + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * ordersPerPage, filteredOrders.length)}
                    </span> of{' '}
                    <span className="font-medium">{filteredOrders.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {filteredOrders.length === 0 && !loading && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter || dateFilter 
                ? "Try adjusting your filters or search terms."
                : "Orders will appear here when customers place them."
              }
            </p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedOrder(null);
        }}
        onStatusUpdate={updateOrderStatus}
      />

      {/* Rejection Modal */}
      <RejectionModal
        isOpen={isRejectionModalOpen}
        onClose={cancelRejection}
        onSubmit={submitRejection}
        order={orderToReject}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        isSubmitting={isSubmittingRejection}
      />

      {/* Notification */}
      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={hideNotification}
      />
    </div>
  );
};

export default Order;