import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import { 
  ChefHat, Filter, Search, Star, Clock, Users, Utensils, DollarSign, 
  Heart, MapPin, Truck, ShoppingBag, X, Gift, Percent, RotateCcw,
  Eye, ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";
import { Slider } from "./components/ui/slider";
import { Checkbox } from "./components/ui/checkbox";
import { Separator } from "./components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "./components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { ScrollArea } from "./components/ui/scroll-area";
import { Switch } from "./components/ui/switch";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CloudKitchen = () => {
  const [foodItems, setFoodItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFoodItem, setSelectedFoodItem] = useState(null);
  const [activeCooks, setActiveCooks] = useState([]);
  const [cookModalOpen, setCookModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuPageOpen, setMenuPageOpen] = useState(false);
  const [currentMenuView, setCurrentMenuView] = useState('main'); // 'main', 'filters', 'categories'
  const [isDelivery, setIsDelivery] = useState(true);
  const [favorites, setFavorites] = useState(new Set());
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [lastOrders, setLastOrders] = useState([]);
  
  // Filter states
  const [filters, setFilters] = useState({
    category: "",
    minPrice: 0,
    maxPrice: 50,
    isVegetarian: false,
    isSpicy: false,
    search: ""
  });

  // Mock data for last orders and recently viewed
  const mockLastOrders = [
    { id: "1", name: "Margherita Pizza", image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400&h=300&fit=crop", price: 18.99, rating: 4.5 },
    { id: "2", name: "Butter Chicken", image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop", price: 22.50, rating: 4.7 }
  ];

  const mockOffers = [
    { id: "1", title: "50% OFF", subtitle: "On orders above $30", code: "SAVE50", color: "bg-red-500" },
    { id: "2", title: "FREE DELIVERY", subtitle: "No minimum order", code: "FREEDEL", color: "bg-green-500" },
    { id: "3", title: "20% OFF", subtitle: "First time users", code: "NEW20", color: "bg-blue-500" }
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
    }
  };

  const fetchFoodItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.category) params.append('category', filters.category);
      if (filters.minPrice > 0) params.append('min_price', filters.minPrice);
      if (filters.maxPrice < 50) params.append('max_price', filters.maxPrice);
      if (filters.isVegetarian) params.append('is_vegetarian', 'true');
      if (filters.isSpicy) params.append('is_spicy', 'true');
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`${API}/food-items?${params}`);
      setFoodItems(response.data);
    } catch (error) {
      console.error("Error fetching food items:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveCooks = async (foodId) => {
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

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      minPrice: 0,
      maxPrice: 50,
      isVegetarian: false,
      isSpicy: false,
      search: ""
    });
  };

  const openMenuPage = () => {
    setMenuPageOpen(true);
    setCurrentMenuView('main');
  };

  const closeMenuPage = () => {
    setMenuPageOpen(false);
    setSidebarOpen(false);
    setCurrentMenuView('main');
  };

  const openFilters = () => {
    setCurrentMenuView('filters');
    setSidebarOpen(true);
  };

  const backToMainMenu = () => {
    setCurrentMenuView('main');
    setSidebarOpen(false);
  };

  const toggleFavorite = (itemId) => {
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

  const getCategoryIcon = (category) => {
    const icons = {
      appetizers: "🥗",
      main_course: "🍽️",
      desserts: "🍰",
      beverages: "🥤",
      snacks: "🍿",
      salads: "🥙"
    };
    return icons[category] || "🍽️";
  };

  const FoodCard = ({ item, showAddButton = false, isSmall = false }) => (
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
              <Button size="sm" className="h-6 px-2 text-xs">
                Add
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const SectionHeader = ({ title, subtitle, showViewAll = false }) => (
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          {/* Top Row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <ChefHat className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">ChefSync</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>Deliver to Home • 25-35 min</span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={openMenuPage}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for dishes, cuisines..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10 h-12 bg-gray-50 border-gray-200"
            />
          </div>

          {/* Delivery/Pickup Toggle */}
          <div className="flex items-center justify-center gap-4 p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Truck className={`h-4 w-4 ${isDelivery ? 'text-primary' : 'text-gray-400'}`} />
              <span className={isDelivery ? 'font-medium' : 'text-gray-400'}>Delivery</span>
            </div>
            <Switch
              checked={!isDelivery}
              onCheckedChange={(checked) => setIsDelivery(!checked)}
            />
            <div className="flex items-center gap-2">
              <ShoppingBag className={`h-4 w-4 ${!isDelivery ? 'text-primary' : 'text-gray-400'}`} />
              <span className={!isDelivery ? 'font-medium' : 'text-gray-400'}>Pickup</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Menu Page Modal */}
        {menuPageOpen && (
          <div className="fixed inset-0 z-50 bg-black/50" onClick={closeMenuPage}>
            <div className="fixed inset-x-0 bottom-0 h-5/6 bg-white rounded-t-3xl transform transition-transform" onClick={(e) => e.stopPropagation()}>
              
              {/* Main Menu View */}
              {currentMenuView === 'main' && (
                <div className="h-full flex flex-col">
                  {/* Header */}
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold">Menu</h2>
                      <Button variant="ghost" size="sm" onClick={closeMenuPage}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Menu Options */}
                  <ScrollArea className="flex-1 p-6">
                    <div className="space-y-4">
                      {/* Filter Option */}
                      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={openFilters}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-orange-100 rounded-lg">
                                <Filter className="h-6 w-6 text-orange-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold">Filters</h3>
                                <p className="text-sm text-muted-foreground">Filter by category, price, and dietary preferences</p>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Categories Quick Access */}
                      <Card className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Utensils className="h-6 w-6 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold">Categories</h3>
                                <p className="text-sm text-muted-foreground">Browse by food categories</p>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Favorites */}
                      <Card className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-red-100 rounded-lg">
                                <Heart className="h-6 w-6 text-red-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold">Favorites</h3>
                                <p className="text-sm text-muted-foreground">{favorites.size} saved items</p>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Order History */}
                      <Card className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-100 rounded-lg">
                                <RotateCcw className="h-6 w-6 text-green-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold">Order History</h3>
                                <p className="text-sm text-muted-foreground">View your past orders</p>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Settings */}
                      <Card className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-100 rounded-lg">
                                <Users className="h-6 w-6 text-purple-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold">Settings</h3>
                                <p className="text-sm text-muted-foreground">Account and app preferences</p>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Filter View */}
              {currentMenuView === 'filters' && sidebarOpen && (
                <div className="h-full flex flex-col">
                  {/* Header */}
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={backToMainMenu}>
                          <ChevronRight className="h-4 w-4 rotate-180" />
                        </Button>
                        <h2 className="text-xl font-bold">Filters</h2>
                      </div>
                      <Button variant="outline" size="sm" onClick={clearFilters}>
                        Clear All
                      </Button>
                    </div>
                  </div>
                  
                  {/* Filter Content */}
                  <ScrollArea className="flex-1 p-6">
                    <div className="space-y-6">
                      {/* Categories */}
                      <div>
                        <label className="text-sm font-medium mb-3 block">Category</label>
                        <div className="space-y-2">
                          <div 
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              filters.category === "" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                            }`}
                            onClick={() => updateFilter('category', '')}
                          >
                            <span className="text-sm font-medium">All Categories</span>
                          </div>
                          {categories.map((category) => (
                            <div
                              key={category.value}
                              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                filters.category === category.value ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                              }`}
                              onClick={() => updateFilter('category', category.value)}
                            >
                              <span className="mr-2">{getCategoryIcon(category.value)}</span>
                              <span className="text-sm font-medium">{category.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Price Range */}
                      <div>
                        <label className="text-sm font-medium mb-3 block">
                          Price Range: ${filters.minPrice} - ${filters.maxPrice}
                        </label>
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Min Price</label>
                            <Slider
                              value={[filters.minPrice]}
                              onValueChange={(value) => updateFilter('minPrice', value[0])}
                              max={50}
                              step={1}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Max Price</label>
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

                      <Separator />

                      {/* Dietary Preferences */}
                      <div>
                        <label className="text-sm font-medium mb-3 block">Dietary Preferences</label>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="vegetarian"
                              checked={filters.isVegetarian}
                              onCheckedChange={(checked) => updateFilter('isVegetarian', checked)}
                            />
                            <label htmlFor="vegetarian" className="text-sm">🌱 Vegetarian</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="spicy"
                              checked={filters.isSpicy}
                              onCheckedChange={(checked) => updateFilter('isSpicy', checked)}
                            />
                            <label htmlFor="spicy" className="text-sm">🌶️ Spicy</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>

                  {/* Apply Button */}
                  <div className="p-6 border-t">
                    <Button className="w-full" onClick={closeMenuPage}>
                      Apply Filters
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-4 space-y-8">
          {/* Offers Section */}
          <div>
            <SectionHeader title="🔥 Limited Time Offers" subtitle="Don't miss out on these deals!" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mockOffers.map((offer) => (
                <Card key={offer.id} className={`${offer.color} text-white cursor-pointer hover:shadow-lg transition-shadow`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-lg">{offer.title}</h3>
                        <p className="text-sm opacity-90">{offer.subtitle}</p>
                        <Badge variant="secondary" className="mt-2 bg-white/20 text-white">
                          Code: {offer.code}
                        </Badge>
                      </div>
                      <Gift className="h-8 w-8 opacity-80" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Ongoing Orders */}
          <div>
            <SectionHeader title="🚀 Ongoing Orders" subtitle="Track your active orders" />
            <Card className="border-2 border-dashed border-gray-200">
              <CardContent className="p-8 text-center">
                <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No ongoing orders</h3>
                <p className="text-muted-foreground text-sm">Your active orders will appear here</p>
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
                    {activeCooks.map((cook) => (
                      <Card key={cook.id} className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={cook.profile_image} alt={cook.name} />
                            <AvatarFallback>{cook.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
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

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CloudKitchen />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;