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
  Calendar,
  RefreshCw,
  AlertCircle,
  Trash2,
  Utensils,
  Lock
} from "lucide-react";

// Import API types and service
import { 
  BulkOrder, 
  BulkOrderFilters, 
  CollaborationRequest, 
  ChefCollaborator,
} from '@/services/orderService';
import { useOrderService } from '@/hooks/useOrderService';

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
    loadAvailableChefs,
    // Collaboration request helpers
    loadIncomingCollaborationRequests,
    acceptCollaborationRequest,
    rejectCollaborationRequest,
    deleteCollaborationRequest,
    loadOutgoingCollaborationRequests,
    // Bulk workflow
    updateBulkOrderStatus,
    assignDeliveryToBulkOrder,
  } = useOrderService();

  // Helper function to check if order is locked due to event date
  const isOrderLockedByEventDate = (order: BulkOrder): { locked: boolean; message?: string; daysRemaining?: number } => {
    if (!order.event_date || order.event_date === '1970-01-01') {
      return { locked: false };
    }
    
    const today = new Date();
    const eventDate = new Date(order.event_date);
    
    // Normalize dates to avoid time zone issues
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    
    if (eventDate > today) {
      const timeDiff = eventDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
      return {
        locked: true,
        message: `Event is in ${daysRemaining} day(s). Status changes to preparing/completed are locked until ${eventDate.toLocaleDateString()}.`,
        daysRemaining
      };
    }
    
    return { locked: false };
  };

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
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<BulkOrder | null>(null);
  const [availableChefs, setAvailableChefs] = useState<ChefCollaborator[]>([]);
  const [loadingChefs, setLoadingChefs] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [isIncomingDialogOpen, setIsIncomingDialogOpen] = useState(false);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [isOutgoingDialogOpen, setIsOutgoingDialogOpen] = useState(false);
  const [collaborationRequest, setCollaborationRequest] = useState<{
    chef_id: number;
    message: string;
    work_distribution: string;
  }>({ chef_id: 0, message: '', work_distribution: '' });
  const [collaborationError, setCollaborationError] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTargetRequest, setRejectTargetRequest] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetRequest, setDeleteTargetRequest] = useState<any | null>(null);
  
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

  const fetchIncomingRequests = async () => {
    try {
      const reqs = await loadIncomingCollaborationRequests();
      setIncomingRequests(Array.isArray(reqs) ? reqs : []);
    } catch (error) {
      console.error('Error fetching incoming collaboration requests:', error);
      showNotification('Failed to load incoming collaboration requests', 'error');
      setIncomingRequests([]);
    }
  };

  const fetchOutgoingRequests = async () => {
    try {
      const reqs = await loadOutgoingCollaborationRequests();
      setOutgoingRequests(Array.isArray(reqs) ? reqs : []);
    } catch (error) {
      console.error('Error fetching outgoing collaboration requests:', error);
      setOutgoingRequests([]);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchBulkOrders();
    // Also load incoming collaboration requests for this chef
    fetchIncomingRequests();
    // Also load outgoing requests
    (async () => {
      try {
        const out = await loadOutgoingCollaborationRequests();
        setOutgoingRequests(Array.isArray(out) ? out : []);
      } catch (err) {
        console.error('Failed to load outgoing requests', err);
      }
    })();
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
    setCollaborationError(null);
    
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
        setCollaborationError(null);
        await requestCollaboration(selectedOrder, collaborationRequest);
        showNotification('Collaboration request sent successfully', 'success');
        setIsCollaborateDialogOpen(false);
        setSelectedOrder(null);
        setCollaborationRequest({ chef_id: 0, message: '', work_distribution: '' });
        setAvailableChefs([]);
        // Refresh data
        fetchBulkOrders();
      } catch (err: any) {
        console.error('Error requesting collaboration:', err);

        // Prefer backend-provided error message when available
        const backendMessage = err?.response?.data?.error || err?.message || 'Failed to create collaboration request';
        setCollaborationError(backendMessage);
        showNotification(backendMessage, 'error');
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
      case "ready_for_delivery":
        return <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800">Ready for Delivery</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };
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
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsIncomingDialogOpen(true)}
              >
                Incoming Requests ({incomingRequests.length})
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Card className="chef-card">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Bulk Order Queue
            </CardTitle>
            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="collaborating">Collaborating</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready_for_delivery">Ready for Delivery</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
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
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>
              {filteredOrders.length === 0 
                ? "No bulk orders match your filters" 
                : `Showing ${filteredOrders.length} order${filteredOrders.length !== 1 ? 's' : ''}`
              }
            </span>
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
                  <TableHead>Event Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-12 w-12 text-muted-foreground/50" />
                        <p className="text-muted-foreground font-medium">No bulk orders found</p>
                        <p className="text-sm text-muted-foreground/70">
                          {statusFilter !== 'all' ? 'Try adjusting your filters' : 'New orders will appear here'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => {
                    const formatEventDate = (dateStr: string) => {
                      if (!dateStr || dateStr === '1970-01-01') return 'Not specified';
                      try {
                        const date = new Date(dateStr);
                        if (isNaN(date.getTime())) return 'Invalid date';
                        return date.toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        });
                      } catch {
                        return 'Invalid date';
                      }
                    };

                    return (
                      <TableRow 
                        key={order.id} 
                        className="hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedOrderDetails(order);
                          setIsDetailDialogOpen(true);
                        }}
                      >
                        <TableCell className="font-mono text-sm font-semibold">
                          {order.order_number}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-bold text-sm border-2 border-primary/20">
                              {order.customer_name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className="font-medium">{order.customer_name || 'Unknown'}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Badge variant="outline" className="capitalize text-xs px-1.5 py-0">
                                  {order.event_type || 'General'}
                                </Badge>
                                {order.total_quantity > 0 && (
                                  <span className="flex items-center gap-0.5">
                                    <Users className="h-3 w-3" />
                                    {order.total_quantity}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const lockInfo = isOrderLockedByEventDate(order);
                            return (
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{formatEventDate(order.event_date)}</span>
                                {lockInfo.locked && (
                                  <div className="flex items-center gap-1">
                                    <Lock className="h-3 w-3 text-amber-600" />
                                    <span className="text-xs text-amber-600 font-medium">
                                      {lockInfo.daysRemaining}d
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-green-600">
                            <span className="text-xs text-muted-foreground mr-1">LKR</span>
                            {Number(order.total_amount || 0).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrderDetails(order);
                              setIsDetailDialogOpen(true);
                            }}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          {selectedOrderDetails && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Package className="h-5 w-5 text-primary" />
                  {selectedOrderDetails.order_number}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="flex items-start justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary font-bold text-lg border-2 border-primary/30">
                      {selectedOrderDetails.customer_name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{selectedOrderDetails.customer_name || 'Unknown Customer'}</div>
                      <div className="text-sm text-muted-foreground">Order placed {new Date(selectedOrderDetails.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  {getStatusBadge(selectedOrderDetails.status)}
                </div>

                {/* Event Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Event Type</div>
                    <Badge variant="outline" className="capitalize">
                      {selectedOrderDetails.event_type || 'General'}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Event Date</div>
                    <div className="flex items-center gap-1 font-medium">
                      <Calendar className="h-4 w-4 text-primary" />
                      {selectedOrderDetails.event_date && selectedOrderDetails.event_date !== '1970-01-01' 
                        ? new Date(selectedOrderDetails.event_date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })
                        : 'Not specified'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Number of Guests</div>
                    <div className="flex items-center gap-1 font-medium">
                      <Users className="h-4 w-4 text-blue-600" />
                      {selectedOrderDetails.total_quantity > 0 ? selectedOrderDetails.total_quantity : 'Not specified'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Total Amount</div>
                    <div className="font-bold text-green-600 text-xl">
                      <span className="text-sm text-muted-foreground mr-1.5">LKR</span>
                      {Number(selectedOrderDetails.total_amount || 0).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedOrderDetails.description && (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-muted-foreground">Order Description</div>
                    <div className="p-3 bg-muted/50 rounded-lg text-sm">
                      {selectedOrderDetails.description}
                    </div>
                  </div>
                )}

                {/* Menu Items */}
                {selectedOrderDetails.items && selectedOrderDetails.items.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <Utensils className="h-4 w-4" />
                      Menu Items ({selectedOrderDetails.items.length})
                    </div>
                    <div className="space-y-2">
                      {selectedOrderDetails.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                            <span className="font-medium">{item.food_name}</span>
                          </div>
                          {item.special_instructions && (
                            <span className="text-xs text-muted-foreground italic">{item.special_instructions}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Collaborators */}
                {selectedOrderDetails.collaborators && selectedOrderDetails.collaborators.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Collaborating Chefs ({selectedOrderDetails.collaborators.length})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedOrderDetails.collaborators.map((collab, index) => (
                        <Badge key={index} variant="secondary" className="px-3 py-1">
                          {collab.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-4 border-t">
                  {selectedOrderDetails.status === 'pending' && (
                    <>
                      <Button 
                        onClick={() => {
                          handleAcceptOrder(selectedOrderDetails.id);
                          setIsDetailDialogOpen(false);
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        size="lg"
                      >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Accept Order
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setSelectedOrder(selectedOrderDetails.id);
                          setIsDetailDialogOpen(false);
                          handleCollaborate(selectedOrderDetails.id);
                        }}
                        className="flex-1 border-purple-200 text-purple-600 hover:bg-purple-50"
                        size="lg"
                      >
                        <Users className="h-5 w-5 mr-2" />
                        Request Collaboration
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => {
                          handleDeclineOrder(selectedOrderDetails.id);
                          setIsDetailDialogOpen(false);
                        }}
                        size="lg"
                      >
                        <XCircle className="h-5 w-5 mr-2" />
                        Decline
                      </Button>
                    </>
                  )}

                  {/* Bulk order kitchen workflow actions */}
                  {(selectedOrderDetails && (selectedOrderDetails.status === 'confirmed' || selectedOrderDetails.status === 'collaborating')) && (() => {
                    const lockInfo = isOrderLockedByEventDate(selectedOrderDetails);
                    return (
                      <div className="flex flex-col gap-2">
                        {lockInfo.locked && (
                          <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
                            <AlertCircle className="h-4 w-4" />
                            {lockInfo.message}
                          </div>
                        )}
                        <Button
                          onClick={async () => {
                            try {
                              await updateBulkOrderStatus(selectedOrderDetails.id, 'preparing');
                              showNotification('Bulk order marked as preparing', 'success');
                              // Close the detail dialog automatically on success
                              setIsDetailDialogOpen(false);
                              // Refresh lists after closing
                              fetchBulkOrders();
                              fetchIncomingRequests();
                            } catch (error: any) {
                              console.error('Error starting preparation:', error);
                              const msg = error?.message || error?.response?.data?.error || 'Failed to start preparing';
                              showNotification(msg, 'error');
                            }
                          }}
                          disabled={lockInfo.locked}
                          className={`${lockInfo.locked ? 'bg-gray-400 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600'} text-white`}
                          size="lg"
                        >
                          {lockInfo.locked ? (
                            <>
                              <AlertCircle className="h-5 w-5 mr-2" />
                              Locked ({lockInfo.daysRemaining} day{lockInfo.daysRemaining !== 1 ? 's' : ''} left)
                            </>
                          ) : (
                            <>
                              <Utensils className="h-5 w-5 mr-2" />
                              Start Preparing
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })()}

                  {selectedOrderDetails.status === 'preparing' && (
                    <>
                      {(selectedOrderDetails as any).order_type === 'delivery' && (
                        <Button
                          onClick={async () => {
                            try {
                              await assignDeliveryToBulkOrder(selectedOrderDetails.id);
                              showNotification('Delivery assigned / sent for delivery', 'success');
                              // Close dialog on success
                              setIsDetailDialogOpen(false);
                              fetchBulkOrders();
                              fetchIncomingRequests();
                            } catch (error: any) {
                              console.error('Error assigning delivery:', error);
                              const msg = error?.message || error?.response?.data?.error || 'Failed to assign delivery';
                              showNotification(msg, 'error');
                            }
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          size="lg"
                        >
                          Send for Delivery
                        </Button>
                      )}
                        {(() => {
                          const lockInfo = isOrderLockedByEventDate(selectedOrderDetails);
                          return (
                            <div className="flex flex-col gap-2">
                              {lockInfo.locked && (
                                <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
                                  <AlertCircle className="h-4 w-4" />
                                  {lockInfo.message}
                                </div>
                              )}
                              <Button
                                onClick={async () => {
                                  try {
                                    // Mark order as ready for delivery (chef completed kitchen work)
                                    await updateBulkOrderStatus(selectedOrderDetails.id, 'ready_for_delivery');
                                    showNotification('Bulk order marked as ready for delivery', 'success');
                                    // Close dialog on success
                                    setIsDetailDialogOpen(false);
                                    fetchBulkOrders();
                                    fetchIncomingRequests();
                                  } catch (error: any) {
                                    console.error('Error marking completed:', error);
                                    const msg = error?.message || error?.response?.data?.error || 'Failed to mark completed';
                                    showNotification(msg, 'error');
                                  }
                                }}
                                disabled={lockInfo.locked}
                                className={`${lockInfo.locked ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-700 hover:bg-green-800'} text-white`}
                                size="lg"
                              >
                                {lockInfo.locked ? (
                                  <>
                                    <AlertCircle className="h-5 w-5 mr-2" />
                                    Locked ({lockInfo.daysRemaining} day{lockInfo.daysRemaining !== 1 ? 's' : ''} left)
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-5 w-5 mr-2" />
                                    Mark Completed
                                  </>
                                )}
                              </Button>
                            </div>
                          );
                        })()}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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
                <>
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
                  {/* show form-level error returned from backend */}
                  {collaborationError && (
                    <div className="text-sm text-red-700 bg-red-50 border border-red-100 p-2 rounded mt-2">
                      {collaborationError}
                    </div>
                  )}
                </>
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
                  setCollaborationError(null);
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

      {/* Incoming Collaboration Requests Dialog */}
      <Dialog open={isIncomingDialogOpen} onOpenChange={setIsIncomingDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Incoming Collaboration Requests</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {incomingRequests.length === 0 ? (
              <div className="text-center text-muted-foreground py-6">No incoming collaboration requests</div>
            ) : (
              incomingRequests.map((req: any) => (
                <div key={req.request_id} className="p-3 bg-muted/50 rounded-md flex items-start justify-between">
                  <div>
                    <div className="font-medium">{req.from_user?.name || 'Unknown'}</div>
                    <div className="text-sm text-muted-foreground">Bulk: {req.bulk_order?.order_number || 'N/A'}</div>
                    <div className="mt-2 text-sm">{req.message}</div>
                    {req.work_distribution && (<div className="mt-1 text-xs text-muted-foreground italic">{req.work_distribution}</div>)}
                    {req.status && (
                      <div className="mt-2">
                        <Badge variant={req.status === 'pending' ? 'secondary' : req.status === 'accepted' ? 'default' : 'destructive'}>
                          {req.status?.toString().toUpperCase()}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-sm text-muted-foreground">{new Date(req.created_at).toLocaleString()}</div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={req.status && req.status !== 'pending'}
                        onClick={async () => {
                          try {
                            await acceptCollaborationRequest(req.request_id);
                            showNotification('Collaboration accepted', 'success');
                            // refresh lists
                            fetchIncomingRequests();
                            fetchBulkOrders();
                          } catch (error: any) {
                            console.error('Error accepting collaboration request:', error);
                            // Prefer backend message when available
                            const msg = error?.message || error?.response?.data?.error || 'Failed to accept request';
                            showNotification(msg, 'error');
                          }
                        }}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={req.status && req.status !== 'pending'}
                        onClick={async () => {
                          // Open reject modal instead of prompt
                          setRejectTargetRequest(req);
                          setRejectReason('');
                          setRejectDialogOpen(true);
                        }}
                      >
                        Reject
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 p-2"
                        onClick={() => {
                          setDeleteTargetRequest(req);
                          setDeleteDialogOpen(true);
                        }}
                        aria-label="Delete collaboration request"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reject Collaboration Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">Provide a reason for rejecting this collaboration request (optional). The requester will see this.</div>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Type rejection reason (optional)..."
              rows={4}
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setRejectDialogOpen(false); setRejectTargetRequest(null); setRejectReason(''); }}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!rejectTargetRequest) return;
                  try {
                    await rejectCollaborationRequest(rejectTargetRequest.request_id, rejectReason || '');
                    showNotification('Collaboration request rejected', 'info');
                    setRejectDialogOpen(false);
                    setRejectTargetRequest(null);
                    setRejectReason('');
                    fetchIncomingRequests();
                    fetchBulkOrders();
                  } catch (error: any) {
                    console.error('Error rejecting collaboration request:', error);
                    const msg = error?.message || error?.response?.data?.error || 'Failed to reject request';
                    showNotification(msg, 'error');
                  }
                }}
              >
                Send Rejection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Delete Collaboration Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">Are you sure you want to permanently delete this collaboration request? This action cannot be undone.</div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setDeleteTargetRequest(null); }}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!deleteTargetRequest) return;
                  try {
                    await deleteCollaborationRequest(deleteTargetRequest.request_id);
                    showNotification('Collaboration request deleted', 'info');
                    setDeleteDialogOpen(false);
                    setDeleteTargetRequest(null);
                    fetchIncomingRequests();
                    fetchOutgoingRequests();
                    fetchBulkOrders();
                  } catch (error: any) {
                    console.error('Error deleting collaboration request:', error);
                    const msg = error?.message || error?.response?.data?.error || 'Failed to delete request';
                    showNotification(msg, 'error');
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
