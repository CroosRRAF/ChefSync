import React, { useState } from 'react';
import { X, Plus, Minus, Star, Clock, ShoppingCart, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCartService } from '@/services/cartService';
import { toast } from 'sonner';

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

interface SimpleAddToCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  food: Food | null;
  onSuccess?: () => void;
}

const SimpleAddToCartModal: React.FC<SimpleAddToCartModalProps> = ({
  isOpen,
  onClose,
  food,
  onSuccess
}) => {
  const [selectedPriceId, setSelectedPriceId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);
  
  const { addToCart } = useCartService();

  React.useEffect(() => {
    if (food && food.prices.length > 0) {
      setSelectedPriceId(food.prices[0].id);
      setQuantity(1);
      setSpecialInstructions('');
    }
  }, [food]);

  const handleAddToCart = async () => {
    if (!food || !selectedPriceId) {
      toast.error('Please select a size');
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(selectedPriceId, quantity, specialInstructions);
      toast.success(`${food.name} added to cart!`);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const getSelectedPrice = () => {
    if (!food || !selectedPriceId) return null;
    return food.prices.find(p => p.id === selectedPriceId) || null;
  };

  const getTotalPrice = () => {
    const price = getSelectedPrice();
    return price ? price.price * quantity : 0;
  };

  const formatPrice = (price: number) => {
    return `Rs. ${price.toFixed(2)}`;
  };

  if (!isOpen || !food) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden p-0">
        {/* Header Image */}
        <div className="relative h-48 bg-gray-200">
          <img
            src={food.optimized_image_url || food.image_url || '/api/placeholder/400/200'}
            alt={food.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/api/placeholder/400/200';
            }}
          />
          
          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-2 right-2 h-8 w-8 p-0 bg-white/80 hover:bg-white"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Featured Badge */}
          {food.is_featured && (
            <Badge className="absolute top-2 left-2 bg-orange-500">
              Featured
            </Badge>
          )}
        </div>

        <ScrollArea className="flex-1 max-h-[60vh]">
          <div className="p-6 space-y-4">
            {/* Food Info */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-xl font-bold text-gray-900">{food.name}</h2>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{food.rating?.toFixed(1)}</span>
                  <span className="text-gray-500">({food.reviews_count})</span>
                </div>
              </div>
              
              <p className="text-gray-600 mb-3">{food.description}</p>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{food.preparation_time} min</span>
                </div>
                <div>by {food.chef.name}</div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {food.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Choose Size</Label>
              <div className="space-y-2">
                {food.prices.map((price) => (
                  <Card 
                    key={price.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedPriceId === price.id 
                        ? 'ring-2 ring-orange-500 bg-orange-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedPriceId(price.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{price.size}</p>
                        </div>
                        <p className="font-bold text-orange-600">
                          {formatPrice(price.price)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Quantity Selection */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Quantity</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="h-10 w-10 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                
                <span className="text-xl font-semibold min-w-[40px] text-center">
                  {quantity}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-10 w-10 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Special Instructions */}
            <div>
              <Label className="text-base font-semibold mb-2 block">
                Special Instructions (Optional)
              </Label>
              <Textarea
                placeholder="Any special requests for your order..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-6 border-t bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">Total Price</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(getTotalPrice())}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {quantity} × {formatPrice(getSelectedPrice()?.price || 0)}
              </p>
            </div>
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={!selectedPriceId || addingToCart || !food.is_available}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {addingToCart ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Adding to Cart...
              </div>
            ) : !food.is_available ? (
              'Currently Unavailable'
            ) : (
              <>
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart • {formatPrice(getTotalPrice())}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimpleAddToCartModal;