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
  X,
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
      <Card className="border border-violet-200 dark:border-violet-800 shadow-lg bg-white dark:bg-gray-800 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] rounded-2xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <ChefHat className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base mb-1">
                {chefName}
              </h3>
              <div className="flex items-center gap-2 text-sm">
                <Badge
                  variant="secondary"
                  className="bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 font-semibold border border-violet-200 dark:border-violet-700"
                >
                  {items.length} item{items.length !== 1 ? "s" : ""}
                </Badge>
                <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                  <Star className="h-3 w-3 text-amber-500 fill-current" />
                  <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
                    4.8
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto custom-scrollbar">
            {items.map((item) => (
              <div
                key={item.id}
                className="relative overflow-hidden rounded-xl cursor-pointer group shadow-sm hover:shadow-md transition-all duration-300 min-h-[80px]"
                onClick={onCheckout}
                title="Click to checkout with this chef"
              >
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={item.image_url}
                    alt={item.menu_item_name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-900/90 via-purple-900/85 to-indigo-900/90 dark:from-violet-950/95 dark:via-purple-950/90 dark:to-indigo-950/95 group-hover:from-violet-800/90 group-hover:via-purple-800/85 group-hover:to-indigo-800/90 transition-all duration-300"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 flex items-center gap-3 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm truncate">
                      {item.menu_item_name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-white/80 mt-1">
                      <span className="font-medium">Qty: {item.quantity}</span>
                      <span>•</span>
                      <span className="font-bold text-amber-300">
                        LKR {Number(item.unit_price).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-3 dark:bg-gray-700" />

          <div className="flex items-center justify-between mb-4 bg-violet-50 dark:bg-gray-900 rounded-xl p-3 border border-violet-200 dark:border-violet-800">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Subtotal
            </span>
            <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              LKR {subtotal.toFixed(2)}
            </span>
          </div>

          <Button
            onClick={onCheckout}
            className="w-full bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-600 hover:from-violet-600 hover:via-purple-700 hover:to-indigo-700 text-white font-bold py-5 rounded-xl shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
          >
            <CreditCard className="h-5 w-5 mr-2" />
            Checkout with {chefName}
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4 border border-violet-300 dark:border-violet-800 shadow-lg bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
      <CardContent className="p-0 overflow-hidden">
        {/* Enhanced Chef Header with Gradient Background */}
        <div className="bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 p-5 relative overflow-hidden">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12 animate-pulse delay-75"></div>
          </div>

          <div className="relative flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <ChefHat className="h-8 w-8 text-violet-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-white text-xl">{chefName}</h3>
                <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                  <Star className="h-3 w-3 text-yellow-300 fill-current" />
                  <span className="text-xs font-bold text-white">4.8</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-2 text-white/90">
                <MapPin className="h-3 w-3" />
                <span className="text-xs font-medium">
                  {items[0]?.kitchen_address || "Kitchen Address"}
                </span>
              </div>

              <Badge className="bg-white text-violet-600 font-semibold px-3 py-1 shadow-lg border border-white/50">
                <Package className="h-3 w-3 mr-1" />
                {items.length} item{items.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>
        </div>

        {/* Enhanced Items Section */}
        <div className="p-5 space-y-3 bg-gradient-to-b from-violet-50/50 to-white dark:from-gray-900/50 dark:to-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-6 bg-gradient-to-b from-violet-500 to-indigo-600 rounded-full"></div>
            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-base">
              Your Items
            </h4>
            <div className="flex-1 h-0.5 bg-gradient-to-r from-violet-300 dark:from-violet-700 to-transparent"></div>
          </div>

          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-md border border-violet-100 dark:border-violet-900 hover:shadow-lg hover:border-violet-300 dark:hover:border-violet-700 transition-all duration-300"
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
        <div className="bg-gradient-to-r from-violet-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-950 dark:to-indigo-950 p-5 border-t-2 border-violet-200 dark:border-violet-800">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                Subtotal
              </span>
              <p className="text-xs text-gray-700 dark:text-gray-400 mt-1 flex items-center gap-2">
                <Package className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                <span className="font-medium">
                  {items.length} item{items.length !== 1 ? "s" : ""}
                </span>
                <span className="text-gray-400 dark:text-gray-600">•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  Free delivery
                </span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600">
                LKR {subtotal.toFixed(2)}
              </span>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">
                + delivery fee
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
    <div className="relative overflow-hidden rounded-2xl min-h-[180px]">
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
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/90 to-white/85 dark:from-gray-900/95 dark:via-gray-900/90 dark:to-gray-900/85 backdrop-blur-sm"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-start gap-4 p-4">
        {/* Item Details */}
        <div className="flex-1 min-w-0">
          <div className="mb-3">
            {/* Item Name & Size Badge */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-bold text-gray-900 dark:text-gray-100 text-base leading-tight hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-200 cursor-pointer">
                {item.menu_item_name}
              </h4>
              <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-semibold shadow-md shrink-0">
                {item.size}
              </Badge>
            </div>

            {/* Chef Info */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1.5 bg-violet-100 dark:bg-violet-900/50 px-3 py-1 rounded-full border border-violet-200 dark:border-violet-800">
                <ChefHat className="h-3 w-3 text-violet-600 dark:text-violet-400" />
                <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">
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

            {/* Price Info */}
            <div className="flex items-center gap-2 mb-3 bg-violet-50 dark:bg-violet-950/50 p-2 rounded-xl border border-violet-200 dark:border-violet-800">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                LKR {Number(item.unit_price).toFixed(2)}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-600 font-semibold">
                ×
              </span>
              <span className="text-sm font-bold text-violet-600 dark:text-violet-400 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-lg">
                {item.quantity}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-600 font-semibold">
                =
              </span>
              <span className="text-base font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                LKR {Number(item.subtotal).toFixed(2)}
              </span>
            </div>

            {/* Special Instructions */}
            {item.special_instructions && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-l-4 border-indigo-400 dark:border-indigo-600 rounded-lg p-3 mb-3 shadow-sm">
                <p className="text-xs text-indigo-900 dark:text-indigo-300 font-medium">
                  <span className="font-bold text-indigo-700 dark:text-indigo-400">
                    📝 Special Note:
                  </span>{" "}
                  {item.special_instructions}
                </p>
              </div>
            )}
          </div>

          {/* Quantity Controls & Remove Button */}
          <div className="flex items-center justify-between gap-3">
            {/* Quantity Controls */}
            <div className="flex items-center gap-3 bg-violet-50 dark:bg-violet-950/50 rounded-xl p-2 border border-violet-200 dark:border-violet-800 shadow-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuantityChange(item.quantity - 1)}
                disabled={item.quantity <= 1 || isUpdating}
                className="h-8 w-8 p-0 bg-white dark:bg-gray-800 hover:bg-red-500 hover:text-white text-red-500 dark:text-red-400 transition-all duration-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed border border-red-200 dark:border-red-800 hover:border-red-500 shadow-sm"
              >
                <Minus className="h-4 w-4 font-bold" />
              </Button>

              <div className="w-12 text-center bg-white dark:bg-gray-800 rounded-lg px-3 py-2 shadow-md border border-violet-300 dark:border-violet-700">
                <span className="text-base font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                  {item.quantity}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuantityChange(item.quantity + 1)}
                disabled={item.quantity >= 20 || isUpdating}
                className="h-8 w-8 p-0 bg-white dark:bg-gray-800 hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400 transition-all duration-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-200 dark:border-emerald-800 hover:border-emerald-500 shadow-sm"
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
              className="h-9 px-4 text-red-600 dark:text-red-400 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 transition-all duration-300 rounded-xl border border-red-300 dark:border-red-800 hover:border-red-600 font-semibold shadow-sm hover:shadow-md"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Remove
            </Button>
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl border-2 border-violet-300 dark:border-violet-800 shadow-xl bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-gray-900 dark:to-gray-800">
        {/* Enhanced Header */}
        <DialogHeader className="bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-600 p-5 rounded-t-xl relative overflow-hidden">
          {/* Decorative background circles */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full -mr-12 -mt-12 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white rounded-full -ml-8 -mb-8 animate-pulse delay-75"></div>
          </div>
          <div className="flex items-center justify-between relative">
            <DialogTitle className="flex items-center gap-4 text-white">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <ShoppingCart className="h-6 w-6 text-violet-600" />
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
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-2 right-2 text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-dots-pattern">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-violet-200 dark:border-violet-800"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-violet-600 absolute top-0"></div>
              </div>
              <span className="ml-2 text-gray-700 dark:text-gray-300 font-semibold mt-4 animate-pulse">
                Loading your cart...
              </span>
            </div>
          ) : itemCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-violet-100 via-purple-100 to-indigo-200 dark:from-violet-900 dark:via-purple-900 dark:to-indigo-800 rounded-full flex items-center justify-center mb-6 shadow-lg animate-bounce-slow">
                <ShoppingCart className="h-16 w-16 text-violet-500 dark:text-violet-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Your cart is empty
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-base max-w-md">
                Add some delicious food to get started! 🍽️
              </p>
              <Button
                onClick={handleContinueShopping}
                className="bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-600 hover:from-violet-600 hover:via-purple-700 hover:to-indigo-700 text-white font-bold px-8 py-5 rounded-xl shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Browse Menu
              </Button>
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

        {/* Enhanced Footer */}
        {itemCount > 0 && (
          <div className="border-t-2 border-violet-300 dark:border-violet-800 bg-gradient-to-r from-white to-violet-50/50 dark:from-gray-900 dark:to-gray-800 p-5 rounded-b-xl shadow-top">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={handleContinueShopping}
                  className="flex-1 sm:flex-none border border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950 hover:border-violet-400 dark:hover:border-violet-600 font-semibold px-5 py-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                  Continue Shopping
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleClearCart}
                  className="flex-1 sm:flex-none bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 hover:text-white font-semibold px-5 py-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Cart
                </Button>
              </div>

              {/* Total & Checkout */}
              <div className="w-full sm:w-auto flex flex-col items-end gap-3">
                <div className="text-right bg-white dark:bg-gray-900 rounded-2xl px-6 py-3 shadow-lg border-2 border-violet-300 dark:border-violet-800">
                  <span className="text-xs text-gray-700 dark:text-gray-400 font-semibold block mb-1">
                    Grand Total
                  </span>
                  <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600">
                    LKR {grandTotal.toFixed(2)}
                  </p>
                </div>

                {chefItems.size === 1 && (
                  <Button
                    onClick={() =>
                      handleCheckout(Array.from(chefItems.keys())[0])
                    }
                    disabled={loading}
                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 via-green-600 to-teal-600 hover:from-emerald-600 hover:via-green-700 hover:to-teal-700 text-white font-bold px-8 py-5 rounded-xl shadow-lg hover:shadow-emerald-500/50 transition-all duration-300"
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Proceed to Checkout
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                )}
              </div>
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
          background: linear-gradient(180deg, #f5f3ff, #ede9fe);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #8b5cf6, #6366f1);
          border-radius: 10px;
          border: 2px solid #f5f3ff;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #7c3aed, #4f46e5);
        }

        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: linear-gradient(180deg, #1f2937, #111827);
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #6d28d9, #4c1d95);
          border-radius: 10px;
          border: 2px solid #1f2937;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #7c3aed, #5b21b6);
        }

        .bg-dots-pattern {
          background-image: radial-gradient(circle, #e9d5ff 1px, transparent 1px);
          background-size: 20px 20px;
        }
        .dark .bg-dots-pattern {
          background-image: radial-gradient(circle, #4c1d95 1px, transparent 1px);
          background-size: 20px 20px;
        }

        .shadow-top {
          box-shadow: 0 -6px 15px -8px rgba(139, 92, 246, 0.2);
        }
        .dark .shadow-top {
          box-shadow: 0 -6px 15px -8px rgba(109, 40, 217, 0.3);
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
      `}</style>
    </Dialog>
  );
};

export default DatabaseCartModal;
