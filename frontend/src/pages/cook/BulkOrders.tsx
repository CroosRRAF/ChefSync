import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  Users,
  Package,
  DollarSign,
  Calendar,
  RefreshCw,
  AlertCircle
} from "lucide-react";

// Import API types and service
import { 
  BulkOrder, 
  BulkOrderFilters, 
  CollaborationRequest, 
  ChefCollaborator,
  useOrderService
} from '@/services/orderService';

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

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg ${
      type === 'success' ? 'bg-green-100 text-green-800 border-green-200' :
      type === 'error' ? 'bg-red-100 text-red-800 border-red-200' :
      'bg-blue-100 text-blue-800 border-blue-200'
    } border`}>
      <div className="flex items-center gap-2">
        {type === 'success' && <CheckCircle className="h-4 w-4" />}
        {type === 'error' && <AlertCircle className="h-4 w-4" />}
        {type === 'info' && <AlertCircle className="h-4 w-4" />}
        {message}
        <button onClick={onClose} className="ml-2 text-lg">&times;</button>
      </div>
    </div>
  );
};

export default function BulkOrders() {
  // API Integration
  const {
    loadBulkOrders,
    loadBulkOrderStats,
    acceptBulkOrder,
    declineBulkOrder,
    requestCollaboration,
    loadAvailableChefs
  } = useOrderService();

  // State management
  const [bulkOrders, setBulkOrders] = useState<BulkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Stats state
  const [stats, setStats] = useState({
    pending: 0,
    accepted: 0,
    collaborating: 0,
    total_revenue: '0.00'
  });
  
  // Dialog state
  const [isCollaborateDialogOpen, setIsCollaborateDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [availableChefs, setAvailableChefs] = useState<ChefCollaborator[]>([]);
  const [loadingChefs, setLoadingChefs] = useState(false);
  const [collaborationRequest, setCollaborationRequest] = useState<{
    chef_id: number;
    message: string;
    work_distribution: string;
  }>({ chef_id: 0, message: '', work_distribution: '' });
  
  // Notification state
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: '',
    type: 'info'
  });

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ show: true, message, type });
  };

  // Load data from API
  const fetchBulkOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: BulkOrderFilters = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      if (searchTerm) {
        filters.search = searchTerm;
      }
      
      const orders = await loadBulkOrders(filters);
      console.log('Loaded bulk orders:', orders); // Debug log
      
      // Ensure orders is always an array
      const ordersArray = Array.isArray(orders) ? orders : [];
      setBulkOrders(ordersArray);
      
      // Load stats
      const statsData = await loadBulkOrderStats();
      setStats(statsData);
      
      showNotification(`Loaded ${ordersArray.length} bulk orders`, 'success');
      
    } catch (error) {
      console.error('Error fetching bulk orders:', error);
      setError('Failed to load bulk orders');
      showNotification('Failed to load bulk orders', 'error');
      setBulkOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchBulkOrders();
  }, [statusFilter]); // Re-fetch when status filter changes

  // Search with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length >= 3 || searchTerm.length === 0) {
        fetchBulkOrders();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Client-side filtering for immediate feedback
  const filteredOrders = (bulkOrders || []).filter(order =>
    order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.event_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // API-integrated handler functions
  const handleAcceptOrder = async (orderId: number) => {
    try {
      await acceptBulkOrder(orderId, 'Order accepted by chef');
      showNotification('Bulk order accepted successfully', 'success');
      // Refresh data
      fetchBulkOrders();
    } catch (error) {
      console.error('Error accepting order:', error);
      showNotification('Failed to accept order', 'error');
    }
  };

  const handleDeclineOrder = async (orderId: number) => {
    try {
      await declineBulkOrder(orderId, 'Order declined by chef');
      showNotification('Bulk order declined', 'info');
      // Refresh data
      fetchBulkOrders();
    } catch (error) {
      console.error('Error declining order:', error);
      showNotification('Failed to decline order', 'error');
    }
  };

  const handleCollaborate = async (orderId: number) => {
    setSelectedOrder(orderId);
    setIsCollaborateDialogOpen(true);
    
    // Load available chefs when dialog opens
    setLoadingChefs(true);
    try {
      const chefs = await loadAvailableChefs();
      setAvailableChefs(chefs);
    } catch (error) {
      console.error('Error loading available chefs:', error);
      showNotification('Failed to load available chefs', 'error');
      setAvailableChefs([]);
    } finally {
      setLoadingChefs(false);
    }
  };

  const handleSubmitCollaboration = async (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedOrder && collaborationRequest.chef_id && collaborationRequest.message) {
      try {
        await requestCollaboration(selectedOrder, collaborationRequest);
        showNotification('Collaboration request sent successfully', 'success');
        setIsCollaborateDialogOpen(false);
        setSelectedOrder(null);
        setCollaborationRequest({ chef_id: 0, message: '', work_distribution: '' });
        setAvailableChefs([]);
        // Refresh data
        fetchBulkOrders();
      } catch (error) {
        console.error('Error requesting collaboration:', error);
        showNotification('Failed to send collaboration request', 'error');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "accepted":
        return <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800">Accepted</Badge>;
      case "declined":
        return <Badge variant="destructive">Declined</Badge>;
      case "collaborating":
        return <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800">Collaborating</Badge>;
      case "preparing":
        return <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800">Preparing</Badge>;
      case "completed":
        return <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Calculate counts from API stats (with fallback to client-side calculation)
  const pendingCount = stats.pending || filteredOrders.filter(order => order.status === "pending").length;
  const acceptedCount = stats.accepted || filteredOrders.filter(order => order.status === "accepted").length;
  const collaboratingCount = stats.collaborating || filteredOrders.filter(order => order.status === "collaborating").length;

  return (
    <div className="p-6 space-y-6">
      {/* Notification */}
      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification(prev => ({ ...prev, show: false }))}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bulk Orders</h1>
          <p className="text-muted-foreground mt-1">
            {error ? '⚠️ ' + error : 'Manage large catering and event orders'}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBulkOrders}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{acceptedCount}</div>
              <div className="text-sm text-muted-foreground">Accepted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{collaboratingCount}</div>
              <div className="text-sm text-muted-foreground">Collaborating</div>
            </div>
          </div>
        </div>
      </div>

      <Card className="chef-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Bulk Order Queue
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search bulk orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            // Loading skeleton
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="animate-pulse flex space-x-4 p-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Event Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Collaborators</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No bulk orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>{order.customer_name}</TableCell>
                      <TableCell>{order.event_type}</TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {order.items.slice(0, 2).map((item, index) => (
                            <span key={index} className="block text-sm">
                              {item.food_name}
                            </span>
                          ))}
                          {order.items.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{order.items.length - 2} more
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.total_quantity} servings</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {parseFloat(order.total_amount).toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(order.event_date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        {order.collaborators && order.collaborators.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span className="text-sm">{order.collaborators.map(c => c.name).join(", ")}</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {order.status === "pending" && (
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleCollaborate(order.id)}
                              disabled={loading}
                              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            >
                              <Users className="h-4 w-4 mr-1" />
                              Collaborate
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAcceptOrder(order.id)}
                              disabled={loading}
                              className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeclineOrder(order.id)}
                              disabled={loading}
                              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Collaboration Dialog */}
      <Dialog open={isCollaborateDialogOpen} onOpenChange={setIsCollaborateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Collaborate on Bulk Order</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitCollaboration} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chef_id">Select Chef to Collaborate With</Label>
              {loadingChefs ? (
                <div className="flex items-center justify-center py-4">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Loading available chefs...
                </div>
              ) : (
                <Select 
                  value={collaborationRequest.chef_id ? collaborationRequest.chef_id.toString() : ''} 
                  onValueChange={(value) => setCollaborationRequest(prev => ({ 
                    ...prev, 
                    chef_id: parseInt(value) 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a chef to collaborate with" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableChefs.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No chefs available for collaboration
                      </SelectItem>
                    ) : (
                      availableChefs.map((chef) => (
                        <SelectItem key={chef.id} value={chef.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex flex-col">
                              <span className="font-medium">{chef.name}</span>
                              <span className="text-xs text-muted-foreground">
                                @{chef.username} • {chef.active_assignments || 0} active orders
                              </span>
                            </div>
                            <Badge 
                              variant={chef.availability_status === 'available' ? 'default' : 'secondary'}
                              className="ml-2"
                            >
                              {chef.availability_status || 'available'}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Collaboration Message</Label>
              <Textarea 
                id="message" 
                placeholder="Describe how you'd like to collaborate on this order..." 
                value={collaborationRequest.message}
                onChange={(e) => setCollaborationRequest(prev => ({ 
                  ...prev, 
                  message: e.target.value 
                }))}
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="work_distribution">Work Distribution</Label>
              <Textarea 
                id="work_distribution" 
                placeholder="Describe how the work will be split..." 
                value={collaborationRequest.work_distribution}
                onChange={(e) => setCollaborationRequest(prev => ({ 
                  ...prev, 
                  work_distribution: e.target.value 
                }))}
                required 
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsCollaborateDialogOpen(false);
                  setCollaborationRequest({ chef_id: 0, message: '', work_distribution: '' });
                  setAvailableChefs([]);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={loading || !collaborationRequest.chef_id || !collaborationRequest.message}
              >
                {loading ? 'Sending...' : 'Send Collaboration Request'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
