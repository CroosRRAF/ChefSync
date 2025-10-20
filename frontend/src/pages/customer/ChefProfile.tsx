import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Clock, MapPin, ShoppingCart, ChefHat, Heart, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/NewCartContext';
import { toast } from 'sonner';
import { enhancedMenuService, MenuFood } from '@/services/enhancedMenuService';

interface ChefProfileProps {}

const ChefProfile: React.FC<ChefProfileProps> = () => {
  const { cookId } = useParams<{ cookId: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  
  const [chefFoods, setChefFoods] = useState<MenuFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFood, setSelectedFood] = useState<MenuFood | null>(null);
  const [showFoodDetail, setShowFoodDetail] = useState(false);
  const [selectedPriceId, setSelectedPriceId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

  // Load chef's foods
  useEffect(() => {
    const loadChefFoods = async () => {
      if (!cookId) return;
      
      try {
        setLoading(true);
        const response = await enhancedMenuService.getMenuFoods({
          page: 1,
          page_size: 100, // Get all foods for this chef
          chef_ids: [Number(cookId)]
        });
        
        // Filter foods to ensure only foods from this specific chef are shown
        const filteredFoods = response.results.filter(food => {
          // Check if any price belongs to this chef
          return food.prices.some(price => {
            const priceCookId = typeof price.cook === 'number' ? price.cook : (price.cook as any)?.id;
            return priceCookId === Number(cookId);
          });
        });
        
        setChefFoods(filteredFoods);
      } catch (error) {
        console.error('Error loading chef foods:', error);
        toast.error('Failed to load chef foods');
      } finally {
        setLoading(false);
      }
    };

    loadChefFoods();
  }, [cookId]);

  // Get chef info from first food
  const chefInfo = chefFoods.length > 0 ? {
    name: chefFoods[0].chef_name || 'Unknown Chef',
    rating: chefFoods[0].chef_rating || 4.5,
    avatar: chefFoods[0].chef_avatar || null
  } : null;

  const handleFoodClick = (food: MenuFood) => {
    setSelectedFood(food);
    setSelectedPriceId(null);
    setQuantity(1);
    setShowFoodDetail(true);
  };

  const handleAddToCart = () => {
    if (!selectedFood || !selectedPriceId) return;

    const selectedPrice = selectedFood.prices.find(p => p.price_id === selectedPriceId);
    if (!selectedPrice) return;

    // Get cook information from the selected price
    const cookId = typeof selectedPrice.cook === 'number' ? selectedPrice.cook : (selectedPrice.cook as any)?.id;
    const cookName = selectedPrice.cook_name || selectedFood.chef_name || 'Unknown Chef';
    
    // Get kitchen location safely
    const cookData = typeof selectedPrice.cook === 'object' ? selectedPrice.cook : null;
    const kitchenLocation = cookData && typeof cookData === 'object' ? (cookData as any).kitchen_location : null;

    // Add to cart using the cart context
    addItem({
      food_id: selectedFood.food_id,
      food_name: selectedFood.name,
      food_image: selectedFood.image_url || selectedFood.primary_image || '',
      price_id: selectedPrice.price_id,
      size: selectedPrice.size as 'Small' | 'Medium' | 'Large',
      unit_price: Number(selectedPrice.price),
      quantity: quantity,
      chef_id: cookId,
      chef_name: cookName,
      kitchen_address: kitchenLocation?.address || 'Kitchen Location',
      kitchen_location: {
        lat: kitchenLocation?.latitude || 0,
        lng: kitchenLocation?.longitude || 0
      }
    });

    toast.success(`Added ${quantity} × ${selectedFood.name} (${selectedPrice.size}) to cart!`);
    setShowFoodDetail(false);
    setSelectedPriceId(null);
    setQuantity(1);
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

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header Skeleton */}
            <div className="mb-8">
              <Skeleton className="h-8 w-32 mb-4" />
              <div className="flex items-center gap-6">
                <Skeleton className="w-24 h-24 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </div>
            
            {/* Food Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                  <Skeleton className="h-48 w-full rounded-t-lg" />
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-8 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!chefInfo) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Chef not found
            </h1>
            <Button 
              onClick={() => navigate('/menu')}
              className="mt-4"
            >
              Back to Menu
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/menu')}
              className={`mb-4 ${theme === 'dark' ? 'text-white hover:bg-gray-800' : 'text-gray-900 hover:bg-gray-100'}`}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Menu
            </Button>
            
            {/* Chef Info */}
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-2xl">
                {chefInfo.name.substring(0, 2).toUpperCase()}
              </div>
              
              <div>
                <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Chef {chefInfo.name}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1 text-orange-500">
                    <Star className="h-5 w-5 fill-orange-500" />
                    <span className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {chefInfo.rating}
                    </span>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    <ChefHat className="h-3 w-3 mr-1" />
                    Professional Chef
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Food Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {chefFoods.map((food) => {
              const isFavorite = favoriteIds.has(food.food_id);
              const minPrice = Math.min(...food.prices.map(p => Number(p.price)));
              const maxPrice = Math.max(...food.prices.map(p => Number(p.price)));
              const priceRange = minPrice === maxPrice ? `LKR ${minPrice.toFixed(2)}` : `LKR ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`;
              
              return (
                <Card 
                  key={food.food_id} 
                  className={`group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden ${
                    theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}
                  onClick={() => handleFoodClick(food)}
                >
                  {/* Food Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={food.image_url || '/placeholder-food.jpg'}
                      alt={food.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Favorite Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white/90"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(food.food_id);
                      }}
                    >
                      <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                    </Button>
                    
                    {/* Category Badge */}
                    {food.category_name && (
                      <Badge className="absolute top-2 left-2 bg-orange-500 text-white">
                        {food.category_name}
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-4">
                    {/* Food Name */}
                    <h3 className={`font-semibold text-lg mb-2 line-clamp-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {food.name}
                    </h3>
                    
                    {/* Description */}
                    <p className={`text-sm mb-3 line-clamp-2 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {food.description}
                    </p>
                    
                    {/* Price and Rating */}
                    <div className="flex items-center justify-between mb-3">
                      <div className={`text-lg font-bold text-orange-600 ${
                        theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
                      }`}>
                        {priceRange}
                      </div>
                      
                      {food.rating_average && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
                          <span className={`text-sm font-medium ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {typeof food.rating_average === 'number' ? food.rating_average.toFixed(1) : food.rating_average}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Add to Cart Button */}
                    <Button 
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFoodClick(food);
                      }}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      View Options
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Food Detail Modal */}
          <Dialog open={showFoodDetail} onOpenChange={setShowFoodDetail}>
            <DialogContent className={`max-w-4xl max-h-[90vh] overflow-hidden ${
              theme === 'dark' ? 'bg-gray-900' : 'bg-white'
            }`}>
              <DialogHeader>
                <DialogTitle className={`text-2xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {selectedFood?.name}
                </DialogTitle>
              </DialogHeader>
              
              {selectedFood && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar">
                  {/* Left Column - Food Info */}
                  <div className="space-y-4">
                    {/* Food Image */}
                    <div className="relative h-64 overflow-hidden rounded-lg">
                      <img
                        src={selectedFood.image_url || '/placeholder-food.jpg'}
                        alt={selectedFood.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Food Details */}
                    <div className="space-y-3">
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        {selectedFood.description}
                      </p>
                      
                      {selectedFood.preparation_time && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-orange-500" />
                          <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            Prep time: {selectedFood.preparation_time} minutes
                          </span>
                        </div>
                      )}
                      
                      {selectedFood.calories_per_serving && (
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            Calories: {selectedFood.calories_per_serving} per serving
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Right Column - Price Options */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-semibold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Available Sizes
                    </h3>
                    
                    <div className="space-y-3">
                      {selectedFood.prices
                        .filter(price => {
                          const priceCookId = typeof price.cook === 'number' ? price.cook : (price.cook as any)?.id;
                          return priceCookId === Number(cookId);
                        })
                        .sort((a, b) => Number(a.price) - Number(b.price))
                        .map((price) => {
                          const isSelected = selectedPriceId === price.price_id;
                          return (
                            <div
                              key={price.price_id}
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                  : theme === 'dark'
                                    ? 'border-gray-600 bg-gray-800 hover:border-gray-500'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                              }`}
                              onClick={() => setSelectedPriceId(price.price_id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    isSelected 
                                      ? 'border-orange-500 bg-orange-500' 
                                      : 'border-gray-400'
                                  }`}>
                                    {isSelected && (
                                      <div className="w-2 h-2 bg-white rounded-full"></div>
                                    )}
                                  </div>
                                  <span className={`font-semibold ${
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {price.size}
                                  </span>
                                </div>
                                <span className={`text-lg font-bold ${
                                  isSelected 
                                    ? 'text-orange-600 dark:text-orange-400' 
                                    : theme === 'dark' 
                                      ? 'text-white' 
                                      : 'text-gray-900'
                                }`}>
                                  LKR {Number(price.price).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    
                    {/* Quantity and Add to Cart */}
                    {selectedPriceId && (
                      <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-4">
                          <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            Quantity:
                          </span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setQuantity(Math.max(1, quantity - 1))}
                              disabled={quantity <= 1}
                            >
                              -
                            </Button>
                            <span className={`w-8 text-center font-semibold ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                              {quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setQuantity(quantity + 1)}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                        
                        <Button 
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                          onClick={handleAddToCart}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Cart - LKR {(Number(selectedFood.prices.find(p => p.price_id === selectedPriceId)?.price || 0) * quantity).toFixed(2)}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default ChefProfile;