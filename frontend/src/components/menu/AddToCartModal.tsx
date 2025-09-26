import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Star, Clock, Users, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { menuService, FoodItem, FoodPrice } from '@/services/menuService';
import { toast } from 'sonner';

interface AddToCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  foodItem: FoodItem | null;
}

const AddToCartModal: React.FC<AddToCartModalProps> = ({
  isOpen,
  onClose,
  foodItem
}) => {
  const [foodPrices, setFoodPrices] = useState<FoodPrice[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<FoodPrice | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  
  const { addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isOpen && foodItem) {
      loadFoodPrices();
      setQuantity(1);
    }
  }, [isOpen, foodItem]);

  const loadFoodPrices = async () => {
    if (!foodItem) return;
    
    setLoading(true);
    try {
      const prices = await menuService.getFoodPrices(foodItem.food_id);
      setFoodPrices(prices);
      
      // Set default selected price (Medium if available, otherwise first one)
      const defaultPrice = prices.find(p => p.size === 'Medium') || prices[0];
      setSelectedPrice(defaultPrice);
    } catch (error) {
      console.error('Error loading food prices:', error);
      toast.error('Failed to load food options');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedPrice || !isAuthenticated || user?.role !== 'customer') {
      toast.error('Please login as a customer to add items to cart');
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(selectedPrice.price_id, quantity);
      toast.success(`${foodItem?.name} added to cart! 🛒`);
      onClose();
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const updateQuantity = (delta: number) => {
    setQuantity(prev => Math.max(1, Math.min(10, prev + delta)));
  };

  if (!isOpen || !foodItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <Card className="relative w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden bg-white dark:bg-gray-900">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white rounded-full"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <ScrollArea className="max-h-[90vh]">
          <CardContent className="p-0">
            {/* Food Image */}
            <div className="relative h-64 bg-gray-100">
              {foodItem.primary_image || foodItem.image_url ? (
                <img
                  src={foodItem.primary_image || foodItem.image_url}
                  alt={foodItem.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-red-100">
                  <ShoppingCart className="h-16 w-16 text-orange-400" />
                </div>
              )}
              
              {/* Food badges */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                {foodItem.is_vegetarian && (
                  <Badge className="bg-green-500 text-white">Veg</Badge>
                )}
                {foodItem.is_vegan && (
                  <Badge className="bg-green-600 text-white">Vegan</Badge>
                )}
                {foodItem.is_gluten_free && (
                  <Badge className="bg-blue-500 text-white">Gluten Free</Badge>
                )}
                {foodItem.spice_level && (
                  <Badge variant="outline" className="bg-white/90">
                    {foodItem.spice_level.charAt(0).toUpperCase() + foodItem.spice_level.slice(1)} Spicy
                  </Badge>
                )}
              </div>
            </div>

            {/* Food Details */}
            <div className="p-6">
              {/* Title and Rating */}
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {foodItem.name}
                </h2>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{foodItem.rating_average ? Number(foodItem.rating_average).toFixed(1) : 'N/A'}</span>
                    <span>({foodItem.total_reviews} reviews)</span>
                  </div>
                  
                  {foodItem.preparation_time && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{foodItem.preparation_time} mins</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {foodItem.description && (
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  {foodItem.description}
                </p>
              )}

              {/* Size Selection */}
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent" />
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Choose Size</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {foodPrices.map((price) => (
                        <button
                          key={price.price_id}
                          onClick={() => setSelectedPrice(price)}
                          className={`p-4 border-2 rounded-lg transition-all ${
                            selectedPrice?.price_id === price.price_id
                              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="text-left">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {price.size}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <span>by {price.cook.name}</span>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span>{price.cook.rating}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-orange-600">
                                LKR {Number(price.price).toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {price.estimated_delivery_time || 30} mins
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantity Selection */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Quantity</h3>
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(-1)}
                        disabled={quantity <= 1}
                        className="rounded-full"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      
                      <span className="text-2xl font-semibold w-12 text-center">
                        {quantity}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(1)}
                        disabled={quantity >= 10}
                        className="rounded-full"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Total Price */}
                  {selectedPrice && (
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium">Total</span>
                        <span className="text-2xl font-bold text-orange-600">
                          LKR {(Number(selectedPrice.price) * quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Add to Cart Button */}
                  <Button
                    onClick={handleAddToCart}
                    disabled={!selectedPrice || addingToCart || !isAuthenticated || user?.role !== 'customer'}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 text-lg font-semibold disabled:opacity-50"
                  >
                    {addingToCart ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Adding to Cart...
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5 mr-2" />
                        Add to Cart - LKR {selectedPrice ? (Number(selectedPrice.price) * quantity).toFixed(2) : '0.00'}
                      </>
                    )}
                  </Button>

                  {/* Login prompt for non-customers */}
                  {!isAuthenticated && (
                    <p className="text-center text-sm text-gray-500 mt-3">
                      Please <button className="text-orange-600 underline">login as a customer</button> to add items to cart
                    </p>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </ScrollArea>
      </Card>
    </div>
  );
};

export default AddToCartModal;