import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ChefHat, ArrowRight } from 'lucide-react';

interface SwitchCookWarningProps {
  isOpen: boolean;
  currentCookName: string;
  newCookName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const SwitchCookWarning: React.FC<SwitchCookWarningProps> = ({
  isOpen,
  currentCookName,
  newCookName,
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            Switch Cook?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning Message */}
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-gray-700 mb-3">
              You currently have items from <strong>{currentCookName}</strong> in your cart.
            </p>
            <p className="text-sm text-gray-700">
              Adding items from <strong>{newCookName}</strong> will replace your current cart.
            </p>
          </div>

          {/* Cook Transition Visual */}
          <div className="flex items-center justify-center gap-4 py-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-2">
                <ChefHat className="h-6 w-6 text-orange-600" />
              </div>
              <p className="text-xs font-medium text-gray-600">{currentCookName}</p>
            </div>
            
            <ArrowRight className="h-5 w-5 text-gray-400" />
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <ChefHat className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-xs font-medium text-gray-600">{newCookName}</p>
            </div>
          </div>

          {/* Policy Notice */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Single Cook Policy:</strong> You can only order from one cook at a time to ensure 
              optimal food quality and delivery coordination.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Keep Current Cart
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              Switch to {newCookName}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SwitchCookWarning;
