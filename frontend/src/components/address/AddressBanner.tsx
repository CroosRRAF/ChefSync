import React, { useState, useEffect } from 'react';
import { MapPin, ChevronDown, Truck } from 'lucide-react';
import { DeliveryAddress, addressService } from '@/services/addressService';
import SimpleAddressPicker from './SimpleAddressPicker';

interface AddressBannerProps {
  onAddressChange?: (address: DeliveryAddress | null) => void;
}

const AddressBanner: React.FC<AddressBannerProps> = ({ onAddressChange }) => {
  const [selectedAddress, setSelectedAddress] = useState<DeliveryAddress | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDefaultAddress();
  }, []);

  const loadDefaultAddress = async () => {
    setLoading(true);
    try {
      const defaultAddr = await addressService.getDefaultAddress();
      if (defaultAddr) {
        setSelectedAddress(defaultAddr);
        onAddressChange?.(defaultAddr);
      } else {
        // If no default, get first address
        const addresses = await addressService.getAddresses();
        if (addresses.length > 0) {
          setSelectedAddress(addresses[0]);
          onAddressChange?.(addresses[0]);
        }
      }
    } catch (error) {
      console.error('Error loading address:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSelect = (address: DeliveryAddress) => {
    setSelectedAddress(address);
    onAddressChange?.(address);
    setShowPicker(false);
  };

  return (
    <>
      <div
        onClick={() => setShowPicker(true)}
        className="bg-gradient-to-r from-orange-500 to-red-500 text-white cursor-pointer hover:from-orange-600 hover:to-red-600 transition-all shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="bg-white/20 p-2 rounded-lg flex-shrink-0">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span className="text-sm font-medium">Loading address...</span>
                  </div>
                ) : selectedAddress ? (
                  <div>
                    <p className="text-xs font-medium opacity-90">Deliver to</p>
                    <p className="font-bold text-sm sm:text-base truncate">
                      {selectedAddress.label} - {selectedAddress.city}
                    </p>
                    <p className="text-xs opacity-80 truncate hidden sm:block">
                      {selectedAddress.address_line1}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-medium opacity-90">Delivery Address</p>
                    <p className="font-bold text-sm sm:text-base">
                      Click to add your address
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
              {selectedAddress && (
                <div className="hidden sm:flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg">
                  <Truck className="h-4 w-4" />
                  <span className="text-xs font-medium">Free delivery</span>
                </div>
              )}
              <ChevronDown className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      <SimpleAddressPicker
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onSelectAddress={handleAddressSelect}
        selectedAddress={selectedAddress}
      />
    </>
  );
};

export default AddressBanner;

