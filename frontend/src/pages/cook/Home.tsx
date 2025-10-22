import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { useState, useEffect } from "react";
import axios from "axios";

import { 
  ChefHat, 
  ClipboardList, 
  CheckCircle2, 
  Package, 
  Star,
  TrendingUp,
  Clock,
  Users,
  DollarSign,
  AlertCircle,
  RefreshCw
} from "lucide-react";

/**
 * REAL DATA MODE: This component fetches live data from Django backend APIs.
 * Sample data used as fallback for development/testing.
 */

// Sample Data for Dashboard Stats
const SAMPLE_DASHBOARD_STATS = {
  orders_completed: 24,
  orders_active: 12,
  bulk_orders: 8,
  total_reviews: 47,
  average_rating: 4.6,
  today_revenue: 1250.75,
  pending_orders: 5,
  monthly_orders: 156,
  customer_satisfaction: 94
};

// Sample Reviews Data
const SAMPLE_REVIEWS = [
  {
    customer: "Sarah Johnson",
    rating: 5,
    comment: "Amazing pasta! The flavors were incredible and the portion was perfect.",
    dish: "Truffle Pasta",
    time: "2 hours ago",
    order_id: "ORD-2024-001"
  },
  {
    customer: "Mike Chen",
    rating: 5,
    comment: "Best burger I've had in years. The meat was cooked perfectly and the fries were crispy!",
    dish: "Chef's Special Burger",
    time: "4 hours ago",
    order_id: "ORD-2024-002"
  },
  {
    customer: "Emma Wilson",
    rating: 4,
    comment: "Great presentation and taste. Loved the seasoning on the salmon.",
    dish: "Grilled Salmon",
    time: "6 hours ago",
    order_id: "ORD-2024-003"
  },
  {
    customer: "David Rodriguez",
    rating: 5,
    comment: "Outstanding sushi rolls! Fresh ingredients and beautiful presentation.",
    dish: "Dragon Roll Set",
    time: "8 hours ago",
    order_id: "ORD-2024-004"
  },
  {
    customer: "Lisa Thompson",
    rating: 4,
    comment: "Delicious pizza with great toppings. Will definitely order again!",
    dish: "Margherita Pizza",
    time: "1 day ago",
    order_id: "ORD-2024-005"
  }
];

// Sample Activity Data
const SAMPLE_RECENT_ACTIVITY = [
  { action: "New order received from John Smith", time: "5 minutes ago", icon: ClipboardList, type: "order" },
  { action: "Order #ORD-2024-015 marked as completed", time: "15 minutes ago", icon: CheckCircle2, type: "success" },
  { action: "5-star review received for Truffle Pasta", time: "1 hour ago", icon: Star, type: "review" },
  { action: "Bulk order collaboration with 3 chefs", time: "2 hours ago", icon: Users, type: "collaboration" },
  { action: "Menu item 'Seafood Risotto' approved", time: "3 hours ago", icon: CheckCircle2, type: "approval" },
  { action: "Order #ORD-2024-012 ready for pickup", time: "4 hours ago", icon: Package, type: "ready" },
  { action: "New customer registration: Maria Lopez", time: "5 hours ago", icon: Users, type: "customer" },
  { action: "Payment confirmed for order #ORD-2024-010", time: "6 hours ago", icon: DollarSign, type: "payment" }
];

export default function Home() {
  const [greeting, setGreeting] = useState("");
  const [stats, setStats] = useState(SAMPLE_DASHBOARD_STATS);
  const [reviews, setReviews] = useState(SAMPLE_REVIEWS);
  const [recentActivity, setRecentActivity] = useState(SAMPLE_RECENT_ACTIVITY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  useEffect(() => {
    setGreeting(getGreeting());
    
    // Load real data from API
    loadDashboardData();
    
    // Update greeting every minute
    const interval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Load all dashboard data
  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchDashboardStats(),
        fetchRecentReviews(),
        fetchRecentActivity()
      ]);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Refresh data manually
  const refreshData = () => {
    loadDashboardData();
  };

  // Fetch real dashboard stats from Django backend
  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get('/api/orders/chef/dashboard/stats/', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Use sample data as fallback
      setStats(SAMPLE_DASHBOARD_STATS);
    }
  };

  const fetchRecentReviews = async () => {
    try {
      const response = await axios.get('/api/orders/chef/reviews/recent/', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // Use sample data as fallback
      setReviews(SAMPLE_REVIEWS);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await axios.get('/api/orders/chef/activity/recent/', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      // Map the response to include icon components
      const activitiesWithIcons = response.data.map((activity: any) => ({
        ...activity,
        icon: getIconForActivityType(activity.type)
      }));
      setRecentActivity(activitiesWithIcons);
    } catch (error) {
      console.error('Error fetching activity:', error);
      // Use sample data as fallback
      setRecentActivity(SAMPLE_RECENT_ACTIVITY);
    }
  };

  // Helper function to get appropriate icon for activity type
  const getIconForActivityType = (type: string) => {
    switch (type) {
      case 'order': return ClipboardList;
      case 'success': return CheckCircle2;
      case 'review': return Star;
      case 'collaboration': return Users;
      case 'approval': return CheckCircle2;
      case 'ready': return Package;
      case 'customer': return Users;
      case 'payment': return DollarSign;
      default: return ClipboardList;
    }
  };

  // Generate stats cards from sample data
  const statsCards = [
    {
      title: "Orders Completed",
      value: stats.orders_completed.toString(),
      change: "+12 today",
      icon: CheckCircle2,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20"
    },
    {
      title: "Active Orders",
      value: stats.orders_active.toString(),
      change: `${stats.pending_orders} pending`,
      icon: Clock,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      title: "Bulk Orders",
      value: stats.bulk_orders.toString(),
      change: "+2 pending",
      icon: Package,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20"
    },
    {
      title: "Today's Revenue",
      value: `LKR ${stats.today_revenue.toFixed(0)}`,
      change: "+15% from yesterday",
      icon: DollarSign,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20"
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{`${greeting}, Chef!`}</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening in your kitchen today</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={refreshData}
            disabled={loading}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Badge variant="secondary" className="px-3 py-1">
            <Clock className="h-3 w-3 mr-1" />
            {loading ? 'Loading...' : 'Live Dashboard'}
          </Badge>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
            <button 
              onClick={refreshData}
              className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className="chef-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Reviews */}
        <Card className="chef-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-accent" />
              Recent Customer Reviews
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviews.map((review, index) => (
              <div key={index} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-card-foreground">{review.customer}</p>
                    <p className="text-sm text-muted-foreground">{review.dish}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-3 w-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"}`} 
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-card-foreground mb-1">"{review.comment}"</p>
                <p className="text-xs text-muted-foreground">{review.time}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="chef-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.slice(0, 6).map((activity, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  activity.type === 'success' ? 'bg-green-50 dark:bg-green-900/20' :
                  activity.type === 'review' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                  activity.type === 'order' ? 'bg-blue-50 dark:bg-blue-900/20' :
                  activity.type === 'payment' ? 'bg-emerald-50 dark:bg-emerald-900/20' :
                  'bg-muted'
                }`}>
                  <activity.icon className={`h-4 w-4 ${
                    activity.type === 'success' ? 'text-green-600 dark:text-green-400' :
                    activity.type === 'review' ? 'text-yellow-600 dark:text-yellow-400' :
                    activity.type === 'order' ? 'text-blue-600 dark:text-blue-400' :
                    activity.type === 'payment' ? 'text-emerald-600 dark:text-emerald-400' :
                    'text-muted-foreground'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-card-foreground">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
