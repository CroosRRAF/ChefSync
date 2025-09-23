import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  ChefHat, Filter, Search, Star, Clock, Users, Utensils, DollarSign, 
  Heart, MapPin, Truck, ShoppingBag, X, Gift, Percent, RotateCcw,
  Eye, ChevronRight, Plus, Minus, Leaf, Sun, Moon, Settings,
  Bell, User, LogOut, Menu as MenuIcon, Home, History, 
  TrendingUp, Award, Zap, Target, Flame, Shield, Sparkles, Check
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "@/context/ThemeContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

interface FoodItem {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  rating: number;
  prep_time: number;
  is_vegetarian: boolean;
  is_spicy: boolean;
  category?: string;
  cuisine?: string;
  available_cooks?: any[];
}

interface Category {
  value: string;
  label: string;
}

const Menu: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const orderMode = searchParams.get('mode') || 'normal';
  
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFoodItem, setSelectedFoodItem] = useState<FoodItem | null>(null);
  const [activeCooks, setActiveCooks] = useState([]);
  const [cookModalOpen, setCookModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDelivery, setIsDelivery] = useState(true);
  const [favorites, setFavorites] = useState(new Set<string>());
  const [recentlyViewed, setRecentlyViewed] = useState<FoodItem[]>([]);
  const [lastOrders, setLastOrders] = useState<FoodItem[]>([]);
  const [cart, setCart] = useState<FoodItem[]>([]);
  const [notifications, setNotifications] = useState(3);
  const [userProfile, setUserProfile] = useState({
    name: "John Doe",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face",
    level: "Gold",
    points: 1250
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    category: "",
    minPrice: 0,
    maxPrice: 50,
    isVegetarian: false,
    isSpicy: false,
    search: "",
    cuisine: "",
    rating: 0,
    prepTime: 120,
    sortBy: "popularity"
  });

  // Mock data for last orders and recently viewed
  const mockLastOrders: FoodItem[] = [
    { 
      id: "1", 
      name: "Margherita Pizza", 
      description: "Classic pizza with tomato and mozzarella",
      image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400&h=300&fit=crop", 
      price: 18.99, 
      rating: 4.5,
      prep_time: 25,
      is_vegetarian: true,
      is_spicy: false
    },
    { 
      id: "2", 
      name: "Butter Chicken", 
      description: "Creamy tomato-based curry with tender chicken",
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop", 
      price: 22.50, 
      rating: 4.7,
      prep_time: 30,
      is_vegetarian: false,
      is_spicy: true
    }
  ];

  const mockOffers = [
    { id: "1", title: "50% OFF", subtitle: "On orders above $30", code: "SAVE50", color: "bg-red-500", icon: Percent },
    { id: "2", title: "FREE DELIVERY", subtitle: "No minimum order", code: "FREEDEL", color: "bg-green-500", icon: Truck },
    { id: "3", title: "20% OFF", subtitle: "First time users", code: "NEW20", color: "bg-blue-500", icon: Gift },
    { id: "4", title: "FLASH SALE", subtitle: "Limited time only", code: "FLASH", color: "bg-purple-500", icon: Zap }
  ];

  const mockStats = [
    { label: "Total Orders", value: "1,247", icon: ShoppingBag, color: "text-blue-600" },
    { label: "Saved Money", value: "$342", icon: DollarSign, color: "text-green-600" },
    { label: "Favorite Dishes", value: "23", icon: Heart, color: "text-red-600" },
    { label: "Cooks Rated", value: "156", icon: Star, color: "text-yellow-600" }
  ];

  const mockAchievements = [
    { title: "First Order", description: "Placed your first order", icon: Target, completed: true },
    { title: "Food Explorer", description: "Tried 10 different dishes", icon: Eye, completed: true },
    { title: "Loyal Customer", description: "Ordered 50+ times", icon: Award, completed: false },
    { title: "Speed Demon", description: "Ordered within 5 minutes", icon: Zap, completed: false }
  ];

  const cuisineOptions = [
    { value: "", label: "All Cuisines" },
    { value: "indian", label: "Indian" },
    { value: "chinese", label: "Chinese" },
    { value: "italian", label: "Italian" },
    { value: "mexican", label: "Mexican" },
    { value: "thai", label: "Thai" },
    { value: "japanese", label: "Japanese" }
  ];

  const sortOptions = [
    { value: "popularity", label: "Most Popular" },
    { value: "rating", label: "Highest Rated" },
    { value: "price_low", label: "Price: Low to High" },
    { value: "price_high", label: "Price: High to Low" },
    { value: "prep_time", label: "Fastest Prep" },
    { value: "newest", label: "Newest First" }
  ];

  // Fetch initial data
  useEffect(() => {
    fetchCategories();
    fetchFoodItems();
    // Set mock data
    setLastOrders(mockLastOrders);
    setRecentlyViewed(mockLastOrders.slice(0, 1));
  }, []);

  // Fetch food items when filters change
  useEffect(() => {
    fetchFoodItems();
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      // Fallback categories
      setCategories([
        { value: "appetizers", label: "Appetizers" },
        { value: "main_course", label: "Main Course" },
        { value: "desserts", label: "Desserts" },
        { value: "beverages", label: "Beverages" },
        { value: "snacks", label: "Snacks" },
        { value: "salads", label: "Salads" }
      ]);
    }
  };

  const fetchFoodItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.category) params.append('category', filters.category);
      if (filters.cuisine) params.append('cuisine', filters.cuisine);
      if (filters.minPrice > 0) params.append('min_price', filters.minPrice.toString());
      if (filters.maxPrice < 50) params.append('max_price', filters.maxPrice.toString());
      if (filters.rating > 0) params.append('min_rating', filters.rating.toString());
      if (filters.prepTime < 120) params.append('max_prep_time', filters.prepTime.toString());
      if (filters.isVegetarian) params.append('is_vegetarian', 'true');
      if (filters.isSpicy) params.append('is_spicy', 'true');
      if (filters.search) params.append('search', filters.search);
      if (filters.sortBy) params.append('sort_by', filters.sortBy);

      const response = await axios.get(`${API}/food-items?${params}`);
      setFoodItems(response.data);
    } catch (error) {
      console.error("Error fetching food items:", error);
      // Fallback to mock data with filtering
      let filteredItems = [...mockLastOrders];
      
      // Apply client-side filtering for mock data
      if (filters.search) {
        filteredItems = filteredItems.filter(item => 
          item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          item.description.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      
      if (filters.category) {
        filteredItems = filteredItems.filter(item => item.category === filters.category);
      }
      
      if (filters.minPrice > 0) {
        filteredItems = filteredItems.filter(item => item.price >= filters.minPrice);
      }
      
      if (filters.maxPrice < 50) {
        filteredItems = filteredItems.filter(item => item.price <= filters.maxPrice);
      }
      
      if (filters.rating > 0) {
        filteredItems = filteredItems.filter(item => item.rating >= filters.rating);
      }
      
      if (filters.prepTime < 120) {
        filteredItems = filteredItems.filter(item => item.prep_time <= filters.prepTime);
      }
      
      if (filters.isVegetarian) {
        filteredItems = filteredItems.filter(item => item.is_vegetarian);
      }
      
      if (filters.isSpicy) {
        filteredItems = filteredItems.filter(item => item.is_spicy);
      }
      
      setFoodItems(filteredItems);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveCooks = async (foodId: string) => {
    try {
      console.log("Fetching cooks for food ID:", foodId);
      const response = await axios.get(`${API}/food-items/${foodId}/cooks`);
      console.log("Cooks data received:", response.data);
      setSelectedFoodItem(response.data.food_item);
      setActiveCooks(response.data.active_cooks);
      setCookModalOpen(true);
      console.log("Modal should now be open");
      
      // Add to recently viewed
      const item = response.data.food_item;
      setRecentlyViewed(prev => {
        const filtered = prev.filter(i => i.id !== item.id);
        return [item, ...filtered].slice(0, 5); // Keep only 5 recent items
      });
    } catch (error) {
      console.error("Error fetching active cooks:", error);
    }
  };

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      minPrice: 0,
      maxPrice: 50,
      isVegetarian: false,
      isSpicy: false,
      search: "",
      cuisine: "",
      rating: 0,
      prepTime: 120,
      sortBy: "popularity"
    });
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleFavorite = (itemId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(itemId)) {
        newFavorites.delete(itemId);
      } else {
        newFavorites.add(itemId);
      }
      return newFavorites;
    });
  };

  const addToCart = (item: FoodItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => 
          i.id === item.id ? { ...i, quantity: (i as any).quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing && (existing as any).quantity > 1) {
        return prev.map(i => 
          i.id === itemId ? { ...i, quantity: (i as any).quantity - 1 } : i
        );
      }
      return prev.filter(i => i.id !== itemId);
    });
  };

  const getCartQuantity = (itemId: string): number => {
    const cartItem = cart.find(item => item.id === itemId);
    return cartItem ? (cartItem as any).quantity : 0;
  };

  const getTotalCartItems = () => {
    return cart.reduce((sum, item) => sum + ((item as any).quantity || 0), 0);
  };

  const getTotalCartValue = () => {
    return cart.reduce((total, item) => total + (item.price * ((item as any).quantity || 0)), 0);
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      appetizers: "🥗",
      main_course: "🍽️",
      desserts: "🍰",
      beverages: "🥤",
      snacks: "🍿",
      salads: "🥙"
    };
    return icons[category] || "🍽️";
  };

  const FoodCard = ({ item, showAddButton = false, isSmall = false }: { 
    item: FoodItem; 
    showAddButton?: boolean; 
    isSmall?: boolean; 
  }) => (
    <Card 
      className={`overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 ${isSmall ? 'w-48' : ''}`}
      onClick={(e) => {
        e.preventDefault();
        console.log("Card clicked for item:", item.name, item.id);
        fetchActiveCooks(item.id);
      }}
    >
      <div className="relative">
        <img
          src={item.image}
          alt={item.name}
          className={`w-full object-cover ${isSmall ? 'h-24' : 'h-48'}`}
        />
        <button
          className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-50"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(item.id);
          }}
        >
          <Heart 
            className={`h-4 w-4 ${favorites.has(item.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
          />
        </button>
        <div className="absolute top-2 left-2 flex gap-1">
          {item.is_vegetarian && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
              🌱
            </Badge>
          )}
          {item.is_spicy && (
            <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
              🌶️
            </Badge>
          )}
        </div>
      </div>
      <CardContent className={`${isSmall ? 'p-3' : 'p-4'}`}>
        <div className="flex items-start justify-between mb-2">
          <h3 className={`font-semibold line-clamp-1 ${isSmall ? 'text-sm' : 'text-lg'}`}>{item.name}</h3>
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs">{item.rating}</span>
          </div>
        </div>
        {!isSmall && (
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
            {item.description}
          </p>
        )}
        <div className={`flex items-center justify-between ${isSmall ? 'text-xs' : 'text-sm'}`}>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{item.prep_time} min</span>
            <Users className="h-3 w-3" />
            <span>{item.available_cooks?.length || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">${item.price}</span>
            {showAddButton && (
              getCartQuantity(item.id) > 0 ? (
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromCart(item.id);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="font-medium min-w-6 text-center text-xs">
                    {getCartQuantity(item.id)}
                  </span>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(item);
                    }}
                    className="h-6 w-6 p-0 bg-orange-500 hover:bg-orange-600"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button 
                  size="sm" 
                  className="h-6 px-2 text-xs bg-orange-500 hover:bg-orange-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(item);
                  }}
                >
                  Add
                </Button>
              )
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const SectionHeader = ({ title, subtitle, showViewAll = false }: { 
    title: string; 
    subtitle?: string; 
    showViewAll?: boolean; 
  }) => (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {showViewAll && (
        <Button variant="ghost" size="sm" className="text-primary">
          View all <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Professional Search and Filter Bar */}
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-16 z-30 shadow-lg shadow-gray-200/20 dark:shadow-gray-900/20">
        <div className="container mx-auto px-6 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            {/* Enhanced Search Bar */}
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors duration-200" />
              <Input
                placeholder="Search for dishes, cuisines, or chefs..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-12 h-14 bg-gray-50/80 dark:bg-gray-700/80 border-gray-200/60 dark:border-gray-600/60 text-gray-900 dark:text-white rounded-xl shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Professional Filter Controls */}
            <div className="flex items-center gap-4">
              {/* Enhanced Delivery/Pickup Toggle */}
              <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-200/50 dark:border-gray-600/50 shadow-sm">
                <div className="flex items-center gap-2">
                  <Truck className={`h-5 w-5 transition-colors duration-200 ${isDelivery ? 'text-primary' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium transition-colors duration-200 ${isDelivery ? 'text-primary' : 'text-gray-500'}`}>Delivery</span>
                </div>
                <Switch
                  checked={!isDelivery}
                  onCheckedChange={(checked) => setIsDelivery(!checked)}
                  className="scale-90"
                />
                <div className="flex items-center gap-2">
                  <ShoppingBag className={`h-5 w-5 transition-colors duration-200 ${!isDelivery ? 'text-primary' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium transition-colors duration-200 ${!isDelivery ? 'text-primary' : 'text-gray-500'}`}>Pickup</span>
                </div>
              </div>

              {/* Professional Filter Button */}
              <Button
                variant={sidebarOpen ? "default" : "outline"}
                onClick={toggleSidebar}
                className={`flex items-center gap-3 px-6 py-3 h-14 rounded-xl font-medium transition-all duration-300 shadow-sm hover:shadow-md ${
                  sidebarOpen 
                    ? "bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/25" 
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-primary/50"
                }`}
              >
                <Filter className="h-5 w-5" />
                <span className="hidden sm:inline font-semibold">
                  {sidebarOpen ? "Close Filters" : "Advanced Filters"}
                </span>
                <span className="sm:hidden font-semibold">
                  {sidebarOpen ? "Close" : "Filter"}
                </span>
              </Button>

              {/* Enhanced Theme Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-12 w-12 p-0 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-blue-500" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Responsive Layout */}
        <div className="flex gap-6">
          {/* Filter Sidebar */}
          <div className={`${sidebarOpen ? 'block' : 'hidden'} w-full lg:w-80 flex-shrink-0`}>
            <div className={`${sidebarOpen ? 'fixed top-0 left-0 h-full w-80 z-40 lg:relative lg:top-24 lg:h-auto lg:w-auto lg:z-auto' : 'hidden'}`}>
              <Card className="h-full lg:h-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl shadow-gray-200/20 dark:shadow-gray-900/20 rounded-2xl overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-r from-primary/10 to-primary/20 rounded-xl">
                        <Filter className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Smart Filters</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Refine your culinary journey</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={clearFilters}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800 rounded-lg font-medium"
                      >
                        Clear All
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={closeSidebar} 
                        className="lg:hidden hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl p-2"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 max-h-[calc(100vh-200px)] lg:max-h-[calc(100vh-300px)] overflow-y-auto">
                  <div className="space-y-6">
                  {/* Enhanced Sort By */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
                    <label className="text-sm font-bold mb-4 block text-gray-900 dark:text-white flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      Sort By
                    </label>
                    <div className="space-y-3">
                      {sortOptions.map((option) => (
                        <div
                          key={option.value}
                          className={`p-4 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 ${
                            filters.sortBy === option.value 
                              ? "bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/25" 
                              : "bg-white/80 dark:bg-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md border border-gray-200/50 dark:border-gray-700/50"
                          }`}
                          onClick={() => updateFilter('sortBy', option.value)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{option.label}</span>
                            {filters.sortBy === option.value && (
                              <div className="p-1 bg-white/20 rounded-full">
                                <Check className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Categories */}
                  <div>
                    <label className="text-sm font-semibold mb-4 block text-gray-900 dark:text-white flex items-center gap-2">
                      <Utensils className="h-4 w-4 text-primary" />
                      Category
                    </label>
                    <div className="space-y-2">
                      <div 
                        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                          filters.category === "" 
                            ? "bg-primary text-white border-primary shadow-md" 
                            : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600"
                        }`}
                        onClick={() => updateFilter('category', '')}
                      >
                        <span className="text-sm font-medium">🍽️ All Categories</span>
                      </div>
                      {categories.map((category) => (
                        <div
                          key={category.value}
                          className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                            filters.category === category.value 
                              ? "bg-primary text-white border-primary shadow-md" 
                              : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600"
                          }`}
                          onClick={() => updateFilter('category', category.value)}
                        >
                          <span className="text-sm font-medium flex items-center gap-2">
                            <span className="text-lg">{getCategoryIcon(category.value)}</span>
                            {category.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Cuisine */}
                  <div>
                    <label className="text-sm font-semibold mb-4 block text-gray-900 dark:text-white flex items-center gap-2">
                      <ChefHat className="h-4 w-4 text-primary" />
                      Cuisine
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {cuisineOptions.map((cuisine) => (
                        <div
                          key={cuisine.value}
                          className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border text-center ${
                            filters.cuisine === cuisine.value 
                              ? "bg-primary text-white border-primary shadow-md" 
                              : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600"
                          }`}
                          onClick={() => updateFilter('cuisine', cuisine.value)}
                        >
                          <span className="text-sm font-medium">{cuisine.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Price Range */}
                  <div>
                    <label className="text-sm font-semibold mb-4 block text-gray-900 dark:text-white flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      Price Range
                    </label>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="text-center mb-4">
                        <span className="text-lg font-bold text-primary">
                          ${filters.minPrice} - ${filters.maxPrice}
                        </span>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 block">Min Price</label>
                          <Slider
                            value={[filters.minPrice]}
                            onValueChange={(value) => updateFilter('minPrice', value[0])}
                            max={50}
                            step={1}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 block">Max Price</label>
                          <Slider
                            value={[filters.maxPrice]}
                            onValueChange={(value) => updateFilter('maxPrice', value[0])}
                            max={50}
                            step={1}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Rating Filter */}
                  <div>
                    <label className="text-sm font-semibold mb-4 block text-gray-900 dark:text-white flex items-center gap-2">
                      <Star className="h-4 w-4 text-primary" />
                      Minimum Rating
                    </label>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="text-center mb-4">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-2xl font-bold text-primary">{filters.rating}</span>
                          <span className="text-lg text-yellow-500">⭐</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">+ rating</span>
                        </div>
                      </div>
                      <Slider
                        value={[filters.rating]}
                        onValueChange={(value) => updateFilter('rating', value[0])}
                        max={5}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Prep Time Filter */}
                  <div>
                    <label className="text-sm font-semibold mb-4 block text-gray-900 dark:text-white flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Max Prep Time
                    </label>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="text-center mb-4">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-2xl font-bold text-primary">{filters.prepTime}</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">minutes</span>
                        </div>
                      </div>
                      <Slider
                        value={[filters.prepTime]}
                        onValueChange={(value) => updateFilter('prepTime', value[0])}
                        max={120}
                        min={15}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Dietary Preferences */}
                  <div>
                    <label className="text-sm font-semibold mb-4 block text-gray-900 dark:text-white flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-primary" />
                      Dietary Preferences
                    </label>
                    <div className="space-y-3">
                      <div className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                        filters.isVegetarian 
                          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" 
                          : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600"
                      }`}>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="vegetarian"
                            checked={filters.isVegetarian}
                            onCheckedChange={(checked) => updateFilter('isVegetarian', checked)}
                          />
                          <label htmlFor="vegetarian" className="text-sm font-medium cursor-pointer">
                            🌱 Vegetarian
                          </label>
                        </div>
                        {filters.isVegetarian && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200">
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                        filters.isSpicy 
                          ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" 
                          : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600"
                      }`}>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="spicy"
                            checked={filters.isSpicy}
                            onCheckedChange={(checked) => updateFilter('isSpicy', checked)}
                          />
                          <label htmlFor="spicy" className="text-sm font-medium cursor-pointer">
                            🌶️ Spicy
                          </label>
                        </div>
                        {filters.isSpicy && (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200">
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-30 lg:hidden" onClick={closeSidebar}>
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
            </div>
          )}

          {/* Enhanced Main Content */}
          <div className="flex-1 min-w-0">
            <div className="space-y-10">
          {/* Professional Quick Filter Bar */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg shadow-gray-200/10 dark:shadow-gray-900/10">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Filter className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Active Filters:</span>
              </div>
              
              {/* Active Filters Display */}
              {filters.category && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {categories.find(c => c.value === filters.category)?.label || filters.category}
                  <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => updateFilter('category', '')} />
                </Badge>
              )}
              
              {filters.cuisine && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  {cuisineOptions.find(c => c.value === filters.cuisine)?.label || filters.cuisine}
                  <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => updateFilter('cuisine', '')} />
                </Badge>
              )}
              
              {filters.isVegetarian && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  🌱 Vegetarian
                  <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => updateFilter('isVegetarian', false)} />
                </Badge>
              )}
              
              {filters.isSpicy && (
                <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  🌶️ Spicy
                  <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => updateFilter('isSpicy', false)} />
                </Badge>
              )}
              
              {filters.rating > 0 && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  ⭐ {filters.rating}+ Rating
                  <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => updateFilter('rating', 0)} />
                </Badge>
              )}
              
              {(filters.minPrice > 0 || filters.maxPrice < 50) && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  ${filters.minPrice}-${filters.maxPrice}
                  <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => {
                    updateFilter('minPrice', 0);
                    updateFilter('maxPrice', 50);
                  }} />
                </Badge>
              )}
              
              {/* Clear All Button */}
              {(filters.category || filters.cuisine || filters.isVegetarian || filters.isSpicy || filters.rating > 0 || filters.minPrice > 0 || filters.maxPrice < 50) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="text-red-600 hover:text-red-700"
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>
          {/* Professional User Stats Section */}
          <div>
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Performance</h2>
                  <p className="text-gray-600 dark:text-gray-400">Track your ordering journey and achievements</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {mockStats.map((stat, index) => (
                <Card key={index} className="group p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl hover:shadow-gray-200/20 dark:hover:shadow-gray-900/20 transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                      </div>
                      <div className="p-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Professional Offers Section */}
          <div>
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl">
                  <Flame className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Exclusive Offers</h2>
                  <p className="text-gray-600 dark:text-gray-400">Limited time deals you won't want to miss</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {mockOffers.map((offer) => (
                <Card key={offer.id} className={`${offer.color} text-white cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-2 group overflow-hidden`}>
                  <CardContent className="p-6 relative">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-8 -translate-x-8"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-xl mb-1">{offer.title}</h3>
                          <p className="text-sm opacity-90 mb-3">{offer.subtitle}</p>
                          <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30 transition-colors">
                            {offer.code}
                          </Badge>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                          <offer.icon className="h-8 w-8 opacity-90" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Professional Achievements Section */}
          <div>
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Achievements</h2>
                  <p className="text-gray-600 dark:text-gray-400">Unlock rewards and showcase your progress</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {mockAchievements.map((achievement, index) => (
                <Card key={index} className={`group p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  achievement.completed 
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 shadow-green-200/20 dark:shadow-green-900/20' 
                    : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700'
                }`}>
                  <CardContent className="p-0">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${
                        achievement.completed 
                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-800 dark:to-emerald-800' 
                          : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600'
                      }`}>
                        <achievement.icon className={`h-6 w-6 ${
                          achievement.completed 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-gray-400 dark:text-gray-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1">{achievement.title}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{achievement.description}</p>
                        {achievement.completed && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200 text-xs">
                            ✓ Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Ongoing Orders */}
          <div>
            <SectionHeader title="🚀 Ongoing Orders" subtitle="Track your active orders" />
            <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <CardContent className="p-8 text-center">
                <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">No ongoing orders</h3>
                <p className="text-muted-foreground text-sm">Your active orders will appear here</p>
                <Button className="mt-4" onClick={() => navigate('/menu')}>
                  Browse Menu
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Last Orders */}
          {lastOrders.length > 0 && (
            <div>
              <SectionHeader title="📋 Your Last Orders" subtitle="From your order history" showViewAll />
              <div className="flex gap-4 overflow-x-auto pb-2">
                {lastOrders.map((item) => (
                  <div key={item.id} className="flex-shrink-0">
                    <FoodCard item={item} isSmall showAddButton />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Again */}
          {lastOrders.length > 0 && (
            <div>
              <SectionHeader title="🔄 Order Again" subtitle="Your favorite orders" showViewAll />
              <div className="flex gap-4 overflow-x-auto pb-2">
                {lastOrders.map((item) => (
                  <div key={`again-${item.id}`} className="flex-shrink-0">
                    <FoodCard item={item} isSmall showAddButton />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recently Viewed */}
          {recentlyViewed.length > 0 && (
            <div>
              <SectionHeader title="👁️ Recently Viewed" subtitle="Items you checked out" showViewAll />
              <div className="flex gap-4 overflow-x-auto pb-2">
                {recentlyViewed.map((item) => (
                  <div key={`recent-${item.id}`} className="flex-shrink-0">
                    <FoodCard item={item} isSmall />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coupons Section */}
          <div>
            <SectionHeader title="🎟️ Available Coupons" subtitle="Save more with these offers" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-blue-900">FREE DELIVERY</h3>
                      <p className="text-sm text-blue-700">Valid on orders above $25</p>
                      <Badge className="mt-2 bg-blue-200 text-blue-900">FREESHIP25</Badge>
                    </div>
                    <Percent className="h-6 w-6 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-green-900">30% OFF</h3>
                      <p className="text-sm text-green-700">On your next 3 orders</p>
                      <Badge className="mt-2 bg-green-200 text-green-900">SAVE30</Badge>
                    </div>
                    <Gift className="h-6 w-6 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Menu */}
          <div>
            <SectionHeader title="🍽️ Our Full Menu" subtitle="Explore all our delicious options" />
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-muted rounded-t-lg"></div>
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-3 bg-muted rounded w-3/4"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {foodItems.map((item) => (
                  <FoodCard key={item.id} item={item} showAddButton />
                ))}
              </div>
            )}

            {!loading && foodItems.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <Utensils className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No dishes found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters to see more options
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Cart Summary */}
      {getTotalCartItems() > 0 && (
        <div className="fixed bottom-4 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-lg shadow-2xl animate-scaleIn z-50">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <span className="text-lg font-bold">{getTotalCartItems()}</span>
            </div>
            <div>
              <div className="font-medium">{getTotalCartItems()} items</div>
              <div className="text-sm opacity-90">${getTotalCartValue().toFixed(2)}</div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate('/customer/cart')}
              className="bg-white text-orange-600 hover:bg-orange-50"
            >
              View Cart
            </Button>
          </div>
        </div>
      )}

      {/* Active Cooks Modal */}
      <Dialog open={cookModalOpen} onOpenChange={setCookModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              {selectedFoodItem?.name} - Available Cooks
            </DialogTitle>
          </DialogHeader>
          
          {selectedFoodItem && (
            <div className="space-y-6">
              {/* Food Item Details */}
              <div className="flex gap-4 p-4 bg-muted rounded-lg">
                <img
                  src={selectedFoodItem.image}
                  alt={selectedFoodItem.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{selectedFoodItem.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {selectedFoodItem.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      ${selectedFoodItem.price}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {selectedFoodItem.prep_time} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {selectedFoodItem.rating}
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Cooks */}
              <div>
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Available Cooks ({activeCooks.length})
                </h4>
                
                {activeCooks.length > 0 ? (
                  <div className="grid gap-4">
                    {activeCooks.map((cook: any) => (
                      <Card key={cook.id} className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={cook.profile_image} alt={cook.name} />
                            <AvatarFallback>{cook.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h5 className="font-semibold">{cook.name}</h5>
                              <Badge 
                                variant={cook.status === 'available' ? 'default' : 'secondary'}
                                className={cook.status === 'available' ? 'bg-green-100 text-green-800' : ''}
                              >
                                {cook.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                {cook.rating} rating
                              </span>
                              <span>{cook.experience_years} years exp.</span>
                              <span>{cook.current_orders}/{cook.max_orders} orders</span>
                            </div>
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground">
                                Specialties: {cook.specialties.join(', ')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="text-center py-8">
                    <CardContent>
                      <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No cooks are currently available for this dish
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Menu;
