import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Trash2, ChefHat, Star } from 'lucide-react';
import { DatabaseCartItem } from '@/context/DatabaseCartContext';

interface ItemComponentProps {
  item: DatabaseCartItem;
  onQuantityChange: (itemId: number, quantity: number) => void;
  onRemove: (itemId: number) => void;
}

const ItemComponent: React.FC<ItemComponentProps> = ({ 
  item, 
  onQuantityChange, 
  onRemove 
}) => {
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= 20) {
      onQuantityChange(item.id, newQuantity);
    }
  };

  const handleRemove = () => {
    onRemove(item.id);
  };

  return (
    <Card className="mb-4 hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-orange-300 bg-white">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Enhanced Item Image */}
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 shadow-md relative">
            <img
              src={item.image_url}
              alt={item.menu_item_name}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-food.jpg';
              }}
            />
            {/* Size Badge on Image */}
            <div className="absolute top-2 right-2">
              <Badge className="bg-orange-500 text-white text-xs font-semibold shadow-lg">
                {item.size}
              </Badge>
            </div>
          </div>

          {/* Enhanced Item Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 text-lg leading-tight mb-1">
                  {item.menu_item_name}
                </h4>
                
                {/* Chef Info with Icon */}
                <div className="flex items-center gap-2 mb-2">
                  <ChefHat className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium text-gray-700">{item.chef_name}</span>
                  <div className="flex items-center gap-1 ml-2">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    <span className="text-xs text-gray-500">4.5</span>
                  </div>
                </div>
                
                {/* Price Info */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-orange-600">
                    LKR {item.unit_price.toFixed(2)} each
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">
                    {item.quantity} × LKR {item.unit_price.toFixed(2)}
                  </span>
                </div>
              </div>
              
              {/* Subtotal */}
              <div className="text-right ml-4">
                <p className="text-xl font-bold text-gray-900">
                  LKR {item.subtotal.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Subtotal
                </p>
              </div>
            </div>

            {/* Enhanced Quantity Controls */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Quantity:</span>
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1 border border-gray-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuantityChange(item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 transition-colors duration-200 rounded-lg"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  
                  <div className="w-12 text-center">
                    <span className="text-lg font-bold text-gray-900">{item.quantity}</span>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuantityChange(item.quantity + 1)}
                    disabled={item.quantity >= 20}
                    className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600 transition-colors duration-200 rounded-lg"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Remove Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="h-10 px-4 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors duration-200 rounded-xl border border-red-200 hover:border-red-300"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ItemComponent;
