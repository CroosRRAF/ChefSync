import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Truck, Store } from 'lucide-react';

type OrderMode = 'delivery' | 'pickup';

interface OrderModeSelectorProps {
  orderMode: OrderMode;
  onOrderModeChange: (mode: OrderMode) => void;
}

export const OrderModeSelector: React.FC<OrderModeSelectorProps> = ({
  orderMode,
  onOrderModeChange,
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Choose your option</h3>
      <RadioGroup
        value={orderMode}
        onValueChange={(value) => onOrderModeChange(value as OrderMode)}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <Label
          htmlFor="delivery"
          className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
            orderMode === 'delivery'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 bg-white'
          }`}
        >
          <RadioGroupItem value="delivery" id="delivery" className="sr-only" />
          <Truck className={`w-8 h-8 mb-2 ${orderMode === 'delivery' ? 'text-green-600' : 'text-gray-500'}`} />
          <span className="font-semibold">Delivery</span>
        </Label>
        <Label
          htmlFor="pickup"
          className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
            orderMode === 'pickup'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 bg-white'
          }`}
        >
          <RadioGroupItem value="pickup" id="pickup" className="sr-only" />
          <Store className={`w-8 h-8 mb-2 ${orderMode === 'pickup' ? 'text-green-600' : 'text-gray-500'}`} />
          <span className="font-semibold">Pickup</span>
        </Label>
      </RadioGroup>
    </div>
  );
};
