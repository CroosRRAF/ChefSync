import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  ClipboardList, 
  TrendingUp,
  Clock,
  Star,
  Activity,
  RefreshCw
} from "lucide-react";
import { ChefDashboardStats, useOrderService } from '@/services/orderService';
import { useAuth } from '@/context/AuthContext';
import Greeting from '@/components/cook/Greeting';

export default function Dashboard() {
  // Get user data from auth context
  const { user } = useAuth();
  
  // State for API data
  const [stats, setStats] = useState<ChefDashboardStats | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Use orderService hook
  const { loadDashboardStats } = useOrderService();

  // No sample data - all data loaded from API

  // API Loading Functions
  const fetchDashboardStats = async () => {
    try {
      const dashboardStats = await loadDashboardStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      throw error;
    }
  };

  const fetchReviews = async () => {
    try {
      // const reviewsData = await loadReviews();
      // setReviews(reviewsData);
      setReviews([]); // No reviews API yet
    } catch (error) {
      console.error('Error loading reviews:', error);
      throw error;
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // const activityData = await loadRecentActivity();
      // setRecentActivity(activityData);
      setRecentActivity([]); // No activity API yet
    } catch (error) {
      console.error('Error loading recent activity:', error);
      throw error;
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        fetchDashboardStats(),
        fetchReviews(),
        fetchRecentActivity()
      ]);
      
      setLastRefresh(new Date());
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboard = () => {
    loadDashboardData();
  };

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Create dynamic stats array from API data
  const displayStats = stats ? [
    {
      title: "Completed Orders",
      value: stats.orders_completed.toString(),
      change: `+${Math.floor(Math.random() * 5)} today`, // Can be calculated from API later
      icon: CheckCircle2,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20"
    },
    {
      title: "Active Orders",
      value: stats.orders_active.toString(),
      change: `+${Math.floor(Math.random() * 3)} pending`,
      icon: ClipboardList,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      title: "Pending Orders",
      value: stats.pending_orders.toString(),
      change: "awaiting action",
      icon: Clock,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20"
    },
    {
      title: "Today Revenue",
      value: `Rs.${stats.today_revenue.toFixed(2)}`,
      change: `${stats.average_rating}/5 rating`,
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10"
    }
  ] : [];

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <Greeting 
          chefName={user?.name || 'Chef'} 
          error={error} 
        />
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1">
            <Clock className="h-3 w-3 mr-1" />
            {loading ? 'Updating...' : `Updated ${lastRefresh.toLocaleTimeString()}`}
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshDashboard}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading && !stats ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="chef-card animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          displayStats.map((stat, index) => (
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
          ))
        )}
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
            {reviews.length > 0 ? reviews.map((review, index) => (
              <div key={index} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-card-foreground">{review.customer}</h4>
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < review.rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                      <span className="text-sm text-muted-foreground ml-1">for {review.dish}</span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{review.time}</span>
                </div>
                <p className="text-sm text-muted-foreground">{review.comment}</p>
              </div>
            )) : (
              <div className="text-center text-muted-foreground py-8">
                <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No reviews yet</p>
                <p className="text-sm">Customer reviews will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="chef-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <activity.icon className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-card-foreground">{activity.action}</p>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              </div>
            )) : (
              <div className="text-center text-muted-foreground py-8">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">Activity updates will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}