import React, { useState, useEffect } from 'react';
import { X, Check, Clock, ChefHat, Truck, Package, Star } from 'lucide-react';

interface OrderProgressPopupProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  orderNumber: string;
  initialStatus: string;
}

interface OrderStatus {
  status: string;
  timestamp: string;
  notes?: string;
}

const ORDER_STAGES = [
  {
    key: 'pending',
    label: 'Order Placed',
    icon: Package,
    description: 'Your order has been placed successfully'
  },
  {
    key: 'confirmed',
    label: 'Cook Approval',
    icon: ChefHat,
    description: 'Chef is reviewing your order'
  },
  {
    key: 'preparing',
    label: 'Preparing',
    icon: ChefHat,
    description: 'Chef is preparing your food'
  },
  {
    key: 'ready',
    label: 'Out for Delivery',
    icon: Truck,
    description: 'Your order is on the way'
  },
  {
    key: 'delivered',
    label: 'Delivered',
    icon: Check,
    description: 'Order delivered successfully'
  }
];

const OrderProgressPopup: React.FC<OrderProgressPopupProps> = ({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  initialStatus
}) => {
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [statusHistory, setStatusHistory] = useState<OrderStatus[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // In a real implementation, you would fetch order status updates
      // For now, we'll simulate the status progression
      simulateStatusUpdates();
    }
  }, [isOpen, orderId]);

  const simulateStatusUpdates = () => {
    // Simulate status updates every few seconds
    const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];
    let currentIndex = statuses.indexOf(initialStatus);
    
    const interval = setInterval(() => {
      if (currentIndex < statuses.length - 1) {
        currentIndex++;
        setCurrentStatus(statuses[currentIndex]);
        
        // Add to status history
        setStatusHistory(prev => [...prev, {
          status: statuses[currentIndex],
          timestamp: new Date().toISOString(),
          notes: getStatusNotes(statuses[currentIndex])
        }]);
      } else {
        clearInterval(interval);
      }
    }, 5000); // Update every 5 seconds

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  };

  const getStatusNotes = (status: string): string => {
    const notes: Record<string, string> = {
      'pending': 'Order received and waiting for chef approval',
      'confirmed': 'Chef has accepted your order and will start preparing',
      'preparing': 'Your food is being prepared with care',
      'ready': 'Order is ready and will be picked up for delivery',
      'delivered': 'Order has been delivered successfully'
    };
    return notes[status] || '';
  };

  const getCurrentStageIndex = (): number => {
    return ORDER_STAGES.findIndex(stage => stage.key === currentStatus);
  };

  const isStageCompleted = (stageIndex: number): boolean => {
    const currentIndex = getCurrentStageIndex();
    return stageIndex < currentIndex;
  };

  const isStageActive = (stageIndex: number): boolean => {
    const currentIndex = getCurrentStageIndex();
    return stageIndex === currentIndex;
  };

  const getStageIcon = (stage: typeof ORDER_STAGES[0], stageIndex: number) => {
    const IconComponent = stage.icon;
    const isCompleted = isStageCompleted(stageIndex);
    const isActive = isStageActive(stageIndex);

    if (isCompleted) {
      return <Check className="w-5 h-5 text-green-500" />;
    } else if (isActive) {
      return <IconComponent className="w-5 h-5 text-primary animate-pulse" />;
    } else {
      return <IconComponent className="w-5 h-5 text-gray-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Progress Popup */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Order Progress</h2>
            <p className="text-sm text-gray-500">Order #{orderNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Timeline */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {ORDER_STAGES.map((stage, index) => (
              <div key={stage.key} className="flex items-start gap-4">
                {/* Stage Icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  {getStageIcon(stage, index)}
                </div>

                {/* Stage Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-medium ${
                      isStageCompleted(index) ? 'text-green-700' :
                      isStageActive(index) ? 'text-primary' : 'text-gray-500'
                    }`}>
                      {stage.label}
                    </h3>
                    {isStageCompleted(index) && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Completed
                      </span>
                    )}
                    {isStageActive(index) && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full animate-pulse">
                        In Progress
                      </span>
                    )}
                  </div>
                  
                  <p className={`text-sm mt-1 ${
                    isStageCompleted(index) ? 'text-green-600' :
                    isStageActive(index) ? 'text-primary' : 'text-gray-500'
                  }`}>
                    {stage.description}
                  </p>

                  {/* Status History for this stage */}
                  {statusHistory
                    .filter(status => status.status === stage.key)
                    .map((status, statusIndex) => (
                      <div key={statusIndex} className="mt-2 p-2 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600">
                          {new Date(status.timestamp).toLocaleTimeString()}
                        </p>
                        {status.notes && (
                          <p className="text-xs text-gray-500 mt-1">{status.notes}</p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Estimated Time */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-700">Estimated Delivery Time</span>
            </div>
            <p className="text-sm text-blue-600">
              Your order should arrive within 30-45 minutes
            </p>
          </div>

          {/* Contact Information */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Need Help?</h4>
            <p className="text-xs text-gray-600">
              If you have any questions about your order, please contact our support team.
            </p>
            <button className="mt-2 text-xs text-primary hover:underline">
              Contact Support
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <button
            onClick={onClose}
            className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
          >
            Track Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderProgressPopup;
