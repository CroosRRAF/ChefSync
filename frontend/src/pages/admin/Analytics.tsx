import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { apiClient } from '@/utils/fetcher';
import InteractiveChart from '@/components/admin/InteractiveChart';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Package,
  Calendar,
  Clock,
  MapPin,
  ChefHat,
  Truck,
  User,
  Activity,
  RefreshCw
} from 'lucide-react';

interface AnalyticsData {
  total_users: number;
  active_users: number;
  new_users_today: number;
  new_users_this_week: number;
  new_users_this_month: number;
  user_growth: number;

  total_chefs: number;
  active_chefs: number;
  pending_chef_approvals: number;
  chef_growth: number;

  total_orders: number;
  orders_today: number;
  orders_this_week: number;
  orders_this_month: number;
  order_growth: number;

  total_revenue: number;
  revenue_today: number;
  revenue_this_week: number;
  revenue_this_month: number;
  revenue_growth: number;

  total_foods: number;
  active_foods: number;
  pending_approvals: number;
}

const AdminAnalytics: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string>('30d');

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchAnalytics();
    } else {
      setIsLoading(false);
      console.log('User not authenticated or not admin:', { isAuthenticated, userRole: user?.role });
    }
  }, [timeRange, isAuthenticated, user]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching analytics with timeRange:', timeRange);
      const response = await apiClient.get(`/analytics/dashboard/stats/?range=${timeRange}`);
      console.log('Analytics response:', response);
      setAnalytics(response.data || response);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Show error state instead of fallback to dummy data
      setAnalytics(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <AdminLayout>
        <Card className="text-center py-12" style={{
          backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
          borderColor: theme === 'light' ? '#E5E7EB' : '#374151'
        }}>
          <CardContent>
            <BarChart3 className="h-16 w-16 mx-auto mb-4" style={{
              color: theme === 'light' ? '#9CA3AF' : '#6B7280'
            }} />
            <h3 className="text-lg font-semibold mb-2" style={{
              color: theme === 'light' ? '#111827' : '#F9FAFB'
            }}>Authentication Required</h3>
            <p className="mb-4" style={{
              color: theme === 'light' ? '#6B7280' : '#9CA3AF'
            }}>
              Please log in to access analytics data.
            </p>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <AdminLayout>
        <Card className="text-center py-12" style={{
          backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
          borderColor: theme === 'light' ? '#E5E7EB' : '#374151'
        }}>
          <CardContent>
            <BarChart3 className="h-16 w-16 mx-auto mb-4" style={{
              color: theme === 'light' ? '#9CA3AF' : '#6B7280'
            }} />
            <h3 className="text-lg font-semibold mb-2" style={{
              color: theme === 'light' ? '#111827' : '#F9FAFB'
            }}>Access Denied</h3>
            <p className="mb-4" style={{
              color: theme === 'light' ? '#6B7280' : '#9CA3AF'
            }}>
              You need admin privileges to access analytics data.
            </p>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 rounded w-1/4" style={{
              backgroundColor: theme === 'light' ? '#E5E7EB' : '#4B5563'
            }}></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 rounded" style={{
                  backgroundColor: theme === 'light' ? '#E5E7EB' : '#4B5563'
                }}></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="h-80 rounded" style={{
                  backgroundColor: theme === 'light' ? '#E5E7EB' : '#4B5563'
                }}></div>
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!analytics) {
    return (
      <AdminLayout>
        <Card className="text-center py-12" style={{
          backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
          borderColor: theme === 'light' ? '#E5E7EB' : '#374151'
        }}>
          <CardContent>
            <BarChart3 className="h-16 w-16 mx-auto mb-4" style={{
              color: theme === 'light' ? '#9CA3AF' : '#6B7280'
            }} />
            <h3 className="text-lg font-semibold mb-2" style={{
              color: theme === 'light' ? '#111827' : '#F9FAFB'
            }}>Analytics Unavailable</h3>
            <p className="mb-4" style={{
              color: theme === 'light' ? '#6B7280' : '#9CA3AF'
            }}>
              Unable to load analytics data at this time.
            </p>
            <Button onClick={fetchAnalytics}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <div className="space-y-8">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold" style={{
            color: theme === 'light' ? '#111827' : '#F9FAFB'
          }}>
            Analytics Overview
          </h2>
          <p className="mt-1" style={{
            color: theme === 'light' ? '#6B7280' : '#9CA3AF'
          }}>
            Business insights and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card style={{
          backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
          borderColor: theme === 'light' ? '#E5E7EB' : '#374151'
        }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{
              color: theme === 'light' ? '#6B7280' : '#9CA3AF'
            }}>Total Users</CardTitle>
            <Users className="h-4 w-4" style={{
              color: theme === 'light' ? '#2563EB' : '#3B82F6'
            }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{
              color: theme === 'light' ? '#111827' : '#F9FAFB'
            }}>{analytics.total_users.toLocaleString()}</div>
            <p className="text-xs" style={{
              color: theme === 'light' ? '#10B981' : '#34D399'
            }}>
              <TrendingUp className="inline h-3 w-3 mr-1" />
              {analytics.user_growth > 0 ? '+' : ''}{analytics.user_growth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card style={{
          backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
          borderColor: theme === 'light' ? '#E5E7EB' : '#374151'
        }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{
              color: theme === 'light' ? '#6B7280' : '#9CA3AF'
            }}>Total Orders</CardTitle>
            <Package className="h-4 w-4" style={{
              color: theme === 'light' ? '#F59E0B' : '#FBBF24'
            }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{
              color: theme === 'light' ? '#111827' : '#F9FAFB'
            }}>{analytics.total_orders.toLocaleString()}</div>
            <p className="text-xs" style={{
              color: theme === 'light' ? '#10B981' : '#34D399'
            }}>
              <TrendingUp className="inline h-3 w-3 mr-1" />
              {analytics.order_growth > 0 ? '+' : ''}{analytics.order_growth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card style={{
          backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
          borderColor: theme === 'light' ? '#E5E7EB' : '#374151'
        }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{
              color: theme === 'light' ? '#6B7280' : '#9CA3AF'
            }}>Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4" style={{
              color: theme === 'light' ? '#10B981' : '#34D399'
            }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{
              color: theme === 'light' ? '#111827' : '#F9FAFB'
            }}>${analytics.total_revenue.toLocaleString()}</div>
            <p className="text-xs" style={{
              color: theme === 'light' ? '#10B981' : '#34D399'
            }}>
              <TrendingUp className="inline h-3 w-3 mr-1" />
              {analytics.revenue_growth > 0 ? '+' : ''}{analytics.revenue_growth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card style={{
          backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
          borderColor: theme === 'light' ? '#E5E7EB' : '#374151'
        }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{
              color: theme === 'light' ? '#6B7280' : '#9CA3AF'
            }}>Active Users</CardTitle>
            <Activity className="h-4 w-4" style={{
              color: theme === 'light' ? '#7C3AED' : '#A78BFA'
            }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{
              color: theme === 'light' ? '#111827' : '#F9FAFB'
            }}>{analytics.active_users.toLocaleString()}</div>
            <p className="text-xs" style={{
              color: theme === 'light' ? '#6B7280' : '#9CA3AF'
            }}>
              Currently active users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Statistics */}
        <Card style={{
          backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
          borderColor: theme === 'light' ? '#E5E7EB' : '#374151'
        }}>
          <CardHeader>
            <CardTitle style={{
              color: theme === 'light' ? '#111827' : '#F9FAFB'
            }}>User Statistics</CardTitle>
            <CardDescription style={{
              color: theme === 'light' ? '#6B7280' : '#9CA3AF'
            }}>User registration and activity breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{
                    backgroundColor: theme === 'light' ? '#2563EB' : '#3B82F6'
                  }} />
                  <span style={{
                    color: theme === 'light' ? '#111827' : '#F9FAFB'
                  }}>Total Users</span>
                </div>
                <Badge variant="secondary" style={{
                  backgroundColor: theme === 'light' ? '#F3F4F6' : '#374151',
                  color: theme === 'light' ? '#374151' : '#D1D5DB'
                }}>{analytics.total_users}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{
                    backgroundColor: theme === 'light' ? '#10B981' : '#34D399'
                  }} />
                  <span style={{
                    color: theme === 'light' ? '#111827' : '#F9FAFB'
                  }}>Active Users</span>
                </div>
                <Badge variant="secondary" style={{
                  backgroundColor: theme === 'light' ? '#F3F4F6' : '#374151',
                  color: theme === 'light' ? '#374151' : '#D1D5DB'
                }}>{analytics.active_users}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{
                    backgroundColor: theme === 'light' ? '#F59E0B' : '#FBBF24'
                  }} />
                  <span style={{
                    color: theme === 'light' ? '#111827' : '#F9FAFB'
                  }}>New Today</span>
                </div>
                <Badge variant="secondary" style={{
                  backgroundColor: theme === 'light' ? '#F3F4F6' : '#374151',
                  color: theme === 'light' ? '#374151' : '#D1D5DB'
                }}>{analytics.new_users_today}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{
                    backgroundColor: theme === 'light' ? '#EF4444' : '#F87171'
                  }} />
                  <span style={{
                    color: theme === 'light' ? '#111827' : '#F9FAFB'
                  }}>New This Week</span>
                </div>
                <Badge variant="secondary" style={{
                  backgroundColor: theme === 'light' ? '#F3F4F6' : '#374151',
                  color: theme === 'light' ? '#374151' : '#D1D5DB'
                }}>{analytics.new_users_this_week}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{
                    backgroundColor: theme === 'light' ? '#7C3AED' : '#A78BFA'
                  }} />
                  <span style={{
                    color: theme === 'light' ? '#111827' : '#F9FAFB'
                  }}>New This Month</span>
                </div>
                <Badge variant="secondary" style={{
                  backgroundColor: theme === 'light' ? '#F3F4F6' : '#374151',
                  color: theme === 'light' ? '#374151' : '#D1D5DB'
                }}>{analytics.new_users_this_month}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Statistics */}
        <Card style={{
          backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
          borderColor: theme === 'light' ? '#E5E7EB' : '#374151'
        }}>
          <CardHeader>
            <CardTitle style={{
              color: theme === 'light' ? '#111827' : '#F9FAFB'
            }}>Order Statistics</CardTitle>
            <CardDescription style={{
              color: theme === 'light' ? '#6B7280' : '#9CA3AF'
            }}>Order volume and trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{
                    backgroundColor: theme === 'light' ? '#2563EB' : '#3B82F6'
                  }} />
                  <span style={{
                    color: theme === 'light' ? '#111827' : '#F9FAFB'
                  }}>Total Orders</span>
                </div>
                <Badge variant="secondary" style={{
                  backgroundColor: theme === 'light' ? '#F3F4F6' : '#374151',
                  color: theme === 'light' ? '#374151' : '#D1D5DB'
                }}>{analytics.total_orders}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{
                    backgroundColor: theme === 'light' ? '#10B981' : '#34D399'
                  }} />
                  <span style={{
                    color: theme === 'light' ? '#111827' : '#F9FAFB'
                  }}>Orders Today</span>
                </div>
                <Badge variant="secondary" style={{
                  backgroundColor: theme === 'light' ? '#F3F4F6' : '#374151',
                  color: theme === 'light' ? '#374151' : '#D1D5DB'
                }}>{analytics.orders_today}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{
                    backgroundColor: theme === 'light' ? '#F59E0B' : '#FBBF24'
                  }} />
                  <span style={{
                    color: theme === 'light' ? '#111827' : '#F9FAFB'
                  }}>Orders This Week</span>
                </div>
                <Badge variant="secondary" style={{
                  backgroundColor: theme === 'light' ? '#F3F4F6' : '#374151',
                  color: theme === 'light' ? '#374151' : '#D1D5DB'
                }}>{analytics.orders_this_week}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{
                    backgroundColor: theme === 'light' ? '#7C3AED' : '#A78BFA'
                  }} />
                  <span style={{
                    color: theme === 'light' ? '#111827' : '#F9FAFB'
                  }}>Orders This Month</span>
                </div>
                <Badge variant="secondary" style={{
                  backgroundColor: theme === 'light' ? '#F3F4F6' : '#374151',
                  color: theme === 'light' ? '#374151' : '#D1D5DB'
                }}>{analytics.orders_this_month}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Statistics */}
      <Card className="mb-8" style={{
        backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
        borderColor: theme === 'light' ? '#E5E7EB' : '#374151'
      }}>
        <CardHeader>
          <CardTitle style={{
            color: theme === 'light' ? '#111827' : '#F9FAFB'
          }}>Revenue Statistics</CardTitle>
          <CardDescription style={{
            color: theme === 'light' ? '#6B7280' : '#9CA3AF'
          }}>Revenue breakdown by time periods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg" style={{
              borderColor: theme === 'light' ? '#E5E7EB' : '#374151',
              backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937'
            }}>
              <div className="text-sm font-medium" style={{
                color: theme === 'light' ? '#6B7280' : '#9CA3AF'
              }}>Total Revenue</div>
              <div className="text-2xl font-bold" style={{
                color: theme === 'light' ? '#10B981' : '#34D399'
              }}>
                ${analytics.total_revenue.toLocaleString()}
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg" style={{
              borderColor: theme === 'light' ? '#E5E7EB' : '#374151',
              backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937'
            }}>
              <div className="text-sm font-medium" style={{
                color: theme === 'light' ? '#6B7280' : '#9CA3AF'
              }}>Revenue Today</div>
              <div className="text-2xl font-bold" style={{
                color: theme === 'light' ? '#10B981' : '#34D399'
              }}>
                ${analytics.revenue_today.toLocaleString()}
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg" style={{
              borderColor: theme === 'light' ? '#E5E7EB' : '#374151',
              backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937'
            }}>
              <div className="text-sm font-medium" style={{
                color: theme === 'light' ? '#6B7280' : '#9CA3AF'
              }}>Revenue This Week</div>
              <div className="text-2xl font-bold" style={{
                color: theme === 'light' ? '#10B981' : '#34D399'
              }}>
                ${analytics.revenue_this_week.toLocaleString()}
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg" style={{
              borderColor: theme === 'light' ? '#E5E7EB' : '#374151',
              backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937'
            }}>
              <div className="text-sm font-medium" style={{
                color: theme === 'light' ? '#6B7280' : '#9CA3AF'
              }}>Revenue This Month</div>
              <div className="text-2xl font-bold" style={{
                color: theme === 'light' ? '#10B981' : '#34D399'
              }}>
                ${analytics.revenue_this_month.toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Food Statistics */}
      <Card style={{
        backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
        borderColor: theme === 'light' ? '#E5E7EB' : '#374151'
      }}>
        <CardHeader>
          <CardTitle style={{
            color: theme === 'light' ? '#111827' : '#F9FAFB'
          }}>Food Statistics</CardTitle>
          <CardDescription style={{
            color: theme === 'light' ? '#6B7280' : '#9CA3AF'
          }}>Menu items and availability status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg" style={{
              borderColor: theme === 'light' ? '#E5E7EB' : '#374151',
              backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937'
            }}>
              <div className="text-sm font-medium" style={{
                color: theme === 'light' ? '#6B7280' : '#9CA3AF'
              }}>Total Foods</div>
              <div className="text-2xl font-bold" style={{
                color: theme === 'light' ? '#111827' : '#F9FAFB'
              }}>
                {analytics.total_foods}
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg" style={{
              borderColor: theme === 'light' ? '#E5E7EB' : '#374151',
              backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937'
            }}>
              <div className="text-sm font-medium" style={{
                color: theme === 'light' ? '#6B7280' : '#9CA3AF'
              }}>Active Foods</div>
              <div className="text-2xl font-bold" style={{
                color: theme === 'light' ? '#10B981' : '#34D399'
              }}>
                {analytics.active_foods}
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg" style={{
              borderColor: theme === 'light' ? '#E5E7EB' : '#374151',
              backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937'
            }}>
              <div className="text-sm font-medium" style={{
                color: theme === 'light' ? '#6B7280' : '#9CA3AF'
              }}>Inactive Foods</div>
              <div className="text-2xl font-bold" style={{
                color: theme === 'light' ? '#EF4444' : '#F87171'
              }}>
                {analytics.total_foods - analytics.active_foods}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
