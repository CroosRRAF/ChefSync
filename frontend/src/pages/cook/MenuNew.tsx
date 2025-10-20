import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye,
  EyeOff,
  DollarSign,
  Clock,
  Users
} from 'lucide-react';

// Types
interface Food {
  food_id: number;
  name: string;
  description: string;
  category: string;
  image_url?: string;
  status: string;
  is_available: boolean;
  prices: FoodPrice[];
  chef_name: string;
  rating_average: number | string;
  total_reviews: number;
  total_orders: number;
}

interface FoodPrice {
  price_id: number;
  size: string;
  price: number;
  preparation_time: number;
}

interface SearchResult {
  id: number;
  name: string;
  description: string;
  category: string;
  image_url?: string;
}

const ChefMenu: React.FC = () => {
  // State management
  const [menuItems, setMenuItems] = useState<Food[]>([]);
  const [filteredMenuItems, setFilteredMenuItems] = useState<Food[]>([]);
  const [menuSearchTerm, setMenuSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Form states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [foodSearchTerm, setFoodSearchTerm] = useState('');
  const [selectedFood, setSelectedFood] = useState<SearchResult | null>(null);
  const [isNewFood, setIsNewFood] = useState(true);
  const [editingItem, setEditingItem] = useState<Food | null>(null);
  const [editedPrices, setEditedPrices] = useState<FoodPrice[]>([]);
  const [editFormData, setEditFormData] = useState({
    category: '',
    description: '',
    is_available: false
  });
  
  // Enhanced form states for multiple sizes and dietary options
  const [priceVariants, setPriceVariants] = useState<Array<{
    size: string;
    price: number;
    preparation_time: number;
  }>>([{ size: 'Medium', price: 0, preparation_time: 15 }]);
  const [dietaryType, setDietaryType] = useState<'vegetarian' | 'vegan' | 'non-vegetarian'>('vegetarian');
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
    show: boolean;
  }>({ message: '', type: 'success', show: false });

  // Load menu items on component mount
  useEffect(() => {
    loadMenuItems();
  }, []);

  // Helper function to get suggested preparation time based on size
  const getSuggestedPrepTime = (size: string): number => {
    const baseTimes = {
      'Small': 10,
      'Medium': 15,
      'Large': 25,
      'Extra Large': 35,
      'Family Size': 45
    };
    return baseTimes[size as keyof typeof baseTimes] || 15;
  };

  // Add new price variant
  const addPriceVariant = () => {
    setPriceVariants([...priceVariants, {
      size: 'Medium',
      price: 0,
      preparation_time: 15
    }]);
  };

  // Remove price variant
  const removePriceVariant = (index: number) => {
    if (priceVariants.length > 1) {
      setPriceVariants(priceVariants.filter((_, i) => i !== index));
    }
  };

  // Update price variant
  const updatePriceVariant = (index: number, field: string, value: any) => {
    const updated = [...priceVariants];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-update preparation time when size changes
    if (field === 'size') {
      updated[index].preparation_time = getSuggestedPrepTime(value);
    }
    
    setPriceVariants(updated);
  };

  // Reset form function
  const resetForm = () => {
    setFoodSearchTerm('');
    setSelectedFood(null);
    setIsNewFood(true);
    setPriceVariants([{ size: 'Medium', price: 0, preparation_time: 15 }]);
    setDietaryType('vegetarian');
    setShowSearchResults(false);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
  };

  // Auto-hide notification after 4 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  // Custom notification functions
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type, show: true });
  };

  const showSuccess = (message: string) => showNotification(message, 'success');
  const showError = (message: string) => showNotification(message, 'error');

  // Load chef's menu items
  const loadMenuItems = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        showError('Please log in to view your menu');
        return;
      }
      
      console.log('Loading menu items with token:', token.substring(0, 20) + '...');
      
      const response = await axios.get('http://127.0.0.1:8000/api/food/chef/foods/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Menu API response:', response.data);
      
      // Handle different response structures
      let data = [];
      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data?.results) {
        data = response.data.results;
      } else if (response.data?.food) {
        data = [response.data.food];
      }
      
      console.log('Processed menu data:', data);
      setMenuItems(data);
      setFilteredMenuItems(data);
      
      if (data.length === 0) {
        console.log('No menu items found for this chef');
      }
      
    } catch (error: any) {
      console.error('Error loading menu items:', error);
      
      if (error.response?.status === 401) {
        showError('Your session has expired. Please log in again.');
        // Redirect to login if needed
        localStorage.removeItem('access_token');
      } else {
        showError('Error loading menu items. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Search for existing foods
  const searchFoods = async (query: string) => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        showError('Please log in to search foods');
        return;
      }
      
      console.log('Searching for foods with query:', query);
      
      const response = await axios.get(`http://127.0.0.1:8000/api/food/chef/foods/search/?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Search response:', response.data);
      setSearchResults(response.data);
      setShowSearchResults(true);
      
    } catch (error: any) {
      console.error('Error searching foods:', error);
      setSearchResults([]);
      setShowSearchResults(false);
      
      if (error.response?.status === 401) {
        showError('Your session has expired. Please log in again.');
      } else {
        showError('Error searching foods. Please try again.');
      }
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
    
    // If value is empty or less than 2 characters, hide search results
    if (value.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    // Set new timeout for debounced search
    const newTimeout = setTimeout(() => {
      searchFoods(value);
    }, 300);
    
    setSearchTimeout(newTimeout);
  };

  // Handle clicking outside or pressing escape to close search results
  const handleCloseSearch = () => {
    setShowSearchResults(false);
    setSearchResults([]);
  };

  // Handle menu items search/filter
  const handleMenuSearch = (searchTerm: string) => {
    setMenuSearchTerm(searchTerm);
    
    if (!searchTerm.trim()) {
      setFilteredMenuItems(menuItems);
      return;
    }
    
    const filtered = menuItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredMenuItems(filtered);
  };

  // Handle input focus to show search results if they exist
  const handleInputFocus = () => {
    if (searchResults.length > 0 && foodSearchTerm.length >= 2) {
      setShowSearchResults(true);
    }
  };

  // Handle any form field focus to hide search results
  const handleFormFieldFocus = () => {
    setShowSearchResults(false);
  };

  // Handle selecting an existing food
  const handleSelectFood = (food: SearchResult) => {
    setSelectedFood(food);
    setFoodSearchTerm(food.name);
    setIsNewFood(false);
    setShowSearchResults(false);
    
    // Auto-populate form fields for existing food
    setTimeout(() => {
      const form = document.querySelector('form') as HTMLFormElement;
      if (form) {
        // Set category if available
        const categoryInput = form.querySelector('input[name="category"]') as HTMLInputElement;
        if (categoryInput && food.category) {
          categoryInput.value = food.category;
        }
        
        // Set description if available
        const descInput = form.querySelector('textarea[name="description"]') as HTMLTextAreaElement;
        if (descInput && food.description) {
          descInput.value = food.description;
        }
        
        // Set hidden field for existing food data
        const hiddenDescInput = form.querySelector('input[name="auto_description"]') as HTMLInputElement;
        if (hiddenDescInput) {
          hiddenDescInput.value = food.description || '';
        }
      }
    }, 100);
  };

  // Handle form submission for new food or new price
const handleAddFood = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  setIsSubmitting(true);

  console.log("Form submission started");
  const formData = new FormData(event.currentTarget);

  // Debug: Log all form data
  console.log("Form data entries:");
  for (const [key, value] of formData.entries()) {
    console.log(`${key}:`, value);
  }

  // Basic validation
  const foodName = formData.get("name") as string;

  if (!foodName?.trim()) {
    showError("Please enter a food name");
    setIsSubmitting(false);
    return;
  }

  // Validate price variants
  if (priceVariants.length === 0) {
    showError("Please add at least one size and price variant");
    setIsSubmitting(false);
    return;
  }

  // Check for duplicate sizes
  const sizes = priceVariants.map((v) => v.size);
  if (new Set(sizes).size !== sizes.length) {
    showError("Each size variant must be unique.");
    setIsSubmitting(false);
    return;
  }

  for (const variant of priceVariants) {
    if (!variant.size || variant.price <= 0 || variant.preparation_time <= 0) {
      showError("Each variant must have valid size, price, and preparation time");
      setIsSubmitting(false);
      return;
    }
  }

  if (isNewFood) {
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    if (!description?.trim()) {
      showError("Please enter a description");
      setIsSubmitting(false);
      return;
    }
    if (!category?.trim()) {
      showError("Please enter a category");
      setIsSubmitting(false);
      return;
    }
  } else if (!selectedFood) {
    showError("Please select a food item");
    setIsSubmitting(false);
    return;
  }

  try {
    const token = localStorage.getItem("access_token");
    if (!token) {
      showError("Please log in again");
      setIsSubmitting(false);
      return;
    }

    let response;

    if (isNewFood) {
      // Prepare FormData for new food
      const foodFormData = new FormData();
      foodFormData.append("name", foodName);
      foodFormData.append("category", formData.get("category") as string);
      foodFormData.append("description", formData.get("description") as string);

      // Convert ingredients to JSON string
      const ingredientsText = (formData.get("ingredients") as string) || "";
      const ingredientsArray = ingredientsText
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
      foodFormData.append("ingredients", JSON.stringify(ingredientsArray));

      // Handle dietary type
      foodFormData.append(
        "is_vegetarian",
        dietaryType === "vegetarian" ? "true" : "false"
      );
      foodFormData.append("is_vegan", dietaryType === "vegan" ? "true" : "false");
      foodFormData.append("spice_level", (formData.get("spice_level") as string) || "");
      foodFormData.append("is_available", "true");

      // ✅ Handle image upload (optional)
      const imageFile = formData.get("image") as File;
      if (imageFile && imageFile.size > 0) {
        foodFormData.append("image", imageFile);
        console.log("✅ Image file attached:", imageFile.name, "Size:", imageFile.size);
      } else {
        console.log("ℹ️ No image file provided - proceeding without image");
      }

      // Add primary price variant
      const primaryVariant = priceVariants[0];
      foodFormData.append("price", primaryVariant.price.toString());
      foodFormData.append("size", primaryVariant.size);
      foodFormData.append("preparation_time", primaryVariant.preparation_time.toString());

      response = await axios.post(
        "http://127.0.0.1:8000/api/food/chef/foods/",
        foodFormData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("✅ New food creation response:", response.data);
      // ... rest of your logic (variants + success handling)
    } else {
      // ... existing food variant logic (unchanged)
    }

    resetForm();
    setIsAddDialogOpen(false);
    await loadMenuItems();
  } catch (error: any) {
    console.error("❌ Error submitting:", error);
    console.error("Error response data:", error.response?.data);

    let errorMessage = "Error submitting. Please try again.";
    if (error.response?.data) {
      if (typeof error.response.data === "object") {
        const errors = [];
        for (const [field, messages] of Object.entries(error.response.data)) {
          if (Array.isArray(messages)) {
            errors.push(`${field}: ${messages.join(", ")}`);
          } else {
            errors.push(`${field}: ${messages}`);
          }
        }
        if (errors.length > 0) errorMessage = errors.join("\n");
      } else {
        errorMessage = error.response.data;
      }
    }
    showError(errorMessage);
  } finally {
    setIsSubmitting(false);
  }
};




  // Handle edit food
  const handleEditFood = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsUpdating(true);
    const formData = new FormData(event.currentTarget);
    
    if (!editingItem) {
      showError('No item selected for editing');
      setIsUpdating(false);
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        showError('Please log in again');
        setIsUpdating(false);
        return;
      }
      
      // Update food basic info - only send allowed fields
      const updateData = {
        is_available: editFormData.is_available
        // Note: description and category updates are restricted by backend
      };

      console.log('Updating food with data:', updateData);

      const response = await axios.patch(`http://127.0.0.1:8000/api/food/chef/foods/${editingItem.food_id}/`, updateData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Update prices if there are changes
      for (const price of editedPrices) {
        const priceData = {
          price: price.price,
          preparation_time: price.preparation_time,
          size: price.size
        };

        await axios.patch(`http://127.0.0.1:8000/api/food/chef/prices/${price.price_id}/`, priceData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      showSuccess('Food updated successfully!');
      
      // Reset states first
      setIsEditDialogOpen(false);
      setEditingItem(null);
      setEditedPrices([]);
      setEditFormData({
        category: '',
        description: '',
        is_available: false
      });
      
      // Reload menu items
      await loadMenuItems();
      
    } catch (error: any) {
      console.error('Error updating food:', error);
      
      let errorMessage = 'Error updating food. Please try again.';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (typeof error.response.data === 'object') {
          // Handle field-specific validation errors
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
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      showError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle price changes in edit mode
  const handlePriceChange = (priceId: number, field: keyof FoodPrice, value: string | number) => {
    setEditedPrices(prev => {
      const existing = prev.find(p => p.price_id === priceId);
      if (existing) {
        return prev.map(p => p.price_id === priceId ? { ...p, [field]: value } : p);
      } else {
        const originalPrice = editingItem?.prices.find(p => p.price_id === priceId);
        if (originalPrice) {
          return [...prev, { ...originalPrice, [field]: value }];
        }
        return prev;
      }
    });
  };

  // Get edited price value or original value
  const getPriceValue = (price: FoodPrice, field: keyof FoodPrice) => {
    const editedPrice = editedPrices.find(p => p.price_id === price.price_id);
    return editedPrice ? editedPrice[field] : price[field];
  };

  // Handle delete food
  const handleDeleteFood = async (foodId: number) => {
    if (!confirm('Are you sure you want to delete this food item?')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`http://127.0.0.1:8000/api/food/chef/foods/${foodId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      showSuccess('Food deleted successfully!');
      await loadMenuItems();
      
    } catch (error: any) {
      console.error('Error deleting food:', error);
      showError('Error deleting food. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-foreground"></div>
      </div>
    );
  }

  return (
    <>
      {/* Custom Notification */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-[10000] animate-in slide-in-from-top-2">
          <div className={`px-4 py-3 rounded-lg shadow-lg max-w-sm ${
            notification.type === 'success' 
              ? 'bg-green-600 text-white' 
              : 'bg-red-600 text-white'
          }`}>
            <div className="flex items-center space-x-2">
              {notification.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className="text-sm font-medium">{notification.message}</span>
              <button
                onClick={() => setNotification(prev => ({ ...prev, show: false }))}
                className="ml-2 text-foreground hover:text-muted-foreground"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Menu</h1>
          <p className="text-muted-foreground mt-2">Manage your food items and prices</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Menu Search Filter */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search menu items..."
              value={menuSearchTerm}
              onChange={(e) => handleMenuSearch(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) resetForm();
          }}>
  <DialogTrigger asChild>
    <Button onClick={resetForm}>
      <Plus className="mr-2 h-4 w-4" />
      Add Food Item
    </Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-md lg:max-w-2xl max-h-[90vh] overflow-y-auto z-[9999]">
    <DialogHeader>
      <DialogTitle>Add Food Item</DialogTitle>
      <DialogDescription>
        Search for existing food or create a new one
      </DialogDescription>
    </DialogHeader>

    <form onSubmit={handleAddFood} className="space-y-6 py-4" noValidate>
      {/* Food Name with Search */}
      <div className="space-y-2 relative">
        <Label htmlFor="name">Food Name</Label>
        <Input
          id="name"
          name="name"
          value={foodSearchTerm}
          onChange={(e) => handleFoodNameChange(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={() => setTimeout(() => setShowSearchResults(false), 150)}
          placeholder="Search existing food or enter new name"
          className="w-full"
        />
        {/* Search Results Dropdown */}
        {showSearchResults && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={handleCloseSearch}
            ></div>
            <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto dark:bg-background dark:border-border">
              {searchResults.length > 0 ? (
                searchResults.map((food) => (
                  <div
                    key={food.id}
                    className="p-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
                    onClick={() => handleSelectFood(food)}
                  >
                    <div className="font-medium text-foreground">{food.name}</div>
                    <div className="text-sm text-muted-foreground">{food.category}</div>
                    <div className="text-xs text-muted-foreground mt-1">{food.description}</div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground border-t-2 border-orange-200 dark:border-orange-800">
                  <p className="font-medium">No existing foods found for "{foodSearchTerm}"</p>
                  <p className="text-sm mt-1 mb-3">You can create a new food item with this name</p>
                  <div className="space-y-2">
                    <Button 
                      type="button"
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={handleCloseSearch}
                    >
                      ✓ Continue Creating New Food
                    </Button>
                    <p className="text-xs text-muted-foreground">or click outside to dismiss</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Existing Food Info */}
      {selectedFood && !isNewFood && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start space-x-3">
            {selectedFood.image_url ? (
              <img 
                src={selectedFood.image_url} 
                alt={selectedFood.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
            ) : (
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">{selectedFood.name}</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{selectedFood.category}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{selectedFood.description}</p>
              <div className="mt-2 p-2 bg-blue-100 dark:bg-blue-900 rounded text-xs text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> You can only set price, size, and preparation time for existing foods.
              </div>
            </div>
          </div>
          <input type="hidden" name="auto_description" defaultValue={selectedFood.description} />
        </div>
      )}

      {/* New Food Fields */}
      {isNewFood && (
        <div className="space-y-6 border-t border-border pt-6">
          <h4 className="text-lg font-semibold text-foreground mb-4">New Food Information</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Input 
                id="category" 
                name="category" 
                placeholder="e.g., Main Course, Dessert, Appetizer"
                onFocus={handleFormFieldFocus}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="spice_level">Spice Level</Label>
              <select
                id="spice_level"
                name="spice_level"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="">Select spice level</option>
                <option value="mild">Mild</option>
                <option value="medium">Medium</option>
                <option value="hot">Hot</option>
                <option value="very_hot">Very Hot</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe your dish in detail..."
              rows={4}
              onFocus={handleFormFieldFocus}
              className="w-full"
            />
          </div>

          {/* Ingredients as comma-separated → JSON */}
          <div className="space-y-2">
            <Label htmlFor="ingredients">Ingredients</Label>
            <Textarea
              id="ingredients"
              name="ingredients"
              placeholder="List main ingredients (comma separated)"
              rows={3}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Image (Optional)</Label>
            <Input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80 w-full"
            />
          </div>

          {/* Dietary Type - Radio Buttons */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Dietary Type *</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="vegetarian"
                  name="dietary_type"
                  value="vegetarian"
                  checked={dietaryType === 'vegetarian'}
                  onChange={(e) => setDietaryType(e.target.value as any)}
                  className="h-4 w-4 text-green-600"
                />
                <Label htmlFor="vegetarian" className="text-sm font-medium flex items-center">
                  🥗 Vegetarian
                </Label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="vegan"
                  name="dietary_type"
                  value="vegan"
                  checked={dietaryType === 'vegan'}
                  onChange={(e) => setDietaryType(e.target.value as any)}
                  className="h-4 w-4 text-green-600"
                />
                <Label htmlFor="vegan" className="text-sm font-medium flex items-center">
                  🌱 Vegan
                </Label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="non-vegetarian"
                  name="dietary_type"
                  value="non-vegetarian"
                  checked={dietaryType === 'non-vegetarian'}
                  onChange={(e) => setDietaryType(e.target.value as any)}
                  className="h-4 w-4 text-red-600"
                />
                <Label htmlFor="non-vegetarian" className="text-sm font-medium flex items-center">
                  🍖 Non-Vegetarian
                </Label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multiple Size Pricing Information */}
      <div className="space-y-4 border-t border-border pt-6">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-foreground">Size & Pricing Information</h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addPriceVariant}
            className="text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Size
          </Button>
        </div>
        
        <div className="space-y-4">
          {priceVariants.map((variant, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Size *</Label>
                <select
                  value={variant.size}
                  onChange={(e) => updatePriceVariant(index, 'size', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  required
                >
                  <option value="Small">Small</option>
                  <option value="Medium">Medium</option>
                  <option value="Large">Large</option>
                  <option value="Extra Large">Extra Large</option>
                  <option value="Family Size">Family Size</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Price (LKR) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                    Rs.
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={variant.price || ''}
                    onChange={(e) => {
                      const value = Math.max(0, parseFloat(e.target.value) || 0);
                      updatePriceVariant(index, 'price', value);
                    }}
                    placeholder="0.00"
                    className="pl-10 w-full"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">Sri Lankan Rupees</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Prep Time (min) *</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="1"
                    value={variant.preparation_time || ''}
                    onChange={(e) => {
                      const value = Math.max(1, parseInt(e.target.value) || 1);
                      updatePriceVariant(index, 'preparation_time', value);
                    }}
                    placeholder="15"
                    className="w-full"
                    required
                  />
                  <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">Minutes to prepare</p>
              </div>
              
              <div className="flex items-end">
                {priceVariants.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removePriceVariant(index)}
                    className="w-full"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Price Summary */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">📋 Price Summary</h5>
          <div className="space-y-1">
            {priceVariants.map((variant, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-blue-700 dark:text-blue-300">{variant.size}:</span>
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  Rs. {variant.price?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'} 
                  <span className="text-blue-600 dark:text-blue-400 ml-1">({variant.preparation_time} min)</span>
                </span>
              </div>
            ))}
          </div>
          {!isNewFood && (
            <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> Adding new size variants for existing food "{selectedFood?.name}"
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-border">
        <Button type="button" variant="outline" onClick={() => { 
          resetForm(); 
          setIsAddDialogOpen(false); 
        }} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" className="min-w-[120px]" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {isNewFood ? 'Creating...' : 'Adding...'}
            </>
          ) : (
            isNewFood ? 'Create Food Item' : 'Add Price Variant'
          )}
        </Button>
      </div>
    </form>
  </DialogContent>
      </Dialog>


      </div>
      </div>

      {/* Menu Items Grid */}
      {filteredMenuItems.length === 0 ? (
        <div className="text-center py-12">
          {menuItems.length === 0 ? (
            <>
              <div className="text-gray-400 mb-4">
                <Users className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No food items yet</h3>
              <p className="text-muted-foreground mb-6">Start building your menu by adding your first food item.</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Food Item
              </Button>
            </>
          ) : (
            <>
              <div className="text-gray-400 mb-4">
                <Search className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No items match your search</h3>
              <p className="text-muted-foreground mb-6">Try adjusting your search terms or browse all items.</p>
              <Button onClick={() => handleMenuSearch('')} variant="outline">
                Clear Search
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMenuItems.map((food) => (
            <Card key={food.food_id} className="overflow-hidden">
              <div className="relative">
                {food.image_url ? (
                  <img
                    src={food.image_url}
                    alt={food.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-muted flex items-center justify-center">
                    <Users className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                
                {/* Status indicator */}
                <div className="absolute top-2 right-2">
                  <Badge
                    variant={food.is_available ? "default" : "secondary"}
                    className={food.is_available ? "bg-green-500" : "bg-red-500"}
                  >
                    {food.is_available ? (
                      <>
                        <Eye className="w-3 h-3 mr-1" />
                        Available
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3 mr-1" />
                        Unavailable
                      </>
                    )}
                  </Badge>
                </div>

                {/* Approval status */}
                <div className="absolute top-2 left-2">
                  <Badge
                    variant={food.status === 'Approved' ? "default" : food.status === 'Pending' ? "secondary" : "destructive"}
                    className={
                      food.status === 'Approved' 
                        ? "bg-green-600" 
                        : food.status === 'Pending' 
                          ? "bg-yellow-600" 
                          : "bg-red-600"
                    }
                  >
                    {food.status}
                  </Badge>
                </div>
              </div>
              
              <CardHeader>
                <CardTitle className="text-lg">{food.name}</CardTitle>
                <CardDescription className="text-sm line-clamp-2">
                  {food.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {/* Category */}
                  <div className="text-sm text-muted-foreground">
                    <strong>Category:</strong> {food.category}
                  </div>

                  {/* Prices */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-foreground">Prices:</div>
                    {food.prices && food.prices.length > 0 ? (
                      <div className="grid gap-2">
                        {food.prices.map((price) => (
                          <div key={price.price_id} className="flex justify-between items-center text-sm bg-muted/50 rounded-lg p-2">
                            <span className="font-medium">{price.size}</span>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <div className="flex items-center">
                                <div className="w-3 h-3 mr-1" />
                                Rs. {price.price}
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {price.preparation_time}min
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No prices set</p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                    <span>★ {Number(food.rating_average).toFixed(1)} ({food.total_reviews} reviews)</span>
                    <span>{food.total_orders} orders</span>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center space-x-2 pt-4">
                    {/* Quick availability toggle */}
                    <Button
                      variant={food.is_available ? "outline" : "default"}
                      size="sm"
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem('access_token');
                          if (!token) {
                            showError('Please log in again');
                            return;
                          }
                          
                          const updateData = {
                            is_available: !food.is_available
                          };

                          await axios.patch(`http://127.0.0.1:8000/api/food/chef/foods/${food.food_id}/`, updateData, {
                            headers: {
                              'Authorization': `Bearer ${token}`,
                              'Content-Type': 'application/json'
                            }
                          });

                          await loadMenuItems();
                          
                          // If there's an active search, reapply the filter
                          if (menuSearchTerm) {
                            handleMenuSearch(menuSearchTerm);
                          }
                          
                        } catch (error: any) {
                          console.error('Error updating availability:', error);
                          showError('Error updating availability. Please try again.');
                        }
                      }}
                    >
                      {food.is_available ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                    
                    <div className="flex space-x-2">
                      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingItem(food);
                              setEditedPrices([]);
                              setEditFormData({
                                category: food.category,
                                description: food.description,
                                is_available: food.is_available
                              });
                            }}
                          >
                            <Edit3 className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto z-[9999]">
                          <DialogHeader>
                            <DialogTitle>Edit Food Item</DialogTitle>
                            <DialogDescription>
                              Update food details, prices, and availability
                            </DialogDescription>
                          </DialogHeader>
                          
                          {editingItem && (
                            <form onSubmit={handleEditFood} className="space-y-6">
                              <div className="space-y-2">
                                <Label>Food Name</Label>
                                <Input value={editingItem.name} disabled className="bg-muted" />
                              </div>

                              {/* Basic Information */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit_category">Category</Label>
                                  <Input 
                                    id="edit_category"
                                    name="category"
                                    value={editFormData.category}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, category: e.target.value }))}
                                    placeholder="e.g., Main Course, Dessert"
                                  />
                                </div>
                                
                                <div className="flex items-center space-x-3 pt-8">
                                  <input
                                    type="checkbox"
                                    id="is_available"
                                    name="is_available"
                                    checked={editFormData.is_available}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, is_available: e.target.checked }))}
                                    className="rounded border-border h-4 w-4"
                                  />
                                  <Label htmlFor="is_available" className="text-sm font-medium">
                                    Available for orders
                                  </Label>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="edit_description">Description</Label>
                                <Textarea
                                  id="edit_description"
                                  name="description"
                                  value={editFormData.description}
                                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                                  placeholder="Describe your dish..."
                                  rows={3}
                                />
                              </div>

                              {/* Prices Section */}
                              <div className="space-y-4 border-t pt-4">
                                <h4 className="font-semibold text-foreground">Prices & Preparation Times</h4>
                                {editingItem.prices && editingItem.prices.length > 0 ? (
                                  <div className="space-y-3">
                                    {editingItem.prices.map((price, index) => (
                                      <div key={price.price_id} className="grid grid-cols-3 gap-4 p-4 border border-border rounded-lg bg-muted/50">
                                        <div className="space-y-2">
                                          <Label>Size</Label>
                                          <select
                                            value={getPriceValue(price, 'size') as string}
                                            onChange={(e) => handlePriceChange(price.price_id, 'size', e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                          >
                                            <option value="Small">Small</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Large">Large</option>
                                          </select>
                                        </div>
                                        
                                        <div className="space-y-2">
                                          <Label>Price (Rs.)</Label>
                                          <Input
                                            type="number"
                                            step="0.01"
                                            value={getPriceValue(price, 'price') as number}
                                            onChange={(e) => handlePriceChange(price.price_id, 'price', parseFloat(e.target.value))}
                                            placeholder="0.00"
                                          />
                                        </div>
                                        
                                        <div className="space-y-2">
                                          <Label>Prep Time (min)</Label>
                                          <Input
                                            type="number"
                                            value={getPriceValue(price, 'preparation_time') as number}
                                            onChange={(e) => handlePriceChange(price.price_id, 'preparation_time', parseInt(e.target.value))}
                                            placeholder="15"
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">No prices set for this item</p>
                                )}
                              </div>

                              <div className="flex justify-end space-x-3 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={() => {
                                  setIsEditDialogOpen(false);
                                  setEditFormData({
                                    category: '',
                                    description: '',
                                    is_available: false
                                  });
                                }} disabled={isUpdating}>
                                  Cancel
                                </Button>
                                <Button type="submit" disabled={isUpdating}>
                                  {isUpdating ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                      Updating...
                                    </>
                                  ) : (
                                    'Update Food Item'
                                  )}
                                </Button>
                              </div>
                            </form>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteFood(food.food_id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
    </>
  );
};

export default ChefMenu;