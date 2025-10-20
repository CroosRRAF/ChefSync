import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useDatabaseCart } from '@/context/DatabaseCartContext';
import { useAuth } from '@/context/AuthContext';
import GoogleMapsAddressPicker from '@/components/checkout/GoogleMapsAddressPicker';
import ChefSyncCheckout from '@/components/checkout/ChefSyncCheckout';
import { 
  ArrowLeft,
  CreditCard,
  MapPin,
  Clock,
  Shield,
  CheckCircle,
  Truck,
  Phone,
  Mail,
  User,
  Home,
  LayoutDashboard,
  AlertCircle,
  Navigation,
  Edit2
} from 'lucide-react';
import { toast } from 'sonner';
import { CartItem } from '@/services/menuService';
import { orderService } from '@/services/orderService';
import { getFoodPlaceholder } from '@/utils/placeholderUtils';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const chefId = location.state?.chefId;
  const chefName = location.state?.chefName;
  
  const handleClose = () => {
    // Navigate back to menu or cart when user closes checkout
    navigate('/menu');
  };

  const handleOrderSuccess = () => {
    // After successful order, navigate to customer orders page
    navigate('/customer/orders');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      {/* Render ChefSyncCheckout as full-page modal */}
      <ChefSyncCheckout 
        isOpen={true} 
        onClose={handleClose} 
        onOrderSuccess={handleOrderSuccess}
        chefId={chefId}
        chefName={chefName}
      />
    </div>
  );
};

export default Checkout;