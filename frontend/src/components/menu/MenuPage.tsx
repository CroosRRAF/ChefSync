import React, { useState, useEffect } from 'react';
import { Search, Filter, Star, Clock, MapPin, ShoppingCart, Heart, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCartService, CartSummary } from '@/services/cartService';
import SimpleAddToCartModal from './SimpleAddToCartModal';
import ShoppingCartModal from '../checkout/ShoppingCartModal';
import { toast } from 'sonner';
import { fetchCustomerFoods } from '@/services/foodService';

interface Food {
  id: number;
  name: string;
  description: string;
  image_url: string;
  optimized_image_url?: string;
  chef: {
    id: number;
    name: string;
    profile_image?: string;
    rating?: number;
    cuisine_type?: string;
  };
  prices: Array<{
    id: number;
    size: string;
    price: number;
  }>;
  category: {
    id: number;
    name: string;
  };
  tags: string[];
  preparation_time?: number;
  rating?: number;
  reviews_count?: number;
  is_available: boolean;
  is_featured?: boolean;
}

interface MenuFilters {
  search: string;
  category: string;
  priceRange: string;
  rating: string;
  cookingTime: string;
  sortBy: string;
}

const MenuPage: React.FC = () => {
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<MenuFilters>({
    search: '',
    category: '',
    priceRange: '',
    rating: '',
    cookingTime: '',
    sortBy: 'popular'
  });
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [showAddToCart, setShowAddToCart] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [cartSummary, setCartSummary] = useState<CartSummary | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

  const { loadCartSummary } = useCartService();

  useEffect(() => {
    loadMenuItems();
    loadCartData();
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      loadMenuItems();
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [filters]);

  const loadMenuItems = async () => {
    setLoading(true);
    try {
      // Fetch real data from API
      const response = await fetchCustomerFoods({
        search: filters.search,
        category: filters.category !== "all" ? filters.category : "",
        availability: "available", // Only show available foods
        page: 1,
        limit: 100 // Get more items for better filtering
      });

      // Use API data instead of mock data
      const foods = response.results || [];

      // Apply filters
      let filteredFoods = foods;

      if (filters.search) {
        filteredFoods = filteredFoods.filter(food => 
          food.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          food.description.toLowerCase().includes(filters.search.toLowerCase()) ||
          food.chef.name.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      if (filters.category && filters.category !== "all") {
        filteredFoods = filteredFoods.filter(food => 
          food.category.name.toLowerCase() === filters.category.toLowerCase()
        );
      }

      if (filters.priceRange && filters.priceRange !== "all") {
        const [min, max] = filters.priceRange.split('-').map(Number);
        filteredFoods = filteredFoods.filter(food => {
          const minPrice = Math.min(...food.prices.map(p => p.price));
          return minPrice >= min && minPrice <= max;
        });
      }

      if (filters.rating && filters.rating !== "all") {
        const minRating = Number(filters.rating);
        filteredFoods = filteredFoods.filter(food => 
          (food.rating || 0) >= minRating
        );
      }

      if (filters.cookingTime) {
        const maxTime = Number(filters.cookingTime);
        filteredFoods = filteredFoods.filter(food => 
          (food.preparation_time || 0) <= maxTime
        );
      }

      // Sort
      switch (filters.sortBy) {
        case 'price-low':
          filteredFoods.sort((a, b) => 
            Math.min(...a.prices.map(p => p.price)) - Math.min(...b.prices.map(p => p.price))
          );
          break;
        case 'price-high':
          filteredFoods.sort((a, b) => 
            Math.min(...b.prices.map(p => p.price)) - Math.min(...a.prices.map(p => p.price))
          );
          break;
        case 'rating':
          filteredFoods.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case 'time':
          filteredFoods.sort((a, b) => (a.preparation_time || 0) - (b.preparation_time || 0));
          break;
        default: // popular
          filteredFoods.sort((a, b) => (b.reviews_count || 0) - (a.reviews_count || 0));
      }

      setFoods(filteredFoods);
    } catch (error) {
      console.error('Error loading menu items:', error);
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const loadCartData = async () => {
    try {
      const data = await loadCartSummary();
      setCartSummary(data);
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const handleAddToCart = (food: Food) => {
    setSelectedFood(food);
    setShowAddToCart(true);
  };

  const handleCartSuccess = () => {
    setShowAddToCart(false);
    loadCartData(); // Refresh cart data
  };

  const toggleFavorite = (foodId: number) => {
    setFavoriteIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(foodId)) {
        newSet.delete(foodId);
        toast.success('Removed from favorites');
      } else {
        newSet.add(foodId);
        toast.success('Added to favorites');
      }
      return newSet;
    });
  };

  const formatPrice = (price: number) => {
    return `Rs. ${price.toFixed(2)}`;
  };

  const getMinPrice = (prices: Array<{price: number}>) => {
    return Math.min(...prices.map(p => p.price));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <ChefHat className="h-8 w-8 text-orange-500" />
              <h1 className="text-2xl font-bold text-gray-900">ChefSync Menu</h1>
            </div>
            
            {/* Cart Button */}
            <Button
              onClick={() => setShowCart(true)}
              className="relative bg-orange-500 hover:bg-orange-600"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Cart
              {cartSummary && cartSummary.total_items > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs">
                  {cartSummary.total_items}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search for dishes, chefs, or cuisines..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-4">
            <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="main course">Main Course</SelectItem>
                <SelectItem value="pizza">Pizza</SelectItem>
                <SelectItem value="rice & biriyani">Rice & Biriyani</SelectItem>
                <SelectItem value="seafood">Seafood</SelectItem>
                <SelectItem value="desserts">Desserts</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.priceRange} onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value }))}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Price</SelectItem>
                <SelectItem value="0-500">Under Rs. 500</SelectItem>
                <SelectItem value="500-1000">Rs. 500 - 1000</SelectItem>
                <SelectItem value="1000-1500">Rs. 1000 - 1500</SelectItem>
                <SelectItem value="1500-3000">Rs. 1500+</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.rating} onValueChange={(value) => setFilters(prev => ({ ...prev, rating: value }))}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Rating</SelectItem>
                <SelectItem value="4">4+ Stars</SelectItem>
                <SelectItem value="4.5">4.5+ Stars</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="time">Fastest Delivery</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-600">
            {loading ? 'Loading...' : `${foods.length} dishes found`}
          </p>
        </div>

        {/* Food Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="animate-pulse">
                  <div className="h-48 bg-gray-300" />
                  <CardContent className="p-4 space-y-3">
                    <div className="h-4 bg-gray-300 rounded w-3/4" />
                    <div className="h-3 bg-gray-300 rounded w-full" />
                    <div className="h-3 bg-gray-300 rounded w-1/2" />
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        ) : foods.length === 0 ? (
          <div className="text-center py-12">
            <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No dishes found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters or search terms</p>
            <Button onClick={() => setFilters({
              search: '', category: '', priceRange: '', rating: '', cookingTime: '', sortBy: 'popular'
            })}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {foods.map((food) => (
              <Card key={food.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                <div className="relative">
                  <img
                    src={food.optimized_image_url || food.image_url || '/api/placeholder/300/200'}
                    alt={food.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/api/placeholder/300/200';
                    }}
                  />
                  
                  {/* Favorite Button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 h-8 w-8 p-0 bg-white/80 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(food.id);
                    }}
                  >
                    <Heart 
                      className={`h-4 w-4 ${
                        favoriteIds.has(food.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'
                      }`}
                    />
                  </Button>

                  {/* Featured Badge */}
                  {food.is_featured && (
                    <Badge className="absolute top-2 left-2 bg-orange-500">
                      Featured
                    </Badge>
                  )}

                  {/* Availability Overlay */}
                  {!food.is_available && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge variant="secondary" className="text-white bg-gray-800">
                        Currently Unavailable
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">
                        {food.name}
                      </h3>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{food.rating?.toFixed(1)}</span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-2">
                      {food.description}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <ChefHat className="h-3 w-3" />
                        <span>{food.chef.name}</span>
                      </div>
                      {food.preparation_time && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{food.preparation_time} min</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {food.tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <p className="font-bold text-lg text-gray-900">
                          {formatPrice(getMinPrice(food.prices))}
                          {food.prices.length > 1 && <span className="text-sm font-normal text-gray-500"> onwards</span>}
                        </p>
                      </div>
                      
                      <Button
                        onClick={() => handleAddToCart(food)}
                        disabled={!food.is_available}
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add to Cart Modal */}
      <SimpleAddToCartModal
        isOpen={showAddToCart}
        onClose={() => setShowAddToCart(false)}
        food={selectedFood}
        onSuccess={handleCartSuccess}
      />

      {/* Shopping Cart Modal */}
      <ShoppingCartModal
        isOpen={showCart}
        onClose={() => setShowCart(false)}
      />
    </div>
  );
};

export default MenuPage;