import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Star, Clock, MapPin, ShoppingCart, Heart, ChefHat, Target, SlidersHorizontal, X, ExternalLink, Minus, Plus, Eye, Sun, Moon, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { enhancedMenuService, MenuFood, MenuFilters, FilterOptions, UserLocation } from '@/services/enhancedMenuService';
import { menuLocationService, LocationDetails } from '@/services/menuLocationService';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useDatabaseCart } from '@/context/DatabaseCartContext';
import FilterSidebar from './FilterSidebar';
import { toast } from 'sonner';
import LocationSelector from '@/components/location/LocationSelector';

interface EnhancedMenuPageProps {
  className?: string;
}

const EnhancedMenuPage: React.FC<EnhancedMenuPageProps> = ({ className = '' }) => {
  // Navigation hook
  const navigate = useNavigate();
  
  // Theme hook
  const { theme, toggleTheme } = useTheme();
  
  // Auth and Cart hooks
  const { isAuthenticated } = useAuth();
  const { addItem } = useDatabaseCart();

  // Handle chef profile navigation
  const handleChefProfileClick = (cookId: number) => {
    navigate(`/chef-profile/${cookId}`);
  };
  
  // State management
  const [foods, setFoods] = useState<MenuFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<MenuFilters>({});
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  // Map internal UserLocation to LocationSelector props shape
  const mappedLocation = useMemo(() =>
    userLocation
      ? { lat: userLocation.latitude, lng: userLocation.longitude, address: userLocation.address }
      : null,
    [userLocation]
  );
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  
  // Modal states
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFood, setSelectedFood] = useState<MenuFood | null>(null);
  const [showFoodDetail, setShowFoodDetail] = useState(false);
  const [expandedCookId, setExpandedCookId] = useState<number | null>(null);
  // Modal interaction states
  const [selectedPriceId, setSelectedPriceId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    // Reset selection when opening a new food detail
    if (showFoodDetail && selectedFood) {
      setSelectedPriceId(null);
      setQuantity(1);
      
      // Auto-expand if only one cook
      const cookIds = new Set(selectedFood.prices.map(p => {
        if (typeof p.cook === 'number') return p.cook;
        if (typeof p.cook === 'object' && p.cook !== null) {
          const cookId = (p.cook as any).id || (p.cook as any).cook_id || (p.cook as any).cookId;
          return typeof cookId === 'number' ? cookId : Number(cookId);
        }
        return Number(p.cook);
      }).filter(id => !isNaN(id) && id > 0));
      
      if (cookIds.size === 1) {
        setExpandedCookId(Array.from(cookIds)[0]);
      } else {
        setExpandedCookId(null);
      }
    } else if (!showFoodDetail) {
      setExpandedCookId(null);
    }
  }, [showFoodDetail, selectedFood]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load foods when filters or location change
  useEffect(() => {
    if (filterOptions) {
      loadFoods();
    }
  }, [filters, userLocation, searchQuery, currentPage]);

  const loadInitialData = async () => {
    try {
      // Load filter options
      const options = await enhancedMenuService.getFilterOptions();
      setFilterOptions(options);

      // Try to get saved location
      const savedLocation = menuLocationService.getSavedLocation();
      if (savedLocation) {
        setUserLocation(savedLocation);
      }

      // Load foods
      await loadFoods();
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load menu data');
    } finally {
      setLoading(false);
    }
  };

  const loadFoods = async () => {
    try {
      setLoading(true);
      
      const menuFilters: MenuFilters = {
        ...filters,
        search: searchQuery,
        page: currentPage,
        page_size: 20,
      };

      // Add location if available
      if (userLocation) {
        menuFilters.user_lat = userLocation.latitude;
        menuFilters.user_lng = userLocation.longitude;
      }

      const response = await enhancedMenuService.getMenuFoods(menuFilters);
      setFoods(response.results);
      setTotalPages(response.num_pages);
    } catch (error) {
      console.error('Error loading foods:', error);
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    const locationDetails: UserLocation = {
      latitude: location.lat,
      longitude: location.lng,
      address: location.address
    };
    setUserLocation(locationDetails);
    menuLocationService.saveLocation({
      latitude: location.lat,
      longitude: location.lng,
      address: location.address
    });
    toast.success('Location updated! Delivery fees recalculated.');
  };

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = (newFilters: Partial<MenuFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const handleFoodClick = (food: MenuFood) => {
    setSelectedFood(food);
    setShowFoodDetail(true);
  };

  const handleAddToCart = () => {
    if (!selectedFood || !selectedPriceId) {
      toast.error('Please select a cook and size');
      return;
    }

    const selectedPrice = selectedFood.prices.find(p => p.price_id === selectedPriceId);
    if (!selectedPrice) {
      toast.error('Selected option not found');
      return;
    }

    // Get cook information from the selected price
    const cookId = typeof selectedPrice.cook === 'number' ? selectedPrice.cook : (selectedPrice.cook as any)?.id;
    const cookName = selectedPrice.cook_name || selectedFood.chef_name || 'Unknown Chef';
    
    // Get kitchen location safely
    const cookData = typeof selectedPrice.cook === 'object' ? selectedPrice.cook : null;
    const kitchenLocation = cookData && typeof cookData === 'object' ? (cookData as any).kitchen_location : null;

    // Add to cart using the cart context
    addItem(selectedPrice.price_id, 1, '');

    toast.success(`Added ${quantity} × ${selectedFood.name} (${selectedPrice.size}) to cart!`);
    setShowFoodDetail(false);
    setSelectedPriceId(null);
    setQuantity(1);
  };

  const handleCookSelection = (cookId: number) => {
    // In the original design, cook selection doesn't change state
    // The price selection handles both cook and size
  };

  const handleSizeSelection = (size: string) => {
    // In the original design, size selection is handled through price selection
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

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `LKR ${isNaN(numPrice) ? 0 : numPrice.toFixed(2)}`;
  };

  const getDeliveryInfo = (food: MenuFood) => {
    if (!userLocation || !food.delivery_fee) return null;
    
    return {
      fee: food.delivery_fee,
      distance: food.distance_km,
      time: food.estimated_delivery_time,
    };
  };

  // Calculate delivery fee based on distance
  const calculateDeliveryFee = (distanceKm: number): number => {
    if (distanceKm <= 5) {
      return 50; // First 5km = 50 rupees
    } else {
      const additionalKm = distanceKm - 5;
      return 50 + (additionalKm * 15); // After 5km, each km = +15 rupees
    }
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get delivery info for a specific cook based on selected address
  const getCookDeliveryInfo = (cookPrices: any[], userLocation: UserLocation | null) => {
    if (!userLocation || cookPrices.length === 0) return null;
    
    const firstPrice = cookPrices[0];
    
    // Get cook's kitchen location from the cook data
    let cookKitchenLocation = firstPrice.cook?.kitchen_location;
    
    // If cook is just an ID, we need to handle this differently
    if (typeof firstPrice.cook === 'number') {
      // Cook is just an ID number, not an object - this shouldn't happen with the new backend
      return null;
    }
    
    if (!cookKitchenLocation || !cookKitchenLocation.latitude || !cookKitchenLocation.longitude) {
      // Kitchen location not available - skip this cook
      return null;
    }
    
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      cookKitchenLocation.latitude,
      cookKitchenLocation.longitude
    );
    
    const deliveryFee = calculateDeliveryFee(distance);
    
    return {
      distance: Math.round(distance * 10) / 10, // Round to 1 decimal
      fee: deliveryFee,
      estimatedTime: Math.round(distance * 2) + 30 // Rough estimate: 2 min per km + 30 min prep
    };
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 pt-16 ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <ChefHat className="h-8 w-8 text-orange-500" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ChefSync Menu</h1>
            </div>
            
            {/* Location Selector and Cart */}
            <div className="flex items-center gap-3">
              <LocationSelector
                currentLocation={mappedLocation}
                onLocationSelect={(loc) => handleLocationSelect(loc)}
                className="hidden md:flex"
              />
              {/* Cart Button */}
              <Button className="bg-orange-500 hover:bg-orange-600 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Cart
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-32 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Search for food, restaurant, or cuisine..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            
            {/* Filters Toggle */}
            <div className="flex gap-2">
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-80">
                  <SheetHeader>
                    <SheetTitle>Filter Menu</SheetTitle>
                  </SheetHeader>
                  {filterOptions && (
                    <FilterSidebar
                      filterOptions={filterOptions}
                      currentFilters={filters}
                      onFilterChange={handleFilterChange}
                      userLocation={userLocation}
                    />
                  )}
                </SheetContent>
              </Sheet>

              {/* Mobile Location Selector */}
              <div className="md:hidden">
                <LocationSelector
                  currentLocation={mappedLocation}
                  onLocationSelect={(loc) => handleLocationSelect(loc)}
                />
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {Object.keys(filters).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {filters.cuisines?.map(id => {
                const cuisine = filterOptions?.cuisines.find(c => c.id === id);
                return cuisine ? (
                  <Badge key={id} variant="secondary" className="flex items-center gap-1">
                    {cuisine.name}
                    <button onClick={() => handleFilterChange({ 
                      cuisines: filters.cuisines?.filter(c => c !== id) 
                    })}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ) : null;
              })}
              
              {filters.dietary?.map(diet => (
                <Badge key={diet} variant="secondary" className="flex items-center gap-1">
                  {diet.charAt(0).toUpperCase() + diet.slice(1)}
                  <button onClick={() => handleFilterChange({ 
                    dietary: filters.dietary?.filter(d => d !== diet) 
                  })}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Location Info is now handled within LocationSelector */}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          // Loading Skeleton
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-3 w-2/3 mb-4" />
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : foods.length === 0 ? (
          // No Results
          <div className="text-center py-12">
            <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No food items found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? 
                `No results for "${searchQuery}". Try a different search term.` :
                'Try adjusting your filters or location.'
              }
            </p>
            <Button onClick={() => {
              setSearchQuery('');
              setFilters({});
              setCurrentPage(1);
            }}>
              Clear All Filters
            </Button>
          </div>
        ) : (
          // Food Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {foods.map((food) => {
              const deliveryInfo = getDeliveryInfo(food);
              const isFavorite = favoriteIds.has(food.food_id);
              
              // Calculate delivery info for each cook
              const cookDeliveryInfo = food.prices.reduce((acc, price) => {
                const cookId = typeof price.cook === 'number' ? price.cook : (price.cook as any)?.id;
                if (cookId && !acc[cookId]) {
                  const cookPrices = food.prices.filter(p => {
                    const pCookId = typeof p.cook === 'number' ? p.cook : (p.cook as any)?.id;
                    return pCookId === cookId;
                  });
                  acc[cookId] = getCookDeliveryInfo(cookPrices, userLocation);
                }
                return acc;
              }, {} as Record<number, any>);
              
              return (
                <Card 
                  key={food.food_id} 
                  className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  onClick={() => handleFoodClick(food)}
                >
                  {/* Food Image */}
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={food.optimized_image_url || food.primary_image || '/food-placeholder.jpg'}
                      alt={food.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    
                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(food.food_id);
                      }}
                      className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                    >
                      <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                    </button>

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {food.is_featured && (
                        <Badge className="bg-orange-500 text-white">Featured</Badge>
                      )}
                      {food.is_vegetarian && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200">Veg</Badge>
                      )}
                      {/* Show delivery info if available */}
                      {Object.values(cookDeliveryInfo).some(info => info) && (
                        <Badge variant="outline" className="bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">
                          <Truck className="h-3 w-3 mr-1 text-orange-500" />
                          Delivery
                        </Badge>
                      )}
                    </div>
                  </div>

                  <CardContent className="p-4">
                    {/* Food Name and Rating */}
                    <div className="mb-2">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1">
                        {food.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>by {food.chef_name}</span>
                        {Number(food.rating_average) > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{Number(food.rating_average).toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {food.description}
                    </p>

                    {/* Timing and Delivery Info */}
                    <div className="space-y-2 mb-4">
                      {food.preparation_time && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="h-3 w-3" />
                          <span>{food.preparation_time} mins prep</span>
                          {deliveryInfo?.time && (
                            <span>• {deliveryInfo.time} mins total</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Price and Add Button */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-lg text-gray-900 dark:text-white">
                          {formatPrice(food.min_price)}
                          {food.max_price && food.max_price !== food.min_price && (
                            <span className="text-sm font-normal text-gray-500 dark:text-gray-400"> - {formatPrice(food.max_price)}</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{food.category_name}</div>
                      </div>
                      
                      <Button
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFoodClick(food);
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {/* Enhanced Food Detail Modal - Optimized for Price Cards */}
      {selectedFood && showFoodDetail && (
        <Dialog open={showFoodDetail} onOpenChange={setShowFoodDetail}>
          <DialogContent 
            className={`max-w-6xl max-h-[95vh] overflow-hidden p-0 gap-0 rounded-2xl border-0 ${
              theme === 'dark' 
                ? 'bg-gray-900' 
                : 'bg-white'
            }`}
            aria-describedby="food-detail-description"
          >
            {/* Header with Food Image */}
            <div className={`relative h-40 overflow-hidden ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <img
                src={selectedFood.optimized_image_url || selectedFood.primary_image || '/food-placeholder.jpg'}
                alt={selectedFood.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-6 right-6">
                <DialogTitle className={`text-2xl font-bold mb-1 text-white`}>
                  {selectedFood.name}
                </DialogTitle>
                <DialogDescription className="text-gray-200 text-sm">
                  {selectedFood.category_name} • {selectedFood.cuisine_name}
                </DialogDescription>
              </div>
            </div>

            {/* Main Content Area - Optimized Layout */}
            <div className="flex h-[calc(95vh-10rem)]">
              {/* Left Column - Food Information (30% width) */}
              <div className={`w-[30%] p-4 border-r overflow-y-auto custom-scrollbar ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                {/* Description */}
                <div className="mb-4">
                  <h3 className={`text-lg font-semibold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Description</h3>
                  <p id="food-detail-description" className={`text-sm leading-relaxed ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {selectedFood.description}
                  </p>
                </div>

                {/* Food Details Grid */}
                <div className="grid grid-cols-1 gap-2 mb-4">
                  {selectedFood.preparation_time && (
                    <div className={`p-2 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-white'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-3 w-3 text-orange-500" />
                        <span className={`text-xs font-medium ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>Prep Time</span>
                      </div>
                      <span className={`text-sm font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>{selectedFood.preparation_time} min</span>
                    </div>
                  )}

                  {Number(selectedFood.rating_average) > 0 && (
                    <div className={`p-2 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-white'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="h-3 w-3 text-orange-500 fill-orange-500" />
                        <span className={`text-xs font-medium ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>Rating</span>
                      </div>
                      <span className={`text-sm font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>{Number(selectedFood.rating_average).toFixed(1)}</span>
                    </div>
                  )}

                  {selectedFood.calories_per_serving && (
                    <div className={`p-2 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-white'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="h-3 w-3 text-orange-500" />
                        <span className={`text-xs font-medium ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>Calories</span>
                      </div>
                      <span className={`text-sm font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>{selectedFood.calories_per_serving}</span>
                    </div>
                  )}
                </div>

                {/* Dietary Information */}
                <div className="mb-4">
                  <h3 className={`text-sm font-semibold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Dietary Info</h3>
                  
                  <div className="flex flex-wrap gap-1 mb-2">
                    {selectedFood.is_vegetarian && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Vegetarian
                      </span>
                    )}
                    {selectedFood.is_vegan && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Vegan
                      </span>
                    )}
                    {selectedFood.is_gluten_free && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        Gluten Free
                      </span>
                    )}
                    {selectedFood.spice_level && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        selectedFood.spice_level === 'mild' ? 'bg-yellow-100 text-yellow-800' :
                        selectedFood.spice_level === 'medium' ? 'bg-orange-100 text-orange-800' :
                        selectedFood.spice_level === 'hot' ? 'bg-red-100 text-red-800' :
                        'bg-red-200 text-red-900'
                      }`}>
                        {selectedFood.spice_level.charAt(0).toUpperCase() + selectedFood.spice_level.slice(1)}
                      </span>
                    )}
                  </div>

                  {/* Allergens */}
                  {selectedFood.allergens && selectedFood.allergens.length > 0 && (
                    <div className="mb-2">
                      <h4 className={`text-xs font-medium mb-1 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                      }`}>Allergens</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedFood.allergens.map((allergen: string, index: number) => (
                          <span key={index} className="px-1 py-0.5 bg-red-100 text-red-800 text-xs rounded">
                            {allergen}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Cook Selection & Price Cards (70% width) */}
              <div className={`w-[70%] overflow-y-auto custom-scrollbar ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-white'
              }`}>
                <div className="p-6">
                  {/* Available Cooks Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <ChefHat className="h-6 w-6 text-orange-500" />
                    <h3 className={`text-xl font-semibold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Available Cooks ({(() => {
                        const pricesByCook = selectedFood.prices.reduce((acc, price) => {
                          let cookId: number;
                          if (typeof price.cook === 'number') {
                            cookId = price.cook;
                          } else if (typeof price.cook === 'object' && price.cook !== null) {
                            cookId = (price.cook as any).id || (price.cook as any).cook_id || (price.cook as any).cookId;
                            if (typeof cookId !== 'number') cookId = Number(cookId);
                          } else {
                            cookId = Number(price.cook);
                          }
                          if (!isNaN(cookId) && cookId > 0) {
                            acc[cookId] = true;
                          }
                          return acc;
                        }, {} as Record<number, boolean>);
                        return Object.keys(pricesByCook).length;
                      })()})
                    </h3>
                  </div>

                  {/* Cook Cards with Enhanced Price Display */}
                  <div className="space-y-6">
                    {(() => {
                      // Group prices by cook_id - handle both number and object cases
                      const pricesByCook = selectedFood.prices.reduce((acc, price) => {
                        // Extract cook ID safely
                        let cookId: number;
                        if (typeof price.cook === 'number') {
                          cookId = price.cook;
                        } else if (typeof price.cook === 'object' && price.cook !== null) {
                          cookId = (price.cook as any).id || (price.cook as any).cook_id || (price.cook as any).cookId;
                          if (typeof cookId !== 'number') {
                            cookId = Number(cookId);
                          }
                        } else {
                          cookId = Number(price.cook);
                        }

                        if (isNaN(cookId) || cookId <= 0) {
                          console.error('EnhancedMenuPage: Invalid cook ID in price', price);
                          return acc;
                        }

                        if (!acc[cookId]) {
                          acc[cookId] = [];
                        }
                        acc[cookId].push(price);
                        return acc;
                      }, {} as Record<number, typeof selectedFood.prices>);

                        return Object.entries(pricesByCook)
                          .map(([cookIdString, cookPrices]) => {
                          const cookId = Number(cookIdString);
                            const cookDeliveryInfo = getCookDeliveryInfo(cookPrices, userLocation);
                            return {
                              cookId,
                              cookPrices,
                              deliveryInfo: cookDeliveryInfo
                            };
                          })
                          .filter(item => item.cookId > 0)
                          .sort((a, b) => {
                            // Sort by delivery fee (lowest first)
                            const feeA = a.deliveryInfo?.fee || 999;
                            const feeB = b.deliveryInfo?.fee || 999;
                            return feeA - feeB;
                          })
                          .map(({ cookId, cookPrices, deliveryInfo: cookDeliveryInfo }) => {
                          const minPrice = Math.min(...cookPrices.map(p => Number(p.price)));
                          const maxPrice = Math.max(...cookPrices.map(p => Number(p.price)));
                          const firstPrice = cookPrices[0]; // Get cook info from first price
                          const cookName = firstPrice.cook_name || selectedFood.chef_name;
                          const cookRating = firstPrice.cook_rating || selectedFood.chef_rating;

                          return (
                            <div 
                              key={cookId} 
                              className={`rounded-xl p-6 border-2 ${
                                theme === 'dark' 
                                  ? 'bg-gray-800 border-gray-700' 
                                  : 'bg-white border-gray-200'
                              }`}
                            >
                              {/* Cook Header */}
                              <div className="flex items-center justify-between mb-6">
                                <div 
                                  className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => handleChefProfileClick(cookId)}
                                >
                                  {/* Cook Avatar */}
                                  <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 hover:bg-orange-600 transition-colors">
                                    {cookName.substring(0, 2).toUpperCase()}
                                  </div>

                                  {/* Cook Info */}
                                  <div>
                                    <h4 className={`text-lg font-semibold hover:text-orange-500 transition-colors ${
                                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    }`}>Chef {cookName}</h4>
                                    {cookRating && (
                                      <div className="flex items-center gap-1 text-orange-500 mt-1">
                                        <Star className="h-4 w-4 fill-orange-500" />
                                        <span className={`text-sm font-medium ${
                                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                                        }`}>{cookRating}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Delivery Fee Badge */}
                                {cookDeliveryInfo && (
                                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                                    theme === 'dark' 
                                      ? 'bg-orange-900/30 border border-orange-500/50' 
                                      : 'bg-orange-50 border border-orange-200'
                                  }`}>
                                    <Truck className="h-4 w-4 text-orange-500" />
                                    <div className="text-sm">
                                      <span className={`font-semibold ${
                                        theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
                                      }`}>
                                        LKR {cookDeliveryInfo.fee.toFixed(1)}
                                      </span>
                                      <div className={`text-xs ${
                                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                      }`}>
                                        {cookDeliveryInfo.distance}km • ~{cookDeliveryInfo.estimatedTime}min
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Beautiful Price Cards - Elegant Design */}
                              <div className="grid grid-cols-3 gap-3">
                                  {cookPrices.sort((a, b) => Number(a.price) - Number(b.price)).map((price) => {
                                    const isSelected = selectedPriceId === price.price_id;
                                    return (
                                    <div
                                        key={price.price_id}
                                      className={`relative p-4 rounded-xl border transition-all cursor-pointer hover:scale-105 ${
                                          isSelected
                                          ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10 shadow-lg'
                                          : theme === 'dark'
                                            ? 'border-gray-600 bg-gray-800 hover:border-gray-500 hover:bg-gray-750'
                                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                                      }`}
                                      onClick={() => setSelectedPriceId(price.price_id)}
                                    >
                                      {/* Selection Indicator */}
                                      <div className={`absolute top-2 right-2 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        isSelected 
                                          ? 'border-orange-500 bg-orange-500' 
                                          : 'border-gray-400'
                                      }`}>
                                        {isSelected && (
                                          <div className="w-2 h-2 bg-white rounded-full"></div>
                                        )}
                                      </div>

                                      {/* Price Content */}
                                      <div className="text-center">
                                        {/* Size Name */}
                                        <div className={`text-sm font-semibold mb-2 ${
                                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                                        }`}>
                                          {price.size}
                                        </div>
                                        
                                        {/* Beautiful Price Display */}
                                        <div className={`text-xl font-bold mb-1 ${
                                          isSelected 
                                            ? 'text-orange-600 dark:text-orange-400' 
                                            : theme === 'dark' 
                                              ? 'text-white' 
                                              : 'text-gray-900'
                                        }`}>
                                          LKR {Number(price.price).toFixed(2)}
                                        </div>
                                        
                                        {/* Elegant Subtitle */}
                                        <div className={`text-xs ${
                                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                        }`}>
                                          per serving
                                        </div>
                                      </div>

                                      {/* Selection Glow Effect */}
                                      {isSelected && (
                                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/10 to-orange-400/10 pointer-events-none"></div>
                                      )}
                                    </div>
                                    );
                                  })}
                                </div>
                            </div>
                          );
                        });
                      })()}
                  </div>
              </div>

              {/* Sticky Footer - Quantity Selector & Add to Cart */}
              {selectedPriceId && (
                <div className={`sticky bottom-0 p-6 border-t ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center gap-4">
                    {/* Quantity Selector */}
                    <div className="flex items-center gap-3">
                      <span className={`text-base font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>Quantity:</span>
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                          theme === 'dark' 
                            ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className={`text-xl font-semibold min-w-[40px] text-center ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                          theme === 'dark' 
                            ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Price Breakdown */}
                    <div className="flex-1 text-right">
                      {(() => {
                        const selectedPrice = selectedFood.prices.find(p => p.price_id === selectedPriceId);
                        if (!selectedPrice) return null;
                        
                        const cookDeliveryInfo = getCookDeliveryInfo([selectedPrice], userLocation);
                        const foodTotal = Number(selectedPrice.price) * quantity;
                        const deliveryTotal = (cookDeliveryInfo?.fee || 0) * quantity;
                        const totalPrice = foodTotal + deliveryTotal;
                        
                        return (
                          <div className={`text-sm ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            <div>Food: LKR {foodTotal.toFixed(2)}</div>
                            {cookDeliveryInfo && (
                              <div>Delivery: LKR {deliveryTotal.toFixed(1)}</div>
                            )}
                            <div className={`text-lg font-bold ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                              Total: LKR {totalPrice.toFixed(2)}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Add to Cart Button */}
                    <Button
                      onClick={handleAddToCart}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-xl transition-colors flex items-center gap-2"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EnhancedMenuPage;