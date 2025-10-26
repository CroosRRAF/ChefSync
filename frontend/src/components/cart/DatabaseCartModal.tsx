import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  DatabaseCartItem,
  useDatabaseCart,
} from "@/context/DatabaseCartContext";
import {
  AlertTriangle,
  ArrowRight,
  ChefHat,
  CreditCard,
  MapPin,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Star,
  Trash2,
} from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChefSectionProps {
  chefId: number;
  chefName: string;
  items: DatabaseCartItem[];
  subtotal: number;
  onQuantityChange: (itemId: number, quantity: number) => void;
  onRemoveItem: (itemId: number) => void;
  isMultiChef?: boolean;
  onCheckout: () => void;
}

const ChefSection: React.FC<ChefSectionProps> = ({
  chefId,
  chefName,
  items,
  subtotal,
  onQuantityChange,
  onRemoveItem,
  isMultiChef = false,
  onCheckout,
}) => {
  const navigate = useNavigate();

  if (isMultiChef) {
    return (
      <Card className="border-2 border-orange-200 dark:border-orange-800 shadow-xl bg-white dark:bg-gray-800 transition-all duration-300 hover:shadow-2xl hover:scale-[1.03] rounded-2xl overflow-hidden group">
        <CardContent className="p-5">
          {/* Chef Header */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b-2 border-orange-100 dark:border-orange-900">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <ChefHat className="h-7 w-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-1">
                {chefName}
              </h3>
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <Badge className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 font-bold border border-orange-300 dark:border-orange-700">
                  <Package className="h-3 w-3 mr-1" />
                  {items.length} item{items.length !== 1 ? "s" : ""}
                </Badge>
                <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/50 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-700">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-current" />
                  <span className="text-xs text-amber-700 dark:text-amber-400 font-bold">
                    4.8 Rating
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Items Preview */}
          <div className="space-y-2 mb-4 pr-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="relative overflow-hidden rounded-xl cursor-pointer group/item shadow-md hover:shadow-lg transition-all duration-300 border-2 border-orange-100 dark:border-orange-900 hover:border-orange-300 dark:hover:border-orange-700"
                onClick={onCheckout}
                title="Click to checkout with this chef"
              >
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={item.image_url}
                    alt={item.menu_item_name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-900/92 via-red-900/88 to-orange-900/92 dark:from-orange-950/96 dark:via-red-950/92 dark:to-orange-950/96 group-hover/item:from-orange-800/92 group-hover/item:via-red-800/88 group-hover/item:to-orange-800/92 transition-all duration-300"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 flex items-center justify-between gap-3 p-3 min-h-[88px]">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm mb-1.5 line-clamp-1">
                      {item.menu_item_name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-white/90 flex-wrap">
                      <span className="font-semibold bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                        Qty: {item.quantity}
                      </span>
                      <span className="text-white/70">•</span>
                      <span className="font-bold text-amber-300 bg-amber-900/30 px-2 py-0.5 rounded-full backdrop-blur-sm">
                        LKR {Number(item.unit_price).toFixed(2)}
                      </span>
                      <span className="text-white/70">•</span>
                      <span className="font-bold text-green-300 bg-green-900/30 px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {item.size}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-white/80 group-hover/item:translate-x-1 transition-transform duration-300 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4 dark:bg-gray-700" />

          {/* Subtotal Section */}
          <div className="flex items-center justify-between mb-4 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 dark:from-gray-900 dark:via-orange-950 dark:to-gray-900 rounded-xl p-4 border-2 border-orange-200 dark:border-orange-800 shadow-md">
            <div>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-semibold block mb-0.5">
                Subtotal ({items.length} item{items.length !== 1 ? "s" : ""})
              </span>
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                Order Total
              </span>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent block">
                LKR {subtotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Checkout Button */}
          <Button
            onClick={onCheckout}
            className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 hover:from-orange-600 hover:via-orange-700 hover:to-red-700 text-white font-bold py-6 rounded-xl shadow-lg hover:shadow-xl hover:shadow-orange-500/50 transition-all duration-300 group-hover:scale-105"
          >
            <CreditCard className="h-5 w-5 mr-2" />
            <span>Checkout with {chefName}</span>
            <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>

          {/* Quick Info */}
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium">Fast Delivery</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="font-medium">Secure Payment</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4 border-2 border-orange-300 dark:border-orange-800 shadow-xl bg-white dark:bg-gray-800 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300">
      <CardContent className="p-0 overflow-hidden">
        {/* Enhanced Chef Header with Gradient Background */}
        <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 p-6 relative overflow-hidden">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16 animate-pulse"></div>
            <div
              className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12 animate-pulse"
              style={{ animationDelay: "0.5s" }}
            ></div>
            <div
              className="absolute top-1/2 right-1/4 w-16 h-16 bg-white rounded-full animate-pulse"
              style={{ animationDelay: "0.25s" }}
            ></div>
          </div>

          <div className="relative flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-xl transform hover:scale-110 transition-transform duration-300">
                <ChefHat className="h-10 w-10 text-orange-600" />
              </div>
              {/* Online Status Indicator */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-gray-800 shadow-lg">
                <div className="w-full h-full bg-green-400 rounded-full animate-ping"></div>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-white text-2xl drop-shadow-lg">
                  {chefName}
                </h3>
                <div className="flex items-center gap-1 bg-white/25 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-white/30">
                  <Star className="h-4 w-4 text-yellow-300 fill-current drop-shadow" />
                  <span className="text-sm font-bold text-white drop-shadow">
                    4.8
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3 text-white/95">
                <MapPin className="h-4 w-4 drop-shadow" />
                <span className="text-sm font-medium drop-shadow">
                  {items[0]?.kitchen_address || "Kitchen Address"}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-white/95 text-orange-600 font-bold px-3 py-1.5 shadow-lg border-2 border-white/50 hover:bg-white transition-colors">
                  <Package className="h-3.5 w-3.5 mr-1.5" />
                  {items.length} item{items.length !== 1 ? "s" : ""}
                </Badge>
                <Badge className="bg-emerald-500/90 text-white font-bold px-3 py-1.5 shadow-lg border-2 border-white/30">
                  <div className="w-2 h-2 bg-white rounded-full mr-1.5 animate-pulse"></div>
                  Available Now
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Items Section */}
        <div className="p-6 space-y-4 bg-gradient-to-b from-orange-50/50 to-white dark:from-gray-900/50 dark:to-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-8 bg-gradient-to-b from-orange-500 to-red-600 rounded-full shadow-md"></div>
            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-lg">
              Your Items
            </h4>
            <div className="flex-1 h-1 bg-gradient-to-r from-orange-300 via-orange-200 dark:from-orange-700 dark:via-orange-800 to-transparent rounded-full"></div>
          </div>

          {items.map((item, index) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-lg border-2 border-orange-100 dark:border-orange-900 hover:shadow-xl hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-300 transform hover:-translate-y-1"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CartItemComponent
                item={item}
                onQuantityChange={onQuantityChange}
                onRemove={onRemoveItem}
              />
            </div>
          ))}
        </div>

        {/* Enhanced Chef Subtotal */}
        <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-red-50 dark:from-gray-900 dark:via-orange-950 dark:to-red-950 p-6 border-t-4 border-orange-300 dark:border-orange-800 shadow-inner">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-bold text-gray-900 dark:text-gray-100 text-xl mb-1 block">
                Subtotal
              </span>
              <p className="text-xs text-gray-700 dark:text-gray-400 flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1.5 bg-orange-100 dark:bg-orange-900/50 px-2.5 py-1 rounded-full border border-orange-300 dark:border-orange-700">
                  <Package className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                  <span className="font-semibold text-orange-700 dark:text-orange-300">
                    {items.length} item{items.length !== 1 ? "s" : ""}
                  </span>
                </span>
                <span className="text-gray-400 dark:text-gray-600">•</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <span className="text-lg">🚚</span>
                  Free delivery
                </span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-orange-600 to-red-600 block drop-shadow-sm">
                LKR {subtotal.toFixed(2)}
              </span>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 font-semibold flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                <span>+ delivery fee at checkout</span>
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface CartItemComponentProps {
  item: DatabaseCartItem;
  onQuantityChange: (itemId: number, quantity: number) => void;
  onRemove: (itemId: number) => void;
}

const CartItemComponent: React.FC<CartItemComponentProps> = ({
  item,
  onQuantityChange,
  onRemove,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleQuantityChange = async (newQuantity: number) => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      await onQuantityChange(item.id, newQuantity);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      await onRemove(item.id);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={item.image_url}
          alt={item.menu_item_name}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/placeholder-food.jpg";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/96 via-white/94 to-white/90 dark:from-gray-900/96 dark:via-gray-900/94 dark:to-gray-900/90 backdrop-blur-sm"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-4">
        {/* Item Image Thumbnail */}
        <div className="flex items-start gap-4">
          <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 shadow-lg border-2 border-orange-200 dark:border-orange-800">
            <img
              src={item.image_url}
              alt={item.menu_item_name}
              className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder-food.jpg";
              }}
            />
            <div className="absolute top-1 right-1">
              <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white text-[10px] font-bold shadow-md px-1.5 py-0.5">
                {item.size}
              </Badge>
            </div>
          </div>

          {/* Item Details */}
          <div className="flex-1 min-w-0">
            <div className="mb-3">
              {/* Item Name */}
              <h4 className="font-bold text-gray-900 dark:text-gray-100 text-lg leading-tight mb-2 hover:text-orange-600 dark:hover:text-orange-400 transition-colors duration-200 cursor-pointer line-clamp-2">
                {item.menu_item_name}
              </h4>

              {/* Chef Info */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-orange-100 dark:bg-orange-900/50 px-2.5 py-1 rounded-full border border-orange-200 dark:border-orange-800">
                  <ChefHat className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                  <span className="text-xs font-semibold text-orange-700 dark:text-orange-300">
                    {item.chef_name}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/50 px-2 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                  <Star className="h-3 w-3 text-amber-500 fill-current" />
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                    4.5
                  </span>
                </div>
              </div>

              {/* Price Calculation */}
              <div className="flex items-center gap-2 bg-gradient-to-r from-orange-50 via-orange-50 to-amber-50 dark:from-orange-950/50 dark:via-orange-950/50 dark:to-amber-950/50 p-2.5 rounded-xl border border-orange-200 dark:border-orange-800 shadow-sm">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    LKR {Number(item.unit_price).toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-bold">
                    ×
                  </span>
                  <span className="text-sm font-bold text-orange-600 dark:text-orange-400 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-lg shadow-sm">
                    {item.quantity}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-bold">
                    =
                  </span>
                  <span className="text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    LKR {Number(item.subtotal).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            {item.special_instructions && (
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-blue-950/50 border-l-4 border-indigo-500 dark:border-indigo-600 rounded-lg p-2.5 mb-3 shadow-sm">
                <p className="text-xs text-indigo-900 dark:text-indigo-300 font-medium leading-relaxed">
                  <span className="font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1 mb-1">
                    <span>📝</span>
                    <span>Special Note:</span>
                  </span>
                  {item.special_instructions}
                </p>
              </div>
            )}

            {/* Quantity Controls & Remove Button */}
            <div className="flex items-center justify-between gap-3 mt-3">
              {/* Quantity Controls */}
              <div className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50 rounded-xl p-1.5 border-2 border-orange-200 dark:border-orange-800 shadow-md">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuantityChange(item.quantity - 1)}
                  disabled={item.quantity <= 1 || isUpdating}
                  className="h-9 w-9 p-0 bg-white dark:bg-gray-800 hover:bg-red-500 hover:text-white text-red-500 dark:text-red-400 transition-all duration-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed border-2 border-red-300 dark:border-red-800 hover:border-red-500 shadow-sm hover:shadow-md hover:scale-105"
                >
                  <Minus className="h-4 w-4 font-bold" />
                </Button>

                <div className="min-w-[48px] text-center bg-white dark:bg-gray-800 rounded-lg px-3 py-2 shadow-md border-2 border-orange-300 dark:border-orange-700">
                  <span className="text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    {item.quantity}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuantityChange(item.quantity + 1)}
                  disabled={item.quantity >= 20 || isUpdating}
                  className="h-9 w-9 p-0 bg-white dark:bg-gray-800 hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400 transition-all duration-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed border-2 border-emerald-300 dark:border-emerald-800 hover:border-emerald-500 shadow-sm hover:shadow-md hover:scale-105"
                >
                  <Plus className="h-4 w-4 font-bold" />
                </Button>
              </div>

              {/* Remove Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={isUpdating}
                className="h-10 px-4 text-red-600 dark:text-red-400 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 transition-all duration-300 rounded-xl border-2 border-red-300 dark:border-red-800 hover:border-red-600 font-bold shadow-md hover:shadow-lg hover:scale-105"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DatabaseCartModal: React.FC<CartModalProps> = ({ isOpen, onClose }) => {
  const {
    items,
    summary,
    loading,
    error,
    updateQuantity,
    removeItem,
    clearCart,
    getItemsByChef,
    getTotalByChef,
    getGrandTotal,
    getItemCount,
  } = useDatabaseCart();

  const navigate = useNavigate();
  const chefItems = getItemsByChef();
  const itemCount = getItemCount();
  const grandTotal = getGrandTotal();

  const handleQuantityChange = async (itemId: number, quantity: number) => {
    await updateQuantity(itemId, quantity);
  };

  const handleRemoveItem = async (itemId: number) => {
    await removeItem(itemId);
  };

  const handleCheckout = (chefId: number) => {
    onClose();
    navigate("/checkout");
  };

  const handleContinueShopping = () => {
    onClose();
    navigate("/menu");
  };

  const handleClearCart = async () => {
    if (window.confirm("Are you sure you want to clear your cart?")) {
      await clearCart();
    }
  };

  const canCheckout = itemCount > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col rounded-2xl border-2 border-orange-300 dark:border-orange-800 shadow-xl bg-gradient-to-br from-orange-50/50 to-red-50/50 dark:from-gray-900 dark:to-gray-800">
        {/* Enhanced Header */}
        <DialogHeader className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 p-5 rounded-t-xl relative overflow-hidden flex-shrink-0">
          {/* Decorative background circles */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full -mr-12 -mt-12 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white rounded-full -ml-8 -mb-8 animate-pulse delay-75"></div>
          </div>
          <div className="flex items-center justify-between relative">
            <DialogTitle className="flex items-center gap-4 text-white">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <ShoppingCart className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold drop-shadow-lg">
                  Your Cart
                </div>
                <div className="text-sm text-white/90 font-medium mt-1 flex items-center gap-2">
                  <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                    {itemCount} item{itemCount !== 1 ? "s" : ""}
                  </span>
                  <span>•</span>
                  <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                    Total: LKR {grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-5 bg-dots-pattern custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 dark:border-orange-800"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-orange-600 absolute top-0"></div>
              </div>
              <span className="ml-2 text-gray-700 dark:text-gray-300 font-semibold mt-4 animate-pulse">
                Loading your cart...
              </span>
            </div>
          ) : itemCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="relative mb-8">
                <div className="w-40 h-40 bg-gradient-to-br from-orange-100 via-orange-200 to-red-200 dark:from-orange-900 dark:via-orange-800 dark:to-red-800 rounded-full flex items-center justify-center shadow-2xl animate-bounce-slow">
                  <ShoppingCart className="h-20 w-20 text-orange-500 dark:text-orange-400" />
                </div>
                {/* Floating decoration circles */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-full opacity-70 animate-ping"></div>
                <div
                  className="absolute -bottom-3 -left-3 w-10 h-10 bg-red-400 rounded-full opacity-50 animate-pulse"
                  style={{ animationDelay: "0.5s" }}
                ></div>
              </div>

              <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3 animate-fade-in">
                Your cart is empty
              </h3>
              <p
                className="text-gray-600 dark:text-gray-400 mb-4 text-lg max-w-md animate-fade-in"
                style={{ animationDelay: "0.2s" }}
              >
                Looks like you haven't added any delicious food yet! 🍽️
              </p>
              <p
                className="text-sm text-gray-500 dark:text-gray-500 mb-8 max-w-sm animate-fade-in"
                style={{ animationDelay: "0.3s" }}
              >
                Browse our menu to discover amazing dishes from talented home
                chefs
              </p>

              <Button
                onClick={handleContinueShopping}
                className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 hover:from-orange-600 hover:via-orange-700 hover:to-red-700 text-white font-bold px-10 py-6 rounded-xl shadow-xl hover:shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105 animate-fade-in"
                style={{ animationDelay: "0.4s" }}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                <span className="text-lg">Browse Menu</span>
              </Button>

              {/* Feature highlights */}
              <div
                className="mt-12 grid grid-cols-3 gap-6 max-w-2xl animate-fade-in"
                style={{ animationDelay: "0.6s" }}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/50 rounded-full flex items-center justify-center">
                    <ChefHat className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Home Cooked
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                    <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Fast Delivery
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                    <Star className="h-6 w-6 text-blue-600 dark:text-blue-400 fill-current" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Top Rated
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {chefItems.size > 1 ? (
                <>
                  {/* Multiple Chefs Warning */}
                  <div className="p-5 bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 dark:from-amber-900/30 dark:via-orange-900/30 dark:to-red-900/30 border-2 border-amber-300 dark:border-amber-700 rounded-2xl shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md animate-pulse">
                        <AlertTriangle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-orange-900 dark:text-orange-200 text-lg mb-1">
                          Multiple Chefs Detected
                        </h4>
                        <p className="text-sm text-orange-800 dark:text-orange-300 font-medium">
                          You have items from{" "}
                          <span className="font-bold text-orange-900 dark:text-orange-100 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-lg">
                            {chefItems.size} different chefs
                          </span>
                          . Please checkout with each chef separately.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Multiple Chef Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from(chefItems.entries()).map(
                      ([chefId, chefItemsList]) => (
                        <ChefSection
                          key={chefId}
                          chefId={chefId}
                          chefName={
                            chefItemsList[0]?.chef_name || "Unknown Chef"
                          }
                          items={chefItemsList}
                          subtotal={getTotalByChef(chefId)}
                          onQuantityChange={handleQuantityChange}
                          onRemoveItem={handleRemoveItem}
                          isMultiChef={true}
                          onCheckout={() => handleCheckout(chefId)}
                        />
                      )
                    )}
                  </div>
                </>
              ) : (
                Array.from(chefItems.entries()).map(
                  ([chefId, chefItemsList]) => (
                    <ChefSection
                      key={chefId}
                      chefId={chefId}
                      chefName={chefItemsList[0]?.chef_name || "Unknown Chef"}
                      items={chefItemsList}
                      subtotal={getTotalByChef(chefId)}
                      onQuantityChange={handleQuantityChange}
                      onRemoveItem={handleRemoveItem}
                      onCheckout={() => handleCheckout(chefId)}
                    />
                  )
                )
              )}
            </div>
          )}
        </div>

        {/* Compact Footer - Fixed at Bottom */}
        {itemCount > 0 && (
          <div className="flex-shrink-0 border-t-2 border-orange-300 dark:border-orange-800 bg-gradient-to-r from-white via-orange-50/50 to-white dark:from-gray-900 dark:via-orange-950/30 dark:to-gray-900 p-4 rounded-b-xl shadow-top">
            <div className="flex flex-col gap-3">
              {/* Action Buttons Row */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={handleContinueShopping}
                  className="flex-1 min-w-[140px] border border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-950 hover:border-orange-400 dark:hover:border-orange-600 font-semibold px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all duration-200"
                >
                  <ArrowRight className="h-4 w-4 mr-1.5 rotate-180" />
                  Continue Shopping
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleClearCart}
                  className="flex-1 min-w-[120px] bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 hover:text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all duration-200"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Clear Cart
                </Button>
              </div>

              {/* Total & Checkout Section */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                {/* Grand Total Card */}
                <div className="flex-1 min-w-[180px] bg-gradient-to-br from-white to-orange-50 dark:from-gray-800 dark:to-orange-950/50 rounded-xl px-4 py-2.5 shadow-lg border border-orange-300 dark:border-orange-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-600 dark:text-gray-400 font-semibold block uppercase tracking-wide">
                        Total
                      </span>
                      <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">
                        LKR {grandTotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-600 dark:text-gray-400">
                    <span className="font-medium">
                      {itemCount} item{itemCount !== 1 ? "s" : ""}
                    </span>
                    <span>•</span>
                    <span>+ delivery fee</span>
                  </div>
                </div>

                {/* Checkout Button */}
                {chefItems.size === 1 && (
                  <Button
                    onClick={() =>
                      handleCheckout(Array.from(chefItems.keys())[0])
                    }
                    disabled={loading}
                    className="flex-1 min-w-[200px] bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                )}
              </div>

              {/* Compact Trust Badges */}
              {chefItems.size === 1 && (
                <div className="flex items-center justify-center gap-4 pt-2 border-t border-orange-200 dark:border-orange-900">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-600 dark:text-gray-400">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Secure</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-600 dark:text-gray-400">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span className="font-medium">Fast</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-600 dark:text-gray-400">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    <span className="font-medium">Quality</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: linear-gradient(180deg, #fff7ed, #fed7aa);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #f97316, #ea580c);
          border-radius: 10px;
          border: 2px solid #fff7ed;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #ea580c, #c2410c);
        }

        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: linear-gradient(180deg, #1f2937, #111827);
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #c2410c, #9a3412);
          border-radius: 10px;
          border: 2px solid #1f2937;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #ea580c, #c2410c);
        }

        .bg-dots-pattern {
          background-image: radial-gradient(circle, #fed7aa 1px, transparent 1px);
          background-size: 20px 20px;
        }
        .dark .bg-dots-pattern {
          background-image: radial-gradient(circle, #7c2d12 1px, transparent 1px);
          background-size: 20px 20px;
        }

        .shadow-top {
          box-shadow: 0 -6px 15px -8px rgba(249, 115, 22, 0.2);
        }
        .dark .shadow-top {
          box-shadow: 0 -6px 15px -8px rgba(194, 65, 12, 0.3);
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }

        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </Dialog>
  );
};

export default DatabaseCartModal;
