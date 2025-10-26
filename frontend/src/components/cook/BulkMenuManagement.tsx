import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, DollarSign, Users, Clock, CheckCircle, XCircle, AlertCircle, Search } from 'lucide-react';
import { toast } from 'sonner';
import { safeJsonParse } from '@/utils/responseUtils';

// Types
interface BulkMenu {
  id: number;
  chef: number;
  chef_name: string;
  meal_type: string;
  meal_type_display: string;
  menu_name: string;
  description: string;
  base_price_per_person: number;
  availability_status: boolean;
  approval_status: string;
  approval_status_display: string;
  min_persons: number;
  max_persons: number;
  advance_notice_hours: number;
  image?: string;
  image_url?: string;
  thumbnail_url?: string;
  items_count: number;
  menu_items_summary: {
    mandatory_items: string[];
    optional_items: string[];
    total_items: number;
  };
  created_at: string;
  updated_at: string;
}

interface BulkMenuItem {
  id?: number;
  bulk_menu?: number;
  item_name: string;
  description: string;
  is_optional: boolean;
  extra_cost: number;
  sort_order: number;
  is_vegetarian: boolean;
  spice_level: string;
  allergens: string[];
}

interface MealType {
  value: string;
  label: string;
}

// Helper function for status badges
const getStatusBadge = (status: string) => {
  const variants: { [key: string]: any } = {
    'pending': { variant: 'secondary', icon: <AlertCircle className="w-3 h-3" /> },
    'approved': { variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
    'rejected': { variant: 'destructive', icon: <XCircle className="w-3 h-3" /> },
  };

  const config = variants[status] || variants['pending'];
  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      {config.icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

const BulkMenuManagement: React.FC = () => {
  const [bulkMenus, setBulkMenus] = useState<BulkMenu[]>([]);
  const [mealTypes, setMealTypes] = useState<MealType[]>([]);
  const [selectedMealType, setSelectedMealType] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<BulkMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Helper function to safely parse JSON responses
  const safeJsonParse = async (response: Response) => {
    let responseText = '';
    try {
      responseText = await response.text();
      if (!responseText.trim()) {
        console.error(`Empty response from ${response.url} (${response.status})`);
        throw new Error('Empty response');
      }
      return JSON.parse(responseText);
    } catch (error) {
      console.error('JSON parsing error:', error);
      console.error(`URL: ${response.url}`);
      console.error(`Status: ${response.status} ${response.statusText}`);
      console.error(`Content-Type: ${response.headers.get('content-type')}`);
      
      // Log first 500 characters of response for debugging
      if (error instanceof SyntaxError && responseText) {
        console.error('Response was not valid JSON - likely HTML error page or plain text');
        console.error('Response preview:', responseText.substring(0, 500));
      }
      
      throw new Error(`Invalid JSON response from server (${response.status})`);
    }
  };

  // Helper function to handle update errors
  const handleUpdateError = async (response: Response) => {
    try {
      const errorData = await safeJsonParse(response);
      console.error('Update error response:', errorData);
      
      if (errorData.items && Array.isArray(errorData.items)) {
        errorData.items.forEach((error: string) => {
          toast.error(`Validation error: ${error}`);
        });
      } else if (typeof errorData === 'object') {
        const errorMessages: string[] = [];
        for (const [field, errors] of Object.entries(errorData)) {
          if (Array.isArray(errors)) {
            errorMessages.push(`${field}: ${errors.join(', ')}`);
          } else {
            errorMessages.push(`${field}: ${errors}`);
          }
        }
        toast.error(`Validation errors: ${errorMessages.join('; ')}`);
      } else {
        toast.error(errorData.message || 'Failed to update bulk menu');
      }
    } catch (parseError) {
      console.error('Error parsing update error response:', parseError);
      console.error(`Response status: ${response.status} ${response.statusText}`);
      console.error(`Response URL: ${response.url}`);
      
      toast.error(`Server error (${response.status}): Unable to update bulk menu. Please check the server logs and try again.`);
    }
  };

  // Form state for creating/editing menus
  const [menuForm, setMenuForm] = useState({
    meal_type: '',
    menu_name: '',
    description: '',
    base_price_per_person: 0,
    min_persons: 10,
    max_persons: 100,
    advance_notice_hours: 24,
    availability_status: true,
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Handle image selection and preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Menu items state
  const [menuItems, setMenuItems] = useState<BulkMenuItem[]>([]);

  // Fetch data on component mount
  useEffect(() => {
    fetchBulkMenus();
    fetchMealTypes();
    fetchDashboardStats();
  }, []);

  // API functions
  const fetchBulkMenus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/food/bulk-menus/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      if (response.ok) {
        const data = await safeJsonParse(response);
        setBulkMenus(data.results || data);
      } else {
        toast.error(`Failed to fetch bulk menus (${response.status})`);
      }
    } catch (error) {
      console.error('Error fetching bulk menus:', error);
      toast.error('Error fetching bulk menus. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMealTypes = async () => {
    try {
      const response = await fetch('/api/food/bulk-menus/meal_types/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      if (response.ok) {
        const data = await safeJsonParse(response);
        setMealTypes(data);
      } else {
        console.error(`Failed to fetch meal types (${response.status})`);
      }
    } catch (error) {
      console.error('Error fetching meal types:', error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/food/bulk-menus/chef_dashboard_stats/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      if (response.ok) {
        const data = await safeJsonParse(response);
        setDashboardStats(data);
      } else {
        console.error(`Failed to fetch dashboard stats (${response.status})`);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const createBulkMenu = async () => {
    try {
      // Validate required fields
      if (!menuForm.meal_type || !menuForm.menu_name || !menuForm.description) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (menuForm.base_price_per_person <= 0) {
        toast.error('Price per person must be greater than 0');
        return;
      }

      if (menuItems.length === 0) {
        toast.error('Please add at least one menu item');
        return;
      }

      // Use FormData for file upload
      const formData = new FormData();
      
      // Add form fields explicitly to ensure proper formatting
      formData.append('meal_type', menuForm.meal_type);
      formData.append('menu_name', menuForm.menu_name);
      formData.append('description', menuForm.description);
      formData.append('base_price_per_person', menuForm.base_price_per_person.toString());
      formData.append('min_persons', menuForm.min_persons.toString());
      formData.append('max_persons', menuForm.max_persons.toString());
      formData.append('advance_notice_hours', menuForm.advance_notice_hours.toString());
      formData.append('availability_status', menuForm.availability_status.toString());
      
      // Add menu items as JSON string
      formData.append('items', JSON.stringify(menuItems));
      
      // Add image if selected
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      // Debug: Log FormData contents
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(key, ':', value);
      }

      const response = await fetch('/api/food/bulk-menus/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formData, // No Content-Type header needed for FormData
      });

      if (response.ok) {
        toast.success('Bulk menu created successfully');
        setIsCreateDialogOpen(false);
        resetForm();
        fetchBulkMenus();
        fetchDashboardStats();
      } else {
        console.error('Response status:', response.status);
        try {
          const errorData = await safeJsonParse(response);
          console.error('Error details:', errorData);
          
          // Display specific validation errors
          if (errorData && typeof errorData === 'object') {
            const errorMessages = [];
            for (const [field, errors] of Object.entries(errorData)) {
              if (Array.isArray(errors)) {
                errorMessages.push(`${field}: ${errors.join(', ')}`);
              } else {
                errorMessages.push(`${field}: ${errors}`);
              }
            }
            toast.error(`Validation errors: ${errorMessages.join('; ')}`);
          } else {
            toast.error(errorData.message || 'Failed to create bulk menu');
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          toast.error(`Server error (${response.status}). Please try again.`);
        }
      }
    } catch (error) {
      console.error('Create bulk menu error:', error);
      toast.error('Error creating bulk menu');
    }
  };

  const toggleAvailability = async (menu: BulkMenu) => {
    try {
      const response = await fetch(`/api/food/bulk-menus/${menu.id}/toggle_availability/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        toast.success('Availability status updated');
        fetchBulkMenus();
      } else {
        toast.error('Failed to update availability');
      }
    } catch (error) {
      toast.error('Error updating availability');
    }
  };

  // Edit menu functions
  const openEditDialog = async (menu: BulkMenu) => {
    setEditingMenu(menu);
    
    // Load menu data into form
    setMenuForm({
      meal_type: menu.meal_type,
      menu_name: menu.menu_name,
      description: menu.description,
      base_price_per_person: menu.base_price_per_person,
      min_persons: menu.min_persons,
      max_persons: menu.max_persons,
      advance_notice_hours: menu.advance_notice_hours,
      availability_status: menu.availability_status,
    });

    // Fetch menu items
    try {
      const response = await fetch(`/api/food/bulk-menu-items/?bulk_menu__id=${menu.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const itemsData = await safeJsonParse(response);
        setMenuItems(itemsData.results || itemsData);
      } else {
        toast.error('Failed to load menu items');
        setMenuItems([]);
      }
    } catch (error) {
      toast.error('Error loading menu items');
      setMenuItems([]);
    }

    setIsEditDialogOpen(true);
  };

  const updateBulkMenu = async () => {
    if (!editingMenu) return;

    try {
      // If there's an image to upload, use FormData
      if (selectedImage) {
        const formData = new FormData();
        
        // Create menu data object
        const menuData: any = {};
        Object.entries(menuForm).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            menuData[key] = value;
          }
        });
        
        // Add menu and items data as JSON strings
        formData.append('menu', JSON.stringify(menuData));
        formData.append('items', JSON.stringify(menuItems));
        formData.append('image', selectedImage);

        const response = await fetch(`/api/food/bulk-menus/${editingMenu.id}/update_with_items/`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: formData,
        });

        if (response.ok) {
          toast.success('Bulk menu updated successfully!');
          setIsEditDialogOpen(false);
          resetForm();
          fetchBulkMenus();
          return;
        } else {
          await handleUpdateError(response);
          return;
        }
      }

      // If no image, use JSON
      const requestData = {
        menu: {} as any,
        items: menuItems
      };

      // Add menu fields
      Object.entries(menuForm).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          requestData.menu[key] = value;
        }
      });

      const response = await fetch(`/api/food/bulk-menus/${editingMenu.id}/update_with_items/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      // Handle response for JSON request
      if (response.ok) {
        toast.success('Bulk menu updated successfully!');
        setIsEditDialogOpen(false);
        resetForm();
        fetchBulkMenus();
      } else {
        await handleUpdateError(response);
      }
    } catch (error) {
      console.error('Update bulk menu error:', error);
      toast.error('Error updating bulk menu');
    }
  };

  // Delete individual menu item
  const deleteMenuItem = async (item: BulkMenuItem, index: number) => {
    if (item.id) {
      // If item exists in database, delete via API
      try {
        const response = await fetch(`/api/food/bulk-menu-items/${item.id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        });

        if (response.ok) {
          toast.success('Menu item deleted successfully');
          // Remove from local state
          const updatedItems = menuItems.filter((_, i) => i !== index);
          setMenuItems(updatedItems);
        } else {
          toast.error('Failed to delete menu item');
        }
      } catch (error) {
        toast.error('Error deleting menu item');
      }
    } else {
      // If item is new (no ID), just remove from local state
      const updatedItems = menuItems.filter((_, i) => i !== index);
      setMenuItems(updatedItems);
    }
  };

  // Delete entire bulk menu
  const deleteBulkMenu = async (menu: BulkMenu) => {
    if (!confirm(`Are you sure you want to delete "${menu.menu_name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/food/bulk-menus/${menu.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        toast.success('Bulk menu deleted successfully');
        fetchBulkMenus(); // Refresh the list
      } else {
        toast.error('Failed to delete bulk menu');
      }
    } catch (error) {
      toast.error('Error deleting bulk menu');
    }
  };

  // Utility functions
  const resetForm = () => {
    setMenuForm({
      meal_type: '',
      menu_name: '',
      description: '',
      base_price_per_person: 0,
      min_persons: 10,
      max_persons: 100,
      advance_notice_hours: 24,
      availability_status: true,
    });
    setMenuItems([]);
    setSelectedImage(null);
    setImagePreview(null);
    setEditingMenu(null);
  };

  const addMenuItem = () => {
    const newItem: BulkMenuItem = {
      item_name: '',
      description: '',
      is_optional: false,
      extra_cost: 0,
      sort_order: menuItems.length + 1,
      is_vegetarian: true, // Default to vegetarian
      spice_level: '',
      allergens: [],
    };
    setMenuItems([...menuItems, newItem]);
  };

  const updateMenuItem = (index: number, field: string, value: any) => {
    const updatedItems = [...menuItems];
    const item = { ...updatedItems[index], [field]: value };
    
    // Business logic: Handle extra cost and optional status relationship
    if (field === 'extra_cost' && value > 0) {
      // If extra cost is added, automatically make item optional
      item.is_optional = true;
      toast.info('Item marked as optional since it has extra cost');
    } else if (field === 'is_optional' && value === false) {
      // If item is made mandatory, remove extra cost
      if (item.extra_cost > 0) {
        item.extra_cost = 0;
        toast.info('Extra cost removed since mandatory items cannot have extra charges');
      }
    }
    
    updatedItems[index] = item;
    setMenuItems(updatedItems);
  };

  const removeMenuItem = (index: number) => {
    const updatedItems = menuItems.filter((_, i) => i !== index);
    setMenuItems(updatedItems);
  };

  const filteredMenus = bulkMenus
    .filter(menu => selectedMealType === 'all' || menu.meal_type === selectedMealType)
    .filter(menu => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        menu.menu_name.toLowerCase().includes(searchLower) ||
        menu.description.toLowerCase().includes(searchLower) ||
        menu.meal_type_display.toLowerCase().includes(searchLower)
      );
    });

  return (
    <div className="space-y-6">
      {/* Dashboard Stats */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Menus</CardTitle>
              <span className="text-sm font-semibold text-muted-foreground">Rs.</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.total_menus}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{dashboardStats.approved_menus}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{dashboardStats.pending_menus}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{dashboardStats.available_menus}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Bulk Menu Management</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Bulk Menu
            </Button>
          </DialogTrigger>
          
          {/* Create Menu Dialog */}
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Bulk Menu</DialogTitle>
              <DialogDescription>
                Create a new bulk menu with items for group orders
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Menu Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meal_type">Meal Type</Label>
                  <Select value={menuForm.meal_type} onValueChange={(value) => setMenuForm({...menuForm, meal_type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select meal type" />
                    </SelectTrigger>
                    <SelectContent>
                      {mealTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="menu_name">Menu Name</Label>
                  <Input
                    id="menu_name"
                    value={menuForm.menu_name}
                    onChange={(e) => setMenuForm({...menuForm, menu_name: e.target.value})}
                    placeholder="Enter menu name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={menuForm.description}
                  onChange={(e) => setMenuForm({...menuForm, description: e.target.value})}
                  placeholder="Describe your bulk menu"
                  rows={3}
                />
              </div>

              {/* Image Upload Section */}
              <div className="space-y-2">
                <Label htmlFor="menu_image">Menu Image (Optional)</Label>
                <Input
                  id="menu_image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Menu preview"
                      className="w-full max-w-xs h-32 object-cover rounded-md border"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="base_price">Base Price per Person (Rs.)</Label>
                  <Input
                    id="base_price"
                    type="number"
                    value={menuForm.base_price_per_person}
                    onChange={(e) => setMenuForm({...menuForm, base_price_per_person: parseFloat(e.target.value) || 0})}
                    placeholder="250"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min_persons">Min Persons</Label>
                  <Input
                    id="min_persons"
                    type="number"
                    value={menuForm.min_persons}
                    onChange={(e) => setMenuForm({...menuForm, min_persons: parseInt(e.target.value) || 10})}
                    placeholder="10"
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_persons">Max Persons</Label>
                  <Input
                    id="max_persons"
                    type="number"
                    value={menuForm.max_persons}
                    onChange={(e) => setMenuForm({...menuForm, max_persons: parseInt(e.target.value) || 100})}
                    placeholder="100"
                    min="1"
                  />
                </div>
              </div>

              {/* Menu Items Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Menu Items</h3>
                  <Button type="button" variant="outline" onClick={addMenuItem}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                {menuItems.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-12 gap-4 items-end">
                        <div className="col-span-3 space-y-2">
                          <Label>Item Name</Label>
                          <Input
                            value={item.item_name}
                            onChange={(e) => updateMenuItem(index, 'item_name', e.target.value)}
                            placeholder="Item name"
                          />
                        </div>

                        <div className="col-span-4 space-y-2">
                          <Label>Description</Label>
                          <Input
                            value={item.description}
                            onChange={(e) => updateMenuItem(index, 'description', e.target.value)}
                            placeholder="Item description"
                          />
                        </div>

                        <div className="col-span-2 space-y-2">
                          <Label>Extra Cost (Rs.)</Label>
                          <Input
                            type="number"
                            value={item.extra_cost}
                            onChange={(e) => updateMenuItem(index, 'extra_cost', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            min="0"
                            step="1.00"
                            className={
                              !item.is_optional && item.extra_cost > 0 
                                ? "border-red-500 focus:border-red-500" 
                                : ""
                            }
                          />
                        </div>

                        <div className="col-span-2 flex items-center space-x-2">
                          <Switch
                            checked={item.is_optional}
                            onCheckedChange={(checked) => updateMenuItem(index, 'is_optional', checked)}
                          />
                          <Label className="text-sm">Optional</Label>
                        </div>

                        <div className="col-span-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeMenuItem(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Dietary Type</Label>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id={`vegetarian-${index}`}
                                name={`dietary_type_${index}`}
                                value="vegetarian"
                                checked={item.is_vegetarian === true}
                                onChange={() => {
                                  updateMenuItem(index, 'is_vegetarian', true);
                                }}
                                className="h-4 w-4 text-green-600"
                              />
                              <Label htmlFor={`vegetarian-${index}`} className="text-sm font-medium flex items-center">
                                🥗 Vegetarian
                              </Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id={`non-vegetarian-${index}`}
                                name={`dietary_type_${index}`}
                                value="non-vegetarian"
                                checked={item.is_vegetarian === false}
                                onChange={() => {
                                  updateMenuItem(index, 'is_vegetarian', false);
                                }}
                                className="h-4 w-4 text-red-600"
                              />
                              <Label htmlFor={`non-vegetarian-${index}`} className="text-sm font-medium flex items-center">
                                🍖 Non-Vegetarian
                              </Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {menuItems.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-muted-foreground">No items added yet. Click "Add Item" to start building your menu.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createBulkMenu} disabled={!menuForm.menu_name || !menuForm.meal_type || menuItems.length === 0}>
                Create Menu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Menu Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Bulk Menu</DialogTitle>
              <DialogDescription>
                Update your bulk menu details and items
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Menu Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-meal-type">Meal Type *</Label>
                  <Select 
                    value={menuForm.meal_type} 
                    onValueChange={(value) => setMenuForm(prev => ({ ...prev, meal_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select meal type" />
                    </SelectTrigger>
                    <SelectContent>
                      {mealTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-menu-name">Menu Name *</Label>
                  <Input
                    id="edit-menu-name"
                    value={menuForm.menu_name}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, menu_name: e.target.value }))}
                    placeholder="e.g., Corporate Lunch Package"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={menuForm.description}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of your bulk menu"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-base-price">Base Price per Person (Rs.) *</Label>
                  <Input
                    id="edit-base-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={menuForm.base_price_per_person}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, base_price_per_person: parseFloat(e.target.value) || 0 }))}
                    placeholder="150.00"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-advance-notice">Advance Notice (hours)</Label>
                  <Input
                    id="edit-advance-notice"
                    type="number"
                    min="1"
                    value={menuForm.advance_notice_hours}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, advance_notice_hours: parseInt(e.target.value) || 24 }))}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-min-persons">Minimum Persons</Label>
                  <Input
                    id="edit-min-persons"
                    type="number"
                    min="1"
                    value={menuForm.min_persons}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, min_persons: parseInt(e.target.value) || 10 }))}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-max-persons">Maximum Persons</Label>
                  <Input
                    id="edit-max-persons"
                    type="number"
                    min="1"
                    value={menuForm.max_persons}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, max_persons: parseInt(e.target.value) || 100 }))}
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-availability"
                      checked={menuForm.availability_status}
                      onCheckedChange={(checked) => setMenuForm(prev => ({ ...prev, availability_status: checked }))}
                    />
                    <Label htmlFor="edit-availability">Available for Orders</Label>
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <Label htmlFor="edit-image">Menu Image (optional)</Label>
                <Input
                  id="edit-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-md" />
                  </div>
                )}
                {editingMenu?.image_url && !imagePreview && (
                  <div className="mt-2">
                    <img src={editingMenu.image_url} alt="Current" className="w-32 h-32 object-cover rounded-md" />
                    <p className="text-sm text-muted-foreground mt-1">Current image</p>
                  </div>
                )}
              </div>

              {/* Menu Items Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Menu Items</h3>
                  <Button type="button" variant="outline" onClick={addMenuItem}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {menuItems.map((item, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Item Name *</Label>
                            <Input
                              value={item.item_name}
                              onChange={(e) => updateMenuItem(index, 'item_name', e.target.value)}
                              placeholder="e.g., Chicken Curry"
                            />
                          </div>

                          <div>
                            <Label>Description</Label>
                            <Input
                              value={item.description}
                              onChange={(e) => updateMenuItem(index, 'description', e.target.value)}
                              placeholder="Brief description"
                            />
                          </div>

                          <div>
                            <Label>Extra Cost (Rs.)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="1.00"
                              value={item.extra_cost}
                              onChange={(e) => updateMenuItem(index, 'extra_cost', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                            />
                          </div>

                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={item.is_optional}
                                onCheckedChange={(checked) => updateMenuItem(index, 'is_optional', checked)}
                              />
                              <Label className="text-sm">Optional</Label>
                            </div>
                          </div>

                          <div className="md:col-span-2">
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Dietary Type</Label>
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      id={`edit-vegetarian-${index}`}
                                      name={`edit_dietary_type_${index}`}
                                      value="vegetarian"
                                      checked={item.is_vegetarian === true}
                                      onChange={() => {
                                        updateMenuItem(index, 'is_vegetarian', true);
                                      }}
                                      className="h-4 w-4 text-green-600"
                                    />
                                    <Label htmlFor={`edit-vegetarian-${index}`} className="text-sm font-medium flex items-center">
                                      🥗 Vegetarian
                                    </Label>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      id={`edit-non-vegetarian-${index}`}
                                      name={`edit_dietary_type_${index}`}
                                      value="non-vegetarian"
                                      checked={item.is_vegetarian === false}
                                      onChange={() => {
                                        updateMenuItem(index, 'is_vegetarian', false);
                                      }}
                                      className="h-4 w-4 text-red-600"
                                    />
                                    <Label htmlFor={`edit-non-vegetarian-${index}`} className="text-sm font-medium flex items-center">
                                      🍖 Non-Vegetarian
                                    </Label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="md:col-span-2 flex justify-end">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteMenuItem(item, index)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Item
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {menuItems.length === 0 && (
                    <Card>
                      <CardContent className="text-center py-8">
                        <p className="text-muted-foreground">No items added yet. Click "Add Item" to start building your menu.</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updateBulkMenu} disabled={!menuForm.menu_name || !menuForm.meal_type || menuItems.length === 0}>
                Update Menu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Search menus by name, description, or meal type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2"
        />
      </div>

      {/* Meal Type Tabs */}
      <Tabs value={selectedMealType} onValueChange={setSelectedMealType}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Menus</TabsTrigger>
          {mealTypes.map((type) => (
            <TabsTrigger key={type.value} value={type.value}>
              {type.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedMealType} className="mt-6">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredMenus.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  No bulk menus found for {selectedMealType === 'all' ? 'any meal type' : mealTypes.find(t => t.value === selectedMealType)?.label}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredMenus.map((menu) => (
                <MenuCard key={menu.id} menu={menu} onToggleAvailability={toggleAvailability} onEditMenu={openEditDialog} onDeleteMenu={deleteBulkMenu} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Menu Card Component
interface MenuCardProps {
  menu: BulkMenu;
  onToggleAvailability: (menu: BulkMenu) => void;
  onEditMenu: (menu: BulkMenu) => void;
  onDeleteMenu: (menu: BulkMenu) => void;
}

const MenuCard: React.FC<MenuCardProps> = ({ menu, onToggleAvailability, onEditMenu, onDeleteMenu }) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 group">
      {/* Image Section */}
      {menu.thumbnail_url ? (
        <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          <img 
            src={menu.thumbnail_url} 
            alt={menu.menu_name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute top-3 right-3">
            {getStatusBadge(menu.approval_status)}
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
            <Badge variant="secondary" className="bg-white/90 text-black font-medium">
              {menu.meal_type_display}
            </Badge>
          </div>
        </div>
      ) : (
        // Placeholder for menus without images
        <div className="h-48 w-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center relative">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2 bg-primary/20 rounded-full flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">No image</p>
          </div>
          <div className="absolute top-3 right-3">
            {getStatusBadge(menu.approval_status)}
          </div>
          <div className="absolute bottom-3 left-3">
            <Badge variant="secondary" className="bg-white/90 text-black font-medium">
              {menu.meal_type_display}
            </Badge>
          </div>
        </div>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-bold truncate" title={menu.menu_name}>
              {menu.menu_name}
            </CardTitle>
            <CardDescription className="mt-1 text-sm line-clamp-2">
              {menu.description}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Switch
              checked={menu.availability_status}
              onCheckedChange={() => onToggleAvailability(menu)}
              className="data-[state=checked]:bg-green-500"
            />
            <Button 
              variant="outline" 
              size="sm" 
              className="hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => onEditMenu(menu)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="hover:bg-destructive hover:text-destructive-foreground transition-colors"
              onClick={() => onDeleteMenu(menu)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-green-600">Rs.{menu.base_price_per_person}</span>
              <span className="text-sm text-muted-foreground">/person</span>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {menu.items_count} items
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{menu.min_persons}-{menu.max_persons} persons</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{menu.advance_notice_hours}h notice</span>
            </div>
          </div>
        </div>

        {menu.menu_items_summary && (
          <div className="space-y-2">
            {menu.menu_items_summary.mandatory_items.length > 0 && (
              <div>
                <span className="text-sm font-medium">Included: </span>
                <span className="text-sm text-muted-foreground">
                  {menu.menu_items_summary.mandatory_items.join(', ')}
                </span>
              </div>
            )}
            {menu.menu_items_summary.optional_items.length > 0 && (
              <div>
                <span className="text-sm font-medium">Optional: </span>
                <span className="text-sm text-muted-foreground">
                  {menu.menu_items_summary.optional_items.map(item => item.replace(/₹/g, 'Rs.')).join(', ')}
                </span>
              </div>
            )}
          </div>
        )}

        {menu.approval_status === 'rejected' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              This menu was rejected. Please review and update before resubmitting.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BulkMenuManagement;