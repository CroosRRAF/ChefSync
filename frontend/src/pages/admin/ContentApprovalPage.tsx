import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Utensils,
  Package,
  ChefHat,
  Filter,
  Search,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '@/services/adminService';

// Interfaces
interface FoodItem {
  food_id: number;
  name: string;
  description: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  chef: any;
  chef_name?: string;
  category_name?: string;
  is_available: boolean;
  prices: any[];
  min_price?: number;
  max_price?: number;
  image_url?: string;
  created_at: string;
}

interface BulkMenu {
  id: number;
  menu_name: string;
  description: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  chef: any;
  chef_name?: string;
  meal_type: string;
  base_price_per_person: number;
  min_persons: number;
  max_persons: number;
  availability_status: boolean;
  image_url?: string;
  items_count?: number;
  created_at: string;
}

const ContentApprovalPage: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<'food' | 'bulk'>('food');
  const [loading, setLoading] = useState(false);
  
  // Food states
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [foodFilter, setFoodFilter] = useState<'Pending' | 'Approved' | 'Rejected' | 'all'>('all');
  const [foodSearch, setFoodSearch] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [showFoodDialog, setShowFoodDialog] = useState(false);
  const [showRejectFoodDialog, setShowRejectFoodDialog] = useState(false);
  const [foodRejectionReason, setFoodRejectionReason] = useState('');
  
  // Bulk menu states
  const [bulkMenus, setBulkMenus] = useState<BulkMenu[]>([]);
  const [bulkMenuFilter, setBulkMenuFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('all');
  const [bulkMenuSearch, setBulkMenuSearch] = useState('');
  const [selectedBulkMenu, setSelectedBulkMenu] = useState<BulkMenu | null>(null);
  const [showBulkMenuDialog, setShowBulkMenuDialog] = useState(false);
  const [showRejectBulkMenuDialog, setShowRejectBulkMenuDialog] = useState(false);
  const [bulkMenuRejectionReason, setBulkMenuRejectionReason] = useState('');

  // Load foods
  const loadFoods = async (status?: string) => {
    try {
      setLoading(true);
      console.log('📊 Loading foods with status:', status);
      console.log('🔐 User is_staff check:', localStorage.getItem('is_staff'));
      console.log('🔑 Auth token exists:', !!localStorage.getItem('access_token'));
      
      const response = await adminService.getAllFoods(status);
      console.log('✅ Food API Response:', response);
      console.log('📦 Response type:', typeof response, Array.isArray(response) ? 'Array' : 'Object');
      console.log('📦 Food items count:', Array.isArray(response) ? response.length : response.results?.length || 0);
      
      const foodsData = Array.isArray(response) ? response : response.results || [];
      console.log('🍽️ Foods data length:', foodsData.length);
      console.log('🍽️ First 3 foods:', foodsData.slice(0, 3));
      setFoods(foodsData);
      
      if (foodsData.length === 0) {
        console.warn('⚠️ No food items found for status:', status);
        console.warn('⚠️ Try loading ALL foods by removing the filter');
      }
    } catch (error) {
      console.error('❌ Error loading foods:', error);
      console.error('❌ Error response:', (error as any)?.response);
      console.error('❌ Error status:', (error as any)?.response?.status);
      console.error('❌ Error data:', (error as any)?.response?.data);
      toast.error('Failed to load food items: ' + ((error as any)?.response?.data?.detail || (error as any)?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Load bulk menus
  const loadBulkMenus = async (approvalStatus?: string) => {
    try {
      setLoading(true);
      const response = await adminService.getAllBulkMenus(approvalStatus);
      setBulkMenus(Array.isArray(response) ? response : response.results || []);
    } catch (error) {
      console.error('Error loading bulk menus:', error);
      toast.error('Failed to load bulk menus');
    } finally {
      setLoading(false);
    }
  };

  // Approve food
  const handleApproveFood = async (foodId: number) => {
    try {
      await adminService.approveFoodItem(foodId);
      toast.success('Food item approved successfully!');
      loadFoods(foodFilter === 'all' ? undefined : foodFilter);
      setShowFoodDialog(false);
    } catch (error) {
      console.error('Error approving food:', error);
      toast.error('Failed to approve food item');
    }
  };

  // Reject food
  const handleRejectFood = async () => {
    if (!selectedFood || !foodRejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      await adminService.rejectFoodItem(selectedFood.food_id, foodRejectionReason);
      toast.success('Food item rejected');
      loadFoods(foodFilter === 'all' ? undefined : foodFilter);
      setShowRejectFoodDialog(false);
      setShowFoodDialog(false);
      setFoodRejectionReason('');
    } catch (error) {
      console.error('Error rejecting food:', error);
      toast.error('Failed to reject food item');
    }
  };

  // Approve bulk menu
  const handleApproveBulkMenu = async (menuId: number) => {
    try {
      await adminService.approveBulkMenu(menuId);
      toast.success('Bulk menu approved successfully!');
      loadBulkMenus(bulkMenuFilter === 'all' ? undefined : bulkMenuFilter);
      setShowBulkMenuDialog(false);
    } catch (error) {
      console.error('Error approving bulk menu:', error);
      toast.error('Failed to approve bulk menu');
    }
  };

  // Reject bulk menu
  const handleRejectBulkMenu = async () => {
    if (!selectedBulkMenu || !bulkMenuRejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      await adminService.rejectBulkMenu(selectedBulkMenu.id, bulkMenuRejectionReason);
      toast.success('Bulk menu rejected');
      loadBulkMenus(bulkMenuFilter === 'all' ? undefined : bulkMenuFilter);
      setShowRejectBulkMenuDialog(false);
      setShowBulkMenuDialog(false);
      setBulkMenuRejectionReason('');
    } catch (error) {
      console.error('Error rejecting bulk menu:', error);
      toast.error('Failed to reject bulk menu');
    }
  };

  // Load data on mount and filter change
  useEffect(() => {
    if (activeTab === 'food') {
      loadFoods(foodFilter === 'all' ? undefined : foodFilter);
    }
  }, [activeTab, foodFilter]);

  useEffect(() => {
    if (activeTab === 'bulk') {
      loadBulkMenus(bulkMenuFilter === 'all' ? undefined : bulkMenuFilter);
    }
  }, [activeTab, bulkMenuFilter]);

  // Filter foods by search
  const filteredFoods = foods.filter(food =>
    food.name.toLowerCase().includes(foodSearch.toLowerCase()) ||
    food.chef_name?.toLowerCase().includes(foodSearch.toLowerCase())
  );

  // Filter bulk menus by search
  const filteredBulkMenus = bulkMenus.filter(menu =>
    menu.menu_name.toLowerCase().includes(bulkMenuSearch.toLowerCase()) ||
    menu.chef_name?.toLowerCase().includes(bulkMenuSearch.toLowerCase())
  );

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      Approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      Rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Stats
  const foodStats = {
    pending: foods.filter(f => f.status === 'Pending').length,
    approved: foods.filter(f => f.status === 'Approved').length,
    rejected: foods.filter(f => f.status === 'Rejected').length,
  };

  const bulkMenuStats = {
    pending: bulkMenus.filter(m => m.approval_status === 'pending').length,
    approved: bulkMenus.filter(m => m.approval_status === 'approved').length,
    rejected: bulkMenus.filter(m => m.approval_status === 'rejected').length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Content Approval</h1>
        <p className="text-muted-foreground mt-2">
          Review and approve chef-submitted food items and bulk menus
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'food' | 'bulk')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="food" className="flex items-center gap-2">
            <Utensils className="h-4 w-4" />
            Food Items
            {foodStats.pending > 0 && (
              <Badge variant="destructive" className="ml-2">{foodStats.pending}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Bulk Menus
            {bulkMenuStats.pending > 0 && (
              <Badge variant="destructive" className="ml-2">{bulkMenuStats.pending}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Food Items Tab */}
        <TabsContent value="food" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  Pending Approval
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{foodStats.pending}</div>
                <p className="text-xs text-muted-foreground">Awaiting review</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Approved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{foodStats.approved}</div>
                <p className="text-xs text-muted-foreground">Visible to customers</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Rejected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{foodStats.rejected}</div>
                <p className="text-xs text-muted-foreground">Not visible</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Food Items</CardTitle>
              <CardDescription>Review and manage food item submissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or chef..."
                      value={foodSearch}
                      onChange={(e) => setFoodSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select
                  value={foodFilter}
                  onValueChange={(v) => setFoodFilter(v as any)}
                >
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => loadFoods(foodFilter === 'all' ? undefined : foodFilter)}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              {/* Food Items Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Food Item</TableHead>
                      <TableHead>Chef</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price Range</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Loading...</p>
                        </TableCell>
                      </TableRow>
                    ) : filteredFoods.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <AlertCircle className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">No food items found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFoods.map((food) => (
                        <TableRow key={food.food_id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {food.image_url && (
                                <img
                                  src={food.image_url}
                                  alt={food.name}
                                  className="h-10 w-10 rounded object-cover"
                                />
                              )}
                              <div>
                                <div className="font-medium">{food.name}</div>
                                <div className="text-sm text-muted-foreground line-clamp-1">
                                  {food.description}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <ChefHat className="h-4 w-4 text-muted-foreground" />
                              {food.chef_name || 'Unknown'}
                            </div>
                          </TableCell>
                          <TableCell>{food.category_name || '-'}</TableCell>
                          <TableCell>
                            {food.min_price && food.max_price ? (
                              <span>LKR {food.min_price} - {food.max_price}</span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(food.status)}</TableCell>
                          <TableCell>
                            {new Date(food.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedFood(food);
                                setShowFoodDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Menus Tab */}
        <TabsContent value="bulk" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  Pending Approval
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bulkMenuStats.pending}</div>
                <p className="text-xs text-muted-foreground">Awaiting review</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Approved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bulkMenuStats.approved}</div>
                <p className="text-xs text-muted-foreground">Visible to customers</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Rejected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bulkMenuStats.rejected}</div>
                <p className="text-xs text-muted-foreground">Not visible</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Bulk Menus</CardTitle>
              <CardDescription>Review and manage bulk menu submissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by menu name or chef..."
                      value={bulkMenuSearch}
                      onChange={(e) => setBulkMenuSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select
                  value={bulkMenuFilter}
                  onValueChange={(v) => setBulkMenuFilter(v as any)}
                >
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => loadBulkMenus(bulkMenuFilter === 'all' ? undefined : bulkMenuFilter)}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              {/* Bulk Menus Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Menu Name</TableHead>
                      <TableHead>Chef</TableHead>
                      <TableHead>Meal Type</TableHead>
                      <TableHead>Price/Person</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Loading...</p>
                        </TableCell>
                      </TableRow>
                    ) : filteredBulkMenus.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <AlertCircle className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">No bulk menus found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBulkMenus.map((menu) => (
                        <TableRow key={menu.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {menu.image_url && (
                                <img
                                  src={menu.image_url}
                                  alt={menu.menu_name}
                                  className="h-10 w-10 rounded object-cover"
                                />
                              )}
                              <div>
                                <div className="font-medium">{menu.menu_name}</div>
                                <div className="text-sm text-muted-foreground line-clamp-1">
                                  {menu.description}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <ChefHat className="h-4 w-4 text-muted-foreground" />
                              {menu.chef_name || 'Unknown'}
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">{menu.meal_type}</TableCell>
                          <TableCell>LKR {menu.base_price_per_person}</TableCell>
                          <TableCell>
                            {menu.min_persons}-{menu.max_persons} persons
                          </TableCell>
                          <TableCell>{menu.items_count || 0} items</TableCell>
                          <TableCell>{getStatusBadge(menu.approval_status)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedBulkMenu(menu);
                                setShowBulkMenuDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Food Review Dialog */}
      <Dialog open={showFoodDialog} onOpenChange={setShowFoodDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Food Item</DialogTitle>
            <DialogDescription>
              Review the food item details and approve or reject the submission
            </DialogDescription>
          </DialogHeader>
          {selectedFood && (
            <div className="space-y-4">
              {selectedFood.image_url && (
                <img
                  src={selectedFood.image_url}
                  alt={selectedFood.name}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              <div>
                <h3 className="font-semibold text-lg">{selectedFood.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{selectedFood.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Chef</Label>
                  <p className="font-medium">{selectedFood.chef_name || 'Unknown'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Category</Label>
                  <p className="font-medium">{selectedFood.category_name || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Price Range</Label>
                  <p className="font-medium">
                    {selectedFood.min_price && selectedFood.max_price
                      ? `LKR ${selectedFood.min_price} - ${selectedFood.max_price}`
                      : '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedFood.status)}</div>
                </div>
              </div>
              {selectedFood.prices && selectedFood.prices.length > 0 && (
                <div>
                  <Label className="text-sm text-muted-foreground">Available Sizes & Prices</Label>
                  <div className="mt-2 space-y-2">
                    {selectedFood.prices.map((price: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>{price.size}</span>
                        <span className="font-medium">LKR {price.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {selectedFood?.status === 'Pending' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectFoodDialog(true)}
                  className="text-red-600 hover:text-red-700"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => selectedFood && handleApproveFood(selectedFood.food_id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
            <Button variant="ghost" onClick={() => setShowFoodDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Food Rejection Dialog */}
      <Dialog open={showRejectFoodDialog} onOpenChange={setShowRejectFoodDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Food Item</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this food item. The chef will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Explain why this food item is being rejected..."
                value={foodRejectionReason}
                onChange={(e) => setFoodRejectionReason(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectFoodDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRejectFood}
              variant="destructive"
              disabled={!foodRejectionReason.trim()}
            >
              Reject Food Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Menu Review Dialog */}
      <Dialog open={showBulkMenuDialog} onOpenChange={setShowBulkMenuDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Bulk Menu</DialogTitle>
            <DialogDescription>
              Review the bulk menu details and approve or reject the submission
            </DialogDescription>
          </DialogHeader>
          {selectedBulkMenu && (
            <div className="space-y-4">
              {selectedBulkMenu.image_url && (
                <img
                  src={selectedBulkMenu.image_url}
                  alt={selectedBulkMenu.menu_name}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              <div>
                <h3 className="font-semibold text-lg">{selectedBulkMenu.menu_name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{selectedBulkMenu.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Chef</Label>
                  <p className="font-medium">{selectedBulkMenu.chef_name || 'Unknown'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Meal Type</Label>
                  <p className="font-medium capitalize">{selectedBulkMenu.meal_type}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Price per Person</Label>
                  <p className="font-medium">LKR {selectedBulkMenu.base_price_per_person}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Capacity</Label>
                  <p className="font-medium">
                    {selectedBulkMenu.min_persons}-{selectedBulkMenu.max_persons} persons
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Total Items</Label>
                  <p className="font-medium">{selectedBulkMenu.items_count || 0} items</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedBulkMenu.approval_status)}</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedBulkMenu?.approval_status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectBulkMenuDialog(true)}
                  className="text-red-600 hover:text-red-700"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => selectedBulkMenu && handleApproveBulkMenu(selectedBulkMenu.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
            <Button variant="ghost" onClick={() => setShowBulkMenuDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Menu Rejection Dialog */}
      <Dialog open={showRejectBulkMenuDialog} onOpenChange={setShowRejectBulkMenuDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Bulk Menu</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this bulk menu. The chef will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulk-rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="bulk-rejection-reason"
                placeholder="Explain why this bulk menu is being rejected..."
                value={bulkMenuRejectionReason}
                onChange={(e) => setBulkMenuRejectionReason(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectBulkMenuDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRejectBulkMenu}
              variant="destructive"
              disabled={!bulkMenuRejectionReason.trim()}
            >
              Reject Bulk Menu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentApprovalPage;

