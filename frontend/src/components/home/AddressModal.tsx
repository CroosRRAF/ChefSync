import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Navigation } from 'lucide-react';

interface DeliveryAddress {
  street: string;
  area: string;
  city: string;
  pincode: string;
  landmark?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (address: DeliveryAddress) => void;
}

const AddressModal: React.FC<AddressModalProps> = ({ isOpen, onClose, onContinue }) => {
  const [formData, setFormData] = useState<DeliveryAddress>({
    street: '',
    area: '',
    city: 'Chennai',
    pincode: '',
    landmark: ''
  });

  const [errors, setErrors] = useState<Partial<DeliveryAddress>>({});

  const handleInputChange = (field: keyof DeliveryAddress, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<DeliveryAddress> = {};
    
    if (!formData.street.trim()) newErrors.street = 'Street address is required';
    if (!formData.area.trim()) newErrors.area = 'Area is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required';
    else if (!/^\d{6}$/.test(formData.pincode)) newErrors.pincode = 'Invalid pincode format';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onContinue(formData);
      onClose();
    }
  };

  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            coordinates: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            },
            street: '42 Anna Salai',
            area: 'T. Nagar',
            city: 'Chennai',
            pincode: '600017'
          }));
        },
        (error) => {
          console.error('Location access denied:', error);
        }
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl font-bold">
            <MapPin className="h-6 w-6 text-orange-500" />
            <span>Delivery Address</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Location Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleUseCurrentLocation}
            className="w-full border-dashed border-2 border-orange-300 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 py-3"
          >
            <Navigation className="mr-2 h-4 w-4 text-orange-500" />
            Use Current Location
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">Or enter manually</span>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="street">Street Address *</Label>
              <Input
                id="street"
                placeholder="Enter your street address"
                value={formData.street}
                onChange={(e) => handleInputChange('street', e.target.value)}
                className={errors.street ? 'border-red-500' : ''}
              />
              {errors.street && <span className="text-red-500 text-sm">{errors.street}</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="area">Area *</Label>
                <Input
                  id="area"
                  placeholder="Area/Locality"
                  value={formData.area}
                  onChange={(e) => handleInputChange('area', e.target.value)}
                  className={errors.area ? 'border-red-500' : ''}
                />
                {errors.area && <span className="text-red-500 text-sm">{errors.area}</span>}
              </div>

              <div>
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  placeholder="600001"
                  value={formData.pincode}
                  onChange={(e) => handleInputChange('pincode', e.target.value)}
                  className={errors.pincode ? 'border-red-500' : ''}
                />
                {errors.pincode && <span className="text-red-500 text-sm">{errors.pincode}</span>}
              </div>
            </div>

            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                placeholder="Chennai"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className={errors.city ? 'border-red-500' : ''}
              />
              {errors.city && <span className="text-red-500 text-sm">{errors.city}</span>}
            </div>

            <div>
              <Label htmlFor="landmark">Landmark (Optional)</Label>
              <Input
                id="landmark"
                placeholder="Near landmark (optional)"
                value={formData.landmark || ''}
                onChange={(e) => handleInputChange('landmark', e.target.value)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              Continue
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddressModal;
