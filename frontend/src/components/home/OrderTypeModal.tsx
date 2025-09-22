import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User, Users, ArrowRight, CheckCircle } from 'lucide-react';

interface OrderTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (orderType: 'normal' | 'bulk') => void;
}

const orderTypes = [
  {
    type: 'normal' as const,
    title: 'Normal Order',
    description: 'Perfect for individuals and small families. Quick delivery with fresh, homemade quality.',
    icon: 'User'
  },
  {
    type: 'bulk' as const,
    title: 'Bulk Order',
    description: 'Ideal for events, offices, and large gatherings. Special pricing and advance booking available.',
    icon: 'Users'
  }
];

const OrderTypeModal: React.FC<OrderTypeModalProps> = ({ isOpen, onClose, onContinue }) => {
  const [selectedOrderType, setSelectedOrderType] = useState<'normal' | 'bulk' | null>(null);

  const handleOrderTypeSelect = (type: 'normal' | 'bulk') => {
    setSelectedOrderType(type);
  };

  const handleContinue = () => {
    if (selectedOrderType) {
      onContinue(selectedOrderType);
      onClose();
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'User':
        return <User className="h-8 w-8" />;
      case 'Users':
        return <Users className="h-8 w-8" />;
      default:
        return <User className="h-8 w-8" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            Choose Your Order Type
          </DialogTitle>
          <p className="text-gray-600 dark:text-gray-400 text-center">
            Select the option that best fits your needs
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {orderTypes.map((type) => (
            <Card
              key={type.type}
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                selectedOrderType === type.type
                  ? 'ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-900/20'
                  : 'hover:shadow-md'
              }`}
              onClick={() => handleOrderTypeSelect(type.type)}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-full ${
                    selectedOrderType === type.type
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}>
                    {getIcon(type.icon)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                        {type.title}
                      </h3>
                      {selectedOrderType === type.type && (
                        <CheckCircle className="h-5 w-5 text-orange-500" />
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {type.description}
                    </p>
                    
                    {/* Additional Benefits */}
                    <div className="mt-3 space-y-1">
                      {type.type === 'normal' ? (
                        <ul className="text-sm text-gray-500 dark:text-gray-400">
                          <li>• Quick delivery in 30-45 minutes</li>
                          <li>• Fresh, homemade quality</li>
                          <li>• Perfect portion sizes</li>
                        </ul>
                      ) : (
                        <ul className="text-sm text-gray-500 dark:text-gray-400">
                          <li>• Bulk pricing discounts available</li>
                          <li>• Advance booking options</li>
                          <li>• Custom menu planning</li>
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Go Back
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!selectedOrderType}
            className={`flex-1 ${
              selectedOrderType
                ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            Continue to Menu
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderTypeModal;
