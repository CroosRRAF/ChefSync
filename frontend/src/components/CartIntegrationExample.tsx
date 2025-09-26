import React, { useState } from 'react';
import { Plus, ShoppingCart } from 'lucide-react';
import CartCheckoutIntegration from './CartCheckoutIntegration';
import { useCartService } from '../services/cartService';

// Example food item interface
interface FoodItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  chef_id: number;
  price_id: number; // This would be the FoodPrice ID
}

// Mock food data
const mockFoodItems: FoodItem[] = [
  {
    id: 1,
    name: 'Chicken Biryani',
    description: 'Fragrant basmati rice with tender chicken and aromatic spices',
    price: 850,
    image: '/images/biryani.jpg',
    chef_id: 1,
    price_id: 101
  },
  {
    id: 2,
    name: 'Margherita Pizza',
    description: 'Classic pizza with tomato sauce, mozzarella, and fresh basil',
    price: 1200,
    image: '/images/pizza.jpg',
    chef_id: 1,
    price_id: 102
  },
  {
    id: 3,
    name: 'Chocolate Cake',
    description: 'Rich chocolate cake with creamy frosting',
    price: 450,
    image: '/images/cake.jpg',
    chef_id: 1,
    price_id: 103
  }
];

const CartIntegrationExample: React.FC = () => {
  const [chefId] = useState(1); // In a real app, this would come from context or props
  const { addToCart } = useCartService();

  const handleAddToCart = async (foodItem: FoodItem) => {
    try {
      await addToCart(foodItem.price_id, 1, '');
      // Show success message or update UI
      console.log('Added to cart:', foodItem.name);
    } catch (error) {
      console.error('Error adding to cart:', error);
      // Show error message
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Cart Integration */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">ChefSync Menu</h1>
            </div>
            
            {/* Cart and Notification Integration */}
            <div className="flex items-center gap-4">
              <CartCheckoutIntegration chefId={chefId} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Today's Special Menu</h2>
          <p className="text-gray-600">Fresh and delicious food prepared by our talented chefs</p>
        </div>

        {/* Food Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockFoodItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Food Image */}
              <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    // Fallback for missing images
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                  }}
                />
              </div>

              {/* Food Details */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-primary">
                    LKR {item.price.toFixed(2)}
                  </span>
                  
                  <button
                    onClick={() => handleAddToCart(item)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Use the Cart System</h3>
          <div className="space-y-2 text-blue-800">
            <p>1. <strong>Add Items:</strong> Click "Add to Cart" on any food item</p>
            <p>2. <strong>View Cart:</strong> Click the cart button in the header to see your items</p>
            <p>3. <strong>Checkout:</strong> Click "Proceed to Checkout" to start the order process</p>
            <p>4. <strong>Select Address:</strong> Choose a saved address or use your current location</p>
            <p>5. <strong>Review Order:</strong> Check delivery fees, tax, and total amount</p>
            <p>6. <strong>Place Order:</strong> Complete your order and track its progress</p>
          </div>
        </div>

        {/* Features Overview */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <ShoppingCart className="w-8 h-8 text-primary mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Smart Cart</h4>
            <p className="text-gray-600 text-sm">
              Add multiple items, adjust quantities, and manage your order with ease.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <MapPin className="w-8 h-8 text-primary mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Location-Based Delivery</h4>
            <p className="text-gray-600 text-sm">
              Automatic delivery fee calculation based on distance from kitchen to your location.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mb-4">
              <span className="text-white text-sm font-bold">5</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Order Tracking</h4>
            <p className="text-gray-600 text-sm">
              Real-time order progress with 5-stage tracking from placement to delivery.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CartIntegrationExample;
