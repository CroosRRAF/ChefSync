import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Star, Clock, Users, MapPin, ChefHat, Heart, Share2, Minus, Plus } from 'lucide-react';
import { useDatabaseCart } from '@/context/DatabaseCartContext';
import { FoodItem, FoodPriceSimple } from '@/services/menuService';
import DraggableCartButton from '@/components/cart/DraggableCartButton';
import CartModal from '@/components/cart/CartModal';
import SwitchCookWarning from '@/components/cart/SwitchCookWarning';
import { toast } from 'sonner';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem, getItemsByChef, clearCart } = useDatabaseCart();
  
  const [food, setFood] = useState<FoodItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<'Small' | 'Medium' | 'Large'>('Medium');
  const [quantity, setQuantity] = useState(1);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isSwitchCookModalOpen, setIsSwitchCookModalOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchFoodDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const foodData = await menuService.getFoodById(parseInt(id));
        setFood(foodData);
      } catch (error) {
        console.error('Error fetching food details:', error);
        toast.error('Failed to load food details');
      } finally {
        setLoading(false);
      }
    };

    fetchFoodDetails();
  }, [id]);

  const handleAddToCart = () => {
    if (!food || !food.prices || food.prices.length === 0) return;

    const selectedPrice = food.prices.find(p => p.size === selectedSize);
    if (!selectedPrice) return;

    const chefItems = getItemsByChef();
    const currentChefId = selectedPrice.cook;
    const hasItemsFromOtherChef = Array.from(chefItems.keys()).some(chefId => chefId !== currentChefId);

    if (hasItemsFromOtherChef && chefItems.size > 0) {
      // Show switch cook warning
      setPendingItem({
        food_id: food.food_id,
        food_name: food.name,
        food_image: food.primary_image,
        price_id: selectedPrice.price_id,
        size: selectedSize,
        unit_price: parseFloat(selectedPrice.price),
        quantity,
        chef_id: selectedPrice.cook,
        chef_name: selectedPrice.cook_name,
        kitchen_address: 'Kitchen Address', // This would need to be fetched separately
        kitchen_location: { lat: 0, lng: 0 }, // This would need to be fetched separately
      });
      setIsSwitchCookModalOpen(true);
    } else {
      // Add directly to cart
      addItemToCart();
    }
  };

  const addItemToCart = async () => {
    if (!food || !food.prices || food.prices.length === 0) return;

    const selectedPrice = food.prices.find(p => p.size === selectedSize);
    if (!selectedPrice) return;

    try {
      await addItem(selectedPrice.price_id, quantity);
      setIsCartModalOpen(true);
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
  };

  const handleSwitchCookConfirm = async () => {
    await clearCart();
    await addItemToCart();
    setIsSwitchCookModalOpen(false);
    setPendingItem(null);
  };

  const handleSwitchCookCancel = () => {
    setIsSwitchCookModalOpen(false);
    setPendingItem(null);
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity);
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: food?.name,
        text: food?.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!food) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Food not found</h1>
          <Button onClick={() => navigate('/menu')} variant="outline">
            Back to Menu
          </Button>
        </div>
      </div>
    );
  }

  const selectedPrice = food.prices?.find(p => p.size === selectedSize);
  const totalPrice = selectedPrice ? parseFloat(selectedPrice.price) * quantity : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              ← Back
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={toggleFavorite}>
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="h-5 w-5 text-gray-400" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-white shadow-lg">
              <img
                src={food.primary_image}
                alt={food.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Additional Images */}
            {food.images && food.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {food.images.slice(0, 4).map((image, index) => (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden bg-white shadow-sm">
                    <img
                      src={image.image}
                      alt={`${food.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Title and Rating */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{food.name}</h1>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{food.rating_average}</span>
                  <span className="text-gray-500">({food.total_reviews} reviews)</span>
                </div>
                <Badge variant="secondary">{food.cuisine_name}</Badge>
                <Badge variant="outline">{food.category_name}</Badge>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">{food.description}</p>
            </div>

            {/* Chef Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ChefHat className="h-5 w-5 text-orange-500" />
                  Cooked by {food.prices?.[0]?.cook_name || 'Unknown Cook'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>Kitchen Location</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{food.prices?.[0]?.cook_rating || 'N/A'} rating</span>
                </div>
              </CardContent>
            </Card>

            {/* Dietary Info */}
            <div className="flex flex-wrap gap-2">
              {food.is_vegetarian && <Badge variant="outline" className="bg-green-50 text-green-700">Vegetarian</Badge>}
              {food.is_vegan && <Badge variant="outline" className="bg-green-50 text-green-700">Vegan</Badge>}
              {food.is_gluten_free && <Badge variant="outline" className="bg-blue-50 text-blue-700">Gluten Free</Badge>}
              {food.spice_level && (
                <Badge variant="outline" className="bg-red-50 text-red-700">
                  {food.spice_level.charAt(0).toUpperCase() + food.spice_level.slice(1)} Spice
                </Badge>
              )}
            </div>

            {/* Preparation Time */}
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-5 w-5" />
              <span>Preparation time: {food.preparation_time} minutes</span>
            </div>

            {/* Ingredients */}
            {food.ingredients && food.ingredients.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ingredients</h3>
                <div className="flex flex-wrap gap-2">
                  {food.ingredients.map((ingredient, index) => (
                    <Badge key={index} variant="secondary">{ingredient}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Allergens */}
            {food.allergens && food.allergens.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Allergens</h3>
                <div className="flex flex-wrap gap-2">
                  {food.allergens.map((allergen, index) => (
                    <Badge key={index} variant="destructive">{allergen}</Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Size Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Size</h3>
              <div className="grid grid-cols-3 gap-3">
                {food.prices?.map((price) => (
                  <Button
                    key={price.size}
                    variant={selectedSize === price.size ? "default" : "outline"}
                    className="flex flex-col items-center p-4 h-auto"
                    onClick={() => setSelectedSize(price.size as 'Small' | 'Medium' | 'Large')}
                  >
                    <span className="font-semibold">{price.size}</span>
                    <span className="text-sm text-gray-500">LKR {price.price}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Quantity Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Quantity</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-4 py-2 font-semibold">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= 10}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <span className="text-gray-600">Max 10 per order</span>
              </div>
            </div>

            {/* Price */}
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Price</p>
                  <p className="text-2xl font-bold text-orange-600">LKR {totalPrice.toFixed(2)}</p>
                </div>
                <Button
                  size="lg"
                  onClick={handleAddToCart}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8"
                >
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Draggable Cart Button */}
      <DraggableCartButton onCartClick={() => setIsCartModalOpen(true)} />

      {/* Cart Modal */}
      <CartModal 
        isOpen={isCartModalOpen} 
        onClose={() => setIsCartModalOpen(false)} 
      />

      {/* Switch Cook Warning Modal */}
      <SwitchCookWarning
        isOpen={isSwitchCookModalOpen}
        currentCookName={pendingItem ? Array.from(getItemsByChef().keys()).map(chefId => {
          const chefItems = getItemsByChef().get(chefId);
          return chefItems?.[0]?.chef_name;
        }).find(Boolean) : ''}
        newCookName={pendingItem?.chef_name || ''}
        onConfirm={handleSwitchCookConfirm}
        onCancel={handleSwitchCookCancel}
      />
    </div>
  );
};

export default ProductDetail;
