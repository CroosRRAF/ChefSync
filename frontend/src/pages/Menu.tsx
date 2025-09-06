import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { FilterParams, OrderMode } from '@/types/common';
import {
  Search,
  Mic,
  MicOff,
  Filter,
  Star,
  Clock,
  Plus,
  Minus,
  ShoppingCart,
  Leaf,
  MapPin,
  SlidersHorizontal
} from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  reviewCount: number;
  preparationTime: number;
  isVeg: boolean;
  isAvailable: boolean;
  tags: string[];
}

// Mock menu data
const mockMenuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Chicken Biryani',
    description: 'Aromatic basmati rice with tender chicken pieces and traditional spices',
    price: 850,
    image: '/api/placeholder/300/200',
    category: 'Biryani',
    rating: 4.6,
    reviewCount: 324,
    preparationTime: 25,
    isVeg: false,
    isAvailable: true,
    tags: ['popular', 'spicy']
  },
  {
    id: '2',
    name: 'Vegetable Fried Rice',
    description: 'Wok-fried rice with fresh vegetables and aromatic seasonings',
    price: 480,
    image: '/api/placeholder/300/200',
    category: 'Rice',
    rating: 4.3,
    reviewCount: 156,
    preparationTime: 15,
    isVeg: true,
    isAvailable: true,
    tags: ['healthy', 'quick']
  },
  {
    id: '3',
    name: 'Classic Burger',
    description: 'Juicy beef patty with lettuce, tomato, cheese and our special sauce',
    price: 650,
    image: '/api/placeholder/300/200',
    category: 'Burgers',
    rating: 4.4,
    reviewCount: 89,
    preparationTime: 20,
    isVeg: false,
    isAvailable: true,
    tags: ['classic']
  },
  {
    id: '4',
    name: 'Quinoa Buddha Bowl',
    description: 'Nutritious bowl with quinoa, roasted vegetables, avocado and tahini dressing',
    price: 750,
    image: '/api/placeholder/300/200',
    category: 'Healthy',
    rating: 4.7,
    reviewCount: 203,
    preparationTime: 18,
    isVeg: true,
    isAvailable: true,
    tags: ['vegan', 'healthy', 'trending']
  }
];

const categories = ['All', 'Rice', 'Biryani', 'Burgers', 'Healthy', 'Vegan', 'Desserts'];

const Menu: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Get order mode from URL
  const orderMode: OrderMode = (searchParams.get('mode') as OrderMode) || 'normal';
  
  // State
  const [menuItems, setMenuItems] = useState<MenuItem[]>(mockMenuItems);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>(mockMenuItems);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isListening, setIsListening] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState<FilterParams>({
    search: '',
    category: 'All',
    priceMin: 0,
    priceMax: 2000,
    rating: 0,
    isVeg: undefined,
    deliveryTime: 60
  });
  
  const [sortBy, setSortBy] = useState<string>('relevance');

  // Voice recognition setup
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setFilters(prev => ({ ...prev, search: transcript }));
        toast({
          title: "Voice search captured",
          description: `Searching for: "${transcript}"`,
        });
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      recognitionInstance.onerror = (event) => {
        setIsListening(false);
        toast({
          variant: "destructive",
          title: "Voice search error",
          description: "Please try again or use text search.",
        });
      };

      setRecognition(recognitionInstance);
    }
  }, [toast]);

  // Filter and sort items
  useEffect(() => {
    let filtered = menuItems.filter(item => {
      // Search filter
      if (filters.search && !item.name.toLowerCase().includes(filters.search.toLowerCase()) && 
          !item.description.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      
      // Category filter
      if (filters.category && filters.category !== 'All' && item.category !== filters.category) {
        return false;
      }
      
      // Price filter
      if (item.price < filters.priceMin || item.price > filters.priceMax) {
        return false;
      }
      
      // Rating filter
      if (filters.rating && item.rating < filters.rating) {
        return false;
      }
      
      // Veg filter
      if (filters.isVeg !== undefined && item.isVeg !== filters.isVeg) {
        return false;
      }
      
      // Delivery time filter
      if (filters.deliveryTime && item.preparationTime > filters.deliveryTime) {
        return false;
      }
      
      return item.isAvailable;
    });

    // Sort items
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'time':
        filtered.sort((a, b) => a.preparationTime - b.preparationTime);
        break;
      case 'popular':
        filtered.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      default:
        // Keep original order for relevance
        break;
    }

    setFilteredItems(filtered);
  }, [menuItems, filters, sortBy]);

  const handleVoiceSearch = () => {
    if (!recognition) {
      toast({
        variant: "destructive",
        title: "Voice search not supported",
        description: "Your browser doesn't support voice recognition.",
      });
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      setIsListening(true);
      recognition.start();
    }
  };

  const handleAddToCart = (itemId: string) => {
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
    
    toast({
      title: "Added to cart",
      description: "Item has been added to your cart.",
    });
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) {
        newCart[itemId]--;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const getTotalCartItems = () => {
    return Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  };

  const getTotalCartValue = () => {
    return Object.entries(cart).reduce((total, [itemId, quantity]) => {
      const item = menuItems.find(i => i.id === itemId);
      return total + (item ? item.price * quantity : 0);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Header */}
      <div className="bg-muted/30 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Our Menu</h1>
              <p className="text-muted-foreground">
                {orderMode === 'bulk' 
                  ? 'Bulk ordering for 10+ items with special rates'
                  : 'Discover delicious meals crafted by our expert chefs'
                }
              </p>
            </div>
            
            {orderMode === 'bulk' && (
              <Badge variant="secondary" className="text-lg px-4 py-2">
                Bulk Order Mode
              </Badge>
            )}
          </div>

          {/* Search and Voice */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for dishes, cuisines, or ingredients..."
                className="pl-10 pr-20"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
              <Button
                variant="ghost"
                size="sm"
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${isListening ? 'text-primary animate-pulse' : ''}`}
                onClick={handleVoiceSearch}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            </div>
            
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter & Sort</SheetTitle>
                </SheetHeader>
                
                <div className="space-y-6 mt-6">
                  {/* Sort By */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Sort By</label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="rating">Rating</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="time">Preparation Time</SelectItem>
                        <SelectItem value="popular">Most Popular</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <Select 
                      value={filters.category || 'All'} 
                      onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Price Range: Rs. {filters.priceMin} - Rs. {filters.priceMax}
                    </label>
                    <Slider
                      value={[filters.priceMin, filters.priceMax]}
                      onValueChange={([min, max]) => setFilters(prev => ({ 
                        ...prev, 
                        priceMin: min, 
                        priceMax: max 
                      }))}
                      max={2000}
                      min={0}
                      step={50}
                      className="w-full"
                    />
                  </div>

                  {/* Dietary Preferences */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Dietary Preferences</label>
                    <div className="space-y-2">
                      <Button
                        variant={filters.isVeg === undefined ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilters(prev => ({ ...prev, isVeg: undefined }))}
                        className="w-full justify-start"
                      >
                        All Items
                      </Button>
                      <Button
                        variant={filters.isVeg === true ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilters(prev => ({ ...prev, isVeg: true }))}
                        className="w-full justify-start"
                      >
                        <Leaf className="h-4 w-4 mr-2 text-green-500" />
                        Vegetarian Only
                      </Button>
                      <Button
                        variant={filters.isVeg === false ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilters(prev => ({ ...prev, isVeg: false }))}
                        className="w-full justify-start"
                      >
                        Non-Vegetarian
                      </Button>
                    </div>
                  </div>

                  {/* Minimum Rating */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Minimum Rating: {filters.rating} stars
                    </label>
                    <Slider
                      value={[filters.rating || 0]}
                      onValueChange={([value]) => setFilters(prev => ({ ...prev, rating: value }))}
                      max={5}
                      min={0}
                      step={0.5}
                      className="w-full"
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={filters.category === category ? "default" : "outline"}
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, category }))}
                className="whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="container mx-auto px-4 py-8">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No items found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map(item => (
              <Card key={item.id} className="group hover:shadow-food transition-all duration-300 food-card-hover">
                <div className="relative">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  {item.isVeg && (
                    <Badge className="absolute top-2 left-2 bg-green-500 hover:bg-green-600">
                      <Leaf className="h-3 w-3 mr-1" />
                      Veg
                    </Badge>
                  )}
                  {item.tags.includes('popular') && (
                    <Badge className="absolute top-2 right-2 bg-primary">
                      Popular
                    </Badge>
                  )}
                </div>
                
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg leading-tight">{item.name}</h3>
                    <span className="font-bold text-primary">Rs. {item.price}</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {item.description}
                  </p>
                  
                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-current text-yellow-500" />
                      <span className="font-medium">{item.rating}</span>
                      <span className="text-muted-foreground">({item.reviewCount})</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{item.preparationTime}min</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {cart[item.id] ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveFromCart(item.id)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-medium px-2">{cart[item.id]}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddToCart(item.id)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleAddToCart(item.id)}
                        className="flex-1"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Fixed Cart Summary */}
      {getTotalCartItems() > 0 && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground p-4 rounded-lg shadow-glow">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-5 w-5" />
            <div>
              <div className="font-medium">{getTotalCartItems()} items</div>
              <div className="text-sm opacity-90">Rs. {getTotalCartValue()}</div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate('/customer/cart')}
            >
              View Cart
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;
