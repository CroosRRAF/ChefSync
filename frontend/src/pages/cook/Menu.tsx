import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign,
  Clock,
  ChefHat,
  Image as ImageIcon,
  ToggleLeft,
  ToggleRight
} from "lucide-react";

// Interface matches your Django Food model with FoodPrice
interface FoodPrice {
  price_id: number;
  size: string;
  price: string;
  preparation_time: number;
  image_url?: string;
}

interface MenuItem {
  food_id: number;
  name: string;
  description: string;
  category: string;
  image_url?: string;
  status: string;
  is_available: boolean;
  preparation_time: number;
  chef: number;
  chef_name: string;
  prices: FoodPrice[];
  ingredients: string[];
  is_vegetarian: boolean;
  is_vegan: boolean;
  spice_level: string;
  rating_average: string;
  total_reviews: number;
  created_at: string;
  updated_at: string;
}

export default function Menu() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add Food Modal states
  const [foodSearchTerm, setFoodSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [isNewFood, setIsNewFood] = useState(true);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Fetch chef's foods from backend
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get("http://127.0.0.1:8000/api/food/chef/foods/", {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        // Ensure response.data is an array
        const foodData = Array.isArray(response.data) ? response.data : response.data?.results || [];
        setMenuItems(foodData);
      } catch (error) {
        console.error("Error fetching foods:", error);
        setMenuItems([]); // Ensure menuItems is always an array
      } finally {
        setLoading(false);
      }
    };
    fetchFoods();
  }, []);

  // Search foods for autocomplete
  const searchFoods = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`http://127.0.0.1:8000/api/food/search/?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setSearchResults(response.data);
      setShowResults(true);
    } catch (error) {
      console.error("Error searching foods:", error);
      setSearchResults([]);
    }
  };

  // Handle food name input change with debouncing
  const handleFoodNameChange = (value: string) => {
    setFoodSearchTerm(value);
    setSelectedFood(null);
    setIsNewFood(true);
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for debounced search
    const newTimeout = setTimeout(() => {
      if (value.length >= 2) {
        searchFoods(value);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);
    
    setSearchTimeout(newTimeout);
  };

  // Handle selecting a food from search results
  const handleSelectFood = (food: any) => {
    console.log('Selected food:', food); // Debug log
    setSelectedFood(food);
    setFoodSearchTerm(food.name);
    setIsNewFood(false);
    setShowResults(false);
    
    // Auto-populate form fields for existing food
    const form = document.querySelector('form') as HTMLFormElement;
    if (form) {
      // Set the name field
      const nameInput = form.querySelector('input[name="name"]') as HTMLInputElement;
      if (nameInput) nameInput.value = food.name;
      
      // Other fields will be shown as read-only in the conditional rendering
    }
  };

  const filteredItems = (Array.isArray(menuItems) ? menuItems : []).filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddFood = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    // Custom validation
    const foodName = formData.get("name") as string;
    const price = formData.get("price") as string;
    const prepTime = formData.get("prepTime") as string;
    
    // Basic validation
    if (!foodName || foodName.trim() === "") {
      alert("Please enter a food name");
      return;
    }
    
    if (!price || parseFloat(price) <= 0) {
      alert("Please enter a valid price greater than 0");
      return;
    }
    
    if (!prepTime || parseInt(prepTime) <= 0) {
      alert("Please enter a valid preparation time");
      return;
    }
    
    // Additional validation for new foods
    if (isNewFood) {
      const description = formData.get("description") as string;
      const category = formData.get("category") as string;
      
      if (!description || description.trim() === "") {
        alert("Please enter a description for the food item");
        return;
      }
      
      if (!category || category.trim() === "") {
        alert("Please enter a category for the food item");
        return;
      }
    }
    
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        alert('Please log in again');
        return;
      }

      let response;
      
      if (selectedFood && !isNewFood) {
        console.log('Form validation passed. Submitting data...');
        console.log('Food name:', foodName);
        console.log('Is new food:', isNewFood);
        console.log('Selected food:', selectedFood);

        // Existing food - only send price/size/prep time data as JSON
        const foodData = {
          name: selectedFood.name,
          price: parseFloat(formData.get("price") as string),
          size: formData.get("size") as string || "Medium",
          preparation_time: parseInt(formData.get("prepTime") as string, 10) || 15,
          is_available: formData.get("is_available") === "on" || true,
        };

        console.log('Submitting existing food data:', foodData);
        
        response = await axios.post("http://127.0.0.1:8000/api/food/chef/foods/", foodData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        // New food - send as FormData for image upload
        const foodFormData = new FormData();
        
        // Add all the fields to FormData
        foodFormData.append('name', formData.get("name") as string);
        foodFormData.append('category', formData.get("category") as string);
        foodFormData.append('description', formData.get("description") as string);
        foodFormData.append('ingredients', formData.get("ingredients") as string || "");
        foodFormData.append('initial_prep_time', (parseInt(formData.get("prepTime") as string, 10) || 15).toString());
        foodFormData.append('initial_price', (parseFloat(formData.get("price") as string)).toString());
        foodFormData.append('initial_size', formData.get("size") as string || "Medium");
        foodFormData.append('is_vegetarian', formData.get("is_vegetarian") === "on" ? "true" : "false");
        foodFormData.append('is_vegan', formData.get("is_vegan") === "on" ? "true" : "false");
        foodFormData.append('spice_level', formData.get("spice_level") as string || "");
        foodFormData.append('is_available', formData.get("is_available") === "on" ? "true" : "false");
        
        // Add image file if present
        const imageFile = formData.get("image") as File;
        if (imageFile && imageFile.size > 0) {
          foodFormData.append('image', imageFile);
        }

        console.log('Submitting new food with FormData');
        
        response = await axios.post("http://127.0.0.1:8000/api/food/chef/foods/", foodFormData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      console.log('Response:', response.data);
      
      // Show success message
      alert(response.data.message || "Food submitted successfully!");
      
      // Refresh the menu items
      const updatedResponse = await axios.get("http://127.0.0.1:8000/api/food/chef/foods/", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const updatedData = Array.isArray(updatedResponse.data) ? updatedResponse.data : updatedResponse.data?.results || [];
      setMenuItems(updatedData);
      
      // Reset form and close dialog
      resetAddFoodForm();
      setIsAddDialogOpen(false);
      
    } catch (error: any) {
      console.error("Full error:", error);
      
      let errorMessage = "Error submitting food item. Please try again.";
      
      if (error.response?.data) {
        // Extract specific error messages from backend
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (typeof error.response.data === 'object') {
          // Handle field-specific errors
          const errors = [];
          for (const [field, messages] of Object.entries(error.response.data)) {
            if (Array.isArray(messages)) {
              errors.push(`${field}: ${messages.join(', ')}`);
            } else {
              errors.push(`${field}: ${messages}`);
            }
          }
          if (errors.length > 0) {
            errorMessage = errors.join('\n');
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    }
  };

  const resetAddFoodForm = () => {
    setFoodSearchTerm("");
    setSearchResults([]);
    setSelectedFood(null);
    setShowResults(false);
    setIsNewFood(true);
  };

  const handleEditFood = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingItem) return;

    const formData = new FormData(event.currentTarget);
    const updateData = {
      price: parseFloat(formData.get("price") as string),
      size: formData.get("size") as string,
      preparation_time: parseInt(formData.get("preparation_time") as string, 10),
      is_available: formData.get("is_available") === "on",
    };

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.put(`http://127.0.0.1:8000/api/food/chef/foods/${editingItem.food_id}/`, updateData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      alert(response.data.message || "Food updated successfully!");
      
      // Refresh the menu items
      const updatedResponse = await axios.get("http://127.0.0.1:8000/api/food/chef/foods/", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const updatedData = Array.isArray(updatedResponse.data) ? updatedResponse.data : updatedResponse.data?.results || [];
      setMenuItems(updatedData);
      
      // Close dialog
      setIsEditDialogOpen(false);
      setEditingItem(null);
      
    } catch (error) {
      console.error("Error updating food:", error);
      alert("Error updating food item. Please try again.");
    }
  };

  const handleDeleteFood = async (foodId: number, foodName: string) => {
    if (!confirm(`Are you sure you want to delete "${foodName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`http://127.0.0.1:8000/api/food/chef/foods/${foodId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      alert("Food item deleted successfully!");
      
      // Remove from local state
      setMenuItems(prev => prev.filter(item => item.food_id !== foodId));
      
    } catch (error) {
      console.error("Error deleting food:", error);
      alert("Error deleting food item. Please try again.");
    }
  };

  const toggleAvailability = async (foodId: number, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.patch(`http://127.0.0.1:8000/api/food/chef/foods/${foodId}/toggle_availability/`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Update local state
      setMenuItems(prev => prev.map(item => 
        item.food_id === foodId 
          ? { ...item, is_available: !currentStatus }
          : item
      ));
      
    } catch (error) {
      console.error("Error toggling availability:", error);
      alert("Error updating availability. Please try again.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending Approval</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
    }
  };

  const getAvailabilityIndicator = (isAvailable: boolean) => {
    return isAvailable ? (
      <div className="flex items-center gap-2 text-green-600">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm">Active</span>
      </div>
    ) : (
      <div className="flex items-center gap-2 text-red-600">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <span className="text-sm">Inactive</span>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Menu Management</h1>
          <p className="text-muted-foreground mt-1">Manage your delicious creations</p>
        </div>
        
        <Dialog 
          open={isAddDialogOpen} 
          onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) resetAddFoodForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add New Food
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Food Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddFood} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="name">Food Name</Label>
                <div className="relative">
                  <Input 
                    id="name" 
                    name="name" 
                    placeholder="Search existing food or type new name" 
                    value={foodSearchTerm}
                    onChange={(e) => handleFoodNameChange(e.target.value)}
                  />
                  
                  {/* Search Results Dropdown */}
                  {showResults && searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                      {searchResults.map((food, index) => (
                        <div
                          key={food.id || index}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                          onClick={() => handleSelectFood(food)}
                        >
                          <div className="flex items-center space-x-3">
                            {food.image_url ? (
                              <img src={food.image_url} alt={food.name} className="w-10 h-10 rounded object-cover" />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                <ImageIcon className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{food.name}</p>
                              <p className="text-sm text-gray-500 truncate">{food.description || 'No description'}</p>
                              {food.category && (
                                <p className="text-xs text-gray-400">{food.category}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* No results message */}
                  {showResults && searchResults.length === 0 && foodSearchTerm.length >= 2 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg p-4 text-center text-gray-500">
                      <p>No existing foods found for "{foodSearchTerm}"</p>
                      <p className="text-sm">You can create a new food item with this name</p>
                    </div>
                  )}
                </div>
                
                {selectedFood && (
                  <div className="mt-2 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                    <p className="text-sm text-blue-700">
                      <strong>Existing food selected:</strong> You can only set price, size, and preparation time for this item.
                    </p>
                  </div>
                )}
              </div>
              
              {/* Conditional fields based on whether it's new or existing food */}
              {isNewFood && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input id="category" name="category" placeholder="e.g., Main Course, Dessert" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      name="description" 
                      placeholder="Describe your dish..." 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image">Image Upload (Optional)</Label>
                    <Input 
                      id="image" 
                      name="image" 
                      type="file" 
                      accept="image/*"
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                    />
                    <p className="text-xs text-gray-500">Upload an image of your dish (JPG, PNG, GIF)</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ingredients">Ingredients</Label>
                    <Textarea id="ingredients" name="ingredients" placeholder="List the main ingredients..." />
                  </div>
                </>
              )}
              
              {selectedFood && !isNewFood && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="readonly-category">Category (Read-only)</Label>
                    <Input 
                      value={selectedFood.category || "N/A"} 
                      disabled 
                      className="bg-gray-50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="readonly-description">Description (Read-only)</Label>
                    <Textarea 
                      value={selectedFood.description || "N/A"} 
                      disabled 
                      className="bg-gray-50"
                      rows={3}
                    />
                  </div>
                </>
              )}
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Initial Price ($)</Label>
                  <Input id="price" name="price" type="number" step="0.01" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Size</Label>
                  <select id="size" name="size" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                    <option value="Small">Small</option>
                    <option value="Medium" selected>Medium</option>
                    <option value="Large">Large</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prepTime">Prep Time (minutes)</Label>
                  <Input id="prepTime" name="prepTime" type="number" placeholder="15" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="spice_level">Spice Level</Label>
                  <select id="spice_level" name="spice_level" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                    <option value="">Select spice level</option>
                    <option value="mild">Mild</option>
                    <option value="medium">Medium</option>
                    <option value="hot">Hot</option>
                    <option value="very_hot">Very Hot</option>
                  </select>
                </div>
                <div className="flex items-center space-x-4 pt-6">
                  <div className="flex items-center space-x-2">
                    <input id="is_vegetarian" name="is_vegetarian" type="checkbox" className="h-4 w-4" />
                    <Label htmlFor="is_vegetarian" className="text-sm">Vegetarian</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input id="is_vegan" name="is_vegan" type="checkbox" className="h-4 w-4" />
                    <Label htmlFor="is_vegan" className="text-sm">Vegan</Label>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input id="is_available" name="is_available" type="checkbox" className="h-4 w-4" defaultChecked />
                <Label htmlFor="is_available" className="text-sm">Available (Active)</Label>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    resetAddFoodForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedFood && !isNewFood ? "Add My Price" : "Submit for Approval"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Food Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Food Item</DialogTitle>
              <p className="text-sm text-muted-foreground">
                You can only edit price, size, preparation time, and availability
              </p>
            </DialogHeader>
            {editingItem && (
              <form onSubmit={handleEditFood} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Food Name (Read-only)</Label>
                  <Input 
                    id="edit-name" 
                    value={editingItem.name} 
                    disabled 
                    className="bg-gray-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-price">Price ($)</Label>
                    <Input 
                      id="edit-price" 
                      name="price" 
                      type="number" 
                      step="0.01" 
                      defaultValue={editingItem.prices[0]?.price || ""}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-size">Size</Label>
                    <select 
                      id="edit-size" 
                      name="size" 
                      defaultValue={editingItem.prices[0]?.size || "Medium"}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="Small">Small</option>
                      <option value="Medium">Medium</option>
                      <option value="Large">Large</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-prep-time">Preparation Time (minutes)</Label>
                  <Input 
                    id="edit-prep-time" 
                    name="preparation_time" 
                    type="number" 
                    defaultValue={editingItem.preparation_time}
                    required 
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="edit-available" 
                    name="is_available"
                    defaultChecked={editingItem.is_available}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="edit-available" className="text-sm font-medium">
                    Available for orders
                  </Label>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Update Food</Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search your menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading your menu items...</p>
          </div>
        </div>
      ) : (
        <>
          {/* No Items State */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <ChefHat className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">No menu items found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {searchTerm ? "Try adjusting your search terms" : "Add your first food item to get started"}
              </p>
            </div>
          ) : (
            /* Cards Grid Layout */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <Card key={item.food_id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Food Image */}
                  <div className="relative h-48 bg-gray-100 flex items-center justify-center">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                    )}
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(item.status)}
                    </div>
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{item.category}</p>
                      </div>
                      {/* Availability Indicator */}
                      <div className="ml-2">
                        {getAvailabilityIndicator(item.is_available)}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {item.description}
                    </p>

                    {/* Dietary Info */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {item.is_vegetarian && (
                        <Badge variant="outline" className="text-xs">Vegetarian</Badge>
                      )}
                      {item.is_vegan && (
                        <Badge variant="outline" className="text-xs">Vegan</Badge>
                      )}
                      {item.spice_level && (
                        <Badge variant="outline" className="text-xs">{item.spice_level}</Badge>
                      )}
                    </div>

                    {/* Prices List */}
                    <div className="space-y-2 mb-4">
                      {item.prices.map((price) => (
                        <div key={price.price_id} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <span className="font-medium">{price.size}</span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {price.preparation_time} min
                            </span>
                          </span>
                          <span className="flex items-center gap-1 font-semibold">
                            <DollarSign className="h-3 w-3" />
                            {parseFloat(price.price).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setEditingItem(item);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => toggleAvailability(item.food_id, item.is_available)}
                        >
                          {item.is_available ? (
                            <ToggleRight className="h-3 w-3 mr-1" />
                          ) : (
                            <ToggleLeft className="h-3 w-3 mr-1" />
                          )}
                          {item.is_available ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteFood(item.food_id, item.name)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}