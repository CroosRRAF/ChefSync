import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Clock, 
  Award,
  ChefHat,
  UtensilsCrossed,
  Package,
  ShoppingCart,
  Heart,
  Calendar,
  Users,
  Plus,
  Minus
} from 'lucide-react';
import { toast } from 'sonner';
import CustomerHomeNavbar from '@/components/layout/CustomerHomeNavbar';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useDatabaseCart } from '@/context/DatabaseCartContext';
import { enhancedMenuService, MenuFood } from '@/services/enhancedMenuService';

interface ChefProfile {
  id: number;
  user_id: number;
  user: number;
  name: string;
  username: string;
  email: string;
  phone_no?: string;
  specialty_cuisines?: string[];
  experience_years?: number;
  certifications?: string[];
  bio?: string;
  approval_status?: string;
  rating?: number | string;
  rating_average?: number | string;
  total_orders?: number;
  total_reviews?: number;
  is_featured?: boolean;
  kitchen_location?: {
    address: string;
    city: string;
    state?: string;
    latitude?: number;
    longitude?: number;
  };
  operating_hours?: Record<string, any>;
  operating_hours_readable?: string;
  is_currently_open?: boolean;
  availability_message?: string;
}

interface BulkMenu {
  id: number;
  menu_name: string;
  description: string;
  meal_type: string;
  base_price_per_person: number;
  min_persons: number;
  max_persons: number;
  advance_notice_hours: number;
  image_url?: string;
  thumbnail_url?: string;
  items_count: number;
}

const ChefProfilePage: React.FC = () => {
  const { cookId } = useParams<{ cookId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { addItem } = useDatabaseCart();
  
  const [chef, setChef] = useState<ChefProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMenus, setLoadingMenus] = useState(true);
  const [regularMenuItems, setRegularMenuItems] = useState<MenuFood[]>([]);
  const [bulkMenus, setBulkMenus] = useState<BulkMenu[]>([]);
  
  // Food detail dialog
  const [selectedFood, setSelectedFood] = useState<MenuFood | null>(null);
  const [showFoodDetail, setShowFoodDetail] = useState(false);
  const [selectedPriceId, setSelectedPriceId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchChefProfile();
  }, [cookId]);

  // Fetch menus after chef profile is loaded
  useEffect(() => {
    if (chef?.user_id) {
      fetchChefMenus(chef.user_id);
    }
  }, [chef?.user_id]);

  const fetchChefProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/users/chef-profiles/${cookId}/`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Chef profile data:', data);
        setChef(data);
      } else {
        toast.error('Failed to load chef profile');
      }
    } catch (error) {
      console.error('Error fetching chef profile:', error);
      toast.error('Error loading chef profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchChefMenus = async (userId: number) => {
    try {
      setLoadingMenus(true);
      console.log('Fetching menus for chef user_id:', userId);
      
      // Fetch regular menu items using user_id
      const regularMenuResponse = await enhancedMenuService.getMenuFoods({
        page: 1,
        page_size: 100,
        chef_ids: [userId]
      });
      
      console.log('Regular menu response:', regularMenuResponse);
      
      // Filter foods to only include items from this specific chef
      const filteredFoods = regularMenuResponse.results.filter(food => {
        return food.prices.some(price => {
          const priceCookId = typeof price.cook === 'number' ? price.cook : (price.cook as any)?.id;
          return priceCookId === userId;
        });
      });
      
      console.log('Filtered regular menu items:', filteredFoods.length);
      setRegularMenuItems(filteredFoods);

      // Fetch bulk menus using user_id (not profile_id)
      const token = localStorage.getItem('access_token');
      const bulkResponse = await fetch(`/api/food/bulk-menus/?chef=${userId}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (bulkResponse.ok) {
        const bulkData = await bulkResponse.json();
        console.log('Bulk menu response:', bulkData);
        const bulkMenuList = bulkData.results || bulkData || [];
        console.log('Bulk menu items:', bulkMenuList.length);
        setBulkMenus(bulkMenuList);
      } else {
        console.error('Failed to fetch bulk menus:', await bulkResponse.text());
      }
    } catch (error) {
      console.error('Error fetching chef menus:', error);
      toast.error('Failed to load menus');
    } finally {
      setLoadingMenus(false);
    }
  };

  const handleFoodClick = (food: MenuFood) => {
    setSelectedFood(food);
    setSelectedPriceId(null);
    setQuantity(1);
    setShowFoodDetail(true);
  };

  const handleAddToCart = () => {
    if (!selectedFood || !selectedPriceId) {
      toast.error('Please select a size');
      return;
    }

    const selectedPrice = selectedFood.prices.find(p => p.price_id === selectedPriceId);
    if (!selectedPrice) return;

    const cookId = typeof selectedPrice.cook === 'number' ? selectedPrice.cook : (selectedPrice.cook as any)?.id;
    const cookName = selectedPrice.cook_name || selectedFood.chef_name || 'Unknown Chef';
    const cookData = typeof selectedPrice.cook === 'object' ? selectedPrice.cook : null;
    const kitchenLocation = cookData && typeof cookData === 'object' ? (cookData as any).kitchen_location : null;

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

    toast.success('Added to cart!');
    setShowFoodDetail(false);
    setSelectedPriceId(null);
    setQuantity(1);
  };

  const handleBulkMenuClick = (menu: BulkMenu) => {
    navigate(`/customer/bulk-orders`);
  };

  if (loading) {
    return (
      <>
        {isAuthenticated && user?.role === 'customer' ? <CustomerHomeNavbar /> : <Navbar />}
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading chef profile...</p>
          </div>
        </div>
      </>
    );
  }

  if (!chef) {
    return (
      <>
        {isAuthenticated && user?.role === 'customer' ? <CustomerHomeNavbar /> : <Navbar />}
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Chef Not Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The chef profile you're looking for doesn't exist.
              </p>
              <Button onClick={() => navigate(-1)}>Go Back</Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      {isAuthenticated && user?.role === 'customer' ? <CustomerHomeNavbar /> : <Navbar />}
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {/* Chef Header Card */}
          <Card className="mb-8 overflow-hidden bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start gap-6">
                {/* Chef Avatar */}
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-4xl font-bold flex-shrink-0 shadow-lg">
                  {chef.name?.substring(0, 2).toUpperCase() || 'CH'}
                </div>

                {/* Chef Info */}
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                    <div>
                      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        Chef {chef.name || chef.username}
                      </h1>
                      {chef.specialty_cuisines && chef.specialty_cuisines.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {chef.specialty_cuisines.map((cuisine, index) => (
                            <Badge key={index} variant="outline" className="bg-white dark:bg-gray-800 text-orange-600 border-orange-300">
                              {cuisine}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {chef.experience_years && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {chef.experience_years} years of culinary experience
                        </p>
                      )}
                    </div>
                    {(chef.rating || chef.rating_average) && (
                      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-6 py-3 rounded-xl shadow-md">
                        <Star className="h-6 w-6 fill-orange-500 text-orange-500" />
                        <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {Number(chef.rating || chef.rating_average).toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Stats Row */}
                  <div className="flex flex-wrap gap-6 mt-6">
                    {chef.total_orders !== undefined && (
                      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg">
                        <Package className="h-5 w-5 text-orange-500" />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {chef.total_orders}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          orders
                        </span>
                      </div>
                    )}
                    {chef.total_reviews !== undefined && (
                      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg">
                        <Star className="h-5 w-5 text-orange-500" />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {chef.total_reviews}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          reviews
                        </span>
                      </div>
                    )}
                    {chef.kitchen_location && (
                      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg">
                        <MapPin className="h-5 w-5 text-orange-500" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {chef.kitchen_location.city || chef.kitchen_location.address}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Badge className="bg-green-500 hover:bg-green-600 text-white">
                      <Award className="h-3 w-3 mr-1" />
                      Verified Chef
                    </Badge>
                    <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
                      Available for Bulk Orders
                    </Badge>
                    {chef.is_featured && (
                      <Badge className="bg-purple-500 hover:bg-purple-600 text-white">
                        <Star className="h-3 w-3 mr-1" />
                        Featured Chef
                      </Badge>
                    )}
                    {/* Availability Status Badge */}
                    {chef.is_currently_open !== undefined && (
                      <Badge className={chef.is_currently_open ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-500 hover:bg-red-600 text-white"}>
                        <Clock className="h-3 w-3 mr-1" />
                        {chef.is_currently_open ? 'Open Now' : 'Closed'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chef Availability Hours */}
          {chef.operating_hours_readable && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-6 w-6 text-orange-500" />
                  Operating Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-gray-700 dark:text-gray-300">
                      {chef.operating_hours_readable}
                    </p>
                    {chef.is_currently_open !== undefined && (
                      <Badge className={chef.is_currently_open ? "bg-green-100 text-green-800 border-green-300" : "bg-red-100 text-red-800 border-red-300"} variant="outline">
                        {chef.is_currently_open ? '🟢 Open Now' : '🔴 Closed'}
                      </Badge>
                    )}
                  </div>
                  {chef.availability_message && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {chef.availability_message}
                    </p>
                  )}
                  {!chef.is_currently_open && (
                    <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <p className="text-sm text-orange-800 dark:text-orange-300">
                        ⚠️ This chef is currently not accepting orders. You can still browse the menu and place orders for later.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chef Bio */}
          {chef.bio && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="h-6 w-6 text-orange-500" />
                  About Chef {chef.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {chef.bio}
                </p>
                {chef.certifications && chef.certifications.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Certifications</h3>
                    <div className="flex flex-wrap gap-2">
                      {chef.certifications.map((cert, index) => (
                        <Badge key={index} variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-700">
                          <Award className="h-3 w-3 mr-1" />
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Menu Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UtensilsCrossed className="h-6 w-6 text-orange-500" />
                Chef's Menu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="regular" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="regular" className="flex items-center gap-2">
                    <UtensilsCrossed className="h-4 w-4" />
                    Regular Menu ({regularMenuItems.length})
                  </TabsTrigger>
                  <TabsTrigger value="bulk" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Bulk Menus ({bulkMenus.length})
                  </TabsTrigger>
                </TabsList>
                
                {/* Regular Menu Tab */}
                <TabsContent value="regular">
                  {loadingMenus ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                          <Skeleton className="h-48 w-full" />
                          <CardContent className="p-4">
                            <Skeleton className="h-4 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/2" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : regularMenuItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {regularMenuItems.map((food) => (
                        <Card 
                          key={food.food_id} 
                          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                          onClick={() => handleFoodClick(food)}
                        >
                          <div className="relative aspect-square overflow-hidden">
                            <img
                              src={food.image_url || food.primary_image || '/placeholder-food.jpg'}
                              alt={food.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder-food.jpg';
                              }}
                            />
                            {food.is_available === false && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Badge variant="destructive">Out of Stock</Badge>
                              </div>
                            )}
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-lg mb-2 line-clamp-1">{food.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                              {food.description || 'Delicious food item'}
                            </p>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-500">From</p>
                                <p className="text-xl font-bold text-orange-600">
                                  LKR {Math.min(...food.prices.map(p => Number(p.price)))}
                                </p>
                              </div>
                              <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                                <ShoppingCart className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <UtensilsCrossed className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">No regular menu items available yet</p>
                    </div>
                  )}
                </TabsContent>
                
                {/* Bulk Menu Tab */}
                <TabsContent value="bulk">
                  {loadingMenus ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[...Array(3)].map((_, i) => (
                        <Card key={i}>
                          <Skeleton className="h-48 w-full" />
                          <CardContent className="p-4">
                            <Skeleton className="h-4 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/2" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : bulkMenus.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {bulkMenus.map((menu) => (
                        <Card 
                          key={menu.id}
                          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                          onClick={() => handleBulkMenuClick(menu)}
                        >
                          <div className="relative aspect-video overflow-hidden">
                            <img
                              src={menu.image_url || menu.thumbnail_url || '/placeholder-food.jpg'}
                              alt={menu.menu_name}
                              className="w-full h-full object-cover"
                            />
                            <Badge className="absolute top-2 right-2 bg-blue-500">
                              {menu.meal_type}
                            </Badge>
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-lg mb-2">{menu.menu_name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                              {menu.description}
                            </p>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  {menu.min_persons} - {menu.max_persons} persons
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {menu.advance_notice_hours}h notice
                                </span>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t">
                                <div>
                                  <p className="text-sm text-gray-500">Per person</p>
                                  <p className="text-xl font-bold text-orange-600">
                                    LKR {menu.base_price_per_person}
                                  </p>
                                </div>
                                <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                                  View Menu
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">No bulk menus available yet</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Food Detail Dialog */}
      <Dialog open={showFoodDetail} onOpenChange={setShowFoodDetail}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedFood && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedFood.name}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Food Image */}
                <div className="aspect-video w-full overflow-hidden rounded-lg">
                  <img
                    src={selectedFood.image_url || selectedFood.primary_image || '/placeholder-food.jpg'}
                    alt={selectedFood.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Description */}
                {selectedFood.description && (
                  <p className="text-gray-700 dark:text-gray-300">{selectedFood.description}</p>
                )}

                {/* Price Options */}
                <div>
                  <h3 className="font-semibold mb-3">Select Size:</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedFood.prices
                      .filter(price => {
                        const priceCookId = typeof price.cook === 'number' ? price.cook : (price.cook as any)?.id;
                        return priceCookId === chef?.user_id;
                      })
                      .map((price) => (
                        <div
                          key={price.price_id}
                          onClick={() => setSelectedPriceId(price.price_id)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedPriceId === price.price_id
                              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{price.size}</p>
                              {price.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">{price.description}</p>
                              )}
                            </div>
                            <p className="text-xl font-bold text-orange-600">LKR {Number(price.price).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Quantity Selector */}
                <div>
                  <h3 className="font-semibold mb-3">Quantity:</h3>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-2xl font-semibold w-12 text-center">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowFoodDetail(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddToCart}
                  disabled={!selectedPriceId}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChefProfilePage;
