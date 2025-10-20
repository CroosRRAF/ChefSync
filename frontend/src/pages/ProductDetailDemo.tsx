import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, ChefHat, Star, Clock } from 'lucide-react';

const ProductDetailDemo: React.FC = () => {
  // Sample food data for demonstration
  const sampleFoods = [
    {
      id: 1,
      name: "Chicken Biryani",
      description: "Aromatic basmati rice cooked with tender chicken pieces, fragrant spices, and herbs.",
      image: "/api/placeholder/300/200",
      chef_name: "Chef Sarah",
      rating: 4.8,
      reviews: 156,
      price: 850,
      cuisine: "Indian",
      category: "Main Course",
      prep_time: 25,
      is_vegetarian: false,
      is_vegan: false,
      is_gluten_free: true,
      spice_level: "Medium"
    },
    {
      id: 2,
      name: "Margherita Pizza",
      description: "Classic Italian pizza with fresh mozzarella, tomato sauce, and basil leaves.",
      image: "/api/placeholder/300/200",
      chef_name: "Chef Marco",
      rating: 4.6,
      reviews: 89,
      price: 1200,
      cuisine: "Italian",
      category: "Main Course",
      prep_time: 20,
      is_vegetarian: true,
      is_vegan: false,
      is_gluten_free: false,
      spice_level: "Mild"
    },
    {
      id: 3,
      name: "Pad Thai",
      description: "Traditional Thai stir-fried noodles with shrimp, tofu, and tamarind sauce.",
      image: "/api/placeholder/300/200",
      chef_name: "Chef Niran",
      rating: 4.7,
      reviews: 203,
      price: 750,
      cuisine: "Thai",
      category: "Main Course",
      prep_time: 15,
      is_vegetarian: false,
      is_vegan: false,
      is_gluten_free: true,
      spice_level: "Hot"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Product Detail Page Demo
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Test the new cart management system with Single Cook Policy
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/menu">
              <Button variant="outline">Back to Menu</Button>
            </Link>
            <Link to="/customer/cart">
              <Button>View Cart</Button>
            </Link>
          </div>
        </div>

        {/* Features Overview */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">New Features Implemented</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <ShoppingCart className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <h3 className="font-semibold">Draggable Cart</h3>
                  <p className="text-sm text-gray-600">Drag the cart button around the screen</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <ChefHat className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold">Single Cook Policy</h3>
                  <p className="text-sm text-gray-600">Only one cook per checkout session</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Star className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold">Cook Organization</h3>
                  <p className="text-sm text-gray-600">Cart items grouped by cook</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="font-semibold">Real-time Updates</h3>
                  <p className="text-sm text-gray-600">Live cart count and totals</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sample Foods */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sampleFoods.map((food) => (
            <Card key={food.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gray-200 relative">
                <img
                  src={food.image}
                  alt={food.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="bg-white/90 text-gray-800">
                    {food.cuisine}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg text-gray-900">{food.name}</h3>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{food.rating}</span>
                    <span className="text-gray-500">({food.reviews})</span>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{food.description}</p>
                
                <div className="flex items-center gap-2 mb-3">
                  <ChefHat className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-gray-600">{food.chef_name}</span>
                  <Clock className="h-4 w-4 text-gray-400 ml-2" />
                  <span className="text-sm text-gray-600">{food.prep_time} min</span>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {food.is_vegetarian && <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Veg</Badge>}
                  {food.is_vegan && <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Vegan</Badge>}
                  {food.is_gluten_free && <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">GF</Badge>}
                  <Badge variant="outline" className="text-xs bg-red-50 text-red-700">{food.spice_level}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-orange-600">LKR {food.price}</span>
                  <Link to={`/product/${food.id}`}>
                    <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>How to Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <p className="font-medium">Click "View Details" on any food item above</p>
                    <p className="text-sm text-gray-600">This will open the Product Detail Page</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <p className="font-medium">Add items to cart from different cooks</p>
                    <p className="text-sm text-gray-600">Try adding items from Chef Sarah, then Chef Marco</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <p className="font-medium">Test the Single Cook Policy</p>
                    <p className="text-sm text-gray-600">You'll see a warning when trying to mix cooks</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  <div>
                    <p className="font-medium">Drag the cart button around</p>
                    <p className="text-sm text-gray-600">The position will be saved for your session</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailDemo;
