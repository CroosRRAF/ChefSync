import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useUserStore } from '@/store/userStore';
import { apiClient } from '@/utils/fetcher';
import { 
  ChefHat, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Timer,
  Flame,
  Thermometer,
  Scale
} from 'lucide-react';

interface KitchenItem {
  id: string;
  name: string;
  status: 'preparing' | 'ready' | 'served';
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number;
  actualTime: number;
  temperature?: number;
  notes?: string;
}

const CookKitchen: React.FC = () => {
  const { user } = useUserStore();
  const [kitchenItems, setKitchenItems] = useState<KitchenItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeOrders, setActiveOrders] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);

  useEffect(() => {
    fetchKitchenData();
  }, []);

  const fetchKitchenData = async () => {
    try {
      setIsLoading(true);
      // Fetch kitchen orders and items
      const response = await apiClient.get('/cook/kitchen/');
      setKitchenItems(response.items || []);
      setActiveOrders(response.activeOrders || 0);
      setCompletedToday(response.completedToday || 0);
    } catch (error) {
      console.error('Error fetching kitchen data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateItemStatus = async (itemId: string, newStatus: KitchenItem['status']) => {
    try {
      await apiClient.patch(`/cook/kitchen/${itemId}/`, { status: newStatus });
      setKitchenItems(prev => 
        prev.map(item => 
          item.id === itemId ? { ...item, status: newStatus } : item
        )
      );
    } catch (error) {
      console.error('Error updating item status:', error);
    }
  };

  const getStatusColor = (status: KitchenItem['status']) => {
    switch (status) {
      case 'preparing': return 'bg-yellow-500';
      case 'ready': return 'bg-green-500';
      case 'served': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: KitchenItem['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gradient-primary mb-2">
          Kitchen Management
        </h1>
        <p className="text-muted-foreground">
          Manage your kitchen operations and monitor food preparation
        </p>
      </div>

      {/* Kitchen Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeOrders}</div>
            <p className="text-xs text-muted-foreground">
              Currently being prepared
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedToday}</div>
            <p className="text-xs text-muted-foreground">
              Orders completed today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kitchen Status</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">
              Kitchen is operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Kitchen Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kitchenItems.map((item) => (
          <Card key={item.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{item.name}</CardTitle>
                <div className="flex space-x-2">
                  <Badge 
                    variant="secondary" 
                    className={`${getStatusColor(item.status)} text-white`}
                  >
                    {item.status}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={`${getPriorityColor(item.priority)} text-white`}
                  >
                    {item.priority}
                  </Badge>
                </div>
              </div>
              <CardDescription>
                Order #{item.id.slice(-6)}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Time Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Time
                  </span>
                  <span>{item.actualTime}/{item.estimatedTime} min</span>
                </div>
                <Progress 
                  value={(item.actualTime / item.estimatedTime) * 100} 
                  className="h-2"
                />
              </div>

              {/* Temperature and Notes */}
              {item.temperature && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Thermometer className="h-4 w-4 mr-2" />
                  {item.temperature}°C
                </div>
              )}

              {item.notes && (
                <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                  {item.notes}
                </div>
              )}

              <Separator />

              {/* Action Buttons */}
              <div className="flex space-x-2">
                {item.status === 'preparing' && (
                  <>
                    <Button 
                      size="sm" 
                      onClick={() => updateItemStatus(item.id, 'ready')}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark Ready
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateItemStatus(item.id, 'served')}
                    >
                      <Timer className="h-4 w-4 mr-1" />
                      Served
                    </Button>
                  </>
                )}
                
                {item.status === 'ready' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => updateItemStatus(item.id, 'served')}
                    className="w-full"
                  >
                    <Timer className="h-4 w-4 mr-1" />
                    Mark as Served
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {kitchenItems.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <ChefHat className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Kitchen Items</h3>
            <p className="text-muted-foreground mb-4">
              Your kitchen is currently empty. New orders will appear here.
            </p>
            <Button onClick={fetchKitchenData}>
              Refresh Kitchen
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CookKitchen;
