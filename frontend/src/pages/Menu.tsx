import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Search, 
  Filter, 
  Clock, 
  Star, 
  Plus, 
  Minus, 
  Leaf,
  ChefHat,
  MapPin,
  X
} from 'lucide-react';

interface FoodItem {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  cookId: string;
  cookName: string;
  cookRating: number;
  prepTime: number;
  cuisine: string;
  isVeg: boolean;
  isVegan?: boolean;
  discount?: number;
  tags: string[];
}

interface CartItem extends FoodItem {
  quantity: number;
}

interface FilterOptions {
  cuisine: string[];
  priceRange: [number, number];
  cookRating: number;
  prepTime: number;
  dietary: ('veg' | 'nonveg' | 'vegan')[];
  distance: number;
}

// Mock data
const mockFoodItems: FoodItem[] = [
  {
    id: '1',
    name: 'Chicken Biryani',
    description: 'Aromatic basmati rice with tender chicken pieces and traditional spices',
    image: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400&h=300&fit=crop',
    price: 250,
    cookId: 'cook1',
    cookName: 'Rajesh Kumar',
    cookRating: 4.8,
    prepTime: 30,
    cuisine: 'Indian',
    isVeg: false,
    tags: ['popular', 'spicy', 'traditional']
  },
  {
    id: '2',
    name: 'Vegetable Fried Rice',
    description: 'Wok-fried rice with fresh vegetables and aromatic seasonings',
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop',
    price: 180,
    cookId: 'cook2',
    cookName: 'Priya Sharma',
    cookRating: 4.6,
    prepTime: 20,
    cuisine: 'Chinese',
    isVeg: true,
    tags: ['healthy', 'quick', 'vegetarian']
  },
  {
    id: '3',
    name: 'Masala Dosa',
    description: 'Crispy rice crepe filled with spiced potato mixture',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop',
    price: 120,
    cookId: 'cook3',
    cookName: 'Suresh Nair',
    cookRating: 4.9,
    prepTime: 15,
    cuisine: 'South Indian',
    isVeg: true,
    isVegan: true,
    tags: ['traditional', 'vegan', 'breakfast']
  },
  {
    id: '4',
    name: 'Butter Chicken',
    description: 'Tender chicken in rich tomato and cream sauce',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop',
    price: 320,
    cookId: 'cook4',
    cookName: 'Amit Singh',
    cookRating: 4.7,
    prepTime: 35,
    cuisine: 'Indian',
    isVeg: false,
    discount: 10,
    tags: ['popular', 'creamy', 'non-veg']
  }
];

const cuisineCategories = [
  { name: 'Indian', count: 2 },
  { name: 'Chinese', count: 1 },
  { name: 'South Indian', count: 1 }
];

const Menu: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderMode = searchParams.get('mode') || 'normal';
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<FilterOptions>({
    cuisine: [],
    priceRange: [0, 500],
    cookRating: 0,
    prepTime: 120,
    dietary: [],
    distance: 10
  });

  // Filter and search logic
  const filteredItems = useMemo(() => {
    let items = mockFoodItems;

    // Search filter
    if (searchQuery) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.cookName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.cuisine.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Cuisine filter
    if (selectedCuisine !== 'All') {
      items = items.filter(item => item.cuisine === selectedCuisine);
    }

    // Price range filter
    items = items.filter(item => 
      item.price >= filters.priceRange[0] && item.price <= filters.priceRange[1]
    );

    // Cook rating filter
    if (filters.cookRating > 0) {
      items = items.filter(item => item.cookRating >= filters.cookRating);
    }

    // Prep time filter
    items = items.filter(item => item.prepTime <= filters.prepTime);

    // Dietary filters
    if (filters.dietary.length > 0) {
      items = items.filter(item => {
        if (filters.dietary.includes('veg') && item.isVeg) return true;
        if (filters.dietary.includes('nonveg') && !item.isVeg) return true;
        if (filters.dietary.includes('vegan') && item.isVegan) return true;
        return false;
      });
    }

    return items;
  }, [mockFoodItems, searchQuery, selectedCuisine, filters]);

  const addToCart = (item: FoodItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => 
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(i => 
          i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter(i => i.id !== itemId);
    });
  };

  const getCartQuantity = (itemId: string): number => {
    const cartItem = cart.find(item => item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const getTotalCartItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalCartValue = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 animate-slideUp">
                Our Menu
              </h1>
              <p className="text-gray-600 dark:text-gray-400 flex items-center animate-slideUp animation-delay-200">
                <MapPin className="h-4 w-4 mr-1" />
                Delivering to your location
                {orderMode && (
                  <Badge className="ml-2 bg-orange-100 text-orange-800 animate-scaleIn">
                    {orderMode === 'normal' ? 'Normal Order' : 'Bulk Order'}
                  </Badge>
                )}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 lg:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search dishes, cooks, or cuisine..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </Button>
            </div>
          </div>

          {/* Cuisine Categories */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            <Button
              variant={selectedCuisine === 'All' ? 'default' : 'outline'}
              onClick={() => setSelectedCuisine('All')}
              className="whitespace-nowrap"
            >
              All ({mockFoodItems.length})
            </Button>
            {cuisineCategories.map((category) => (
              <Button
                key={category.name}
                variant={selectedCuisine === category.name ? 'default' : 'outline'}
                onClick={() => setSelectedCuisine(category.name)}
                className="whitespace-nowrap"
              >
                {category.name} ({category.count})
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Filters</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFilters(false)}
                      className="lg:hidden"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {/* Price Range */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Price Range: ₹{filters.priceRange[0]} - ₹{filters.priceRange[1]}
                      </label>
                      <Slider
                        value={filters.priceRange}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value as [number, number] }))}
                        max={500}
                        min={0}
                        step={10}
                        className="w-full"
                      />
                    </div>

                    {/* Cook Rating */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Minimum Cook Rating: {filters.cookRating}+
                      </label>
                      <Slider
                        value={[filters.cookRating]}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, cookRating: value[0] }))}
                        max={5}
                        min={0}
                        step={0.1}
                        className="w-full"
                      />
                    </div>

                    {/* Prep Time */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Max Prep Time: {filters.prepTime} min
                      </label>
                      <Slider
                        value={[filters.prepTime]}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, prepTime: value[0] }))}
                        max={120}
                        min={15}
                        step={5}
                        className="w-full"
                      />
                    </div>

                    {/* Dietary Preferences */}
                    <div>
                      <label className="text-sm font-medium mb-3 block">Dietary Preferences</label>
                      <div className="space-y-3">
                        {[
                          { key: 'veg', label: 'Vegetarian', icon: '🥬' },
                          { key: 'nonveg', label: 'Non-Vegetarian', icon: '🍖' },
                          { key: 'vegan', label: 'Vegan', icon: '🌱' }
                        ].map(({ key, label, icon }) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm flex items-center">
                              <span className="mr-2">{icon}</span>
                              {label}
                            </span>
                            <Switch
                              checked={filters.dietary.includes(key as 'veg' | 'nonveg' | 'vegan')}
                              onCheckedChange={(checked) => {
                                const newDietary = checked
                                  ? [...filters.dietary, key as 'veg' | 'nonveg' | 'vegan']
                                  : filters.dietary.filter(d => d !== key);
                                setFilters(prev => ({ ...prev, dietary: newDietary }));
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Food Items Grid */}
          <div className={`${showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <ChefHat className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  No dishes found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your filters or search terms
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item, index) => (
                  <Card key={item.id} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg animate-slideUp" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="relative">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {item.discount && (
                        <Badge className="absolute top-3 left-3 bg-red-500 text-white">
                          {item.discount}% OFF
                        </Badge>
                      )}
                      <div className="absolute top-3 right-3">
                        {item.isVeg ? (
                          <div className="w-6 h-6 border-2 border-green-500 bg-white rounded-sm flex items-center justify-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          </div>
                        ) : (
                          <div className="w-6 h-6 border-2 border-red-500 bg-white rounded-sm flex items-center justify-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          </div>
                        )}
                      </div>
                      {item.isVegan && (
                        <Badge className="absolute bottom-3 left-3 bg-green-600 text-white text-xs">
                          <Leaf className="h-3 w-3 mr-1" />
                          Vegan
                        </Badge>
                      )}
                    </div>

                    <CardContent className="p-4">
                      {/* Cook Info */}
                      <div className="flex items-center space-x-2 mb-3">
                        <img
                          src={`https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=32&h=32&fit=crop&crop=face`}
                          alt={item.cookName}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.cookName}
                          </p>
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {item.cookRating}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Food Info */}
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                        {item.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                        {item.description}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Bottom Section */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2">
                            <span className="text-xl font-bold text-gray-900 dark:text-white">
                              ₹{item.discount ? Math.round(item.price * (1 - item.discount / 100)) : item.price}
                            </span>
                            {item.discount && (
                              <span className="text-sm text-gray-500 line-through">
                                ₹{item.price}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="h-3 w-3 mr-1" />
                            {item.prepTime} min
                          </div>
                        </div>

                        {getCartQuantity(item.id) > 0 ? (
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeFromCart(item.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="font-medium min-w-8 text-center">
                              {getCartQuantity(item.id)}
                            </span>
                            <Button
                              size="sm"
                              onClick={() => addToCart(item)}
                              className="h-8 w-8 p-0 bg-orange-500 hover:bg-orange-600"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => addToCart(item)}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-6"
                          >
                            <span className="flex items-center">
                              Add
                              <Plus className="ml-1 h-4 w-4" />
                            </span>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Fixed Cart Summary */}
        {getTotalCartItems() > 0 && (
          <div className="fixed bottom-4 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-lg shadow-2xl animate-scaleIn">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <span className="text-lg font-bold">{getTotalCartItems()}</span>
              </div>
              <div>
                <div className="font-medium">{getTotalCartItems()} items</div>
                <div className="text-sm opacity-90">₹{getTotalCartValue()}</div>
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
      </div>
    </div>
  );
};

export default Menu;